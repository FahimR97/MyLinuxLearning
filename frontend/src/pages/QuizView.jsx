import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getQuiz, submitQuiz, getProgress, saveProgress } from '../api/client';

export default function QuizView() {
  const { chapterId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuiz(chapterId).then(data => { setQuestions(data); setCurrent(0); setAnswers({}); setResults(null); });
  }, [chapterId]);

  if (!questions.length) return <div className="page"><div className="loading">Loading quiz...</div></div>;

  const handleSelect = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [current]: optionIdx }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const answerArray = questions.map((_, i) => answers[i] ?? -1);
    const res = await submitQuiz(chapterId, answerArray);
    setResults(res);
    // Save score to progress
    const progress = await getProgress();
    await saveProgress({ [chapterId]: { ...progress[chapterId], quizScore: res.score, quizTotal: res.total } });
    setSubmitting(false);
  };

  const handleRetry = () => {
    setCurrent(0);
    setAnswers({});
    setResults(null);
  };

  // Results view
  if (results) {
    const pct = Math.round((results.score / results.total) * 100);
    return (
      <div className="page quiz-page">
        <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>
        <div className="quiz-results">
          <h1 className="results-title">Quiz Results</h1>
          <div className={`results-score ${pct >= 70 ? 'pass' : 'fail'}`}>
            <div className="score-circle">
              <span className="score-pct">{pct}%</span>
              <span className="score-detail">{results.score}/{results.total}</span>
            </div>
            <p className="score-msg">{pct >= 70 ? 'Great job! 🎉' : 'Keep studying! 💪'}</p>
          </div>
          <div className="results-list">
            {results.results.map((r, i) => (
              <div key={i} className={`result-item ${r.correct ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="result-icon">{r.correct ? '✓' : '✗'}</span>
                  <span className="result-q">{r.question}</span>
                </div>
                {!r.correct && <p className="result-explanation">{r.explanation}</p>}
              </div>
            ))}
          </div>
          <div className="results-actions">
            <button className="btn btn-primary" onClick={handleRetry}>Retry Quiz</button>
            <Link to={`/chapters/${chapterId}`} className="btn btn-secondary">Back to Chapter</Link>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="page quiz-page">
      <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>
      <div className="quiz-container">
        <div className="quiz-progress">
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="quiz-progress-text">{current + 1} / {questions.length}</span>
        </div>

        <div className="quiz-question">
          <h2>{q.question}</h2>
          <div className="quiz-options">
            {q.options.map((opt, i) => (
              <button key={i} className={`quiz-option ${answers[current] === i ? 'selected' : ''}`} onClick={() => handleSelect(i)}>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-nav">
          <button className="btn btn-secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Previous</button>
          {current < questions.length - 1 ? (
            <button className="btn btn-primary" disabled={answers[current] == null} onClick={() => setCurrent(c => c + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary" disabled={Object.keys(answers).length < questions.length || submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
