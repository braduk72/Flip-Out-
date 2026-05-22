import { useState } from 'react'
import styles from './MultiplayerLobby.module.css'
import { DECKS, getDeckBackImage } from '../data/decks'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function MultiplayerLobby({
  mp,
  portrait,
  onBack,
}) {
  const [tab,        setTab]        = useState('matchmake') // 'matchmake' | 'create' | 'join'
  const [joinCode,   setJoinCode]   = useState('')
  const [mpDifficulty, setMpDifficulty] = useState('Medium')

  // Pick the first owned or free deck as default
  const ownedIds = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
  const available = DECKS.filter(d => d.free || ownedIds.includes(d.id))
  const [selectedDeck, setSelectedDeck] = useState(available[0]?.id ?? DECKS[0].id)

  function handleMatchmake() {
    mp.matchmake({ portrait, deckId: selectedDeck, difficulty: mpDifficulty })
  }

  function handleCreate() {
    mp.createRoom({ portrait, deckId: selectedDeck, difficulty: mpDifficulty })
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
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={isBusy ? handleCancel : onBack}>✕</button>
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
                {/* Deck picker */}
                <div className={styles.fieldLabel}>DECK</div>
                <div className={styles.deckRow}>
                  {available.map(d => (
                    <button
                      key={d.id}
                      className={`${styles.deckBtn} ${selectedDeck === d.id ? styles.deckBtnActive : ''}`}
                      onClick={() => setSelectedDeck(d.id)}
                      title={d.name}
                    >
                      <img src={getDeckBackImage(d)} alt={d.name} className={styles.deckThumb} />
                      <span className={styles.deckName}>{d.name}</span>
                    </button>
                  ))}
                </div>

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
