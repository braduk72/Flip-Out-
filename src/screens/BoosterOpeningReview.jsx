import { useEffect, useState } from 'react'
import styles from './BoosterOpeningReview.module.css'

const MANIFEST_URL = '/ui/booster-opening/themed/frames.json'
const SPEEDS = [0.5, 1, 1.5, 2]

export default function BoosterOpeningReview({ onBack }) {
  const [manifest, setManifest] = useState(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    let active = true
    fetch(MANIFEST_URL).then(response => response.json()).then(data => { if (active) setManifest(data) }).catch(() => { if (active) setManifest({ frames: [] }) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!playing || !manifest?.frames?.length) return undefined
    const timer = window.setInterval(() => setFrameIndex(index => (index + 1) % manifest.frames.length), Math.round(520 / speed))
    return () => window.clearInterval(timer)
  }, [manifest, playing, speed])

  const frames = manifest?.frames ?? []
  const frame = frames[frameIndex]
  const changeFrame = direction => setFrameIndex(index => (index + direction + frames.length) % frames.length)

  return (
    <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="booster-opening-review">
      <header className={styles.header}>
        <button type="button" onClick={onBack}>← Home</button>
        <div><p className={styles.eyebrow}>Preview-only asset verification</p><h1>Themed Booster Opening</h1><p>Inspect source groups at their shared 640 px registration point. This is not a player route.</p></div>
      </header>
      {!manifest && <p className={styles.loading}>Loading generated frame manifest…</p>}
      {manifest && !frame && <p className={styles.loading}>The generated manifest could not be loaded.</p>}
      {frame && <section className={styles.review} aria-label="Booster opening frame verification">
        <div className={styles.canvas}>
          <span className={styles.crosshairHorizontal} aria-hidden="true"/><span className={styles.crosshairVertical} aria-hidden="true"/>
          <img key={frame.file} src={`/ui/booster-opening/themed/${frame.file}`} alt={`Approved booster keyframe ${frame.frame}`}/>
        </div>
        <aside className={styles.info}>
          <p className={styles.eyebrow}>Frame {String(frame.frame).padStart(2, '0')} of {frames.length}</p>
          <h2>{frame.file}</h2>
          <dl>
            <div><dt>Source alpha bounds</dt><dd>{frame.alphaBounds.left}, {frame.alphaBounds.top} · {frame.alphaBounds.width} × {frame.alphaBounds.height}</dd></div>
            <div><dt>Extraction crop</dt><dd>{frame.cropBounds.left}, {frame.cropBounds.top} · {frame.cropBounds.width} × {frame.cropBounds.height}</dd></div>
            <div><dt>Canvas / registration</dt><dd>{frame.canvas.width} × {frame.canvas.height} · {frame.registration.x}, {frame.registration.y}</dd></div>
            <div><dt>Frame 10 remnant</dt><dd>{frame.detachedWrapperRemnant ? 'Included in this group' : 'Not applicable'}</dd></div>
          </dl>
          <div className={styles.controls}>
            <button type="button" onClick={() => changeFrame(-1)}>Previous</button>
            <button type="button" onClick={() => setPlaying(value => !value)}>{playing ? 'Pause autoplay' : 'Autoplay'}</button>
            <button type="button" onClick={() => changeFrame(1)}>Next</button>
          </div>
          <label>Playback speed<select value={speed} onChange={event => setSpeed(Number(event.target.value))}>{SPEEDS.map(value => <option value={value} key={value}>{value}×</option>)}</select></label>
          <p className={styles.note}>Check front → edge → rear progression, opening registration, Frame 10’s detached wrapper remnant, and the approved five-card fan in Frame 11.</p>
        </aside>
      </section>}
    </main>
  )
}
