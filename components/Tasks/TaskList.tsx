'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useTasksStore } from '@/store/useTasksStore'
import TaskGroup from './TaskGroup'
import TaskForm from './TaskForm'
import styles from './TaskList.module.sass'

const GROUP_COLORS = ['#5b5bd6', '#e5484d', '#30a46c', '#f76b15', '#0090ff', '#ab4aba']
const GROUP_ICONS = ['📋', '🎯', '💡', '🔥', '⭐', '📌', '🚀', '💎']

export default function TaskList() {
  const { groups, addGroup, reorderGroups, moveTask, reorderTasks } = useTasksStore()
  const [showForm, setShowForm] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type } = result
    if (!destination) return

    if (type === 'group') {
      reorderGroups(source.index, destination.index)
      return
    }

    if (source.droppableId === destination.droppableId) {
      reorderTasks(source.droppableId, source.index, destination.index)
    } else {
      moveTask(source.droppableId, destination.droppableId, source.index, destination.index)
    }
  }

  const handleAddGroup = (title: string) => {
    const colorIndex = groups.length % GROUP_COLORS.length
    const iconIndex = groups.length % GROUP_ICONS.length
    addGroup(title, GROUP_ICONS[iconIndex], GROUP_COLORS[colorIndex])
    setShowForm(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📋 Tasks</h1>
        <button className={styles.addButton} onClick={() => setShowForm(true)}>
          ➕
        </button>
      </div>

      {showForm && (
        <TaskForm
          placeholder="✏️ Nom du groupe..."
          onSubmit={handleAddGroup}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="groups" type="group">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={styles.groups}>
              {groups.map((group, index) => (
                <Draggable key={group.id} draggableId={group.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskGroup group={group} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {groups.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>📭 Aucune tâche pour le moment</p>
          <p className={styles.emptyHint}>Créez un groupe pour commencer ✨</p>
        </div>
      )}
    </div>
  )
}
