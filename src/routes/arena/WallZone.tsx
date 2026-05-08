import React, { useState } from 'react'
import { C, WALL_LEADERBOARD, WALL_RECORDS, WALL_ACHIEVEMENTS_RARE, WALL_FRIENDS, WALL_OPPONENTS, WALL_CHAMPIONS, WALL_ACTIVITY } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'
import { ZoneHeader } from './ZoneHeader'

const wallGlass = { borderRadius: 14, background: "rgba(255,255,255,0.025)", border: `1px solid rgba(255,255,255,0.06)`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
const wallGlassGold = { ...wallGlass, border: `1px solid ${C.gold}25`, boxShadow: `0 0 24px ${C.gold}10` }
const rankColors: Record<string, string> = { Diamond: C.cyan, Platinum: "#E5E4E2", Gold: C.gold, Silver: "#C0C0C0", Bronze: "#CD7F32", Legendary: "#FF6B35" }
const zoneTabColors: Record<string, string> = { all: C.gold, arcade: C.cyan, stage: "#FFD93D", fortune: C.gold, tournament: C.orange }

export const WallZone: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()
  const [tab, setTab] = useState("rankings")
  const [wallTab, setWallTab] = useState("all")
  const [wallGameFilter, setWallGameFilter] = useState<string | null>(null)

  const lbData = (WALL_LEADERBOARD as any)[wallTab] || (WALL_LEADERBOARD as any).all || []
  const lbTop10 = lbData.slice(0, 10)
  const youEntry = lbData.find((p: any) => p.isYou)
  const youPos = lbData.indexOf(youEntry) + 1

  return (
    <div style={{ position: "relative" }}>
      {/* Gold particle background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 350, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}12, transparent 65%)` }} />
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: C.gold, opacity: 0.2, left: `${8 + i * 7.5}%`, top: `${20 + Math.sin(i * 1.2) * 60}px`, animation: `pulse ${3 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      {/* Zone header */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ZoneHeader zoneKey="wall" />
        </div>
      </div>

      {/* Feed bar */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600 }}>{(WALL_ACTIVITY[Math.floor(game.tick / 3) % WALL_ACTIVITY.length]?.msg || "Arena is buzzing!")}</span>
        </div>
      </div>

      {/* Champion spotlight */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ borderRadius: 16, padding: "14px 10px 10px", background: `linear-gradient(135deg, ${C.gold}0A, rgba(255,180,0,0.04), ${C.gold}06)`, border: `1px solid ${C.gold}20`, boxShadow: `0 0 30px ${C.gold}08` }}>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.gold, letterSpacing: 3 }}>CHAMPION SPOTLIGHT</div>
            <div style={{ fontSize: 7, color: C.text3, letterSpacing: 1, marginTop: 2 }}>Latest Tournament Winners</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, justifyContent: "center" }}>
            {[1, 0, 2].map(idx => {
              const ch = WALL_CHAMPIONS[idx] as any
              if (!ch) return null
              const isFirst = idx === 0
              const medals = ["🥇", "🥈", "🥉"]
              const podiumColors = [C.gold, "#C0C0C0", "#CD7F32"]
              const podiumH = isFirst ? 130 : idx === 1 ? 110 : 100
              const shortName = ch.tournament?.length > 14 ? ch.tournament.slice(0, 13) + "..." : ch.tournament
              return (
                <div key={idx} style={{ flex: 1, maxWidth: isFirst ? 120 : 100, height: podiumH, borderRadius: 12, padding: "8px 4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: isFirst ? `linear-gradient(180deg, ${C.gold}18, ${C.gold}08)` : `linear-gradient(180deg, ${podiumColors[idx]}10, ${podiumColors[idx]}06)`, border: `1.5px solid ${podiumColors[idx]}${isFirst ? "40" : "20"}`, boxShadow: isFirst ? `0 0 20px ${C.gold}15` : "none", position: "relative", overflow: "hidden" }}>
                  {isFirst && <div style={{ position: "absolute", top: -2, fontSize: 16, animation: "wallFloat 2s ease-in-out infinite alternate", filter: `drop-shadow(0 0 6px ${C.gold}60)` }}>👑</div>}
                  <div style={{ fontSize: isFirst ? 18 : 14, marginTop: isFirst ? 14 : 0 }}>{medals[idx]}</div>
                  <div style={{ width: isFirst ? 32 : 26, height: isFirst ? 32 : 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isFirst ? 18 : 14, background: `${podiumColors[idx]}12`, border: `2px solid ${podiumColors[idx]}${isFirst ? "50" : "30"}` }}>{ch.emoji}</div>
                  <div style={{ fontSize: 6, fontWeight: 800, color: podiumColors[idx], textAlign: "center", lineHeight: 1.2, marginTop: 1 }}>{shortName}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.text, textAlign: "center" }}>{ch.player}</div>
                  <div style={{ fontSize: 10 }}>{ch.flag}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "#3", l: "Your Rank", c: C.cyan }, { v: "8", l: "Records", c: C.gold }, { v: "7/12", l: "Achievements", c: C.green }, { v: "4,200", l: "Season Pts", c: C.orange }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "6px 0", borderRadius: 8, textAlign: "center", background: `${s.c}06`, border: `1px solid ${s.c}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 14px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.gold}15`, marginBottom: 10 }}>
          {["rankings", "records", "achievements", "social"].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", textAlign: "center", cursor: "pointer", fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.gold : C.text3, borderBottom: tab === t ? `2px solid ${C.gold}` : "2px solid transparent" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Rankings */}
        {tab === "rankings" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>📊</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>MEGA LEADERBOARD</div>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 1 }}>THE RANKINGS</div>
              </div>
            </div>
            {/* Zone tab pills */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
              {[{ id: "all", l: "All", e: "🌐" }, { id: "arcade", l: "Arcade", e: "🎮" }, { id: "stage", l: "Stage", e: "🎪" }, { id: "fortune", l: "Fortune", e: "🔮" }, { id: "tournament", l: "Tournament", e: "🏆" }].map(t => {
                const tc = zoneTabColors[t.id] || C.gold
                const sel = wallTab === t.id
                return (
                  <div key={t.id} onClick={() => { setWallTab(t.id); setWallGameFilter(null) }} style={{ padding: "6px 14px", borderRadius: 10, cursor: "pointer", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4, background: sel ? `${tc}18` : `${C.text3}06`, color: sel ? tc : C.text3, border: `1px solid ${sel ? tc + "35" : C.border}`, transition: "all 0.25s", touchAction: "none" }}>
                    <span style={{ fontSize: 11 }}>{t.e}</span>{t.l}
                  </div>
                )
              })}
            </div>
            {/* Leaderboard list */}
            <div style={{ ...wallGlass, overflow: "hidden", borderRadius: 16 }}>
              {lbTop10.map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: i < 9 ? `1px solid ${C.border}` : "none", background: i === 0 ? `${C.gold}06` : p.isYou ? `${C.cyan}06` : "transparent" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < 3 ? 14 : 10, fontWeight: 800, color: i < 3 ? [C.gold, "#C0C0C0", "#CD7F32"][i] : C.text3, background: i < 3 ? `${[C.gold, "#C0C0C0", "#CD7F32"][i]}12` : `${C.text3}08` }}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : (i + 1)}
                  </div>
                  <span style={{ fontSize: 16 }}>{p.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.isYou ? C.cyan : i === 0 ? C.gold : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 8, color: rankColors[p.rank] || C.text3, fontWeight: 600 }}>{p.rank}</div>
                  </div>
                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, fontWeight: 900, color: p.isYou ? C.cyan : i === 0 ? C.gold : C.text2 }}>{p.value?.toLocaleString?.() || p.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: p.trend === "up" ? C.green : p.trend === "down" ? C.red : C.text3 }}>{p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "—"}</div>
                </div>
              ))}
              {youEntry && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: `${C.cyan}08`, borderTop: `1.5px solid ${C.cyan}20` }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: C.cyan }}>#{youPos}</div>
                  <span style={{ fontSize: 15 }}>{youEntry.emoji}</span>
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: C.cyan }}>You</div>
                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 900, color: C.cyan }}>{youEntry.value?.toLocaleString?.() || youEntry.value}</div>
                  <div style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>↑3 from yesterday</div>
                </div>
              )}
            </div>
            <div onClick={() => player.notify("Full rankings coming soon!", C.gold)} style={{ textAlign: "center", padding: "8px 0", cursor: "pointer", marginTop: 6, touchAction: "none" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>View Full Rankings →</span>
            </div>
          </div>
        )}

        {/* Records */}
        {tab === "records" && (
          <div style={{ marginBottom: 14, ...wallGlassGold, padding: "14px 12px", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15, filter: `drop-shadow(0 0 6px ${C.gold}40)` }}>🏅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>ARENA RECORDS</div>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 1 }}>ALL-TIME BESTS</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {(WALL_RECORDS as any[]).map((r, i) => (
                <div key={i} style={{ padding: "8px 8px", borderRadius: 10, background: `${C.text3}04`, border: `1px solid ${C.border}`, position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{r.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: r.today ? C.gold : C.text }}>{r.name}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: r.today ? C.gold : C.cyan, fontFamily: "'Courier New',monospace" }}>{r.value}</div>
                  <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>{r.holder}</div>
                  {r.today && <div style={{ position: "absolute", top: 5, right: 5, padding: "1px 5px", borderRadius: 4, background: `${C.gold}18`, fontSize: 7, fontWeight: 900, color: C.gold }}>NEW</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {tab === "achievements" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(WALL_ACHIEVEMENTS_RARE as any[]).map((a, i) => (
                <div key={i} style={{ flex: 1, padding: "10px 6px", borderRadius: 12, textAlign: "center", ...wallGlassGold }}>
                  <div style={{ fontSize: 24, marginBottom: 3, filter: `drop-shadow(0 0 8px ${C.gold}50)` }}>{a.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>{a.name}</div>
                  <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>{a.pct} unlocked</div>
                </div>
              ))}
            </div>
            <div style={{ ...wallGlass, padding: "10px 12px", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>Your Progress</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: C.cyan }}>7/12 unlocked</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: `${C.text3}10`, overflow: "hidden" }}>
                <div style={{ width: "58%", height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})`, boxShadow: `0 0 8px ${C.cyan}30` }} />
              </div>
            </div>
          </div>
        )}

        {/* Social */}
        {tab === "social" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {(WALL_FRIENDS as any[]).map((f, i) => (
                <div key={i} style={{ minWidth: 80, padding: "10px 6px", borderRadius: 12, textAlign: "center", ...wallGlass, position: "relative" }}>
                  {f.online && <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: 3, background: C.green, boxShadow: `0 0 4px ${C.green}` }} />}
                  <div style={{ fontSize: 22, marginBottom: 3 }}>{f.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name.length > 10 ? f.name.slice(0, 9) + ".." : f.name}</div>
                  <div style={{ fontSize: 7, fontWeight: 600, color: rankColors[f.rank] || C.text3, marginTop: 1 }}>{f.rank}</div>
                  {f.online && <div onClick={() => player.notify("Challenge sent! 🎮", C.cyan)} style={{ marginTop: 4, padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: `${C.cyan}10`, border: `1px solid ${C.cyan}20`, fontSize: 8, fontWeight: 700, color: C.cyan, touchAction: "none" }}>Challenge</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, marginBottom: 8 }}>Recent Opponents</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {(WALL_OPPONENTS as any[]).map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", ...wallGlass, borderRadius: 12 }}>
                  <span style={{ fontSize: 15 }}>{o.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{o.name}</span>
                    <span style={{ fontSize: 9, color: C.text3 }}> - {o.game}</span>
                  </div>
                  <div style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 800, background: o.result === "Won" ? `${C.green}12` : `${C.red}12`, color: o.result === "Won" ? C.green : C.red }}>{o.result === "Won" ? "W" : "L"}</div>
                  <div onClick={() => player.notify("Rematch requested! 🔄", C.cyan)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: `${C.cyan}10`, border: `1px solid ${C.cyan}20`, fontSize: 8, fontWeight: 700, color: C.cyan, touchAction: "none" }}>Rematch</div>
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
