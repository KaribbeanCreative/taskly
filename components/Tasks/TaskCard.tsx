'use client'

import { useState, useRef } from 'react'
import cn from 'classnames'
import { Task } from '@/types'
import { useTasksStore } from '@/store/useTasksStore'
import { formatDateShort, isOverdue } from '@/utils/sanitize'
import SubTaskList from './SubTaskList'
import TaskForm from './TaskForm'
import EmojiPicker from './EmojiPicker'
import styles from './TaskCard.module.sass'

interface TaskCardProps {
  task: Task
}

const PRIORITY_LABEL: Record<string, { dot: string; text: string }> = {
  low: { dot: '🟢', text: 'Low' },
  medium: { dot: '🟡', text: 'Med' },
  high: { dot: '🔴', text: 'High' },
}

const PRIORITY_CLASS: Record<string, string> = {
  low: styles.low,
  medium: styles.medium,
  high: styles.high,
}

export default function TaskCard({ task }: TaskCardProps) {
  const { toggleTask, deleteTask, updateTask } = useTasksStore()
  const [showSubTasks, setShowSubTasks] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const subCompleted = task.subTasks.filter((st) => st.completed).length
  const hasSubTasks = task.subTasks.length > 0
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false

  const cyclePriority = () => {
    const cycle: Task['priority'][] = [null, 'low', 'medium', 'high']
    const currentIndex = cycle.indexOf(task.priority)
    const next = cycle[(currentIndex + 1) % cycle.length]
    updateTask(task.id, { priority: next })
  }

  const openDatePicker = () => {
    const input = dateInputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker()
        return
      } catch {
        // fall through to focus+click fallback
      }
    }
    input.focus()
    input.click()
  }

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      updateTask(task.id, { dueDate: new Date(e.target.value).toISOString() })
    }
  }

  const clearDate = () => {
    updateTask(task.id, { dueDate: null })
  }

  return (
    <div
      className={cn(styles.card, {
        [styles.completed]: task.completed,
        [styles.elevated]: showIconPicker,
      })}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={cn(styles.checkbox, { [styles.checked]: task.completed })}
            onClick={() => toggleTask(task.id)}
          >
            {task.completed ? '✅' : '⬜'}
          </button>

          <div className={styles.iconWrap}>
            <button
              className={styles.icon}
              onClick={() => setShowIconPicker((v) => !v)}
              title="Changer l'emoji"
            >
              {task.icon}
            </button>
            {showIconPicker && (
              <EmojiPicker
                onSelect={(emoji) => updateTask(task.id, { icon: emoji })}
                onClose={() => setShowIconPicker(false)}
              />
            )}
          </div>

          {task.priority && (
            <button
              className={cn(styles.priority, PRIORITY_CLASS[task.priority])}
              onClick={cyclePriority}
              title="Changer la priorité"
            >
              <span className={styles.priorityDot}>
                {PRIORITY_LABEL[task.priority].dot}
              </span>
              <span className={styles.priorityText}>
                {PRIORITY_LABEL[task.priority].text}
              </span>
            </button>
          )}

          <div className={styles.titleWrap}>
            {isEditing ? (
              <TaskForm
                placeholder="✏️ Nom de la tâche..."
                initialValue={task.title}
                onSubmit={(title) => {
                  updateTask(task.id, { title })
                  setIsEditing(false)
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <h2
                className={cn(styles.title, { [styles.done]: task.completed })}
                onDoubleClick={() => setIsEditing(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {task.dueDate && (
            <button
              type="button"
              className={cn(styles.date, {
                [styles.overdue]: overdue && !task.completed,
              })}
              onClick={openDatePicker}
              title="Modifier la date"
            >
              📅 {formatDateShort(task.dueDate)}
              {overdue && !task.completed && ' ⚠️'}
            </button>
          )}

          {hasSubTasks && (
            <button
              className={styles.subCount}
              onClick={() => setShowSubTasks(!showSubTasks)}
            >
              📎 {subCompleted}/{task.subTasks.length}
            </button>
          )}
        </div>

        <div className={styles.actions}>
          {!task.priority && (
            <button
              className={styles.smallBtn}
              onClick={cyclePriority}
              title="🏷️ Priorité"
            >
              🏷️
            </button>
          )}
          <button
            className={styles.smallBtn}
            onClick={openDatePicker}
            title="📅 Date limite"
          >
            📅
          </button>
          {task.dueDate && (
            <button
              className={styles.smallBtn}
              onClick={clearDate}
              title="❌ Supprimer date"
            >
              ❌
            </button>
          )}
          <button
            className={styles.smallBtn}
            onClick={() => setShowSubTasks(!showSubTasks)}
            title="📎 Sous-tâches"
          >
            📎
          </button>
          <button
            className={styles.smallBtn}
            onClick={() => deleteTask(task.id)}
            title="🗑️ Supprimer"
          >
            🗑️
          </button>
        </div>

        <input
          ref={dateInputRef}
          type="date"
          className={styles.hiddenDate}
          value={task.dueDate ? task.dueDate.split('T')[0] : ''}
          onChange={onDateChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {showSubTasks && <SubTaskList task={task} />}
    </div>
  )
}
