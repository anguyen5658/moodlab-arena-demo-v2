import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'

const RP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const RP_LANES = ['🎸', '🥁', '🎹', '🎷']
const RP_LANE_COLORS = [C.red, '#00E5FF', C.gold, C.purple]
const RP_HIT_ZONE = 82
const RP_COMBO_TIERS = [{ min: 50, mult: 10 }, { min: 20, mult: 5 }, { min: 10, mult: 3 }, { min: 5, mult: 2 }, { min: 0, mult: 1 }]

const rpGetMultiplier = (combo: number): number => {
  for (const t of RP_COMBO_TIERS) { if (combo >= t.min) return t.mult }
  return 1
}

const rpComedy = {
  perfect: ['PERFECT! 🎯', 'NAILED IT! 🔥', 'FLAWLESS! 🙏'],
  good: ['GOOD! 🎵', 'Nice one!', 'Solid hit!'],
  ok: ['OK!', 'Close enough', 'Barely!'],
  miss: ['Miss! 💀', 'MISS!', 'The beat is crying'],
  combo5: ['COMBO x5! 🔥', '5 streak!'],
  combo10: ['COMBO x10! 🌊', 'x10!'],
  combo20: ['COMBO x20! 👑', 'x20! LEGENDARY!'],
  combo50: ['COMBO x50! 💨', 'x50! INHUMAN!'],
  blinker: ['BLINKER HIT! 🫁', 'BLINKER! 💨'],
  puff: ['PUFF COMBO! 🫁', 'Big puff energy!'],
  gameover: ['Game over!', "Stage lights OFF"],
  win: ['ENCORE! 🎤', 'CHAMPION! 🏆'],
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

interface Note { id: number; lane: number; y: number; hit: boolean; spawned: number }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }

type Phase = 'intro' | 'playing' | 'result' | null

