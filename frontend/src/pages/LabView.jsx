import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getLabs } from '../api/client'
import Terminal from '../components/Terminal'

export default function LabView() {
  const { chapterId } = useParams()
  const [labs, setLabs] = useState([])
  const [activeLab, setActiveLab] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  useEffect(() => {
    getLabs(chapterId).then(data => {
      setLabs(data)
      setActiveLab(0)
      setActiveStep(0)
      setCompletedSteps(new Set())
    })
  }, [chapterId])

  if (!labs.length) {
    return (
      <div className="page">
        <div className="loading">
          <div className="loading-spinner" />
          Loading labs...
        </div>
      </div>
    )
  }

  const lab = labs[activeLab]
  const steps = lab?.steps || []

  const completedInLab = [...completedSteps].filter(k => k.startsWith(`${activeLab}-`)).length
  const allDone = completedInLab === steps.length && steps.length > 0

  const handleRun = (stepIdx) => {
    const key = `${activeLab}-${stepIdx}`
    setCompletedSteps(prev => new Set([...prev, key]))
    if (stepIdx < steps.length - 1) {
      setTimeout(() => setActiveStep(stepIdx + 1), 600)
    }
  }

  const switchLab = (i) => {
    setActiveLab(i)
    setActiveStep(0)
  }

  return (
    <div className="page lab-page">
      <div className="lab-header">
        <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>
        <h1 className="page-title" style={{ marginTop: '0.5rem' }}>Labs</h1>
      </div>

      {labs.length > 1 && (
        <div className="lab-tabs">
          {labs.map((l, i) => (
            <button
              key={l.id}
              className={`lab-tab ${i === activeLab ? 'active' : ''}`}
              onClick={() => switchLab(i)}
            >
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
              <div
                className="lab-progress-fill"
                style={{ width: `${(completedInLab / Math.max(steps.length, 1)) * 100}%` }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {completedInLab}/{steps.length} steps
            </span>
          </div>
        </div>

        <div className="lab-steps">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.has(`${activeLab}-${i}`)
            const isCurrent = i === activeStep
            const isLocked = i > activeStep && !isCompleted

            return (
              <div
                key={i}
                className={`lab-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <div className="step-header">
                  <span className="step-num">{isCompleted ? '✓' : i + 1}</span>
                  <span className="step-instruction">{step.instruction}</span>
                </div>
                {(isCurrent || isCompleted) && (
                  <Terminal
                    command={step.command}
                    output={step.expectedOutput || ''}
                    isActive={isCurrent && !isCompleted}
                    onRun={() => handleRun(i)}
                  />
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
  )
}
