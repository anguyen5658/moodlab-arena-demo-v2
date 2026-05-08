import React, { useState } from 'react'
import { C, PLAY_GAMES } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'
import { useGameRouteSync } from '../../hooks/useGameRouteSync'
import { ZoneHeader } from './ZoneHeader'

const playerCounts: Record<string, number> = {
  finalkick: 2100, finalkick2: 356, hotpotato: 890, russian: 167, wildwest: 720,
  balloon: 145, puffpong: 289, rhythm: 134, tugofwar: 312, hooked: 410,
  rps: 540, beatdrop: 245, puffclock: 310, pufflimbo: 178, puffderby: 420,
  tankwar: 680, fishwar: 520, rooftoppuff: 310,
}

const recentActivity = [
  { emoji: "🏆", text: "You won Final Kick vs SmokeBot! +80 coins", time: "5m ago", color: "#FFD93D" },
  { emoji: "🎯", text: "CloudChaser99 just won 500 coins in Wild West!", time: "8m ago", color: "#FB923C" },
  { emoji: "⏱️", text: "NeonQueen set a new Puff Clock record!", time: "12m ago", color: "#00E5FF" },
  { emoji: "🏆", text: "Tournament: Outlaw Circuit Round 2 starting!", time: "20m ago", color: "#FF4444" },
  { emoji: "💣", text: "Hot Potato lobby is FULL - 8/8 players!", time: "25m ago", color: "#FB923C" },
]

const arcadeTournaments = [
  { name: "FK1 World Cup 2026", emoji: "🏆", game: "Final Kick", prize: "50,000 coins", color: "#FFD93D", status: "LIVE", players: 312, round: "Round of 16" },
  { name: "The Outlaw Circuit", emoji: "🤠", game: "Wild West Duel", prize: "25,000 coins", color: "#FB923C", status: "OPEN", players: 148, round: "Qualifying" },
  { name: "Dojo Championship", emoji: "🥋", game: "Tug of War", prize: "15,000 coins", color: "#FF4444", status: "STARTING", players: 96, round: "Round 1" },
  { name: "Pong Masters", emoji: "🏓", game: "Puff Pong", prize: "10,000 coins", color: "#34D399", status: "OPEN", players: 64, round: "Open Entry" },
]

