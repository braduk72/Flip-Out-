export const MATCH3_TOKENS = Object.freeze([
  { id: 'sun', label: 'Sun', symbol: '●', pattern: 'solid' },
  { id: 'moon', label: 'Moon', symbol: '◆', pattern: 'diamond' },
  { id: 'leaf', label: 'Leaf', symbol: '▲', pattern: 'stripe' },
  { id: 'drop', label: 'Water drop', symbol: '▼', pattern: 'dots' },
  { id: 'star', label: 'Star', symbol: '★', pattern: 'star' },
  { id: 'gem', label: 'Gem', symbol: '⬟', pattern: 'grid' },
])

export const PROVISIONAL_LEVEL_BANDS=Object.freeze({1:'Tutorial',2:'Tutorial',3:'Tutorial',4:'Easy',5:'Easy',6:'Easy',7:'Easy',8:'Medium',9:'Medium',10:'Medium',11:'Medium',12:'Medium',13:'Medium',14:'Hard',15:'Hard',16:'Hard',17:'Hard',18:'Hard',19:'Hard',20:'Showcase'})
const level = (id, moves, objectives, extras = {}) => ({ id, name: `Level ${id}`, rows: 8, cols: 8, moves, objectives, provisionalBand:PROVISIONAL_LEVEL_BANDS[id], ...extras })
export const MATCH3_LEVELS = Object.freeze([
  level(1, 18, [{ type: 'score', target: 1500 }], { teaching: 'Make matches of three.' }),
  level(2, 20, [{ type: 'collect', token: 'sun', target: 12 }], { teaching: 'Collect Sun tokens.' }),
  level(3, 19, [{ type: 'collect', token: 'moon', target: 10 }, { type: 'score', target: 1000 }]),
  level(4, 14, [{ type: 'blockers', target: 6 }], { blockers: [{ type: 'crate', layer: 1, cells: [[2,2],[2,5],[4,2],[4,5],[6,2],[6,5]] }] }),
  level(5, 18, [{ type: 'blockers', target: 8 }], { blockers: [{ type: 'ice', layer: 1, cells: [[1,2],[1,5],[3,2],[3,5],[5,2],[5,5],[6,3],[6,4]] }] }),
  level(6, 22, [{ type: 'score', target: 3500 }], { teaching: 'Match four to create a line clearer.' }),
  level(7, 23, [{ type: 'collect', token: 'leaf', target: 22 }], { blockers: [{ type: 'chain', layer: 1, cells: [[2,3],[2,4],[5,3],[5,4]] }] }),
  level(8, 14, [{ type: 'blockers', target: 12 }], { blockers: [{ type: 'crate', layer: 2, cells: [[2,2],[2,5],[5,2],[5,5],[3,3],[3,4]] }] }),
  level(9, 28, [{ type: 'drops', target: 2 }], { drops: [[0,2],[0,5]], holes: [[7,0],[7,1],[7,3],[7,4],[7,6],[7,7]] }),
  level(10, 22, [{ type: 'score', target: 6000 }], { teaching: 'Match five to create a colour clearer.' }),
  level(11, 20, [{ type: 'blockers', target: 14 }, { type: 'collect', token: 'drop', target: 12 }], { blockers: [{ type: 'ice', layer: 1, cells: [[1,1],[1,2],[1,5],[1,6],[3,1],[3,6],[5,1],[5,2],[5,5],[5,6],[6,3],[6,4],[4,3],[4,4]] }] }),
  level(12, 30, [{ type: 'drops', target: 3 }], { drops: [[0,1],[0,3],[0,6]], holes: [[7,0],[7,2],[7,4],[7,5],[7,7]] }),
  level(13, 23, [{ type: 'score', target: 7000 }], { teaching: 'T and L matches create area bombs.' }),
  level(14, 16, [{ type: 'blockers', target: 18 }], { blockers: [{ type: 'crate', layer: 2, cells: [[2,1],[2,3],[2,4],[2,6],[4,1],[4,3],[4,4],[4,6],[6,1]] }] }),
  level(15, 16, [{ type: 'collect', token: 'star', target: 18 }, { type: 'score', target: 2600 }], { holes: [[0,0],[0,7],[7,0],[7,7]] }),
  level(16, 32, [{ type: 'drops', target: 3 }, { type: 'blockers', target: 8 }], { drops: [[0,1],[0,4],[0,6]], blockers: [{ type: 'chain', layer: 1, cells: [[2,1],[2,4],[2,6],[4,1],[4,4],[4,6],[6,2],[6,5]] }] }),
  level(17, 25, [{ type: 'collect', token: 'gem', target: 30 }], { blockers: [{ type: 'ice', layer: 1, cells: [[2,2],[2,3],[2,4],[2,5],[5,2],[5,3],[5,4],[5,5]] }] }),
  level(18, 18, [{ type: 'blockers', target: 20 }, { type: 'score', target: 3200 }], { blockers: [{ type: 'crate', layer: 2, cells: [[1,1],[1,3],[1,4],[1,6],[3,1],[3,6],[5,1],[5,3],[5,4],[5,6]] }] }),
  level(19, 34, [{ type: 'drops', target: 4 }, { type: 'collect', token: 'moon', target: 16 }], { drops: [[0,1],[0,3],[0,5],[0,7]], holes: [[7,0],[7,2],[7,4],[7,6]] }),
  level(20, 34, [{ type: 'score', target: 5000 }, { type: 'blockers', target: 24 }, { type: 'drops', target: 2 }], { drops: [[0,2],[0,5]], blockers: [{ type: 'crate', layer: 2, cells: [[1,1],[1,3],[1,4],[1,6],[3,1],[3,6],[5,1],[5,3],[5,4],[5,6],[6,2],[6,5]] }], holes: [[7,0],[7,1],[7,3],[7,4],[7,6],[7,7]], teaching: 'Final development showcase.' }),
])

export function validateMatch3Levels(levels = MATCH3_LEVELS) {
  const errors = []; const ids = new Set(); const tokenIds = new Set(MATCH3_TOKENS.map(t => t.id))
  for (const l of levels) {
    if (!Number.isInteger(l.id) || ids.has(l.id)) errors.push(`Invalid or duplicate level id ${l.id}`); ids.add(l.id)
    if (!(l.rows > 2 && l.cols > 2 && l.moves > 0)) errors.push(`Invalid dimensions or moves for level ${l.id}`)
    if (!Array.isArray(l.objectives) || !l.objectives.length) errors.push(`Level ${l.id} has no objectives`)
    for (const o of l.objectives ?? []) if (!['score','collect','blockers','drops'].includes(o.type) || !(o.target > 0) || (o.type === 'collect' && !tokenIds.has(o.token))) errors.push(`Invalid objective in level ${l.id}`)
    const cells = [...(l.holes ?? []), ...(l.drops ?? []), ...(l.blockers ?? []).flatMap(b => b.cells ?? [])]
    for (const [r,c] of cells) if (r < 0 || c < 0 || r >= l.rows || c >= l.cols) errors.push(`Out-of-range cell in level ${l.id}`)
  }
  return errors
}

export function getMatch3Level(id) { return MATCH3_LEVELS.find(level => level.id === Number(id)) }
