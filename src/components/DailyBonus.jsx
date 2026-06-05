import styles from './DailyBonus.module.css'

const DAILY_REWARDS = [5, 10, 15, 20, 25, 50, 50]

const REWARD_IMG = {
  5:  '/images/coin_mult_x5.webp',
  10: '/images/coin_mult_x10.webp',
  15: '/images/coin_mult_x15.webp',
  20: '/images/coin_mult_x20.webp',
  25: '/images/coin_mult_x25.webp',
  50: '/images/coin_mult_x50.webp',
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

/** Call once on app load. Returns { day (0-indexed), coins } or null if already claimed today. */
export function checkDailyBonus() {
  const today    = todayStr()
  const lastDate = localStorage.getItem('fo_dlb_last') || ''

  if (lastDate === today) return null // already claimed today

  const isTuesday = new Date().getDay() === 2
  let day

  if (isTuesday) {
    day = 0
  } else {
    const savedDay = parseInt(localStorage.getItem('fo_dlb_day') || '0', 10)
    if (lastDate === yesterdayStr()) {
      day = Math.min(savedDay + 1, 6)
    } else {
      day = 0
    }
  }

  const coins = DAILY_REWARDS[day]

  const cur = parseInt(localStorage.getItem('fo_coins') || '0', 10)
  localStorage.setItem('fo_coins',    String(cur + coins))
  localStorage.setItem('fo_dlb_last', today)
  localStorage.setItem('fo_dlb_day',  String(day))

  return { day, coins }
}

export default function DailyBonus({ day, coins, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose} aria-label="Close">✕</button>

        <h2 className={styles.title}>🎁 Daily Bonus!</h2>

        {/* 7-day progress strip */}
        <div className={styles.dayRow}>
          {DAILY_REWARDS.map((r, i) => (
            <div
              key={i}
              className={[
                styles.dayBox,
                i < day   ? styles.dayDone    : '',
                i === day ? styles.dayCurrent : '',
                i > day   ? styles.dayFuture  : '',
              ].join(' ')}
            >
              <span className={styles.dayLabel}>D{i + 1}</span>
              <div className={styles.dayRewardWrap}>
                <img src={REWARD_IMG[r]} alt={`${r} coins`} className={styles.dayRewardImg} />
                {i < day && <span className={styles.claimedX}>✕</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Today's reward */}
        <img src={REWARD_IMG[coins]} alt={`${coins} coins`} className={styles.bigRewardImg} />

        <button className={styles.collectBtn} onClick={onClose}>
          Collect!
        </button>

      </div>
    </div>
  )
}
