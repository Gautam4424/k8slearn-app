export interface Question {
  type: string
  q: string
  options: string[]
  answer: number
  explanation: string
}

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

export interface TopicEntry {
  slug: string
  cert: string
  roadmap: string
  subtopicSlug: string
  meta: TopicMeta
  mdContent: string
}

export interface ContentData {
  topics: TopicEntry[]
  tree: Record<string, Record<string, TopicEntry[]>>
}
