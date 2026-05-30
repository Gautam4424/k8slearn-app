'use client'

import { useState, useEffect } from 'react'
import type { Question } from '@/types/content'

interface QuizProps {
  questions: Question[]
}

export default function Quiz({ questions }: QuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(questions.length).fill(null))
  const [currentQ, setCurrentQ] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    setAnswers(new Array(questions.length).fill(null))
    setCurrentQ(0)
    setShowResult(false)
    setIsFading(false)
  }, [questions])

  const handleAnswer = (qi: number, oi: number) => {
    if (answers[qi] !== null && answers[qi] !== undefined) return
    const next = [...answers]
    next[qi] = oi
    setAnswers(next)
  }

  const handleNext = () => {
    setIsFading(true)
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(q => q + 1)
      } else {
        setShowResult(true)
      }
      setIsFading(false)
    }, 220)
  }

  const safeAnswers = answers.slice(0, questions.length)
  const score      = safeAnswers.filter((a, i) => questions[i] && a === questions[i].answer).length
  const answered   = safeAnswers.filter(a => a !== null && a !== undefined).length

  const reset = () => {
    setIsFading(true)
    setTimeout(() => {
      setAnswers(new Array(questions.length).fill(null))
      setCurrentQ(0)
      setShowResult(false)
      setIsFading(false)
    }, 220)
  }

  const activeQ = questions[currentQ]
  const selected = answers[currentQ]
  const isAnswered = selected !== null && selected !== undefined

  return (
    <div className="quiz-section" style={{ minHeight: '410px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Quiz Card Header */}
      <div className="quiz-header">
        <h2>Practice Quiz</h2>
        <span className="quiz-count">
          {showResult ? 'Completed' : `Question ${currentQ + 1} of ${questions.length}`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(answered / questions.length) * 100}%` }} 
          />
        </div>
        <span className="progress-text">{answered}/{questions.length}</span>
      </div>

      {/* Content wrapper with smooth opacity transition */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', opacity: isFading ? 0 : 1, transition: 'opacity 0.2s ease-in-out' }}>
        {showResult ? (
          <div className="quiz-result" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '1.5rem 0' }}>
            <div className="quiz-result-score" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
              {score} / {questions.length}
            </div>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-soft)', marginBottom: '1.5rem', textAlign: 'center' }}>
              {score === questions.length
                ? '🎉 Perfect! You mastered this topic!'
                : score >= Math.ceil(questions.length * 0.7)
                  ? '✅ Great job! You have a solid understanding.'
                  : '📖 Practice makes perfect. Study the material and try again!'}
            </p>
            <button className="btn btn-primary" onClick={reset} style={{ padding: '0.6rem 2rem' }}>
              Try Again
            </button>
          </div>
        ) : (
          activeQ && (
            <div className="question-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              <div className="question-num">
                Q{currentQ + 1} <span className="question-type-badge">{activeQ.type}</span>
              </div>

              <div className="question-text" style={{ fontSize: '1.05rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
                {activeQ.q}
              </div>

              <div className="options" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {activeQ.options.map((opt, oi) => {
                  const isCorrect  = oi === activeQ.answer
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
                      onClick={() => handleAnswer(currentQ, oi)}
                      id={`q${currentQ}-opt${oi}`}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>

              {isAnswered && (
                <div className="explanation-section" style={{ marginTop: '1.25rem', animation: 'fadeIn 0.25s ease-out' }}>
                  <div className="explanation" style={{ marginBottom: '1.25rem' }}>
                    <strong>Explanation:</strong> {activeQ.explanation}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleNext}
                      style={{ padding: '0.5rem 1.75rem', fontWeight: 600 }}
                    >
                      {currentQ < questions.length - 1 ? 'Next Question ›' : 'Finish Quiz 🏁'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )
        )}
      </div>
    </div>
  )
}
