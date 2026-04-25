'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTasksStore } from '@/store/useTasksStore'
import { useGoalsStore } from '@/store/useGoalsStore'
import { useHabitsStore } from '@/store/useHabitsStore'
import {
  tasksRepo,
  subTasksRepo,
  goalsRepo,
  habitsRepo,
  habitCompletionsRepo,
} from '@/lib/supabase/repo'
import {
  rowToTask,
  rowToSubTask,
  rowToGoal,
  rowToHabit,
  TaskRow,
  SubTaskRow,
  GoalRow,
  HabitRow,
  HabitCompletionRow,
} from '@/lib/supabase/mappers'
import type { Task, SubTask, Habit } from '@/types'

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }
const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const ra = a.priority ? PRIORITY_RANK[a.priority] : 3
    const rb = b.priority ? PRIORITY_RANK[b.priority] : 3
    return ra - rb
  })

// Hydrates Zustand stores from Supabase on sign-in, pushes local data when
// remote is empty, and subscribes to postgres_changes for cross-device push.
// Resets stores on sign-out.

async function hydrateAndMaybePush(userId: string) {
  // Tasks
  const remoteTasks = await tasksRepo.fetchAll(userId)
  if (remoteTasks.length > 0) {
    useTasksStore.setState({ tasks: remoteTasks })
  } else {
    const localTasks = useTasksStore.getState().tasks
    if (localTasks.length > 0) {
      await Promise.all(
        localTasks.map(async (t, i) => {
          await tasksRepo.upsert(userId, t, i)
          await Promise.all(
            t.subTasks.map((st, j) => subTasksRepo.upsert(userId, t.id, st, j))
          )
        })
      )
    }
  }

  // Goals
  const remoteGoals = await goalsRepo.fetchAll(userId)
  if (remoteGoals.length > 0) {
    useGoalsStore.setState({ goals: remoteGoals })
  } else {
    const localGoals = useGoalsStore.getState().goals
    if (localGoals.length > 0) {
      await Promise.all(
        localGoals.map((g, i) =>
          goalsRepo.upsert(userId, { ...g } as Parameters<typeof goalsRepo.upsert>[1], i)
        )
      )
    }
  }

  // Habits
  const remoteHabits = await habitsRepo.fetchAll(userId)
  if (remoteHabits.length > 0) {
    useHabitsStore.setState({ habits: remoteHabits })
  } else {
    const localHabits = useHabitsStore.getState().habits
    if (localHabits.length > 0) {
      await Promise.all(
        localHabits.map(async (h, i) => {
          await habitsRepo.upsert(userId, h, i)
          await Promise.all(
            h.completedDates.map((d) => habitCompletionsRepo.add(userId, h.id, d))
          )
        })
      )
    }
  }
}

function applyTaskRowChange(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: TaskRow
  old?: TaskRow
}) {
  const { eventType } = payload
  useTasksStore.setState((state) => {
    if (eventType === 'DELETE') {
      const id = payload.old?.id
      return { tasks: state.tasks.filter((t) => t.id !== id) }
    }
    const row = payload.new
    if (!row) return state
    const existing = state.tasks.find((t) => t.id === row.id)
    const subs = existing?.subTasks ?? []
    const merged: Task = { ...rowToTask(row, []), subTasks: subs }
    const idx = state.tasks.findIndex((t) => t.id === row.id)
    const next = idx >= 0
      ? state.tasks.map((t, i) => (i === idx ? merged : t))
      : [...state.tasks, merged]
    return { tasks: sortTasks(next) }
  })
}

function applySubTaskRowChange(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: SubTaskRow
  old?: SubTaskRow
}) {
  const { eventType } = payload
  useTasksStore.setState((state) => {
    if (eventType === 'DELETE') {
      const id = payload.old?.id
      const taskId = payload.old?.task_id
      if (!taskId) return state
      return {
        tasks: state.tasks.map((t) =>
          t.id !== taskId ? t : { ...t, subTasks: t.subTasks.filter((st) => st.id !== id) }
        ),
      }
    }
    const row = payload.new
    if (!row) return state
    const subTask: SubTask = rowToSubTask(row)
    return {
      tasks: state.tasks.map((t) => {
        if (t.id !== row.task_id) return t
        const existingIdx = t.subTasks.findIndex((st) => st.id === row.id)
        if (existingIdx >= 0) {
          const next = [...t.subTasks]
          next[existingIdx] = subTask
          return { ...t, subTasks: next }
        }
        return { ...t, subTasks: [...t.subTasks, subTask] }
      }),
    }
  })
}

