import { MATCH3_TOKENS } from './levels.js'

export const MATCH3_RULES = Object.freeze({
  squareMatches: true,
  cascadeLimit: 50,
  baseTileScore: 50,
  cascadeMultiplierStep: 0.5,
})

export function seededRandom(seed = 1) {
  let value = Number(seed) >>> 0 || 1
  return () => ((value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296)
}

const key = (row, column) => `${row}:${column}`
const clone = value => structuredClone(value)
const adjacent = (first, second) => Math.abs(first.r - second.r) + Math.abs(first.c - second.c) === 1
const usable = cell => cell && !cell.hole
const normalSpecial = type => type === 'bomb' ? 'wrapped' : type
const movable = cell => usable(cell) && !cell.chain && !cell.crate && cell.token && !cell.drop
const positionExists = (board, position) => usable(board[position.r]?.[position.c])

function matchToken(cell) {
  if (!usable(cell) || cell.crate || cell.drop || normalSpecial(cell.special) === 'color') return null
  return cell.token ?? null
}

function lineRuns(board) {
  const found = []
  const rows = board.length
  const columns = board[0].length

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns;) {
      const token = matchToken(board[row][column])
      let end = column + 1
      while (token && end < columns && matchToken(board[row][end]) === token) end += 1
      if (token && end - column >= 3) {
        found.push({ token, direction: 'horizontal', cells: Array.from({ length: end - column }, (_, index) => ({ r: row, c: column + index })) })
      }
      column = end
    }
  }

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows;) {
      const token = matchToken(board[row][column])
      let end = row + 1
      while (token && end < rows && matchToken(board[end][column]) === token) end += 1
      if (token && end - row >= 3) {
        found.push({ token, direction: 'vertical', cells: Array.from({ length: end - row }, (_, index) => ({ r: row + index, c: column })) })
      }
      row = end
    }
  }

  return found
}

function squareMatches(board) {
  if (!MATCH3_RULES.squareMatches) return []
  const found = []
  for (let row = 0; row < board.length - 1; row += 1) {
    for (let column = 0; column < board[0].length - 1; column += 1) {
      const token = matchToken(board[row][column])
      if (!token) continue
      const cells = [{ r: row, c: column }, { r: row, c: column + 1 }, { r: row + 1, c: column }, { r: row + 1, c: column + 1 }]
      if (cells.every(position => matchToken(board[position.r][position.c]) === token)) found.push({ token, cells })
    }
  }
  return found
}

function armLengths(board, position, token) {
  const count = (rowStep, columnStep) => {
    let total = 0
    let row = position.r + rowStep
    let column = position.c + columnStep
    while (board[row]?.[column] && matchToken(board[row][column]) === token) {
      total += 1
      row += rowStep
      column += columnStep
    }
    return total
  }
  return { left: count(0, -1), right: count(0, 1), up: count(-1, 0), down: count(1, 0) }
}

function intersectionType(arms) {
  const horizontalBoth = arms.left > 0 && arms.right > 0
  const verticalBoth = arms.up > 0 && arms.down > 0
  if (horizontalBoth && verticalBoth) return 'cross'
  if ((horizontalBoth && (arms.up > 0 || arms.down > 0)) || (verticalBoth && (arms.left > 0 || arms.right > 0))) return 't'
  return 'l'
}

