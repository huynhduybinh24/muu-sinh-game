import { useState, type FormEvent } from 'react'
import { ScreenShell } from '../components/ScreenShell'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { defaultAppearance } from '../data/avatar'
import { getPlayerNameError, normalizePlayerName } from '../services/playerProfile'

interface WelcomePageProps { onContinue: (name: string) => void }

export function WelcomePage({ onContinue }: WelcomePageProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = getPlayerNameError(name)
    setError(message)
    if (!message) onContinue(normalizePlayerName(name))
  }
  return (
    <ScreenShell header={<span>Chào bạn mới!</span>} contentClassName="welcome-content">
      <p className="eyebrow">Mỗi ngày một nghề · Mỗi ngày một niềm vui</p>
      <h1 className="welcome-brand">MƯU SINH</h1>
      <div className="avatar-stage welcome-avatar"><PlayerAvatar appearance={defaultAppearance} size={190} /></div>
      <form className="name-form" onSubmit={submit}>
        <h2><label htmlFor="player-name">Bạn tên gì?</label></h2>
        <p>Cùng tạo một nhân vật mang dấu ấn của bạn.</p>
        <input id="player-name" value={name} onChange={(event) => { setName(event.target.value); setError(null) }}
          placeholder="Tên của bạn" autoComplete="nickname" enterKeyHint="next"
          aria-invalid={Boolean(error)} aria-describedby={error ? 'name-error' : 'name-hint'} />
        <small id="name-hint">2–20 ký tự · Tên tiếng Việt được chào đón</small>
        {error ? <p className="form-error" id="name-error" role="alert">{error}</p> : null}
        <button className="primary-button" type="submit">TIẾP TỤC →</button>
      </form>
      <p className="privacy-note">Hồ sơ chỉ lưu trên thiết bị này. Không cần tài khoản.</p>
    </ScreenShell>
  )
}
