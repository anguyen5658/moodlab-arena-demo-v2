import React from 'react'
import { useNavigate } from 'react-router-dom'
import { C, Z, ARENA_IMAGES, ARENA_VIDEOS, GLASS_CARD, PLAY_GAMES } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { useAudioContext } from '../../context/AudioContext'

const pillStyle = (color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "5px 10px", borderRadius: 100,
  background: `${color}08`, border: `1px solid ${color}15`,
  fontSize: 10, fontWeight: 600, color, whiteSpace: "nowrap",
})

const FocusContent: React.FC<{ zoneKey: string; onEnter: () => void }> = ({ zoneKey, onEnter }) => {
  const game = useGameContext()
  const audio = useAudioContext()

  if (zoneKey === "arcade") {
    return (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          <span style={pillStyle(C.cyan)}>856 playing</span>
          <span style={pillStyle(C.red)}>5 HOT games</span>
          <span style={pillStyle(C.lime)}>3 tournaments live</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {PLAY_GAMES.filter((g: any) => g.hot).slice(0, 3).map((g: any) => (
            <div key={g.id} onClick={() => { onEnter(); audio.playFx("select"); game.setSelectedGame(g) }} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: `${g.color}08`, border: `1px solid ${g.color}15` }}>
              <div style={{ fontSize: 20 }}>{g.emoji}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: g.color, marginTop: 2 }}>{g.name.split(" ")[0]}</div>
              <div style={{ fontSize: 7, color: C.text3 }}>{g.type}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 9, color: C.text2 }}>Win Rate: <span style={{ color: C.lime, fontWeight: 800 }}>62%</span></span>
          <span style={{ fontSize: 9, color: C.text2 }}>Streak: <span style={{ color: C.orange, fontWeight: 800 }}>🔥 5</span></span>
        </div>
      </div>
    )
  }
  if (zoneKey === "stage") {
    return (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          <span style={pillStyle(C.red)}>2 LIVE now</span>
          <span style={pillStyle(C.gold)}>1,247 watching</span>
          <span style={pillStyle(C.lime)}>12,500 coins tonight</span>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "rgba(255,50,50,0.06)", border: "1px solid rgba(255,50,50,0.15)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>🧠 Vibe Check</span>
            <span style={{ fontSize: 9, color: C.text3, marginLeft: "auto" }}>1,247 watching</span>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ fontSize: 9, color: C.text3 }}>Next: </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>🎭 Simon Puffs in 8 min</span>
        </div>
      </div>
    )
  }
  if (zoneKey === "oracle") {
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.gold, letterSpacing: 2, textShadow: `0 0 20px ${C.gold}50, 0 0 40px ${C.gold}25`, fontFamily: "Georgia, serif" }}>THE FORTUNE</div>
          <div style={{ fontSize: 7, color: C.text3, letterSpacing: 2, marginTop: 2 }}>FORTUNE FAVORS THE BOLD</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          <span style={pillStyle(C.gold)}>16 Games</span>
          <span style={pillStyle(C.green)}>Win Rate 62%</span>
          <span style={pillStyle(C.gold)}>Jackpot {Math.floor(game.fortuneJackpot / 1000)}K</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {[{ label: "Sportsbook", emoji: "🔮", color: C.purple }, { label: "Luck", emoji: "🎰", color: C.gold }, { label: "Mystery", emoji: "✨", color: C.orange }].map((a, i) => (
            <div key={i} onClick={onEnter} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: `${a.color}08`, border: `1px solid ${a.color}15` }}>
              <div style={{ fontSize: 20 }}>{a.emoji}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: a.color, marginTop: 2 }}>{a.label}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>🏆 Daily Jackpot: {game.fortuneJackpot.toLocaleString()} coins</span>
        </div>
      </div>
    )
  }
  if (zoneKey === "wall") {
    return (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          <span style={pillStyle(C.orange)}>#3 your rank</span>
          <span style={pillStyle(C.gold)}>8 records</span>
          <span style={pillStyle(C.lime)}>Season 1 active</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
          {[{ pos: "🥈", name: "VibeKing", pts: "2.6K" }, { pos: "🥇", name: "ChillMaster", pts: "2.8K", first: true }, { pos: "🥉", name: "You", pts: "421", isYou: true }].map((p, i) => (
            <div key={i} style={{ textAlign: "center", padding: "6px 10px", borderRadius: 10, background: (p as any).first ? `${C.gold}10` : (p as any).isYou ? `${C.cyan}08` : `${C.text3}06`, border: `1px solid ${(p as any).first ? C.gold + "25" : (p as any).isYou ? C.cyan + "20" : C.text3 + "10"}`, transform: (p as any).first ? "translateY(-4px)" : "none" }}>
              <div style={{ fontSize: 16 }}>{p.pos}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: (p as any).isYou ? C.cyan : C.text, marginTop: 2 }}>{p.name}</div>
              <div style={{ fontSize: 7, color: C.text3 }}>{p.pts}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>🥉 #3 · Gold</span>
          <span style={{ fontSize: 8, color: C.green }}> · ↑3 today</span>
        </div>
      </div>
    )
  }
  if (zoneKey === "worldcup") {
    const wcDays = Math.max(0, Math.ceil((new Date("2026-06-11").getTime() - Date.now()) / 86400000))
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.gold, letterSpacing: 2 }}>WORLD CUP 2026</div>
          <div style={{ fontSize: 10, color: C.text2, marginTop: 2 }}>June 11 — July 19 · USA · Mexico · Canada</div>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 }}>
          {[{ v: wcDays, l: "DAYS", c: C.gold }, { v: 48, l: "TEAMS", c: C.cyan }, { v: 104, l: "MATCHES", c: C.green }, { v: 3, l: "HOST NATIONS", c: C.red }].map((s, i) => (
            <div key={i} style={{ padding: "6px 12px", borderRadius: 10, textAlign: "center", background: `${s.c}08`, border: `1px solid ${s.c}15` }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ emoji: "⚽", label: "Play", color: C.gold }, { emoji: "🔮", label: "Predict", color: C.purple }, { emoji: "🎪", label: "Shows", color: C.pink }].map((a, i) => (
            <div key={i} onClick={onEnter} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: `${a.color}08`, border: `1px solid ${a.color}15` }}>
              <div style={{ fontSize: 16 }}>{a.emoji}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: a.color }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

interface ZoneIntroProps {
  zoneKey: string
}

export const ZoneIntro: React.FC<ZoneIntroProps> = ({ zoneKey }) => {
  const navigate = useNavigate()
  const game = useGameContext()
  const audio = useAudioContext()

  const z = (Z as any)[zoneKey]
  if (!z) return null

  const enterZone = () => {
    audio.playFx("nav")
    if (zoneKey === "worldcup") audio.playFx("stadium_roar")
    navigate(`/arena/${zoneKey}`)
  }

  const goBack = () => {
    audio.playFx("back")
    game.walkTo("hub")
    setTimeout(() => navigate("/arena"), 450)
  }

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* Background video */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <video autoPlay loop muted playsInline poster={(ARENA_IMAGES as any)[zoneKey]} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}>
          <source src={(ARENA_VIDEOS as any)[zoneKey]} type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(5,5,16,0.35) 80%, rgba(5,5,16,0.65) 95%)" }} />
      </div>

      {/* Back button */}
      <div style={{ position: "absolute", top: 72, left: 14, zIndex: 12 }}>
        <div onClick={goBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "7px 14px", borderRadius: 100, ...GLASS_CLEAR }}>
          <span style={{ fontSize: 12, color: C.text2 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>Lobby</span>
        </div>
      </div>

      {/* Bottom HUD — info card */}
      <div style={{ position: "absolute", bottom: 62, left: 10, right: 10, zIndex: 10, animation: "panelSlideUp 0.4s ease 0.15s both" }}>
        <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 8, ...GLASS_CARD }}>
          <div style={{ padding: "16px 18px 14px" }}>
            <div style={{ marginBottom: 14 }}>
              <FocusContent zoneKey={zoneKey} onEnter={enterZone} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div onClick={enterZone} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 28px", borderRadius: 100, cursor: "pointer", background: `${z.primary}12`, border: `1px solid ${z.primary}30`, boxShadow: `0 0 20px ${z.primary}12, inset 0 1px 0 rgba(255,255,255,0.12)`, transition: "all 0.2s ease" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: z.primary, letterSpacing: 0.5 }}>Enter {z.name}</span>
                <span style={{ fontSize: 14, color: z.primary }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
