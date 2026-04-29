export interface AuthSession {
  token: string
  expires_at: string
  session_type: string
  capabilities: string[]
}
