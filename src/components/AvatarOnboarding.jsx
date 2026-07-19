import { useRef, useState } from 'react'
import { ONBOARDING_AVATARS } from '../data/avatarCatalog.js'
import styles from './AvatarOnboarding.module.css'

export default function AvatarOnboarding({ avatars = ONBOARDING_AVATARS, onSubmit }) {
  const [selectedAvatarId, setSelectedAvatarId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const buttonRefs = useRef([])
  const selected = avatars.find(avatar => avatar.id === selectedAvatarId)

  function moveFocus(event, index) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const columns = Math.max(1, Math.floor(event.currentTarget.parentElement.clientWidth / 92))
    let next = index
    if (event.key === 'ArrowLeft') next -= 1
    if (event.key === 'ArrowRight') next += 1
    if (event.key === 'ArrowUp') next -= columns
    if (event.key === 'ArrowDown') next += columns
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = avatars.length - 1
    next = Math.max(0, Math.min(avatars.length - 1, next))
    buttonRefs.current[next]?.focus()
  }

  async function submit(event) {
    event.preventDefault()
    if (!selectedAvatarId || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(selectedAvatarId)
    } catch (submitError) {
      setError(submitError?.message || 'Your avatar could not be saved. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.page} aria-labelledby="avatar-title">
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="avatar-title" aria-describedby="avatar-subtitle">
        <div className={styles.brand} aria-hidden="true">FLIP-OUT!</div>
        <h1 id="avatar-title">Choose your avatar</h1>
        <p id="avatar-subtitle">Pick the picture other players will recognise.</p>
        <form onSubmit={submit}>
          <div className={styles.grid} role="group" aria-label="Available avatars">
            {avatars.map((avatar, index) => <button
              key={avatar.id}
              ref={node => { buttonRefs.current[index] = node }}
              type="button"
              className={`${styles.avatarButton} ${selectedAvatarId === avatar.id ? styles.selected : ''}`}
              aria-pressed={selectedAvatarId === avatar.id}
              aria-label={`Select ${avatar.label}`}
              onKeyDown={event => moveFocus(event, index)}
              onClick={() => { setSelectedAvatarId(avatar.id); setError('') }}
            ><img src={avatar.asset} alt="" draggable="false"/><span className={styles.selectedMark} aria-hidden="true">✓</span></button>)}
          </div>
          <p className={styles.selection} aria-live="polite">{selected ? `${selected.label} selected.` : 'Choose an avatar to continue.'}</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.continueButton} disabled={!selectedAvatarId || submitting}>{submitting ? 'Saving avatar…' : 'Continue'}</button>
        </form>
      </section>
    </main>
  )
}

