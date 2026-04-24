'use client'

import { useState } from 'react'
import cn from 'classnames'
import { Task } from '@/types'
import { useTasksStore } from '@/store/useTasksStore'
import styles from './SubTaskList.module.sass'

interface SubTaskListProps {
  task: Task
  groupId: string
}

export default function SubTaskList({ task, groupId }: SubTaskListProps) {
  const { addSubTask, toggleSubTask, deleteSubTask } = useTasksStore()
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    const trimmed = newTitle.trim()
    if (trimmed) {
      addSubTask(groupId, task.id, trimmed)
      setNewTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className={styles.container}>
      {task.subTasks.map((st) => (
        <div key={st.id} className={styles.item}>
          <button
            className={cn(styles.checkbox, { [styles.checked]: st.completed })}
            onClick={() => toggleSubTask(groupId, task.id, st.id)}
          >
            {st.completed ? '✅' : '⬜'}
          </button>
          <span className={cn(styles.title, { [styles.done]: st.completed })}>
            {st.title}
          </span>
          <button
            className={styles.deleteBtn}
            onClick={() => deleteSubTask(groupId, task.id, st.id)}
          >
            ❌
          </button>
        </div>
      ))}
      <div className={styles.addRow}>
        <input
          className={styles.input}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="➕ Ajouter une sous-tâche..."
          maxLength={200}
        />
      </div>
    </div>
  )
}
