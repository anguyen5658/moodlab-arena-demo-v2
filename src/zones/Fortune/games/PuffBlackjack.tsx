import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'dealing' | 'player_turn' | 'dealer_turn' | 'result' | 'complete'
type BJResult = null | 'win' | 'blackjack' | 'lose' | 'bust' | 'push'

interface Card { suit: string; val: string; display: string }

const BJ_SUITS = ['♠️', '♥️', '♦️', '♣️']
const BJ_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function drawCard(): Card {
  const suit = BJ_SUITS[Math.floor(Math.random() * BJ_SUITS.length)]
  const val = BJ_VALUES[Math.floor(Math.random() * BJ_VALUES.length)]
  return { suit, val, display: val + suit }
}

function handTotal(hand: Card[]): number {
  let total = 0, aces = 0
  for (const c of hand) {
    if (c.val === 'A') { aces++; total += 11 }
    else if (['K', 'Q', 'J'].includes(c.val)) total += 10
    else total += parseInt(c.val)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function CardView({ c, hidden }: { c: Card; hidden: boolean }) {
  return (
    <div style={{ width: 48, height: 68, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hidden ? 'linear-gradient(135deg, #1a3a5c, #0a1a30)' : 'linear-gradient(180deg, #fafafa, #e0e0e0)', border: hidden ? '2px solid #2a5a8c' : '2px solid #ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', fontSize: hidden ? 20 : 12, fontWeight: 800, color: hidden ? '#4a8abf' : (c.suit === '♥️' || c.suit === '♦️') ? '#dc2626' : '#1a1a1a' }}>
      {hidden ? '🂠' : c.display}
    </div>
  )
}

export default function PuffBlackjack() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [playerTotal, setPlayerTotal] = useState(0)
  const [dealerTotal, setDealerTotal] = useState(0)
  const [bet, setBet] = useState(50)
  const [result, setResult] = useState<BJResult>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [puffing, setPuffing] = useState(false)
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const puffingRef = useRef(false)
  const betRef = useRef(50)
  const playerHandRef = useRef<Card[]>([])
  const dealerHandRef = useRef<Card[]>([])
  const roundRef = useRef(0)
  const scoreRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { puffingRef.current = puffing }, [puffing])
  useEffect(() => { betRef.current = bet }, [bet])
  useEffect(() => { playerHandRef.current = playerHand }, [playerHand])
  useEffect(() => { dealerHandRef.current = dealerHand }, [dealerHand])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])

  const bjResolveRef = useRef<(pHand: Card[], dHand: Card[], isNatural: boolean) => void>(() => {})
  const dealerPlayRef = useRef<(pHand: Card[]) => void>(() => {})
  const bjDealRef = useRef<() => void>(() => {})

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 7) {
      setPhase('complete')
      awardGame({ won: scoreRef.current > 0, baseCoins: scoreRef.current > 0 ? 20 : 0, baseXP: scoreRef.current > 0 ? 20 : 8 })
      return
    }
    setRound(next); setBet(50); betRef.current = 50; setResult(null)
    bjDealRef.current()
  }, [awardGame])

  useEffect(() => {
    bjResolveRef.current = (pHand: Card[], dHand: Card[], isNatural: boolean) => {
      const pT = handTotal(pHand), dT = handTotal(dHand)
      const b = betRef.current
      setPlayerTotal(pT); setDealerTotal(dT)
      let res: BJResult, winAmt = 0
      if (isNatural && pT === 21) {
        if (dT === 21) { res = 'push'; setCommentary('Both Blackjack! Push!') }
        else { res = 'blackjack'; winAmt = Math.floor(b * 2.5); setCommentary('BLACKJACK! 2.5x payout!'); playFx('crowd') }
      } else if (pT > 21) {
        res = 'bust'; setCommentary('BUST! You lose ' + b)
      } else if (dT > 21) {
        res = 'win'; winAmt = b * 2; setCommentary(`Dealer busts! You WIN ${winAmt}!`)
      } else if (pT > dT) {
        res = 'win'; winAmt = b * 2; setCommentary(`You win! ${pT} beats ${dT}`)
      } else if (pT < dT) {
        res = 'lose'; setCommentary(`Dealer wins. ${dT} beats ${pT}`)
      } else {
        res = 'push'; setCommentary(`Push! Both have ${pT}`)
      }
      if (winAmt > 0) { playFx('crowd'); setScore(s => s + winAmt) }
      setResult(res!); setPhase('result')
      setTimeout(() => nextRound(), 2500)
    }
  }, [playFx, nextRound])

  useEffect(() => {
    dealerPlayRef.current = (pHand: Card[]) => {
      setPhase('dealer_turn')
      setCommentary('Dealer reveals...')
      const dHand = [...dealerHandRef.current]
      const step = (hand: Card[]) => {
        const total = handTotal(hand)
        setDealerHand([...hand]); setDealerTotal(total)
        if (total < 17) {
          setTimeout(() => {
            const card = drawCard()
            hand.push(card)
            playFx('select')
            setCommentary('Dealer hits... ' + handTotal(hand))
            step(hand)
          }, 700)
        } else {
          setTimeout(() => bjResolveRef.current(pHand, hand, false), 600)
        }
      }
      setTimeout(() => step(dHand), 600)
    }
  }, [playFx])

  useEffect(() => {
    bjDealRef.current = () => {
      const p1 = drawCard(), p2 = drawCard(), d1 = drawCard(), d2 = drawCard()
      const pHand = [p1, p2], dHand = [d1, d2]
      const pT = handTotal(pHand), dT = handTotal(dHand)
      setPlayerHand(pHand); setDealerHand(dHand)
      setPlayerTotal(pT); setDealerTotal(dT)
      setResult(null); setPhase('dealing')
      playFx('select')
      setCommentary('Cards dealt...')
      setTimeout(() => {
        if (pT === 21) {
          setCommentary('BLACKJACK! Natural 21!'); playFx('crowd')
          bjResolveRef.current(pHand, dHand, true)
        } else {
          setPhase('player_turn')
          setCommentary('Short puff = HIT, Long puff = STAND, Blinker = DOUBLE DOWN')
        }
      }, 1200)
    }
  }, [playFx])

  const startGame = useCallback(() => {
    setPlayerHand([]); setDealerHand([]); setPlayerTotal(0); setDealerTotal(0)
    setBet(50); betRef.current = 50; setResult(null); setRound(0); setScore(0); scoreRef.current = 0; setPuffing(false)
    setPhase('intro')
    playFx('crowd')
    setCommentary('Welcome to Puff Blackjack! Get closer to 21!')
    setTimeout(() => bjDealRef.current(), 1500)
  }, [playFx])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return
    setPuffing(true)
    puffStart.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (!puffingRef.current || phaseRef.current !== 'player_turn') return
    const dur = (Date.now() - puffStart.current) / 1000
    setPuffing(false)
    const pHand = playerHandRef.current

    if (dur >= 4.5) {
      setBet(b => { betRef.current = b * 2; return b * 2 })
      const newCard = drawCard()
      const newHand = [...pHand, newCard]
      const newTotal = handTotal(newHand)
      setPlayerHand(newHand); setPlayerTotal(newTotal)
      playFx('whistle')
      setCommentary('DOUBLE DOWN! Bet doubled! One more card...')
      if (newTotal > 21) {
        setTimeout(() => bjResolveRef.current(newHand, dealerHandRef.current, false), 800)
      } else {
        setTimeout(() => dealerPlayRef.current(newHand), 800)
      }
    } else if (dur >= 1.5) {
      playFx('select')
      setCommentary(`You STAND at ${handTotal(pHand)}!`)
      dealerPlayRef.current(pHand)
    } else {
      const newCard = drawCard()
      const newHand = [...pHand, newCard]
      const newTotal = handTotal(newHand)
      setPlayerHand(newHand); setPlayerTotal(newTotal)
      playFx('select')
      if (newTotal > 21) {
        setCommentary(`BUST! ${newTotal} — over 21!`)
        setTimeout(() => bjResolveRef.current(newHand, dealerHandRef.current, false), 800)
      } else if (newTotal === 21) {
        setCommentary('21! Perfect! Standing...')
        setTimeout(() => dealerPlayRef.current(newHand), 800)
      } else {
        setCommentary(`HIT! You have ${newTotal}. Hit or Stand?`)
      }
    }
  }, [playFx])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPlayerTurn = phase === 'player_turn'
  const isDealerTurn = phase === 'dealer_turn'
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a1e0a 0%, #0d3d0d 40%, #0a2a0a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.06), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #22C55E, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PUFF BLACKJACK</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/7</div><div style={{ fontSize: 8, color: C.text3 }}>HAND</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>Bet:{bet}</div><div style={{ fontSize: 8, color: C.text3 }}>WAGER</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#22C55E', letterSpacing: 3 }}>BLACKJACK</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Short puff = HIT | Long puff = STAND | Blinker = DOUBLE DOWN</div>
          </div>
        )}

        {(phase === 'dealing' || isPlayerTurn || isDealerTurn || isResult) && (
          <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 4 }}>DEALER {(isDealerTurn || isResult) ? `(${dealerTotal})` : ''}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {dealerHand.map((c, i) => <CardView key={i} c={c} hidden={i === 1 && (phase === 'dealing' || isPlayerTurn)} />)}
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 12, fontWeight: 800, color: C.gold }}>
              {isResult && result === 'win' ? 'YOU WIN!' : isResult && result === 'blackjack' ? 'BLACKJACK!' : isResult && result === 'lose' ? 'DEALER WINS' : isResult && result === 'bust' ? 'BUST!' : isResult && result === 'push' ? 'PUSH' : 'VS'}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, marginBottom: 4 }}>YOU ({playerTotal})</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {playerHand.map((c, i) => <CardView key={i} c={c} hidden={false} />)}
              </div>
            </div>

            {isPlayerTurn && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>HIT</div><div style={{ fontSize: 7, color: C.text3 }}>&lt;1.5s</div></div>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.red }}>STAND</div><div style={{ fontSize: 7, color: C.text3 }}>&gt;1.5s</div></div>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(147,51,234,0.10)', border: '1px solid rgba(147,51,234,0.20)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.purple }}>DOUBLE</div><div style={{ fontSize: 7, color: C.text3 }}>4.5s+</div></div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginTop: 10, animation: 'pulse 1.5s infinite' }}>PUFF to Hit/Stand/Double 🃏</div>
              </div>
            )}

            {isResult && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: (result === 'win' || result === 'blackjack') ? C.gold : result === 'push' ? C.cyan : C.red }}>
                  {result === 'win' ? `+${bet * 2} coins` : result === 'blackjack' ? `+${Math.floor(bet * 2.5)} coins` : result === 'push' ? 'Bet returned' : `-${bet} coins`}
                </div>
              </div>
            )}
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>SESSION COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)', fontSize: 13, fontWeight: 800, color: '#22C55E' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
