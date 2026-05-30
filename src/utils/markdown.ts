/* ==========================================================
   Markdown rendering utilities
   Pure functions — no React, no side-effects.
   ========================================================== */

/* ── Escape HTML ──────────────────────────────────────────── */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ── Inline format helper ─────────────────────────────────── */
export function inlineFormat(text: string): string {
  return text
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

/* ── Copy button snippet (shared HTML template) ──────────── */
function copyButton(rawText: string, title: string): string {
  return `<button class="copy-btn" data-code="${esc(rawText)}" title="${title}">
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    <span>Copy</span>
  </button>`
}

/* ── Flow Diagram Parser ──────────────────────────────────── */
// Converts ASCII flow blocks (│▼→ etc) into visual step cards
export function parseFlowDiagram(lines: string[]): string {
  const steps: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[│|▼▲↓↑─\-=\s]*$/.test(trimmed)) continue
    if (trimmed === '') continue
    const cleaned = trimmed
      .replace(/^[│|]\s*/, '')
      .replace(/^[▼▲→←]\s*/, '')
      .replace(/→\s*/g, ' → ')
      .trim()
    if (cleaned.length > 0) steps.push(cleaned)
  }

  if (steps.length === 0) {
    const content = lines.map(l => esc(l)).join('\n')
    return `<div class="diagram-block"><div class="diagram-label"><span class="diagram-icon">⬡</span> FLOW DIAGRAM</div><pre class="diagram-pre">${content}</pre></div>`
  }

  const cards = steps.map((step, idx) => {
    const isLast = idx === steps.length - 1
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

/* ── Bash Command Highlighter ─────────────────────────────── */
export function renderBashBlock(lines: string[]): string {
  const rawText = lines.join('\n')
  const highlighted = lines.map(line => {
    if (line.trim() === '') return '<span class="bash-empty"> </span>'
    if (line.trimStart().startsWith('#')) {
      return `<span class="bash-comment">${esc(line)}</span>`
    }
    const cmdLine = esc(line)
      .replace(/^(\s*)(kubectl|helm|docker|kubeadm|etcdctl|openssl|cat|echo|curl|apt|systemctl)(\s)/, '$1<span class="bash-cmd">$2</span>$3')
      .replace(/(--[a-zA-Z-]+=?)/, '<span class="bash-flag">$1</span>')
    return `<span class="bash-line"><span class="bash-prompt">$</span> ${cmdLine}</span>`
  }).join('\n')

  return `<div class="bash-block">
    <div class="bash-header">
      <div class="bash-dots"><span></span><span></span><span></span></div>
      <span class="bash-title">Terminal</span>
      ${copyButton(rawText, 'Copy commands')}
    </div>
    <pre class="bash-pre">${highlighted}</pre>
  </div>`
}

/* ── YAML / Config Highlighter ────────────────────────────── */
export function renderYamlBlock(lines: string[], lang: string): string {
  const rawText = lines.join('\n')
  const highlighted = lines.map(line => {
    const escaped = esc(line)
    if (line.trimStart().startsWith('#')) {
      return `<span class="yaml-comment">${escaped}</span>`
    }
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
  const icon  = lang === 'yaml' || lang === 'yml' ? '📄' : '📋'

  return `<div class="yaml-block">
    <div class="yaml-header">
      <div class="bash-dots"><span></span><span></span><span></span></div>
      <span class="yaml-lang-badge">${icon} ${label}</span>
      ${copyButton(rawText, 'Copy config')}
    </div>
    <pre class="yaml-pre">${highlighted}</pre>
  </div>`
}

/* ── Generic Code Block ───────────────────────────────────── */
export function renderCodeBlock(lines: string[], lang: string): string {
  const rawText = lines.join('\n')
  const content = lines.map(l => esc(l)).join('\n')
  const label = lang ? lang.toUpperCase() : 'CODE'
  return `<div class="code-block">
    <div class="code-header">
      <div class="bash-dots"><span></span><span></span><span></span></div>
      <span class="code-lang">${label}</span>
      ${copyButton(rawText, 'Copy code')}
    </div>
    <pre class="code-pre">${content}</pre>
  </div>`
}

/* ── Main Markdown Renderer ───────────────────────────────── */
export function renderMarkdown(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code blocks ─────────────────────────────────
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

      if (lang === 'diagram' || lang === 'ascii') {
        const content = codeLines.map(l => esc(l)).join('\n')
        out.push(`<div class="diagram-block"><div class="diagram-label"><span class="diagram-icon">⬡</span> ARCHITECTURE DIAGRAM</div><pre class="diagram-pre">${content}</pre></div>`)
      } else if (isDiagram) {
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

    // ── Blockquotes ────────────────────────────────────────
    if (line.trimStart().startsWith('>')) {
      const bqLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const inner = bqLines.join(' ')
      const hasWarning = inner.includes('⚠️') || inner.toLowerCase().includes('warning') || inner.toLowerCase().includes('cannot')
      const hasInfo    = inner.includes('📚') || inner.toLowerCase().includes('note')
      const type  = hasWarning ? 'warning' : hasInfo ? 'info' : 'tip'
      const icon  = type === 'warning' ? '⚠️' : type === 'info' ? '📘' : '💡'
      const label = type === 'warning' ? 'Warning' : type === 'info' ? 'Note' : 'Tip'
      out.push(`<div class="callout callout-${type}"><div class="callout-header"><span class="callout-icon">${icon}</span><span class="callout-label">${label}</span></div><div class="callout-body">${inlineFormat(inner.replace(/⚠️|📚/g, '').trim())}</div></div>`)
      continue
    }

    // ── Tables ─────────────────────────────────────────────
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

    // ── Headings ───────────────────────────────────────────
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)
    const h4 = line.match(/^#### (.+)$/)
    if (h1) { out.push(`<h1 class="md-h1">${inlineFormat(esc(h1[1]))}</h1>`); i++; continue }
    if (h2) { out.push(`<h2 class="md-h2"><span class="h2-bar"></span>${inlineFormat(esc(h2[1]))}</h2>`); i++; continue }
    if (h3) { out.push(`<h3 class="md-h3">${inlineFormat(esc(h3[1]))}</h3>`); i++; continue }
    if (h4) { out.push(`<h4 class="md-h4">${inlineFormat(esc(h4[1]))}</h4>`); i++; continue }

    // ── Horizontal rule ────────────────────────────────────
    if (line.match(/^---+$/)) { out.push('<hr class="md-hr"/>'); i++; continue }

    // ── Unordered lists ────────────────────────────────────
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

    // ── Ordered lists ──────────────────────────────────────
    if (line.match(/^\d+\. /)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(`<li>${inlineFormat(esc(lines[i].replace(/^\d+\. /, '')))}</li>`)
        i++
      }
      out.push(`<ol class="md-ol">${listItems.join('')}</ol>`)
      continue
    }

    // ── Empty line ─────────────────────────────────────────
    if (line.trim() === '') { i++; continue }

    // ── Paragraph ──────────────────────────────────────────
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
