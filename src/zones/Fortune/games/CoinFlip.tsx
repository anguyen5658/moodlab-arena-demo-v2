import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = 'intro' | 'betting' | 'puffing' | 'flipping' | 'result' | 'complete'

export default function CoinFlip() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [bet] = useState(50)
  const [puffConfidence, setPuffConfidence] = useState(0)
  const [streak, setStreak] = useState(0)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [puffing, setPuffing] = useState(false)
  const [commentary, setCommentary] = useState('')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])

  const puffStart = useRef(0)
  const choiceRef = useRef<'heads' | 'tails' | null>(null)
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const roundRef = useRef(0)
  const betRef = useRef(50)
  const puffConfRef = useRef(0)

  const spawnConfetti = (count = 25) => {
    const colors = [C.gold, C.green, C.cyan, '#F59E0B']
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 40,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
    }))
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 2000)
  }

  const nextRound = useCallback((currentRound: number, currentScore: number) => {
    const next = currentRound + 1
    if (next >= 8) {
      setPhase('complete')
      awardGame({ won: currentScore > 0, baseCoins: currentScore > 0 ? 20 : 0, baseXP: currentScore > 0 ? 20 : 8 })
      return
    }
    setRound(next)
    roundRef.current = next
    setChoice(null)
    choiceRef.current = null
    setResult(null)
    setPuffConfidence(0)
    puffConfRef.current = 0
    setFlipping(false)
    setPhase('betting')
    setCommentary(`Round ${next + 1}/8 — Pick heads or tails!`)
  }, [awardGame])

  const startGame = useCallback(() => {
    setChoice(null)
    choiceRef.current = null
    setResult(null)
    setPuffConfidence(0)
    puffConfRef.current = 0
    setStreak(0)
    streakRef.current = 0
    setRound(0)
    roundRef.current = 0
    setScore(0)
    scoreRef.current = 0
    setFlipping(false)
    setPuffing(false)
    setPhase('intro')
    playFx('crowd')
    setCommentary('Coin Flip! Pick heads or tails, then puff your confidence!')
    setTimeout(() => setPhase('betting'), 1500)
  }, [playFx])

  const pickSide = (side: 'heads' | 'tails') => {
    setChoice(side)
    choiceRef.current = side
    playFx('select')
    setCommentary(`You picked ${side.toUpperCase()}! Now PUFF to set confidence. Longer = higher multiplier!`)
    setPhase('puffing')
  }

  const handlePuffDown = useCallback(() => {
    if (phase !== 'puffing' || !choiceRef.current) return
    setPuffing(true)
    puffStart.current = Date.now()
  }, [phase])

  const handlePuffUp = useCallback(() => {
    if (!puffing || phase !== 'puffing') return
    const dur = (Date.now() - puffStart.current) / 1000
    setPuffing(false)

    let mult = 1
    if (dur >= 4.5) mult = 5
    else if (dur >= 3.5) mult = 3
    else if (dur >= 2.0) mult = 2
    else if (dur >= 0.5) mult = 1.5
    else mult = 1

    puffConfRef.current = mult
    setPuffConfidence(mult)

    const label = mult === 5 ? 'BLINKER 5x' : mult === 3 ? '3x' : mult === 2 ? '2x' : mult === 1.5 ? '1.5x' : 'SAFE 1x'
    setCommentary(`${label} confidence locked! Flipping...`)
    setFlipping(true)
    setPhase('flipping')
    playFx('coin_flip')

    setTimeout(() => {
      const outcome: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails'
      setResult(outcome)
      setFlipping(false)
      playFx('coin_land')

      const won = outcome === choiceRef.current
      const currentMult = puffConfRef.current
      const currentBet = betRef.current

      if (won) {
        const winAmt = Math.floor(currentBet * currentMult)
        const newScore = scoreRef.current + winAmt
        setScore(newScore)
        scoreRef.current = newScore
        const newStreak = streakRef.current + 1
        setStreak(newStreak)
        streakRef.current = newStreak
        spawnConfetti(25)
        playFx('crowd')
        setCommentary(`WIN! ${outcome.toUpperCase()}! +${winAmt} coins${currentMult >= 3 ? ` (${currentMult}x!)` : ''}!`)
      } else {
        const lossAmt = currentMult >= 5 ? currentBet * 2 : 0
        setStreak(0)
        streakRef.current = 0
        setCommentary(`${outcome.toUpperCase()}! You guessed wrong.${currentMult >= 5 ? ` Blinker penalty: -${lossAmt}` : ''}`)
      }

      setPhase('result')
      setTimeout(() => nextRound(roundRef.current, scoreRef.current), 2500)
    }, 1500)
  }, [puffing, phase, playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  useEffect(() => {
    startGame()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isBet = phase === 'betting'
  const isPuff = phase === 'puffing'
  const isFlip = phase === 'flipping'
  const isRes = phase === 'result'
  const isComp = phase === 'complete'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a1500 0%, #2a1f00 40%, #0a0800 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(245,158,11,0.10), transparent 60%)', pointerEvents: 'none' }} />
      {confetti.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}
      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #F59E0B, #D97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COIN FLIP</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/8</div><div style={{ fontSize: 8, color: C.text3 }}>FLIP</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.orange }}>{streak}</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🪙</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', letterSpacing: 3 }}>COIN FLIP</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Pick a side, puff your confidence, win big!</div>
          </div>
        )}

        {isBet && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🪙</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 16 }}>Pick your side!</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); pickSide('heads') }} style={{ padding: '16px 28px', borderRadius: 16, cursor: 'pointer', background: 'rgba(245,158,11,0.10)', border: '2px solid rgba(245,158,11,0.30)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>👑</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>HEADS</div>
              </div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); pickSide('tails') }} style={{ padding: '16px 28px', borderRadius: 16, cursor: 'pointer', background: 'rgba(168,85,247,0.10)', border: '2px solid rgba(168,85,247,0.30)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>🌿</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#A855F7' }}>TAILS</div>
              </div>
            </div>
          </div>
        )}

        {isPuff && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{choice === 'heads' ? '👑' : '🌿'}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>You picked: {choice?.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              {[['TAP: 1x', C.green, 'rgba(34,197,94,0.10)', 'rgba(34,197,94,0.20)'], ['SHORT: 1.5x', C.blue, 'rgba(59,130,246,0.10)', 'rgba(59,130,246,0.20)'], ['MED: 2x', '#F59E0B', 'rgba(245,158,11,0.10)', 'rgba(245,158,11,0.20)'], ['LONG: 3x', C.red, 'rgba(239,68,68,0.10)', 'rgba(239,68,68,0.20)'], ['BLINKER: 5x', C.purple, 'rgba(147,51,234,0.10)', 'rgba(147,51,234,0.20)']].map(([label, color, bg, border]) => (
                <div key={label} style={{ padding: '4px 10px', borderRadius: 8, background: bg, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>PUFF TO FLIP 🪙</div>
            {puffing && <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan, marginTop: 8, animation: 'pulse 0.5s infinite' }}>FLIPPING...</div>}
          </div>
        )}

        {(isFlip || isRes) && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 12, transition: 'all 0.5s', animation: isFlip ? 'spin 1.5s linear' : 'none' }}>
              {isFlip ? '🪙' : result === 'heads' ? '👑' : '🌿'}
            </div>
            {isRes && (
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: result === choice ? C.gold : C.red, marginBottom: 4 }}>{result === choice ? 'YOU WIN!' : 'YOU LOSE!'}</div>
                <div style={{ fontSize: 14, color: C.text2 }}>It was {result?.toUpperCase()}{puffConfidence > 1 ? ` at ${puffConfidence}x` : ''}</div>
                {result === choice && <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginTop: 4 }}>+{Math.floor(bet * puffConfidence)} coins!</div>}
                {result !== choice && puffConfidence >= 5 && <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginTop: 4 }}>Blinker penalty: -{bet * 2}</div>}
              </div>
            )}
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🪙</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>ALL FLIPS COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ fontSize: 13, color: C.orange, marginTop: 4 }}>Best Streak: {streak}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
