'use client'

import { useEffect, useState, useCallback } from 'react'

/* ── Types ──────────────────────────────────────────────── */
interface Question {
  type: string
  q: string
  options: string[]
  answer: number
  explanation: string
}

interface TopicMeta {
  title: string
  cert: string
  roadmap: string
  subtopic: string
  difficulty: string
  content: string
  order?: number
  tags?: string[]
  questions: Question[]
}

interface TopicEntry {
  slug: string
  cert: string
  roadmap: string
  subtopicSlug: string
  meta: TopicMeta
  mdContent: string
}

interface ContentData {
  topics: TopicEntry[]
  tree: Record<string, Record<string, TopicEntry[]>>
}

/* ── Simple MD renderer ─────────────────────────────────── */
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${code.trimEnd()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\| (.+) \|$/gm, (row) => {
      const cells = row.split('|').slice(1, -1)
      return '<tr>' + cells.map(c => {
        const t = c.trim()
        return t.match(/^[-:]+$/) ? '' : `<td>${t}</td>`
      }).filter(Boolean).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m =>
      `<table><tbody>${m.replace(/<tr><td>/g, '<tr><th>').replace(/<\/td><\/tr>/, '</th></tr>').slice(0, '<tr><th>'.length) === '<tr><th>' ? '<thead>' + m.split('\n')[0] + '</thead><tbody>' + m.split('\n').slice(1).join('\n') + '</tbody>' : m}</tbody></table>`)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '\n\n')
    .split('\n\n')
    .map(block => {
      if (/^<(h[1-6]|pre|ul|ol|table|li)/.test(block.trim())) return block
      const t = block.trim()
      return t ? `<p>${t.replace(/\n/g, '<br/>')}</p>` : ''
    })
    .join('\n')
}

