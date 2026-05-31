'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

import type { ContentData, TopicEntry } from '@/types/content'
import { renderMarkdown } from '@/utils/markdown'
import Quiz from '@/components/Quiz'
import RoadmapOverview from '@/components/RoadmapOverview'
import Sidebar from '@/components/Sidebar'
import LabCard from '@/components/LabCard'
import CertIntro from '@/components/CertIntro'

/* ── Cert accent colour map ───────────────────────────────── */
const CERT_ACCENT: Record<string, string> = {
  cka:  'oklch(0.66 0.13 250)',
  ckad: 'oklch(0.70 0.13 155)',
  cks:  'oklch(0.78 0.11 85)',
  kcna: 'oklch(0.66 0.14 300)',
}

/** Landing-page track definitions (static metadata only). */
const TRACKS = [
  {
    id: 'cka',  name: 'CKA',  level: 'Intermediate',
    full:  'Certified Kubernetes Administrator',
    blurb: 'Operate production clusters end to end — architecture, networking, storage, and the troubleshooting skills that make or break exam day.',
    accent: CERT_ACCENT.cka,
  },
  {
    id: 'ckad', name: 'CKAD', level: 'Intermediate',
    full:  'Certified Kubernetes Application Developer',
    blurb: 'Design, build, and ship cloud native applications: multi-container Pods, config, probes, and developer-facing networking.',
    accent: CERT_ACCENT.ckad,
  },
  {
    id: 'cks',  name: 'CKS',  level: 'Advanced',
    full:  'Certified Kubernetes Security Specialist',
    blurb: 'Harden clusters and supply chains. Requires a current CKA. Runtime detection, admission control, and threat response.',
    accent: CERT_ACCENT.cks,
  },
  {
    id: 'kcna', name: 'KCNA', level: 'Foundational',
    full:  'Kubernetes & Cloud Native Associate',
    blurb: 'Your foundation. A broad, approachable tour of Kubernetes and the cloud native landscape — the best place to begin.',
    accent: CERT_ACCENT.kcna,
  },
] as const

/* ── Topbar tagline helper ────────────────────────────────── */
function buildTagline(
  data: ContentData,
  activeCert: string,
  activeTopic: TopicEntry | null,
  activeRoadmap: { cert: string; roadmap: string; topics: TopicEntry[] } | null,
): string {
  if (!data.tree[activeCert]) return 'Kubernetes Certification Learning'
  const roadmapName = activeTopic?.roadmap ?? activeRoadmap?.roadmap
  if (roadmapName && data.tree[activeCert][roadmapName]) {
    const count = data.tree[activeCert][roadmapName].length
    return `${count} topic${count !== 1 ? 's' : ''} · ${roadmapName}`
  }
  const total = Object.values(data.tree[activeCert]).flat().length
  return `${total} topics · ${activeCert.toUpperCase()} Certification`
}

