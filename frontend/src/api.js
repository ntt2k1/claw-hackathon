const BASE = '/api'

function getToken() {
  return localStorage.getItem('sole_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const api = {
  register: (email, password) => request('POST', '/auth/register', { email, password }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  quizComplete: (payload) => request('POST', '/quiz/complete', payload),
  getVibe: () => request('GET', '/vibe'),
  recommendations: (payload) => request('POST', '/recommendations', payload),
  ratePlace: (payload) => request('POST', '/vibe/rate', payload),
  getRatings: () => request('GET', '/vibe/ratings'),
  saveToken: (token) => localStorage.setItem('sole_token', token),
  clearToken: () => localStorage.removeItem('sole_token'),
  hasToken: () => !!getToken(),
}
