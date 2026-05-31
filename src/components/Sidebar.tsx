'use client'

import { useState, useEffect } from 'react'
import type { TopicEntry } from '@/types/content'

interface SidebarProps {
  tree: Record<string, Record<string, TopicEntry[]>>
  activeTopic: TopicEntry | null
  activeRoadmap: { cert: string; roadmap: string } | null
  activeCert: string
  onSelect: (t: TopicEntry) => void
  onRoadmapSelect: (cert: string, roadmap: string, topics: TopicEntry[]) => void
  onCertSelect: (cert: string) => void
}

const CERT_META: Record<string, { label: string; color: string; icon: string }> = {
  cka:  { label: 'Administrator',      color: 'cert-cka',  icon: '⚙️' },
  ckad: { label: 'App Developer',      color: 'cert-ckad', icon: '💻' },
  cks:  { label: 'Security Specialist',color: 'cert-cks',  icon: '🔒' },
  kcna: { label: 'Cloud Native Assoc', color: 'cert-kcna', icon: '☁️' },
}

const CERT_ORDER = ['cka', 'ckad', 'cks', 'kcna']

/** Human-readable labels for roadmap keys that may be kebab-case or abbreviated. */
const ROADMAP_LABELS: Record<string, string> = {
  'core-concepts':                  'Core Concepts',
  'k8s-architecture':               'K8s Architecture',
  'application-design':             'Application Design',
  'services-networking':            'Services & Networking',
  'storage':                        'Storage',
  'security':                       'Security',
  'observability':                  'Observability',
  'application lifecycle management': 'Application Lifecycle Management',
}

/** Return a display label for a roadmap key. */
function roadmapLabel(rm: string): string {
  return ROADMAP_LABELS[rm.toLowerCase().trim()] ?? rm
}

const DIFF_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

/** Sort topics by difficulty then by explicit order field. */
function sortTopics(topics: TopicEntry[]): TopicEntry[] {
  return [...topics].sort((a, b) => {
    const da = DIFF_RANK[a.meta.difficulty] ?? 99
    const db = DIFF_RANK[b.meta.difficulty] ?? 99
    if (da !== db) return da - db
    return (a.meta.order || 99) - (b.meta.order || 99)
  })
}

/** Cert accent colour used on sidebar `--accent` CSS custom property. */
function accentForCert(cert: string): string {
  const map: Record<string, string> = {
    cka:  'oklch(0.66 0.13 250)',
    ckad: 'oklch(0.70 0.13 155)',
    cks:  'oklch(0.78 0.11 85)',
  }
  return map[cert] ?? 'oklch(0.66 0.14 300)'
}

