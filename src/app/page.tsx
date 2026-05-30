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

/* ── Inline format helper ───────────────────────────────── */
function inlineFormat(text: string): string {
  return text
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

/* ── Flow Diagram Parser ────────────────────────────────── */
// Converts ASCII flow blocks (│▼→ etc) into visual step cards
function parseFlowDiagram(lines: string[]): string {
  // Extract meaningful step lines — skip pure connector lines
  const steps: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip pure connector/arrow lines
    if (/^[│|▼▲↓↑─\-=\s]*$/.test(trimmed)) continue
    if (trimmed === '') continue
    // Remove leading │ or | characters and arrows
    const cleaned = trimmed
      .replace(/^[│|]\s*/, '')
      .replace(/^[▼▲→←]\s*/, '')
      .replace(/→\s*/g, ' → ')
      .trim()
    if (cleaned.length > 0) steps.push(cleaned)
  }

  if (steps.length === 0) {
    // Fallback: render as plain preformatted
    const content = lines.map(l => esc(l)).join('\n')
    return `<div class="diagram-block"><div class="diagram-label"><span class="diagram-icon">⬡</span> FLOW DIAGRAM</div><pre class="diagram-pre">${content}</pre></div>`
  }

  const cards = steps.map((step, idx) => {
    const isLast = idx === steps.length - 1
    // Bold key phrases (everything before a colon if present)
    const formatted = step.replace(/^([^:→]+):/, '<span class="flow-step-key">$1:</span>')
    return `
      <div class="flow-step-wrap">
        <div class="flow-step-card">
          <span class="flow-step-num">${idx + 1}</span>
          <span class="flow-step-text">${inlineFormat(formatted)}</span>
        </div>
        ${!isLast ? '<div class="flow-arrow">▼</div>' : ''}
      </div>`
  }).join('')

  return `<div class="flow-diagram">${cards}</div>`
}

/* ── Bash Command Highlighter ───────────────────────────── */
function renderBashBlock(lines: string[]): string {
  const highlighted = lines.map(line => {
    if (line.trim() === '') return '<span class="bash-empty"> </span>'
    // Comment lines
    if (line.trimStart().startsWith('#')) {
      return `<span class="bash-comment">${esc(line)}</span>`
    }
    // Lines that start with kubectl, helm, docker, etc. — highlight the command keyword
    const cmdLine = esc(line)
      .replace(/^(\s*)(kubectl|helm|docker|kubeadm|etcdctl|openssl|cat|echo|curl|apt|systemctl)(\s)/, '$1<span class="bash-cmd">$2</span>$3')
      .replace(/(--[a-zA-Z-]+=?)/, '<span class="bash-flag">$1</span>')
    return `<span class="bash-line"><span class="bash-prompt">$</span> ${cmdLine}</span>`
  }).join('\n')

  return `<div class="bash-block">
    <div class="bash-header">
      <div class="bash-dots"><span></span><span></span><span></span></div>
      <span class="bash-title">Terminal</span>
    </div>
    <pre class="bash-pre">${highlighted}</pre>
  </div>`
}

/* ── YAML Highlighter ───────────────────────────────────── */
function renderYamlBlock(lines: string[], lang: string): string {
  const highlighted = lines.map(line => {
    const escaped = esc(line)
    // Comment lines
    if (line.trimStart().startsWith('#')) {
      return `<span class="yaml-comment">${escaped}</span>`
    }
    // Key: value pairs
    return escaped
      .replace(/^(\s*)([a-zA-Z0-9_\-./]+)(\s*:)(\s*)(.*)$/, (_, indent, key, colon, space, val) => {
        const valFormatted = val.startsWith('"') || val.startsWith("'")
          ? `<span class="yaml-string">${esc(val)}</span>`
          : val === 'true' || val === 'false'
          ? `<span class="yaml-bool">${val}</span>`
          : /^\d+$/.test(val.trim())
          ? `<span class="yaml-number">${val}</span>`
          : val.length > 0
          ? `<span class="yaml-value">${esc(val)}</span>`
          : ''
        return `${indent}<span class="yaml-key">${esc(key)}</span><span class="yaml-colon">${esc(colon)}</span>${space}${valFormatted}`
      })
  }).join('\n')

  const label = lang === 'yaml' || lang === 'yml' ? 'YAML' : lang.toUpperCase()
  const icon = lang === 'yaml' || lang === 'yml' ? '📄' : '📋'

  return `<div class="yaml-block">
    <div class="yaml-header">
      <div class="bash-dots"><span></span><span></span><span></span></div>
      <span class="yaml-lang-badge">${icon} ${label}</span>
    </div>
    <pre class="yaml-pre">${highlighted}</pre>
  </div>`
}

