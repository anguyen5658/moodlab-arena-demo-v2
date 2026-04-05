import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const PD_HORSE_EMOJIS = ["🐎", "🏇", "🦄", "🐴", "🎠", "🐪"]
const PD_HORSE_NAMES = ["Thunder Puff", "Blinker Bolt", "Cloud Chaser", "Sativa Sprint", "Indica Cruise", "Hybrid Hustle"]
const PD_AI = [
  { bs: 0.6, bc: 0.15, bz: 2.5, rc: 0.1 },
  { bs: 0.9, bc: 0.25, bz: 3.0, rc: 0.05 },
  { bs: 0.5, bc: 0.08, bz: 1.5, rc: 0.15 },
  { bs: 1.0, bc: 0.3, bz: 3.5, rc: 0.03 },
  { bs: 0.4, bc: 0.05, bz: 1.0, rc: 0.2 },
  { bs: 0.7, bc: 0.18, bz: 2.0, rc: 0.08 },
]

const HORSES = [
  { id: 0, speed: 1.0, stamina: 0.9 },
  { id: 1, speed: 1.2, stamina: 0.7 },
  { id: 2, speed: 0.8, stamina: 1.2 },
  { id: 3, speed: 1.3, stamina: 0.6 },
  { id: 4, speed: 0.7, stamina: 1.3 },
  { id: 5, speed: 1.0, stamina: 1.0 },
]

type Phase = 'pick' | 'countdown' | 'racing' | 'result'

