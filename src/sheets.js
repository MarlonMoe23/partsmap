// Conexión con Google Sheets a través del Apps Script publicado como web app.
// Reemplaza a supabase.js

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwp8YDiKC5-UL4Rfay-gveZRb6PpiCZJtY2GeqUHF4AjVSpqus--rZj4yzzPeFd3NBG/exec'

// Pega aquí la MISMA clave que pusiste en la primera línea del Apps Script
const SCRIPT_KEY = 'ifs-mapa-2026-xyz'

const SAVE_DELAY = 800 // ms que espera después de dejar de escribir antes de guardar

// ── Estado de sincronización (para el aviso "Guardando…") ──────────────
let listener = () => {}
let queued = 0
let hasError = false
const pendingRows = new Map() // id -> fila esperando guardarse
const timers = new Map() // id -> temporizador

export function setSyncListener(fn) {
  listener = fn
}

function refreshStatus() {
  if (hasError) return listener('error')
  listener(queued > 0 || pendingRows.size > 0 ? 'saving' : 'idle')
}

// ── Llamadas al script ─────────────────────────────────────────────────
async function parse(res) {
  if (!res.ok) throw new Error('Respuesta ' + res.status + ' del script')
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('El script no devolvió datos válidos. Revisa que esté publicado para "Cualquier persona".')
  }
  if (data.error) throw new Error(data.error === 'no autorizado' ? 'Clave incorrecta: revisa SCRIPT_KEY en src/sheets.js' : data.error)
  return data
}

function checkKey() {
  if (SCRIPT_KEY === 'PEGA_AQUI_TU_CLAVE') {
    throw new Error('Falta pegar tu clave en src/sheets.js (SCRIPT_KEY)')
  }
}

async function post(body, keepalive = false) {
  checkKey()
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    // text/plain evita la verificación previa de CORS que Apps Script no soporta
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ key: SCRIPT_KEY, ...body }),
    keepalive,
  })
  return parse(res)
}

async function postWithRetry(body) {
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await post(body)
    } catch (err) {
      lastErr = err
      // Si la clave está mal no tiene sentido reintentar
      if (String(err.message).startsWith('Clave') || String(err.message).startsWith('Falta')) break
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  throw lastErr
}

// Cola: las escrituras salen una por una y en orden
let chain = Promise.resolve()

function enqueue(body) {
  queued++
  refreshStatus()
  chain = chain
    .then(() => postWithRetry(body))
    .catch((err) => {
      hasError = true
      console.error('Error al guardar en Google Sheets:', err)
    })
    .finally(() => {
      queued--
      refreshStatus()
    })
  return chain
}

// ── Lectura ────────────────────────────────────────────────────────────
export async function loadAll() {
  checkKey()
  const url = SCRIPT_URL + '?key=' + encodeURIComponent(SCRIPT_KEY) + '&t=' + Date.now()
  const data = await parse(await fetch(url))
  return { parts: data.parts ?? [], edges: data.edges ?? [] }
}

// ── Escritura de partes ────────────────────────────────────────────────

// Guarda de inmediato (crear una parte)
export function savePart(row) {
  return enqueue({ action: 'upsertPart', row })
}

// Guarda esperando a que termines de escribir (editar texto)
export function savePartDebounced(row) {
  pendingRows.set(row.id, row)
  clearTimeout(timers.get(row.id))
  timers.set(
    row.id,
    setTimeout(() => flushPart(row.id), SAVE_DELAY)
  )
  refreshStatus()
}

function flushPart(id, keepalive = false) {
  const row = pendingRows.get(id)
  clearTimeout(timers.get(id))
  timers.delete(id)
  pendingRows.delete(id)
  if (!row) return
  if (keepalive) {
    // Al cerrar la pestaña: envío directo, sin esperar la cola
    post({ action: 'upsertPart', row }, true).catch(() => {})
    refreshStatus()
  } else {
    enqueue({ action: 'upsertPart', row })
  }
}

export function savePosition(id, x, y) {
  return enqueue({ action: 'updatePosition', id, x, y })
}

export function deletePart(id) {
  // Si había un guardado pendiente de esta parte, se cancela
  clearTimeout(timers.get(id))
  timers.delete(id)
  pendingRows.delete(id)
  return enqueue({ action: 'deletePart', id })
}

// ── Escritura de conexiones ────────────────────────────────────────────
export function saveEdge(row) {
  return enqueue({ action: 'insertEdge', row })
}

export function deleteEdgeRemote(id) {
  return enqueue({ action: 'deleteEdge', id })
}

// ── Al cerrar o salir de la página, guarda lo pendiente ────────────────
function flushAll() {
  Array.from(pendingRows.keys()).forEach((id) => flushPart(id, true))
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushAll)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll()
  })
}