// Función de servidor de Vercel para el asistente de IA.
// Variables de entorno necesarias en Vercel:
//   APP_PASSWORD       → la clave de entrada de la app (la misma de siempre)
//   ANTHROPIC_API_KEY  → tu clave de API de Anthropic (empieza con sk-ant-)
// Opcional:
//   ANTHROPIC_MODEL    → modelo a usar (por defecto claude-sonnet-5-5)

import { timingSafeEqual } from 'node:crypto'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function clean(v) {
  return String(v ?? '').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim()
}

function sameText(a, b) {
  const x = Buffer.from(clean(a))
  const y = Buffer.from(clean(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

const ESTADOS = ['Activa', 'En paz', 'En proceso', 'Desconocido']

// Campos que la IA puede completar (y su significado)
const CAMPOS = {
  label: 'nombre de la parte (solo si las notas la nombran claramente)',
  age: 'edad que tiene o que siente tener la parte',
  estado: 'estado actual: uno de Activa, En paz, En proceso, Desconocido',
  emotion: 'emoción principal',
  origen: 'cuándo o cómo apareció',
  activadores: 'situaciones que la activan',
  role: 'intención positiva / rol que cumple',
  protege: 'a quién protege',
  polarizada: 'con qué otra parte está polarizada',
  estrategias: 'estrategias que usa',
  teme: 'qué teme',
  quiere: 'qué espera o quiere',
  necesita: 'qué necesita',
  message: 'mensaje que lleva',
  notes: 'otras observaciones que no encajan en ningún campo anterior',
}

const BASE = `Eres un acompañante con buen conocimiento del modelo de Sistemas de Familia Interna (IFS).
Escribes en español, tuteando, con calidez y sin tecnicismos innecesarios.
Reglas:
- Usa lenguaje de partes ("una parte de ti", "esta parte"). Nunca etiquetes a la persona.
- No diagnostiques ni afirmes como verdad: ofrece hipótesis y preguntas.
- No inventes datos: usa solo lo que la persona escribió.
- Respeta la voz y las palabras de la persona.`

function line(k, v) {
  const t = String(v ?? '').trim().slice(0, 1500)
  return t ? `- ${k}: ${t}` : null
}

function partToText(part) {
  const p = part || {}
  const rows = [
    line('Tipo', p.partType),
    line('Nombre', p.label),
    line('Edad', p.age),
    line('Estado', p.estado),
    line('Emoción principal', p.emotion),
    line('Cuándo apareció', p.origen),
    line('Situaciones que la activan', p.activadores),
    line('Intención positiva / rol', p.role),
    line('A quién protege', p.protege),
    line('Polarizada con', p.polarizada),
    line('Estrategias', p.estrategias),
    line('Qué teme', p.teme),
    line('Qué quiere', p.quiere),
    line('Qué necesita', p.necesita),
    line('Mensaje que lleva', p.message),
    line('Notas', p.notes),
  ].filter(Boolean)
  return rows.length ? rows.join('\n') : '(todavía no hay datos escritos)'
}

function promptOrganize(part, notes) {
  const keys = Object.entries(CAMPOS).map(([k, d]) => `  "${k}": ${d}`).join('\n')
  return {
    system: `${BASE}
Tu tarea: ordenar las notas libres de la persona en los campos de la ficha de una parte.
- Rellena un campo solo si las notas lo dicen o lo implican con claridad. Si no, déjalo como "".
- Conserva las palabras de la persona; resume solo lo necesario. No agregues interpretaciones tuyas.
- No repitas lo que ya está en la ficha actual salvo que las notas lo amplíen.
Responde SOLO con un objeto JSON válido, sin texto antes ni después, con estas claves (todas de tipo texto):
{
${keys}
}`,
    user: `Ficha actual de la parte:\n${partToText(part)}\n\nNotas libres de la persona:\n"""\n${notes}\n"""`,
    max_tokens: 1500,
  }
}

function promptQuestions(part) {
  return {
    system: `${BASE}
Tu tarea: proponer 5 preguntas para que la persona explore esta parte desde el Self (con curiosidad, sin juzgar).
- Prioriza los aspectos que aún están vacíos en la ficha, y ve de lo más superficial a lo más profundo
  (qué hace, cuándo aparece, cómo se siente en el cuerpo, qué teme, qué necesita).
- Redáctalas para que la persona se las haga a la parte ("Pregúntale a esta parte...", "Nota cómo...").
- Abiertas y no sugerentes: no pongas la respuesta dentro de la pregunta.
- Una sola idea por pregunta, cortas.
- Si la parte es un Exile, incluye una pregunta sobre ir despacio y pedir permiso a las partes protectoras.
- Si es un Firefighter o un Manager, incluye una pregunta sobre lo que teme que pasaría si dejara de hacer su trabajo.
Responde SOLO con un objeto JSON válido, sin texto antes ni después:
{"preguntas":[{"texto":"...","campo":"clave del campo que ayuda a llenar, o vacío"}]}
Los valores posibles de "campo" son: ${Object.keys(CAMPOS).join(', ')}.`,
    user: `Ficha actual de la parte:\n${partToText(part)}`,
    max_tokens: 1000,
  }
}

function extractJson(text) {
  const a = text.indexOf('{')
  const b = text.lastIndexOf('}')
  if (a === -1 || b === -1 || b < a) return null
  try { return JSON.parse(text.slice(a, b + 1)) } catch { return null }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'método no permitido' })
  }

  const { APP_PASSWORD, ANTHROPIC_API_KEY } = process.env
  const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
  if (!APP_PASSWORD) {
    return res.status(500).json({ error: 'Falta la variable APP_PASSWORD en Vercel' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  if (!sameText(body.password, APP_PASSWORD)) {
    await wait(1000)
    return res.status(401).json({ error: 'clave de acceso incorrecta' })
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Falta la variable ANTHROPIC_API_KEY en Vercel' })
  }

  const { action, part } = body
  let prompt
  if (action === 'organize') {
    const notes = String(body.notes ?? '').trim().slice(0, 8000)
    if (notes.length < 10) {
      return res.status(400).json({ error: 'Escribe un poco más de contenido en las notas.' })
    }
    prompt = promptOrganize(part, notes)
  } else if (action === 'questions') {
    prompt = promptQuestions(part)
  } else {
    return res.status(400).json({ error: 'acción no válida' })
  }

  let upstream
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: prompt.max_tokens,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      }),
    })
  } catch {
    return res.status(502).json({ error: 'No se pudo conectar con la IA. Intenta de nuevo.' })
  }

  if (!upstream.ok) {
    const map = {
      401: 'La clave ANTHROPIC_API_KEY de Vercel es incorrecta.',
      403: 'La clave ANTHROPIC_API_KEY no tiene permiso para usar este modelo.',
      404: 'El modelo de IA no existe. Revisa la variable ANTHROPIC_MODEL.',
      429: 'Demasiadas consultas seguidas. Espera un momento.',
      529: 'La IA está saturada. Intenta en un minuto.',
    }
    let detail = ''
    if (upstream.status === 400) {
      try { detail = (await upstream.json())?.error?.message || '' } catch {}
    }
    return res.status(502).json({
      error: map[upstream.status] || `Error de la IA (${upstream.status}). ${detail}`.trim(),
    })
  }

  let data
  try { data = await upstream.json() } catch {
    return res.status(502).json({ error: 'Respuesta de la IA ilegible. Intenta de nuevo.' })
  }
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')
  const json = extractJson(text)
  if (!json) {
    return res.status(502).json({ error: 'La IA respondió en un formato que no pude leer. Intenta de nuevo.' })
  }

  if (action === 'organize') {
    const fields = {}
    for (const k of Object.keys(CAMPOS)) {
      let v = typeof json[k] === 'string' ? json[k].trim() : ''
      if (k === 'estado' && !ESTADOS.includes(v)) v = ''
      if (v) fields[k] = v
    }
    return res.status(200).json({ fields })
  }

  const questions = (Array.isArray(json.preguntas) ? json.preguntas : [])
    .map((q) => ({
      texto: String(q?.texto ?? '').trim(),
      campo: Object.keys(CAMPOS).includes(q?.campo) ? q.campo : '',
    }))
    .filter((q) => q.texto)
    .slice(0, 6)
  return res.status(200).json({ questions })
}
