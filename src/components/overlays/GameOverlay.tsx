import React from 'react'
import { C, GAME_CONFIG } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useBLEContext } from '../../context/BLEContext'
import { useAudioContext } from '../../context/AudioContext'

export const GameOverlay: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  // Show start screen when a game is selected but not yet active
  if (!game.selectedGame || game.gameActive) return null

  const g = game.selectedGame
  const cfg = GAME_CONFIG[g.id] || {}

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}>
      <div style={{ width: "100%", maxWidth: 430, borderRadius: "24px 24px 0 0", background: "rgba(6,16,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", padding: "24px 20px 40px", animation: "sheetUp 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
        {/* Game icon + name */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 10, filter: `drop-shadow(0 0 20px ${g.color}60)` }}>{g.emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: -0.5 }}>{g.name}</div>
          {g.desc && <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, maxWidth: 280, margin: "0 auto" }}>{g.desc}</div>}
        </div>

        {/* Game meta */}
        {(g.players || g.time) && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
            {g.players && (
              <div style={{ padding: "5px 12px", borderRadius: 8, background: `${g.color}10`, border: `1px solid ${g.color}20`, fontSize: 10, fontWeight: 700, color: g.color }}>
                👥 {g.players}
              </div>
            )}
            {g.time && (
              <div style={{ padding: "5px 12px", borderRadius: 8, background: `${C.text3}08`, border: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.text2 }}>
                ⏱ {g.time}
              </div>
            )}
            {(g as any).type && (
              <div style={{ padding: "5px 12px", borderRadius: 8, background: `${g.color}10`, border: `1px solid ${g.color}20`, fontSize: 10, fontWeight: 700, color: g.color }}>
                {(g as any).type}
              </div>
            )}
          </div>
        )}

        {/* Device warning */}
        {!player.deviceActivated && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>Connect a Cali Clear device for full rewards! 💨</div>
          </div>
        )}

        {/* Input mode pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { id: "tap", label: "TAP", desc: "On-screen", icon: "👆" },
            { id: "puff", label: "PUFF", desc: "+5% rewards", icon: "💨", needsBle: true },
          ].map(inp => {
            const enabled = inp.id === "tap" || ble.bleConnected
            const active = game.ssInput === inp.id || (!game.ssInput && inp.id === "tap")
            return (
              <div key={inp.id} onClick={() => { if (enabled) { audio.playFx("tap"); game.setSsInput(inp.id) } }} style={{ flex: 1, padding: "10px", borderRadius: 12, cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.4, background: active ? `${g.color}15` : `${C.text3}06`, border: `1px solid ${active ? g.color + "30" : C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{inp.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: active ? g.color : C.text2 }}>{inp.label}</div>
                <div style={{ fontSize: 8, color: C.text3 }}>{inp.desc}</div>
              </div>
            )
          })}
        </div>

        {/* Play button */}
        <div
          onClick={() => {
            audio.playFx("select")
            game.setGameActive({ id: g.id, name: g.name, emoji: g.emoji, color: g.color })
            game.setSelectedGame(null)
          }}
          style={{ width: "100%", padding: "16px", borderRadius: 16, cursor: "pointer", background: `linear-gradient(135deg, ${g.color}, ${g.color}90)`, border: `1px solid ${g.color}40`, textAlign: "center", fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 1, boxShadow: `0 8px 32px ${g.color}30`, touchAction: "none" }}
        >
          PLAY NOW 🎮
        </div>

        {/* Close */}
        <div onClick={() => { audio.playFx("nav"); game.setSelectedGame(null) }} style={{ textAlign: "center", marginTop: 14, padding: "10px", cursor: "pointer", fontSize: 12, color: C.text3, touchAction: "none" }}>
          Cancel
        </div>
      </div>
    </div>
  )
}
