// cardStart: first numbered card image (1 if back is back.webp, 2 if back is 1.webp)
// cardCount: number of actual card face images
export const DECKS = [
  {
    id: 'babyAnimals',
    name: 'Baby Animals',
    emoji: '🐣',
    cardCount: 8,
    cardStart: 2,
    path: '/images/cards/babyAnimals',
    borderColor: '#FF8C00',
    free: false,
    coinPrice: 200,
  },
  {
    id: 'animalsOfAustralia',
    name: 'Animals of Australia',
    emoji: '🦘',
    cardCount: 8,
    cardStart: 2,
    path: '/images/cards/animalsOfAustralia',
    borderColor: '#2E8B57',
    free: false,
    coinPrice: 200,
  },
  {
    id: 'fruits',
    name: 'Fruits',
    emoji: '🥭',
    cardCount: 8,
    cardStart: 2,
    path: '/images/cards/fruits',
    borderColor: '#DAA520',
    free: false,
    coinPrice: 200,
  },
  {
    id: 'flowers',
    name: 'Flowers',
    emoji: '🌸',
    cardCount: 8,
    cardStart: 2,
    path: '/images/cards/flowers',
    borderColor: '#FF69B4',
    free: false,
    coinPrice: 200,
  },
  {
    id: 'sportscars',
    name: 'Super Cars',
    emoji: '🏎️',
    cardCount: 8,
    cardStart: 2,
    path: '/images/cards/sportscars',
    borderColor: '#DC143C',
    free: true,
  },
  {
    id: 'birdsOfPrey',
    name: 'Birds of Prey',
    emoji: '🦅',
    cardCount: 24,
    cardStart: 1,
    backFile: 'back.webp',
    path: '/images/cards/birdsOfPrey',
    borderColor: '#8B4513',
    free: false,
  },
  {
    id: 'dogs',
    name: 'Dogs',
    emoji: '🐕',
    cardCount: 24,
    cardStart: 2,
    path: '/images/cards/dogs',
    borderColor: '#4169E1',
    free: false,
  },
  {
    id: 'cats',
    name: 'Cats',
    emoji: '🐈',
    cardCount: 24,
    cardStart: 2,
    path: '/images/cards/cats',
    borderColor: '#9370DB',
    free: false,
  },
  {
    id: 'KingsandQueens',
    name: 'Kings & Queens',
    emoji: '👑',
    cardCount: 19,
    cardStart: 1,
    backFile: 'back.webp',
    path: '/images/cards/KingsandQueens',
    borderColor: '#B8860B',
    free: false,
    cardNames: [
      'Henry II', 'Richard I', 'King John', 'Edward I', 'Edward III',
      'Henry V', 'Henry VIII', 'Elizabeth I', 'James I', 'Charles I',
      'Charles II', 'William III', 'Mary II', 'Queen Anne', 'George III',
      'Queen Victoria', 'Edward VII', 'George VI', 'Elizabeth II',
    ],
  },
  {
    id: 'WorldLandmarks',
    name: 'World Landmarks',
    emoji: '🗺️',
    cardCount: 24,
    cardStart: 1,
    backFile: 'back.webp',
    path: '/images/cards/WorldLandmarks',
    borderColor: '#1E90FF',
    free: true,
  },
]

export function getDeckBackImage(deck) {
  return deck.backFile
    ? `${deck.path}/${deck.backFile}`
    : `${deck.path}/1.webp`
}

export function getDeckImages(deck, count) {
  const start = deck.cardStart ?? 1
  const indices = Array.from({ length: deck.cardCount }, (_, i) => i + start)
  const shuffled = indices.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(i => ({
    image: `${deck.path}/${i}.webp`,
    name: deck.cardNames ? deck.cardNames[i - start] : null,
  }))
}
