import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'scratching' | 'result' | 'complete'

const SC_SYMBOLS = ['🍒', '🍋', '💎', '⭐', '🌿', '7️⃣']
const SC_PAYOUTS: Record<string, number> = { '🍒': 50, '🍋': 75, '💎': 200, '⭐': 300, '🌿': 500, '7️⃣': 1000 }

function genCard(): string[] {
  const base = SC_SYMBOLS[Math.floor(Math.random() * SC_SYMBOLS.length)]
  const symbols = [base, base]
  for (let i = 0; i < 4; i++) symbols.push(SC_SYMBOLS[Math.floor(Math.random() * SC_SYMBOLS.length)])
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]]
  }
  return symbols
}

export default function ScratchPuff() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [card, setCard] = useState<string[]>([])
  const [revealed, setRevealed] = useState<boolean[]>(Array(6).fill(false))
  const [currentIdx, setCurrentIdx] = useState<number | null>(null)
  const [prize, setPrize] = useState<{ symbol: string; amount: number } | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const currentIdxRef = useRef<number | null>(null)
  const cardRef = useRef<string[]>([])
  const revealedRef = useRef<boolean[]>(Array(6).fill(false))
  const scoreRef = useRef(0)
  const roundRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { currentIdxRef.current = currentIdx }, [currentIdx])
  useEffect(() => { cardRef.current = card }, [card])
  useEffect(() => { revealedRef.current = revealed }, [revealed])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { roundRef.current = round }, [round])

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 3) {
      setPhase('complete')
      awardGame({ won: scoreRef.current > 0, baseCoins: scoreRef.current > 0 ? 20 : 0, baseXP: scoreRef.current > 0 ? 20 : 8 })
      return
    }
    setRound(next); setCard(genCard()); setRevealed(Array(6).fill(false))
    setCurrentIdx(null); setPrize(null)
    setPhase('scratching')
    setCommentary(`Card ${next + 1}/3 — Scratch away!`)
  }, [awardGame])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'scratching' || currentIdxRef.current === null || revealedRef.current[currentIdxRef.current]) return
    puffStart.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (phaseRef.current !== 'scratching' || currentIdxRef.current === null || !puffStart.current) return
    const dur = (Date.now() - puffStart.current) / 1000
    puffStart.current = 0
    if (dur < 0.2) return

    const isBlinker = dur >= 4.5
    const idx = currentIdxRef.current
    const newRevealed = [...revealedRef.current]
    newRevealed[idx] = true

    let c = [...cardRef.current]
    if (isBlinker) {
      c[idx] = '🌟'
      setCard(c); cardRef.current = c
      setCommentary('GOLDEN SCRATCH! Wild symbol added!')
    } else {
      setCommentary(`Revealed: ${c[idx]}`)
    }

    setRevealed(newRevealed); revealedRef.current = newRevealed
    playFx('select'); setCurrentIdx(null)

    const allRevealed = newRevealed.every(r => r)
    if (allRevealed) {
      const counts: Record<string, number> = {}
      const wilds = c.filter(s => s === '🌟').length
      c.filter(s => s !== '🌟').forEach(s => { counts[s] = (counts[s] || 0) + 1 })
      let bestSymbol: string | null = null, bestCount = 0
      Object.entries(counts).forEach(([sym, cnt]) => {
        if (cnt + wilds >= 3 && cnt > bestCount) { bestSymbol = sym; bestCount = cnt }
      })
      if (!bestSymbol && wilds >= 3) { bestSymbol = '🌟'; bestCount = wilds }
      if (bestSymbol && (bestCount + wilds >= 3 || bestCount >= 3)) {
        const payout = SC_PAYOUTS[bestSymbol] || (bestSymbol === '🌟' ? 500 : 50)
        setPrize({ symbol: bestSymbol, amount: payout })
        setScore(s => s + payout)
        playFx('crowd')
        setCommentary(`WINNER! 3x ${bestSymbol} = ${payout} coins!`)
      } else {
        setCommentary('No match this time!')
      }
      setPhase('result')
      setTimeout(() => nextRound(), 2500)
    }
  }, [playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    const c = genCard()
    setCard(c); setRevealed(Array(6).fill(false)); setCurrentIdx(null); setPrize(null)
    setRound(0); setScore(0); scoreRef.current = 0
    setPhase('intro')
    playFx('crowd')
    setCommentary('Scratch & Puff! Tap an area then PUFF to scratch!')
    setTimeout(() => setPhase('scratching'), 1500)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isScratching = phase === 'scratching'
  const isComp = phase === 'complete'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0020 40%, #0a0010 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(236,72,153,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 12, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #EC4899, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SCRATCH & PUFF</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/3</div><div style={{ fontSize: 8, color: C.text3 }}>CARD</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🎫</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#EC4899' }}>SCRATCH & PUFF</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Tap an area, then PUFF to scratch it!</div>
          </div>
        )}

        {(isScratching || phase === 'result') && (
          <div style={{ width: '100%' }}>
            {currentIdx !== null && <div style={{ textAlign: 'center', fontSize: 12, color: C.pink, marginBottom: 8, animation: 'pulse 1s infinite' }}>PUFF to scratch area {currentIdx + 1}! 💨</div>}
            {currentIdx === null && isScratching && <div style={{ textAlign: 'center', fontSize: 12, color: C.text2, marginBottom: 8 }}>TAP an area to select, then PUFF to scratch</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, maxWidth: 300, margin: '0 auto' }}>
              {card.map((sym, i) => (
                <div
                  key={i}
                  data-btn="true"
                  onClick={() => {
                    if (!isScratching || revealed[i]) return
                    setCurrentIdx(i); playFx('select')
                  }}
                  style={{ height: 80, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: revealed[i] ? 'rgba(255,255,255,0.08)' : currentIdx === i ? `linear-gradient(135deg, ${C.pink}30, ${C.pink}10)` : 'rgba(255,255,255,0.04)', border: `2px solid ${revealed[i] ? 'rgba(255,255,255,0.1)' : currentIdx === i ? C.pink : 'rgba(255,255,255,0.06)'}`, cursor: !revealed[i] && isScratching ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                  {revealed[i] ? sym : currentIdx === i ? '💨' : '❓'}
                </div>
              ))}
            </div>

            {prize && (
              <div style={{ textAlign: 'center', marginTop: 12, animation: 'fadeIn 0.4s ease' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.gold }}>WIN! 3x {prize.symbol} = +{prize.amount} coins!</div>
              </div>
            )}

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              {SC_SYMBOLS.map(s => <span key={s} style={{ fontSize: 9, color: C.text3, marginRight: 6 }}>{s}{s}{s}={SC_PAYOUTS[s]}</span>)}
            </div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎫</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>ALL CARDS DONE!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.30)', fontSize: 13, fontWeight: 800, color: C.pink }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
