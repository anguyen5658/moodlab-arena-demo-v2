import React from 'react'
import ReactDOM from 'react-dom/client'
import MoodLabArena from './App'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; info: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info })
    console.error('GAME RENDER ERROR:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: '#1a0000', color: '#ff4444', padding: 20, fontFamily: 'monospace', fontSize: 12, overflow: 'auto' }}>
          <h2 style={{ color: '#ff6666', marginBottom: 10 }}>GAME RENDER ERROR</h2>
          <pre style={{ color: '#ffaaaa', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{String(this.state.error)}</pre>
          <pre style={{ color: '#ff8888', marginTop: 10, fontSize: 10, whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack || ''}</pre>
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{ marginTop: 20, padding: '10px 20px', background: '#ff4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            DISMISS &amp; RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <MoodLabArena />
  </ErrorBoundary>
)
