// ---- TASKS ----
export type Priority = 'low' | 'medium' | 'high'

export type SubTask = {
  id: string
  title: string
  completed: boolean
}

export type Task = {
  id: string
  title: string
  icon: string
  color: string
  completed: boolean
  priority: Priority | null
  dueDate: string | null
  subTasks: SubTask[]
}

// ---- GOALS ----
export type GoalPeriod = 'week' | 'month' | 'year' | '3years'

export type Goal = {
  id: string
  title: string
  period: GoalPeriod
  completed: boolean
  createdAt: string
}

// ---- HABITS ----
export type Habit = {
  id: string
  name: string
  color: string
  completedDates: string[]
  createdAt: string
}

// ---- NAVIGATION ----
export type Section = 'tasks' | 'goals' | 'habits'
