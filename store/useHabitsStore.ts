import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Habit } from '@/types'
import { sanitizeName } from '@/utils/sanitize'
import { getCurrentUserId } from '@/lib/supabase/auth-context'
import { habitsRepo, habitCompletionsRepo } from '@/lib/supabase/repo'

interface HabitsState {
  habits: Habit[]
  addHabit: (name: string, color: string) => void
  deleteHabit: (id: string) => void
  updateHabit: (id: string, updates: Partial<Pick<Habit, 'name' | 'color'>>) => void
  toggleDate: (id: string, date: string) => void
  reorderHabits: (startIndex: number, endIndex: number) => void
}

const syncHabitsOrder = () => {
  const userId = getCurrentUserId()
  if (!userId) return
  habitsRepo.reorderAll(
    userId,
    useHabitsStore.getState().habits.map((h) => h.id)
  )
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],

      addHabit: (name, color) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        const newHabit: Habit = {
          id: uuidv4(),
          name: sanitized,
          color,
          completedDates: [],
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ habits: [...state.habits, newHabit] }))
        const userId = getCurrentUserId()
        if (userId) {
          const pos = useHabitsStore.getState().habits.findIndex((h) => h.id === newHabit.id)
          habitsRepo.upsert(userId, newHabit, pos)
        }
      },

      deleteHabit: (id) => {
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }))
        const userId = getCurrentUserId()
        if (userId) habitsRepo.remove(id)
      },

      updateHabit: (id, updates) => {
        const sanitized = updates.name !== undefined
          ? { ...updates, name: sanitizeName(updates.name) }
          : updates
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...sanitized } : h
          ),
        }))
        const userId = getCurrentUserId()
        if (userId) {
          const patch: Record<string, unknown> = {}
          if (sanitized.name !== undefined) patch.name = sanitized.name
          if (sanitized.color !== undefined) patch.color = sanitized.color
          habitsRepo.update(id, patch)
        }
      },

      toggleDate: (id, date) => {
        let willAdd = true
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h
            const exists = h.completedDates.includes(date)
            willAdd = !exists
            return {
              ...h,
              completedDates: exists
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            }
          }),
        }))
        const userId = getCurrentUserId()
        if (userId) {
          if (willAdd) habitCompletionsRepo.add(userId, id, date)
          else habitCompletionsRepo.remove(userId, id, date)
        }
      },

      reorderHabits: (startIndex, endIndex) => {
        set((state) => {
          const result = [...state.habits]
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { habits: result }
        })
        syncHabitsOrder()
      },
    }),
    { name: 'habits-storage' }
  )
)
