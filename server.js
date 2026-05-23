// FlipOut static file server — Node built-ins only, no express needed.
// Serves dist/ on port 5174 for flipout.gizmogames.uk via Cloudflare Tunnel.

import http from 'http'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = process.env.PORT || 5174

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.webp': 'image/webp',
}

http.createServer((req, res) => {
  // strip query string
  let urlPath = req.url.split('?')[0]

  // default to index.html
  if (urlPath === '/') urlPath = '/index.html'

  let filePath = path.join(DIST, urlPath)

  // SPA fallback — serve index.html for unknown paths
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html')
  }

  const ext  = path.extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': mime })
    res.end(data)
  })
}).listen(PORT, () => console.log(`FlipOut running on port ${PORT}`))
