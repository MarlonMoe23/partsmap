import { useState } from 'react'
import { checkPassword } from '../sheets'

const KEY = 'ifs-auth'

// La clave ya NO está en este archivo: la verifica el servidor de Vercel
// (variable de entorno APP_PASSWORD).
export function useAuth() {
  const [authed, setAuthed] = useState(() => {
    try { return !!localStorage.getItem(KEY) } catch { return false }
  })

  // Devuelve 'ok', 'wrong' o 'error'
  const login = async (pw) => {
    const result = await checkPassword(pw)
    if (result === 'ok') {
      try { localStorage.setItem(KEY, pw) } catch {}
      setAuthed(true)
    }
    return result
  }
  return { authed, login }
}

export default function PasswordGate({ onAuth }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy || !value) return
    setBusy(true)
    const result = await onAuth(value)
    setBusy(false)
    if (result !== 'ok') {
      setError(result === 'wrong' ? 'Clave incorrecta' : 'No se pudo conectar. Intenta de nuevo.')
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="gate-overlay">
      <div className={`gate-box ${shake ? 'shake' : ''}`}>
        <div className="gate-title">Mi Mapa IFS</div>
        <div className="gate-subtitle">Ingresa tu clave para continuar</div>
        <input
          type="password"
          className={`gate-input ${error ? 'gate-input-error' : ''}`}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError('') }}
          onKeyDown={onKey}
          placeholder="••••••••"
          autoFocus
        />
        {error && <div className="gate-error">{error}</div>}
        <button className="gate-btn" onClick={submit} disabled={busy}>
          {busy ? 'Verificando…' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
