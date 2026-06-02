import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PiecePrice = 5000 | 10000 | 30000 | 50000 | number

export interface Piece {
  id: string
  name: string
  emoji: string
  price: PiecePrice
}

export interface CompletionItem {
  id: string
  name: string
  emoji: string
  pieces: Omit<Piece, 'price'>[]
  defaultTitle: string
  funnyTitles: string[]
}

export interface Contribution {
  id: string
  participantNickname: string
  pieceId: string
  pieceName: string
  pieceEmoji: string
  cardMessage: string
  cardEmoji: string
  amount: number
  status: 'pending' | 'approved'
  createdAt: number
}

export interface FundingRoom {
  id: string
  hostNickname: string
  hostAccount: string
  giftUrl: string
  giftName: string
  giftPrice: number
  completionItemId: string
  pieces: Piece[]
  contributions: Contribution[]
  status: 'open' | 'closed'
  createdAt: number
  birthdayDate: string
}

export interface UserProfile {
  id: string
  nickname: string
  emoji: string
  createdAt: number
}

interface GiftStore {
  rooms: Record<string, FundingRoom>
  currentUser: UserProfile | null
  historyContributions: Contribution[]
  createRoom: (room: FundingRoom) => void
  addContribution: (roomId: string, contribution: Contribution) => void
  approveContribution: (roomId: string, contributionId: string) => void
  closeRoom: (roomId: string) => void
  signUp: (nickname: string, emoji: string) => UserProfile
  signOut: () => void
  getRoom: (roomId: string) => FundingRoom | undefined
  // legacy
  currentNickname: string
  setNickname: (nickname: string) => void
}

export const useGiftStore = create<GiftStore>()(
  persist(
    (set, get) => ({
      rooms: {},
      currentUser: null,
      currentNickname: '',
      historyContributions: [],

      signUp: (nickname, emoji) => {
        const user: UserProfile = {
          id: Math.random().toString(36).substring(2, 10),
          nickname,
          emoji,
          createdAt: Date.now(),
        }
        set({ currentUser: user, currentNickname: nickname })
        return user
      },

      signOut: () => set({ currentUser: null, currentNickname: '' }),

      createRoom: (room) =>
        set((s) => ({ rooms: { ...s.rooms, [room.id]: room } })),

      addContribution: (roomId, contribution) =>
        set((s) => {
          const room = s.rooms[roomId]
          if (!room) return s
          return {
            rooms: {
              ...s.rooms,
              [roomId]: {
                ...room,
                contributions: [...room.contributions, contribution],
              },
            },
          }
        }),

      approveContribution: (roomId, contributionId) =>
        set((s) => {
          const room = s.rooms[roomId]
          if (!room) return s
          return {
            rooms: {
              ...s.rooms,
              [roomId]: {
                ...room,
                contributions: room.contributions.map((c) =>
                  c.id === contributionId ? { ...c, status: 'approved' as const } : c
                ),
              },
            },
          }
        }),

      closeRoom: (roomId) =>
        set((s) => {
          const room = s.rooms[roomId]
          if (!room) return s
          return {
            rooms: {
              ...s.rooms,
              [roomId]: { ...room, status: 'closed' },
            },
          }
        }),

      setNickname: (nickname) => set({ currentNickname: nickname }),
      getRoom: (roomId) => get().rooms[roomId],
    }),
    { name: 'gift-store' }
  )
)

export const COMPLETION_ITEMS: CompletionItem[] = [
  {
    id: 'bouquet',
    name: '꽃다발',
    emoji: '💐',
    pieces: [
      { id: 'rose', name: '장미', emoji: '🌹' },
      { id: 'tulip', name: '튤립', emoji: '🌷' },
      { id: 'sunflower', name: '해바라기', emoji: '🌻' },
      { id: 'ribbon', name: '리본', emoji: '🎀' },
      { id: 'wrap', name: '포장지', emoji: '🌿' },
    ],
    defaultTitle: '꽃다발',
    funnyTitles: ['장미 폭탄 꽃다발', '무한 장미 폭발', '향기 테러 꽃다발', '꽃밭 강탈 세트'],
  },
  {
    id: 'jewelry',
    name: '보석함',
    emoji: '💎',
    pieces: [
      { id: 'diamond', name: '다이아몬드', emoji: '💎' },
      { id: 'ruby', name: '루비', emoji: '❤️' },
      { id: 'emerald', name: '에메랄드', emoji: '💚' },
      { id: 'sapphire', name: '사파이어', emoji: '💙' },
      { id: 'gold', name: '황금', emoji: '✨' },
    ],
    defaultTitle: '보석함',
    funnyTitles: ['황금 보석 강탈함', '빛나는 혼돈 세트', '부자 전쟁 선물함'],
  },
  {
    id: 'cake',
    name: '케이크',
    emoji: '🎂',
    pieces: [
      { id: 'sponge', name: '스펀지', emoji: '🍞' },
      { id: 'cream', name: '크림', emoji: '🍦' },
      { id: 'strawberry', name: '딸기', emoji: '🍓' },
      { id: 'choco', name: '초코', emoji: '🍫' },
      { id: 'candle', name: '촛불', emoji: '🕯️' },
    ],
    defaultTitle: '케이크',
    funnyTitles: ['크림 테러 케이크', '딸기 폭탄 케이크', '혼돈의 촛불 케이크'],
  },
  {
    id: 'bag',
    name: '여행가방',
    emoji: '🧳',
    pieces: [
      { id: 'wheel', name: '바퀴', emoji: '⚙️' },
      { id: 'handle', name: '손잡이', emoji: '🪝' },
      { id: 'lock', name: '잠금장치', emoji: '🔒' },
      { id: 'tag', name: '네임택', emoji: '🏷️' },
      { id: 'sticker', name: '스티커', emoji: '⭐' },
    ],
    defaultTitle: '여행가방',
    funnyTitles: ['스티커 폭탄 가방', '자물쇠 감시 캐리어', '떠돌이 여행 세트'],
  },
  {
    id: 'bear',
    name: '곰인형',
    emoji: '🧸',
    pieces: [
      { id: 'body', name: '몸통', emoji: '🐻' },
      { id: 'arms', name: '팔', emoji: '🤗' },
      { id: 'legs', name: '다리', emoji: '🦵' },
      { id: 'eyes', name: '눈', emoji: '👀' },
      { id: 'bow', name: '리본', emoji: '🎀' },
    ],
    defaultTitle: '곰인형',
    funnyTitles: ['감시곰', '눈이 너무 많은 곰', '팔 없는 공포곰', '혼돈의 리본곰'],
  },
]
