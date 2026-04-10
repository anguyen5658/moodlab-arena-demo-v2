import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'

// ─────────────────────────────────────────────────────────────
// Balloon Pop — turn-based inflation. Pop it and you're out.
// Ported from moodlab-arena-v7.jsx (startBalloonPop & bp* state)
// ─────────────────────────────────────────────────────────────

interface BpPlayer {
  name: string
  emoji: string
  img?: string
  isYou?: boolean
  isAI: boolean
  isHuman?: boolean
  alive: boolean
  puffs: number
  totalAir: number
  strategy: string
  color?: string
  deviceSlot?: number
  taunt?: string
}

interface BpParticle {
  x: number; y: number; color: string; vx: number; vy: number
  life: number; maxLife: number; size: number
}

interface BpConfettiPart {
  x: number; y: number; vx: number; vy: number; color: string
  rot: number; rotV: number; w: number; h: number; life: number
}

interface BpBokeh {
  x: number; y: number; r: number; color: string; phase: number; speed: number
}

const BP_AI_PLAYERS = [
  { name: "CautiousCarl", emoji: "😬", img: "https://api.dicebear.com/9.x/adventurer/svg?seed=CautiousCarl&backgroundColor=transparent", strategy: "cautious", taunt: "Slow and steady..." },
  { name: "YOLO Yolanda", emoji: "🔥", img: "https://api.dicebear.com/9.x/adventurer/svg?seed=YoloYolanda&backgroundColor=transparent", strategy: "reckless", taunt: "FULL SEND BABY" },
  { name: "RandomRick", emoji: "🎲", img: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=RandomRick&backgroundColor=transparent", strategy: "random", taunt: "Who knows lol" },
  { name: "SmoothSam", emoji: "😎", img: "https://api.dicebear.com/9.x/adventurer/svg?seed=SmoothSam&backgroundColor=transparent", strategy: "cautious", taunt: "Calculated risk" },
  { name: "MadMax420", emoji: "💀", img: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=MadMax420&backgroundColor=transparent", strategy: "reckless", taunt: "Send it or go home" },
  { name: "NervousNate", emoji: "😰", img: "https://api.dicebear.com/9.x/adventurer/svg?seed=NervousNate&backgroundColor=transparent", strategy: "cautious", taunt: "Oh god oh no..." },
  { name: "ChillChris", emoji: "😌", img: "https://api.dicebear.com/9.x/adventurer/svg?seed=ChillChris&backgroundColor=transparent", strategy: "random", taunt: "Vibes only bro" },
  { name: "BoldBella", emoji: "💪", img: "https://api.dicebear.com/9.x/adventurer/svg?seed=BoldBella&backgroundColor=transparent", strategy: "reckless", taunt: "I eat balloons for breakfast" },
  { name: "SneakySue", emoji: "🦊", img: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=SneakySue&backgroundColor=transparent", strategy: "cautious", taunt: "Patience is a virtue..." },
  { name: "TurboTom", emoji: "⚡", img: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=TurboTom&backgroundColor=transparent", strategy: "reckless", taunt: "SPEED RUN LETS GO" },
]

const BP_COMMENTS = {
  small: ["Baby puff", "My grandma hits harder", "Ant-sized", "Whisper puff", "Barely a breeze", "Coward level: MAX", "Mosquito breath", "Did you even puff??"],
  big: ["MADMAN!", "FULL SEND!", "Balloon said YIKES", "LUNGS OF STEEL", "Risky business!", "That was AGGRESSIVE", "Brave AND stupid", "That balloon is scared of you"],
  blinker: ["BLINKER PUFF! Trying to end it in one shot", "ABSOLUTE PSYCHOPATH", "BLINKER MODE ACTIVATED!!", "Your lungs are too powerful!", "INSANE RISK!! ARE YOU OKAY??"],
  pop: ["BOOOOM!", "THE BALLOON HAS LEFT THE CHAT", "R.I.P. BALLOON", "POP! Too powerful!", "BANG! GAME OVER!", "Balloon said I cant breathe"],
  shaking: ["IT COULD GO ANY MOMENT!", "DANGER ZONE!", "Everyone holding their breath!", "The balloon is SWEATING", "One more puff and its OVER", "The balloon is begging for mercy"],
  survive: ["Living on the edge!", "Still alive... for now", "That was CLOSE", "Heart rate: 200bpm", "The crowd gasps..."],
}

const BP_PLAYER_COLORS = ["#00E5FF", "#FF6B8A", "#FFD93D", "#7CFF6B", "#C084FC", "#FF8800", "#34D399", "#60A5FA"]
const SLOT_COLORS = ["#00E5FF", "#60A5FA", "#FFD93D", "#FF6B8A"]
const PLAYER_IMG = "https://api.dicebear.com/9.x/adventurer/svg?seed=Steve&backgroundColor=transparent"
const BP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const getBalloonColor = (pct: number) => pct < 30 ? "#4CAF50" : pct < 50 ? "#8BC34A" : pct < 65 ? "#FFEB3B" : pct < 75 ? "#FF9800" : pct < 85 ? "#FF5722" : "#F44336"

export const BalloonPopGame: React.FC = () => {
  const { gameActive, exitGame } = useGameContext()
  const { recordGameResult, notify, spawnConfetti, spawnSmoke } = usePlayerContext()
  const { registerPuffHandlers, bleConnected, mpActive, ssPlayerCount, partyPlayerNames } = useBLEContext()
  const audio = useAudioContext()
  const { playFx } = audio

  // ── State ──
  const [bpPhase, setBpPhase] = useState<string | null>(null)
  const [bpPlayers, setBpPlayers] = useState<BpPlayer[]>([])
  const [bpCurrentTurn, setBpCurrentTurn] = useState(0)
  const [bpAirLevel, setBpAirLevel] = useState(0)
  const [bpPopThreshold, setBpPopThreshold] = useState(100)
  const [bpPuffAmount, setBpPuffAmount] = useState(0)
  const [bpCharging, setBpCharging] = useState(false)
  const [, setBpComment] = useState("")
  const [bpRound, setBpRound] = useState(0)
  const [bpLoser, setBpLoser] = useState<BpPlayer | null>(null)
  const [, setBpHistory] = useState<any[]>([])
  const [bpShaking, setBpShaking] = useState(false)
  const [, setBpPopping] = useState(false)
  const [, setBpBalloonColor] = useState("#4CAF50")
  const [bpEliminatedList, setBpEliminatedList] = useState<BpPlayer[]>([])
  const [bpWinner, setBpWinner] = useState<BpPlayer | null>(null)

  // ── Refs ──
  const bpChargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const bpPuffStart = useRef(0)
  const bpCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const bpAnimRef = useRef<number | null>(null)
  const bpParticles = useRef<BpParticle[]>([])
  const bpBokeh = useRef<BpBokeh[]>([])
  const bpConfettiParts = useRef<BpConfettiPart[]>([])
  const bpActiveRef = useRef({ v: true })
  const startedRef = useRef(false)

  // Latest-state refs so handlers don't need to re-register on every state change
  const bpPhaseRef = useRef(bpPhase)
  const bpPlayersRef = useRef(bpPlayers)
  const bpCurrentTurnRef = useRef(bpCurrentTurn)
  const bpAirLevelRef = useRef(bpAirLevel)
  const bpPopThresholdRef = useRef(bpPopThreshold)
  const bpChargingRef = useRef(bpCharging)
  const bpShakingRef = useRef(bpShaking)

  useEffect(() => { bpPhaseRef.current = bpPhase }, [bpPhase])
  useEffect(() => { bpPlayersRef.current = bpPlayers }, [bpPlayers])
  useEffect(() => { bpCurrentTurnRef.current = bpCurrentTurn }, [bpCurrentTurn])
  useEffect(() => { bpAirLevelRef.current = bpAirLevel }, [bpAirLevel])
  useEffect(() => { bpPopThresholdRef.current = bpPopThreshold }, [bpPopThreshold])
  useEffect(() => { bpChargingRef.current = bpCharging }, [bpCharging])
  useEffect(() => { bpShakingRef.current = bpShaking }, [bpShaking])

  // ── Particle helpers ──
  const bpSpawnParticle = (x: number, y: number, color: string, vx?: number, vy?: number, life?: number) => {
    bpParticles.current.push({
      x, y, color,
      vx: vx ?? (Math.random() - 0.5) * 4,
      vy: vy ?? (-1 - Math.random() * 3),
      life: life ?? 1,
      maxLife: life ?? 1,
      size: 3 + Math.random() * 5,
    })
  }
  const bpSpawnExplosion = (cx: number, cy: number) => {
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2
      const sp = 3 + Math.random() * 6
      bpSpawnParticle(cx, cy, ["#FF4D8D", "#FFD93D", "#00E5FF", "#C084FC", "#FF4444", "#FB923C", "#34D399"][i % 7], Math.cos(a) * sp, Math.sin(a) * sp, 1.2 + Math.random() * 0.5)
    }
  }
  const bpSpawnConfettiCanvas = (cx: number, cy: number) => {
    for (let i = 0; i < 40; i++) {
      bpConfettiParts.current.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 8,
        vy: -4 - Math.random() * 6,
        color: ["#FF4D8D", "#FFD93D", "#00E5FF", "#C084FC", "#34D399", "#FB923C", "#FF4444", "#60A5FA"][i % 8],
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 15,
        w: 4 + Math.random() * 4,
        h: 3 + Math.random() * 3,
        life: 2 + Math.random(),
      })
    }
  }

  // ── Canvas draw ──
  const bpDrawCanvas = useCallback(() => {
    const canvas = bpCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const airPct = bpPopThreshold > 0 ? Math.min(100, (bpAirLevel / bpPopThreshold) * 100) : 0
    const nearPop = airPct > 70, dangerZone = airPct > 85
    const t = Date.now() * 0.001

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    if (dangerZone) { bgGrad.addColorStop(0, "#1a0000"); bgGrad.addColorStop(0.4, "#3d0a0a"); bgGrad.addColorStop(0.7, "#6b1a1a"); bgGrad.addColorStop(1, "#1a0505") }
    else if (nearPop) { bgGrad.addColorStop(0, "#0a0520"); bgGrad.addColorStop(0.4, "#1a0a3d"); bgGrad.addColorStop(0.7, "#3d1a3d"); bgGrad.addColorStop(1, "#150a20") }
    else { bgGrad.addColorStop(0, "#060818"); bgGrad.addColorStop(0.3, "#0c1030"); bgGrad.addColorStop(0.6, "#141850"); bgGrad.addColorStop(1, "#080c20") }
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Bokeh
    if (bpBokeh.current.length === 0) {
      for (let i = 0; i < 20; i++) {
        bpBokeh.current.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.7,
          r: 8 + Math.random() * 20,
          color: ["#FF4D8D", "#FFD93D", "#00E5FF", "#C084FC", "#34D399", "#FB923C"][i % 6],
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
        })
      }
    }
    bpBokeh.current.forEach(b => {
      const pulse = 0.15 + Math.sin(t * b.speed + b.phase) * 0.1
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * BP_DPR)
      grad.addColorStop(0, b.color + (dangerZone ? "40" : "30"))
      grad.addColorStop(1, "transparent")
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r * BP_DPR * (0.8 + pulse * 0.4), 0, Math.PI * 2)
      ctx.fill()
    })

    // Bunting
    const buntY = 30 * BP_DPR
    ctx.strokeStyle = "rgba(255,217,61,0.2)"
    ctx.lineWidth = 1.5 * BP_DPR
    ctx.beginPath()
    for (let i = 0; i <= 8; i++) {
      const x = i * (W / 8)
      const y2 = buntY + (i % 2 === 0 ? 0 : 15 * BP_DPR)
      if (i === 0) ctx.moveTo(x, buntY)
      else ctx.quadraticCurveTo(x - W / 16, buntY + 20 * BP_DPR, x, y2)
    }
    ctx.stroke()
    const flagColors = ["#FF4D8D30", "#00E5FF30", "#FFD93D30", "#C084FC30", "#34D39930", "#FB923C30", "#FF444430", "#60A5FA30"]
    for (let i = 0; i < 8; i++) {
      const x = i * (W / 8) + W / 16
      ctx.fillStyle = flagColors[i]
      ctx.beginPath()
      ctx.moveTo(x - 8 * BP_DPR, buntY)
      ctx.lineTo(x, buntY + 18 * BP_DPR)
      ctx.lineTo(x + 8 * BP_DPR, buntY)
      ctx.closePath()
      ctx.fill()
    }

    // Ground glow
    const groundGrad = ctx.createLinearGradient(0, H, 0, H * 0.7)
    groundGrad.addColorStop(0, dangerZone ? "rgba(200,30,30,0.15)" : nearPop ? "rgba(160,60,100,0.1)" : "rgba(60,40,120,0.08)")
    groundGrad.addColorStop(1, "transparent")
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, H * 0.7, W, H * 0.3)

    // Vignette
    const vigGrad = ctx.createRadialGradient(W / 2, H * 0.4, W * 0.2, W / 2, H * 0.4, W * 0.7)
    vigGrad.addColorStop(0, "transparent")
    vigGrad.addColorStop(1, "rgba(0,0,0," + (dangerZone ? 0.7 : nearPop ? 0.5 : 0.35) + ")")
    ctx.fillStyle = vigGrad
    ctx.fillRect(0, 0, W, H)

    // Balloon
    const bCX = W / 2, bCY = H * 0.35
    const bScale = 0.5 + (airPct / 100) * 1.2
    const bRadius = 40 * BP_DPR * bScale
    const bColor = getBalloonColor(airPct)

    if (bpPhase !== "popped" && bpPhase !== "result") {
      const glowGrad = ctx.createRadialGradient(bCX, bCY, bRadius * 0.3, bCX, bCY, bRadius * 2)
      glowGrad.addColorStop(0, bColor + "25")
      glowGrad.addColorStop(1, "transparent")
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(bCX, bCY, bRadius * 2, 0, Math.PI * 2)
      ctx.fill()

      const wobX = bpShaking ? (Math.sin(t * 25) * 4 * BP_DPR) : 0
      const wobY = bpShaking ? (Math.cos(t * 30) * 3 * BP_DPR) : 0
      const inflateOsc = bpCharging ? (Math.sin(t * 12) * 2 * BP_DPR) : 0

      ctx.save()
      ctx.translate(bCX + wobX, bCY + wobY)
      const ballGrad = ctx.createRadialGradient(-bRadius * 0.3, -bRadius * 0.3, 0, 0, 0, bRadius)
      ballGrad.addColorStop(0, bColor + "FF")
      ballGrad.addColorStop(0.6, bColor + "DD")
      ballGrad.addColorStop(1, bColor + "88")
      ctx.fillStyle = ballGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, bRadius + inflateOsc, bRadius * 1.2 + inflateOsc, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "rgba(255,255,255,0.25)"
      ctx.beginPath()
      ctx.ellipse(-bRadius * 0.25, -bRadius * 0.35, bRadius * 0.2, bRadius * 0.35, Math.PI * -0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = bColor + "CC"
      ctx.beginPath()
      ctx.moveTo(-3 * BP_DPR, bRadius * 1.2)
      ctx.lineTo(3 * BP_DPR, bRadius * 1.2)
      ctx.lineTo(0, bRadius * 1.2 + 6 * BP_DPR)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = "rgba(255,255,255,0.15)"
      ctx.lineWidth = 1 * BP_DPR
      ctx.beginPath()
      ctx.moveTo(0, bRadius * 1.2 + 6 * BP_DPR)
      const stringLen = 50 * BP_DPR
      for (let s = 0; s < stringLen; s += 4) {
        ctx.lineTo(Math.sin(s * 0.15 + t * 2) * 3 * BP_DPR, bRadius * 1.2 + 6 * BP_DPR + s)
      }
      ctx.stroke()
      ctx.restore()

      // Air % badge
      ctx.fillStyle = "rgba(0,0,0,0.5)"
      const badgeW = 44 * BP_DPR, badgeH = 18 * BP_DPR
      const badgeX = bCX + bRadius + 10 * BP_DPR, badgeY = bCY - bRadius
      ctx.beginPath()
      const rr = (ctx as any).roundRect
      if (rr) (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 6 * BP_DPR)
      else ctx.rect(badgeX, badgeY, badgeW, badgeH)
      ctx.fill()
      ctx.fillStyle = bColor
      ctx.font = "bold " + Math.round(10 * BP_DPR) + "px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(Math.round(airPct) + "%", badgeX + badgeW / 2, badgeY + badgeH / 2)
    }

    // Particles
    bpParticles.current = bpParticles.current.filter(p => {
      p.life -= 0.016
      if (p.life <= 0) return false
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * BP_DPR * alpha, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      return true
    })

    // Confetti
    bpConfettiParts.current = bpConfettiParts.current.filter(c => {
      c.life -= 0.016
      if (c.life <= 0) return false
      c.x += c.vx
      c.y += c.vy
      c.vy += 0.12
      c.vx *= 0.99
      c.rot += c.rotV
      const alpha = Math.max(0, c.life / 3)
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate((c.rot * Math.PI) / 180)
      ctx.globalAlpha = alpha
      ctx.fillStyle = c.color
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w * BP_DPR, c.h * BP_DPR)
      ctx.globalAlpha = 1
      ctx.restore()
      return true
    })

    // Player indicators
    const arcCX = W / 2, arcCY = H * 0.78
    const arcR = Math.min(W * 0.38, 140 * BP_DPR)
    bpPlayers.forEach((p, i) => {
      const totalP = bpPlayers.length || 1
      const angle = Math.PI + (i / (totalP - 1 || 1)) * Math.PI
      const px = arcCX + Math.cos(angle) * arcR
      const py = arcCY + Math.sin(angle) * arcR * 0.35
      const isCur = i === bpCurrentTurn && bpPhase !== "popped" && bpPhase !== "result"
      const isDead = !p.alive
      const dotR = isCur ? 14 * BP_DPR : 10 * BP_DPR

      if (isCur) {
        ctx.fillStyle = (p.isYou ? C.cyan : C.orange) + "30"
        ctx.beginPath()
        ctx.arc(px, py, dotR * 1.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = (p.isYou ? C.cyan : C.orange) + "60"
        ctx.lineWidth = 1.5 * BP_DPR
        ctx.beginPath()
        ctx.arc(px, py, dotR * 1.3, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = isDead ? "#333" : (BP_PLAYER_COLORS[i % 8] + (isCur ? "FF" : "80"))
      ctx.beginPath()
      ctx.arc(px, py, dotR, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = Math.round((isCur ? 12 : 9) * BP_DPR) + "px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(isDead ? "X" : p.emoji, px, py)

      ctx.fillStyle = isDead ? "#555" : (isCur ? (p.isYou ? C.cyan : C.orange) : C.text3)
      ctx.font = Math.round((isCur ? 8 : 7) * BP_DPR) + "px sans-serif"
      ctx.fillText(p.isYou ? "YOU" : p.name.slice(0, 6), px, py + dotR + 8 * BP_DPR)
    })

    if (dangerZone && bpPhase !== "popped" && bpPhase !== "result") {
      const pulse = Math.abs(Math.sin(t * 4)) * 0.08
      ctx.fillStyle = "rgba(255,0,0," + pulse + ")"
      ctx.fillRect(0, 0, W, H)
    }
  }, [bpAirLevel, bpPopThreshold, bpPhase, bpShaking, bpCharging, bpPlayers, bpCurrentTurn])

  // ── Animation loop — restart every render (Rule 4) ──
  useEffect(() => {
    if (!bpPhase) return
    if (bpAnimRef.current) cancelAnimationFrame(bpAnimRef.current)
    const loop = () => {
      bpDrawCanvas()
      bpAnimRef.current = requestAnimationFrame(loop)
    }
    bpAnimRef.current = requestAnimationFrame(loop)
    return () => {
      if (bpAnimRef.current) {
        cancelAnimationFrame(bpAnimRef.current)
        bpAnimRef.current = null
      }
    }
  })

  // ── Game flow helpers ──
  const bpFindNextAlive = (players: BpPlayer[], fromIdx: number): number | null => {
    for (let i = 1; i <= players.length; i++) {
      const ni = (fromIdx + i) % players.length
      if (players[ni].alive) return ni
    }
    return null
  }

  const bpDoAITurn = (players: BpPlayer[], idx: number, airLevel: number, threshold: number) => {
    const p = players[idx]
    if (!p || !p.alive) return
    const strat = p.strategy
    const amt = strat === "cautious" ? 3 + Math.floor(Math.random() * 5)
      : strat === "reckless" ? 10 + Math.floor(Math.random() * 13)
      : 5 + Math.floor(Math.random() * 10)
    setBpPhase("ai_turn")
    playFx("charge")
    setBpCharging(true)
    setBpPuffAmount(0)
    const dur = 400 + (amt / 25) * 1800
    const st = Date.now()
    const iv = setInterval(() => {
      setBpPuffAmount(Math.min(100, ((Date.now() - st) / dur) * 100))
    }, 50)
    setTimeout(() => {
      clearInterval(iv)
      setBpCharging(false)
      setBpPuffAmount(0)
      playFx("kick")
      bpProcessPuff(idx, amt, players, airLevel, threshold)
    }, dur)
  }

  const bpProcessPuff = (pidx: number, amount: number, players: BpPlayer[], airLevel: number, threshold: number) => {
    const ca = Math.max(3, Math.min(30, amount))
    const newAir = airLevel + ca
    const popped = newAir >= threshold
    const up = players.map((p, i) => i === pidx ? { ...p, puffs: p.puffs + 1, totalAir: p.totalAir + ca } : p)
    const dAir = Math.min(newAir, threshold)
    const color = getBalloonColor((dAir / threshold) * 100)
    const nearPop = dAir > threshold * 0.7

    setBpPlayers(up)
    setBpAirLevel(newAir)
    setBpBalloonColor(color)
    setBpHistory(h => [...h, { playerIdx: pidx, amount: ca, totalAfter: newAir }])
    setBpRound(r => r + 1)

    if (ca >= 20) setBpComment(pick(BP_COMMENTS.blinker))
    else if (ca <= 5) setBpComment(pick(BP_COMMENTS.small))
    else if (ca >= 15) setBpComment(pick(BP_COMMENTS.big))
    else setBpComment(pick(BP_COMMENTS.survive))

    if (nearPop && !popped) {
      setBpShaking(true)
      if (dAir > threshold * 0.85) setTimeout(() => setBpComment(pick(BP_COMMENTS.shaking)), 600)
    }

    if (popped) {
      setBpPopping(true)
      setBpShaking(false)
      const elimPlayer = up[pidx]
      setBpLoser(elimPlayer)
      setBpPhase("popped")
      setBpComment(pick(BP_COMMENTS.pop))
      playFx("balloon_pop")
      playFx("lose")
      spawnSmoke(20)
      playFx("crowd")
      if (bpCanvasRef.current) bpSpawnExplosion(bpCanvasRef.current.width / 2, bpCanvasRef.current.height * 0.35)
      const newPlayers = up.map((p, i) => i === pidx ? { ...p, alive: false } : p)
      setBpPlayers(newPlayers)
      setBpEliminatedList(prev => [...prev, elimPlayer])
      const aliveList = newPlayers.filter(p => p.alive)

      setTimeout(() => {
        setBpPopping(false)
        if (aliveList.length <= 1) {
          const winner = aliveList[0] || null
          setBpWinner(winner)
          setBpPhase("result")
          if (winner && winner.isYou) {
            spawnConfetti(50, [C.gold, C.green, C.cyan, C.pink])
            playFx("win")
            playFx("crowd")
            if (bpCanvasRef.current) bpSpawnConfettiCanvas(bpCanvasRef.current.width / 2, bpCanvasRef.current.height * 0.3)
          } else {
            playFx("lose")
          }
        } else {
          const newThreshold = 80 + Math.floor(Math.random() * 41)
          setBpAirLevel(0)
          setBpPopThreshold(newThreshold)
          setBpBalloonColor("#4CAF50")
          setBpShaking(false)
          const nextAlive = bpFindNextAlive(newPlayers, pidx)
          if (nextAlive !== null) {
            setBpCurrentTurn(nextAlive)
            if (newPlayers[nextAlive].isAI) {
              setBpPhase("ai_turn")
              setTimeout(() => bpDoAITurn(newPlayers, nextAlive, 0, newThreshold), 1500 + Math.random() * 1000)
            } else {
              setBpPhase("playing")
              playFx("select")
            }
          }
        }
      }, 2200)
      return
    }

    const nextAlive = bpFindNextAlive(up, pidx)
    if (nextAlive === null) return
    setBpCurrentTurn(nextAlive)
    if (up[nextAlive].isAI) {
      setBpPhase("ai_turn")
      setTimeout(() => bpDoAITurn(up, nextAlive, newAir, threshold), 1000 + Math.random() * 1500)
    } else {
      setBpPhase("playing")
      playFx("select")
    }
  }

  // ── Input handlers ──
  const bpTapInflate = () => {
    if (bpPhaseRef.current !== "playing" || bpChargingRef.current) return
    const cur = bpPlayersRef.current[bpCurrentTurnRef.current]
    if (cur && cur.isAI) return
    const amt = 3 + Math.floor(Math.random() * 3)
    playFx("tap")
    bpProcessPuff(bpCurrentTurnRef.current, amt, bpPlayersRef.current, bpAirLevelRef.current, bpPopThresholdRef.current)
  }

  const bpStartCharge = () => {
    if (bpPhaseRef.current !== "playing" || bpChargingRef.current) return
    const cur = bpPlayersRef.current[bpCurrentTurnRef.current]
    if (cur && cur.isAI) return
    setBpCharging(true)
    setBpPuffAmount(0)
    bpPuffStart.current = Date.now()
    playFx("balloon_inflate")
    bpChargeInterval.current = setInterval(() => {
      const e = (Date.now() - bpPuffStart.current) / 1000
      setBpPuffAmount(Math.min(100, (e / 4.5) * 100))
      if (e >= 5.0) bpStopCharge()
    }, 50)
  }

  const bpStopCharge = () => {
    if (!bpChargingRef.current) return
    setBpCharging(false)
    if (bpChargeInterval.current) {
      clearInterval(bpChargeInterval.current)
      bpChargeInterval.current = null
    }
    const e = (Date.now() - bpPuffStart.current) / 1000
    let amt: number
    if (e < 0.8) amt = 8 + Math.round(Math.random() * 3)
    else if (e < 2.0) amt = 11 + Math.round(Math.random() * 4)
    else amt = 13 + Math.round(Math.random() * 3)
    playFx("kick")
    setBpPuffAmount(0)
    bpProcessPuff(bpCurrentTurnRef.current, amt, bpPlayersRef.current, bpAirLevelRef.current, bpPopThresholdRef.current)
  }

  const bpBlinkerInflate = () => {
    if (bpPhaseRef.current !== "playing" || bpChargingRef.current) return
    const cur = bpPlayersRef.current[bpCurrentTurnRef.current]
    if (cur && cur.isAI) return
    const amt = 20 + Math.floor(Math.random() * 11)
    playFx("kick")
    bpProcessPuff(bpCurrentTurnRef.current, amt, bpPlayersRef.current, bpAirLevelRef.current, bpPopThresholdRef.current)
  }

  // ── BLE registration with lazy wrappers (Rule 3) ──
  useEffect(() => {
    if (gameActive?.id !== "balloon") return
    const down = () => bpStartCharge()
    const up = () => bpStopCharge()
    registerPuffHandlers("balloon", down, up)
    return () => registerPuffHandlers(null, null, null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameActive?.id])

  // ── Start game ──
  const startBalloonPop = () => {
    if (bpAnimRef.current) { cancelAnimationFrame(bpAnimRef.current); bpAnimRef.current = null }
    bpParticles.current = []
    bpBokeh.current = []
    bpConfettiParts.current = []
    const mpCount = (mpActive && ssPlayerCount && ssPlayerCount >= 2) ? ssPlayerCount : 0
    const players: BpPlayer[] = []
    if (mpCount > 0) {
      players.push({ name: partyPlayerNames[0], emoji: "😤", img: PLAYER_IMG, isYou: true, isAI: false, isHuman: false, alive: true, puffs: 0, totalAir: 0, strategy: "human", color: SLOT_COLORS[0], deviceSlot: 0 })
      for (let s = 1; s < mpCount; s++) {
        players.push({ name: partyPlayerNames[s], emoji: "🎮", isYou: false, isAI: false, isHuman: true, alive: true, puffs: 0, totalAir: 0, strategy: "human", color: SLOT_COLORS[s], deviceSlot: s })
      }
      const shuffled = [...BP_AI_PLAYERS].sort(() => Math.random() - 0.5)
      const aiNeeded = 8 - mpCount
      shuffled.slice(0, aiNeeded).forEach((a, i) => {
        players.push({ ...a, isYou: false, isAI: true, isHuman: false, alive: true, puffs: 0, totalAir: 0, color: BP_PLAYER_COLORS[(mpCount + i) % 8] })
      })
    } else {
      const shuffled = [...BP_AI_PLAYERS].sort(() => Math.random() - 0.5)
      const aiP: BpPlayer[] = shuffled.slice(0, 7).map((a, i) => ({ ...a, isYou: false, isAI: true, isHuman: false, alive: true, puffs: 0, totalAir: 0, color: BP_PLAYER_COLORS[(i + 1) % 8] }))
      const youIdx = Math.floor(Math.random() * (aiP.length + 1))
      aiP.splice(youIdx, 0, { name: "You", emoji: "😤", img: PLAYER_IMG, isYou: true, isAI: false, isHuman: false, alive: true, puffs: 0, totalAir: 0, strategy: "human", color: BP_PLAYER_COLORS[0] })
      players.push(...aiP)
    }
    const threshold = 80 + Math.floor(Math.random() * 41)
    setBpPlayers(players)
    setBpCurrentTurn(0)
    setBpAirLevel(0)
    setBpPopThreshold(threshold)
    setBpPuffAmount(0)
    setBpCharging(false)
    setBpComment("")
    setBpRound(0)
    setBpLoser(null)
    setBpHistory([])
    setBpShaking(false)
    setBpPopping(false)
    setBpBalloonColor("#4CAF50")
    setBpEliminatedList([])
    setBpWinner(null)
    setBpPhase("intro")
    playFx("crowd")
    bpActiveRef.current = { v: true }
    const localActive = bpActiveRef.current
    setTimeout(() => {
      if (!localActive.v) return
      setBpPhase("playing")
      setBpComment("Let the game begin!")
      playFx("whistle")
      if (players[0].isAI) setTimeout(() => bpDoAITurn(players, 0, 0, threshold), 1200)
    }, 3000)
  }

  // ── Auto-start on mount ──
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startBalloonPop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cleanup on unmount (Rule 8: gameSoundsMuted FIRST) ──
  useEffect(() => {
    return () => {
      audio.gameSoundsMuted.current = true
      bpActiveRef.current.v = false
      if (bpAnimRef.current) { cancelAnimationFrame(bpAnimRef.current); bpAnimRef.current = null }
      if (bpChargeInterval.current) { clearInterval(bpChargeInterval.current); bpChargeInterval.current = null }
      setTimeout(() => { audio.gameSoundsMuted.current = false }, 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── End game → exit ──
  const bpEndGame = () => {
    if (bpAnimRef.current) { cancelAnimationFrame(bpAnimRef.current); bpAnimRef.current = null }
    if (bpChargeInterval.current) { clearInterval(bpChargeInterval.current); bpChargeInterval.current = null }
    const won = !!(bpWinner && bpWinner.isYou)
    const baseR = won ? 80 : 10
    playFx(won ? "win" : "lose")
    recordGameResult(won, baseR, won ? 25 : 8, { bleConnected, zone: "arcade", gameActive })
    notify(won ? "LAST ONE STANDING! +" + baseR + " coins!" : "Eliminated! +" + baseR, won ? C.green : C.red)
    setBpPhase(null)
    exitGame()
  }

  const bpPlayAgain = () => {
    if (bpAnimRef.current) { cancelAnimationFrame(bpAnimRef.current); bpAnimRef.current = null }
    setBpPhase(null)
    startBalloonPop()
  }

  if (!bpPhase) return null

  const curP = bpPlayers[bpCurrentTurn]
  const isYourTurn = !!(curP && curP.isYou && bpPhase === "playing")
  const airPct = Math.min(100, (bpAirLevel / bpPopThreshold) * 100)
  const dangerZone = airPct > 85
  const isIntro = bpPhase === "intro"
  const aliveCount = bpPlayers.filter(p => p.alive).length

  // ── Result overlay ──
  const bpWonFinal = !!(bpWinner && bpWinner.isYou)
  const bpBaseCoins = bpWonFinal ? 80 : 10
  const bpResultOverlay = bpPhase === "result" ? (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,8,18,0.88)", backdropFilter: "blur(12px)", animation: "fadeIn 0.5s ease" }}>
      <div style={{ fontSize: 50, marginBottom: 8 }}>{bpWonFinal ? "👑" : "💀"}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: bpWonFinal ? C.green : C.red }}>{bpWonFinal ? "LAST ONE STANDING!" : bpWinner ? bpWinner.name + " WINS!" : "Game Over!"}</div>
      <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>+{bpBaseCoins} coins</div>
      <div style={{ marginTop: 14, textAlign: "left", width: "80%", maxWidth: 260 }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>ELIMINATION ORDER</div>
        {bpEliminatedList.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
            <span style={{ fontSize: 8, color: C.red }}>💀 #{i + 1}</span>
            <span style={{ fontSize: 9, color: C.text2 }}>{p.isYou ? "You" : p.name}</span>
          </div>
        ))}
        {bpWinner && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
            <span style={{ fontSize: 8, color: C.gold }}>👑 Winner</span>
            <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>{bpWinner.isYou ? "You" : bpWinner.name}</span>
          </div>
        )}
      </div>
      <div style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginTop: 12, width: "80%", maxWidth: 260 }}>
        <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800 }}>
          <span style={{ color: C.text }}>Earned</span>
          <span style={{ color: C.gold }}>+{bpBaseCoins} 🪙</span>
        </div>
        {!bleConnected && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.orange, marginTop: 4 }}>
            <span>Without device</span><span>70%</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <div data-btn="true" style={{ touchAction: "none", padding: "10px 24px", borderRadius: 12, cursor: "pointer", background: C.pink + "15", border: "1px solid " + C.pink + "30", fontSize: 13, fontWeight: 800, color: C.pink }} onClick={bpPlayAgain}>Play Again</div>
        <div data-btn="true" style={{ touchAction: "none", padding: "10px 24px", borderRadius: 12, cursor: "pointer", background: C.text3 + "10", border: "1px solid " + C.text3 + "20", fontSize: 13, fontWeight: 800, color: C.text3 }} onClick={bpEndGame}>Done</div>
      </div>
    </div>
  ) : null

  const bpPoppedOverlay = bpPhase === "popped" && bpLoser ? (
    <div style={{ position: "absolute", inset: 0, zIndex: 55, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(30,0,0,0.6)", animation: "fadeIn 0.3s ease", pointerEvents: "none" }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>💥🎈💥</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{bpLoser.isYou ? "YOU POPPED IT!" : bpLoser.name + " POPPED IT!"}</div>
      <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>{aliveCount} players remain</div>
    </div>
  ) : null

  const bpIntroOverlay = isIntro ? (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,4,18,0.92)", backdropFilter: "blur(16px)", animation: "fadeIn 0.3s ease" }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>🎈</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, background: "linear-gradient(135deg, " + C.pink + ", " + C.gold + ", " + C.cyan + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center" }}>BALLOON POP</div>
      <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700 }}>DON'T POP IT!</div>
      <div style={{ display: "flex", gap: 4, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {bpPlayers.map((p, i) => (
          <div key={i} style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", border: "2px solid " + (p.isYou ? C.cyan : C.pink) + "40", background: (p.isYou ? C.cyan : C.pink) + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {p.img ? <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} /> : p.emoji}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: C.text3 }}>{bpPlayers.length} players -- Getting ready...</div>
    </div>
  ) : null

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", touchAction: "none" }}>
      {/* Header */}
      <div style={{ position: "relative", zIndex: 50, flexShrink: 0, background: "rgba(6,16,30,0.98)", borderBottom: "1px solid " + (dangerZone ? "rgba(255,50,50,0.15)" : "rgba(255,77,141,0.1)") }}>
        <div style={{ padding: "6px 12px 2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>
            <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 7px", borderRadius: 100, background: "rgba(255,217,61,0.06)", border: "1px solid rgba(255,217,61,0.12)" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: bleConnected ? C.green : C.orange }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>{bleConnected ? "Puff" : "Connect"}</span>
          </div>
        </div>
        <div style={{ padding: "2px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <div onClick={() => { playFx("tap"); bpEndGame() }} data-btn="true" style={{ touchAction: "none", display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer", padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid " + C.border, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: dangerZone ? C.red : C.pink }}>🎈 BALLOON POP</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{aliveCount}/8 alive</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {bpRound + 1}</span>
          </div>
        </div>
        <div style={{ padding: "2px 12px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: curP ? (curP.isYou ? C.cyan : C.orange) : C.text3 }}>
            {bpPhase === "intro" ? "Preparing..." : bpPhase === "result" ? "Game Over" : bpPhase === "popped" ? "POP!" : curP ? (curP.isYou ? "YOUR TURN" : curP.name + "'s turn") : "..."}
          </span>
        </div>
      </div>

      {/* Canvas area */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <canvas ref={bpCanvasRef} width={Math.round(420 * BP_DPR)} height={Math.round(600 * BP_DPR)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
        {bpIntroOverlay}
        {bpPoppedOverlay}
        {bpResultOverlay}

        {/* Controls */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", width: "100%", zIndex: 40 }}>
          {bpCharging && (
            <div style={{ width: "90%", maxWidth: 300, padding: "6px 10px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,165,0,0.25)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.orange, marginBottom: 4 }}>PUFF POWER {Math.round(bpPuffAmount)}%</div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: bpPuffAmount + "%", height: "100%", background: "linear-gradient(90deg," + C.orange + "," + C.red + ")", transition: "width 0.05s linear" }} />
              </div>
            </div>
          )}
          {isYourTurn && !bpCharging && (
            <div style={{ display: "flex", gap: 8, width: "90%", maxWidth: 360 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); bpTapInflate() }} style={{ touchAction: "none", flex: 1, padding: "12px 0", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "linear-gradient(135deg,rgba(0,229,255,0.12),rgba(192,132,252,0.06))", border: "2px solid rgba(0,229,255,0.2)", userSelect: "none", WebkitUserSelect: "none" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>TAP</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+3-5%</div>
              </div>
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); bpStartCharge() }}
                onMouseUp={(e) => { e.stopPropagation(); bpStopCharge() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); bpStartCharge() }}
                onTouchEnd={(e) => { e.stopPropagation(); bpStopCharge() }}
                onTouchCancel={(e) => { e.stopPropagation(); bpStopCharge() }}
                style={{ touchAction: "none", flex: 1.3, padding: "12px 0", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "linear-gradient(135deg,rgba(255,165,0,0.12),rgba(255,70,70,0.06))", border: "2px solid rgba(255,165,0,0.25)", userSelect: "none", WebkitUserSelect: "none" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>PUFF</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +8-15%</div>
              </div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); bpBlinkerInflate() }} style={{ touchAction: "none", flex: 1, padding: "12px 0", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))", border: "2px solid rgba(255,50,50,0.3)", userSelect: "none", WebkitUserSelect: "none" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+20-30%!</div>
              </div>
            </div>
          )}
          {isYourTurn && bpCharging && (
            <div style={{ textAlign: "center", padding: "4px 12px", borderRadius: 10, background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.2)" }}>
              <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>INFLATING... release to puff!</span>
            </div>
          )}
          {bpPhase === "ai_turn" && curP && curP.isAI && (
            <div style={{ textAlign: "center", padding: "4px 12px", borderRadius: 10, background: "rgba(255,100,0,0.08)", border: "1px solid rgba(255,100,0,0.15)" }}>
              <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{curP.name} is inflating...</span>
              {bpCharging && (
                <div style={{ width: "80%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden", margin: "4px auto 0" }}>
                  <div style={{ width: bpPuffAmount + "%", height: "100%", borderRadius: 2, background: "linear-gradient(90deg," + C.orange + "," + C.red + ")", transition: "width 0.05s linear" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
