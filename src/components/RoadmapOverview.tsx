import type { TopicEntry } from '@/types/content'

interface RoadmapOverviewProps {
  cert: string
  roadmap: string
  topics: TopicEntry[]
  onSelect: (t: TopicEntry) => void
}

const DIFF_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
const DIFF_COLORS: Record<string, string> = { beginner: 'tag-beginner', intermediate: 'tag-intermediate', advanced: 'tag-advanced' }
const DIFF_ICONS: Record<string, string>  = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' }

/** Extracts a short plain-text preview from raw markdown content. */
function getPreview(mdContent: string): string {
  for (const line of mdContent.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('|') || t.startsWith('>')) continue
    return t.replace(/\*\*|\*/g, '').replace(/`/g, '').slice(0, 140) + (t.length > 140 ? '…' : '')
  }
  return ''
}

export default function RoadmapOverview({ cert, roadmap, topics, onSelect }: RoadmapOverviewProps) {
  const sorted = [...topics].sort((a, b) => {
    const da = DIFF_RANK[a.meta.difficulty] ?? 99
    const db = DIFF_RANK[b.meta.difficulty] ?? 99
    if (da !== db) return da - db
    return (a.meta.order || 99) - (b.meta.order || 99)
  })

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
                <span className={`tag ${DIFF_COLORS[t.meta.difficulty] || ''}`}>
                  {DIFF_ICONS[t.meta.difficulty]} {t.meta.difficulty}
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
