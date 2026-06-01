import { useState } from 'react'
import styles from './CookieBanner.module.css'

const CONSENT_KEY = 'fo_cookie_consent' // stored in localStorage (no cookie needed for this)

function readConsentCookie() {
  try {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('fo_consent='))
    return match ? decodeURIComponent(match.trim().slice('fo_consent='.length)) : null
  } catch { return null }
}

function writeConsentCookie(val) {
  try {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 2)
    document.cookie = `fo_consent=${val}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  } catch {}
}

export function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'yes' || readConsentCookie() === 'yes'
}

export function consentAnswered() {
  return localStorage.getItem(CONSENT_KEY) !== null || readConsentCookie() !== null
}

export default function CookieBanner({ onAccept, onDecline }) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'yes')
    writeConsentCookie('yes')
    setVisible(false)
    onAccept?.()
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'no')
    writeConsentCookie('no')
    setVisible(false)
    onDecline?.()
  }

  return (
    <div className={styles.banner}>
      <div className={styles.text}>
        🍪 We use a cookie to save your game progress across sessions.
        No tracking, no ads data, no third parties.{' '}
        <a href="/privacy.html" target="_blank" rel="noopener" className={styles.link}>Privacy Policy</a>
      </div>
      <div className={styles.btns}>
        <button className={styles.decline} onClick={decline}>No thanks</button>
        <button className={styles.accept} onClick={accept}>Got it!</button>
      </div>
    </div>
  )
}
