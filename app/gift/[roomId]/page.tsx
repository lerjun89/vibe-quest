'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGiftStore, COMPLETION_ITEMS, type Piece } from '@/store/giftStore'

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function getDday(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

function getFunnyTitle(itemId: string, pieces: Piece[], contributions: { pieceId: string; status: string }[]) {
  const item = COMPLETION_ITEMS.find((i) => i.id === itemId)
  if (!item) return ''
  const approved = contributions.filter((c) => c.status === 'approved')
  const counts: Record<string, number> = {}
  approved.forEach((c) => { counts[c.pieceId] = (counts[c.pieceId] ?? 0) + 1 })
  const topPiece = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!topPiece || topPiece[1] < 3) return item.defaultTitle
  const idx = Math.floor(Math.random() * item.funnyTitles.length)
  return item.funnyTitles[idx]
}

type FlowStep = 'enter' | 'view' | 'select' | 'card' | 'payment' | 'done'

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const room = useGiftStore((s) => s.rooms[roomId])
  const addContribution = useGiftStore((s) => s.addContribution)
  const getCurrentUser = useGiftStore((s) => s.getCurrentUser)

  const user = getCurrentUser()
  const nickname = user?.nickname ?? ''

  const [step, setStep] = useState<FlowStep>(user ? 'view' : 'enter')
  const [guestNickname, setGuestNickname] = useState('')
  const [selectedPieces, setSelectedPieces] = useState<string[]>([])
  const [cardMessage, setCardMessage] = useState('')
  const [cardEmoji, setCardEmoji] = useState('🎂')

  const displayNickname = nickname || guestNickname

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-[#444]">펀딩방을 찾을 수 없어요</p>
          <button onClick={() => router.push('/gift')} className="mt-4 text-[#d63384] underline">홈으로</button>
        </div>
      </div>
    )
  }

  const item = COMPLETION_ITEMS.find((i) => i.id === room.completionItemId)!
  const approvedContributions = room.contributions.filter((c) => c.status === 'approved')
  const totalApproved = approvedContributions.length
  const totalPieces = item.pieces.length
  const completionPercent = Math.min(100, Math.floor((totalApproved / (totalPieces * 2)) * 100))
  const dday = getDday(room.birthdayDate)
  const funnyTitle = getFunnyTitle(room.completionItemId, room.pieces, room.contributions)

  function handleEnter() {
    if (!displayNickname.trim()) return
    setStep('view')
  }

  function togglePiece(pieceId: string) {
    setSelectedPieces((prev) =>
      prev.includes(pieceId) ? prev.filter((p) => p !== pieceId) : [...prev, pieceId]
    )
  }

  function calcTotal() {
    return selectedPieces.reduce((sum, pid) => {
      const piece = room.pieces.find((p) => p.id === pid)
      return sum + (piece?.price ?? 0)
    }, 0)
  }

  function handleSubmitPayment() {
    selectedPieces.forEach((pieceId) => {
      const piece = room.pieces.find((p) => p.id === pieceId)!
      addContribution(roomId, {
        id: Math.random().toString(36).substring(2),
        participantNickname: displayNickname,
        pieceId,
        pieceName: piece.name,
        pieceEmoji: piece.emoji,
        cardMessage,
        cardEmoji,
        amount: piece.price,
        status: 'pending',
        createdAt: Date.now(),
      })
    })
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] p-4">
      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {step === 'enter' && (
            <motion.div key="enter" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="flex flex-col items-center justify-center min-h-screen pb-20">
                <div className="text-6xl mb-4">{item.emoji}</div>
                <h1 className="text-2xl font-bold text-[#d63384] mb-1">{room.hostNickname}님의 생일</h1>
                <p className="text-[#555] text-sm mb-8">{dday}</p>
                <div className="bg-white rounded-2xl p-6 shadow-sm w-full">
                  <label className="text-sm text-[#444] mb-1 block">닉네임을 입력해주세요</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#111] text-sm focus:outline-none focus:border-pink-300 mb-4"
                    placeholder="예: 민지"
                    value={guestNickname}
                    onChange={(e) => setGuestNickname(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleEnter}
                    disabled={!guestNickname.trim()}
                    className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
                  >
                    입장하기 →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'view' && (
            <motion.div key="view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="pt-4 pb-8">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-lg font-bold text-[#d63384]">🧩 {room.hostNickname}님의 선물</h1>
                  <span className="bg-pink-100 text-[#d63384] text-sm font-bold px-3 py-1 rounded-full">{dday}</span>
                </div>

                <CompletionVisual item={item} approvedCount={totalApproved} contributions={approvedContributions} />

                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                  <p className="text-xs text-[#555] mb-1">선물 목표</p>
                  <p className="font-bold text-[#333] text-lg">{room.giftName}</p>
                  <p className="text-[#d63384] font-semibold">{formatPrice(room.giftPrice)}</p>
                  {room.giftUrl && (
                    <a href={room.giftUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline mt-1 block">
                      상품 링크 보기 →
                    </a>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                  <p className="text-xs text-[#555] mb-2">완성도</p>
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-1">
                    <motion.div
                      className="bg-gradient-to-r from-[#d63384] to-[#ff6eb0] h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#444]">{totalApproved}개 조각 완성 ({completionPercent}%)</p>
                </div>

                {room.status === 'closed' && (
                  <div className="bg-gray-100 rounded-2xl p-4 mb-4 text-center">
                    <p className="text-[#444] font-semibold">펀딩이 마감되었습니다 🎉</p>
                  </div>
                )}

                {room.status === 'open' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep('select')}
                    className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-pink-200"
                  >
                    💝 조각 선물하기
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('view')} className="text-[#d63384] text-xl">←</button>
                  <h2 className="text-lg font-bold text-[#333]">조각 선택</h2>
                </div>
                <p className="text-sm text-[#444] mb-4">원하는 조각을 선택하세요. 중복 선택 가능해요!</p>
                <div className="space-y-3 mb-6">
                  {room.pieces.map((piece) => {
                    const selected = selectedPieces.includes(piece.id)
                    const count = selectedPieces.filter((p) => p === piece.id).length
                    return (
                      <motion.button
                        key={piece.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => togglePiece(piece.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          selected ? 'border-[#d63384] bg-pink-50' : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{piece.emoji}</span>
                          <div className="text-left">
                            <p className="font-semibold text-[#333]">{piece.name}</p>
                            <p className="text-sm text-[#d63384]">{formatPrice(piece.price)}</p>
                          </div>
                        </div>
                        {selected && (
                          <span className="bg-[#d63384] text-white text-xs font-bold px-2 py-1 rounded-full">
                            선택됨
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                {selectedPieces.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                    <p className="text-sm text-[#444]">선택한 조각: {selectedPieces.map((pid) => {
                      const p = room.pieces.find((rp) => rp.id === pid)!
                      return p.emoji
                    }).join(' ')}</p>
                    <p className="font-bold text-[#d63384] text-lg mt-1">합계: {formatPrice(calcTotal())}</p>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep('card')}
                  disabled={selectedPieces.length === 0}
                  className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
                >
                  카드 작성하기 →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'card' && (
            <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('select')} className="text-[#d63384] text-xl">←</button>
                  <h2 className="text-lg font-bold text-[#333]">카드 작성</h2>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                  <label className="text-sm text-[#444] mb-2 block">대표 이모지</label>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {['🎂', '🎉', '🥳', '💕', '🌸', '✨', '🎁', '💐', '🍀', '🌟'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setCardEmoji(emoji)}
                        className={`text-2xl p-2 rounded-xl transition-all ${cardEmoji === emoji ? 'bg-pink-100 ring-2 ring-[#d63384]' : 'hover:bg-gray-50'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <label className="text-sm text-[#444] mb-2 block">메시지</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300 resize-none"
                    rows={4}
                    placeholder="생일 축하 메시지를 남겨주세요 🎂"
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                  />
                </div>
                <div className="bg-pink-50 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-[#444]">미리보기</p>
                  <div className="text-center mt-2">
                    <p className="text-4xl">{cardEmoji}</p>
                    <p className="text-sm text-[#555] mt-2">{cardMessage || '메시지를 입력해주세요...'}</p>
                    <p className="text-xs text-[#555] mt-2">from. {displayNickname}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep('payment')}
                  className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl"
                >
                  계좌 확인하기 →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('card')} className="text-[#d63384] text-xl">←</button>
                  <h2 className="text-lg font-bold text-[#333]">계좌 이체</h2>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                  <p className="text-sm text-[#444] mb-1">입금 계좌</p>
                  <p className="font-bold text-[#333] text-lg mb-1">{room.hostAccount}</p>
                  <p className="text-xs text-[#555]">{room.hostNickname}님 계좌</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                  <p className="text-sm text-[#444] mb-2">입금 금액</p>
                  <p className="font-bold text-[#d63384] text-2xl">{formatPrice(calcTotal())}</p>
                  <div className="mt-3 space-y-1">
                    {selectedPieces.map((pid, i) => {
                      const piece = room.pieces.find((p) => p.id === pid)!
                      return (
                        <div key={i} className="flex justify-between text-sm text-[#444]">
                          <span>{piece.emoji} {piece.name}</span>
                          <span>{formatPrice(piece.price)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-yellow-700">💡 이체 후 [입금했어요] 버튼을 눌러주세요. 생일자가 확인 후 승인하면 조각이 추가됩니다.</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitPayment}
                  className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl text-lg"
                >
                  ✅ 입금했어요!
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex flex-col items-center justify-center min-h-screen pb-20 text-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-7xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-[#d63384] mb-2">선물 조각을 보냈어요!</h2>
                <p className="text-[#444] mb-2">{room.hostNickname}님이 확인하면 조각이 추가돼요</p>
                <p className="text-[#555] text-sm mb-8">from. {displayNickname}</p>
                <div className="flex gap-2 flex-wrap justify-center mb-6">
                  {selectedPieces.map((pid, i) => {
                    const piece = room.pieces.find((p) => p.id === pid)!
                    return (
                      <span key={i} className="text-3xl">{piece.emoji}</span>
                    )
                  })}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep('view')}
                  className="bg-white border-2 border-[#d63384] text-[#d63384] font-bold px-8 py-3 rounded-2xl"
                >
                  펀딩방으로 돌아가기
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CompletionVisual({
  item,
  approvedCount,
  contributions,
}: {
  item: { id: string; name: string; emoji: string; pieces: { id: string; name: string; emoji: string }[] }
  approvedCount: number
  contributions: { pieceId: string }[]
}) {
  const pieceCounts: Record<string, number> = {}
  contributions.forEach((c) => {
    pieceCounts[c.pieceId] = (pieceCounts[c.pieceId] ?? 0) + 1
  })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
      <motion.div
        className="text-7xl mb-3"
        animate={{ scale: approvedCount > 0 ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.5 }}
      >
        {item.emoji}
      </motion.div>
      <p className="font-bold text-[#333] mb-3">{item.name}</p>
      <div className="flex justify-center flex-wrap gap-2">
        {item.pieces.map((piece) => {
          const count = pieceCounts[piece.id] ?? 0
          return (
            <div key={piece.id} className="flex flex-col items-center">
              <motion.div
                className={`text-2xl p-2 rounded-xl transition-all ${count > 0 ? 'bg-pink-100' : 'bg-gray-100 opacity-30'}`}
                animate={count > 0 ? { scale: [1, 1.2, 1] } : {}}
              >
                {piece.emoji}
              </motion.div>
              {count > 0 && (
                <span className="text-xs text-[#d63384] font-bold mt-1">×{count}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
