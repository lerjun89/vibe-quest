'use client'

import Link from 'next/link'
import { useQuestStore } from '@/store/questStore'
import { CHAPTERS } from '@/data/chapters'
import { QUESTS } from '@/data/quests'

const CHARACTER_EMOJI: Record<string, string> = {
  '용사': '🗡️',
  '마법사': '🧙',
  '엘프': '🏹',
  '용': '🐉',
  '요정': '🧚',
  '오크': '👹',
}

interface SidebarProps {
  activeChapterId?: string
  activeQuestId?: string
}

export default function Sidebar({ activeChapterId, activeQuestId }: SidebarProps) {
  const { completedQuests, character, xp, level, castleHp } = useQuestStore()

  const XP_THRESHOLDS = [100, 250, 450, 700, 1000]
  const currentThreshold = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)] ?? 1000
  const prevThreshold = level > 1 ? (XP_THRESHOLDS[level - 2] ?? 0) : 0
  const xpProgress = Math.min(100, ((xp - prevThreshold) / (currentThreshold - prevThreshold)) * 100)

  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        width: 252,
        flexShrink: 0,
        background: 'var(--deep)',
        borderRight: '1px solid var(--rim)',
        minHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* 캐릭터 카드 */}
      <div
        style={{
          padding: '16px 14px 14px',
          borderBottom: '1px solid var(--rim)',
          background: 'linear-gradient(135deg, var(--panel), var(--deep))',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 광원 */}
        <div style={{
          position: 'absolute', top: -40, right: -30,
          width: 120, height: 120,
          background: 'radial-gradient(circle, rgba(176,96,255,.07) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="flex items-center gap-2.5 mb-3">
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(176,96,255,.12)',
            border: '1.5px solid rgba(176,96,255,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {character ? CHARACTER_EMOJI[character] : '?'}
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--gold)', fontFamily: "'Exo 2', sans-serif", textTransform: 'uppercase', marginBottom: 2 }}>
              Lv.{level}
            </p>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 14, fontWeight: 900, color: 'var(--text1)' }}>
              {character ?? '캐릭터 없음'}
            </p>
          </div>
        </div>

        {/* XP 바 */}
        <div className="flex justify-between mb-1" style={{ fontSize: 9, color: 'var(--text4)', fontFamily: "'Exo 2', sans-serif", letterSpacing: '.06em' }}>
          <span>XP</span>
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{xp} / {currentThreshold}</span>
        </div>
        <div style={{ height: 5, background: '#070a12', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--rim)' }}>
          <div style={{
            height: '100%',
            width: `${xpProgress}%`,
            background: 'linear-gradient(90deg, #00b8cc, var(--cyan))',
            borderRadius: 3,
            boxShadow: '0 0 6px rgba(0,229,255,.3)',
            transition: 'width 1s ease',
          }} />
        </div>

        {/* 스탯 그리드 */}
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          {[
            { label: 'QUESTS', value: completedQuests.length },
            { label: 'LEVEL', value: level },
            { label: 'XP', value: xp },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--rim)', borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 14, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 8, color: 'var(--text4)', marginTop: 2, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 마왕성 HP */}
      <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--rim)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--red)', fontFamily: "'Exo 2', sans-serif", textTransform: 'uppercase' }}>
            🏰 바이브코딩 마왕 HP
          </span>
          <span style={{ fontSize: 10, color: 'var(--red)', fontFamily: "'Exo 2', sans-serif", fontWeight: 700 }}>
            {Math.round(castleHp)}/100
          </span>
        </div>
        <div style={{ height: 5, background: '#070a12', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--rim)' }}>
          <div style={{
            height: '100%',
            width: `${castleHp}%`,
            background: 'linear-gradient(90deg, #ff4d6d, #ff8c00)',
            borderRadius: 3,
            boxShadow: '0 0 5px rgba(255,77,109,.3)',
            transition: 'width .8s ease',
          }} />
        </div>
        {castleHp === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--gold)', fontSize: 11, fontWeight: 700, marginTop: 6 }}>🎉 바이브코딩 마왕 격파!</p>
        )}
      </div>

      {/* 퀘스트 맵 */}
      <div style={{ flex: 1, padding: '10px 8px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--text4)', textTransform: 'uppercase', padding: '0 6px 8px', fontFamily: "'Exo 2', sans-serif" }}>
          퀘스트 맵
        </p>

        {CHAPTERS.map((chapter) => {
          const chapterQuests = QUESTS.filter((q) => q.chapterId === chapter.id)
          const completedCount = chapterQuests.filter((q) => completedQuests.includes(q.id)).length
          const isComplete = completedCount === chapterQuests.length && chapterQuests.length > 0
          const isActive = chapter.id === activeChapterId
          const isLocked = !chapter.free

          return (
            <div key={chapter.id} style={{ marginBottom: 2 }}>
              {/* 챕터 버튼 */}
              <Link
                href={isLocked ? '#' : `/quest/${chapter.id}`}
                className="flex items-center gap-2"
                style={{
                  width: '100%',
                  padding: '8px 8px',
                  borderRadius: 7,
                  border: `1px solid ${isActive ? 'rgba(0,229,255,.28)' : 'transparent'}`,
                  background: isActive ? 'var(--cyan3)' : 'transparent',
                  color: isLocked ? 'var(--text4)' : isActive ? 'var(--cyan)' : isComplete ? '#00c957' : 'var(--text3)',
                  opacity: isLocked ? 0.35 : 1,
                  pointerEvents: isLocked ? 'none' : 'auto',
                  transition: 'all .15s',
                  cursor: isLocked ? 'default' : 'pointer',
                  textDecoration: 'none',
                  fontSize: 11,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: isActive ? 'var(--cyan3)' : isComplete ? 'var(--green3)' : 'var(--lift)',
                  border: `1px solid ${isActive ? 'rgba(0,229,255,.3)' : isComplete ? 'rgba(57,255,133,.25)' : 'var(--rim)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, flexShrink: 0,
                  fontFamily: "'Exo 2', sans-serif", fontWeight: 900,
                  color: isActive ? 'var(--cyan)' : isComplete ? 'var(--green)' : 'var(--text4)',
                }}>
                  {isLocked ? '🔒' : isComplete ? '✓' : chapter.id.replace('s1-ch', '')}
                </div>
                <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chapter.title}
                </span>
                <span style={{ fontSize: 9, opacity: .7, flexShrink: 0, fontFamily: "'Exo 2', sans-serif" }}>
                  {completedCount}/{chapterQuests.length || chapter.questCount}
                </span>
              </Link>

              {/* 현재 챕터 소퀘스트 */}
              {isActive && !isLocked && (
                <div style={{ marginLeft: 14, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {chapterQuests.map((quest) => {
                    const isDone = completedQuests.includes(quest.id)
                    const isCurrent = quest.id === activeQuestId
                    return (
                      <Link
                        key={quest.id}
                        href={`/quest/${chapter.id}/${quest.id}`}
                        style={{
                          display: 'block',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: isCurrent ? 700 : 400,
                          background: isCurrent ? 'rgba(0,229,255,.06)' : isDone ? 'var(--green3)' : 'transparent',
                          border: `1px solid ${isCurrent ? 'rgba(0,229,255,.25)' : isDone ? 'rgba(57,255,133,.2)' : 'transparent'}`,
                          color: isCurrent ? 'var(--cyan)' : isDone ? '#00c957' : 'var(--text3)',
                          transition: 'all .15s',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {isDone ? '✓ ' : isCurrent ? '▶ ' : '○ '}
                        {quest.title}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
