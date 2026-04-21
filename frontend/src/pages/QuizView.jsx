import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { getQuiz, submitQuiz, getProgress, saveProgress } from '../api/client'

const REVIEW_KEY = 'fll-review-flags'

function getFlags() {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}') } catch { return {} }
}
function toggleFlag(question) {
  const flags = getFlags()
  if (flags[question]) delete flags[question]
  else flags[question] = true
  localStorage.setItem(REVIEW_KEY, JSON.stringify(flags))
  return { ...flags }
}

export default function QuizView() {
  const { chapterId } = useParams()
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [flags, setFlags] = useState(getFlags)

  useEffect(() => {
    getQuiz(chapterId).then(data => {
      setQuestions(data)
      setCurrent(0)
      setAnswers({})
      setResults(null)
    })
  }, [chapterId])

  const handleSelect = useCallback((optionIdx) => {
    setAnswers(prev => ({ ...prev, [current]: optionIdx }))
  }, [current])

  const handleNext = useCallback(() => {
    if (current < questions.length - 1) setCurrent(c => c + 1)
  }, [current, questions.length])

  const handlePrev = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1)
  }, [current])

  useEffect(() => {
    const handleKey = (e) => {
      if (results) return
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1
        if (idx < (questions[current]?.options?.length || 0)) handleSelect(idx)
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (answers[current] != null) handleNext()
      }
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [results, current, questions, answers, handleSelect, handleNext, handlePrev])

  const handleSubmit = async () => {
    setSubmitting(true)
    const answerArray = questions.map((_, i) => answers[i] ?? -1)
    const res = await submitQuiz(chapterId, answerArray)
    setResults(res)
    const prog = await getProgress()
    await saveProgress({ [chapterId]: { ...prog[chapterId], quizScore: res.score, quizTotal: res.total } })
    setSubmitting(false)
  }

  const handleRetry = () => {
    setCurrent(0)
    setAnswers({})
    setResults(null)
  }

  if (!questions.length) {
    return (
      <div className="page">
        <div className="loading">
          <div className="loading-spinner" />
          Loading quiz...
        </div>
      </div>
    )
  }

  if (results) {
    const pct = Math.round((results.score / results.total) * 100)
    const passed = pct >= 70
    const flagCount = Object.keys(flags).length

    return (
      <div className="page quiz-page">
        <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>
        <div className="quiz-results">
          <h1 className="results-title">Quiz Results</h1>
          <div className={`results-score ${passed ? 'pass' : 'fail'}`}>
            <div className="score-circle">
              <span className="score-pct">{pct}%</span>
              <span className="score-detail">{results.score}/{results.total} correct</span>
            </div>
            <p className="score-msg">
              {passed
                ? pct === 100 ? '🏆 Perfect score!' : '✓ Passed — solid performance'
                : '✗ Below 70% — review the chapter and retry'}
            </p>
            {flagCount > 0 && (
              <p className="review-flag-note">⚑ {flagCount} question{flagCount !== 1 ? 's' : ''} flagged for review</p>
            )}
          </div>

          <div className="results-list">
            {results.results.map((r, i) => {
              const q = questions[i]
              const yourText = q?.options?.[r.yourAnswer] ?? 'Not answered'
              const correctText = q?.options?.[r.correctAnswer]
              const isFlagged = !!flags[r.question]

              return (
                <div key={i} className={`result-item ${r.correct ? 'correct' : 'incorrect'}`}>
                  <div className="result-header">
                    <span className="result-icon">{r.correct ? '✓' : '✗'}</span>
                    <span className="result-q">{r.question}</span>
                    <button
                      className={`review-flag-btn ${isFlagged ? 'flagged' : ''}`}
                      onClick={() => setFlags(toggleFlag(r.question))}
                      title={isFlagged ? 'Remove review flag' : 'Flag for review'}
                    >⚑</button>
                  </div>
                  {!r.correct && (
                    <div className="result-answer-detail">
                      <div className="result-your-answer">
                        <span className="result-answer-label">Your answer:</span>
                        <span className="result-answer-wrong">{yourText}</span>
                      </div>
                      <div className="result-correct-answer">
                        <span className="result-answer-label">Correct:</span>
                        <span className="result-answer-right">{correctText}</span>
                      </div>
                    </div>
                  )}
                  {r.explanation && (
                    <p className="result-explanation">{r.explanation}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="results-actions">
            <button className="btn btn-primary" onClick={handleRetry}>↺ Retry Quiz</button>
            <Link to={`/chapters/${chapterId}`} className="btn btn-secondary">Back to Chapter</Link>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length
  const isLast = current === questions.length - 1
  const isFlagged = !!flags[q?.question]

  return (
    <div className="page quiz-page">
      <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>

      <div className="quiz-container">
        <div className="quiz-progress">
          <div className="quiz-progress-header">
            <span className="quiz-progress-label">Question {current + 1} of {questions.length}</span>
            <span className="quiz-progress-count">{answeredCount}/{questions.length} answered</span>
          </div>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="quiz-dots">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`quiz-dot ${i === current ? 'current' : answers[i] != null ? 'answered' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </div>

        <div className="quiz-question">
          <div className="quiz-question-header">
            <h2>{q.question}</h2>
            <button
              className={`review-flag-btn ${isFlagged ? 'flagged' : ''}`}
              onClick={() => setFlags(toggleFlag(q.question))}
              title={isFlagged ? 'Remove review flag' : 'Flag for review'}
            >⚑</button>
          </div>
          <p className="quiz-kbd-hint">
            Press <span className="kbd">1</span>–<span className="kbd">4</span> to select
            · <span className="kbd">→</span> next · <span className="kbd">←</span> previous
          </p>
          <div className="quiz-options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`quiz-option ${answers[current] === i ? 'selected' : ''}`}
                onClick={() => handleSelect(i)}
              >
                <span className="option-letter">{i + 1}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-nav">
          <button
            className="btn btn-secondary"
            disabled={current === 0}
            onClick={handlePrev}
          >
            ← Previous
          </button>

          {!isLast ? (
            <button
              className="btn btn-primary"
              disabled={answers[current] == null}
              onClick={handleNext}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
              title={!allAnswered ? `${questions.length - answeredCount} questions unanswered` : ''}
            >
              {submitting ? 'Submitting...' : `Submit (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
