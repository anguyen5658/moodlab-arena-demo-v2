import { useNavigate } from 'react-router'
import { ZoneHeader } from '@/components/ZoneHeader'
import { C } from '@/constants'

export default function Wall() {
  const navigate = useNavigate()
  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80 }}>
      <ZoneHeader zoneId="wall" onBack={() => navigate('/')} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🏆</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>The Wall</div>
        <div style={{ fontSize: 12, color: C.text2 }}>Leaderboards coming soon...</div>
      </div>
    </div>
  )
}
