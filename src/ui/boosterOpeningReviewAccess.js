const DEVELOPMENT_HOSTS = new Set(['localhost', '127.0.0.1', 'dev.flipout.gizmogames.uk'])

export function isBoosterOpeningReviewRequest(location = globalThis.location, developmentBuild = import.meta.env.DEV) {
  if (!location) return false
  const requested = new URLSearchParams(location.search).get('dev') === 'booster-opening'
  return requested && (developmentBuild || DEVELOPMENT_HOSTS.has(location.hostname))
}
