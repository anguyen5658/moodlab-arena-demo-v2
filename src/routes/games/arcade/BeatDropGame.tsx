import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

const BD_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

interface Song { name: string; buildTime: number; fakeAt: number | null; color: string; bpm: number }
const BD_SONGS: Song[] = [
  { name: 'Neon Rise', buildTime: 5000, fakeAt: null, color: '#FF69B4', bpm: 128 },
  { name: 'Phantom Drop', buildTime: 7000, fakeAt: 3500, color: '#A855F7', bpm: 140 },
  { name: 'Bass Quake', buildTime: 4000, fakeAt: null, color: '#00E5FF', bpm: 150 },
  { name: 'Chaos Theory', buildTime: 6500, fakeAt: 4000, color: '#FF4D8D', bpm: 160 },
]
const BD_BOT_NAMES = ['DJ Haze', 'MC Vapor', 'BassBot']
const BD_BOT_EMOJIS = ['🎧', '🎵', '🔊']
const BD_BOT_COLORS = ['#A855F7', '#00E5FF', '#FB923C']
const BD_BOT_ACCURACY = [180, 280, 120]

interface Player { name: string; emoji: string; isYou: boolean; scores: number[]; totalPts: number; avgMs: number; color: string }
interface ScoreResult { ms: number; pts: number; label: string; input?: string }
type Phase = 'intro' | 'building' | 'dropped' | 'round_result' | 'final' | null

