import type {
  DebateSessionState,
  DebateTopic,
  WhipPublishResponse,
  WhipSession,
} from '@debate-club/shared'

const resolveBaseUrl = () => {
  const env = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined
  if (env && typeof env === 'string') {
    return env.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    const port = window.location.port ? Number(window.location.port) : undefined
    if (port && port !== 80 && port !== 443) {
      return `${protocol}//${hostname}:3000`
    }
    return `${protocol}//${hostname}`
  }
  return 'http://localhost:3000'
}

const API_BASE_URL = resolveBaseUrl()

const jsonHeaders = { 'Content-Type': 'application/json' }

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function fetchTopics(): Promise<DebateTopic[]> {
  return apiFetch<DebateTopic[]>('/topics')
}

export async function createSession(
  topicId: string,
  participantIds: string[],
): Promise<DebateSessionState> {
  return apiFetch<DebateSessionState>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ topicId, participantIds }),
  })
}

export async function fetchSession(sessionId: string): Promise<DebateSessionState> {
  return apiFetch<DebateSessionState>(`/sessions/${sessionId}`)
}

export async function fetchParticipants(sessionId: string): Promise<WhipSession[]> {
  return apiFetch<WhipSession[]>(`/sessions/${sessionId}/participants`)
}

export async function publishWhipSession(payload: {
  sessionId: string
  participantId: string
  sdpOffer: string
  clientCapabilities?: Record<string, unknown>
}): Promise<WhipPublishResponse> {
  return apiFetch<WhipPublishResponse>('/whip/publish', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteWhipSession(sessionId: string, participantId: string): Promise<void> {
  await apiFetch(`/whip/${sessionId}/${participantId}`, { method: 'DELETE' })
}

export function buildSignalingUrl(sessionId: string, participantId: string): string {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws')
  const url = new URL(`/sessions/${sessionId}/signaling`, wsBase)
  url.searchParams.set('participantId', participantId)
  return url.toString()
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
}
