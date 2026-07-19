export default function handler(_req, res) {
  res.status(410).json({ error: 'Password registration is disabled; guest play starts automatically' })
}
