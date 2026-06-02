'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QUESTS } from '@/data/quests'

export type CharacterType = '용사' | '마법사' | '엘프' | '용' | '요정' | '오크'

interface QuestState {
  completedQuests: string[]
  currentSeason: 1 | 2
  character: CharacterType | null
  castleHp: number

  completeQuest: (questId: string) => void
  setCharacter: (character: CharacterType) => void
  resetProgress: () => void
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      completedQuests: [],
      currentSeason: 1,
      character: null,
      castleHp: 100,

      completeQuest: (questId: string) => {
        const { completedQuests } = get()
        if (completedQuests.includes(questId)) return

        const newCompleted = [...completedQuests, questId]
        const totalQuests = QUESTS.length
        const damagePerQuest = 100 / totalQuests
        const newCastleHp = Math.max(0, 100 - newCompleted.length * damagePerQuest)

        set({
          completedQuests: newCompleted,
          castleHp: newCastleHp,
        })
      },

      setCharacter: (character: CharacterType) => {
        set({ character })
      },

      resetProgress: () => {
        set({
          completedQuests: [],
          currentSeason: 1,
          character: null,
          castleHp: 100,
        })
      },
    }),
    {
      name: 'vibe-quest-storage',
    }
  )
)
