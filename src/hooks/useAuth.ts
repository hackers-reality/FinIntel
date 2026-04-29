import { useEffect, useState } from 'react'

import { createSession } from '../services/auth'
import type { AuthSession } from '../types/auth'

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrapSession() {
      try {
        const nextSession = await createSession()
        if (!cancelled) {
          setSession(nextSession)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to establish an application session.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    session,
    sessionToken: session?.token ?? null,
    isLoading,
    error,
  }
}
