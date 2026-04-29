import { API_BASE_URL } from '../constants/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  sessionToken?: string | null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.sessionToken ? { 'X-Session-Token': options.sessionToken } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

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
