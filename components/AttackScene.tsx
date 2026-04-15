'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuestStore } from '@/store/questStore'
import { QUESTS } from '@/data/quests'

const CHARACTER_EMOJI: Record<string, string> = {
  '용사': '🗡️',
  '마법사': '🧙',
  '엘프': '🏹',
  '용': '🐉',
  '요정': '🧚',
  '오크': '👹',
}

interface AttackSceneProps {
  isChapterComplete?: boolean
  onComplete: () => void
}

export default function AttackScene({ isChapterComplete = false, onComplete }: AttackSceneProps) {
  const { character, castleHp } = useQuestStore()
  const emoji = character ? CHARACTER_EMOJI[character] : '⚔️'
  const damagePerQuest = 100 / QUESTS.length

  useEffect(() => {
    const timer = setTimeout(onComplete, isChapterComplete ? 3500 : 2500)
    return () => clearTimeout(timer)
  }, [onComplete, isChapterComplete])

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-hidden">
      {/* 배경 섬광 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0, 0.2, 0] }}
        transition={{ duration: 1.2, times: [0, 0.2, 0.4, 0.6, 1] }}
        style={{ background: 'radial-gradient(circle, #f5c518 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col items-center gap-8">
        {/* 챕터 완료 특별 효과 */}
        {isChapterComplete && (
          <motion.div
            className="absolute -top-20 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-3xl font-bold text-[#f5c518]">챕터 클리어!!! 💥</p>
          </motion.div>
        )}

        {/* 공격 씬 */}
        <div className="flex items-center gap-12">
          {/* 캐릭터 */}
          <motion.div
            className="text-7xl"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: [- 100, 0, 40, 0], opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {emoji}
          </motion.div>

          {/* 공격 이펙트 */}
          <motion.div
            className="text-4xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0.8, 1.2, 0], opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.5 }}
          >
            {isChapterComplete ? '💥💥💥' : '⚡'}
          </motion.div>

          {/* 마왕성 */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-7xl"
              animate={
                isChapterComplete
                  ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 0.8, 0.8, 0.6, 0.4] }
                  : { rotate: [0, -5, 5, 0], x: [0, -8, 8, 0] }
              }
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              🏰
            </motion.div>
            {/* HP 바 */}
            <div className="mt-2 w-24 bg-[#3d2a1a] rounded-full h-3">
              <motion.div
                className="h-3 rounded-full"
                style={{ background: 'linear-gradient(to right, #ff6b35, #ff4444)' }}
                initial={{ width: `${Math.min(100, castleHp + damagePerQuest)}%` }}
                animate={{ width: `${castleHp}%` }}
                transition={{ duration: 0.6, delay: 0.9 }}
              />
            </div>
            <motion.p
              className="text-xs text-[#ff4444] mt-1 font-bold"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-6, -16, -20, -26] }}
              transition={{ duration: 1.2, delay: 0.9 }}
            >
              -{Math.ceil(damagePerQuest)} HP
            </motion.p>
            <p className="text-xs text-[#ff6b35] font-bold">{Math.round(castleHp)}/100</p>
          </motion.div>
        </div>

        {/* XP 획득 표시 */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.p
            className="text-3xl font-bold text-[#f5c518]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            +20 XP!
          </motion.p>
          <p className="text-[#c8b89a] text-sm">퀘스트 완료!</p>
        </motion.div>

        {/* 파티클 */}
        {isChapterComplete &&
          Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{
                top: '50%',
                left: '50%',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 150,
                y: Math.sin((i / 12) * Math.PI * 2) * 150,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 1.5, delay: 0.5 + i * 0.05 }}
            >
              {['⭐', '✨', '💫', '🌟'][i % 4]}
            </motion.div>
          ))}
      </div>
    </div>
  )
}