export function findMatches(board) {
  const lines = lineRuns(board)
  const squares = squareMatches(board)
  const cells = new Map()

  for (const group of lines) {
    for (const position of group.cells) {
      const id = key(position.r, position.c)
      const previous = cells.get(id) ?? { ...position, token: group.token, horizontal: 0, vertical: 0, square: false }
      previous[group.direction] = Math.max(previous[group.direction], group.cells.length)
      cells.set(id, previous)
    }
  }

  for (const group of squares) {
    for (const position of group.cells) {
      const id = key(position.r, position.c)
      const previous = cells.get(id) ?? { ...position, token: group.token, horizontal: 0, vertical: 0, square: false }
      previous.square = true
      cells.set(id, previous)
    }
  }

  const patterns = []
  for (const group of lines) {
    if (group.cells.length >= 5) patterns.push({ type: 'five', token: group.token, direction: group.direction, cells: group.cells, anchor: group.cells[Math.floor(group.cells.length / 2)] })
    else if (group.cells.length === 4) patterns.push({ type: 'four', token: group.token, direction: group.direction, cells: group.cells, anchor: group.cells[1] })
  }

  for (const position of cells.values()) {
    if (position.horizontal < 3 || position.vertical < 3) continue
    const arms = armLengths(board, position, position.token)
    const related = lines.filter(group => group.token === position.token && group.cells.some(cell => cell.r === position.r && cell.c === position.c)).flatMap(group => group.cells)
    const unique = [...new Map(related.map(cell => [key(cell.r, cell.c), cell])).values()]
    patterns.push({ type: intersectionType(arms), token: position.token, cells: unique, anchor: { r: position.r, c: position.c } })
  }

  for (const square of squares) patterns.push({ type: 'square', token: square.token, cells: square.cells, anchor: square.cells[0] })

  return {
    groups: [...lines.map(group => group.cells), ...squares.map(group => group.cells)],
    lineGroups: lines,
    squareGroups: squares,
    patterns,
    cells: [...cells.values()],
  }
}

export function legalMoves(board) {
  const moves = []
  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[0].length; column += 1) {
      for (const destination of [{ r: row, c: column + 1 }, { r: row + 1, c: column }]) {
        if (destination.r >= board.length || destination.c >= board[0].length || !movable(board[row][column]) || !movable(board[destination.r][destination.c])) continue
        const hasSpecial = Boolean(board[row][column].special || board[destination.r][destination.c].special)
        ;[board[row][column], board[destination.r][destination.c]] = [board[destination.r][destination.c], board[row][column]]
        const valid = hasSpecial || findMatches(board).cells.length > 0
        ;[board[row][column], board[destination.r][destination.c]] = [board[destination.r][destination.c], board[row][column]]
        if (valid) moves.push({ from: { r: row, c: column }, to: destination })
      }
    }
  }
  return moves
}

function randomToken(random) {
  return MATCH3_TOKENS[Math.floor(random() * MATCH3_TOKENS.length)].id
}

function baseBoard(level, random) {
  const holes = new Set((level.holes ?? []).map(position => key(...position)))
  const board = Array.from({ length: level.rows }, (_, row) => Array.from({ length: level.cols }, (_, column) => holes.has(key(row, column))
    ? { hole: true }
    : { token: null, special: null, ice: 0, chain: 0, crate: 0, drop: false }))

  for (const blocker of level.blockers ?? []) for (const [row, column] of blocker.cells) board[row][column][blocker.type] = blocker.layer ?? 1
  for (const [row, column] of level.drops ?? []) board[row][column].drop = true

  for (let row = 0; row < level.rows; row += 1) {
    for (let column = 0; column < level.cols; column += 1) {
      if (!usable(board[row][column]) || board[row][column].drop || board[row][column].crate) continue
      let token
      do {
        token = randomToken(random)
        board[row][column].token = token
      } while ((column > 1 && matchToken(board[row][column - 1]) === token && matchToken(board[row][column - 2]) === token)
        || (row > 1 && matchToken(board[row - 1][column]) === token && matchToken(board[row - 2][column]) === token))
    }
  }
  return board
}

export function generateBoard(level, seed = 1) {
  const random = seededRandom(seed)
  for (let attempt = 0; attempt < 150; attempt += 1) {
    const board = baseBoard(level, random)
    if (!findMatches(board).cells.length && legalMoves(board).length) return board
  }
  throw new Error('Unable to create playable board')
}

function patternPriority(type) {
  if (type === 'five') return 4
  if (['t', 'l', 'cross'].includes(type)) return 3
  if (type === 'square') return 2
  if (type === 'four') return 1
  return 0
}

