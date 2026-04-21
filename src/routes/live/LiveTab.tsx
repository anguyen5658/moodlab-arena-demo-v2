import React from 'react'
import { C } from '../../constants'
import { LIVE_HERO_SLIDES, LIVE_STREAMS, LIVE_CATEGORIES, LIVE_ARENA_ITEMS, LIVE_CREATORS, LIVE_REACTIONS, LIVE_BADGE } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'

const LiveBadgeTag: React.FC<{ type?: string; s?: number }> = ({ type, s = 9 }) => {
  if (!type || !(LIVE_BADGE as any)[type]) return null
  const b = (LIVE_BADGE as any)[type]
  return (
    <span style={{ fontSize: s, fontWeight: 800, color: b.c, padding: "1px 5px", borderRadius: 4, background: `${b.c}12`, border: `1px solid ${b.c}20` }}>{b.icon} {type}</span>
  )
}

export const LiveTab: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const audio = useAudioContext()

  const openLiveStream = (s: any) => {
    game.setSelectedStream(s)
    game.setLiveScreen("watch")
    game.setLiveViewers(s.viewers || 0)
    game.setLivePuffCount(s.puffs || 0)
    game.setLiveIsFollowingHost(!!game.liveFollowed[s.host])
    audio.playFx("select")
  }

  const addLiveReaction = (emoji: string) => {
    const r = { id: Date.now() + Math.random(), emoji, x: 10 + Math.random() * 80 }
    game.setLiveFloatingReactions(p => [...p.slice(-8), r])
    setTimeout(() => game.setLiveFloatingReactions(p => p.filter(x => x.id !== r.id)), 3000)
  }

  // ── WATCH SCREEN ──
  if (game.liveScreen === "watch" && game.selectedStream) {
    const s = game.selectedStream
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, maxWidth: 430, margin: "0 auto", background: C.bg }}>
        <div style={{ position: "relative", height: "100%", background: s.category === "World Cup" || s.type === "match" ? "linear-gradient(180deg, #0a0515 0%, #0a0f1a 30%, #080518 60%, #050510 100%)" : "linear-gradient(180deg, #0a0515 0%, #1a0a2e 30%, #0c0820 60%, #050510 100%)", overflow: "hidden" }}>

          {/* Ambient theater lights */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-5%", left: "-15%", width: "50%", height: "40%", background: "radial-gradient(ellipse, rgba(244,114,182,0.06) 0%, transparent 70%)", filter: "blur(40px)", animation: "liveAmbientDrift 12s ease-in-out infinite" }} />
            <div style={{ position: "absolute", top: "15%", right: "-10%", width: "45%", height: "35%", background: "radial-gradient(ellipse, rgba(34,211,238,0.05) 0%, transparent 70%)", filter: "blur(50px)", animation: "liveAmbientDrift 15s ease-in-out infinite 3s" }} />
            <div style={{ position: "absolute", bottom: "20%", left: "20%", width: "40%", height: "30%", background: "radial-gradient(ellipse, rgba(192,132,252,0.04) 0%, transparent 70%)", filter: "blur(60px)", animation: "liveAmbientDrift 18s ease-in-out infinite 6s" }} />
            {/* Noise texture */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          </div>

          {/* Top Bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "44px 14px 8px", background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div onClick={() => { game.setLiveScreen("explore"); audio.playFx("nav") }} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", color: C.text }}>←</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: C.red, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, color: "#fff" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} /> LIVE
                </div>
                <span style={{ fontSize: 11, color: C.text2 }}>👁 {game.liveViewers.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: C.text2 }}>💨 {game.livePuffCount.toLocaleString()}</span>
              </div>
              <div onClick={() => player.notify("⚡ Raid feature coming soon!", C.gold)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>⚡</div>
            </div>

            {/* Host info bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}30, ${C.purple}30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{s.host}</span>
                  <LiveBadgeTag type={s.badge} s={9} />
                </div>
                <div style={{ fontSize: 10, color: C.text3 }}>{(s.followers || 0).toLocaleString()} followers</div>
              </div>
              <div onClick={() => { game.setLiveIsFollowingHost(!game.liveIsFollowingHost); game.setLiveFollowed(p => ({ ...p, [s.host]: !game.liveIsFollowingHost })); audio.playFx("coin") }} style={{ padding: "7px 18px", borderRadius: 10, border: game.liveIsFollowingHost ? `1px solid ${C.orange}` : "none", background: game.liveIsFollowingHost ? "transparent" : `linear-gradient(135deg, ${C.orange}, ${C.pink})`, fontSize: 11, fontWeight: 800, color: game.liveIsFollowingHost ? C.orange : "#fff", cursor: "pointer" }}>{game.liveIsFollowingHost ? "✓ Following" : "Follow"}</div>
            </div>
          </div>

          {/* Center Visual */}
          {(s.category === "World Cup" || s.type === "match") && (
            <div style={{ position: "absolute", top: "22%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div><div style={{ fontSize: 44 }}>🇧🇷</div><div style={{ fontSize: 22, fontWeight: 900, color: C.gold, marginTop: 4 }}>2</div></div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>VS</span></div>
                <div><div style={{ fontSize: 44 }}>🇦🇷</div><div style={{ fontSize: 22, fontWeight: 900, color: C.gold, marginTop: 4 }}>1</div></div>
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 8 }}>⏱ 67:32 -- 2nd Half</div>
            </div>
          )}
          {s.category !== "World Cup" && s.type !== "match" && (
            <div style={{ position: "absolute", top: "22%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}15 0%, ${C.pink}08 40%, transparent 70%)`, filter: "blur(20px)", animation: "energyPulse 4s ease-in-out infinite" }} />
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg, ${C.purple}30, ${C.pink}30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, border: `2px solid ${C.purple}40`, animation: "float 3s ease-in-out infinite", boxShadow: `0 0 30px ${C.purple}20, 0 0 60px ${C.pink}10`, position: "relative", zIndex: 1 }}>{s.avatar}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.text2 }}>🎙 Speaking...</div>
            </div>
          )}

          {/* Floating reactions */}
          {game.liveFloatingReactions.map(r => (
            <div key={r.id} style={{ position: "absolute", left: `${r.x}%`, bottom: "35%", fontSize: 24, animation: "liveFloatUp 2.8s ease-out forwards", pointerEvents: "none", zIndex: 5 }}>{r.emoji}</div>
          ))}

          {/* Overlay Cards */}
          <div style={{ position: "absolute", top: "44%", left: 0, right: 0, zIndex: 6 }}>
            <div style={{ display: "flex", gap: 6, padding: "0 12px", marginBottom: 6 }}>
              {([["prediction", "🔮", "Prediction"], ["challenge", "🏁", "Challenge"], ["arena", "🎮", "Halftime"]] as [string, string, string][]).map(([k, ico, lbl]) => (
                <div key={k} onClick={() => game.setLiveActiveCard(k)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${game.liveActiveCard === k ? (k === "arena" ? C.cyan : C.gold) : C.border}`, background: game.liveActiveCard === k ? `${k === "arena" ? C.cyan : C.gold}10` : "transparent", fontSize: 10, fontWeight: 700, color: game.liveActiveCard === k ? (k === "arena" ? C.cyan : C.gold) : C.text3, cursor: "pointer" }}>{ico} {lbl}</div>
              ))}
            </div>
            {game.liveActiveCard === "prediction" && (
              <div style={{ borderRadius: 16, padding: 14, margin: "0 12px", border: "1px solid rgba(255,217,61,0.15)", background: "rgba(255,217,61,0.06)", backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><span>🔮</span><span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>PREDICTION</span><span style={{ fontSize: 10, color: C.text3, marginLeft: "auto" }}>+50 🪙</span></div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Next goal before 75th minute?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["✅ YES", 62], ["❌ NO", 38]].map(([l, p]) => (
                    <div key={l as string} onClick={() => { player.setCoins((c: number) => c + 50); player.notify("+50 coins! Prediction placed", C.gold); audio.playFx("coin") }} style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{l}</div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{p}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {game.liveActiveCard === "challenge" && (
              <div style={{ borderRadius: 16, padding: 14, margin: "0 12px", border: `1px solid ${C.pink}20`, background: `${C.pink}08`, backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span>🏁</span><span style={{ fontSize: 11, fontWeight: 800, color: C.pink }}>CREATOR CHALLENGE</span><span style={{ fontSize: 10, color: C.text3, marginLeft: "auto" }}>100 🪙</span></div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>PUFF RACE</div>
                <div style={{ fontSize: 11, color: C.text2, marginBottom: 10 }}>Most puffs in 30 seconds wins!</div>
                <div onClick={() => { player.notify("Challenge joined! Puff now!", C.pink); audio.playFx("start") }} style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", textAlign: "center", letterSpacing: 1 }}>JOIN CHALLENGE</div>
              </div>
            )}
            {game.liveActiveCard === "arena" && (
              <div style={{ borderRadius: 16, padding: 14, margin: "0 12px", border: `1px solid ${C.cyan}18`, background: `${C.cyan}06`, backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><span>🎮</span><span style={{ fontSize: 11, fontWeight: 800, color: C.cyan }}>HALFTIME -- ARENA MINI-GAME</span></div>
                <div style={{ fontSize: 10, color: C.text2, marginBottom: 10 }}>Halftime break! Play Arena games without leaving the stream.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ icon: "⚽", name: "Final Kick", desc: "Quick 1v1", color: C.gold }, { icon: "🧠", name: "WC Trivia", desc: "5 questions", color: C.purple }].map(g => (
                    <div key={g.name} onClick={() => { player.notify("Mini-game starting...", g.color); audio.playFx("start") }} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: `1px solid ${g.color}25`, background: `${g.color}08`, cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{g.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.name}</div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{g.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 9, color: C.text3, textAlign: "center" }}>⏱ Halftime ends in 12:45 -- game results shown in stream</div>
              </div>
            )}
          </div>

          {/* Bottom — Chat, Reactions, Actions */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 8, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)", padding: "60px 0 0" }}>
            {/* Chat messages */}
            <div style={{ maxHeight: 120, overflow: "hidden", padding: "0 12px", marginBottom: 8, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 20, background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)", zIndex: 1, pointerEvents: "none" }} />
              {game.liveChatMsgs.slice(-5).map((m, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4, display: "flex", gap: 6, alignItems: "flex-start", animation: "liveChatSlideIn 0.3s ease-out" }}>
                  <div style={{ padding: "4px 8px", borderRadius: 10, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6, maxWidth: "90%" }}>
                    <span style={{ fontWeight: 700, color: m.c, flexShrink: 0, fontSize: 11 }}>{m.user}</span>
                    <span style={{ color: C.text2, fontSize: 11 }}>{m.msg}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reaction bar */}
            <div style={{ display: "flex", gap: 5, padding: "0 12px", marginBottom: 8 }}>
              {LIVE_REACTIONS.map((e, i) => (
                <div key={i} onClick={() => { addLiveReaction(e) }} style={{ width: 38, height: 38, borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>{e}</div>
              ))}
            </div>

            {/* Puff + Wave + Tip */}
            <div style={{ display: "flex", gap: 8, padding: "0 12px", marginBottom: 8 }}>
              <div onClick={() => { game.setLivePuffCount(p => p + 1); addLiveReaction("💨"); audio.playFx("puff") }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.blue})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", textAlign: "center", boxShadow: `0 2px 16px ${C.pink}30` }}>💨 PUFF</div>
              <div onClick={() => { for (let i = 0; i < 5; i++) setTimeout(() => addLiveReaction("🌊"), i * 80); player.notify("PUFF WAVE!", C.gold); audio.playFx("win") }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.gold})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", textAlign: "center", boxShadow: `0 2px 16px ${C.gold}30` }}>🌊 WAVE!</div>
              <div onClick={() => game.setLiveShowTip(!game.liveShowTip)} style={{ width: 46, height: 46, borderRadius: 12, border: `1px solid ${C.gold}30`, background: `${C.gold}08`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🪙</div>
            </div>

            {/* Tip panel */}
            {game.liveShowTip && (
              <div style={{ padding: "10px 12px", margin: "0 12px 8px", borderRadius: 14, border: `1px solid ${C.gold}20`, background: "rgba(8,8,25,0.8)", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 8 }}>🪙 Tip {s.host} -- Balance: {player.coins.toLocaleString()}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[10, 50, 100, 500].map(a => (
                    <div key={a} onClick={() => { player.setCoins((p: number) => Math.max(0, p - a)); game.setLiveShowTip(false); addLiveReaction("🪙"); player.notify(`Tipped ${a} coins to ${s.host}!`, C.gold); audio.playFx("coin") }} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${C.gold}20`, background: `${C.gold}08`, fontSize: 13, fontWeight: 700, color: C.gold, cursor: "pointer", textAlign: "center" }}>{a}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat input */}
            <div style={{ display: "flex", gap: 8, padding: "0 12px 16px" }}>
              <input value={game.liveChatInput} onChange={e => game.setLiveChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && game.liveChatInput.trim()) { game.setLiveChatMsgs(p => [...p, { user: "You", msg: game.liveChatInput, c: C.cyan }]); game.setLiveChatInput("") } }} placeholder="Say something..." style={{ flex: 1, padding: "11px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
              <div onClick={() => { if (game.liveChatInput.trim()) { game.setLiveChatMsgs(p => [...p, { user: "You", msg: game.liveChatInput, c: C.cyan }]); game.setLiveChatInput("") } }} style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 12px ${C.pink}30` }}>↑</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── EXPLORE SCREEN ──
  const heroSlide = LIVE_HERO_SLIDES[game.liveHeroIdx]
  const filteredLiveStreams = game.liveCategory === "All" ? LIVE_STREAMS
    : game.liveCategory === "Following" ? LIVE_STREAMS.filter(s => game.liveFollowed[s.host])
    : LIVE_STREAMS.filter(s => s.category === game.liveCategory)

  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      {/* Atmospheric background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0a0515 0%, #050510 30%, #0c0820 60%, #050510 100%)" }} />
        <div style={{ position: "absolute", top: "-10%", left: "-20%", width: "60%", height: "50%", background: "radial-gradient(ellipse, rgba(244,114,182,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "20%", right: "-15%", width: "50%", height: "40%", background: "radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "30%", width: "40%", height: "30%", background: "radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 2 + (i % 2), height: 2 + (i % 2), borderRadius: "50%", background: ["rgba(244,114,182,0.3)", "rgba(34,211,238,0.3)", "rgba(251,191,36,0.2)", "rgba(192,132,252,0.3)"][i % 4], left: `${(i * 8 + 5) % 90}%`, top: `${(i * 7 + 5) % 90}%`, animation: `floatParticle ${8 + (i % 5)}s ease-in-out infinite ${(i % 5) * 0.5}s`, filter: "blur(1px)" }} />
        ))}
        <div style={{ position: "absolute", top: "15%", left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(244,114,182,0.15), rgba(34,211,238,0.1), transparent)", boxShadow: "0 0 20px rgba(244,114,182,0.1)" }} />
      </div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, padding: "2px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, background: "linear-gradient(135deg, #FF4D8D, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Live</span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", boxShadow: `0 0 8px ${C.red}, 0 0 16px ${C.red}60` }} />
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 1, letterSpacing: 0.5 }}>Watch · Stream · Puff Together</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["🔔", "🔍"].map((e, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{e}</div>
          ))}
        </div>
      </div>

      {/* Hero Slider */}
      <div style={{ margin: "8px 14px", borderRadius: 20, overflow: "hidden", position: "relative", zIndex: 1, height: 250, cursor: "pointer" }} onClick={() => openLiveStream({ id: 1, host: heroSlide.host.name, avatar: heroSlide.host.avatar, viewers: 1247, category: "World Cup", title: heroSlide.title, puffs: 3420, badge: heroSlide.host.badge, followers: 12400, type: heroSlide.type })}>
        <div style={{ position: "absolute", inset: 0, background: heroSlide.gradient, transition: "opacity 0.6s ease" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", padding: 18 }}>
          {/* Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 8, background: `${heroSlide.tagColor}15`, border: `1px solid ${heroSlide.tagColor}25` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: heroSlide.tagColor, animation: "pulse 1.2s infinite", boxShadow: `0 0 6px ${heroSlide.tagColor}` }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: heroSlide.tagColor, letterSpacing: 0.5 }}>{heroSlide.tag}</span>
            </div>
          </div>

          {/* Center visual */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {heroSlide.type === "match" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ fontSize: 44, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>{(heroSlide.visual as any).teamA}</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 13, fontWeight: 900, color: C.gold }}>VS</span></div>
                  <div style={{ fontSize: 9, color: C.gold, marginTop: 4, fontWeight: 700, letterSpacing: 1 }}>{(heroSlide.visual as any).score}</div>
                </div>
                <div style={{ fontSize: 44, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>{(heroSlide.visual as any).teamB}</div>
              </div>
            ) : heroSlide.type === "gameshow" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.purple}15`, border: `1.5px solid ${C.purple}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "float 2.5s ease-in-out infinite" }}>{(heroSlide.visual as any).emoji2}</div>
                <div style={{ width: 68, height: 68, borderRadius: 18, background: `${(heroSlide.visual as any).ring}15`, border: `2px solid ${(heroSlide.visual as any).ring}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{(heroSlide.visual as any).emoji}</div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.gold}15`, border: `1.5px solid ${C.gold}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "float 3s ease-in-out infinite 0.5s" }}>{(heroSlide.visual as any).emoji3}</div>
              </div>
            ) : heroSlide.type === "tournament" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.red}12`, border: `2px solid ${C.red}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{(heroSlide.visual as any).p1}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, marginTop: 4 }}>PuffDaddy</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, fontWeight: 900, color: C.gold }}>VS</span></div>
                  <div style={{ fontSize: 8, color: C.gold, marginTop: 3, fontWeight: 700, letterSpacing: 1 }}>FINAL</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.cyan}12`, border: `2px solid ${C.cyan}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{(heroSlide.visual as any).p2}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, marginTop: 4 }}>NeonNinja</div>
                </div>
              </div>
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 20, background: `${(heroSlide.visual as any).ring}12`, border: `2px solid ${(heroSlide.visual as any).ring}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, animation: "float 3s ease-in-out infinite" }}>{(heroSlide.visual as any).emoji}</div>
            )}
          </div>

          {/* Bottom info */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 2, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{heroSlide.title}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>{heroSlide.subtitle}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{heroSlide.host.avatar}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>{heroSlide.host.name}</span>
                <LiveBadgeTag type={heroSlide.host.badge} s={8} />
              </div>
              <span style={{ fontSize: 10, color: C.text3 }}>•</span>
              <span style={{ fontSize: 10, color: C.text3 }}>{heroSlide.meta}</span>
            </div>
            {/* CTA + Dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={e => { e.stopPropagation(); openLiveStream({ id: 1, host: heroSlide.host.name, avatar: heroSlide.host.avatar, viewers: 1247, category: "World Cup", title: heroSlide.title, puffs: 3420, badge: heroSlide.host.badge, followers: 12400, type: heroSlide.type }) }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: `linear-gradient(135deg, ${heroSlide.tagColor}, ${C.orange})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: 0.8, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>{heroSlide.cta}</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {LIVE_HERO_SLIDES.map((_, i) => (
                  <div key={i} onClick={e => { e.stopPropagation(); game.setLiveHeroIdx(i); game.setLiveHeroProgress(0) }} style={{ width: i === game.liveHeroIdx ? 24 : 6, height: 6, borderRadius: 3, cursor: "pointer", background: i === game.liveHeroIdx ? heroSlide.tagColor : "rgba(255,255,255,0.25)", transition: "width 0.3s ease" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 6, padding: "10px 14px", overflowX: "auto" }}>
        {LIVE_CATEGORIES.map(cat => (
          <div key={cat.name} onClick={() => game.setLiveCategory(cat.name)} style={{ padding: "6px 14px", borderRadius: 20, border: game.liveCategory === cat.name ? `1.5px solid ${cat.c}` : `1px solid ${C.border}`, background: game.liveCategory === cat.name ? `${cat.c}12` : "transparent", cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: game.liveCategory === cat.name ? cat.c : C.text3, display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
            <span>{cat.icon}</span> {cat.name}
            {cat.name === "Following" && Object.values(game.liveFollowed).filter(Boolean).length > 0 && (
              <span style={{ background: cat.c, color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 9, fontWeight: 800 }}>{Object.values(game.liveFollowed).filter(Boolean).length}</span>
            )}
          </div>
        ))}
      </div>

      {/* Arena x Live Strip */}
      <div style={{ position: "relative", zIndex: 1, padding: "10px 14px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 12 }}>🎮</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Arena × Live</span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: `${C.cyan}15`, color: C.cyan, fontWeight: 700 }}>CROSS-TAB</span>
          <span style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginLeft: "auto", cursor: "pointer" }}>Go to Arena →</span>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {LIVE_ARENA_ITEMS.map((a, i) => (
            <div key={i} style={{ minWidth: 140, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: a.isLive ? `1px solid ${a.statusColor}20` : `1px solid rgba(255,255,255,0.08)`, flexShrink: 0, position: "relative", overflow: "hidden" }}>
              {a.isLive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${a.statusColor}, transparent)` }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: a.statusColor, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 3 }}>
                    {a.isLive && <span style={{ width: 4, height: 4, borderRadius: "50%", background: a.statusColor, animation: "pulse 1.2s infinite" }} />}
                    {a.status}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 8 }}>{a.sub}</div>
              <div onClick={() => player.notify("Joining stream...", a.statusColor || C.cyan)} style={{ width: "100%", padding: "5px 0", borderRadius: 8, border: `1px solid ${a.statusColor}30`, background: `${a.statusColor}08`, fontSize: 10, fontWeight: 700, color: a.statusColor, cursor: "pointer", textAlign: "center" }}>{a.isLive ? "Watch" : "Remind"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Now */}
      <div style={{ position: "relative", zIndex: 1, padding: "12px 14px 4px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: C.red, animation: "pulse 1.2s infinite" }}>●</span>
          {game.liveCategory === "Following" ? "Following -- Live" : "Live Now"}
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 400, marginLeft: "auto" }}>{filteredLiveStreams.length} streams</span>
        </div>
        {filteredLiveStreams.length === 0 && game.liveCategory === "Following" && (
          <div style={{ textAlign: "center", padding: 32, color: C.text3, fontSize: 13 }}>No followed creators are live.<br />Follow creators below!</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredLiveStreams.map(s => {
            const catColor = s.category === "Chill" ? C.purple : s.category === "Brand" ? C.gold : s.category === "World Cup" ? C.gold : C.cyan
            return (
              <div key={s.id} onClick={() => openLiveStream(s)} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${catColor}, ${catColor}40, transparent)`, borderRadius: "16px 16px 0 0" }} />
                <div style={{ width: 76, height: 76, borderRadius: 14, background: `linear-gradient(135deg, ${C.bg3}, ${catColor}15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, position: "relative", flexShrink: 0, border: `1px solid ${catColor}15` }}>
                  {s.avatar}
                  <div style={{ position: "absolute", top: 5, right: 5, background: C.red, borderRadius: 4, padding: "1px 5px", fontSize: 8, fontWeight: 800, color: "#fff", boxShadow: `0 0 6px ${C.red}60` }}>LIVE</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text3, marginBottom: 4 }}>
                    <span>{s.host}</span><LiveBadgeTag type={s.badge} s={8} />
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.text3 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
                      {s.viewers.toLocaleString()} watching
                    </span>
                    <span>💨 {s.puffs.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Featured Creators */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 14px 4px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          ⭐ Featured Creators
          <span style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginLeft: "auto" }}>See all →</span>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
          {LIVE_CREATORS.map(cr => {
            const ringColor = cr.badge === "vip" ? C.gold : cr.badge === "og" ? C.purple : cr.badge === "mod" ? C.cyan : C.pink
            return (
              <div key={cr.name} style={{ minWidth: 136, padding: 14, textAlign: "center", flexShrink: 0, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${ringColor}40, transparent)` }} />
                <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 8px", background: `linear-gradient(135deg, ${ringColor}20, ${C.bg3})`, border: `2px solid ${ringColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 0 16px ${ringColor}20` }}>
                  {cr.avatar}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{cr.name}</div>
                <LiveBadgeTag type={cr.badge} s={8} />
                <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{cr.followers} followers</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>🕐 {cr.schedule}</div>
                <div onClick={e => { e.stopPropagation(); game.setLiveFollowed(p => ({ ...p, [cr.name]: !p[cr.name] })); audio.playFx("coin") }} style={{ width: "100%", padding: "6px 0", borderRadius: 10, border: game.liveFollowed[cr.name] ? `1px solid ${C.orange}` : "none", background: game.liveFollowed[cr.name] ? "transparent" : `linear-gradient(135deg, ${C.orange}, ${C.pink})`, fontSize: 10, fontWeight: 700, color: game.liveFollowed[cr.name] ? C.orange : "#fff", cursor: "pointer", marginTop: 8, textAlign: "center" }}>
                  {game.liveFollowed[cr.name] ? "✓ Following" : "Follow"}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Go Live FAB */}
      <div style={{ position: "fixed", bottom: 88, right: "calc(50% - 195px)", zIndex: 40 }}>
        <div onClick={() => player.notify("Go Live -- Coming soon!", C.pink)} style={{ width: 62, height: 62, borderRadius: 18, background: `linear-gradient(135deg, ${C.red}, ${C.pink})`, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 24px rgba(236,72,153,0.4), 0 0 40px rgba(236,72,153,0.15)`, position: "relative" }}>
          <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
          📡
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.pink, textAlign: "center", marginTop: 4, letterSpacing: 1, textShadow: `0 0 10px ${C.pink}40` }}>GO LIVE</div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  )
}
