'use client'

import { useState, useEffect } from 'react'
import type { Question } from '@/types/content'

interface QuizProps {
  questions: Question[]
}

export default function Quiz({ questions }: QuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(questions.length).fill(null))
  const [currentQ, setCurrentQ] = useState(0)

  useEffect(() => {
    setAnswers(new Array(questions.length).fill(null))
    setCurrentQ(0)
  }, [questions])

  const handleAnswer = (qi: number, oi: number) => {
    if (answers[qi] !== null && answers[qi] !== undefined) return
    const next = [...answers]
    next[qi] = oi
    setAnswers(next)
    if (qi === currentQ && qi < questions.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 700)
    }
  }

  const safeAnswers = answers.slice(0, questions.length)
  const score      = safeAnswers.filter((a, i) => questions[i] && a === questions[i].answer).length
  const answered   = safeAnswers.filter(a => a !== null && a !== undefined).length
  const allDone    = answered === questions.length && questions.length > 0

  const reset = () => {
    setAnswers(new Array(questions.length).fill(null))
    setCurrentQ(0)
  }

  return (
    <div className="quiz-section">
      <div className="quiz-header">
        <h2>Practice Quiz</h2>
        <span className="quiz-count">{questions.length} questions</span>
      </div>

      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
        <span className="progress-text">{answered}/{questions.length}</span>
      </div>

      {allDone && (
        <div className="quiz-result" style={{ marginBottom: '1.5rem' }}>
          <div className="quiz-result-score">{score}/{questions.length}</div>
          <p>
            {score === questions.length
              ? '🎉 Perfect!'
              : score >= Math.ceil(questions.length * 0.7)
                ? '✅ Good job!'
                : '📖 Keep studying!'}
          </p>
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: '0.5rem' }}>
            Try Again
          </button>
        </div>
      )}

      {questions.map((q, qi) => {
        const selected   = answers[qi]
        const isAnswered = selected !== null && selected !== undefined
        if (qi > currentQ && !isAnswered) return null

        return (
          <div key={qi} className="question-card">
            <div className="question-num">
              Q{qi + 1} <span className="question-type-badge">{q.type}</span>
            </div>
            <div className="question-text">{q.q}</div>
            <div className="options">
              {q.options.map((opt, oi) => {
                const isCorrect  = oi === q.answer
                const isSelected = selected === oi
                let cls = 'option-btn'
                if (isAnswered) {
                  if (isSelected && isCorrect)   cls += ' selected-correct'
                  else if (isSelected && !isCorrect) cls += ' selected-wrong'
                  else if (isCorrect)            cls += ' reveal-correct'
                }
                return (
                  <button
                    key={oi}
                    className={cls}
                    disabled={isAnswered}
                    onClick={() => handleAnswer(qi, oi)}
                    id={`q${qi}-opt${oi}`}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                )
              })}
            </div>
            {isAnswered && (
              <div className="explanation">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
