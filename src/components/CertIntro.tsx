'use client'

import React from 'react'

interface CertDetails {
  title: string
  subtitle: string
  duration: string
  passingScore: string
  format: string
  price: string
  attempts: string
  curriculum: { domain: string; weight: number }[]
}

const CERT_OFFICIAL_DATA: Record<string, CertDetails> = {
  cka: {
    title: 'Certified Kubernetes Administrator',
    subtitle: 'The gold standard for cluster administrators. Focuses on production-grade cluster architecture, installation, configuration, networking, storage, security, and day-two troubleshooting.',
    duration: '2 Hours',
    passingScore: '66%',
    format: 'Hands-on Performance-based (Interactive CLI)',
    price: '$395 USD',
    attempts: '2 attempts included',
    curriculum: [
      { domain: 'Cluster Architecture, Installation & Configuration', weight: 25 },
      { domain: 'Workloads & Scheduling', weight: 15 },
      { domain: 'Services & Networking', weight: 20 },
      { domain: 'Storage', weight: 10 },
      { domain: 'Troubleshooting', weight: 30 },
    ],
  },
  ckad: {
    title: 'Certified Kubernetes Application Developer',
    subtitle: 'Designed for engineers who build, deploy, configure, secure, and troubleshoot cloud-native applications. Emphasizes design patterns, multi-container pods, volumes, service configuration, and networking.',
    duration: '2 Hours',
    passingScore: '66%',
    format: 'Hands-on Performance-based (Interactive CLI)',
    price: '$395 USD',
    attempts: '2 attempts included',
    curriculum: [
      { domain: 'Application Design and Build', weight: 20 },
      { domain: 'Application Deployment', weight: 20 },
      { domain: 'Application Environment, Security and Configuration', weight: 25 },
      { domain: 'Application Observability and Maintenance', weight: 15 },
      { domain: 'Services and Networking', weight: 20 },
    ],
  },
  cks: {
    title: 'Certified Kubernetes Security Specialist',
    subtitle: 'Advanced security certification focused on securing supply chains, cluster setup, system hardening, minimizing microservice vulnerabilities, runtime detection, auditing, and compliance. CKA is a prerequisite.',
    duration: '2 Hours',
    passingScore: '66%',
    format: 'Hands-on Performance-based (Interactive CLI)',
    price: '$395 USD',
    attempts: '2 attempts included',
    curriculum: [
      { domain: 'Cluster Setup', weight: 10 },
      { domain: 'Cluster Hardening', weight: 15 },
      { domain: 'System Hardening', weight: 15 },
      { domain: 'Minimize Microservice Vulnerabilities', weight: 20 },
      { domain: 'Supply Chain Security', weight: 20 },
      { domain: 'Monitoring, Logging and Runtime Security', weight: 20 },
    ],
  },
  kcna: {
    title: 'Kubernetes & Cloud Native Associate',
    subtitle: 'The foundational entry point to the cloud-native ecosystem. Perfect for demonstrating understanding of basic Kubernetes core architecture, container orchestration, cloud-native delivery, observability, and CNCF landscape.',
    duration: '90 Minutes',
    passingScore: '75%',
    format: 'Multiple Choice (Online Proctored)',
    price: '$250 USD',
    attempts: '2 attempts included',
    curriculum: [
      { domain: 'Kubernetes Fundamentals', weight: 46 },
      { domain: 'Container Orchestration', weight: 22 },
      { domain: 'Cloud Native Architecture', weight: 16 },
      { domain: 'Cloud Native Observability', weight: 8 },
      { domain: 'Cloud Native Application Delivery', weight: 8 },
    ],
  },
}

const CERT_ACCENT: Record<string, string> = {
  cka:  'oklch(0.66 0.13 250)',
  ckad: 'oklch(0.70 0.13 155)',
  cks:  'oklch(0.78 0.11 85)',
  kcna: 'oklch(0.66 0.14 300)',
}

interface CertIntroProps {
  certId: string
  onStartTrack: () => void
}

export default function CertIntro({ certId, onStartTrack }: CertIntroProps) {
  const details = CERT_OFFICIAL_DATA[certId.toLowerCase()]
  if (!details) return null

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
