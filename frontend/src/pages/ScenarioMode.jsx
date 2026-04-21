import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import scenarios from '../content/scenarios.json'

const categories = [...new Set(scenarios.map(s => s.category))]

function normalize(cmd) {
  return cmd.trim().replace(/\s+/g, ' ').toLowerCase()
}

function commandMatches(input, candidates) {
  const n = normalize(input)
  for (const c of candidates) {
    const nc = normalize(c)
    if (n === nc) return true
    // allow extra flags: if user typed base command + extra stuff
    const baseParts = nc.split(/\s*\|\s*/)[0].split(' ')
    const inputParts = n.split(' ')
    if (baseParts[0] === inputParts[0] && baseParts.length <= inputParts.length) {
      const allBasePresent = baseParts.every(p => inputParts.includes(p))
      if (allBasePresent) return true
    }
  }
  return false
}

function ScenarioList() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? scenarios : scenarios.filter(s => s.category === filter)

  return (
    <div className="page">
      <h1 className="page-title">⚡ Troubleshooting Scenarios</h1>
      <p className="page-subtitle">Type real commands to diagnose Linux incidents. Think like a senior engineer.</p>
      <div className="sc-filters">
        <button className={`sc-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {categories.map(c => (
          <button key={c} className={`sc-filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>
      <div className="chapter-grid">
        {filtered.map(s => (
          <Link key={s.id} to={`/scenarios/${s.id}`} className="scenario-card">
            <div className="chapter-card-header">
              <span className={`difficulty-badge ${s.difficulty}`}>{s.difficulty}</span>
              <span className="sc-category-tag">{s.category}</span>
            </div>
            <h3 className="chapter-card-title">{s.title}</h3>
            <p className="chapter-card-desc">{s.description.slice(0, 120)}…</p>
            <div className="sc-card-footer">
              <span className="sc-step-count">{s.steps.length} steps</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ActiveScenario({ scenario }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [wrongCount, setWrongCount] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(new Set())
  const [skipped, setSkipped] = useState(new Set())
  const termRef = useRef(null)
  const inputRef = useRef(null)

  const allDone = currentStep >= scenario.steps.length

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [history])

  useEffect(() => {
    if (inputRef.current && !allDone) inputRef.current.focus()
  }, [currentStep, allDone])

  const score = scenario.steps.length - hintsUsed.size - skipped.size

  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return
    setInput('')

    // Special commands
    if (normalize(cmd) === 'hint') {
      const step = scenario.steps[currentStep]
      setHintsUsed(prev => new Set(prev).add(currentStep))
      setHistory(h => [...h, { type: 'cmd', text: cmd }, { type: 'hint', text: `💡 Hint: ${step.hint}` }])
      setFeedback({ type: 'hint', icon: '💡', message: step.hint })
      return
    }

    if (normalize(cmd) === 'give up' || normalize(cmd) === 'skip') {
      const step = scenario.steps[currentStep]
      setSkipped(prev => new Set(prev).add(currentStep))
      setHistory(h => [
        ...h,
        { type: 'cmd', text: cmd },
        { type: 'system', text: `Answer: ${step.commands[0]}` },
        { type: 'output', text: step.output }
      ])
      setFeedback({ type: 'skip', icon: '⏭️', message: `The command was: ${step.commands[0]}\n\n${step.feedback}` })
      setCompletedSteps(prev => new Set(prev).add(currentStep))
      setCurrentStep(s => s + 1)
      setWrongCount(0)
      return
    }

    // Check current step
    if (currentStep < scenario.steps.length && commandMatches(cmd, scenario.steps[currentStep].commands)) {
      const step = scenario.steps[currentStep]
      setHistory(h => [...h, { type: 'cmd', text: cmd }, { type: 'output', text: step.output }])
      setFeedback({ type: 'correct', icon: '✓', message: step.feedback })
      setCompletedSteps(prev => new Set(prev).add(currentStep))
      setCurrentStep(s => s + 1)
      setWrongCount(0)
      return
    }

    // Check previous steps (already done)
    for (let i = 0; i < currentStep; i++) {
      if (commandMatches(cmd, scenario.steps[i].commands)) {
        const step = scenario.steps[i]
        const summary = step.output.split('\n').slice(0, 2).join('\n')
        setHistory(h => [...h, { type: 'cmd', text: cmd }])
        setFeedback({ type: 'repeat', icon: '↩', message: `You've already checked that. Here's what you found:\n${summary}` })
        return
      }
    }

    // Check future steps (jumping ahead)
    for (let i = currentStep + 1; i < scenario.steps.length; i++) {
      if (commandMatches(cmd, scenario.steps[i].commands)) {
        setHistory(h => [...h, { type: 'cmd', text: cmd }])
        setFeedback({ type: 'early', icon: '⚠', message: `Good thinking, but you're jumping ahead. ${scenario.steps[currentStep].hint}` })
        return
      }
    }

    // No match
    const wc = wrongCount + 1
    setWrongCount(wc)
    setHistory(h => [...h, { type: 'cmd', text: cmd }, { type: 'error', text: 'Command not relevant to this scenario.' }])
    const step = scenario.steps[currentStep]
    if (wc >= 3) {
      setFeedback({ type: 'wrong', icon: '✗', message: `That's not the most useful command right now. Strong hint: try one of these approaches — ${step.commands[0].split(' ')[0]}. ${step.hint}` })
    } else {
      setFeedback({ type: 'wrong', icon: '✗', message: `That's not the most useful command right now. ${step.hint}` })
    }
  }

  const pct = Math.round((Math.min(currentStep, scenario.steps.length) / scenario.steps.length) * 100)

  if (allDone) {
    return (
      <div className="page">
        <div className="scenario-result">
          <h2>🎉 Scenario Complete!</h2>
          <div className="sc-score-display">
            <span className="sc-score-num">{score}/{scenario.steps.length}</span>
            <span className="sc-score-label">steps found without hints</span>
          </div>
          <div className="scenario-result-section">
            <h3>Methodology</h3>
            <ol className="sc-methodology-list">
              {scenario.methodology.split('\n').filter(l => l.trim()).map((line, i) => (
                <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          </div>
          <div className="scenario-result-section">
            <h3>Resolution</h3>
            <p>{scenario.resolution}</p>
          </div>
          <div className="scenario-result-section">
            <h3>💡 Interview Tip</h3>
            <p>{scenario.interviewTip}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/scenarios')} style={{ marginTop: '1.5rem' }}>
            Try Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page sc-active-page">
      <button className="btn btn-ghost" onClick={() => navigate('/scenarios')} style={{ marginBottom: '0.75rem' }}>← Back to scenarios</button>

      <div className="sc-progress-bar">
        <div className="sc-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="sc-progress-label">Step {currentStep + 1} of {scenario.steps.length}</div>

      <div className="sc-prompt-box">
        <h1 className="sc-title">{scenario.title}</h1>
        <p className="sc-description">{scenario.description}</p>
      </div>

      <div className="sc-layout">
        <div className="sc-terminal-col">
          <div className="sc-terminal" ref={termRef}>
            {history.length === 0 && (
              <div className="sc-terminal-welcome">Type a command to begin diagnosing. Type <span className="sc-kw">hint</span> for help or <span className="sc-kw">skip</span> to see the answer.</div>
            )}
            {history.map((entry, i) => (
              <div key={i} className={`sc-term-entry sc-term-${entry.type}`}>
                {entry.type === 'cmd' && <><span className="sc-prompt">$</span> <span className="sc-cmd-text">{entry.text}</span></>}
                {entry.type === 'output' && <pre className="sc-output-text">{entry.text}</pre>}
                {entry.type === 'error' && <span className="sc-error-text">{entry.text}</span>}
                {entry.type === 'hint' && <span className="sc-hint-text">{entry.text}</span>}
                {entry.type === 'system' && <span className="sc-system-text">{entry.text}</span>}
              </div>
            ))}
          </div>
          <form className="sc-input-row" onSubmit={handleSubmit}>
            <span className="sc-input-prompt">$</span>
            <input
              ref={inputRef}
              className="sc-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a command..."
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>

        <div className="sc-feedback-panel">
          <div className="sc-feedback-header">AI Feedback</div>
          {feedback ? (
            <div className={`sc-feedback-card sc-fb-${feedback.type}`}>
              <span className="sc-fb-icon">{feedback.icon}</span>
              <div className="sc-fb-message">{feedback.message}</div>
            </div>
          ) : (
            <div className="sc-feedback-empty">Run a command to get feedback</div>
          )}
        </div>
      </div>
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
