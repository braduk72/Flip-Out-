// Avatars — names are assigned separately from the pool below
const STANDARD_AVATARS = [
  { id: 'rob1', image: '/images/randomOppos/rob1.webp', defeatedImage: '/images/randomOppos/rob1d.webp' },
  { id: 'rob2', image: '/images/randomOppos/rob2.webp', defeatedImage: '/images/randomOppos/rob2d.webp' },
  { id: 'rob3', image: '/images/randomOppos/rob3.webp', defeatedImage: '/images/randomOppos/rob3d.webp' },
  { id: 'rob4', image: '/images/randomOppos/rob4.webp', defeatedImage: '/images/randomOppos/rob4d.webp' },
  { id: 'rob5', image: '/images/randomOppos/rob5.webp', defeatedImage: '/images/randomOppos/rob5d.webp' },
]

const VS_NAMES = [
  'ACE',    'APEX',   'ARCS',   'AXLE',   'BEAK',   'BLINK',  'BLITZ',  'BLOX',
  'BOLT',   'BRAK',   'BRAT',   'BRIX',   'BUNK',   'BYTE',   'CLAW',   'CLANK',
  'CLOD',   'COIL',   'COLT',   'CRAW',   'CRUD',   'CRUX',   'DAZE',   'DENT',
  'DOLT',   'DREX',   'DRIX',   'DUNK',   'DUSK',   'EDGE',   'ETCH',   'EXON',
  'FERR',   'FINK',   'FIZZ',   'FLAW',   'FLUX',   'FRAG',   'FUSE',   'GLITCH',
  'GLOB',   'GLOM',   'GRIT',   'GROD',   'GRUB',   'GUNK',   'HAZE',   'HIVE',
  'HOLT',   'HULK',   'HUSK',   'IRIX',   'JAWS',   'JINK',   'JOLT',   'KINK',
  'KLUNK',  'KNUX',   'KRAK',   'KRIX',   'KRON',   'KRUX',   'LUNK',   'LURK',
  'MAZE',   'MECH',   'MINT',   'MOLD',   'NEON',   'NEXO',   'NOID',   'NORK',
  'NOVA',   'NULL',   'NUKE',   'OREX',   'OTTO',   'PAWN',   'PIKE',   'PLAX',
  'PLEX',   'PRAG',   'PROX',   'QUIX',   'RACK',   'RAZE',   'REKT',   'RIFT',
  'SLAB',   'SKID',   'SLAG',   'SLAX',   'SNAP',   'SPARKS', 'SPEX',   'STING',
  'TACK',   'THUD',   'TORP',   'TRIX',   'TUNK',   'TURK',   'UNIT',   'VANE',
  'VRAK',   'VOID',   'WARP',   'WATT',   'WELD',   'WHIP',   'WREN',   'XERO',
  'ZING',   'ZINK',   'ZIPPY',  'ZORK',   'ZERO',   'ZOOM',   'ZETA',   'ZEUS',
]

// Pick a random avatar + a random name independently each call
export function pickStdOpponent() {
  const avatar = STANDARD_AVATARS[Math.floor(Math.random() * STANDARD_AVATARS.length)]
  const name   = VS_NAMES[Math.floor(Math.random() * VS_NAMES.length)]
  return { ...avatar, name }
}

// Keep as a plain array for any code that still needs it (Gauntlet etc.)
export const STANDARD_OPPONENTS = STANDARD_AVATARS.map((a, i) =>
  ({ ...a, name: VS_NAMES[i] })
)

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
    defeatedImage: '/images/Opponants/l1d.webp',
    difficulty: 'Lethal',
    tier: 'Lethal',
    label: 'FINAL BOSS',
    name: 'PROFESSOR CLAW',
    model: 'Unknown. Self-built.',
    bio: 'The architect of the Gauntlet. Built every opponent you just defeated. Has been watching your every move. Does not lose.',
    isBoss: true,
  },
]