/* ── Main Page ────────────────────────────────────────────── */
export default function Home() {
  const [data,         setData]         = useState<ContentData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [activeTopic,  setActiveTopic]  = useState<TopicEntry | null>(null)
  const [activeRoadmap,setActiveRoadmap]= useState<{ cert: string; roadmap: string; topics: TopicEntry[] } | null>(null)
  const [activeCert,   setActiveCert]   = useState('')   // '' = landing page

  /* ── Write current nav state to the URL hash ─────────────── */
  const pushHash = useCallback((
    cert: string,
    roadmap: string | null,
    topicSlug: string | null,
  ) => {
    if (!cert) { history.replaceState(null, '', window.location.pathname); return }
    let hash = cert
    if (roadmap)   hash += '/' + encodeURIComponent(roadmap)
    if (topicSlug) hash += '/' + encodeURIComponent(topicSlug)
    history.replaceState(null, '', '#' + hash)
  }, [])

  /* ── Fetch content tree on mount ─────────────────────────── */
  useEffect(() => {
    fetch('/api/content')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: ContentData) => {
        setData(d)
        // Restore state from URL hash AFTER content is available
        const hash = window.location.hash.replace(/^#/, '')
        if (!hash) return
        const [cert, roadmapEnc, topicEnc] = hash.split('/')
        if (!cert || !d.tree[cert]) return
        setActiveCert(cert)
        const roadmap = roadmapEnc ? decodeURIComponent(roadmapEnc) : null
        const topicSlug = topicEnc ? decodeURIComponent(topicEnc) : null
        if (roadmap && d.tree[cert][roadmap]) {
          const topics = d.tree[cert][roadmap]
          setActiveRoadmap({ cert, roadmap, topics })
          if (topicSlug) {
            const topic = topics.find(t => t.slug === topicSlug)
            if (topic) setActiveTopic(topic)
          }
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  /* ── Load Mermaid.js once, dark theme ────────────────────── */
  useEffect(() => {
    if (document.getElementById('mermaid-script')) return
    const s = document.createElement('script')
    s.id = 'mermaid-script'
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
    s.onload = () => {
      ;(window as { mermaid?: { initialize: (c: object) => void } }).mermaid?.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          /* node fill / text */
          primaryColor:      '#1e3a5f',
          primaryTextColor:  '#e2e8f0',
          primaryBorderColor:'#3b82f6',
          /* edges */
          lineColor:         '#60a5fa',
          edgeLabelBackground:'#0f172a',
          /* clusters (subgraphs) */
          clusterBkg:        '#0f2137',
          clusterBorder:     '#3b82f6',
          titleColor:        '#93c5fd',
          /* other */
          secondaryColor:    '#164e63',
          tertiaryColor:     '#1e293b',
          noteBkgColor:      '#1e293b',
          noteTextColor:     '#94a3b8',
          fontFamily:        'Inter, system-ui, sans-serif',
          fontSize:          '14px',
        },
        flowchart: { htmlLabels: true, curve: 'basis', padding: 20 },
        securityLevel: 'loose',
      })
    }
    document.head.appendChild(s)
  }, [])

  /* ── Global copy-button handler (event delegation) ────────── */
  useEffect(() => {
    const handleCopyClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.copy-btn')
      if (!btn) return
      const code = btn.getAttribute('data-code')
      if (!code) return
      try {
        await navigator.clipboard.writeText(code)
        btn.classList.add('copied')
        const span = btn.querySelector('span')
        if (span) {
          const orig = span.textContent || 'Copy'
          span.textContent = 'Copied!'
          setTimeout(() => { btn.classList.remove('copied'); span.textContent = orig }, 2000)
        }
      } catch (err) {
        console.error('Clipboard write failed:', err)
      }
    }
    document.addEventListener('click', handleCopyClick)
    return () => document.removeEventListener('click', handleCopyClick)
  }, [])

  /* ── Global interactive diagrams event delegation ─────────── */
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const node = (e.target as HTMLElement).closest('.diag-node')
      if (!node) return
      
      const term = node.getAttribute('data-term')
      const type = node.getAttribute('data-type')
      const desc = node.getAttribute('data-desc')
      if (!term || !desc) return
      
      const diagramBlock = node.closest('.diagram-block')
      if (!diagramBlock) return
      
      const titleEl = diagramBlock.querySelector('.diagram-info-title')
      const textEl = diagramBlock.querySelector('.diagram-info-text')
      
      if (titleEl && textEl) {
        const icon = type === 'control-plane' ? '☸️' : '🛠️'
        titleEl.innerHTML = `<span class="diag-info-badge diag-info-badge-${type}">${icon} ${term}</span>`
        textEl.textContent = desc
      }
      
      // Highlight all matching components in this diagram
      const nodes = diagramBlock.querySelectorAll(`.diag-node[data-term="${term}"]`)
      nodes.forEach(n => n.classList.add('diag-node-hovered'))
    }

    const handleMouseOut = (e: MouseEvent) => {
      const node = (e.target as HTMLElement).closest('.diag-node')
      if (!node) return
      
      const term = node.getAttribute('data-term')
      const diagramBlock = node.closest('.diagram-block')
      if (!diagramBlock) return
      
      const titleEl = diagramBlock.querySelector('.diagram-info-title')
      const textEl = diagramBlock.querySelector('.diagram-info-text')
      
      if (titleEl && textEl) {
        titleEl.innerHTML = '💡 Interactive Diagram Sandbox'
        textEl.textContent = 'Hover over any highlighted component to inspect its official CNCF syllabus details.'
      }
      
      if (term) {
        const nodes = diagramBlock.querySelectorAll(`.diag-node[data-term="${term}"]`)
        nodes.forEach(n => n.classList.remove('diag-node-hovered'))
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])


  /* ── Scroll-to-top helper ─────────────────────────────────── */
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollTop  = () => { if (contentRef.current) contentRef.current.scrollTop = 0 }

  /* ── Navigation handlers ──────────────────────────────────── */
  const handleSelect = useCallback((t: TopicEntry) => {
    setActiveTopic(t)
    setActiveRoadmap(prev => prev ? { ...prev } : null)
    // pushHash must be called in the event handler body, NOT inside the
    // state-updater function above — Next.js intercepts history.replaceState()
    // and triggers a Router state update, which React forbids during render.
    if (activeRoadmap) pushHash(activeRoadmap.cert, activeRoadmap.roadmap, t.slug)
    setTimeout(scrollTop, 0)
  }, [activeRoadmap, pushHash])


  const handleRoadmapSelect = useCallback((cert: string, roadmap: string, topics: TopicEntry[]) => {
    setActiveRoadmap({ cert, roadmap, topics })
    setActiveTopic(null)
    pushHash(cert, roadmap, null)
    setTimeout(scrollTop, 0)
  }, [pushHash])

  const handleCertSelect = useCallback((cert: string) => {
    setActiveCert(cert)
    setActiveTopic(null)
    setActiveRoadmap(null)
    pushHash(cert, null, null)
    setTimeout(scrollTop, 0)
  }, [pushHash])

  const handleStartTrack = useCallback(() => {
    if (activeCert && data?.tree[activeCert]) {
      const roadmaps = Object.keys(data.tree[activeCert])
      if (roadmaps.length > 0) {
        const roadmap = roadmaps[0]
        const topics = data.tree[activeCert][roadmap]
        setActiveRoadmap({ cert: activeCert, roadmap, topics })
        setActiveTopic(null)
        pushHash(activeCert, roadmap, null)
      }
    }
  }, [activeCert, data, pushHash])

  /* ── Memoised rendered markdown ───────────────────────────── */
  const renderedMd = useMemo(
    () => activeTopic ? renderMarkdown(activeTopic.mdContent) : '',
    [activeTopic],
  )

  /* ── Re-run Mermaid + inject zoom + pan controls ─────────── */
  useEffect(() => {
    if (!renderedMd) return
    type MermaidWindow = { mermaid?: { run: (opts: object) => Promise<void> | void } }
    const win = window as MermaidWindow

    /** Inject top-right zoom controls and drag-to-pan into every diagram */
    const injectZoomControls = () => {
      document.querySelectorAll<HTMLElement>('.mermaid-wrap').forEach(wrap => {
        if (wrap.dataset.zoomInit === '1') return
        const svg = wrap.querySelector('svg')
        if (!svg) return
        wrap.dataset.zoomInit = '1'

        // ── Canvas (pannable inner div) ─────────────────────
        const canvas = document.createElement('div')
        canvas.className = 'mermaid-canvas'
        svg.parentElement?.insertBefore(canvas, svg)
        canvas.appendChild(svg)

        // State
        let scale = 1, tx = 0, ty = 0
        let dragging = false, startX = 0, startY = 0, startTx = 0, startTy = 0
        const MIN = 0.25, MAX = 4, STEP = 0.15

        const applyTransform = () => {
          canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
          const pct = wrap.querySelector<HTMLElement>('.mz-pct')
          if (pct) pct.textContent = Math.round(scale * 100) + '%'
        }

        // ── Drag to pan ─────────────────────────────────────────────────
        wrap.addEventListener('mousedown', (e: MouseEvent) => {
          if ((e.target as HTMLElement).closest('.mermaid-controls')) return
          dragging = true
          startX  = e.clientX; startY  = e.clientY
          startTx = tx;        startTy = ty
          wrap.style.cursor = 'grabbing'
          e.preventDefault()
        })
        window.addEventListener('mousemove', (e: MouseEvent) => {
          if (!dragging) return
          tx = startTx + (e.clientX - startX)
          ty = startTy + (e.clientY - startY)
          applyTransform()
        })
        const stopDrag = () => { dragging = false; wrap.style.cursor = 'grab' }
        window.addEventListener('mouseup',    stopDrag)
        window.addEventListener('mouseleave', stopDrag)

        // ── Zoom control bar (top-right overlay) ────────────
        const bar = document.createElement('div')
        bar.className = 'mermaid-controls'
        bar.innerHTML = `
          <button class="mz-btn" data-action="out"   title="Zoom out">−</button>
          <span   class="mz-pct">100%</span>
          <button class="mz-btn" data-action="in"    title="Zoom in">+</button>
          <button class="mz-btn mz-reset" data-action="reset" title="Reset">↺</button>
        `
        wrap.appendChild(bar)

        bar.addEventListener('click', (e: MouseEvent) => {
          const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
          if (!btn) return
          const action = btn.dataset.action
          if (action === 'in')    scale = Math.min(MAX, scale + STEP)
          if (action === 'out')   scale = Math.max(MIN, scale - STEP)
          if (action === 'reset') { scale = 1; tx = 0; ty = 0 }
          applyTransform()
        })
      })
    }

    const tryRender = () => {
      if (!win.mermaid) { setTimeout(tryRender, 200); return }

      // Strip old zoom state before re-render
      document.querySelectorAll<HTMLElement>('.mermaid-wrap').forEach(w => {
        delete w.dataset.zoomInit
        w.style.cursor = ''
      })
      document.querySelectorAll<HTMLElement>('.mermaid-controls').forEach(el => el.remove())
      document.querySelectorAll<HTMLElement>('.mermaid-canvas').forEach(el => {
        // Move SVG back out before removing canvas wrapper
        const s = el.querySelector('svg')
        if (s) el.parentElement?.insertBefore(s, el)
        el.remove()
      })
      document.querySelectorAll('pre.mermaid[data-processed]')
        .forEach(el => el.removeAttribute('data-processed'))

      const result = win.mermaid.run({ querySelector: 'pre.mermaid' })
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).then(() => setTimeout(injectZoomControls, 60))
      } else {
        setTimeout(injectZoomControls, 320)
      }
    }

    const t = setTimeout(tryRender, 150)
    return () => clearTimeout(t)
  }, [renderedMd])



  /* ── Topbar tagline ───────────────────────────────────────── */
  const tagline = loading
    ? 'Loading…'
    : data && activeCert
      ? buildTagline(data, activeCert, activeTopic, activeRoadmap)
      : 'Kubernetes Certification Learning'

  const certAccentStyle = { '--accent': CERT_ACCENT[activeCert] ?? CERT_ACCENT.kcna } as React.CSSProperties

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="app">
      <div className="main" data-landing={!activeCert ? 'true' : undefined}>

        {/* Sidebar — only rendered once a cert is selected */}
        {data && activeCert && (
          <Sidebar
            tree={data.tree}
            activeTopic={activeTopic}
            activeRoadmap={activeRoadmap}
            activeCert={activeCert}
            onSelect={handleSelect}
            onRoadmapSelect={handleRoadmapSelect}
            onCertSelect={handleCertSelect}
          />
        )}

        <main className="content-area">

          {/* Topbar — only rendered once a cert is selected */}
          {activeCert && (
            <div className="topbar" style={certAccentStyle}>
              <button className="back-home" onClick={() => handleCertSelect('')} title="Back to home page">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                  <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
                </svg>
                <span>Back to home</span>
              </button>
              <div className="topbar-spacer" />
              <span className="header-tagline">{tagline}</span>
            </div>
          )}

          <div className="content-scroll" ref={contentRef}>

            {/* Loading state */}
            {loading && (
              <div className="loading">
                <div className="spinner" />
                <p>Reading content repository…</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="error-box" style={{ marginTop: '2rem' }}>
                ⚠️ <strong>Content load failed:</strong> {error}
              </div>
            )}

            {/* ── Landing page ──────────────────────────────── */}
            {!loading && !error && !activeTopic && !activeRoadmap && !activeCert && (
              <div className="landing">
                <div className="landing-bg" />

                <header className="landing-hero">
                  <div className="hero-eyebrow">
                    <span className="hero-dot" /> The hands-on path to Kubernetes certification
                  </div>
                  <h1 className="hero-title">
                    Master Kubernetes,<br /><span className="hero-grad">one module at a time.</span>
                  </h1>
                  <p className="hero-sub">
                    Structured, exam-aligned tracks for every CNCF certification — written by practitioners,
                    built for deep focus. Pick a path and start studying.
                  </p>
                </header>

                {data && (
                  <section className="track-grid">
                    {TRACKS.filter(t => data.tree[t.id]).map(t => {
                      const roadmapCount = Object.keys(data.tree[t.id] || {}).length
                      const topicCount   = Object.values(data.tree[t.id] || {}).flat().length
                      return (
                        <button
                          key={t.id}
                          className="track-card"
                          style={{ '--accent': t.accent } as React.CSSProperties}
                          onClick={() => handleCertSelect(t.id)}
                        >
                          <div className="track-card-glow" />
                          <div className="track-card-top">
                            <span className="track-level">{t.level}</span>
                          </div>
                          <div className="track-name">{t.name}</div>
                          <div className="track-full">{t.full}</div>
                          <p className="track-blurb">{t.blurb}</p>
                          <div className="track-card-foot">
                            <span className="track-meta">{roadmapCount} roadmaps · {topicCount} topics</span>
                            <span className="track-go">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </section>
                )}

                <footer className="landing-foot">
                  4 certification tracks · 100% aligned to the official CNCF curricula
                </footer>
              </div>
            )}

            {/* ── Certification Intro Page ──────────────────── */}
            {!loading && !error && !activeTopic && !activeRoadmap && activeCert && (
              <CertIntro certId={activeCert} details={data?.exams?.[activeCert.toLowerCase()] || null} onStartTrack={handleStartTrack} />
            )}

            {/* ── Roadmap overview grid ─────────────────────── */}
            {!loading && !error && !activeTopic && activeRoadmap && (
              <RoadmapOverview
                cert={activeRoadmap.cert}
                roadmap={activeRoadmap.roadmap}
                topics={activeRoadmap.topics}
                onSelect={handleSelect}
              />
            )}

            {/* ── Topic reader + Quiz ───────────────────────── */}
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

                <LabCard topicTitle={activeTopic.meta.title} slug={activeTopic.slug} />
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
