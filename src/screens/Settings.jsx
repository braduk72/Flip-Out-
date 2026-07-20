import { useEffect, useMemo, useState } from 'react'
import styles from './Settings.module.css'
import BottomNav from '../components/BottomNav'
import { APP_VERSION } from '../version.js'
import { playHoverTick } from '../hooks/useSfx'
import { PLAYER_TITLE_PREFIXES, PLAYER_TITLE_SUFFIXES, formatPlayerTitle } from '../data/playerTitles.js'
import { playerGameApi } from '../utils/gameApi.js'
import { savePlayerSettings, usePlayerSettings } from '../utils/playerSettings.js'

const DIFFICULTIES = [
  { id: 'Easy', label: 'Easy' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Hard', label: 'Hard' },
]

export default function Settings({ onBack, onAbout, onPrivacy, onPatchNotes, musicOn, sfxOn, onToggleMusic, onToggleSfx, musicVol = 0.45, sfxVol = 0.7, onMusicVol, onSfxVol, difficulty, onDifficulty, navProps, profileLoader = playerGameApi.state, titleSaver = playerGameApi.setPlayerTitle }) {
  const [profileState, setProfileState] = useState(null)
  const playerSettings = usePlayerSettings()
  const [prefixId, setPrefixId] = useState('')
  const [suffixId, setSuffixId] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)
  const [titleMessage, setTitleMessage] = useState('')
  const [titleError, setTitleError] = useState('')

  useEffect(() => {
    let cancelled = false
    profileLoader()
      .then(payload => {
        if (cancelled) return
        const state = payload?.state ?? {}
        const selected = state.playerTitles?.selected ?? {}
        setProfileState(state)
        setPrefixId(selected.prefixId ?? '')
        setSuffixId(selected.suffixId ?? '')
      })
      .catch(error => {
        if (!cancelled) setTitleError(error?.message || 'Player title settings could not be loaded.')
      })
    return () => { cancelled = true }
  }, [profileLoader])

  const profile = profileState?.profile ?? {}
  const playerName = profile.display_name ?? 'Player'
  const availablePrefixes = profileState?.playerTitles?.available?.prefixes ?? PLAYER_TITLE_PREFIXES
  const availableSuffixes = profileState?.playerTitles?.available?.suffixes ?? PLAYER_TITLE_SUFFIXES
  const titlePreview = useMemo(() => formatPlayerTitle({ playerName, prefixId: prefixId || null, suffixId: suffixId || null }), [playerName, prefixId, suffixId])
  const titleChanged = (prefixId || '') !== (profileState?.playerTitles?.selected?.prefixId ?? '') || (suffixId || '') !== (profileState?.playerTitles?.selected?.suffixId ?? '')
  async function saveTitle(event) {
    event.preventDefault()
    if (savingTitle || !titleChanged) return
    setSavingTitle(true)
    setTitleError('')
    setTitleMessage('')
    try {
      const result = await titleSaver({ prefixId: prefixId || null, suffixId: suffixId || null })
      setProfileState(current => ({
        ...(current ?? {}),
        playerTitles: result,
        profile: {
          ...(current?.profile ?? profile),
          selected_title_prefix_id: result.selected?.prefixId ?? null,
          selected_title_suffix_id: result.selected?.suffixId ?? null,
        },
      }))
      setPrefixId(result.selected?.prefixId ?? '')
      setSuffixId(result.selected?.suffixId ?? '')
      setTitleMessage('Player title saved.')
    } catch (error) {
      setTitleError(error?.message || 'Player title could not be saved.')
    } finally {
      setSavingTitle(false)
    }
  }

  function updatePlayerSetting(change) {
    savePlayerSettings({ ...playerSettings, ...change })
  }

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="settings">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className={styles.title}>More</h1>
      </div>

      <div className={styles.list}>

        <div className={styles.destinationGrid} aria-label="More destinations">
          <button className={styles.destinationCard} type="button" onClick={navProps?.onRanks}>
            <span className={styles.destinationEyebrow}>Compete</span>
            <strong>Leaderboard</strong>
            <span>See ranks and your best scores</span>
          </button>
          <button className={styles.destinationCard} type="button" onClick={navProps?.onShop}>
            <span className={styles.destinationEyebrow}>Discover</span>
            <strong>Coin Store</strong>
            <span>Offers, bundles and the Exchange</span>
          </button>
        </div>

        <h2 className={styles.sectionTitle}>Settings</h2>

        <div className={styles.accessibilityPanel} aria-labelledby="gameplay-accessibility-heading">
          <div>
            <span className={styles.destinationEyebrow}>Accessibility</span>
            <h2 id="gameplay-accessibility-heading">Gameplay comfort</h2>
            <p>Control hints, animation intensity and shake without changing Match-3 rules.</p>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Move Hints</span>
            <button
              type="button"
              className={`${styles.toggle} ${playerSettings.moveHints ? styles.toggleOn : ''}`}
              onClick={() => updatePlayerSetting({ moveHints: !playerSettings.moveHints })}
              aria-label={playerSettings.moveHints ? 'Disable move hints' : 'Enable move hints'}
              aria-pressed={playerSettings.moveHints}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <label className={styles.titleField}>
            <span>Animation intensity</span>
            <select value={playerSettings.motionMode} onChange={event => updatePlayerSetting({ motionMode: event.target.value })}>
              <option value="full">Full</option>
              <option value="reduced">Reduced</option>
              <option value="off">Instant</option>
            </select>
          </label>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Screen Shake</span>
            <button
              type="button"
              className={`${styles.toggle} ${playerSettings.screenShake ? styles.toggleOn : ''}`}
              onClick={() => updatePlayerSetting({ screenShake: !playerSettings.screenShake })}
              aria-label={playerSettings.screenShake ? 'Disable screen shake' : 'Enable screen shake'}
              aria-pressed={playerSettings.screenShake}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        <form className={styles.titlePanel} onSubmit={saveTitle} aria-labelledby="player-title-heading">
          <div className={styles.titlePanelIntro}>
            <span className={styles.destinationEyebrow}>Profile</span>
            <h2 id="player-title-heading">Player Title</h2>
            <p>Choose how your name appears in the header and future social areas.</p>
          </div>
          <div className={styles.titlePreview} aria-live="polite">
            <span>Preview</span>
            <strong>{titlePreview}</strong>
          </div>
          <label className={styles.titleField}>
            <span>Prefix</span>
            <select value={prefixId} onChange={event => { setPrefixId(event.target.value); setTitleMessage(''); setTitleError('') }}>
              <option value="">No prefix</option>
              {availablePrefixes.map(title => <option key={title.id} value={title.id}>{title.label}</option>)}
            </select>
          </label>
          <label className={styles.titleField}>
            <span>Suffix</span>
            <select value={suffixId} onChange={event => { setSuffixId(event.target.value); setTitleMessage(''); setTitleError('') }}>
              <option value="">No suffix</option>
              {availableSuffixes.map(title => <option key={title.id} value={title.id}>{title.label}</option>)}
            </select>
          </label>
          {titleError && <p className={styles.titleError} role="alert">{titleError}</p>}
          {titleMessage && <p className={styles.titleSaved} role="status">{titleMessage}</p>}
          <button className={styles.saveTitleButton} type="submit" disabled={savingTitle || !titleChanged}>{savingTitle ? 'Saving title…' : 'Save Player Title'}</button>
        </form>

        {/* Difficulty */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Difficulty</span>
          <select
            className={styles.diffSelect}
            value={difficulty}
            onChange={e => onDifficulty(e.target.value)}
            aria-label="Select difficulty"
          >
            {DIFFICULTIES.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.audioBlock}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Music</span>
            <button
              className={`${styles.toggle} ${musicOn ? styles.toggleOn : ''}`}
              onClick={onToggleMusic}
              aria-label={musicOn ? 'Mute music' : 'Unmute music'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={musicVol}
            onChange={e => onMusicVol?.(e.target.value)}
            className={styles.volSlider}
            disabled={!musicOn}
            aria-label="Music volume"
          />
        </div>

        <div className={styles.audioBlock}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Sound Effects</span>
            <button
              className={`${styles.toggle} ${sfxOn ? styles.toggleOn : ''}`}
              onClick={onToggleSfx}
              aria-label={sfxOn ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={sfxVol}
            onChange={e => onSfxVol?.(e.target.value)}
            onPointerUp={() => sfxOn && playHoverTick()}
            className={styles.volSlider}
            disabled={!sfxOn}
            aria-label="SFX volume"
          />
        </div>

      </div>

      <div className={styles.footerLinks}>
        <button className={styles.footerLink} onClick={onAbout}>About Us</button>
        <span className={styles.footerDivider}>·</span>
        <button className={styles.footerLink} onClick={onPrivacy}>Privacy Policy</button>
        <span className={styles.footerDivider}>·</span>
        <button className={styles.footerLink} onClick={onPatchNotes}>What's New</button>
      </div>

      <div className={styles.versionTag}>v{APP_VERSION}</div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
