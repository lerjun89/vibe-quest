'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useGiftStore } from '@/store/giftStore'

export default function LoginPage() {
  const router = useRouter()
  const login = useGiftStore((s) => s.login)
  const currentUserId = useGiftStore((s) => s.currentUserId)

  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (currentUserId) {
    router.replace('/gift')
    return null
  }

  function handleLogin() {
    setError('')
    const result = login(userId.trim(), password)
    if (result.ok) {
      router.replace('/gift')
    } else {
      setError(result.error ?? '로그인에 실패했어요')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="text-5xl mb-3">🧩</div>
          <h1 className="text-2xl font-bold text-[#d63384]">로그인</h1>
          <p className="text-[#555] text-sm mt-1">선물조각에 오신 것을 환영해요</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#333] mb-1 block">아이디</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-[#d63384]"
              placeholder="아이디 입력"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#333] mb-1 block">비밀번호</label>
            <input
              type="password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-[#d63384]"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={!userId || !password}
            className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40"
          >
            로그인
          </motion.button>

          <p className="text-center text-sm text-[#555]">
            계정이 없으신가요?{' '}
            <Link href="/gift/signup" className="text-[#d63384] font-semibold underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
