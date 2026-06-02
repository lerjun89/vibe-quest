'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGiftStore } from '@/store/giftStore'

const EMOJIS = ['🐻', '🐱', '🐶', '🦊', '🐰', '🐼', '🐨', '🦁', '🐸', '🐙', '🦋', '🌸']

export default function SignupPage() {
  const router = useRouter()
  const signUp = useGiftStore((s) => s.signUp)
  const currentUser = useGiftStore((s) => s.currentUser)

  const [nickname, setNickname] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🐻')
  const [mode, setMode] = useState<'choose' | 'signup' | 'login'>('choose')
  const [loginNickname, setLoginNickname] = useState('')

  if (currentUser) {
    router.replace('/gift')
    return null
  }

  function handleSignup() {
    if (!nickname.trim()) return
    signUp(nickname.trim(), selectedEmoji)
    router.replace('/gift')
  }

  function handleLogin() {
    if (!loginNickname.trim()) return
    signUp(loginNickname.trim(), '🐻')
    router.replace('/gift')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-3">🧩</div>
          <h1 className="text-3xl font-bold text-[#d63384]">선물조각</h1>
          <p className="text-[#555] mt-1">조각을 모아 선물을 완성해요</p>
        </motion.div>

        {mode === 'choose' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={() => setMode('signup')}
              className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-pink-200"
            >
              🎉 처음 시작하기
            </button>
            <button
              onClick={() => setMode('login')}
              className="w-full bg-white text-[#333] font-bold py-4 rounded-2xl text-lg border-2 border-gray-200"
            >
              🔑 이미 있어요
            </button>
          </motion.div>
        )}

        {mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <button onClick={() => setMode('choose')} className="text-[#d63384] mb-4 text-sm">← 뒤로</button>
            <h2 className="font-bold text-[#333] text-lg mb-4">내 프로필 만들기</h2>

            <label className="text-sm font-semibold text-[#333] mb-2 block">대표 이모지 선택</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2.5 rounded-xl transition-all ${
                    selectedEmoji === emoji
                      ? 'bg-pink-100 ring-2 ring-[#d63384] scale-110'
                      : 'bg-gray-50 hover:bg-pink-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <label className="text-sm font-semibold text-[#333] mb-2 block">닉네임</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-base focus:outline-none focus:border-[#d63384] mb-4"
              placeholder="예: 민지"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              maxLength={10}
            />

            {nickname && (
              <div className="bg-pink-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                <span className="text-3xl">{selectedEmoji}</span>
                <div>
                  <p className="text-xs text-[#555]">이렇게 보여요</p>
                  <p className="font-bold text-[#333]">{nickname}</p>
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSignup}
              disabled={!nickname.trim()}
              className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
            >
              시작하기 🎉
            </motion.button>
          </motion.div>
        )}

        {mode === 'login' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <button onClick={() => setMode('choose')} className="text-[#d63384] mb-4 text-sm">← 뒤로</button>
            <h2 className="font-bold text-[#333] text-lg mb-2">닉네임으로 이어하기</h2>
            <p className="text-[#555] text-sm mb-4">
              전에 쓰던 닉네임을 입력하면 기록이 연결돼요
            </p>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-base focus:outline-none focus:border-[#d63384] mb-4"
              placeholder="닉네임 입력"
              value={loginNickname}
              onChange={(e) => setLoginNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleLogin}
              disabled={!loginNickname.trim()}
              className="w-full bg-[#333] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
            >
              이어하기 →
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