function applyGoalRowChange(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: GoalRow
  old?: GoalRow
}) {
  const { eventType } = payload
  useGoalsStore.setState((state) => {
    if (eventType === 'DELETE') {
      const id = payload.old?.id
      return { goals: state.goals.filter((g) => g.id !== id) }
    }
    const row = payload.new
    if (!row) return state
    const goal = rowToGoal(row)
    const idx = state.goals.findIndex((g) => g.id === row.id)
    if (idx >= 0) {
      const next = [...state.goals]
      next[idx] = goal
      return { goals: next }
    }
    return { goals: [...state.goals, goal] }
  })
}

function applyHabitRowChange(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: HabitRow
  old?: HabitRow
}) {
  const { eventType } = payload
  useHabitsStore.setState((state) => {
    if (eventType === 'DELETE') {
      const id = payload.old?.id
      return { habits: state.habits.filter((h) => h.id !== id) }
    }
    const row = payload.new
    if (!row) return state
    const existing = state.habits.find((h) => h.id === row.id)
    const habit: Habit = rowToHabit(row, [])
    habit.completedDates = existing?.completedDates ?? []
    const idx = state.habits.findIndex((h) => h.id === row.id)
    if (idx >= 0) {
      const next = [...state.habits]
      next[idx] = habit
      return { habits: next }
    }
    return { habits: [...state.habits, habit] }
  })
}

function applyHabitCompletionRowChange(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: HabitCompletionRow
  old?: HabitCompletionRow
}) {
  const { eventType } = payload
  useHabitsStore.setState((state) => {
    if (eventType === 'DELETE') {
      const habitId = payload.old?.habit_id
      const date = payload.old?.date
      if (!habitId || !date) return state
      return {
        habits: state.habits.map((h) =>
          h.id !== habitId
            ? h
            : { ...h, completedDates: h.completedDates.filter((d) => d !== date) }
        ),
      }
    }
    const row = payload.new
    if (!row) return state
    return {
      habits: state.habits.map((h) => {
        if (h.id !== row.habit_id) return h
        if (h.completedDates.includes(row.date)) return h
        return { ...h, completedDates: [...h.completedDates, row.date] }
      }),
    }
  })
}

export function useSync() {
  const { user } = useAuth()
  const userId = user?.id
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!userId) {
      // Clean up on sign-out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      // Clear stores so user A's data doesn't leak when user B logs in
      useTasksStore.setState({ tasks: [] })
      useGoalsStore.setState({ goals: [] })
      useHabitsStore.setState({ habits: [] })
      return
    }

    let cancelled = false

    hydrateAndMaybePush(userId).then(() => {
      if (cancelled) return

      const filter = `user_id=eq.${userId}`
      const channel = supabase
        .channel(`taskly-sync-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter },
          (payload) => applyTaskRowChange(payload as unknown as Parameters<typeof applyTaskRowChange>[0])
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sub_tasks', filter },
          (payload) => applySubTaskRowChange(payload as unknown as Parameters<typeof applySubTaskRowChange>[0])
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'goals', filter },
          (payload) => applyGoalRowChange(payload as unknown as Parameters<typeof applyGoalRowChange>[0])
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habits', filter },
          (payload) => applyHabitRowChange(payload as unknown as Parameters<typeof applyHabitRowChange>[0])
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habit_completions', filter },
          (payload) =>
            applyHabitCompletionRowChange(
              payload as unknown as Parameters<typeof applyHabitCompletionRowChange>[0]
            )
        )
        .subscribe()

      channelRef.current = channel
    })

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId])
}
