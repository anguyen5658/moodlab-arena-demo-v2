import React from 'react'
import { useNavigate } from 'react-router-dom'
import { C, ARENA_IMAGES, ARENA_VIDEOS, GLASS_CARD } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useUIContext } from '../../context/UIContext'
import { useAudioContext } from '../../context/AudioContext'

const HUB_TAP_ZONES = [
  { key: "arcade",   top: "43%", left: "3%",   width: "18%", height: "24%" },
  { key: "stage",    top: "44%", right: "3%",  width: "19%", height: "24%" },
  { key: "wall",     top: "47%", left: "24%",  width: "13%", height: "18%" },
  { key: "oracle",   top: "48%", right: "24%", width: "13%", height: "18%" },
  { key: "worldcup", top: "43%", left: "39%",  width: "22%", height: "22%" },
] as const

const JUMBOTRON_STAGES = [
  { emoji: "⚽", title: "FIFA WORLD CUP 2026", sub: "Predict matches, play FK1/2, win big!", tag: "🔥 FEATURED", tagColor: "#FFD93D", ctaColor: "#FFD93D", cta: "ENTER WORLD CUP" },
  { emoji: "🎮", title: "ARCADE ZONE", sub: "17 action games · 856 playing now", tag: "🎮 LIVE", tagColor: "#00E5FF", ctaColor: "#00E5FF", cta: "PLAY NOW" },
  { emoji: "🔮", title: "FORTUNE ZONE", sub: "Slots, blackjack, predictions & more", tag: "💎 HOT", tagColor: "#C084FC", ctaColor: "#C084FC", cta: "TRY YOUR LUCK" },
]

