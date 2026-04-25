'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { setCurrentUserId } from '@/lib/supabase/auth-context'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setCurrentUserId(session?.user.id ?? null)
      setState({ user: session?.user ?? null, session, loading: false })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUserId(session?.user.id ?? null)
        setState({ user: session?.user ?? null, session, loading: false })
      }
    )

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin : undefined
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return { ...state, signInWithEmail, signOut }
}
