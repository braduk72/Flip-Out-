export const MATCH3_TOKEN_CROPS = Object.freeze([
  {
    id: 'sun',
    label: 'Golden Retriever',
    sourceCardId: 'woof:1',
    sourceAsset: '/images/cards/woof/1.webp',
    focalPoint: { x: 0.493, y: 0.402 },
    zoom: 3.15,
    rotation: 0,
    accessibleLabel: 'Golden Retriever card portrait',
    fallbackAsset: '/images/back.webp',
    asset: '/ui/match3/card-tokens/golden-retriever.webp',
    accent: '#ffb629',
    review: {
      status: 'approved',
      notes: 'Front-facing golden face, dark eyes and nose remain legible at 32 px.',
      flags: [],
    },
  },
  {
    id: 'moon',
    label: 'Maine Coon',
    sourceCardId: 'cats:1',
    sourceAsset: '/images/cards/cats2/1.webp',
    focalPoint: { x: 0.56, y: 0.27 },
    zoom: 3.2,
    rotation: 0,
    accessibleLabel: 'Maine Coon card portrait',
    fallbackAsset: '/images/back.webp',
    asset: '/ui/match3/card-tokens/maine-coon.webp',
    accent: '#9672ff',
    review: {
      status: 'approved',
      notes: 'Tall ears, amber eyes and dark tabby mask form a distinct silhouette.',
      flags: [],
    },
  },
  {
    id: 'leaf',
    label: 'Tyrannosaurus rex',
    sourceCardId: 'mastersOfTheLostWorld:1',
    sourceAsset: '/images/cards/mastersOfTheLostWorld/1.webp',
    focalPoint: { x: 0.57, y: 0.29 },
    zoom: 2.98,
    rotation: 0,
    accessibleLabel: 'Roaring Tyrannosaurus rex card portrait',
    fallbackAsset: '/images/back.webp',
    asset: '/ui/match3/card-tokens/tyrannosaurus-rex.webp',
    accent: '#4ee09b',
    review: {
      status: 'approved',
      notes: 'Open jaw, eye and teeth dominate the crop without including card text.',
      flags: [],
    },
  },
  {
    id: 'drop',
    label: 'Saturn V',
    sourceCardId: 'conquestOfSpace:5',
    sourceAsset: '/images/cards/conquestOfSpace/5.webp',
    focalPoint: { x: 0.53, y: 0.37 },
    zoom: 1.6,
    rotation: 0,
    accessibleLabel: 'Saturn V rocket card crop',
    fallbackAsset: '/images/back.webp',
    asset: '/ui/match3/card-tokens/saturn-v.webp',
    accent: '#35c8ff',
    review: {
      status: 'approved',
      notes: 'Bright vertical rocket and orange exhaust read clearly against blue sky.',
      flags: [],
    },
  },
  {
    id: 'star',
    label: 'Strawberry',
    sourceCardId: 'fruits:2',
    sourceAsset: '/images/cards/fruits/2.webp',
    focalPoint: { x: 0.5, y: 0.49 },
    zoom: 1.35,
    rotation: 0,
    accessibleLabel: 'Red strawberry card crop',
    fallbackAsset: '/images/back.webp',
    asset: '/ui/match3/card-tokens/strawberry.webp',
    accent: '#ff4f7b',
    review: {
      status: 'approved',
      notes: 'Single saturated red fruit with a simple green crown and pale backdrop.',
      flags: [],
    },
  },
  {
    id: 'gem',
    label: 'Bald Eagle',
    sourceCardId: 'birdsOfPrey:1',
    sourceAsset: '/images/cards/birdsOfPrey/1.webp',
    focalPoint: { x: 0.5, y: 0.31 },
    zoom: 2.4,
    rotation: 0,
    accessibleLabel: 'Bald eagle head card portrait',
    fallbackAsset: '/images/back.webp',
    asset: '/ui/match3/card-tokens/bald-eagle.webp',
    accent: '#f4f7ff',
    review: {
      status: 'approved',
      notes: 'White head and yellow beak create the highest-contrast board silhouette.',
      flags: [],
    },
  },
])

export const MATCH3_TOKEN_BY_ID = new Map(MATCH3_TOKEN_CROPS.map(token => [token.id, token]))

export function validateMatch3TokenCrops(tokens = MATCH3_TOKEN_CROPS) {
  const errors = []
  const ids = new Set()
  const cardIds = new Set()
  const assets = new Set()

  for (const token of tokens) {
    if (!token.id || ids.has(token.id)) errors.push(`Invalid or duplicate token id: ${token.id}`)
    if (!token.sourceCardId || cardIds.has(token.sourceCardId)) errors.push(`Invalid or duplicate source card: ${token.sourceCardId}`)
    if (!token.asset || assets.has(token.asset)) errors.push(`Invalid or duplicate generated asset: ${token.asset}`)
    ids.add(token.id)
    cardIds.add(token.sourceCardId)
    assets.add(token.asset)

    if (!token.sourceAsset?.startsWith('/images/cards/')) errors.push(`Invalid source asset for ${token.id}`)
    if (!token.fallbackAsset?.startsWith('/')) errors.push(`Invalid fallback asset for ${token.id}`)
    if (!token.accessibleLabel?.trim()) errors.push(`Missing accessible label for ${token.id}`)
    if (!(token.focalPoint?.x > 0 && token.focalPoint.x < 1 && token.focalPoint?.y > 0 && token.focalPoint.y < 1)) errors.push(`Invalid focal point for ${token.id}`)
    if (!(token.zoom >= 1) || !Number.isFinite(token.rotation)) errors.push(`Invalid transform for ${token.id}`)
    if (!['approved', 'flagged', 'rejected'].includes(token.review?.status)) errors.push(`Invalid review status for ${token.id}`)
    if (!Array.isArray(token.review?.flags)) errors.push(`Missing review flags for ${token.id}`)
  }

  return errors
}
