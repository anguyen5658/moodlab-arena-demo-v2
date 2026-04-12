import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

// ── Local constants (lifted from monolith lines 16258-16267) ──
const PD_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const PD_HORSE_EMOJIS = ['\uD83D\uDC0E', '\uD83C\uDFC7', '\uD83E\uDD84', '\uD83D\uDC34', '\uD83C\uDFA0', '\uD83D\uDC2A']
const PD_HORSE_NAMES = ['Thunder Puff', 'Blinker Bolt', 'Cloud Chaser', 'Sativa Sprint', 'Indica Cruise', 'Hybrid Hustle']
const PD_HORSE_STATS = [
  { speed: 1.0, stamina: 0.9, luck: 0.5 },
  { speed: 1.2, stamina: 0.7, luck: 0.3 },
  { speed: 0.8, stamina: 1.2, luck: 0.7 },
  { speed: 1.3, stamina: 0.6, luck: 0.2 },
  { speed: 0.7, stamina: 1.3, luck: 0.8 },
  { speed: 1.0, stamina: 1.0, luck: 0.5 },
]
const PD_AI = [
  { bs: 0.6, bc: 0.15, bz: 2.5, rc: 0.1 },
  { bs: 0.9, bc: 0.25, bz: 3.0, rc: 0.05 },
  { bs: 0.5, bc: 0.08, bz: 1.5, rc: 0.15 },
  { bs: 1.0, bc: 0.3, bz: 3.5, rc: 0.03 },
  { bs: 0.4, bc: 0.05, bz: 1.0, rc: 0.2 },
  { bs: 0.7, bc: 0.18, bz: 2.0, rc: 0.08 },
]

type Phase = 'pick' | 'countdown' | 'racing' | 'result' | null

