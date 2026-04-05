import { useNavigate } from 'react-router'
import { C, Z } from '@/constants'
import { useArena } from '@/context/ArenaContext'

interface ZoneHeaderProps {
  zoneId: string
  onBack?: () => void
}

const TAGLINES: Record<string, string> = {
  arcade:   'PLAY · COMPETE · WIN',
  stage:    'WATCH · PLAY · WIN',
  oracle:   'PUFF YOUR FORTUNE',
  wall:     'YOUR LEGACY · YOUR GLORY',
  worldcup: 'PLAY · PREDICT · CELEBRATE',
}

export function ZoneHeader({ zoneId, onBack }: ZoneHeaderProps) {
  const navigate = useNavigate()
  const { playFx } = useArena()
  const theme = Z[zoneId]

  const handleBack = () => {
    playFx('back')
    if (onBack) {
      onBack()
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ padding: '0 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, background: `${C.text3}06`, border: `1px solid ${C.border}`, flexShrink: 0 }}
        >
          <span style={{ fontSize: 14, color: C.text2 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>Lobby</span>
        </div>
        <div style={{ fontSize: 9, color: theme?.primary ?? C.text3, letterSpacing: 2, fontWeight: 700, textAlign: 'center', flex: 1 }}>
          {TAGLINES[zoneId] ?? theme?.sub ?? zoneId.toUpperCase()}
        </div>
      </div>
      {theme?.name && (
        <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: -0.5, textShadow: `0 0 30px ${theme.primary}40` }}>
          {theme.name}
        </div>
      )}
    </div>
  )
}
