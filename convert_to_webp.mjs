/**
 * convert_to_webp.mjs
 *
 * Converts all PNG images in public/images/ to WebP with appropriate resize
 * targets based on actual display sizes in the app. Saves .webp alongside the
 * original .png (originals untouched as backup).
 *
 * Run once:  node convert_to_webp.mjs
 *
 * After running, update all .png references in src/ to .webp and commit.
 */

import sharp from 'sharp'
import fs    from 'fs'
import path  from 'path'

const BASE    = './public/images'
const QUALITY = 85   // WebP quality — good balance of size vs quality

// ── Per-directory resize targets ─────────────────────────────────────────────
// size = longest-side cap (maintains aspect ratio); 0 = no resize
const DIR_RULES = {
  'cards':          320,   // 25% card width on 430px screen × 2× retina + 2.1× zoom
  'Opponants':      200,   // opponent avatars displayed ~70px
  'contestants':    200,
  'gameshowStages': 500,
  'jokers':         500,
}

// ── Per-filename resize targets (root images dir) ─────────────────────────────
const FILE_RULES = {
  // Season map — 724px is already close to 2× mobile width; WebP only
  'season1map.png':     0,

  // Animated sprite sheets — displayed at tiny sizes
  'mg1.png': 96,  'mg2.png': 96,  'mg3.png': 96,  'mg4.png': 96,
  'mo1.png': 96,  'mo2.png': 96,  'mo3.png': 96,  'mo4.png': 96,
  'mp1.png': 96,  'mp2.png': 96,  'mp3.png': 96,  'mp4.png': 96,
  'tc_b1.png': 144, 'tc_b2.png': 144, 'tc_b3.png': 144, 'tc_b4.png': 144,
  'tc_y1.png': 144, 'tc_y2.png': 144, 'tc_y3.png': 144, 'tc_y4.png': 144,
  'tc_p1.png': 144, 'tc_p2.png': 144, 'tc_p3.png': 144, 'tc_p4.png': 144,

  // Cloud fog sprites — displayed at up to full map width (~430px)
  'cld_dm1.png': 400, 'cld_dm2.png': 400, 'cld_dm3.png': 400, 'cld_dm4.png': 400,
  'cld_fd1.png': 400, 'cld_fd2.png': 400, 'cld_fd3.png': 400,
  'cld_fm1.png': 400, 'cld_fm2.png': 400, 'cld_fm3.png': 400,
  'cld_fs1.png': 400, 'cld_fs2.png': 400, 'cld_fs3.png': 400,
  'cld_fw1.png': 400, 'cld_fw2.png': 400, 'cld_fw3.png': 400,
  'cld_pd1.png': 400, 'cld_pd2.png': 400, 'cld_pd3.png': 400, 'cld_pd4.png': 400,
  'cld_pm1.png': 400, 'cld_pm2.png': 400, 'cld_pm3.png': 400, 'cld_pm4.png': 400,
  'cld_pw1.png': 400, 'cld_pw2.png': 400, 'cld_pw3.png': 400, 'cld_pw4.png': 400,
  'cld_sm1.png': 400, 'cld_sm2.png': 400, 'cld_sm3.png': 400, 'cld_sm4.png': 400,

  // Avatars / UI displayed at various small-to-medium sizes
  'a1.png': 200,  'a2.png': 200,  'a3.png': 200,  'a4.png': 200,
  'a5.png': 200,  'a6.png': 200,  'a7.png': 200,  'a8.png': 200,
  'a9.png': 200,  'a10.png': 200, 'a11.png': 200, 'a12.png': 200,
  'a13.png': 200,

  'coin.png':    64,
  'pointer.png': 80,
  'dot.png':     80,
  'padlock.png': 80,
  'play.png':    80,
  'home.png':    80,
  'shop.png':    80,
  'ranks.png':   80,
  'cog.png':     80,
  'profile.png': 80,
  'pound.png':   80,
  'facebook.png':80,

  'dif1.png': 100, 'dif2.png': 100, 'dif3.png': 100,
  'face1.png': 200, 'face2.png': 200, 'face3.png': 200, 'face4.png': 200,
}

const DEFAULT_MAX = 600   // fallback for anything not matched above

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAllPngs(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'downloads') continue   // skip gitignored raw sheets
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      getAllPngs(full, list)
    } else if (entry.name.toLowerCase().endsWith('.png')) {
      list.push(full)
    }
  }
  return list
}

function targetSize(filePath) {
  const rel     = path.relative(BASE, filePath)
  const parts   = rel.split(path.sep)
  const filename = parts[parts.length - 1]

  // Root-level file rule
  if (parts.length === 1 && FILE_RULES[filename] !== undefined) {
    return FILE_RULES[filename]
  }

  // Directory rule (first segment)
  const firstDir = parts[0]
  if (DIR_RULES[firstDir] !== undefined) {
    return DIR_RULES[firstDir]
  }

  return DEFAULT_MAX
}

// ── Main ─────────────────────────────────────────────────────────────────────

const files = getAllPngs(BASE)
console.log(`Found ${files.length} PNG files\n`)

let converted = 0, skipped = 0
let savedBytes = 0

for (const src of files) {
  const dest    = src.replace(/\.png$/i, '.webp')
  const maxSize = targetSize(src)
  const origSize = fs.statSync(src).size

  let pipeline = sharp(src)

  if (maxSize > 0) {
    const meta = await pipeline.metadata()
    const longest = Math.max(meta.width, meta.height)
    if (longest > maxSize) {
      pipeline = pipeline.resize(
        meta.width >= meta.height ? maxSize : null,
        meta.height >  meta.width ? maxSize : null,
        { fit: 'inside', withoutEnlargement: true }
      )
    }
  }

  await pipeline
    .webp({ quality: QUALITY, lossless: false, effort: 4 })
    .toFile(dest)

  const newSize = fs.statSync(dest).size
  savedBytes += (origSize - newSize)
  converted++

  const rel = path.relative(BASE, src)
  const saving = (((origSize - newSize) / origSize) * 100).toFixed(0)
  console.log(`✓ ${rel.padEnd(50)} ${(origSize/1024).toFixed(0).padStart(6)}KB → ${(newSize/1024).toFixed(0).padStart(5)}KB  (${saving}% saved)`)
}

console.log(`\n✅ Converted ${converted} files`)
console.log(`   Total saved: ${(savedBytes / 1024 / 1024).toFixed(1)} MB`)
