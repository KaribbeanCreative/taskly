import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Task, SubTask } from '@/types'
import { sanitizeTitle } from '@/utils/sanitize'
import { getCurrentUserId } from '@/lib/supabase/auth-context'
import { tasksRepo, subTasksRepo } from '@/lib/supabase/repo'

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

// Sync side-effect: positions of all tasks in the array.
const syncTasksOrder = (tasks: Task[]) => {
  const userId = getCurrentUserId()
  if (!userId) return
  tasksRepo.reorderAll(userId, tasks.map((t) => t.id))
}

const syncSubTasksOrder = (taskId: string, subs: SubTask[]) => {
  const userId = getCurrentUserId()
  if (!userId) return
  subTasksRepo.reorderForTask(userId, taskId, subs.map((s) => s.id))
}

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
        set((state) => ({ tasks: sortTasks([...state.tasks, newTask]) }))
        const userId = getCurrentUserId()
        if (userId) {
          // Upsert the new task at its sorted position, then reorder the rest.
          const tasksAfter = useTasksStore.getState().tasks
          const pos = tasksAfter.findIndex((t) => t.id === newTask.id)
          tasksRepo.upsert(userId, newTask, pos).then(() => syncTasksOrder(tasksAfter))
        }
      },

      updateTask: (id, updates) => {
        const sanitizedUpdates = updates.title !== undefined
          ? { ...updates, title: sanitizeTitle(updates.title) }
          : updates
        set((state) => ({
          tasks: sortTasks(
            updateTaskInList(state.tasks, id, (t) => ({ ...t, ...sanitizedUpdates }))
          ),
        }))
        const userId = getCurrentUserId()
        if (userId) {
          const patch: Record<string, unknown> = {}
          if (sanitizedUpdates.title !== undefined) patch.title = sanitizedUpdates.title
          if (sanitizedUpdates.icon !== undefined) patch.icon = sanitizedUpdates.icon
          if (sanitizedUpdates.color !== undefined) patch.color = sanitizedUpdates.color
          if (sanitizedUpdates.priority !== undefined) patch.priority = sanitizedUpdates.priority
          if (sanitizedUpdates.dueDate !== undefined) patch.due_date = sanitizedUpdates.dueDate
          tasksRepo.update(id, patch).then(() => {
            // Priority change can change sort position
            if (sanitizedUpdates.priority !== undefined) {
              syncTasksOrder(useTasksStore.getState().tasks)
            }
          })
        }
      },

      toggleTask: (id) => {
        let nextCompleted = false
        set((state) => {
          const updated = updateTaskInList(state.tasks, id, (t) => {
            nextCompleted = !t.completed
            return { ...t, completed: nextCompleted }
          })
          return { tasks: sortTasks(updated) }
        })
        const userId = getCurrentUserId()
        if (userId) {
          tasksRepo.update(id, { completed: nextCompleted }).then(() =>
            syncTasksOrder(useTasksStore.getState().tasks)
          )
        }
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
        const userId = getCurrentUserId()
        if (userId) tasksRepo.remove(id)
      },

      reorderTasks: (startIndex, endIndex) => {
        set((state) => {
          const result = [...state.tasks]
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { tasks: sortTasks(result) }
        })
        syncTasksOrder(useTasksStore.getState().tasks)
      },

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
        const userId = getCurrentUserId()
        if (userId) {
          const task = useTasksStore.getState().tasks.find((t) => t.id === taskId)
          if (!task) return
          const pos = task.subTasks.findIndex((st) => st.id === newSubTask.id)
          subTasksRepo
            .upsert(userId, taskId, newSubTask, pos)
            .then(() => syncSubTasksOrder(taskId, task.subTasks))
        }
      },

      toggleSubTask: (taskId, subTaskId) => {
        let nextCompleted = false
        set((state) => ({
          tasks: updateTaskInList(state.tasks, taskId, (t) => {
            const updated = t.subTasks.map((st) => {
              if (st.id !== subTaskId) return st
              nextCompleted = !st.completed
              return { ...st, completed: nextCompleted }
            })
            const active = updated.filter((st) => !st.completed)
            const completed = updated.filter((st) => st.completed)
            return { ...t, subTasks: [...active, ...completed] }
          }),
        }))
        const userId = getCurrentUserId()
        if (userId) {
          subTasksRepo.update(subTaskId, { completed: nextCompleted }).then(() => {
            const task = useTasksStore.getState().tasks.find((t) => t.id === taskId)
            if (task) syncSubTasksOrder(taskId, task.subTasks)
          })
        }
      },

      deleteSubTask: (taskId, subTaskId) => {
        set((state) => ({
          tasks: updateTaskInList(state.tasks, taskId, (t) => ({
            ...t,
            subTasks: t.subTasks.filter((st) => st.id !== subTaskId),
          })),
        }))
        const userId = getCurrentUserId()
        if (userId) subTasksRepo.remove(subTaskId)
      },
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