function specialForPattern(pattern) {
  if (pattern.type === 'five') return 'color'
  if (['t', 'l', 'cross', 'square'].includes(pattern.type)) return 'wrapped'
  if (pattern.type === 'four') return pattern.direction === 'horizontal' ? 'row' : 'col'
  return null
}

function chooseSpecials(board, matches, preferred) {
  const usedAnchors = new Set()
  const consumedMatchCells = new Set()
  const ordered = [...matches.patterns].sort((first, second) => {
    const firstPreferred = first.cells.some(cell => cell.r === preferred?.r && cell.c === preferred?.c) ? 1 : 0
    const secondPreferred = second.cells.some(cell => cell.r === preferred?.r && cell.c === preferred?.c) ? 1 : 0
    return patternPriority(second.type) - patternPriority(first.type) || secondPreferred - firstPreferred
  })
  const specials = []

  for (const pattern of ordered) {
    if (!specialForPattern(pattern) || pattern.cells.some(cell => consumedMatchCells.has(key(cell.r, cell.c)))) continue
    const preferredInPattern = pattern.cells.some(cell => cell.r === preferred?.r && cell.c === preferred?.c)
    const candidates = ['t', 'l', 'cross'].includes(pattern.type)
      ? [pattern.anchor, preferredInPattern ? preferred : null, ...pattern.cells]
      : [preferredInPattern ? preferred : null, pattern.anchor, ...pattern.cells]
    const anchor = candidates.find(candidate => candidate && !usedAnchors.has(key(candidate.r, candidate.c)) && !board[candidate.r]?.[candidate.c]?.special)
    if (!anchor) continue
    const type = specialForPattern(pattern)
    specials.push({ at: { r: anchor.r, c: anchor.c }, type, reason: pattern.type, token: pattern.token })
    usedAnchors.add(key(anchor.r, anchor.c))
    for (const cell of pattern.cells) consumedMatchCells.add(key(cell.r, cell.c))
  }

  return specials
}

function positionsInRows(board, rows) {
  return [...rows].flatMap(row => board[row]?.map((_, column) => ({ r: row, c: column })) ?? [])
}

function positionsInColumns(board, columns) {
  return [...columns].flatMap(column => board.map((_, row) => ({ r: row, c: column })))
}

function positionsInRadius(board, center, radius) {
  const positions = []
  for (let row = center.r - radius; row <= center.r + radius; row += 1) {
    for (let column = center.c - radius; column <= center.c + radius; column += 1) {
      if (board[row]?.[column]) positions.push({ r: row, c: column })
    }
  }
  return positions
}

function mostCommonToken(board) {
  const counts = new Map()
  for (const row of board) for (const cell of row) if (matchToken(cell)) counts.set(cell.token, (counts.get(cell.token) ?? 0) + 1)
  return [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))[0]?.[0] ?? null
}

function specialCells(board, position, triggerColor) {
  const cell = board[position.r]?.[position.c]
  const type = normalSpecial(cell?.special)
  if (type === 'row') return board[position.r].map((_, column) => ({ r: position.r, c: column }))
  if (type === 'col') return board.map((_, row) => ({ r: row, c: position.c }))
  if (type === 'wrapped') return positionsInRadius(board, position, 1)
  if (type === 'color') {
    const token = triggerColor ?? cell.token ?? mostCommonToken(board)
    const positions = [{ r: position.r, c: position.c }]
    if (token) for (let row = 0; row < board.length; row += 1) for (let column = 0; column < board[0].length; column += 1) if (matchToken(board[row][column]) === token) positions.push({ r: row, c: column })
    return positions
  }
  return [{ r: position.r, c: position.c }]
}

