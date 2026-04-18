import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getChapter, getChapters, getProgress, saveProgress } from '../api/client'
import CodeBlock from '../components/CodeBlock'

function QABlock({ question, answerElements }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="qa-block">
      <button className="qa-question" onClick={() => setOpen(!open)}>
        <span className="qa-icon" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        <span>{formatInline(question)}</span>
      </button>
      {open && <div className="qa-answer">{answerElements}</div>}
    </div>
  )
}

function renderMarkdown(content) {
  if (!content) return null
  const lines = content.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### Q:') || line.startsWith('### Q ')) {
      const question = line.replace(/^###\s*/, '')
      i++
      const answerLines = []
      while (
        i < lines.length &&
        !lines[i].startsWith('### Q:') &&
        !lines[i].startsWith('### Q ') &&
        lines[i].trim() !== '---'
      ) {
        answerLines.push(lines[i])
        i++
      }
      if (i < lines.length && lines[i].trim() === '---') i++
      const answerElements = renderMarkdownBlock(answerLines)
      elements.push(<QABlock key={elements.length} question={question} answerElements={answerElements} />)
      continue
    }

    if (line.trim() === '---') {
      elements.push(<hr key={elements.length} className="md-hr" />)
      i++
      continue
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'bash'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      elements.push(
        <CodeBlock key={elements.length} language={lang}>
          {codeLines.join('\n')}
        </CodeBlock>
      )
      continue
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={elements.length} className="md-h1">{line.slice(2)}</h1>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      const text = line.slice(3)
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      elements.push(<h2 key={elements.length} id={id} className="md-h2">{text}</h2>)
      i++; continue
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={elements.length} className="md-h3">{line.slice(4)}</h3>)
      i++; continue
    }

    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim())
        tableRows.push(cells)
        i++
      }
      const header = tableRows[0]
      const body = tableRows.filter((_, idx) => idx > 1)
      elements.push(
        <div key={elements.length} className="table-wrap">
          <table className="md-table">
            <thead>
              <tr>{header.map((h, j) => <th key={j}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{formatInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={elements.length} className="md-list">
          {items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}
        </ul>
      )
      continue
    }

    if (!line.trim()) { i++; continue }
    elements.push(<p key={elements.length} className="md-p">{formatInline(line)}</p>)
    i++
  }

  return elements
}

function renderMarkdownBlock(lines) {
  const elements = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'bash'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      i++
      elements.push(<CodeBlock key={elements.length} language={lang}>{codeLines.join('\n')}</CodeBlock>)
      continue
    }
    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++ }
      elements.push(
        <ul key={elements.length} className="md-list">
          {items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}
        </ul>
      )
      continue
    }
    if (!line.trim()) { i++; continue }
    elements.push(<p key={elements.length} className="md-p">{formatInline(line)}</p>)
    i++
  }
  return elements
}

function formatInline(text) {
  if (typeof text !== 'string') return text
  const parts = []
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|_(.+?)_)/g
  let last = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>)
    else if (match[3]) parts.push(<code key={match.index} className="inline-code">{match[3]}</code>)
    else if (match[4]) parts.push(<em key={match.index}>{match[4]}</em>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

function extractTOC(content) {
  if (!content) return []
  return content.split('\n')
    .filter(l => l.startsWith('## '))
    .map(l => {
      const text = l.slice(3)
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      return { text, id }
    })
    .slice(0, 12) // cap at 12 entries
}

function estimateReadTime(content) {
  if (!content) return 1
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function ChapterDetail() {
  const { id } = useParams()
  const [chapter, setChapter] = useState(null)
  const [chapters, setChapters] = useState([])
  const [progress, setProgress] = useState({})

  useEffect(() => {
    getChapter(id).then(setChapter)
    getChapters().then(setChapters)
    getProgress().then(setProgress)
  }, [id])

  if (!chapter) {
    return (
      <div className="page">
        <div className="loading">
          <div className="loading-spinner" />
          Loading chapter...
        </div>
      </div>
    )
  }

  const sorted = [...chapters].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex(c => c.id === id)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null
  const isRead = progress[id]?.read
  const toc = extractTOC(chapter.content)
  const readTime = estimateReadTime(chapter.content)

  const markComplete = async () => {
    await saveProgress({ [id]: { ...progress[id], read: true } })
    setProgress(p => ({ ...p, [id]: { ...p[id], read: true } }))
  }

  return (
    <div className="page chapter-detail">
      <div className="chapter-nav-top">
        <Link to="/chapters" className="back-link">← All Chapters</Link>
        <span className="chapter-badge">
          Ch {chapter.order}/{chapters.length} · ~{readTime} min read
        </span>
      </div>

      {toc.length > 1 && (
        <div className="chapter-toc">
          <div className="chapter-toc-title">In this chapter</div>
          <ul className="chapter-toc-list">
            {toc.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <article className="chapter-content">
        {renderMarkdown(chapter.content)}
      </article>

      <div className="chapter-actions">
        <div className="chapter-links">
          <Link to={`/labs/${id}`} className="btn btn-secondary">⌨️ Labs</Link>
          <Link to={`/quizzes/${id}`} className="btn btn-secondary">🧠 Quiz</Link>
        </div>
        {!isRead ? (
          <button className="btn btn-primary" onClick={markComplete}>
            ✓ Mark as Complete
          </button>
        ) : (
          <span className="completed-badge">✓ Completed</span>
        )}
      </div>

      <div className="chapter-nav-bottom">
        {prev ? (
          <Link to={`/chapters/${prev.id}`} className="nav-prev">
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/chapters/${next.id}`} className="nav-next">
            {next.title} →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
