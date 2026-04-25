import { Task, SubTask, Goal, Habit, GoalPeriod, Priority } from '@/types'

// ── DB row types ──────────────────────────────────────────────────────────
// Snake_case as Postgres returns them.

export type TaskRow = {
  id: string
  user_id: string
  title: string
  icon: string
  color: string
  completed: boolean
  priority: Priority | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

export type SubTaskRow = {
  id: string
  task_id: string
  user_id: string
  title: string
  completed: boolean
  position: number
  created_at: string
}

export type GoalRow = {
  id: string
  user_id: string
  title: string
  period: GoalPeriod
  completed: boolean
  position: number
  created_at: string
}

export type HabitRow = {
  id: string
  user_id: string
  name: string
  color: string
  position: number
  created_at: string
}

export type HabitCompletionRow = {
  id: string
  habit_id: string
  user_id: string
  date: string
  created_at: string
}

// ── Row → local type ──────────────────────────────────────────────────────
// SubTasks are passed in separately because they live in a different table.

export const rowToTask = (row: TaskRow, subTaskRows: SubTaskRow[]): Task => ({
  id: row.id,
  title: row.title,
  icon: row.icon,
  color: row.color,
  completed: row.completed,
  priority: row.priority,
  dueDate: row.due_date,
  subTasks: subTaskRows
    .filter((st) => st.task_id === row.id)
    .sort((a, b) => a.position - b.position)
    .map(rowToSubTask),
})

export const rowToSubTask = (row: SubTaskRow): SubTask => ({
  id: row.id,
  title: row.title,
  completed: row.completed,
})

export const rowToGoal = (row: GoalRow): Goal => ({
  id: row.id,
  title: row.title,
  period: row.period,
  completed: row.completed,
  createdAt: row.created_at,
})

export const rowToHabit = (
  row: HabitRow,
  completionRows: HabitCompletionRow[]
): Habit => ({
  id: row.id,
  name: row.name,
  color: row.color,
  completedDates: completionRows
    .filter((c) => c.habit_id === row.id)
    .map((c) => c.date),
  createdAt: row.created_at,
})