/* ── Quiz component ─────────────────────────────────────── */
function Quiz({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(questions.length).fill(null)
  )
  const [revealed, setRevealed] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)

  const handleAnswer = (qIdx: number, optIdx: number) => {
    if (answers[qIdx] !== null) return
    const next = [...answers]
    next[qIdx] = optIdx
    setAnswers(next)
    if (qIdx === currentQ && qIdx < questions.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 800)
    }
  }

  const score = answers.filter((a, i) => a === questions[i].answer).length
  const answered = answers.filter(a => a !== null).length
  const allAnswered = answered === questions.length

  const reset = () => {
    setAnswers(new Array(questions.length).fill(null))
    setRevealed(false)
    setCurrentQ(0)
  }

  return (
    <div className="quiz-section">
      <div className="quiz-header">
        <h2>Practice Quiz</h2>
        <span className="quiz-count">{questions.length} questions</span>
      </div>

      <div className="quiz-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">{answered} / {questions.length}</span>
      </div>

      {allAnswered && (
        <div className="quiz-result" style={{ marginBottom: '1.5rem' }}>
          <div className="quiz-result-score">{score}/{questions.length}</div>
          <p>
            {score === questions.length
              ? '🎉 Perfect score! You nailed it.'
              : score >= questions.length / 2
              ? '✅ Good job! Review the ones you missed.'
              : '📖 Keep studying — you\'ll get there!'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={reset}>Try Again</button>
            {!revealed && (
              <button className="btn btn-ghost" onClick={() => setRevealed(true)}>
                Show All Answers
              </button>
            )}
          </div>
        </div>
      )}

      {questions.map((q, qi) => {
        const selected = answers[qi]
        const isAnswered = selected !== null
        const isVisible = qi <= currentQ || revealed || isAnswered

        if (!isVisible) return null

        return (
          <div key={qi} className="question-card">
            <div className="question-num">
              Question {qi + 1}
              <span className="question-type-badge">{q.type}</span>
            </div>
            <div className="question-text">{q.q}</div>
            <div className="options">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer
                const isSelected = selected === oi
                let cls = 'option-btn'
                if (isAnswered || revealed) {
                  if (isSelected && isCorrect) cls += ' selected-correct'
                  else if (isSelected && !isCorrect) cls += ' selected-wrong'
                  else if (isCorrect && (revealed || isAnswered)) cls += ' reveal-correct'
                }
                return (
                  <button
                    key={oi}
                    className={cls}
                    disabled={isAnswered}
                    onClick={() => handleAnswer(qi, oi)}
                    id={`q${qi}-opt${oi}`}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
            {(isAnswered || revealed) && (
              <div className="explanation">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Sidebar ────────────────────────────────────────────── */
function Sidebar({
  tree,
  activeTopic,
  onSelect,
}: {
  tree: Record<string, Record<string, TopicEntry[]>>
  activeTopic: TopicEntry | null
  onSelect: (t: TopicEntry) => void
}) {
  const certOrder = ['cka', 'ckad', 'cks', 'kcna']
  const certs = [...new Set([...certOrder, ...Object.keys(tree)])]
    .filter(c => tree[c])

  return (
    <nav className="sidebar">
      <div className="sidebar-section">Certifications</div>
      <div className="sidebar-scroll">
        {certs.map(cert => (
          <div key={cert} className="cert-group">
            <div className="cert-label">
              <span className={`cert-badge ${cert}`}>{cert.toUpperCase()}</span>
              {cert === 'cka'  && 'Kubernetes Administrator'}
              {cert === 'ckad' && 'Application Developer'}
              {cert === 'cks'  && 'Security Specialist'}
              {cert === 'kcna' && 'Cloud Native Associate'}
            </div>
            {Object.entries(tree[cert] || {}).map(([roadmap, topics]) => (
              <div key={roadmap} className="roadmap-group">
                <div className="roadmap-label">📂 {roadmap}</div>
                {topics.map(t => (
                  <button
                    key={t.slug}
                    className={`topic-link ${activeTopic?.slug === t.slug ? 'active' : ''}`}
                    onClick={() => onSelect(t)}
                    id={`sidebar-${t.slug.replace(/\//g, '-')}`}
                  >
                    <span className={`diff-dot ${t.meta.difficulty}`} />
                    {t.meta.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}

/* ── Main Page ──────────────────────────────────────────── */
export default function Home() {
  const [data, setData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTopic, setActiveTopic] = useState<TopicEntry | null>(null)

  useEffect(() => {
    fetch('/api/content')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = useCallback((t: TopicEntry) => {
    setActiveTopic(t)
  }, [])

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <span className="header-logo-badge">k8s</span>
          <span className="header-logo-text">learn</span>
        </div>
        <span className="header-tagline">
          {loading ? 'Loading content…' : data
            ? `${data.topics.length} topic${data.topics.length !== 1 ? 's' : ''} across ${Object.keys(data.tree).length} cert${Object.keys(data.tree).length !== 1 ? 's' : ''}`
            : 'Kubernetes Certification Learning Platform'
          }
        </span>
      </header>

      <div className="main">
        {/* Sidebar */}
        {data && (
          <Sidebar
            tree={data.tree}
            activeTopic={activeTopic}
            onSelect={handleSelect}
          />
        )}

        {/* Content */}
        <main className="content-area">
          <div className="content-scroll">
            {loading && (
              <div className="loading">
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Reading content repository…
                </p>
              </div>
            )}

            {error && (
              <div className="error-box" style={{ marginTop: '2rem' }}>
                ⚠️ <strong>Could not load content:</strong> {error}
                <br />
                <small>Make sure the content submodule is present at <code>content/</code></small>
              </div>
            )}

            {!loading && !error && !activeTopic && (
              <div className="welcome">
                <div className="welcome-icon">k8s</div>
                <h1>k8slearn</h1>
                <p>
                  Interactive Kubernetes certification learning.
                  Pick a topic from the sidebar to start studying.
                </p>
                <div className="welcome-hint">
                  ← Select a topic from the left panel
                </div>
                {data && data.topics.length === 0 && (
                  <div className="empty-state" style={{ marginTop: '1rem' }}>
                    No topics found. Make sure the content submodule is populated.
                  </div>
                )}
              </div>
            )}

            {activeTopic && (
              <>
                {/* Topic header */}
                <div className="topic-header">
                  <div className="topic-meta-row">
                    <span className="tag tag-cert">
                      {activeTopic.meta.cert.toUpperCase()}
                    </span>
                    <span className="tag tag-roadmap">
                      {activeTopic.meta.roadmap}
                    </span>
                    <span className={`tag tag-${activeTopic.meta.difficulty}`}>
                      {activeTopic.meta.difficulty}
                    </span>
                  </div>
                  <h1 className="topic-title">{activeTopic.meta.title}</h1>
                  {activeTopic.meta.tags && activeTopic.meta.tags.length > 0 && (
                    <div className="topic-tags">
                      {activeTopic.meta.tags.map(tag => (
                        <span key={tag} className="topic-tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Markdown content */}
                <div
                  className="md-body"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(activeTopic.mdContent)
                  }}
                />

                {/* Quiz */}
                {activeTopic.meta.questions.length > 0 && (
                  <Quiz questions={activeTopic.meta.questions} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
