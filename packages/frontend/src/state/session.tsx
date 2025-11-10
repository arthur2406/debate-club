import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

export interface SessionUser {
  id: string
  name: string
  isGuest: boolean
  createdAt: string
}

interface SessionContextValue {
  session: SessionUser | null
  setSession: (user: SessionUser) => void
  clearSession: () => void
}

const STORAGE_KEY = 'debate-club-session'

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

const readFromStorage = (): SessionUser | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as SessionUser
    return parsed
  } catch (error) {
    console.warn('Failed to read session from storage', error)
    return null
  }
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<SessionUser | null>(() => readFromStorage())

  const setSession = useCallback((user: SessionUser) => {
    setSessionState(user)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    }
  }, [])

  const clearSession = useCallback(() => {
    setSessionState(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const value = useMemo(() => ({ session, setSession, clearSession }), [session, setSession, clearSession])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
