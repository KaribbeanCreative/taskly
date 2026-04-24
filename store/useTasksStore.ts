import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Task, TaskGroup, SubTask } from '@/types'
import { sanitizeTitle } from '@/utils/sanitize'

interface TasksState {
  groups: TaskGroup[]
  addGroup: (title: string, icon: string, color: string) => void
  updateGroup: (id: string, updates: Partial<Pick<TaskGroup, 'title' | 'icon' | 'color'>>) => void
  deleteGroup: (id: string) => void
  reorderGroups: (startIndex: number, endIndex: number) => void
  addTask: (groupId: string, title: string) => void
  updateTask: (groupId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'subTasks'>>) => void
  deleteTask: (groupId: string, taskId: string) => void
  toggleTask: (groupId: string, taskId: string) => void
  reorderTasks: (groupId: string, startIndex: number, endIndex: number) => void
  moveTask: (sourceGroupId: string, destGroupId: string, sourceIndex: number, destIndex: number) => void
  addSubTask: (groupId: string, taskId: string, title: string) => void
  toggleSubTask: (groupId: string, taskId: string, subTaskId: string) => void
  deleteSubTask: (groupId: string, taskId: string, subTaskId: string) => void
}

const updateGroupTasks = (
  groups: TaskGroup[],
  groupId: string,
  updater: (tasks: Task[]) => Task[]
): TaskGroup[] =>
  groups.map((g) => (g.id === groupId ? { ...g, tasks: updater(g.tasks) } : g))

const updateTaskInGroup = (
  groups: TaskGroup[],
  groupId: string,
  taskId: string,
  updater: (task: Task) => Task
): TaskGroup[] =>
  updateGroupTasks(groups, groupId, (tasks) =>
    tasks.map((t) => (t.id === taskId ? updater(t) : t))
  )

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      groups: [],

      addGroup: (title, icon, color) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        set((state) => ({
          groups: [
            ...state.groups,
            { id: uuidv4(), title: sanitized, icon, color, tasks: [] },
          ],
        }))
      },

      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id
              ? {
                  ...g,
                  ...(updates.title !== undefined
                    ? { title: sanitizeTitle(updates.title) }
                    : {}),
                  ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
                  ...(updates.color !== undefined ? { color: updates.color } : {}),
                }
              : g
          ),
        })),

      deleteGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        })),

      reorderGroups: (startIndex, endIndex) =>
        set((state) => {
          const result = [...state.groups]
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { groups: result }
        }),

      addTask: (groupId, title) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        const newTask: Task = {
          id: uuidv4(),
          title: sanitized,
          completed: false,
          priority: null,
          dueDate: null,
          subTasks: [],
        }
        set((state) => ({
          groups: updateGroupTasks(state.groups, groupId, (tasks) => [
            ...tasks,
            newTask,
          ]),
        }))
      },

      updateTask: (groupId, taskId, updates) =>
        set((state) => ({
          groups: updateTaskInGroup(state.groups, groupId, taskId, (t) => ({
            ...t,
            ...updates,
            ...(updates.title !== undefined
              ? { title: sanitizeTitle(updates.title) }
              : {}),
          })),
        })),

      deleteTask: (groupId, taskId) =>
        set((state) => ({
          groups: updateGroupTasks(state.groups, groupId, (tasks) =>
            tasks.filter((t) => t.id !== taskId)
          ),
        })),

      toggleTask: (groupId, taskId) =>
        set((state) => ({
          groups: updateTaskInGroup(state.groups, groupId, taskId, (t) => ({
            ...t,
            completed: !t.completed,
          })),
        })),

      reorderTasks: (groupId, startIndex, endIndex) =>
        set((state) => ({
          groups: updateGroupTasks(state.groups, groupId, (tasks) => {
            const result = [...tasks]
            const [removed] = result.splice(startIndex, 1)
            result.splice(endIndex, 0, removed)
            return result
          }),
        })),

      moveTask: (sourceGroupId, destGroupId, sourceIndex, destIndex) =>
        set((state) => {
          const groups = [...state.groups]
          const sourceGroup = groups.find((g) => g.id === sourceGroupId)
          const destGroup = groups.find((g) => g.id === destGroupId)
          if (!sourceGroup || !destGroup) return state

          const sourceTasks = [...sourceGroup.tasks]
          const destTasks =
            sourceGroupId === destGroupId ? sourceTasks : [...destGroup.tasks]
          const [removed] = sourceTasks.splice(sourceIndex, 1)
          destTasks.splice(destIndex, 0, removed)

          return {
            groups: groups.map((g) => {
              if (g.id === sourceGroupId) return { ...g, tasks: sourceTasks }
              if (g.id === destGroupId) return { ...g, tasks: destTasks }
              return g
            }),
          }
        }),

      addSubTask: (groupId, taskId, title) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        const newSubTask: SubTask = {
          id: uuidv4(),
          title: sanitized,
          completed: false,
        }
        set((state) => ({
          groups: updateTaskInGroup(state.groups, groupId, taskId, (t) => ({
            ...t,
            subTasks: [...t.subTasks, newSubTask],
          })),
        }))
      },

      toggleSubTask: (groupId, taskId, subTaskId) =>
        set((state) => ({
          groups: updateTaskInGroup(state.groups, groupId, taskId, (t) => ({
            ...t,
            subTasks: t.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, completed: !st.completed } : st
            ),
          })),
        })),

      deleteSubTask: (groupId, taskId, subTaskId) =>
        set((state) => ({
          groups: updateTaskInGroup(state.groups, groupId, taskId, (t) => ({
            ...t,
            subTasks: t.subTasks.filter((st) => st.id !== subTaskId),
          })),
        })),
    }),
    { name: 'tasks-storage' }
  )
)
