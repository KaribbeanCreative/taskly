'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSync } from '@/hooks/useSync'
import LoginForm from './LoginForm'
import styles from './AuthGate.module.sass'

function SyncedShell({ children }: { children: ReactNode }) {
  useSync()
  return <>{children}</>
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}>✨</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <SyncedShell>{children}</SyncedShell>
}