export const PuffDerbyGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  // ── State (prefix-stripped from pdXxx) ──
  const [phase, setPhase] = useState<Phase>(null)
  const [playerHorse, setPlayerHorse] = useState<number | null>(null)
  const [raceTime, setRaceTime] = useState(30)
  const [puffCount, setPuffCount] = useState(0)
  const [stamina, setStamina] = useState(100)
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const [finishOrder, setFinishOrder] = useState<number[]>([])

  // ── Refs ──
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const aiRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const posRef = useRef<number[]>([0, 0, 0, 0, 0, 0])
  const finishRef = useRef<number[]>([])
  const staminaRef = useRef(100)
  const lastPuffRef = useRef(0)
  const inputModeRef = useRef<'tap' | 'puff' | 'blinker'>('tap')
  const puffHoldingRef = useRef(false)
  const blinkerStartRef = useRef(0)
  const startedRef = useRef(false)

  // Keep refs synced with latest state for handlers
  const phaseRef = useRef<Phase>(null)
  const playerHorseRef = useRef<number | null>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { playerHorseRef.current = playerHorse }, [playerHorse])

  // ── Canvas draw (full port of pdDrawCanvas, lines 16402-16562) ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const dpr = PD_DPR
    ctx.clearRect(0, 0, W, H)
    const pi = playerHorse
    const ph = phase
    const now = Date.now()

    // Dark arena background with gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#071a0d')
    bg.addColorStop(0.3, '#0a2814')
    bg.addColorStop(0.7, '#0d3318')
    bg.addColorStop(1, '#051408')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Pick phase
    if (ph === 'pick') {
      ctx.font = `900 ${24 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#22C55E'
      ctx.shadowColor = '#22C55E'
      ctx.shadowBlur = 15 * dpr
      ctx.fillText('\uD83C\uDFC7 PICK YOUR HORSE', W / 2, H * 0.25)
      ctx.shadowBlur = 0
      ctx.font = `600 ${10 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.35)'
      ctx.fillText('Tap a horse below to select', W / 2, H * 0.31)
      return
    }

    // Countdown phase
    if (ph === 'countdown') {
      ctx.font = `900 ${44 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#FFD93D'
      ctx.shadowColor = '#FFD93D'
      ctx.shadowBlur = 25 * dpr
      ctx.fillText('GET READY!', W / 2, H * 0.4)
      ctx.shadowBlur = 0
      if (pi !== null) {
        ctx.font = `${60 * dpr}px sans-serif`
        ctx.fillText(PD_HORSE_EMOJIS[pi], W / 2, H * 0.55)
      }
      ctx.font = `700 ${14 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.6)'
      ctx.fillText(PD_HORSE_NAMES[pi !== null ? pi : 0], W / 2, H * 0.64)
      return
    }

    // Crowd stands
    ctx.fillStyle = 'rgba(30,25,15,0.5)'
    ctx.fillRect(0, 0, W, H * 0.08)
    for (let i = 0; i < 30; i++) {
      const bounce = Math.sin(now / 300 + i * 0.5) * 2
      ctx.font = `${8 * dpr}px sans-serif`
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(now / 500 + i) * 0.05})`
      ctx.fillText(i % 5 === 0 ? '\uD83C\uDFC7' : '\uD83D\uDC64', W * 0.03 + i * W * 0.032, H * 0.05 + bounce * dpr)
    }

    // Track lanes
    const trackTop = H * 0.1
    const trackH = H * 0.62
    const laneH = trackH / 6
    const trackStartX = 10 * dpr
    const finishX = W * 0.9
    const trackW = finishX - trackStartX

    for (let i = 0; i < 6; i++) {
      const y = trackTop + i * laneH
      const isP = i === pi
      if (isP) {
        const lg = ctx.createLinearGradient(0, y, 0, y + laneH)
        lg.addColorStop(0, 'rgba(0,229,255,0.08)')
        lg.addColorStop(0.5, 'rgba(0,229,255,0.04)')
        lg.addColorStop(1, 'rgba(0,229,255,0.08)')
        ctx.fillStyle = lg
        ctx.fillRect(0, y, W, laneH)
        ctx.strokeStyle = 'rgba(0,229,255,0.15)'
        ctx.lineWidth = 1 * dpr
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y + laneH)
        ctx.lineTo(W, y + laneH)
        ctx.stroke()
      } else {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.06)'
        ctx.fillRect(0, y, W, laneH)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, y + laneH)
        ctx.lineTo(W, y + laneH)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255,217,61,0.08)'
      ctx.fillRect(finishX, y, W - finishX, laneH)
      ctx.textAlign = 'left'
      ctx.font = `800 ${10 * dpr}px sans-serif`
      ctx.fillStyle = isP ? '#00E5FF' : 'rgba(232,235,246,0.35)'
      ctx.fillText(i + 1 + '.', 4 * dpr, y + laneH * 0.45)
      ctx.font = `700 ${9 * dpr}px sans-serif`
      ctx.fillStyle = isP ? 'rgba(0,229,255,0.8)' : 'rgba(232,235,246,0.25)'
      ctx.fillText(PD_HORSE_NAMES[i], 16 * dpr, y + laneH * 0.45)
      if (isP) {
        ctx.font = `600 ${7 * dpr}px sans-serif`
        ctx.fillStyle = 'rgba(0,229,255,0.5)'
        ctx.fillText('(YOU)', 16 * dpr, y + laneH * 0.72)
      }
      const pos = positions[i] || 0
      const horseX = trackStartX + (pos / 100) * trackW
      const fin = finishOrder.includes(i)
      const pl = finishOrder.indexOf(i) + 1
      const horseCy = y + laneH * 0.55
      if (pos > 3) {
        const trailLen = Math.min(pos * 0.4, 30) * dpr
        const trailG = ctx.createLinearGradient(horseX - trailLen, horseCy, horseX, horseCy)
        trailG.addColorStop(0, 'transparent')
        trailG.addColorStop(1, isP ? 'rgba(0,229,255,0.15)' : 'rgba(34,197,94,0.08)')
        ctx.fillStyle = trailG
        ctx.fillRect(horseX - trailLen, y + laneH * 0.25, trailLen, laneH * 0.5)
      }
      const hSize = isP ? 28 * dpr : 22 * dpr
      ctx.font = `${hSize}px sans-serif`
      ctx.textAlign = 'center'
      if (isP) {
        ctx.shadowColor = '#00E5FF'
        ctx.shadowBlur = 12 * dpr
      } else if (fin && pl <= 3) {
        ctx.shadowColor = '#FFD93D'
        ctx.shadowBlur = 6 * dpr
      }
      ctx.fillText(PD_HORSE_EMOJIS[i], horseX, horseCy + hSize * 0.15)
      ctx.shadowBlur = 0
      ctx.textAlign = 'right'
      if (fin) {
        const medal = pl === 1 ? '\uD83E\uDD47' : pl === 2 ? '\uD83E\uDD48' : pl === 3 ? '\uD83E\uDD49' : ''
        ctx.font = `900 ${10 * dpr}px sans-serif`
        ctx.fillStyle = pl === 1 ? '#FFD93D' : pl <= 3 ? '#22C55E' : 'rgba(232,235,246,0.35)'
        ctx.fillText(medal + ' #' + pl, W - 4 * dpr, y + laneH * 0.55)
      } else {
        ctx.font = `700 ${9 * dpr}px sans-serif`
        ctx.fillStyle = isP ? 'rgba(0,229,255,0.7)' : 'rgba(232,235,246,0.3)'
        ctx.fillText(Math.round(pos) + '%', W - 4 * dpr, y + laneH * 0.55)
      }
      ctx.textAlign = 'center'
    }

    // Finish line
    const dashOffset = (now / 100) % (8 * dpr)
    ctx.strokeStyle = 'rgba(255,217,61,0.5)'
    ctx.lineWidth = 2.5 * dpr
    ctx.setLineDash([5 * dpr, 3 * dpr])
    ctx.lineDashOffset = dashOffset
    ctx.beginPath()
    ctx.moveTo(finishX, trackTop)
    ctx.lineTo(finishX, trackTop + trackH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.lineDashOffset = 0

    // Stamina bar
    const stY = trackTop + trackH + 14 * dpr
    const stH = 12 * dpr
    const stW = W * 0.75
    const stX = (W - stW) / 2
    const stC = stamina > 60 ? '#22C55E' : stamina > 30 ? '#FFD93D' : '#EF4444'
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.beginPath()
    ;(ctx as any).roundRect?.(stX, stY, stW, stH, 6 * dpr)
    ctx.fill()
    const stFill = ctx.createLinearGradient(stX, stY, stX + (stW * stamina) / 100, stY)
    stFill.addColorStop(0, stC)
    stFill.addColorStop(1, stC + '90')
    ctx.fillStyle = stFill
    ctx.beginPath()
    ;(ctx as any).roundRect?.(stX, stY, stW * Math.max(0.01, stamina / 100), stH, 6 * dpr)
    ctx.fill()
    ctx.font = `800 ${9 * dpr}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillStyle = stC
    ctx.fillText('\u26A1 ' + Math.round(stamina) + '%', stX, stY - 4 * dpr)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(232,235,246,0.5)'
    ctx.fillText('Puffs: ' + puffCount, stX + stW, stY - 4 * dpr)
    if (stamina <= 0) {
      ctx.font = `800 ${11 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#EF4444'
      ctx.fillText('EXHAUSTED! \u26A0\uFE0F', W / 2, stY + stH + 14 * dpr)
    }

    // Live standings
    if (ph === 'racing') {
      const ranked = [0, 1, 2, 3, 4, 5].slice().sort((a, b) => (positions[b] || 0) - (positions[a] || 0))
      const rankY = stY + stH + (stamina <= 0 ? 28 : 14) * dpr
      ctx.font = `700 ${8 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(232,235,246,0.3)'
      ctx.fillText('LIVE STANDINGS', W / 2, rankY)
      ranked.forEach((idx, rank) => {
        const rx = W * 0.08 + rank * W * 0.15
        const ry2 = rankY + 14 * dpr
        const isP2 = idx === pi
        ctx.font = `${14 * dpr}px sans-serif`
        ctx.fillText(PD_HORSE_EMOJIS[idx], rx, ry2)
        ctx.font = `700 ${7 * dpr}px sans-serif`
        ctx.fillStyle = rank === 0 ? '#FFD93D' : rank <= 2 ? '#22C55E' : 'rgba(232,235,246,0.3)'
        ctx.fillText('#' + (rank + 1), rx, ry2 + 12 * dpr)
        if (isP2) {
          ctx.fillStyle = '#00E5FF'
          ctx.fillText('YOU', rx, ry2 + 20 * dpr)
        }
        ctx.fillStyle = 'rgba(232,235,246,0.3)'
      })
    }

    // Result overlay
    if (ph === 'result' && finishOrder.length > 0) {
      ctx.fillStyle = 'rgba(4,10,4,0.75)'
      ctx.fillRect(0, 0, W, H)
      const place = pi !== null ? finishOrder.indexOf(pi) + 1 : 0
      const medal = place === 1 ? '\uD83E\uDD47' : place === 2 ? '\uD83E\uDD48' : place === 3 ? '\uD83E\uDD49' : '\uD83C\uDFC7'
      ctx.font = `${40 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(medal, W / 2, H * 0.32)
      ctx.font = `900 ${24 * dpr}px sans-serif`
      ctx.fillStyle = place === 1 ? '#FFD93D' : place <= 3 ? '#22C55E' : 'rgba(232,235,246,0.6)'
      ctx.shadowColor = ctx.fillStyle as string
      ctx.shadowBlur = 15 * dpr
      ctx.fillText(place === 1 ? 'WINNER!' : '#' + place + ' PLACE', W / 2, H * 0.4)
      ctx.shadowBlur = 0
      ctx.font = `600 ${11 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.5)'
      finishOrder.slice(0, 6).forEach((hI, pl) => {
        const ry = H * 0.46 + pl * 14 * dpr
        const isYou = hI === pi
        ctx.fillStyle = isYou ? '#00E5FF' : 'rgba(232,235,246,0.4)'
        ctx.textAlign = 'center'
        ctx.fillText('#' + (pl + 1) + ' ' + PD_HORSE_EMOJIS[hI] + ' ' + PD_HORSE_NAMES[hI] + (isYou ? ' (YOU)' : ''), W / 2, ry)
      })
    }
  }, [phase, playerHorse, positions, finishOrder, stamina, puffCount])

  // ── Animation loop (Rule 4: restart every render) ──
  useEffect(() => {
    if (!phase) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const loop = () => {
      drawCanvas()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [drawCanvas, phase])

  // ── Game logic ──
  const endRace = useCallback((pi: number) => {
    if (aiRef.current) { clearInterval(aiRef.current); aiRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const fin = [...finishRef.current]
    const rem = [0, 1, 2, 3, 4, 5].filter(i => !fin.includes(i))
    rem.sort((a, b) => posRef.current[b] - posRef.current[a])
    const fo = [...fin, ...rem]
    setFinishOrder(fo)
    finishRef.current = fo
    const place = fo.indexOf(pi) + 1
    audio.playFx(place <= 2 ? 'win' : 'lose')
    player.recordGameResult(place <= 2, place <= 2 ? 30 : 5, place <= 2 ? 20 : 8, {
      bleConnected: ble.bleConnected,
      zone: 'arcade',
      gameActive: game.gameActive,
    })
    setPhase('result')
    phaseRef.current = 'result'
    if (place === 1) {
      ui.setScreenFlash('goal')
      setTimeout(() => ui.setScreenFlash(null), 400)
      audio.playFx('crowd')
      player.spawnConfetti(30, [C.green, C.gold, C.cyan, C.pink])
    } else if (place > 3) {
      // better luck
    }
  }, [audio, ble.bleConnected, game.gameActive, player, ui])

  const startRace = useCallback((pi: number) => {
    posRef.current = [0, 0, 0, 0, 0, 0]
    finishRef.current = []
    staminaRef.current = 100
    lastPuffRef.current = Date.now()
    let tl = 30
    setRaceTime(30)
    aiRef.current = setInterval(() => {
      if (Date.now() - lastPuffRef.current > 500) {
        staminaRef.current = Math.min(100, staminaRef.current + 0.6)
        setStamina(Math.round(staminaRef.current))
      }
      const np = [...posRef.current]
      const mpHorseCount = ble.mpActive && (ble.ssPlayerCount || 0) >= 2 ? (ble.ssPlayerCount || 0) : 0
      for (let i = 0; i < 6; i++) {
        if (i === pi || finishRef.current.includes(i)) continue
        if (mpHorseCount > 0 && i < mpHorseCount) continue
        const p = PD_AI[i]
        let mv = p.bs * (0.6 + Math.random() * 0.8)
        if (Math.random() < p.bc) mv += p.bz
        if (Math.random() < p.rc) mv = 0
        if (np[i] > 70) mv *= 1.2
        if (np[i] > 90) mv *= 1.1
        np[i] = Math.min(100, np[i] + mv * 0.16)
        if (np[i] >= 100 && !finishRef.current.includes(i)) {
          finishRef.current = [...finishRef.current, i]
          setFinishOrder([...finishRef.current])
        }
      }
      if (np[pi] >= 100 && !finishRef.current.includes(pi)) {
        finishRef.current = [...finishRef.current, pi]
        setFinishOrder([...finishRef.current])
      }
      posRef.current = np
      setPositions([...np])
      if (finishRef.current.length >= 6) endRace(pi)
    }, 50)
    timerRef.current = setInterval(() => {
      tl--
      setRaceTime(tl)
      if (tl <= 0) endRace(pi)
    }, 1000)
  }, [ble.mpActive, ble.ssPlayerCount, endRace])

  const pickHorse = useCallback((idx: number) => {
    setPlayerHorse(idx)
    playerHorseRef.current = idx
    audio.playFx('click')
    setPhase('countdown')
    phaseRef.current = 'countdown'
    let c = 3
    const cd = setInterval(() => {
      c--
      if (c <= 0) {
        clearInterval(cd)
        setPhase('racing')
        phaseRef.current = 'racing'
        audio.playFx('whistle')
        ui.setScreenFlash('goal')
        setTimeout(() => ui.setScreenFlash(null), 400)
        startRace(idx)
      }
    }, 800)
  }, [audio, startRace, ui])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setRaceTime(30)
    setPuffCount(0)
    setStamina(100)
    staminaRef.current = 100
    setPositions([0, 0, 0, 0, 0, 0])
    posRef.current = [0, 0, 0, 0, 0, 0]
    setFinishOrder([])
    finishRef.current = []
    lastPuffRef.current = 0
    inputModeRef.current = 'tap'
    puffHoldingRef.current = false

    if (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) {
      setPlayerHorse(0)
      playerHorseRef.current = 0
      audio.playFx('crowd')
      setPhase('countdown')
      phaseRef.current = 'countdown'
      let c = 3
      const cd = setInterval(() => {
        c--
        if (c <= 0) {
          clearInterval(cd)
          setPhase('racing')
          phaseRef.current = 'racing'
          audio.playFx('whistle')
          ui.setScreenFlash('goal')
          setTimeout(() => ui.setScreenFlash(null), 400)
          startRace(0)
        }
      }, 800)
    } else {
      setPlayerHorse(null)
      playerHorseRef.current = null
      setPhase('pick')
      phaseRef.current = 'pick'
      audio.playFx('crowd')
    }
  }, [audio, ble.mpActive, ble.ssPlayerCount, startRace, ui])

  const doPuffTap = useCallback(() => {
    if (phaseRef.current !== 'racing' || playerHorseRef.current === null) return
    const idx = playerHorseRef.current
    lastPuffRef.current = Date.now()
    setPuffCount(p => p + 1)
    audio.playFx('derby_boost')
    inputModeRef.current = 'tap'
    let boost = 1 + Math.random() * 0.5
    if (staminaRef.current <= 0) boost = 0.5
    else {
      staminaRef.current = Math.max(0, staminaRef.current - 1)
      setStamina(Math.round(staminaRef.current))
    }
    const np = [...posRef.current]
    np[idx] = Math.min(100, np[idx] + boost)
    posRef.current = np
    setPositions([...np])
    if (np[idx] >= 100 && !finishRef.current.includes(idx)) {
      finishRef.current = [...finishRef.current, idx]
      setFinishOrder([...finishRef.current])
    }
  }, [audio])

  const puffStart = useCallback(() => {
    if (phaseRef.current !== 'racing' || playerHorseRef.current === null) return
    puffHoldingRef.current = true
    blinkerStartRef.current = Date.now()
  }, [])

  const puffRelease = useCallback(() => {
    if (!puffHoldingRef.current) return
    puffHoldingRef.current = false
    const holdDur = (Date.now() - blinkerStartRef.current) / 1000
    const idx = playerHorseRef.current
    if (idx === null) return
    lastPuffRef.current = Date.now()
    setPuffCount(p => p + 1)
    const isBlinker = holdDur >= 5.0
    const isPuff = holdDur >= 0.3
    inputModeRef.current = isBlinker ? 'blinker' : isPuff ? 'puff' : 'tap'
    let boost: number
    let staminaCost: number
    if (isBlinker) {
      boost = 10 + Math.random() * 3
      staminaCost = 25
      audio.playFx('crowd')
    } else if (isPuff) {
      boost = 3 + Math.random() * 1.5
      staminaCost = 4
      audio.playFx('derby_boost')
    } else {
      boost = 1 + Math.random() * 0.5
      staminaCost = 1
      audio.playFx('derby_boost')
    }
    if (staminaRef.current <= 0) {
      boost = 0.5
      staminaCost = 0
    } else {
      staminaRef.current = Math.max(0, staminaRef.current - staminaCost)
      setStamina(Math.round(staminaRef.current))
    }
    const np = [...posRef.current]
    np[idx] = Math.min(100, np[idx] + boost)
    posRef.current = np
    setPositions([...np])
    if (np[idx] >= 100 && !finishRef.current.includes(idx)) {
      finishRef.current = [...finishRef.current, idx]
      setFinishOrder([...finishRef.current])
    }
  }, [audio])

  const cleanup = useCallback(() => {
    if (aiRef.current) { clearInterval(aiRef.current); aiRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    audio.gameSoundsMuted.current = true
    setPhase(null)
    phaseRef.current = null
  }, [audio])

  // ── Auto-start on mount ──
  useEffect(() => {
    if (game.gameActive?.id === 'puffderby' && !startedRef.current) {
      startedRef.current = true
      startGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Per-slot multiplayer puff: each slot boosts its own horse
  const mpSlotHolding = useRef<boolean[]>([false, false, false, false])
  const mpSlotStart = useRef<number[]>([0, 0, 0, 0])

  const puffForSlot = useCallback((slotIdx: number) => {
    if (phaseRef.current !== 'racing') return
    mpSlotHolding.current[slotIdx] = false
    const holdDur = (Date.now() - mpSlotStart.current[slotIdx]) / 1000
    const isBlinker = holdDur >= 5.0
    const isPuff = holdDur >= 0.3
    const boost = isBlinker ? 10 + Math.random() * 3 : isPuff ? 3 + Math.random() * 1.5 : 1.5 + Math.random()
    setPositions(prev => prev.map((p, i) => i === slotIdx ? Math.min(100, p + boost) : p))
  }, [])

  // ── BLE registration ──
  useEffect(() => {
    if (game.gameActive?.id !== 'puffderby') return
    // Solo mode: all slots → player's horse
    ble.registerPuffHandlers('puffderby', () => puffStart(), () => puffRelease())
    // Multiplayer mode: each slot → own horse
    if (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) {
      const slotCount = ble.ssPlayerCount || 2
      const handlers: { [slot: number]: { down: (() => void) | null; up: (() => void) | null } } = {}
      // Slot 0 = player's horse (existing handlers)
      handlers[0] = { down: () => puffStart(), up: () => puffRelease() }
      // Slots 1+ = each boosts their own horse
      for (let s = 1; s < slotCount; s++) {
        const slot = s
        handlers[slot] = {
          down: () => { mpSlotHolding.current[slot] = true; mpSlotStart.current[slot] = Date.now() },
          up: () => puffForSlot(slot),
        }
      }
      ble.registerSlotPuffHandlers(handlers)
    }
    return () => {
      audio.gameSoundsMuted.current = true
      if (aiRef.current) { clearInterval(aiRef.current); aiRef.current = null }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id, ble.mpActive, ble.ssPlayerCount])

  const handleBack = () => {
    audio.playFx('click')
    cleanup()
    game.exitGame()
  }

  const handleRaceAgain = () => {
    cleanup()
    startedRef.current = false
    setTimeout(() => {
      startedRef.current = true
      startGame()
    }, 50)
  }

  // ── Render ──
  if (!phase) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none',
        animation: ui.screenShake ? 'shake 0.4s ease' : 'none',
      }}
    >
      {ui.screenFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
            pointerEvents: 'none',
            opacity: 0,
            background: ui.screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.2)',
            animation: 'flashOverlay 0.4s ease forwards',
          }}
        />
      )}
      {player.confettiParticles.map((p: any) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x + '%',
            top: p.y + '%',
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 1,
            transform: 'rotate(' + (p.rot || 0) + 'deg)',
            zIndex: 210,
            pointerEvents: 'none',
            animation: 'confettiFall 1.5s ease-out forwards',
          }}
        />
      ))}

      {/* HEADER */}
      <div
        style={{
          position: 'relative',
          zIndex: 50,
          flexShrink: 0,
          background: 'rgba(6,16,30,0.98)',
          borderBottom: '1px solid rgba(34,197,94,0.1)',
        }}
      >
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
              Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div
              onClick={() => {
                audio.playFx('click')
                game.setShowBlePopup(true)
              }}
              data-btn="true"
              style={{
                touchAction: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 8px',
                borderRadius: 100,
                cursor: 'pointer',
                background: ble.bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)',
                border: '1px solid ' + (ble.bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'),
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ble.bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: ble.bleConnected ? C.green : C.orange }}>
                {ble.bleConnected ? 'Puff' : 'Connect'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '2px 7px',
                borderRadius: 100,
                background: 'rgba(255,217,61,0.06)',
                border: '1px solid rgba(255,217,61,0.12)',
              }}
            >
              <span style={{ fontSize: 9 }}>{'\uD83E\uDE99'}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>
                {player.coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            onClick={handleBack}
            data-btn="true"
            style={{
              touchAction: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              cursor: 'pointer',
              padding: '3px 8px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid ' + C.border,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, color: C.text2 }}>{'\u2190'}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.green }}>{'\uD83C\uDFC7'} PUFF DERBY</span>
            {phase === 'racing' && (
              <span style={{ fontSize: 9, fontWeight: 700, color: raceTime <= 10 ? C.red : C.gold }}>{raceTime}s</span>
            )}
            {playerHorse !== null && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>{PD_HORSE_EMOJIS[playerHorse]}</span>
            )}
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color:
                phase === 'racing'
                  ? C.green
                  : phase === 'result'
                  ? playerHorse !== null && finishOrder.indexOf(playerHorse) === 0
                    ? C.gold
                    : C.text3
                  : C.text3,
            }}
          >
            {phase === 'pick'
              ? 'Choose your horse!'
              : phase === 'countdown'
              ? 'Gates opening...'
              : phase === 'racing'
              ? 'RACE! Tap/Puff/Blinker!'
              : phase === 'result'
              ? 'Race Over'
              : '...'}
          </span>
          {phase === 'racing' && (
            <span style={{ fontSize: 9, color: stamina > 60 ? C.green : stamina > 30 ? C.gold : C.red, fontWeight: 700 }}>
              STA:{Math.round(stamina)}%
            </span>
          )}
        </div>
      </div>

      {/* Canvas + Controls */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={Math.round(420 * PD_DPR)}
          height={Math.round(600 * PD_DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />

        {/* Controls slot (bottom) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
            width: '100%',
            zIndex: 20,
          }}
        >
          {phase === 'pick' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, width: '90%', maxWidth: 360 }}>
              {PD_HORSE_NAMES.map((h, i) => (
                <div
                  key={i}
                  data-btn="true"
                  onClick={(e) => {
                    e.stopPropagation()
                    pickHorse(i)
                  }}
                  style={{
                    touchAction: 'none',
                    padding: '8px 4px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}
                >
                  <div style={{ fontSize: 22 }}>{PD_HORSE_EMOJIS[i]}</div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: C.text, marginTop: 2 }}>{h}</div>
                  <div style={{ fontSize: 7, color: C.cyan }}>
                    SPD:{PD_HORSE_STATS[i].speed.toFixed(1)} STA:{PD_HORSE_STATS[i].stamina.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase === 'racing' && (
            <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
              <div
                data-btn="true"
                onClick={(e) => {
                  e.stopPropagation()
                  doPuffTap()
                }}
                style={{
                  touchAction: 'none',
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: 'rgba(34,197,94,0.08)',
                  border: '2px solid rgba(34,197,94,0.2)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: C.green, letterSpacing: 1 }}>TAP</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+1% speed</div>
              </div>
              <div
                data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); puffStart() }}
                onMouseUp={(e) => { e.stopPropagation(); puffRelease() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); puffStart() }}
                onTouchEnd={(e) => { e.stopPropagation(); puffRelease() }}
                onTouchCancel={(e) => { e.stopPropagation(); puffRelease() }}
                style={{
                  touchAction: 'none',
                  flex: 1.3,
                  padding: '12px 0',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: 'rgba(34,197,94,0.12)',
                  border: '2px solid rgba(34,197,94,0.3)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: C.green, letterSpacing: 1 }}>PUFF</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+3% -stamina</div>
              </div>
              <div
                data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); puffStart() }}
                onMouseUp={(e) => { e.stopPropagation(); puffRelease() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); puffStart() }}
                onTouchEnd={(e) => { e.stopPropagation(); puffRelease() }}
                onTouchCancel={(e) => { e.stopPropagation(); puffRelease() }}
                style={{
                  touchAction: 'none',
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: 'rgba(255,50,50,0.1)',
                  border: '2px solid rgba(255,50,50,0.25)',
                  animation: 'countPulse 1.5s infinite',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>5s+ MEGA</div>
              </div>
            </div>
          )}

          {phase === 'result' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <div
                data-btn="true"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRaceAgain()
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: C.green + '15',
                  border: '1px solid ' + C.green + '30',
                  fontSize: 13,
                  fontWeight: 800,
                  color: C.green,
                }}
              >
                Race Again
              </div>
              <div
                data-btn="true"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBack()
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: C.text3 + '10',
                  border: '1px solid ' + C.text3 + '20',
                  fontSize: 13,
                  fontWeight: 800,
                  color: C.text3,
                }}
              >
                Done
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
