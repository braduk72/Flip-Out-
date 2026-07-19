export function getDeviceTimeZone(intl = globalThis.Intl) {
  try {
    const value = intl?.DateTimeFormat?.().resolvedOptions?.().timeZone
    return typeof value === 'string' && value.trim() ? value : 'UTC'
  } catch {
    return 'UTC'
  }
}
