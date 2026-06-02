'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGiftStore, COMPLETION_ITEMS, type Piece } from '@/store/giftStore'

const PRESET_PRICES = [5000, 10000, 30000, 50000]

type Step = 'gift' | 'item' | 'pieces' | 'account' | 'done'

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10)
}

export default function CreatePage() {
  const router = useRouter()
  const createRoom = useGiftStore((s) => s.createRoom)

  const [step, setStep] = useState<Step>('gift')
  const [hostNickname, setHostNickname] = useState('')
  const [giftUrl, setGiftUrl] = useState('')
  const [giftName, setGiftName] = useState('')
  const [giftPrice, setGiftPrice] = useState('')
  const [birthdayDate, setBirthdayDate] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [piecePrices, setPiecePrices] = useState<Record<string, number>>({})
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({})
  const [hostAccount, setHostAccount] = useState('')
  const [roomId, setRoomId] = useState('')

  const selectedItem = COMPLETION_ITEMS.find((i) => i.id === selectedItemId)

  function handleGiftSubmit() {
    if (!hostNickname.trim() || !giftName.trim() || !giftPrice.trim() || !birthdayDate) return
    setStep('item')
  }

  function handleItemSelect(id: string) {
    setSelectedItemId(id)
    const item = COMPLETION_ITEMS.find((i) => i.id === id)!
    const defaults: Record<string, number> = {}
    item.pieces.forEach((p) => { defaults[p.id] = 10000 })
    setPiecePrices(defaults)
    setStep('pieces')
  }

  function setPiecePrice(pieceId: string, price: number) {
    setPiecePrices((prev) => ({ ...prev, [pieceId]: price }))
  }

  function handlePiecesSubmit() {
    if (!selectedItem) return
    setStep('account')
  }

  function handleAccountSubmit() {
    if (!hostAccount.trim()) return
    const id = generateRoomId()
    setRoomId(id)

    const pieces: Piece[] = selectedItem!.pieces.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      price: piecePrices[p.id] ?? 10000,
    }))

    createRoom({
      id,
      hostNickname,
      hostAccount,
      giftUrl,
      giftName,
      giftPrice: Number(giftPrice.replace(/,/g, '')),
      completionItemId: selectedItemId,
      pieces,
      contributions: [],
      status: 'open',
      createdAt: Date.now(),
      birthdayDate,
    })
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#fce4ec] p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button onClick={() => router.back()} className="text-[#d63384] text-xl">←</button>
          <h1 className="text-xl font-bold text-[#d63384]">🧩 펀딩방 만들기</h1>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {step === 'gift' && (
            <motion.div key="gift" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-[#333] text-lg">선물 정보 입력</h2>
                <div>
                  <label className="text-sm text-[#888] mb-1 block">내 닉네임</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300"
                    placeholder="예: 지수"
                    value={hostNickname}
                    onChange={(e) => setHostNickname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#888] mb-1 block">선물 링크 (쇼핑몰 URL)</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300"
                    placeholder="https://..."
                    value={giftUrl}
                    onChange={(e) => setGiftUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#888] mb-1 block">상품명</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300"
                    placeholder="예: 에어팟 프로 2세대"
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#888] mb-1 block">목표 금액 (원)</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300"
                    placeholder="예: 350000"
                    value={giftPrice}
                    onChange={(e) => setGiftPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#888] mb-1 block">생일 날짜</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300"
                    value={birthdayDate}
                    onChange={(e) => setBirthdayDate(e.target.value)}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGiftSubmit}
                  disabled={!hostNickname.trim() || !giftName.trim() || !giftPrice || !birthdayDate}
                  className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
                >
                  다음 →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'item' && (
            <motion.div key="item" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-[#333] text-lg mb-4">완성품 선택</h2>
                <p className="text-[#888] text-sm mb-4">조각이 모여 완성될 아이템을 선택하세요</p>
                <div className="grid grid-cols-1 gap-3">
                  {COMPLETION_ITEMS.map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleItemSelect(item.id)}
                      className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-pink-300 hover:bg-pink-50 transition-all text-left"
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div>
                        <p className="font-semibold text-[#333]">{item.name}</p>
                        <p className="text-xs text-[#aaa]">
                          {item.pieces.map((p) => p.emoji).join(' ')}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'pieces' && selectedItem && (
            <motion.div key="pieces" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-[#333] text-lg mb-1">조각별 금액 설정</h2>
                <p className="text-[#888] text-sm mb-4">
                  {selectedItem.emoji} {selectedItem.name} · 각 조각의 가격을 설정하세요
                </p>
                <div className="space-y-4">
                  {selectedItem.pieces.map((piece) => (
                    <div key={piece.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{piece.emoji}</span>
                        <span className="font-semibold text-[#333]">{piece.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_PRICES.map((price) => (
                          <button
                            key={price}
                            onClick={() => setPiecePrice(piece.id, price)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                              piecePrices[piece.id] === price
                                ? 'bg-[#d63384] text-white'
                                : 'bg-gray-100 text-[#666] hover:bg-pink-50'
                            }`}
                          >
                            {formatPrice(price)}
                          </button>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            className="w-24 border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:border-pink-300"
                            placeholder="직접입력"
                            value={customPrices[piece.id] ?? ''}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g, '')
                              setCustomPrices((prev) => ({ ...prev, [piece.id]: v }))
                              if (v) setPiecePrice(piece.id, Number(v))
                            }}
                          />
                          <span className="text-sm text-[#888]">원</span>
                        </div>
                      </div>
                      <p className="text-xs text-pink-500 mt-2 font-medium">
                        선택: {formatPrice(piecePrices[piece.id] ?? 10000)}
                      </p>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePiecesSubmit}
                  className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl mt-4"
                >
                  다음 →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'account' && (
            <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-[#333] text-lg mb-2">계좌번호 입력</h2>
                <p className="text-[#888] text-sm mb-4">친구들이 이체할 계좌번호를 입력해주세요</p>
                <div>
                  <label className="text-sm text-[#888] mb-1 block">은행명 + 계좌번호</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300"
                    placeholder="예: 카카오뱅크 3333-01-1234567"
                    value={hostAccount}
                    onChange={(e) => setHostAccount(e.target.value)}
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
                  <p className="text-xs text-yellow-700">⚠️ 입력한 계좌번호는 참여자에게 공개됩니다. 정확하게 입력해주세요.</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAccountSubmit}
                  disabled={!hostAccount.trim()}
                  className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl mt-4 disabled:opacity-40"
                >
                  펀딩방 생성하기 🎉
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-bold text-[#333] text-xl mb-2">펀딩방이 생성됐어요!</h2>
                <p className="text-[#888] text-sm mb-6">아래 링크를 친구들에게 공유하세요</p>

                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-[#888] mb-1">참여 링크</p>
                  <p className="font-mono text-sm text-[#d63384] break-all">/gift/{roomId}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/gift/${roomId}`)
                    }}
                    className="w-full bg-pink-100 text-[#d63384] font-bold py-3 rounded-2xl"
                  >
                    🔗 링크 복사
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push(`/gift/${roomId}/host`)}
                    className="w-full bg-[#d63384] text-white font-bold py-4 rounded-2xl"
                  >
                    내 펀딩방 보기 →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['gift', 'item', 'pieces', 'account']
  const idx = steps.indexOf(current)
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-2 flex-1 rounded-full transition-all ${
            i <= idx ? 'bg-[#d63384]' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}
