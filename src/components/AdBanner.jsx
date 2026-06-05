import styles from './AdBanner.module.css'

export default function AdBanner({ onAbout }) {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('fo_no_ads')) return null

  return (
    <div className={styles.wrap}>
      <button className={styles.ggBtn} onClick={onAbout} aria-label="About us">
        <img src="/images/gg.webp" alt="Gizmo Games" className={styles.ggImg} draggable="false" />
      </button>
    </div>
  )
}
