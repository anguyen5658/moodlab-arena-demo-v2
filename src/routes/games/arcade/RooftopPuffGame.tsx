import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { GameChatOverlay } from '../../../components/shared/GameChatOverlay'

// ── Constants (direct lift from monolith ROOF_*) ──
const ROOF_W = 860
const ROOF_H = 1000
const ROOF_GRAVITY = 0.52
const ROOF_JUMP_V = -10.5
const ROOF_DOUBLE_JUMP_V = -8.5
const ROOF_BASE_SPEED = 3.8
const ROOF_BOOST_TAP = 1.3
const ROOF_BOOST_DRY = 1.5
const ROOF_BOOST_REAL = 1.7
const ROOF_BOOST_BLINKER = 2.0
const ROOF_BOOST_JUMP = 1.2
const ROOF_GROUND = ROOF_H * 0.65
const ROOF_RUNNER_COLORS = ['#00E5FF', '#FF6B8A', '#7CFF6B', '#F5B400']
const ROOF_BOT_NAMES = ['NeonDash', 'BlazeFeet', 'CloudHop', 'PuffRunner']
const ROOF_DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

type Mode = 'solo' | '1v1' | 'race'
type Phase = 'modeselect' | 'playing' | 'complete' | null
type LobbyTab = 'play' | 'rank'

interface Runner {
  id: number; x: number; y: number; vy: number; w: number; h: number
  onG: boolean; jumps: number; maxJ: number; dead: boolean; isBot: boolean
  col: string; name: string
  boost: { fuel: number; max: number; on: boolean }
  aiJumpT: number; aiBoostT: number; frame: number; deathT: number
}
interface Platform { x: number; y: number; w: number; h: number; col: string }
interface Obstacle { x: number; y: number; w: number; h: number; type: 'spike' | 'barrier' }
interface Item { x: number; y: number; type: 'coin' | 'boost'; alive: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; r: number; col: string; life: number; dec: number }
interface Star { x: number; y: number; s: number; b: number }
interface BgBuilding { x: number; w: number; h: number; hue: number }
interface Toast { text: string; t: number; col: string }
interface World {
  runners: Runner[]; platforms: Platform[]; obstacles: Obstacle[]; items: Item[]
  parts: Particle[]; stars: Star[]; bgBuildings: BgBuilding[]
  cam: number; baseSpd: number; dist: number; score: number; coins: number; t: number
  deathOrder: { name: string; id: number; t: number }[]; finished: boolean; toasts: Toast[]
}

const mkRunner = (id: number, isBot: boolean, name: string, col: string): Runner => ({
  id, x: 60 + id * 30, y: 0, vy: 0, w: 18, h: 28, onG: false, jumps: 0, maxJ: 2,
  dead: false, isBot, col, name,
  boost: { fuel: 100, max: 100, on: false },
  aiJumpT: 0, aiBoostT: 0, frame: 0, deathT: 0,
})

const initWorld = (): World => {
  const G: World = {
    runners: [], platforms: [], obstacles: [], items: [], parts: [], stars: [], bgBuildings: [],
    cam: 0, baseSpd: ROOF_BASE_SPEED, dist: 0, score: 0, coins: 0, t: 0, deathOrder: [], finished: false, toasts: [],
  }
  for (let i = 0; i < 50; i++) G.stars.push({ x: Math.random() * ROOF_W * 3, y: Math.random() * ROOF_H * 0.4, s: 0.5 + Math.random() * 1.5, b: 0.3 + Math.random() * 0.7 })
  for (let i = 0; i < 25; i++) G.bgBuildings.push({ x: i * 80 + Math.random() * 40, w: 30 + Math.random() * 60, h: 80 + Math.random() * 150, hue: Math.random() * 360 })
  let px = 0
  for (let i = 0; i < 15; i++) {
    const w = 75 + Math.random() * 95
    const gap = i === 0 ? 0 : 30 + Math.random() * 30
    const y = ROOF_GROUND + Math.random() * 30 - 15
    G.platforms.push({ x: px + gap, y: Math.max(ROOF_H * 0.45, Math.min(ROOF_H * 0.8, y)), w, h: 14, col: `hsl(${Math.random() * 360},15%,25%)` })
    px += gap + w
    if (i > 0) {
      for (let c = 0; c < Math.floor(w / 25); c++) {
        if (Math.random() < 0.55) G.items.push({ x: G.platforms[G.platforms.length - 1].x + 15 + c * 25, y: G.platforms[G.platforms.length - 1].y - 20, type: 'coin', alive: true })
      }
    }
    if (i > 2 && Math.random() < 0.1) G.items.push({ x: G.platforms[G.platforms.length - 1].x + w / 2, y: G.platforms[G.platforms.length - 1].y - 25, type: 'boost', alive: true })
    if (i > 4 && Math.random() < 0.25) {
      const ox = G.platforms[G.platforms.length - 1].x + 20 + Math.random() * (w - 40)
      const oy = G.platforms[G.platforms.length - 1].y
      G.obstacles.push({ x: ox, y: oy, w: 12, h: 18, type: Math.random() < 0.5 ? 'spike' : 'barrier' })
    }
  }
  return G
}

