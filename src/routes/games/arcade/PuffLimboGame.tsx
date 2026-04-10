import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'

// ── Puff Limbo — V3 Canvas DPR Engine (ported from monolith ~L15705–15938, render ~L19675) ──

const PL_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const PL_TARGETS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0]
const PL_NAMES = [
  'CloudChaser99', 'BlinkerBetty', 'THC_Tony', 'VapeLord69', 'DabQueen',
  'PuffDaddy_Jr', 'SmokeRing_Steve', 'HazeDaze', 'KushKing', 'FogMachine',
  'MistWalker', 'NebulaNick', 'GreenGoblin', 'SkyHighSam', 'TokeToken',
  'LitLenny', 'BubbleBoi', 'RipTide', 'SeshGremlin', 'GlassHouse',
]

type Phase = null | 'intro' | 'ready' | 'puffing' | 'result' | 'eliminated' | 'champion' | 'final'

interface RoundResult {
  round: number
  target: number
  time: number
  survived: boolean
}

export const PuffLimboGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const { gameActive, exitGame } = game
  const { recordGameResult, spawnConfetti } = player
  const { registerPuffHandlers, bleConnected, bleDevices, bleDevicesRef, mpActive, ssPlayerCount, partyPlayerNames } = ble
  const { playFx, gameSoundsMuted } = audio

  // ── State ──
  const [plPhase, setPlPhase] = useState<Phase>(null)
  const [plTarget, setPlTarget] = useState<number>(PL_TARGETS[0])
  const [plRound, setPlRound] = useState<number>(0)
  const [plHolding, setPlHolding] = useState<boolean>(false)
  const [plPuffTime, setPlPuffTime] = useState<number>(0)
  const [, setPlSurvived] = useState<boolean>(true)
  const [plPlayers, setPlPlayers] = useState<number>(8)
  const [, setPlEliminatedList] = useState<string[]>([])
  const [plRoundResults, setPlRoundResults] = useState<RoundResult[]>([])

  // ── Refs ──
  const plCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const plAnimRef = useRef<number | null>(null)
  const plPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const plHoldStart = useRef<number>(0)
  const plGuardRef = useRef<{ v: boolean }>({ v: true })
  const plMpRef = useRef<{
    holding: boolean[]
    startTime: number[]
    alive: boolean[]
    submitted: boolean[]
    count: number
  } | null>(null)

  // Latest-state refs (for handlers registered once via useEffect)
  const plPhaseRef = useRef<Phase>(null)
  const plHoldingRef = useRef<boolean>(false)
  const plRoundRef = useRef<number>(0)
  const plPlayersRef = useRef<number>(8)
  useEffect(() => { plPhaseRef.current = plPhase }, [plPhase])
  useEffect(() => { plHoldingRef.current = plHolding }, [plHolding])
  useEffect(() => { plRoundRef.current = plRound }, [plRound])
  useEffect(() => { plPlayersRef.current = plPlayers }, [plPlayers])

  // ── Cleanup ──
  const plCleanup = useCallback(() => {
    gameSoundsMuted.current = true
    if (plPuffInterval.current) { clearInterval(plPuffInterval.current); plPuffInterval.current = null }
    if (plAnimRef.current) { cancelAnimationFrame(plAnimRef.current); plAnimRef.current = null }
    plGuardRef.current.v = false
    setPlPhase(null)
    exitGame()
  }, [exitGame, gameSoundsMuted])

  // ── Core puff handlers ──
  const plStartPuff = useCallback(() => {
    if (plPhaseRef.current !== 'ready') return
    if (plHoldingRef.current) return
    setPlHolding(true)
    setPlPuffTime(0)
    plHoldStart.current = Date.now()
    setPlPhase('puffing')
    plPuffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - plHoldStart.current) / 1000
      setPlPuffTime(elapsed)
      if (elapsed >= 6.0) plReleasePuffRef.current?.()
    }, 50)
  }, [])

  const plStartRoundRef = useRef<((roundNum: number, players: number) => void) | null>(null)
  const plReleasePuffRef = useRef<(() => void) | null>(null)

  const plReleasePuff = useCallback(() => {
    if (!plHoldingRef.current && plPhaseRef.current !== 'puffing') return
    if (plPuffInterval.current) { clearInterval(plPuffInterval.current); plPuffInterval.current = null }
    setPlHolding(false)
    const elapsed = (Date.now() - plHoldStart.current) / 1000
    setPlPuffTime(elapsed)
    const guard = plGuardRef.current
    if (!guard.v) return
    const roundIdx = plRoundRef.current
    const target = PL_TARGETS[roundIdx]
    const deviation = Math.abs(elapsed - target)
    const survived = deviation <= 0.3
    const isBlinker = elapsed >= 5.0
    let eliminatedCount = 0
    const failChance = target >= 4.0 ? 0.4 : target >= 3.0 ? 0.25 : 0.15
    const currentPlayers = plPlayersRef.current
    for (let i = 0; i < currentPlayers - 1; i++) {
      if (Math.random() < failChance) eliminatedCount++
    }
    const newPlayers = Math.max(1, currentPlayers - eliminatedCount - (survived ? 0 : 1))
    const newEliminated: string[] = []
    for (let i = 0; i < eliminatedCount; i++) {
      newEliminated.push(PL_NAMES[Math.floor(Math.random() * PL_NAMES.length)])
    }
    setPlPlayers(survived ? newPlayers + 1 : newPlayers)
    if (!survived) {
      setPlSurvived(false)
      setPlPhase('eliminated')
      playFx('error')
    } else {
      setPlSurvived(true)
      setPlPhase('result')
      setPlEliminatedList(prev => [...prev, ...newEliminated])
      setPlRoundResults(prev => [...prev, { round: roundIdx + 1, target, time: elapsed, survived: true }])
      if (isBlinker) {
        playFx('goal')
        spawnConfetti(50, [C.orange, C.red, C.gold])
      } else {
        playFx('success')
      }
    }
    setTimeout(() => {
      if (!guard.v) return
      if (!survived) {
        recordGameResult(false, 12, 8, { bleConnected, zone: 'arcade', gameActive })
        setPlPhase('final')
        playFx('lose')
      } else {
        plStartRoundRef.current?.(roundIdx + 1, newPlayers + 1)
      }
    }, 2500)
  }, [bleConnected, gameActive, playFx, recordGameResult, spawnConfetti])

  useEffect(() => { plReleasePuffRef.current = plReleasePuff }, [plReleasePuff])

  const plStartRound = useCallback((roundNum: number, players: number) => {
    const guard = plGuardRef.current
    if (!guard.v) return
    if (roundNum >= 8) {
      setPlPhase('champion')
      recordGameResult(true, 80, 20, { bleConnected, zone: 'arcade', gameActive })
      spawnConfetti(80, [C.gold, C.orange, C.red, C.pink])
      playFx('win')
      setTimeout(() => { if (!guard.v) return; setPlPhase('final') }, 3000)
      return
    }
    const target = PL_TARGETS[roundNum]
    setPlRound(roundNum)
    setPlTarget(target)
    setPlPuffTime(0)
    setPlHolding(false)
    setPlSurvived(true)
    setPlPhase('ready')
    void players
    const mp = plMpRef.current
    if (mp) {
      mp.holding = [false, false, false, false]
      mp.startTime = [0, 0, 0, 0]
      mp.submitted = [false, false, false, false]
    }
    if (target >= 4.0) playFx('tension')
  }, [bleConnected, gameActive, playFx, recordGameResult, spawnConfetti])

  useEffect(() => { plStartRoundRef.current = plStartRound }, [plStartRound])

  // ── MP slot-aware handlers ──
  const plStartPuffSlot = useCallback((slotIdx: number) => {
    if (slotIdx === 0) { plStartPuff(); return }
    const mp = plMpRef.current
    if (!mp || !mp.alive[slotIdx] || mp.submitted[slotIdx]) return
    if (plPhaseRef.current !== 'ready') return
    mp.holding[slotIdx] = true
    mp.startTime[slotIdx] = Date.now()
  }, [plStartPuff])

  const plReleasePuffSlot = useCallback((slotIdx: number) => {
    if (slotIdx === 0) { plReleasePuff(); return }
    const mp = plMpRef.current
    if (!mp || !mp.holding[slotIdx]) return
    mp.holding[slotIdx] = false
    const elapsed = (Date.now() - mp.startTime[slotIdx]) / 1000
    const target = PL_TARGETS[plRoundRef.current]
    const deviation = Math.abs(elapsed - target)
    const survived = deviation <= 0.3
    if (!survived) {
      mp.alive[slotIdx] = false
      void (partyPlayerNames[slotIdx] || 'P' + (slotIdx + 1))
    }
    mp.submitted[slotIdx] = true
  }, [partyPlayerNames, plReleasePuff])

  // ── Start game ──
  const startPuffLimbo = useCallback(() => {
    gameSoundsMuted.current = false
    plGuardRef.current = { v: true }
    setPlRound(0)
    setPlTarget(PL_TARGETS[0])
    setPlPlayers(8)
    setPlSurvived(true)
    setPlPuffTime(0)
    setPlHolding(false)
    setPlEliminatedList([])
    setPlRoundResults([])
    const plMpCount = mpActive ? Math.min(ssPlayerCount || 2, 4) : 0
    plMpRef.current = {
      holding: [false, false, false, false],
      startTime: [0, 0, 0, 0],
      alive: [true, true, true, true],
      submitted: [false, false, false, false],
      count: plMpCount,
    }
    setPlPhase('intro')
    playFx('crowd')
    const guard = plGuardRef.current
    setTimeout(() => { if (!guard.v) return; plStartRoundRef.current?.(0, 8) }, 2500)
  }, [gameSoundsMuted, mpActive, playFx, ssPlayerCount])

  // ── Auto-start on mount ──
  useEffect(() => {
    startPuffLimbo()
    return () => {
      gameSoundsMuted.current = true
      if (plPuffInterval.current) { clearInterval(plPuffInterval.current); plPuffInterval.current = null }
      if (plAnimRef.current) { cancelAnimationFrame(plAnimRef.current); plAnimRef.current = null }
      plGuardRef.current.v = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── BLE puff handlers (Rule 3 — lazy wrappers) ──
  useEffect(() => {
    if (!gameActive || gameActive.id !== 'pufflimbo') return
    if (mpActive && plMpRef.current && plMpRef.current.count >= 2) {
      // Route each connected slot to its own handler
      bleDevicesRef.current.forEach((dev, i) => {
        if (!dev) return
        if (i === 0) {
          dev.down = () => plStartPuff()
          dev.up = () => plReleasePuff()
        } else {
          dev.down = () => plStartPuffSlot(i)
          dev.up = () => plReleasePuffSlot(i)
        }
      })
      // Slot 0 is also legacy
      registerPuffHandlers('pufflimbo', () => plStartPuff(), () => plReleasePuff())
    } else {
      registerPuffHandlers('pufflimbo', () => plStartPuff(), () => plReleasePuff())
    }
    return () => {
      registerPuffHandlers(null, null, null)
    }
  }, [gameActive, mpActive, bleDevicesRef, registerPuffHandlers, plStartPuff, plReleasePuff, plStartPuffSlot, plReleasePuffSlot])

  // ── Canvas draw (ported verbatim, stateful closure) ──
  const plDrawCanvas = useCallback(() => {
    const canvas = plCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const dpr = PL_DPR
    ctx.clearRect(0, 0, W, H)
    const phase = plPhase
    const target = plTarget
    const dangerZone = target >= 4.0
    const isBlinkerRound = plRound === 7

    // Background — circus/fire theme
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, dangerZone ? '#2a0a00' : '#1a0a00')
    bg.addColorStop(0.4, dangerZone ? '#3d1500' : '#2d1200')
    bg.addColorStop(0.7, '#1a0800')
    bg.addColorStop(1, '#050200')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    if (dangerZone) {
      const dg = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, W * 0.6)
      dg.addColorStop(0, 'rgba(239,68,68,0.08)')
      dg.addColorStop(1, 'transparent')
      ctx.fillStyle = dg
      ctx.fillRect(0, 0, W, H)
    }

    // Ground line
    const groundY = H * 0.85
    ctx.fillStyle = 'rgba(255,165,0,0.1)'
    ctx.fillRect(0, groundY, W, H - groundY)

    // Limbo bar
    const barMaxH = H * 0.75
    const barMinH = H * 0.2
    const barY = groundY - (target / 5.5) * (barMaxH - barMinH) - barMinH * 0.2
    ctx.fillStyle = 'rgba(255,165,0,0.3)'
    ctx.fillRect(W * 0.08, barY, 6 * dpr, groundY - barY)
    ctx.fillRect(W * 0.88, barY, 6 * dpr, groundY - barY)

    const barGrad = ctx.createLinearGradient(W * 0.08, barY, W * 0.92, barY)
    barGrad.addColorStop(0, dangerZone ? '#EF4444' : '#F97316')
    barGrad.addColorStop(0.5, isBlinkerRound ? '#EF4444' : '#FFD93D')
    barGrad.addColorStop(1, dangerZone ? '#EF4444' : '#F97316')
    ctx.fillStyle = barGrad
    ctx.fillRect(W * 0.08, barY, W * 0.84, 4 * dpr)
    ctx.shadowColor = dangerZone ? 'rgba(239,68,68,0.5)' : 'rgba(249,115,22,0.3)'
    ctx.shadowBlur = 12 * dpr
    ctx.fillRect(W * 0.08, barY, W * 0.84, 4 * dpr)
    ctx.shadowBlur = 0

    ctx.font = `800 ${9 * dpr}px sans-serif`
    ctx.textAlign = 'right'
    ctx.fillStyle = dangerZone ? '#EF4444' : '#F97316'
    ctx.fillText(target.toFixed(1) + 's', W * 0.95, barY - 4 * dpr)

    if (target >= 3.0) {
      const blinkerY = groundY - (5.0 / 5.5) * (barMaxH - barMinH) - barMinH * 0.2
      ctx.setLineDash([4 * dpr, 4 * dpr])
      ctx.strokeStyle = 'rgba(239,68,68,0.3)'
      ctx.lineWidth = 1.5 * dpr
      ctx.beginPath()
      ctx.moveTo(W * 0.08, blinkerY)
      ctx.lineTo(W * 0.92, blinkerY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = `700 ${7 * dpr}px sans-serif`
      ctx.fillStyle = '#EF4444'
      ctx.fillText('BLINKER 5.0s', W * 0.95, blinkerY - 3 * dpr)
    }

    // Crowd
    const crowd = Math.min(plPlayers, 8)
    for (let i = 0; i < crowd; i++) {
      const px = W * 0.15 + (i / (crowd - 1 || 1)) * W * 0.7
      const py = groundY + 10 * dpr
      ctx.font = `${10 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(i === 0 ? '\uD83E\uDDD1' : '\uD83D\uDC64', px, py)
    }

    // Player puff bar
    if (phase === 'puffing' || phase === 'result' || phase === 'eliminated') {
      const puffH = (plPuffTime / 5.5) * (barMaxH - barMinH) + barMinH * 0.2
      const puffY = groundY - puffH
      const puffColor = plPuffTime >= 5 ? '#EF4444' : plPuffTime >= target ? '#22C55E' : '#F97316'
      const pGrad = ctx.createLinearGradient(0, groundY, 0, puffY)
      pGrad.addColorStop(0, puffColor + '40')
      pGrad.addColorStop(1, puffColor)
      ctx.fillStyle = pGrad
      ctx.fillRect(W * 0.38, puffY, W * 0.24, puffH)
      ctx.shadowColor = puffColor
      ctx.shadowBlur = 10 * dpr
      ctx.fillRect(W * 0.38, puffY, W * 0.24, 3 * dpr)
      ctx.shadowBlur = 0
      ctx.font = `900 ${14 * dpr}px "Courier New", monospace`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#fff'
      ctx.fillText(plPuffTime.toFixed(1) + 's', W / 2, puffY - 8 * dpr)
    }

    // Phase text
    ctx.textAlign = 'center'
    if (phase === 'intro') {
      ctx.font = `900 ${22 * dpr}px sans-serif`
      ctx.fillStyle = '#F97316'
      ctx.fillText('PUFF LIMBO', W / 2, H * 0.35)
      ctx.font = `600 ${11 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.6)'
      ctx.fillText('Hold for the target \u00B10.3s to survive', W / 2, H * 0.42)
      ctx.fillText('8 rounds. Last one standing wins!', W / 2, H * 0.47)
      ctx.font = `700 ${10 * dpr}px sans-serif`
      ctx.fillStyle = '#EF4444'
      ctx.fillText('Round 8 = BLINKER (5.0s!)', W / 2, H * 0.54)
    } else if (phase === 'ready') {
      ctx.font = `900 ${20 * dpr}px sans-serif`
      ctx.fillStyle = dangerZone ? '#EF4444' : '#F97316'
      ctx.fillText(isBlinkerRound ? 'BLINKER ROUND!' : 'Round ' + (plRound + 1), W / 2, H * 0.15)
      ctx.font = `700 ${13 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.7)'
      ctx.fillText('Hold for ' + target.toFixed(1) + 's \u00B10.3s', W / 2, H * 0.21)
      ctx.font = `600 ${10 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.4)'
      ctx.fillText('Puff to start', W / 2, H * 0.27)
    } else if (phase === 'eliminated') {
      ctx.font = `900 ${24 * dpr}px sans-serif`
      ctx.fillStyle = '#EF4444'
      ctx.fillText('ELIMINATED!', W / 2, H * 0.15)
      ctx.font = `600 ${11 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.6)'
      ctx.fillText(plPuffTime.toFixed(2) + 's (needed ' + target.toFixed(1) + 's \u00B10.3s)', W / 2, H * 0.22)
    } else if (phase === 'result') {
      ctx.font = `900 ${20 * dpr}px sans-serif`
      ctx.fillStyle = '#22C55E'
      ctx.fillText('SURVIVED!', W / 2, H * 0.15)
      if (plPuffTime >= 5) {
        ctx.font = `800 ${12 * dpr}px sans-serif`
        ctx.fillStyle = '#FFD93D'
        ctx.fillText('BLINKER HOLD!', W / 2, H * 0.22)
      }
    } else if (phase === 'champion') {
      ctx.font = `900 ${24 * dpr}px sans-serif`
      ctx.fillStyle = '#FFD93D'
      ctx.fillText('CHAMPION!', W / 2, H * 0.3)
      ctx.font = `700 ${12 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.7)'
      ctx.fillText('Survived the 5.0s BLINKER!', W / 2, H * 0.37)
    } else if (phase === 'final') {
      ctx.font = `900 ${18 * dpr}px sans-serif`
      ctx.fillStyle = plRound >= 7 ? '#FFD93D' : '#F97316'
      ctx.fillText(plRound >= 7 ? 'CHAMPION!' : 'Game Over', W / 2, H * 0.2)
      ctx.font = `600 ${10 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.6)'
      ctx.fillText('Made it to Round ' + (plRound + 1) + ' of 8', W / 2, H * 0.27)
      plRoundResults.forEach((r, i) => {
        ctx.font = `600 ${8 * dpr}px sans-serif`
        ctx.fillStyle = 'rgba(232,235,246,0.5)'
        ctx.fillText('R' + r.round + ': ' + r.target.toFixed(1) + 's > ' + r.time.toFixed(2) + 's', W / 2, H * 0.34 + i * 12 * dpr)
      })
    }

    // Floating fire particles
    const t = Date.now() / 1000
    for (let i = 0; i < 6; i++) {
      const px = W * ((i * 0.17 + t * 0.03) % 1)
      const py = H * (1 - ((i * 0.11 + t * 0.02) % 0.4))
      ctx.beginPath()
      ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = i % 2 ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.08)'
      ctx.fill()
    }
  }, [plPhase, plTarget, plRound, plPlayers, plPuffTime, plRoundResults])

  // ── Canvas animation loop (Rule 4 — restart every render) ──
  useEffect(() => {
    if (!plPhase) return
    if (plAnimRef.current) cancelAnimationFrame(plAnimRef.current)
    const loop = () => {
      plDrawCanvas()
      plAnimRef.current = requestAnimationFrame(loop)
    }
    plAnimRef.current = requestAnimationFrame(loop)
    return () => {
      if (plAnimRef.current) {
        cancelAnimationFrame(plAnimRef.current)
        plAnimRef.current = null
      }
    }
  }, [plPhase, plDrawCanvas])

  if (!gameActive || gameActive.id !== 'pufflimbo' || !plPhase) return null

  const statusText =
    plPhase === 'intro' ? 'Entering arena...'
      : plPhase === 'ready' ? 'Target: ' + plTarget.toFixed(1) + 's \u00B10.3s'
      : plPhase === 'puffing' ? (plPuffTime >= plTarget ? 'RELEASE! TARGET REACHED' : 'Holding... ' + plPuffTime.toFixed(1) + 's')
      : plPhase === 'result' ? 'SURVIVED!'
      : plPhase === 'eliminated' ? 'ELIMINATED!'
      : plPhase === 'champion' ? 'CHAMPION!'
      : 'Final Results'

  const statusColor =
    plPhase === 'puffing' ? (plHolding ? C.orange : C.gold)
      : plPhase === 'eliminated' ? C.red
      : plPhase === 'champion' ? C.gold
      : (C as any).text3

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', touchAction: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'relative', zIndex: 50, flexShrink: 0,
          background: 'rgba(6,16,30,0.98)',
          borderBottom: '1px solid ' + (plTarget >= 4.0 ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.1)'),
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
              data-btn="true"
              style={{
                touchAction: 'none', display: 'flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 100,
                background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)',
                border: '1px solid ' + (bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'),
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
                {bleConnected ? 'Puff' : 'Connect'}
              </span>
            </div>
            {bleDevices.filter(d => d.connected).length >= 2 && (
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', padding: '2px 6px', borderRadius: 100, background: 'rgba(255,255,255,0.03)' }}>
                {[0, 1, 2, 3].map(s => {
                  const SC = ['#00E5FF', '#60A5FA', '#FFD93D', '#FF6B8A']
                  return (
                    <div
                      key={s}
                      style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: bleDevices.some(d => d.slot === s && d.connected) ? SC[s] : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
              <span style={{ fontSize: 9 }}>{'\uD83E\uDE99'}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>
                {player.coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            onClick={() => { playFx('click'); plCleanup() }}
            data-btn="true"
            style={{
              touchAction: 'none', display: 'inline-flex', alignItems: 'center', gap: 3,
              cursor: 'pointer', padding: '3px 8px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid ' + (C as any).border, flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, color: (C as any).text2 }}>{'\u2190'}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: (C as any).text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: plTarget >= 4.0 ? C.red : C.orange }}>
              {'\uD83C\uDFAA'} PUFF LIMBO
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>R{plRound + 1}/8</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: (C as any).text3 }}>{plPlayers} alive</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: statusColor }}>{statusText}</span>
        </div>
      </div>

      {/* Canvas + Controls */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={plCanvasRef}
          width={Math.round(420 * PL_DPR)}
          height={Math.round(600 * PL_DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '12px 16px 20px', display: 'flex', flexDirection: 'column',
            gap: 6, alignItems: 'center', width: '100%',
            background: 'linear-gradient(to top, rgba(6,16,30,0.85), rgba(6,16,30,0))',
          }}
        >
          {(plPhase === 'ready' || plPhase === 'puffing') && (
            <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
              <div
                data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); plStartPuff() }}
                onMouseUp={(e) => { e.stopPropagation(); plReleasePuff() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); plStartPuff() }}
                onTouchEnd={(e) => { e.stopPropagation(); plReleasePuff() }}
                onTouchCancel={(e) => { e.stopPropagation(); plReleasePuff() }}
                style={{
                  touchAction: 'none', flex: 1.5, padding: '14px 0', borderRadius: 14,
                  cursor: 'pointer', textAlign: 'center',
                  background: plHolding ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.08)',
                  border: '2px solid ' + (plHolding ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.2)'),
                  transition: 'all 0.15s', userSelect: 'none', WebkitUserSelect: 'none',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>
                  {plHolding ? '\uD83D\uDCA8 HOLDING...' : 'PUFF & HOLD'}
                </div>
                <div style={{ fontSize: 7, color: (C as any).text3, marginTop: 2 }}>
                  Hold for {plTarget.toFixed(1)}s \u00B10.3s
                </div>
              </div>
              {plRound === 7 && (
                <div
                  data-btn="true"
                  onMouseDown={(e) => { e.stopPropagation(); plStartPuff() }}
                  onMouseUp={(e) => { e.stopPropagation(); plReleasePuff() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); plStartPuff() }}
                  onTouchEnd={(e) => { e.stopPropagation(); plReleasePuff() }}
                  onTouchCancel={(e) => { e.stopPropagation(); plReleasePuff() }}
                  style={{
                    touchAction: 'none', flex: 1, padding: '14px 0', borderRadius: 14,
                    cursor: 'pointer', textAlign: 'center',
                    background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)',
                    animation: 'countPulse 1.5s infinite', userSelect: 'none', WebkitUserSelect: 'none',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                  <div style={{ fontSize: 7, color: (C as any).text3, marginTop: 2 }}>5.0s hero!</div>
                </div>
              )}
            </div>
          )}
          {plPhase === 'final' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <div
                data-btn="true"
                onClick={(e) => { e.stopPropagation(); plGuardRef.current.v = false; startPuffLimbo() }}
                style={{
                  padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
                  background: C.orange + '15', border: '1px solid ' + C.orange + '30',
                  fontSize: 13, fontWeight: 800, color: C.orange,
                }}
              >
                Again
              </div>
              <div
                data-btn="true"
                onClick={(e) => { e.stopPropagation(); plCleanup() }}
                style={{
                  padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
                  background: (C as any).text3 + '10', border: '1px solid ' + (C as any).text3 + '20',
                  fontSize: 13, fontWeight: 800, color: (C as any).text3,
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
