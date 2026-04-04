import { useNavigate } from 'react-router'
import { C, Z } from '@/constants'
import { useArena } from '@/context/ArenaContext'

interface ZoneHeaderProps {
  zoneId: string
  onBack?: () => void
  title?: string
  subtitle?: string
}

export function ZoneHeader({ zoneId, onBack, title, subtitle }: ZoneHeaderProps) {
  const navigate = useNavigate()
  const { playFx } = useArena()
  const theme = Z[zoneId]

  const handleBack = () => {
    playFx('back')
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 16px 12px',
      borderBottom: `1px solid ${theme?.primary ?? C.border}20`,
    }}>
      {/* Back button */}
      <button
        onClick={handleBack}
        style={{
          width: 36, height: 36, borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: C.text, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >←</button>

      {/* Zone info */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
          {title ?? (theme ? `${theme.icon} ${theme.name}` : zoneId)}
        </div>
        {(subtitle ?? theme?.sub) && (
          <div style={{ fontSize: 11, color: theme?.primary ?? C.text2, marginTop: 1 }}>
            {subtitle ?? theme?.sub}
          </div>
        )}
      </div>
    </div>
  )
}
