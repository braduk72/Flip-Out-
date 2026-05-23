// Seasonal bad guys — one season at a time.
// Each stage is 30 steps. Steps 0–28 = generic challenger. Step 29 = boss.
// Swap this file each season; archive the old one.

export const STEPS_PER_STAGE = 30
export const BOSS_STEP       = 29   // 0-indexed; the 30th and final step

// Generic challenger for non-boss steps — Brad will supply real image/name
export const GENERIC_OPPONENT = {
  id:         'generic',
  name:       'CHALLENGER',
  image:      null,   // no character card shown
  isBoss:     false,
}

export const SEASON_1 = {
  id:    'season_1',
  name:  'Season 1',
  theme: 'The Reckoning',
  active: true,

  opponents: [
    {
      id: 's1_c1',
      image: '/images/c1.webp',
      difficulty: 'Easy',
      tier: 'Seasonal',
      label: 'ROUND 1',
      name: 'VEXOR',
      model: 'Unknown Origin',
      bio: 'Appeared from nowhere at the start of the season. No record of previous matches. No record of anything. Smiles too much.',
    },
    {
      id: 's1_c2',
      image: '/images/c2.webp',
      difficulty: 'Medium',
      tier: 'Seasonal',
      label: 'ROUND 2',
      name: 'DREAD',
      model: 'Classified',
      bio: 'Vexor\'s partner. Quieter. More dangerous. Has not blinked once during any recorded match. Scientists are baffled.',
    },
    {
      id: 's1_c3',
      image: '/images/c3.webp',
      difficulty: 'Medium',
      tier: 'Seasonal',
      label: 'ROUND 3',
      name: 'MALIX',
      model: 'Self-Designated',
      bio: 'Considers itself the true architect of this season. Long memory. Personal grudges. Do not mention last season.',
    },
    {
      id: 's1_c4',
      image: '/images/c4.webp',
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
    image: '/images/Opponants/l1.webp',   // placeholder — swap for a dedicated seasonal boss image
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
