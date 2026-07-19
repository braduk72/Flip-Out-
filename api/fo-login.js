export default function handler(_req, res) {
  res.status(410).json({ error: 'Password login is disabled; use platform identity or guest recovery' })
}
