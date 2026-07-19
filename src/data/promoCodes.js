// ── Promo codes ──────────────────────────────────────────────────────────────
// Add new codes here. Key = code (always uppercase). Value = coins to award.
// Codes are checked case-insensitively (input is uppercased before lookup).
// Once redeemed, a code is stored in localStorage and cannot be reused on the
// same device.
// ─────────────────────────────────────────────────────────────────────────────

export const PROMO_CODES = {
  'FLIPOUT':    { stars: 2000 },
  'GIZMO100':   { stars: 1000 },
  'LAUNCH':     { stars: 5000 },
  'LUCKYPENNY': { stars: 10000, spins: 5 },
  'SPIN2WIN':   { spins: 5 },
  'NEWDECK':    { unlocks: 1 },
  'CRASHONE':   { avatar: 99 },  // Beta Tester exclusive — unlocks Crash Test Dummy avatar
}
