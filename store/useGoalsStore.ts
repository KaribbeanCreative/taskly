import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Goal, GoalPeriod } from '@/types'
import { sanitizeTitle } from '@/utils/sanitize'

interface GoalsState {
  goals: Goal[]
  addGoal: (title: string, period: GoalPeriod) => void
  toggleGoal: (id: string) => void
  deleteGoal: (id: string) => void
  updateGoal: (id: string, updates: Partial<Pick<Goal, 'title' | 'period'>>) => void
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],

      addGoal: (title, period) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        set((state) => ({
          goals: [
            ...state.goals,
            {
              id: uuidv4(),
              title: sanitized,
              period,
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
      },

      toggleGoal: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, completed: !g.completed } : g
          ),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  ...(updates.title !== undefined
                    ? { title: sanitizeTitle(updates.title) }
                    : {}),
                  ...(updates.period !== undefined
                    ? { period: updates.period }
                    : {}),
                }
              : g
          ),
        })),
    }),
    { name: 'goals-storage' }
  )
)
