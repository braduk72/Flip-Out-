// Bumps the patch segment of APP_VERSION in hex
// e.g. 0.1.104 → 0.1.105 → ... → 0.1.10e → 0.1.10f → 0.1.110 → ...
// Minor rolls over only at 0x10000 (65536 patches — effectively never)
const fs = require('fs')
const path = require('path')

const vFile = path.join(__dirname, '../src/version.js')
const src   = fs.readFileSync(vFile, 'utf8')
const m     = src.match(/'(\d+)\.(\d+)\.([0-9a-f]+)'/)
if (!m) { console.error('Could not parse version'); process.exit(1) }

let [, major, minor, patch] = m
let patchNum = parseInt(patch, 16) + 1
let minorNum = parseInt(minor)
let majorNum = parseInt(major)

if (patchNum >= 0x10000) { patchNum = 0; minorNum++ }
if (minorNum >= 100)     { minorNum = 0; majorNum++ }

const newVersion = `${majorNum}.${minorNum}.${patchNum.toString(16)}`
fs.writeFileSync(vFile, `export const APP_VERSION = '${newVersion}'\n`)
console.log(`version: ${newVersion}`)
