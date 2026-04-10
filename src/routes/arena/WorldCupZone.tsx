import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, PLAY_GAMES, ORACLE_WC_MATCHES, ORACLE_WC_SPECIALS } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'
import { ZoneHeader } from './ZoneHeader'

const wcFeedItems = [
  "🇧🇷 Brazil vs 🇩🇪 Germany tonight!",
  "🔮 1,247 predictions made today",
  "⚽ FK1 WC Champion: CloudChaser99",
  "🏆 Tournament Round of 16 LIVE",
  "🇫🇷 France vs 🇦🇷 Argentina — 38% say Draw!",
  "💨 4,200 WC puffs today",
]

const wcLeaderboard = [
  { name: "CloudChaser99", emoji: "👑", stat: "23 wins", coins: 8400, color: "#FFD93D", badge: "🏆 Champion" },
  { name: "VibeKing", emoji: "😎", stat: "19 wins", coins: 6200, color: "#00E5FF", badge: "⚽ Striker" },
  { name: "NeonQueen", emoji: "👸", stat: "17 wins", coins: 5800, color: "#C084FC", badge: "🔮 Fortune" },
  { name: "Steve", emoji: "🌟", stat: "14 wins", coins: 3200, color: "#34D399", badge: "🇧🇷 Fan", you: true },
  { name: "BlazedPanda", emoji: "🐼", stat: "12 wins", coins: 2900, color: "#FB923C", badge: "🎯 Sniper" },
]

const wcGroupStandings = [
  { group: "A", teams: [{ flag: "🇺🇸", name: "USA", pts: 7, gd: "+4" }, { flag: "🇲🇽", name: "Mexico", pts: 6, gd: "+2" }, { flag: "🇪🇨", name: "Ecuador", pts: 3, gd: "-1" }, { flag: "🇯🇲", name: "Jamaica", pts: 1, gd: "-5" }] },
  { group: "B", teams: [{ flag: "🇧🇷", name: "Brazil", pts: 9, gd: "+7" }, { flag: "🇩🇪", name: "Germany", pts: 6, gd: "+3" }, { flag: "🇳🇬", name: "Nigeria", pts: 3, gd: "-2" }, { flag: "🇳🇿", name: "New Zealand", pts: 0, gd: "-8" }] },
  { group: "C", teams: [{ flag: "🇫🇷", name: "France", pts: 7, gd: "+5" }, { flag: "🇦🇷", name: "Argentina", pts: 7, gd: "+4" }, { flag: "🇸🇦", name: "Saudi Arabia", pts: 3, gd: "-3" }, { flag: "🇦🇺", name: "Australia", pts: 0, gd: "-6" }] },
]

// Days until WC 2026 start (June 11, 2026)
const wcDays = Math.max(0, Math.ceil((new Date("2026-06-11").getTime() - Date.now()) / 86400000))

