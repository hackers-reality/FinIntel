import { apiRequest } from './api'
import type { AuthSession } from '../types/auth'

export function createSession(): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/session', { method: 'POST' })
}
