import rewards from './_foRewards.js'
import adverts from './_foAdverts.js'
import actions from './_foActions.js'
import market from './_foMarket.js'
import cloud from './_foCloudSave.js'
import liveOps from './_foLiveOps.js'
import analytics from './_foDevAnalytics.js'
import matches from './_foMatches.js'
import match3 from './_foMatch3.js'
import devTools from './_foDevTools.js'
import seasons from './_foSeasons.js'

const SERVICES = { rewards, adverts, actions, market, cloud, 'live-ops': liveOps, analytics, matches, match3, seasons, 'dev-tools': devTools }

export default async function handler(req, res) {
  const service = String(req.query?.service ?? '')
  const selected = SERVICES[service]
  if (!selected) return res.status(404).json({ error: 'Unknown game service' })
  return selected(req, res)
}
