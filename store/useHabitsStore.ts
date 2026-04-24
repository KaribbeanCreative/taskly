import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Habit } from '@/types'
import { sanitizeName } from '@/utils/sanitize'

interface HabitsState {
  habits: Habit[]
  addHabit: (name: string, color: string) => void
  deleteHabit: (id: string) => void
  updateHabit: (id: string, updates: Partial<Pick<Habit, 'name' | 'color'>>) => void
  toggleDate: (id: string, date: string) => void
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],

      addHabit: (name, color) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        set((state) => ({
          habits: [
            ...state.habits,
            {
              id: uuidv4(),
              name: sanitized,
              color,
              completedDates: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }))
      },

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        })),

      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  ...(updates.name !== undefined
                    ? { name: sanitizeName(updates.name) }
                    : {}),
                  ...(updates.color !== undefined ? { color: updates.color } : {}),
                }
              : h
          ),
        })),

      toggleDate: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h
            const exists = h.completedDates.includes(date)
            return {
              ...h,
              completedDates: exists
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            }
          }),
        })),
    }),
    { name: 'habits-storage' }
  )
)
