'use client'

import { useState } from 'react'
import cn from 'classnames'
import { Goal } from '@/types'
import { useGoalsStore } from '@/store/useGoalsStore'
import styles from './GoalCard.module.sass'

interface GoalCardProps {
  goal: Goal
}

export default function GoalCard({ goal }: GoalCardProps) {
  const { toggleGoal, deleteGoal } = useGoalsStore()
  const [fading, setFading] = useState(false)

  const handleToggle = () => {
    if (!goal.completed) {
      setFading(true)
      setTimeout(() => {
        toggleGoal(goal.id)
        setFading(false)
      }, 150)
    } else {
      toggleGoal(goal.id)
    }
  }

  return (
    <div
      className={cn(styles.card, {
        [styles.completed]: goal.completed,
        [styles.fading]: fading,
      })}
    >
      <button className={styles.checkbox} onClick={handleToggle}>
        {goal.completed ? '🏆' : '⭕'}
      </button>
      <span className={cn(styles.title, { [styles.done]: goal.completed })}>
        {goal.title}
      </span>
      <button className={styles.deleteBtn} onClick={() => deleteGoal(goal.id)}>
        🗑️
      </button>
    </div>
  )
}
