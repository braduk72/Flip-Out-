import { Modal } from '../ui/components.jsx'
import { createTransactionId, economy } from '../utils/economyService.js'
import styles from './RemoveAdsModal.module.css'

const PERKS = ['Remove forced adverts', 'Remove banner adverts', 'Keep optional rewarded adverts']

export default function RemoveAdsModal({ onClose, onBuy }) {
  const already = Boolean(localStorage.getItem('fo_no_ads'))
  function handleBuy(tier) {
    economy.applyTransaction({
      id: createTransactionId(`legacy-remove-ads:${tier}`),
      source: 'legacy-remove-ads',
      changes: { counters: { coins: tier === 'bundle' ? 555 : 0 }, flags: { fo_no_ads: '1' } },
    })
    onBuy?.()
    onClose()
  }
  return <Modal open title="Remove advertising" onDismiss={onClose} actions={!already && <button className={styles.secondary} onClick={onClose}>Not now</button>}>
    <div className={styles.perks}>{PERKS.map(perk => <p key={perk}><span aria-hidden="true">✓</span>{perk}</p>)}</div>
    {already ? <p className={styles.already}>Advertising is already removed on this account.</p> : <div className={styles.tiers}>
      <button className={styles.tier} onClick={() => handleBuy('basic')}><strong>No adverts</strong><span>£7.99</span></button>
      <button className={`${styles.tier} ${styles.featured}`} onClick={() => handleBuy('bundle')}><small>Best value</small><strong>No adverts + 555 Coins</strong><span>£11.99</span></button>
    </div>}
  </Modal>
}
