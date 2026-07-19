import { useId, useState } from 'react'
import { nicknameValidationMessage } from '../utils/nickname.js'
import styles from './NicknameOnboarding.module.css'

export default function NicknameOnboarding({ onSubmit }) {
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const inputId = useId()
  const validationError = nicknameValidationMessage(nickname)
  const message = serverError || validationError
  const valid = !validationError && !submitting

  async function submit(event) {
    event.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setServerError('')
    try {
      await onSubmit(nickname)
    } catch (error) {
      setServerError(error?.message || 'Your nickname could not be saved. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.page} aria-labelledby="nickname-title">
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="nickname-title" aria-describedby="nickname-subtitle">
        <div className={styles.brand} aria-hidden="true">FLIP-OUT!</div>
        <h1 id="nickname-title">Choose your nickname</h1>
        <p id="nickname-subtitle">This is the name other players will see.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor={inputId}>Nickname</label>
          <input
            id={inputId}
            name="nickname"
            value={nickname}
            onChange={event => { setNickname(event.target.value); setServerError('') }}
            autoComplete="nickname"
            autoCapitalize="none"
            spellCheck="false"
            inputMode="text"
            maxLength={12}
            aria-describedby={`${inputId}-rules ${inputId}-error`}
            aria-invalid={message ? 'true' : undefined}
            autoFocus
          />
          <p id={`${inputId}-rules`} className={styles.rules}>3–12 letters or numbers. No spaces or punctuation.</p>
          <p id={`${inputId}-error`} className={styles.message} aria-live="polite">{message || ' '}</p>
          <button type="submit" disabled={!valid} className={styles.continueButton}>{submitting ? 'Saving nickname…' : 'Continue'}</button>
        </form>
      </section>
    </main>
  )
}
