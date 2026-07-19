import crypto from 'node:crypto'

const providers = new Map()

export function registerAdvertProvider(name, verifier) { providers.set(name, verifier) }

export async function verifyAdvertCompletion({ provider, receipt, placement, playerId, matchId }) {
  const verifier = providers.get(provider)
  if (!verifier) throw Object.assign(new Error('Rewarded advert provider is not configured'), { status: 503, code: 'ADVERT_PROVIDER_UNAVAILABLE' })
  const verified = await verifier({ receipt, placement, playerId, matchId })
  if (!verified?.valid) throw Object.assign(new Error('Advert completion could not be verified'), { status: 403, code: 'ADVERT_NOT_VERIFIED' })
  return { receiptHash: crypto.createHash('sha256').update(String(receipt)).digest('hex'), providerReference: verified.reference ?? null }
}
