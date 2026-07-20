export function isDevToolkitRequest(search = globalThis.location?.search ?? '') {
  const params = new URLSearchParams(search)
  return params.get('dev') === 'toolkit'
}