const extWorld = (G: World) => {
  const lastP = G.platforms[G.platforms.length - 1]
  const edge = lastP.x + lastP.w
  const ahead = G.cam + ROOF_W * 3
  if (edge < ahead) {
    const diffMult = 1 + G.dist * 0.0003
    const count = 8 + Math.floor(Math.random() * 4)
    let px2 = edge
    for (let i = 0; i < count; i++) {
      const gap = Math.min(80, 30 + Math.random() * 25 * diffMult)
      const w = Math.max(40, 90 - G.dist * 0.008 + Math.random() * 50)
      const prevY = G.platforms.length > 0 ? G.platforms[G.platforms.length - 1].y : ROOF_GROUND
      const y = Math.max(ROOF_H * 0.4, Math.min(ROOF_H * 0.82, prevY + (Math.random() - 0.5) * 40))
      G.platforms.push({ x: px2 + gap, y, w, h: 14, col: `hsl(${Math.random() * 360},15%,25%)` })
      px2 += gap + w
      for (let c = 0; c < Math.floor(w / 25); c++) {
        if (Math.random() < 0.5) G.items.push({ x: G.platforms[G.platforms.length - 1].x + 15 + c * 25, y: G.platforms[G.platforms.length - 1].y - 22, type: 'coin', alive: true })
      }
      if (Math.random() < 0.08) G.items.push({ x: G.platforms[G.platforms.length - 1].x + w / 2, y: G.platforms[G.platforms.length - 1].y - 28, type: 'boost', alive: true })
      if (G.dist > 200 && Math.random() < 0.3) {
        const ox = G.platforms[G.platforms.length - 1].x + 15 + Math.random() * (w - 30)
        const oy = G.platforms[G.platforms.length - 1].y
        G.obstacles.push({ x: ox, y: oy, w: 12, h: 18, type: Math.random() < 0.5 ? 'spike' : 'barrier' })
      }
    }
  }
  G.platforms = G.platforms.filter(p => p.x + p.w > G.cam - 200)
  G.items = G.items.filter(it => it.x > G.cam - 200)
  G.obstacles = G.obstacles.filter(o => o.x + o.w > G.cam - 200)
  const lastB = G.bgBuildings[G.bgBuildings.length - 1]
  if (lastB && lastB.x < G.cam * 0.12 + ROOF_W + 200) {
    for (let i = 0; i < 5; i++) G.bgBuildings.push({ x: lastB.x + 80 + i * 80 + Math.random() * 40, w: 30 + Math.random() * 60, h: 80 + Math.random() * 150, hue: Math.random() * 360 })
  }
  G.bgBuildings = G.bgBuildings.filter(b => b.x + b.w > G.cam * 0.12 - 200)
  const maxStarX = G.stars.reduce((mx, s) => Math.max(mx, s.x), 0)
  if (maxStarX < G.cam * 0.04 + ROOF_W + 300) {
    for (let i = 0; i < 10; i++) G.stars.push({ x: maxStarX + 100 + Math.random() * 200, y: Math.random() * ROOF_H * 0.4, s: 0.5 + Math.random() * 1.5, b: 0.3 + Math.random() * 0.7 })
  }
  G.stars = G.stars.filter(s => s.x > G.cam * 0.04 - 200)
}

