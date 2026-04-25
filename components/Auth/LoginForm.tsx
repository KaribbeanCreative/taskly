'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import styles from './LoginForm.module.sass'

type Status = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginForm() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await signInWithEmail(email.trim())
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>✨ Taskly</div>
        <p className={styles.tagline}>
          📋 Tasks · 🎯 Goals · 🔥 Habits
        </p>

        {status === 'sent' ? (
          <div className={styles.sent}>
            <div className={styles.sentIcon}>📬</div>
            <h2>Lien envoyé</h2>
            <p>
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              <br />
              Clique dessus pour entrer dans l&apos;app.
            </p>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setStatus('idle')
                setEmail('')
              }}
            >
              ← Utiliser un autre email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className={styles.form}>
            <label htmlFor="email" className={styles.label}>
              📧 Connexion par email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              className={styles.submit}
              disabled={status === 'loading' || !email.trim()}
            >
              {status === 'loading' ? '⏳ Envoi…' : '✨ Recevoir le lien magique'}
            </button>
            {status === 'error' && (
              <p className={styles.error}>⚠️ {errorMsg}</p>
            )}
            <p className={styles.hint}>
              Pas de mot de passe — un lien à usage unique sera envoyé sur ton email.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
