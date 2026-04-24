import { useState } from 'react'

const PASSWORD = '23080913'  // ← cambia esto por tu clave

const KEY = 'ifs-auth'

export function useAuth() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(KEY) === PASSWORD)
  const login = (pw) => {
    if (pw === PASSWORD) {
      localStorage.setItem(KEY, pw)
      setAuthed(true)
      return true
    }
    return false
  }
  return { authed, login }
}

export default function PasswordGate({ onAuth }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = () => {
    const ok = onAuth(value)
    if (!ok) {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') submit()
    setError(false)
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
          onChange={(e) => { setValue(e.target.value); setError(false) }}
          onKeyDown={onKey}
          placeholder="••••••••"
          autoFocus
        />
        {error && <div className="gate-error">Clave incorrecta</div>}
        <button className="gate-btn" onClick={submit}>Entrar</button>
      </div>
    </div>
  )
}
