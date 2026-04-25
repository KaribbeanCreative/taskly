'use client'

import { useState } from 'react'
import cn from 'classnames'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GoalPeriod } from '@/types'
import { useGoalsStore, MAX_GOALS_PER_PERIOD } from '@/store/useGoalsStore'
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
  const { goals, addGoal, reorderGoals } = useGoalsStore()
  const [activePeriod, setActivePeriod] = useState<GoalPeriod>('week')
  const [showForm, setShowForm] = useState(false)

  const filtered = goals.filter((g) => g.period === activePeriod)
  const completedCount = filtered.filter((g) => g.completed).length
  const limitReached = filtered.length >= MAX_GOALS_PER_PERIOD

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    const sourceId = filtered[source.index].id
    const destId = filtered[destination.index].id
    const globalSource = goals.findIndex((g) => g.id === sourceId)
    const globalDest = goals.findIndex((g) => g.id === destId)
    if (globalSource < 0 || globalDest < 0) return
    reorderGoals(globalSource, globalDest)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎯 Goals</h1>
        <button
          className={styles.addButton}
          onClick={() => setShowForm(true)}
          disabled={limitReached}
          title={limitReached ? `Limite : ${MAX_GOALS_PER_PERIOD} goals par période` : undefined}
        >
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
          {limitReached && ` · 🚦 limite atteinte (${MAX_GOALS_PER_PERIOD} max)`}
        </div>
      )}

      {showForm && !limitReached && (
        <GoalForm
          period={activePeriod}
          onSubmit={(title) => {
            addGoal(title, activePeriod)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="goals" type="goal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.list}
            >
              {filtered.map((goal, index) => (
                <Draggable key={goal.id} draggableId={goal.id} index={index}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                    >
                      <GoalCard goal={goal} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {filtered.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>🫙 Aucun objectif pour cette période</p>
        </div>
      )}
    </div>
  )
}
