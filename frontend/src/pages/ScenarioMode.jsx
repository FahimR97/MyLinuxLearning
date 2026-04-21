import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import scenarios from '../content/scenarios.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function ScenarioList() {
  return (
    <div className="page">
      <h1 className="page-title">⚡ Troubleshooting Scenarios</h1>
      <p className="page-subtitle">Interactive simulations of real-world Linux incidents. Pick the right diagnostic steps in order.</p>
      <div className="chapter-grid">
        {scenarios.map(s => (
          <Link key={s.id} to={`/scenarios/${s.id}`} className="scenario-card">
            <div className="chapter-card-header">
              <span className={`difficulty-badge ${s.difficulty}`}>{s.difficulty}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {s.steps.length} steps
              </span>
            </div>
            <h3 className="chapter-card-title">{s.title}</h3>
            <p className="chapter-card-desc">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ActiveScenario({ scenario }) {
  const navigate = useNavigate()
  const [completedSteps, setCompletedSteps] = useState([])
  const [wrongPicks, setWrongPicks] = useState(0)
  const [feedback, setFeedback] = useState(null) // { type, action, command, output, message }

  const pool = useMemo(() => {
    const actions = scenario.steps.map(s => ({ ...s, kind: 'step' }))
    const herrings = scenario.redHerrings.map(r => ({ ...r, kind: 'herring' }))
    return shuffle([...actions, ...herrings])
  }, [scenario])

  const keySteps = scenario.steps.filter(s => s.isKey)
  const nextStepIndex = completedSteps.length
  const allDone = completedSteps.length === scenario.steps.length

  const handleAction = (item) => {
    if (item.kind === 'herring') {
      setWrongPicks(w => w + 1)
      setFeedback({ type: 'wrong', action: item.action, command: item.command, message: item.why })
      return
    }
    // It's a step — check if it's the next one in order
    const stepIndex = scenario.steps.findIndex(s => s.id === item.id)
    if (stepIndex === nextStepIndex) {
      setCompletedSteps(prev => [...prev, item.id])
      setFeedback({ type: 'correct', action: item.action, command: item.command, output: item.output, message: item.insight })
    } else if (stepIndex > nextStepIndex) {
      setWrongPicks(w => w + 1)
      setFeedback({ type: 'early', action: item.action, command: item.command, message: "Good thinking, but there's something you should check first." })
    } else {
      // Already completed — ignore
    }
  }

  const availablePool = pool.filter(item => item.kind === 'herring' || !completedSteps.includes(item.id))
  const totalPicks = completedSteps.length + wrongPicks
  const pct = Math.round((completedSteps.length / scenario.steps.length) * 100)

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/scenarios')} style={{ marginBottom: '1rem' }}>
        ← Back to scenarios
      </button>

      <h1 className="page-title">{scenario.title}</h1>
      <p className="page-subtitle">{scenario.description}</p>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
          <span>Progress: {completedSteps.length}/{scenario.steps.length} steps</span>
          <span>Score: {completedSteps.length} correct / {wrongPicks} wrong</span>
        </div>
        <div className="lab-progress-bar">
          <div className="lab-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {allDone ? (
        <div className="scenario-result">
          <h2>🎉 Scenario Complete!</h2>
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--lavender)' }}>
              {completedSteps.length}/{totalPicks}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>correct picks out of total attempts</div>
          </div>
          <div className="scenario-result-section">
            <h3>Resolution</h3>
            <p>{scenario.resolution}</p>
          </div>
          <div className="scenario-result-section">
            <h3>Methodology</h3>
            <p>{scenario.methodology}</p>
          </div>
          <div className="scenario-result-section">
            <h3>💡 Interview Tip</h3>
            <p>{scenario.interviewTip}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/scenarios')} style={{ marginTop: '1.5rem' }}>
            ← Back to Scenarios
          </button>
        </div>
      ) : (
        <>
          {feedback && (
            <div className={`scenario-feedback ${feedback.type}`}>
              <div className="scenario-feedback-header">{feedback.action}</div>
              <div className="scenario-terminal">
                <div className="terminal-header">
                  <span className="terminal-dot red" /><span className="terminal-dot yellow" /><span className="terminal-dot green" />
                  <span className="terminal-title">terminal</span>
                </div>
                <div className="terminal-body">
                  <div className="terminal-line">
                    <span className="terminal-prompt">$</span>
                    <span className="terminal-command">{feedback.command}</span>
                  </div>
                  {feedback.output && <div className="terminal-output">{feedback.output}</div>}
                </div>
              </div>
              <div className="scenario-insight">{feedback.message}</div>
            </div>
          )}

          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '1.5rem 0 0.75rem' }}>
            Available Actions
          </h3>
          <div className="scenario-pool">
            {availablePool.map(item => (
              <button key={item.id} className="scenario-action" onClick={() => handleAction(item)}>
                {item.action}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ScenarioMode() {
  const { id } = useParams()
  const scenario = id ? scenarios.find(s => s.id === id) : null

  if (id && !scenario) {
    return (
      <div className="page">
        <p>Scenario not found.</p>
        <Link to="/scenarios" className="btn btn-secondary">← Back</Link>
      </div>
    )
  }

  return scenario ? <ActiveScenario key={id} scenario={scenario} /> : <ScenarioList />
}
