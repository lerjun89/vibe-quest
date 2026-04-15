'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CharacterType = '용사' | '마법사' | '엘프' | '용' | '요정' | '오크'

interface QuestState {
  completedQuests: string[]
  currentSeason: 1 | 2
  character: CharacterType | null
  xp: number
  level: number
  castleHp: number

  completeQuest: (questId: string) => void
  setCharacter: (character: CharacterType) => void
  resetProgress: () => void
}

function calcLevel(xp: number): number {
  // 레벨업 기준: 100, 250, 450, 700, 1000...
  const thresholds = [100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]
  let level = 1
  for (const threshold of thresholds) {
    if (xp >= threshold) level++
    else break
  }
  return level
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      completedQuests: [],
      currentSeason: 1,
      character: null,
      xp: 0,
      level: 1,
      castleHp: 100,

      completeQuest: (questId: string) => {
        const { completedQuests } = get()
        if (completedQuests.includes(questId)) return

        const newCompleted = [...completedQuests, questId]
        const newXp = get().xp + 20
        const newLevel = calcLevel(newXp)
        const newCastleHp = Math.max(0, 100 - newCompleted.length * 2.5)

        set({
          completedQuests: newCompleted,
          xp: newXp,
          level: newLevel,
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
          xp: 0,
          level: 1,
          castleHp: 100,
        })
      },
    }),
    {
      name: 'vibe-quest-storage',
    }
  )
)
