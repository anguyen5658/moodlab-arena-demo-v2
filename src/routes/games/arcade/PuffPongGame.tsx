import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { getPuffPower } from '../../../hooks/useGameEffects'
import { PuffBar } from '../../../components/shared/PuffBar'

const PP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const PP_WIN_SCORE = 5
const PP_PADDLE_H = 0.22
const PP_PADDLE_W = 12
const PP_BALL_R = 7

const PP_HIT = ["Nice return! 🏓", "Puff power! 💨", "Clean shot! ✨", "Smoked it! 🔥", "Right back atcha! 🎯", "THC reflexes! 💚", "Paddle wizard! 🧙"]
const PP_SMASH = ["SMASH! Sound barrier broken 💥", "OBLITERATED! 🌟", "NUCLEAR PUFF! ☢️💨", "That ball has a family! 😱", "Perfect center BOOM! 💣", "DEVASTATING power hit! ⚡"]
const PP_SY = ["YOU SCORE! 🎉", "GOOOAL! 🥅💨", "AI needs firmware update 🤖", "POINT! Puff powered 💨🏆", "Ball faster than your delivery 📦"]
const PP_SA = ["AI scores! 😤", "Missed it! 💨", "AI sneaks past! 🤖", "Better positioning! 🎯", "Machine strikes back! 🤖⚡"]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

interface Particle { x: number; y: number; vx: number; vy: number; life: number; decay: number; r: number; color: string }
interface Trail { x: number; y: number; age: number }
interface GameState {
  bx: number; by: number; dx: number; dy: number
  py: number; ay: number
  rally: number; trail: Trail[]; scoreY: number; scoreA: number
  paused: boolean; smash: boolean; lastT: number; power: number; charging: boolean
  particles: Particle[]; shake: number
  impact: { x: number; y: number; t: number } | null
  smashText: number | null
}

