import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C, KICK_ZONES } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

const FK_W = 430
const FK_H = 600
const FK_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

const FK_HYPE_GOAL = [
  'GOLAZOOO! The net is SHAKING! 🔥', 'TOP BINS MERCHANT! 👑⚽', 'CLINICAL FINISH! 🩺',
  'THUNDERPUFF STRIKE! ⚡', 'SHEEEESH! 🥶', 'UPPER 90! Pure FILTH! 🗑️✨',
]
const FK_HYPE_SAVE = [
  'WHAT A SAVE! WALL MODE! 🧱🧤', 'DENIED! The crowd erupts! 🙌', 'Cat-like reflexes! 🐱⚡',
  'FORTRESS! 🏰', 'Spider-Man save! 🕷️', 'Read like a BOOK! 📖',
]
const FK_CONCEDE = [
  'Bruh... 💀', 'Wrong way bestie 🧭', 'Keeper had LAG 📡', 'Even the crowd felt that 😬',
]
const FK_ROASTS_MISS = [
  'Ball entered witness protection 🕵️', 'That kick is still in orbit 🛸',
  'Did you sneeze mid-kick? 🤧', 'Even the ball is embarrassed 😳',
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const getPuffPower = (elapsed: number): number => {
  if (elapsed < 0.5) return Math.round((elapsed / 0.5) * 15)
  if (elapsed < 1.5) return Math.round(15 + ((elapsed - 0.5) / 1.0) * 25)
  if (elapsed < 2.5) return Math.round(40 + ((elapsed - 1.5) / 1.0) * 30)
  if (elapsed < 3.5) return Math.round(70 + ((elapsed - 2.5) / 1.0) * 25)
  if (elapsed < 4.5) return Math.round(95 - ((elapsed - 3.5) / 1.0) * 20)
  if (elapsed < 5.0) return Math.round(75 - ((elapsed - 4.5) / 0.5) * 45)
  return 30
}

type KickState = 'shoot' | 'power' | 'flight' | 'shoot_result' | 'save_ready' | 'save_countdown' | 'save_dive' | 'save_result' | 'final' | null

interface BallFlight { sx: number; sy: number; ex: number; ey: number; t: number; dur: number; result: string }
interface KeeperAnim { x: number; diving: boolean; diveDir: number }

export const FinalKickGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  const [kickState, setKickState] = useState<KickState>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ you: 0, ai: 0 })
  const [aim, setAim] = useState<number | null>(null)
  const [power, setPower] = useState(0)
  const [aiZone, setAiZone] = useState<number | null>(null)
  const [saveZone, setSaveZone] = useState<number | null>(null)
  const [charging, setCharging] = useState(false)
  const [sweetMin, setSweetMin] = useState(70)
  const [sweetMax, setSweetMax] = useState(95)
  const [comment, setComment] = useState('')
  const [stats, setStats] = useState({ goals: 0, saves: 0, perfects: 0, misses: 0 })
  const [ballResult, setBallResult] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStartTime = useRef(0)
  const isPuffBlinker = useRef(false)
  const startedRef = useRef(false)
  const activeRef = useRef<{ v: boolean }>({ v: false })

  const ballFlight = useRef<BallFlight | null>(null)
  const ballTrail = useRef<{ x: number; y: number; t: number }[]>([])
  const netRipple = useRef<{ x: number; y: number; t: number; isGoal: boolean } | null>(null)
  const keeperAnim = useRef<KeeperAnim>({ x: 0.5, diving: false, diveDir: 0 })

  const stateRef = useRef<KickState>(null)
  useEffect(() => { stateRef.current = kickState }, [kickState])
  const aimRef = useRef<number | null>(null)
  useEffect(() => { aimRef.current = aim }, [aim])
  const powerRef = useRef(0)
  useEffect(() => { powerRef.current = power }, [power])
  const chargingRef = useRef(false)
  useEffect(() => { chargingRef.current = charging }, [charging])
  const sweetMinRef = useRef(70)
  useEffect(() => { sweetMinRef.current = sweetMin }, [sweetMin])
  const sweetMaxRef = useRef(95)
  useEffect(() => { sweetMaxRef.current = sweetMax }, [sweetMax])

  const randomizeSweetSpot = useCallback(() => {
    const holdMin = 1.5 + Math.random() * 0.8
    const windowW = 1.2 + Math.random() * 0.6
    const holdMax = holdMin + windowW
    const pMin = Math.round(40 + ((holdMin - 1.5) / 2.0) * 55)
    const pMax = Math.min(96, Math.round(40 + ((holdMax - 1.5) / 2.0) * 55))
    setSweetMin(Math.max(45, pMin))
    setSweetMax(pMax)
    return { holdMin: holdMin.toFixed(1), holdMax: holdMax.toFixed(1) }
  }, [])

  const getPuffZone = useCallback((p: number) => {
    if (p >= sweetMinRef.current && p <= sweetMaxRef.current) return 'perfect'
    if (p >= 40 && p < sweetMinRef.current) return 'good'
    if (p >= 15 && p < 40) return 'short'
    if (p < 15) return 'tap'
    if (p > sweetMaxRef.current) return 'long'
    return 'good'
  }, [])

  const triggerShake = useCallback(() => {
    ui.setScreenShake(true); setTimeout(() => ui.setScreenShake(false), 400)
  }, [ui])
  const triggerFlash = useCallback((k: string) => {
    ui.setScreenFlash(k); setTimeout(() => ui.setScreenFlash(null), 400)
  }, [ui])

  const kickLaunchBall = useCallback((targetZone: number, result: string) => {
    const goalL = FK_W * 0.15, goalR = FK_W * 0.85
    const grassY = FK_H * 0.55
    const goalTop = grassY - 100, goalBottom = grassY + 2
    const goalW = goalR - goalL, goalH = goalBottom - goalTop
    const col = KICK_ZONES[targetZone].col, row = KICK_ZONES[targetZone].row
    const ex = goalL + col * (goalW / 3) + goalW / 6
    const ey = goalTop + row * (goalH / 2) + goalH / 4
    ballFlight.current = { sx: FK_W / 2, sy: FK_H * 0.82, ex, ey, t: Date.now(), dur: 800, result }
    ballTrail.current = []
    setTimeout(() => {
      netRipple.current = { x: ex, y: ey, t: Date.now(), isGoal: result === 'goal' }
      ballFlight.current = null
    }, 850)
  }, [])

  const kickAnimateKeeper = useCallback((diveZone: number) => {
    const col = KICK_ZONES[diveZone].col
    const targetX = col === 0 ? 0.2 : col === 1 ? 0.5 : 0.8
    keeperAnim.current = { x: targetX, diving: true, diveDir: col === 0 ? -1 : col === 2 ? 1 : 0 }
    setTimeout(() => { keeperAnim.current = { x: 0.5, diving: false, diveDir: 0 } }, 2000)
  }, [])

  const advanceRoundRef = useRef<() => void>(() => {})

  const kickExecute = useCallback((zone: number, pwr: number, wasBlinker: boolean) => {
    const pool = { aiSave: 0.2 }
    const aiSave = Math.floor(Math.random() * 6)
    setAiZone(aiSave)
    kickAnimateKeeper(aiSave)
    setKickState('flight')
    audio.playFx('kick')

    const puffZone = getPuffZone(pwr)
    const sameZone = zone === aiSave
    let autoFail = false
    let missChance = 0
    let aiSaveChance = 1
    if (puffZone === 'perfect') aiSaveChance = pool.aiSave
    else autoFail = true
    if (wasBlinker) { missChance = 0.7; autoFail = true }
    else if (puffZone === 'long') { missChance = 0.3; autoFail = true }

    const missed = autoFail ? Math.random() < Math.max(missChance, 0.2) : false
    const aiSaves = !missed && (autoFail || (sameZone && Math.random() < aiSaveChance))
    const isGoal = !missed && !aiSaves
    const result = missed ? 'missed' : aiSaves ? 'saved' : 'goal'
    setBallResult(result)
    kickLaunchBall(zone, result)

    setTimeout(() => {
      if (!activeRef.current.v) return
      if (missed) {
        audio.playFx('lose'); triggerFlash('miss'); triggerShake()
        setStats(s => ({ ...s, misses: s.misses + 1 }))
        setComment(pick(FK_ROASTS_MISS))
      } else if (isGoal) {
        setScore(s => ({ ...s, you: s.you + 1 }))
        setStats(s => ({ ...s, goals: s.goals + 1, perfects: puffZone === 'perfect' ? s.perfects + 1 : s.perfects }))
        audio.playFx('win'); audio.playFx('crowd')
        triggerFlash('goal'); triggerShake()
        player.spawnConfetti(40)
        setComment(pick(FK_HYPE_GOAL))
      } else {
        audio.playFx('lose'); triggerFlash('save')
        setComment('Keeper said nah 🧤')
      }
      setKickState('shoot_result')
      setTimeout(() => {
        if (!activeRef.current.v) return
        setBallResult(null)
        setAim(null)
        setKickState('save_ready')
        setComment('Your turn in goal 🧤')
      }, 1800)
    }, 800)
  }, [audio, player, getPuffZone, kickAnimateKeeper, kickLaunchBall, triggerFlash, triggerShake])

  const kickSelectZone = useCallback((zone: number) => {
    if (stateRef.current !== 'shoot') return
    setAim(zone)
    setKickState('power')
    setPower(0)
    setComment(pick(['Now PUFF it! 💨', 'Hold that puff... 🫁', 'Full lungs energy 💨']))
  }, [])

  const kickStartCharge = useCallback(() => {
    const s = stateRef.current
    if (s !== 'power') return
    if (aimRef.current === null) return
    if (chargingRef.current) return
    setCharging(true)
    setPower(0)
    ui.setDimLights(true)
    puffStartTime.current = Date.now()
    isPuffBlinker.current = false
    if (chargeInterval.current) clearInterval(chargeInterval.current)
    chargeInterval.current = setInterval(() => {
      const elapsed = (Date.now() - puffStartTime.current) / 1000
      const pwr = getPuffPower(elapsed)
      setPower(pwr)
      if (elapsed > 4.5) isPuffBlinker.current = true
      if (elapsed >= 5.5) kickStopChargeRef.current()
    }, 50)
  }, [ui])

  const kickStopChargeRef = useRef<() => void>(() => {})

  const kickStopCharge = useCallback(() => {
    if (!chargingRef.current) return
    setCharging(false)
    ui.setDimLights(false)
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
    const elapsed = (Date.now() - puffStartTime.current) / 1000
    const wasBlinker = elapsed >= 4.5
    const intensity = (Math.random() - 0.5) * 10
    const finalPwr = Math.max(5, Math.min(100, powerRef.current + intensity))
    const pwrR = Math.round(finalPwr)
    setPower(pwrR)
    const z = aimRef.current
    if (z !== null) setTimeout(() => kickExecute(z, pwrR, wasBlinker), 200)
  }, [ui, kickExecute])

  useEffect(() => { kickStopChargeRef.current = kickStopCharge }, [kickStopCharge])

  const kickSaveStart = useCallback(() => {
    setAim(null); setBallResult(null)
    const aiKick = Math.floor(Math.random() * 6)
    setAiZone(aiKick)
    setKickState('save_countdown')
    audio.playFx('whistle')
    setComment('AI winding up... 👀')
    setTimeout(() => {
      if (!activeRef.current.v) return
      setKickState('save_dive')
      setComment('DIVE NOW! 🧤')
    }, 1200)
  }, [audio])

  const kickDive = useCallback((zone: number) => {
    if (stateRef.current !== 'save_dive') return
    setSaveZone(zone)
    setKickState('save_result')
    audio.playFx('kick')
    const pool = { aiScore: 0.4 }
    const aiKick = aiZone ?? 0
    const sameZone = zone === aiKick
    const aiScores = !sameZone || (sameZone && Math.random() < (pool.aiScore - 0.2))
    const result = aiScores ? 'goal' : 'saved'
    setBallResult(result)
    kickAnimateKeeper(zone)
    setTimeout(() => {
      if (!activeRef.current.v) return
      kickLaunchBall(aiKick, result)
    }, 50)
    setTimeout(() => {
      if (!activeRef.current.v) return
      if (aiScores) {
        setScore(s => ({ ...s, ai: s.ai + 1 }))
        audio.playFx('lose'); triggerFlash('miss'); triggerShake()
        setComment(pick(FK_CONCEDE))
      } else {
        setStats(s => ({ ...s, saves: s.saves + 1 }))
        audio.playFx('win'); audio.playFx('crowd')
        triggerFlash('save'); triggerShake()
        player.spawnConfetti(20, [C.orange, C.gold, C.green])
        setComment(pick(FK_HYPE_SAVE))
      }
      setTimeout(() => {
        if (!activeRef.current.v) return
        setBallResult(null)
        setSaveZone(null); setAiZone(null)
        advanceRoundRef.current()
      }, 1800)
    }, 800)
  }, [audio, aiZone, kickAnimateKeeper, kickLaunchBall, triggerFlash, triggerShake, player])

  const startRound = useCallback((n: number) => {
    setRound(n)
    const ss = randomizeSweetSpot()
    setAim(null); setPower(0); setAiZone(null); setSaveZone(null); setBallResult(null)
    setKickState('shoot')
    setComment(`Round ${n + 1}! Sweet spot: ${ss.holdMin}-${ss.holdMax}s 🎯`)
  }, [randomizeSweetSpot])

  const advanceRound = useCallback(() => {
    const next = round + 1
    if (next >= 5) {
      setKickState('final')
    } else {
      startRound(next)
    }
  }, [round, startRound])

  useEffect(() => { advanceRoundRef.current = advanceRound }, [advanceRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    setScore({ you: 0, ai: 0 })
    setStats({ goals: 0, saves: 0, perfects: 0, misses: 0 })
    setAim(null); setPower(0); setAiZone(null); setSaveZone(null); setBallResult(null)
    const ss = randomizeSweetSpot()
    setRound(0)
    setKickState('shoot')
    setComment(`Let's gooo 🔥 Sweet spot: ${ss.holdMin}-${ss.holdMax}s`)
  }, [audio, randomizeSweetSpot])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    setKickState(null)
    game.exitGame()
  }, [audio, game])

  const kickEndGame = useCallback(() => {
    const won = score.you > score.ai
    const tied = score.you === score.ai
    const baseReward = won ? 80 : tied ? 12 : 12
    player.notify(won ? `⚽ YOU WIN! +${baseReward} coins!` : tied ? `🤝 Draw! +${baseReward} coins` : `😢 +${baseReward} coins`, won ? C.green : tied ? C.gold : C.red)
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(won, baseReward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    exitGame()
  }, [score, player, audio, ble, game, exitGame])

  // Canvas draw
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = FK_W, H = FK_H
    ctx.save()
    ctx.scale(FK_DPR, FK_DPR)
    ctx.clearRect(0, 0, W, H)

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
    skyGrad.addColorStop(0, '#06101E')
    skyGrad.addColorStop(0.25, '#0c1a38')
    skyGrad.addColorStop(0.5, '#102240')
    skyGrad.addColorStop(1, '#081830')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H)

    // Stadium lights
    ctx.save(); ctx.globalAlpha = 0.12
    const lt = ctx.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, H * 0.35)
    lt.addColorStop(0, '#00E5FF'); lt.addColorStop(1, 'transparent')
    ctx.fillStyle = lt; ctx.fillRect(0, 0, W, H * 0.4)
    const rt = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, H * 0.35)
    rt.addColorStop(0, '#FFD93D'); rt.addColorStop(1, 'transparent')
    ctx.fillStyle = rt; ctx.fillRect(0, 0, W, H * 0.4)
    ctx.restore()

    // Grass
    const grassY = H * 0.55
    const grassGrad = ctx.createLinearGradient(0, grassY, 0, H)
    grassGrad.addColorStop(0, '#1a5c2a')
    grassGrad.addColorStop(0.3, '#22723a')
    grassGrad.addColorStop(0.6, '#1d6432')
    grassGrad.addColorStop(1, '#145224')
    ctx.fillStyle = grassGrad
    ctx.fillRect(0, grassY, W, H - grassY)
    ctx.save(); ctx.globalAlpha = 0.06
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000'
      ctx.fillRect(0, grassY + i * (H - grassY) / 8, W, (H - grassY) / 8)
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5
    const boxL = W * 0.15, boxR = W * 0.85, boxTop = grassY + 20
    ctx.strokeRect(boxL, boxTop, boxR - boxL, H - boxTop - 10)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath(); ctx.arc(W / 2, H * 0.82, 4, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(W / 2, H, W * 0.2, Math.PI, 0); ctx.stroke()

    // Goal frame
    const goalL = W * 0.15, goalR = W * 0.85, goalTop = grassY - 100, goalBottom = grassY + 2
    const goalW = goalR - goalL, goalH = goalBottom - goalTop
    const perspOff = 12
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.beginPath()
    ctx.moveTo(goalL, goalTop); ctx.lineTo(goalR, goalTop)
    ctx.lineTo(goalR + perspOff, goalTop - perspOff)
    ctx.lineTo(goalL - perspOff, goalTop - perspOff)
    ctx.closePath(); ctx.fill()

    // Net grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5
    const netCols = 12, netRows = 6
    for (let i = 1; i < netCols; i++) {
      const x = goalL + (goalW / netCols) * i
      ctx.beginPath(); ctx.moveTo(x, goalTop); ctx.lineTo(x, goalBottom); ctx.stroke()
    }
    for (let i = 1; i < netRows; i++) {
      const y = goalTop + (goalH / netRows) * i
      ctx.beginPath(); ctx.moveTo(goalL, y); ctx.lineTo(goalR, y); ctx.stroke()
    }
    // Posts
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(goalL, goalBottom); ctx.lineTo(goalL, goalTop)
    ctx.lineTo(goalR, goalTop); ctx.lineTo(goalR, goalBottom)
    ctx.stroke()

    // Net ripple
    if (netRipple.current) {
      const rip = netRipple.current
      const ripAge = (Date.now() - rip.t) / 1000
      if (ripAge < 1.2) {
        const ripAlpha = Math.max(0, 0.5 - ripAge * 0.4)
        const ripR = ripAge * 80
        ctx.save(); ctx.globalAlpha = ripAlpha
        ctx.strokeStyle = rip.isGoal ? '#00FF88' : '#FF6644'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(rip.x, rip.y, ripR, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
      } else {
        netRipple.current = null
      }
    }

    // Zone overlay
    const s = stateRef.current
    const isShootSelect = s === 'shoot'
    const isSaveDive = s === 'save_dive'
    if (isShootSelect || isSaveDive) {
      for (let i = 0; i < 6; i++) {
        const col = KICK_ZONES[i].col, row = KICK_ZONES[i].row
        const zx = goalL + col * (goalW / 3), zy = goalTop + row * (goalH / 2)
        const zw = goalW / 3, zh = goalH / 2
        ctx.fillStyle = aimRef.current === i
          ? (isShootSelect ? 'rgba(0,229,255,0.25)' : 'rgba(255,165,0,0.25)')
          : isShootSelect ? 'rgba(0,229,255,0.08)' : 'rgba(255,165,0,0.08)'
        ctx.fillRect(zx, zy, zw, zh)
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(zx, zy, zw, zh)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(KICK_ZONES[i].label, zx + zw / 2, zy + zh / 2)
      }
    }

    // Ball flight
    const bf = ballFlight.current
    if (bf) {
      const elapsed = (Date.now() - bf.t) / bf.dur
      const progress = Math.min(1, elapsed)
      const eased = 1 - Math.pow(1 - progress, 3)
      const bx = bf.sx + (bf.ex - bf.sx) * eased
      const arcHeight = -120 * Math.sin(progress * Math.PI)
      const by = bf.sy + (bf.ey - bf.sy) * eased + arcHeight
      const ballR = 12 - progress * 4

      ballTrail.current.push({ x: bx, y: by, t: Date.now() })
      ballTrail.current = ballTrail.current.filter(p => Date.now() - p.t < 400).slice(-20)
      ctx.save()
      for (const tp of ballTrail.current) {
        const age = (Date.now() - tp.t) / 400
        ctx.globalAlpha = Math.max(0, 0.3 - age * 0.3)
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(tp.x, tp.y, (1 - age) * ballR * 0.5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()

      ctx.save()
      ctx.translate(bx, by); ctx.rotate(progress * 720 * Math.PI / 180)
      const ballGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, ballR)
      ballGrad.addColorStop(0, '#ffffff')
      ballGrad.addColorStop(0.7, '#dddddd')
      ballGrad.addColorStop(1, '#999999')
      ctx.fillStyle = ballGrad
      ctx.beginPath(); ctx.arc(0, 0, ballR, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(ang) * ballR * 0.5, Math.sin(ang) * ballR * 0.5, ballR * 0.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    // Keeper
    const ka = keeperAnim.current
    const keeperX = goalL + ka.x * goalW
    const keeperY = goalBottom - 2
    const kH = goalH * 0.5
    const kW = kH * 0.3
    const headR = kH * 0.12
    const bodyH = kH * 0.38
    const bodyW = kW
    const legH = kH * 0.28
    const gloveS = kH * 0.09
    ctx.save()
    ctx.fillStyle = '#333'
    ctx.fillRect(keeperX - kW * 0.3, keeperY - legH, kW * 0.25, legH)
    ctx.fillRect(keeperX + kW * 0.05, keeperY - legH, kW * 0.25, legH)
    ctx.fillStyle = '#FF8800'
    ctx.fillRect(keeperX - bodyW / 2, keeperY - legH - bodyH, bodyW, bodyH)
    ctx.fillStyle = '#222'
    ctx.fillRect(keeperX - bodyW / 2, keeperY - legH - bodyH * 0.15, bodyW, bodyH * 0.15)
    ctx.fillStyle = '#FFD93D'
    ctx.beginPath(); ctx.arc(keeperX, keeperY - legH - bodyH - headR, headR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#FF8800'
    ctx.beginPath(); ctx.arc(keeperX, keeperY - legH - bodyH - headR * 1.2, headR * 1.1, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#00E5FF'
    if (ka.diving) {
      const diveOffset = ka.diveDir * kH * 0.4
      ctx.beginPath(); ctx.arc(keeperX + diveOffset, keeperY - legH - bodyH * 0.7, gloveS, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(keeperX + diveOffset * 0.5, keeperY - legH - bodyH * 0.3, gloveS, 0, Math.PI * 2); ctx.fill()
    } else {
      ctx.beginPath(); ctx.arc(keeperX - bodyW * 0.8, keeperY - legH - bodyH * 0.8, gloveS, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(keeperX + bodyW * 0.8, keeperY - legH - bodyH * 0.8, gloveS, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#FF8800'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(keeperX - bodyW / 2, keeperY - legH - bodyH * 0.7); ctx.lineTo(keeperX - bodyW * 0.8, keeperY - legH - bodyH * 0.8); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(keeperX + bodyW / 2, keeperY - legH - bodyH * 0.7); ctx.lineTo(keeperX + bodyW * 0.8, keeperY - legH - bodyH * 0.8); ctx.stroke()
    }
    ctx.restore()

    ctx.restore()
  }, [])

  // Start on mount
  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'finalkick') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animation loop (Rule 4)
  useEffect(() => {
    if (!kickState) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [drawCanvas, kickState])

  // BLE
  useEffect(() => {
    if (game.gameActive?.id !== 'finalkick') return
    ble.registerPuffHandlers('finalkick', () => kickStartCharge(), () => kickStopCharge())
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!kickState || game.gameActive?.id !== 'finalkick') return null

  const isShootPhase = ['shoot', 'power', 'flight', 'shoot_result'].includes(kickState)
  const isSavePhase = ['save_ready', 'save_countdown', 'save_dive', 'save_result'].includes(kickState)
  const isResult = kickState === 'shoot_result' || kickState === 'save_result'
  const isFinal = kickState === 'final'
  const puffZoneLabel = getPuffZone(power)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none',
      animation: ui.screenShake ? 'shake 0.4s ease' : 'none',
      filter: ui.dimLights ? 'brightness(0.6)' : 'brightness(1)', transition: 'filter 0.3s' }}>
      {ui.screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0,
        background: ui.screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : ui.screenFlash === 'save' ? 'rgba(255,165,0,0.2)' : 'rgba(255,50,50,0.2)',
        animation: 'flashOverlay 0.4s ease forwards' }} />}

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
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={() => { audio.playFx('tap'); exitGame() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0, touchAction: 'none' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>Round {round + 1}/5</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2, 3, 4].map(r => (
                <div key={r} style={{ width: 6, height: 6, borderRadius: '50%', background: r < round ? C.cyan : r === round ? C.gold : `${C.text3}30`, boxShadow: r === round ? `0 0 6px ${C.gold}` : '' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>{score.you}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>-</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.red }}>{score.ai}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 7, fontWeight: 800, color: '#00E5FF', padding: '2px 8px', borderRadius: 20, background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>FK1 Classic</span>
          <span style={{ fontSize: 8, fontWeight: 800, color: isShootPhase ? C.cyan : isSavePhase ? C.orange : C.gold }}>{isShootPhase ? 'YOUR KICK' : isSavePhase ? 'YOUR SAVE' : isFinal ? 'RESULT' : ''}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 7, color: C.text3 }}>G:{stats.goals} S:{stats.saves} P:{stats.perfects}</span>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(FK_W * FK_DPR)} height={Math.round(FK_H * FK_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Zone tap overlay */}
        {(kickState === 'shoot' || kickState === 'save_dive') && (
          <div style={{ position: 'absolute', top: '15%', left: '12%', right: '12%', bottom: '45%', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 3 }}>
            {[3, 4, 5, 0, 1, 2].map(z => (
              <div key={z}
                onClick={() => {
                  if (kickState === 'shoot') { kickSelectZone(z); audio.playFx('kick') }
                  else if (kickState === 'save_dive') { kickDive(z); audio.playFx('kick') }
                }}
                style={{
                  borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: aim === z ? (kickState === 'shoot' ? 'rgba(0,229,255,0.25)' : 'rgba(255,165,0,0.25)') : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${aim === z ? (kickState === 'shoot' ? 'rgba(0,229,255,0.5)' : 'rgba(255,165,0,0.5)') : 'rgba(255,255,255,0.08)'}`,
                  fontSize: 20, color: 'rgba(255,255,255,0.3)', touchAction: 'none',
                }}>
                {kickState === 'save_dive' ? (z < 3 ? '🧤' : '🤸') : KICK_ZONES[z].label}
              </div>
            ))}
          </div>
        )}

        {/* Commentary */}
        {comment && !isResult && !isFinal && (
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 25, pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textShadow: '0 0 12px rgba(0,0,0,0.9)', padding: '5px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', maxWidth: 300 }}>
              {comment}
            </div>
          </div>
        )}

        {/* Result overlay */}
        {isResult && ballResult && (() => {
          const isMiss = ballResult === 'missed'
          const isGoal = ballResult === 'goal'
          const youScored = isShootPhase && isGoal
          const youSaved = isSavePhase && !isGoal && !isMiss
          const good = youScored || youSaved
          return (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30,
              background: good ? 'radial-gradient(circle, rgba(0,255,136,0.15), rgba(0,0,0,0.6))' : 'radial-gradient(circle, rgba(255,68,68,0.1), rgba(0,0,0,0.6))' }}>
              <div style={{ fontSize: 56, filter: `drop-shadow(0 0 40px ${good ? C.green : C.red}80)` }}>
                {isMiss ? '💀' : youScored ? '⚽' : youSaved ? '🧤' : isShootPhase ? '🧤' : '⚽'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: good ? C.green : C.red, textShadow: `0 0 30px ${good ? C.green : C.red}`, letterSpacing: 2 }}>
                {isMiss ? 'MISS!' : youScored ? 'GOLAZO!' : youSaved ? 'DENIED!' : isShootPhase ? 'Saved!' : 'AI Scores!'}
              </div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 6, fontStyle: 'italic', maxWidth: 280 }}>
                {comment}
              </div>
            </div>
          )
        })()}

        {/* Controls */}
        {!isResult && !isFinal && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 20, padding: '6px 12px' }}>
            {kickState === 'shoot' && (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.cyan }}>TAP a zone to aim your kick</span>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>Pick your corner, then charge power</div>
              </div>
            )}

            {kickState === 'power' && (() => {
              const elapsed = charging ? (Date.now() - puffStartTime.current) / 1000 : 0
              const zoneColor = puffZoneLabel === 'perfect' ? C.green : puffZoneLabel === 'good' ? C.cyan : puffZoneLabel === 'short' ? C.gold : puffZoneLabel === 'tap' ? C.text3 : C.red
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: zoneColor }}>{charging ? (puffZoneLabel === 'perfect' ? 'SWEET SPOT! RELEASE!' : puffZoneLabel + '...') : 'PUFF POWER'}</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: zoneColor, fontFamily: 'monospace' }}>{charging ? elapsed.toFixed(1) + 's' : Math.round(power) + '%'}</span>
                  </div>
                  <div
                    onMouseDown={() => { kickStartCharge(); audio.playFx('charge') }}
                    onMouseUp={kickStopCharge}
                    onMouseLeave={kickStopCharge}
                    onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); kickStartCharge(); audio.playFx('charge') }}
                    onTouchEnd={(e) => { e.stopPropagation(); kickStopCharge() }}
                    onTouchCancel={(e) => { e.stopPropagation(); kickStopCharge() }}
                    style={{
                      padding: '14px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                      position: 'relative', overflow: 'hidden',
                      background: 'rgba(0,0,0,0.4)',
                      border: `2px solid ${charging ? zoneColor + '50' : C.cyan + '30'}`,
                      fontSize: 14, fontWeight: 900, color: charging ? zoneColor : C.cyan,
                      userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
                      boxShadow: charging ? `0 0 25px ${zoneColor}25` : `0 0 15px ${C.cyan}10`,
                    }}>
                    {charging && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: power + '%', background: `linear-gradient(90deg, ${zoneColor}30, ${zoneColor}15)`, transition: 'width 0.05s', borderRadius: 12 }} />}
                    {charging && <div style={{ position: 'absolute', left: sweetMin + '%', width: (sweetMax - sweetMin) + '%', top: 0, bottom: 0, background: 'rgba(0,255,136,0.08)', borderLeft: '1px solid rgba(0,255,136,0.3)', borderRight: '1px solid rgba(0,255,136,0.3)' }} />}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {charging
                        ? (puffZoneLabel === 'perfect' ? 'RELEASE NOW! 🎯' : isPuffBlinker.current ? 'BLINKER! LET GO! 💀' : 'CHARGING... ' + Math.round(power) + '%')
                        : 'HOLD TO KICK ⚽'}
                      <div style={{ fontSize: 8, color: `${charging ? zoneColor : C.cyan}70`, marginTop: 3 }}>
                        {charging ? puffZoneLabel.toUpperCase() + ' · ' + elapsed.toFixed(1) + 's' : 'Hold & release in the SWEET SPOT'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {kickState === 'save_ready' && (
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, marginBottom: 6 }}>YOUR TURN TO SAVE</div>
                <div onClick={() => { kickSaveStart(); audio.playFx('whistle') }} style={{
                  padding: '14px 36px', borderRadius: 14, cursor: 'pointer', display: 'inline-block',
                  background: `linear-gradient(135deg, ${C.orange}20, ${C.orange}08)`,
                  border: `1px solid ${C.orange}35`, fontSize: 15, fontWeight: 900, color: C.orange, touchAction: 'none',
                }}>BRING IT ON</div>
              </div>
            )}

            {kickState === 'save_countdown' && (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: 14, color: C.gold, fontWeight: 900 }}>AI winding up...</span>
              </div>
            )}

            {kickState === 'save_dive' && (
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: C.orange }}>DIVE NOW! TAP a zone!</span>
              </div>
            )}

            {kickState === 'flight' && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 20 }}>⚽</span>
              </div>
            )}
          </div>
        )}

        {/* Final overlay */}
        {isFinal && (() => {
          const won = score.you > score.ai
          const draw = score.you === score.ai
          const resultColor = won ? C.green : draw ? C.gold : C.red
          const baseReward = won ? 80 : draw ? 30 : 10
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{won ? '🏆' : draw ? '🤝' : '💀'}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: resultColor, marginBottom: 6, textShadow: `0 0 30px ${resultColor}60` }}>
                {won ? 'YOU WIN!' : draw ? 'DRAW!' : 'DEFEATED'}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{score.you} — {score.ai}</div>
              <div style={{ fontSize: 11, color: C.text2, marginBottom: 8, fontStyle: 'italic', maxWidth: 280, textAlign: 'center' }}>
                {won ? pick(FK_HYPE_GOAL) : draw ? 'Fair game!' : pick(FK_CONCEDE)}
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10, width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: C.text }}>Earned</span>
                  <span style={{ color: C.gold }}>+{baseReward} coins</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <div onClick={() => { startGame(); audio.playFx('whistle') }} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 14, fontWeight: 800, color: C.cyan, touchAction: 'none' }}>Rematch</div>
                <div onClick={() => { kickEndGame(); audio.playFx('crowd') }} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
