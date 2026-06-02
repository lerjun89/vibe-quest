'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Quiz } from '@/data/quests'

interface QuizModalProps {
  quiz: Quiz
  onCorrect: () => void
  onClose: () => void
}

export default function QuizModal({ quiz, onCorrect, onClose }: QuizModalProps) {
  const [shuffled, setShuffled] = useState<{ text: string; originalIndex: number }[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [shake, setShake] = useState(false)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    const options = quiz.options.map((text, i) => ({ text, originalIndex: i }))
    // 셔플
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    setShuffled(options)
  }, [quiz])

  function handleSelect(idx: number) {
    if (answered) return
    const originalIndex = shuffled[idx].originalIndex
    setSelected(idx)
    setAnswered(true)

    if (originalIndex === quiz.answer) {
      // 정답 — 잠깐 후 onCorrect 호출
      setTimeout(() => onCorrect(), 1200)
    } else {
      // 오답 — 흔들기
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setSelected(null)
        setAnswered(false)
      }, 700)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="bg-[#1a0e05] border-2 border-[#f5c518] rounded-2xl p-6 max-w-lg w-full shadow-2xl"
          initial={{ scale: 0.8, y: 40 }}
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0 }}
          transition={shake ? { duration: 0.4 } : { type: 'spring', damping: 15 }}
        >
          {/* 퀴즈 헤더 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚔️</span>
            <h2 className="text-lg font-bold text-[#f5c518]">퀴즈 도전!</h2>
            <button
              onClick={onClose}
              className="ml-auto text-[#c8b89a] hover:text-[#f5f0e8] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 질문 */}
          <p className="text-[#f5f0e8] text-base mb-5 leading-relaxed">
            {quiz.question}
          </p>

          {/* 보기 */}
          <div className="space-y-3">
            {shuffled.map((option, idx) => {
              const isSelected = selected === idx
              const isCorrect = option.originalIndex === quiz.answer
              let btnClass =
                'w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium '

              if (answered && isSelected) {
                if (isCorrect) {
                  btnClass += 'bg-[#1b5e20] border-[#4caf50] text-[#a5d6a7]'
                } else {
                  btnClass += 'bg-[#7f0000] border-[#ef5350] text-[#ef9a9a]'
                }
              } else {
                btnClass +=
                  'bg-[#2d1a0e] border-[#5a3a1a] text-[#e8e0d4] hover:bg-[#3d2a1a] hover:border-[#f5c518] cursor-pointer'
              }

              return (
                <motion.button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelect(idx)}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-[#f5c518] mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option.text}
                </motion.button>
              )
            })}
          </div>

          {/* 정답 해설 */}
          {answered && selected !== null && shuffled[selected]?.originalIndex === quiz.answer && (
            <motion.div
              className="mt-4 p-3 bg-[#1b3a1b] border border-[#4caf50] rounded-lg text-[#a5d6a7] text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="font-bold text-[#4caf50]">정답! 🎉 </span>
              {quiz.explanation}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
