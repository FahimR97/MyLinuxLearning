import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getChapters, getProgress } from '../api/client'

export default function ChapterList() {
  const [chapters, setChapters] = useState([])
  const [progress, setProgress] = useState({})

  useEffect(() => {
    getChapters().then(setChapters)
    getProgress().then(setProgress)
  }, [])

  const readCount = Object.keys(progress).filter(k => progress[k]?.read).length
  const quizCount = Object.keys(progress).filter(k => progress[k]?.quizScore != null).length

  return (
    <div className="page">
      <h1 className="page-title">Chapters</h1>
      <p className="page-subtitle">
        {chapters.length} chapters · {readCount} read · {quizCount} quizzed
      </p>
      <div className="chapter-grid">
        {chapters.map(c => {
          const p = progress[c.id] || {}
          const isRead = p.read
          const hasQuiz = p.quizScore != null
          const score = hasQuiz ? Math.round((p.quizScore / p.quizTotal) * 100) : null

          return (
            <Link
              to={`/chapters/${c.id}`}
              key={c.id}
              className={`chapter-card ${isRead ? 'completed' : ''}`}
            >
              <div className="chapter-card-header">
                <span className="chapter-order">{String(c.order).padStart(2, '0')}</span>
                <div className="badge-row">
                  {isRead && <span className="badge badge-mint">✓ Read</span>}
                  {score !== null && (
                    <span className={`badge ${score >= 70 ? 'badge-lavender' : 'badge-amber'}`}>
                      {score}%
                    </span>
                  )}
                </div>
              </div>
              <h3 className="chapter-card-title">{c.title}</h3>
              <p className="chapter-card-desc">{c.description}</p>
              <div className="chapter-card-footer">
                <Link
                  to={`/labs/${c.id}`}
                  className="chip"
                  onClick={e => e.stopPropagation()}
                >
                  ⌨️ Labs
                </Link>
                <Link
                  to={`/quizzes/${c.id}`}
                  className="chip"
                  onClick={e => e.stopPropagation()}
                >
                  🧠 Quiz
                </Link>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
