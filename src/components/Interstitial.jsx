import { Modal } from '../ui/components.jsx'
import styles from './Interstitial.module.css'

// No provider is configured. This deliberately cannot emit a successful reward.
export default function Interstitial({ onCancel }) {
  return <Modal open title="Rewarded advert unavailable" tone="danger" onDismiss={onCancel} actions={<button className={styles.action} type="button" onClick={onCancel}>Close</button>}>
    <p>No verified advert provider is configured, so no reward has been granted.</p>
  </Modal>
}
