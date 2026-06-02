'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function GiftLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <div className="text-7xl mb-4">🧩</div>
        <h1 className="text-4xl font-bold text-[#d63384] mb-2">선물조각</h1>
        <p className="text-[#888] text-lg mb-2">조각을 모아 선물을 완성해요</p>
        <p className="text-[#aaa] text-sm mb-10">
          친구들의 마음 조각이 모여 하나의 선물이 됩니다
        </p>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 text-left">
            <div className="text-2xl mb-2">🎂</div>
            <p className="font-semibold text-[#333] text-sm">생일자라면</p>
            <p className="text-[#888] text-xs mt-1">받고 싶은 선물 링크를 등록하고 친구들을 초대하세요</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 text-left">
            <div className="text-2xl mb-2">💝</div>
            <p className="font-semibold text-[#333] text-sm">친구라면</p>
            <p className="text-[#888] text-xs mt-1">조각을 선택하고 카드를 써서 마음을 전달하세요</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/gift/create">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-pink-200 hover:bg-[#c22b75] transition-colors"
            >
              🎁 펀딩방 만들기
            </motion.button>
          </Link>
          <Link href="/gift/join">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full bg-white text-[#d63384] font-bold py-4 rounded-2xl text-lg border-2 border-[#d63384] hover:bg-pink-50 transition-colors"
            >
              🔗 링크로 참여하기
            </motion.button>
          </Link>
          <Link href="/gift/history">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full bg-white text-[#888] font-semibold py-3 rounded-2xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              📜 선물 히스토리
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