function damage(board, targets, progress) {
  const queue = targets.map(target => ({ ...target }))
  const seen = new Set()
  const clearedCells = []
  const triggeredSpecials = []
  const collected = {}
  let cleared = 0
  let blockerHits = 0

  while (queue.length) {
    const position = queue.pop()
    const id = key(position.r, position.c)
    if (seen.has(id) || !usable(board[position.r]?.[position.c])) continue
    seen.add(id)
    const cell = board[position.r][position.c]
    const special = normalSpecial(cell.special)

    if (special) {
      triggeredSpecials.push({ at: { r: position.r, c: position.c }, type: special, token: cell.token ?? null })
      queue.push(...specialCells(board, position, position.triggerColor))
    }

    if (cell.crate) {
      cell.crate -= 1
      progress.blockers += 1
      blockerHits += 1
      clearedCells.push({ r: position.r, c: position.c, kind: 'blocker' })
      continue
    }
    if (cell.ice) {
      cell.ice -= 1
      progress.blockers += 1
      blockerHits += 1
    }
    if (cell.chain) {
      cell.chain -= 1
      progress.blockers += 1
      blockerHits += 1
    }
    if (!cell.token) continue

    progress.collected[cell.token] = (progress.collected[cell.token] ?? 0) + 1
    collected[cell.token] = (collected[cell.token] ?? 0) + 1
    cleared += 1
    clearedCells.push({ r: position.r, c: position.c, kind: special ? 'special' : 'token', token: cell.token })
    cell.token = null
    cell.special = null
    for (const neighbour of [{ r: position.r - 1, c: position.c }, { r: position.r + 1, c: position.c }, { r: position.r, c: position.c - 1 }, { r: position.r, c: position.c + 1 }]) {
      if (board[neighbour.r]?.[neighbour.c]?.crate) queue.push(neighbour)
    }
  }

  return { affected: seen.size, blockerHits, cleared, clearedCells, triggeredSpecials, collected }
}

function gravity(board, random, progress) {
  const rows = board.length
  const columns = board[0].length
  for (let column = 0; column < columns; column += 1) {
    const slots = []
    for (let row = rows - 1; row >= 0; row -= 1) if (usable(board[row][column]) && !board[row][column].crate) slots.push(row)
    const values = []
    for (const row of slots) if (board[row][column].drop || board[row][column].token) values.push({ token: board[row][column].token, special: board[row][column].special, drop: board[row][column].drop })
    for (const row of slots) {
      const value = values.shift() ?? { token: randomToken(random), special: null, drop: false }
      board[row][column].token = value.token
      board[row][column].special = value.special
      board[row][column].drop = value.drop
    }
    const bottom = slots[0]
    if (bottom != null && board[bottom][column].drop) {
      board[bottom][column].drop = false
      board[bottom][column].token = randomToken(random)
      progress.drops += 1
    }
  }
}

function specialCreationBonus(type) {
  if (type === 'color') return 400
  if (type === 'wrapped') return 250
  return 150
}

function comboLabel(count) {
  if (count >= 6) return 'Unbelievable!'
  if (count === 5) return 'Spectacular!'
  if (count === 4) return 'Amazing!'
  if (count === 3) return 'Great combo!'
  if (count === 2) return 'Sweet cascade!'
  return 'Nice match!'
}

function normaliseState(state) {
  state.version = Math.max(Number(state.version ?? 1), 2)
  state.progress ??= { collected: {}, blockers: 0, drops: 0 }
  state.progress.collected ??= {}
  state.progress.blockers ??= 0
  state.progress.drops ??= 0
  state.analytics ??= []
  state.cascades ??= []
  state.combo ??= { count: 0, multiplier: 1, label: '', scoreGained: 0 }
  state.stats ??= { maxCombo: 0, specialsCreated: 0, specialsTriggered: 0 }
  return state
}

function finishResolution(state, cascades) {
  const count = cascades.length
  const multiplier = count ? 1 + ((count - 1) * MATCH3_RULES.cascadeMultiplierStep) : 1
  state.cascades = cascades
  state.combo = { count, multiplier, label: count ? comboLabel(count) : '', scoreGained: cascades.reduce((sum, cascade) => sum + cascade.scoreGain, 0) }
  state.stats.maxCombo = Math.max(state.stats.maxCombo, count)
  state.stats.specialsCreated += cascades.reduce((sum, cascade) => sum + cascade.createdSpecials.length, 0)
  state.stats.specialsTriggered += cascades.reduce((sum, cascade) => sum + cascade.triggeredSpecials.length, 0)
}

