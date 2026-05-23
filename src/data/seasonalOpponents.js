// Seasonal bad guys — one season at a time.
// Beat all four to face the Seasonal Boss and earn the gold collector card.
// Swap this file each season; archive the old one.

export const SEASON_1 = {
  id:    'season_1',
  name:  'Season 1',
  theme: 'The Reckoning',
  active: true,

  opponents: [
    {
      id: 's1_c1',
      image: '/images/c1.png',
      difficulty: 'Easy',
      tier: 'Seasonal',
      label: 'ROUND 1',
      name: 'VEXOR',
      model: 'Unknown Origin',
      bio: 'Appeared from nowhere at the start of the season. No record of previous matches. No record of anything. Smiles too much.',
    },
    {
      id: 's1_c2',
      image: '/images/c2.png',
      difficulty: 'Medium',
      tier: 'Seasonal',
      label: 'ROUND 2',
      name: 'DREAD',
      model: 'Classified',
      bio: 'Vexor\'s partner. Quieter. More dangerous. Has not blinked once during any recorded match. Scientists are baffled.',
    },
    {
      id: 's1_c3',
      image: '/images/c3.png',
      difficulty: 'Medium',
      tier: 'Seasonal',
      label: 'ROUND 3',
      name: 'MALIX',
      model: 'Self-Designated',
      bio: 'Considers itself the true architect of this season. Long memory. Personal grudges. Do not mention last season.',
    },
    {
      id: 's1_c4',
      image: '/images/c4.png',
      difficulty: 'Hard',
      tier: 'Seasonal',
      label: 'ROUND 4',
      name: 'OBLIQUE',
      model: 'Prototype — Final Stage',
      bio: 'The last line before the boss. Unpredictable. Adapts mid-game. Beaten only three times this season. You won\'t be the fourth.',
    },
  ],

  // Seasonal boss — swap image + details each season
  boss: {
    id: 's1_boss',
    image: '/images/Opponants/l1.png',   // placeholder — swap for a dedicated seasonal boss image
    difficulty: 'Lethal',
    tier: 'SeasonBoss',
    label: 'SEASONAL BOSS',
    name: 'THE ARCHITECT',
    model: 'Season 1 Final',
    bio: 'They set the board. They chose the opponents. They have been waiting for you since the season began. The gold card is theirs — until now.',
    isBoss: true,
    rewardKey: 'fo_season1_gold_card',
    rewardLabel: 'Season 1 Champion',
  },
}

// Convenience export — always points at the active season
export const ACTIVE_SEASON = SEASON_1
