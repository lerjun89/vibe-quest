'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuestStore } from '@/store/questStore'
import { QUESTS } from '@/data/quests'
import { CHAPTERS } from '@/data/chapters'

export default function ChapterRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const chapterId = params.chapterId as string
  const { completedQuests } = useQuestStore()

  useEffect(() => {
    const chapter = CHAPTERS.find((c) => c.id === chapterId)
    if (!chapter) {
      router.replace('/home')
      return
    }

    const chapterQuests = QUESTS.filter((q) => q.chapterId === chapterId)
    if (chapterQuests.length === 0) {
      router.replace('/home')
      return
    }

    // 첫 번째 미완료 퀘스트로 이동
    const firstIncomplete = chapterQuests.find((q) => !completedQuests.includes(q.id))
    const target = firstIncomplete ?? chapterQuests[chapterQuests.length - 1]
    router.replace(`/quest/${chapterId}/${target.id}`)
  }, [chapterId, completedQuests, router])

  return (
    <div className="min-h-screen bg-[#1a0e05] flex items-center justify-center">
      <p className="text-[#f5c518] animate-pulse">⚔️ 퀘스트 불러오는 중...</p>
    </div>
  )
}
