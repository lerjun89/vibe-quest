'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuestStore, type CharacterType } from '@/store/questStore'

const CHARACTERS: { name: CharacterType; emoji: string; desc: string }[] = [
  { name: '용사', emoji: '🗡️', desc: '강인한 의지로 적을 정면 돌파!' },
  { name: '마법사', emoji: '🧙', desc: '지식의 힘으로 마법을 구사!' },
  { name: '엘프', emoji: '🏹', desc: '빠른 손놀림으로 코드를 사냥!' },
  { name: '용', emoji: '🐉', desc: '두려움 없이 어떤 버그도 태워버려!' },
  { name: '요정', emoji: '🧚', desc: '창의력으로 아름다운 UI를 만들어!' },
  { name: '오크', emoji: '👹', desc: '막강한 체력으로 밤샘 코딩도 거뜬!' },
]

export default function CharacterSelect() {
  const [hovered, setHovered] = useState<string | null>(null)
  const { setCharacter } = useQuestStore()
  const router = useRouter()

  function handleSelect(name: CharacterType) {
    setCharacter(name)
    router.push('/home')
  }

  return (
    <div className="min-h-screen bg-[#1a0e05] flex flex-col items-center justify-center px-4 py-12">
      {/* 타이틀 */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[#f5c518] mb-3">
          ⚔️ 바이브코딩 퀘스트
        </h1>
        <p className="text-[#c8b89a] text-lg">용사여, 직업을 선택하라!</p>
        <p className="text-[#7c6a5a] text-sm mt-1">마왕성을 무너뜨릴 동료를 선택해줘</p>
      </motion.div>

      {/* 캐릭터 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
        {CHARACTERS.map((char, i) => (
          <motion.button
            key={char.name}
            className={`rounded-2xl border-2 p-5 text-center transition-all cursor-pointer ${
              hovered === char.name
                ? 'bg-[#2d1a0e] border-[#f5c518] shadow-lg shadow-[#f5c51840]'
                : 'bg-[#2d1a0e] border-[#5a3a1a] hover:border-[#f5c518]'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHovered(char.name)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => handleSelect(char.name)}
          >
            <div className="text-5xl mb-3">{char.emoji}</div>
            <p className="font-bold text-[#f5c518] text-lg mb-1">{char.name}</p>
            <p className="text-[#c8b89a] text-xs leading-relaxed">{char.desc}</p>
          </motion.button>
        ))}
      </div>

      <motion.p
        className="mt-8 text-[#7c6a5a] text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        나중에 변경할 수 없어요. 신중하게 선택하세요!
      </motion.p>
    </div>
  )
}
