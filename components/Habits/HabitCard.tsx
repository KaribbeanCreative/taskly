'use client'

import { useState } from 'react'
import { Habit } from '@/types'
import { useHabitsStore } from '@/store/useHabitsStore'
import Heatmap from './Heatmap'
import HabitForm from './HabitForm'
import styles from './HabitCard.module.sass'

interface HabitCardProps {
  habit: Habit
}

export default function HabitCard({ habit }: HabitCardProps) {
  const { deleteHabit, updateHabit } = useHabitsStore()
  const [isEditing, setIsEditing] = useState(false)

  const currentStreak = calculateStreak(habit.completedDates)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.dot} style={{ background: habit.color }} />
          {isEditing ? (
            <HabitForm
              initialName={habit.name}
              initialColor={habit.color}
              onSubmit={(name, color) => {
                updateHabit(habit.id, { name, color })
                setIsEditing(false)
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <h3
              className={styles.name}
              onDoubleClick={() => setIsEditing(true)}
            >
              {habit.name}
            </h3>
          )}
        </div>
        <div className={styles.headerRight}>
          {currentStreak > 0 && (
            <span className={styles.streak}>🔥 {currentStreak}j streak</span>
          )}
          <button
            className={styles.deleteBtn}
            onClick={() => deleteHabit(habit.id)}
          >
            🗑️
          </button>
        </div>
      </div>
      <Heatmap habit={habit} />
    </div>
  )
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const sorted = [...dates].sort().reverse()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayStr = formatLocalDate(today)
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = formatLocalDate(yesterdayDate)

  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0

  let streak = 1
  let current = new Date(sorted[0])

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(current)
    prev.setDate(prev.getDate() - 1)
    const prevStr = formatLocalDate(prev)

    if (sorted[i] === prevStr) {
      streak++
      current = prev
    } else {
      break
    }
  }

  return streak
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
