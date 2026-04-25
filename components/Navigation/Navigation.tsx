'use client'

import { Section } from '@/types'
import cn from 'classnames'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import SignOutButton from '@/components/Auth/SignOutButton'
import styles from './Navigation.module.sass'

interface NavigationProps {
  active: Section
  onChange: (section: Section) => void
}

const sections: { key: Section; label: string; emoji: string }[] = [
  { key: 'tasks', label: 'Tasks', emoji: '📋' },
  { key: 'goals', label: 'Goals', emoji: '🎯' },
  { key: 'habits', label: 'Habits', emoji: '🔥' },
]

export default function Navigation({ active, onChange }: NavigationProps) {
  return (
    <>
      {/* 🖥️ Desktop / Tablet sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.logo}>✨ Taskly</div>
        <ul className={styles.menu}>
          {sections.map((s) => (
            <li key={s.key}>
              <button
                className={cn(styles.menuItem, {
                  [styles.active]: active === s.key,
                })}
                onClick={() => onChange(s.key)}
              >
                <span className={styles.icon}>{s.emoji}</span>
                <span className={styles.label}>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.sidebarFooter}>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </nav>

      {/* 📱 Mobile bottom bar */}
      <nav className={styles.bottomBar}>
        {sections.map((s) => (
          <button
            key={s.key}
            className={cn(styles.bottomItem, {
              [styles.active]: active === s.key,
            })}
            onClick={() => onChange(s.key)}
          >
            <span className={styles.icon}>{s.emoji}</span>
            <span className={styles.bottomLabel}>{s.label}</span>
          </button>
        ))}
        <div className={styles.bottomItem}>
          <ThemeToggle />
        </div>
        <div className={styles.bottomItem}>
          <SignOutButton />
        </div>
      </nav>
    </>
  )
}