export function resolveBoard(state, preferred, options = {}) {
  const resolved = normaliseState(clone(state))
  const random = seededRandom(resolved.rngState++)
  const cascades = [...(options.initialCascades ?? [])]

  for (let iteration = 0; iteration < MATCH3_RULES.cascadeLimit; iteration += 1) {
    const matches = findMatches(resolved.board)
    if (!matches.cells.length) break
    const cascadeNumber = cascades.length + 1
    const multiplier = 1 + ((cascadeNumber - 1) * MATCH3_RULES.cascadeMultiplierStep)
    const createdSpecials = chooseSpecials(resolved.board, matches, iteration === 0 ? preferred : null)
    const result = damage(resolved.board, matches.cells.map(({ r, c }) => ({ r, c })), resolved.progress)

    for (const created of createdSpecials) {
      if (!positionExists(resolved.board, created.at) || resolved.board[created.at.r][created.at.c].crate) continue
      resolved.board[created.at.r][created.at.c].token = created.token
      resolved.board[created.at.r][created.at.c].special = created.type
    }

    const creationScore = createdSpecials.reduce((sum, special) => sum + specialCreationBonus(special.type), 0)
    const scoreGain = Math.round((result.cleared * MATCH3_RULES.baseTileScore * multiplier) + creationScore + (result.triggeredSpecials.length * 100))
    resolved.score += scoreGain
    gravity(resolved.board, random, resolved.progress)
    cascades.push({
      kind: 'match',
      cascade: cascadeNumber,
      multiplier,
      label: comboLabel(cascadeNumber),
      cleared: result.cleared,
      blockerHits: result.blockerHits,
      clearedCells: result.clearedCells,
      triggeredSpecials: result.triggeredSpecials,
      createdSpecials,
      patterns: [...new Set(matches.patterns.map(pattern => pattern.type))],
      scoreGain,
    })
  }

  if (cascades.length >= MATCH3_RULES.cascadeLimit && findMatches(resolved.board).cells.length) throw new Error('Cascade limit exceeded')
  if (!legalMoves(resolved.board).length) {
    resolved.board = shuffleBoard(resolved.board, resolved.rngState++)
    resolved.analytics.push({ type: 'dead-board-shuffle' })
  }
  finishResolution(resolved, cascades)
  updateStatus(resolved)
  return resolved
}

export function shuffleBoard(board, seed = 1) {
  const random = seededRandom(seed)
  const tokens = []
  for (const row of board) for (const cell of row) if (movable(cell)) tokens.push({ token: cell.token, special: cell.special })
  for (let attempt = 0; attempt < 150; attempt += 1) {
    const copy = clone(board)
    const pool = clone(tokens)
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1))
      ;[pool[index], pool[other]] = [pool[other], pool[index]]
    }
    let index = 0
    for (const row of copy) {
      for (const cell of row) {
        if (!movable(cell)) continue
        cell.token = pool[index].token
        cell.special = pool[index].special
        index += 1
      }
    }
    if (!findMatches(copy).cells.length && legalMoves(copy).length) return copy
  }
  throw new Error('Unable to shuffle dead board')
}

function allBoardCells(board) {
  const positions = []
  for (let row = 0; row < board.length; row += 1) for (let column = 0; column < board[0].length; column += 1) if (usable(board[row][column])) positions.push({ r: row, c: column })
  return positions
}

