import { useState, useEffect, useRef } from 'react';

export default function Terminal({ command, output, onRun, isActive = true }) {
  const [showOutput, setShowOutput] = useState(false);
  const [displayedOutput, setDisplayedOutput] = useState('');
  const outputRef = useRef(null);

  useEffect(() => {
    if (!showOutput || !output) return;
    let i = 0;
    const text = output;
    setDisplayedOutput('');
    const interval = setInterval(() => {
      i += 3;
      setDisplayedOutput(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [showOutput, output]);

  const handleRun = () => {
    setShowOutput(true);
    onRun?.();
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">terminal</span>
      </div>
      <div className="terminal-body">
        <div className="terminal-line">
          <span className="terminal-prompt">$</span>
          <span className="terminal-command">{command}</span>
        </div>
        {showOutput && output && (
          <div className="terminal-output" ref={outputRef}>{displayedOutput}</div>
        )}
        {!showOutput && isActive && (
          <button className="terminal-run-btn" onClick={handleRun}>▶ Run</button>
        )}
      </div>
    </div>
  );
}
