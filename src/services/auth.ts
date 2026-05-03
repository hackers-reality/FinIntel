import { API_BASE_URL } from '../constants/api'
import type { AuthSession, LoginRequest, MFASetup, TokenResponse, UserProfile } from '../types/auth'
import { ApiError } from './api'

function authHeaders(token?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const error = (await response.json()) as { detail?: string }
      if (error.detail) {
        message = error.detail
      }
    } catch {
      message = response.statusText || message
    }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export function createSession(): Promise<AuthSession> {
  return authFetch('/auth/session', { method: 'POST' })
}

export function register(email: string, password: string): Promise<UserProfile> {
  return authFetch('/auth/register', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  })
}

export function login({ email, password, mfa_code }: LoginRequest): Promise<TokenResponse> {
  return authFetch('/auth/login', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password, mfa_code }),
  })
}

export function logout(refreshToken: string): Promise<void> {
  return authFetch('/auth/logout', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function refreshToken(refreshToken: string): Promise<TokenResponse> {
  return authFetch('/auth/refresh', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function getProfile(accessToken: string): Promise<UserProfile> {
  return authFetch('/auth/me', {
    method: 'GET',
    headers: authHeaders(accessToken),
  })
}

export function enableMFA(accessToken: string): Promise<MFASetup> {
  return authFetch('/auth/mfa/enable', {
    method: 'POST',
    headers: authHeaders(accessToken),
  })
}

export function verifyMFA(accessToken: string, mfaCode: string): Promise<{ success: boolean; message: string }> {
  return authFetch('/auth/mfa/verify', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ mfa_code: mfaCode }),
  })
}

export function changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return authFetch('/auth/password/change', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem('finintel_access_token')
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem('finintel_refresh_token')
}

export function storeTokens(access: string, refresh: string): void {
  localStorage.setItem('finintel_access_token', access)
  localStorage.setItem('finintel_refresh_token', refresh)
}

export function clearTokens(): void {
  localStorage.removeItem('finintel_access_token')
  localStorage.removeItem('finintel_refresh_token')
}
