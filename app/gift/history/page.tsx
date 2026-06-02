'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGiftStore, COMPLETION_ITEMS } from '@/store/giftStore'

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  const days = Math.floor(hrs / 24)
  return `${days}일 전`
}

export default function HistoryPage() {
  const router = useRouter()
  const rooms = useGiftStore((s) => s.rooms)
  const getCurrentUser = useGiftStore((s) => s.getCurrentUser)
  const currentNickname = getCurrentUser()?.nickname ?? ''

  const allContributions = Object.values(rooms).flatMap((room) =>
    room.contributions
      .filter((c) => c.status === 'approved')
      .map((c) => ({
        ...c,
        roomId: room.id,
        hostNickname: room.hostNickname,
        giftName: room.giftName,
        completionItemId: room.completionItemId,
        isSent: c.participantNickname === currentNickname,
        isReceived: room.hostNickname === currentNickname,
      }))
  ).filter((c) => c.isSent || c.isReceived)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button onClick={() => router.push('/gift')} className="text-[#d63384] text-xl">←</button>
          <h1 className="text-xl font-bold text-[#d63384]">📜 선물 히스토리</h1>
        </div>

        {!currentNickname && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center mb-4">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-[#444]">펀딩에 참여하면 히스토리가 쌓여요</p>
          </div>
        )}

        {allContributions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-[#555]">
            <p className="text-3xl mb-2">💌</p>
            <p>아직 선물 기록이 없어요</p>
            <p className="text-xs mt-1">펀딩에 참여하면 여기에 기록이 남아요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allContributions.map((c, i) => {
              const item = COMPLETION_ITEMS.find((it) => it.id === c.completionItemId)
              const isSent = c.isSent
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: isSent ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] bg-white rounded-2xl p-4 shadow-sm ${
                    isSent ? 'rounded-tr-none' : 'rounded-tl-none'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{c.pieceEmoji}</span>
                      <div>
                        <p className="text-xs text-[#444]">
                          {isSent ? `→ ${c.hostNickname}에게` : `← ${c.participantNickname}에게서`}
                        </p>
                        <p className="text-sm font-semibold text-[#333]">{c.pieceName}</p>
                      </div>
                    </div>
                    {c.cardMessage && (
                      <div className="bg-pink-50 rounded-xl p-2 mt-2">
                        <p className="text-xs text-[#555]">{c.cardEmoji} {c.cardMessage}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-[#555]">{item?.emoji} {c.giftName}</p>
                      <p className="text-xs text-[#555]">{timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {allContributions.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mt-6">
            <p className="font-bold text-[#333] mb-3">📊 선물 통계</p>
            {(() => {
              const pieceCounts: Record<string, number> = {}
              const partnerCounts: Record<string, number> = {}
              allContributions.filter((c) => c.isSent).forEach((c) => {
                pieceCounts[c.pieceName] = (pieceCounts[c.pieceName] ?? 0) + 1
                partnerCounts[c.hostNickname] = (partnerCounts[c.hostNickname] ?? 0) + 1
              })
              const topPiece = Object.entries(pieceCounts).sort((a, b) => b[1] - a[1])[0]
              const topPartner = Object.entries(partnerCounts).sort((a, b) => b[1] - a[1])[0]
              return (
                <div className="space-y-2 text-sm text-[#666]">
                  {topPiece && (
                    <p>💝 가장 많이 선물한 조각: <span className="font-bold text-[#d63384]">{topPiece[0]}</span> ({topPiece[1]}회)</p>
                  )}
                  {topPartner && (
                    <p>🎂 가장 많이 선물한 친구: <span className="font-bold text-[#d63384]">{topPartner[0]}</span></p>
                  )}
                  <p>✨ 총 선물한 조각: <span className="font-bold">{allContributions.filter((c) => c.isSent).length}개</span></p>
                  <p>🎁 총 받은 조각: <span className="font-bold">{allContributions.filter((c) => c.isReceived).length}개</span></p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
