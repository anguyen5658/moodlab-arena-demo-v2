import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { useUIContext } from '../../../context/UIContext'

const TW_W = 860
const TW_H = 600
const TW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const TW_GRAVITY = 0.26
const TW_WIND_FACTOR = 0.018

interface Tank { id: number; name: string; hp: number; maxHp: number; x: number; y: number; color: string; isPlayer: boolean; alive: boolean }
interface Shell { x: number; y: number; vx: number; vy: number; ownerId: number; trail: { x: number; y: number }[] }
type Phase = 'intro' | 'aiming' | 'charging' | 'flight' | 'ai_turn' | 'result' | null

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const TW_ROASTS = ['Direct hit! 🎯', 'Clean shot!', 'The crowd goes wild!', 'Absolute SNIPER!']
const TW_MISS = ['Wind said nope 🌬️', 'Missed by a mile', 'Try again, soldier']

export const TankWarGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const ui = useUIContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [angle, setAngle] = useState(45)
  const [power, setPower] = useState(0)
  const [wind, setWind] = useState(0)
  const [tanks, setTanks] = useState<Tank[]>([])
  const [turnIdx, setTurnIdx] = useState(0)
  const [comment, setComment] = useState('')
  const [charging, setCharging] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const terrainRef = useRef<number[]>([])
  const tanksRef = useRef<Tank[]>([])
  const turnIdxRef = useRef(0)
  const shellRef = useRef<Shell | null>(null)
  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const animRef = useRef<number | null>(null)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)
  const windRef = useRef(0)
  const angleRef = useRef(45)
  const powerRef = useRef(0)
  const chargingRef = useRef(false)
  const phaseRef = useRef<Phase>(null)

  useEffect(() => { tanksRef.current = tanks }, [tanks])
  useEffect(() => { turnIdxRef.current = turnIdx }, [turnIdx])
  useEffect(() => { windRef.current = wind }, [wind])
  useEffect(() => { angleRef.current = angle }, [angle])
  useEffect(() => { powerRef.current = power }, [power])
  useEffect(() => { chargingRef.current = charging }, [charging])
  useEffect(() => { phaseRef.current = phase }, [phase])

  const genTerrain = useCallback(() => {
    const t = new Array(TW_W)
    let h = TW_H * 0.48 + (Math.random() - 0.5) * 30
    for (let i = 0; i < TW_W; i++) {
      h += (Math.random() - 0.5) * 3
      h = Math.max(TW_H * 0.32, Math.min(TW_H * 0.68, h))
      t[i] = h
    }
    for (let p = 0; p < 3; p++) {
      for (let i = 1; i < TW_W - 1; i++) t[i] = (t[i - 1] + t[i] + t[i + 1]) / 3
    }
    return t
  }, [])

  const fireShotRef = useRef<() => void>(() => {})
  const nextTurnRef = useRef<() => void>(() => {})
  const aiTurnRef = useRef<() => void>(() => {})

  const fireShot = useCallback(() => {
    const tks = tanksRef.current
    const idx = turnIdxRef.current
    const me = tks[idx]
    if (!me) return
    const rad = (angleRef.current * Math.PI) / 180
    const v = powerRef.current * 0.22
    const dir = idx === 0 ? 1 : -1
    const shell: Shell = {
      x: me.x,
      y: me.y - 10,
      vx: Math.cos(rad) * v * dir,
      vy: -Math.sin(rad) * v,
      ownerId: idx,
      trail: [],
    }
    shellRef.current = shell
    setPhase('flight')
    audio.playFx('kick')

    // Tick physics
    const tick = setInterval(() => {
      const s = shellRef.current
      if (!s || !activeRef.current.v) { clearInterval(tick); return }
      s.vy += TW_GRAVITY
      s.vx += windRef.current * TW_WIND_FACTOR
      s.x += s.vx * 2
      s.y += s.vy * 2
      s.trail.push({ x: s.x, y: s.y })
      if (s.trail.length > 20) s.trail.shift()

      // Ground hit
      const terrain = terrainRef.current
      const xi = Math.floor(s.x)
      if (xi < 0 || xi >= TW_W) {
        shellRef.current = null
        clearInterval(tick)
        setComment(pick(TW_MISS))
        setTimeout(() => nextTurnRef.current(), 600)
        return
      }
      if (s.y >= terrain[xi]) {
        // Crater
        for (let i = -30; i <= 30; i++) {
          const ti = xi + i
          if (ti >= 0 && ti < TW_W) {
            const depth = Math.sqrt(Math.max(0, 900 - i * i))
            terrain[ti] = Math.min(TW_H - 10, terrain[ti] + depth * 0.3)
          }
        }
        // Tank hit check
        let hit = false
        for (const t of tks) {
          if (!t.alive || t.id === s.ownerId) continue
          const dx = t.x - s.x
          const dy = t.y - s.y
          if (Math.sqrt(dx * dx + dy * dy) < 40) {
            t.hp = Math.max(0, t.hp - 30)
            if (t.hp <= 0) t.alive = false
            setTanks([...tks])
            hit = true
            break
          }
        }
        // Re-seat tanks on new terrain
        for (const t of tks) {
          const tx = Math.floor(t.x)
          if (tx >= 0 && tx < TW_W) t.y = terrain[tx]
        }
        shellRef.current = null
        clearInterval(tick)
        if (hit) {
          audio.playFx('win')
          ui.setScreenFlash('goal'); setTimeout(() => ui.setScreenFlash(null), 300)
          setComment(pick(TW_ROASTS))
        } else {
          audio.playFx('miss')
          setComment(pick(TW_MISS))
        }
        const aliveEnemies = tks.filter(t => t.alive && t.id !== 0).length
        const youAlive = tks[0].alive
        if (!aliveEnemies || !youAlive) {
          setTimeout(() => setPhase('result'), 800)
        } else {
          setTimeout(() => nextTurnRef.current(), 900)
        }
      }
    }, 33)
  }, [audio, ui])

  useEffect(() => { fireShotRef.current = fireShot }, [fireShot])

  const nextTurn = useCallback(() => {
    const tks = tanksRef.current
    const nextIdx = (turnIdxRef.current + 1) % tks.length
    setTurnIdx(nextIdx)
    setPower(0); setAngle(45)
    setWind(Math.round((Math.random() - 0.5) * 4.5 * 10) / 10)
    const next = tks[nextIdx]
    if (!next?.alive) {
      setTimeout(() => nextTurnRef.current(), 50)
      return
    }
    if (next.isPlayer) {
      setPhase('aiming')
      setComment('Your turn! Aim and fire!')
    } else {
      setPhase('ai_turn')
      setComment(`${next.name} is aiming...`)
      setTimeout(() => aiTurnRef.current(), 1200)
    }
  }, [])
  useEffect(() => { nextTurnRef.current = nextTurn }, [nextTurn])

  const aiTurn = useCallback(() => {
    if (!activeRef.current.v) return
    // Simple AI: rough ballistic aim at player
    const tks = tanksRef.current
    const me = tks[1]
    const you = tks[0]
    if (!me || !you) return
    const dx = me.x - you.x
    const range = Math.abs(dx)
    const aiAngle = 40 + Math.random() * 25
    const aiPower = Math.min(100, 25 + range * 0.10 + (Math.random() - 0.5) * 20)
    setAngle(aiAngle)
    setPower(aiPower)
    angleRef.current = aiAngle
    powerRef.current = aiPower
    setTimeout(() => fireShotRef.current(), 500)
  }, [])
  useEffect(() => { aiTurnRef.current = aiTurn }, [aiTurn])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    const terrain = genTerrain()
    terrainRef.current = terrain
    const p: Tank = { id: 0, name: 'You', hp: 100, maxHp: 100, x: 80, y: terrain[80], color: '#4CAF50', isPlayer: true, alive: true }
    const e: Tank = { id: 1, name: 'TankBot', hp: 100, maxHp: 100, x: TW_W - 80, y: terrain[TW_W - 80], color: '#EF4444', isPlayer: false, alive: true }
    setTanks([p, e])
    tanksRef.current = [p, e]
    setTurnIdx(0); turnIdxRef.current = 0
    setAngle(45); setPower(0)
    setWind(Math.round((Math.random() - 0.5) * 4.5 * 10) / 10)
    setPhase('intro')
    setComment('Tank War! Aim and FIRE!')
    audio.playFx('crowd')
    setTimeout(() => {
      if (!activeRef.current.v) return
      setPhase('aiming')
    }, 1500)
  }, [audio, genTerrain])

  const startCharge = useCallback(() => {
    if (phaseRef.current !== 'aiming') return
    if (!tanksRef.current[turnIdxRef.current]?.isPlayer) return
    if (chargingRef.current) return
    setCharging(true); setPower(0)
    setPhase('charging')
    if (chargeInterval.current) clearInterval(chargeInterval.current)
    let pwr = 0
    chargeInterval.current = setInterval(() => {
      pwr = Math.min(100, pwr + 2)
      setPower(pwr)
      if (pwr >= 100) { stopChargeRef.current() }
    }, 33)
  }, [])
  const stopChargeRef = useRef<() => void>(() => {})

  const stopCharge = useCallback(() => {
    if (!chargingRef.current) return
    setCharging(false)
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
    fireShotRef.current()
  }, [])
  useEffect(() => { stopChargeRef.current = stopCharge }, [stopCharge])

  const adjustAngle = (delta: number) => {
    if (phaseRef.current !== 'aiming') return
    setAngle(a => Math.max(5, Math.min(175, a + delta)))
    audio.playFx('tap')
  }

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const finishGame = useCallback((won: boolean) => {
    const reward = won ? 80 : 12
    player.notify(won ? `💥 VICTORY! +${reward} coins` : `😢 Defeated +${reward} coins`, won ? C.green : C.red)
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(won, reward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    exitGame()
  }, [player, audio, ble, game, exitGame])

  // Draw
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.scale(TW_DPR, TW_DPR)
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, TW_H)
    sky.addColorStop(0, '#1e3a5c'); sky.addColorStop(0.5, '#2d5480'); sky.addColorStop(1, '#5c7a99')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, TW_W, TW_H)
    // Sun
    ctx.fillStyle = 'rgba(255,220,100,0.4)'
    ctx.beginPath(); ctx.arc(TW_W * 0.15, 80, 40, 0, Math.PI * 2); ctx.fill()
    // Terrain
    const terrain = terrainRef.current
    if (terrain.length) {
      const g = ctx.createLinearGradient(0, TW_H * 0.3, 0, TW_H)
      g.addColorStop(0, '#5c9a3a'); g.addColorStop(0.3, '#3d7a24'); g.addColorStop(1, '#2a5018')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, TW_H)
      for (let i = 0; i < TW_W; i++) ctx.lineTo(i, terrain[i])
      ctx.lineTo(TW_W, TW_H); ctx.closePath(); ctx.fill()
    }
    // Tanks
    for (const t of tanksRef.current) {
      if (!t.alive) continue
      ctx.fillStyle = t.color
      ctx.fillRect(t.x - 18, t.y - 14, 36, 14)
      ctx.fillRect(t.x - 22, t.y, 44, 8)
      // Barrel (show angle only for current player)
      if (t.id === turnIdxRef.current) {
        const rad = (angleRef.current * Math.PI) / 180
        const dir = t.id === 0 ? 1 : -1
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(t.x, t.y - 14)
        ctx.lineTo(t.x + Math.cos(rad) * 30 * dir, t.y - 14 - Math.sin(rad) * 30)
        ctx.stroke()
      }
      // HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(t.x - 25, t.y - 28, 50, 6)
      ctx.fillStyle = t.hp > 50 ? '#4caf50' : t.hp > 25 ? '#ffb300' : '#f44336'
      ctx.fillRect(t.x - 24, t.y - 27, 48 * (t.hp / t.maxHp), 4)
    }
    // Shell + trail
    const s = shellRef.current
    if (s) {
      ctx.strokeStyle = 'rgba(255,140,60,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < s.trail.length; i++) {
        const p = s.trail[i]
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
      ctx.fillStyle = '#ff6b35'
      ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'tankwar') return
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
    if (game.gameActive?.id !== 'tankwar') return
    ble.registerPuffHandlers('tankwar', () => startCharge(), () => stopCharge())
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'tankwar') return null

  const youAlive = tanks[0]?.alive
  const aiAlive = tanks[1]?.alive
  const won = !aiAlive && youAlive
  const isResult = phase === 'result'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none',
      animation: ui.screenShake ? 'shake 0.4s ease' : 'none' }}>
      {ui.screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none',
        background: 'rgba(255,215,0,0.2)', animation: 'flashOverlay 0.3s ease forwards' }} />}

      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(76,175,80,0.15)' }}>
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
            <span style={{ fontSize: 10, fontWeight: 800, color: '#4CAF50' }}>🔫 TANK WAR</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>You: {tanks[0]?.hp ?? 0}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.red }}>AI: {tanks[1]?.hp ?? 0}</span>
          </div>
          <span style={{ fontSize: 8, color: C.text3 }}>Wind: {wind > 0 ? '→' : '←'} {Math.abs(wind).toFixed(1)}</span>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#1e3a5c' }}>
        <canvas ref={canvasRef} width={Math.round(TW_W * TW_DPR)} height={Math.round(TW_H * TW_DPR)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        {comment && !isResult && (
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 25, pointerEvents: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textShadow: '0 0 12px rgba(0,0,0,0.9)', padding: '5px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)' }}>
              {comment}
            </div>
          </div>
        )}

        {phase === 'aiming' && youAlive && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 20, padding: '6px 12px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, justifyContent: 'center' }}>
              <div onClick={() => adjustAngle(-5)} style={{ padding: '10px 16px', borderRadius: 10, cursor: 'pointer', background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', fontSize: 14, fontWeight: 900, color: C.cyan, touchAction: 'none' }}>◀ -5°</div>
              <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', fontSize: 14, fontWeight: 900, color: '#fff' }}>{Math.round(angle)}°</div>
              <div onClick={() => adjustAngle(5)} style={{ padding: '10px 16px', borderRadius: 10, cursor: 'pointer', background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', fontSize: 14, fontWeight: 900, color: C.cyan, touchAction: 'none' }}>+5° ▶</div>
            </div>
            <div
              onMouseDown={() => startCharge()}
              onMouseUp={stopCharge}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startCharge() }}
              onTouchEnd={(e) => { e.stopPropagation(); stopCharge() }}
              onTouchCancel={(e) => { e.stopPropagation(); stopCharge() }}
              style={{
                padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                background: charging ? 'linear-gradient(90deg,#4CAF50,#ff6b35)' : 'rgba(76,175,80,0.2)',
                border: '2px solid #4CAF50', fontSize: 14, fontWeight: 900, color: '#fff',
                touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
                position: 'relative', overflow: 'hidden',
              }}>
              {charging && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: power + '%', background: 'rgba(255,255,255,0.15)', transition: 'width 0.05s' }} />}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {charging ? `POWER ${Math.round(power)}%` : 'HOLD TO CHARGE · RELEASE TO FIRE'}
              </div>
            </div>
          </div>
        )}

        {phase === 'charging' && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 20, padding: '6px 12px' }}>
            <div
              onMouseUp={stopCharge}
              onMouseLeave={stopCharge}
              onTouchEnd={(e) => { e.stopPropagation(); stopCharge() }}
              onTouchCancel={(e) => { e.stopPropagation(); stopCharge() }}
              style={{
                padding: '14px 0', borderRadius: 14, textAlign: 'center',
                background: 'linear-gradient(90deg,#4CAF50,#ff6b35)',
                border: '2px solid #ff6b35', fontSize: 14, fontWeight: 900, color: '#fff',
                position: 'relative', overflow: 'hidden', touchAction: 'none',
              }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: power + '%', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>POWER {Math.round(power)}% — RELEASE!</div>
            </div>
          </div>
        )}

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: won ? C.green : C.red, marginBottom: 6 }}>{won ? 'VICTORY!' : 'DEFEATED'}</div>
            <div style={{ fontSize: 11, color: C.text2, marginBottom: 12 }}>{won ? 'Enemy tank destroyed!' : 'Your tank is scrap...'}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div onClick={() => finishGame(won)} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
