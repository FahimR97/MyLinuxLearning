import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getChapters, getProgress } from '../api/client'

export default function Home() {
  const [chapters, setChapters] = useState([])
  const [progress, setProgress] = useState({})

  useEffect(() => {
    getChapters().then(setChapters)
    getProgress().then(setProgress)
  }, [])

  const completedChapters = Object.keys(progress).filter(k => progress[k]?.read).length
  const completedQuizzes = Object.keys(progress).filter(k => progress[k]?.quizScore != null).length
  const avgScore = completedQuizzes > 0
    ? Math.round(
        Object.values(progress)
          .filter(p => p?.quizScore != null)
          .reduce((s, p) => s + (p.quizScore / p.quizTotal) * 100, 0)
        / completedQuizzes
      )
    : null

  const nextChapter = chapters.find(c => !progress[c.id]?.read)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-glow" />
        <p className="hero-greeting">
          <span className="hero-greeting-dot" />
          {greeting}, Fahim
        </p>
        <h1 className="hero-title">
          Master Linux for your{' '}
          <span className="hero-title-gradient">AWS L4 SysDE</span>
          {' '}interview
        </h1>
        <p className="hero-subtitle">
          17 chapters of deep technical knowledge — from inodes and the OOM killer
          to VPCs, RAID, and systemd. Labs to build muscle memory. Quizzes to test recall.
        </p>
        <div className="hero-actions">
          <Link to="/chapters" className="btn btn-primary">Browse Chapters →</Link>
          <Link to="/progress" className="btn btn-secondary">View Progress</Link>
        </div>
      </section>

      {nextChapter && (
        <>
          <p className="section-title">Continue</p>
          <Link to={`/chapters/${nextChapter.id}`} className="continue-card">
            <div>
              <div className="continue-label">Next unread chapter</div>
              <div className="continue-title">{nextChapter.title}</div>
              <div className="continue-sub">
                Chapter {nextChapter.order} of {chapters.length}
              </div>
            </div>
            <span className="btn btn-primary" style={{ flexShrink: 0 }}>Continue →</span>
          </Link>
        </>
      )}

      <p className="section-title">Your Progress</p>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">
            {completedChapters}
            <span className="stat-total">/{chapters.length}</span>
          </div>
          <div className="stat-label">Chapters Read</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {completedQuizzes}
            <span className="stat-total">/{chapters.length}</span>
          </div>
          <div className="stat-label">Quizzes Taken</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {avgScore !== null ? avgScore : '—'}
            {avgScore !== null && <span className="stat-total">%</span>}
          </div>
          <div className="stat-label">Avg Quiz Score</div>
        </div>
      </div>

      <p className="section-title" style={{ marginTop: '2rem' }}>What's inside</p>
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>{chapters.length} Deep Chapters</h3>
          <p>
            Linux internals, processes, filesystems, networking, VPCs, RAID,
            boot process, systemd, and an interview Q&A bank.
          </p>
          <Link to="/chapters" className="feature-link">Browse Chapters →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⌨️</div>
          <h3>71 Hands-on Labs</h3>
          <p>
            Step-by-step terminal exercises with real commands and expected output.
            Build the muscle memory interviewers test for.
          </p>
          <Link to="/chapters" className="feature-link">Start a Lab →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>121 Quiz Questions</h3>
          <p>
            Multiple-choice questions written at L4 SysDE depth with full
            explanations — not surface-level trivia.
          </p>
          <Link to="/chapters" className="feature-link">Take a Quiz →</Link>
        </div>
      </div>
    </div>
  )
}
