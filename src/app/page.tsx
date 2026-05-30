'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

/* ── Types ──────────────────────────────────────────────── */
interface Question {
  type: string
  q: string
  options: string[]
  answer: number
  explanation: string
}
interface TopicMeta {
  title: string; cert: string; roadmap: string; subtopic: string
  difficulty: string; content: string; order?: number; tags?: string[]
  questions: Question[]
}
interface TopicEntry {
  slug: string; cert: string; roadmap: string; subtopicSlug: string
  meta: TopicMeta; mdContent: string
}
interface ContentData {
  topics: TopicEntry[]
  tree: Record<string, Record<string, TopicEntry[]>>
}

/* ── Escape HTML ────────────────────────────────────────── */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ── Markdown Renderer ──────────────────────────────────── */
function renderMarkdown(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  }

  while (i < lines.length) {
    const line = lines[i]

    // ── Code / Diagram blocks ──────────────────────────────
    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().replace(/^```/, '').trim().toLowerCase()
      const isRaw = lang === '' || lang === 'text' || lang === 'plain'
      const isDiagram = isRaw && (() => {
        let j = i + 1
        while (j < lines.length && !lines[j].trimStart().startsWith('```')) j++
        const snippet = lines.slice(i + 1, j).join('\n')
        return /[│├└┐┘┌─▼▲→←]/.test(snippet) || snippet.includes('──') || snippet.includes('   │')
      })()

      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```

      const content = codeLines.map(l => esc(l)).join('\n')

      if (isDiagram) {
        out.push(`<div class="diagram-block"><div class="diagram-label">FLOW DIAGRAM</div><pre class="diagram-pre">${content}</pre></div>`)
      } else if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
        out.push(`<div class="code-block"><div class="code-header"><span class="code-lang">$ bash</span><span class="code-dots"><span></span><span></span><span></span></span></div><pre class="code-pre bash-code">${content}</pre></div>`)
      } else if (lang === 'yaml' || lang === 'yml') {
        out.push(`<div class="code-block"><div class="code-header"><span class="code-lang">YAML</span><span class="code-dots"><span></span><span></span><span></span></span></div><pre class="code-pre yaml-code">${content}</pre></div>`)
      } else if (lang === 'json') {
        out.push(`<div class="code-block"><div class="code-header"><span class="code-lang">JSON</span><span class="code-dots"><span></span><span></span><span></span></span></div><pre class="code-pre json-code">${content}</pre></div>`)
      } else if (lang === 'typescript' || lang === 'ts' || lang === 'tsx') {
        out.push(`<div class="code-block"><div class="code-header"><span class="code-lang">TypeScript</span><span class="code-dots"><span></span><span></span><span></span></span></div><pre class="code-pre ts-code">${content}</pre></div>`)
      } else {
        const label = lang ? lang.toUpperCase() : 'CODE'
        out.push(`<div class="code-block"><div class="code-header"><span class="code-lang">${label}</span><span class="code-dots"><span></span><span></span><span></span></span></div><pre class="code-pre">${content}</pre></div>`)
      }
      continue
    }

    // ── Blockquotes ─────────────────────────────────────────
    if (line.trimStart().startsWith('>')) {
      const bqLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const inner = bqLines.join(' ')
      const icon = inner.includes('⚠️') ? 'warning' : inner.includes('📚') ? 'info' : 'note'
      out.push(`<div class="callout callout-${icon}"><div class="callout-icon">${icon === 'warning' ? '⚠️' : icon === 'info' ? '📚' : '💡'}</div><div class="callout-body">${inlineFormat(inner.replace(/⚠️|📚/g, '').trim())}</div></div>`)
      continue
    }

    // ── Tables ──────────────────────────────────────────────
    if (line.includes('|') && lines[i + 1] && lines[i + 1].includes('---')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      const [headerRow, , ...bodyRows] = tableLines
      const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th>${inlineFormat(esc(c.trim()))}</th>`).join('')
      const rows = bodyRows.map(r =>
        `<tr>${r.split('|').filter(c => c.trim()).map(c => `<td>${inlineFormat(esc(c.trim()))}</td>`).join('')}</tr>`
      ).join('')
      out.push(`<div class="table-wrap"><table class="md-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`)
      continue
    }

    // ── Headings ─────────────────────────────────────────────
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)
    const h4 = line.match(/^#### (.+)$/)
    if (h1) { out.push(`<h1 class="md-h1">${inlineFormat(esc(h1[1]))}</h1>`); i++; continue }
    if (h2) { out.push(`<h2 class="md-h2">${inlineFormat(esc(h2[1]))}</h2>`); i++; continue }
    if (h3) { out.push(`<h3 class="md-h3">${inlineFormat(esc(h3[1]))}</h3>`); i++; continue }
    if (h4) { out.push(`<h4 class="md-h4">${inlineFormat(esc(h4[1]))}</h4>`); i++; continue }

    // ── Horizontal rule ──────────────────────────────────────
    if (line.match(/^---+$/)) { out.push('<hr class="md-hr"/>'); i++; continue }

    // ── Lists ─────────────────────────────────────────────────
    if (line.match(/^(\s*)[-*] /)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^(\s*)[-*] /)) {
        const indent = lines[i].match(/^(\s*)/)?.[1].length || 0
        const text = lines[i].replace(/^\s*[-*] /, '')
        listItems.push(`<li style="margin-left:${indent * 0.75}rem">${inlineFormat(esc(text))}</li>`)
        i++
      }
      out.push(`<ul class="md-ul">${listItems.join('')}</ul>`)
      continue
    }

    // ── Ordered lists ────────────────────────────────────────
    if (line.match(/^\d+\. /)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(`<li>${inlineFormat(esc(lines[i].replace(/^\d+\. /, '')))}</li>`)
        i++
      }
      out.push(`<ol class="md-ol">${listItems.join('')}</ol>`)
      continue
    }

    // ── Empty line / paragraph break ─────────────────────────
    if (line.trim() === '') { i++; continue }

    // ── Paragraph ────────────────────────────────────────────
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,4} /) &&
      !lines[i].trimStart().startsWith('>') &&
      !lines[i].trimStart().startsWith('```') &&
      !lines[i].match(/^[-*] /) &&
      !lines[i].match(/^\d+\. /) &&
      !lines[i].includes('|') &&
      !lines[i].match(/^---+$/)
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      out.push(`<p class="md-p">${inlineFormat(esc(paraLines.join(' ')))}</p>`)
    }
  }

  return out.join('\n')
}

