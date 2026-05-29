export type TaskRole = 'orchestrator' | 'reasoning' | 'speed' | 'creative'

export interface AIProviderConfig {
  name: string
  baseUrl: string
  envKey: string
  defaultModel: string
  extraHeaders?: Record<string, string>
  // Display/metadata fields for UI rendering
  id?: string
  description?: string
  models?: string[]
  apiKeyLabel?: string
  docsUrl?: string
  badge?: string
}

export interface AIProvider {
  name: string
  role: TaskRole[]
  config: AIProviderConfig
  isConfigured: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  content: string
  model: string
  latency: number
  provider: string
}

export interface ProviderRegistryState {
  providers: AIProvider[]
  preferred: string
  roleRouting: Record<TaskRole, string[]>
}

export const DEFAULT_ROLE_PRIORITY: Record<TaskRole, string[]> = {
  orchestrator: ['anthropic', 'claude-cli', 'opencode-cli', 'openrouter', 'openai', 'google'],
  reasoning: ['openai', 'anthropic', 'deepseek', 'openrouter', 'google'],
  speed: ['groq', 'kimi', 'gemini', 'deepseek', 'openai'],
  creative: ['gemini', 'anthropic', 'openai', 'google'],
}
