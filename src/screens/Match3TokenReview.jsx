import Match3TokenImage from '../match3/Match3TokenImage.jsx'
import { MATCH3_TOKEN_CROPS } from '../match3/tokenCrops.js'
import styles from './Match3TokenReview.module.css'

const SIZE_PREVIEWS = [
  { id: 'full', label: 'Full asset', detail: '256 px', className: styles.fullSize },
  { id: 'board', label: 'Normal board', detail: '48 px', className: styles.boardSize },
  { id: 'small', label: 'Smallest phone', detail: '32 px', className: styles.smallSize },
  { id: 'reduced', label: 'Reduced vision', detail: '48 px simulation', className: styles.reducedVision },
]

export default function Match3TokenReview({ onBack }) {
  const approved = MATCH3_TOKEN_CROPS.filter(token => token.review.status === 'approved').length
  const attention = MATCH3_TOKEN_CROPS.length - approved

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" onClick={onBack}>← Home</button>
        <div>
          <p className={styles.eyebrow}>Development review · not a player screen</p>
          <h1>Match-3 token legibility</h1>
          <p>Approve from the 48 px, 32 px and reduced-vision samples—not from the enlarged crop alone.</p>
        </div>
      </header>

      <section className={styles.summary} aria-label="Review summary">
        <strong>{approved} approved</strong>
        <span>{attention} flagged or rejected</span>
        <a href="/ui/match3/card-tokens/quality-report.json">Open generated quality signals</a>
      </section>

      <section className={styles.boardStrip} aria-labelledby="neighbour-check-title">
        <div>
          <h2 id="neighbour-check-title">Neighbour distinction check</h2>
          <p>All six assets together at the conservative 32 px phone size.</p>
        </div>
        <div className={styles.neighbourTokens}>
          {MATCH3_TOKEN_CROPS.map(token => <Match3TokenImage key={token.id} tokenId={token.id} title={token.label}/>)}
        </div>
      </section>

      <section className={styles.tokenList} aria-label="Token crop reviews">
        {MATCH3_TOKEN_CROPS.map(token => (
          <article className={styles.tokenCard} key={token.id} data-review-status={token.review.status}>
            <header className={styles.tokenHeader}>
              <div>
                <p className={styles.eyebrow}>{token.id} · {token.sourceCardId}</p>
                <h2>{token.label}</h2>
              </div>
              <span className={`${styles.status} ${styles[token.review.status]}`}>{token.review.status}</span>
            </header>

            <div className={styles.sourceAndSizes}>
              <figure className={styles.sourceCard}>
                <img src={token.sourceAsset} alt={`Source card for ${token.accessibleLabel}`}/>
                <figcaption>Source artwork</figcaption>
              </figure>
              <div className={styles.sizes}>
                {SIZE_PREVIEWS.map(preview => (
                  <figure key={preview.id} data-review-size={preview.id}>
                    <div className={styles.previewStage}><Match3TokenImage tokenId={token.id} className={preview.className}/></div>
                    <figcaption><strong>{preview.label}</strong><span>{preview.detail}</span></figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <dl className={styles.metadata}>
              <div><dt>Source asset</dt><dd>{token.sourceAsset}</dd></div>
              <div><dt>Focal point</dt><dd>{token.focalPoint.x.toFixed(3)} / {token.focalPoint.y.toFixed(3)}</dd></div>
              <div><dt>Zoom</dt><dd>{token.zoom.toFixed(2)}×</dd></div>
              <div><dt>Rotation</dt><dd>{token.rotation}°</dd></div>
              <div><dt>Accessible label</dt><dd>{token.accessibleLabel}</dd></div>
              <div><dt>Fallback</dt><dd>{token.fallbackAsset}</dd></div>
            </dl>

            <p className={styles.reviewNote}><strong>Review:</strong> {token.review.notes}</p>
            {token.review.flags.length > 0 && <ul className={styles.flags}>{token.review.flags.map(flag => <li key={flag}>{flag}</li>)}</ul>}
          </article>
        ))}
      </section>

      <section className={styles.criteria}>
        <h2>Rejection criteria</h2>
        <p>Flag a crop if it becomes muddy, resembles another token, relies on tiny detail, loses contrast, includes card furniture or cuts through the recognisable subject.</p>
      </section>
    </main>
  )
}
