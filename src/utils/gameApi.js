import { currentSessionToken, ensureGuestIdentity } from './platformIdentity.js'
import { getDeviceTimeZone } from './timeZone.js'

async function request(path, body) {
  let token = currentSessionToken()
  if (!token) { await ensureGuestIdentity(); token = currentSessionToken() }
  const response = await fetch(path, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const data = await response.json()
  if (!response.ok) throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status, code: data.code })
  return data
}

export const playerGameApi = {
  state: (timeZone = getDeviceTimeZone()) => request(`/api/fo-game?service=rewards&timeZone=${encodeURIComponent(timeZone)}`),
  dailyLogin: timeZone => request('/api/fo-game?service=rewards', { action: 'daily-login', timeZone }),
  spinWheel: ({ spinType, advertCompletionId }) => request('/api/fo-game?service=rewards', { action: 'daily-wheel', spinType, advertCompletionId, timeZone: getDeviceTimeZone() }),
  action: body => request('/api/fo-game?service=actions', body),
  market: body => request('/api/fo-game?service=market', body),
  marketListings: () => request('/api/fo-game?service=market'),
  liveOps: () => request('/api/fo-game?service=live-ops'),
  cloud: () => request('/api/fo-game?service=cloud'),
  saveCloud: body => request('/api/fo-game?service=cloud', body),
  createMatch: body => request('/api/fo-game?service=matches', { action: 'create', ...body }),
  matchEvent: body => request('/api/fo-game?service=matches', { action: 'event', ...body }),
  matchState: matchId => request(`/api/fo-game?service=matches&matchId=${encodeURIComponent(matchId)}`),
  completeMatch: body => request('/api/fo-game?service=matches', { action: 'complete', ...body }),
  match3: body => request('/api/fo-game?service=match3', body),
  match3State: sessionId => request(`/api/fo-game?service=match3${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`),
  verifyAdvert: body => request('/api/fo-game?service=adverts', body),
}
