import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { callAI } from '../sheets'
import { useStore } from '../store/useStore'

const LABELS = {
  label: 'Nombre',
  age: 'Edad',
  estado: 'Estado actual',
  emotion: 'Emoción principal',
  origen: '¿Cuándo apareció?',
  activadores: 'Situaciones que la activan',
  role: 'Intención positiva',
  protege: '¿A quién protege?',
  polarizada: '¿Polarizada con quién?',
  estrategias: 'Estrategias que usa',
  teme: '¿Qué teme?',
  quiere: '¿Qué espera / quiere?',
  necesita: '¿Qué necesita?',
  message: 'Mensaje que lleva',
  notes: 'Notas / observaciones',
}

const box = {
  background: 'var(--surface2)',
  border: '1px solid var(--border2)',
  borderRadius: 9,
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const smallBtn = {
  padding: '8px 10px',
  background: 'var(--surface3)',
  border: '1px solid var(--border3)',
  borderRadius: 8,
  color: 'var(--text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
}

export default function AIAssistant({ nodeId, data }) {
  const updateNodeData = useStore((s) => s.updateNodeData)

  const [mode, setMode] = useState(null) // null | 'organize' | 'questions'
  const [notesText, setNotesText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState(null) // { campo: texto }
  const [checked, setChecked] = useState({})
  const [questions, setQuestions] = useState([])
  const [added, setAdded] = useState({})
  const [applied, setApplied] = useState(false)

  const reset = (m) => {
    setMode(m === mode ? null : m)
    setError('')
    setProposal(null)
    setQuestions([])
    setAdded({})
    setApplied(false)
  }

  const current = (k) => String(data[k] ?? '').trim()

  const organize = async () => {
    setLoading(true)
    setError('')
    setProposal(null)
    setApplied(false)
    try {
      const { fields } = await callAI({ action: 'organize', part: data, notes: notesText })
      // Solo mostramos lo que aporta algo nuevo
      const useful = {}
      Object.entries(fields || {}).forEach(([k, v]) => {
        if (v && v !== current(k)) useful[k] = v
      })
      if (Object.keys(useful).length === 0) {
        setError('No encontré nada nuevo para agregar a la ficha con esas notas.')
      } else {
        setProposal(useful)
        // Marcados por defecto solo los campos que hoy están vacíos
        const c = {}
        Object.keys(useful).forEach((k) => { c[k] = !current(k) })
        setChecked(c)
      }
    } catch (err) {
      setError(err.message || 'No se pudo usar la IA.')
    }
    setLoading(false)
  }

  const apply = () => {
    const changes = {}
    Object.entries(proposal).forEach(([k, v]) => {
      if (!checked[k]) return
      // En notas se agrega al final; en el resto se reemplaza
      changes[k] = k === 'notes' && current(k) ? `${data[k]}\n\n${v}` : v
    })
    if (Object.keys(changes).length === 0) return
    updateNodeData(nodeId, changes)
    setApplied(true)
    setProposal(null)
    setNotesText('')
  }

  const suggestQuestions = async () => {
    setLoading(true)
    setError('')
    setQuestions([])
    setAdded({})
    try {
      const res = await callAI({ action: 'questions', part: data })
      if (!res.questions?.length) setError('No pude generar preguntas. Intenta de nuevo.')
      else setQuestions(res.questions)
    } catch (err) {
      setError(err.message || 'No se pudo usar la IA.')
    }
    setLoading(false)
  }

  const addQuestionToNotes = (i, texto) => {
    const prev = String(data.notes ?? '')
    updateNodeData(nodeId, { notes: (prev ? prev + '\n' : '') + '• ' + texto })
    setAdded((a) => ({ ...a, [i]: true }))
  }

  const openQuestions = () => {
    const opening = mode !== 'questions'
    reset('questions')
    if (opening) suggestQuestions()
  }

  return (
    <>
      <div className="panel-section-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Sparkles size={10} /> Asistente IA
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={{ ...smallBtn, flex: 1, ...(mode === 'organize' ? { borderColor: 'var(--accent)' } : {}) }}
          onClick={() => reset('organize')}
        >
          Ordenar mis notas
        </button>
        <button
          style={{ ...smallBtn, flex: 1, ...(mode === 'questions' ? { borderColor: 'var(--accent)' } : {}) }}
          onClick={openQuestions}
          disabled={loading}
        >
          Sugerir preguntas
        </button>
      </div>

      {mode === 'organize' && (
        <div style={box}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Escribe o pega lo que descubriste de esta parte, tal como te salga. La IA lo propone ordenado
            en los campos y tú eliges qué aplicar.
          </div>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            rows={6}
            placeholder="Ej: Hoy sentí a una parte que aparece cuando me critican en el trabajo. Tiene como 8 años, siente vergüenza y tiene miedo de que me rechacen..."
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              borderRadius: 7,
              color: 'var(--text)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              padding: '8px 11px',
              outline: 'none',
              resize: 'vertical',
              width: '100%',
            }}
          />
          <button
            style={{ ...smallBtn, opacity: loading || notesText.trim().length < 10 ? 0.5 : 1 }}
            onClick={organize}
            disabled={loading || notesText.trim().length < 10}
          >
            {loading ? 'Ordenando…' : 'Ordenar en los campos'}
          </button>
        </div>
      )}

      {mode === 'organize' && proposal && (
        <div style={box}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Propuesta. Marca lo que quieras aplicar (los campos que ya tienen texto vienen sin marcar):
          </div>
          {Object.entries(proposal).map(([k, v]) => (
            <label
              key={k}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={!!checked[k]}
                onChange={(e) => setChecked((c) => ({ ...c, [k]: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {LABELS[k] || k}
                </span>
                <br />
                {v}
                {current(k) && (
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {k === 'notes' ? 'Se agregará al final de lo que ya tienes.' : `Ahora dice: ${current(k)}`}
                  </span>
                )}
              </span>
            </label>
          ))}
          <button style={smallBtn} onClick={apply}>Aplicar lo marcado</button>
        </div>
      )}

      {applied && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Listo, aplicado a la ficha. Revísalo y ajusta lo que quieras.
        </div>
      )}

      {mode === 'questions' && loading && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pensando preguntas…</div>
      )}

      {mode === 'questions' && questions.length > 0 && (
        <div style={box}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Hazlas desde el Self, con curiosidad y sin apuro. Si una no resuena, sáltala.
          </div>
          {questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div>{i + 1}. {q.texto}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {q.campo && LABELS[q.campo] && (
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Ayuda a llenar: {LABELS[q.campo]}</span>
                )}
                <button
                  style={{ ...smallBtn, padding: '3px 8px', fontSize: 11, marginLeft: 'auto' }}
                  onClick={() => addQuestionToNotes(i, q.texto)}
                  disabled={added[i]}
                >
                  {added[i] ? 'Añadida ✓' : 'Añadir a notas'}
                </button>
              </div>
            </div>
          ))}
          <button style={smallBtn} onClick={suggestQuestions} disabled={loading}>Otras preguntas</button>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: '#cc3333' }}>{error}</div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
        La IA ayuda a explorar con hipótesis y preguntas; no reemplaza tu práctica ni a un terapeuta.
        Solo se envía lo de esta parte, cuando pulsas un botón.
      </div>
    </>
  )
}
