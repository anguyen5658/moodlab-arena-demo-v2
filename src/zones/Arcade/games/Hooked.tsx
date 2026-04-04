import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Rarity = 'common' | 'rare' | 'legendary'
type Fish = {
  name: string; emoji: string; rarity: Rarity; pts: number
  zoneWidth: number; resistance: number; instability: number
  tensionRate: number; escapeRate: number; color: string
}
type CatchRecord = Fish & { bonus: number; total: number; time: number }

const HOOK_FISH: Fish[] = [
  { name:"Blue Snap",   emoji:"🐟", rarity:"common",    pts:10, zoneWidth:35, resistance:0.8, instability:0.3,  tensionRate:1.0, escapeRate:0.8, color:C.cyan   },
  { name:"Lunar Carp",  emoji:"🐠", rarity:"common",    pts:10, zoneWidth:33, resistance:0.9, instability:0.35, tensionRate:1.0, escapeRate:0.9, color:C.cyan   },
  { name:"Pond Darter", emoji:"🐡", rarity:"common",    pts:10, zoneWidth:38, resistance:0.7, instability:0.25, tensionRate:0.9, escapeRate:0.7, color:C.cyan   },
  { name:"Neon Koi",    emoji:"🎏", rarity:"rare",      pts:25, zoneWidth:30, resistance:1.2, instability:0.5,  tensionRate:1.3, escapeRate:1.1, color:C.purple },
  { name:"Glitch Fin",  emoji:"🦈", rarity:"rare",      pts:25, zoneWidth:28, resistance:1.4, instability:0.55, tensionRate:1.4, escapeRate:1.2, color:C.purple },
  { name:"Gold Pike",   emoji:"🐊", rarity:"rare",      pts:25, zoneWidth:32, resistance:1.1, instability:0.45, tensionRate:1.2, escapeRate:1.0, color:C.purple },
  { name:"Void Eel",    emoji:"🐉", rarity:"legendary", pts:60, zoneWidth:22, resistance:1.8, instability:0.50, tensionRate:1.8, escapeRate:1.5, color:C.gold   },
  { name:"Abyssal Ray", emoji:"🦑", rarity:"legendary", pts:60, zoneWidth:20, resistance:2.0, instability:0.55, tensionRate:2.0, escapeRate:1.6, color:C.gold   },
]

type HookPhase = 'idle' | 'waiting' | 'bite' | 'caught' | 'line_break' | 'escaped'

