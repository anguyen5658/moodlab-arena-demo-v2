import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C, HOOK_FISH } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'

const HOOK_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

interface Fish {
  name: string
  emoji: string
  rarity: string
  pts: number
  color: string
  resistance: number
  instability: number
  tensionRate: number
  escapeRate: number
}

interface AmbientFish { x: number; y: number; speed: number; size: number; wobble: number; alpha: number; r: number; g: number; b: number }
interface CaughtFish extends Fish { bonus: number; total: number }

type Phase = 'idle' | 'waiting' | 'bite' | 'reeling' | 'caught' | 'line_break' | 'escaped' | null

export const HookedGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [score, setScore] = useState(0)
  const [fish, setFish] = useState<Fish | null>(null)
  const [catchProgress, setCatchProgress] = useState(0)
  const [lineTension, setLineTension] = useState(0)
  const [recentCatches, setRecentCatches] = useState<CaughtFish[]>([])
  const [catches, setCatches] = useState(0)
  const [snaps, setSnaps] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [comment, setComment] = useState('')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reelRef = useRef(0)
  const holdingRef = useRef(false)
  const tensionRef = useRef(0)
  const progressRef = useRef(0)
  const puffStartRef = useRef(0)
  const fishListRef = useRef<AmbientFish[]>([])
  const phaseRef = useRef<Phase>(null)
  const startedRef = useRef(false)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const spawnFish = useCallback((): Fish => {
    const roll = Math.random()
    const pool = roll < 0.60
      ? (HOOK_FISH as Fish[]).filter(f => f.rarity === 'common')
      : roll < 0.88
        ? (HOOK_FISH as Fish[]).filter(f => f.rarity === 'rare')
        : (HOOK_FISH as Fish[]).filter(f => f.rarity === 'legendary')
    return pool[Math.floor(Math.random() * pool.length)]
  }, [])

  const castLine = useCallback(() => {
    audio.playFx('fishing_cast')
    setPhase('waiting')
    setComment('Line in the water... wait for a bite! 🎣')
    setFish(null)
    setCatchProgress(0)
    setLineTension(0)
    reelRef.current = 0
    tensionRef.current = 0
    progressRef.current = 0
    const waitTime = 2000 + Math.random() * 4000
    setTimeout(() => {
      if (!activeRef.current.v) return
      const f = spawnFish()
      setFish(f)
      setPhase('bite')
      setComment(`${f.emoji} ${f.name} is biting! REEL IN!`)
      audio.playFx('fishing_bite')
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      let catchP = 0, lineT = 0
      const dt = 1 / 30
      gameLoopRef.current = setInterval(() => {
        if (!activeRef.current.v) {
          if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null }
          return
        }
        const reelForce = reelRef.current
        if (reelForce > 0) {
          const tensionGain = reelForce * f.tensionRate * 0.8 * dt
          lineT = Math.min(100, lineT + tensionGain)
        } else {
          lineT = Math.max(0, lineT - 15 * dt)
        }
        if (reelForce > 0 && lineT < 85) {
          const catchGain = reelForce * 0.35 * dt
          catchP = Math.min(100, catchP + catchGain)
        } else if (reelForce === 0) {
          catchP = Math.max(0, catchP - f.escapeRate * 8 * dt)
        }
        if (Math.random() < f.instability * dt * 2) {
          lineT = Math.min(100, lineT + f.resistance * 5)
        }
        tensionRef.current = lineT
        progressRef.current = catchP
        setLineTension(lineT)
        setCatchProgress(catchP)
        if (catchP >= 100) {
          if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null }
          setCombo(prevCombo => {
            const comboMult = 1 + prevCombo * 0.15
            const bonus = Math.round(f.pts * (comboMult - 1))
            const total = f.pts + bonus
            setScore(prev => {
              const ns = prev + total
              setBestScore(b => Math.max(b, ns))
              return ns
            })
            setRecentCatches(prev => [{ ...f, bonus, total }, ...prev].slice(0, 5))
            setCatches(prev => prev + 1)
            setPhase('caught')
            setComment(`CAUGHT! ${f.emoji} ${f.name} +${total}pts!`)
            player.spawnConfetti(25, [f.color, C.green, C.gold])
            audio.playFx('fishing_catch')
            return prevCombo + 1
          })
        } else if (lineT >= 100) {
          if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null }
          setSnaps(prev => prev + 1)
          setCombo(0)
          setPhase('line_break')
          setComment('LINE SNAPPED! 💥 Too much tension!')
          audio.playFx('fishing_snap')
        }
      }, 1000 / 30)
    }, waitTime)
  }, [audio, player, spawnFish])

  const startPuff = useCallback(() => {
    if (phaseRef.current === 'idle') { castLine(); return }
    if (phaseRef.current === 'waiting') return
    if (phaseRef.current !== 'bite' && phaseRef.current !== 'reeling') return
    if (phaseRef.current === 'bite') setPhase('reeling')
    holdingRef.current = true
    puffStartRef.current = Date.now()
    audio.playFx('fishing_reel')
  }, [audio, castLine])

  const stopPuff = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    const dur = puffStartRef.current ? (Date.now() - puffStartRef.current) / 1000 : 0
    puffStartRef.current = 0
    if (dur >= 4.5 && phaseRef.current === 'reeling') {
      progressRef.current = Math.min(100, progressRef.current + 30)
      tensionRef.current = Math.max(0, tensionRef.current - 15)
      setCatchProgress(progressRef.current)
      setLineTension(tensionRef.current)
    }
    reelRef.current = 0
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    setPhase('idle')
    setScore(0)
    setFish(null)
    setCatchProgress(0)
    setLineTension(0)
    setRecentCatches([])
    setCatches(0)
    setSnaps(0)
    setCombo(0)
    setComment('Cast your line into the deep...')
    reelRef.current = 0
    holdingRef.current = false
    tensionRef.current = 0
    progressRef.current = 0
    puffStartRef.current = 0
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null }
    const ambient: AmbientFish[] = []
    for (let i = 0; i < 8; i++) {
      ambient.push({
        x: Math.random() * 420, y: 280 + Math.random() * 200, speed: (Math.random() - 0.5) * 0.6,
        size: 4 + Math.random() * 6, wobble: 0.5 + Math.random(), alpha: 0.08 + Math.random() * 0.12,
        r: Math.floor(40 + Math.random() * 60), g: Math.floor(100 + Math.random() * 100), b: Math.floor(180 + Math.random() * 75),
      })
    }
    fishListRef.current = ambient
  }, [audio])

  const endGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null }
    holdingRef.current = false
    const won = recentCatches.length > 0
    const baseR = won ? Math.min(100, 30 + score) : 10
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(won, baseR, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    player.notify(`🎣 ${recentCatches.length} fish, ${score}pts! +${baseR} coins!`, won ? C.green : C.red)
    setPhase(null)
    game.exitGame()
  }, [audio, player, ble, game, recentCatches.length, score])

  // Reel ramp while holding
  useEffect(() => {
    if (phase !== 'bite' && phase !== 'reeling') return
    const id = setInterval(() => {
      if (holdingRef.current) {
        const dur = puffStartRef.current ? (Date.now() - puffStartRef.current) / 1000 : 0
        let targetForce = 5
        if (dur >= 4.5) targetForce = 20
        else if (dur >= 2.0) targetForce = 15
        else if (dur >= 0.8) targetForce = 10
        reelRef.current = Math.min(targetForce, reelRef.current + targetForce * 0.15)
      } else {
        reelRef.current = Math.max(0, reelRef.current - 8 / 30)
      }
    }, 1000 / 30)
    return () => clearInterval(id)
  }, [phase])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / HOOK_DPR
    const H = canvas.height / HOOK_DPR
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(HOOK_DPR, HOOK_DPR)
    const now = Date.now()
    const t = now * 0.001
    const p = phaseRef.current
    const currentFish = fish
    const tension = tensionRef.current
    const progress = progressRef.current
    const waterY = H * 0.42

    const sky = ctx.createLinearGradient(0, 0, 0, waterY)
    sky.addColorStop(0, '#0B1026')
    sky.addColorStop(0.3, '#1A1040')
    sky.addColorStop(0.6, '#2D1B4E')
    sky.addColorStop(0.8, '#5C2D6E')
    sky.addColorStop(1.0, '#8B3A62')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, waterY + 4)

    for (let i = 0; i < 20; i++) {
      const sx = (i * 47.3 + 13) % W
      const sy = (i * 31.7 + 7) % (waterY * 0.6)
      const flicker = 0.3 + Math.sin(t * 1.5 + i) * 0.3
      ctx.fillStyle = `rgba(255,255,255,${flicker})`
      ctx.beginPath()
      ctx.arc(sx, sy, 0.6 + (i % 2) * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }

    const moonGrad = ctx.createRadialGradient(W * 0.78, H * 0.08, 0, W * 0.78, H * 0.08, 18)
    moonGrad.addColorStop(0, 'rgba(255,230,180,0.9)')
    moonGrad.addColorStop(0.5, 'rgba(255,220,150,0.4)')
    moonGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = moonGrad
    ctx.beginPath()
    ctx.arc(W * 0.78, H * 0.08, 18, 0, Math.PI * 2)
    ctx.fill()

    const water = ctx.createLinearGradient(0, waterY, 0, H)
    water.addColorStop(0, '#0A2342')
    water.addColorStop(0.3, '#071B33')
    water.addColorStop(0.6, '#051428')
    water.addColorStop(1, '#030E1A')
    ctx.fillStyle = water
    ctx.fillRect(0, waterY, W, H - waterY)

    ctx.beginPath()
    ctx.moveTo(0, waterY)
    for (let x = 0; x <= W; x += 2) {
      const wave1 = Math.sin(x * 0.025 + t * 1.2) * 3
      const wave2 = Math.sin(x * 0.04 + t * 0.8 + 1) * 2
      ctx.lineTo(x, waterY + wave1 + wave2)
    }
    ctx.lineTo(W, waterY + 20)
    ctx.lineTo(0, waterY + 20)
    ctx.closePath()
    ctx.fillStyle = 'rgba(10,35,66,0.6)'
    ctx.fill()

    const dockY = waterY - 6
    const dockW = 60
    const dockX = W * 0.18
    ctx.fillStyle = '#3B2415'
    ctx.fillRect(dockX, dockY, dockW, 8)
    ctx.fillStyle = '#2A1A0E'
    ctx.fillRect(dockX + 8, dockY + 6, 4, 20)
    ctx.fillRect(dockX + dockW - 12, dockY + 6, 4, 20)
    ctx.fillStyle = '#4A3020'
    for (let i = 0; i < 4; i++) ctx.fillRect(dockX + i * 15 + 2, dockY, 12, 3)

    const rodBase = { x: dockX + dockW - 8, y: dockY - 2 }
    const rodTip = { x: W * 0.52, y: waterY - 30 }
    ctx.strokeStyle = '#5A4030'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(rodBase.x, rodBase.y)
    ctx.quadraticCurveTo(rodBase.x + 20, rodBase.y - 40, rodTip.x, rodTip.y)
    ctx.stroke()

    const bobberX = W * 0.52 + Math.sin(t * 1.5) * 2
    const bobFloat = (p === 'bite' || p === 'reeling') ? Math.sin(t * 8) * 4 : Math.sin(t * 1.2) * 1.5
    const bobberY = waterY + 2 + bobFloat
    const tensionColor = tension > 80 ? '#FF2222' : tension > 55 ? '#FF8C42' : tension > 30 ? '#FFD93D' : '#60A5FA'
    ctx.strokeStyle = tensionColor
    ctx.lineWidth = tension > 80 ? 1.8 : 1
    ctx.setLineDash(tension > 80 ? [3, 2] : [])
    ctx.beginPath()
    ctx.moveTo(rodTip.x, rodTip.y)
    ctx.lineTo(bobberX, bobberY)
    ctx.stroke()
    ctx.setLineDash([])

    const bobScale = (p === 'bite') ? 1 + Math.sin(t * 12) * 0.15 : 1
    ctx.save()
    ctx.translate(bobberX, bobberY)
    ctx.scale(bobScale, bobScale)
    ctx.fillStyle = '#FF3333'
    ctx.beginPath()
    ctx.arc(0, -3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 2, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const fishList = fishListRef.current
    for (let i = 0; i < fishList.length; i++) {
      const f = fishList[i]
      f.x += f.speed
      if (f.x > W + 20) f.x = -20
      if (f.x < -20) f.x = W + 20
      const fy = f.y + Math.sin(t * f.wobble + i) * 4
      ctx.save()
      ctx.translate(f.x, fy)
      if (f.speed < 0) ctx.scale(-1, 1)
      ctx.fillStyle = `rgba(${f.r},${f.g},${f.b},${f.alpha})`
      ctx.beginPath()
      ctx.ellipse(0, 0, f.size * 1.5, f.size * 0.6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    if (p === 'reeling' && currentFish && progress > 40) {
      const emergeY = waterY - (progress - 40) * 0.5
      const wobble = Math.sin(t * 6) * 3
      ctx.font = `${20 + progress * 0.1}px serif`
      ctx.textAlign = 'center'
      ctx.fillText(currentFish.emoji, bobberX + wobble, emergeY)
    }

    if (p === 'caught' && currentFish) {
      const bounceY = waterY - 50 + Math.sin(t * 4) * 5
      ctx.font = '36px serif'
      ctx.textAlign = 'center'
      ctx.fillText(currentFish.emoji, W / 2, bounceY)
    }

    ctx.restore()
  }, [fish])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'hooked') return
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

  useEffect(() => {
    if (game.gameActive?.id !== 'hooked') return
    ble.registerPuffHandlers('hooked', () => startPuff(), () => stopPuff())
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'hooked') return null

  const isReeling = phase === 'bite' || phase === 'reeling'
  const critTension = lineTension > 80
  const gameOver = catches >= 5 || snaps >= 3
  const isResult = phase === 'caught' || phase === 'line_break' || phase === 'escaped'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(0,150,255,0.1)' }}>
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
            <span style={{ fontSize: 10, fontWeight: 800, color: C.cyan }}>🎣 HOOKED</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{catches}/5 caught</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: snaps >= 2 ? C.red : C.text3 }}>{snaps}/3 snaps</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>{score} pts</span>
            {combo > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: C.green }}>COMBO x{combo}</span>}
            <span style={{ fontSize: 8, color: C.text3 }}>Best: {bestScore}</span>
          </div>
          {isReeling && (
            <div style={{ marginBottom: 2 }}>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${catchProgress}%`, height: '100%', borderRadius: 3, transition: 'width 0.05s', background: `linear-gradient(90deg,${C.green}80,${C.green})` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                <span style={{ fontSize: 7, color: C.green }}>Catch</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: catchProgress > 80 ? C.green : C.text3 }}>{Math.round(catchProgress)}%</span>
              </div>
            </div>
          )}
          {isReeling && (
            <div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${lineTension}%`, height: '100%', borderRadius: 2, transition: 'width 0.05s', background: lineTension > 70 ? `linear-gradient(90deg,${C.orange},${C.red})` : `linear-gradient(90deg,${C.gold}80,${C.orange})` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                <span style={{ fontSize: 7, color: lineTension > 70 ? C.red : C.orange }}>Tension</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: lineTension > 70 ? C.red : C.text3 }}>{Math.round(lineTension)}%{critTension ? ' DANGER!' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
        onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; startPuff() }}
        onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; stopPuff() }}
        onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; startPuff() }}
        onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; stopPuff() }}
      >
        <canvas ref={canvasRef} width={Math.round(420 * HOOK_DPR)} height={Math.round(600 * HOOK_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {isReeling && fish && (
          <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: fish.color }}>{fish.emoji} {fish.name}</div>
            <div style={{ fontSize: 8, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{fish.rarity} · {fish.pts}pts</div>
          </div>
        )}
        {comment && (
          <div style={{ position: 'absolute', top: isReeling ? 40 : 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '4px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', maxWidth: 300, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.text, fontStyle: 'italic' }}>{comment}</div>
          </div>
        )}

        {isResult && gameOver && (() => {
          const won = catches > 0
          const baseR = won ? Math.min(100, 30 + score) : 10
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '💀'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : C.red }}>{won ? 'GREAT HAUL!' : 'GAME OVER'}</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{catches} fish caught · {snaps} line snaps</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, marginTop: 6 }}>{score} pts</div>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>CATCH LOG</div>
                {recentCatches.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                    <span style={{ fontSize: 14 }}>{c.emoji}</span>
                    <span style={{ fontSize: 9, color: c.color, fontWeight: 700 }}>{c.name}</span>
                    <span style={{ fontSize: 8, color: C.gold, fontWeight: 700, marginLeft: 'auto' }}>+{c.total}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 8, width: '80%', maxWidth: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: C.text }}>Earned</span>
                  <span style={{ color: C.gold }}>+{baseR} 🪙</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div onClick={() => { setPhase(null); startedRef.current = false; startGame(); startedRef.current = true }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan, touchAction: 'none' }}>Play Again</div>
                <div onClick={endGame} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>

      <div style={{ position: 'relative', zIndex: 60, flexShrink: 0, padding: '8px 12px 14px', background: 'rgba(6,16,30,0.98)', borderTop: '1px solid rgba(0,150,255,0.08)' }}>
        {phase === 'idle' && (
          <div onClick={(e) => { e.stopPropagation(); castLine() }} data-btn="true" style={{ padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', touchAction: 'none', background: `linear-gradient(135deg,${C.cyan}20,${C.blue}10)`, border: `2px solid ${C.cyan}30`, userSelect: 'none' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, letterSpacing: 2 }}>CAST LINE</div>
            <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Tap or puff to cast</div>
          </div>
        )}
        {isReeling && !holdingRef.current && (
          <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: critTension ? 'rgba(255,34,34,0.1)' : 'rgba(0,229,255,0.06)', border: `1px solid ${critTension ? C.red + '30' : C.cyan + '20'}` }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: critTension ? C.red : C.cyan, letterSpacing: 1 }}>
              {critTension ? 'EASE UP! LINE BREAKING!' : 'HOLD TO REEL IN!'}
            </div>
            <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Puff longer = stronger reel</div>
          </div>
        )}
        {phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 11, color: C.cyan, fontWeight: 700 }}>Waiting for bite... 🎣</span>
          </div>
        )}
        {isResult && !gameOver && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <div onClick={(e) => { e.stopPropagation(); castLine() }} data-btn="true" style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Cast Again</div>
            <div onClick={(e) => { e.stopPropagation(); endGame() }} data-btn="true" style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
          </div>
        )}
      </div>
    </div>
  )
}

