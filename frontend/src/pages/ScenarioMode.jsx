import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import scenarios from '../content/scenarios.json'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function ScenarioMode() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) return <ScenarioList onSelect={id => navigate(`/scenarios/${id}`)} />
  const scenario = scenarios.find(s => s.id === id)
  if (!scenario) return <div className="page">Scenario not found</div>
  return <ActiveScenario scenario={scenario} onBack={() => navigate('/scenarios')} />
}

function ScenarioList({ onSelect }) {
  const [filter, setFilter] = useState('all')
  const categories = ['all', ...new Set(scenarios.map(s => s.category))]
  const filtered = filter === 'all' ? scenarios : scenarios.filter(s => s.category === filter)

  return (
    <div className="page">
      <h1 className="page-title">Troubleshooting Scenarios</h1>
      <p className="page-subtitle">Practice real diagnostic workflows. Type commands and reasoning — get AI feedback.</p>
      <div className="sc-filters">
        {categories.map(c => (
          <button key={c} className={`sc-filter ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <div className="sc-grid">
        {filtered.map(s => (
          <button key={s.id} className="sc-card" onClick={() => onSelect(s.id)}>
            <div className="sc-card-top">
              <span className={`sc-diff sc-diff-${s.difficulty}`}>{s.difficulty}</span>
              <span className="sc-cat">{s.category}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <span className="sc-steps">{s.steps.length} steps</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActiveScenario({ scenario, onBack }) {
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('command') // 'command' | 'thinking'
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [viewIdx, setViewIdx] = useState(null) // null = latest, number = viewing old step
  const historyEndRef = useRef(null)
  const inputRef = useRef(null)

  const stepsCompleted = history.filter(h => h.matched).length

  useEffect(() => {
    if (viewIdx === null) historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, viewIdx])

  useEffect(() => { inputRef.current?.focus() }, [mode, loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    setLoading(true)
    setViewIdx(null)

    const userInput = { type: mode, text: input.trim() }
    const entry = { ...userInput, feedback: '', output: null, matched: false, timestamp: Date.now() }

    // Local command matching first
    const currentStepIdx = stepsCompleted
    let localMatched = false
    let localOutput = null

    if (mode === 'command') {
      const norm = input.trim().toLowerCase().replace(/\s+/g, ' ')
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i]
        const matches = step.commands.some(cmd => {
          const c = cmd.toLowerCase()
          return norm.includes(c) || c.includes(norm) || norm.split('|').some(p => c.includes(p.trim())) || c.split('|').some(p => norm.includes(p.trim()))
        })
        if (matches && i === currentStepIdx) {
          localMatched = true
          localOutput = step.output
          break
        }
      }
    }

    // Call Bedrock for AI feedback
    try {
      const res = await fetch(`${API_BASE}/ai-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, history, userInput }),
      })
      if (res.ok) {
        const data = await res.json()
        entry.feedback = data.feedback
        if (data.matched) localMatched = true
        if (data.output) localOutput = data.output
      }
    } catch {
      // Fallback to local feedback if API fails
      if (localMatched) {
        entry.feedback = scenario.steps[currentStepIdx].feedback
      } else if (mode === 'thinking') {
        entry.feedback = "Good thinking. Try translating that into a specific command you'd run."
      } else {
        entry.feedback = scenario.steps[currentStepIdx]?.hint || "Think about what information you need next."
      }
    }

    entry.matched = localMatched
    entry.output = localOutput

    const newHistory = [...history, entry]
    setHistory(newHistory)
    setInput('')
    setLoading(false)

    if (localMatched && stepsCompleted + 1 >= scenario.steps.length) {
      setCompleted(true)
    }
  }

  const visibleHistory = viewIdx !== null ? history.slice(0, viewIdx + 1) : history

  if (completed) {
    const correctPicks = history.filter(h => h.matched).length
    const totalPicks = history.length
    return (
      <div className="page sc-result">
        <h2>Scenario Complete</h2>
        <div className="sc-score">
          <span className="sc-score-num">{correctPicks}</span>
          <span className="sc-score-label">correct steps in {totalPicks} attempts</span>
        </div>
        <div className="sc-section">
          <h3>Resolution</h3>
          <p>{scenario.resolution}</p>
        </div>
        <div className="sc-section">
          <h3>Ideal Methodology</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{scenario.methodology}</p>
        </div>
        <div className="sc-section">
          <h3>Interview Tip</h3>
          <p>{scenario.interviewTip}</p>
        </div>
        <div className="sc-result-actions">
          <button className="btn btn-primary" onClick={onBack}>Try Another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page sc-active">
      <div className="sc-header">
        <button className="back-link" onClick={onBack}>← Scenarios</button>
        <div className="sc-progress-bar">
          <div className="sc-progress-fill" style={{ width: `${(stepsCompleted / scenario.steps.length) * 100}%` }} />
        </div>
        <span className="sc-progress-text">{stepsCompleted}/{scenario.steps.length}</span>
      </div>

      <div className="sc-prompt">
        <h2>{scenario.title}</h2>
        <p>{scenario.description}</p>
      </div>

      <div className="sc-terminal-area">
        {visibleHistory.map((h, i) => (
          <div key={i} className={`sc-entry ${h.matched ? 'sc-correct' : ''}`}>
            <div className="sc-entry-input">
              <span className="sc-entry-tag">{h.type === 'command' ? '$' : '💭'}</span>
              <span className={h.type === 'command' ? 'sc-cmd-text' : 'sc-think-text'}>{h.text}</span>
            </div>
            {h.output && <pre className="sc-output">{h.output}</pre>}
            {h.feedback && <div className={`sc-feedback ${h.matched ? 'sc-fb-good' : 'sc-fb-guide'}`}>{h.feedback}</div>}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      <div className="sc-nav-row">
        {history.length > 0 && viewIdx !== 0 && (
          <button className="btn btn-secondary sc-nav-btn" onClick={() => setViewIdx(viewIdx !== null ? Math.max(0, viewIdx - 1) : history.length - 2)}>
            ← Previous
          </button>
        )}
        {viewIdx !== null && (
          <button className="btn btn-secondary sc-nav-btn" onClick={() => setViewIdx(viewIdx < history.length - 1 ? viewIdx + 1 : null)}>
            Next →
          </button>
        )}
        {viewIdx !== null && (
          <button className="btn btn-secondary sc-nav-btn" onClick={() => setViewIdx(null)}>Latest</button>
        )}
      </div>

      <form className="sc-input-area" onSubmit={handleSubmit}>
        <div className="sc-mode-toggle">
          <button type="button" className={`sc-mode-btn ${mode === 'command' ? 'active' : ''}`} onClick={() => setMode('command')}>
            $ Command
          </button>
          <button type="button" className={`sc-mode-btn ${mode === 'thinking' ? 'active' : ''}`} onClick={() => setMode('thinking')}>
            💭 Thinking
          </button>
        </div>
        <div className="sc-input-row">
          <span className="sc-input-prompt">{mode === 'command' ? '$' : '💭'}</span>
          <input
            ref={inputRef}
            className="sc-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'command' ? 'Type a command...' : 'Share your thinking...'}
            disabled={loading}
            autoComplete="off"
            spellCheck={mode === 'thinking'}
          />
          <button type="submit" className="sc-send" disabled={loading || !input.trim()}>
            {loading ? '...' : '→'}
          </button>
        </div>
      </form>
    </div>
  )
}
