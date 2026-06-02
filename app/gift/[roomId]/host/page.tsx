'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGiftStore, COMPLETION_ITEMS } from '@/store/giftStore'

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

export default function HostPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const room = useGiftStore((s) => s.rooms[roomId])
  const approveContribution = useGiftStore((s) => s.approveContribution)
  const closeRoom = useGiftStore((s) => s.closeRoom)
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'approved'>('overview')
  const [justApproved, setJustApproved] = useState<string | null>(null)

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
  const pending = room.contributions.filter((c) => c.status === 'pending')
  const approved = room.contributions.filter((c) => c.status === 'approved')
  const totalAmount = approved.reduce((sum, c) => sum + c.amount, 0)
  const completionPercent = Math.min(100, Math.floor((approved.length / (item.pieces.length * 2)) * 100))
  const pieceCounts: Record<string, number> = {}
  approved.forEach((c) => { pieceCounts[c.pieceId] = (pieceCounts[c.pieceId] ?? 0) + 1 })

  function handleApprove(contributionId: string) {
    approveContribution(roomId, contributionId)
    setJustApproved(contributionId)
    setTimeout(() => setJustApproved(null), 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between pt-4 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/gift')} className="text-[#d63384] text-xl">←</button>
            <h1 className="text-lg font-bold text-[#d63384]">내 펀딩방</h1>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${room.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {room.status === 'open' ? '진행중' : '마감됨'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{item.emoji}</div>
            <div className="flex-1">
              <p className="font-bold text-[#333]">{room.giftName}</p>
              <p className="text-[#d63384] font-semibold text-sm">{formatPrice(room.giftPrice)}</p>
              <p className="text-xs text-[#555] mt-1">생일 {room.birthdayDate} ({getDday(room.birthdayDate)})</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-[#444] mb-1">
              <span>모인 금액</span>
              <span className="font-bold text-[#d63384]">{formatPrice(totalAmount)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-[#d63384] to-[#ff6eb0] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-xs text-[#555] mt-1">{approved.length}개 조각 · {completionPercent}% 완성</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs text-[#444] mb-2">조각 현황</p>
          <div className="flex flex-wrap gap-3">
            {item.pieces.map((piece) => {
              const count = pieceCounts[piece.id] ?? 0
              return (
                <div key={piece.id} className="flex flex-col items-center gap-1">
                  <div className={`text-2xl p-2 rounded-xl ${count > 0 ? 'bg-pink-100' : 'bg-gray-100 opacity-30'}`}>
                    {piece.emoji}
                  </div>
                  <span className="text-xs text-[#444]">{piece.name}</span>
                  {count > 0 && <span className="text-xs text-[#d63384] font-bold">×{count}</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs text-[#444] mb-2">공유 링크</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-pink-50 text-[#d63384] px-3 py-2 rounded-xl truncate">
              /gift/{roomId}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/gift/${roomId}`)}
              className="bg-pink-100 text-[#d63384] text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap"
            >
              복사
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['overview', 'pending', 'approved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-[#d63384] text-white' : 'bg-white text-[#444]'
              }`}
            >
              {tab === 'overview' ? '전체' : tab === 'pending' ? `대기 ${pending.length}` : `승인 ${approved.length}`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {room.contributions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-[#555]">
                  <p className="text-3xl mb-2">💌</p>
                  <p>아직 참여자가 없어요</p>
                  <p className="text-xs mt-1">친구들에게 링크를 공유해보세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {room.contributions.map((c) => (
                    <ContributionCard
                      key={c.id}
                      contribution={c}
                      onApprove={c.status === 'pending' ? () => handleApprove(c.id) : undefined}
                      justApproved={justApproved === c.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {pending.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-[#555]">
                  <p className="text-3xl mb-2">✅</p>
                  <p>대기 중인 입금이 없어요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((c) => (
                    <ContributionCard
                      key={c.id}
                      contribution={c}
                      onApprove={() => handleApprove(c.id)}
                      justApproved={justApproved === c.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'approved' && (
            <motion.div key="approved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {approved.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-[#555]">
                  <p className="text-3xl mb-2">🎁</p>
                  <p>아직 승인된 조각이 없어요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approved.map((c) => (
                    <ContributionCard key={c.id} contribution={c} justApproved={false} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {room.status === 'open' && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (confirm('펀딩을 마감하시겠어요?')) closeRoom(roomId)
            }}
            className="w-full mt-6 bg-gray-100 text-[#444] font-semibold py-4 rounded-2xl"
          >
            🔒 펀딩 마감하기
          </motion.button>
        )}
      </div>
    </div>
  )
}

function ContributionCard({
  contribution,
  onApprove,
  justApproved,
}: {
  contribution: { id: string; participantNickname: string; pieceEmoji: string; pieceName: string; amount: number; cardEmoji: string; cardMessage: string; status: string; createdAt: number }
  onApprove?: () => void
  justApproved: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
        contribution.status === 'pending' ? 'border-yellow-200' : 'border-green-100'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{contribution.pieceEmoji}</span>
          <div>
            <p className="font-semibold text-[#333] text-sm">{contribution.participantNickname}</p>
            <p className="text-xs text-[#444]">{contribution.pieceName} · {contribution.amount.toLocaleString()}원</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          contribution.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
        }`}>
          {contribution.status === 'pending' ? '대기중' : '승인됨'}
        </span>
      </div>
      {contribution.cardMessage && (
        <div className="bg-pink-50 rounded-xl p-3 mb-3">
          <p className="text-sm text-[#555]">{contribution.cardEmoji} {contribution.cardMessage}</p>
        </div>
      )}
      {onApprove && (
        <AnimatePresence>
          {justApproved ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-green-500 font-bold text-sm py-2"
            >
              ✅ 승인 완료!
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onApprove}
              className="w-full bg-[#d63384] text-white font-bold py-2.5 rounded-xl text-sm"
            >
              ✅ 입금 확인 & 승인
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
