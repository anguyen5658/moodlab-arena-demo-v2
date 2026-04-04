import { C } from '@/constants'

export default function Live() {
  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>📡</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Live</div>
        <div style={{ fontSize: 12, color: C.text2 }}>Live streaming coming soon...</div>
      </div>
    </div>
  )
}
