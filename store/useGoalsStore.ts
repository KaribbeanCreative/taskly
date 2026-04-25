import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Goal, GoalPeriod } from '@/types'
import { sanitizeTitle } from '@/utils/sanitize'
import { getCurrentUserId } from '@/lib/supabase/auth-context'
import { goalsRepo } from '@/lib/supabase/repo'

export const MAX_GOALS_PER_PERIOD = 5

interface GoalsState {
  goals: Goal[]
  addGoal: (title: string, period: GoalPeriod) => void
  toggleGoal: (id: string) => void
  deleteGoal: (id: string) => void
  updateGoal: (id: string, updates: Partial<Pick<Goal, 'title' | 'period'>>) => void
  reorderGoals: (startIndex: number, endIndex: number) => void
}

const syncGoalsOrder = () => {
  const userId = getCurrentUserId()
  if (!userId) return
  goalsRepo.reorderAll(
    userId,
    useGoalsStore.getState().goals.map((g) => g.id)
  )
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],

      addGoal: (title, period) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        const newGoal: Goal = {
          id: uuidv4(),
          title: sanitized,
          period,
          completed: false,
          createdAt: new Date().toISOString(),
        }
        let inserted = false
        set((state) => {
          const inPeriod = state.goals.filter((g) => g.period === period).length
          if (inPeriod >= MAX_GOALS_PER_PERIOD) return state
          inserted = true
          return { goals: [...state.goals, newGoal] }
        })
        if (!inserted) return
        const userId = getCurrentUserId()
        if (userId) {
          const pos = useGoalsStore.getState().goals.findIndex((g) => g.id === newGoal.id)
          goalsRepo.upsert(userId, { ...newGoal, period }, pos)
        }
      },

      toggleGoal: (id) => {
        let next = false
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== id) return g
            next = !g.completed
            return { ...g, completed: next }
          }),
        }))
        const userId = getCurrentUserId()
        if (userId) goalsRepo.update(id, { completed: next })
      },

      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))
        const userId = getCurrentUserId()
        if (userId) goalsRepo.remove(id)
      },

      updateGoal: (id, updates) => {
        const sanitized = updates.title !== undefined
          ? { ...updates, title: sanitizeTitle(updates.title) }
          : updates
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...sanitized } : g
          ),
        }))
        const userId = getCurrentUserId()
        if (userId) {
          const patch: Record<string, unknown> = {}
          if (sanitized.title !== undefined) patch.title = sanitized.title
          if (sanitized.period !== undefined) patch.period = sanitized.period
          goalsRepo.update(id, patch)
        }
      },

      reorderGoals: (startIndex, endIndex) => {
        set((state) => {
          const result = [...state.goals]
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { goals: result }
        })
        syncGoalsOrder()
      },
    }),
    { name: 'goals-storage' }
  )
)
