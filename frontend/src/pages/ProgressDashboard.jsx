import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getChapters, getProgress, resetProgress } from '../api/client'
import { getScenarioProgress } from './ScenarioMode'
import scenarios from '../content/scenarios.json'

export default function ProgressDashboard() {
  const [chapters, setChapters] = useState([])
  const [progress, setProgress] = useState({})
  const [scProgress, setScProgress] = useState({})

  useEffect(() => {
    getChapters().then(setChapters)
    getProgress().then(setProgress)
    setScProgress(getScenarioProgress())
  }, [])

  const handleReset = async () => {
    if (!window.confirm('Reset all progress? This cannot be undone.')) return
    await resetProgress()
    setProgress({})
  }

  const total = chapters.length || 1
  const readCount = Object.keys(progress).filter(k => progress[k]?.read).length
  const quizCount = Object.keys(progress).filter(k => progress[k]?.quizScore != null).length
  const labCount = Object.keys(progress).filter(k => progress[k]?.labComplete).length
  const quizScores = Object.values(progress).filter(p => p?.quizScore != null)
  const avgScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((s, p) => s + (p.quizScore / p.quizTotal) * 100, 0) / quizScores.length)
    : null
  const overallPct = Math.round((readCount / total) * 100)

  const scCompleted = Object.values(scProgress).filter(s => s.completed).length
  const scTotal = scenarios.length

  const CIRC = 326.7
  const dash = (overallPct / 100) * CIRC

  return (
    <div className="page progress-page">
      <div className="progress-page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Progress Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Track your path to the L4 SysDE
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          style={{ color: 'var(--coral)', borderColor: 'var(--coral)', flexShrink: 0 }}
        >
          Reset Progress
        </button>
      </div>

      <div className="progress-overview">
        <div className="progress-ring-card">
          <svg viewBox="0 0 120 120" className="progress-ring">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#ringGrad)" strokeWidth="8"
              strokeDasharray={`${dash} ${CIRC}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="progress-ring-fill"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--lavender)" />
                <stop offset="100%" stopColor="var(--rose)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="progress-ring-text">
            <span className="ring-pct">{overallPct}%</span>
            <span className="ring-label">Complete</span>
          </div>
        </div>

        <div className="progress-stats">
          <div className="pstat">
            <span className="pstat-val" style={{ color: 'var(--mint)' }}>{readCount}</span>
            <span className="pstat-label">Chapters Read</span>
          </div>
          <div className="pstat">
            <span className="pstat-val" style={{ color: 'var(--lavender)' }}>{quizCount}</span>
            <span className="pstat-label">Quizzes Taken</span>
          </div>
          <div className="pstat">
            <span className="pstat-val" style={{ color: 'var(--amber)' }}>{avgScore !== null ? `${avgScore}%` : '—'}</span>
            <span className="pstat-label">Avg Quiz Score</span>
          </div>
          <div className="pstat">
            <span className="pstat-val" style={{ color: 'var(--sky)' }}>{labCount}</span>
            <span className="pstat-label">Labs Passed</span>
          </div>
          <div className="pstat">
            <span className="pstat-val" style={{ color: 'var(--rose)' }}>{scCompleted}/{scTotal}</span>
            <span className="pstat-label">Scenarios Done</span>
          </div>
        </div>
      </div>

      <div className="progress-table" style={{ marginTop: '2rem' }}>
        <div className="ptable-header">
          <span>Chapter</span>
          <span style={{ textAlign: 'center' }}>Read</span>
          <span style={{ textAlign: 'center' }}>Lab</span>
          <span style={{ textAlign: 'center' }}>Quiz</span>
          <span>Progress</span>
        </div>
        {chapters.map(c => {
          const p = progress[c.id] || {}
          const read = p.read ? 1 : 0
          const lab = p.labComplete ? 1 : 0
          const quiz = p.quizScore != null ? 1 : 0
          const score = quiz ? Math.round((p.quizScore / p.quizTotal) * 100) : null
          const pct = ((read + lab + quiz) / 3) * 100

          return (
            <div key={c.id} className="ptable-row">
              <Link to={`/chapters/${c.id}`} className="ptable-col-ch">
                <span className="ptable-num">{String(c.order).padStart(2, '0')}</span>
                {c.title}
              </Link>
              <span className="ptable-col">
                {p.read ? <span className="check green">✓</span> : <span className="check dim">—</span>}
              </span>
              <span className="ptable-col">
                {p.labComplete ? <span className="check green">✓</span> : <span className="check dim">—</span>}
              </span>
              <span className="ptable-col">
                {score !== null
                  ? <span className={score >= 70 ? 'check green' : 'check amber'}>{score}%</span>
                  : <span className="check dim">—</span>}
              </span>
              <span className="ptable-col-bar">
                <div className="mini-bar">
                  <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </span>
            </div>
          )
        })}
      </div>

      {scTotal > 0 && (
        <div className="progress-table" style={{ marginTop: '2rem' }}>
          <div className="ptable-header">
            <span>Scenario</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Commands</span>
            <span>Difficulty</span>
          </div>
          {scenarios.map(s => {
            const sp = scProgress[s.id]
            return (
              <div key={s.id} className="ptable-row">
                <Link to={`/scenarios/${s.id}`} className="ptable-col-ch">{s.title}</Link>
                <span className="ptable-col">
                  {sp?.completed ? <span className="check green">✓</span> : <span className="check dim">—</span>}
                </span>
                <span className="ptable-col">
                  {sp?.commandsUsed
                    ? <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{sp.commandsUsed}</span>
                    : <span className="check dim">—</span>}
                </span>
                <span className="ptable-col">
                  <span className={`sc-diff sc-diff-${s.difficulty}`} style={{ fontSize: '0.75rem' }}>{s.difficulty}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
