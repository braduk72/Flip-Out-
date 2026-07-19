/* eslint-disable react-refresh/only-export-components -- app bootstrap imports checkDailyBonus from this established module */
import styles from './DailyBonus.module.css'
import { economy } from '../utils/economyService.js'
import { playerGameApi } from '../utils/gameApi.js'

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

/** Call once on app load. Returns { day (0-indexed), stars } or null if already claimed today. */
export async function checkDailyBonus() {
  const result = await playerGameApi.dailyLogin(Intl.DateTimeFormat().resolvedOptions().timeZone)
  if (result.duplicate) return null
  const day = Math.max(0, Number(result.streak ?? 1) - 1)
  const stars = Number(result.reward?.amount ?? 0)
  economy.applyTransaction({ id: result.claimId, source: 'daily-login-server', changes: { counters: { stars }, flags: { fo_dlb_last: todayStr(), fo_dlb_day: day } } })
  return { day, coins: stars }
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
                <img src={REWARD_IMG[r]} alt={`${r * 10} Stars`} className={styles.dayRewardImg} />
                {i < day && <span className={styles.claimedX}>✕</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Today's reward */}
        <img src={REWARD_IMG[coins / 10]} alt={`${coins} Stars`} className={styles.bigRewardImg} />

        <button className={styles.collectBtn} onClick={onClose}>
          Collect!
        </button>

      </div>
    </div>
  )
}
