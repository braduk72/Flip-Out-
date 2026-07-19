import { useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav'
import styles from './PatchNotes.module.css'

const SECTIONS = [
  { key: 'features',  label: 'New Features', icon: '✨', color: '#00c853' },
  { key: 'bugfixes',  label: 'Bug Fixes',    icon: '🐛', color: '#2979ff' },
  { key: 'known',     label: 'Known Issues', icon: '⚠️', color: '#ff9100' },
  { key: 'soon',      label: 'Coming Soon',  icon: '🔮', color: '#aa44ff' },
]

export default function PatchNotes({ onBack, navProps }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/patchnotes.json')
      .then(r => r.json())
      .then(data => { setNotes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="patch-notes">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className={styles.title}>What's New</h1>
      </div>

      <div className={styles.scroll}>
        {loading && <p className={styles.loading}>Loading...</p>}
        {!loading && notes.length === 0 && <p className={styles.loading}>Nothing yet!</p>}
        {notes.map((patch, pIdx) => {
          // Only show sections that have at least one item
          const visibleSections = SECTIONS.filter(s => patch[s.key]?.length > 0)
          return (
            <div key={patch.version} className={`${styles.patch} ${pIdx === 0 ? styles.patchLatest : ''}`}>
              <div className={styles.patchHeader}>
                <span className={styles.version}>v{patch.version}</span>
                {pIdx === 0 && <span className={styles.latestBadge}>LATEST</span>}
                <span className={styles.date}>{patch.date}</span>
              </div>

              {visibleSections.map(section => (
                <div key={section.key} className={styles.section}>
                  <div className={styles.sectionHeader} style={{ color: section.color }}>
                    <span className={styles.sectionIcon}>{section.icon}</span>
                    <span className={styles.sectionLabel}>{section.label}</span>
                  </div>
                  <ul className={styles.noteList}>
                    {patch[section.key].map((text, i) => (
                      <li key={i} className={styles.noteItem}>
                        <span className={styles.bullet} style={{ color: section.color }}>▸</span>
                        <span className={styles.noteText}>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {visibleSections.length === 0 && (
                <p className={styles.emptyNote}>No notes for this version.</p>
              )}
            </div>
          )
        })}
      </div>
      <BottomNav active="more" {...navProps} />
    </div>
  )
}
