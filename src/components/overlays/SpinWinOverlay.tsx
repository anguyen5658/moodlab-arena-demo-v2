import React, { useCallback, useRef, useState } from 'react'
import { C } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'

const SW_SEGMENTS = [
  { label: '50', value: 50, color: C.cyan, emoji: '🪙' },
  { label: '100', value: 100, color: C.green, emoji: '💰' },
  { label: 'BUST', value: -50, color: C.red, emoji: '💀' },
  { label: '200', value: 200, color: C.gold, emoji: '🏆' },
  { label: '75', value: 75, color: '#60A5FA', emoji: '🪙' },
  { label: 'BUST', value: -50, color: C.red, emoji: '💀' },
  { label: '150', value: 150, color: C.purple, emoji: '💎' },
  { label: '50', value: 50, color: C.cyan, emoji: '🪙' },
  { label: '500', value: 500, color: C.gold, emoji: '🎰' },
  { label: 'BUST', value: -50, color: C.red, emoji: '💀' },
  { label: '100', value: 100, color: C.green, emoji: '💰' },
  { label: 'JACKPOT', value: 1000, color: C.gold, emoji: '👑' },
]

type Phase = 'ready' | 'spinning' | 'result' | null

/**
 * Spin & Win — 12-segment reward wheel.
 * Launched from the Stage zone "Spin & Win" card.
 */
export const SpinWinOverlay: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const player = usePlayerContext()
  const audio = useAudioContext()
  const game = useGameContext()

  const [phase, setPhase] = useState<Phase>('ready')
  const [angle, setAngle] = useState(0)
  const [prize, setPrize] = useState<typeof SW_SEGMENTS[0] | null>(null)
  const [totalWon, setTotalWon] = useState(0)
  const [spins, setSpins] = useState(0)
  const spinningRef = useRef(false)

  const doSpin = useCallback(() => {
    if (spinningRef.current) return
    spinningRef.current = true
    setPhase('spinning')
    setPrize(null)
    audio.playFx('charge')

    const rotations = 3 + Math.random() * 4
    const extraDeg = Math.random() * 360
    const totalDeg = rotations * 360 + extraDeg

    setAngle(prev => prev + totalDeg)
    setSpins(s => s + 1)

    const spinDuration = Math.min(2500 + rotations * 400, 5000)
    setTimeout(() => {
      spinningRef.current = false
      const finalAngle = (angle + totalDeg) % 360
      const segAngle = 360 / SW_SEGMENTS.length
      const segIdx = Math.floor(finalAngle / segAngle) % SW_SEGMENTS.length
      const seg = SW_SEGMENTS[segIdx]
      setPrize(seg)
      setPhase('result')

      if (seg.value >= 500) {
        audio.playFx('win'); audio.playFx('crowd')
        player.spawnConfetti(60, [C.gold, '#fff', C.cyan])
      } else if (seg.value > 0) {
        audio.playFx('success')
        player.spawnConfetti(15)
      } else {
        audio.playFx('lose')
      }

      if (seg.value > 0) {
        setTotalWon(t => t + seg.value)
        player.setCoins((c: number) => c + seg.value)
      }
    }, spinDuration)
  }, [angle, audio, player])

  const exitSpin = () => {
    if (totalWon > 0) player.notify(`🎡 Won ${totalWon} total from ${spins} spin${spins > 1 ? 's' : ''}!`, C.gold)
    audio.playFx('tap')
    game.exitGame()
    onDismiss()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, #2a1f0a, #0a0800)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 4, marginBottom: 6 }}>SPIN & WIN</div>
      <div style={{ fontSize: 12, color: C.text3, marginBottom: 14 }}>Total won: <span style={{ color: C.gold, fontWeight: 900 }}>{totalWon}</span> coins</div>

      {/* Wheel */}
      <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 16 }}>
        {/* Pointer */}
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: 24 }}>🔻</div>
        {/* Wheel disc */}
        <div style={{
          width: 280, height: 280, borderRadius: '50%',
          border: `4px solid ${C.gold}`,
          boxShadow: `0 0 30px ${C.gold}40, inset 0 0 20px rgba(0,0,0,0.5)`,
          transform: `rotate(${angle}deg)`,
          transition: phase === 'spinning' ? `transform ${2.5 + Math.random()}s cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
          overflow: 'hidden', position: 'relative',
        }}>
          {SW_SEGMENTS.map((seg, i) => {
            const segAngle = 360 / SW_SEGMENTS.length
            const startAngle = i * segAngle
            return (
              <div key={i} style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transform: `rotate(${startAngle + segAngle / 2}deg)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8,
              }}>
                <div style={{ fontSize: 16 }}>{seg.emoji}</div>
                <div style={{ fontSize: 8, fontWeight: 900, color: seg.color, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>{seg.label}</div>
              </div>
            )
          })}
          {/* Colored wedges background */}
          <svg viewBox="0 0 280 280" style={{ position: 'absolute', inset: 0 }}>
            {SW_SEGMENTS.map((seg, i) => {
              const a = 360 / SW_SEGMENTS.length
              const start = (i * a - 90) * Math.PI / 180
              const end = ((i + 1) * a - 90) * Math.PI / 180
              const x1 = 140 + 140 * Math.cos(start)
              const y1 = 140 + 140 * Math.sin(start)
              const x2 = 140 + 140 * Math.cos(end)
              const y2 = 140 + 140 * Math.sin(end)
              return (
                <path key={i}
                  d={`M140,140 L${x1},${y1} A140,140 0 0,1 ${x2},${y2} Z`}
                  fill={seg.color + '30'}
                  stroke={seg.color + '50'}
                  strokeWidth={0.5}
                />
              )
            })}
          </svg>
        </div>
      </div>

      {/* Controls */}
      {phase === 'ready' && (
        <div onClick={doSpin} style={{ padding: '16px 36px', borderRadius: 14, cursor: 'pointer', background: `${C.gold}20`, border: `2px solid ${C.gold}50`, fontSize: 16, fontWeight: 900, color: C.gold, touchAction: 'none', boxShadow: `0 0 20px ${C.gold}30` }}>
          SPIN!
        </div>
      )}
      {phase === 'spinning' && (
        <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>Spinning...</div>
      )}
      {phase === 'result' && prize && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>{prize.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: prize.value > 0 ? C.gold : C.red, marginBottom: 6 }}>
            {prize.value > 0 ? `+${prize.value} coins!` : 'BUST!'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <div onClick={() => { setPrize(null); setPhase('ready') }} style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 13, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Spin Again</div>
            <div onClick={exitSpin} style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 700, color: C.text3, touchAction: 'none' }}>Done</div>
          </div>
        </div>
      )}
      {phase === 'ready' && (
        <div onClick={exitSpin} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 10, color: C.text3, touchAction: 'none' }}>Exit</div>
      )}
    </div>
  )
}
