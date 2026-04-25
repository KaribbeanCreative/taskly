'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useHabitsStore } from '@/store/useHabitsStore'
import HabitCard from './HabitCard'
import HabitForm from './HabitForm'
import styles from './HabitList.module.sass'

export default function HabitList() {
  const { habits, addHabit, reorderHabits } = useHabitsStore()
  const [showForm, setShowForm] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    reorderHabits(source.index, destination.index)
  }

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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="habits" type="habit">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.list}
            >
              {habits.map((habit, index) => (
                <Draggable key={habit.id} draggableId={habit.id} index={index}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                    >
                      <HabitCard habit={habit} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {habits.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>🫙 Aucune habitude suivie</p>
          <p className={styles.emptyHint}>Ajoutez une habitude pour commencer le suivi 🌱</p>
        </div>
      )}
    </div>
  )
}
