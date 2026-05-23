export const SPECIAL_CARDS = {
  freeze: {
    id: 'freeze',
    name: 'FREEZE!',
    image: '/images/cards/special/freeze.webp',
    description: 'Surrounding cards are frozen for a turn',
    color: '#00BFFF',
  },
  boom: {
    id: 'boom',
    name: 'BOOM!',
    image: '/images/cards/special/boom.webp',
    description: 'Surrounding cards launch into the air, briefly revealing their faces',
    color: '#FF4500',
  },
  tornado: {
    id: 'tornado',
    name: 'TORNADO!',
    image: '/images/cards/special/tornado.webp',
    description: 'A whirlwind sweeps the board, flipping cards face-up in its wake',
    color: '#00CED1',
  },
  magnet: {
    id: 'magnet',
    name: 'MAGNET!',
    image: '/images/cards/special/magnet.webp',
    description: "Flip a card — its pair is magnetically pulled face-up",
    color: '#FF1493',
  },
  bolt: {
    id: 'bolt',
    name: 'BOLT!',
    image: '/images/cards/special/bolt.webp',
    description: 'Lightning strikes your opponent — they lose their next turn',
    color: '#FFD700',
  },
  rocket: {
    id: 'rocket',
    name: 'ROCKET!',
    image: '/images/cards/special/rocket.webp',
    description: 'A rocket fires along a random row or column, briefly revealing cards',
    color: '#FF6347',
  },
  dice: {
    id: 'dice',
    name: 'DICE!',
    image: '/images/cards/special/dice.webp',
    description: 'Roll the dice — get a double and take an extra turn',
    color: '#32CD32',
  },
  shield: {
    id: 'shield',
    name: 'SHIELD!',
    image: '/images/cards/special/shield.webp',
    description: 'Collected and held — blocks the next attack against you',
    color: '#4682B4',
  },
  stopwatch: {
    id: 'stopwatch',
    name: 'STOPWATCH!',
    image: '/images/cards/special/stopwatch.webp',
    description: '10-second frenzy — flip as many pairs as you can!',
    color: '#FF8C00',
  },
  crown: {
    id: 'crown',
    name: 'CROWN!',
    image: '/images/cards/special/crown.webp',
    description: "Your opponent's next matched pair is added to YOUR score",
    color: '#FFD700',
  },
  random: {
    id: 'random',
    name: 'RANDOM!',
    image: '/images/cards/special/random.webp',
    description: 'Spin the wheel — lands on a random power and fires it',
    color: '#DA70D6',
  },
  star: {
    id: 'star',
    name: 'STAR!',
    image: '/images/cards/special/star.webp',
    description: 'Flip this card plus 3 more this turn',
    color: '#FFD700',
  },
  // Synthetic effect entries (not real cards — used for UI banners only)
  bolt_blocked: {
    id: 'bolt_blocked',
    name: '🛡️ SHIELD BLOCKED IT!',
    image: '/images/cards/special/shield.webp',
    description: 'The bolt was deflected — shield consumed',
    color: '#4682B4',
  },
  // Legacy specials (from original game)
  shuffle: {
    id: 'shuffle',
    name: 'SHUFFLE!',
    image: '/images/cards/special/shuffle.webp',
    description: 'All unmatched cards are shuffled to new positions',
    color: '#9370DB',
  },
  xray: {
    id: 'xray',
    name: 'X-RAY!',
    image: '/images/cards/special/xray.webp',
    description: 'Tap up to 2 cards to secretly peek at their faces — then take your turn',
    color: '#00FA9A',
  },
}

// Pool used when randomly selecting specials for a game.
// 'shuffle' is intentionally excluded — it wipes all card memory and is
// too disruptive as a common random draw. It can still appear via dev tools.
export const SPECIAL_POOL = [
  'freeze', 'boom', 'tornado', 'magnet', 'bolt',
  'rocket', 'dice', 'shield', 'stopwatch', 'crown',
  'random', 'xray',
]

export function pickRandomSpecials(count) {
  const shuffled = [...SPECIAL_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
