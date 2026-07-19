import { playerGameApi } from './gameApi.js'
import { currentPlayerId } from './platformIdentity.js'

const SAVE_VERSION = 1
const CACHE_PREFIX = 'fo_cloud_cache:'
const PROGRESSION_KEYS = ['fo_gauntlet_step', 'fo_season1_step', 'fo_streak_best', 'fo_pvp_wins']
const SETTING_KEYS = ['fo_portrait', 'fo_difficulty', 'fo_music', 'fo_sfx', 'fo_music_vol', 'fo_sfx_vol']

function capture(keys) { return Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null)) }
function apply(values = {}) { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, String(value)) }
export function captureCloudState() { return { progression: capture(PROGRESSION_KEYS), settings: capture(SETTING_KEYS), gameplayStats: {} } }

export async function syncCloudSave() {
  const playerId = currentPlayerId()
  if (!playerId) throw new Error('Player identity is unavailable')
  const cacheKey = `${CACHE_PREFIX}${playerId}`
  const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null')
  const { cloud } = await playerGameApi.cloud()
  if (cloud && (!cached || Number(cloud.revision) >= Number(cached.revision ?? 0))) {
    apply(cloud.state?.progression); apply(cloud.state?.settings)
    localStorage.setItem(cacheKey, JSON.stringify(cloud))
    return { action: 'download', cloud }
  }
  const result = await playerGameApi.saveCloud({ state: captureCloudState(), saveVersion: SAVE_VERSION, expectedRevision: Number(cloud?.revision ?? 0) })
  localStorage.setItem(cacheKey, JSON.stringify(result.cloud))
  return { action: 'upload', cloud: result.cloud }
}
