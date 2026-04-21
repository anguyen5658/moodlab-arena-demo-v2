import React from 'react'
import { C } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'

const TANKS = [
  { name: "PURPLE HAZE", type: "THC · Sativa", color: "#a855f7" },
  { name: "DUTCH TREAT", type: "CBD · Hybrid", color: "#22c55e" },
]
const HEAT_LABELS = ["OFF", "CHILL", "MED", "INTENSE"]
const HEAT_COLORS = [C.text3, C.blue, C.green, C.orange]

export const ControlTab: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()

  return (
    <div style={{ padding: "0 14px" }}>
      {/* Device panel */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 18, padding: "16px 14px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {TANKS.map((t, i) => (
            <div key={i} onClick={() => {
              const h = [...game.controlHeat]
              h[i] = (h[i] + 1) % 4
              game.setControlHeat(h)
              audio.playFx("tap")
              player.notify(`${t.name}: ${HEAT_LABELS[(game.controlHeat[i] + 1) % 4]}`, HEAT_COLORS[(game.controlHeat[i] + 1) % 4])
            }} style={{ flex: 1, padding: "12px 10px", borderRadius: 12, cursor: "pointer", background: `${t.color}08`, border: `1px solid ${t.color}20`, touchAction: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: game.controlHeat[i] > 0 ? t.color : C.text3 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: HEAT_COLORS[game.controlHeat[i]] }}>{HEAT_LABELS[game.controlHeat[i]]}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{t.name}</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>{t.type}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ l: "PUFFS", v: "047", c: C.cyan }, { l: "VOLTAGE", v: "2.8V", c: C.orange }, { l: "BATTERY", v: "78%", c: C.green }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "8px", borderRadius: 10, textAlign: "center", background: `${s.c}06`, border: `1px solid ${s.c}10` }}>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 8, color: C.text3, fontWeight: 600, letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood modes */}
      <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: 1.5, marginBottom: 8 }}>MOOD MODES</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[
          { n: "Relax", e: "😌", c: C.blue }, { n: "Focus", e: "🎯", c: C.gold }, { n: "Energy", e: "⚡", c: C.green }, { n: "Sleep", e: "🌙", c: C.purple },
          { n: "Social", e: "🎉", c: C.pink }, { n: "Creative", e: "🎨", c: C.orange }, { n: "Recovery", e: "💚", c: C.cyan }, { n: "Custom", e: "⚙️", c: C.text2 },
        ].map((m, i) => (
          <div key={i} onClick={() => { audio.playFx("tap"); player.notify(`${m.n} Mode`, m.c) }} style={{ padding: "10px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: `${m.c}06`, border: `1px solid ${m.c}12`, touchAction: "none" }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{m.e}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: m.c }}>{m.n}</div>
          </div>
        ))}
      </div>

      {/* Live score */}
      <div style={{ marginTop: 16, padding: "14px", borderRadius: 16, background: `${C.gold}06`, border: `1px solid ${C.gold}15` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.text3, letterSpacing: 1.5, marginBottom: 8 }}>⚽ LIVE MATCH</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>🇧🇷</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>Brazil</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: 28, fontWeight: 900, color: C.gold }}>{game.liveScore.home}</span>
              <span style={{ fontSize: 14, color: C.text3 }}>—</span>
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: 28, fontWeight: 900, color: C.gold }}>{game.liveScore.away}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, animation: "pulse 1.5s infinite" }} />
              <div style={{ fontSize: 8, color: C.red, fontWeight: 700 }}>{game.liveScore.min}'</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>🇦🇷</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>Argentina</div>
          </div>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  )
}
