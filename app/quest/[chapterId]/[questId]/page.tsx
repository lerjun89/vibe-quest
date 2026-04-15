'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuestStore } from '@/store/questStore'
import { QUESTS } from '@/data/quests'
import { CHAPTERS } from '@/data/chapters'
import Sidebar from '@/components/Sidebar'
import QuestText from '@/components/QuestText'
import QuizModal from '@/components/QuizModal'
import AttackScene from '@/components/AttackScene'
import { useTheme } from '@/components/ThemeProvider'

const CHARACTER_EMOJI: Record<string, string> = {
  '용사': '🗡️',
  '마법사': '🧙',
  '엘프': '🏹',
  '용': '🐉',
  '요정': '🧚',
  '오크': '👹',
}

export default function QuestPage() {
  const router = useRouter()
  const params = useParams()
  const chapterId = params.chapterId as string
  const questId = params.questId as string

  const { character, completedQuests, completeQuest } = useQuestStore()
  const { theme, toggle } = useTheme()

  const [showQuiz, setShowQuiz] = useState(false)
  const [showAttack, setShowAttack] = useState(false)
  const [chapterComplete, setChapterComplete] = useState(false)
  const [readPct, setReadPct] = useState(0)

  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!character) router.replace('/character')
  }, [character, router])

  // 읽기 진행바 — 페이지 스크롤 기준
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      const totalH = document.documentElement.scrollHeight - window.innerHeight
      if (totalH <= 0) { setReadPct(100); return }
      setReadPct(Math.min(100, (scrollY / totalH) * 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const quest = QUESTS.find((q) => q.id === questId)
  const chapter = CHAPTERS.find((c) => c.id === chapterId)
  const chapterQuests = QUESTS.filter((q) => q.chapterId === chapterId)
  const questIndex = chapterQuests.findIndex((q) => q.id === questId)
  const nextQuest = chapterQuests[questIndex + 1]
  const isCompleted = completedQuests.includes(questId)

  const handleQuizCorrect = useCallback(() => {
    setShowQuiz(false)
    completeQuest(questId)
    const newCompleted = [...completedQuests, questId]
    const allDone = chapterQuests.every((q) => newCompleted.includes(q.id))
    setChapterComplete(allDone)
    setShowAttack(true)
  }, [questId, completedQuests, chapterQuests, completeQuest])

  const handleAttackComplete = useCallback(() => {
    setShowAttack(false)
    if (nextQuest) {
      router.push(`/quest/${chapterId}/${nextQuest.id}`)
    } else {
      router.push('/home')
    }
  }, [nextQuest, chapterId, router])

  if (!quest || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--void)' }}>
        <p style={{ color: 'var(--red)' }}>퀘스트를 찾을 수 없어요.</p>
      </div>
    )
  }

  if (!character) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--void)', position: 'relative', zIndex: 1 }}>
      {/* 읽기 진행바 */}
      <div id="reading-progress">
        <div id="reading-progress-fill" style={{ width: `${readPct}%` }} />
      </div>

      {/* 헤더 */}
      <header
        className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3"
        style={{
          background: theme === 'dark' ? 'rgba(7,8,15,.92)' : 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          borderBottom: '1px solid var(--rim)',
        }}
      >
        <Link
          href="/home"
          className="font-black tracking-tight flex items-center gap-2 text-base"
          style={{ color: 'var(--gold)', fontFamily: "'Exo 2', sans-serif" }}
        >
          ⚔️ 바이브코딩 퀘스트
        </Link>

        <nav className="ml-3 hidden md:flex gap-2 items-center" style={{ fontSize: 11 }}>
          <Link href="/home" style={{ color: 'var(--text3)' }} className="hover:text-white transition-colors">홈</Link>
          <span style={{ color: 'var(--text4)' }}>/</span>
          <span style={{ color: 'var(--text3)' }} className="truncate max-w-[140px]">{chapter.title}</span>
          <span style={{ color: 'var(--text4)' }}>/</span>
          <span style={{ color: 'var(--text1)' }} className="truncate max-w-[140px]">{quest.title}</span>
        </nav>

        {/* 챕터 진행도 */}
        <div className="hidden md:flex items-center gap-2 ml-auto mr-4">
          <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: "'Exo 2', sans-serif", letterSpacing: '.06em' }}>
            {questIndex + 1}/{chapterQuests.length}
          </span>
          <div style={{ width: 72, height: 4, background: '#070a12', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--rim)' }}>
            <div
              style={{
                height: '100%',
                width: `${((questIndex + 1) / chapterQuests.length) * 100}%`,
                background: 'linear-gradient(90deg, #e8a800, var(--gold))',
                borderRadius: 2,
                boxShadow: '0 0 4px rgba(245,200,66,.4)',
                transition: 'width 1s ease',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <button
            onClick={toggle}
            className="theme-toggle"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="text-xl">{CHARACTER_EMOJI[character]}</span>
          <span className="hidden sm:block text-sm font-semibold" style={{ color: 'var(--gold)' }}>{character}</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 사이드바 */}
        <Sidebar activeChapterId={chapterId} activeQuestId={questId} />

        {/* 메인 콘텐츠 */}
        <main ref={mainRef} className="flex-1 min-w-0" style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px 100px' }}>

          {/* 퀘스트 헤더 카드 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 rounded-2xl overflow-hidden"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--rim)',
              position: 'relative',
            }}
          >
            {/* 배경 광원 */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 90% 50%, rgba(0,229,255,.03) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />

            <div style={{ padding: '22px 26px', position: 'relative' }}>
              {/* 태그 행 */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 9, fontWeight: 700, letterSpacing: '.12em',
                  color: 'var(--cyan)', textTransform: 'uppercase',
                  background: 'var(--cyan3)', border: '1px solid rgba(0,229,255,.22)',
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {chapter.title}
                </span>
                {isCompleted && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '.06em',
                    background: 'var(--green3)', color: 'var(--green)',
                    border: '1px solid rgba(57,255,133,.22)',
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    ✓ 완료
                  </span>
                )}
                <span style={{ fontSize: 9, color: 'var(--text4)', fontFamily: "'Exo 2', sans-serif", letterSpacing: '.1em', fontWeight: 700, textTransform: 'uppercase' }}>
                  QUEST {String(quest.num).padStart(2, '0')}
                </span>
              </div>

              {/* 제목 */}
              <h1 style={{
                fontFamily: "'Exo 2', 'Geist Sans', sans-serif",
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: 900,
                color: 'var(--text1)',
                lineHeight: 1.15,
                marginBottom: 14,
              }}>
                {quest.title}
              </h1>

              {/* 챕터 내 퀘스트 도트 */}
              <div className="flex items-center gap-1.5">
                {chapterQuests.map((q, i) => (
                  <Link
                    key={q.id}
                    href={`/quest/${chapterId}/${q.id}`}
                    title={q.title}
                    style={{
                      width: i === questIndex ? 20 : 8,
                      height: 6,
                      borderRadius: 3,
                      background: completedQuests.includes(q.id)
                        ? 'var(--green)'
                        : q.id === questId
                        ? 'var(--gold)'
                        : 'var(--rim)',
                      transition: 'all .3s',
                      flexShrink: 0,
                    }}
                  />
                ))}
                <span style={{ fontSize: 10, color: 'var(--text4)', marginLeft: 6, fontFamily: "'Exo 2', sans-serif", letterSpacing: '.06em' }}>
                  {questIndex + 1}/{chapterQuests.length}
                </span>
              </div>
            </div>
          </motion.div>

          {/* 본문 카드 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="rounded-2xl mb-6"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--rim)',
              padding: '22px 24px 28px',
              boxShadow: '0 2px 16px var(--shadow)',
            }}
          >
            <QuestText content={quest.content} />
          </motion.div>

          {/* 퀘스트 완료 / 다음 버튼 */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            {!isCompleted ? (
              <>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="inline-flex items-center gap-3 font-bold text-base transition-all"
                  style={{
                    padding: '14px 36px',
                    borderRadius: 14,
                    background: 'var(--gold)',
                    color: '#07080f',
                    fontSize: 15,
                    fontWeight: 800,
                    boxShadow: '0 0 24px rgba(245,200,66,.3)',
                    fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: '.04em',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = 'scale(1.04)'
                    el.style.boxShadow = '0 0 36px rgba(245,200,66,.5)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = 'scale(1)'
                    el.style.boxShadow = '0 0 24px rgba(245,200,66,.3)'
                  }}
                >
                  <span>⚔️</span>
                  퀘스트 완료!
                  <span>🗡️</span>
                </button>
                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text4)' }}>
                  퀴즈를 풀고 바이브코딩 마왕을 공격해!
                </p>
              </>
            ) : (
              nextQuest ? (
                <Link
                  href={`/quest/${chapterId}/${nextQuest.id}`}
                  className="inline-flex items-center gap-2 font-bold transition-all"
                  style={{
                    padding: '13px 30px',
                    borderRadius: 12,
                    background: 'var(--green3)',
                    color: 'var(--green)',
                    border: '1.5px solid rgba(57,255,133,.3)',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Exo 2', sans-serif",
                  }}
                >
                  다음 퀘스트 →
                </Link>
              ) : (
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 font-bold transition-all"
                  style={{
                    padding: '13px 30px',
                    borderRadius: 12,
                    background: 'var(--gold2)',
                    color: 'var(--gold)',
                    border: '1.5px solid rgba(245,200,66,.3)',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Exo 2', sans-serif",
                  }}
                >
                  🏠 홈으로 돌아가기
                </Link>
              )
            )}
          </motion.div>
        </main>
      </div>

      {showQuiz && (
        <QuizModal
          quiz={quest.quiz}
          onCorrect={handleQuizCorrect}
          onClose={() => setShowQuiz(false)}
        />
      )}

      {showAttack && (
        <AttackScene
          isChapterComplete={chapterComplete}
          onComplete={handleAttackComplete}
        />
      )}
    </div>
  )
}
