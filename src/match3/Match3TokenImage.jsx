import { MATCH3_TOKEN_BY_ID } from './tokenCrops.js'

export default function Match3TokenImage({ tokenId, className, decorative = false, ...props }) {
  const token = MATCH3_TOKEN_BY_ID.get(tokenId)
  if (!token) return null

  function useFallback(event) {
    const image = event.currentTarget
    if (image.dataset.fallbackApplied === 'true') return
    image.dataset.fallbackApplied = 'true'
    image.src = token.fallbackAsset
  }

  return (
    <img
      {...props}
      src={token.asset}
      alt={decorative ? '' : token.accessibleLabel}
      aria-hidden={decorative ? 'true' : undefined}
      className={className}
      data-token-id={token.id}
      data-source-card-id={token.sourceCardId}
      draggable="false"
      onError={useFallback}
    />
  )
}
