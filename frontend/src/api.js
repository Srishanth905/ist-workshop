const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://ist-workshop.onrender.com')
  .replace(/\/+$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`)
  }
  return data
}

export const api = {
  listEvents: () => request('/api/events'),
  getEvent: (eventId) => request(`/api/events/${encodeURIComponent(eventId)}`),
  register: (userId, eventId) => request('/api/registrations', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, event_id: eventId }),
  }),
  listRegistrations: (userId) => request(`/api/me/registrations?user_id=${encodeURIComponent(userId)}`),
}

export { API_BASE_URL }