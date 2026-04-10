import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { C, TICKER_ITEMS, LOYALTY_TIERS, Z } from '../../constants'
import { usePlayerContext } from '../../context/PlayerContext'
import { useBLEContext } from '../../context/BLEContext'
import { useGameContext } from '../../context/GameContext'
import { useAudioContext } from '../../context/AudioContext'
import { BLEPopup } from '../overlays/BLEPopup'
import { GameOverlay } from '../overlays/GameOverlay'
import { BottomNav } from './BottomNav'

const CSS_KEYFRAMES = `
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes scanLine{0%{transform:translateY(-100%)}100%{transform:translateY(20000%)}}
@keyframes spotlightSweep{0%{transform:translateX(-100%) rotate(15deg)}50%{transform:translateX(400%) rotate(15deg)}100%{transform:translateX(-100%) rotate(15deg)}}
@keyframes breathe{0%,100%{opacity:1;transform:scale(1) translateX(-50%)}50%{opacity:.7;transform:scale(1.05) translateX(-50%)}}
@keyframes breatheSimple{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{0%{transform:scale(0) rotate(-10deg);opacity:0}100%{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes rewardFloatUp{0%{opacity:0;transform:translateX(-50%) translateY(0) scale(0.5)}15%{opacity:1;transform:translateX(-50%) translateY(-20px) scale(1.1)}60%{opacity:0.8;transform:translateX(-50%) translateY(-60px) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-120px) scale(0.8)}}
@keyframes floatUp{0%{opacity:0;transform:translateY(0)}15%{opacity:0.8}85%{opacity:0.5}100%{opacity:0;transform:translateY(-400px)}}
@keyframes zoneEntry{from{opacity:0;transform:scale(0.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes borderShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes lightSweep{0%{transform:translateX(-200%) skewX(-15deg)}100%{transform:translateX(400%) skewX(-15deg)}}
@keyframes jumbotronProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes portalParticle{0%{opacity:0;transform:translateY(0) scale(0.5)}20%{opacity:0.7;transform:translateY(-10px) scale(1)}100%{opacity:0;transform:translateY(-65px) scale(0.3)}}
@keyframes gridScan{0%{transform:translateY(100%)}100%{transform:translateY(-100%)}}
@keyframes energyPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.15}50%{transform:translate(-50%,-50%) scale(1.15);opacity:0.04}}
@keyframes gentleFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes liveFloatUp{0%{opacity:1;transform:translateY(0) scale(1)}40%{opacity:.9;transform:translateY(-50px) scale(1.15)}100%{opacity:0;transform:translateY(-150px) scale(.7)}}
@keyframes floatParticle{0%,100%{transform:translateY(0) translateX(0);opacity:0.3}25%{transform:translateY(-20px) translateX(10px);opacity:0.6}50%{transform:translateY(-10px) translateX(-5px);opacity:0.4}75%{transform:translateY(-30px) translateX(15px);opacity:0.5}}
@keyframes liveChatSlideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes liveReactionPop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes liveAmbientDrift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(5px,-8px) scale(1.05)}66%{transform:translate(-5px,5px) scale(0.97)}}
@keyframes countPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes arenaFadeIn{from{opacity:0;transform:translateY(15px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes glowShift{0%,100%{box-shadow:0 0 40px rgba(0,229,255,0.06),0 0 80px rgba(255,217,61,0.03)}50%{box-shadow:0 0 60px rgba(192,132,252,0.06),0 0 100px rgba(255,77,141,0.03)}}
@keyframes neonFlicker{0%,18%,22%,25%,53%,57%,100%{opacity:1}20%{opacity:0.6}24%{opacity:0.8}55%{opacity:0.7}}
@keyframes walkFlash{0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}}
@keyframes loadingImageReveal{0%{opacity:0;transform:scale(1.1)}60%{opacity:0.6;transform:scale(1.03)}100%{opacity:0.8;transform:scale(1)}}
@keyframes loadingTextReveal{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
@keyframes loadingBar{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
@keyframes panelSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes glassFloatIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}10%{transform:translateX(-4px) rotate(-0.5deg)}30%{transform:translateX(4px) rotate(0.5deg)}50%{transform:translateX(-3px)}70%{transform:translateX(3px)}90%{transform:translateX(-1px)}}
@keyframes flashOverlay{0%{opacity:0.8}100%{opacity:0}}
@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(400px) translateX(40px) rotate(720deg);opacity:0}}
@keyframes aiProgress{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes smokeRise{0%{transform:scale(0.5) translateY(0);opacity:0.15}50%{opacity:0.08}100%{transform:scale(2.5) translateY(-150px);opacity:0}}
@keyframes slideInLeft{from{transform:translateX(-80px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideInRight{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes bubbleFloat{0%{transform:translateY(0) scale(1);opacity:0.6}50%{opacity:0.4}100%{transform:translateY(-200px) scale(0.3) translateX(20px);opacity:0}}
@keyframes goalBurst{0%{transform:scale(0.3);opacity:0}40%{transform:scale(1.15);opacity:1}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
@keyframes atmosSmokeDrift{0%{transform:translateX(0) translateY(0) scale(1)}50%{transform:translateX(30px) translateY(-20px) scale(1.3)}100%{transform:translateX(-20px) translateY(10px) scale(0.9)}}
@keyframes atmosLightning{0%{opacity:0.12}50%{opacity:0}80%{opacity:0.06}100%{opacity:0}}
@keyframes atmosGoldFloat{0%{transform:translateY(0) scale(1);opacity:0.7}50%{transform:translateY(-15px) scale(1.2);opacity:1}100%{transform:translateY(0) scale(1);opacity:0.7}}
@keyframes atmosGoldPulse{0%,100%{opacity:1;text-shadow:0 0 10px currentColor}50%{opacity:0.6;text-shadow:0 0 20px currentColor,0 0 40px currentColor}}
@keyframes specErupt{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
@keyframes specEruptFlash{0%{opacity:1}100%{opacity:0}}
@keyframes specTickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes puffReactFloat{0%{opacity:0;transform:translateY(0) scale(0.5)}10%{opacity:1;transform:translateY(-20px) scale(1)}50%{opacity:0.8;transform:translateY(-150px) scale(1.1)}100%{opacity:0;transform:translateY(-350px) scale(0.6)}}
@keyframes btPuffGlow{0%{background:linear-gradient(180deg,rgba(0,229,255,0.55) 0%,rgba(192,132,252,0.30) 35%,rgba(255,77,141,0.15) 65%,transparent 100%)}100%{background:linear-gradient(180deg,rgba(192,132,252,0.65) 0%,rgba(0,229,255,0.25) 35%,rgba(255,217,61,0.12) 65%,transparent 100%)}}
@keyframes wallFloat{0%{transform:translateY(0)}100%{transform:translateY(-4px)}}
@keyframes wallPulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes duelCountdownPop{0%{transform:scale(2.5);opacity:0}30%{transform:scale(0.9);opacity:1}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes bpWobble{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes bpExplode{0%{transform:scale(1);opacity:1}50%{transform:scale(2.5);opacity:0.8}100%{transform:scale(4);opacity:0}}
@keyframes hpBombPulse{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.15);filter:brightness(1.3) drop-shadow(0 0 12px rgba(255,100,0,0.6))}}
@keyframes hpFuseBurn{0%{transform:scaleX(1)}100%{transform:scaleX(0)}}
@keyframes hpExplosion{0%{transform:scale(1);opacity:1}30%{transform:scale(2.5);opacity:1;filter:brightness(2)}60%{transform:scale(3);opacity:0.7}100%{transform:scale(4);opacity:0}}
@keyframes corridorPulse{0%,100%{opacity:0.5}50%{opacity:0.8}}
@keyframes peGlowPulse{0%,100%{box-shadow:0 0 20px var(--glow-color,rgba(0,229,255,0.3))}50%{box-shadow:0 0 40px var(--glow-color,rgba(0,229,255,0.5)),0 0 60px var(--glow-color,rgba(0,229,255,0.2))}}
@keyframes claimPulse{0%,100%{transform:scale(1);box-shadow:0 0 16px rgba(52,211,153,0.15)}50%{transform:scale(1.01);box-shadow:0 0 24px rgba(52,211,153,0.3)}}
@keyframes vipBreathe{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes tierGlow{0%,100%{box-shadow:0 0 20px var(--tier-glow,rgba(255,217,61,0.15))}50%{box-shadow:0 0 35px var(--tier-glow,rgba(255,217,61,0.25))}}
*{-webkit-tap-highlight-color:transparent;user-select:none;box-sizing:border-box}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield}
::-webkit-scrollbar{width:2px;height:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}
`

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const game = useGameContext()
  const audio = useAudioContext()

  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 3 + 1,
    d: Math.random() * 20 + 10, o: Math.random() * 0.4 + 0.1,
    color: [C.cyan, C.gold, C.purple, C.orange, C.pink][Math.floor(Math.random() * 5)],
  })), [])

  const isArena = location.pathname.startsWith('/arena')
  const isHub = location.pathname === '/arena'
  const isZoneIntro = isArena && location.pathname.endsWith('/intro')
  const isFullscreenArena = isHub || isZoneIntro
  const tab = location.pathname.startsWith('/control') ? 'control' : location.pathname.startsWith('/live') ? 'live' : location.pathname.startsWith('/me') ? 'me' : 'arena'
  const zone = isArena && !isHub ? location.pathname.replace('/arena/', '') : null

  const currentTier = player.getCurrentTier()
  const nextTier = LOYALTY_TIERS[currentTier.idx + 1] || null
  const xpPct = nextTier ? Math.min(100, ((player.xp - currentTier.xpReq) / (nextTier.xpReq - currentTier.xpReq)) * 100) : 100

  const TICKER_DOUBLED = TICKER_ITEMS.concat(TICKER_ITEMS)

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", height: "100vh", background: isFullscreenArena ? "transparent" : C.bg, fontFamily: "'Segoe UI','SF Pro Display',system-ui,sans-serif", position: "relative", overflow: "hidden", color: C.text, display: "flex", flexDirection: "column" }}>
      <style>{CSS_KEYFRAMES}</style>

      {/* Background mesh */}
      {!isFullscreenArena && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 20% 10%, ${C.cyan}04, transparent 50%), radial-gradient(ellipse 50% 40% at 80% 90%, ${C.purple}04, transparent 50%), radial-gradient(ellipse 40% 30% at 50% 50%, ${C.gold}02, transparent 60%)` }} />}
      {!isFullscreenArena && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 1, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />}

      {/* Atmosphere particles (non-fullscreen) */}
      {!isFullscreenArena && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
          {particles.map(p => (
            <div key={p.id} style={{ position: "absolute", width: p.s, height: p.s, borderRadius: "50%", background: p.color, opacity: p.o, left: `${p.x}%`, bottom: `${(game.tick * 2 + p.id * 37) % 140 - 20}%`, transition: "bottom 1s linear" }} />
          ))}
        </div>
      )}

      {/* BLE puff glow overlay */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 220, pointerEvents: "none", zIndex: 250, background: "linear-gradient(180deg, rgba(0,229,255,0.55) 0%, rgba(192,132,252,0.30) 35%, rgba(255,77,141,0.15) 65%, transparent 100%)", opacity: ble.btPuffActive ? 1 : 0, transition: ble.btPuffActive ? "opacity 0.18s ease-out" : "opacity 0.6s ease-in", animation: ble.btPuffActive ? "btPuffGlow 1.4s ease-in-out infinite alternate" : "none", filter: "blur(1px)" }} />

      {/* Notification */}
      {player.notif && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", maxWidth: 360, padding: "8px 18px", borderRadius: 100, zIndex: 300, background: `${player.notif.color}15`, border: `1px solid ${player.notif.color}30`, color: player.notif.color, fontSize: 12, fontWeight: 700, backdropFilter: "blur(12px)", textAlign: "center", animation: "fadeIn 0.25s ease", letterSpacing: 0.3 }}>{player.notif.msg}</div>
      )}

      {/* Floating reward */}
      {player.floatingReward && (
        <div key={player.floatingReward.key} style={{ position: "fixed", top: "45%", left: "50%", transform: "translateX(-50%)", zIndex: 300, animation: "rewardFloatUp 2s ease-out forwards", pointerEvents: "none", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, textShadow: "0 2px 10px rgba(255,217,61,0.5)" }}>+{player.floatingReward.coins} 🪙</div>
          {player.floatingReward.xp > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: C.cyan, marginTop: 4 }}>+{player.floatingReward.xp} XP</div>}
        </div>
      )}

      {/* Achievement popup */}
      {player.achievementPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,5,16,0.85)", backdropFilter: "blur(12px)", animation: "fadeIn 0.3s ease", pointerEvents: "auto" }} onClick={() => player.setAchievementPopup(null)}>
          <div style={{ textAlign: "center", animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 14, letterSpacing: 3, color: C.gold, fontWeight: 700, marginBottom: 12 }}>ACHIEVEMENT UNLOCKED</div>
            <div style={{ fontSize: 72, marginBottom: 12, filter: "drop-shadow(0 0 20px rgba(255,217,61,0.4))" }}>{player.achievementPopup.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{player.achievementPopup.name}</div>
            <div style={{ fontSize: 13, color: C.text2 }}>{player.achievementPopup.desc}</div>
            <div style={{ marginTop: 16, fontSize: 11, color: C.text3 }}>Tap to continue</div>
          </div>
        </div>
      )}

      {/* Confetti */}
      {player.confettiParticles.map((p: any) => (
        <div key={p.id} style={{ position: "fixed", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 350, pointerEvents: "none", animation: "confettiFall 1.8s ease-out forwards" }} />
      ))}

      {/* ── Header ── */}
      <div style={{ padding: "10px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: C.text3, letterSpacing: 1.5 }}>
          <span style={{ fontWeight: 800, color: C.text2, letterSpacing: 1 }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <div onClick={() => { audio.playFx("tap"); game.setShowBlePopup(true) }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, cursor: "pointer", background: ble.bleConnected ? `${C.green}10` : `${C.orange}10`, border: `1px solid ${ble.bleConnected ? C.green + "30" : C.orange + "30"}` }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ble.bleConnected ? C.green : C.orange }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: ble.bleConnected ? C.green : C.orange }}>{ble.bleConnected ? "Puff" : "Connect"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100, background: `${C.gold}08`, border: `1px solid ${C.gold}15` }}>
            <span style={{ fontSize: 10 }}>🪙</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{player.coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ height: 2, background: C.bg3, position: "relative", overflow: "hidden" }}>
        <div style={{ height: "100%", background: `linear-gradient(90deg,${currentTier.color},${C.purple})`, width: `${xpPct}%`, transition: "width 0.8s ease" }} />
      </div>

      {/* Live Ticker */}
      <div style={{ width: "100%", overflow: "hidden", height: 28, background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}`, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", height: "100%", whiteSpace: "nowrap", animation: "tickerScroll 30s linear infinite", willChange: "transform" }}>
          {TICKER_DOUBLED.map((t: string, i: number) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 24px", fontSize: 11, fontWeight: 600, color: C.text2, letterSpacing: 0.3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: i % 2 === 0 ? C.red : C.cyan, animation: i % 3 === 0 ? "pulse 1.5s infinite" : "none", display: "inline-block" }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Connect warning bar */}
      {!ble.bleConnected && player.deviceActivated && !game.gameActive && !game.matchmaking && (
        <div onClick={() => { audio.playFx("tap"); game.setShowBlePopup(true) }} style={{ padding: "6px 14px", cursor: "pointer", background: `linear-gradient(90deg,${C.orange}15,${C.gold}10)`, borderBottom: `1px solid ${C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.orange }}>Connect for Full Experience & Rewards</span>
          <span style={{ fontSize: 9, color: C.text3 }}>Tap to pair 💨</span>
        </div>
      )}
      {!ble.bleConnected && !player.deviceActivated && !game.gameActive && !game.matchmaking && (
        <div onClick={() => { audio.playFx("tap"); game.setShowBlePopup(true) }} style={{ padding: "6px 14px", cursor: "pointer", background: `linear-gradient(90deg,${C.red}12,${C.orange}08)`, borderBottom: `1px solid ${C.red}20`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.red }}>Connect Device to Activate Arena</span>
          <span style={{ fontSize: 9, color: C.text3 }}>Required 💨</span>
        </div>
      )}

      {/* Tab title bar (show on zone pages and control; hide on hub, me, live, zone intros) */}
      {(tab !== 'arena' || (zone && !isZoneIntro)) && tab !== 'me' && tab !== 'live' && (
        <div style={{ padding: "6px 14px 10px", position: "relative", zIndex: 5 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>
            {tab === 'control' ? 'Control' : tab === 'arena' && zone ? ((Z as any)[zone.replace('/intro', '')]?.name || 'Arena') : 'Arena'}
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ position: "relative", zIndex: 5, flex: 1, overflow: isFullscreenArena ? "hidden" : "auto", paddingBottom: isFullscreenArena ? 0 : 80 }}>
        {children}
      </div>

      {/* Game overlay (start screen + active game) */}
      <GameOverlay />

      {/* BLE Popup */}
      <BLEPopup />

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}