export default function PuffDerby() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('pick')
  const [playerHorse, setPlayerHorse] = useState<number | null>(null)
  const [raceTime, setRaceTime] = useState(30)
  const [puffCount, setPuffCount] = useState(0)
  const [stamina, setStamina] = useState(100)
  const [positions, setPositions] = useState([0, 0, 0, 0, 0, 0])
  const [finishOrder, setFinishOrder] = useState<number[]>([])
  const [commentary, setCommentary] = useState('')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)

  const pdAiRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pdPosRef = useRef([0, 0, 0, 0, 0, 0])
  const pdStaminaRef = useRef(100)
  const pdLastPuff = useRef(0)
  const pdFinishRef = useRef<number[]>([])
  const playerHorseRef = useRef<number | null>(null)
  const phaseRef = useRef<Phase>('pick')

  const triggerFlash = (type: string) => {
    setScreenFlash(type)
    setTimeout(() => setScreenFlash(null), 400)
  }

  const spawnConfetti = (count = 30) => {
    const colors = [C.green, C.gold, C.cyan, C.pink]
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 40,
      size: 4 + Math.random() * 4,
      color: colors[i % 4],
      rot: Math.random() * 360,
    }))
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 2000)
  }

  const endRace = useCallback((pi: number) => {
    if (pdAiRef.current) { clearInterval(pdAiRef.current); pdAiRef.current = null }
    if (pdTimerRef.current) { clearInterval(pdTimerRef.current); pdTimerRef.current = null }
    const fin = [...pdFinishRef.current]
    const rem = [0, 1, 2, 3, 4, 5].filter(i => !fin.includes(i))
    rem.sort((a, b) => pdPosRef.current[b] - pdPosRef.current[a])
    const fo = [...fin, ...rem]
    pdFinishRef.current = fo
    setFinishOrder(fo)
    const place = fo.indexOf(pi) + 1
    phaseRef.current = 'result'
    setPhase('result')
    awardGame({ won: place <= 2, baseCoins: place <= 2 ? 30 : 5, baseXP: place <= 2 ? 20 : 8 })
    if (place === 1) {
      setCommentary(`${PD_HORSE_NAMES[pi]} WINS!`)
      triggerFlash('goal')
      playFx('crowd')
      spawnConfetti(30)
    } else if (place <= 3) {
      setCommentary('Top 3!')
      playFx('select')
    } else {
      setCommentary('Better luck next time!')
      playFx('tap')
    }
  }, [playFx, awardGame])

  const startRace = useCallback((pi: number) => {
    pdPosRef.current = [0, 0, 0, 0, 0, 0]
    pdFinishRef.current = []
    pdStaminaRef.current = 100
    pdLastPuff.current = Date.now()
    let tl = 30
    setRaceTime(30)

    pdAiRef.current = setInterval(() => {
      if (Date.now() - pdLastPuff.current > 500) {
        pdStaminaRef.current = Math.min(100, pdStaminaRef.current + 0.6)
        setStamina(Math.round(pdStaminaRef.current))
      }
      const np = [...pdPosRef.current]
      for (let i = 0; i < 6; i++) {
        if (i === pi || pdFinishRef.current.includes(i)) continue
        const p = PD_AI[i]
        let mv = p.bs * (0.6 + Math.random() * 0.8)
        if (Math.random() < p.bc) mv += p.bz
        if (Math.random() < p.rc) mv = 0
        if (np[i] > 70) mv *= 1.2
        if (np[i] > 90) mv *= 1.1
        np[i] = Math.min(100, np[i] + mv * 0.16)
        if (np[i] >= 100 && !pdFinishRef.current.includes(i)) {
          pdFinishRef.current = [...pdFinishRef.current, i]
          setFinishOrder([...pdFinishRef.current])
        }
      }
      if (np[pi] >= 100 && !pdFinishRef.current.includes(pi)) {
        pdFinishRef.current = [...pdFinishRef.current, pi]
        setFinishOrder([...pdFinishRef.current])
      }
      pdPosRef.current = np
      setPositions([...np])
      if (pdFinishRef.current.length >= 6) endRace(pi)
    }, 50)

    pdTimerRef.current = setInterval(() => {
      tl--
      setRaceTime(tl)
      if (tl <= 10 && tl > 0) setCommentary(`${tl} seconds!`)
      if (tl <= 0) endRace(pi)
    }, 1000)
  }, [endRace])

  const pickHorse = (idx: number) => {
    setPlayerHorse(idx)
    playerHorseRef.current = idx
    playFx('select')
    setCommentary(`${PD_HORSE_NAMES[idx]} selected!`)
    setPhase('countdown')
    phaseRef.current = 'countdown'
    let c = 3
    const cd = setInterval(() => {
      c--
      if (c <= 0) {
        clearInterval(cd)
        setPhase('racing')
        phaseRef.current = 'racing'
        setCommentary("AND THEY'RE OFF!")
        playFx('whistle')
        triggerFlash('goal')
        startRace(idx)
      }
    }, 800)
  }

  const doPuff = useCallback(() => {
    if (phaseRef.current !== 'racing' || playerHorseRef.current === null) return
    const idx = playerHorseRef.current
    pdLastPuff.current = Date.now()
    setPuffCount(p => p + 1)
    playFx('tap')
    let boost = 3 + Math.random() * 2
    if (pdStaminaRef.current <= 0) {
      boost = 1
    } else {
      pdStaminaRef.current = Math.max(0, pdStaminaRef.current - 3)
      setStamina(Math.round(pdStaminaRef.current))
    }
    const np = [...pdPosRef.current]
    np[idx] = Math.min(100, np[idx] + boost)
    pdPosRef.current = np
    setPositions([...np])
    if (np[idx] >= 100 && !pdFinishRef.current.includes(idx)) {
      pdFinishRef.current = [...pdFinishRef.current, idx]
      setFinishOrder([...pdFinishRef.current])
    }
  }, [playFx])

  const startGame = useCallback(() => {
    if (pdAiRef.current) { clearInterval(pdAiRef.current); pdAiRef.current = null }
    if (pdTimerRef.current) { clearInterval(pdTimerRef.current); pdTimerRef.current = null }
    setPlayerHorse(null)
    playerHorseRef.current = null
    setRaceTime(30)
    setPuffCount(0)
    setStamina(100)
    pdStaminaRef.current = 100
    setPositions([0, 0, 0, 0, 0, 0])
    pdPosRef.current = [0, 0, 0, 0, 0, 0]
    setFinishOrder([])
    pdFinishRef.current = []
    pdLastPuff.current = 0
    setPhase('pick')
    phaseRef.current = 'pick'
    setCommentary('Pick your horse!')
    playFx('crowd')
  }, [playFx])

  // BLE puff → tap for racing
  const handlePuffDown = useCallback(() => {
    doPuff()
  }, [doPuff])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, null)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown])

  useEffect(() => {
    startGame()
    return () => {
      if (pdAiRef.current) clearInterval(pdAiRef.current)
      if (pdTimerRef.current) clearInterval(pdTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pi = playerHorse ?? -1
  const stC = stamina > 60 ? C.green : stamina > 30 ? C.gold : C.red
  const pPlace = finishOrder.indexOf(pi) + 1

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={() => { if (phase === 'racing') doPuff() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a2810 0%, #0d3318 20%, #0f4020 40%, #0a3015 65%, #061f0c 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.25)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}
      <div data-back="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 400, width: '100%', padding: '50px 12px 20px', gap: 6, zIndex: 10, flex: 1, overflowY: 'auto', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg, ${C.green}, ${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {phase === 'result' ? 'RACE RESULTS' : 'PUFF DERBY'}
          </div>
          {phase === 'racing' && <div style={{ fontSize: 9, color: C.text3 }}>Time: {raceTime}s | Puffs: {puffCount}</div>}
        </div>

        {/* Pick phase */}
        {phase === 'pick' && (
          <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text2, textAlign: 'center', marginBottom: 12 }}>Pick your horse!</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {HORSES.map((h, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); pickHorse(i) }} style={{ padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg, ${C.green}10, ${C.green}05)`, border: `1px solid ${C.green}25` }}>
                  <div style={{ fontSize: 32 }}>{PD_HORSE_EMOJIS[i]}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginTop: 4 }}>{PD_HORSE_NAMES[i]}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 8, color: C.cyan, padding: '1px 5px', borderRadius: 4, background: `${C.cyan}10` }}>SPD:{h.speed.toFixed(1)}</span>
                    <span style={{ fontSize: 8, color: C.gold, padding: '1px 5px', borderRadius: 4, background: `${C.gold}10` }}>STA:{h.stamina.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown */}
        {phase === 'countdown' && pi >= 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{PD_HORSE_EMOJIS[pi]}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.green, marginBottom: 8 }}>{PD_HORSE_NAMES[pi]}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, animation: 'countPulse 0.8s infinite' }}>GET READY!</div>
          </div>
        )}

        {/* Racing */}
        {phase === 'racing' && (
          <div style={{ width: '100%' }}>
            {/* Timer bar */}
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(raceTime / 30) * 100}%`, background: raceTime > 10 ? `linear-gradient(90deg,${C.green},${C.cyan})` : `linear-gradient(90deg,${C.red},${C.orange})`, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            {/* Horse tracks */}
            <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.green}20`, padding: '4px 0' }}>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const pos = positions[i]
                const isP = i === pi
                const fin = finishOrder.includes(i)
                const pl = finishOrder.indexOf(i) + 1
                return (
                  <div key={'ln' + i} style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', background: isP ? 'rgba(0,229,255,0.06)' : 'transparent', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ fontSize: 7, fontWeight: 700, color: isP ? C.cyan : C.text3, width: 14, textAlign: 'center' }}>{i + 1}</div>
                    <div style={{ flex: 1, height: 20, position: 'relative', marginLeft: 4, marginRight: 4 }}>
                      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: `${C.gold}40` }} />
                      <div style={{ position: 'absolute', left: `${pos * 0.92}%`, top: '50%', transform: 'translateY(-50%)', fontSize: isP ? 18 : 14, transition: 'left 0.08s linear', filter: isP ? `drop-shadow(0 0 6px ${C.cyan}60)` : 'none' }}>
                        {PD_HORSE_EMOJIS[i]}
                      </div>
                    </div>
                    {fin
                      ? <div style={{ fontSize: 8, fontWeight: 900, color: pl === 1 ? C.gold : pl <= 3 ? C.green : C.text3, width: 16, textAlign: 'center' }}>#{pl}</div>
                      : <div style={{ fontSize: 7, color: C.text3, width: 16, textAlign: 'center' }}>{Math.round(pos)}%</div>
                    }
                  </div>
                )
              })}
            </div>
            {/* Stamina */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: stC }}>Stamina: {Math.round(stamina)}%</span>
                <span style={{ fontSize: 9, color: C.text3 }}>Puffs: {puffCount}</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stamina}%`, background: `linear-gradient(90deg,${stC},${stC}80)`, borderRadius: 4, transition: 'width 0.15s' }} />
              </div>
              {stamina <= 0 && <div style={{ fontSize: 8, color: C.red, fontWeight: 700, marginTop: 2, animation: 'pulse 0.5s infinite' }}>EXHAUSTED!</div>}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>TAP TO GALLOP! 🏇</div>
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && pi >= 0 && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {pPlace === 1 && (
              <div>
                <div style={{ fontSize: 56, marginBottom: 8, animation: 'countPulse 1s infinite' }}>{PD_HORSE_EMOJIS[pi]}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.gold, marginBottom: 4 }}>WINNER!</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>+500 coins</div>
              </div>
            )}
            {pPlace > 1 && pPlace <= 3 && (
              <div>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{PD_HORSE_EMOJIS[pi]}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.green, marginBottom: 4 }}>#{pPlace} PLACE!</div>
              </div>
            )}
            {pPlace > 3 && (
              <div>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{PD_HORSE_EMOJIS[pi]}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text3, marginBottom: 4 }}>#{pPlace} PLACE</div>
              </div>
            )}
            {/* Standings */}
            <div style={{ marginTop: 16, maxWidth: 300, margin: '16px auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 6 }}>FINAL STANDINGS</div>
              {finishOrder.slice(0, 6).map((hI, pl) => (
                <div key={'r' + pl} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, marginBottom: 2, background: hI === pi ? `${C.cyan}10` : 'transparent' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: pl === 0 ? C.gold : pl < 3 ? C.green : C.text3, width: 20 }}>#{pl + 1}</span>
                  <span style={{ fontSize: 14 }}>{PD_HORSE_EMOJIS[hI]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: hI === pi ? C.cyan : C.text2, flex: 1 }}>{PD_HORSE_NAMES[hI]}</span>
                  {hI === pi && <span style={{ fontSize: 8, color: C.cyan, fontWeight: 700 }}>YOU</span>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
              <div onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green }}>Race Again</div>
              <div onClick={(e) => { e.stopPropagation(); navigate('/arcade') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
