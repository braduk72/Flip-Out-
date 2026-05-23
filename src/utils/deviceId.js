// Generates a stable anonymous device UUID on first visit.
// This is the player's invisible "account" ID — never shown to them.

const KEY = 'fo_device_uuid'

export function getDeviceUuid() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
