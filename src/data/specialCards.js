export const SPECIAL_CARDS = {
  freeze: {
    id: 'freeze',
    name: 'FREEZE!',
    image: '/images/cards/special/freeze.png',
    description: 'Surrounding cards are frozen for a turn',
    color: '#00BFFF',
  },
  boom: {
    id: 'boom',
    name: 'BOOM!',
    image: '/images/cards/special/boom.png',
    description: 'Surrounding cards launch into the air, briefly revealing their faces',
    color: '#FF4500',
  },
  tornado: {
    id: 'tornado',
    name: 'TORNADO!',
    image: '/images/cards/special/tornado.png',
    description: 'A whirlwind sweeps the board, flipping cards face-up in its wake',
    color: '#00CED1',
  },
  magnet: {
    id: 'magnet',
    name: 'MAGNET!',
    image: '/images/cards/special/magnet.png',
    description: "Flip a card — its pair is magnetically pulled face-up",
    color: '#FF1493',
  },
  bolt: {
    id: 'bolt',
    name: 'BOLT!',
    image: '/images/cards/special/bolt.png',
    description: 'Lightning strikes your opponent — they lose their next turn',
    color: '#FFD700',
  },
  rocket: {
    id: 'rocket',
    name: 'ROCKET!',
    image: '/images/cards/special/rocket.png',
    description: 'A rocket fires along a random row or column, briefly revealing cards',
    color: '#FF6347',
  },
  dice: {
    id: 'dice',
    name: 'DICE!',
    image: '/images/cards/special/dice.png',
    description: 'Roll the dice — get a double and take an extra turn',
    color: '#32CD32',
  },
  shield: {
    id: 'shield',
    name: 'SHIELD!',
    image: '/images/cards/special/shield.png',
    description: 'Collected and held — blocks the next attack against you',
    color: '#4682B4',
  },
  stopwatch: {
    id: 'stopwatch',
    name: 'STOPWATCH!',
    image: '/images/cards/special/stopwatch.png',
    description: '10-second frenzy — flip as many pairs as you can!',
    color: '#FF8C00',
  },
  crown: {
    id: 'crown',
    name: 'CROWN!',
    image: '/images/cards/special/crown.png',
    description: "Your opponent's next matched pair is added to YOUR score",
    color: '#FFD700',
  },
  random: {
    id: 'random',
    name: 'RANDOM!',
    image: '/images/cards/special/random.png',
    description: 'Spin the wheel — lands on a random power and fires it',
    color: '#DA70D6',
  },
  star: {
    id: 'star',
    name: 'STAR!',
    image: '/images/cards/special/star.png',
    description: 'Flip this card plus 3 more this turn',
    color: '#FFD700',
  },
  // Legacy specials (from original game)
  shuffle: {
    id: 'shuffle',
    name: 'SHUFFLE!',
    image: '/images/cards/special/shuffle.png',
    description: 'All unmatched cards are shuffled to new positions',
    color: '#9370DB',
  },
  xray: {
    id: 'xray',
    name: 'X-RAY!',
    image: '/images/cards/special/xray.png',
    description: 'Briefly reveals all cards on the board',
    color: '#00FA9A',
  },
}

// Pool used when randomly selecting specials for a game
export const SPECIAL_POOL = [
  'freeze', 'boom', 'tornado', 'magnet', 'bolt',
  'rocket', 'dice', 'shield', 'stopwatch', 'crown',
  'random', 'shuffle', 'xray',
]

export function pickRandomSpecials(count) {
  const shuffled = [...SPECIAL_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