export const PuffPongGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<'intro' | 'playing' | 'result' | null>(null)
  const [intro, setIntro] = useState(0)
  const [score, setScore] = useState({ you: 0, ai: 0 })
  const [rally, setRally] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [power, setPower] = useState(0)
  const [puffHeld, setPuffHeld] = useState(false)
  const [smash, setSmash] = useState(false)
  const [comment, setComment] = useState('')
  const [sweetSpot] = useState({ min: 55, max: 80 })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const powerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const powerStartRef = useRef<number>(0)
  const gRef = useRef<GameState>({
    bx: 50, by: 50, dx: 2.2, dy: 1.2, py: 50, ay: 50,
    rally: 0, trail: [], scoreY: 0, scoreA: 0, paused: false,
    smash: false, lastT: 0, power: 0, charging: false,
    particles: [], shake: 0, impact: null, smashText: null,
  })
  const startedRef = useRef(false)

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const g = gRef.current
    for (let i = 0; i < count; i++) {
      g.particles.push({
        x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        life: 1, decay: 0.02 + Math.random() * 0.03, r: 2 + Math.random() * 3, color,
      })
    }
  }, [])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / PP_DPR
    const H = canvas.height / PP_DPR
    const g = gRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(PP_DPR, PP_DPR)
    // Background
    ctx.fillStyle = '#06101E'
    ctx.fillRect(0, 0, W, H)
    // Tron grid
    ctx.strokeStyle = 'rgba(0,229,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
    // Center dashed line
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.setLineDash([])
    // Center circle
    ctx.strokeStyle = 'rgba(0,229,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2); ctx.stroke()
    // Top/bottom borders
    ctx.fillStyle = 'rgba(0,229,255,0.15)'
    ctx.fillRect(0, 0, W, 2); ctx.fillRect(0, H - 2, W, 2)
    // Ball trail
    for (let i = 0; i < g.trail.length; i++) {
      const t = g.trail[i]
      const alpha = Math.max(0, 0.3 - t.age * 0.015)
      const sz = Math.max(1, PP_BALL_R - t.age * 0.25)
      ctx.fillStyle = g.smash && g.power >= 80 ? `rgba(255,200,0,${alpha})` : `rgba(0,229,255,${alpha})`
      ctx.beginPath(); ctx.arc(t.x / 100 * W, t.y / 100 * H, sz, 0, Math.PI * 2); ctx.fill()
    }
    // Speed lines
    const spd = Math.sqrt(g.dx * g.dx + g.dy * g.dy)
    if (spd > 3.5) {
      const bx = g.bx / 100 * W, by = g.by / 100 * H
      const angle = Math.atan2(g.dy, g.dx)
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.3, (spd - 3.5) * 0.1)})`
      ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 5, len = 10 + spd * 3
        ctx.beginPath()
        ctx.moveTo(bx - Math.cos(angle) * len + Math.sin(angle) * off, by - Math.sin(angle) * len - Math.cos(angle) * off)
        ctx.lineTo(bx + Math.sin(angle) * off, by - Math.cos(angle) * off)
        ctx.stroke()
      }
    }
    // Player paddle (left)
    const padH = H * PP_PADDLE_H
    const pyPx = (g.py / 100) * H
    const padGlow = g.charging ? (g.power > 80 ? 30 : g.power > 40 ? 20 : 12) : 8
    const padColor = g.charging ? (g.power > 80 ? '#FFD93D' : g.power > 40 ? '#7FFF00' : '#00E5FF') : '#00E5FF'
    ctx.shadowColor = padColor; ctx.shadowBlur = padGlow
    const padGrad = ctx.createLinearGradient(0, pyPx - padH / 2, 0, pyPx + padH / 2)
    padGrad.addColorStop(0, padColor + 'CC'); padGrad.addColorStop(1, padColor)
    ctx.fillStyle = padGrad
    ctx.beginPath(); (ctx as any).roundRect(8, pyPx - padH / 2, PP_PADDLE_W, padH, 5); ctx.fill()
    ctx.shadowBlur = 0
    // Charge bar on paddle
    if (g.charging && g.power > 5) {
      const barH = (g.power / 100) * padH
      ctx.fillStyle = g.power > 80 ? 'rgba(255,217,61,0.5)' : g.power > 40 ? 'rgba(127,255,0,0.4)' : 'rgba(0,229,255,0.3)'
      ctx.fillRect(8, pyPx + padH / 2 - barH, PP_PADDLE_W, barH)
    }
    // AI paddle
    const ayPx = (g.ay / 100) * H
    const aiPadH = H * 0.18
    ctx.shadowColor = '#FF5A5A'; ctx.shadowBlur = 8
    const aiGrad = ctx.createLinearGradient(0, ayPx - aiPadH / 2, 0, ayPx + aiPadH / 2)
    aiGrad.addColorStop(0, '#FF5A5ACC'); aiGrad.addColorStop(1, '#FF5A5A')
    ctx.fillStyle = aiGrad
    ctx.beginPath(); (ctx as any).roundRect(W - 8 - PP_PADDLE_W, ayPx - aiPadH / 2, PP_PADDLE_W, aiPadH, 5); ctx.fill()
    ctx.shadowBlur = 0
    // Ball
    const ballX = g.bx / 100 * W, ballY = g.by / 100 * H
    const isSmash = g.smash && g.power >= 80
    ctx.shadowColor = isSmash ? '#FFD93D' : '#00E5FF'
    ctx.shadowBlur = isSmash ? 25 : 15
    const ballGrad = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, PP_BALL_R + 2)
    if (isSmash) {
      ballGrad.addColorStop(0, '#FFFFFF'); ballGrad.addColorStop(0.5, '#FFD93D'); ballGrad.addColorStop(1, 'rgba(255,90,90,0.6)')
    } else {
      ballGrad.addColorStop(0, '#FFFFFF'); ballGrad.addColorStop(0.6, 'rgba(0,229,255,0.9)'); ballGrad.addColorStop(1, 'rgba(0,229,255,0.3)')
    }
    ctx.fillStyle = ballGrad
    ctx.beginPath(); ctx.arc(ballX, ballY, PP_BALL_R, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0
    // Particles
    g.particles = g.particles.filter(p => p.life > 0)
    for (const p of g.particles) {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay; p.vx *= 0.96; p.vy *= 0.96
      const hex = p.color.replace('#', '')
      const pr = parseInt(hex.substring(0, 2), 16), pg = parseInt(hex.substring(2, 4), 16), pb = parseInt(hex.substring(4, 6), 16)
      ctx.fillStyle = `rgba(${pr},${pg},${pb},${p.life})`
      ctx.beginPath(); ctx.arc(p.x / 100 * W, p.y / 100 * H, p.r * p.life, 0, Math.PI * 2); ctx.fill()
    }
    // Impact flash
    if (g.impact && Date.now() - g.impact.t < 250) {
      const iAlpha = 1 - (Date.now() - g.impact.t) / 250
      const ix = g.impact.x / 100 * W, iy = g.impact.y / 100 * H
      const impGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, 25)
      impGrad.addColorStop(0, `rgba(255,255,255,${iAlpha * 0.9})`); impGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = impGrad
      ctx.beginPath(); ctx.arc(ix, iy, 25, 0, Math.PI * 2); ctx.fill()
    }
    // Smash text
    if (g.smashText && Date.now() - g.smashText < 500) {
      const sa = 1 - (Date.now() - g.smashText) / 500
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + (1 - sa) * 0.5, 1 + (1 - sa) * 0.5)
      ctx.font = '900 28px monospace'; ctx.fillStyle = `rgba(255,217,61,${sa})`
      ctx.shadowColor = '#FFD93D'; ctx.shadowBlur = 20
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SMASH!', 0, 0)
      ctx.restore()
    }
    if (g.shake > 0) g.shake -= 0.05
    // Score overlay
    ctx.font = '900 48px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.shadowBlur = 15
    ctx.shadowColor = '#00E5FF'; ctx.fillStyle = 'rgba(0,229,255,0.25)'; ctx.fillText(String(g.scoreY), W * 0.3, 12)
    ctx.shadowColor = '#FF5A5A'; ctx.fillStyle = 'rgba(255,90,90,0.25)'; ctx.fillText(String(g.scoreA), W * 0.7, 12)
    ctx.shadowBlur = 0
    ctx.restore()
  }, [])

  const startLoop = useCallback(() => {
    const g = gRef.current
    g.lastT = performance.now()
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => { if (!g.paused) { g.py = Math.min(92, g.py + 0.5) } }, 80)
    const loop = (now: number) => {
      if (g.paused) return
      const dt = Math.min((now - g.lastT) / 16.667, 3)
      g.lastT = now
      let nx = g.bx + g.dx * dt, ny = g.by + g.dy * dt, ndx = g.dx, ndy = g.dy
      g.trail.push({ x: g.bx, y: g.by, age: 0 })
      if (g.trail.length > 20) g.trail.shift()
      g.trail.forEach(t => t.age++)
      if (ny <= 2) { ny = 2; ndy = Math.abs(ndy); audio.playFx('pong_wall') }
      if (ny >= 98) { ny = 98; ndy = -Math.abs(ndy); audio.playFx('pong_wall') }
      const aiBase = 0.035 + Math.min(g.rally * 0.003, 0.03)
      const aiSpd = aiBase + Math.min(Math.abs(g.dx) * 0.004, 0.035)
      g.ay += (ny - g.ay) * aiSpd * dt
      g.ay = Math.max(10, Math.min(90, g.ay))
      const spd = Math.sqrt(ndx * ndx + ndy * ndy)
      const rallyBoost = 1 + g.rally * 0.005
      // Player paddle collision
      if (nx <= 6 && g.bx > 6) {
        const padH100 = PP_PADDLE_H * 100
        const hd = Math.abs(ny - g.py)
        if (hd < padH100 / 2 + 2) {
          const hitOffset = (ny - g.py) / (padH100 / 2)
          const isCenter = hd < 3
          let powerBoost = 1.0
          if (g.power >= 80) { powerBoost = 2.0; g.smash = true }
          else if (g.power >= 40) { powerBoost = 1.15 }
          else if (g.power >= 10) { powerBoost = 1.05 }
          else { g.smash = false }
          ndx = Math.abs(ndx) * (isCenter ? 1.4 : 1.05) * powerBoost * rallyBoost
          ndy = g.dy + hitOffset * 2.5
          nx = 7
          g.rally++
          audio.playFx('pong_hit')
          g.impact = { x: 6, y: ny, t: Date.now() }
          spawnParticles(6, ny, isCenter || powerBoost >= 2 ? '#FFD93D' : '#00E5FF', powerBoost >= 2 ? 20 : 10)
          if (powerBoost >= 2) {
            g.smashText = Date.now()
            setSmash(true)
            setComment(pick(PP_SMASH))
            setTimeout(() => setSmash(false), 500)
          } else if (isCenter) {
            setComment(pick(PP_SMASH))
          } else {
            setComment(pick(PP_HIT))
          }
          setRally(g.rally)
          g.power = 0
          g.charging = false
          setPower(0)
          setPuffHeld(false)
        } else {
          g.scoreA++
          setScore({ you: g.scoreY, ai: g.scoreA })
          audio.playFx('pong_score')
          setComment(pick(PP_SA))
          g.rally = 0
          setRally(0)
          g.power = 0
          setPower(0)
          if (g.scoreA >= PP_WIN_SCORE) {
            g.paused = true
            setPhase('result')
            audio.playFx('lose')
            return
          }
          nx = 50; ny = 50; ndx = 2.2; ndy = 1.2 * (Math.random() > 0.5 ? 1 : -1)
          g.trail = []
        }
      }
      // AI paddle collision
      if (nx >= 94 && g.bx < 94) {
        const hd = Math.abs(ny - g.ay)
        if (hd < 10) {
          ndx = -Math.abs(ndx) * 1.03 * rallyBoost
          ndy = g.dy + (ny - g.ay) * 0.12
          nx = 93
          g.rally++
          setRally(g.rally)
          audio.playFx('pong_hit')
          g.impact = { x: 94, y: ny, t: Date.now() }
          spawnParticles(94, ny, '#FF5A5A', 8)
        } else {
          g.scoreY++
          setScore({ you: g.scoreY, ai: g.scoreA })
          audio.playFx('pong_score')
          setComment(pick(PP_SY))
          g.rally = 0
          setRally(0)
          g.power = 0
          setPower(0)
          if (g.scoreY >= PP_WIN_SCORE) {
            g.paused = true
            setPhase('result')
            audio.playFx('win')
            player.spawnConfetti(40, [C.cyan, C.gold, C.green, C.pink])
            return
          }
          nx = 50; ny = 50; ndx = -2.2; ndy = 1.2 * (Math.random() > 0.5 ? 1 : -1)
          g.trail = []
        }
      }
      if (Math.abs(ndx) > 6.5) ndx = 6.5 * Math.sign(ndx)
      if (Math.abs(ndy) > 6.5) ndy = 6.5 * Math.sign(ndy)
      g.bx = nx; g.by = ny; g.dx = ndx; g.dy = ndy
      setSpeed(spd)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [audio, player, spawnParticles])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null }
    const g = gRef.current
    g.bx = 50; g.by = 50; g.dx = 2.2; g.dy = 1.2; g.py = 50; g.ay = 50
    g.rally = 0; g.trail = []; g.scoreY = 0; g.scoreA = 0; g.paused = false
    g.smash = false; g.lastT = 0; g.power = 0; g.charging = false
    g.particles = []; g.shake = 0; g.impact = null; g.smashText = null
    setScore({ you: 0, ai: 0 })
    setRally(0); setSpeed(0); setPower(0); setPuffHeld(false); setSmash(false); setComment('')
    setIntro(1); setPhase('intro')
    audio.playFx('whistle')
    setTimeout(() => setIntro(2), 500)
    setTimeout(() => setIntro(3), 1000)
    setTimeout(() => setIntro(4), 1500)
    setTimeout(() => {
      setIntro(5)
      setComment('SERVE!')
      audio.playFx('crowd')
      setTimeout(() => { setPhase('playing'); setIntro(0); setComment(''); startLoop() }, 600)
    }, 2000)
  }, [audio, startLoop])

  const movePaddle = useCallback((dir: number) => {
    const g = gRef.current
    g.py = Math.max(8, Math.min(92, g.py + dir * 6))
  }, [])

  const puffUp = useCallback(() => {
    setPuffHeld(true)
    const g = gRef.current
    g.charging = true
    powerStartRef.current = Date.now()
    if (powerIntervalRef.current) clearInterval(powerIntervalRef.current)
    powerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - powerStartRef.current) / 1000
      const p = getPuffPower(elapsed)
      g.power = p
      setPower(p)
    }, 50)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => { if (!g.paused) { g.py = Math.max(8, g.py - 3) } }, 50)
  }, [])

  const puffRelease = useCallback(() => {
    setPuffHeld(false)
    const g = gRef.current
    g.charging = false
    if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    intervalRef.current = setInterval(() => { if (!g.paused) { g.py = Math.min(92, g.py + 0.5) } }, 80)
  }, [])

  const endGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null }
    gRef.current.paused = true
    const g = gRef.current
    const won = g.scoreY > g.scoreA
    const baseR = won ? 80 : 12
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(won, baseR, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    player.notify(won ? `🏓 Won! +${baseR}` : `🏓 Lost! +${baseR}`, won ? C.green : C.red)
    setPhase(null)
    setIntro(0)
    game.exitGame()
  }, [audio, player, ble, game])

  // Auto-start on mount
  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'puffpong') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animation loop (Rule 4 — restart on every draw callback change)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      drawCanvas()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [drawCanvas])

  // BLE registration (Rule 3 + Rule 8)
  useEffect(() => {
    if (game.gameActive?.id !== 'puffpong') return
    ble.registerPuffHandlers('puffpong', () => puffUp(), () => puffRelease())
    return () => {
      audio.gameSoundsMuted.current = true
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'puffpong') return null

  const bsp = Math.min(speed / 5, 1)
  const isIntro = phase === 'intro'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
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
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan, letterSpacing: 1 }}>YOU</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.cyan, fontFamily: 'monospace', textShadow: `0 0 10px ${C.cyan}60` }}>{score.you}</span>
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 900, opacity: 0.5 }}>-</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#FF5A5A', fontFamily: 'monospace', textShadow: '0 0 10px rgba(255,90,90,0.4)' }}>{score.ai}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#FF5A5A', letterSpacing: 1 }}>AI</span>
          </div>
          {rally >= 3 && (
            <div style={{ padding: '2px 6px', borderRadius: 6, background: rally >= 20 ? 'rgba(255,217,61,0.12)' : rally >= 10 ? 'rgba(251,146,60,0.1)' : 'rgba(0,229,255,0.08)', border: `1px solid ${rally >= 20 ? C.gold + '30' : rally >= 10 ? C.orange + '25' : C.cyan + '20'}` }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: rally >= 20 ? C.gold : rally >= 10 ? C.orange : C.cyan }}>{rally}x</span>
            </div>
          )}
        </div>
        {phase === 'playing' && (
          <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 7, color: C.text3, fontWeight: 700, letterSpacing: 1 }}>SPEED</span>
            <div style={{ width: 60, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${bsp * 100}%`, height: '100%', borderRadius: 2, background: bsp > 0.7 ? '#FF5A5A' : bsp > 0.4 ? C.orange : C.cyan, boxShadow: `0 0 6px ${bsp > 0.7 ? '#FF5A5A' : C.cyan}`, transition: 'width 0.15s' }} />
            </div>
            <div style={{ flex: 1 }} />
            {smash && <span style={{ fontSize: 9, fontWeight: 900, color: C.gold, animation: 'pulse 0.3s infinite' }}>SMASH!</span>}
          </div>
        )}
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
        onClick={(e) => {
          if (phase !== 'playing' || (e.target as HTMLElement).closest('[data-btn]')) return
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const yRatio = (e.clientY - rect.top) / rect.height
          movePaddle(yRatio < 0.5 ? -1 : 1)
        }}>
        {(phase === 'playing' || phase === 'intro') && (
          <canvas ref={canvasRef} width={Math.round(420 * PP_DPR)} height={Math.round(600 * PP_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        )}

        {/* Intro overlay */}
        {isIntro && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.85)', backdropFilter: 'blur(6px)' }}>
            {intro >= 1 && <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, color: C.cyan, textShadow: `0 0 15px ${C.cyan}, 0 0 40px ${C.cyan}60`, fontFamily: 'monospace', marginBottom: 8 }}>PUFF PONG</div>}
            {intro >= 2 && <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 12 }}>Tap to move paddle | Hold puff for power shot</div>}
            {intro >= 3 && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 12, height: 50, borderRadius: 6, background: C.cyan, boxShadow: `0 0 15px ${C.cyan}80` }} />
                  <div style={{ fontSize: 8, color: C.cyan, marginTop: 4, fontWeight: 700 }}>YOU</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.text3, alignSelf: 'center' }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 12, height: 40, borderRadius: 6, background: '#FF5A5A', boxShadow: '0 0 15px rgba(255,90,90,0.5)' }} />
                  <div style={{ fontSize: 8, color: '#FF5A5A', marginTop: 4, fontWeight: 700 }}>AI</div>
                </div>
              </div>
            )}
            {intro >= 4 && <div style={{ marginTop: 16 }}><div style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>First to {PP_WIN_SCORE} wins</div></div>}
            {intro === 5 && <div style={{ marginTop: 16, fontSize: 32, fontWeight: 900, color: C.gold, letterSpacing: 6, textShadow: `0 0 20px ${C.gold}`, zIndex: 5 }}>SERVE!</div>}
          </div>
        )}

        {/* Comment toast */}
        {comment && phase === 'playing' && (
          <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 25, pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.85)', textShadow: '0 0 12px rgba(0,0,0,0.9)', padding: '6px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', maxWidth: 300 }}>{comment}</div>
          </div>
        )}

        {/* Controls */}
        {phase === 'playing' && (
          <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, zIndex: 30, padding: '5px 10px 9px' }}>
            {puffHeld && <div style={{ marginBottom: 4 }}><PuffBar power={power} charging={true} sweetSpot={sweetSpot} blinkerUsed={false} /></div>}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
              <div data-btn="true" onMouseDown={() => movePaddle(-1)} onTouchStart={(e) => { e.preventDefault(); movePaddle(-1) }} style={{ flex: 1, maxWidth: 80, padding: '10px 0', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', fontSize: 13, fontWeight: 800, color: C.cyan, userSelect: 'none', touchAction: 'none' }}>⬆ UP</div>
              <div data-btn="true" onMouseDown={puffUp} onMouseUp={puffRelease} onMouseLeave={puffRelease} onTouchStart={(e) => { e.preventDefault(); puffUp() }} onTouchEnd={puffRelease} onTouchCancel={puffRelease} style={{ flex: 1, maxWidth: 120, padding: '12px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: puffHeld ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)', border: `2px solid ${puffHeld ? C.cyan : C.cyan + '40'}`, fontSize: 12, fontWeight: 900, color: C.cyan, transition: 'all 0.15s', transform: puffHeld ? 'scale(0.95)' : 'scale(1)', userSelect: 'none', touchAction: 'none' }}>{puffHeld ? '💨 CHARGING...' : '🏓 HOLD PUFF'}</div>
              <div data-btn="true" onMouseDown={() => movePaddle(1)} onTouchStart={(e) => { e.preventDefault(); movePaddle(1) }} style={{ flex: 1, maxWidth: 80, padding: '10px 0', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', fontSize: 13, fontWeight: 800, color: C.cyan, userSelect: 'none', touchAction: 'none' }}>⬇ DOWN</div>
            </div>
          </div>
        )}

        {/* Result overlay */}
        {phase === 'result' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: score.you > score.ai ? C.cyan : '#FF5A5A', textShadow: '0 0 20px currentColor', letterSpacing: 3, marginBottom: 4 }}>{score.you > score.ai ? 'YOU WIN! 🏆' : 'AI WINS 🤖'}</div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
              <span style={{ color: C.cyan }}>{score.you}</span>
              <span style={{ color: C.text3, margin: '0 8px' }}>-</span>
              <span style={{ color: '#FF5A5A' }}>{score.ai}</span>
            </div>
            <div style={{ fontSize: 11, color: C.text2, marginBottom: 12 }}>{score.you > score.ai ? 'Puff Pong champion! 💨🏆' : 'Better luck next puff! 💨'}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div data-btn="true" onClick={() => { setPhase(null); startedRef.current = false; startGame(); startedRef.current = true }} style={{ padding: '12px 28px', borderRadius: 14, cursor: 'pointer', background: 'rgba(0,229,255,0.12)', border: '2px solid rgba(0,229,255,0.3)', fontSize: 14, fontWeight: 800, color: C.cyan, touchAction: 'none' }}>🔄 Rematch</div>
              <div data-btn="true" onClick={endGame} style={{ padding: '12px 28px', borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
