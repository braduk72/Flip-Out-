// Knockout Gauntlet opponent roster — in fight order.
// e = Easy tier, m = Medium tier, h = Hard tier, l = Lethal (boss only)
export const KNOCKOUT_OPPONENTS = [
  {
    id: 'e1', image: '/images/Opponants/e1.webp', defeatedImage: '/images/Opponants/e1d.webp', difficulty: 'Easy', tier: 'Easy', label: 'EASY',
    name: 'RUSTY', model: 'MX-1 Leisure Unit',
    bio: 'Decommissioned fairground droid repurposed for competitive play. Slow processor, sticky joints. Hasn\'t won a match in three years. Blames the weather.',
  },
  {
    id: 'e2', image: '/images/Opponants/e2.webp', defeatedImage: '/images/Opponants/e2d.webp', difficulty: 'Easy', tier: 'Easy', label: 'EASY',
    name: 'BEEP-3', model: 'Prototype Mk.II',
    bio: 'Assembled from spare parts by a bored engineer on a Friday afternoon. Thinks it\'s very clever. It is not.',
  },
  {
    id: 'e3', image: '/images/Opponants/e3.webp', defeatedImage: '/images/Opponants/e3d.webp', difficulty: 'Easy', tier: 'Easy', label: 'EASY',
    name: 'CLUNKO', model: 'Series 4 Recall Unit',
    bio: 'Originally recalled for "unpredictable spatial reasoning." Still competing on a technicality. Legal proceedings ongoing.',
  },
  {
    id: 'm1', image: '/images/Opponants/m1.webp', defeatedImage: '/images/Opponants/m1d.webp', difficulty: 'Medium', tier: 'Medium', label: 'MEDIUM',
    name: 'COGSWORTH', model: 'Tactical T-7',
    bio: 'Mid-range pattern processor with an inflated opinion of itself. Takes every game extremely personally. Has a therapist.',
  },
  {
    id: 'm2', image: '/images/Opponants/m2.webp', defeatedImage: '/images/Opponants/m2d.webp', difficulty: 'Medium', tier: 'Medium', label: 'MEDIUM',
    name: 'NINER', model: 'Model 9 Revised',
    bio: 'Spent six months memorising card patterns. Faster than it looks. Do not be fooled by the friendly LED smile.',
  },
  {
    id: 'm3', image: '/images/Opponants/m3.webp', defeatedImage: '/images/Opponants/m3d.webp', difficulty: 'Medium', tier: 'Medium', label: 'MEDIUM',
    name: 'AXIOM', model: 'Corporate Edition v2',
    bio: 'Upgraded twice. Slightly smug. Trained on 40,000 hours of match footage. Absolutely hates losing.',
  },
  {
    id: 'h1', image: '/images/Opponants/h1.webp', defeatedImage: '/images/Opponants/h1d.webp', difficulty: 'Hard', tier: 'Hard', label: 'HARD',
    name: 'PHANTOM', model: 'Mil-Spec X-9',
    bio: 'Military-grade pattern recognition. Zero mercy. Zero small talk. Classified win rate. Treats every match like a threat to national security.',
  },
  {
    id: 'h2', image: '/images/Opponants/h2.webp', defeatedImage: '/images/Opponants/h2d.webp', difficulty: 'Hard', tier: 'Hard', label: 'HARD',
    name: 'KRONOS', model: 'Temporal Series III',
    bio: 'Time-optimised decision engine. Calculates your next move before you do. Usually right. Finds human hesitation "fascinating."',
  },
  {
    id: 'h3', image: '/images/Opponants/h3.webp', defeatedImage: '/images/Opponants/h3d.webp', difficulty: 'Hard', tier: 'Hard', label: 'HARD',
    name: 'NEMESIS', model: 'Apex-Class Final Build',
    bio: 'One recorded loss. Against Professor Claw. During a power cut. Disputes the result to this day.',
  },
  {
    id: 'l1',
    image: '/images/Opponants/l1.webp',
    difficulty: 'Lethal',
    tier: 'Lethal',
    label: 'FINAL BOSS',
    name: 'PROFESSOR CLAW',
    model: 'Unknown. Self-built.',
    bio: 'The architect of the Gauntlet. Built every opponent you just defeated. Has been watching your every move. Does not lose.',
    isBoss: true,
  },
]
