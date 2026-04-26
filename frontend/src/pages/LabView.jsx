import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getLabs } from '../api/client'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function LabView() {
  const { chapterId } = useParams()
  const [labs, setLabs] = useState([])
  const [activeLab, setActiveLab] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [verifying, setVerifying] = useState(null)
  const [verifyResult, setVerifyResult] = useState({})

  useEffect(() => {
    getLabs(chapterId).then(data => {
      setLabs(data)
      setActiveLab(0)
      setActiveStep(0)
      setCompletedSteps(new Set())
      setVerifyResult({})
    })
  }, [chapterId])

  if (!labs.length) {
    return (
      <div className="page">
        <div className="loading"><div className="loading-spinner" />Loading labs...</div>
      </div>
    )
  }

  const lab = labs[activeLab]
  const steps = lab?.steps || []
  const completedInLab = [...completedSteps].filter(k => k.startsWith(`${activeLab}-`)).length
  const allDone = completedInLab === steps.length && steps.length > 0

  const handleVerify = async (stepIdx) => {
    const key = `${activeLab}-${stepIdx}`
    const step = steps[stepIdx]
    setVerifying(stepIdx)
    setVerifyResult(prev => ({ ...prev, [key]: null }))

    try {
      const res = await fetch(`${API_BASE}/labs/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: step.command, chapterId, labId: lab.id, stepIndex: stepIdx }),
      })
      const data = await res.json()
      if (data.passed) {
        setCompletedSteps(prev => new Set([...prev, key]))
        setVerifyResult(prev => ({ ...prev, [key]: { passed: true, output: data.output } }))
        if (stepIdx < steps.length - 1) setTimeout(() => setActiveStep(stepIdx + 1), 600)
      } else {
        setVerifyResult(prev => ({ ...prev, [key]: { passed: false, message: data.message || 'Command not detected. Run it in the terminal and try again.' } }))
      }
    } catch {
      setVerifyResult(prev => ({ ...prev, [key]: { passed: false, message: 'Verification unavailable — check your connection.' } }))
    } finally {
      setVerifying(null)
    }
  }

  const handleSkip = (stepIdx) => {
    const key = `${activeLab}-${stepIdx}`
    setCompletedSteps(prev => new Set([...prev, key]))
    setVerifyResult(prev => ({ ...prev, [key]: { passed: true, skipped: true } }))
    if (stepIdx < steps.length - 1) setTimeout(() => setActiveStep(stepIdx + 1), 400)
  }

  const switchLab = (i) => {
    setActiveLab(i)
    setActiveStep(0)
  }

  return (
    <div className="page lab-page lab-split">
      {/* LEFT PANEL — Instructions */}
      <div className="lab-instructions-panel">
        <div className="lab-header">
          <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>
          <h1 className="page-title" style={{ marginTop: '0.5rem', fontSize: '1.2rem' }}>Labs</h1>
        </div>

        {labs.length > 1 && (
          <div className="lab-tabs">
            {labs.map((l, i) => (
              <button key={l.id} className={`lab-tab ${i === activeLab ? 'active' : ''}`} onClick={() => switchLab(i)}>
                {i + 1}. {l.title}
              </button>
            ))}
          </div>
        )}

        <div className="lab-content">
          <div className="lab-info">
            <h2>{lab.title}</h2>
            <p className="lab-desc">{lab.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div className="lab-progress-bar" style={{ flex: 1 }}>
                <div className="lab-progress-fill" style={{ width: `${(completedInLab / Math.max(steps.length, 1)) * 100}%` }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {completedInLab}/{steps.length} steps
              </span>
            </div>
          </div>

          <div className="lab-steps">
            {steps.map((step, i) => {
              const key = `${activeLab}-${i}`
              const isCompleted = completedSteps.has(key)
              const isCurrent = i === activeStep
              const isLocked = i > activeStep && !isCompleted
              const result = verifyResult[key]

              return (
                <div key={i} className={`lab-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}>
                  <div className="step-header">
                    <span className="step-num">{isCompleted ? '✓' : i + 1}</span>
                    <span className="step-instruction">{step.instruction}</span>
                  </div>
                  {(isCurrent || isCompleted) && (
                    <div className="step-command-hint">
                      <code>$ {step.command}</code>
                    </div>
                  )}
                  {isCurrent && !isCompleted && (
                    <div className="step-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleVerify(i)} disabled={verifying === i}>
                        {verifying === i ? '⏳ Checking…' : '✓ Verify'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleSkip(i)}>Skip →</button>
                    </div>
                  )}
                  {result && !result.passed && (
                    <div className="step-verify-fail">✗ {result.message}</div>
                  )}
                  {result?.passed && !result.skipped && (
                    <div className="step-verify-pass">✓ Verified</div>
                  )}
                </div>
              )
            })}
          </div>

          {allDone && (
            <div className="lab-complete-banner">
              <h3>✓ Lab Complete!</h3>
              <p>All steps finished. Ready to test your knowledge?</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to={`/quizzes/${chapterId}`} className="btn btn-primary">Take the Quiz →</Link>
                <Link to={`/chapters/${chapterId}`} className="btn btn-secondary">Back to Chapter</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Live Terminal */}
      <div className="lab-terminal-panel">
        <div className="lab-terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="terminal-title">live terminal</span>
        </div>
        <iframe
          src="/term/"
          title="Lab Terminal"
          className="lab-terminal-iframe"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  )
}
