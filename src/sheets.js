// Conexión con Google Sheets a través de la función de servidor /api/sheets
// (la clave y la URL del Apps Script viven en variables de entorno de Vercel,
// no en este código).

const API_URL = '/api/sheets'

// La clave de acceso vive SOLO en la memoria de la pestaña: al cerrar o
// recargar la app, hay que escribirla otra vez.
let sessionPassword = ''

export function setPassword(pw) {
  sessionPassword = pw
}

export function clearPassword() {
  sessionPassword = ''
}

function getPassword() {
  return sessionPassword
}

// Borra la clave que versiones anteriores dejaban guardada en el dispositivo
try { localStorage.removeItem('ifs-auth') } catch {}

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
  if (res.status === 401) {
    // La clave ya no sirve: volver a la pantalla de entrada
    clearPassword()
    if (typeof window !== 'undefined') window.location.reload()
    throw new Error('Clave de acceso incorrecta')
  }
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('No se pudo conectar con el servidor (Respuesta ' + res.status + ')')
  }
  if (!res.ok || data.error) throw new Error(data.error || 'Respuesta ' + res.status)
  return data
}

async function post(body, keepalive = false, url = API_URL) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: getPassword(), ...body }),
    keepalive,
  })
  return parse(res)
}

// Asistente de IA (función de servidor /api/ai)
export function callAI(body) {
  return post(body, false, '/api/ai')
}

// Verifica la clave de acceso (pantalla de entrada)
export async function checkPassword(pw) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'ping' }),
    })
    if (res.status === 401) return 'wrong'
    if (!res.ok) return 'error'
    return 'ok'
  } catch {
    return 'error'
  }
}

async function postWithRetry(body) {
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await post(body)
    } catch (err) {
      lastErr = err
      // Si la clave está mal no tiene sentido reintentar
      if (String(err.message).startsWith('Clave') || String(err.message).startsWith('Faltan')) break
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
  const data = await post({ action: 'load' })
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
