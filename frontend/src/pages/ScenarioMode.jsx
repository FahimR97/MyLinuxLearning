import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import scenarios from '../content/scenarios.json'

const API_BASE = import.meta.env.VITE_API_URL || ''
const SC_PROGRESS_KEY = 'fll-scenario-progress'

export function getScenarioProgress() {
  try { return JSON.parse(localStorage.getItem(SC_PROGRESS_KEY) || '{}') } catch { return {} }
}
function saveScenarioProgress(id, data) {
  const existing = getScenarioProgress()
  localStorage.setItem(SC_PROGRESS_KEY, JSON.stringify({ ...existing, [id]: data }))
}

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
  const [scProgress] = useState(getScenarioProgress)
  const categories = ['all', ...new Set(scenarios.map(s => s.category))]
  const filtered = filter === 'all' ? scenarios : scenarios.filter(s => s.category === filter)

  return (
    <div className="page">
      <h1 className="page-title">Troubleshooting Scenarios</h1>
      <p className="page-subtitle">Practice real diagnostic workflows. Type commands and share your reasoning — get AI mentoring.</p>
      <div className="sc-filters">
        {categories.map(c => (
          <button key={c} className={`sc-filter ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <div className="sc-grid">
        {filtered.map(s => {
          const done = !!scProgress[s.id]?.completed
          return (
            <button key={s.id} className={`sc-card ${done ? 'sc-card-done' : ''}`} onClick={() => onSelect(s.id)}>
              <div className="sc-card-top">
                <span className={`sc-diff sc-diff-${s.difficulty}`}>{s.difficulty}</span>
                <span className="sc-cat">{s.category}</span>
                {done && <span className="sc-done-badge">✓ done</span>}
              </div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <span className="sc-steps">{s.steps.length} steps</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ActiveScenario({ scenario, onBack }) {
  const [cmdInput, setCmdInput] = useState('')
  const [thinkInput, setThinkInput] = useState('')
  const [termHistory, setTermHistory] = useState([])
  const [aiFeedback, setAiFeedback] = useState([])
  const [collapsedFeedback, setCollapsedFeedback] = useState({})
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [viewIdx, setViewIdx] = useState(null)
  const [cmdHistory, setCmdHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const termRef = useRef(null)
  const cmdRef = useRef(null)

  const stepsCompleted = termHistory.filter(h => h.matched).length

  useEffect(() => {
    if (viewIdx === null) termRef.current?.scrollTo(0, termRef.current.scrollHeight)
  }, [termHistory, viewIdx])

  const callAI = async (userInput, history) => {
    try {
      const res = await fetch(`${API_BASE}/ai-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, history, userInput }),
      })
      if (res.ok) return (await res.json()).feedback
    } catch {}
    return null
  }

  const matchCommand = (cmd) => {
    const norm = cmd.trim().toLowerCase().replace(/\s+/g, ' ')
    const currentIdx = stepsCompleted
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i]
      const hit = step.commands.some(c => {
        const cl = c.toLowerCase()
        return norm.includes(cl) || cl.includes(norm)
      })
      if (hit) return { stepIdx: i, isCurrent: i === currentIdx, step }
    }
    return null
  }

  const handleCmdKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const newIdx = Math.min(histIdx + 1, cmdHistory.length - 1)
      setHistIdx(newIdx)
      setCmdInput(cmdHistory[cmdHistory.length - 1 - newIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIdx = histIdx - 1
      setHistIdx(newIdx)
      setCmdInput(newIdx < 0 ? '' : cmdHistory[cmdHistory.length - 1 - newIdx])
    }
  }

  const handleCommand = async (e) => {
    e.preventDefault()
    if (!cmdInput.trim() || loading) return
    setLoading(true)
    setViewIdx(null)
    const cmd = cmdInput.trim()
    setCmdInput('')
    setCmdHistory(prev => [...prev, cmd])
    setHistIdx(-1)

    const match = matchCommand(cmd)
    const entry = { type: 'command', text: cmd, output: null, matched: false }

    if (match?.isCurrent) {
      entry.matched = true
      entry.output = match.step.output
    }

    const newHistory = [...termHistory, entry]
    setTermHistory(newHistory)

    const fb = await callAI({ type: 'command', text: cmd }, newHistory)
    const fallback = match?.isCurrent ? match.step.feedback
      : match ? `Good thinking, but you're jumping ahead. ${scenario.steps[stepsCompleted]?.hint || ''}`
      : scenario.steps[stepsCompleted]?.hint || "That's not the most useful command right now."

    setAiFeedback(prev => [...prev, {
      text: fb || fallback,
      type: match?.isCurrent ? 'good' : match ? 'early' : 'guide',
      forCmd: cmd,
    }])

    setLoading(false)

    const nextStepsCompleted = newHistory.filter(h => h.matched).length
    if (match?.isCurrent && nextStepsCompleted >= scenario.steps.length) {
      saveScenarioProgress(scenario.id, {
        completed: true,
        totalSteps: scenario.steps.length,
        commandsUsed: newHistory.length,
        completedAt: new Date().toISOString(),
      })
      setCompleted(true)
    }
    cmdRef.current?.focus()
  }

  const handleThinking = async (e) => {
    e.preventDefault()
    if (!thinkInput.trim() || loading) return
    setLoading(true)
    const text = thinkInput.trim()
    setThinkInput('')

    const fb = await callAI({ type: 'thinking', text }, termHistory)
    setAiFeedback(prev => [...prev, {
      text: fb || "Good thinking. Try translating that into a specific command you'd run.",
      type: 'thinking',
      forCmd: `💭 ${text}`,
    }])
    setLoading(false)
    cmdRef.current?.focus()
  }

  const handleHint = () => {
    const step = scenario.steps[stepsCompleted]
    if (step) {
      setAiFeedback(prev => [...prev, { text: step.hint, type: 'hint', forCmd: 'Hint requested' }])
    }
  }

  const visibleTerm = viewIdx !== null ? termHistory.slice(0, viewIdx + 1) : termHistory

  if (completed) {
    return (
      <div className="page sc-result">
        <h2 className="sc-result-title">Scenario Complete</h2>
        <div className="sc-score">
          <span className="sc-score-num">{stepsCompleted}</span>
          <span className="sc-score-label">steps found in {termHistory.length} commands</span>
        </div>

        <div className="sc-section"><h3>Resolution</h3><p>{scenario.resolution}</p></div>
        <div className="sc-section"><h3>Ideal Methodology</h3><p>{scenario.methodology}</p></div>

        <div className="sc-section">
          <h3>Diagnostic Sequence</h3>
          <div className="sc-ideal-steps">
            {scenario.steps.map((step, i) => (
              <div key={i} className="sc-ideal-step">
                <span className="sc-step-num">{i + 1}</span>
                <div className="sc-step-body">
                  <div className="sc-step-cmds">
                    {step.commands.slice(0, 3).map((c, j) => (
                      <code key={j} className="sc-step-cmd">{c}</code>
                    ))}
                  </div>
                  <p className="sc-step-why">{step.feedback?.split('—')[0]?.trim() || step.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sc-section">
          <h3>Interview Tip</h3>
          <p className="sc-interview-tip">{scenario.interviewTip}</p>
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

      <div className="sc-prompt"><h2>{scenario.title}</h2><p>{scenario.description}</p></div>

      <div className="sc-terminal-area" ref={termRef}>
        {visibleTerm.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Type a command below to start diagnosing...
          </div>
        )}
        {visibleTerm.map((h, i) => (
          <div key={i} className={`sc-entry ${h.matched ? 'sc-correct' : ''}`}>
            <div className="sc-entry-input">
              <span className="sc-entry-tag">$</span>
              <span className="sc-cmd-text">{h.text}</span>
            </div>
            {h.output && <pre className="sc-output">{h.output}</pre>}
          </div>
        ))}
        {loading && (
          <div className="sc-entry">
            <span className="sc-entry-tag">$</span>
            <span className="sc-loading-dots">···</span>
          </div>
        )}
      </div>

      <form className="sc-cmd-form" onSubmit={handleCommand}>
        <span className="sc-input-prompt">$</span>
        <input
          ref={cmdRef}
          className="sc-input"
          value={cmdInput}
          onChange={e => setCmdInput(e.target.value)}
          onKeyDown={handleCmdKeyDown}
          placeholder="Type a command... (↑↓ for history)"
          disabled={loading}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className="sc-send" disabled={loading || !cmdInput.trim()}>→</button>
        <button type="button" className="sc-hint-btn" onClick={handleHint} disabled={loading}>hint</button>
      </form>

      {termHistory.length > 0 && (
        <div className="sc-nav-row">
          {viewIdx !== 0 && (
            <button className="btn btn-secondary sc-nav-btn"
              onClick={() => setViewIdx(viewIdx !== null ? Math.max(0, viewIdx - 1) : termHistory.length - 2)}>
              ← Previous
            </button>
          )}
          {viewIdx !== null && (
            <button className="btn btn-secondary sc-nav-btn"
              onClick={() => setViewIdx(viewIdx < termHistory.length - 1 ? viewIdx + 1 : null)}>
              Next →
            </button>
          )}
          {viewIdx !== null && (
            <button className="btn btn-secondary sc-nav-btn" onClick={() => setViewIdx(null)}>Latest</button>
          )}
        </div>
      )}

      <form className="sc-think-form" onSubmit={handleThinking}>
        <span className="sc-think-label">💭 Share your thinking:</span>
        <div className="sc-think-row">
          <input
            className="sc-think-input"
            value={thinkInput}
            onChange={e => setThinkInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleThinking(e) }}
            placeholder="I think the issue might be... (⌘+Enter to send)"
            disabled={loading}
            autoComplete="off"
          />
          <button type="submit" className="sc-send" disabled={loading || !thinkInput.trim()}>→</button>
        </div>
      </form>

      {aiFeedback.length > 0 && (
        <div className="sc-ai-panel">
          <div className="sc-ai-header">AI Mentor</div>
          {aiFeedback.map((fb, i) => (
            <div key={i} className={`sc-ai-msg sc-ai-${fb.type}`}>
              <button
                className="sc-ai-toggle"
                onClick={() => setCollapsedFeedback(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                <span className="sc-ai-context">{fb.forCmd}</span>
                <span className="sc-ai-chevron">{collapsedFeedback[i] ? '▸' : '▾'}</span>
              </button>
              {!collapsedFeedback[i] && (
                <div className="sc-ai-text">{fb.text}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
