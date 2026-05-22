import { useEffect } from 'react'
import styles from './AdBanner.module.css'

export default function AdBanner() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('fo_no_ads')) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (_) {}
  }, [])

  return (
    <div className={styles.wrap}>
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '320px', height: '50px' }}
        data-ad-client="ca-pub-REPLACE_WITH_YOUR_PUB_ID"
        data-ad-slot="REPLACE_WITH_YOUR_SLOT_ID"
      />
    </div>
  )
}
