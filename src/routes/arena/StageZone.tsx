import React, { useState } from 'react'
import { C, SHOW_GAMES } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'
import { ZoneHeader } from './ZoneHeader'

export const StageZone: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()
  const [tab, setTab] = useState("shows")

  const showIdx = Math.floor(Date.now() / 120000) % SHOW_GAMES.length
  const liveShow = SHOW_GAMES[showIdx]
  const infoIdx = Math.floor(game.tick / 3) % 4
  const infoItems = [
    { text: "Tonight: 12,500 coins up for grabs!", color: C.gold },
    { text: "Next: Simon Puffs in 8m", color: C.cyan },
    { text: "Your Best: Survival Trivia Round 12", color: C.green },
    { text: "Highlight: JACKPOT on Spin & Win!", color: C.pink },
  ]

  const nowViewers = 1247 + Math.floor(game.tick * 7) % 100
  const upcomingShows = SHOW_GAMES.filter((_, i) => i !== showIdx).slice(0, 4)

  return (
    <div style={{ position: "relative" }}>
      {/* Warm theater lighting */}
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 350, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 0%, ${C.gold}14, transparent 50%), radial-gradient(ellipse at 30% 10%, ${C.orange}08, transparent 40%), radial-gradient(ellipse at 70% 10%, ${C.orange}08, transparent 40%)` }} />

      <ZoneHeader zoneKey="stage" />

      {/* Info ticker */}
      <div style={{ padding: "0 14px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, background: `${infoItems[infoIdx].color}06`, border: `1px solid ${infoItems[infoIdx].color}15`, transition: "all 0.5s" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: infoItems[infoIdx].color, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: infoItems[infoIdx].color }}>{infoItems[infoIdx].text}</span>
        </div>
      </div>

      {/* Live show hero */}
      <div onClick={() => { audio.playFx("select"); game.setSelectedGame(liveShow) }} style={{ padding: "0 14px", marginBottom: 12, cursor: "pointer", touchAction: "none" }}>
        <div style={{ padding: "16px", borderRadius: 20, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${liveShow.color}12, ${liveShow.color}04)`, border: `1px solid ${liveShow.color}25` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: `${C.red}18`, border: `1px solid ${C.red}30`, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 8, fontWeight: 800, color: C.red, letterSpacing: 1 }}>ON AIR NOW</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 44, filter: `drop-shadow(0 0 12px ${liveShow.color}60)` }}>{liveShow.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{liveShow.name}</div>
              <div style={{ fontSize: 10, color: C.text2, marginTop: 4 }}>{liveShow.desc}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: C.text3 }}>👥 {nowViewers.toLocaleString()} watching</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: liveShow.color }}>⏱ {liveShow.time}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: `${liveShow.color}15`, border: `1px solid ${liveShow.color}25`, textAlign: "center", fontSize: 12, fontWeight: 800, color: liveShow.color }}>
            JOIN SHOW NOW
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "0 14px" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
          {["shows", "schedule", "leaderboard"].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", textAlign: "center", cursor: "pointer", fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.gold : C.text3, borderBottom: tab === t ? `2px solid ${C.gold}` : "2px solid transparent" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {tab === "shows" && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 8 }}>ALL SHOWS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {SHOW_GAMES.map((g, i) => (
                <div key={g.id} onClick={() => { audio.playFx("select"); game.setSelectedGame(g) }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, cursor: "pointer", background: `radial-gradient(ellipse at 20% 50%, ${g.color}08, ${C.bg2} 70%)`, border: `1px solid ${g.color}15`, animation: `fadeIn 0.3s ease ${i * 0.05}s both`, touchAction: "none" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: `radial-gradient(circle, ${g.color}18, ${g.color}05)`, border: `1px solid ${g.color}22`, flexShrink: 0 }}>{g.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{g.name}</span>
                      {(g as any).live && <span style={{ fontSize: 6, fontWeight: 900, padding: "2px 6px", borderRadius: 4, background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}25` }}>LIVE</span>}
                    </div>
                    <div style={{ fontSize: 9, color: C.text3, lineHeight: 1.4 }}>{g.desc}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: g.color, padding: "2px 6px", borderRadius: 4, background: `${g.color}10` }}>{(g as any).type}</span>
                      <span style={{ fontSize: 8, color: C.text3 }}>👥 {g.players}</span>
                      <span style={{ fontSize: 8, color: C.text3 }}>⏱ {g.time}</span>
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${g.color}12`, border: `1px solid ${g.color}25`, fontSize: 14, color: g.color, flexShrink: 0 }}>▶</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <div style={{ marginBottom: 14 }}>
            {upcomingShows.map((g, i) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: `${C.gold}04`, border: `1px solid ${C.gold}10` }}>
                <span style={{ fontSize: 20 }}>{g.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{g.name}</div>
                  <div style={{ fontSize: 8, color: C.text3 }}>In {15 + i * 20} minutes</div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, padding: "3px 10px", borderRadius: 8, background: `${C.gold}12`, border: `1px solid ${C.gold}20` }}>Remind</div>
              </div>
            ))}
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ marginBottom: 14 }}>
            {["ChillMaster42", "VibeKing", "NeonQueen", "Steve"].map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: i === 3 ? `${C.cyan}06` : `${C.gold}04`, border: `1px solid ${i === 3 ? C.cyan : C.gold}15` }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: [C.gold, "#C0C0C0", "#CD7F32", C.cyan][i] }}>{["🥇", "🥈", "🥉", "#4"][i]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: i === 3 ? C.cyan : C.text }}>{name}{i === 3 ? " (You)" : ""}</div>
                  <div style={{ fontSize: 8, color: C.text3 }}>{[847, 623, 591, 420][i]} wins this season</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: i === 3 ? C.cyan : C.gold }}>{[12580, 9400, 8900, 6300][i].toLocaleString()} 🪙</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  )
}
