'use client'

import { useAuth } from '@/hooks/useAuth'
import styles from './SignOutButton.module.sass'

export default function SignOutButton() {
  const { user, signOut } = useAuth()

  const handleClick = async () => {
    if (!user) return
    if (!confirm(`Te déconnecter de ${user.email} ?`)) return
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  if (!user) return null

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      title={`Déconnexion (${user.email})`}
      aria-label="Se déconnecter"
    >
      <span className={styles.icon} aria-hidden="true">
        🚪
      </span>
    </button>
  )
}
