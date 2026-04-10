import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { C, SPECTATOR_EMOJIS } from '../../../constants'

type PcPhase = null | 'intro' | 'target' | 'puffing' | 'reveal' | 'result'
interface PcResult { round: number; target: number; actual: number; error: number; input: string }
interface PcLbEntry { name: string; emoji: string; totalError: number; rank: number }

const PC_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const PC_TARGETS = [2.0, 3.5, 1.75, 4.2, 0]
const PC_ROUND_NAMES = [
  'Round 1: The Warm-Up',
  'Round 2: Getting Tricky',
  'Round 3: Precision Mode',
  'Round 4: THE 4.20 ROUND',
  'Round 5: SURPRISE',
]
const PC_COMEDY = [
  'Not even close, but A for effort',
  'My grandma could time better',
  "Time flies when you're having puffs!",
  'Your temporal lobe called in sick',
  'Somewhere a clock is laughing at you',
]
const PC_BOT_NAMES = ['CloudTimer', 'PrecisionPuff', '4.20_King']
const PC_BOT_SKILL = [0.25, 0.4, 0.15]

export const PuffClockGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  // ── State ──
  const [pcPhase, setPcPhase] = useState<PcPhase>(null)
  const [pcTarget, setPcTarget] = useState(0)
  const [pcRound, setPcRound] = useState(0)
  const [pcPuffTime, setPcPuffTime] = useState(0)
  const [pcHolding, setPcHolding] = useState(false)
  const [pcResults, setPcResults] = useState<PcResult[]>([])
  const [pcLeaderboard, setPcLeaderboard] = useState<PcLbEntry[]>([])
  const [pcComment, setPcComment] = useState('')
  const [pcPerfect420, setPcPerfect420] = useState(false)

  // ── Refs ──
  const pcCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const pcAnimRef = useRef<number | null>(null)
  const pcPuffStartTs = useRef(0)
  const pcPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const pcRoundRef = useRef(0)
  const pcTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pcBotResults = useRef<number[][]>([])
  const pcInputMode = useRef<'none' | 'tap' | 'puff' | 'blinker'>('none')
  const pcBlinkerStart = useRef(0)
  const pcStartedRef = useRef(false)

  // Latest-state refs so closures in setTimeout always see fresh values
  const pcPhaseRef = useRef<PcPhase>(null)
  const pcHoldingRef = useRef(false)
  const pcTargetRef = useRef(0)
  const pcResultsRef = useRef<PcResult[]>([])
  const pcLeaderboardRef = useRef<PcLbEntry[]>([])
  useEffect(() => { pcPhaseRef.current = pcPhase }, [pcPhase])
  useEffect(() => { pcHoldingRef.current = pcHolding }, [pcHolding])
  useEffect(() => { pcTargetRef.current = pcTarget }, [pcTarget])
  useEffect(() => { pcResultsRef.current = pcResults }, [pcResults])
  useEffect(() => { pcLeaderboardRef.current = pcLeaderboard }, [pcLeaderboard])

  // ── Game flow ──
  const pcShowFinalResults = useCallback(() => {
    setPcPhase('result')
    const results = pcResultsRef.current
    const totalError = results.reduce((s, r) => s + r.error, 0)
    const avgError = results.length > 0 ? totalError / results.length : 0
    const rank = pcLeaderboardRef.current.find((p) => p.name === 'You')
    const comment =
      avgError <= 0.15
        ? 'CHRONOMASTER! Your timing is INHUMAN!'
        : avgError <= 0.3
        ? 'Impressive precision! Your internal clock is solid.'
        : avgError <= 0.6
        ? 'Not bad! THC only slightly warped your time perception.'
        : 'Your sense of time is... unique. Very unique.'
    setPcComment(comment)
    const deps = { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive }
    if (rank && rank.rank <= 3) {
      audio.playFx('win')
      player.recordGameResult(true, 80, 20, deps)
      player.notify('TOP 3! +80 coins!', C.gold)
    } else {
      audio.playFx(avgError <= 0.5 ? 'win' : 'lose')
      player.recordGameResult(avgError <= 0.5, avgError <= 0.5 ? 30 : 10, avgError <= 0.5 ? 20 : 8, deps)
    }
  }, [audio, ble.bleConnected, game.gameActive, player])

  const pcStartRound = useCallback((roundNum: number) => {
    if (roundNum >= 5) {
      pcShowFinalResults()
      return
    }
    let target = PC_TARGETS[roundNum]
    if (target === 0) target = +(1.0 + Math.random() * 3.5).toFixed(2)
    setPcTarget(target)
    setPcRound(roundNum + 1)
    pcRoundRef.current = roundNum
    setPcPuffTime(0)
    setPcHolding(false)
    pcInputMode.current = 'none'
    setPcComment(PC_ROUND_NAMES[roundNum])
    setPcPhase('target')
    setTimeout(() => {
      setPcPhase('puffing')
      setPcComment('PUFF NOW! Hold for ' + target.toFixed(2) + 's!')
    }, 3000)
  }, [pcShowFinalResults])

  const pcStopPuff = useCallback(() => {
    if (!pcHoldingRef.current) return
    setPcHolding(false)
    if (pcPuffInterval.current) {
      clearInterval(pcPuffInterval.current)
      pcPuffInterval.current = null
    }
    const elapsed = +(((Date.now() - pcPuffStartTs.current) / 1000)).toFixed(2)
    const clampedElapsed = Math.min(elapsed, 6.0)
    setPcPuffTime(clampedElapsed)
    const holdDur = (Date.now() - pcBlinkerStart.current) / 1000
    const isBlinker = holdDur >= 5.0
    const isPuff = holdDur >= 0.3
    pcInputMode.current = isBlinker ? 'blinker' : isPuff ? 'puff' : 'tap'
    const target = pcTargetRef.current
    let error = +(Math.abs(clampedElapsed - target)).toFixed(2)
    if (isPuff && !isBlinker) error = +(error * 0.85).toFixed(2)
    if (isBlinker && target > 4.0) {
      error = 0
      setPcPuffTime(target)
    }
    const roundResult: PcResult = {
      round: pcRoundRef.current + 1,
      target,
      actual: isBlinker && target > 4.0 ? target : clampedElapsed,
      error,
      input: pcInputMode.current,
    }
    PC_BOT_NAMES.forEach((_, bi) => {
      const botErr = +(PC_BOT_SKILL[bi] * (0.3 + Math.random() * 1.4)).toFixed(2)
      pcBotResults.current[bi].push(botErr)
    })
    let perfect = false
    if (target === 4.2 && error <= 0.15) {
      perfect = true
      setPcPerfect420(true)
      player.setCoins((c) => c + 420)
      player.notify('PERFECT 4.20! +420 coins!', C.gold)
      audio.playFx('crowd')
      audio.playFx('achievement')
    }
    setPcResults((prev) => [...prev, roundResult])
    setPcPhase('reveal')
    const errorComment =
      error === 0
        ? 'AUTO-PERFECT! Blinker magic!'
        : error <= 0.1
        ? 'PERFECT! Are you a robot?!'
        : error <= 0.3
        ? 'Not bad! Your internal clock is pretty solid.'
        : error <= 0.5
        ? 'Decent! ' + PC_COMEDY[Math.floor(Math.random() * PC_COMEDY.length)]
        : error <= 1.0
        ? 'Off by ' + error.toFixed(2) + 's... ' + PC_COMEDY[Math.floor(Math.random() * PC_COMEDY.length)]
        : 'You puffed ' + clampedElapsed.toFixed(2) + 's... target was ' + target.toFixed(2) + 's. Are you even trying?!'
    setPcComment(perfect ? '4.20 PERFECTION! LEGENDARY!' : errorComment)
    if (!perfect) {
      const coinAmt = error <= 0.1 ? 100 : error <= 0.25 ? 50 : error <= 0.5 ? 25 : error <= 1.0 ? 10 : 5
      player.notify('+' + coinAmt + ' coins', error <= 0.25 ? C.green : C.gold)
    }
    setPcLeaderboard(() => {
      const allResults = [...pcResultsRef.current, roundResult]
      const youTotal = allResults.reduce((s, r) => s + r.error, 0)
      const entries: PcLbEntry[] = PC_BOT_NAMES.map((n, i) => ({
        name: n,
        emoji: SPECTATOR_EMOJIS[i % SPECTATOR_EMOJIS.length],
        totalError: +(pcBotResults.current[i].reduce((s, e) => s + e, 0)).toFixed(2),
        rank: 0,
      }))
      entries.push({ name: 'You', emoji: '\uD83C\uDF1F', totalError: +youTotal.toFixed(2), rank: 0 })
      entries.sort((a, b) => a.totalError - b.totalError)
      entries.forEach((p, i) => (p.rank = i + 1))
      return entries
    })
    setTimeout(() => pcStartRound(pcRoundRef.current + 1), 3500)
  }, [audio, player, pcStartRound])

  const pcStartPuff = useCallback(() => {
    if (pcHoldingRef.current || pcPhaseRef.current !== 'puffing') return
    setPcHolding(true)
    pcPuffStartTs.current = Date.now()
    setPcPuffTime(0)
    pcBlinkerStart.current = Date.now()
    audio.playFx('tick_tock')
    if (pcPuffInterval.current) clearInterval(pcPuffInterval.current)
    pcPuffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - pcPuffStartTs.current) / 1000
      setPcPuffTime(elapsed)
      if (elapsed >= 6.0) pcStopPuff()
    }, 50)
  }, [audio, pcStopPuff])

  const startPuffClock = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setPcRound(0)
    setPcResults([])
    setPcPuffTime(0)
    setPcHolding(false)
    setPcPerfect420(false)
    setPcComment('')
    pcInputMode.current = 'none'
    pcBotResults.current = PC_BOT_NAMES.map(() => [])
    const lb: PcLbEntry[] = PC_BOT_NAMES.map((n, i) => ({
      name: n,
      emoji: SPECTATOR_EMOJIS[i % SPECTATOR_EMOJIS.length],
      totalError: 0,
      rank: i + 1,
    }))
    lb.push({ name: 'You', emoji: '\uD83C\uDF1F', totalError: 0, rank: 4 })
    setPcLeaderboard(lb)
    setPcPhase('intro')
    audio.playFx('crowd')
    setTimeout(() => {
      setPcComment('Puff for EXACTLY the target time!')
      setTimeout(() => {
        setPcComment('Closest to the target wins!')
        setTimeout(() => pcStartRound(0), 1500)
      }, 1500)
    }, 500)
  }, [audio, pcStartRound])

  const pcEndGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (pcPuffInterval.current) {
      clearInterval(pcPuffInterval.current)
      pcPuffInterval.current = null
    }
    if (pcTimerRef.current) {
      clearInterval(pcTimerRef.current)
      pcTimerRef.current = null
    }
    if (pcAnimRef.current) {
      cancelAnimationFrame(pcAnimRef.current)
      pcAnimRef.current = null
    }
    ble.registerPuffHandlers(null, null, null)
    setPcPhase(null)
    game.exitGame()
  }, [audio, ble, game])

  // ── Canvas draw ──
  const pcDrawCanvas = useCallback(() => {
    const canvas = pcCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const dpr = PC_DPR
    ctx.clearRect(0, 0, W, H)
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#060d1e')
    bg.addColorStop(0.4, '#0a1832')
    bg.addColorStop(1, '#040e1a')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.5)
    glow.addColorStop(0, 'rgba(0,229,255,0.06)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    const cx = W / 2
    const cy = H * 0.32
    const clockR = Math.min(W, H) * 0.22
    const phase = pcPhase
    ctx.beginPath()
    ctx.arc(cx, cy, clockR, 0, Math.PI * 2)
    ctx.strokeStyle = pcHolding ? 'rgba(0,229,255,0.6)' : 'rgba(0,229,255,0.15)'
    ctx.lineWidth = 3 * dpr
    ctx.stroke()
    if (pcHolding) {
      ctx.beginPath()
      ctx.arc(cx, cy, clockR + 6 * dpr, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,229,255,0.1)'
      ctx.lineWidth = 2 * dpr
      ctx.stroke()
    }
    if (pcTarget > 0 && (phase === 'puffing' || phase === 'reveal' || phase === 'target')) {
      const tAngle = -Math.PI / 2 + (pcTarget / 6.0) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, clockR - 8 * dpr, -Math.PI / 2, tAngle)
      ctx.strokeStyle = 'rgba(255,217,61,0.5)'
      ctx.lineWidth = 6 * dpr
      ctx.lineCap = 'round'
      ctx.stroke()
      const tx = cx + Math.cos(tAngle) * (clockR - 8 * dpr)
      const ty = cy + Math.sin(tAngle) * (clockR - 8 * dpr)
      ctx.beginPath()
      ctx.arc(tx, ty, 4 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = '#FFD93D'
      ctx.fill()
    }
    if (pcPuffTime > 0 && (phase === 'puffing' || phase === 'reveal')) {
      const pAngle = -Math.PI / 2 + (Math.min(pcPuffTime, 6.0) / 6.0) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, clockR - 18 * dpr, -Math.PI / 2, pAngle)
      ctx.strokeStyle = 'rgba(0,229,255,0.7)'
      ctx.lineWidth = 8 * dpr
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    ctx.font = `900 ${32 * dpr}px "Courier New", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (phase === 'puffing' || phase === 'reveal') {
      ctx.fillStyle = pcHolding ? '#00E5FF' : 'rgba(232,235,246,0.9)'
      ctx.fillText(pcPuffTime.toFixed(2) + 's', cx, cy)
    } else if (phase === 'target') {
      ctx.fillStyle = pcTarget === 4.2 ? '#FFD93D' : '#00E5FF'
      ctx.fillText(pcTarget.toFixed(2) + 's', cx, cy)
      ctx.font = `700 ${11 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.5)'
      ctx.fillText('TARGET', cx, cy - clockR - 14 * dpr)
    } else if (phase === 'intro') {
      ctx.fillStyle = '#00E5FF'
      ctx.font = `900 ${28 * dpr}px sans-serif`
      ctx.fillText('PUFF CLOCK', cx, cy)
      ctx.font = `600 ${11 * dpr}px sans-serif`
      ctx.fillStyle = 'rgba(232,235,246,0.5)'
      ctx.fillText('5 rounds of precision', cx, cy + 24 * dpr)
    }
    if (phase === 'reveal' && pcResults.length > 0) {
      const last = pcResults[pcResults.length - 1]
      const meterY = H * 0.58
      const meterW = W * 0.7
      const meterH = 12 * dpr
      const meterX = (W - meterW) / 2
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fillRect(meterX, meterY, meterW, meterH)
      ctx.fillStyle = 'rgba(52,211,153,0.5)'
      ctx.fillRect(meterX + meterW / 2 - 1, meterY - 4 * dpr, 2, meterH + 8 * dpr)
      const errPct = Math.min(last.error / 2.0, 1.0)
      const errX = meterX + meterW / 2 + (last.actual > last.target ? 1 : -1) * errPct * meterW / 2
      ctx.beginPath()
      ctx.arc(errX, meterY + meterH / 2, 6 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = last.error <= 0.15 ? '#22C55E' : last.error <= 0.5 ? '#FFD93D' : '#EF4444'
      ctx.fill()
      ctx.font = `800 ${9 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(232,235,246,0.7)'
      ctx.fillText('\u00B1' + last.error.toFixed(2) + 's', W / 2, meterY + meterH + 14 * dpr)
      ctx.font = `700 ${8 * dpr}px sans-serif`
      ctx.fillStyle = last.input === 'blinker' ? '#EF4444' : last.input === 'puff' ? '#00E5FF' : '#A0AEC0'
      ctx.fillText(
        last.input === 'blinker' ? 'BLINKER' : last.input === 'puff' ? 'PUFF +15%' : 'TAP',
        W / 2,
        meterY + meterH + 26 * dpr,
      )
    }
    if ((phase === 'reveal' || phase === 'result') && pcLeaderboard.length > 0) {
      const lbY = H * 0.68
      const lbH = 18 * dpr
      ctx.font = `700 ${9 * dpr}px sans-serif`
      ctx.textAlign = 'left'
      pcLeaderboard.slice(0, 4).forEach((p, i) => {
        const y = lbY + i * lbH
        const isYou = p.name === 'You'
        ctx.fillStyle = isYou ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)'
        ctx.fillRect(W * 0.12, y, W * 0.76, lbH - 2 * dpr)
        ctx.fillStyle = isYou ? '#00E5FF' : 'rgba(232,235,246,0.5)'
        ctx.fillText('#' + p.rank + ' ' + p.emoji + ' ' + p.name, W * 0.14, y + lbH * 0.6)
        ctx.textAlign = 'right'
        ctx.fillText('\u00B1' + p.totalError.toFixed(2) + 's', W * 0.86, y + lbH * 0.6)
        ctx.textAlign = 'left'
      })
    }
    if (phase === 'result') {
      ctx.font = `900 ${16 * dpr}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#00E5FF'
      ctx.fillText('FINAL RESULTS', cx, H * 0.55)
      ctx.font = `600 ${8 * dpr}px sans-serif`
      pcResults.forEach((r, i) => {
        const ry = H * 0.59 + i * 12 * dpr
        const col = r.error <= 0.15 ? '#22C55E' : r.error <= 0.5 ? '#FFD93D' : '#EF4444'
        ctx.fillStyle = 'rgba(232,235,246,0.5)'
        ctx.fillText('R' + r.round + ': ' + r.target.toFixed(2) + 's > ' + r.actual.toFixed(2) + 's', cx - 40 * dpr, ry)
        ctx.fillStyle = col
        ctx.fillText('\u00B1' + r.error.toFixed(2) + 's', cx + 60 * dpr, ry)
      })
    }
    const t = Date.now() / 1000
    for (let i = 0; i < 8; i++) {
      const px = W * ((i * 0.13 + t * 0.02) % 1)
      const py = H * ((i * 0.17 + t * 0.01 + i * 0.1) % 1)
      ctx.beginPath()
      ctx.arc(px, py, 1.5 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,229,255,0.08)'
      ctx.fill()
    }
  }, [pcPhase, pcHolding, pcTarget, pcPuffTime, pcResults, pcLeaderboard])

  // ── Canvas animation loop (Rule 4) ──
  useEffect(() => {
    if (!pcPhase) return
    if (pcAnimRef.current) cancelAnimationFrame(pcAnimRef.current)
    const loop = () => {
      pcDrawCanvas()
      pcAnimRef.current = requestAnimationFrame(loop)
    }
    pcAnimRef.current = requestAnimationFrame(loop)
    return () => {
      if (pcAnimRef.current) {
        cancelAnimationFrame(pcAnimRef.current)
        pcAnimRef.current = null
      }
    }
  }, [pcPhase, pcDrawCanvas])

  // ── BLE registration (Rule 3 — lazy wrappers) ──
  useEffect(() => {
    if (game.gameActive?.id !== 'puffclock') return
    ble.registerPuffHandlers(
      'puffclock',
      () => pcStartPuff(),
      () => pcStopPuff(),
    )
    return () => {
      ble.registerPuffHandlers(null, null, null)
    }
  }, [game.gameActive?.id, ble, pcStartPuff, pcStopPuff])

  // ── Auto-start on mount ──
  useEffect(() => {
    if (pcStartedRef.current) return
    pcStartedRef.current = true
    startPuffClock()
    return () => {
      // Rule 8: mute game sounds FIRST
      audio.gameSoundsMuted.current = true
      if (pcPuffInterval.current) {
        clearInterval(pcPuffInterval.current)
        pcPuffInterval.current = null
      }
      if (pcTimerRef.current) {
        clearInterval(pcTimerRef.current)
        pcTimerRef.current = null
      }
      if (pcAnimRef.current) {
        cancelAnimationFrame(pcAnimRef.current)
        pcAnimRef.current = null
      }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!game.gameActive || game.gameActive.id !== 'puffclock') return null

  const bleConnected = ble.bleConnected
  const bleDevices = ble.bleDevices
  const coins = player.coins

  const controlsSlot = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
      {pcPhase === 'puffing' && (
        <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
          <div
            onClick={(e) => {
              e.stopPropagation()
              if (!pcHolding) {
                pcStartPuff()
                setTimeout(() => pcStopPuff(), 80)
              }
            }}
            style={{
              touchAction: 'none',
              flex: 1,
              padding: '12px 0',
              borderRadius: 14,
              cursor: 'pointer',
              textAlign: 'center',
              background: 'rgba(0,229,255,0.08)',
              border: '2px solid rgba(0,229,255,0.2)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>TAP</div>
            <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Start/Stop</div>
          </div>
          <div
            onMouseDown={(e) => { e.stopPropagation(); pcStartPuff() }}
            onMouseUp={(e) => { e.stopPropagation(); pcStopPuff() }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); pcStartPuff() }}
            onTouchEnd={(e) => { e.stopPropagation(); pcStopPuff() }}
            onTouchCancel={(e) => { e.stopPropagation(); pcStopPuff() }}
            style={{
              touchAction: 'none',
              flex: 1.3,
              padding: '12px 0',
              borderRadius: 14,
              cursor: 'pointer',
              textAlign: 'center',
              background: pcHolding ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)',
              border: '2px solid ' + (pcHolding ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.15)'),
              userSelect: 'none',
              WebkitUserSelect: 'none',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>
              {pcHolding ? '\uD83D\uDCA8 PUFFING' : 'PUFF'}
            </div>
            <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +15%</div>
          </div>
          <div
            onMouseDown={(e) => { e.stopPropagation(); pcStartPuff() }}
            onMouseUp={(e) => { e.stopPropagation(); pcStopPuff() }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); pcStartPuff() }}
            onTouchEnd={(e) => { e.stopPropagation(); pcStopPuff() }}
            onTouchCancel={(e) => { e.stopPropagation(); pcStopPuff() }}
            style={{
              touchAction: 'none',
              flex: 1,
              padding: '12px 0',
              borderRadius: 14,
              cursor: 'pointer',
              textAlign: 'center',
              background: 'rgba(255,50,50,0.1)',
              border: '2px solid rgba(255,50,50,0.25)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
            <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>5s+ auto</div>
          </div>
        </div>
      )}
      {pcPhase === 'result' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <div
            onClick={(e) => {
              e.stopPropagation()
              startPuffClock()
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              cursor: 'pointer',
              background: C.cyan + '15',
              border: '1px solid ' + C.cyan + '30',
              fontSize: 13,
              fontWeight: 800,
              color: C.cyan,
            }}
          >
            Play Again
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation()
              pcEndGame()
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
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          position: 'relative',
          zIndex: 50,
          flexShrink: 0,
          background: 'rgba(6,16,30,0.98)',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
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
              style={{
                touchAction: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 8px',
                borderRadius: 100,
                cursor: 'pointer',
                background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)',
                border: '1px solid ' + (bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'),
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
                {bleConnected ? 'Puff' : 'Connect'}
              </span>
            </div>
            {bleDevices.filter((d) => d.connected).length >= 2 && (
              <div
                style={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  padding: '2px 6px',
                  borderRadius: 100,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                {[0, 1, 2, 3].map((s) => {
                  const SC = ['#00E5FF', '#60A5FA', '#FFD93D', '#FF6B8A']
                  return (
                    <div
                      key={s}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: bleDevices.some((d) => d.slot === s && d.connected)
                          ? SC[s]
                          : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )
                })}
              </div>
            )}
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
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.gold,
                  fontFamily: "'Courier New',monospace",
                }}
              >
                {coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            onClick={() => {
              audio.playFx('click')
              pcEndGame()
            }}
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
            <span style={{ fontSize: 10, fontWeight: 800, color: C.cyan }}>{'\u23F1\uFE0F'} PUFF CLOCK</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {pcRound}/5</span>
            {pcPerfect420 && <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>4.20!</span>}
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color:
                pcPhase === 'puffing'
                  ? pcHolding
                    ? C.cyan
                    : C.gold
                  : pcPhase === 'result'
                  ? C.green
                  : C.text3,
            }}
          >
            {pcPhase === 'intro'
              ? 'Get ready...'
              : pcPhase === 'target'
              ? 'Watch the target!'
              : pcPhase === 'puffing'
              ? pcHolding
                ? 'PUFFING...'
                : 'PUFF NOW!'
              : pcPhase === 'reveal'
              ? pcComment
              : pcPhase === 'result'
              ? 'Game Over'
              : '...'}
          </span>
        </div>
      </div>

      {/* GAME AREA */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={pcCanvasRef}
          width={Math.round(420 * PC_DPR)}
          height={Math.round(600 * PC_DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 12,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          {controlsSlot}
        </div>
      </div>
    </div>
  )
}