/* ── Generic Code Block ─────────────────────────────────── */
function renderCodeBlock(lines: string[], lang: string): string {
  const content = lines.map(l => esc(l)).join('\n')
  const label = lang ? lang.toUpperCase() : 'CODE'
  return `<div class="code-block">
    <div class="code-header">
      <div class="bash-dots"><span></span><span></span><span></span></div>
      <span class="code-lang">${label}</span>
    </div>
    <pre class="code-pre">${content}</pre>
  </div>`
}

/* ── Main Markdown Renderer ─────────────────────────────── */
function renderMarkdown(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code blocks ──────────────────────────────────
    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().replace(/^```/, '').trim().toLowerCase()

      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```

      const isRaw = lang === '' || lang === 'text' || lang === 'plain'
      const isDiagram = isRaw && (() => {
        const snippet = codeLines.join('\n')
        return /[│├└┐┘┌─▼▲→←⬡]/.test(snippet) ||
          snippet.includes('──') ||
          snippet.includes('   │') ||
          /\|\s/.test(snippet)
      })()

      if (isDiagram) {
        out.push(parseFlowDiagram(codeLines))
      } else if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
        out.push(renderBashBlock(codeLines))
      } else if (lang === 'yaml' || lang === 'yml' || lang === 'json') {
        out.push(renderYamlBlock(codeLines, lang))
      } else if (lang === 'dockerfile') {
        out.push(renderYamlBlock(codeLines, 'dockerfile'))
      } else {
        out.push(renderCodeBlock(codeLines, lang))
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
      const hasWarning = inner.includes('⚠️') || inner.toLowerCase().includes('warning') || inner.toLowerCase().includes('cannot')
      const hasInfo = inner.includes('📚') || inner.toLowerCase().includes('note')
      const type = hasWarning ? 'warning' : hasInfo ? 'info' : 'tip'
      const icon = type === 'warning' ? '⚠️' : type === 'info' ? '📘' : '💡'
      const label = type === 'warning' ? 'Warning' : type === 'info' ? 'Note' : 'Tip'
      out.push(`<div class="callout callout-${type}"><div class="callout-header"><span class="callout-icon">${icon}</span><span class="callout-label">${label}</span></div><div class="callout-body">${inlineFormat(inner.replace(/⚠️|📚/g, '').trim())}</div></div>`)
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
      const headers = headerRow.split('|').filter(c => c.trim())
        .map(c => `<th>${inlineFormat(esc(c.trim()))}</th>`).join('')
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
    if (h2) { out.push(`<h2 class="md-h2"><span class="h2-bar"></span>${inlineFormat(esc(h2[1]))}</h2>`); i++; continue }
    if (h3) { out.push(`<h3 class="md-h3">${inlineFormat(esc(h3[1]))}</h3>`); i++; continue }
    if (h4) { out.push(`<h4 class="md-h4">${inlineFormat(esc(h4[1]))}</h4>`); i++; continue }

    // ── Horizontal rule ──────────────────────────────────────
    if (line.match(/^---+$/)) { out.push('<hr class="md-hr"/>'); i++; continue }

    // ── Unordered lists ──────────────────────────────────────
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

    // ── Empty line ───────────────────────────────────────────
    if (line.trim() === '') { i++; continue }

    // ── Paragraph ────────────────────────────────────────────
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,4} /) &&
      !lines[i].trimStart().startsWith('>') &&
      !lines[i].trimStart().startsWith('```') &&
      !lines[i].match(/^[-*] /) &&
      !lines[i].match(/^\d+\. /) &&
      !(lines[i].includes('|') && lines[i + 1] && lines[i + 1].includes('---')) &&
      !lines[i].match(/^---+$/)
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      out.push(`<p class="md-p">${inlineFormat(esc(paraLines.join(' ')))}</p>`)
    } else {
      i++
    }
  }

  return out.join('\n')
}

