import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('[FlipOut crash]', error, info.componentStack) }
  render() {
    if (this.state.error) return <main className={`${styles.page} foTheme`} data-concept-screen="route" role="alert">
      <section className={styles.panel}>
        <span className={styles.icon} aria-hidden="true">!</span>
        <h1>Something went wrong</h1>
        <p>{this.state.error?.message || 'Unknown error'}</p>
        <button onClick={() => { this.setState({ error: null }); window.location.reload() }}>Reload Flip-Out</button>
      </section>
    </main>
    return this.props.children
  }
}