const spawnFish = (): Fish => {
  const roll = Math.random()
  const pool = roll < 0.65
    ? HOOK_FISH.filter(f => f.rarity === 'common')
    : roll < 0.90
    ? HOOK_FISH.filter(f => f.rarity === 'rare')
    : HOOK_FISH.filter(f => f.rarity === 'legendary')
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function Hooked() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [hookPhase, setHookPhase] = useState<HookPhase>('idle')
  const [fish, setFish] = useState<Fish | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [suction, setSuction] = useState(0)
  const [catchProgress, setCatchProgress] = useState(0)
  const [lineTension, setLineTension] = useState(0)
  const [escapeTimer, setEscapeTimer] = useState(0)
  const [zoneCenter, setZoneCenter] = useState(50)
  const [zoneWidth, setZoneWidth] = useState(30)
  const [holding, setHolding] = useState(false)
  const [recentCatches, setRecentCatches] = useState<CatchRecord[]>([])
  const [hookComment, setHookComment] = useState('Cast your line into the deep...')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const hookGameLoop = useRef<ReturnType<typeof setInterval> | null>(null)
  const suctionRef = useRef(0)
  const holdingRef = useRef(false)
  const hookPhaseRef = useRef<HookPhase>('idle')

  const triggerFlash = (type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }
  const triggerShake = () => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }

  const stopGameLoop = () => {
    if (hookGameLoop.current) { clearInterval(hookGameLoop.current); hookGameLoop.current = null }
  }

  const startGameLoop = useCallback((f: Fish) => {
    stopGameLoop()
    let zoneC = 30 + Math.random() * 40
    let catchP = 0, lineT = 0, escT = 0, totalT = 0
    const dt = 1 / 30
    hookGameLoop.current = setInterval(() => {
      const s = suctionRef.current
      const zLo = zoneC - f.zoneWidth / 2
      const zHi = zoneC + f.zoneWidth / 2
      const inZone = s >= zLo && s <= zHi
      const aboveZone = s > zHi
      const belowZone = s < zLo

      // zone drift
      zoneC += (Math.random() - 0.5) * f.instability * 60 * dt
      zoneC = Math.max(f.zoneWidth / 2 + 5, Math.min(100 - f.zoneWidth / 2 - 5, zoneC))
      setZoneCenter(zoneC)

      // catch progress
      if (inZone) catchP = Math.min(100, catchP + 28 * dt)
      else if (belowZone) catchP = Math.max(0, catchP - 12 * dt)
      else catchP = Math.max(0, catchP - 5 * dt)
      setCatchProgress(catchP)

      // line tension
      if (aboveZone) lineT = Math.min(100, lineT + 35 * f.tensionRate * dt)
      else lineT = Math.max(0, lineT - 25 * dt)
      setLineTension(lineT)

      // escape timer
      if (belowZone && (zLo - s > 15)) escT = Math.min(100, escT + 18 * f.escapeRate * dt)
      else if (inZone) escT = Math.max(0, escT - 10 * dt)
      setEscapeTimer(escT)

      totalT += dt

      if (catchP >= 100) {
        stopGameLoop()
        const bonus = Math.max(0, Math.round((1 - totalT / 20) * f.pts * 0.5))
        const total = f.pts + bonus
        setScore(prev => { const ns = prev + total; setBestScore(b => Math.max(b, ns)); return ns })
        setRecentCatches(prev => [{ ...f, bonus, total, time: totalT }, ...prev].slice(0, 5))
        setHookPhase('caught')
        hookPhaseRef.current = 'caught'
        setHookComment(`CAUGHT! ${f.emoji} ${f.name} +${total}pts!`)
        triggerFlash('goal')
        setConfetti(Array.from({ length: 20 }, (_, i) => ({ id: Date.now() + i, x: Math.random() * 100, y: Math.random() * 40, size: 4 + Math.random() * 6, color: [f.color, C.green, C.gold][i % 3], rot: Math.random() * 360 })))
        setTimeout(() => setConfetti([]), 2000)
        playFx('fishing_catch')
      } else if (lineT >= 100) {
        stopGameLoop()
        setScore(prev => Math.max(0, prev - 5))
        setHookPhase('line_break')
        hookPhaseRef.current = 'line_break'
        setHookComment('LINE SNAPPED! 💥 Too much tension!')
        triggerFlash('miss')
        triggerShake()
        playFx('fishing_snap')
      } else if (escT >= 100) {
        stopGameLoop()
        setHookPhase('escaped')
        hookPhaseRef.current = 'escaped'
        setHookComment(`${f.emoji} ${f.name} escaped! Not enough suction!`)
        playFx('error')
      }
    }, 1000 / 30)
  }, [playFx])

  const castLine = useCallback(() => {
    playFx('fishing_cast')
    setHookPhase('waiting')
    hookPhaseRef.current = 'waiting'
    setHookComment('Line in the water... wait for a bite! 🎣')
    setFish(null)
    setCatchProgress(0)
    setLineTension(0)
    setEscapeTimer(0)
    setSuction(0)
    suctionRef.current = 0
    const waitTime = 2000 + Math.random() * 3000
    const hasFakeBite = Math.random() < 0.25
    if (hasFakeBite) {
      setTimeout(() => {
        setHookComment('...nibble? 👀')
        triggerShake()
        setTimeout(() => setHookComment('False alarm! Keep waiting...'), 800)
      }, waitTime * 0.4)
    }
    setTimeout(() => {
      const f = spawnFish()
      setFish(f)
      setHookPhase('bite')
      hookPhaseRef.current = 'bite'
      setZoneWidth(f.zoneWidth)
      setZoneCenter(30 + Math.random() * 40)
      setHookComment(`${f.emoji} ${f.name} is on the line!`)
      triggerShake()
      playFx('fishing_bite')
      startGameLoop(f)
    }, waitTime)
  }, [playFx, startGameLoop])

  // suction ramp effect
  useEffect(() => {
    if (hookPhase !== 'bite') return
    const id = setInterval(() => {
      if (holdingRef.current) {
        suctionRef.current = Math.min(100, suctionRef.current + 120 / 30)
      } else {
        suctionRef.current = Math.max(0, suctionRef.current - 200 / 30)
      }
      setSuction(suctionRef.current)
    }, 1000 / 30)
    return () => clearInterval(id)
  }, [hookPhase])

  const startPuff = useCallback(() => {
    if (hookPhaseRef.current === 'waiting') {
      setScore(prev => Math.max(0, prev - 5))
      setHookComment('False start! -5pts! Wait for the bite! ⚠️')
      triggerFlash('miss')
      playFx('error')
      return
    }
    if (hookPhaseRef.current !== 'bite') return
    holdingRef.current = true
    setHolding(true)
    playFx('fishing_reel')
  }, [playFx])

  const stopPuff = useCallback(() => {
    holdingRef.current = false
    setHolding(false)
  }, [])

  useEffect(() => {
    registerPuffHandlers(startPuff, stopPuff)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, startPuff, stopPuff])

  useEffect(() => {
    return () => { stopGameLoop(); holdingRef.current = false }
  }, [])

  const inBite = hookPhase === 'bite'
  const zLo = zoneCenter - zoneWidth / 2
  const zHi = zoneCenter + zoneWidth / 2
  const inZone = suction >= zLo && suction <= zHi
  const aboveZone = suction > zHi
  const highTension = lineTension > 60
  const critTension = lineTension > 85

  const rarityGlow = fish
    ? fish.rarity === 'legendary' ? `0 0 30px ${C.gold}60, 0 0 60px ${C.gold}30`
    : fish.rarity === 'rare' ? `0 0 20px ${C.purple}50`
    : `0 0 12px ${C.cyan}30`
    : 'none'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; startPuff() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; stopPuff() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); startPuff() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); stopPuff() }}
    >
      {/* Deep ocean background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #020818 0%, #051228 15%, #071a3a 30%, #0a1e44 45%, #08162e 65%, #040e1a 85%, #020810 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(180deg, rgba(0,100,200,0.04) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
      {[...Array(12)].map((_, i) => (
        <div key={'hookp' + i} style={{ position: 'absolute', left: (5 + i * 8) + '%', top: (20 + Math.sin(i * 1.7) * 30) + '%', width: 3 + i % 3, height: 3 + i % 3, borderRadius: '50%', background: [C.cyan, '#60A5FA', '#34D399', '#C084FC'][i % 4], opacity: 0.08 + Math.sin(i * 0.8) * 0.05, animation: `gentleFloat ${4 + i % 3 * 2}s ease-in-out infinite`, animationDelay: i * 0.5 + 's', pointerEvents: 'none', zIndex: 1 }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(0,0,0,${inBite ? 0.5 : 0.35}) 100%)`, pointerEvents: 'none', zIndex: 2 }} />
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.25)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}
      {/* Fishing line visual */}
      {inBite && (
        <div style={{ position: 'absolute', top: '15%', left: '50%', width: 2, height: '35%', background: critTension ? `linear-gradient(180deg, ${C.red}, ${C.orange})` : highTension ? `linear-gradient(180deg, ${C.orange}, ${C.cyan})` : `linear-gradient(180deg, ${C.cyan}60, ${C.cyan}20)`, transform: `translateX(-50%)${critTension ? ' scaleX(1.5)' : ''}`, animation: critTension ? 'hookLineShake 0.1s infinite' : highTension ? 'hookLineShake 0.3s infinite' : 'none', transition: 'background 0.3s', zIndex: 5, pointerEvents: 'none' }} />
      )}

      <div data-back="true" onClick={() => { stopGameLoop(); holdingRef.current = false; awardGame({ won: recentCatches.length > 0, baseCoins: recentCatches.length > 0 ? 60 : 10, baseXP: recentCatches.length > 0 ? 20 : 8 }); navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', padding: '50px 16px 16px', zIndex: 10, position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎣 HOOKED</div>
          <div style={{ fontSize: 9, color: C.text3 }}>Score: {score} · Best: {bestScore}</div>
        </div>

        {/* Fish display area */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 300, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          {hookPhase === 'idle' && (
            <div onClick={(e) => { e.stopPropagation(); castLine() }} style={{ padding: '18px 40px', borderRadius: 16, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}20,${C.blue}10)`, border: `2px solid ${C.cyan}30`, animation: 'pulse 2s infinite', userSelect: 'none' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.cyan, letterSpacing: 2 }}>🎣 CAST LINE</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>Tap to drop your line</div>
            </div>
          )}
          {hookPhase === 'waiting' && (
            <div style={{ textAlign: 'center', animation: 'gentleFloat 3s infinite' }}>
              <div style={{ fontSize: 36 }}>🎣</div>
              <div style={{ fontSize: 10, color: C.cyan, fontWeight: 700, marginTop: 4, animation: 'pulse 1.5s infinite' }}>Waiting for bite...</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Don't puff yet!</div>
            </div>
          )}
          {inBite && fish && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 50, filter: `drop-shadow(${rarityGlow})`, animation: inZone ? 'hookFishPull 0.5s ease infinite' : 'hookFishFight 0.8s ease infinite' }}>{fish.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: fish.color, marginTop: 2, textShadow: `0 0 10px ${fish.color}40` }}>{fish.name}</div>
              <div style={{ fontSize: 7, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{fish.rarity} · {fish.pts}pts</div>
            </div>
          )}
          {hookPhase === 'caught' && fish && (
            <div style={{ textAlign: 'center', animation: 'goalBurst 0.6s ease' }}>
              <div style={{ fontSize: 56 }}>{fish.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.green, marginTop: 4 }}>CAUGHT!</div>
              <div style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>+{fish.pts + (recentCatches[0]?.bonus || 0)} pts</div>
            </div>
          )}
          {hookPhase === 'line_break' && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 48 }}>💥</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.red }}>LINE SNAPPED!</div>
              <div style={{ fontSize: 10, color: C.text3 }}>Too much tension!</div>
            </div>
          )}
          {hookPhase === 'escaped' && fish && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 48, opacity: 0.5 }}>{fish.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.orange }}>ESCAPED!</div>
              <div style={{ fontSize: 10, color: C.text3 }}>Not enough suction!</div>
            </div>
          )}
        </div>

        {/* Commentary */}
        {hookComment && (
          <div style={{ padding: '5px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 320, textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.text, fontStyle: 'italic' }}>{hookComment}</div>
          </div>
        )}

        {/* 3 meter bars */}
        {inBite && (
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: C.green }}>✅ CATCH</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: C.green }}>{Math.round(catchProgress)}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: `1px solid ${C.green}20` }}>
                <div style={{ width: catchProgress + '%', height: '100%', borderRadius: 5, background: `linear-gradient(90deg,${C.green}80,${C.green})`, transition: 'width 0.05s', boxShadow: catchProgress > 80 ? `0 0 10px ${C.green}40` : 'none' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: lineTension > 70 ? C.red : C.orange }}>⚠️ TENSION</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: lineTension > 70 ? C.red : C.orange }}>{Math.round(lineTension)}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: `1px solid ${lineTension > 70 ? C.red : C.orange}20` }}>
                <div style={{ width: lineTension + '%', height: '100%', borderRadius: 5, background: lineTension > 70 ? `linear-gradient(90deg,${C.orange},${C.red})` : `linear-gradient(90deg,${C.gold}80,${C.orange})`, transition: 'width 0.05s', boxShadow: lineTension > 80 ? `0 0 10px ${C.red}50` : 'none' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: escapeTimer > 60 ? C.red : C.text3 }}>🐟 ESCAPE</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: escapeTimer > 60 ? C.red : C.text3 }}>{Math.round(escapeTimer)}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: `1px solid ${escapeTimer > 60 ? C.red : C.text3}15` }}>
                <div style={{ width: escapeTimer + '%', height: '100%', borderRadius: 4, background: escapeTimer > 60 ? `linear-gradient(90deg,${C.orange},${C.red})` : `linear-gradient(90deg,${C.text3}60,${C.text3})`, transition: 'width 0.05s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suction meter */}
        {inBite && (
          <div style={{ width: '100%', maxWidth: 320, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 7, fontWeight: 800, color: C.cyan }}>💨 SUCTION</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: inZone ? C.green : aboveZone ? C.orange : C.red }}>{inZone ? 'IN ZONE ✅' : aboveZone ? 'TOO HIGH ⚠️' : 'TOO LOW ⬇️'}</span>
            </div>
            <div style={{ height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative', border: `1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ position: 'absolute', left: zLo + '%', width: zoneWidth + '%', height: '100%', background: `${C.green}20`, border: `1px solid ${C.green}30`, borderRadius: 2, transition: 'left 0.1s, width 0.1s' }} />
              <div style={{ position: 'absolute', left: `calc(${Math.min(100, suction)}% - 3px)`, top: 0, width: 6, height: '100%', background: inZone ? C.green : aboveZone ? C.orange : C.cyan, borderRadius: 3, transition: 'left 0.03s', boxShadow: `0 0 8px ${inZone ? C.green : aboveZone ? C.orange : C.cyan}60` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 6, color: C.text3 }}>0</span>
              <span style={{ fontSize: 6, color: C.green, fontWeight: 700 }}>TARGET ZONE</span>
              <span style={{ fontSize: 6, color: C.text3 }}>100</span>
            </div>
          </div>
        )}

        {/* Hold to puff instruction */}
        {inBite && (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <div style={{ padding: '10px 0', borderRadius: 14, textAlign: 'center', background: holding ? `linear-gradient(135deg,${C.cyan}20,${C.blue}10)` : 'rgba(255,255,255,0.03)', border: `2px solid ${holding ? C.cyan : 'rgba(255,255,255,0.08)'}`, transform: holding ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.15s', userSelect: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: holding ? C.cyan : C.text2, letterSpacing: 2 }}>{holding ? '🎣 REELING IN...' : 'HOLD TO REEL 🎣'}</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>{holding ? 'Release to lower suction' : 'Hold anywhere to reel in!'}</div>
            </div>
          </div>
        )}

        {/* Recent catches */}
        {recentCatches.length > 0 && (
          <div style={{ width: '100%', maxWidth: 320, marginTop: 8 }}>
            <div style={{ fontSize: 7, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>RECENT CATCHES</div>
            {recentCatches.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', opacity: 1 - i * 0.15 }}>
                <span style={{ fontSize: 14 }}>{c.emoji}</span>
                <span style={{ fontSize: 9, color: c.color, fontWeight: 700 }}>{c.name}</span>
                <span style={{ fontSize: 8, color: C.gold, fontWeight: 700, marginLeft: 'auto' }}>+{c.total}</span>
                {c.bonus > 0 && <span style={{ fontSize: 7, color: C.green }}>({c.bonus} bonus)</span>}
              </div>
            ))}
          </div>
        )}

        {/* Cast again / Done buttons */}
        {(hookPhase === 'caught' || hookPhase === 'escaped' || hookPhase === 'line_break') && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div onClick={(e) => { e.stopPropagation(); castLine() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>🎣 Cast Again</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); stopGameLoop(); awardGame({ won: recentCatches.length > 0, baseCoins: recentCatches.length > 0 ? 60 : 10, baseXP: recentCatches.length > 0 ? 20 : 8 }); navigate('/arcade') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done ✓</div>
          </div>
        )}
      </div>
    </div>
  )
}