export const RhythmPuffGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [misses, setMisses] = useState(0)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<{ text: string; color: string; lane: number; id: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [blinker, setBlinker] = useState(false)
  const [introStep, setIntroStep] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)
  const comboRef = useRef(0)
  useEffect(() => { comboRef.current = combo }, [combo])

  const rpCleanup = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const spawnParticles = useCallback((lane: number, color: string, count = 8) => {
    const px = 12.5 + lane * 25
    const parts: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + Math.random() + i, x: px + (Math.random() - 0.5) * 10, y: RP_HIT_ZONE + (Math.random() - 0.5) * 5,
      vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 4, color, size: 3 + Math.random() * 4, life: 1,
    }))
    setParticles(p => [...p, ...parts])
    setTimeout(() => setParticles(p => p.filter(pp => pp.id < Date.now() - 600)), 700)
  }, [])

  const showRating = useCallback((text: string, color: string, lane: number) => {
    setRating({ text, color, lane, id: Date.now() })
    setTimeout(() => setRating(null), 600)
  }, [])

  const hitNote = useCallback((lane: number) => {
    setNotes(currentNotes => {
      const candidates = currentNotes.map((n, i) => ({ ...n, idx: i })).filter(n => n.lane === lane && !n.hit)
      const inZone = candidates.filter(n => n.y > RP_HIT_ZONE - 18 && n.y < RP_HIT_ZONE + 12)
      if (inZone.length === 0) {
        setCombo(0)
        setMisses(m => m + 1)
        setComment('Wrong lane! 😬')
        audio.playFx('rhythm_miss')
        showRating('MISS', C.red, lane)
        return currentNotes
      }
      const closest = inZone.reduce((a, b) => Math.abs(a.y - RP_HIT_ZONE) < Math.abs(b.y - RP_HIT_ZONE) ? a : b)
      const dist = Math.abs(closest.y - RP_HIT_ZONE)
      const newN = [...currentNotes]
      newN[closest.idx] = { ...newN[closest.idx], hit: true }
      let rName = 'MISS', pts = 0, rColor = C.red
      if (dist <= 8) { rName = 'PERFECT'; pts = 100; rColor = C.gold; spawnParticles(lane, RP_LANE_COLORS[lane], 12) }
      else if (dist <= 14) { rName = 'GOOD'; pts = 75; rColor = C.green; spawnParticles(lane, RP_LANE_COLORS[lane], 6) }
      else if (dist <= 22) { rName = 'OK'; pts = 50; rColor = C.orange }
      if (rName === 'MISS') {
        setCombo(0)
        setMisses(m => m + 1)
        setComment(pick(rpComedy.miss))
        audio.playFx('rhythm_miss')
      } else {
        const mult = rpGetMultiplier(comboRef.current)
        const finalPts = pts * mult
        setScore(s => s + finalPts)
        setCombo(c => {
          const nc = c + 1
          setMaxCombo(m => Math.max(m, nc))
          if (nc === 50) setComment(pick(rpComedy.combo50))
          else if (nc === 20) setComment(pick(rpComedy.combo20))
          else if (nc === 10) setComment(pick(rpComedy.combo10))
          else if (nc === 5) setComment(pick(rpComedy.combo5))
          else if (rName === 'PERFECT') setComment(pick(rpComedy.perfect))
          else if (rName === 'GOOD') setComment(pick(rpComedy.good))
          else setComment(pick(rpComedy.ok))
          return nc
        })
        if (rName === 'PERFECT') audio.playFx('rhythm_perfect')
        else audio.playFx('rhythm_hit')
      }
      showRating(rName, rColor, lane)
      return newN
    })
  }, [audio, spawnParticles, showRating])

  const puffHit = useCallback(() => {
    setNotes(currentNotes => {
      const inZone = currentNotes.filter(n => !n.hit && n.y > RP_HIT_ZONE - 15 && n.y < RP_HIT_ZONE + 10)
      if (inZone.length === 0) return currentNotes
      const newN = [...currentNotes]
      inZone.forEach(n => {
        const idx = newN.findIndex(nn => nn.id === n.id)
        if (idx >= 0) newN[idx] = { ...newN[idx], hit: true }
        spawnParticles(n.lane, RP_LANE_COLORS[n.lane], 8)
      })
      const mult = rpGetMultiplier(comboRef.current)
      setScore(s => s + inZone.length * 75 * mult)
      setCombo(c => {
        const nc = c + inZone.length
        setMaxCombo(m => Math.max(m, nc))
        return nc
      })
      setComment(inZone.length > 3 ? pick(rpComedy.blinker) : pick(rpComedy.puff))
      audio.playFx('kick')
      showRating(`PUFF x${inZone.length}`, C.cyan, 1)
      return newN
    })
  }, [audio, spawnParticles, showRating])

  const blinkerPuff = useCallback(() => {
    if (blinker) return
    setBlinker(true)
    setComment(pick(rpComedy.blinker))
    audio.playFx('win')
    setNotes(currentNotes => {
      const unhit = currentNotes.filter(n => !n.hit)
      if (unhit.length === 0) return currentNotes
      const newN = currentNotes.map(n => n.hit ? n : { ...n, hit: true })
      unhit.forEach(n => spawnParticles(n.lane, RP_LANE_COLORS[n.lane], 6))
      const mult = rpGetMultiplier(comboRef.current)
      setScore(s => s + unhit.length * 100 * mult)
      setCombo(c => {
        const nc = c + unhit.length
        setMaxCombo(m => Math.max(m, nc))
        return nc
      })
      showRating(`BLINKER! x${unhit.length}`, C.pink, 2)
      return newN
    })
    player.spawnConfetti(25, [C.pink, C.purple, C.gold, C.cyan])
    setTimeout(() => setBlinker(false), 2000)
  }, [blinker, audio, player, spawnParticles, showRating])

  const startGame = useCallback(() => {
    rpCleanup()
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    setNotes([])
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setMisses(0)
    setComment('')
    setRating(null)
    setParticles([])
    setBlinker(false)
    setIntroStep(0)
    setPhase('intro')
    audio.playFx('crowd')
    setTimeout(() => { if (activeRef.current.v) setIntroStep(1) }, 400)
    setTimeout(() => { if (activeRef.current.v) setIntroStep(2) }, 1200)
    setTimeout(() => { if (activeRef.current.v) setIntroStep(3) }, 2200)
    setTimeout(() => { if (activeRef.current.v) { setIntroStep(4); audio.playFx('whistle') } }, 3000)
    setTimeout(() => {
      if (!activeRef.current.v) return
      setPhase('playing')
      setIntroStep(0)
      if (intervalRef.current) clearInterval(intervalRef.current)
      let beatCount = 0
      let currentSpeed = 3
      intervalRef.current = setInterval(() => {
        if (!activeRef.current.v) return
        beatCount++
        if (beatCount % 500 === 0 && currentSpeed < 6) currentSpeed += 0.25
        setNotes(ns => {
          let nn = [...ns.map(n => ({ ...n, y: n.y + currentSpeed })).filter(n => {
            if (n.y > 95 && !n.hit) {
              setMisses(m => {
                if (m + 1 >= 15) {
                  if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
                  setPhase('result')
                  audio.playFx('lose')
                  setComment(pick(rpComedy.gameover))
                }
                return m + 1
              })
              setCombo(0)
              setComment(pick(rpComedy.miss))
              showRating('MISS', C.red, n.lane)
              audio.playFx('error')
              return false
            }
            return n.y < 110
          })]
          const spawnRate = beatCount < 300 ? 10 : beatCount < 600 ? 8 : 6
          if (beatCount % spawnRate === 0) {
            const lane = Math.floor(Math.random() * 4)
            nn.push({ id: Date.now() + Math.random(), lane, y: -5, hit: false, spawned: Date.now() })
          }
          if (beatCount > 200 && beatCount % 20 === 0 && Math.random() > 0.5) {
            const lane2 = Math.floor(Math.random() * 4)
            nn.push({ id: Date.now() + Math.random() + 0.5, lane: lane2, y: -5, hit: false, spawned: Date.now() })
          }
          return nn
        })
      }, 60)
    }, 4000)
  }, [audio, rpCleanup, showRating])

  const endGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    rpCleanup()
    const won = score > 500
    const baseR = won ? 80 : 12
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(won, baseR, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    player.notify(`🎵 Score: ${score} | +${baseR} coins!`, C.purple)
    if (won) player.spawnConfetti(40, [C.purple, C.pink, C.gold, C.cyan])
    setPhase(null)
    game.exitGame()
  }, [audio, player, ble, game, score, rpCleanup])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const dpr = RP_DPR
    const t = Date.now() * 0.001
    ctx.clearRect(0, 0, W, H)

    const skyG = ctx.createLinearGradient(0, 0, 0, H)
    skyG.addColorStop(0, '#0a0a28')
    skyG.addColorStop(0.3, '#150030')
    skyG.addColorStop(0.6, '#0d0a2e')
    skyG.addColorStop(1, '#0a0a1e')
    ctx.fillStyle = skyG
    ctx.fillRect(0, 0, W, H)

    const laneColors = ['#FF4444', '#00E5FF', '#FFD93D', '#C084FC']
    for (let i = 0; i < 4; i++) {
      const cx = W * (0.125 + i * 0.25)
      const glow = ctx.createRadialGradient(cx, 0, 0, cx, H * 0.6, W * 0.15)
      glow.addColorStop(0, laneColors[i] + '18')
      glow.addColorStop(0.5, laneColors[i] + '08')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.moveTo(cx - 4 * dpr, 0)
      ctx.lineTo(cx - W * 0.12, H * 0.7)
      ctx.lineTo(cx + W * 0.12, H * 0.7)
      ctx.lineTo(cx + 4 * dpr, 0)
      ctx.fill()
    }

    for (let i = 0; i < 4; i++) {
      const lx = W * (i * 0.25)
      const laneG = ctx.createLinearGradient(0, 0, 0, H)
      laneG.addColorStop(0, laneColors[i] + '03')
      laneG.addColorStop(0.8, laneColors[i] + '0A')
      laneG.addColorStop(1, laneColors[i] + '15')
      ctx.fillStyle = laneG
      ctx.fillRect(lx, 0, W * 0.25, H)
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'
        ctx.lineWidth = 1 * dpr
        ctx.beginPath()
        ctx.moveTo(lx, 0)
        ctx.lineTo(lx, H)
        ctx.stroke()
      }
    }

    const hitY = H * (RP_HIT_ZONE / 100)
    const beatPulse = Math.sin(t * 8) * 0.3 + 0.7
    for (let i = 0; i < 4; i++) {
      const lx = W * (i * 0.25)
      const hzG = ctx.createLinearGradient(0, hitY - 6 * dpr, 0, hitY + 6 * dpr)
      hzG.addColorStop(0, 'transparent')
      hzG.addColorStop(0.5, laneColors[i] + (beatPulse > 0.8 ? '50' : '25'))
      hzG.addColorStop(1, 'transparent')
      ctx.fillStyle = hzG
      ctx.fillRect(lx, hitY - 6 * dpr, W * 0.25, 12 * dpr)
    }

    const crowdBaseY = H * 0.92
    for (let i = 0; i < 24; i++) {
      const cx = (i / 24) * W + Math.sin(i * 2.3) * 3 * dpr
      const waveOff = Math.sin(t * 3 + i * 0.7) * 3 * dpr
      const headR = 4 * dpr
      const bodyH = 10 * dpr
      ctx.fillStyle = 'rgba(20,10,35,0.85)'
      ctx.beginPath()
      ctx.arc(cx, crowdBaseY - waveOff, headR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(cx - headR * 0.6, crowdBaseY - waveOff + headR, headR * 1.2, bodyH)
    }
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'rhythm') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      drawCanvas()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [drawCanvas])

  useEffect(() => {
    if (game.gameActive?.id !== 'rhythm') return
    ble.registerPuffHandlers('rhythm', () => puffHit(), () => blinkerPuff())
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      rpCleanup()
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'rhythm') return null

  const mult = rpGetMultiplier(combo)
  const isPlaying = phase === 'playing'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: `1px solid ${blinker ? 'rgba(255,50,200,0.2)' : 'rgba(160,50,220,0.15)'}` }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: ble.bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${ble.bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ble.bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: ble.bleConnected ? C.green : C.orange }}>{ble.bleConnected ? 'Puff' : 'Connect'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
              <span style={{ fontSize: 9 }}>🪙</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{player.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={() => { audio.playFx('tap'); endGame() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0, touchAction: 'none' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: blinker ? C.pink : C.purple }}>🎵 RHYTHM PUFF</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{score.toLocaleString()}pts</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: combo >= 10 ? C.orange : combo >= 5 ? C.gold : C.text }}>
            {isPlaying ? `${combo}x Combo` : phase === 'intro' ? 'Get Ready...' : 'Game Over'}
          </span>
          {mult > 1 && <span style={{ fontSize: 8, fontWeight: 900, color: C.cyan }}>x{mult} MULT</span>}
          {isPlaying && <span style={{ fontSize: 9, fontWeight: 700, color: misses >= 12 ? C.red : misses >= 8 ? C.orange : C.text3 }}>{misses}/15 miss</span>}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * RP_DPR)} height={Math.round(600 * RP_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {isPlaying && notes.filter(n => !n.hit).map(n => {
          const nc = RP_LANE_COLORS[n.lane]
          const nearHit = n.y > RP_HIT_ZONE - 15
          return (
            <div key={n.id} style={{ position: 'absolute', left: `${n.lane * 25 + 7}%`, top: `${n.y}%`, width: '11%', height: 14, borderRadius: 7, zIndex: 6, background: `linear-gradient(135deg,${nc},${nc}CC)`, boxShadow: `0 0 ${nearHit ? 16 : 8}px ${nc}${nearHit ? '80' : '40'}`, transition: 'top 0.06s linear', transform: nearHit ? 'scale(1.1)' : 'scale(1)' }} />
          )
        })}

        {rating && (
          <div style={{ position: 'absolute', left: `${(rating.lane || 0) * 25 + 12.5}%`, top: `${RP_HIT_ZONE - 12}%`, transform: 'translateX(-50%)', zIndex: 15, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: rating.color, letterSpacing: 2 }}>{rating.text}</div>
          </div>
        )}

        {particles.map(p => (
          <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: p.color, zIndex: 12, pointerEvents: 'none' }} />
        ))}

        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)' }}>
            {introStep >= 2 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: C.purple }}>RHYTHM PUFF</div>
                <div style={{ fontSize: 14, color: C.pink, fontWeight: 700, marginTop: 4, letterSpacing: 2 }}>🎵 Guitar Hero x Puff Session 🎵</div>
              </div>
            )}
            {introStep >= 3 && (
              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                {RP_LANES.map((lane, i) => (
                  <div key={i} style={{ fontSize: 28 }}>{lane}</div>
                ))}
              </div>
            )}
            {introStep >= 4 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, letterSpacing: 4 }}>3, 2, 1, DROP!</div>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (() => {
          const won = score > 500
          const baseR = won ? 80 : 12
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '🎤'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: won ? C.gold : C.purple }}>{won ? 'ENCORE!' : 'SHOW OVER'}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, marginTop: 8 }}>{score.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>points</div>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>PERFORMANCE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.orange }}>{maxCombo}x</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>MAX COMBO</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.red }}>{misses}</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>MISSES</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.green }}>+{baseR}</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>COINS</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div onClick={() => { setPhase(null); startedRef.current = false; startGame(); startedRef.current = true }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 13, fontWeight: 800, color: C.purple, touchAction: 'none' }}>Play Again</div>
                <div onClick={endGame} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>

      {isPlaying && (
        <div style={{ position: 'relative', zIndex: 60, flexShrink: 0, padding: '8px 12px 14px', background: 'rgba(6,16,30,0.98)', borderTop: '1px solid rgba(160,50,220,0.08)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {RP_LANES.map((lane, li) => (
              <div key={li} onClick={(e) => { e.stopPropagation(); hitNote(li) }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${RP_LANE_COLORS[li]}15,${RP_LANE_COLORS[li]}08)`, border: `2px solid ${RP_LANE_COLORS[li]}35`, fontSize: 20, userSelect: 'none', touchAction: 'none' }}>
                {lane}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={(e) => { e.stopPropagation(); puffHit() }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}12,${C.cyan}06)`, border: `2px solid ${C.cyan}35`, fontSize: 13, fontWeight: 800, color: C.cyan, userSelect: 'none', touchAction: 'none' }}>💨 PUFF</div>
            <div onClick={(e) => { e.stopPropagation(); blinkerPuff() }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: blinker ? `linear-gradient(135deg,${C.pink}25,${C.pink}15)` : `linear-gradient(135deg,${C.pink}12,${C.pink}06)`, border: `2px solid ${blinker ? C.pink : C.pink + '35'}`, fontSize: 13, fontWeight: 800, color: C.pink, opacity: blinker ? 0.5 : 1, userSelect: 'none', touchAction: 'none' }}>🫁 BLINKER</div>
          </div>
          {comment && <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, fontWeight: 700, color: combo >= 10 ? C.gold : combo >= 5 ? C.orange : C.text }}>{comment}</div>}
        </div>
      )}
    </div>
  )
}

