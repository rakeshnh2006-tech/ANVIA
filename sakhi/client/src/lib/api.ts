import { supabase } from '../lib/supabase'

const API_BASE = '/api'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeader()

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(options.headers as Record<string, string> || {}),
      },
    })
  } catch (networkError) {
    // fetch() itself throws on network failure, CORS errors, or DNS resolution failure
    throw new Error('Network error — please check your connection and try again.')
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(errorBody.error || `Request failed with status ${res.status}`)
  }

  // 204 No Content — return empty object rather than calling res.json() on an empty body
  if (res.status === 204) {
    return {} as T
  }

  // Guard against non-JSON responses (e.g. HTML error pages from a reverse proxy)
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Unexpected response format from server (${res.status})`)
  }

  return res.json() as Promise<T>
}

export const api = {
  symptom: {
    analyze: (input: string, preferred_language: string) =>
      apiFetch('/symptom/analyze', {
        method: 'POST',
        body: JSON.stringify({ input, preferred_language }),
      }),
    history: () => apiFetch('/symptom/history'),
    deleteHistory: () => apiFetch('/symptom/history', { method: 'DELETE' }),
  },
  symptoms: {
    list: () => apiFetch('/symptoms'),
    create: (data: object) => apiFetch('/symptoms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => apiFetch(`/symptoms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/symptoms/${id}`, { method: 'DELETE' }),
  },
  cycles: {
    list: () => apiFetch('/cycles'),
    create: (data: object) => apiFetch('/cycles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => apiFetch(`/cycles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/cycles/${id}`, { method: 'DELETE' }),
  },
  report: {
    generate: (from?: string, to?: string) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return apiFetch(`/report/generate?${params.toString()}`)
    },
  },
  health: () => apiFetch('/health'),
}
