'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './HabitForm.module.sass'

interface HabitFormProps {
  onSubmit: (name: string, color: string) => void
  onCancel: () => void
  initialName?: string
  initialColor?: string
}

const DEFAULT_COLOR = '#5b5bd6'

export default function HabitForm({
  onSubmit,
  onCancel,
  initialName = '',
  initialColor = DEFAULT_COLOR,
}: HabitFormProps) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onCancel()
      }
    },
    [onCancel]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [handleOutsideClick])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (trimmed) {
      onSubmit(trimmed, color)
      setName('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div ref={wrapperRef} className={styles.form}>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="🔥 Nom de l'habitude..."
        maxLength={100}
      />
      <label className={styles.colorPicker}>
        <span className={styles.colorSwatch} style={{ background: color }}>
          🎨
        </span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className={styles.colorInput}
        />
      </label>
    </div>
  )
}
