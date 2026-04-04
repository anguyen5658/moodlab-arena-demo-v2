import { useNavigate, useLocation } from 'react-router'
import { C, GLASS_CLEAR } from '@/constants'
import { useArena } from '@/context/ArenaContext'

const TABS = [
  { id: 'control', label: 'Control', icon: '🎛', path: '/control', color: C.cyan  },
  { id: 'arena',   label: 'Arena',   icon: '🎮', path: '/',        color: C.cyan  },
  { id: 'live',    label: 'Live',    icon: '📡', path: '/live',    color: C.pink  },
  { id: 'me',      label: 'Me',      icon: '👤', path: '/me',      color: C.purple },
]

export function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { playFx, notify } = useArena()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isHub = location.pathname === '/'

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, display: isHub ? 'none' : 'flex', justifyContent: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '4px 5px', borderRadius: 100,
        ...GLASS_CLEAR,
      }}>
        {TABS.map(t => {
          const active = isActive(t.path)
          return (
            <div
              key={t.id}
              onClick={() => {
                playFx('nav')
                if (t.id !== 'arena' && t.id !== 'me' && t.id !== 'live') {
                  notify('Coming Soon — Arena Demo Only', C.cyan)
                  return
                }
                navigate(t.path)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: active ? 5 : 0,
                padding: active ? '9px 14px' : '9px 12px',
                borderRadius: 100, cursor: 'pointer', minHeight: 44,
                background: active ? `${t.color}20` : 'transparent',
                transition: 'all 0.3s ease', position: 'relative',
              }}
            >
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                {t.icon}
              </span>
              {active && (
                <span style={{ fontSize: 11, fontWeight: 700, color: t.color, whiteSpace: 'nowrap' }}>
                  {t.label}
                </span>
              )}
              {t.id === 'live' && (
                <div style={{
                  position: 'absolute', top: 3, right: active ? 8 : 4,
                  width: 5, height: 5, borderRadius: '50%',
                  background: C.red, animation: 'pulse 1.5s infinite',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
