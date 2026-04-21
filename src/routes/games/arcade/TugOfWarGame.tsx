import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { PuffBar } from '../../../components/shared/PuffBar'

const TOW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

const TOW_COMMENTS_PULL = ["PULL! 💪", "Keep going! 🔥", "More power! ⚡", "HARDER! 😤", "HEAVE! 🏋️", "Don't stop! 🫁"]
const TOW_COMMENTS_WIN = ["CHAMPIONS! The crowd goes INSANE! 🏆", "They FELL in the MUD! 😂", "DOMINANT! Your team is unstoppable! 💪"]
const TOW_COMMENTS_LOSE = ["MUD PIT! Your team took a bath 🛁", "The AI pulled harder... regroup!", "Into the mud you go! 🫠"]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

type Phase = 'intro' | 'playing' | 'suddendeath' | 'result' | null

export const TugOfWarGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [position, setPosition] = useState(50)
  const [timer, setTimer] = useState(30)
  const [puffs, setPuffs] = useState(0)
  const [aiPuffs, setAiPuffs] = useState(0)
  const [comment, setComment] = useState('')
  const [introStep, setIntroStep] = useState(0)
  const [surge, setSurge] = useState(false)
  const [surgeAvail, setSurgeAvail] = useState(false)
  const [puffIntensity, setPuffIntensity] = useState(0)
  const [charging, setCharging] = useState(false)
  const [sweetSpot] = useState({ min: 55, max: 80 })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const physicsRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const surgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chargeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const posRef = useRef(50)
  const holdRef = useRef(false)
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const towCleanup = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (physicsRef.current) { clearInterval(physicsRef.current); physicsRef.current = null }
    if (surgeTimerRef.current) { clearTimeout(surgeTimerRef.current); surgeTimerRef.current = null }
    if (chargeRef.current) { clearInterval(chargeRef.current); chargeRef.current = null }
    holdRef.current = false
  }, [])

  const finishMatch = useCallback(() => {
    towCleanup()
    const pos = posRef.current
    const won = pos > 50
    setPhase('result')
    if (won) {
      player.spawnConfetti(40, [C.cyan, C.gold, C.blue, C.green])
      audio.playFx('win')
      setComment(pick(TOW_COMMENTS_WIN))
    } else {
      audio.playFx('lose')
      setComment(pick(TOW_COMMENTS_LOSE))
    }
  }, [audio, player, towCleanup])

  const startMatch = useCallback(() => {
    setPhase('playing')
    let elapsed = 0
    intervalRef.current = setInterval(() => {
      elapsed++
      setTimer(t => {
        const newT = t - 1
        if (elapsed % 10 === 0 && elapsed < 30) {
          setSurgeAvail(true)
          setComment('⚡ SURGE AVAILABLE! Puff NOW for 3x! ⚡')
          audio.playFx('tick')
          if (surgeTimerRef.current) clearTimeout(surgeTimerRef.current)
          surgeTimerRef.current = setTimeout(() => setSurgeAvail(false), 3000)
        }
        if (newT <= 5 && newT > 0) audio.playFx('tick')
        if (newT <= 0) {
          const pos2 = posRef.current
          if (pos2 >= 45 && pos2 <= 55) {
            setPhase('suddendeath')
            setComment('SUDDEN DEATH! 10 more seconds! ⚡💀')
            audio.playFx('crowd')
            return 10
          }
          finishMatch()
          return 0
        }
        return newT
      })
      const aiStr = 0.8 + Math.random() * 1.8
      if (Math.random() < 0.45) {
        posRef.current = Math.max(0, posRef.current - aiStr)
        setPosition(posRef.current)
        setAiPuffs(a => a + 1)
        if (Math.random() < 0.15) {
          posRef.current = Math.max(0, posRef.current - 2.5)
          setPosition(posRef.current)
          setComment("AI BURST! They're pulling hard!")
        }
      }
    }, 1000)
    physicsRef.current = setInterval(() => {
      if (holdRef.current) {
        const pf = 0.4 + (Math.random() * 0.3)
        posRef.current = Math.min(100, posRef.current + pf)
        setPosition(posRef.current)
        setPuffIntensity(p => Math.min(100, p + 3))
      } else {
        setPuffIntensity(p => Math.max(0, p - 2))
        if (posRef.current > 50) {
          posRef.current = Math.max(50, posRef.current - 0.08)
          setPosition(posRef.current)
        }
      }
    }, 50)
  }, [audio, finishMatch])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    towCleanup()
    setPosition(50)
    setTimer(30)
    setPuffs(0)
    setAiPuffs(0)
    setComment('')
    setIntroStep(0)
    setSurge(false)
    setSurgeAvail(false)
    setPuffIntensity(0)
    setCharging(false)
    posRef.current = 50
    holdRef.current = false
    setPhase('intro')
    audio.playFx('crowd')
    let step = 0
    const introTimer = setInterval(() => {
      step++
      setIntroStep(step)
      if (step >= 4 && step <= 6) audio.playFx('tick')
      if (step >= 7) {
        clearInterval(introTimer)
        audio.playFx('whistle')
        setComment('PULL!')
        startMatch()
      }
    }, 700)
  }, [audio, startMatch, towCleanup])

  const tapPull = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return
    const force = 2 + Math.random() * 1
    posRef.current = Math.min(100, posRef.current + force)
    setPosition(posRef.current)
    setPuffs(n => n + 1)
    audio.playFx('tap')
    setComment(pick(TOW_COMMENTS_PULL))
    if (surgeAvail && !surge) {
      setSurge(true)
      setSurgeAvail(false)
      setComment('🔥 SURGE ACTIVATED! 3x PULL POWER! 🔥')
      audio.playFx('blinker')
      setTimeout(() => { setSurge(false); setComment('Surge ended!') }, 3000)
    }
  }, [audio, surge, surgeAvail])

  const startCharge = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return
    setCharging(true)
    holdRef.current = true
    setPuffIntensity(0)
    if (chargeRef.current) clearInterval(chargeRef.current)
    chargeRef.current = setInterval(() => {
      setPuffIntensity(p => Math.min(100, p + 4))
    }, 50)
  }, [])

  const stopCharge = useCallback(() => {
    if (!holdRef.current) return
    holdRef.current = false
    setCharging(false)
    if (chargeRef.current) { clearInterval(chargeRef.current); chargeRef.current = null }
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return
    const surgeMulti = surge ? 3 : 1
    const force = (5 + (puffIntensity / 100) * 5) * surgeMulti
    posRef.current = Math.min(100, posRef.current + force)
    setPosition(posRef.current)
    setPuffs(n => n + 1)
    audio.playFx('crowd')
    setComment(force > 8 ? 'POWER PULL! 💪🔥' : pick(TOW_COMMENTS_PULL))
    setPuffIntensity(0)
  }, [audio, puffIntensity, surge])

  const blinkerPull = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return
    const surgeMulti = surge ? 3 : 1
    const force = 10 * surgeMulti
    posRef.current = Math.min(100, posRef.current + force)
    setPosition(posRef.current)
    setPuffs(n => n + 1)
    audio.playFx('blinker')
    setComment('🫁 BLINKER PULL! MEGA SURGE! 💀')
  }, [audio, surge])

  const endGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    towCleanup()
    const won = posRef.current > 50
    const baseR = won ? 60 : 10
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(won, baseR, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    player.notify(won ? `💪 Won! +${baseR}` : `😤 Lost! +${baseR}`, won ? C.green : C.red)
    setPhase(null)
    game.exitGame()
  }, [audio, player, ble, game, towCleanup])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const dpr = TOW_DPR
    const pos = posRef.current
    const t = Date.now() * 0.001

    ctx.clearRect(0, 0, W, H)

    const skyG = ctx.createLinearGradient(0, 0, 0, H)
    skyG.addColorStop(0, '#0a0618')
    skyG.addColorStop(0.3, '#1a0a2e')
    skyG.addColorStop(0.6, '#0d1a2f')
    skyG.addColorStop(1, '#0a1408')
    ctx.fillStyle = skyG
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 5; i++) {
      const lx = W * 0.1 + i * (W * 0.2)
      const glow = ctx.createRadialGradient(lx, 15 * dpr, 0, lx, 15 * dpr, 50 * dpr)
      glow.addColorStop(0, 'rgba(255,220,100,0.25)')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(lx - 60 * dpr, 0, 120 * dpr, 80 * dpr)
    }

    const crowdY = H * 0.08
    const crowdH = H * 0.28
    for (let row = 0; row < 3; row++) {
      const ry = crowdY + row * crowdH * 0.33
      const rowShade = 30 + row * 12
      for (let i = 0; i < 24; i++) {
        const cx = (i / 24) * W + Math.sin(i * 2.1 + t * 1.5) * 3 * dpr
        const waveOff = (pos > 60 || pos < 40) ? Math.sin(t * 4 + i * 0.5) * 4 * dpr : 0
        const headR = (5 + row * 1.5) * dpr
        const bodyH = (12 + row * 2) * dpr
        ctx.fillStyle = `rgba(${rowShade},${rowShade - 10},${rowShade + 15},0.7)`
        ctx.beginPath()
        ctx.arc(cx, ry - waveOff, headR, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(cx - headR * 0.6, ry - waveOff + headR, headR * 1.2, bodyH)
      }
    }

    const floorY = H * 0.55
    const floorG = ctx.createLinearGradient(0, floorY, 0, H)
    floorG.addColorStop(0, '#1a2a15')
    floorG.addColorStop(0.4, '#223318')
    floorG.addColorStop(1, '#0a1408')
    ctx.fillStyle = floorG
    ctx.fillRect(0, floorY, W, H - floorY)

    const mudCx = W * 0.5
    const mudCy = floorY + (H - floorY) * 0.45
    const mudW = W * 0.18
    const mudH = (H - floorY) * 0.3
    const mudG = ctx.createRadialGradient(mudCx, mudCy, 0, mudCx, mudCy, mudW)
    mudG.addColorStop(0, '#4a3520')
    mudG.addColorStop(0.6, '#3a2815')
    mudG.addColorStop(1, '#1a2a15')
    ctx.fillStyle = mudG
    ctx.beginPath()
    ctx.ellipse(mudCx, mudCy, mudW, mudH, 0, 0, Math.PI * 2)
    ctx.fill()

    const ropeBaseY = floorY - 15 * dpr
    const ropeOffX = (pos - 50) * W * 0.008
    const ribbonX = W * 0.5 + ropeOffX
    ctx.strokeStyle = 'rgba(180,140,80,0.9)'
    ctx.lineWidth = 4 * dpr
    ctx.beginPath()
    ctx.moveTo(W * 0.1, ropeBaseY + Math.sin(t * 3) * 2 * dpr)
    ctx.quadraticCurveTo(ribbonX, ropeBaseY - 8 * dpr + Math.sin(t * 5) * 3 * dpr, W * 0.9, ropeBaseY + Math.sin(t * 3 + 1) * 2 * dpr)
    ctx.stroke()
    ctx.fillStyle = pos > 55 ? '#00E5FF' : pos < 45 ? '#FF4444' : '#FFD93D'
    ctx.beginPath()
    ctx.moveTo(ribbonX, ropeBaseY - 12 * dpr)
    ctx.lineTo(ribbonX - 6 * dpr, ropeBaseY + 4 * dpr)
    ctx.lineTo(ribbonX + 6 * dpr, ropeBaseY + 4 * dpr)
    ctx.closePath()
    ctx.fill()

    const drawTeam = (side: 'left' | 'right', color: string, pullStr: number) => {
      const baseX = side === 'left' ? W * 0.15 + ropeOffX * 0.5 : W * 0.85 + ropeOffX * 0.5
      const dir = side === 'left' ? 1 : -1
      const lean = pullStr * 0.3 * dir
      for (let i = 0; i < 5; i++) {
        const px = baseX + (i * 18 * dpr * -dir)
        const py = floorY - 10 * dpr + Math.sin(t * 6 + i) * 2 * dpr
        const bob = Math.sin(t * 4 + i * 1.2) * 2 * dpr
        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(lean)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, -28 * dpr + bob, 6 * dpr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5 * dpr
        ctx.beginPath()
        ctx.moveTo(0, -22 * dpr + bob)
        ctx.lineTo(0, -4 * dpr + bob)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -4 * dpr + bob)
        ctx.lineTo(-5 * dpr, 10 * dpr + bob)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -4 * dpr + bob)
        ctx.lineTo(5 * dpr, 10 * dpr + bob)
        ctx.stroke()
        ctx.restore()
      }
    }
    drawTeam('left', '#00E5FF', Math.max(0, (pos - 50) / 50))
    drawTeam('right', '#FF4444', Math.max(0, (50 - pos) / 50))

    const barY = H - 20 * dpr
    const barW = W * 0.7
    const barX = (W - barW) / 2
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(barX, barY, barW, 8 * dpr)
    const fillW = (pos / 100) * barW
    const barG = ctx.createLinearGradient(barX, 0, barX + barW, 0)
    barG.addColorStop(0, '#00E5FF')
    barG.addColorStop(0.5, '#FFD93D')
    barG.addColorStop(1, '#FF4444')
    ctx.fillStyle = barG
    ctx.fillRect(barX, barY, fillW, 8 * dpr)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillRect(barX + barW * 0.5 - 1, barY - 2 * dpr, 2, 12 * dpr)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(barX + fillW, barY + 4 * dpr, 4 * dpr, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'tugofwar') return
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

  // Pull for the RIGHT team (opponent side) — used by multiplayer slots 2,3
  const tapPullRight = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return
    const force = 2 + Math.random() * 1
    posRef.current = Math.max(0, posRef.current - force)
    setPosition(posRef.current)
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'tugofwar') return
    ble.registerPuffHandlers('tugofwar', () => tapPull(), null)
    // Team-based MP: slots 0,1 = left (you), slots 2,3 = right (opponent)
    if (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) {
      const pc = ble.ssPlayerCount || 2
      const handlers: { [slot: number]: { down: (() => void) | null; up: (() => void) | null } } = {}
      // 2P: slot 0=left, slot 1=right. 3P: 0,1=left, 2=right. 4P: 0,1=left, 2,3=right.
      for (let s = 0; s < pc; s++) {
        const isRight = pc <= 2 ? s >= 1 : s >= 2
        handlers[s] = {
          down: isRight ? () => tapPullRight() : () => tapPull(),
          up: null,
        }
      }
      ble.registerSlotPuffHandlers(handlers)
    }
    return () => {
      audio.gameSoundsMuted.current = true
      towCleanup()
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id, ble.mpActive, ble.ssPlayerCount])

  if (!phase || game.gameActive?.id !== 'tugofwar') return null

  const isPlaying = phase === 'playing' || phase === 'suddendeath'
  const isSuddenDeath = phase === 'suddendeath'
  const timerDanger = timer <= 5
  const youWinning = position > 50

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: `1px solid ${isSuddenDeath ? 'rgba(255,50,50,0.2)' : 'rgba(96,165,250,0.1)'}` }}>
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
            <span style={{ fontSize: 10, fontWeight: 800, color: isSuddenDeath ? C.red : C.blue }}>💪 TUG OF WAR</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>You:{puffs}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.red }}>AI:{aiPuffs}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: timerDanger ? C.red : C.gold }}>
            {isPlaying ? `${timer}s` : phase === 'intro' ? 'Preparing...' : 'Game Over'}
          </span>
          {isPlaying && <span style={{ fontSize: 9, fontWeight: 700, color: youWinning ? C.cyan : C.red }}>Rope: {Math.round(position)}%</span>}
          {surge && <span style={{ fontSize: 8, fontWeight: 900, color: C.orange }}>3x SURGE</span>}
          {isSuddenDeath && <span style={{ fontSize: 8, fontWeight: 900, color: C.red }}>SUDDEN DEATH</span>}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * TOW_DPR)} height={Math.round(600 * TOW_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)' }}>
            {introStep >= 1 && <div style={{ fontSize: 56, marginBottom: 8 }}>💪</div>}
            {introStep >= 2 && <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, color: C.cyan, textAlign: 'center' }}>TUG OF WAR</div>}
            {introStep >= 3 && <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700 }}>5 vs 5 — DRAG THEM INTO THE MUD!</div>}
            {introStep >= 4 && (
              <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: 20 }}>🟦</span><span style={{ fontSize: 8, color: C.cyan, fontWeight: 800, marginTop: 2 }}>YOUR TEAM</span></div>
                <span style={{ fontSize: 24, color: C.gold, fontWeight: 900 }}>VS</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: 20 }}>🟥</span><span style={{ fontSize: 8, color: C.red, fontWeight: 800, marginTop: 2 }}>AI TEAM</span></div>
              </div>
            )}
            {introStep >= 5 && <div style={{ marginTop: 16, fontSize: 11, color: C.text3 }}>Getting ready...</div>}
          </div>
        )}

        {phase === 'result' && (() => {
          const won = position > 50
          const baseR = won ? 60 : 10
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '😤'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : C.red }}>{won ? 'YOUR TEAM WINS!' : 'AI TEAM WINS!'}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>Position: {Math.round(position)}% | Pulls: {puffs}</div>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: C.text }}>Earned</span>
                  <span style={{ color: C.gold }}>+{baseR} 🪙</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div onClick={() => { setPhase(null); startedRef.current = false; startGame(); startedRef.current = true }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.blue}15`, border: `1px solid ${C.blue}30`, fontSize: 13, fontWeight: 800, color: C.blue, touchAction: 'none' }}>Play Again</div>
                <div onClick={endGame} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>

      {isPlaying && (
        <div style={{ position: 'relative', zIndex: 60, flexShrink: 0, padding: '8px 12px 14px', background: 'rgba(6,16,30,0.98)', borderTop: '1px solid rgba(96,165,250,0.08)' }}>
          {charging && (
            <div style={{ marginBottom: 6 }}>
              <PuffBar power={puffIntensity} charging={true} sweetSpot={sweetSpot} blinkerUsed={false} />
            </div>
          )}
          {!charging && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={(e) => { e.stopPropagation(); tapPull() }} style={{ flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,229,255,0.12),rgba(96,165,250,0.06))', border: '2px solid rgba(0,229,255,0.2)', userSelect: 'none', touchAction: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>TAP</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+2 pull</div>
              </div>
              <div
                onMouseDown={(e) => { e.stopPropagation(); startCharge() }}
                onMouseUp={(e) => { e.stopPropagation(); stopCharge() }}
                onMouseLeave={stopCharge}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startCharge() }}
                onTouchEnd={(e) => { e.stopPropagation(); stopCharge() }}
                onTouchCancel={(e) => { e.stopPropagation(); stopCharge() }}
                style={{ flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,165,0,0.12),rgba(255,70,70,0.06))', border: '2px solid rgba(255,165,0,0.25)', userSelect: 'none', touchAction: 'none' }}
              >
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>PUFF</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +5</div>
              </div>
              <div onClick={(e) => { e.stopPropagation(); blinkerPull() }} style={{ flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)', userSelect: 'none', touchAction: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+10!</div>
              </div>
            </div>
          )}
          {comment && <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: C.text3, fontStyle: 'italic' }}>{comment}</div>}
        </div>
      )}
    </div>
  )
}

