'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuestStore } from '@/store/questStore'
import { CHAPTERS } from '@/data/chapters'
import { QUESTS } from '@/data/quests'
import Sidebar from '@/components/Sidebar'

const CHARACTER_EMOJI: Record<string, string> = {
  '용사': '🗡️',
  '마법사': '🧙',
  '엘프': '🏹',
  '용': '🐉',
  '요정': '🧚',
  '오크': '👹',
}

export default function HomePage() {
  const router = useRouter()
  const { character, completedQuests, level, xp, castleHp } = useQuestStore()

  useEffect(() => {
    if (!character) {
      router.replace('/character')
    }
  }, [character, router])

  if (!character) return null

  const season1Chapters = CHAPTERS.filter((c) => c.season === 1)
  const totalQuests = season1Chapters.reduce((sum, c) => sum + c.questCount, 0)
  const completedCount = completedQuests.length
  const progressPct = Math.round((completedCount / totalQuests) * 100)

  return (
    <div className="min-h-screen flex flex-col bg-[#1a0e05]">
      {/* 헤더 */}
      <header className="bg-[#1a0e05] border-b border-[#3d2a1a] px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <Link href="/home" className="text-[#f5c518] font-bold text-xl tracking-tight flex items-center gap-2">
          ⚔️ 바이브코딩 퀘스트
        </Link>
        <nav className="ml-6 hidden md:flex gap-4 text-sm text-[#c8b89a]">
          <Link href="/home" className="hover:text-[#f5c518] transition-colors">홈</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[#c8b89a] text-sm">Lv.{level}</span>
          <span className="text-2xl">{CHARACTER_EMOJI[character]}</span>
          <span className="text-[#f5c518] font-semibold text-sm">{character}</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 사이드바 */}
        <Sidebar />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* 시즌1 진행률 배너 */}
          <motion.div
            className="bg-gradient-to-r from-[#2d1a0e] to-[#1a0e05] border border-[#5a3a1a] rounded-2xl p-6 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-[#f5c518]">시즌 1: 바이브코딩 입문</h1>
                <p className="text-[#c8b89a] text-sm mt-0.5">마왕성을 무너뜨려라!</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#ff6b35]">{Math.round(castleHp)}<span className="text-base text-[#c8b89a]">/100</span></p>
                <p className="text-xs text-[#c8b89a]">마왕성 HP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#3d2a1a] rounded-full h-4">
                <motion.div
                  className="h-4 rounded-full bg-gradient-to-r from-[#4361ee] to-[#7b8fff]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[#f5f0e8] font-bold text-sm min-w-[60px] text-right">
                {completedCount}/{totalQuests} 완료
              </span>
            </div>
          </motion.div>

          {/* 챕터 카드 그리드 */}
          <h2 className="text-lg font-bold text-[#f5f0e8] mb-4">📜 시즌 1 챕터</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {season1Chapters.map((chapter, i) => {
              const chapterQuests = QUESTS.filter((q) => q.chapterId === chapter.id)
              const completedInChapter = chapterQuests.filter((q) =>
                completedQuests.includes(q.id)
              ).length
              const totalInChapter = chapterQuests.length > 0 ? chapterQuests.length : chapter.questCount
              const isComplete = completedInChapter === totalInChapter && totalInChapter > 0
              const isInProgress = completedInChapter > 0 && !isComplete
              const isLocked = !chapter.free

              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={isLocked ? '#' : `/quest/${chapter.id}`}
                    className={`block rounded-xl border-2 p-5 transition-all ${
                      isLocked
                        ? 'opacity-50 cursor-not-allowed border-[#3d2a1a] bg-[#2d1a0e]'
                        : isComplete
                        ? 'border-[#4caf50] bg-[#1a2e1a] hover:border-[#66bb6a] hover:shadow-lg hover:shadow-[#4caf5020]'
                        : isInProgress
                        ? 'border-[#1565c0] bg-[#0d1a2e] hover:border-[#42a5f5] hover:shadow-lg hover:shadow-[#1565c020]'
                        : 'border-[#5a3a1a] bg-[#2d1a0e] hover:border-[#f5c518] hover:shadow-lg hover:shadow-[#f5c51820]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-[#7c6a5a] uppercase tracking-wider">
                        CH.{String(chapter.num).padStart(2, '0')}
                      </span>
                      <span className="text-lg">
                        {isLocked ? '🔒' : isComplete ? '✅' : isInProgress ? '⚔️' : '📜'}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base mb-3 leading-snug ${
                      isComplete ? 'text-[#a5d6a7]' : isInProgress ? 'text-[#90caf9]' : 'text-[#f5f0e8]'
                    }`}>
                      {chapter.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7c6a5a]">{totalInChapter}개 퀘스트</span>
                      <span className={`font-semibold ${
                        isComplete ? 'text-[#4caf50]' : isInProgress ? 'text-[#42a5f5]' : 'text-[#7c6a5a]'
                      }`}>
                        {completedInChapter}/{totalInChapter}
                      </span>
                    </div>
                    {/* 진행 바 */}
                    <div className="mt-2 w-full bg-[#3d2a1a] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isComplete ? 'bg-[#4caf50]' : 'bg-[#4361ee]'
                        }`}
                        style={{ width: `${(completedInChapter / totalInChapter) * 100}%` }}
                      />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* 시즌 2 예고 */}
          <div className="rounded-xl border-2 border-dashed border-[#3d2a1a] p-6 text-center opacity-60">
            <p className="text-2xl mb-2">🔮</p>
            <h3 className="font-bold text-[#7c6a5a] mb-1">시즌 2 — 곧 공개</h3>
            <p className="text-[#5a4a3a] text-sm">시즌 1을 완료하면 해금됩니다</p>
          </div>
        </main>
      </div>
    </div>
  )
}
