import React from 'react'
import { useNavigate } from 'react-router-dom'
import { C, Z } from '../../constants'
import { useAudioContext } from '../../context/AudioContext'
import { useGameContext } from '../../context/GameContext'

interface ZoneHeaderProps {
  zoneKey: 'arcade' | 'stage' | 'fortune' | 'wall' | 'worldcup'
}

const TAGLINES: Record<string, string> = {
  arcade: "PLAY · COMPETE · WIN",
  stage: "WATCH · PLAY · WIN",
  fortune: "PUFF YOUR FORTUNE",
  wall: "YOUR LEGACY · YOUR GLORY",
  worldcup: "PLAY · PREDICT · CELEBRATE",
}

export const ZoneHeader: React.FC<ZoneHeaderProps> = ({ zoneKey }) => {
  const navigate = useNavigate()
  const audio = useAudioContext()
  const game = useGameContext()
  const z = Z[zoneKey]

  const handleBack = () => {
    audio.playFx("back")
    game.setSelectedGame(null)
    game.setArenaView("hub")
    navigate("/arena")
  }

  return (
    <div style={{ padding: "0 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={handleBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "6px 12px", borderRadius: 8, background: `${C.text3}06`, border: `1px solid ${C.border}`, flexShrink: 0, touchAction: "none" }}>
          <span style={{ fontSize: 14, color: C.text2 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>Lobby</span>
        </div>
        <div style={{ fontSize: 9, color: z.primary, letterSpacing: 2, fontWeight: 700, textAlign: "center", flex: 1 }}>
          {TAGLINES[zoneKey] || z.sub}
        </div>
      </div>
    </div>
  )
}
