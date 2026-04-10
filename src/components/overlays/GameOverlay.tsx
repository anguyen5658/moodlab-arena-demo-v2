import React from 'react'
import { C, GAME_CONFIG, GAME_TOURNAMENTS, LG } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useBLEContext } from '../../context/BLEContext'
import { useAudioContext } from '../../context/AudioContext'

export const GameOverlay: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  if (!game.selectedGame || game.gameActive) return null

  const sg: any = game.selectedGame
  const gc: any = (GAME_CONFIG as any)[sg.id] || {}
  const gColor: string = sg.color || C.cyan
  const gTourney: any = (GAME_TOURNAMENTS as any)[sg.id]

  const {
    ssRole, setSsRole,
    ssOpponent, setSsOpponent,
    ssFortune, setSsFortune,
    ssInput, setSsInput,
    showHowToPlay, setShowHowToPlay,
    setShowBlePopup,
    setSelectedGame,
    setGameActive,
  } = game
  const { bleConnected, bleDevices, partyPlayerNames, ssPlayerCount, setSsPlayerCount, setMpActive } = ble
  const { coins, playerProfile, deviceActivated, notify } = player
  const { playFx } = audio

  // Random hot stat — computed once per render
  const hotStatText: string | null = (gc.hotStats && gc.hotStats.length > 0)
    ? gc.hotStats[Math.floor(Math.random() * gc.hotStats.length)]
    : null

  const streak: number = (playerProfile as any).streak || 0
  const streakBonus: string | null = streak >= 3 ? `+${streak * 2}%` : null

  const zoneName = "Arena"

  const closeOverlay = () => { setSelectedGame(null); setShowHowToPlay(false) }

  const handleStart = () => {
    const hasFortune = gc.fortunePlay && gc.fortunePlay.length > 0
    const needRole = gc.roles && gc.roles.length > 0 && !ssRole
    const needFortune = hasFortune && !ssFortune
    const needInput = bleConnected && !gc.puffGame && !ssInput
    const fortuneNeedsOpp = hasFortune && (ssFortune === "table" || ssFortune === "group") && (!ssOpponent || ssOpponent === "none")
    const arcadeNeedsOpp = !hasFortune && !gc.roles && !gc.solo && !gc.modes && !ssOpponent
    const needOpp = fortuneNeedsOpp || arcadeNeedsOpp
    const needPlayerCount = ssOpponent === "friends" && !ssPlayerCount
    const ready = !needRole && !needFortune && !needOpp && !needInput && !needPlayerCount
    const missing = [needInput && "Input", needRole && "Role", needFortune && "Play Style", needOpp && "Opponent", needPlayerCount && "Player Count"].filter(Boolean) as string[]

    if (!ready) {
      playFx("tap")
      notify("Select " + missing.join(" & ") + " first!", C.orange)
      return
    }
    if (ssOpponent === "friends") setMpActive(true)
    playFx("select")
    setGameActive({
      id: sg.id,
      name: sg.name,
      emoji: sg.emoji,
      color: gColor,
    })
    setSelectedGame(null)
  }

  // ─── Start screen ───
  // Recompute ready state for START button label
  const hasFortune = gc.fortunePlay && gc.fortunePlay.length > 0
  const needRole = gc.roles && gc.roles.length > 0 && !ssRole
  const needFortune = hasFortune && !ssFortune
  const needInput = bleConnected && !gc.puffGame && !ssInput
  const fortuneNeedsOpp = hasFortune && (ssFortune === "table" || ssFortune === "group") && (!ssOpponent || ssOpponent === "none")
  const arcadeNeedsOpp = !hasFortune && !gc.roles && !gc.solo && !gc.modes && !ssOpponent
  const needOpp = fortuneNeedsOpp || arcadeNeedsOpp
  const needPlayerCount = ssOpponent === "friends" && !ssPlayerCount
  const ready = !needRole && !needFortune && !needOpp && !needInput && !needPlayerCount
  const missing = [needInput && "Input", needRole && "Role", needFortune && "Play Style", needOpp && "Opponent", needPlayerCount && "Player Count"].filter(Boolean) as string[]

  // Show Play With?
  const isFortuneNeedOpp = hasFortune && (ssFortune === "table" || ssFortune === "group")
  const isArcadeNeedOpp = !hasFortune && !gc.roles && !gc.solo
  const showPlayWith = isFortuneNeedOpp || isArcadeNeedOpp
  const playWithOpts = ssFortune === "group"
    ? [{ id: "friends", emoji: "\uD83D\uDC65", label: "Friends", color: C.green },
       { id: "random", emoji: "\uD83C\uDFB2", label: "Random", color: C.purple }]
    : [{ id: "ai", emoji: "\uD83E\uDD16", label: "AI", color: C.cyan },
       { id: "friends", emoji: "\uD83D\uDC65", label: "Friends", color: C.green },
       { id: "random", emoji: "\uD83C\uDFB2", label: "Random", color: C.purple }]

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: "hidden", touchAction: "none" }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0, background: `
          radial-gradient(ellipse at 50% 20%, ${gColor}0A 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
          linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
        `
      }} />

      {/* ── Persistent Header ── */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <div style={{ padding: "12px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: C.text3, letterSpacing: 1.5 }}>
            <span style={{ fontWeight: 800, color: C.text2, letterSpacing: 1 }}>
              Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div onClick={() => { playFx("tap"); setShowBlePopup(true) }} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, cursor: "pointer",
              background: bleConnected ? `${C.green}10` : `${C.orange}10`,
              border: `1px solid ${bleConnected ? C.green + "30" : C.orange + "30"}`
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: bleConnected ? C.green : C.orange, boxShadow: bleConnected ? `0 0 6px ${C.green}` : `0 0 6px ${C.orange}` }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
                {bleConnected ? "Connected" : deviceActivated ? "70%" : "Connect"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100, background: `${C.gold}08`, border: `1px solid ${C.gold}15` }}>
              <span style={{ fontSize: 10 }}>🪙</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{coins.toLocaleString()}</span>
            </div>
            {streak >= 2 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100, background: `${C.orange}08`, border: `1px solid ${C.orange}30` }}>
                <span style={{ fontSize: 10 }}>🔥</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: C.orange }}>{streak}</span>
              </div>
            )}
          </div>
        </div>
        {/* Tier XP micro-bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.03)", position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg,${gColor},${C.purple})`, width: "35%" }} />
        </div>
        {/* ← Back */}
        <div style={{ padding: "6px 14px", display: "flex", alignItems: "center" }}>
          <div onClick={() => { playFx("tap"); closeOverlay() }} style={{
            display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
            padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`
          }}>
            <span style={{ fontSize: 11, color: C.text2 }}>{"\u2190"}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text2 }}>{zoneName}</span>
          </div>
        </div>
      </div>

      {/* ── How to Play POPUP OVERLAY ── */}
      {showHowToPlay && gc.htp && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 120, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", animation: "fadeIn 0.2s ease", overflowY: "auto" }}
          onClick={() => setShowHowToPlay(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ minHeight: "100%", padding: "20px 16px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div onClick={() => setShowHowToPlay(false)} style={{
              position: "sticky", top: 12, alignSelf: "flex-end", zIndex: 5,
              width: 32, height: 32, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              background: "rgba(6,16,30,0.9)", border: `1px solid ${C.border}`, fontSize: 14, color: C.text3, backdropFilter: "blur(8px)"
            }}>✕</div>

            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 20, paddingTop: 8 }}>
              <div style={{ fontSize: 40, marginBottom: 6 }}>{sg.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{sg.name}</div>
              <div style={{ fontSize: 10, color: C.text2, marginTop: 4, maxWidth: 280 }}>{sg.desc}</div>
            </div>

            {/* Steps */}
            <div style={{ width: "100%", maxWidth: 340, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginBottom: 10, textAlign: "center" }}>HOW TO PLAY</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {gc.htp.map((step: any, i: number) => (
                  <React.Fragment key={i}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 12, background: `${gColor}08`, border: `1px solid ${gColor}15` }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${gColor}18`, border: `1px solid ${gColor}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{step.e}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: gColor }}>{step.t}</div>
                        <div style={{ fontSize: 8, color: C.text3, lineHeight: 1.4 }}>{step.d}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${gColor}12`, border: `1px solid ${gColor}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: gColor }}>{i + 1}</div>
                    </div>
                    {i < gc.htp.length - 1 && <div style={{ fontSize: 10, color: `${C.text3}60`, lineHeight: 1 }}>{"\u2193"}</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Input Mode */}
            <div style={{ width: "100%", maxWidth: 340, padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: 2, marginBottom: 10, textAlign: "center" }}>INPUT MODES</div>
              <div style={{ display: "grid", gridTemplateColumns: gc.puffGame ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
                {!gc.puffGame && (
                  <div style={{ padding: "8px", borderRadius: 10, textAlign: "center", background: `${C.text3}08`, border: `1px solid ${C.text3}15` }}>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>📱</div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: C.text3 }}>On-Screen</div>
                    <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+0% bonus</div>
                  </div>
                )}
                {!gc.puffGame && (
                  <div style={{ padding: "8px", borderRadius: 10, textAlign: "center", background: `${C.cyan}08`, border: `1px solid ${C.cyan}15` }}>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>💨</div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: C.cyan }}>Dry Puff</div>
                    <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+5% bonus</div>
                  </div>
                )}
                {gc.puffGame && (
                  <div style={{ padding: "8px", borderRadius: 10, textAlign: "center", background: `${C.text3}08`, border: `1px solid ${C.text3}15` }}>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>📱</div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: C.text3 }}>On-Screen</div>
                    <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+0% bonus</div>
                  </div>
                )}
                <div style={{ padding: "8px", borderRadius: 10, textAlign: "center", background: `${C.orange}08`, border: `1px solid ${C.orange}18` }}>
                  <div style={{ fontSize: 16, marginBottom: 3 }}>🔥</div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: C.orange }}>Real Puff</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+15% / Blinker +20%</div>
                </div>
              </div>
              {gc.puffGame && <div style={{ marginTop: 8, textAlign: "center", fontSize: 7, color: C.orange, fontWeight: 700 }}>🔥 PUFF GAME — No Dry Puff allowed</div>}
            </div>

            {/* Puff Streak */}
            <div style={{ width: "100%", maxWidth: 340, padding: "14px", borderRadius: 14, background: `${C.orange}06`, border: `1px solid ${C.orange}15`, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>🔥 PUFF STREAK</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: n * 3 + 10, lineHeight: 1 }}>🔥</div>
                    <div style={{ fontSize: 7, fontWeight: 800, color: C.orange, marginTop: 2 }}>×{n}</div>
                    <div style={{ fontSize: 6, color: C.text3 }}>+{n * 2}%</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 7, color: C.text3, textAlign: "center", lineHeight: 1.5 }}>🔥 Real Puff = builds streak · 💨 Dry = holds · 📱 Tap = breaks</div>
            </div>

            {/* Rewards */}
            <div style={{ width: "100%", maxWidth: 340, padding: "14px", borderRadius: 14, background: `${C.gold}06`, border: `1px solid ${C.gold}15`, marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginBottom: 6, textAlign: "center" }}>🪙 REWARDS</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>{gc.reward || 50}</div>
                  <div style={{ fontSize: 7, color: C.text3 }}>base coins</div>
                </div>
                <div style={{ fontSize: 14, color: C.text3, alignSelf: "center" }}>+</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.orange }}>30%</div>
                  <div style={{ fontSize: 7, color: C.text3 }}>max bonus</div>
                </div>
                <div style={{ fontSize: 14, color: C.text3, alignSelf: "center" }}>=</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.green }}>{Math.round((gc.reward || 50) * 1.3)}</div>
                  <div style={{ fontSize: 7, color: C.text3 }}>max coins</div>
                </div>
              </div>
            </div>

            {/* Got it */}
            <div onClick={() => setShowHowToPlay(false)} style={{
              padding: "12px 40px", borderRadius: 12, cursor: "pointer",
              background: `${gColor}15`, border: `1px solid ${gColor}30`,
              fontSize: 12, fontWeight: 800, color: gColor
            }}>Got it!</div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "8px 16px 100px", display: "flex", flexDirection: "column", alignItems: "center", height: "calc(100% - 70px)" }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${gColor}12, transparent 70%)`, animation: "breathe 4s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`, animation: "breathe 5s ease-in-out 1s infinite", pointerEvents: "none" }} />
        {/* Grid scan overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${gColor}04 1px, transparent 1px), linear-gradient(90deg, ${gColor}04 1px, transparent 1px)`, backgroundSize: "40px 40px", opacity: 0.3, pointerEvents: "none" }} />

        {/* ── Game Header ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8, marginTop: 8, animation: "fadeIn 0.4s ease 0s both" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${gColor}10, transparent 60%)`, pointerEvents: "none" }} />
            <div style={{
              width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: `radial-gradient(circle, ${gColor}25, ${gColor}08)`,
              border: `2px solid ${gColor}35`,
              boxShadow: `0 0 40px ${gColor}25, 0 0 80px ${gColor}10`,
              animation: "breathe 3s ease-in-out infinite", position: "relative", zIndex: 1
            }}>
              <span style={{ fontSize: 36 }}>{sg.emoji}</span>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, textShadow: `0 0 30px ${gColor}50, 0 0 60px ${gColor}20`, marginBottom: 4, textAlign: "center" }}>{sg.name}</div>
          {sg.sub && <div style={{ fontSize: 10, color: C.text2, maxWidth: 300, textAlign: "center", marginBottom: 4 }}>{sg.sub}</div>}
        </div>

        {/* Type badge */}
        {sg.type && (
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", justifyContent: "center", animation: "fadeIn 0.4s ease 0s both" }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: gColor, padding: "2px 8px", borderRadius: 20, ...LG.tinted(gColor), boxShadow: `0 0 8px ${gColor}15` }}>{sg.type}</span>
          </div>
        )}

        {/* ── Puff Mode ── */}
        {bleConnected && !gc.puffGame && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, animation: "fadeIn 0.4s ease 0.05s both" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 4, textTransform: "uppercase" }}>
              Puff Mode {!ssInput && <span style={{ color: C.orange, fontSize: 8 }}>— choose one</span>}
            </div>
            <div style={{ fontSize: 7, color: C.text3, marginBottom: 6 }}>📱 Tap always works (+0%). Choose your puff type for bonus.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => { playFx("tap"); setSsInput("dry") }} style={{
                flex: 1, padding: "10px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden",
                background: ssInput === "dry" ? `${C.cyan}15` : "rgba(255,255,255,0.03)",
                border: `1px solid ${ssInput === "dry" ? C.cyan + "40" : C.border}`,
                boxShadow: ssInput === "dry" ? `0 0 16px ${C.cyan}20` : "none",
                transform: ssInput === "dry" ? "scale(1.02)" : "scale(1)", transition: "all 0.2s"
              }}>
                {ssInput === "dry" && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%, ${C.cyan}10, transparent 60%)`, pointerEvents: "none" }} />}
                <div style={{ fontSize: 20, marginBottom: 3, position: "relative" }}>💨</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: ssInput === "dry" ? C.cyan : C.text, position: "relative" }}>Dry Puff</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2, position: "relative" }}>MIC only · No vapor</div>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.cyan, marginTop: 3, position: "relative" }}>+5% bonus</div>
                {ssInput === "dry" && <div style={{ marginTop: 4, width: 20, height: 3, borderRadius: 2, background: C.cyan, margin: "0 auto" }} />}
              </div>
              <div onClick={() => { playFx("tap"); setSsInput("puff") }} style={{
                flex: 1, padding: "10px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden",
                background: ssInput === "puff" ? `${C.orange}15` : "rgba(255,255,255,0.03)",
                border: `1px solid ${ssInput === "puff" ? C.orange + "40" : C.border}`,
                boxShadow: ssInput === "puff" ? `0 0 16px ${C.orange}20` : "none",
                transform: ssInput === "puff" ? "scale(1.02)" : "scale(1)", transition: "all 0.2s"
              }}>
                {ssInput === "puff" && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%, ${C.orange}10, transparent 60%)`, pointerEvents: "none" }} />}
                <div style={{ fontSize: 20, marginBottom: 3, position: "relative" }}>🔥</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: ssInput === "puff" ? C.orange : C.text, position: "relative" }}>Real Puff</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2, position: "relative" }}>Vapor · Full device</div>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.orange, marginTop: 3, position: "relative" }}>+15% · Blinker +20%</div>
                {ssInput === "puff" && <div style={{ marginTop: 4, width: 20, height: 3, borderRadius: 2, background: C.orange, margin: "0 auto" }} />}
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 7, color: C.text3, textAlign: "center" }}>💡 You can switch puff mode during gameplay with the 🔥⟷💨 toggle</div>
          </div>
        )}
        {bleConnected && gc.puffGame && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: `${C.orange}08`, border: `1px solid ${C.orange}20`, animation: "fadeIn 0.4s ease 0.05s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.orange }}>Puff Game — Real Puff Mode</div>
                <div style={{ fontSize: 7, color: C.text3 }}>This game uses Real Puff for the full experience. 📱 Tap always works (+0%).</div>
              </div>
            </div>
          </div>
        )}
        {!bleConnected && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, animation: "fadeIn 0.4s ease 0.05s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>📱</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>On-Screen Mode</div>
                <div style={{ fontSize: 7, color: C.text3 }}>Connect device for 💨 Dry Puff (+5%) or 🔥 Real Puff (+15%)</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter tags */}
        <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap", justifyContent: "center", animation: "fadeIn 0.4s ease 0s both" }}>
          {sg.hot && <span style={{ fontSize: 7, fontWeight: 800, color: C.red, padding: "2px 7px", borderRadius: 20, background: `${C.red}15`, border: `1px solid ${C.red}25`, animation: "pulse 2s infinite" }}>{"\uD83D\uDD25"} HOT</span>}
          {sg.type === "Luck" && <span style={{ fontSize: 7, fontWeight: 700, color: C.gold, padding: "2px 7px", borderRadius: 20, ...LG.tinted(C.gold) }}>{"\uD83C\uDFB0"} LUCK</span>}
          {sg.live && <span style={{ fontSize: 7, fontWeight: 700, color: C.purple, padding: "2px 7px", borderRadius: 20, ...LG.tinted(C.purple) }}>{"\uD83C\uDF99\uFE0F"} LIVE</span>}
          {sg.players && (parseInt(sg.players) > 1 || String(sg.players).includes("-") || String(sg.players).includes("+"))
            ? <span style={{ fontSize: 7, fontWeight: 700, color: C.cyan, padding: "2px 7px", borderRadius: 20, ...LG.tinted(C.cyan) }}>{"\uD83D\uDC65"} {sg.players}</span>
            : null}
          {sg.time && <span style={{ fontSize: 7, fontWeight: 700, color: C.text3, padding: "2px 7px", borderRadius: 20, ...LG.tinted(C.text3) }}>{"\u23F1"} {sg.time}</span>}
        </div>

        {/* ── Tournament Banner ── */}
        {gTourney && (
          <div onClick={() => { playFx("tap"); notify("\uD83C\uDFC6 " + gTourney.name + " \u2014 Coming in V3!", gColor) }} style={{
            width: "100%", maxWidth: 340, marginBottom: 12, padding: "10px 14px", borderRadius: 12, cursor: "pointer", position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${gColor}12, ${gColor}06)`, border: `1px solid ${C.gold}25`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            animation: "fadeIn 0.4s ease 0.05s both"
          }}>
            <div style={{ position: "absolute", top: 0, left: "-50%", width: "200%", height: "100%", background: `linear-gradient(90deg, transparent, ${C.gold}08, transparent)`, animation: "lightSweep 4s infinite", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 16, filter: `drop-shadow(0 0 8px ${C.gold}60)` }}>{gTourney.emoji}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.text }}>{gTourney.name}</div>
                <div style={{ fontSize: 7, color: C.text3 }}>{gTourney.formatShort} {"\u00B7"} {gTourney.duration}</div>
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.text3, position: "relative", zIndex: 1 }}>{"\u203A"}</span>
          </div>
        )}

        {/* ── Stats ── */}
        {gc.stats && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, animation: "fadeIn 0.4s ease 0.1s both" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>{"\uD83D\uDCCA"} Stats</div>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {gc.stats.map((s: any, i: number) => (
                <div key={i} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center",
                  background: "rgba(255,255,255,0.04)",
                  borderTop: `3px solid ${gColor}`,
                  borderLeft: "1px solid rgba(255,255,255,0.06)",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                  position: "relative", overflow: "hidden"
                }}>
                  <div style={{ position: "absolute", top: 0, left: "-50%", width: "200%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", animation: `lightSweep 5s infinite ${i * 0.5}s`, pointerEvents: "none" }} />
                  <div style={{ fontSize: 16, fontWeight: 900, color: gColor, fontFamily: "'JetBrains Mono',monospace", textShadow: `0 0 10px ${gColor}30`, position: "relative", zIndex: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2, position: "relative", zIndex: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Streak + Win cards */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}10, ${C.red}08)`, border: `1px solid ${C.orange}20`, boxShadow: "0 4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, animation: "pulse 2s infinite" }}>{"\uD83D\uDD25"}</span>
                <div>
                  <span style={{ fontSize: 8, color: C.orange, fontWeight: 700 }}>Streak {"\u00D7"}{streak}{streakBonus ? `=${streakBonus}` : ""}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}10, ${C.gold}05)`, border: `1px solid ${C.gold}20`, boxShadow: "0 4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{"\uD83E\uDE99"}</span>
                <span style={{ fontSize: 8, color: C.gold, fontWeight: 700 }}>Win: {gc.reward || 50}</span>
              </div>
            </div>

            {hotStatText && (
              <div style={{
                fontSize: 8, color: C.text3, fontStyle: "italic",
                padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
                borderLeft: `2px solid ${gColor}`,
                borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                animation: "pulse 2s infinite"
              }}>
                {"\uD83D\uDD25"} &ldquo;{hotStatText}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* ── Choose Role ── */}
        {gc.roles && gc.roles.length > 0 && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, animation: "fadeIn 0.4s ease 0.2s both" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>
              Choose Role {!ssRole && <span style={{ color: C.orange, fontSize: 8 }}>— select one</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {gc.roles.map((r: any) => {
                const sel = ssRole === r.id
                return (
                  <div key={r.id} onClick={() => { playFx("tap"); setSsRole(r.id) }} style={{
                    flex: 1, padding: "12px 10px", borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden",
                    background: sel ? `linear-gradient(135deg, ${gColor}18, ${gColor}08)` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${sel ? gColor + "40" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: sel ? `0 0 20px ${gColor}25, 0 4px 15px rgba(0,0,0,0.3)` : "none",
                    transform: sel ? "scale(1.03)" : "scale(1)",
                    transition: "all 0.2s ease"
                  }}>
                    {sel && <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 44, height: 44, borderRadius: "50%", background: `radial-gradient(circle, ${gColor}20, transparent 60%)`, pointerEvents: "none" }} />}
                    <div style={{ fontSize: 20, marginBottom: 4, position: "relative", zIndex: 1 }}>{r.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: sel ? gColor : C.text, position: "relative", zIndex: 1 }}>{r.name}</div>
                    <div style={{ fontSize: 7, color: C.text3, marginTop: 2, position: "relative", zIndex: 1 }}>{r.sub}</div>
                    {sel && <div style={{ marginTop: 4, width: 24, height: 3, borderRadius: 2, background: gColor, margin: "0 auto", boxShadow: `0 0 8px ${gColor}40` }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Fortune Play Style ── */}
        {gc.fortunePlay && gc.fortunePlay.length > 0 && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, animation: "fadeIn 0.4s ease 0.2s both" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>
              Play Style {!ssFortune && <span style={{ color: C.orange, fontSize: 8 }}>— select one</span>}
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {gc.fortunePlay.map((fp: any) => {
                const sel = ssFortune === fp.id
                const fpColor = fp.id === "solo" ? C.text2 : fp.id === "table" ? C.gold : fp.id === "group" ? C.cyan : C.purple
                return (
                  <div key={fp.id} onClick={() => { playFx("tap"); setSsFortune(fp.id); setSsOpponent(fp.id === "solo" || fp.id === "stream" ? "none" : null) }} style={{
                    flex: 1, minWidth: 0, padding: "10px 6px", borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden",
                    background: sel ? `linear-gradient(135deg, ${fpColor}18, ${fpColor}08)` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${sel ? fpColor + "40" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: sel ? `0 0 20px ${fpColor}25, 0 4px 15px rgba(0,0,0,0.3)` : "none",
                    transform: sel ? "scale(1.03)" : "scale(1)",
                    transition: "all 0.2s ease"
                  }}>
                    {sel && <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 40, height: 40, borderRadius: "50%", background: `radial-gradient(circle, ${fpColor}20, transparent 60%)`, pointerEvents: "none" }} />}
                    <div style={{ fontSize: 18, marginBottom: 3, position: "relative", zIndex: 1 }}>{fp.emoji}</div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: sel ? fpColor : C.text, position: "relative", zIndex: 1 }}>{fp.name}</div>
                    {sel && <div style={{ marginTop: 4, width: 24, height: 3, borderRadius: 2, background: fpColor, margin: "0 auto", boxShadow: `0 0 8px ${fpColor}40` }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Play With ── */}
        {showPlayWith && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, animation: "fadeIn 0.4s ease 0.3s both" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>
              Play With {!ssOpponent && <span style={{ color: C.orange, fontSize: 8 }}>— select one</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {playWithOpts.map(opt => {
                const sel = ssOpponent === opt.id
                return (
                  <div key={opt.id} onClick={() => { playFx("tap"); setSsOpponent(opt.id) }} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden",
                    background: sel ? `linear-gradient(135deg, ${opt.color}18, ${opt.color}08)` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${sel ? opt.color + "40" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: sel ? `0 0 20px ${opt.color}25, 0 4px 15px rgba(0,0,0,0.3)` : "none",
                    transform: sel ? "scale(1.03)" : "scale(1)",
                    transition: "all 0.2s ease"
                  }}>
                    {sel && <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 40, height: 40, borderRadius: "50%", background: `radial-gradient(circle, ${opt.color}20, transparent 60%)`, pointerEvents: "none" }} />}
                    <div style={{ fontSize: 18, marginBottom: 3, position: "relative", zIndex: 1 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: sel ? opt.color : C.text, position: "relative", zIndex: 1 }}>{opt.label}</div>
                    {sel && <div style={{ marginTop: 4, width: 24, height: 3, borderRadius: 2, background: opt.color, margin: "0 auto", boxShadow: `0 0 8px ${opt.color}40` }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Play With Friends — Player Count ── */}
        {ssOpponent === "friends" && (
          <div style={{ width: "100%", maxWidth: 340, marginBottom: 12, animation: "fadeIn 0.4s ease 0.35s both" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(232,235,246,0.4)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>HOW MANY PLAYERS?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[2, 3, 4].map(n => {
                const connectedCount = bleDevices.filter((d: any) => d.connected).length
                const canSelect = n <= Math.max(connectedCount, 1)
                const isSelected = ssPlayerCount === n
                return (
                  <div key={n} data-btn="true" onClick={() => { if (canSelect) { setSsPlayerCount(n); playFx("tap") } }}
                    style={{
                      touchAction: "none", flex: 1, maxWidth: 100, padding: "12px 8px", borderRadius: 14,
                      cursor: canSelect ? "pointer" : "default", textAlign: "center",
                      opacity: canSelect ? 1 : 0.35,
                      background: isSelected ? `linear-gradient(135deg, ${gColor}20, ${gColor}08)` : "rgba(255,255,255,0.02)",
                      border: "1px solid " + (isSelected ? gColor + "40" : "rgba(255,255,255,0.06)"),
                      transform: isSelected ? "scale(1.02)" : "scale(1)", transition: "all 0.2s ease"
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{n === 2 ? "\uD83D\uDC64\uD83D\uDC64" : n === 3 ? "\uD83D\uDC64\uD83D\uDC64\uD83D\uDC64" : "\uD83D\uDC64\uD83D\uDC64\uD83D\uDC64\uD83D\uDC64"}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: isSelected ? gColor : "rgba(232,235,246,0.6)" }}>{n}P</div>
                    <div style={{ fontSize: 7, color: "rgba(232,235,246,0.3)", marginTop: 2 }}>{n} human + AI</div>
                  </div>
                )
              })}
            </div>
            {/* Connected devices summary */}
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(232,235,246,0.35)", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>CONNECTED DEVICES</div>
              {[0, 1, 2, 3].map(slot => {
                const SLOT_COLORS = ["#00E5FF", "#60A5FA", "#FFD93D", "#FF6B8A"]
                const dev = bleDevices.find((d: any) => d.slot === slot)
                const isConn = dev && dev.connected
                return (
                  <div key={slot} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: isConn ? SLOT_COLORS[slot] : "rgba(255,255,255,0.1)" }} />
                    <span style={{ fontSize: 9, color: isConn ? "rgba(232,235,246,0.7)" : "rgba(232,235,246,0.2)" }}>
                      P{slot + 1}: {isConn ? (partyPlayerNames[slot] || ("Player " + (slot + 1))) : "Not connected"}
                    </span>
                  </div>
                )
              })}
              <div data-btn="true" onClick={() => setShowBlePopup(true)} style={{
                touchAction: "none", marginTop: 6, padding: "6px 12px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)",
                fontSize: 9, fontWeight: 700, color: "#00E5FF"
              }}>+ Connect Device</div>
            </div>
          </div>
        )}

        {/* ── How to Play button ── */}
        <div onClick={() => { playFx("tap"); setShowHowToPlay(true) }} style={{
          width: "100%", maxWidth: 340, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 12, cursor: "pointer",
          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
          boxShadow: `0 0 15px ${gColor}08`,
          animation: "fadeIn 0.4s ease 0.4s both"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{"\uD83D\uDCD6"}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>How to Play</span>
          </div>
          <span style={{ fontSize: 10, color: C.text3 }}>{"\u203A"}</span>
        </div>

        {/* ── START Button ── */}
        <div onClick={handleStart} style={{
          width: "100%", maxWidth: 340, padding: ready ? "16px 0" : "14px 0", borderRadius: 14, cursor: "pointer",
          textAlign: "center", position: "relative", overflow: "hidden",
          background: ready ? `linear-gradient(135deg, ${gColor}, ${gColor}DD, ${gColor})` : "rgba(255,255,255,0.04)",
          border: ready ? "none" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: ready ? `0 6px 30px ${gColor}50, 0 0 60px ${gColor}20, inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
          transition: "all 0.3s ease",
          animation: "fadeIn 0.4s ease 0.5s both"
        }}>
          {ready && <div style={{ position: "absolute", top: 0, left: "-50%", width: "200%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", animation: "lightSweep 3s infinite", pointerEvents: "none" }} />}
          {ready && <div style={{ position: "absolute", inset: 0, borderRadius: 14, boxShadow: `0 0 60px ${gColor}20`, animation: "breathe 2s ease-in-out infinite", pointerEvents: "none" }} />}
          <span style={{ fontSize: ready ? 16 : 12, fontWeight: 900, color: ready ? "#000" : C.text3, letterSpacing: ready ? 2 : 1, position: "relative", zIndex: 1 }}>
            {ready ? "\uD83C\uDFAE START" : "Select " + missing.join(" & ")}
          </span>
        </div>
      </div>
    </div>
  )
}
