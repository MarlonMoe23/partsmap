// Función de servidor de Vercel: guarda en secreto la clave y la URL de
// Google Sheets, y solo responde si el visitante manda la contraseña correcta.
// Variables de entorno necesarias en Vercel:
//   APP_PASSWORD  → la clave que escribes al abrir la app
//   SCRIPT_URL    → la URL del Apps Script (termina en /exec)
//   SCRIPT_KEY    → la clave SECRET del Apps Script

import { timingSafeEqual } from 'node:crypto'

function sameText(a, b) {
  // Ignora espacios o saltos de línea invisibles al inicio o final
  const x = Buffer.from(String(a ?? '').trim())
  const y = Buffer.from(String(b ?? '').trim())
  return x.length === y.length && timingSafeEqual(x, y)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'método no permitido' })
  }

  const { APP_PASSWORD, SCRIPT_URL, SCRIPT_KEY } = process.env
  if (!APP_PASSWORD || !SCRIPT_URL || !SCRIPT_KEY) {
    return res.status(500).json({ error: 'Faltan variables de entorno en Vercel (APP_PASSWORD, SCRIPT_URL, SCRIPT_KEY)' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const { password, action, ...rest } = body

  if (!sameText(password, APP_PASSWORD)) {
    await wait(1000) // frena a quien intente adivinar la clave
    return res.status(401).json({ error: 'clave de acceso incorrecta' })
  }

  try {
    // Solo verificar la clave (pantalla de entrada)
    if (action === 'ping') return res.status(200).json({ ok: true })

    let upstream
    if (action === 'load') {
      upstream = await fetch(SCRIPT_URL + '?key=' + encodeURIComponent(SCRIPT_KEY) + '&t=' + Date.now())
    } else {
      upstream = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ key: SCRIPT_KEY, action, ...rest }),
      })
    }

    const text = await upstream.text()
    let data
    try { data = JSON.parse(text) } catch {
      return res.status(502).json({ error: 'Google Sheets no devolvió datos válidos' })
    }
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'No se pudo hablar con Google Sheets' })
  }
}