/* ── Quiz Component ─────────────────────────────────────── */
function Quiz({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(questions.length).fill(null))
  const [currentQ, setCurrentQ] = useState(0)

  // Reset state if questions array changes to avoid stale mismatched indexes
  useEffect(() => {
    setAnswers(new Array(questions.length).fill(null))
    setCurrentQ(0)
  }, [questions])

  const handleAnswer = (qi: number, oi: number) => {
    if (answers[qi] !== null && answers[qi] !== undefined) return
    const next = [...answers]; next[qi] = oi; setAnswers(next)
    if (qi === currentQ && qi < questions.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 700)
    }
  }

  // Safely slice answers and guard against out-of-bound questions indexing
  const safeAnswers = answers.slice(0, questions.length)
  const score = safeAnswers.filter((a, i) => questions[i] && a === questions[i].answer).length
  const answered = safeAnswers.filter(a => a !== null && a !== undefined).length
  const allDone = answered === questions.length && questions.length > 0

  const reset = () => { setAnswers(new Array(questions.length).fill(null)); setCurrentQ(0) }

  return (
    <div className="quiz-section">
      <div className="quiz-header">
        <h2>Practice Quiz</h2>
        <span className="quiz-count">{questions.length} questions</span>
      </div>
      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
        <span className="progress-text">{answered}/{questions.length}</span>
      </div>
      {allDone && (
        <div className="quiz-result" style={{ marginBottom: '1.5rem' }}>
          <div className="quiz-result-score">{score}/{questions.length}</div>
          <p>{score === questions.length ? '🎉 Perfect!' : score >= Math.ceil(questions.length * 0.7) ? '✅ Good job!' : '📖 Keep studying!'}</p>
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: '0.5rem' }}>Try Again</button>
        </div>
      )}
      {questions.map((q, qi) => {
        const selected = answers[qi]
        const isAnswered = selected !== null
        if (qi > currentQ && !isAnswered) return null
        return (
          <div key={qi} className="question-card">
            <div className="question-num">Q{qi + 1} <span className="question-type-badge">{q.type}</span></div>
            <div className="question-text">{q.q}</div>
            <div className="options">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer
                const isSelected = selected === oi
                let cls = 'option-btn'
                if (isAnswered) {
                  if (isSelected && isCorrect) cls += ' selected-correct'
                  else if (isSelected && !isCorrect) cls += ' selected-wrong'
                  else if (isCorrect) cls += ' reveal-correct'
                }
                return (
                  <button key={oi} className={cls} disabled={isAnswered} onClick={() => handleAnswer(qi, oi)} id={`q${qi}-opt${oi}`}>
                    <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                )
              })}
            </div>
            {isAnswered && <div className="explanation"><strong>Explanation:</strong> {q.explanation}</div>}
          </div>
        )
      })}
    </div>
  )
}

