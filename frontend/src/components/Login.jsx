import { useState, useEffect, useRef } from 'react'

const VALID_USER = 'fahim'
const VALID_PASS = 'Shellychimp2026!'

const COMMANDS = [
  {
    cmd: 'cat /proc/meminfo | head -4',
    out: 'MemTotal:       16384000 kB\nMemFree:         8847312 kB\nMemAvailable:   12109440 kB\nBuffers:          512000 kB',
  },
  {
    cmd: 'ps aux | grep Z | awk \'{print $1,$8}\'',
    out: 'root     Z\nwww-data Z\n[2 zombie processes found]',
  },
  {
    cmd: 'ss -tlnp | grep LISTEN',
    out: 'State   Recv-Q  Local Address:Port\nLISTEN  0       0.0.0.0:22\nLISTEN  0       0.0.0.0:443\nLISTEN  0       127.0.0.1:8080',
  },
  {
    cmd: 'strace -c -p 1 2>&1 | head -6',
    out: '% time  seconds  calls  errors syscall\n 28.12  0.000451    312       2 read\n 19.44  0.000312    128       0 epoll_wait\n 15.38  0.000247    201       1 write',
  },
  {
    cmd: 'journalctl -u nginx --since "1h ago" | tail -3',
    out: 'Apr 18 09:12:03 nginx[1024]: 200 GET /health\nApr 18 09:12:44 nginx[1024]: 502 POST /api/data\nApr 18 09:12:44 systemd[1]: nginx.service: main process exited',
  },
]

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i / 16) * 100 + Math.random() * 6}%`,
  size: `${Math.random() * 2.5 + 1}px`,
  delay: `${Math.random() * 10}s`,
  duration: `${Math.random() * 10 + 10}s`,
  color: ['var(--lavender)', 'var(--rose)', 'var(--sky)', 'var(--mint)'][i % 4],
}))

function TerminalTyper() {
  const [cmdIdx, setCmdIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [phase, setPhase] = useState('typing') // typing | output | pause | clearing

  useEffect(() => {
    const target = COMMANDS[cmdIdx].cmd
    if (phase === 'typing') {
      if (typed.length < target.length) {
        const t = setTimeout(() => setTyped(target.slice(0, typed.length + 1)), 45)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => { setShowOutput(true); setPhase('output') }, 300)
        return () => clearTimeout(t)
      }
    }
    if (phase === 'output') {
      const t = setTimeout(() => setPhase('pause'), 2800)
      return () => clearTimeout(t)
    }
    if (phase === 'pause') {
      const t = setTimeout(() => { setShowOutput(false); setPhase('clearing') }, 600)
      return () => clearTimeout(t)
    }
    if (phase === 'clearing') {
      const t = setTimeout(() => {
        setTyped('')
        setCmdIdx(i => (i + 1) % COMMANDS.length)
        setPhase('typing')
      }, 200)
      return () => clearTimeout(t)
    }
  }, [phase, typed, cmdIdx])

  const current = COMMANDS[cmdIdx]

  return (
    <div className="ls-terminal">
      <div className="ls-terminal-bar">
        <span className="ls-dot ls-dot-red" />
        <span className="ls-dot ls-dot-yellow" />
        <span className="ls-dot ls-dot-green" />
        <span className="ls-terminal-title">fahim@linux-lab ~ bash</span>
      </div>
      <div className="ls-terminal-body">
        <div className="ls-line">
          <span className="ls-prompt">fahim@aws</span>
          <span className="ls-at">:</span>
          <span className="ls-dir">~</span>
          <span className="ls-dollar">$</span>
          <span className="ls-cmd">{typed}</span>
          <span className="ls-cursor" />
        </div>
        {showOutput && (
          <pre className="ls-output">{current.out}</pre>
        )}
      </div>
    </div>
  )
}

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [mounted, setMounted] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true)
      setTimeout(() => userRef.current?.focus(), 500)
    }, 80)
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
      }, 700)
    } else {
      setError(username !== VALID_USER ? 'Unknown username.' : 'Incorrect password.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="ls-page">
      {/* Left showcase panel */}
      <div className="ls-showcase">
        {/* Orbs */}
        <div className="ls-orb ls-orb-1" />
        <div className="ls-orb ls-orb-2" />
        <div className="ls-orb ls-orb-3" />
        {/* Particles */}
        <div className="ls-particles">
          {PARTICLES.map(p => (
            <div key={p.id} className="ls-particle" style={{
              left: p.left, bottom: '-10px',
              width: p.size, height: p.size,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }} />
          ))}
        </div>

        <div className="ls-showcase-content">
          <div className="ls-brand">
            <div className="ls-brand-icon">⌬</div>
            <div>
              <div className="ls-brand-name">FahimsLinuxLab</div>
              <div className="ls-brand-sub">L4 SysDE Interview Prep</div>
            </div>
          </div>

          <h1 className="ls-headline">
            Master Linux.<br />
            <span className="ls-headline-grad">Land the role.</span>
          </h1>
          <p className="ls-sub">
            17 deep chapters, 71 hands-on labs, and 121 quiz questions
            written at AWS interview depth — from inodes and the OOM killer
            to VPCs, RAID, and systemd.
          </p>

          <TerminalTyper />

          <div className="ls-stats">
            <div className="ls-stat">
              <span className="ls-stat-val">17</span>
              <span className="ls-stat-label">Chapters</span>
            </div>
            <div className="ls-stat-div" />
            <div className="ls-stat">
              <span className="ls-stat-val">71</span>
              <span className="ls-stat-label">Labs</span>
            </div>
            <div className="ls-stat-div" />
            <div className="ls-stat">
              <span className="ls-stat-val">121</span>
              <span className="ls-stat-label">Questions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="ls-auth">
        <div className={`ls-form-card ${mounted ? 'ls-form-card-in' : ''} ${shake ? 'ls-shake' : ''}`}>
          <div className="ls-form-header">
            <h2 className="ls-form-title">Welcome back</h2>
            <p className="ls-form-sub">Sign in to your lab</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="ls-field">
              <label className="ls-label" htmlFor="username">Username</label>
              <input
                ref={userRef}
                id="username"
                className="ls-input"
                type="text"
                autoComplete="username"
                placeholder="fahim"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                disabled={loading}
                spellCheck={false}
              />
            </div>

            <div className="ls-field">
              <label className="ls-label" htmlFor="password">Password</label>
              <div className="ls-pass-wrap">
                <input
                  id="password"
                  className="ls-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ls-eye"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide' : 'Show'}
                >
                  {showPass ? '👁' : '👁‍🗨'}
                </button>
              </div>
            </div>

            {error && <p className="ls-error" role="alert">✗ {error}</p>}

            <button
              type="submit"
              className="ls-submit"
              disabled={loading || !username || !password}
            >
              {loading
                ? <><span className="ls-spin" /> Signing in…</>
                : 'Sign in →'
              }
            </button>
          </form>

          <p className="ls-form-footer">AWS London · L4 SysDE</p>
        </div>
      </div>
    </div>
  )
}
