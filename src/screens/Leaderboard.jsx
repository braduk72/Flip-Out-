import { useState } from 'react'
import styles from './Leaderboard.module.css'
import BottomNav from '../components/BottomNav'

const TABS = [
  { label: '🔥 Longest Streak', key: 'streak',   icon: '🔥', unit: 'days' },
  { label: '⚔️ PVPs Won',       key: 'pvpWins',  icon: '⚔️', unit: 'wins' },
  { label: '🌐 Online',         key: 'online',   icon: '🌐', unit: 'wins' },
]

// Placeholder data — replaced with real server data once Player ID system is live
const STREAK_PLAYERS = [
  { id: 'FLIP-BK7NP', streak: 34, portrait: 2 },
  { id: 'FLIP-CX9MF', streak: 28, portrait: 3 },
  { id: 'FLIP-DT4RW', streak: 21, portrait: 1 },
  { id: 'FLIP-FG2VH', streak: 19, portrait: 4 },
  { id: 'FLIP-HJ8KQ', streak: 17, portrait: 2 },
  { id: 'FLIP-KM3NS', streak: 14, portrait: 3 },
  { id: 'FLIP-NP6TB', streak: 11, portrait: 1 },
  { id: 'FLIP-QR5WC', streak: 9,  portrait: 4 },
  { id: 'FLIP-ST7YD', streak: 7,  portrait: 2 },
  { id: 'FLIP-VW2ZF', streak: 5,  portrait: 3 },
]

const PVP_PLAYERS = [
  { id: 'FLIP-BK7NP', wins: 142, portrait: 2 },
  { id: 'FLIP-FG2VH', wins: 119, portrait: 4 },
  { id: 'FLIP-CX9MF', wins: 97,  portrait: 3 },
  { id: 'FLIP-NP6TB', wins: 83,  portrait: 1 },
  { id: 'FLIP-HJ8KQ', wins: 74,  portrait: 2 },
  { id: 'FLIP-DT4RW', wins: 68,  portrait: 1 },
  { id: 'FLIP-QR5WC', wins: 55,  portrait: 4 },
  { id: 'FLIP-KM3NS', wins: 47,  portrait: 3 },
  { id: 'FLIP-VW2ZF', wins: 38,  portrait: 3 },
  { id: 'FLIP-ST7YD', wins: 31,  portrait: 2 },
]

function buildBoard(fakeList, scoreKey, myScore, portrait, myId) {
  const all = [
    ...fakeList.map(p => ({ ...p, score: p[scoreKey] })),
    { id: myId || 'You', score: myScore, portrait, isMe: true },
  ]
  all.sort((a, b) => b.score - a.score)
  return all
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function Leaderboard({ portrait = 1, onBack, navProps }) {
  const [tab, setTab] = useState(0)

  const myStreak  = parseInt(localStorage.getItem('fo_streak_best') || '0')
  const myPvpWins = parseInt(localStorage.getItem('fo_pvp_wins') || '0')
  const myId      = localStorage.getItem('fo_player_id') || 'You'

  const tabCfg   = TABS[tab]
  const isOnline = tab === 2
  const fakeList = tab === 0 ? STREAK_PLAYERS  : PVP_PLAYERS
  const myScore  = tab === 0 ? myStreak        : myPvpWins
  const board    = isOnline ? [] : buildBoard(fakeList, tab === 0 ? 'streak' : 'wins', myScore, portrait, myId)
  const podium   = board.slice(0, 3)
  const rest     = board.slice(3)
  const myEntry  = board.find(p => p.isMe)
  const myRank   = board.indexOf(myEntry) + 1

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="leaderboard">
      <div className={styles.content}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className={styles.title}>Leaderboard</h1>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
            onClick={() => setTab(i)}
          >{t.label}</button>
        ))}
      </div>

      {isOnline ? (
        <div className={styles.onlinePlaceholder}>
          <div className={styles.onlineIcon}>🌐</div>
          <div className={styles.onlineTitle}>Online Rankings</div>
          <div className={styles.onlineDesc}>
            Global online leaderboards are coming soon. Play online matches now to build your record — your wins are already being tracked!
          </div>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className={styles.podium}>
            {/* 2nd place */}
            <div className={`${styles.podiumSlot} ${styles.second}`}>
              <div className={`${styles.podiumAvatar} ${podium[1]?.isMe ? styles.meAvatar : ''}`}>
                <img src={`/images/a${podium[1]?.portrait ?? 1}.webp`} alt="" />
              </div>
              <div className={styles.podiumMedal}>{MEDAL[1]}</div>
              <div className={styles.podiumName}>{podium[1]?.isMe ? myId : (podium[1]?.id ?? '—')}</div>
              <div className={styles.podiumScore}>{tabCfg.icon} {podium[1]?.score ?? 0}</div>
              <div className={`${styles.podiumBase} ${styles.silverBase}`} />
            </div>

            {/* 1st place */}
            <div className={`${styles.podiumSlot} ${styles.first}`}>
              <div className={`${styles.podiumAvatar} ${styles.firstAvatar} ${podium[0]?.isMe ? styles.meAvatar : ''}`}>
                <img src={`/images/a${podium[0]?.portrait ?? 1}.webp`} alt="" />
              </div>
              <div className={styles.podiumMedal}>{MEDAL[0]}</div>
              <div className={styles.podiumName}>{podium[0]?.isMe ? myId : (podium[0]?.id ?? '—')}</div>
              <div className={styles.podiumScore}>{tabCfg.icon} {podium[0]?.score ?? 0}</div>
              <div className={`${styles.podiumBase} ${styles.goldBase}`} />
            </div>

            {/* 3rd place */}
            <div className={`${styles.podiumSlot} ${styles.third}`}>
              <div className={`${styles.podiumAvatar} ${podium[2]?.isMe ? styles.meAvatar : ''}`}>
                <img src={`/images/a${podium[2]?.portrait ?? 1}.webp`} alt="" />
              </div>
              <div className={styles.podiumMedal}>{MEDAL[2]}</div>
              <div className={styles.podiumName}>{podium[2]?.isMe ? myId : (podium[2]?.id ?? '—')}</div>
              <div className={styles.podiumScore}>{tabCfg.icon} {podium[2]?.score ?? 0}</div>
              <div className={`${styles.podiumBase} ${styles.bronzeBase}`} />
            </div>
          </div>

          {/* List */}
          <div className={styles.list}>
            {rest.map((player, i) => (
              <div key={(player.id ?? '') + i} className={`${styles.row} ${player.isMe ? styles.meRow : ''}`}>
                <span className={styles.rank}>{i + 4}</span>
                <div className={styles.rowAvatar}>
                  <img src={`/images/a${player.portrait}.webp`} alt="" />
                </div>
                <span className={styles.rowName}>{player.isMe ? myId : player.id}</span>
                <span className={styles.rowScore}>{tabCfg.icon} {player.score}</span>
              </div>
            ))}
          </div>

          {/* Own rank pinned at bottom */}
          <div className={styles.myRankBar}>
            <span className={styles.myRankNum}>{myRank === -1 ? '-' : myRank}</span>
            <div className={styles.myRankAvatar}>
              <img src={`/images/a${portrait}.webp`} alt="" />
            </div>
            <span className={styles.myRankName}>{myId}</span>
            <span className={styles.myRankScore}>{tabCfg.icon} {myEntry?.score ?? 0}</span>
          </div>
        </>
      )}

      </div>{/* end .content */}
      <BottomNav active="ranks" {...navProps} />
    </div>
  )
}
