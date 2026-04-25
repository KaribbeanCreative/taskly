'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useTasksStore } from '@/store/useTasksStore'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import EmojiPicker from './EmojiPicker'
import styles from './TaskList.module.sass'

const TASK_COLORS = ['#5b5bd6', '#e5484d', '#30a46c', '#f76b15', '#0090ff', '#ab4aba']
const TASK_ICONS = ['📋', '🎯', '💡', '🔥', '⭐', '📌', '🚀', '💎']

export default function TaskList() {
  const { tasks, addTask, reorderTasks } = useTasksStore()
  const [showForm, setShowForm] = useState(false)
  const [newTaskIcon, setNewTaskIcon] = useState(TASK_ICONS[0])
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return
    reorderTasks(source.index, destination.index)
  }

  const openForm = () => {
    setNewTaskIcon(TASK_ICONS[tasks.length % TASK_ICONS.length])
    setShowForm(true)
  }

  const handleAddTask = (title: string) => {
    const colorIndex = tasks.length % TASK_COLORS.length
    addTask(title, newTaskIcon, TASK_COLORS[colorIndex])
    setShowForm(false)
    setShowIconPicker(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📋 Tasks</h1>
        <button className={styles.addButton} onClick={openForm}>
          ➕
        </button>
      </div>

      {showForm && (
        <div className={styles.createGroup}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowIconPicker((v) => !v)}
            title="Choisir un emoji"
          >
            {newTaskIcon}
          </button>
          {showIconPicker && (
            <EmojiPicker
              onSelect={setNewTaskIcon}
              onClose={() => setShowIconPicker(false)}
            />
          )}
          <div className={styles.createGroupForm}>
            <TaskForm
              placeholder="✏️ Nom de la tâche..."
              onSubmit={handleAddTask}
              onCancel={() => {
                setShowForm(false)
                setShowIconPicker(false)
              }}
            />
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks" type="task">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.groups}
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard task={task} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {tasks.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>📭 Aucune tâche pour le moment</p>
          <p className={styles.emptyHint}>Créez une tâche pour commencer ✨</p>
        </div>
      )}
    </div>
  )
}
