import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { C, GLASS_CLEAR } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'

const TABS = [
  { id: "control", l: "Control", i: "🎛", c: C.cyan },
  { id: "arena", l: "Arena", i: "🎮", c: C.cyan },
  { id: "live", l: "Live", i: "📡", c: C.pink },
  { id: "me", l: "Me", i: "👤", c: C.purple },
]

export const BottomNav: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()

  const tab = location.pathname.startsWith('/control') ? 'control'
    : location.pathname.startsWith('/live') ? 'live'
    : location.pathname.startsWith('/me') ? 'me'
    : 'arena'

  // Hide during active games
  if (game.gameActive || game.matchmaking) return null

  const handleNavClick = (tabId: string) => {
    audio.playFx("nav")
    if (tabId === 'control') {
      player.notify("Coming Soon — Arena Demo Only", C.cyan)
      return
    }
    if (tabId === 'arena') {
      navigate('/arena')
      game.setSelectedGame(null)
      game.setGameActive(null)
      game.setArenaView('hub')
    } else if (tabId === 'live') {
      navigate('/live')
      game.setLiveScreen('explore')
    } else if (tabId === 'me') {
      navigate('/me')
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 16, left: 0, right: 0, zIndex: 55, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "4px 5px", borderRadius: 100, pointerEvents: "auto", ...GLASS_CLEAR }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <div key={t.id} onClick={() => handleNavClick(t.id)} style={{ display: "flex", alignItems: "center", gap: active ? 5 : 0, padding: active ? "7px 14px" : "7px 10px", borderRadius: 100, cursor: "pointer", background: active ? `${t.c}20` : "transparent", transition: "all 0.3s ease", position: "relative" }}>
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.4, transition: "opacity 0.3s" }}>{t.i}</span>
              {active && <span style={{ fontSize: 11, fontWeight: 700, color: t.c, whiteSpace: "nowrap" }}>{t.l}</span>}
              {t.id === "live" && <div style={{ position: "absolute", top: 3, right: active ? 8 : 4, width: 5, height: 5, borderRadius: "50%", background: C.red, animation: "pulse 1.5s infinite" }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
