import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

const RP_W = 430
const RP_H = 700
const RP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const GROUND_Y = RP_H * 0.78

interface Platform { x: number; y: number; w: number; coins: boolean[] }

type Phase = 'playing' | 'result' | null

export const RooftopPuffGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)

  const playerY = useRef(GROUND_Y - 20)
  const playerVy = useRef(0)
  const jumpsUsed = useRef(0)
  const platforms = useRef<Platform[]>([])
  const scrollX = useRef(0)
  const baseSpeed = 3
  const boostRef = useRef(false)
  const speedRef = useRef(baseSpeed)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const initPlatforms = useCallback(() => {
    const plats: Platform[] = []
    let cursor = 0
    // Starting platform under player
    plats.push({ x: 0, y: GROUND_Y, w: 220, coins: [] })
    cursor = 220
    for (let i = 0; i < 10; i++) {
      const gap = 40 + Math.random() * 60 + i * 2
      const w = 120 + Math.random() * 120
      const y = GROUND_Y + (Math.random() - 0.5) * 60 * Math.min(1, i / 2)
      const coinFlags: boolean[] = []
      const numCoins = Math.floor(Math.random() * 4)
      for (let c = 0; c < numCoins; c++) coinFlags.push(true)
      plats.push({ x: cursor + gap, y, w, coins: coinFlags })
      cursor += gap + w
    }
    platforms.current = plats
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    playerY.current = GROUND_Y - 20
    playerVy.current = 0
    jumpsUsed.current = 0
    scrollX.current = 0
    setDistance(0); setCoins(0)
    initPlatforms()
    setPhase('playing')
    audio.playFx('crowd')
  }, [audio, initPlatforms])

  const endGame = useCallback(() => {
    setPhase('result')
    audio.playFx('lose')
  }, [audio])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const won = distance >= 1500
    const reward = Math.min(100, Math.round(distance / 30) + coins * 2)
    player.notify(`🏃 ${distance}m · ${coins}🪙 · +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    exitGame()
  }, [distance, coins, player, ble, game, exitGame])

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    if (jumpsUsed.current >= 2) return
    playerVy.current = jumpsUsed.current === 0 ? -11 : -9
    jumpsUsed.current += 1
    audio.playFx('tap')
  }, [audio])

  // Physics + scroll + collision loop
  useEffect(() => {
    if (phase !== 'playing') return
    const tick = setInterval(() => {
      if (!activeRef.current.v) return
      // Speed
      speedRef.current = boostRef.current ? baseSpeed * 1.6 : baseSpeed
      scrollX.current += speedRef.current
      setDistance(d => d + Math.round(speedRef.current))
      // Gravity
      playerVy.current += 0.55
      playerY.current += playerVy.current

      const playerScreenX = RP_W * 0.25
      const playerWorldX = playerScreenX + scrollX.current

      // Platform collision (only when falling)
      let onPlat = false
      for (const p of platforms.current) {
        if (playerWorldX >= p.x && playerWorldX <= p.x + p.w) {
          if (playerVy.current >= 0 && playerY.current >= p.y - 20 && playerY.current <= p.y + 10) {
            playerY.current = p.y - 20
            playerVy.current = 0
            jumpsUsed.current = 0
            onPlat = true
          }
          // Coin collection
          const coinsArr = p.coins
          const relX = playerWorldX - p.x
          const coinIdx = Math.floor(relX / 40) - 1
          if (coinIdx >= 0 && coinIdx < coinsArr.length && coinsArr[coinIdx]) {
            coinsArr[coinIdx] = false
            setCoins(c => c + 1)
            audio.playFx('success')
          }
        }
      }

      // Death if fallen off
      if (playerY.current > RP_H + 40) {
        endGame()
        return
      }
      if (!onPlat && playerY.current >= GROUND_Y + 50) {
        // Check if there's any platform nearby
      }

      // Extend platforms
      const lastP = platforms.current[platforms.current.length - 1]
      if (lastP && lastP.x + lastP.w - scrollX.current < RP_W * 2) {
        const gap = 50 + Math.random() * 90 + Math.min(40, distance / 50)
        const w = 100 + Math.random() * 130
        const y = GROUND_Y + (Math.random() - 0.5) * 90
        const coinFlags: boolean[] = []
        const numCoins = Math.floor(Math.random() * 4)
        for (let c = 0; c < numCoins; c++) coinFlags.push(true)
        platforms.current.push({ x: lastP.x + lastP.w + gap, y, w, coins: coinFlags })
      }
      // Drop platforms left behind
      platforms.current = platforms.current.filter(p => p.x + p.w - scrollX.current > -200)
    }, 1000 / 60)
    return () => clearInterval(tick)
  }, [phase, distance, audio, endGame])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.scale(RP_DPR, RP_DPR)
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, RP_H)
    sky.addColorStop(0, '#FF6B9D'); sky.addColorStop(0.4, '#C084FC'); sky.addColorStop(0.8, '#3B82F6'); sky.addColorStop(1, '#1e3a5c')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, RP_W, RP_H)
    // Sun
    ctx.fillStyle = 'rgba(255,220,100,0.6)'
    ctx.beginPath(); ctx.arc(RP_W * 0.75, 80, 45, 0, Math.PI * 2); ctx.fill()
    // Distant skyline (parallax slow)
    const px = scrollX.current * 0.2
    ctx.fillStyle = 'rgba(20,30,60,0.7)'
    for (let i = 0; i < 14; i++) {
      const bx = (i * 80 - (px % 80)) - 40
      const bh = 60 + (i % 4) * 30
      ctx.fillRect(bx, GROUND_Y - bh - 40, 60, bh)
      // Windows
      ctx.fillStyle = 'rgba(255,220,100,0.3)'
      for (let y = 0; y < bh / 15; y++) {
        for (let xw = 0; xw < 3; xw++) {
          if ((i + y + xw) % 3 === 0) ctx.fillRect(bx + 8 + xw * 15, GROUND_Y - bh - 34 + y * 15, 6, 8)
        }
      }
      ctx.fillStyle = 'rgba(20,30,60,0.7)'
    }
    // Platforms
    for (const p of platforms.current) {
      const sx = p.x - scrollX.current
      if (sx + p.w < 0 || sx > RP_W) continue
      // Building
      ctx.fillStyle = '#2a2438'
      ctx.fillRect(sx, p.y, p.w, RP_H - p.y)
      ctx.fillStyle = '#3a3448'
      ctx.fillRect(sx, p.y, p.w, 6)
      // Roof edge highlight
      ctx.fillStyle = 'rgba(255,107,157,0.4)'
      ctx.fillRect(sx, p.y - 1, p.w, 2)
      // Windows on building
      ctx.fillStyle = 'rgba(255,220,100,0.35)'
      for (let wy = 14; wy < RP_H - p.y; wy += 22) {
        for (let wx = 8; wx < p.w - 10; wx += 22) {
          ctx.fillRect(sx + wx, p.y + wy, 8, 12)
        }
      }
      // Coins
      for (let c = 0; c < p.coins.length; c++) {
        if (!p.coins[c]) continue
        const cx = sx + 20 + c * 40
        const cy = p.y - 30
        ctx.fillStyle = C.gold
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.beginPath(); ctx.arc(cx - 1, cy - 1, 2, 0, Math.PI * 2); ctx.fill()
      }
    }
    // Player
    const playerScreenX = RP_W * 0.25
    ctx.save()
    ctx.shadowColor = '#00E5FF'
    ctx.shadowBlur = 14
    ctx.font = '26px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏃', playerScreenX, playerY.current)
    ctx.restore()
    // Boost trail
    if (boostRef.current) {
      ctx.fillStyle = 'rgba(0,229,255,0.4)'
      for (let i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.arc(playerScreenX - i * 5, playerY.current + (Math.random() - 0.5) * 4, 3 - i * 0.2, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'rooftoppuff') return
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
    if (game.gameActive?.id !== 'rooftoppuff') return
    ble.registerPuffHandlers('rooftoppuff', () => { boostRef.current = true }, () => { boostRef.current = false })
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'rooftoppuff') return null

  const isResult = phase === 'result'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {ui.screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', background: 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.3s ease forwards' }} />}

      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(0,229,255,0.15)' }}>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#00E5FF' }}>🏃 ROOFTOP PUFF</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{distance}m</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>🪙 {coins}</span>
          </div>
        </div>
      </div>

      <div
        style={{ position: 'relative', flex: 1, overflow: 'hidden', touchAction: 'none' }}
        onClick={jump}
        onTouchStart={(e) => { e.preventDefault(); jump() }}
      >
        <canvas ref={canvasRef} width={Math.round(RP_W * RP_DPR)} height={Math.round(RP_H * RP_DPR)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        {phase === 'playing' && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 20, pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', fontSize: 10, color: 'rgba(255,255,255,0.8)', textShadow: '0 0 8px rgba(0,0,0,0.8)', padding: '4px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.4)' }}>
              TAP = jump (double-jump) · Hold PUFF = boost
            </div>
          </div>
        )}

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>💀</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.red, marginBottom: 6 }}>FELL!</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>Distance: {distance}m</div>
            <div style={{ fontSize: 12, color: C.gold, marginBottom: 12 }}>Coins collected: {coins}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
