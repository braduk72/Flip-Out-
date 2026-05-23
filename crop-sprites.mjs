import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC  = path.join(__dirname, 'public/images/downloads')
const DEST = path.join(__dirname, 'public/images')

async function cropSheet(filename, cols, rows, specs) {
  const img  = sharp(path.join(SRC, filename))
  const meta = await img.metadata()
  const W    = Math.floor(meta.width  / cols)
  const H    = Math.floor(meta.height / rows)
  console.log(`\n${filename}  →  ${meta.width}×${meta.height}  (sprite: ${W}×${H})`)

  for (const { row, col, name } of specs) {
    const out = path.join(DEST, name)
    await sharp(path.join(SRC, filename))
      .extract({ left: col * W, top: row * H, width: W, height: H })
      .png()
      .toFile(out)
    console.log(`  ✓  ${name}`)
  }
}

// ── Tesla coils ──────────────────────────────────────────────────────────────
await cropSheet('b2f5339f-9138-4ebe-812d-3bb11c366010.png', 4, 3, [
  // Row 0 = blue
  { row:0, col:0, name:'tc_b1.png' },
  { row:0, col:1, name:'tc_b2.png' },
  { row:0, col:2, name:'tc_b3.png' },
  { row:0, col:3, name:'tc_b4.png' },
  // Row 1 = yellow
  { row:1, col:0, name:'tc_y1.png' },
  { row:1, col:1, name:'tc_y2.png' },
  { row:1, col:2, name:'tc_y3.png' },
  { row:1, col:3, name:'tc_y4.png' },
  // Row 2 = pink/purple
  { row:2, col:0, name:'tc_p1.png' },
  { row:2, col:1, name:'tc_p2.png' },
  { row:2, col:2, name:'tc_p3.png' },
  { row:2, col:3, name:'tc_p4.png' },
])

// ── Robomice ─────────────────────────────────────────────────────────────────
await cropSheet('b469468d-6c36-4fa1-aa4d-ec7d0a5dc3ec.png', 4, 3, [
  // Row 0 = green
  { row:0, col:0, name:'mg1.png' },
  { row:0, col:1, name:'mg2.png' },
  { row:0, col:2, name:'mg3.png' },
  { row:0, col:3, name:'mg4.png' },
  // Row 1 = orange
  { row:1, col:0, name:'mo1.png' },
  { row:1, col:1, name:'mo2.png' },
  { row:1, col:2, name:'mo3.png' },
  { row:1, col:3, name:'mo4.png' },
  // Row 2 = pink
  { row:2, col:0, name:'mp1.png' },
  { row:2, col:1, name:'mp2.png' },
  { row:2, col:2, name:'mp3.png' },
  { row:2, col:3, name:'mp4.png' },
])

// ── Cloud sheet 1 (light→dark, 4×3) ─────────────────────────────────────────
// Names chosen to match FOG_CLOUDS array in SeasonMap.jsx
await cropSheet('086ae154-c108-4206-a0aa-4afcb01bb3ca.png', 4, 3, [
  { row:0, col:0, name:'cld_fw1.png' },
  { row:0, col:1, name:'cld_fw2.png' },
  { row:0, col:2, name:'cld_fw3.png' },
  { row:0, col:3, name:'cld_fm1.png' },
  { row:1, col:0, name:'cld_fm2.png' },
  { row:1, col:1, name:'cld_fm3.png' },
  { row:1, col:2, name:'cld_pd1.png' },
  { row:1, col:3, name:'cld_pd2.png' },
  { row:2, col:0, name:'cld_pd3.png' },
  { row:2, col:1, name:'cld_fs1.png' },
  { row:2, col:2, name:'cld_fs2.png' },
  { row:2, col:3, name:'cld_fd2.png' },
])

// ── Cloud sheet 2 (fluffy→storm, 4×3) ────────────────────────────────────────
await cropSheet('2e40cd2f-a6bb-4cf4-840d-c6d15d770997.png', 4, 3, [
  { row:0, col:0, name:'cld_pm1.png' },
  { row:0, col:1, name:'cld_pm2.png' },
  { row:0, col:2, name:'cld_pm3.png' },
  { row:0, col:3, name:'cld_pm4.png' },
  { row:1, col:0, name:'cld_dm1.png' },
  { row:1, col:1, name:'cld_dm2.png' },
  { row:1, col:2, name:'cld_dm3.png' },
  { row:1, col:3, name:'cld_dm4.png' },
  { row:2, col:0, name:'cld_sm1.png' },
  { row:2, col:1, name:'cld_sm2.png' },
  { row:2, col:2, name:'cld_sm3.png' },
  { row:2, col:3, name:'cld_sm4.png' },
])

console.log('\nAll sprites cropped ✓')
