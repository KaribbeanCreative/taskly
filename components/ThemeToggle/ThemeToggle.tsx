'use client'

import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.sass'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'taskly-theme'

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const initial: Theme = stored ?? (systemPrefersLight ? 'light' : 'dark')
    setTheme(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={toggle}
      title={theme === 'dark' ? 'Passer en light mode' : 'Passer en dark mode'}
      aria-label="Changer de thème"
    >
      <span className={styles.icon} aria-hidden="true">
        {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌓'}
      </span>
    </button>
  )
}
