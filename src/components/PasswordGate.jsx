import { useState, useEffect } from 'react'
import { checkPassword, setPassword, clearPassword } from '../sheets'

// Si sales de la app más de este tiempo, vuelve a pedir la clave
const LOCK_AFTER_MS = 60 * 1000

// La clave NO está en este archivo ni se guarda en el dispositivo:
// la verifica el servidor de Vercel (variable APP_PASSWORD) y solo se
// mantiene en la memoria mientras la app está abierta.
export function useAuth() {
  const [authed, setAuthed] = useState(false)

  // Bloqueo automático al volver a la app después de un rato
  useEffect(() => {
    let hiddenAt = null
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS) {
        hiddenAt = null
        clearPassword()
        setAuthed(false)
      } else {
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  // Devuelve 'ok', 'wrong' o 'error'
  const login = async (pw) => {
    const result = await checkPassword(pw)
    if (result === 'ok') {
      setPassword(pw)
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
          autoComplete="off"
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