/* ── Sidebar ────────────────────────────────────────────── */
function Sidebar({ tree, activeTopic, onSelect }: {
  tree: Record<string, Record<string, TopicEntry[]>>
  activeTopic: TopicEntry | null
  onSelect: (t: TopicEntry) => void
}) {
  const certMeta: Record<string, { label: string; color: string }> = {
    cka:  { label: 'Kubernetes Administrator', color: 'cert-cka' },
    ckad: { label: 'Application Developer', color: 'cert-ckad' },
    cks:  { label: 'Security Specialist', color: 'cert-cks' },
    kcna: { label: 'Cloud Native Associate', color: 'cert-kcna' },
  }
  const certOrder = ['cka', 'ckad', 'cks', 'kcna']
  const certs = [...new Set([...certOrder, ...Object.keys(tree)])].filter(c => tree[c])

  return (
    <nav className="sidebar">
      <div className="sidebar-section">Certifications</div>
      <div className="sidebar-scroll">
        {certs.map(cert => (
          <div key={cert} className="cert-group">
            <div className="cert-label">
              <span className={`cert-badge ${certMeta[cert]?.color || ''}`}>{cert.toUpperCase()}</span>
              <span className="cert-name">{certMeta[cert]?.label || cert}</span>
            </div>
            {Object.entries(tree[cert] || {}).map(([roadmap, topics]) => (
              <div key={roadmap} className="roadmap-group">
                <div className="roadmap-label">
                  <span className="roadmap-icon">📂</span> {roadmap}
                  <span className="roadmap-count">{topics.length}</span>
                </div>
                {[...topics].sort((a, b) => (a.meta.order || 99) - (b.meta.order || 99)).map(t => (
                  <button
                    key={t.slug}
                    className={`topic-link ${activeTopic?.slug === t.slug ? 'active' : ''}`}
                    onClick={() => onSelect(t)}
                    id={`sidebar-${t.slug.replace(/\//g, '-')}`}
                  >
                    <span className={`diff-dot ${t.meta.difficulty}`} title={t.meta.difficulty} />
                    <span className="topic-link-text">{t.meta.title}</span>
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
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = useCallback((t: TopicEntry) => {
    setActiveTopic(t)
    setTimeout(() => window.scrollTo({ top: 0 }), 0)
  }, [])

  const renderedMd = useMemo(
    () => activeTopic ? renderMarkdown(activeTopic.mdContent) : '',
    [activeTopic]
  )

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span className="header-logo-badge">k8s</span>
          <span className="header-logo-text">learn</span>
        </div>
        <span className="header-tagline">
          {loading ? 'Loading…'
            : data ? `${data.topics.length} topics · ${Object.keys(data.tree).length} certifications`
            : 'Kubernetes Certification Learning'}
        </span>
      </header>

      <div className="main">
        {data && <Sidebar tree={data.tree} activeTopic={activeTopic} onSelect={handleSelect} />}

        <main className="content-area">
          <div className="content-scroll">
            {loading && (
              <div className="loading">
                <div className="spinner" />
                <p>Reading content repository…</p>
              </div>
            )}
            {error && (
              <div className="error-box" style={{ marginTop: '2rem' }}>
                ⚠️ <strong>Content load failed:</strong> {error}
              </div>
            )}
            {!loading && !error && !activeTopic && (
              <div className="welcome">
                <div className="welcome-icon">k8s</div>
                <h1>k8slearn</h1>
                <p>Interactive Kubernetes certification learning. Select a topic from the sidebar.</p>
                <div className="welcome-hint">← Choose a topic from the left panel</div>
              </div>
            )}
            {activeTopic && (
              <>
                <div className="topic-header">
                  <div className="topic-meta-row">
                    <span className="tag tag-cert">{activeTopic.meta.cert.toUpperCase()}</span>
                    <span className="tag tag-roadmap">{activeTopic.meta.roadmap}</span>
                    <span className={`tag tag-${activeTopic.meta.difficulty}`}>{activeTopic.meta.difficulty}</span>
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
                <div className="md-body" dangerouslySetInnerHTML={{ __html: renderedMd }} />
                {activeTopic.meta.questions.length > 0 && (
                  <Quiz key={activeTopic.slug} questions={activeTopic.meta.questions} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
