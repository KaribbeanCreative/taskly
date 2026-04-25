// Shared user-id holder: stores read from this to know whether to write through
// to Supabase. useAuth calls setCurrentUserId() whenever the session changes.

let currentUserId: string | null = null

export const setCurrentUserId = (id: string | null) => {
  currentUserId = id
}

export const getCurrentUserId = (): string | null => currentUserId