function directResolutionEvent(state, targets, random, details) {
  const result = damage(state.board, targets, state.progress)
  const scoreGain = Math.round((result.cleared * 60) + (result.triggeredSpecials.length * 125) + details.bonus)
  state.score += scoreGain
  gravity(state.board, random, state.progress)
  return {
    kind: details.kind,
    comboType: details.comboType,
    cascade: 1,
    multiplier: 1,
    label: details.label,
    cleared: result.cleared,
    blockerHits: result.blockerHits,
    clearedCells: result.clearedCells,
    triggeredSpecials: result.triggeredSpecials,
    createdSpecials: [],
    patterns: [],
    scoreGain,
  }
}

function convertColorTargets(board, color, specialType) {
  const positions = []
  let alternate = false
  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[0].length; column += 1) {
      const cell = board[row][column]
      if (matchToken(cell) !== color) continue
      let converted = normalSpecial(specialType)
      if (converted === 'row' || converted === 'col') {
        converted = alternate ? 'row' : 'col'
        alternate = !alternate
      }
      cell.special = converted
      positions.push({ r: row, c: column })
    }
  }
  return positions
}

function specialSwapEvent(state, from, to) {
  const random = seededRandom(state.rngState++)
  const firstPosition = to
  const secondPosition = from
  const firstCell = state.board[firstPosition.r][firstPosition.c]
  const secondCell = state.board[secondPosition.r][secondPosition.c]
  const firstType = normalSpecial(firstCell.special)
  const secondType = normalSpecial(secondCell.special)
  const center = to

  if (firstType === 'color' || secondType === 'color') {
    if (firstType === 'color' && secondType === 'color') return directResolutionEvent(state, allBoardCells(state.board), random, { kind: 'special-combination', comboType: 'color+color', label: 'Rainbow Nova!', bonus: 2000 })
    const colorPosition = firstType === 'color' ? firstPosition : secondPosition
    const otherPosition = firstType === 'color' ? secondPosition : firstPosition
    const otherCell = state.board[otherPosition.r][otherPosition.c]
    const otherType = normalSpecial(otherCell.special)
    const color = otherCell.token ?? mostCommonToken(state.board)
    if (otherType) {
      const converted = convertColorTargets(state.board, color, otherType)
      return directResolutionEvent(state, [...converted, { ...colorPosition, triggerColor: color }], random, {
        kind: 'special-combination',
        comboType: `color+${otherType}`,
        label: otherType === 'wrapped' ? 'Wrapped Rainbow!' : 'Striped Rainbow!',
        bonus: otherType === 'wrapped' ? 1600 : 1300,
      })
    }
    const targets = allBoardCells(state.board).filter(position => matchToken(state.board[position.r][position.c]) === color)
    targets.push({ ...colorPosition, triggerColor: color })
    return directResolutionEvent(state, targets, random, { kind: 'special-activation', comboType: 'color+token', label: 'Colour Sweep!', bonus: 700 })
  }

  if (firstType && secondType) {
    const firstWrapped = firstType === 'wrapped'
    const secondWrapped = secondType === 'wrapped'
    if (firstWrapped && secondWrapped) return directResolutionEvent(state, positionsInRadius(state.board, center, 2), random, { kind: 'special-combination', comboType: 'wrapped+wrapped', label: 'Mega Blast!', bonus: 1400 })
    if (firstWrapped || secondWrapped) {
      const rows = new Set([center.r - 1, center.r, center.r + 1].filter(row => row >= 0 && row < state.board.length))
      const columns = new Set([center.c - 1, center.c, center.c + 1].filter(column => column >= 0 && column < state.board[0].length))
      return directResolutionEvent(state, [...positionsInRows(state.board, rows), ...positionsInColumns(state.board, columns)], random, { kind: 'special-combination', comboType: 'line+wrapped', label: 'Triple Cross Blast!', bonus: 1100 })
    }
    return directResolutionEvent(state, [...positionsInRows(state.board, new Set([center.r])), ...positionsInColumns(state.board, new Set([center.c]))], random, { kind: 'special-combination', comboType: 'line+line', label: 'Cross Blast!', bonus: 800 })
  }

  const specialPosition = firstType ? firstPosition : secondPosition
  const specialType = firstType || secondType
  return directResolutionEvent(state, specialCells(state.board, specialPosition), random, {
    kind: 'special-activation',
    comboType: specialType,
    label: specialType === 'wrapped' ? 'Wrapped Blast!' : 'Line Blast!',
    bonus: specialType === 'wrapped' ? 400 : 250,
  })
}

