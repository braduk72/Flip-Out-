import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[FlipOut crash]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#0d0020',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, color: '#fff', padding: 24, textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFD700' }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 280 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{
              marginTop: 8, padding: '12px 32px', borderRadius: 50,
              background: '#FFD700', color: '#1a0040',
              fontSize: 16, fontWeight: 900, border: 'none', cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
