'use client'

import React from 'react'
import { ExamDetails } from '@/types/content'

const CERT_ACCENT: Record<string, string> = {
  cka:  'oklch(0.66 0.13 250)',
  ckad: 'oklch(0.70 0.13 155)',
  cks:  'oklch(0.78 0.11 85)',
  kcna: 'oklch(0.66 0.14 300)',
}

interface CertIntroProps {
  certId: string
  details: ExamDetails | null
  onStartTrack: () => void
}

export default function CertIntro({ certId, details, onStartTrack }: CertIntroProps) {
  if (!details) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-soft)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading exam syllabus from content repository…</p>
      </div>
    )
  }

  const accentColor = CERT_ACCENT[certId.toLowerCase()] ?? CERT_ACCENT.kcna

  return (
    <div className="cert-intro-page" style={{ animation: 'fadeIn 0.35s ease-out', '--accent': accentColor } as React.CSSProperties}>
      
      {/* Hero Header */}
      <header className="cert-intro-hero" style={{ marginBottom: '2.5rem', position: 'relative' }}>
        <div className="cert-badge-glow" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span className={`cert-badge cert-${certId.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
            {certId.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Official Linux Foundation Syllabus
          </span>
        </div>
        <h1 className="cert-intro-title" style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 1rem', lineHeight: 1.2, color: 'var(--text)' }}>
          {details.title}
        </h1>
        <p className="cert-intro-desc" style={{ fontSize: '1.05rem', color: 'var(--text-soft)', lineHeight: 1.6, maxWidth: '800px', margin: 0 }}>
          {details.subtitle}
        </p>
      </header>

      {/* Grid of Quick Facts */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.25rem' }}>
          Exam Structure & Details
        </h2>
        <div className="facts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          
          <div className="fact-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Duration</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{details.duration}</span>
          </div>

          <div className="fact-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Passing Score</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{details.passingScore}</span>
          </div>

          <div className="fact-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Price & Retakes</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{details.price}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>{details.attempts}</span>
          </div>

          <div className="fact-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Exam Format</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{details.format}</span>
          </div>

        </div>
      </section>

      {/* Curriculum Weightage domain bars */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Curriculum Domains & Weightage
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CNCF Curricula v1.31
          </span>
        </div>

        <div className="curriculum-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid var(--border)', padding: '1.75rem', borderRadius: '16px' }}>
          {details.curriculum.map((domain, index) => (
            <div key={index} className="domain-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-soft)' }}>{domain.domain}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{domain.weight}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${domain.weight}%`, 
                    background: 'var(--accent)', 
                    borderRadius: '99px',
                    boxShadow: '0 0 10px var(--accent)'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Launch CTA */}
      <section className="intro-cta" style={{ textAlign: 'center', padding: '2.5rem', background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', border: '1px dashed rgba(59, 130, 246, 0.25)', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ready to start learning?</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Explore our structured roadmap, hands-on tutorials, practice quizzes, and command simulators.
        </p>
        <button 
          className="btn btn-primary pulse-btn" 
          onClick={onStartTrack} 
          style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}
        >
          Start Learning Track 🚀
        </button>
      </section>

    </div>
  )
}
