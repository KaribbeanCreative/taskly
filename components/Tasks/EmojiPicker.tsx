'use client'

import { useEffect, useRef } from 'react'
import styles from './EmojiPicker.module.sass'

const EMOJIS = [
  '📋', '🎯', '💡', '🔥', '⭐', '📌', '🚀', '💎',
  '📚', '✏️', '🎨', '🎵', '🏃', '💼', '🏠', '🛒',
  '💰', '🏥', '🍎', '☕', '✈️', '🌱', '🐾', '⚽',
  '🎮', '📱', '💻', '🎬', '🎁', '❤️', '🌟', '✅',
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    document.addEventListener('keydown', handleEscape)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div ref={ref} className={styles.picker}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className={styles.emoji}
          onClick={() => {
            onSelect(emoji)
            onClose()
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
