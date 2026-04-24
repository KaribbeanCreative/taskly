'use client'

import { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { TaskGroup as TaskGroupType } from '@/types'
import { useTasksStore } from '@/store/useTasksStore'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import styles from './TaskGroup.module.sass'

interface TaskGroupProps {
  group: TaskGroupType
}

export default function TaskGroup({ group }: TaskGroupProps) {
  const { addTask, deleteGroup, updateGroup } = useTasksStore()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const completedCount = group.tasks.filter((t) => t.completed).length

  return (
    <div className={styles.group}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>{group.icon}</span>
          {isEditing ? (
            <TaskForm
              placeholder="✏️ Nom du groupe..."
              initialValue={group.title}
              onSubmit={(title) => {
                updateGroup(group.id, { title })
                setIsEditing(false)
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <h2
              className={styles.title}
              onDoubleClick={() => setIsEditing(true)}
            >
              {group.title}
            </h2>
          )}
          <span className={styles.count}>
            ✅ {completedCount}/{group.tasks.length}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => setShowTaskForm(true)}
            title="➕ Ajouter une tâche"
          >
            ➕
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => deleteGroup(group.id)}
            title="🗑️ Supprimer le groupe"
          >
            🗑️
          </button>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          placeholder="✏️ Nouvelle tâche..."
          onSubmit={(title) => {
            addTask(group.id, title)
            setShowTaskForm(false)
          }}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      <Droppable droppableId={group.id} type="task">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.tasks}
          >
            {group.tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard task={task} groupId={group.id} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
