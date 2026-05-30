import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export interface TopicMeta {
  title: string
  cert: string
  roadmap: string
  subtopic: string
  difficulty: string
  content: string
  order?: number
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
        const meta: TopicMeta = JSON.parse(fs.readFileSync(full, 'utf8'))
        const mdPath = path.join(path.dirname(full), meta.content)
        const mdContent = fs.existsSync(mdPath)
          ? fs.readFileSync(mdPath, 'utf8')
          : '# Content not found'
        const rel = path.relative(base, path.dirname(full))
        const parts = rel.split(path.sep)
        results.push({
          slug: rel.replace(/\\/g, '/'),
          cert: parts[0] || meta.cert,
          roadmap: parts[1] || meta.roadmap,
          subtopicSlug: parts[2] || meta.subtopic,
          meta,
          mdContent,
        })
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