export const RooftopPuffGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  // ── State ──
  const [phase, setPhase] = useState<Phase>(null)
  const [mode, setMode] = useState<Mode>('solo')
  const [lobbyTab, setLobbyTab] = useState<LobbyTab>('play')
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  const [dist, setDist] = useState(0)
  const [coins2, setCoins2] = useState(0)
  const [score, setScore] = useState(0)
  const [fuel, setFuel] = useState(100)
  const [place, setPlace] = useState(1)
  const [alive, setAlive] = useState(true)

  // ── Refs ──
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<World | null>(null)
  const rafRef = useRef<number | null>(null)
  const boostRef = useRef(false)
  const puffStartRef = useRef(0)
  const modeRef = useRef<Mode>('solo')
  const phaseRef = useRef<Phase>(null)
  const aliveRef = useRef(true)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { aliveRef.current = alive }, [alive])

  const getBoostMult = useCallback((): number => {
    const start = puffStartRef.current
    if (!start) return ROOF_BOOST_TAP
    const dur = (Date.now() - start) / 1000
    if (ble.bleConnected) return dur >= 5 ? ROOF_BOOST_BLINKER : ROOF_BOOST_REAL
    return ROOF_BOOST_DRY
  }, [ble.bleConnected])

  const botThink = useCallback((runner: Runner, G: World) => {
    if (runner.dead) return
    runner.aiJumpT -= 1; runner.aiBoostT -= 1
    const rx = runner.x + G.cam
    let hasFloor = false
    for (const p of G.platforms) {
      if (p.x <= rx + 60 && p.x + p.w >= rx && Math.abs(p.y - runner.y - runner.h) < 50) { hasFloor = true; break }
    }
    let obsAhead = false
    for (const o of G.obstacles) {
      const ox = o.x - G.cam
      if (ox > runner.x && ox < runner.x + 50 && Math.abs(runner.y + runner.h - o.y) < 30) { obsAhead = true; break }
    }
    if ((!hasFloor || obsAhead) && runner.aiJumpT <= 0 && runner.jumps < runner.maxJ) {
      const bm = runner.boost.on ? ROOF_BOOST_JUMP : 1
      runner.vy = runner.jumps === 0 ? ROOF_JUMP_V * bm : ROOF_DOUBLE_JUMP_V * bm
      runner.jumps++; runner.onG = false; runner.aiJumpT = 8 + Math.random() * 10
      for (let i = 0; i < 3; i++) G.parts.push({ x: runner.x, y: runner.y + runner.h, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 1.5, r: 2, col: 'rgba(255,255,255,0.4)', life: 15, dec: 0.04 })
    }
    if (runner.aiBoostT <= 0 && runner.boost.fuel > 30 && Math.random() < 0.01) {
      runner.boost.on = true; runner.aiBoostT = 60 + Math.random() * 120
      setTimeout(() => { if (runner) runner.boost.on = false }, 1000 + Math.random() * 2000)
    }
  }, [])

  const gameOver = useCallback((won: boolean) => {
    const G = gameRef.current; if (!G) return
    const reward = won ? 50 + G.coins * 5 : 10 + G.coins * 2
    setScore(G.score + Math.floor(G.dist))
    player.recordGameResult(won, reward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    audio.playFx(won ? 'win' : 'lose')
    player.notify(won ? `🏆 +${reward} coins! Distance: ${Math.floor(G.dist)}m` : `💀 +${reward} coins. ${Math.floor(G.dist)}m`, won ? C.gold : C.red)
    setAlive(won)
    setPhase('complete')
  }, [player, ble.bleConnected, game.gameActive, audio])

  const update = useCallback(() => {
    const G = gameRef.current; if (!G || G.finished) return
    G.t++
    const player0 = G.runners[0]
    if (player0 && !player0.dead) {
      player0.boost.on = boostRef.current && player0.boost.fuel > 0
      if (player0.boost.on) {
        player0.boost.fuel = Math.max(0, player0.boost.fuel - 0.4)
        if (player0.boost.fuel <= 0) { player0.boost.on = false; boostRef.current = false }
      } else {
        player0.boost.fuel = Math.min(player0.boost.max, player0.boost.fuel + 0.08)
      }
    }
    const boostM = player0 && player0.boost.on ? getBoostMult() : 1
    const spdBase = G.baseSpd + G.dist * 0.003
    const camSpd = spdBase * boostM
    G.cam += camSpd; G.dist += camSpd * 0.3
    for (const r of G.runners) {
      if (r.dead) continue
      r.vy += ROOF_GRAVITY; r.y += r.vy; r.onG = false
      for (const p of G.platforms) {
        const rx2 = r.x + G.cam
        if (rx2 + r.w > p.x && rx2 < p.x + p.w && r.vy >= 0) {
          const pt2 = p.y - r.h
          if (r.y >= pt2 - 6 && r.y <= pt2 + 12) { r.y = pt2; r.vy = 0; r.onG = true; r.jumps = 0; break }
        }
      }
      const rx3 = r.x + G.cam
      for (const o of G.obstacles) {
        if (rx3 + r.w > o.x + 3 && rx3 < o.x + o.w - 3 && r.y + r.h > o.y - o.h + 3 && r.y < o.y) {
          if (!r.dead) {
            r.dead = true; r.deathT = G.t
            G.deathOrder.push({ name: r.name, id: r.id, t: G.t })
            for (let i = 0; i < 15; i++) G.parts.push({ x: r.x, y: r.y + r.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 3, r: 2 + Math.random() * 3, col: r.col, life: 30, dec: 0.025 })
            if (!r.isBot) { audio.playFx('miss'); G.toasts.push({ text: 'You crashed!', t: G.t, col: '#EF4444' }) }
            else { G.toasts.push({ text: r.name + ' fell!', t: G.t, col: r.col }) }
          }
        }
      }
      if (r.y > ROOF_H + 60 && !r.dead) {
        r.dead = true; r.deathT = G.t
        G.deathOrder.push({ name: r.name, id: r.id, t: G.t })
        if (!r.isBot) { audio.playFx('miss'); G.toasts.push({ text: 'You fell!', t: G.t, col: '#EF4444' }) }
        else { G.toasts.push({ text: r.name + ' fell!', t: G.t, col: r.col }) }
      }
      if (r.isBot && !r.dead) botThink(r, G)
      if (!r.isBot && !r.dead) {
        for (const it of G.items) {
          if (!it.alive) continue
          const ix = it.x - G.cam
          if (Math.abs(ix - r.x) < 20 && Math.abs(it.y - r.y - r.h / 2) < 20) {
            it.alive = false
            if (it.type === 'coin') {
              G.coins++; G.score += 10
              for (let i = 0; i < 4; i++) G.parts.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, r: 2, col: '#FFD700', life: 20, dec: 0.04 })
            }
            if (it.type === 'boost') {
              r.boost.fuel = Math.min(r.boost.max, r.boost.fuel + 40)
              G.parts.push({ x: r.x, y: r.y, vx: 0, vy: -2, r: 4, col: '#00E5FF', life: 25, dec: 0.03 })
              audio.playFx('select')
            }
          }
        }
      }
      r.frame++
    }
    extWorld(G)
    G.parts = G.parts.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 1; return p.life > 0 })
    G.toasts = G.toasts.filter(t => G.t - t.t < 120)
    if (G.t % 6 === 0) {
      setDist(Math.floor(G.dist))
      setCoins2(G.coins)
      setScore(G.score + Math.floor(G.dist))
      if (player0) setFuel(Math.round(player0.boost.fuel))
      const aliveList = G.runners.filter(r2 => !r2.dead).sort((a, b) => b.x - a.x)
      const playerR = aliveList.find(r2 => !r2.isBot)
      if (playerR) setPlace(aliveList.indexOf(playerR) + 1)
      if (player0 && player0.dead && aliveRef.current) setAlive(false)
    }
    if (player0 && player0.dead && !G.finished) { G.finished = true; setTimeout(() => gameOver(false), 800) }
    if (modeRef.current === 'solo' && G.dist >= 3000 && !G.finished && player0 && !player0.dead) { G.finished = true; setTimeout(() => gameOver(true), 500) }
    if (modeRef.current !== 'solo') {
      const ab = G.runners.filter(r2 => r2.isBot && !r2.dead)
      if (ab.length === 0 && player0 && !player0.dead && !G.finished) { G.finished = true; setTimeout(() => gameOver(true), 500) }
    }
  }, [getBoostMult, botThink, gameOver, audio])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; const G = gameRef.current
    if (!canvas || !G) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const cw = canvas.width / ROOF_DPR, ch = canvas.height / ROOF_DPR
    ctx.save(); ctx.scale(ROOF_DPR, ROOF_DPR)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch)
    skyGrad.addColorStop(0, '#050515'); skyGrad.addColorStop(0.5, '#0a0a25'); skyGrad.addColorStop(1, '#151025')
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, cw, ch)
    const starOff = G.cam * 0.04
    for (const s of G.stars) {
      const sx = s.x - starOff
      if (sx < -5 || sx > cw + 5) continue
      ctx.globalAlpha = s.b * (0.5 + Math.sin(G.t * 0.03 + s.x) * 0.3)
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, s.y, s.s, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    const moonX = cw - 60, moonY = 50
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 50)
    moonGrad.addColorStop(0, 'rgba(200,220,255,0.25)'); moonGrad.addColorStop(0.3, 'rgba(150,180,220,0.08)'); moonGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = moonGrad; ctx.fillRect(moonX - 50, moonY - 50, 100, 100)
    ctx.fillStyle = 'rgba(220,235,255,0.9)'; ctx.beginPath(); ctx.arc(moonX, moonY, 10, 0, Math.PI * 2); ctx.fill()
    const bldOff = G.cam * 0.12
    for (const b of G.bgBuildings) {
      const bx = b.x - bldOff
      if (bx + b.w < -10 || bx > cw + 10) continue
      const by = ch - b.h * 0.6
      ctx.fillStyle = `hsla(${b.hue},20%,12%,0.7)`
      ctx.fillRect(bx, by, b.w, b.h)
      const wR = Math.floor(b.h / 18); const wC2 = Math.floor(b.w / 12)
      for (let wr = 0; wr < wR; wr++) {
        for (let wc = 0; wc < wC2; wc++) {
          if (Math.sin(b.x * 3 + wr * 7 + wc * 13) > 0.1) {
            ctx.fillStyle = `hsla(${40 + b.hue * 0.3},60%,65%,${0.15 + Math.sin(G.t * 0.01 + wr + wc) * 0.1})`
            ctx.fillRect(bx + 4 + wc * 12, by + 8 + wr * 18, 5, 6)
          }
        }
      }
    }
    for (const p of G.platforms) {
      const ppx = p.x - G.cam
      if (ppx + p.w < -20 || ppx > cw + 20) continue
      const bodyH = ch - p.y + 20
      ctx.fillStyle = 'rgba(18,22,35,0.95)'; ctx.fillRect(ppx, p.y, p.w, bodyH)
      ctx.fillStyle = p.col; ctx.fillRect(ppx, p.y, p.w, p.h)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(ppx, p.y, p.w, 2)
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(ppx, p.y, 2, bodyH)
    }
    for (const o of G.obstacles) {
      const ox = o.x - G.cam
      if (ox < -20 || ox > cw + 20) continue
      if (o.type === 'spike') {
        ctx.fillStyle = '#FF3B3B'
        ctx.beginPath(); ctx.moveTo(ox, o.y); ctx.lineTo(ox + o.w / 2, o.y - o.h); ctx.lineTo(ox + o.w, o.y); ctx.closePath(); ctx.fill()
        ctx.strokeStyle = 'rgba(255,100,100,0.5)'; ctx.lineWidth = 1; ctx.stroke()
      } else {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(ox, o.y - o.h, o.w, o.h)
        ctx.fillStyle = 'rgba(200,150,100,0.3)'; ctx.fillRect(ox, o.y - o.h, o.w, 3)
      }
    }
    for (const it of G.items) {
      if (!it.alive) continue
      const ix = it.x - G.cam
      if (ix < -15 || ix > cw + 15) continue
      if (it.type === 'coin') {
        const bob = Math.sin(G.t * 0.06 + it.x * 0.1) * 3
        const spin = Math.cos(G.t * 0.08 + it.x * 0.05)
        ctx.fillStyle = '#FFD700'
        ctx.beginPath(); ctx.ellipse(ix, it.y + bob, 5 * Math.abs(spin), 5, 0, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,215,0,0.3)'
        ctx.beginPath(); ctx.arc(ix, it.y + bob, 8, 0, Math.PI * 2); ctx.fill()
      } else {
        const bob = Math.sin(G.t * 0.05 + it.x) * 2
        ctx.fillStyle = '#00E5FF'
        ctx.beginPath(); ctx.arc(ix, it.y + bob, 6, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(0,229,255,0.4)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(ix, it.y + bob, 9, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('⚡', ix, it.y + bob + 3)
      }
    }
    for (const r of G.runners) {
      if (r.dead) {
        if (G.t - r.deathT < 40) {
          ctx.globalAlpha = 1 - (G.t - r.deathT) / 40
          ctx.fillStyle = r.col; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText('💀', r.x, r.y)
          ctx.globalAlpha = 1
        }
        continue
      }
      const rx4 = r.x, ry = r.y
      if (r.boost.on) {
        const glG = ctx.createRadialGradient(rx4 + r.w / 2, ry + r.h / 2, 5, rx4 + r.w / 2, ry + r.h / 2, 25)
        glG.addColorStop(0, r.col + '40'); glG.addColorStop(1, 'transparent')
        ctx.fillStyle = glG; ctx.fillRect(rx4 - 15, ry - 10, r.w + 30, r.h + 20)
        for (let ti = 0; ti < 3; ti++) {
          ctx.globalAlpha = 0.15 - ti * 0.04
          ctx.fillStyle = r.col
          ctx.fillRect(rx4 - 5 - ti * 8, ry + 4, 4, r.h - 8)
        }
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = r.col
      ctx.beginPath(); (ctx as CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect?.(rx4 + 2, ry + 2, r.w - 4, r.h * 0.6, 3); ctx.fill()
      ctx.beginPath(); ctx.arc(rx4 + r.w / 2, ry + 2, 6, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = r.isBot ? 'rgba(255,255,255,0.4)' : '#FFD700'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(rx4 + r.w / 2, ry + 1, 6, Math.PI * 0.8, Math.PI * 0.2); ctx.stroke()
      const legSwing = Math.sin(r.frame * 0.3) * 4
      ctx.strokeStyle = r.col; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(rx4 + r.w / 2 - 3, ry + r.h * 0.6); ctx.lineTo(rx4 + r.w / 2 - 3 + legSwing, ry + r.h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(rx4 + r.w / 2 + 3, ry + r.h * 0.6); ctx.lineTo(rx4 + r.w / 2 + 3 - legSwing, ry + r.h); ctx.stroke()
      const armSwing = Math.sin(r.frame * 0.3 + Math.PI) * 3
      ctx.beginPath(); ctx.moveTo(rx4 + 2, ry + r.h * 0.25); ctx.lineTo(rx4 - 3 + armSwing, ry + r.h * 0.45); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(rx4 + r.w - 2, ry + r.h * 0.25); ctx.lineTo(rx4 + r.w + 3 - armSwing, ry + r.h * 0.45); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(r.name, rx4 + r.w / 2, ry - 6)
    }
    const player0 = G.runners[0]
    if (player0 && player0.boost.on && !player0.dead) {
      for (let i = 0; i < 5; i++) {
        const lx = Math.random() * cw, ly = Math.random() * ch * 0.8
        ctx.globalAlpha = 0.15
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 20 - Math.random() * 30, ly); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    for (const pt of G.parts) {
      ctx.globalAlpha = pt.life * pt.dec > 1 ? 1 : pt.life * pt.dec
      ctx.fillStyle = pt.col
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (pt.life / 30), 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, cw, 28)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText('🏃 ' + Math.floor(G.dist) + 'm', 8, 18)
    ctx.textAlign = 'center'; ctx.fillText('🪙 ' + G.coins, cw / 2, 18)
    ctx.textAlign = 'right'; ctx.fillStyle = '#FFD700'
    ctx.fillText((G.score + Math.floor(G.dist)) + ' pts', cw - 8, 18)
    if (G.runners.length > 1) {
      const aliveR = G.runners.filter(r2 => !r2.dead).sort((a, b) => b.x - a.x)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(cw - 80, 30, 75, aliveR.length * 14 + 6)
      aliveR.forEach((r2, i) => {
        ctx.fillStyle = r2.col; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText((i + 1) + '. ' + r2.name, cw - 12, 40 + i * 14)
      })
    }
    for (const t of G.toasts) {
      const age = G.t - t.t
      if (age > 90) continue
      ctx.globalAlpha = age < 10 ? age / 10 : age > 70 ? (90 - age) / 20 : 1
      ctx.fillStyle = t.col || '#fff'
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(t.text, cw / 2, ch * 0.35 - age * 0.3)
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }, [])

  // ── Actions ──
  const startRun = useCallback((m: Mode) => {
    const G = initWorld()
    const numR = m === 'solo' ? 1 : m === '1v1' ? 2 : 4
    for (let i = 0; i < numR; i++) {
      const isBot = i > 0
      const name = isBot ? ROOF_BOT_NAMES[i - 1] || ('Bot' + i) : 'You'
      const col = ROOF_RUNNER_COLORS[i % ROOF_RUNNER_COLORS.length]
      const r = mkRunner(i, isBot, name, col)
      if (G.platforms.length > 0) {
        r.y = G.platforms[0].y - r.h
        r.x = 60 + i * 30
        r.onG = true
      }
      G.runners.push(r)
    }
    gameRef.current = G
    setMode(m)
    setDist(0); setCoins2(0); setScore(0); setFuel(100); setPlace(1); setAlive(true)
    boostRef.current = false
    puffStartRef.current = 0
    setPhase('playing')
  }, [])

  const jumpAction = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    const G = gameRef.current; if (!G) return
    const p = G.runners[0]; if (!p || p.dead) return
    if (p.jumps < p.maxJ) {
      const bm = p.boost.on ? ROOF_BOOST_JUMP : 1
      p.vy = p.jumps === 0 ? ROOF_JUMP_V * bm : ROOF_DOUBLE_JUMP_V * bm
      p.jumps++; p.onG = false
      audio.playFx('tap')
      for (let i = 0; i < 5; i++) G.parts.push({ x: p.x, y: p.y + p.h, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, r: 2 + Math.random() * 2, col: 'rgba(255,255,255,0.5)', life: 20, dec: 0.03 })
    }
  }, [audio])

  const puffDown = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    boostRef.current = true
    puffStartRef.current = Date.now()
  }, [])
  const puffUp = useCallback(() => {
    boostRef.current = false
    puffStartRef.current = 0
  }, [])

  const cleanup = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    gameRef.current = null
    boostRef.current = false
    puffStartRef.current = 0
    setPhase(null)
    setAlive(true)
    setDist(0); setCoins2(0); setScore(0); setFuel(100); setPlace(1)
    setSelectedMode(null)
    setLobbyTab('play')
    game.exitGame()
  }, [game])

  // ── Lifecycle ──
  useEffect(() => {
    if (game.gameActive?.id !== 'rooftoppuff') return
    setPhase('modeselect')
    setSelectedMode(null)
    setLobbyTab('play')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  // RAF loop
  useEffect(() => {
    if (phase !== 'playing') return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const loop = () => {
      if (!gameRef.current) return
      update()
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [phase, update, draw])

  // BLE
  useEffect(() => {
    if (game.gameActive?.id !== 'rooftoppuff') return
    ble.registerPuffHandlers('rooftoppuff', () => puffDown(), () => puffUp())
    return () => {
      audio.gameSoundsMuted.current = true
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      gameRef.current = null
      boostRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'rooftoppuff') return null

  const isPlaying = phase === 'playing'
  const roofGC = '#00E5FF'

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #050515 0%, #0a0a25 30%, #151025 60%, #0a0a20 100%)', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(0,229,255,0.06)' }}>
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
        <div style={{ padding: '3px 12px 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); if (isPlaying) { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; gameRef.current = null; boostRef.current = false; setPhase('modeselect'); setSelectedMode(null); setLobbyTab('play') } else { cleanup() } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0, touchAction: 'none' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>{isPlaying ? 'Lobby' : 'Arcade'}</span>
          </div>
          {isPlaying && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>🏃 {dist}m</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.gold }}>🪙 {coins2}</span>
              {mode !== 'solo' && <span style={{ fontSize: 8, fontWeight: 800, color: place === 1 ? C.gold : place === 2 ? '#C0C0C0' : '#CD7F32' }}>#{place}</span>}
            </div>
          )}
        </div>
        {isPlaying && (
          <div style={{ padding: '0 12px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 7, fontWeight: 800, color: fuel > 50 ? roofGC : fuel > 20 ? '#F59E0B' : '#EF4444', flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: fuel + '%', borderRadius: 2, background: fuel > 50 ? `linear-gradient(90deg, ${roofGC}, #66FFCC)` : fuel > 20 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)', transition: 'width 0.15s' }} />
              </div>
              <span style={{ fontSize: 7, fontWeight: 700, color: '#888' }}>{fuel}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }} onClick={(e) => { const target = e.target as HTMLElement; if (target.closest('[data-btn]')) return; if (isPlaying) jumpAction() }}>
        {isPlaying && <canvas ref={canvasRef} width={Math.round(ROOF_W * ROOF_DPR)} height={Math.round(ROOF_H * ROOF_DPR)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />}

        {/* Mode Select */}
        {phase === 'modeselect' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, padding: '16px 14px', overflowY: 'auto', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 70%), linear-gradient(180deg, #050515, #0a0a25 50%, #0a0a20)' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>🏃</div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #00E5FF, #66FFCC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ROOFTOP PUFF</div>
              <div style={{ fontSize: 8, color: '#666', letterSpacing: 2, marginTop: 2 }}>ENDLESS RUNNER PARKOUR</div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 4, marginBottom: 12 }}>
              {([{ id: 'play', emoji: '🎮', label: 'PLAY' }, { id: 'rank', emoji: '🏆', label: 'RANK' }] as const).map(tab => (
                <div key={tab.id} data-btn="true" onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); setLobbyTab(tab.id) }} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden',
                  background: lobbyTab === tab.id ? 'linear-gradient(135deg, rgba(245,180,0,0.14), rgba(245,180,0,0.06))' : 'transparent',
                  border: `1px solid ${lobbyTab === tab.id ? 'rgba(245,180,0,0.35)' : 'transparent'}`, transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span>{tab.emoji}</span>
                    <span style={{ fontWeight: 700, letterSpacing: 0.5, color: lobbyTab === tab.id ? C.gold : '#888', fontSize: 9 }}>{tab.label}</span>
                  </div>
                  {lobbyTab === tab.id && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, background: C.gold, borderRadius: 2 }} />}
                </div>
              ))}
            </div>

            {lobbyTab === 'play' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {([
                    { m: 'solo' as Mode, emoji: '🏃', name: 'Solo Run', sub: 'Survive 3000m', color: roofGC },
                    { m: '1v1' as Mode, emoji: '🎯', name: '1v1 Race', sub: 'Beat one rival', color: '#FF6B8A' },
                    { m: 'race' as Mode, emoji: '💀', name: 'Race 4', sub: '4 runners, 1 wins', color: C.gold },
                  ]).map(b => {
                    const sel = selectedMode === b.m
                    return (
                      <div key={b.m} data-btn="true" onClick={(e) => { e.stopPropagation(); audio.playFx('tap'); setSelectedMode(b.m) }} style={{
                        padding: '14px 6px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                        background: sel ? `${b.color}15` : `${b.color}06`, border: `1px solid ${sel ? b.color + '40' : b.color + '18'}`,
                        boxShadow: sel ? `0 0 16px ${b.color}20` : 'none', transform: sel ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s',
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: sel ? b.color : '#ccc' }}>{b.name}</div>
                        <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>{b.sub}</div>
                        {sel && <div style={{ marginTop: 4, width: 20, height: 3, borderRadius: 2, background: b.color, margin: '0 auto' }} />}
                      </div>
                    )
                  })}
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: roofGC, letterSpacing: 1, marginBottom: 6 }}>HOW TO PLAY</div>
                  <div style={{ fontSize: 8, color: '#aaa', lineHeight: 1.6 }}>
                    👆 <b style={{ color: '#fff' }}>Tap</b> = Jump (tap twice for double jump)<br />
                    💨 <b style={{ color: '#fff' }}>Hold Puff</b> = Speed Boost (uses fuel)<br />
                    🪙 Collect coins for bonus points<br />
                    ⚡ Grab boost pickups to refuel
                  </div>
                </div>
                {selectedMode && (
                  <div data-btn="true" onClick={(e) => { e.stopPropagation(); startRun(selectedMode) }} style={{
                    padding: '14px 0', borderRadius: 50, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #00E5FF, #00BCD4, #00E5FF)', backgroundSize: '200% 100%',
                    boxShadow: '0 8px 32px rgba(0,229,255,0.35)', marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: '#0a0600' }}>✦ START RUN ✦</span>
                  </div>
                )}
                {!selectedMode && <div style={{ textAlign: 'center', fontSize: 10, color: '#666', marginBottom: 12 }}>Select a mode to begin</div>}
              </>
            )}

            {lobbyTab === 'rank' && (
              <>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' }}>Leaderboard</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { n: 'CloudRunner', d: 4820, c: 142 },
                    { n: 'NeonDash', d: 3650, c: 98 },
                    { n: 'BlazeFeet', d: 2900, c: 75 },
                    { n: 'You', d: dist || 0, c: coins2 || 0 },
                  ].sort((a, b) => b.d - a.d).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: r.n === 'You' ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${r.n === 'You' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
                      <span style={{ fontSize: 14, width: 24, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏃'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: r.n === 'You' ? roofGC : '#ccc' }}>{r.n}</div>
                        <div style={{ fontSize: 7, color: '#888' }}>{r.d}m | {r.c} coins</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>{r.d} pts</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 20, background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{alive ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: alive ? C.gold : C.red, marginBottom: 8 }}>{alive ? 'VICTORY!' : 'GAME OVER'}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Score: {score}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Distance: {dist}m | Coins: {coins2}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Mode: {mode === 'solo' ? 'Solo Run' : mode === '1v1' ? '1v1 Race' : 'Race 4'}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startRun(mode) }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${roofGC}15`, border: `1px solid ${roofGC}30`, fontSize: 12, fontWeight: 800, color: roofGC }}>🔄 Replay</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); gameRef.current = null; setPhase('modeselect'); setSelectedMode(null); setLobbyTab('play') }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, fontSize: 12, fontWeight: 800, color: C.cyan }}>⚔️ Change Mode</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup() }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, fontWeight: 800, color: '#999' }}>Done</div>
            </div>
          </div>
        )}

        {/* Puff boost bar */}
        {isPlaying && (
          <div data-btn="true"
            onMouseDown={(e) => { e.stopPropagation(); puffDown() }}
            onMouseUp={(e) => { e.stopPropagation(); puffUp() }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); puffDown() }}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); puffUp() }}
            onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); puffUp() }}
            style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, zIndex: 30, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'none', userSelect: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fuel + '%', background: boostRef.current ? `linear-gradient(90deg, ${roofGC}30, ${roofGC}15)` : 'transparent', transition: 'width 0.1s' }} />
            <span style={{ fontSize: 12, fontWeight: 900, color: boostRef.current ? roofGC : 'rgba(255,255,255,0.5)', letterSpacing: 2, position: 'relative', zIndex: 1 }}>{boostRef.current ? '💨 BOOSTING...' : '💨 HOLD FOR BOOST'}</span>
          </div>
        )}

        <GameChatOverlay />
      </div>
    </div>
  )
}
