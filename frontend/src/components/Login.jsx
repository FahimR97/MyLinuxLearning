import { useState, useEffect, useRef } from 'react'

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 3 + 1}px`,
  delay: `${Math.random() * 8}s`,
  duration: `${Math.random() * 8 + 8}s`,
  color: ['var(--lavender)', 'var(--rose)', 'var(--sky)', 'var(--mint)'][Math.floor(Math.random() * 4)],
}))

const VALID_USER = 'fahim'
const VALID_PASS = 'Shellychimp2026!'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setShowCard(true)
      setTimeout(() => userRef.current?.focus(), 400)
    }, 100)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (loading) return

    if (username === VALID_USER && password === VALID_PASS) {
      setLoading(true)
      setError('')
      setTimeout(() => {
        localStorage.setItem('fll-session', 'active')
        onLogin()
      }, 600)
    } else {
      setError(username !== VALID_USER ? 'Unknown username.' : 'Incorrect password.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-orb login-orb-4" />
        <div className="login-particles">
          {PARTICLES.map(p => (
            <div
              key={p.id}
              className="login-particle"
              style={{
                left: p.left, bottom: '-10px',
                width: p.size, height: p.size,
                background: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
      </div>

      <div className={`login-card ${shake ? 'login-card-shake' : ''}`} style={{ opacity: showCard ? 1 : 0 }}>
        <div className="login-icon-wrap">
          <span>⌬</span>
        </div>

        <h1 className="login-title">Fahim's Linux Lab</h1>
        <p className="login-tagline">
          AWS L4 SysDE prep — sign in to continue.
        </p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">◈</span>
              <input
                ref={userRef}
                id="username"
                className="login-input"
                type="text"
                autoComplete="username"
                placeholder="username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                disabled={loading}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">◆</span>
              <input
                id="password"
                className="login-input"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                disabled={loading}
              />
              <button
                type="button"
                className="login-show-pass"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '◉' : '○'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <span className="login-btn-loading">
                <span className="login-spinner" />
                Signing in…
              </span>
            ) : 'Sign in →'}
          </button>
        </form>

        <div className="login-stats" style={{ marginTop: '2rem' }}>
          <div className="login-stat">
            <span className="login-stat-value">17</span>
            <span className="login-stat-label">Chapters</span>
          </div>
          <div className="login-stat">
            <span className="login-stat-value">71</span>
            <span className="login-stat-label">Labs</span>
          </div>
          <div className="login-stat">
            <span className="login-stat-value">121</span>
            <span className="login-stat-label">Questions</span>
          </div>
        </div>

        <p className="login-footer">L4 SysDE · AWS London</p>
      </div>
    </div>
  )
}
