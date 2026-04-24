'use client'

import { useState } from 'react'
import { useHabitsStore } from '@/store/useHabitsStore'
import HabitCard from './HabitCard'
import HabitForm from './HabitForm'
import styles from './HabitList.module.sass'

export default function HabitList() {
  const { habits, addHabit } = useHabitsStore()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔥 Habits</h1>
        <button className={styles.addButton} onClick={() => setShowForm(true)}>
          ➕
        </button>
      </div>

      {showForm && (
        <HabitForm
          onSubmit={(name, color) => {
            addHabit(name, color)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className={styles.list}>
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </div>

      {habits.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>🫙 Aucune habitude suivie</p>
          <p className={styles.emptyHint}>Ajoutez une habitude pour commencer le suivi 🌱</p>
        </div>
      )}
    </div>
  )
}
