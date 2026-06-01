// ── Promo codes ──────────────────────────────────────────────────────────────
// Add new codes here. Key = code (always uppercase). Value = coins to award.
// Codes are checked case-insensitively (input is uppercased before lookup).
// Once redeemed, a code is stored in localStorage and cannot be reused on the
// same device.
// ─────────────────────────────────────────────────────────────────────────────

export const PROMO_CODES = {
  'FLIPOUT':    { coins: 200 },
  'GIZMO100':   { coins: 100 },
  'LAUNCH':     { coins: 500 },
  'LUCKYPENNY': { coins: 1000, spins: 5 },
  'SPIN2WIN':   { spins: 5 },
  'NEWDECK':    { unlocks: 1 },
  'CRASHONE':   { avatar: 99 },  // Beta Tester exclusive — unlocks Crash Test Dummy avatar
}