export const BeatDropGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [round, setRound] = useState(0)
  const [beatIntensity, setBeatIntensity] = useState(0)
  const [fakeDropped, setFakeDropped] = useState(false)
  const [holding, setHolding] = useState(false)
  const [charging, setCharging] = useState(false)
  const [puffIntensity, setPuffIntensity] = useState(0)
  const [lastResult, setLastResult] = useState<ScoreResult | null>(null)
  const [roundResults, setRoundResults] = useState<{ round: number; playerResults: any[] }[]>([])
  const [introStep, setIntroStep] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const buildInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartRef = useRef(0)
  const dropTimeRef = useRef(0)
  const releasedRef = useRef(false)
  const eqBars = useRef<number[]>(Array.from({ length: 24 }, () => 0.05))
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }[]>([])
  const strobeRef = useRef(0)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)

  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const beatIntensityRef = useRef(0)
  useEffect(() => { beatIntensityRef.current = beatIntensity }, [beatIntensity])
  const fakeDroppedRef = useRef(false)
  useEffect(() => { fakeDroppedRef.current = fakeDropped }, [fakeDropped])
  const holdingRef = useRef(false)
  useEffect(() => { holdingRef.current = holding }, [holding])
  const playersRef = useRef<Player[]>([])
  useEffect(() => { playersRef.current = players }, [players])
  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const stopAudio = useCallback(() => {
    try {
      if (oscRef.current) { oscRef.current.stop(); oscRef.current.disconnect(); oscRef.current = null }
      if (gainRef.current) { gainRef.current.disconnect(); gainRef.current = null }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    } catch (e) {}
  }, [])

  const playBuildAudio = useCallback((duration: number) => {
    stopAudio()
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      const ac: AudioContext = new AC()
      audioCtxRef.current = ac
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(120, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + duration / 1000)
      gain.gain.setValueAtTime(0.04, ac.currentTime)
      gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + duration / 1000)
      osc.connect(gain); gain.connect(ac.destination); osc.start()
      oscRef.current = osc; gainRef.current = gain
    } catch (e) {}
  }, [stopAudio])

  const playDropSound = useCallback(() => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      const ac: AudioContext = new AC()
      const osc = ac.createOscillator(); const gain = ac.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(80, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.6)
      gain.gain.setValueAtTime(0.2, ac.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.7)
      osc.connect(gain); gain.connect(ac.destination); osc.start(); osc.stop(ac.currentTime + 0.7)
    } catch (e) {}
  }, [])

  const triggerShake = useCallback(() => {
    ui.setScreenShake(true)
    setTimeout(() => ui.setScreenShake(false), 400)
  }, [ui])

  const triggerFlash = useCallback((kind: string) => {
    ui.setScreenFlash(kind)
    setTimeout(() => ui.setScreenFlash(null), 400)
  }, [ui])

  const calcScore = (relT: number | null, drpT: number, input: string): ScoreResult => {
    if (!relT || drpT === 0) return { ms: 9999, pts: 0, label: 'EARLY' }
    if (!drpT) return { ms: 9999, pts: 5, label: 'MISSED' }
    const diffMs = relT - drpT
    const absDiff = Math.abs(diffMs)
    let bonus = 0
    if (input === 'dry_puff') bonus = 0.05
    else if (input === 'real_puff') bonus = 0.15
    else if (input === 'blinker' && absDiff <= 100) bonus = 0.20
    else if (input === 'blinker') bonus = 0.10
    let pts = 0, label = ''
    if (absDiff <= 50) { pts = 100; label = 'PERFECT' }
    else if (absDiff <= 150) { pts = 80; label = 'GREAT' }
    else if (absDiff <= 350) { pts = 60; label = 'GOOD' }
    else if (absDiff <= 700) { pts = 35; label = 'OK' }
    else if (diffMs < 0) { pts = 0; label = 'EARLY' }
    else { pts = 10; label = 'LATE' }
    pts = Math.round(pts * (1 + bonus))
    if (input === 'blinker' && absDiff <= 100) label = 'BLINKER PERFECT'
    return { ms: absDiff, pts, label }
  }

  // Function refs for mutually recursive start/score
  const startRoundRef = useRef<(n: number, playersIn: Player[]) => void>(() => {})
  const scoreRoundRef = useRef<(n: number, releaseT: number | null, dropT: number, playersIn: Player[]) => void>(() => {})

  const scoreRound = useCallback((roundNum: number, releaseT: number | null, dropT: number, playersIn: Player[]) => {
    if (!activeRef.current.v) return
    if (buildInterval.current) { clearInterval(buildInterval.current); buildInterval.current = null }
    stopAudio()
    const holdDuration = holdStartRef.current > 0 ? ((releaseT || Date.now()) - holdStartRef.current) : 0
    const holdSec = holdDuration / 1000
    let inputType = 'tap'
    if (holdSec >= 5) inputType = 'blinker'
    else if (holdSec >= 2) inputType = 'real_puff'
    else if (holdSec >= 0.5) inputType = 'dry_puff'

    const playerResult = calcScore(releaseT, dropT, inputType)
    playerResult.input = inputType

    const botResults: ScoreResult[] = []
    for (let b = 0; b < 3; b++) {
      const accuracy = BD_BOT_ACCURACY[b]
      const u1 = Math.random(); const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const botDiffMs = Math.abs(Math.round(z * accuracy))
      const botInput = Math.random() < 0.15 ? 'real_puff' : Math.random() < 0.3 ? 'dry_puff' : 'tap'
      const botScore = calcScore(dropT ? dropT + botDiffMs : null, dropT, botInput)
      botScore.input = botInput
      botResults.push(botScore)
    }

    const allResults = [playerResult, ...botResults]
    const updatedPlayers = playersIn.map((p, idx) => {
      const r = allResults[idx]
      const newScores = [...p.scores, r.pts]
      const newTotal = newScores.reduce((a, b) => a + b, 0)
      return { ...p, scores: newScores, totalPts: newTotal, avgMs: r.ms }
    })

    setPlayers(updatedPlayers)
    setLastResult(playerResult)
    const roundRes = {
      round: roundNum + 1,
      playerResults: updatedPlayers.map((p, i) => ({ name: p.name, ms: allResults[i].ms, pts: allResults[i].pts, label: allResults[i].label, input: allResults[i].input })),
    }
    setRoundResults(prev => [...prev, roundRes])

    if (playerResult.label === 'PERFECT' || playerResult.label === 'BLINKER PERFECT') {
      audio.playFx('goal'); triggerFlash('goal'); player.spawnConfetti(40, [C.pink, C.purple, C.gold])
    } else if (playerResult.label === 'GREAT') {
      audio.playFx('success')
    } else if (playerResult.label === 'GOOD') {
      audio.playFx('select')
    } else if (playerResult.label === 'EARLY') {
      audio.playFx('error')
    } else {
      audio.playFx('miss')
    }

    setPhase('round_result')

    setTimeout(() => {
      if (!activeRef.current.v) return
      if (roundNum < 3) {
        startRoundRef.current(roundNum + 1, updatedPlayers)
      } else {
        setPhase('final')
        const sorted = [...updatedPlayers].sort((a, b) => b.totalPts - a.totalPts)
        const won = sorted[0].isYou
        const rank = sorted.findIndex(p => p.isYou) + 1
        const baseCoins = rank === 1 ? 80 : rank === 2 ? 40 : rank === 3 ? 20 : 10
        player.recordGameResult(won, baseCoins, won ? 25 : 10, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
        if (won) {
          player.spawnConfetti(60, [C.pink, C.purple, C.gold, C.cyan])
          audio.playFx('win'); audio.playFx('crowd')
        } else {
          audio.playFx('lose')
        }
      }
    }, 2800)
  }, [audio, player, ble, game, stopAudio, triggerFlash])

  useEffect(() => { scoreRoundRef.current = scoreRound }, [scoreRound])

  const startRound = useCallback((roundNum: number, playersIn: Player[]) => {
    if (!activeRef.current.v) return
    const song = BD_SONGS[roundNum]
    const buildTime = song.buildTime + Math.floor(Math.random() * 3000)
    setRound(roundNum)
    setHolding(false)
    holdStartRef.current = 0
    dropTimeRef.current = 0
    releasedRef.current = false
    setBeatIntensity(0)
    setFakeDropped(false)
    setLastResult(null)
    setCharging(false)
    setPuffIntensity(0)
    setPhase('building')
    audio.playFx('beat_buildup')
    playBuildAudio(buildTime)
    const startT = Date.now()
    buildInterval.current = setInterval(() => {
      if (!activeRef.current.v) return
      const elapsed = Date.now() - startT
      const progress = Math.min(elapsed / buildTime, 1)
      setBeatIntensity(progress)
    }, 50)
    if (song.fakeAt) {
      setTimeout(() => {
        if (!activeRef.current.v) return
        setFakeDropped(true)
        triggerShake()
        setTimeout(() => { if (activeRef.current.v) setFakeDropped(false) }, 800)
      }, song.fakeAt + Math.floor(Math.random() * 1000))
    }
    dropTimer.current = setTimeout(() => {
      if (!activeRef.current.v) return
      if (buildInterval.current) { clearInterval(buildInterval.current); buildInterval.current = null }
      stopAudio()
      const dropT = Date.now()
      dropTimeRef.current = dropT
      setBeatIntensity(1)
      setPhase('dropped')
      playDropSound()
      triggerFlash('goal')
      triggerShake()
      audio.playFx('beat_drop')
      setTimeout(() => {
        if (!activeRef.current.v) return
        if (!releasedRef.current) {
          scoreRoundRef.current(roundNum, null, dropT, playersIn)
        }
      }, 3000)
    }, buildTime)
  }, [audio, playBuildAudio, playDropSound, stopAudio, triggerFlash, triggerShake])

  useEffect(() => { startRoundRef.current = startRound }, [startRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    const initPlayers: Player[] = [
      { name: 'You', emoji: '🎧', isYou: true, scores: [], totalPts: 0, avgMs: 0, color: C.pink },
      { name: BD_BOT_NAMES[0], emoji: BD_BOT_EMOJIS[0], isYou: false, scores: [], totalPts: 0, avgMs: 0, color: BD_BOT_COLORS[0] },
      { name: BD_BOT_NAMES[1], emoji: BD_BOT_EMOJIS[1], isYou: false, scores: [], totalPts: 0, avgMs: 0, color: BD_BOT_COLORS[1] },
      { name: BD_BOT_NAMES[2], emoji: BD_BOT_EMOJIS[2], isYou: false, scores: [], totalPts: 0, avgMs: 0, color: BD_BOT_COLORS[2] },
    ]
    setPlayers(initPlayers)
    setRound(0)
    setRoundResults([])
    setLastResult(null)
    setIntroStep(0)
    setBeatIntensity(0)
    particles.current = []
    strobeRef.current = 0
    setPhase('intro')
    audio.playFx('crowd')
    setTimeout(() => { if (activeRef.current.v) setIntroStep(1) }, 300)
    setTimeout(() => { if (activeRef.current.v) setIntroStep(2) }, 800)
    setTimeout(() => { if (activeRef.current.v) setIntroStep(3) }, 1400)
    setTimeout(() => { if (activeRef.current.v) setIntroStep(4) }, 2000)
    setTimeout(() => { if (activeRef.current.v) startRoundRef.current(0, initPlayers) }, 3200)
  }, [audio])

  const startHold = useCallback(() => {
    const p = phaseRef.current
    if (p !== 'building' && p !== 'dropped') return
    if (holdingRef.current) return
    const now = Date.now()
    setHolding(true)
    holdStartRef.current = now
    setCharging(true)
    setPuffIntensity(0)
    if (holdInterval.current) clearInterval(holdInterval.current)
    holdInterval.current = setInterval(() => {
      const elapsed = (Date.now() - holdStartRef.current) / 1000
      setPuffIntensity(Math.min(elapsed / 6, 1))
    }, 50)
  }, [])

  const releaseHold = useCallback(() => {
    if (!holdingRef.current) return
    setHolding(false)
    setCharging(false)
    if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null }
    const releaseT = Date.now()
    releasedRef.current = true
    const dropT = dropTimeRef.current
    const p = phaseRef.current
    if (p === 'building') {
      audio.playFx('error')
      scoreRoundRef.current(roundRef.current, releaseT, 0, playersRef.current)
    } else if (p === 'dropped' && dropT > 0) {
      scoreRoundRef.current(roundRef.current, releaseT, dropT, playersRef.current)
    }
  }, [audio])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    stopAudio()
    if (buildInterval.current) { clearInterval(buildInterval.current); buildInterval.current = null }
    if (dropTimer.current) { clearTimeout(dropTimer.current); dropTimer.current = null }
    if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    particles.current = []
    setPhase(null)
    game.exitGame()
  }, [audio, stopAudio, game])

  // Canvas draw
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const d = BD_DPR
    const t = Date.now() / 1000
    const intensity = beatIntensityRef.current
    const p = phaseRef.current
    const dropped = p === 'dropped'
    const building = p === 'building'
    const faked = fakeDroppedRef.current

    ctx.clearRect(0, 0, W, H)

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, dropped ? '#1a0030' : '#08001a')
    bgGrad.addColorStop(0.4, dropped ? '#2a0040' : '#0d0025')
    bgGrad.addColorStop(1, '#030010')
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H)

    if (building || dropped) {
      const numBeams = dropped ? 12 : 6
      for (let i = 0; i < numBeams; i++) {
        const angle = (i / numBeams) * Math.PI + Math.sin(t * 2 + i) * 0.3
        const cx = W * 0.5 + Math.sin(t * 0.7 + i * 1.3) * W * 0.2
        const len = H * (dropped ? 1.2 : 0.4 + intensity * 0.6)
        ctx.save()
        ctx.globalAlpha = (dropped ? 0.3 : intensity * 0.15) * (0.5 + 0.5 * Math.sin(t * 4 + i))
        ctx.strokeStyle = ['#FF00FF', '#00FFFF', '#FF4D8D', '#A855F7', '#FFD93D', '#00E5FF'][i % 6]
        ctx.lineWidth = (dropped ? 3 : 1.5) * d
        ctx.beginPath()
        ctx.moveTo(cx, 0)
        ctx.lineTo(cx + Math.cos(angle) * len, Math.sin(angle) * len)
        ctx.stroke()
        ctx.restore()
      }
    }

    const boothY = H * 0.72
    const boothGrad = ctx.createLinearGradient(0, boothY, 0, H)
    boothGrad.addColorStop(0, 'rgba(20,0,40,0.9)')
    boothGrad.addColorStop(1, 'rgba(5,0,15,0.95)')
    ctx.fillStyle = boothGrad
    ctx.beginPath()
    ctx.moveTo(0, boothY + 20 * d)
    ctx.quadraticCurveTo(W * 0.5, boothY - 10 * d, W, boothY + 20 * d)
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill()

    ctx.strokeStyle = dropped ? 'rgba(255,77,141,0.6)' : `rgba(192,132,252,${0.15 + intensity * 0.25})`
    ctx.lineWidth = 2 * d
    ctx.beginPath()
    ctx.moveTo(0, boothY + 20 * d)
    ctx.quadraticCurveTo(W * 0.5, boothY - 10 * d, W, boothY + 20 * d)
    ctx.stroke()

    const bars = eqBars.current
    const barW = (W * 0.85) / bars.length
    const barStartX = W * 0.075
    const barBaseY = boothY + 30 * d
    for (let i = 0; i < bars.length; i++) {
      const target = dropped ? (0.6 + Math.random() * 0.4) : building ? (intensity * (0.3 + 0.7 * Math.abs(Math.sin(t * 3 + i * 0.5)))) : 0.05
      bars[i] += (target - bars[i]) * 0.15
      const bh = bars[i] * 100 * d
      const x = barStartX + i * barW
      const hue = dropped ? (30 + i * 8) : (280 + i * 3 + intensity * 40)
      const sat = dropped ? 90 : 70 + intensity * 20
      const lit = dropped ? (55 + bars[i] * 25) : (30 + intensity * 30)
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`
      ctx.fillRect(x, barBaseY - bh, barW - 1 * d, bh)
      if (dropped || intensity > 0.7) {
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
        ctx.shadowBlur = 8 * d
        ctx.fillRect(x, barBaseY - bh, barW - 1 * d, 2 * d)
        ctx.shadowBlur = 0
      }
    }

    const orbY = H * 0.35
    const orbBaseR = 30 * d
    const orbR = orbBaseR + (dropped ? 40 * d * (0.5 + 0.5 * Math.sin(t * 8)) : intensity * 25 * d * (0.8 + 0.2 * Math.sin(t * 4)))
    const orbGrad = ctx.createRadialGradient(W * 0.5, orbY, 0, W * 0.5, orbY, orbR * 2)
    if (dropped) {
      orbGrad.addColorStop(0, 'rgba(255,217,61,0.9)')
      orbGrad.addColorStop(0.3, 'rgba(255,77,141,0.5)')
      orbGrad.addColorStop(1, 'transparent')
    } else if (faked) {
      orbGrad.addColorStop(0, 'rgba(192,132,252,0.7)')
      orbGrad.addColorStop(0.4, 'rgba(168,85,247,0.3)')
      orbGrad.addColorStop(1, 'transparent')
    } else {
      orbGrad.addColorStop(0, `rgba(192,132,252,${0.2 + intensity * 0.5})`)
      orbGrad.addColorStop(0.5, `rgba(255,77,141,${intensity * 0.2})`)
      orbGrad.addColorStop(1, 'transparent')
    }
    ctx.fillStyle = orbGrad
    ctx.beginPath(); ctx.arc(W * 0.5, orbY, orbR * 2, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = dropped ? 'rgba(255,255,255,0.9)' : faked ? 'rgba(192,132,252,0.6)' : `rgba(200,180,255,${0.3 + intensity * 0.4})`
    ctx.beginPath(); ctx.arc(W * 0.5, orbY, orbR * 0.4, 0, Math.PI * 2); ctx.fill()

    if (dropped) {
      strobeRef.current += 1
      if (strobeRef.current % 4 < 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.fillRect(0, 0, W, H)
      }
    }

    const parts = particles.current
    if (parts.length < (dropped ? 50 : 20) && (building || dropped)) {
      parts.push({
        x: Math.random() * W, y: H, vx: (Math.random() - 0.5) * 2 * d, vy: -(1 + Math.random() * 3) * d, life: 1,
        size: (1 + Math.random() * 3) * d,
        color: dropped ? ['#FFD93D', '#FF4D8D', '#00E5FF', '#A855F7'][Math.floor(Math.random() * 4)] : '#C084FC',
      })
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const pp = parts[i]
      pp.x += pp.vx; pp.y += pp.vy; pp.life -= 0.008
      if (dropped) pp.vx += (Math.random() - 0.5) * 0.3 * d
      if (pp.life <= 0 || pp.y < 0) { parts.splice(i, 1); continue }
      ctx.globalAlpha = pp.life * 0.7
      ctx.fillStyle = pp.color
      ctx.beginPath(); ctx.arc(pp.x, pp.y, pp.size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1

    const pls = playersRef.current
    if (pls.length === 4) {
      const positions = [0.15, 0.38, 0.62, 0.85]
      for (let i = 0; i < 4; i++) {
        const pl = pls[i]
        const px = W * positions[i]
        const py = boothY + 55 * d
        if (pl.isYou) { ctx.shadowColor = C.pink; ctx.shadowBlur = 12 * d }
        ctx.fillStyle = pl.isYou ? 'rgba(255,77,141,0.2)' : 'rgba(255,255,255,0.06)'
        ctx.beginPath(); ctx.arc(px, py, 16 * d, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = pl.isYou ? C.pink : (pl.color || C.text3)
        ctx.lineWidth = 1.5 * d
        ctx.beginPath(); ctx.arc(px, py, 16 * d, 0, Math.PI * 2); ctx.stroke()
        ctx.shadowBlur = 0
        ctx.font = `${14 * d}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(pl.emoji, px, py)
        ctx.font = `bold ${7 * d}px sans-serif`
        ctx.fillStyle = pl.isYou ? C.pink : 'rgba(255,255,255,0.6)'
        ctx.fillText(pl.isYou ? 'YOU' : pl.name.substring(0, 8), px, py + 24 * d)
        ctx.font = `bold ${8 * d}px monospace`
        ctx.fillStyle = C.gold
        ctx.fillText(pl.totalPts + 'pts', px, py + 34 * d)
      }
    }

    if (building && !faked) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const label = intensity > 0.9 ? 'ALMOST...' : intensity > 0.7 ? 'HERE IT COMES...' : intensity > 0.4 ? 'THE DROP IS COMING...' : 'Wait for it...'
      ctx.font = `900 ${(14 + intensity * 6) * d}px sans-serif`
      ctx.fillStyle = intensity > 0.8 ? C.gold : `rgba(192,132,252,${0.5 + intensity * 0.5})`
      if (intensity > 0.7) { ctx.shadowColor = C.gold; ctx.shadowBlur = 10 * d }
      ctx.fillText(label, W * 0.5, H * 0.18)
      ctx.shadowBlur = 0
    }

    if (faked) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.font = `900 ${22 * d}px sans-serif`
      ctx.fillStyle = C.purple
      ctx.shadowColor = C.purple; ctx.shadowBlur = 15 * d
      ctx.fillText('PSYCH!', W * 0.5, H * 0.18)
      ctx.shadowBlur = 0
      ctx.font = `${10 * d}px sans-serif`
      ctx.fillStyle = 'rgba(200,180,255,0.7)'
      ctx.fillText('That was a FAKE drop!', W * 0.5, H * 0.22)
    }

    if (dropped) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.font = `900 ${32 * d}px sans-serif`
      ctx.fillStyle = C.gold
      ctx.shadowColor = C.gold; ctx.shadowBlur = 20 * d
      ctx.fillText('DROP!', W * 0.5, H * 0.16)
      ctx.shadowBlur = 0
      ctx.font = `bold ${13 * d}px sans-serif`
      ctx.fillStyle = C.pink
      ctx.fillText('RELEASE NOW!', W * 0.5, H * 0.21)
    }

    if (holdingRef.current && holdStartRef.current > 0) {
      const holdSec = (Date.now() - holdStartRef.current) / 1000
      const holdPct = Math.min(holdSec / 6, 1)
      const barY = boothY - 10 * d
      const barMaxW = W * 0.6
      const barH = 8 * d
      const barX = (W - barMaxW) / 2
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(barX, barY, barMaxW, barH)
      const isBlinkerHold = holdSec >= 5
      const holdGrad = ctx.createLinearGradient(barX, barY, barX + barMaxW * holdPct, barY)
      holdGrad.addColorStop(0, isBlinkerHold ? C.red : C.pink)
      holdGrad.addColorStop(1, isBlinkerHold ? C.gold : C.purple)
      ctx.fillStyle = holdGrad
      ctx.fillRect(barX, barY, barMaxW * holdPct, barH)
      ctx.textAlign = 'center'; ctx.font = `bold ${8 * d}px sans-serif`
      ctx.fillStyle = isBlinkerHold ? C.gold : C.pink
      ctx.fillText(isBlinkerHold ? 'BLINKER! ' + holdSec.toFixed(1) + 's' : 'Holding... ' + holdSec.toFixed(1) + 's', W * 0.5, barY - 4 * d)
    }

    const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.2, W * 0.5, H * 0.5, W * 0.7)
    vigGrad.addColorStop(0, 'transparent')
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, W, H)
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'beatdrop') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === null || phase === 'intro' || phase === 'final') return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [drawCanvas, phase])

  useEffect(() => {
    if (game.gameActive?.id !== 'beatdrop') return
    ble.registerPuffHandlers('beatdrop', () => startHold(), () => releaseHold())
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      stopAudio()
      if (buildInterval.current) { clearInterval(buildInterval.current); buildInterval.current = null }
      if (dropTimer.current) { clearTimeout(dropTimer.current); dropTimer.current = null }
      if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null }
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'beatdrop') return null

  const isIntro = phase === 'intro'
  const isBuilding = phase === 'building'
  const isDropped = phase === 'dropped'
  const isRoundResult = phase === 'round_result'
  const isFinal = phase === 'final'
  const song = BD_SONGS[round] || BD_SONGS[0]
  const yourScore = players.find(p => p.isYou)?.totalPts || 0
  const sorted = [...players].sort((a, b) => b.totalPts - a.totalPts)
  const yourRank = sorted.findIndex(p => p.isYou) + 1

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none',
      animation: ui.screenShake ? 'shake 0.4s ease' : 'none',
      filter: ui.dimLights ? 'brightness(0.6)' : 'brightness(1)', transition: 'filter 0.3s' }}>
      {ui.screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0,
        background: ui.screenFlash === 'goal' ? 'rgba(255,215,0,0.25)' : ui.screenFlash === 'blinker' ? 'rgba(255,0,200,0.3)' : 'rgba(255,50,50,0.2)',
        animation: 'flashOverlay 0.4s ease forwards' }} />}

      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(255,77,141,0.1)' }}>
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
            <span style={{ fontSize: 10, fontWeight: 800, color: C.pink }}>🎧 BEAT DROP</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{yourScore}pts</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>#{yourRank}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.pink }}>Round {round + 1}/4</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: song.color || C.purple }}>{song.name}</span>
          {isBuilding && <span style={{ fontSize: 8, fontWeight: 700, color: beatIntensity > 0.8 ? C.gold : C.purple }}>{Math.round(beatIntensity * 100)}%</span>}
          {isDropped && <span style={{ fontSize: 8, fontWeight: 900, color: C.gold }}>DROP!</span>}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * BD_DPR)} height={Math.round(600 * BD_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {isIntro && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)' }}>
            {introStep >= 1 && <div style={{ fontSize: 56, marginBottom: 8 }}>🎧</div>}
            {introStep >= 2 && <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, background: `linear-gradient(135deg, ${C.pink}, ${C.purple}, ${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>BEAT DROP</div>}
            {introStep >= 3 && <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700 }}>4 DJs -- RELEASE ON THE DROP!</div>}
            {introStep >= 4 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <span style={{ fontSize: 7, color: p.isYou ? C.pink : p.color, fontWeight: 800, marginTop: 2 }}>{p.isYou ? 'YOU' : p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isRoundResult && lastResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(4,8,18,0.85)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4,
              color: lastResult.label.includes('PERFECT') ? C.gold : lastResult.label.includes('GREAT') ? C.green : lastResult.label.includes('EARLY') ? C.red : C.text2,
              textShadow: lastResult.label.includes('PERFECT') ? `0 0 20px ${C.gold}60` : 'none' }}>{lastResult.label}</div>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 4 }}>
              {lastResult.ms < 9999 ? lastResult.ms + 'ms off the beat' : 'Missed the drop!'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, marginBottom: 8 }}>+{lastResult.pts} pts</div>
            {lastResult.input && lastResult.input !== 'tap' && (
              <div style={{ fontSize: 10, color: lastResult.input === 'blinker' ? C.red : C.purple, fontWeight: 700, marginBottom: 8 }}>
                {lastResult.input === 'blinker' ? 'BLINKER BONUS!' : lastResult.input === 'real_puff' ? 'Real Puff +15%' : 'Dry Puff +5%'}
              </div>
            )}
            <div style={{ width: '85%', maxWidth: 280, marginTop: 8 }}>
              <div style={{ fontSize: 8, color: C.text3, letterSpacing: 2, marginBottom: 4, textAlign: 'center' }}>ROUND {round + 1} STANDINGS</div>
              {sorted.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 2, borderRadius: 6,
                  background: p.isYou ? 'rgba(255,77,141,0.08)' : 'rgba(255,255,255,0.02)', border: p.isYou ? '1px solid rgba(255,77,141,0.15)' : '1px solid transparent' }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? C.gold : C.text3, width: 14 }}>{i + 1}.</span>
                  <span style={{ fontSize: 11 }}>{p.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.isYou ? C.pink : C.text, flex: 1 }}>{p.isYou ? 'You' : p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: 'monospace' }}>{p.totalPts}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isFinal && (() => {
          const won = sorted[0]?.isYou
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', overflowY: 'auto', padding: '20px 0' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '🎧'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.gold : C.pink }}>{won ? 'YOU WIN BEAT DROP!' : 'Beat Drop Complete!'}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>Your rank: #{yourRank} of 4</div>
              <div style={{ width: '85%', maxWidth: 300, marginTop: 16 }}>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>FINAL STANDINGS</div>
                {sorted.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', marginBottom: 3, borderRadius: 8,
                    background: p.isYou ? 'rgba(255,77,141,0.1)' : 'rgba(255,255,255,0.03)', border: p.isYou ? '1px solid rgba(255,77,141,0.2)' : '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? C.gold : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : C.text3, width: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '4.'}</span>
                    <span style={{ fontSize: 14 }}>{p.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.isYou ? C.pink : C.text, flex: 1 }}>{p.isYou ? 'You' : p.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: C.gold, fontFamily: 'monospace' }}>{p.totalPts}</span>
                  </div>
                ))}
              </div>
              {roundResults.length > 0 && (
                <div style={{ width: '85%', maxWidth: 300, marginTop: 12 }}>
                  <div style={{ fontSize: 8, color: C.text3, letterSpacing: 2, marginBottom: 4, textAlign: 'center' }}>YOUR ROUNDS</div>
                  {roundResults.map((r, i) => {
                    const you = r.playerResults.find((pr: any) => pr.name === 'You')
                    return you ? (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', marginBottom: 2, borderRadius: 6, background: 'rgba(255,77,141,0.05)' }}>
                        <span style={{ fontSize: 10, color: C.text2 }}>R{r.round}: {BD_SONGS[i]?.name || '?'}</span>
                        <span style={{ fontSize: 10, color: C.text3 }}>{you.ms < 9999 ? you.ms + 'ms' : '--'}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: you.pts >= 80 ? C.gold : you.pts >= 50 ? C.green : C.text3 }}>+{you.pts}</span>
                      </div>
                    ) : null
                  })}
                </div>
              )}
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: C.text }}>Earned</span>
                  <span style={{ color: C.gold }}>+{won ? 80 : yourRank === 2 ? 40 : yourRank === 3 ? 20 : 10} 🪙</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div onClick={() => { if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null } setPhase(null); startedRef.current = false; startGame() }}
                  style={{ touchAction: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: C.pink + '15', border: '1px solid ' + C.pink + '30', fontSize: 13, fontWeight: 800, color: C.pink }}>Play Again</div>
                <div onClick={exitGame} style={{ touchAction: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: C.text3 + '10', border: '1px solid ' + C.text3 + '20', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
              </div>
            </div>
          )
        })()}

        {/* Controls — three-input */}
        {(isBuilding || isDropped) && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, zIndex: 40, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', padding: '0 12px' }}>
            {charging && (
              <div style={{ width: '90%', maxWidth: 300, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${puffIntensity * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.gold})`, transition: 'width 0.05s' }} />
              </div>
            )}
            {!charging && (
              <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
                <div
                  onClick={(e) => { e.stopPropagation(); if (!holdingRef.current) { startHold(); setTimeout(() => releaseHold(), 80) } }}
                  style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    background: 'linear-gradient(135deg,rgba(255,77,141,0.12),rgba(192,132,252,0.06))', border: '2px solid rgba(255,77,141,0.2)',
                    userSelect: 'none', WebkitUserSelect: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.pink, letterSpacing: 1 }}>TAP</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Quick release</div>
                </div>
                <div
                  onMouseDown={(e) => { e.stopPropagation(); startHold() }}
                  onMouseUp={(e) => { e.stopPropagation(); releaseHold() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startHold() }}
                  onTouchEnd={(e) => { e.stopPropagation(); releaseHold() }}
                  onTouchCancel={(e) => { e.stopPropagation(); releaseHold() }}
                  style={{ touchAction: 'none', flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    background: 'linear-gradient(135deg,rgba(192,132,252,0.12),rgba(255,77,141,0.06))', border: '2px solid rgba(192,132,252,0.25)',
                    userSelect: 'none', WebkitUserSelect: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.purple, letterSpacing: 1 }}>PUFF</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +5%</div>
                </div>
                <div
                  onMouseDown={(e) => { e.stopPropagation(); startHold() }}
                  onMouseUp={(e) => { e.stopPropagation(); releaseHold() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startHold() }}
                  onTouchEnd={(e) => { e.stopPropagation(); releaseHold() }}
                  onTouchCancel={(e) => { e.stopPropagation(); releaseHold() }}
                  style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)',
                    userSelect: 'none', WebkitUserSelect: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+20% if 100ms!</div>
                </div>
              </div>
            )}
            {charging && (
              <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
                <span style={{ fontSize: 11, color: C.purple, fontWeight: 700 }}>HOLDING... release on the DROP!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
