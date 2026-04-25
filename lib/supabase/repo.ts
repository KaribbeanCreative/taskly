import { supabase } from './client'
import {
  TaskRow,
  SubTaskRow,
  GoalRow,
  HabitRow,
  HabitCompletionRow,
  rowToTask,
  rowToGoal,
  rowToHabit,
} from './mappers'
import { Task, Goal, Habit, Priority, GoalPeriod } from '@/types'

// All operations assume RLS is enabled — user_id is always set to auth.uid().
// Errors are logged to the console; callers can decide whether to surface them.

const log = (op: string, err: unknown) => {
  console.error(`[supabase ${op}] failed`, err)
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export const tasksRepo = {
  async fetchAll(userId: string): Promise<Task[]> {
    const { data: tasks, error: e1 } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    if (e1) {
      log('tasks.fetchAll', e1)
      return []
    }
    const { data: subs, error: e2 } = await supabase
      .from('sub_tasks')
      .select('*')
      .eq('user_id', userId)
    if (e2) {
      log('sub_tasks.fetchAll', e2)
      return (tasks as TaskRow[]).map((t) => rowToTask(t, []))
    }
    return (tasks as TaskRow[]).map((t) =>
      rowToTask(t, subs as SubTaskRow[])
    )
  },

  async upsert(userId: string, task: Task, position: number) {
    const { error } = await supabase.from('tasks').upsert({
      id: task.id,
      user_id: userId,
      title: task.title,
      icon: task.icon,
      color: task.color,
      completed: task.completed,
      priority: task.priority,
      due_date: task.dueDate,
      position,
    })
    if (error) log('tasks.upsert', error)
  },

  async update(
    id: string,
    patch: Partial<{
      title: string
      icon: string
      color: string
      completed: boolean
      priority: Priority | null
      due_date: string | null
      position: number
    }>
  ) {
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) log('tasks.update', error)
  },

  async remove(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) log('tasks.remove', error)
  },

  async reorderAll(userId: string, orderedIds: string[]) {
    // Bulk position update via individual updates (Postgres has no portable batch).
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase
          .from('tasks')
          .update({ position: idx })
          .eq('id', id)
          .eq('user_id', userId)
      )
    )
  },
}

// ── SubTasks ──────────────────────────────────────────────────────────────

export const subTasksRepo = {
  async upsert(userId: string, taskId: string, sub: { id: string; title: string; completed: boolean }, position: number) {
    const { error } = await supabase.from('sub_tasks').upsert({
      id: sub.id,
      task_id: taskId,
      user_id: userId,
      title: sub.title,
      completed: sub.completed,
      position,
    })
    if (error) log('sub_tasks.upsert', error)
  },

  async update(id: string, patch: Partial<{ title: string; completed: boolean; position: number }>) {
    const { error } = await supabase.from('sub_tasks').update(patch).eq('id', id)
    if (error) log('sub_tasks.update', error)
  },

  async remove(id: string) {
    const { error } = await supabase.from('sub_tasks').delete().eq('id', id)
    if (error) log('sub_tasks.remove', error)
  },

  async reorderForTask(userId: string, taskId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase
          .from('sub_tasks')
          .update({ position: idx })
          .eq('id', id)
          .eq('user_id', userId)
          .eq('task_id', taskId)
      )
    )
  },
}

// ── Goals ─────────────────────────────────────────────────────────────────

export const goalsRepo = {
  async fetchAll(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    if (error) {
      log('goals.fetchAll', error)
      return []
    }
    return (data as GoalRow[]).map(rowToGoal)
  },

  async upsert(userId: string, goal: Goal & { period: GoalPeriod }, position: number) {
    const { error } = await supabase.from('goals').upsert({
      id: goal.id,
      user_id: userId,
      title: goal.title,
      period: goal.period,
      completed: goal.completed,
      position,
      created_at: goal.createdAt,
    })
    if (error) log('goals.upsert', error)
  },

  async update(
    id: string,
    patch: Partial<{ title: string; period: GoalPeriod; completed: boolean; position: number }>
  ) {
    const { error } = await supabase.from('goals').update(patch).eq('id', id)
    if (error) log('goals.update', error)
  },

  async remove(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) log('goals.remove', error)
  },

  async reorderAll(userId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase
          .from('goals')
          .update({ position: idx })
          .eq('id', id)
          .eq('user_id', userId)
      )
    )
  },
}

// ── Habits ────────────────────────────────────────────────────────────────

export const habitsRepo = {
  async fetchAll(userId: string): Promise<Habit[]> {
    const { data: habits, error: e1 } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    if (e1) {
      log('habits.fetchAll', e1)
      return []
    }
    const { data: completions, error: e2 } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
    if (e2) {
      log('habit_completions.fetchAll', e2)
      return (habits as HabitRow[]).map((h) => rowToHabit(h, []))
    }
    return (habits as HabitRow[]).map((h) =>
      rowToHabit(h, completions as HabitCompletionRow[])
    )
  },

  async upsert(userId: string, habit: Habit, position: number) {
    const { error } = await supabase.from('habits').upsert({
      id: habit.id,
      user_id: userId,
      name: habit.name,
      color: habit.color,
      position,
      created_at: habit.createdAt,
    })
    if (error) log('habits.upsert', error)
  },

  async update(id: string, patch: Partial<{ name: string; color: string; position: number }>) {
    const { error } = await supabase.from('habits').update(patch).eq('id', id)
    if (error) log('habits.update', error)
  },

  async remove(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) log('habits.remove', error)
  },

  async reorderAll(userId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase
          .from('habits')
          .update({ position: idx })
          .eq('id', id)
          .eq('user_id', userId)
      )
    )
  },
}

// ── Habit completions ─────────────────────────────────────────────────────

export const habitCompletionsRepo = {
  async add(userId: string, habitId: string, date: string) {
    const { error } = await supabase.from('habit_completions').insert({
      habit_id: habitId,
      user_id: userId,
      date,
    })
    if (error) log('habit_completions.add', error)
  },

  async remove(userId: string, habitId: string, date: string) {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
    if (error) log('habit_completions.remove', error)
  },
}
