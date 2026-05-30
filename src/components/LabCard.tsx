'use client'

import { useState, useEffect } from 'react'

interface LabCardProps {
  topicTitle: string
  slug: string
}

export default function LabCard({ topicTitle, slug }: LabCardProps) {
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [typedText, setTypedText] = useState('')
  const [isDone, setIsDone] = useState(false)

  const command = `kubeology-cli start-lab --topic "${slug.split('/').pop() || 'k8s'}"`

  useEffect(() => {
    // Reset state when topic changes
    setTerminalLines([])
    setTypedText('')
    setIsDone(false)

    let charIndex = 0
    let typeInterval: NodeJS.Timeout

    const startTyping = () => {
      typeInterval = setInterval(() => {
        if (charIndex < command.length) {
          setTypedText(command.substring(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(typeInterval)
          // Run simulated terminal output steps
          runSimulatedLabLogs()
        }
      }, 35)
    }

    // Delay typing slightly for entry animation feel
    const startDelay = setTimeout(startTyping, 600)

    return () => {
      clearTimeout(startDelay)
      clearInterval(typeInterval)
    }
  }, [slug])

  const runSimulatedLabLogs = () => {
    const logs = [
      `[sys] Booting virtual Kubernetes control plane...`,
      `[sys] Allocating namespace "sandbox-${slug.split('/').pop() || 'env'}"`,
      `[warn] 🚧 ACCESS RESTRICTED: Hands-on labs are currently coming soon!`,
      `[info] Join our waitlist or check back in the next curriculum update.`,
    ]

    logs.forEach((log, index) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, log])
        if (index === logs.length - 1) {
          setIsDone(true)
        }
      }, (index + 1) * 700)
    })
  }

  return (
    <section className="lab-section" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
      <div className="lab-card-glow" />
      <div className="lab-card">
        
        {/* Lab Header */}
        <div className="lab-header">
          <div className="lab-title-group">
            <span className="lab-icon-badge">⚡</span>
            <div>
              <h3 className="lab-title">Hands-on Lab</h3>
              <p className="lab-subtitle">Practice {topicTitle} in a live browser terminal</p>
            </div>
          </div>
          <div className="lab-status-badge">
            <span className="pulse-dot" />
            <span>Coming Soon</span>
          </div>
        </div>

        {/* Interactive Lab Terminal */}
        <div className="lab-terminal">
          <div className="terminal-bar">
            <div className="terminal-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="terminal-tab-title">tty1 · bash</div>
            <div className="terminal-action-badge">k8s-sandbox</div>
          </div>

          <div className="terminal-body">
            <div className="terminal-line input-line">
              <span className="terminal-prompt">admin@kubeology:~$</span>{' '}
              <span className="terminal-typed-cmd">{typedText}</span>
              {!isDone && <span className="terminal-cursor">|</span>}
            </div>

            {terminalLines.map((line, idx) => {
              let lineClass = 'terminal-output'
              if (line.includes('[warn]')) lineClass += ' terminal-warn'
              if (line.includes('[sys]')) lineClass += ' terminal-sys'
              if (line.includes('[info]')) lineClass += ' terminal-info'

              return (
                <div key={idx} className={`terminal-line ${lineClass}`}>
                  {line}
                </div>
              )
            })}

            {isDone && (
              <div className="terminal-line prompt-line-next fade-in">
                <span className="terminal-prompt">admin@kubeology:~$</span>{' '}
                <span className="terminal-cursor blink">_</span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive action banner */}
        <div className="lab-footer">
          <div className="lab-footer-text">
            🚀 <strong>Get Ready:</strong> Live sandboxes with interactive validation tasks are arriving soon.
          </div>
          <button className="lab-notify-btn" disabled>
            Notify Me
          </button>
        </div>

      </div>
    </section>
  )
}
