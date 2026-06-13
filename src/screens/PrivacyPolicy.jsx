import styles from './PrivacyPolicy.module.css'
import BottomNav from '../components/BottomNav'

export default function PrivacyPolicy({ onBack, navProps }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <img src="/images/back_button.webp" alt="Back" draggable="false" className={styles.backBtnImg} />
        </button>
        <h1 className={styles.title}>Privacy Policy</h1>
      </div>

      <div className={styles.content}>

        <div className={styles.lastUpdated}>Last updated: May 2026</div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>OUR COMMITMENT</div>
          <p className={styles.cardText}>
            Gizmo Games takes your privacy seriously. We want to be completely clear:
            <span className={styles.emphasis}> we do not collect, store, sell or share
            your personal data with any third party for any reason whatsoever.</span> Your
            data is yours and yours alone.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>WHAT WE COLLECT</div>
          <p className={styles.cardText}>
            The only information used by Flip Out! is the minimum necessary to provide
            the game and its services to you:
          </p>
          <ul className={styles.list}>
            <li>Game preferences (difficulty, sound settings) — stored locally on your device only</li>
            <li>Game progress and scores — stored locally on your device only</li>
            <li>Purchased deck unlocks — stored locally on your device, verified against our payment processor solely to confirm your purchase</li>
            <li>A anonymous device identifier — used only to verify purchases and restore them if you reinstall</li>
          </ul>
          <p className={styles.cardText}>
            None of this information is linked to your identity, and none of it ever
            leaves your device except where strictly necessary to deliver a service
            you have explicitly requested (such as verifying a purchase or connecting
            to an online multiplayer game).
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>WHAT WE DO NOT DO</div>
          <ul className={styles.list}>
            <li>We do <strong>not</strong> sell your data — ever, to anyone, under any circumstances</li>
            <li>We do <strong>not</strong> share your data with third parties for marketing or profiling</li>
            <li>We do <strong>not</strong> track your behaviour outside of this app</li>
            <li>We do <strong>not</strong> require you to create an account or provide personal information to play</li>
            <li>We do <strong>not</strong> store any payment card details — all payments are handled securely by Stripe</li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>ADVERTISING</div>
          <p className={styles.cardText}>
            Flip Out! may display advertisements served by Google AdSense. Google may
            use cookies or similar technologies to serve ads based on your prior visits
            to this or other websites. You can opt out of personalised advertising by
            visiting <span className={styles.highlight}>www.aboutads.info</span>.
          </p>
          <p className={styles.cardText}>
            Gizmo Games receives no personal data from Google in connection with ad
            serving, and does not use advertising data for any other purpose.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>MULTIPLAYER</div>
          <p className={styles.cardText}>
            When you play an online multiplayer game, a temporary anonymous session is
            created to connect you with your opponent. No personal information is
            transmitted. Sessions are discarded immediately when the game ends.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>OUR SERVERS</div>
          <p className={styles.cardText}>
            All game data is served via Vercel's global CDN. Our multiplayer servers
            are hosted on Railway in the <span className={styles.emphasis}>EU West
            region (Europe)</span>. No personal data is transferred outside of the
            UK or European Economic Area.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>YOUR RIGHTS</div>
          <p className={styles.cardText}>
            Under UK GDPR and EU GDPR you have the right to access, correct or request
            deletion of any data we hold about you. Since we hold no personal data
            beyond anonymous device identifiers, there is in practice nothing to access
            or delete — but if you have any concerns please contact us and we will
            respond promptly.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>CONTACT</div>
          <p className={styles.cardText}>
            Questions about this policy?
          </p>
          <a href="mailto:support@gizmogames.uk" className={styles.emailLink}>
            support@gizmogames.uk
          </a>
        </div>

        <div className={styles.footer}>
          Gizmo Games · United Kingdom<br />
          Compliant with UK GDPR &amp; EU GDPR<br />
          © 2026 Gizmo Games. All rights reserved.
        </div>

      </div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
