import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getLabs } from '../api/client';
import Terminal from '../components/Terminal';

export default function LabView() {
  const { chapterId } = useParams();
  const [labs, setLabs] = useState([]);
  const [activeLab, setActiveLab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  useEffect(() => {
    getLabs(chapterId).then(data => { setLabs(data); setActiveLab(0); setActiveStep(0); setCompletedSteps(new Set()); });
  }, [chapterId]);

  if (!labs.length) return <div className="page"><div className="loading">Loading labs...</div></div>;

  const lab = labs[activeLab];
  const steps = lab?.steps || [];

  const handleRun = (stepIdx) => {
    setCompletedSteps(prev => new Set([...prev, `${activeLab}-${stepIdx}`]));
    if (stepIdx < steps.length - 1) {
      setTimeout(() => setActiveStep(stepIdx + 1), 500);
    }
  };

  return (
    <div className="page lab-page">
      <div className="lab-header">
        <Link to={`/chapters/${chapterId}`} className="back-link">← Back to Chapter</Link>
        <h1 className="page-title">Labs</h1>
      </div>

      <div className="lab-tabs">
        {labs.map((l, i) => (
          <button key={l.id} className={`lab-tab ${i === activeLab ? 'active' : ''}`}
            onClick={() => { setActiveLab(i); setActiveStep(0); }}>
            {l.title}
          </button>
        ))}
      </div>

      <div className="lab-content">
        <div className="lab-info">
          <h2>{lab.title}</h2>
          <p className="lab-desc">{lab.description}</p>
          <div className="lab-progress-bar">
            <div className="lab-progress-fill" style={{ width: `${(Object.keys([...completedSteps].filter(k => k.startsWith(`${activeLab}-`))).length / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="lab-steps">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.has(`${activeLab}-${i}`);
            const isCurrent = i === activeStep;
            const isLocked = i > activeStep && !isCompleted;

            return (
              <div key={i} className={`lab-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}>
                <div className="step-header">
                  <span className="step-num">{isCompleted ? '✓' : i + 1}</span>
                  <span className="step-instruction">{step.instruction}</span>
                </div>
                {(isCurrent || isCompleted) && (
                  <Terminal
                    command={step.command}
                    output={step.expectedOutput || '(no output)'}
                    isActive={isCurrent && !isCompleted}
                    onRun={() => handleRun(i)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
