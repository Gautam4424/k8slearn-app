'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

import type { ContentData, TopicEntry } from '@/types/content'
import { renderMarkdown } from '@/utils/markdown'
import Quiz from '@/components/Quiz'
import RoadmapOverview from '@/components/RoadmapOverview'
import Sidebar from '@/components/Sidebar'

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

  /* ── Fetch content tree on mount ─────────────────────────── */
  useEffect(() => {
    fetch('/api/content')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d  => setData(d))
      .catch(e => setError(e.message))
      .finally(()=> setLoading(false))
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

  /* ── Scroll-to-top helper ─────────────────────────────────── */
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollTop  = () => { if (contentRef.current) contentRef.current.scrollTop = 0 }

  /* ── Navigation handlers ──────────────────────────────────── */
  const handleSelect = useCallback((t: TopicEntry) => {
    setActiveTopic(t)
    setActiveRoadmap(prev => prev ? { ...prev } : null)
    setTimeout(scrollTop, 0)
  }, [])

  const handleRoadmapSelect = useCallback((cert: string, roadmap: string, topics: TopicEntry[]) => {
    setActiveRoadmap({ cert, roadmap, topics })
    setActiveTopic(null)
    setTimeout(scrollTop, 0)
  }, [])

  const handleCertSelect = useCallback((cert: string) => {
    setActiveCert(cert)
    if (cert === '') {
      setActiveTopic(null)
      setActiveRoadmap(null)
    } else if (data?.tree[cert]) {
      const roadmaps = Object.keys(data.tree[cert])
      if (roadmaps.length > 0) {
        setActiveRoadmap({ cert, roadmap: roadmaps[0], topics: data.tree[cert][roadmaps[0]] })
        setActiveTopic(null)
      } else {
        setActiveTopic(null)
        setActiveRoadmap(null)
      }
    } else {
      setActiveTopic(null)
      setActiveRoadmap(null)
    }
    setTimeout(scrollTop, 0)
  }, [data])

  /* ── Memoised rendered markdown ───────────────────────────── */
  const renderedMd = useMemo(
    () => activeTopic ? renderMarkdown(activeTopic.mdContent) : '',
    [activeTopic],
  )

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
            {!loading && !error && !activeTopic && !activeRoadmap && (
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
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
