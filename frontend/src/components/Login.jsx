import { useState, useEffect } from 'react'

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 3 + 1}px`,
  delay: `${Math.random() * 8}s`,
  duration: `${Math.random() * 8 + 8}s`,
  color: ['var(--lavender)', 'var(--rose)', 'var(--sky)', 'var(--mint)'][Math.floor(Math.random() * 4)],
}))

export default function Login({ onLogin }) {
  const [entering, setEntering] = useState(false)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowCard(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleBegin = () => {
    if (entering) return
    setEntering(true)
    setTimeout(() => {
      localStorage.setItem('fll-session', 'active')
      onLogin()
    }, 700)
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
                left: p.left,
                bottom: '-10px',
                width: p.size,
                height: p.size,
                background: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
      </div>

      <div className="login-card" style={{ opacity: showCard ? 1 : 0 }}>
        <div className="login-icon-wrap">
          <span>⌬</span>
        </div>

        <h1 className="login-title">Fahim's Linux Lab</h1>
        <p className="login-tagline">
          Your personal AWS L4 SysDE interview prep suite.
          <br />
          Deep concepts. Hands-on labs. Brutal quizzes.
        </p>

        <div className="login-stats">
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
            <span className="login-stat-label">Quizzes</span>
          </div>
        </div>

        <div className="login-divider" />

        <button className="login-btn" onClick={handleBegin} disabled={entering}>
          {entering ? '⏳ Loading...' : '⚡ Begin Session'}
        </button>

        <p className="login-footer">
          L4 Systems Development Engineer · AWS London
        </p>
      </div>
    </div>
  )
}
