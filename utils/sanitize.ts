const TITLE_MAX_LENGTH = 200
const NAME_MAX_LENGTH = 100

export function sanitizeTitle(value: string): string {
  return value.trim().slice(0, TITLE_MAX_LENGTH)
}

export function sanitizeName(value: string): string {
  return value.trim().slice(0, NAME_MAX_LENGTH)
}

export function isValidPriority(value: string): value is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(value)
}

export function isValidGoalPeriod(value: string): value is 'week' | 'month' | 'year' | '3years' {
  return ['week', 'month', 'year', '3years'].includes(value)
}

export function isValidDateString(value: string): boolean {
  const date = new Date(value)
  return !isNaN(date.getTime())
}

export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function isOverdue(isoDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(isoDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}
