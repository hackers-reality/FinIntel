import { useCallback, useEffect, useRef, useState } from 'react'

import {
  clearTokens,
  createSession,
  getProfile,
  getStoredAccessToken,
  getStoredRefreshToken,
  login as loginService,
  logout as logoutService,
  refreshToken as refreshService,
  register as registerService,
  storeTokens,
} from '../services/auth'
import type { AuthSession, UserProfile } from '../types/auth'

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current)
    }
    refreshTimer.current = setTimeout(async () => {
      const storedRefresh = getStoredRefreshToken()
      if (!storedRefresh) return
      try {
        const tokens = await refreshService(storedRefresh)
        storeTokens(tokens.access_token, tokens.refresh_token)
        const profile = await getProfile(tokens.access_token)
        setUser(profile)
        scheduleRefresh()
      } catch {
        clearTokens()
        setUser(null)
        setSession(null)
        setError('Session expired. Please log in again.')
      }
    }, 13 * 60 * 1000)
  }, [])

  const bootstrap = useCallback(async () => {
    const stored = getStoredAccessToken()
    if (stored) {
      try {
        const profile = await getProfile(stored)
        setUser(profile)
        scheduleRefresh()
        const nextSession = await createSession()
        if (!user) {
          setSession(nextSession)
        }
      } catch {
        const storedRefresh = getStoredRefreshToken()
        if (storedRefresh) {
          try {
            const tokens = await refreshService(storedRefresh)
            storeTokens(tokens.access_token, tokens.refresh_token)
            const profile = await getProfile(tokens.access_token)
            setUser(profile)
            scheduleRefresh()
          } catch {
            clearTokens()
          }
        } else {
          clearTokens()
        }
      }
    }

    try {
      const nextSession = await createSession()
      if (!user) {
        setSession(nextSession)
      }
    } catch {
      if (!user) {
        setError('Unable to establish an application session.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, scheduleRefresh])

  useEffect(() => {
    void bootstrap()
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }
    }
  }, [bootstrap])

  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const tokens = await loginService({ email, password, mfa_code: mfaCode })
      storeTokens(tokens.access_token, tokens.refresh_token)
      const profile = await getProfile(tokens.access_token)
      setUser(profile)
      setSession(null)
      scheduleRefresh()
      return profile
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [scheduleRefresh])

  const register = useCallback(async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const profile = await registerService(email, password)
      return profile
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current)
    }
    const storedRefresh = getStoredRefreshToken()
    if (storedRefresh) {
      try {
        await logoutService(storedRefresh)
      } catch {
        // Ignore logout errors
      }
    }
    clearTokens()
    setUser(null)
    setSession(null)
    setError(null)
  }, [])

  return {
    session,
    sessionToken: session?.token ?? null,
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
  }
}
