'use client'

import { useMemo } from 'react'
import { Habit } from '@/types'
import { useHabitsStore } from '@/store/useHabitsStore'
import styles from './Heatmap.module.sass'

interface HeatmapProps {
  habit: Habit
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekGrid(): { date: Date; dateStr: string }[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the start: go back ~52 weeks to the nearest Monday
  const start = new Date(today)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday - 52 * 7)

  const weeks: { date: Date; dateStr: string }[][] = []
  const current = new Date(start)

  while (current <= today) {
    const week: { date: Date; dateStr: string }[] = []
    for (let d = 0; d < 7; d++) {
      if (current <= today) {
        week.push({
          date: new Date(current),
          dateStr: formatLocalDate(current),
        })
      }
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

function getMonthLabels(weeks: { date: Date; dateStr: string }[][]): { label: string; index: number }[] {
  const labels: { label: string; index: number }[] = []
  let lastMonth = -1

  weeks.forEach((week, i) => {
    const firstDay = week[0]
    if (firstDay) {
      const month = firstDay.date.getMonth()
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], index: i })
        lastMonth = month
      }
    }
  })

  return labels
}

export default function Heatmap({ habit }: HeatmapProps) {
  const { toggleDate } = useHabitsStore()
  const completedSet = useMemo(() => new Set(habit.completedDates), [habit.completedDates])

  const weeks = useMemo(() => getWeekGrid(), [])
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  const totalDays = weeks.reduce((acc, w) => acc + w.length, 0)
  const completedCount = habit.completedDates.filter((d) => {
    const firstDate = weeks[0]?.[0]?.dateStr
    return firstDate ? d >= firstDate : false
  }).length

  return (
    <div className={styles.wrapper}>
      <div className={styles.stats}>
        <span>{completedCount} jours sur {totalDays}</span>
      </div>
      <div className={styles.scrollContainer}>
        <div className={styles.grid}>
          {/* Month labels row */}
          <div className={styles.monthRow}>
            <div className={styles.dayLabelSpacer} />
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.index === i)
              return (
                <div key={i} className={styles.monthCell}>
                  {label ? label.label : ''}
                </div>
              )
            })}
          </div>

          {/* Day rows */}
          {DAYS_OF_WEEK.map((dayName, dayIndex) => (
            <div key={dayName} className={styles.dayRow}>
              <div className={styles.dayLabel}>
                {dayIndex % 2 === 0 ? dayName : ''}
              </div>
              {weeks.map((week, weekIndex) => {
                const cell = week[dayIndex]
                if (!cell) {
                  return <div key={weekIndex} className={styles.cellEmpty} />
                }

                const isCompleted = completedSet.has(cell.dateStr)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isFuture = cell.date > today

                return (
                  <button
                    key={weekIndex}
                    className={styles.cell}
                    style={{
                      background: isFuture
                        ? 'transparent'
                        : isCompleted
                          ? habit.color
                          : 'rgba(248, 248, 248, 0.05)',
                      opacity: isCompleted ? 1 : undefined,
                    }}
                    onClick={() => {
                      if (!isFuture) {
                        toggleDate(habit.id, cell.dateStr)
                      }
                    }}
                    title={cell.dateStr}
                    disabled={isFuture}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
