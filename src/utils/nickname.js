const RESERVED_NAMES = new Set([
  'admin', 'administrator', 'moderator', 'system', 'support', 'developer', 'flipout', 'official',
])

const PROFANE_NAMES = new Set([
  'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'fag', 'fuck', 'motherfucker', 'nigger', 'piss', 'porn', 'sex', 'shit', 'slut', 'twat', 'whore',
])

export function nicknameValidationMessage(value) {
  const displayName = String(value ?? '')
  if (!displayName) return 'Choose a nickname to continue.'
  if (displayName.length < 3 || displayName.length > 12) return 'Use 3–12 characters.'
  if (!/^[A-Za-z0-9]+$/.test(displayName)) return 'Use letters and numbers only — no spaces or punctuation.'
  const normalised = displayName.toLowerCase()
  if (RESERVED_NAMES.has(normalised)) return 'That nickname is reserved.'
  if (PROFANE_NAMES.has(normalised)) return 'That nickname is not allowed.'
  return ''
}

export function isValidNickname(value) {
  return nicknameValidationMessage(value) === ''
}

