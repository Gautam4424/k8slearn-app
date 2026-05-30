import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export interface TopicMeta {
  title: string
  cert: string | string[]
  roadmap: string | Record<string, string>
  subtopic: string
  difficulty: string
  content: string
  order?: number | Record<string, number>
  tags?: string[]
  questions: Question[]
}

export interface Question {
  type: string
  q: string
  options: string[]
  answer: number
  explanation: string
}

export interface TopicEntry {
  slug: string
  cert: string
  roadmap: string
  subtopicSlug: string
  meta: TopicMeta
  mdContent: string
}

function walk(dir: string, base: string, results: TopicEntry[]) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, base, results)
    } else if (entry.name.endsWith('.json') && entry.name !== 'schema.json') {
      try {
        const rawContent = fs.readFileSync(full, 'utf8')
        const contentStr = rawContent.replace(/^\uFEFF/, '')
        const meta: TopicMeta = JSON.parse(contentStr)

        const mdPath = path.join(path.dirname(full), typeof meta.content === 'string' ? meta.content : '')
        const mdContent = fs.existsSync(mdPath)
          ? fs.readFileSync(mdPath, 'utf8')
          : '# Content not found'
        const rel = path.relative(base, path.dirname(full))
        const parts = rel.split(path.sep)

        const certList = Array.isArray(meta.cert)
          ? meta.cert
          : [parts[0] || meta.cert]

        for (const c of certList) {
          if (!c) continue

          // Resolve roadmap name
          let resolvedRoadmap = parts[1] || ''
          if (meta.roadmap) {
            if (typeof meta.roadmap === 'object' && meta.roadmap !== null) {
              resolvedRoadmap = (meta.roadmap as Record<string, string>)[c] || resolvedRoadmap
            } else if (typeof meta.roadmap === 'string') {
              resolvedRoadmap = meta.roadmap
            }
          }

          // Resolve order
          let resolvedOrder: number | undefined = undefined
          if (meta.order !== undefined) {
            if (typeof meta.order === 'object' && meta.order !== null) {
              resolvedOrder = (meta.order as Record<string, number>)[c]
            } else if (typeof meta.order === 'number') {
              resolvedOrder = meta.order
            }
          }

          const subtopicSlugPart = parts[2] || (meta.subtopic ? meta.subtopic.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'topic')
          const roadmapSlugPart = resolvedRoadmap.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const slug = `${c}/${roadmapSlugPart}/${subtopicSlugPart}`

          // Create standard TopicMeta representation for the React component
          const normalizedMeta = {
            ...meta,
            cert: c,
            roadmap: resolvedRoadmap,
            order: resolvedOrder,
          }

          results.push({
            slug,
            cert: c,
            roadmap: resolvedRoadmap,
            subtopicSlug: subtopicSlugPart,
            meta: normalizedMeta as any,
            mdContent,
          })
        }
      } catch (_) {}
    }
  }
}

export async function GET() {
  const contentDir = path.join(process.cwd(), 'content', 'content')
  const topics: TopicEntry[] = []
  walk(contentDir, contentDir, topics)

  // Group by cert -> roadmap -> topics
  const tree: Record<string, Record<string, TopicEntry[]>> = {}
  for (const t of topics) {
    if (!tree[t.cert]) tree[t.cert] = {}
    if (!tree[t.cert][t.roadmap]) tree[t.cert][t.roadmap] = []
    tree[t.cert][t.roadmap].push(t)
  }

  return NextResponse.json({ topics, tree })
}
