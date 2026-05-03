export interface AuthSession {
  token: string
  expires_at: string
  session_type: string
  capabilities: string[]
}

export interface User {
  id: number
  email: string
  role: string
  mfa_enabled: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface MFASetup {
  secret: string
  uri: string
  backup_codes: string[]
}

export interface UserProfile {
  id: number
  email: string
  role: string
  mfa_enabled: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
  mfa_code?: string
}

export interface RegisterRequest {
  email: string
  password: string
}
