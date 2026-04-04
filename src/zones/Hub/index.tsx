import { useNavigate } from 'react-router'
import { C, Z, ARENA_IMAGES } from '@/constants'
import { useArena } from '@/context/ArenaContext'

const ZONES = [
  { id: 'arcade',   path: '/arcade'   },
  { id: 'stage',    path: '/stage'    },
  { id: 'oracle',   path: '/fortune'  },
  { id: 'wall',     path: '/wall'     },
  { id: 'worldcup', path: '/worldcup' },
] as const

export default function Hub() {
  const navigate = useNavigate()
  const { playFx } = useArena()

  return (
    <div style={{
      height: '100%', background: C.bg,
      overflowY: 'auto', paddingBottom: 80,
    }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={ARENA_IMAGES.hub}
          alt="Hub"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(5,5,16,1))',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end', paddingBottom: 20,
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>🏟️ MOOD LAB ARENA</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>Choose your zone</div>
        </div>
      </div>

      {/* Zone cards */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {ZONES.map(z => {
            const theme = Z[z.id]
            if (!theme) return null
            return (
              <div
                key={z.id}
                onClick={() => { playFx('nav'); navigate(z.path) }}
                style={{
                  borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                  border: `1px solid ${theme.primary}30`,
                  background: `${theme.primary}08`,
                  padding: 16, position: 'relative',
                  transition: 'transform 0.15s',
                }}
              >
                <div style={{ fontSize: 28 }}>{theme.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 6 }}>
                  {theme.name}
                </div>
                <div style={{ fontSize: 10, color: theme.primary, marginTop: 2 }}>
                  {theme.sub}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}00)`,
                }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
