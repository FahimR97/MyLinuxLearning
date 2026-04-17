import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getChapter, getChapters, getProgress, saveProgress } from '../api/client';
import CodeBlock from '../components/CodeBlock';

function renderMarkdown(content) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'bash';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(<CodeBlock key={elements.length} language={lang}>{codeLines.join('\n')}</CodeBlock>);
      continue;
    }

    // Headers
    if (line.startsWith('# ')) { elements.push(<h1 key={elements.length} className="md-h1">{line.slice(2)}</h1>); i++; continue; }
    if (line.startsWith('## ')) { elements.push(<h2 key={elements.length} className="md-h2">{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith('### ')) { elements.push(<h3 key={elements.length} className="md-h3">{line.slice(4)}</h3>); i++; continue; }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
        tableRows.push(cells);
        i++;
      }
      // Remove separator row
      const header = tableRows[0];
      const body = tableRows.filter((_, idx) => idx > 1);
      elements.push(
        <div key={elements.length} className="table-wrap">
          <table className="md-table">
            <thead><tr>{header.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
            <tbody>{body.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{formatInline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    // List items
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(<ul key={elements.length} className="md-list">{items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}</ul>);
      continue;
    }

    // Empty line
    if (!line.trim()) { i++; continue; }

    // Paragraph
    elements.push(<p key={elements.length} className="md-p">{formatInline(line)}</p>);
    i++;
  }

  return elements;
}

function formatInline(text) {
  // Bold, code, italic
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|_(.+?)_)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3]) parts.push(<code key={match.index} className="inline-code">{match[3]}</code>);
    else if (match[4]) parts.push(<em key={match.index}>{match[4]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

export default function ChapterDetail() {
  const { id } = useParams();
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    getChapter(id).then(setChapter);
    getChapters().then(setChapters);
    getProgress().then(setProgress);
  }, [id]);

  if (!chapter) return <div className="page"><div className="loading">Loading...</div></div>;

  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex(c => c.id === id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const isRead = progress[id]?.read;

  const markComplete = async () => {
    await saveProgress({ [id]: { ...progress[id], read: true } });
    setProgress(p => ({ ...p, [id]: { ...p[id], read: true } }));
  };

  return (
    <div className="page chapter-detail">
      <div className="chapter-nav-top">
        <Link to="/chapters" className="back-link">← All Chapters</Link>
        <span className="chapter-badge">Chapter {chapter.order} of {chapters.length}</span>
      </div>

      <article className="chapter-content">
        {renderMarkdown(chapter.content)}
      </article>

      <div className="chapter-actions">
        <div className="chapter-links">
          <Link to={`/labs/${id}`} className="btn btn-secondary">🖥️ Labs</Link>
          <Link to={`/quizzes/${id}`} className="btn btn-secondary">✅ Quiz</Link>
        </div>
        {!isRead ? (
          <button className="btn btn-primary" onClick={markComplete}>Mark as Complete ✓</button>
        ) : (
          <span className="completed-badge">✓ Completed</span>
        )}
      </div>

      <div className="chapter-nav-bottom">
        {prev ? <Link to={`/chapters/${prev.id}`} className="nav-prev">← {prev.title}</Link> : <span />}
        {next ? <Link to={`/chapters/${next.id}`} className="nav-next">{next.title} →</Link> : <span />}
      </div>
    </div>
  );
}
