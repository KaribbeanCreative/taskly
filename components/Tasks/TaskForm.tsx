'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './TaskForm.module.sass'

interface TaskFormProps {
  placeholder: string
  onSubmit: (value: string) => void
  onCancel: () => void
  initialValue?: string
}

export default function TaskForm({
  placeholder,
  onSubmit,
  onCancel,
  initialValue = '',
}: TaskFormProps) {
  const [value, setValue] = useState(initialValue)
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
    const trimmed = value.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setValue('')
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={200}
      />
    </div>
  )
}
