import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C, GLASS_CARD, GLASS_CLEAR } from '@/constants'
import { ARENA_IMAGES, ARENA_VIDEOS } from '@/constants/arena'

const HUB_TAP_ZONES = [
  { key: 'arcade',   top: '38%', left: '0%',    right: undefined, width: '18%', height: '24%' },
  { key: 'stage',    top: '38%', left: undefined, right: '0%',    width: '19%', height: '24%' },
  { key: 'wall',     top: '42%', left: '18%',   right: undefined, width: '16%', height: '18%' },
  { key: 'oracle',   top: '40%', left: undefined, right: '16%',  width: '16%', height: '18%' },
  { key: 'worldcup', top: '42%', left: '28%',   right: undefined, width: '28%', height: '22%' },
]

export default function Hub() {
  const navigate = useNavigate()
  const { playFx, coins, xp, currentWinStreak } = useArena()

  const [mainStage, setMainStage] = useState(0)
  const [walking, setWalking] = useState(false)

  const arenaAtmosphere = {
    smokeLevel: 12,
    temperature: 'chill' as const,
    weather: 'clear' as const,
    peakHour: false,
    onlineCount: 1247,
    is420: false,
  }

  // Jumbotron auto-advance every 5s
  useEffect(() => {
    const t = setTimeout(() => setMainStage(s => (s + 1) % 3), 5000)
    return () => clearTimeout(t)
  }, [mainStage])

  const walkTo = useCallback((key: string) => {
    setWalking(true)
    setTimeout(() => navigate('/zone/' + key), 450)
  }, [navigate])

  const stageData = [
    { tag: 'LIVE EVENT', tagColor: C.red, title: '🇺🇸 USA vs Mexico 🇲🇽', sub: `Tonight 9:00 PM · ${arenaAtmosphere.onlineCount.toLocaleString()} predicting`, cta: 'Predict Now', ctaColor: C.lime, act: () => navigate('/oracle') },
    { tag: 'SHOW LIVE', tagColor: C.gold, title: '🧠 Vibe Check — WC Edition', sub: 'MC Tuấn · 1,247 watching · Top prize: 5,000', cta: 'Join Show', ctaColor: C.gold, act: () => navigate('/stage') },
    { tag: 'TOURNAMENT', tagColor: C.cyan, title: '⚽ Final Kick WC Tournament', sub: '64 players · Your rank: #12 · Round of 16', cta: 'Play Match', ctaColor: C.cyan, act: () => navigate('/arcade') },
  ]
  const s = stageData[mainStage]

  const level = Math.floor(xp / 500) + 1
  const getRankEmoji = () => {
    if (xp >= 75000) return '🔥'
    if (xp >= 25000) return '💎'
    if (xp >= 8000) return '🥇'
    if (xp >= 2000) return '🥈'
    return '🥉'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5, overflow: 'hidden' }}>
      {/* Walk transition overlay */}
      {walking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'all', background: C.bg, animation: 'walkFlash 0.45s ease both' }} />
      )}

      {/* ═══ BACKGROUND VIDEO ═══ */}
      <div style={{ position: 'absolute', inset: '-2% -10%', width: '120%', height: '104%', zIndex: 0 }}>
        <video autoPlay loop muted playsInline poster={ARENA_IMAGES.hub} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
          <source src={ARENA_VIDEOS.hub} type="video/mp4" />
        </video>
        {/* Cali Clear logo */}
        <div style={{ position: 'absolute', top: 'calc(35% + 2vh)', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '28vw', maxWidth: 120, height: '18vw', maxHeight: 80, borderRadius: '50%', background: `radial-gradient(ellipse, ${C.gold}15, transparent 65%)`, animation: 'breathe 3s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '18vw', maxWidth: 80, height: '12vw', maxHeight: 55, borderRadius: '50%', background: `radial-gradient(ellipse, ${C.gold}25, transparent 70%)`, animation: 'breathe 4s ease-in-out 1s infinite' }} />
          <img src="assets/arena/cali-clear-logo.png" alt="" style={{ position: 'relative', width: '15vw', maxWidth: 65, height: 'auto', display: 'block', filter: `drop-shadow(0 0 8px ${C.gold}80) drop-shadow(0 0 16px ${C.gold}50) drop-shadow(0 0 32px ${C.gold}25)` }} />
        </div>
      </div>

      {/* ═══ ATMOSPHERE ENGINE ═══ */}
      {arenaAtmosphere.weather !== 'clear' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'rgba(255,255,255,0.02)', transition: 'background 3s ease' }} />
      )}
      {Array.from({ length: Math.max(3, Math.floor(arenaAtmosphere.smokeLevel / 7)) }, (_, i) => (
        <div key={`smoke-${i}`} style={{ position: 'absolute', left: `${(i * 17 + 5) % 100}%`, bottom: `${10 + (i * 23) % 60}%`, width: 60 + (i % 4) * 30, height: 40 + (i % 3) * 20, borderRadius: '50%', background: i % 3 === 0 ? 'rgba(0,229,255,0.03)' : 'rgba(255,255,255,0.03)', filter: `blur(${8 + (i % 3) * 4}px)`, opacity: 0.03 + (arenaAtmosphere.smokeLevel / 100) * 0.05, animation: `atmosSmokeDrift ${14 + (i % 5) * 4}s ease-in-out ${i * 1.3}s infinite alternate`, zIndex: 2, pointerEvents: 'none' }} />
      ))}
      {arenaAtmosphere.is420 && Array.from({ length: 12 }, (_, i) => (
        <div key={`gold-${i}`} style={{ position: 'absolute', left: `${(i * 8 + 3) % 100}%`, top: `${(i * 11 + 5) % 80}%`, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: '50%', background: C.gold, boxShadow: `0 0 8px ${C.gold}`, opacity: 0.7, animation: `atmosGoldFloat ${3 + (i % 4)}s ease-in-out ${i * 0.25}s infinite`, zIndex: 4, pointerEvents: 'none' }} />
      ))}
      {arenaAtmosphere.is420 && (
        <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none', fontSize: 28, fontWeight: 900, letterSpacing: 6, color: C.gold, textShadow: `0 0 20px ${C.gold}, 0 0 40px ${C.gold}80, 0 0 80px ${C.gold}40`, animation: 'atmosGoldPulse 1.5s ease-in-out infinite' }}>420 VIBES</div>
      )}

      {/* ═══ JUMBOTRON ═══ */}
      <div style={{ position: 'absolute', top: 72, left: 18, right: 18, zIndex: 10, animation: 'arenaFadeIn 0.6s ease 0.1s both' }}>
        <div style={{ borderRadius: 22, overflow: 'hidden', cursor: 'pointer', ...GLASS_CARD }} onClick={s.act}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04), transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', padding: '18px 18px 16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, background: `${s.tagColor}15`, marginBottom: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.tagColor, boxShadow: `0 0 6px ${s.tagColor}`, animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 8, fontWeight: 800, color: s.tagColor, letterSpacing: 1.5 }}>{s.tag}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 5, fontWeight: 500 }}>{s.sub}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ padding: '7px 16px', borderRadius: 100, background: `${s.ctaColor}12`, border: `1px solid ${s.ctaColor}25`, fontSize: 11, fontWeight: 800, color: s.ctaColor }}>{s.cta}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} onClick={(e) => { e.stopPropagation(); setMainStage(i) }} style={{ width: i === mainStage ? 14 : 5, height: 4, borderRadius: 2, background: i === mainStage ? C.text : `${C.text3}30`, transition: 'all 0.4s', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div key={mainStage} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${s.ctaColor}50)`, animation: 'jumbotronProgress 5s linear forwards', transformOrigin: 'left', willChange: 'transform' }} />
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6, animation: 'arenaFadeIn 0.6s ease 0.2s both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, ...GLASS_CARD }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 9 }}>😌</span>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: C.blue }}>CHILL</span>
            </div>
            <span style={{ display: 'inline-block', width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}60`, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>{arenaAtmosphere.onlineCount.toLocaleString()}</span>
              <span style={{ fontSize: 7, fontWeight: 600, color: C.text3 }}>in Arena</span>
            </div>
            <span style={{ display: 'inline-block', width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: C.text3 }}>Lv</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{level}</span>
              <span style={{ fontSize: 8, marginLeft: 1 }}>{getRankEmoji()}</span>
            </div>
            <span style={{ display: 'inline-block', width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.orange, animation: currentWinStreak >= 7 ? 'pulse 1.5s infinite' : 'none' }}>🔥{currentWinStreak}</span>
            </div>
            {arenaAtmosphere.peakHour && (
              <>
                <span style={{ display: 'inline-block', width: 1, height: 10, background: `${C.text3}30` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '1px 6px', borderRadius: 6, background: `${C.red}15` }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.red, animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: 7, fontWeight: 800, color: C.red, letterSpacing: 0.5 }}>PEAK</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ INVISIBLE TAP ZONES ═══ */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 60, zIndex: 10, pointerEvents: 'none' }}>
        {HUB_TAP_ZONES.map(t => (
          <div key={t.key} onClick={() => { playFx('nav'); walkTo(t.key) }} style={{ position: 'absolute', top: t.top, left: t.left, right: t.right, width: t.width, height: t.height, cursor: 'pointer', pointerEvents: 'auto', borderRadius: 8 }} />
        ))}
      </div>

      {/* ═══ BOTTOM NAV — floating pill dock (Hub-internal) ═══ */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 5px', borderRadius: 100, ...GLASS_CLEAR }}>
          {[
            { id: 'control', l: 'Control', i: '🎛', c: C.cyan },
            { id: 'arena',   l: 'Arena',   i: '🎮', c: C.cyan },
            { id: 'live',    l: 'Live',    i: '📡', c: C.pink },
            { id: 'me',      l: 'Me',      i: '👤', c: C.purple },
          ].map(t => {
            const active = t.id === 'arena'
            return (
              <div
                key={t.id}
                onClick={() => {
                  playFx('nav')
                  if (t.id === 'arena') return
                  if (t.id === 'control') return
                  navigate(t.id === 'me' ? '/me' : '/live')
                }}
                style={{ display: 'flex', alignItems: 'center', gap: active ? 5 : 0, padding: active ? '7px 14px' : '7px 10px', borderRadius: 100, cursor: 'pointer', background: active ? `${t.c}20` : 'transparent', transition: 'all 0.3s ease', position: 'relative' }}
              >
                <span style={{ fontSize: 16, opacity: active ? 1 : 0.4, transition: 'opacity 0.3s' }}>{t.i}</span>
                {active && <span style={{ fontSize: 11, fontWeight: 700, color: t.c, whiteSpace: 'nowrap' }}>{t.l}</span>}
                {t.id === 'live' && <div style={{ position: 'absolute', top: 3, right: active ? 8 : 4, width: 5, height: 5, borderRadius: '50%', background: C.red, animation: 'pulse 1.5s infinite' }} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
