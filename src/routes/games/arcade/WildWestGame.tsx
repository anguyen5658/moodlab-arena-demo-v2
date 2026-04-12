import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { C } from '../../../constants'

// ── Static data (ported from monolith) ──
const WW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

const DUEL_OPPONENTS = [
  { name: 'Sheriff Puffington', emoji: '🤠', img: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sheriff&backgroundColor=transparent', rank: '#1', record: '420-69', taunt: "This town ain't big enough for the two of us", speed: 450 },
  { name: 'Quick Draw McGraw', emoji: '🔫', img: 'https://api.dicebear.com/9.x/adventurer/svg?seed=QuickDraw&backgroundColor=transparent', rank: '#3', record: '380-88', taunt: '0.2 seconds is all I need', speed: 380 },
  { name: 'Cactus Jack', emoji: '🌵', img: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=CactusJack&backgroundColor=transparent', rank: '#7', record: '301-120', taunt: 'Prickly and fast', speed: 420 },
  { name: 'Dusty Rhodes', emoji: '🏜️', img: 'https://api.dicebear.com/9.x/adventurer/svg?seed=DustyRhodes&backgroundColor=transparent', rank: '#12', record: '250-140', taunt: 'Faster than a tumbleweed in a tornado', speed: 500 },
  { name: 'Dynamite Dan', emoji: '🧨', img: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=DynamiteDan&backgroundColor=transparent', rank: '#5', record: '350-95', taunt: 'BOOM. Already drew.', speed: 400 },
  { name: 'Whiskey Wilma', emoji: '🥃', img: 'https://api.dicebear.com/9.x/adventurer/svg?seed=WhiskeyWilma&backgroundColor=transparent', rank: '#15', record: '220-160', taunt: "I shoot straighter when I'm drunk", speed: 550 },
]

const WW_TENSION = [
  'Eyes locked... who blinks first?', 'The desert holds its breath...', 'A pin drop would be DEAFENING...',
  'Fingers twitching... hearts pounding...', 'THIS is what legends are made of...', 'The crowd is SILENT...',
  'Sweat drips... time stands still...', "One wrong move and it's OVER...",
]
const WW_ROASTS_FOUL = ['FOUL! Trigger-happy much?!', 'Jumped the gun LITERALLY!', "Patience isn't your thing huh!"]
const WW_ROASTS_WIN = ['YEEHAW! Faster than a rattlesnake!', "Sheriff WHO? You're the law now!", 'SMOKING. LITERALLY.']
const WW_ROASTS_LOSE = ['Bro forgot which hand holds the gun!', 'A SNAIL could draw faster!', 'The tumbleweed outran you!']

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

type Phase = 'menu' | 'intro' | 'countdown' | 'staredown' | 'draw' | 'puffing' | 'result' | 'round_result' | 'final'

interface DuelResult {
  win?: boolean
  foul?: boolean
  you?: number
  ai?: number
  puffDur?: number
  bonus?: string | null
  bonusCoins?: number
  bonusLabel?: string
  timeout?: boolean
  effectiveReaction?: number
}

export const WildWestGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const { gameActive, setGameActive, setGameChatMsgs, setGameChatOpen } = game

  const addGameChat = useCallback((name: string, msg: string, color: string) => {
    setGameChatMsgs(prev => [...prev.slice(-10), { u: name, m: msg, c: color, t: Date.now() }])
  }, [setGameChatMsgs])

  const duelAutoChat = useCallback((msgs: string[], color?: string) => {
    const bots = ['DustyDave', 'Cactus_Carl', 'DesertFox', 'SheriffBot', 'TumbleweedTina']
    addGameChat(pick(bots), pick(msgs), color || C.gold)
  }, [addGameChat])

  // ── State ──
  const [duelPhase, setDuelPhase] = useState<Phase>('menu')
  const [duelRound, setDuelRound] = useState(0)
  const [duelScore, setDuelScore] = useState({ you: 0, ai: 0 })
  const [duelOpponent, setDuelOpponent] = useState<any>(null)
  const [duelStats, setDuelStats] = useState({ fastestDraw: 999, avgDraw: 0, drawTimes: [] as number[], fouls: 0, wins: 0, streak: 0 })
  const [duelRoundResults, setDuelRoundResults] = useState<any[]>([])
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null)
  const [duelIntroStage, setDuelIntroStage] = useState<string | null>(null)
  const [duelIntroCount, setDuelIntroCount] = useState(3)
  const [duelFiredShot, setDuelFiredShot] = useState(false)
  const [duelCountdown, setDuelCountdown] = useState<any>(null)
  const [duelPuffing, setDuelPuffing] = useState(false)
  const [duelPuffMeter, setDuelPuffMeter] = useState(0)
  const [, setDuelPuffBonus] = useState<string | null>(null)
  const [duelStaredownText, setDuelStaredownText] = useState('')
  const [duelMuzzleFlash, setDuelMuzzleFlash] = useState<string | null>(null)
  const [duelStaredownStage, setDuelStaredownStage] = useState(0)

  // ── Refs ──
  const duelCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const duelAnimRef = useRef<number | null>(null)
  const duelOpponentRef = useRef<any>(null)
  const duelTumbleX = useRef(-50)
  const duelDustArr = useRef<any[]>([])
  const duelComedy = useRef({ lastRoast: '', streak: 0 })
  const duelDrawTime = useRef<number | null>(null)
  const duelExpectedDrawTime = useRef<number | null>(null)
  const duelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duelSteadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duelPuffStart = useRef<number | null>(null)
  const duelPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const duelReactionTime = useRef<number | null>(null)
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  // Use refs for state accessed inside stable callbacks to avoid stale closures
  const phaseRef = useRef<Phase>('menu')
  const puffingRef = useRef(false)
  const firedShotRef = useRef(false)
  const roundRef = useRef(0)
  const scoreRef = useRef({ you: 0, ai: 0 })
  const roundResultsRef = useRef<any[]>([])
  useEffect(() => { phaseRef.current = duelPhase }, [duelPhase])
  useEffect(() => { puffingRef.current = duelPuffing }, [duelPuffing])
  useEffect(() => { firedShotRef.current = duelFiredShot }, [duelFiredShot])
  useEffect(() => { roundRef.current = duelRound }, [duelRound])
  useEffect(() => { scoreRef.current = duelScore }, [duelScore])
  useEffect(() => { roundResultsRef.current = duelRoundResults }, [duelRoundResults])

  // Helper: register a setTimeout we can clean up later
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id)
      fn()
    }, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const clearAllTimers = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
    if (duelTimerRef.current) { clearTimeout(duelTimerRef.current); duelTimerRef.current = null }
    if (duelSteadyTimerRef.current) { clearTimeout(duelSteadyTimerRef.current); duelSteadyTimerRef.current = null }
    if (duelPuffInterval.current) { clearInterval(duelPuffInterval.current); duelPuffInterval.current = null }
  }

  // ── Canvas draw ──
  const duelDraw = useCallback(() => {
    const canvas = duelCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / WW_DPR, H = canvas.height / WW_DPR
    ctx.save()
    ctx.scale(WW_DPR, WW_DPR)
    ctx.clearRect(0, 0, W, H)
    const now = Date.now()

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
    skyGrad.addColorStop(0, '#0a0515')
    skyGrad.addColorStop(0.12, '#150a2e')
    skyGrad.addColorStop(0.22, '#2d1b4e')
    skyGrad.addColorStop(0.32, '#6b2fa0')
    skyGrad.addColorStop(0.42, '#c04060')
    skyGrad.addColorStop(0.55, '#e8875c')
    skyGrad.addColorStop(0.65, '#f4a742')
    skyGrad.addColorStop(0.78, '#c87533')
    skyGrad.addColorStop(0.88, '#8b4513')
    skyGrad.addColorStop(1, '#3d1f0a')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H)

    // Stars
    for (let i = 0; i < 15; i++) {
      const sx = (7 + i * 28) % W, sy = 5 + Math.sin(i * 1.3) * 25
      const a = 0.15 + 0.25 * Math.sin(now * 0.001 + i * 1.1)
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill()
    }

    // Sun glow
    const sunGrad = ctx.createRadialGradient(W / 2, H * 0.15, 0, W / 2, H * 0.15, H * 0.25)
    sunGrad.addColorStop(0, 'rgba(255,200,50,0.7)')
    sunGrad.addColorStop(0.3, 'rgba(255,140,50,0.35)')
    sunGrad.addColorStop(0.6, 'rgba(255,100,30,0.12)')
    sunGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = sunGrad
    ctx.fillRect(0, 0, W, H * 0.5)

    // Moon
    ctx.save()
    ctx.globalAlpha = 0.6
    const moonGrad = ctx.createRadialGradient(W * 0.85, H * 0.06, 2, W * 0.85, H * 0.06, 12)
    moonGrad.addColorStop(0, '#f5eed8'); moonGrad.addColorStop(0.6, '#ddd0a8'); moonGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = moonGrad
    ctx.beginPath(); ctx.arc(W * 0.85, H * 0.06, 12, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // Mountains
    ctx.fillStyle = 'rgba(26,10,8,0.6)'
    ctx.beginPath(); ctx.moveTo(0, H * 0.68)
    for (let x = 0; x <= W; x += 20) { ctx.lineTo(x, H * 0.68 - Math.sin(x * 0.02) * 15 - Math.cos(x * 0.035) * 10) }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill()

    // Town
    ctx.fillStyle = '#1a0a05'
    const townY = H * 0.62
    ctx.beginPath(); ctx.moveTo(0, townY)
    const blds = [15, 30, 20, 45, 25, 35, 15, 50, 20, 40, 30, 25, 45, 20, 35, 50, 15, 30, 25, 40]
    let bx = 0
    blds.forEach((bh, i) => {
      const bw = W / blds.length
      ctx.lineTo(bx, townY); ctx.lineTo(bx, townY - bh * (0.5 + Math.sin(i) * 0.3))
      if (i % 3 === 0) { ctx.lineTo(bx + bw * 0.3, townY - bh * (0.5 + Math.sin(i) * 0.3) - 8); ctx.lineTo(bx + bw * 0.6, townY - bh * (0.5 + Math.sin(i) * 0.3)) }
      ctx.lineTo(bx + bw, townY - bh * (0.5 + Math.sin(i) * 0.3)); ctx.lineTo(bx + bw, townY)
      bx += bw
    })
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill()

    // Floor
    const floorY = H * 0.72
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H)
    floorGrad.addColorStop(0, '#8b4513'); floorGrad.addColorStop(0.3, '#6b3410')
    floorGrad.addColorStop(0.6, '#5a2a0e'); floorGrad.addColorStop(1, '#2d1205')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, floorY, W, H - floorY)

    // Floor texture
    ctx.save(); ctx.globalAlpha = 0.15
    for (let i = 0; i < 30; i++) {
      const dx = (i * 17 + now * 0.01) % W, dy = floorY + 10 + Math.random() * 50
      ctx.fillStyle = '#a0682a'
      ctx.beginPath(); ctx.arc(dx, dy, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()

    // Cacti
    ctx.fillStyle = 'rgba(26,10,5,0.3)'
    ;[W * 0.08, W * 0.92, W * 0.48].forEach((cx, i) => {
      const ch = 20 + i * 5
      const cy = floorY - 5
      ctx.fillRect(cx - 2, cy - ch, 4, ch)
      if (i < 2) { ctx.fillRect(cx - 8, cy - ch * 0.6, 6, 3); ctx.fillRect(cx + 2, cy - ch * 0.4, 8, 3) }
    })

    // Tumbleweed
    duelTumbleX.current += 0.6
    if (duelTumbleX.current > W + 50) duelTumbleX.current = -50
    const twX2 = duelTumbleX.current
    const twY2 = floorY - 8 + Math.sin(now * 0.003) * 4
    ctx.save(); ctx.globalAlpha = 0.4
    ctx.translate(twX2, twY2); ctx.rotate(now * 0.002)
    ctx.fillStyle = '#8b6914'
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#6b4a0a'; ctx.lineWidth = 1
    for (let a2 = 0; a2 < 6; a2++) { const ang = a2 * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 7, Math.sin(ang) * 7); ctx.stroke() }
    ctx.restore()

    // Dust
    duelDustArr.current.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.y < floorY - 30) { p.y = floorY + Math.random() * 50; p.x = Math.random() * W }
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10
      ctx.fillStyle = `rgba(210,170,120,${p.a})`
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill()
    })

    // Vulture
    const vAngle = now * 0.0005
    const vx2 = W * 0.3 + Math.cos(vAngle) * 40
    const vy2 = H * 0.15 + Math.sin(vAngle * 2) * 10
    ctx.save(); ctx.globalAlpha = 0.3; ctx.font = '12px serif'; ctx.fillText('\uD83E\uDD85', vx2, vy2); ctx.restore()

    // Campfire glow
    ctx.save(); ctx.globalAlpha = 0.12 + Math.sin(now * 0.004) * 0.04
    const cfGrad = ctx.createRadialGradient(W * 0.18, floorY - 5, 0, W * 0.18, floorY - 5, 25)
    cfGrad.addColorStop(0, 'rgba(255,140,20,0.4)'); cfGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = cfGrad; ctx.fillRect(W * 0.05, floorY - 30, W * 0.3, 50)
    ctx.restore()

    // Cowboys
    const cowboyY = floorY - 50
    const playerX = W * 0.22
    const aiX = W * 0.78

    ctx.save()
    ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = duelMuzzleFlash === 'left' ? 20 : 8
    ctx.fillStyle = '#111'
    ctx.fillRect(playerX - 8, cowboyY, 16, 35)
    ctx.beginPath(); ctx.arc(playerX, cowboyY - 5, 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillRect(playerX - 14, cowboyY - 18, 28, 5)
    ctx.fillRect(playerX - 7, cowboyY - 25, 14, 8)
    ctx.fillRect(playerX + 8, cowboyY + 10, 18, 4)
    ctx.restore()

    ctx.save()
    ctx.shadowColor = '#FF8800'; ctx.shadowBlur = duelMuzzleFlash === 'right' ? 20 : 8
    ctx.fillStyle = '#111'
    ctx.fillRect(aiX - 8, cowboyY, 16, 35)
    ctx.beginPath(); ctx.arc(aiX, cowboyY - 5, 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillRect(aiX - 14, cowboyY - 18, 28, 5)
    ctx.fillRect(aiX - 7, cowboyY - 25, 14, 8)
    ctx.fillRect(aiX - 26, cowboyY + 10, 18, 4)
    ctx.restore()

    // Eye glow
    if (duelStaredownStage >= 1) {
      ctx.fillStyle = '#00E5FF'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(playerX + 4, cowboyY - 6, 2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#FF8800'; ctx.shadowColor = '#FF8800'
      ctx.beginPath(); ctx.arc(aiX - 4, cowboyY - 6, 2, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
    }

    // Muzzle flash
    if (duelMuzzleFlash) {
      const flashX = duelMuzzleFlash === 'left' ? playerX + 26 : aiX - 26
      const flashGrad = ctx.createRadialGradient(flashX, cowboyY + 12, 0, flashX, cowboyY + 12, 20)
      flashGrad.addColorStop(0, 'rgba(255,200,50,0.9)')
      flashGrad.addColorStop(0.4, 'rgba(255,100,0,0.5)')
      flashGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = flashGrad
      ctx.beginPath(); ctx.arc(flashX, cowboyY + 12, 20, 0, Math.PI * 2); ctx.fill()
      ctx.save(); ctx.globalAlpha = 0.3
      for (let i = 0; i < 5; i++) {
        const smX = flashX + (duelMuzzleFlash === 'left' ? 1 : -1) * (5 + i * 6)
        ctx.fillStyle = `rgba(180,180,180,${0.3 - i * 0.05})`
        ctx.beginPath(); ctx.arc(smX, cowboyY + 8 - i * 3, 3 + i * 2, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }

    // Vignette
    const vigA = duelStaredownStage >= 2 ? 0.7 : duelStaredownStage >= 1 ? 0.5 : 0.35
    const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7)
    vigGrad.addColorStop(0, 'transparent')
    vigGrad.addColorStop(1, `rgba(0,0,0,${vigA})`)
    ctx.fillStyle = vigGrad
    ctx.fillRect(0, 0, W, H)

    if (duelPhase === 'draw' || duelPhase === 'puffing') {
      ctx.fillStyle = `rgba(180,0,0,${0.1 + 0.05 * Math.sin(now * 0.01)})`
      ctx.fillRect(0, 0, W, H)
    }
    if (duelPhase === 'staredown') {
      ctx.fillStyle = `rgba(180,20,0,${0.02 + duelStaredownStage * 0.03})`
      ctx.fillRect(0, 0, W, H)
    }

    ctx.restore()
  }, [duelPhase, duelStaredownStage, duelMuzzleFlash])

  // ── Canvas animation loop (Rule 4) ──
  useEffect(() => {
    if (!duelCanvasRef.current) return
    if (duelAnimRef.current) cancelAnimationFrame(duelAnimRef.current)
    const loop = () => {
      duelDraw()
      duelAnimRef.current = requestAnimationFrame(loop)
    }
    duelAnimRef.current = requestAnimationFrame(loop)
    return () => {
      if (duelAnimRef.current) { cancelAnimationFrame(duelAnimRef.current); duelAnimRef.current = null }
    }
  }, [duelDraw])

  // ── Game logic ──
  const getAiDrawSpeed = (round: number) => {
    const opp = duelOpponentRef.current || DUEL_OPPONENTS[0]
    const base = opp.speed
    const speedup = round * (15 + Math.random() * 10)
    const jitter = (Math.random() - 0.5) * 80
    return Math.max(280, Math.floor(base - speedup + jitter))
  }

  const handleDuelRoundEnd = (win: boolean, wasFoul: boolean, resultOverride: DuelResult) => {
    const rr = resultOverride || {}
    const prevResults = roundResultsRef.current
    const newResults = [...prevResults, { win, foul: wasFoul, you: rr.you || 0, ai: rr.ai || 0, bonus: rr.bonus || null, bonusCoins: rr.bonusCoins || 0, puffDur: rr.puffDur || 0 }]
    setDuelRoundResults(newResults)
    roundResultsRef.current = newResults

    const newScore = { ...scoreRef.current }
    if (win) newScore.you++; else newScore.ai++
    setDuelScore(newScore)
    scoreRef.current = newScore

    schedule(() => {
      if (newScore.you >= 3 || newScore.ai >= 3) {
        setDuelPhase('final')
        const matchWin = newScore.you >= 3
        if (matchWin) {
          audio.playFx('win'); audio.playFx('crowd')
          player.spawnConfetti(60, [C.gold, C.orange, '#fff', C.green])
          const duelBase = 80
          player.recordGameResult(true, duelBase, 20, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive })
          setDuelStats(s => ({ ...s, wins: s.wins + 1, streak: s.streak + 1 }))
          player.notify('DUEL WON! +' + duelBase + ' coins!', C.gold)
          addGameChat('Announcer', 'MATCH WON! STEVE IS THE FASTEST GUN!', C.gold)
        } else {
          audio.playFx('lose')
          player.recordGameResult(false, 12, 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive })
          setDuelStats(s => ({ ...s, streak: 0 }))
          player.notify('Duel lost!', C.red)
          addGameChat('Announcer', (duelOpponentRef.current?.name || 'AI') + ' WINS THE DUEL!', C.red)
        }
      } else {
        setDuelPhase('round_result')
        schedule(() => {
          const nextRound = roundRef.current + 1
          setDuelRound(nextRound)
          roundRef.current = nextRound
          startDuelRound(nextRound)
        }, 2500)
      }
    }, 1800)
  }

  const duelShoot = () => {
    if (firedShotRef.current) return
    const phase = phaseRef.current
    // FOUL: puffed before DRAW phase
    if ((phase === 'staredown' || phase === 'countdown') && !(duelExpectedDrawTime.current && (duelExpectedDrawTime.current - Date.now()) < 200)) {
      setDuelFiredShot(true); firedShotRef.current = true
      if (duelTimerRef.current) clearTimeout(duelTimerRef.current)
      if (duelSteadyTimerRef.current) clearTimeout(duelSteadyTimerRef.current)
      duelDrawTime.current = null
      const foulResult: DuelResult = { foul: true, bonusCoins: 0 }
      setDuelResult(foulResult)
      setDuelPhase('result')
      audio.playFx('error')
      setDuelStats(s => ({ ...s, fouls: s.fouls + 1 }))
      player.notify('FOUL! Drew too early!', C.red)
      duelAutoChat(WW_ROASTS_FOUL, C.red)
      handleDuelRoundEnd(false, true, foulResult)
      return
    }

    // Valid shot during DRAW phase: START puff hold
    if (phase === 'draw' && duelDrawTime.current) {
      const reactionMs = Date.now() - duelDrawTime.current
      duelReactionTime.current = reactionMs
      if (duelTimerRef.current) clearTimeout(duelTimerRef.current)
      setDuelPhase('puffing'); phaseRef.current = 'puffing'
      setDuelPuffing(true); puffingRef.current = true
      setDuelPuffMeter(0)
      duelPuffStart.current = Date.now()
      audio.playFx('shot_power')
      duelPuffInterval.current = setInterval(() => {
        if (!duelPuffStart.current) return
        const elapsed = (Date.now() - duelPuffStart.current) / 1000
        const meter = Math.min(100, elapsed / 4.5 * 100)
        setDuelPuffMeter(meter)
        if (elapsed >= 5.0) {
          duelReleasePuff()
        }
      }, 50)
    }
  }

  const duelReleasePuff = () => {
    if (!puffingRef.current) return
    setDuelPuffing(false); puffingRef.current = false
    setDuelFiredShot(true); firedShotRef.current = true
    if (duelPuffInterval.current) { clearInterval(duelPuffInterval.current); duelPuffInterval.current = null }
    duelDrawTime.current = null

    const reactionMs = duelReactionTime.current || 999
    const puffDuration = duelPuffStart.current ? (Date.now() - duelPuffStart.current) / 1000 : 0
    const aiTime = getAiDrawSpeed(roundRef.current)

    let effectiveReaction = reactionMs
    if (puffDuration >= 4.5) effectiveReaction = Math.round(reactionMs * 0.80)
    else if (puffDuration >= 2.0) effectiveReaction = Math.round(reactionMs * 0.90)
    else if (puffDuration >= 0.8) effectiveReaction = Math.round(reactionMs * 0.95)

    const win = effectiveReaction < aiTime
    let bonus = 'basic', bonusCoins = 0, bonusLabel = 'Tap Shot'
    if (puffDuration >= 4.5) { bonus = 'legendary'; bonusCoins = 50; bonusLabel = 'LEGENDARY DRAW +20%' }
    else if (puffDuration >= 2.0) { bonus = 'power'; bonusCoins = 25; bonusLabel = 'Real Puff +15%' }
    else if (puffDuration >= 0.8) { bonus = 'quick'; bonusCoins = 10; bonusLabel = 'Dry Puff +5%' }
    setDuelPuffBonus(bonus)

    const result: DuelResult = { win, you: reactionMs, ai: aiTime, effectiveReaction, puffDur: puffDuration, bonus, bonusCoins, bonusLabel }
    setDuelResult(result)
    setDuelPhase('result'); phaseRef.current = 'result'
    audio.playFx('gunshot')
    setDuelMuzzleFlash(win ? 'left' : 'right')
    schedule(() => setDuelMuzzleFlash(null), 600)

    setDuelStats(s => {
      const times = [...s.drawTimes, reactionMs]
      return { ...s, fastestDraw: Math.min(s.fastestDraw, reactionMs), avgDraw: Math.round(times.reduce((a, b) => a + b, 0) / times.length), drawTimes: times }
    })

    if (win) {
      audio.playFx('win'); audio.playFx('crowd')
      if (bonusCoins > 0) player.setCoins((c: number) => c + bonusCoins)
      duelComedy.current.streak++
      player.notify('Round won! ' + reactionMs + 'ms' + (bonusCoins > 0 ? ' +' + bonusCoins : ''), C.green)
      duelAutoChat(WW_ROASTS_WIN, C.green)
      if (duelComedy.current.streak >= 2) addGameChat('Announcer', duelComedy.current.streak + ' ROUND WIN STREAK!', C.gold)
    } else {
      audio.playFx('lose')
      duelComedy.current.streak = 0
      player.notify('AI drew faster! ' + aiTime + 'ms', C.red)
      duelAutoChat(WW_ROASTS_LOSE, C.red)
    }
    handleDuelRoundEnd(win, false, result)
  }

  const startDuelRound = (roundNum: number) => {
    setDuelFiredShot(false); firedShotRef.current = false
    setDuelResult(null)
    setDuelPuffing(false); puffingRef.current = false
    setDuelPuffMeter(0)
    setDuelPuffBonus(null)
    setDuelMuzzleFlash(null)
    setDuelStaredownStage(0)
    setDuelStaredownText('')
    duelDrawTime.current = null
    duelReactionTime.current = null
    duelTumbleX.current = -50

    setDuelPhase('countdown'); phaseRef.current = 'countdown'
    setDuelCountdown(3)
    audio.playFx('click')
    if (roundNum > 0) duelAutoChat(['Round ' + (roundNum + 1) + '! HERE WE GO!', 'The tension is UNREAL!', 'Who draws first?!'], C.gold)

    schedule(() => { setDuelCountdown(2); audio.playFx('click') }, 900)
    schedule(() => { setDuelCountdown(1); audio.playFx('click') }, 1800)
    schedule(() => { setDuelCountdown('DRAW!'); audio.playFx('whistle') }, 2700)

    schedule(() => {
      setDuelCountdown(null)
      setDuelPhase('staredown'); phaseRef.current = 'staredown'
      setDuelStaredownStage(0)
      setDuelStaredownText(pick(WW_TENSION))

      const tensionBase = 1500 + Math.random() * 3000 + roundNum * 400
      duelExpectedDrawTime.current = Date.now() + tensionBase
      const stage1 = tensionBase * 0.3
      const stage2 = tensionBase * 0.6
      const stage3 = tensionBase * 0.85

      duelTimerRef.current = setTimeout(() => {
        setDuelStaredownStage(1)
        setDuelStaredownText(pick(WW_TENSION))
      }, stage1)

      duelSteadyTimerRef.current = setTimeout(() => {
        setDuelStaredownStage(2)
        setDuelStaredownText(pick(['WHO WILL DRAW FIRST?', 'The air CRACKLES...', 'DRAW OR DIE...']))
        duelAutoChat(['The tension is INSANE!', 'Nobody moves...', "I can't breathe!"], C.orange)
      }, stage2)

      setTimeout(() => {
        setDuelStaredownStage(3)
        setDuelStaredownText('...')
      }, stage3)

      // DRAW!
      duelTimerRef.current = setTimeout(() => {
        setDuelPhase('draw'); phaseRef.current = 'draw'
        duelDrawTime.current = Date.now()
        audio.playFx('whistle')
        setDuelStaredownText('')
        addGameChat('Announcer', 'DRAW! REACT NOW!', C.red)

        duelTimerRef.current = setTimeout(() => {
          if (duelDrawTime.current) {
            const aiSpeed = getAiDrawSpeed(roundNum)
            const timeoutResult: DuelResult = { win: false, you: 5000, ai: aiSpeed, timeout: true, puffDur: 0, bonus: null, bonusCoins: 0 }
            setDuelResult(timeoutResult)
            setDuelPhase('result'); phaseRef.current = 'result'
            duelDrawTime.current = null
            setDuelFiredShot(true); firedShotRef.current = true
            setDuelMuzzleFlash('right')
            setTimeout(() => setDuelMuzzleFlash(null), 500)
            audio.playFx('lose')
            player.notify('Too slow, partner!', C.red)
            handleDuelRoundEnd(false, false, timeoutResult)
          }
        }, 5000)
      }, tensionBase)
    }, 3200)
  }

  const startDuel = () => {
    const opp = DUEL_OPPONENTS[Math.floor(Math.random() * DUEL_OPPONENTS.length)]
    duelOpponentRef.current = opp
    setDuelOpponent(opp)
    setDuelRound(0); roundRef.current = 0
    setDuelScore({ you: 0, ai: 0 }); scoreRef.current = { you: 0, ai: 0 }
    setDuelRoundResults([]); roundResultsRef.current = []
    setDuelResult(null)
    setDuelFiredShot(false); firedShotRef.current = false
    setDuelPuffing(false); puffingRef.current = false
    setDuelPuffMeter(0)
    setDuelPuffBonus(null)
    setDuelMuzzleFlash(null)
    setDuelStaredownStage(0)
    setDuelStaredownText('')
    duelTumbleX.current = -50
    duelDustArr.current = Array.from({ length: 12 }, () => ({
      x: Math.random() * 430, y: 350 + Math.random() * 200,
      s: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.4,
      vy: -0.1 - Math.random() * 0.3, a: 0.2 + Math.random() * 0.4,
    }))
    duelComedy.current = { lastRoast: '', streak: 0 }

    setDuelPhase('intro'); phaseRef.current = 'intro'
    setDuelIntroStage('enter')
    setDuelIntroCount(3)
    audio.playFx('crowd')
    setGameChatOpen(true)
    addGameChat('Announcer', 'HIGH NOON SHOWDOWN! ' + opp.name + ' vs Steve!', C.gold)
    schedule(() => duelAutoChat(['This is gonna be INTENSE!', 'Place your bets!', "My money's on Steve!", 'I got ' + opp.name + ' easy!'], C.cyan), 800)

    schedule(() => setDuelIntroStage('stats'), 1200)
    schedule(() => { setDuelIntroStage('countdown'); setDuelIntroCount(3); audio.playFx('whistle') }, 2400)
    schedule(() => setDuelIntroCount(2), 3100)
    schedule(() => setDuelIntroCount(1), 3800)
    schedule(() => { setDuelIntroStage('go'); audio.playFx('crowd') }, 4500)
    schedule(() => { setDuelIntroStage(null); startDuelRound(0) }, 5200)
  }

  const resetDuel = () => {
    clearAllTimers()
    if (duelAnimRef.current) { cancelAnimationFrame(duelAnimRef.current); duelAnimRef.current = null }
    duelDrawTime.current = null
    duelPuffStart.current = null
    duelReactionTime.current = null
    setDuelPhase('menu'); phaseRef.current = 'menu'
    setDuelRound(0); roundRef.current = 0
    setDuelScore({ you: 0, ai: 0 }); scoreRef.current = { you: 0, ai: 0 }
    setDuelResult(null)
    setDuelRoundResults([]); roundResultsRef.current = []
    setDuelFiredShot(false); firedShotRef.current = false
    setDuelIntroStage(null)
    setDuelPuffing(false); puffingRef.current = false
    setDuelPuffMeter(0)
    setDuelPuffBonus(null)
    setDuelCountdown(null)
    setDuelMuzzleFlash(null)
    setDuelStaredownStage(0)
    setDuelStaredownText('')
  }

  // ── Auto-start on mount ──
  useEffect(() => {
    startDuel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── BLE registration + cleanup (Rule 3 & 8) ──
  useEffect(() => {
    if (gameActive?.id !== 'wildwest') return
    ble.registerPuffHandlers('wildwest', () => duelShoot(), () => duelReleasePuff())
    // Multiplayer 1v1: slot 0 = P1, slot 1 = P2 (replaces AI)
    if (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) {
      const duelP2 = { reactionTime: 0, puffStart: 0, puffDuration: 0, fired: false }
      ;(window as any)._duelP2 = duelP2
      ble.registerSlotPuffHandlers({
        0: { down: () => duelShoot(), up: () => duelReleasePuff() },
        1: {
          down: () => {
            // P2 reaction — same logic as P1 but tracks separately
            if (duelP2.fired) return
            const p = phaseRef.current
            if (p === 'staredown' || p === 'countdown') {
              // P2 foul
              duelP2.fired = true
              return
            }
            if (p === 'draw' && duelDrawTime.current) {
              duelP2.reactionTime = Date.now() - duelDrawTime.current
              duelP2.puffStart = Date.now()
              duelP2.fired = true
            }
          },
          up: () => {
            if (duelP2.puffStart > 0) {
              duelP2.puffDuration = (Date.now() - duelP2.puffStart) / 1000
            }
          },
        },
      })
    }
    return () => {
      audio.gameSoundsMuted.current = true
      clearAllTimers()
      if (duelAnimRef.current) { cancelAnimationFrame(duelAnimRef.current); duelAnimRef.current = null }
      ble.registerPuffHandlers(null, null, null)
      ;(window as any)._duelP2 = null
      setTimeout(() => { audio.gameSoundsMuted.current = false }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameActive?.id])

  // ── Exit helper ──
  const exitToHub = () => {
    audio.playFx('click')
    resetDuel()
    setGameActive(null)
  }

  // ── Render ──
  if (!gameActive || gameActive.id !== 'wildwest') return null

  const wwOpp = duelOpponentRef.current || duelOpponent || DUEL_OPPONENTS[0]
  const wwPhase = duelPhase
  const isTensionPhase = wwPhase === 'staredown'
  const isCountdown = wwPhase === 'countdown'
  const puffMeterColor = duelPuffMeter < 20 ? C.text3 : duelPuffMeter < 45 ? C.cyan : duelPuffMeter < 70 ? C.gold : duelPuffMeter < 90 ? C.orange : C.red
  const wwPhaseLabel =
    wwPhase === 'staredown' ? 'STAREDOWN'
      : wwPhase === 'draw' ? 'DRAW!'
        : wwPhase === 'puffing' ? 'HOLD...'
          : (wwPhase === 'result' || wwPhase === 'round_result') ? 'RESULT'
            : wwPhase === 'final' ? 'MATCH OVER'
              : wwPhase === 'countdown' ? 'GET READY'
                : wwPhase === 'intro' ? 'INTRO'
                  : 'DUEL'

  const handleDown = (e: React.SyntheticEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-back],[data-btn]')) return
    if (['staredown', 'countdown', 'draw'].includes(wwPhase)) duelShoot()
  }
  const handleUp = (e: React.SyntheticEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-back],[data-btn]')) return
    if (wwPhase === 'puffing') duelReleasePuff()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleDown(e) }}
      onTouchEnd={(e) => { e.stopPropagation(); handleUp(e) }}
      onTouchCancel={(e) => { e.stopPropagation(); handleUp(e) }}
    >
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(255,165,0,0.08)' }}>
        {/* Row 1: Brand + BLE + Coins */}
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
        {/* Row 2: Back + Round indicators + Score */}
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            onClick={exitToHub}
            data-back="true"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0 }}
          >
            <span style={{ fontSize: 10, color: C.text2 }}>{'\u2190'}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2, 3, 4].map(i => {
                const rr = duelRoundResults[i]
                const isCurr = i === duelRound && !rr
                return (
                  <div
                    key={i}
                    style={{
                      width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900,
                      background: rr ? (rr.win ? `${C.green}30` : `${C.red}30`) : isCurr ? `${C.gold}20` : 'rgba(60,40,20,0.4)',
                      border: `2px solid ${rr ? (rr.win ? C.green + '70' : C.red + '70') : isCurr ? C.gold + '70' : 'rgba(139,69,19,0.3)'}`,
                      color: rr ? (rr.win ? C.green : C.red) : isCurr ? C.gold : 'rgba(139,69,19,0.5)',
                    }}
                  >
                    {rr ? (rr.win ? 'W' : rr.foul ? 'F' : 'L') : isCurr ? (duelRound + 1) : ''}
                  </div>
                )
              })}
              <span style={{ fontSize: 8, color: 'rgba(210,170,120,0.6)', marginLeft: 3, fontWeight: 700 }}>R{duelRound + 1}/5</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 10, background: 'rgba(20,10,5,0.5)', border: '1px solid rgba(139,69,19,0.3)' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.cyan, textShadow: `0 0 6px ${C.cyan}40` }}>{duelScore.you}</span>
            <span style={{ fontSize: 10, color: 'rgba(139,69,19,0.6)', fontWeight: 900 }}>:</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.orange, textShadow: `0 0 6px ${C.orange}40` }}>{duelScore.ai}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', textAlign: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
            color: wwPhase === 'draw' ? C.red : wwPhase === 'staredown' ? C.gold : wwPhase === 'result' || wwPhase === 'round_result' ? (duelResult?.win ? C.green : C.red) : C.text3,
          }}>{wwPhaseLabel}</span>
        </div>
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={duelCanvasRef}
          width={Math.round(430 * WW_DPR)}
          height={Math.round(600 * WW_DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />

        {/* Intro */}
        {duelIntroStage && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.94)', backdropFilter: 'blur(16px)' }}>
            <div style={{ marginBottom: 16, padding: '4px 18px', borderRadius: 20, background: `${C.gold}12`, border: `1px solid ${C.gold}30` }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 4, textTransform: 'uppercase' }}>HIGH NOON SHOWDOWN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, border: `2px solid ${C.cyan}60`, background: `${C.cyan}10`, margin: '0 auto 6px', boxShadow: `0 0 20px ${C.cyan}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>😎</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, textShadow: `0 0 10px ${C.cyan}40`, letterSpacing: 1 }}>STEVE</div>
                <div style={{ fontSize: 8, color: C.text3 }}>Lv.24 Gunslinger</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                {duelIntroStage === 'countdown' ? (
                  <div style={{ fontSize: 64, fontWeight: 900, color: C.gold, textShadow: `0 0 50px ${C.gold}80`, lineHeight: 1 }}>{duelIntroCount}</div>
                ) : duelIntroStage === 'go' ? (
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.green, textShadow: `0 0 30px ${C.green}60`, lineHeight: 1 }}>DUEL!</div>
                ) : (
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, textShadow: `0 0 25px ${C.gold}60` }}>VS</div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, border: `2px solid ${C.orange}60`, background: `${C.orange}10`, margin: '0 auto 6px', boxShadow: `0 0 20px ${C.orange}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{wwOpp.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, textShadow: `0 0 10px ${C.orange}40`, letterSpacing: 1 }}>{wwOpp.name.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: C.text3 }}>{wwOpp.rank} {wwOpp.record}</div>
              </div>
            </div>
            {(duelIntroStage === 'stats' || duelIntroStage === 'countdown' || duelIntroStage === 'go') && (
              <div style={{ width: '82%', maxWidth: 280, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.gold, marginBottom: 8, textAlign: 'center', letterSpacing: 3 }}>GUNSLINGER STATS</div>
                {[
                  [duelStats.fastestDraw < 999 ? duelStats.fastestDraw + 'ms' : '---', 'Fastest Draw', (wwOpp.speed - 50 + Math.floor(Math.random() * 40)) + 'ms'],
                  [String(duelStats.wins), 'Duels Won', wwOpp.record.split('-')[0]],
                  [String(duelStats.fouls), 'Fouls', String(Math.floor(Math.random() * 15))],
                  [String(duelStats.streak), 'Win Streak', String(Math.floor(Math.random() * 8))],
                ].map(([l, mid, r], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, padding: '2px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, minWidth: 35 }}>{l}</span>
                    <span style={{ fontSize: 8, color: C.text3, flex: 1, textAlign: 'center' }}>{mid}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.orange, minWidth: 35, textAlign: 'right' }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {duelIntroStage === 'go' && (
              <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, textShadow: `0 0 30px ${C.gold}60`, textAlign: 'center', letterSpacing: 3 }}>HIGH NOON!</div>
            )}
            <div style={{ marginTop: 12, fontSize: 8, color: C.text3, letterSpacing: 1 }}>{120 + Math.floor(Math.random() * 80)} watching -- Best of 5</div>
          </div>
        )}

        {/* Staredown */}
        {isTensionPhase && !duelIntroStage && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, opacity: 0.4 + duelStaredownStage * 0.15, letterSpacing: 3, textTransform: 'uppercase' }}>
              {duelStaredownStage < 1 ? '. . .' : duelStaredownStage < 2 ? '...' : ''}
            </div>
            {duelStaredownText && (
              <div style={{ fontSize: 9, color: C.gold, opacity: 0.7, marginTop: 6, letterSpacing: 1, fontStyle: 'italic' }}>{duelStaredownText}</div>
            )}
            <div style={{ fontSize: 8, color: C.red + '70', marginTop: 8, letterSpacing: 1 }}>TAP BEFORE DRAW = FOUL</div>
          </div>
        )}

        {/* Draw */}
        {wwPhase === 'draw' && !duelIntroStage && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.red, textShadow: `0 0 50px ${C.red}, 0 0 100px ${C.red}60`, letterSpacing: 5 }}>DRAW!</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginTop: 8, opacity: 0.95, letterSpacing: 2 }}>HOLD TO SHOOT!</div>
          </div>
        )}

        {/* Puffing */}
        {wwPhase === 'puffing' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: puffMeterColor, textShadow: `0 0 15px ${puffMeterColor}60`, letterSpacing: 2, marginBottom: 10 }}>
              {duelPuffMeter < 20 ? 'DRAWING...' : duelPuffMeter < 45 ? 'QUICK DRAW' : duelPuffMeter < 70 ? 'POWER SHOT' : duelPuffMeter < 90 ? 'MEGA PUFF' : 'LEGENDARY!'}
            </div>
            <div style={{ width: '70%', maxWidth: 200, height: 14, borderRadius: 7, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <div style={{ width: `${duelPuffMeter}%`, height: '100%', background: puffMeterColor, boxShadow: `0 0 12px ${puffMeterColor}80`, transition: 'width 0.05s linear' }} />
            </div>
            <div style={{ fontSize: 9, color: '#fff', marginTop: 6, opacity: 0.7 }}>Release to fire!</div>
          </div>
        )}

        {/* Countdown */}
        {isCountdown && duelCountdown !== null && !duelIntroStage && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, pointerEvents: 'none' }}>
            {typeof duelCountdown === 'number' ? (
              <div style={{ fontSize: 100, fontWeight: 900, color: C.gold, textShadow: `0 0 60px ${C.gold}80, 0 0 120px ${C.gold}30`, lineHeight: 1 }}>{duelCountdown}</div>
            ) : (
              <div style={{ fontSize: 42, fontWeight: 900, color: C.red, textShadow: `0 0 50px ${C.red}80, 0 0 100px ${C.red}30`, lineHeight: 1, letterSpacing: 4 }}>{duelCountdown}</div>
            )}
          </div>
        )}

        {/* Result */}
        {(wwPhase === 'result' || wwPhase === 'round_result') && duelResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center' }}>
              {duelResult.foul ? (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.red, textShadow: `0 0 30px ${C.red}60`, letterSpacing: 3 }}>FOUL!</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>Drew too early! Round lost.</div>
                </div>
              ) : duelResult.win ? (
                <div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: C.green, textShadow: `0 0 40px ${C.green}60`, lineHeight: 1 }}>{duelResult.you}ms</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.gold, marginTop: 6, textShadow: `0 0 15px ${C.gold}40`, letterSpacing: 2 }}>FASTER!</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>vs AI {duelResult.ai}ms</div>
                  {duelResult.bonusCoins! > 0 && (
                    <div style={{ marginTop: 6, padding: '3px 10px', borderRadius: 8, background: `${C.gold}15`, border: `1px solid ${C.gold}30`, display: 'inline-block' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{duelResult.bonusLabel} +{duelResult.bonusCoins}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: C.red, textShadow: `0 0 30px ${C.red}60`, lineHeight: 1 }}>{duelResult.you}ms</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.red, marginTop: 6, letterSpacing: 2 }}>OUTDRAWN!</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>AI drew at {duelResult.ai}ms</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final */}
        {wwPhase === 'final' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.85)', backdropFilter: 'blur(8px)' }}>
            <div style={{ textAlign: 'center', padding: '20px', maxWidth: 320, width: '90%' }}>
              <div style={{ fontSize: 40, marginBottom: 4 }}>{duelScore.you >= 3 ? '\uD83C\uDFC6' : '\uD83D\uDC80'}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: duelScore.you >= 3 ? C.gold : C.red, textShadow: `0 0 40px ${duelScore.you >= 3 ? C.gold : C.red}50`, marginBottom: 4, letterSpacing: 3 }}>
                {duelScore.you >= 3 ? 'FASTEST GUN!' : 'OUTDRAWN!'}
              </div>
              <div style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>Final Score: {duelScore.you} - {duelScore.ai}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                {duelRoundResults.map((rr, i) => (
                  <div key={i} style={{ padding: '5px 8px', borderRadius: 8, background: rr.win ? `${C.green}12` : `${C.red}12`, border: `1px solid ${rr.win ? C.green : C.red}25`, textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: rr.win ? C.green : C.red }}>{rr.foul ? 'FOUL' : rr.win ? 'WIN' : 'LOSS'}</div>
                    {!rr.foul && rr.you > 0 && <div style={{ fontSize: 7, color: C.text3, marginTop: 1 }}>{rr.you}ms</div>}
                    {rr.bonus && rr.bonusCoins > 0 && <div style={{ fontSize: 6, color: C.gold, marginTop: 1 }}>+{rr.bonusCoins}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12, padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,69,19,0.15)' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: C.cyan }}>{duelStats.fastestDraw < 999 ? duelStats.fastestDraw + 'ms' : '---'}</div><div style={{ fontSize: 7, color: 'rgba(210,170,120,0.5)' }}>Fastest</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: C.gold }}>{duelStats.avgDraw || '---'}{duelStats.avgDraw ? 'ms' : ''}</div><div style={{ fontSize: 7, color: 'rgba(210,170,120,0.5)' }}>Average</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: C.red }}>{duelStats.fouls}</div><div style={{ fontSize: 7, color: 'rgba(210,170,120,0.5)' }}>Fouls</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); startDuel() }}
                  data-btn="true"
                  style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`, border: `1px solid ${C.gold}40`, fontSize: 14, fontWeight: 800, color: C.gold, letterSpacing: 1 }}
                >REMATCH</div>
                <div
                  onClick={(e) => { e.stopPropagation(); exitToHub() }}
                  data-btn="true"
                  style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,69,19,0.3)', fontSize: 14, fontWeight: 700, color: C.text2 }}
                >Exit</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
