import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

const FW_W = 430
const FW_H = 700
const FW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

interface Fish {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  emoji: string
  ai: boolean
}

type Phase = 'playing' | 'result' | null

const FISH_EMOJIS = ['🐠', '🐟', '🐡', '🦈']
const FISH_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181']

export const FishWarGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [score, setScore] = useState(0)
  const [size, setSize] = useState(14)
  const [eaten, setEaten] = useState(0)
  const [won, setWon] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fishRef = useRef<Fish[]>([])
  const youRef = useRef<Fish | null>(null)
  const animRef = useRef<number | null>(null)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)
  const boostRef = useRef(false)
  const joyRef = useRef<{ x: number; y: number } | null>(null)
  const targetRef = useRef<{ x: number; y: number } | null>(null)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const spawnFish = useCallback((nextId: { n: number }) => {
    const side = Math.floor(Math.random() * 4)
    let x = 0, y = 0
    if (side === 0) { x = -30; y = Math.random() * FW_H }
    else if (side === 1) { x = FW_W + 30; y = Math.random() * FW_H }
    else if (side === 2) { x = Math.random() * FW_W; y = -30 }
    else { x = Math.random() * FW_W; y = FW_H + 30 }
    const tx = FW_W / 2 + (Math.random() - 0.5) * 100
    const ty = FW_H / 2 + (Math.random() - 0.5) * 100
    const dx = tx - x, dy = ty - y
    const mag = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    const speed = 0.4 + Math.random() * 0.6
    const mySize = youRef.current?.size ?? 14
    const sz = Math.max(6, mySize + (Math.random() * 20 - 8))
    return {
      id: nextId.n++,
      x, y,
      vx: (dx / mag) * speed,
      vy: (dy / mag) * speed,
      size: sz,
      color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
      emoji: FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)],
      ai: true,
    } as Fish
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    const you: Fish = { id: 0, x: FW_W / 2, y: FW_H / 2, vx: 0, vy: 0, size: 14, color: '#00E5FF', emoji: '🐠', ai: false }
    youRef.current = you
    const idCounter = { n: 1 }
    const initial: Fish[] = []
    for (let i = 0; i < 12; i++) initial.push(spawnFish(idCounter))
    fishRef.current = initial
    ;(fishRef.current as any)._idCounter = idCounter
    setScore(0); setSize(14); setEaten(0); setWon(false)
    setPhase('playing')
    audio.playFx('crowd')
  }, [audio, spawnFish])

  const endGame = useCallback((w: boolean) => {
    setWon(w)
    setPhase('result')
    audio.playFx(w ? 'win' : 'lose')
    if (w) player.spawnConfetti(40)
  }, [audio, player])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const reward = won ? 80 : Math.min(40, Math.round(score / 10))
    player.notify(won ? `🐠 500 POINTS! +${reward} coins` : `🐟 ${score} pts, +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    exitGame()
  }, [won, score, player, ble, game, exitGame])

  // Game tick — updates fish positions, collisions, eating
  useEffect(() => {
    if (phase !== 'playing') return
    const tick = setInterval(() => {
      if (!activeRef.current.v) return
      const you = youRef.current
      if (!you) return
      // Move player
      const target = targetRef.current
      if (target) {
        const dx = target.x - you.x
        const dy = target.y - you.y
        const mag = Math.sqrt(dx * dx + dy * dy)
        if (mag > 2) {
          const sp = boostRef.current ? 4.5 : 2.5
          you.vx = (dx / mag) * sp
          you.vy = (dy / mag) * sp
        } else {
          you.vx *= 0.9
          you.vy *= 0.9
        }
      }
      you.x = Math.max(you.size, Math.min(FW_W - you.size, you.x + you.vx))
      you.y = Math.max(you.size, Math.min(FW_H - you.size, you.y + you.vy))

      // Move AI fish
      const list = fishRef.current
      for (let i = list.length - 1; i >= 0; i--) {
        const f = list[i]
        f.x += f.vx
        f.y += f.vy
        // Bounce off edges a bit
        if (f.x < -60 || f.x > FW_W + 60 || f.y < -60 || f.y > FW_H + 60) {
          list.splice(i, 1)
          continue
        }
        // Collision with player
        const dx = f.x - you.x
        const dy = f.y - you.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < (f.size + you.size) * 0.7) {
          if (you.size > f.size * 1.05) {
            // Eat
            const pts = Math.floor(f.size * 3)
            setScore(s => {
              const ns = s + pts
              if (ns >= 500) {
                setSize(you.size + 1)
                you.size += 1
                endGame(true)
              }
              return ns
            })
            setEaten(e => e + 1)
            you.size = Math.min(60, you.size + 0.8)
            setSize(Math.round(you.size))
            audio.playFx('success')
            list.splice(i, 1)
          } else if (f.size > you.size * 1.15) {
            // Eaten
            audio.playFx('lose')
            ui.setScreenFlash('miss'); setTimeout(() => ui.setScreenFlash(null), 300)
            endGame(false)
            return
          }
        }
      }

      // Spawn more if low
      const idCounter = (list as any)._idCounter ?? { n: 1000 }
      while (list.length < 12) list.push(spawnFish(idCounter))
    }, 33)
    return () => clearInterval(tick)
  }, [phase, audio, ui, endGame, spawnFish])

  // Draw
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.scale(FW_DPR, FW_DPR)
    // Ocean
    const g = ctx.createLinearGradient(0, 0, 0, FW_H)
    g.addColorStop(0, '#0a3866')
    g.addColorStop(0.5, '#0e4d80')
    g.addColorStop(1, '#031a36')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, FW_W, FW_H)
    // Bubbles
    const t = Date.now() * 0.001
    for (let i = 0; i < 15; i++) {
      const bx = (i * 41 + 20) % FW_W
      const by = (FW_H - ((t * 30 + i * 80) % FW_H))
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2); ctx.fill()
    }
    // AI fish
    for (const f of fishRef.current) {
      ctx.save()
      ctx.translate(f.x, f.y)
      if (f.vx < 0) ctx.scale(-1, 1)
      ctx.font = `${f.size * 1.4}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.emoji, 0, 0)
      ctx.restore()
    }
    // You
    const you = youRef.current
    if (you) {
      ctx.save()
      ctx.translate(you.x, you.y)
      if (you.vx < 0) ctx.scale(-1, 1)
      ctx.shadowColor = '#00E5FF'
      ctx.shadowBlur = 12
      ctx.font = `${you.size * 1.6}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🐠', 0, 0)
      ctx.restore()
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'fishwar') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!phase) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [drawCanvas, phase])

  useEffect(() => {
    if (game.gameActive?.id !== 'fishwar') return
    ble.registerPuffHandlers('fishwar', () => { boostRef.current = true }, () => { boostRef.current = false })
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  const handleMove = (clientX: number, clientY: number, rect: DOMRect) => {
    const rx = ((clientX - rect.left) / rect.width) * FW_W
    const ry = ((clientY - rect.top) / rect.height) * FW_H
    targetRef.current = { x: rx, y: ry }
  }

  if (!phase || game.gameActive?.id !== 'fishwar') return null

  const isResult = phase === 'result'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {ui.screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', background: 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.3s ease forwards' }} />}

      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
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
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={() => { audio.playFx('tap'); exitGame() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, touchAction: 'none' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#3B82F6' }}>🐟 FISH WAR</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{score}/500</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>Size {size}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>Eaten: {eaten}</span>
          </div>
        </div>
      </div>

      <div
        style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#031a36', touchAction: 'none' }}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => { const t = e.touches[0]; handleMove(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect()) }}
        onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; handleMove(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect()) }}
      >
        <canvas ref={canvasRef} width={Math.round(FW_W * FW_DPR)} height={Math.round(FW_H * FW_DPR)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        {phase === 'playing' && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 20, padding: '0 12px', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.7)', textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>
              Drag to swim · Hold puff to BOOST · Eat smaller fish · Reach 500
            </div>
          </div>
        )}

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: won ? C.green : C.red, marginBottom: 6 }}>{won ? 'SURVIVED!' : 'EATEN!'}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>Fish eaten: {eaten}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
