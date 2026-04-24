'use client'

import { useState } from 'react'
import cn from 'classnames'
import { GoalPeriod } from '@/types'
import { useGoalsStore } from '@/store/useGoalsStore'
import GoalCard from './GoalCard'
import GoalForm from './GoalForm'
import styles from './GoalList.module.sass'

const PERIODS: { key: GoalPeriod; label: string; emoji: string }[] = [
  { key: 'week', label: 'Cette semaine', emoji: '📆' },
  { key: 'month', label: 'Ce mois', emoji: '🗓️' },
  { key: 'year', label: 'Cette année', emoji: '🎆' },
  { key: '3years', label: '3 ans', emoji: '🚀' },
]

export default function GoalList() {
  const { goals, addGoal } = useGoalsStore()
  const [activePeriod, setActivePeriod] = useState<GoalPeriod>('week')
  const [showForm, setShowForm] = useState(false)

  const filtered = goals.filter((g) => g.period === activePeriod)
  const completedCount = filtered.filter((g) => g.completed).length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎯 Goals</h1>
        <button className={styles.addButton} onClick={() => setShowForm(true)}>
          ➕
        </button>
      </div>

      <div className={styles.tabs}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={cn(styles.tab, { [styles.active]: activePeriod === p.key })}
            onClick={() => setActivePeriod(p.key)}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className={styles.progress}>
          🏆 {completedCount}/{filtered.length} accomplis
        </div>
      )}

      {showForm && (
        <GoalForm
          period={activePeriod}
          onSubmit={(title) => {
            addGoal(title, activePeriod)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className={styles.list}>
        {filtered.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>🫙 Aucun objectif pour cette période</p>
        </div>
      )}
    </div>
  )
}