export const WorldCupZone: React.FC = () => {
  const navigate = useNavigate()
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()
  const [tab, setTab] = useState("games")

  const feedIdx = Math.floor(game.tick / 3) % wcFeedItems.length
  const wcMyStats = { team: "🇧🇷 Brazil", played: 12, predictions: 47, coins: 3200 }

  const launchGame = (id: string) => {
    const g = PLAY_GAMES.find(pg => pg.id === id)
    if (g) { audio.playFx("select"); game.setSelectedGame(g) }
    else player.notify("Coming soon!", C.gold)
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Stadium field gradient */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 180, pointerEvents: "none", zIndex: 0, background: "linear-gradient(to top, rgba(34,197,94,0.06), transparent)" }} />
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 350, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 0%, ${C.gold}18, transparent 50%)` }} />

      <ZoneHeader zoneKey="worldcup" />

      {/* Hero */}
      <div style={{ padding: "0 14px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: 3, marginBottom: 4 }}>🇺🇸 🇲🇽 🇨🇦</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, letterSpacing: 4, textShadow: `0 0 20px ${C.gold}80, 0 0 40px ${C.gold}40`, animation: "pulse 3s ease-in-out infinite" }}>WORLD CUP 2026</div>
        <div style={{ fontSize: 9, color: C.text2, marginTop: 4, fontWeight: 600 }}>June 11 — July 19 · 48 Teams · 104 Matches</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, padding: "4px 14px", borderRadius: 20, background: `${C.gold}08`, border: `1px solid ${C.gold}15` }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{wcDays} DAYS TO GO</span>
          <span style={{ color: C.gold }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>2,847 FANS ONLINE</span>
          </div>
        </div>
      </div>

      {/* Feed bar */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wcFeedItems[feedIdx]}</span>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: wcMyStats.team, l: "Your Team", c: C.gold }, { v: wcMyStats.played, l: "Played", c: C.green }, { v: wcMyStats.predictions, l: "Predictions", c: C.purple }, { v: "+" + wcMyStats.coins.toLocaleString(), l: "Coins Won", c: C.cyan }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "6px 0", borderRadius: 8, textAlign: "center", background: `${s.c}06`, border: `1px solid ${s.c}12` }}>
              <div style={{ fontSize: i === 0 ? 10 : 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 14px", position: "relative", zIndex: 1 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.gold}15`, marginBottom: 10 }}>
          {["games", "schedule", "predictions", "leaderboard"].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", textAlign: "center", cursor: "pointer", fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.gold : C.text3, borderBottom: tab === t ? `2px solid ${C.gold}` : "2px solid transparent" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Games tab */}
        {tab === "games" && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>⚽</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5 }}>WC TOURNAMENT GAMES</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[{ name: "FK1 WC", emoji: "⚽", desc: "Classic WC", color: C.gold, id: "finalkick" }, { name: "FK2 WC", emoji: "🏟️", desc: "Curve Shots", color: C.green, id: "finalkick2" }].map((g, i) => (
                <div key={i} onClick={() => launchGame(g.id)} style={{ padding: "14px 8px", borderRadius: 14, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden", background: `radial-gradient(ellipse at 50% 0%, ${g.color}12, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${g.color}18`, touchAction: "none" }}>
                  <div style={{ position: "absolute", top: 4, right: 4, fontSize: 6, fontWeight: 900, color: "#fff", padding: "1px 5px", borderRadius: 3, background: C.gold }}>WC</div>
                  <div style={{ fontSize: 28, marginBottom: 4, filter: `drop-shadow(0 0 8px ${g.color}50)` }}>{g.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: g.color }}>{g.name}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{g.desc}</div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: "#7FFF00", marginTop: 4 }}>PLAY NOW</div>
                </div>
              ))}
            </div>
            {/* Quick match */}
            <div onClick={() => launchGame("finalkick")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, cursor: "pointer", background: `linear-gradient(135deg, ${C.green}08, ${C.gold}06)`, border: `1px solid ${C.green}15`, marginBottom: 8, touchAction: "none" }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.green }}>Quick Match — Play a Friendly</div>
                <div style={{ fontSize: 8, color: C.text3 }}>No stakes, just fun. Practice your skills!</div>
              </div>
              <span style={{ fontSize: 12, color: C.green }}>→</span>
            </div>
            {/* Tournament bracket */}
            <div style={{ padding: "12px 14px", borderRadius: 14, background: `${C.gold}04`, border: `1px solid ${C.gold}12`, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1 }}>FK1 WORLD CUP TOURNAMENT</span>
                <span style={{ fontSize: 7, fontWeight: 900, color: "#fff", padding: "2px 6px", borderRadius: 4, background: C.red, animation: "pulse 1.5s infinite" }}>LIVE</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {[{ r: "R16", n: 16, c: C.text3 }, { r: "QF", n: 8, c: C.cyan }, { r: "SF", n: 4, c: C.gold }, { r: "F", n: 2, c: C.gold }].map((round, ri) => (
                  <div key={ri} style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRadius: 6, background: ri === 0 ? `${C.gold}12` : `${round.c}06`, border: `1px solid ${ri === 0 ? C.gold : round.c}15` }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: ri === 0 ? C.gold : round.c }}>{round.r}</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>{round.n} teams</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, color: C.text2 }}>312 players competing · Your status: <span style={{ color: C.green, fontWeight: 700 }}>Round of 16</span></div>
            </div>
          </div>
        )}

        {/* Schedule tab */}
        {tab === "schedule" && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>⚽ TODAY'S MATCHES</div>
            {ORACLE_WC_MATCHES.map((m: any, i: number) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: `${C.green}04`, border: `1px solid ${C.green}12` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{m.homeFlag}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.home}</span>
                    <span style={{ fontSize: 9, color: C.text3 }}>vs</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.away}</span>
                    <span style={{ fontSize: 14 }}>{m.awayFlag}</span>
                    {m.hot && <span style={{ fontSize: 6, fontWeight: 900, color: C.red, padding: "1px 4px", borderRadius: 3, background: `${C.red}15` }}>HOT</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 8, color: C.cyan, fontWeight: 700 }}>Group {m.group}</span>
                    <span style={{ fontSize: 8, color: C.text3 }}>{m.time}</span>
                  </div>
                </div>
                <div onClick={() => launchGame("finalkick")} style={{ padding: "4px 10px", borderRadius: 8, cursor: "pointer", background: `${C.purple}12`, border: `1px solid ${C.purple}20`, touchAction: "none" }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: C.purple }}>Predict</span>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginTop: 12, marginBottom: 8 }}>📊 GROUP STANDINGS</div>
            {wcGroupStandings.map((grp, gi) => (
              <div key={gi} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 12, background: `${C.gold}04`, border: `1px solid ${C.gold}10` }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, marginBottom: 6 }}>GROUP {grp.group}</div>
                {grp.teams.map((t, ti) => (
                  <div key={ti} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", borderBottom: ti < 3 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: ti < 2 ? C.green : C.text3, width: 10 }}>{ti + 1}</span>
                    <span style={{ fontSize: 12 }}>{t.flag}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.text, flex: 1 }}>{t.name}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.cyan, width: 30, textAlign: "right" }}>{t.pts} pts</span>
                    <span style={{ fontSize: 8, color: C.text3, width: 24, textAlign: "right" }}>{t.gd}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Predictions tab */}
        {tab === "predictions" && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>🔮 MATCH PREDICTIONS</div>
            {ORACLE_WC_MATCHES.slice(0, 4).map((m: any, i: number) => (
              <div key={m.id} onClick={() => launchGame("finalkick")} style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: 12, marginBottom: 6, cursor: "pointer", background: `${C.purple}04`, border: `1px solid ${C.purple}12`, touchAction: "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{m.homeFlag}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{m.home}</span>
                    <span style={{ fontSize: 9, color: C.text3 }}>vs</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{m.away}</span>
                    <span style={{ fontSize: 14 }}>{m.awayFlag}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.cyan }}>{m.predictions.home}%</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: `${C.text3}15`, overflow: "hidden" }}>
                      <div style={{ display: "flex", height: "100%" }}>
                        <div style={{ width: `${m.predictions.home}%`, background: C.cyan }} />
                        <div style={{ width: `${m.predictions.draw}%`, background: C.gold }} />
                        <div style={{ width: `${m.predictions.away}%`, background: C.pink }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.pink }}>{m.predictions.away}%</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginTop: 12, marginBottom: 8 }}>🏆 TOURNAMENT SPECIALS</div>
            {(ORACLE_WC_SPECIALS as any[]).map((s, i) => (
              <div key={s.id} onClick={() => launchGame("finalkick")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 6, cursor: "pointer", background: `${C.gold}04`, border: `1px solid ${C.gold}12`, touchAction: "none" }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{s.question}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.gold }}>{s.topPick}</span>
                    <span style={{ fontSize: 7, color: C.text3 }}>({s.topPct}%)</span>
                    <span style={{ fontSize: 7, color: C.text3 }}>· {s.total.toLocaleString()} votes</span>
                  </div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: C.purple, padding: "3px 8px", borderRadius: 6, background: `${C.purple}12` }}>Vote</span>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard tab */}
        {tab === "leaderboard" && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>🏆</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5 }}>WC LEADERBOARD</span>
            </div>
            {wcLeaderboard.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: (p as any).you ? `${p.color}10` : `${C.text3}04`, border: (p as any).you ? `1px solid ${p.color}30` : `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: i < 3 ? C.gold : C.text3, width: 18, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1)}</div>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{p.name}</span>
                    {(p as any).you && <span style={{ fontSize: 7, fontWeight: 800, color: "#7FFF00", padding: "1px 5px", borderRadius: 3, background: "rgba(127,255,0,0.15)" }}>YOU</span>}
                    <span style={{ fontSize: 7, fontWeight: 700, color: p.color, padding: "1px 5px", borderRadius: 3, background: `${p.color}12` }}>{p.badge}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 8, color: C.text2, fontWeight: 600 }}>{p.stat}</span>
                    <span style={{ fontSize: 8, color: C.gold, fontWeight: 700 }}>🪙 {p.coins.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => { audio.playFx("nav"); navigate("/arena/wall") }} style={{ marginTop: 12, padding: "10px 14px", borderRadius: 14, background: `${C.cyan}04`, border: `1px solid ${C.cyan}12`, cursor: "pointer", touchAction: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>🧱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan }}>View Full Arena Leaderboard</div>
                  <div style={{ fontSize: 8, color: C.text3 }}>See all-time rankings on The Wall</div>
                </div>
                <span style={{ fontSize: 12, color: C.cyan }}>→</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  )
}
