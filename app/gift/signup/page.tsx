'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useGiftStore } from '@/store/giftStore'

const EMOJIS = ['🐻', '🐱', '🐶', '🦊', '🐰', '🐼', '🐨', '🦁', '🐸', '🐙', '🦋', '🌸']

export default function SignupPage() {
  const router = useRouter()
  const signup = useGiftStore((s) => s.signup)
  const currentUserId = useGiftStore((s) => s.currentUserId)

  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [emoji, setEmoji] = useState('🐻')
  const [error, setError] = useState('')

  if (currentUserId) {
    router.replace('/gift')
    return null
  }

  function handleSubmit() {
    setError('')
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요')
      return
    }
    const result = signup(userId.trim(), password, nickname.trim(), emoji)
    if (result.ok) {
      router.replace('/gift')
    } else {
      setError(result.error ?? '오류가 발생했어요')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="text-5xl mb-3">🧩</div>
          <h1 className="text-2xl font-bold text-[#d63384]">회원가입</h1>
          <p className="text-[#555] text-sm mt-1">선물조각 계정을 만들어요</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#333] mb-1 block">아이디</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-[#d63384]"
              placeholder="영문/숫자 3자 이상"
              value={userId}
              onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#333] mb-1 block">비밀번호</label>
            <input
              type="password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-[#d63384]"
              placeholder="4자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#333] mb-1 block">비밀번호 확인</label>
            <input
              type="password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-[#d63384]"
              placeholder="비밀번호를 다시 입력해주세요"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#333] mb-1 block">닉네임</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-[#d63384]"
              placeholder="친구들에게 보여질 이름"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#333] mb-2 block">프로필 이모지</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    emoji === e ? 'bg-pink-100 ring-2 ring-[#d63384] scale-110' : 'bg-gray-50 hover:bg-pink-50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!userId || !password || !passwordConfirm || !nickname}
            className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40"
          >
            가입하기
          </motion.button>

          <p className="text-center text-sm text-[#555]">
            이미 계정이 있으신가요?{' '}
            <Link href="/gift/login" className="text-[#d63384] font-semibold underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
