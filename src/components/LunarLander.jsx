import { useEffect, useRef } from 'react'
import styles from './LunarLander.module.css'

/**
 * Easter egg: a lunar lander descends and plants itself upside down on the
 * moon, while an audio cue plays "The needle has landed."
 * Self-dismisses; tap to dismiss early.
 */
export default function LunarLander({ audio = '/sounds/needle_has_landed.mp3', onDone }) {
  const audioRef = useRef(null)

  useEffect(() => {
    // Play the voice cue roughly as it touches down (~2.2s into the descent)
    const playT = setTimeout(() => {
      try {
        audioRef.current = new Audio(audio)
        audioRef.current.volume = 0.9
        audioRef.current.play().catch(() => {})
      } catch { /* no clip yet — visual still plays */ }
    }, 2200)
    const doneT = setTimeout(() => onDone && onDone(), 6000)
    return () => {
      clearTimeout(playT)
      clearTimeout(doneT)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    }
  }, [audio, onDone])

  return (
    <div className={styles.overlay} onClick={onDone}>
      {/* The moon it (badly) lands on */}
      <div className={styles.moon} aria-hidden="true">
        <span className={`${styles.crater} ${styles.c1}`} />
        <span className={`${styles.crater} ${styles.c2}`} />
        <span className={`${styles.crater} ${styles.c3}`} />
      </div>

      {/* Lander — descends, flips, ends upside down */}
      <div className={styles.lander} aria-hidden="true">
        <div className={styles.thruster} />
        <div className={styles.body} />
        <div className={styles.dome} />
        <span className={`${styles.leg} ${styles.legL}`} />
        <span className={`${styles.leg} ${styles.legR}`} />
      </div>

      <p className={styles.caption}>The needle has landed.</p>
    </div>
  )
}
