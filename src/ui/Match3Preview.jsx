import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { useMotionMode, usePageVisibility } from './motion.js'
import { advanceMatch3Demo, createMatch3Demo } from './match3Demo.js'
import styles from './components.module.css'

const tokenAsset = Object.fromEntries(['sun', 'moon', 'leaf', 'drop', 'star', 'gem'].map(name => [name, `/ui/match3/token-${name}.svg`]))

export default function Match3Preview({ seed = 20260719, paused = false }) {
  const [demo, setDemo] = useState(() => createMatch3Demo(seed))
  const [resolving, setResolving] = useState(false)
  const motion = useMotionMode()
  const visible = usePageVisibility()
  useEffect(() => {
    if (motion !== 'full' || paused || !visible) return undefined
    let settle
    const timer = window.setInterval(() => {
      setResolving(true)
      settle = window.setTimeout(() => { setDemo(current => advanceMatch3Demo(current)); setResolving(false) }, 220)
    }, 2600)
    return () => { window.clearInterval(timer); window.clearTimeout(settle) }
  }, [motion, paused, visible])
  const cascades = demo.lastCascades.length
  return (
    <div className={`${styles.match3Preview} ${resolving ? styles.previewResolving : ''}`} role="img" aria-label={`Live Match-3 preview using the game engine. Level ${demo.levelId}; ${demo.game.movesRemaining} moves remain${cascades ? `; last move caused ${cascades} cascade${cascades === 1 ? '' : 's'}` : ''}.`} data-demo-step={demo.step} data-demo-paused={motion !== 'full' || paused || !visible ? 'true' : 'false'}>
      <div className={styles.previewBoard} aria-hidden="true">
        {demo.game.board.flatMap((row, r) => row.map((cell, c) => {
          const moved = demo.lastMove && ((demo.lastMove.from.r === r && demo.lastMove.from.c === c) || (demo.lastMove.to.r === r && demo.lastMove.to.c === c))
          return <span key={`${r}:${c}`} className={`${styles.previewTile} ${moved ? styles.previewMoved : ''} ${cell.special ? styles.previewSpecial : ''}`}><img src={tokenAsset[cell.token]} alt=""/>{cell.drop && <b className={styles.previewDrop}>↓</b>}{cell.special && <Icon name="star" size={10}/>}</span>
        }))}
      </div>
      <div className={styles.previewStatus} aria-hidden="true"><span>Level {demo.levelId}</span><span>{cascades ? `${cascades}× cascade` : 'Make a match'}</span></div>
    </div>
  )
}
