import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = 'intro' | 'ready' | 'spinning' | 'result' | 'bonus' | 'complete'

interface Segment { label: string; value: number; color: string; emoji: string }

const SW_SEGMENTS: Segment[] = [
  { label: '50', value: 50, color: C.cyan, emoji: '🪙' },
  { label: '100', value: 100, color: '#22c55e', emoji: '💰' },
  { label: 'BUST', value: -50, color: '#ef4444', emoji: '💀' },
  { label: '200', value: 200, color: '#ffd700', emoji: '🏆' },
  { label: '75', value: 75, color: '#3b82f6', emoji: '🪙' },
  { label: 'BUST', value: -50, color: '#ef4444', emoji: '💀' },
  { label: '150', value: 150, color: '#a855f7', emoji: '💎' },
  { label: '50', value: 50, color: C.cyan, emoji: '🪙' },
  { label: '500', value: 500, color: '#ffd700', emoji: '🎰' },
  { label: 'BUST', value: -50, color: '#ef4444', emoji: '💀' },
  { label: '100', value: 100, color: '#22c55e', emoji: '💰' },
  { label: 'JACKPOT', value: 1000, color: '#ffd700', emoji: '👑' },
]

export default function SpinWin() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [spinning, setSpinning] = useState(false)
  const [prize, setPrize] = useState<(Segment & { actualValue: number }) | null>(null)
  const [totalWon, setTotalWon] = useState(0)
  const [round, setRound] = useState(0)
  const [bonusRound, setBonusRound] = useState(false)
  const [angle, setAngle] = useState(0)
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<Phase>('intro')
  const spinningRef = useRef(false)
  const totalWonRef = useRef(0)
  const roundRef = useRef(0)
  const bonusRoundRef = useRef(false)
  const angleRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { spinningRef.current = spinning }, [spinning])
  useEffect(() => { totalWonRef.current = totalWon }, [totalWon])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { bonusRoundRef.current = bonusRound }, [bonusRound])
  useEffect(() => { angleRef.current = angle }, [angle])

  const doSpin = useCallback(() => {
    if (spinningRef.current) return
    setSpinning(true); spinningRef.current = true
    setPrize(null)
    setPhase('spinning'); phaseRef.current = 'spinning'
    playFx('tap')

    const rotations = 3 + Math.random() * 5
    const extraDeg = Math.random() * 360
    const totalDeg = rotations * 360 + extraDeg
    const spinDuration = Math.min(2500 + rotations * 400, 5000)

    const newAngle = angleRef.current + totalDeg
    setAngle(newAngle); angleRef.current = newAngle

    setTimeout(() => {
      const normalizedAngle = ((newAngle % 360) + 360) % 360
      const segIdx = Math.floor(((360 - normalizedAngle) % 360 + 360) % 360 / 30) % 12
      const seg = SW_SEGMENTS[segIdx]
      const isBonusActive = bonusRoundRef.current
      const actualValue = isBonusActive ? seg.value * 2 : seg.value
      const prizeResult = { ...seg, actualValue }

      setPrize(prizeResult)
      setSpinning(false); spinningRef.current = false

      const currentRound = roundRef.current + 1
      setRound(currentRound); roundRef.current = currentRound

      const newTotal = totalWonRef.current + actualValue
      setTotalWon(newTotal); totalWonRef.current = newTotal

      setPhase('result'); phaseRef.current = 'result'

      if (seg.label === 'BUST') {
        setCommentary(`💀 BUST! -${Math.abs(actualValue)} coins!`)
        playFx('error')
      } else if (seg.label === 'JACKPOT') {
        setCommentary(`👑 JACKPOT! +${actualValue} coins!`)
        playFx('crowd')
      } else {
        setCommentary(`${seg.emoji} +${actualValue} coins!`)
        playFx('coin')
      }

      const maxSpins = isBonusActive ? 1 : 3
      setTimeout(() => {
        if (currentRound >= maxSpins) {
          if (!isBonusActive && newTotal > 500) {
            setBonusRound(true); bonusRoundRef.current = true
            setPhase('bonus'); phaseRef.current = 'bonus'
            playFx('crowd')
            setCommentary('🌟 BONUS ROUND UNLOCKED!')
          } else {
            setPhase('complete'); phaseRef.current = 'complete'
            awardGame({ won: newTotal > 0, baseCoins: newTotal > 0 ? 20 : 0, baseXP: newTotal > 0 ? 20 : 8 })
          }
        } else {
          setPhase('ready'); phaseRef.current = 'ready'
        }
      }, 2200)
    }, spinDuration)
  }, [playFx, awardGame])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current === 'ready' || (phaseRef.current === 'bonus' && !spinningRef.current)) {
      doSpin()
    }
  }, [doSpin])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, null)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown])

  const startGame = useCallback(() => {
    setPhase('intro'); phaseRef.current = 'intro'
    setAngle(0); angleRef.current = 0
    setRound(0); roundRef.current = 0
    setTotalWon(0); totalWonRef.current = 0
    setBonusRound(false); bonusRoundRef.current = false
    setPrize(null)
    setSpinning(false); spinningRef.current = false
    setCommentary('')
    playFx('crowd')
    setTimeout(() => { setPhase('ready'); phaseRef.current = 'ready' }, 1800)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isReady = phase === 'ready'
  const isSpinning = phase === 'spinning'
  const isResult = phase === 'result'
  const isBonus = phase === 'bonus'
  const isComplete = phase === 'complete'

  // Wheel display
  const segDeg = 360 / SW_SEGMENTS.length

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0510 0%, #120a1a 40%, #0a0510 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 16px 20px', gap: 10, maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: bonusRound ? C.gold : C.cyan }}>
            {bonusRound ? '🌟 BONUS ROUND 🌟' : '🎰 SPIN & WIN'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>🪙 {totalWon}</div>
        </div>

        {/* Round dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: bonusRound ? 1 : 3 }).map((_, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, background: i < round ? `${C.gold}25` : i === round && isResult ? `${C.cyan}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${i < round ? C.gold + '40' : i === round ? C.cyan + '30' : C.border}`, color: i < round ? C.gold : i === round ? C.cyan : C.text3 }}>
              {i < round ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {/* Wheel */}
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${isSpinning ? C.gold + '60' : C.gold + '25'}`, transition: 'all 0.5s' }} />
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `3px solid ${C.gold}40`, overflow: 'hidden', position: 'relative', transform: `rotate(${angle}deg)`, transition: isSpinning ? `transform 4s cubic-bezier(0.15, 0.65, 0.08, 1.0)` : 'none', background: '#1a0a2e' }}>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {SW_SEGMENTS.map((seg, i) => {
                const startAngle = i * segDeg - 90
                const endAngle = startAngle + segDeg
                const s = Math.sin(endAngle * Math.PI / 180)
                const c = Math.cos(endAngle * Math.PI / 180)
                const s2 = Math.sin(startAngle * Math.PI / 180)
                const c2 = Math.cos(startAngle * Math.PI / 180)
                const r = 50
                const x1 = 50 + r * c2, y1 = 50 + r * s2
                const x2 = 50 + r * c, y2 = 50 + r * s
                return (
                  <path key={i} d={`M50,50 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.color + '40'} stroke={seg.color + '60'} strokeWidth="0.5" />
                )
              })}
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle, #1a1a3a, #0a0a20)', border: `2px solid ${C.gold}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {isSpinning ? '🌀' : '🎰'}
            </div>
          </div>
          {/* Pointer */}
          <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>▼</div>
          {/* Segment labels around wheel */}
        </div>

        {/* Segment labels */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {SW_SEGMENTS.map((seg, i) => (
            <div key={i} style={{ fontSize: 9, color: seg.color, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: seg.color + '15', border: `1px solid ${seg.color}30` }}>
              {seg.emoji} {seg.label}
            </div>
          ))}
        </div>

        {isResult && prize && (
          <div style={{ textAlign: 'center', padding: '12px 24px', borderRadius: 16, background: prize.label === 'BUST' ? 'rgba(239,68,68,0.12)' : prize.label === 'JACKPOT' ? 'rgba(255,215,0,0.15)' : 'rgba(0,229,255,0.08)', border: `1px solid ${prize.label === 'BUST' ? '#ef444430' : prize.label === 'JACKPOT' ? C.gold + '40' : prize.color + '25'}`, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: prize.label === 'JACKPOT' ? 48 : 36, marginBottom: 6 }}>{prize.emoji}</div>
            <div style={{ fontSize: prize.label === 'JACKPOT' ? 22 : 18, fontWeight: 900, color: prize.label === 'BUST' ? '#ef4444' : prize.label === 'JACKPOT' ? C.gold : prize.color }}>
              {prize.label === 'BUST' ? `BUST! -${Math.abs(prize.actualValue)}` : prize.label === 'JACKPOT' ? `JACKPOT! +${prize.actualValue}` : `+${prize.actualValue} coins`}
            </div>
            {bonusRound && prize.label !== 'BUST' && <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, marginTop: 4 }}>2x BONUS APPLIED!</div>}
          </div>
        )}

        {isReady && (
          <div data-btn="true" onClick={doSpin} style={{ padding: '14px 36px', borderRadius: 14, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}35`, color: C.gold, fontSize: 15, fontWeight: 900, animation: 'pulse 1.5s infinite', textAlign: 'center' }}>
            🎡 TAP TO SPIN! ({bonusRound ? 'BONUS' : `${round + 1}/3`})
          </div>
        )}

        {isSpinning && (
          <div style={{ fontSize: 13, fontWeight: 800, color: C.cyan, animation: 'pulse 0.4s infinite' }}>🌀 Spinning...</div>
        )}

        {isBonus && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, marginBottom: 8 }}>🌟 BONUS ROUND!</div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 12 }}>You won {totalWon} coins — over 500! All prizes doubled!</div>
            <div data-btn="true" onClick={doSpin} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, color: C.gold, fontSize: 13, fontWeight: 800 }}>🎡 SPIN BONUS!</div>
          </div>
        )}

        {isComplete && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>{totalWon >= 500 ? '🏆' : totalWon > 0 ? '🎉' : '😔'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: totalWon >= 500 ? C.gold : totalWon > 0 ? C.cyan : C.text3 }}>
              {totalWon >= 500 ? 'BIG WINNER!' : totalWon > 0 ? 'Nice Run!' : 'Better Luck Next Time'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginTop: 4 }}>Total: {totalWon} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 13, fontWeight: 800, color: C.gold }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{commentary}</div>
      </div>
    </div>
  )
}