export default function Sidebar({
  tree, activeTopic, activeRoadmap, activeCert,
  onSelect, onRoadmapSelect, onCertSelect,
}: SidebarProps) {
  const allCerts = [...new Set([...CERT_ORDER, ...Object.keys(tree)])].filter(c => tree[c])
  const visibleCerts = activeCert ? [activeCert].filter(c => tree[c]) : allCerts

  /* ── Collapsible cert groups ─────────────────────────────── */
  const [openCerts, setOpenCerts] = useState<Set<string>>(() => {
    const s = new Set<string>()
    if (activeTopic)  s.add(activeTopic.cert)
    if (activeRoadmap) s.add(activeRoadmap.cert)
    if (!activeTopic && !activeRoadmap) allCerts.forEach(c => s.add(c))
    return s
  })

  useEffect(() => {
    if (activeTopic)
      setOpenCerts(prev => prev.has(activeTopic.cert) ? prev : new Set([...prev, activeTopic.cert]))
  }, [activeTopic])

  const toggleCert = (cert: string) =>
    setOpenCerts(prev => {
      const next = new Set(prev)
      next.has(cert) ? next.delete(cert) : next.add(cert)
      return next
    })

  /* ── Collapsible roadmap groups ──────────────────────────── */
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const s = new Set<string>()
    if (activeTopic)   s.add(`${activeTopic.cert}::${activeTopic.roadmap}`)
    return s
  })

  useEffect(() => {
    if (activeTopic) {
      const key = `${activeTopic.cert}::${activeTopic.roadmap}`
      setOpenGroups(prev => prev.has(key) ? prev : new Set([...prev, key]))
    }
  }, [activeTopic])

  const toggleGroup = (key: string) =>
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const handleRoadmapClick = (cert: string, roadmap: string, topics: TopicEntry[]) => {
    const key    = `${cert}::${roadmap}`
    const isOpen = openGroups.has(key)
    if (isOpen && activeRoadmap?.cert === cert && activeRoadmap?.roadmap === roadmap && !activeTopic) {
      toggleGroup(key)
    } else {
      setOpenGroups(prev => new Set([...prev, key]))
      onRoadmapSelect(cert, roadmap, topics)
    }
  }

  return (
    <nav className="sidebar" style={{ '--accent': accentForCert(activeCert) } as React.CSSProperties}>

      {/* ── Brand / Home button ──────────────────────────── */}
      <button
        className="brand"
        onClick={() => onCertSelect('')}
        title="Go to home page"
        style={{ padding: '22px 22px 16px', borderBottom: '1px solid var(--border)' }}
      >
        <span className="brand-mark">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.2" />
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="2.6"  x2="12" y2="8.8" />
            <line x1="12" y1="15.2" x2="12" y2="21.4" />
            <line x1="2.6"  y1="12" x2="8.8"  y2="12" />
            <line x1="15.2" y1="12" x2="21.4" y2="12" />
          </svg>
        </span>
        <span className="brand-name">k8s<span className="brand-accent">learn</span></span>
      </button>

      {/* ── Active cert badge header ──────────────────────── */}
      <div className="sidebar-header-scoped">
        {activeCert && CERT_META[activeCert] && (
          <button 
            className="active-cert-header" 
            onClick={() => onCertSelect(activeCert)}
            title={`View ${CERT_META[activeCert].label} syllabus`}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}
          >
            <span className={`cert-badge ${CERT_META[activeCert].color}`}>{activeCert.toUpperCase()}</span>
            <span className="active-cert-name">{CERT_META[activeCert].label}</span>
          </button>
        )}
      </div>

      {/* ── Collapsible cert + roadmap tree ──────────────── */}
      <div className="sidebar-scroll">
        {visibleCerts.map(cert => {
          const isCertOpen   = activeCert ? true : openCerts.has(cert)
          const totalTopics  = Object.values(tree[cert] || {}).flat().length

          return (
            <div key={cert} className="cert-group">

              {/* Cert header — collapsible only in 'All' view */}
              {!activeCert && (
                <button className="cert-label cert-label-btn" onClick={() => toggleCert(cert)}>
                  <span className={`cert-chevron ${isCertOpen ? 'open' : ''}`}>›</span>
                  <span className={`cert-badge ${CERT_META[cert]?.color || ''}`}>{cert.toUpperCase()}</span>
                  <span className="cert-name">{CERT_META[cert]?.label || cert}</span>
                  <span className="cert-topic-count">{totalTopics}</span>
                </button>
              )}

              {/* Animated cert body */}
              <div className={`cert-body ${isCertOpen ? 'cert-body-open' : ''}`}>
                {Object.entries(tree[cert] || {}).map(([roadmap, topics]) => {
                  const key            = `${cert}::${roadmap}`
                  const isOpen         = openGroups.has(key)
                  const isActiveRoadmap = activeRoadmap?.cert === cert && activeRoadmap?.roadmap === roadmap

                  return (
                    <div key={roadmap} className="roadmap-group">
                      <button
                        className={`roadmap-label roadmap-label-btn ${isActiveRoadmap && !activeTopic ? 'roadmap-active' : ''}`}
                        onClick={() => handleRoadmapClick(cert, roadmap, topics)}
                      >
                        <span className={`roadmap-chevron ${isOpen ? 'open' : ''}`}>›</span>
                        <span className="roadmap-icon">📂</span> {roadmapLabel(roadmap)}
                        <span className="roadmap-count">{topics.length}</span>
                      </button>

                      <div className={`roadmap-topics ${isOpen ? 'roadmap-topics-open' : ''}`}>
                        {sortTopics(topics).map(t => (
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
                    </div>
                  )
                })}
              </div>

            </div>
          )
        })}
      </div>
    </nav>
  )
}
