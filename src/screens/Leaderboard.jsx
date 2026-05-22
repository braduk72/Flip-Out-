import { useState } from 'react'
import styles from './Leaderboard.module.css'
import BottomNav from '../components/BottomNav'

const TABS = ['Daily', 'Monthly']

const DAILY_PLAYERS = [
  { name: 'FlipMaster',  trophies: 47, portrait: 2 },
  { name: 'CardShark99', trophies: 41, portrait: 3 },
  { name: 'MemoryKing',  trophies: 38, portrait: 1 },
  { name: 'QuickFlip',   trophies: 35, portrait: 4 },
  { name: 'PairPro',     trophies: 31, portrait: 2 },
  { name: 'AceCards',    trophies: 28, portrait: 3 },
  { name: 'MatchWizard', trophies: 25, portrait: 1 },
  { name: 'FlipQueen',   trophies: 22, portrait: 4 },
  { name: 'CardNinja',   trophies: 19, portrait: 2 },
  { name: 'TurboFlip',   trophies: 16, portrait: 3 },
]

const MONTHLY_PLAYERS = [
  { name: 'FlipMaster',  trophies: 847, portrait: 2 },
  { name: 'CardShark99', trophies: 712, portrait: 3 },
  { name: 'MemoryKing',  trophies: 634, portrait: 1 },
  { name: 'QuickFlip',   trophies: 589, portrait: 4 },
  { name: 'PairPro',     trophies: 521, portrait: 2 },
  { name: 'AceCards',    trophies: 498, portrait: 3 },
  { name: 'MatchWizard', trophies: 445, portrait: 1 },
  { name: 'FlipQueen',   trophies: 412, portrait: 4 },
  { name: 'CardNinja',   trophies: 387, portrait: 2 },
  { name: 'TurboFlip',   trophies: 334, portrait: 3 },
]

function buildBoard(fake, portrait) {
  const myTrophies = parseInt(localStorage.getItem('fo_trophies') || '0')
  // Insert player into sorted list
  const all = [...fake, { name: 'You', trophies: myTrophies, portrait, isMe: true }]
  all.sort((a, b) => b.trophies - a.trophies)
  // Deduplicate same trophy counts: push "You" below ties
  return all
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function Leaderboard({ portrait = 1, onBack, navProps }) {
  const [tab, setTab] = useState(0)
  const fakeList = tab === 0 ? DAILY_PLAYERS : MONTHLY_PLAYERS
  const board    = buildBoard(fakeList, portrait)
  const podium   = board.slice(0, 3)
  const rest     = board.slice(3)
  const myEntry  = board.find(p => p.isMe)
  const myRank   = board.indexOf(myEntry) + 1

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Leaderboard</h1>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
            onClick={() => setTab(i)}
          >{t}</button>
        ))}
      </div>

      {/* Podium */}
      <div className={styles.podium}>
        {/* 2nd place */}
        <div className={`${styles.podiumSlot} ${styles.second}`}>
          <div className={`${styles.podiumAvatar} ${podium[1]?.isMe ? styles.meAvatar : ''}`}>
            <img src={`/images/a${podium[1]?.portrait ?? 1}.png`} alt="" />
          </div>
          <div className={styles.podiumMedal}>{MEDAL[1]}</div>
          <div className={styles.podiumName}>{podium[1]?.name ?? '—'}</div>
          <div className={styles.podiumScore}>🏆 {podium[1]?.trophies ?? 0}</div>
          <div className={`${styles.podiumBase} ${styles.silverBase}`} />
        </div>

        {/* 1st place */}
        <div className={`${styles.podiumSlot} ${styles.first}`}>
          <div className={`${styles.podiumAvatar} ${styles.firstAvatar} ${podium[0]?.isMe ? styles.meAvatar : ''}`}>
            <img src={`/images/a${podium[0]?.portrait ?? 1}.png`} alt="" />
          </div>
          <div className={styles.podiumMedal}>{MEDAL[0]}</div>
          <div className={styles.podiumName}>{podium[0]?.name ?? '—'}</div>
          <div className={styles.podiumScore}>🏆 {podium[0]?.trophies ?? 0}</div>
          <div className={`${styles.podiumBase} ${styles.goldBase}`} />
        </div>

        {/* 3rd place */}
        <div className={`${styles.podiumSlot} ${styles.third}`}>
          <div className={`${styles.podiumAvatar} ${podium[2]?.isMe ? styles.meAvatar : ''}`}>
            <img src={`/images/a${podium[2]?.portrait ?? 1}.png`} alt="" />
          </div>
          <div className={styles.podiumMedal}>{MEDAL[2]}</div>
          <div className={styles.podiumName}>{podium[2]?.name ?? '—'}</div>
          <div className={styles.podiumScore}>🏆 {podium[2]?.trophies ?? 0}</div>
          <div className={`${styles.podiumBase} ${styles.bronzeBase}`} />
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {rest.map((player, i) => (
          <div key={player.name + i} className={`${styles.row} ${player.isMe ? styles.meRow : ''}`}>
            <span className={styles.rank}>{i + 4}</span>
            <div className={styles.rowAvatar}>
              <img src={`/images/a${player.portrait}.png`} alt="" />
            </div>
            <span className={styles.rowName}>{player.isMe ? 'You' : player.name}</span>
            <span className={styles.rowScore}>🏆 {player.trophies}</span>
          </div>
        ))}
      </div>

      {/* Own rank pinned at bottom */}
      <div className={styles.myRankBar}>
        <span className={styles.myRankNum}>{myRank === -1 ? '-' : myRank}</span>
        <div className={styles.myRankAvatar}>
          <img src={`/images/a${portrait}.png`} alt="" />
        </div>
        <span className={styles.myRankName}>You</span>
        <span className={styles.myRankScore}>🏆 {myEntry?.trophies ?? 0}</span>
      </div>

      <BottomNav active="ranks" {...navProps} />
    </div>
  )
}
