import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Task, SubTask } from '@/types'
import { sanitizeTitle } from '@/utils/sanitize'

interface TasksState {
  tasks: Task[]
  addTask: (title: string, icon: string, color: string) => void
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'icon' | 'color' | 'priority' | 'dueDate'>>
  ) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  reorderTasks: (startIndex: number, endIndex: number) => void
  addSubTask: (taskId: string, title: string) => void
  toggleSubTask: (taskId: string, subTaskId: string) => void
  deleteSubTask: (taskId: string, subTaskId: string) => void
}

const updateTaskInList = (
  tasks: Task[],
  id: string,
  updater: (task: Task) => Task
): Task[] => tasks.map((t) => (t.id === id ? updater(t) : t))

const PRIORITY_RANK: Record<NonNullable<Task['priority']>, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const priorityRank = (p: Task['priority']): number =>
  p ? PRIORITY_RANK[p] : 3

// Active first, then completed. Within each, sorted by priority (high → med → low → none).
// Array.prototype.sort is stable, so manual order is preserved within priority buckets.
const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return priorityRank(a.priority) - priorityRank(b.priority)
  })

type LegacySubTask = { id: string; title: string; completed: boolean }
type LegacyTask = {
  id: string
  title: string
  completed: boolean
  priority: Task['priority']
  dueDate: string | null
  subTasks?: LegacySubTask[]
}
type LegacyGroup = {
  id: string
  title: string
  icon: string
  color: string
  tasks?: LegacyTask[]
}
type LegacyState = { groups?: LegacyGroup[] }

// v1 (groups → tasks → subTasks) becomes v2 (tasks → subTasks).
// Each old group's tasks are flattened to top-level, inheriting the group's icon/color.
// Old group titles are preserved by prefixing them on each promoted task title.
function migrateV1ToV2(legacy: LegacyState): { tasks: Task[] } {
  const tasks: Task[] = []
  for (const group of legacy.groups ?? []) {
    for (const t of group.tasks ?? []) {
      tasks.push({
        id: t.id,
        title: t.title,
        icon: group.icon,
        color: group.color,
        completed: t.completed,
        priority: t.priority,
        dueDate: t.dueDate,
        subTasks: (t.subTasks ?? []).map((st) => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
        })),
      })
    }
  }
  return { tasks }
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (title, icon, color) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        set((state) => {
          const newTask: Task = {
            id: uuidv4(),
            title: sanitized,
            icon,
            color,
            completed: false,
            priority: null,
            dueDate: null,
            subTasks: [],
          }
          return { tasks: sortTasks([...state.tasks, newTask]) }
        })
      },

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: sortTasks(
            updateTaskInList(state.tasks, id, (t) => ({
              ...t,
              ...updates,
              ...(updates.title !== undefined
                ? { title: sanitizeTitle(updates.title) }
                : {}),
            }))
          ),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: sortTasks(
            updateTaskInList(state.tasks, id, (t) => ({
              ...t,
              completed: !t.completed,
            }))
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      reorderTasks: (startIndex, endIndex) =>
        set((state) => {
          const result = [...state.tasks]
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { tasks: sortTasks(result) }
        }),

      addSubTask: (taskId, title) => {
        const sanitized = sanitizeTitle(title)
        if (!sanitized) return
        const newSubTask: SubTask = {
          id: uuidv4(),
          title: sanitized,
          completed: false,
        }
        set((state) => ({
          tasks: updateTaskInList(state.tasks, taskId, (t) => {
            const active = t.subTasks.filter((st) => !st.completed)
            const completed = t.subTasks.filter((st) => st.completed)
            return { ...t, subTasks: [...active, newSubTask, ...completed] }
          }),
        }))
      },

      toggleSubTask: (taskId, subTaskId) =>
        set((state) => ({
          tasks: updateTaskInList(state.tasks, taskId, (t) => {
            const updated = t.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, completed: !st.completed } : st
            )
            const active = updated.filter((st) => !st.completed)
            const completed = updated.filter((st) => st.completed)
            return { ...t, subTasks: [...active, ...completed] }
          }),
        })),

      deleteSubTask: (taskId, subTaskId) =>
        set((state) => ({
          tasks: updateTaskInList(state.tasks, taskId, (t) => ({
            ...t,
            subTasks: t.subTasks.filter((st) => st.id !== subTaskId),
          })),
        })),
    }),
    {
      name: 'tasks-storage',
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return migrateV1ToV2(persistedState as LegacyState) as unknown as TasksState
        }
        return persistedState as TasksState
      },
    }
  )
)
