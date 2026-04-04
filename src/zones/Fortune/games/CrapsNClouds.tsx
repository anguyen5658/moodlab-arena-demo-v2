import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'rolling' | 'result' | 'complete'

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function CrapsNClouds() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [dice, setDice] = useState([1, 1])
  const [rolling, setRolling] = useState(false)
  const [point, setPoint] = useState<number | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [hotDice, setHotDice] = useState(false)
  const [puffing, setPuffing] = useState(false)
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const puffingRef = useRef(false)
  const pointRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { puffingRef.current = puffing }, [puffing])
  useEffect(() => { pointRef.current = point }, [point])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { roundRef.current = round }, [round])

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 8) {
      setPhase('complete')
      awardGame({ won: scoreRef.current > 0, baseCoins: scoreRef.current > 0 ? 20 : 0, baseXP: scoreRef.current > 0 ? 20 : 8 })
      return
    }
    setRound(next); setDice([1, 1]); setResult(null); setHotDice(false); setPoint(null)
    setPhase('rolling')
    setCommentary(`Round ${next + 1}/8 — Come-out roll! HOLD to puff!`)
  }, [awardGame])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'rolling') return
    setPuffing(true)
    puffStart.current = Date.now()
    setRolling(true)
    playFx('dice_shake')
    setCommentary('Rolling...')
  }, [playFx])

  const handlePuffUp = useCallback(() => {
    if (!puffingRef.current || phaseRef.current !== 'rolling') return
    const dur = (Date.now() - puffStart.current) / 1000
    setPuffing(false); setRolling(false)
    const isBlinker = dur >= 4.5
    setHotDice(isBlinker)

    let base: number
    if (dur < 0.5) base = 2 + Math.floor(Math.random() * 2)
    else if (dur < 1.5) base = 4 + Math.floor(Math.random() * 2)
    else if (dur < 2.5) base = 6 + Math.floor(Math.random() * 3)
    else if (dur < 3.5) base = 9 + Math.floor(Math.random() * 2)
    else base = 11 + Math.floor(Math.random() * 2)

    const variance = Math.random() > 0.5 ? 1 : -1
    let total = Math.max(2, Math.min(12, base + (Math.random() > 0.6 ? variance : 0)))
    total = Math.round(total)
    const d1 = Math.max(1, Math.min(6, Math.floor(total / 2) + (Math.random() > 0.5 ? 1 : 0)))
    const d2 = Math.max(1, Math.min(6, total - d1))
    setDice([d1, d2])
    playFx('dice_roll')
    if (isBlinker) { setCommentary('HOT DICE! +50% payout if you win!') }

    setTimeout(() => {
      const diceTotal = d1 + d2
      const curPoint = pointRef.current
      if (curPoint === null) {
        // Come-out roll
        if (diceTotal === 7 || diceTotal === 11) {
          const win = isBlinker ? Math.floor(50 * 1.5) : 50
          setResult('win'); setScore(s => s + win)
          playFx('crowd')
          setCommentary(`NATURAL ${diceTotal}! You WIN +${win}!`)
        } else if (diceTotal === 2 || diceTotal === 3 || diceTotal === 12) {
          setResult('lose')
          setCommentary(`CRAPS! ${diceTotal} — you lose!`)
        } else {
          setPoint(diceTotal)
          setResult(null)
          setCommentary(`Point is ${diceTotal}! Roll it again to win!`)
          setPhase('rolling')
          return
        }
      } else {
        // Point phase
        if (diceTotal === curPoint) {
          const win = isBlinker ? Math.floor(50 * 1.5) : 50
          setResult('win'); setScore(s => s + win)
          playFx('crowd')
          setCommentary(`HIT THE POINT! ${diceTotal}! You WIN +${win}!`)
          setPoint(null)
        } else if (diceTotal === 7) {
          setResult('lose')
          setCommentary(`SEVEN OUT! You lose. Point was ${curPoint}`)
          setPoint(null)
        } else {
          setCommentary(`Rolled ${diceTotal}. Need ${curPoint} to win. Roll again!`)
          setPhase('rolling')
          return
        }
      }
      setPhase('result')
      setTimeout(() => nextRound(), 2500)
    }, 800)
  }, [playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    setDice([1, 1]); setRolling(false); setPoint(null); setResult(null)
    setRound(0); setScore(0); setHotDice(false); setPuffing(false)
    setPhase('intro')
    playFx('crowd')
    setCommentary('Craps & Clouds! Puff to roll the dice!')
    setTimeout(() => { setPhase('rolling'); setCommentary('Come-out roll! HOLD to puff!') }, 1500)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isRolling = phase === 'rolling'
  const isResult = phase === 'result'
  const isComp = phase === 'complete'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 40%, #0d0a0a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 12, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CRAPS & CLOUDS</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/8</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
          {point !== null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>P:{point}</div><div style={{ fontSize: 8, color: C.text3 }}>POINT</div></div>}
          {hotDice && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.red }}>HOT🔥</div><div style={{ fontSize: 8, color: C.text3 }}>DICE</div></div>}
        </div>

        {/* Dice display */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
          {dice.map((d, i) => (
            <div key={i} style={{ width: 80, height: 80, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: 'rgba(255,255,255,0.06)', border: `2px solid ${hotDice ? C.red : 'rgba(255,255,255,0.15)'}`, boxShadow: hotDice ? `0 0 20px ${C.red}40` : 'none', animation: rolling ? 'pulse 0.2s infinite' : 'none', transition: 'all 0.3s' }}>
              {DICE_FACES[d]}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{dice[0] + dice[1]}</div>

        {isRolling && !rolling && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            {point !== null && <div style={{ fontSize: 12, color: C.cyan, marginBottom: 8 }}>Point: {point} — Roll {point} to win, avoid 7!</div>}
            <div style={{ fontSize: 14, fontWeight: 800, color: C.red, animation: 'pulse 1.5s infinite' }}>HOLD TO PUFF 🎲</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Longer puff = higher roll · Blinker = Hot Dice!</div>
          </div>
        )}
        {rolling && <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 0.4s infinite' }}>ROLLING... RELEASE!</div>}

        {isResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: result === 'win' ? C.green : C.red }}>{result === 'win' ? '🎉 WIN!' : '💀 LOSE'}</div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎲</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>SESSION DONE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', fontSize: 13, fontWeight: 800, color: C.red }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
