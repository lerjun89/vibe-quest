'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function JoinPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState('')

  function handleJoin() {
    const id = roomId.trim().replace(/.*\/gift\//, '').split('/')[0]
    if (id) router.push(`/gift/${id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/gift')} className="text-[#d63384] text-xl">←</button>
          <h1 className="text-xl font-bold text-[#d63384]">🔗 링크로 참여하기</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm text-[#888] mb-1 block">펀딩 링크 또는 방 코드를 입력하세요</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300 mb-4"
            placeholder="예: abc12345 또는 https://.../gift/abc12345"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleJoin}
            disabled={!roomId.trim()}
            className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
          >
            참여하기 →
          </motion.button>
        </div>
      </div>
    </div>
  )
}
