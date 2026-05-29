import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatResponse,
  ProviderRegistryState,
  TaskRole,
} from '../types/ai-provider'
import { DEFAULT_ROLE_PRIORITY } from '../types/ai-provider'

const PROVIDER_CONFIGS: AIProviderConfig[] = [
  {
    name: 'nvidia_nim',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    envKey: 'NVIDIA_NIM_API_KEY',
    defaultModel: 'meta/llama-3.1-70b-instruct',
    id: 'nvidia_nim',
    description: 'Ultra-low latency inference via NVIDIA cloud microservices',
    models: [
      'meta/llama-3.1-70b-instruct',
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'mistralai/mixtral-8x7b-instruct-v0.1',
    ],
    apiKeyLabel: 'NVIDIA API Key',
    docsUrl: 'https://build.nvidia.com',
    badge: 'Primary',
  },
  {
    name: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-20250514',
    extraHeaders: { 'anthropic-version': '2023-06-01' },
  },
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
  },
  {
    name: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    envKey: 'GOOGLE_API_KEY',
    defaultModel: 'gemini-2.0-flash',
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    defaultModel: 'anthropic/claude-sonnet-4',
  },
  {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    name: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat',
  },
  {
    name: 'kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    envKey: 'KIMI_API_KEY',
    defaultModel: 'moonshot-v1-8k',
  },
  {
    name: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    envKey: '',
    defaultModel: 'llama3',
  },
]

const ROLE_MAP: Record<string, TaskRole[]> = {
  nvidia_nim: ['orchestrator', 'reasoning', 'speed'],
  anthropic: ['orchestrator', 'reasoning', 'creative'],
  openai: ['orchestrator', 'reasoning', 'speed', 'creative'],
  google: ['orchestrator', 'reasoning', 'creative'],
  openrouter: ['orchestrator', 'reasoning'],
  groq: ['speed'],
  deepseek: ['reasoning', 'speed'],
  kimi: ['speed'],
  ollama: ['orchestrator', 'reasoning', 'speed', 'creative'],
}

let state: ProviderRegistryState = {
  providers: [],
  preferred: 'nvidia_nim',
  roleRouting: DEFAULT_ROLE_PRIORITY,
}

function buildProviders(apiKeys: Record<string, string>, models: Record<string, string>): AIProvider[] {
  return PROVIDER_CONFIGS.map((config) => ({
    name: config.name,
    role: ROLE_MAP[config.name] ?? ['orchestrator'],
    config: {
      ...config,
      defaultModel: models[config.name] ?? config.defaultModel,
    },
    isConfigured: !!(apiKeys[config.name] || config.envKey === ''),
  }))
}

export function initProviderRegistry(
  apiKeys: Record<string, string> = {},
  models: Record<string, string> = {},
): ProviderRegistryState {
  state = {
    providers: buildProviders(apiKeys, models),
    preferred: 'nvidia_nim',
    roleRouting: DEFAULT_ROLE_PRIORITY,
  }
  return state
}

export function getRegistryState(): ProviderRegistryState {
  return state
}

export function setPreferredProvider(name: string): void {
  const provider = state.providers.find((p) => p.name === name)
  if (!provider) {
    throw new Error(`Provider "${name}" not found in registry`)
  }
  state.preferred = name
}

export function getProviderForRole(role: TaskRole): AIProvider | null {
  const priority = state.roleRouting[role]
  for (const providerName of priority) {
    const provider = state.providers.find(
      (p) => p.name === providerName && p.isConfigured && p.role.includes(role),
    )
    if (provider) {
      return provider
    }
  }
  return null
}

export function resolveProviderByModel(modelString: string): AIProvider | null {
  const normalized = modelString.toLowerCase()
  if (modelString.includes('/')) {
    const [providerName] = modelString.split('/')
    return state.providers.find((p) => p.name === providerName) ?? null
  }
  if (normalized.startsWith('claude')) {
    return state.providers.find((p) => p.name === 'anthropic') ?? null
  }
  if (normalized.startsWith('gpt') || normalized.startsWith('o1') || normalized.startsWith('o3')) {
    return state.providers.find((p) => p.name === 'openai') ?? null
  }
  if (normalized.startsWith('gemini')) {
    return state.providers.find((p) => p.name === 'google') ?? null
  }
  if (normalized.startsWith('deepseek')) {
    return state.providers.find((p) => p.name === 'deepseek') ?? null
  }
  if (normalized.startsWith('llama')) {
    return state.providers.find((p) => p.name === 'groq') ?? state.providers.find((p) => p.name === 'ollama') ?? null
  }
  return state.providers.find((p) => p.name === state.preferred) ?? null
}

export async function sendChatRequest(
  messages: ChatMessage[],
  providerName?: string,
  modelOverride?: string,
): Promise<ChatResponse> {
  const provider = providerName
    ? state.providers.find((p) => p.name === providerName)
    : getProviderForRole('orchestrator')

  if (!provider) {
    throw new Error('No configured AI provider available')
  }

  const model = modelOverride ?? provider.config.defaultModel
  const apiKey = localStorage.getItem(`ai_key_${provider.name}`)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...(provider.config.extraHeaders ?? {}),
  }

  const body = provider.name === 'anthropic'
    ? {
        model,
        max_tokens: 4096,
        system: messages.find((m) => m.role === 'system')?.content ?? '',
        messages: messages.filter((m) => m.role !== 'system'),
      }
    : {
        model,
        messages: messages,
        max_tokens: 4096,
      }

  const endpoint = provider.name === 'anthropic'
    ? `${provider.config.baseUrl}/messages`
    : `${provider.config.baseUrl}/chat/completions`

  const start = performance.now()
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`${provider.name} API error (${response.status}): ${error}`)
  }

  const data = await response.json()
  const latency = Math.round(performance.now() - start)

  const content = provider.name === 'anthropic'
    ? data.content?.[0]?.text ?? ''
    : data.choices?.[0]?.message?.content ?? ''

  return {
    content,
    model,
    latency,
    provider: provider.name,
  }
}

export async function testProviderConnection(
  providerName: string,
  apiKey: string,
): Promise<{ success: boolean; latency: number; message: string }> {
  const config = PROVIDER_CONFIGS.find((p) => p.name === providerName)
  if (!config) {
    return { success: false, latency: 0, message: 'Unknown provider' }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    ...(config.extraHeaders ?? {}),
  }

  const body = config.name === 'anthropic'
    ? {
        model: config.defaultModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }
    : {
        model: config.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }

  const endpoint = config.name === 'anthropic'
    ? `${config.baseUrl}/messages`
    : `${config.baseUrl}/chat/completions`

  const start = performance.now()
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const latency = Math.round(performance.now() - start)

    if (!response.ok) {
      const error = await response.text()
      return { success: false, latency, message: error }
    }

    return { success: true, latency, message: `Connected in ${latency}ms` }
  } catch (error) {
    return {
      success: false,
      latency: 0,
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

export function saveProviderKey(providerName: string, apiKey: string): void {
  localStorage.setItem(`ai_key_${providerName}`, apiKey)
  const provider = state.providers.find((p) => p.name === providerName)
  if (provider) {
    provider.isConfigured = true
  }
}

export function removeProviderKey(providerName: string): void {
  localStorage.removeItem(`ai_key_${providerName}`)
  const provider = state.providers.find((p) => p.name === providerName)
  if (provider) {
    provider.isConfigured = false
  }
}

export function listConfiguredProviders(): AIProvider[] {
  return state.providers.filter((p) => p.isConfigured)
}