function objectiveDone(state, objective) {
  if (objective.type === 'score') return state.score >= objective.target
  if (objective.type === 'collect') return (state.progress.collected[objective.token] ?? 0) >= objective.target
  if (objective.type === 'blockers') return state.progress.blockers >= objective.target
  if (objective.type === 'drops') return state.progress.drops >= objective.target
  return false
}

function updateStatus(state) {
  if (state.level.objectives.every(objective => objectiveDone(state, objective))) state.status = 'won'
  else if (state.movesRemaining <= 0) state.status = 'lost'
  else state.status = 'active'
}

export function createGame(level, seed = 1) {
  return {
    version: 2,
    level,
    seed,
    rngState: seed + 1,
    board: generateBoard(level, seed),
    score: 0,
    movesRemaining: level.moves,
    progress: { collected: {}, blockers: 0, drops: 0 },
    status: 'active',
    cascades: [],
    combo: { count: 0, multiplier: 1, label: '', scoreGained: 0 },
    stats: { maxCombo: 0, specialsCreated: 0, specialsTriggered: 0 },
    usedActions: [],
    analytics: [],
  }
}

export function swap(state, from, to) {
  if (state.status !== 'active' || !adjacent(from, to) || !movable(state.board[from.r]?.[from.c]) || !movable(state.board[to.r]?.[to.c])) return { state, accepted: false }
  const next = normaliseState(clone(state))
  ;[next.board[from.r][from.c], next.board[to.r][to.c]] = [next.board[to.r][to.c], next.board[from.r][from.c]]
  const hasSpecial = Boolean(next.board[from.r][from.c].special || next.board[to.r][to.c].special)
  if (!hasSpecial && !findMatches(next.board).cells.length) return { state, accepted: false }
  next.movesRemaining -= 1
  const initialCascades = hasSpecial ? [specialSwapEvent(next, from, to)] : []
  return { state: resolveBoard(next, to, { initialCascades }), accepted: true }
}

export function applyPowerUp(state, type, target) {
  if (state.status !== 'active' && !(state.status === 'lost' && type === 'extra-moves')) return { state, applied: false }
  const next = normaliseState(clone(state))
  const cell = target ? next.board[target.r]?.[target.c] : null
  if (type === 'extra-moves') {
    next.movesRemaining += 5
    next.status = 'active'
    finishResolution(next, [])
    return { state: next, applied: true }
  }
  if (type === 'shuffle') {
    next.board = shuffleBoard(next.board, next.rngState++)
    finishResolution(next, [])
    return { state: next, applied: true }
  }
  if (!usable(cell)) return { state, applied: false }

  let targets = []
  if (type === 'hammer') {
    if (!cell.token && !cell.crate && !cell.ice && !cell.chain) return { state, applied: false }
    targets = [target]
  } else if (type === 'line-blast') targets = next.board[target.r].map((_, column) => ({ r: target.r, c: column }))
  else if (type === 'color-clear') {
    if (!cell.token) return { state, applied: false }
    for (let row = 0; row < next.board.length; row += 1) for (let column = 0; column < next.board[0].length; column += 1) if (matchToken(next.board[row][column]) === cell.token) targets.push({ r: row, c: column })
  } else return { state, applied: false }

  damage(next.board, targets, next.progress)
  gravity(next.board, seededRandom(next.rngState++), next.progress)
  return { state: resolveBoard(next, target), applied: true }
}

export function objectiveProgress(state, objective) {
  if (objective.type === 'score') return Math.min(state.score, objective.target)
  if (objective.type === 'collect') return Math.min(state.progress.collected[objective.token] ?? 0, objective.target)
  return Math.min(state.progress[objective.type] ?? 0, objective.target)
}
