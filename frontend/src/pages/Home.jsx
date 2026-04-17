import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getChapters, getProgress } from '../api/client';

export default function Home() {
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    getChapters().then(setChapters);
    getProgress().then(setProgress);
  }, []);

  const completedChapters = Object.keys(progress).filter(k => progress[k]?.read).length;
  const completedQuizzes = Object.keys(progress).filter(k => progress[k]?.quizScore != null).length;
  const avgScore = completedQuizzes > 0
    ? Math.round(Object.values(progress).filter(p => p?.quizScore != null).reduce((s, p) => s + (p.quizScore / p.quizTotal) * 100, 0) / completedQuizzes)
    : 0;

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">
          <span className="hero-prompt">$</span> Linux Learning Lab
          <span className="hero-cursor">_</span>
        </h1>
        <p className="hero-subtitle">Master Linux system administration for your SysDE interview. 12 chapters of hands-on learning with interactive labs and quizzes.</p>
        <div className="hero-actions">
          <Link to="/chapters" className="btn btn-primary">Start Learning →</Link>
          <Link to="/progress" className="btn btn-secondary">View Progress</Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>12 Chapters</h3>
          <p>Comprehensive textbook covering file permissions, processes, networking, bash scripting, and more.</p>
          <Link to="/chapters" className="feature-link">Browse Chapters →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🖥️</div>
          <h3>50 Interactive Labs</h3>
          <p>Hands-on exercises with simulated terminal output. Practice real commands step by step.</p>
          <Link to="/chapters" className="feature-link">Start a Lab →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">✅</div>
          <h3>72 Quiz Questions</h3>
          <p>Test your knowledge with multiple-choice questions and detailed explanations.</p>
          <Link to="/chapters" className="feature-link">Take a Quiz →</Link>
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">Your Progress</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{completedChapters}<span className="stat-total">/{chapters.length}</span></div>
            <div className="stat-label">Chapters Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedQuizzes}<span className="stat-total">/{chapters.length}</span></div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgScore}<span className="stat-total">%</span></div>
            <div className="stat-label">Avg Quiz Score</div>
          </div>
        </div>
      </section>
    </div>
  );
}