export const ArenaHub: React.FC = () => {
  const navigate = useNavigate()
  const game = useGameContext()
  const player = usePlayerContext()
  const ui = useUIContext()
  const audio = useAudioContext()
  const atmos = ui.arenaAtmosphere
  const s = JUMBOTRON_STAGES[game.mainStage]
  const handleWalkTo = (key: string) => {
    audio.playFx("nav")
    game.walkTo(key)
    setTimeout(() => {
      navigate(`/arena/${key}/intro`)
    }, 450)
  }

  // Loading screen
  if (game.arenaLoading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <img src={ARENA_IMAGES.hub} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0, animation: "loadingImageReveal 1.8s ease 0.2s forwards" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(5,5,16,0.6) 70%, ${C.bg} 100%)` }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", animation: "loadingTextReveal 1s ease 0.4s both" }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 12, color: C.cyan, textShadow: `0 0 15px ${C.cyan}, 0 0 30px ${C.cyan}80, 0 0 60px ${C.cyan}40` }}>ARENA</div>
          <div style={{ fontSize: 10, letterSpacing: 6, color: C.text3, marginTop: 6, fontWeight: 600 }}>ENTERING THE EXPERIENCE</div>
          <div style={{ marginTop: 20, width: 120, height: 2, borderRadius: 1, background: `${C.text3}15`, margin: "20px auto 0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "100%", borderRadius: 1, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})`, animation: "loadingBar 1.5s ease 0.3s forwards", transformOrigin: "left", willChange: "transform" }} />
          </div>
        </div>
      </div>
    )
  }

  // Walk overlay
  const walkOverlay = game.walking ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "all", background: C.bg, animation: "walkFlash 0.45s ease both" }} />
  ) : null

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 5, overflow: "hidden" }}>
      {walkOverlay}

      {/* Background video */}
      <div style={{ position: "absolute", inset: "-2% -10%", width: "120%", height: "104%", zIndex: 0 }}>
        <video autoPlay loop muted playsInline poster={ARENA_IMAGES.hub} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}>
          <source src={ARENA_VIDEOS.hub} type="video/mp4" />
        </video>
        {/* Cali Clear logo */}
        <div style={{ position: "absolute", top: "calc(35% + 2vh)", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 1 }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "28vw", maxWidth: 120, height: "18vw", maxHeight: 80, borderRadius: "50%", background: `radial-gradient(ellipse, ${C.gold}15, transparent 65%)`, animation: "breathe 3s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "18vw", maxWidth: 80, height: "12vw", maxHeight: 55, borderRadius: "50%", background: `radial-gradient(ellipse, ${C.gold}25, transparent 70%)`, animation: "breathe 4s ease-in-out 1s infinite" }} />
          <img src="assets/arena/cali-clear-logo.png" alt="" style={{ position: "relative", width: "15vw", maxWidth: 65, height: "auto", display: "block", filter: `drop-shadow(0 0 8px ${C.gold}80) drop-shadow(0 0 16px ${C.gold}50) drop-shadow(0 0 32px ${C.gold}25)` }} />
        </div>
      </div>

      {/* Atmosphere — smoke */}
      {atmos.weather !== "clear" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: atmos.weather === "hazy" ? "rgba(255,255,255,0.02)" : atmos.weather === "cloudy" ? "rgba(255,255,255,0.035)" : atmos.weather === "foggy" ? "rgba(200,210,255,0.06)" : "rgba(140,160,255,0.05)", transition: "background 3s ease" }} />
      )}
      {Array.from({ length: Math.max(3, Math.floor(atmos.smokeLevel / 7)) }, (_, i) => (
        <div key={`smoke-${i}`} style={{ position: "absolute", left: `${(i * 17 + 5) % 100}%`, bottom: `${10 + (i * 23) % 60}%`, width: 60 + (i % 4) * 30, height: 40 + (i % 3) * 20, borderRadius: "50%", background: i % 3 === 0 ? "rgba(0,229,255,0.03)" : "rgba(255,255,255,0.03)", filter: `blur(${8 + (i % 3) * 4}px)`, opacity: 0.03 + (atmos.smokeLevel / 100) * 0.05, animation: `atmosSmokeDrift ${14 + (i % 5) * 4}s ease-in-out ${i * 1.3}s infinite alternate`, zIndex: 2, pointerEvents: "none" }} />
      ))}
      {/* Storm lightning flashes */}
      {atmos.weather === "storm" && game.tick % 7 < 1 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "rgba(200,220,255,0.08)", animation: "atmosLightning 0.15s ease both" }} />
      )}
      {/* 420 celebration particles */}
      {atmos.is420 && Array.from({ length: 12 }, (_, i) => (
        <div key={`gold-${i}`} style={{ position: "absolute", left: `${(i * 8 + 3) % 100}%`, top: `${(i * 11 + 5) % 80}%`, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: "50%", background: C.gold, boxShadow: `0 0 8px ${C.gold}`, opacity: 0.7, animation: `atmosGoldFloat ${3 + (i % 4)}s ease-in-out ${i * 0.25}s infinite`, zIndex: 4, pointerEvents: "none" }} />
      ))}
      {/* 420 VIBES text */}
      {atmos.is420 && (
        <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", zIndex: 5, pointerEvents: "none", fontSize: 28, fontWeight: 900, letterSpacing: 6, color: C.gold, textShadow: `0 0 20px ${C.gold}, 0 0 40px ${C.gold}80, 0 0 80px ${C.gold}40`, animation: "atmosGoldPulse 1.5s ease-in-out infinite" }}>420 VIBES</div>
      )}

      {/* Jumbotron */}
      <div style={{ position: "absolute", top: 72, left: 18, right: 18, zIndex: 10, animation: "arenaFadeIn 0.6s ease 0.1s both" }}>
        <div style={{ borderRadius: 22, overflow: "hidden", cursor: "pointer", ...GLASS_CARD }} onClick={() => { audio.playFx("nav"); handleWalkTo(game.mainStage === 0 ? "worldcup" : game.mainStage === 1 ? "arcade" : "oracle") }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.04), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", padding: "18px 18px 16px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: `${s.tagColor}15`, marginBottom: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: s.tagColor, boxShadow: `0 0 6px ${s.tagColor}`, animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 8, fontWeight: 800, color: s.tagColor, letterSpacing: 1.5 }}>{s.tag}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 5, fontWeight: 500 }}>{s.sub}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <div style={{ padding: "7px 16px", borderRadius: 100, background: `${s.ctaColor}12`, border: `1px solid ${s.ctaColor}25`, fontSize: 11, fontWeight: 800, color: s.ctaColor }}>{s.cta}</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} onClick={(e) => { e.stopPropagation(); game.setMainStage(i) }} style={{ width: i === game.mainStage ? 14 : 5, height: 4, borderRadius: 2, background: i === game.mainStage ? C.text : `${C.text3}30`, transition: "all 0.4s", cursor: "pointer" }} />
                ))}
              </div>
            </div>
            <div key={game.mainStage} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${s.ctaColor}50)`, animation: "jumbotronProgress 5s linear forwards", transformOrigin: "left", willChange: "transform" }} />
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6, animation: "arenaFadeIn 0.6s ease 0.2s both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, ...GLASS_CARD }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 9 }}>{atmos.temperature === "chill" ? "😌" : atmos.temperature === "warm" ? "🌤" : atmos.temperature === "hot" ? "🔥" : "💥"}</span>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: atmos.temperature === "chill" ? C.blue : atmos.temperature === "warm" ? C.green : atmos.temperature === "hot" ? C.orange : C.red }}>{atmos.temperature.toUpperCase()}</span>
            </div>
            <span style={{ width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}60`, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: atmos.is420 ? C.gold : C.text2 }}>{atmos.onlineCount.toLocaleString()}</span>
              <span style={{ fontSize: 7, fontWeight: 600, color: C.text3 }}>in Arena</span>
            </div>
            <span style={{ width: 1, height: 10, background: `${C.text3}30` }} />
            <div onClick={() => player.setShowProfile(true)} style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: C.text3 }}>Lv</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>24</span>
              <span style={{ fontSize: 8, marginLeft: 1 }}>{player.getCurrentTier().icon}</span>
            </div>
            <span style={{ width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.orange, animation: player.playerProfile.streak >= 7 ? "pulse 1.5s infinite" : "none" }}>🔥{player.playerProfile.streak}</span>
            </div>
            {atmos.peakHour && (
              <>
                <span style={{ width: 1, height: 10, background: `${C.text3}30` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "1px 6px", borderRadius: 6, background: `${C.red}15` }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite" }} />
                  <span style={{ fontSize: 7, fontWeight: 800, color: C.red, letterSpacing: 0.5 }}>PEAK</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invisible tap zones */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 60, zIndex: 10, pointerEvents: "none" }}>
        {HUB_TAP_ZONES.map(t => (
          <div key={t.key} onClick={() => handleWalkTo(t.key)} style={{ position: "absolute", top: t.top, left: (t as any).left || undefined, right: (t as any).right || undefined, width: t.width, height: t.height, cursor: "pointer", pointerEvents: "auto", borderRadius: 8 }} />
        ))}
      </div>

    </div>
  )
}
