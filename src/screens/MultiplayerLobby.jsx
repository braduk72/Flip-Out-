import { useState, useEffect, useRef } from 'react'
import styles from './MultiplayerLobby.module.css'
import { DECKS } from '../data/decks'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const MATCHMAKE_TIMEOUT = 30

function pickRandomDeckId() {
  const ownedIds = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
  const available = DECKS.filter(d => d.free || ownedIds.includes(d.id))
  const pool = available.length > 0 ? available : DECKS
  return pool[Math.floor(Math.random() * pool.length)].id
}

export default function MultiplayerLobby({
  mp,
  portrait,
  onBack,
  onFallbackCPU,
}) {
  const [tab,        setTab]        = useState('matchmake') // 'matchmake' | 'create' | 'join'
  const [joinCode,   setJoinCode]   = useState('')
  const [mpDifficulty, setMpDifficulty] = useState('Medium')
  const [secondsLeft, setSecondsLeft] = useState(null)
  const timerRef = useRef(null)
  const tickRef  = useRef(null)

  // 30-second CPU fallback timer — starts when matchmaking begins
  useEffect(() => {
    if (mp.status === 'searching') {
      queueMicrotask(() => setSecondsLeft(MATCHMAKE_TIMEOUT))

      tickRef.current = setInterval(() => {
        setSecondsLeft(s => (s > 1 ? s - 1 : 0))
      }, 1000)

      timerRef.current = setTimeout(() => {
        mp.cancelMatchmake()
        onFallbackCPU?.({ deckId: pickRandomDeckId(), difficulty: mpDifficulty })
      }, MATCHMAKE_TIMEOUT * 1000)
    } else {
      clearTimeout(timerRef.current)
      clearInterval(tickRef.current)
      queueMicrotask(() => setSecondsLeft(null))
    }
    return () => {
      clearTimeout(timerRef.current)
      clearInterval(tickRef.current)
    }
  }, [mp.status]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMatchmake() {
    mp.matchmake({ portrait, deckId: pickRandomDeckId(), difficulty: mpDifficulty })
  }

  function handleCreate() {
    mp.createRoom({ portrait, deckId: pickRandomDeckId(), difficulty: mpDifficulty })
  }

  function handleJoin() {
    if (joinCode.trim().length < 4) return
    mp.joinRoom({ code: joinCode.trim(), portrait })
  }

  function handleCancel() {
    mp.cancelMatchmake()
  }

  const isSearching = mp.status === 'searching'
  const isWaiting   = mp.status === 'waiting'
  const isCreating  = mp.status === 'creating'
  const isBusy      = isSearching || isWaiting || isCreating

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="multiplayer-lobby">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={isBusy ? handleCancel : onBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <div className={styles.title}>PLAY ONLINE</div>
      </div>

      {/* Status area */}
      {isBusy ? (
        <div className={styles.statusWrap}>
          <div className={styles.spinner} />
          {isSearching && (
            <>
              <div className={styles.statusMsg}>Finding an opponent…</div>
              <div className={styles.statusSub}>Searching for a {mpDifficulty} match</div>
              {secondsLeft !== null && (
                <div className={styles.statusCountdown}>
                  No one found? Playing CPU in {secondsLeft}s
                </div>
              )}
            </>
          )}
          {(isWaiting || isCreating) && (
            <>
              <div className={styles.statusMsg}>Room created!</div>
              <div className={styles.roomCodeDisplay}>{mp.roomCode}</div>
              <div className={styles.statusSub}>Share this code with a friend</div>
            </>
          )}
          <button className={styles.cancelBtn} onClick={handleCancel}>CANCEL</button>
        </div>
      ) : mp.status === 'error' ? (
        <div className={styles.errorWrap}>
          <div className={styles.errorMsg}>{mp.error || 'Something went wrong'}</div>
          <button className={styles.cancelBtn} onClick={onBack}>GO BACK</button>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${tab === 'matchmake' ? styles.tabActive : ''}`}
              onClick={() => setTab('matchmake')}
            >QUICK MATCH</button>
            <button
              className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`}
              onClick={() => setTab('create')}
            >CREATE ROOM</button>
            <button
              className={`${styles.tab} ${tab === 'join' ? styles.tabActive : ''}`}
              onClick={() => setTab('join')}
            >JOIN ROOM</button>
          </div>

          <div className={styles.panel}>
            {tab === 'join' ? (
              /* ── Join tab ── */
              <div className={styles.joinForm}>
                <div className={styles.fieldLabel}>ENTER ROOM CODE</div>
                <input
                  className={styles.codeInput}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={8}
                  autoFocus
                />
                <button
                  className={styles.actionBtn}
                  onClick={handleJoin}
                  disabled={joinCode.trim().length < 4}
                >JOIN →</button>
              </div>
            ) : (
              /* ── Matchmake / Create tabs share settings ── */
              <>
                <div className={styles.randomNote}>🎲 A random deck from your collection will be used</div>

                {/* Difficulty */}
                <div className={styles.fieldLabel}>DIFFICULTY</div>
                <div className={styles.diffRow}>
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      className={`${styles.diffChip} ${mpDifficulty === d ? styles.diffChipActive : ''}`}
                      onClick={() => setMpDifficulty(d)}
                    >{d}</button>
                  ))}
                </div>

                <button
                  className={styles.actionBtn}
                  onClick={tab === 'matchmake' ? handleMatchmake : handleCreate}
                >
                  {tab === 'matchmake' ? 'FIND MATCH →' : 'CREATE ROOM →'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