export const ArcadeZone: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()
  const [tab, setTab] = useState("games")
  useGameRouteSync('arcade', PLAY_GAMES)

  const totalPlaying = Object.values(playerCounts).reduce((a, b) => a + b, 0)
  const hotIdx = Math.floor(Date.now() / 4000) % Math.max(PLAY_GAMES.filter(g => g.hot).length, 1)
  const featuredGame = PLAY_GAMES.filter(g => g.hot)[hotIdx] || PLAY_GAMES[0]
  const slideIdx = Math.floor(game.tick / 4) % 4
  const smartSorted = [...PLAY_GAMES].sort((a, b) => {
    if (a.hot && !b.hot) return -1; if (!a.hot && b.hot) return 1
    return (playerCounts[b.id] || 0) - (playerCounts[a.id] || 0)
  })
  const triedGames = ["finalkick", "wildwest", "puffpong", "tugofwar", "rps"]
  const myStats = { gamesPlayed: player.playerProfile.gamesPlayed || 47, winRate: 62, coinsWon: 4200, streak: player.currentWinStreak || 5, bestRecord: "Puff Clock ±0.02s", favGame: PLAY_GAMES[0] }

  const heroSlides = [
    { emoji: featuredGame.emoji, title: featuredGame.name, sub: `${(featuredGame as any).type} · ${playerCounts[featuredGame.id] || 0} playing`, color: featuredGame.color, badge: "🔥 HOT" },
    { emoji: "🏆", title: arcadeTournaments[0].name, sub: `${arcadeTournaments[0].players} entered · ${arcadeTournaments[0].round}`, color: C.gold, badge: "LIVE" },
    { emoji: "🎮", title: "ARCADE", sub: `${PLAY_GAMES.length} Games · ${totalPlaying.toLocaleString()} Playing Now`, color: C.cyan, badge: "LIVE" },
    { emoji: "⚡", title: "Quick Play", sub: "Jump into a random game instantly!", color: "#7FFF00", badge: "INSTANT" },
  ]
  const slide = heroSlides[slideIdx]

  return (
    <div style={{ position: "relative" }}>
      {/* Grid scan bg */}
      <div style={{ position: "absolute", top: -40, left: 0, right: 0, height: 400, pointerEvents: "none", overflow: "hidden", background: `radial-gradient(ellipse at 50% 0%, ${C.cyan}15, transparent 60%)` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(${C.cyan}06 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}06 1px, transparent 1px)`, backgroundSize: "40px 40px", opacity: 0.5 }} />
      </div>

      <ZoneHeader zoneKey="arcade" />

      {/* Hero slide */}
      <div onClick={() => { if (slideIdx === 3) { audio.playFx("select"); game.setSelectedGame(PLAY_GAMES[Math.floor(Math.random() * PLAY_GAMES.length)]) } }} style={{ padding: "0 14px", marginBottom: 10, cursor: "pointer" }}>
        <div style={{ padding: "14px 16px", borderRadius: 16, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20` }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                {slide.badge && <span style={{ fontSize: 6, fontWeight: 900, padding: "2px 6px", borderRadius: 4, background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}25` }}>{slide.badge}</span>}
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{slide.sub}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
            {heroSlides.map((_, i) => (
              <div key={i} style={{ width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? slide.color : `${C.text3}30`, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Live ticker */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${C.cyan}06`, border: `1px solid ${C.cyan}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {["🔥 " + featuredGame.name + " trending · " + (playerCounts[featuredGame.id] || 0) + " playing", "🏆 " + arcadeTournaments[0].name + " starting soon", "⚡ " + recentActivity[0].text, "🎯 " + recentActivity[1].text, "💣 " + recentActivity[4].text][Math.floor(game.tick / 3) % 5]}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: myStats.gamesPlayed, l: "Played", c: C.cyan }, { v: myStats.winRate + "%", l: "Win Rate", c: C.green }, { v: myStats.coinsWon.toLocaleString(), l: "Coins", c: C.gold }, { v: "🔥" + myStats.streak, l: "Streak", c: C.orange }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "6px 0", borderRadius: 8, textAlign: "center", background: `${s.c}06`, border: `1px solid ${s.c}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 14px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
          {["games", "tournaments", "activity", "stats"].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", textAlign: "center", cursor: "pointer", fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.cyan : C.text3, borderBottom: tab === t ? `2px solid ${C.cyan}` : "2px solid transparent" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Games tab */}
        {tab === "games" && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>🎮</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5 }}>ALL GAMES</span>
              </div>
              <span style={{ fontSize: 9, color: C.text3 }}>{PLAY_GAMES.length} games</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {smartSorted.map((g, i) => {
                const isNew = !triedGames.includes(g.id)
                const count = playerCounts[g.id] || 30
                return (
                  <div key={g.id} onClick={() => { audio.playFx("select"); game.setSelectedGame(g) }} style={{ padding: "12px 10px", borderRadius: 14, cursor: "pointer", position: "relative", overflow: "hidden", background: `radial-gradient(ellipse at 50% 0%, ${g.color}10, ${C.bg2} 70%)`, border: `1px solid ${g.color}15`, transition: "all 0.3s", animation: `fadeIn 0.3s ease ${i * 0.04}s both`, touchAction: "none" }}>
                    <div style={{ position: "absolute", top: 6, right: 6, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                      {(g as any).hot && <span style={{ fontSize: 7, fontWeight: 800, color: C.red, padding: "1px 6px", borderRadius: 4, background: `${C.red}18`, border: `1px solid ${C.red}25` }}>🔥 HOT</span>}
                      {isNew && <span style={{ fontSize: 6, fontWeight: 800, color: C.cyan, padding: "1px 5px", borderRadius: 4, background: `${C.cyan}15`, border: `1px solid ${C.cyan}25` }}>NEW FOR YOU</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: `radial-gradient(circle, ${g.color}18, ${g.color}05)`, border: `1px solid ${g.color}22`, filter: `drop-shadow(0 0 8px ${g.color}35)`, boxShadow: `0 0 14px ${g.color}12`, flexShrink: 0 }}>{g.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                        <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>👥 {g.players} · ⏱ {g.time}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: g.color, padding: "2px 6px", borderRadius: 4, background: `${g.color}10` }}>{(g as any).type}</span>
                      <span style={{ fontSize: 7, color: C.green, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: `${C.green}06` }}>
                        <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: C.green, marginRight: 3, verticalAlign: "middle" }} />{count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* WC cross-link */}
            <div onClick={() => { audio.playFx("nav"); game.setWcPhase("team_select") }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, cursor: "pointer", marginTop: 8, background: `linear-gradient(135deg, ${C.gold}08, ${C.green}06)`, border: `1px solid ${C.gold}20`, boxShadow: `0 0 16px ${C.gold}08`, touchAction: "none" }}>
              <span style={{ fontSize: 22 }}>⚽</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>World Cup 2026 Tournament</div>
                <div style={{ fontSize: 8, color: C.text3 }}>Play FK1/FK2/FK3 WC editions, predict matches, win big!</div>
              </div>
              <span style={{ fontSize: 7, fontWeight: 900, color: "#fff", padding: "2px 6px", borderRadius: 4, background: C.gold }}>WC</span>
            </div>
          </div>
        )}

        {/* Tournaments tab */}
        {tab === "tournaments" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {arcadeTournaments.map((t, i) => (
                <div key={i} onClick={() => player.notify(t.name + " — " + t.prize, t.color)} style={{ padding: "10px 10px", borderRadius: 12, cursor: "pointer", background: `radial-gradient(ellipse at 30% 20%, ${t.color}10, ${C.bg2} 70%)`, border: `1px solid ${t.color}20`, touchAction: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span>
                    <div style={{ padding: "1px 5px", borderRadius: 3, background: t.status === "LIVE" ? `${C.red}18` : `${C.green}12`, border: `1px solid ${t.status === "LIVE" ? C.red : C.green}25` }}>
                      <span style={{ fontSize: 6, fontWeight: 900, color: t.status === "LIVE" ? C.red : C.green }}>{t.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.text, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginBottom: 3 }}>{t.game} · {t.players} entered</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.gold }}>🎁 {t.prize}</div>
                  <div style={{ fontSize: 7, color: C.text3 }}>{t.round}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity tab */}
        {tab === "activity" && (
          <div style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.cyan}10`, background: `${C.cyan}03` }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{a.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: C.text2, lineHeight: 1.3 }}>{a.text}</div>
                </div>
                <span style={{ fontSize: 8, color: C.text3, flexShrink: 0, fontFamily: "monospace" }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats tab */}
        {tab === "stats" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {[{ v: myStats.gamesPlayed, l: "Games Played", c: C.cyan }, { v: myStats.winRate + "%", l: "Win Rate", c: C.green }, { v: myStats.coinsWon.toLocaleString(), l: "Coins Won", c: C.gold }, { v: "🔥 " + myStats.streak, l: "Win Streak", c: C.orange }].map((s, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: 12, background: `${s.c}06`, border: `1px solid ${s.c}12`, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: C.text3 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  )
}