/* ── Quiz Component ─────────────────────────────────────── */
function Quiz({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(questions.length).fill(null))
  const [currentQ, setCurrentQ] = useState(0)

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
        const isAnswered = selected !== null && selected !== undefined
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

/* ── Roadmap Overview Component ─────────────────────────── */
function RoadmapOverview({ cert, roadmap, topics, onSelect }: {
  cert: string
  roadmap: string
  topics: TopicEntry[]
  onSelect: (t: TopicEntry) => void
}) {
  const diffRank: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
  const sorted = [...topics].sort((a, b) => {
    const da = diffRank[a.meta.difficulty] ?? 99
    const db = diffRank[b.meta.difficulty] ?? 99
    if (da !== db) return da - db
    return (a.meta.order || 99) - (b.meta.order || 99)
  })

  // Extract a short preview from raw markdown (first non-heading paragraph)
  function getPreview(mdContent: string): string {
    const lines = mdContent.split('\n')
    for (const line of lines) {
      const t = line.trim()
      if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('|') || t.startsWith('>')) continue
      return t.replace(/\*\*|\*/g, '').replace(/`/g, '').slice(0, 140) + (t.length > 140 ? '…' : '')
    }
    return ''
  }

  const diffColors: Record<string, string> = { beginner: 'tag-beginner', intermediate: 'tag-intermediate', advanced: 'tag-advanced' }
  const diffIcons: Record<string, string> = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' }

  return (
    <div className="roadmap-overview">
      <div className="roadmap-overview-header">
        <div className="roadmap-overview-meta">
          <span className="tag tag-cert">{cert.toUpperCase()}</span>
          <span className="tag tag-roadmap">{roadmap}</span>
        </div>
        <h1 className="roadmap-overview-title">📂 {roadmap}</h1>
        <p className="roadmap-overview-sub">
          {sorted.length} topics — click any card to start studying
        </p>
      </div>

      <div className="overview-grid">
        {sorted.map((t, idx) => {
          const preview = getPreview(t.mdContent)
          return (
            <button
              key={t.slug}
              className="overview-card"
              onClick={() => onSelect(t)}
              id={`overview-${t.slug.replace(/\//g, '-')}`}
            >
              <div className="overview-card-top">
                <span className="overview-num">{idx + 1}</span>
                <span className={`tag ${diffColors[t.meta.difficulty] || ''}`}>
                  {diffIcons[t.meta.difficulty]} {t.meta.difficulty}
                </span>
              </div>
              <div className="overview-card-title">{t.meta.title}</div>
              {preview && <div className="overview-card-preview">{preview}</div>}
              {t.meta.tags && t.meta.tags.length > 0 && (
                <div className="overview-card-tags">
                  {t.meta.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="topic-tag">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="overview-card-footer">
                <span className="overview-quiz-count">🧠 {t.meta.questions.length} quiz questions</span>
                <span className="overview-arrow">→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Sidebar ────────────────────────────────────────────── */
function Sidebar({ tree, activeTopic, activeRoadmap, onSelect, onRoadmapSelect }: {
  tree: Record<string, Record<string, TopicEntry[]>>
  activeTopic: TopicEntry | null
  activeRoadmap: { cert: string; roadmap: string } | null
  onSelect: (t: TopicEntry) => void
  onRoadmapSelect: (cert: string, roadmap: string, topics: TopicEntry[]) => void
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
            {Object.entries(tree[cert] || {}).map(([roadmap, topics]) => {
              const isActiveRoadmap = activeRoadmap?.cert === cert && activeRoadmap?.roadmap === roadmap
              return (
                <div key={roadmap} className="roadmap-group">
                  <button
                    className={`roadmap-label roadmap-label-btn ${isActiveRoadmap && !activeTopic ? 'roadmap-active' : ''}`}
                    onClick={() => onRoadmapSelect(cert, roadmap, topics)}
                    title={`View all ${roadmap} topics`}
                  >
                    <span className="roadmap-icon">📂</span> {roadmap}
                    <span className="roadmap-count">{topics.length}</span>
                  </button>
                  {[...topics].sort((a, b) => {
                    const diffRank: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
                    const da = diffRank[a.meta.difficulty] ?? 99
                    const db = diffRank[b.meta.difficulty] ?? 99
                    if (da !== db) return da - db
                    return (a.meta.order || 99) - (b.meta.order || 99)
                  }).map(t => (
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
              )
            })}
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
  const [activeRoadmap, setActiveRoadmap] = useState<{ cert: string; roadmap: string; topics: TopicEntry[] } | null>(null)

  useEffect(() => {
    fetch('/api/content')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = useCallback((t: TopicEntry) => {
    setActiveTopic(t)
    setActiveRoadmap(prev => prev ? { ...prev } : null)
    setTimeout(() => window.scrollTo({ top: 0 }), 0)
  }, [])

  const handleRoadmapSelect = useCallback((cert: string, roadmap: string, topics: TopicEntry[]) => {
    setActiveRoadmap({ cert, roadmap, topics })
    setActiveTopic(null)
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
        {data && (
          <Sidebar
            tree={data.tree}
            activeTopic={activeTopic}
            activeRoadmap={activeRoadmap}
            onSelect={handleSelect}
            onRoadmapSelect={handleRoadmapSelect}
          />
        )}

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
            {!loading && !error && !activeTopic && !activeRoadmap && (
              <div className="welcome">
                <div className="welcome-icon">k8s</div>
                <h1>k8slearn</h1>
                <p>Interactive Kubernetes certification learning. Click a 📂 roadmap or select a topic from the sidebar.</p>
                <div className="welcome-hint">← Click a folder to see all topics</div>
              </div>
            )}
            {!loading && !error && !activeTopic && activeRoadmap && (
              <RoadmapOverview
                cert={activeRoadmap.cert}
                roadmap={activeRoadmap.roadmap}
                topics={activeRoadmap.topics}
                onSelect={handleSelect}
              />
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
