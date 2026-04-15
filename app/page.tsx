'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuestStore } from '@/store/questStore'

export default function RootPage() {
  const router = useRouter()
  const character = useQuestStore((s) => s.character)

  useEffect(() => {
    if (character) {
      router.replace('/home')
    } else {
      router.replace('/character')
    }
  }, [character, router])

  return (
    <div className="min-h-screen bg-[#1a0e05] flex items-center justify-center">
      <p className="text-[#f5c518] text-lg animate-pulse">⚔️ 로딩 중...</p>
    </div>
  )
}
