'use client'

import { useState } from 'react'
import cn from 'classnames'
import { Task } from '@/types'
import { useTasksStore } from '@/store/useTasksStore'
import { formatDateShort, isOverdue } from '@/utils/sanitize'
import SubTaskList from './SubTaskList'
import styles from './TaskCard.module.sass'

interface TaskCardProps {
  task: Task
  groupId: string
}

const PRIORITY_EMOJI: Record<string, string> = {
  low: '🟢',
  medium: '🟠',
  high: '🔴',
}

export default function TaskCard({ task, groupId }: TaskCardProps) {
  const { toggleTask, deleteTask, updateTask } = useTasksStore()
  const [expanded, setExpanded] = useState(false)

  const subCompleted = task.subTasks.filter((st) => st.completed).length
  const hasSubTasks = task.subTasks.length > 0
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false

  const cyclePriority = () => {
    const cycle: (Task['priority'])[] = [null, 'low', 'medium', 'high']
    const currentIndex = cycle.indexOf(task.priority)
    const next = cycle[(currentIndex + 1) % cycle.length]
    updateTask(groupId, task.id, { priority: next })
  }

  const handleSetDate = () => {
    const input = document.createElement('input')
    input.type = 'date'
    input.value = task.dueDate ? task.dueDate.split('T')[0] : ''
    input.onchange = () => {
      if (input.value) {
        updateTask(groupId, task.id, { dueDate: new Date(input.value).toISOString() })
      }
    }
    input.click()
  }

  const clearDate = () => {
    updateTask(groupId, task.id, { dueDate: null })
  }

  return (
    <div
      className={cn(styles.card, {
        [styles.completed]: task.completed,
      })}
    >
      <div className={styles.row}>
        <button
          className={cn(styles.checkbox, { [styles.checked]: task.completed })}
          onClick={() => toggleTask(groupId, task.id)}
        >
          {task.completed ? '✅' : '⬜'}
        </button>

        {task.priority && (
          <span className={styles.priority} onClick={cyclePriority}>
            {PRIORITY_EMOJI[task.priority]}
          </span>
        )}

        <div className={styles.content}>
          <span className={cn(styles.title, { [styles.done]: task.completed })}>
            {task.title}
          </span>
          <div className={styles.meta}>
            {task.dueDate && (
              <span
                className={cn(styles.date, { [styles.overdue]: overdue && !task.completed })}
              >
                📅 {formatDateShort(task.dueDate)}
                {overdue && !task.completed && ' ⚠️'}
              </span>
            )}
            {hasSubTasks && (
              <button
                className={styles.subCount}
                onClick={() => setExpanded(!expanded)}
              >
                📎 {subCompleted}/{task.subTasks.length}
              </button>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {!task.priority && (
            <button className={styles.smallBtn} onClick={cyclePriority} title="🏷️ Priorité">
              🏷️
            </button>
          )}
          <button className={styles.smallBtn} onClick={handleSetDate} title="📅 Date limite">
            📅
          </button>
          {task.dueDate && (
            <button className={styles.smallBtn} onClick={clearDate} title="❌ Supprimer date">
              ❌
            </button>
          )}
          {!hasSubTasks && (
            <button
              className={styles.smallBtn}
              onClick={() => setExpanded(!expanded)}
              title="📎 Sous-tâches"
            >
              📎
            </button>
          )}
          <button
            className={styles.smallBtn}
            onClick={() => deleteTask(groupId, task.id)}
            title="🗑️ Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {expanded && <SubTaskList task={task} groupId={groupId} />}
    </div>
  )
}
