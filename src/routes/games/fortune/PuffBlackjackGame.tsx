import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'

const BJ_SUITS = ['♠️', '♥️', '♦️', '♣️'] as const
const BJ_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
type Suit = typeof BJ_SUITS[number]
type Val = typeof BJ_VALUES[number]
interface Card { suit: Suit; val: Val; display: string }

const drawCard = (): Card => {
  const suit = BJ_SUITS[Math.floor(Math.random() * BJ_SUITS.length)]
  const val = BJ_VALUES[Math.floor(Math.random() * BJ_VALUES.length)]
  return { suit, val, display: val + suit }
}

const handTotal = (hand: Card[]) => {
  let total = 0
  let aces = 0
  for (const c of hand) {
    if (c.val === 'A') { aces++; total += 11 }
    else if (c.val === 'K' || c.val === 'Q' || c.val === 'J') total += 10
    else total += parseInt(c.val, 10)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

type Phase = 'intro' | 'dealing' | 'player_turn' | 'dealer_turn' | 'result' | 'complete' | null
type Result = 'win' | 'lose' | 'bust' | 'blackjack' | 'push' | null

export const PuffBlackjackGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [playerTotal, setPlayerTotal] = useState(0)
  const [dealerTotal, setDealerTotal] = useState(0)
  const [bet, setBet] = useState(50)
  const [result, setResult] = useState<Result>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<Phase>(null)
  const playerHandRef = useRef<Card[]>([])
  const dealerHandRef = useRef<Card[]>([])
  const betRef = useRef(50)
  const scoreRef = useRef(0)
  const roundRef = useRef(0)
  const puffStartRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const startedRef = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { playerHandRef.current = playerHand }, [playerHand])
  useEffect(() => { dealerHandRef.current = dealerHand }, [dealerHand])

  const schedule = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter(x => x !== t)
      fn()
    }, ms)
    timersRef.current.push(t)
  }
  const clearTimers = () => { timersRef.current.forEach(t => clearTimeout(t)); timersRef.current = [] }

  const resolve = useCallback((pHand: Card[], dHand: Card[], isNatural: boolean) => {
    const pT = handTotal(pHand)
    const dT = handTotal(dHand)
    const b = betRef.current
    setPlayerTotal(pT); setDealerTotal(dT)
    let res: Result = null
    let winAmt = 0
    if (isNatural && pT === 21) {
      if (dT === 21) { res = 'push'; setCommentary('Both Blackjack! Push!') }
      else { res = 'blackjack'; winAmt = Math.floor(b * 2.5); setCommentary('BLACKJACK! 2.5x payout!'); audio.playFx('jackpot'); player.spawnConfetti(40) }
    } else if (pT > 21) {
      res = 'bust'; setCommentary('BUST! You lose ' + b)
    } else if (dT > 21) {
      res = 'win'; winAmt = b * 2; setCommentary('Dealer busts! You WIN ' + winAmt + '!'); player.spawnConfetti(25)
    } else if (pT > dT) {
      res = 'win'; winAmt = b * 2; setCommentary('You win! ' + pT + ' beats ' + dT); player.spawnConfetti(20)
    } else if (pT < dT) {
      res = 'lose'; setCommentary('Dealer wins. ' + dT + ' beats ' + pT)
    } else {
      res = 'push'; setCommentary('Push! Both have ' + pT)
    }
    if (winAmt > 0) {
      const mult = player.getCoinMultiplier(ble.bleConnected)
      player.setCoins(c => c + Math.round(winAmt * mult))
      audio.playFx('crowd')
    } else if (res === 'bust' || res === 'lose') {
      player.setCoins(c => Math.max(0, c - b))
    }
    setResult(res); setScore(s => { const v = s + winAmt; scoreRef.current = v; return v }); setPhase('result')
    schedule(() => nextRound(), 2500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, player, ble.bleConnected])

  const dealerPlay = useCallback((pHand: Card[]) => {
    setPhase('dealer_turn'); setCommentary('Dealer reveals...')
    const dHand = [...dealerHandRef.current]
    const playStep = () => {
      const t = handTotal(dHand)
      setDealerHand([...dHand]); setDealerTotal(t)
      if (t < 17) {
        schedule(() => {
          dHand.push(drawCard())
          audio.playFx('select')
          setCommentary('Dealer hits... ' + handTotal(dHand))
          playStep()
        }, 700)
      } else {
        schedule(() => resolve(pHand, dHand, false), 600)
      }
    }
    schedule(playStep, 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, resolve])

  const deal = useCallback(() => {
    const p1 = drawCard(), p2 = drawCard(), d1 = drawCard(), d2 = drawCard()
    const pHand = [p1, p2], dHand = [d1, d2]
    const pT = handTotal(pHand), dT = handTotal(dHand)
    setPlayerHand(pHand); setDealerHand(dHand)
    setPlayerTotal(pT); setDealerTotal(dT)
    setResult(null); setPhase('dealing')
    audio.playFx('card_deal')
    setCommentary('Cards dealt...')
    schedule(() => {
      if (pT === 21) {
        setCommentary('BLACKJACK! Natural 21!'); audio.playFx('jackpot')
        resolve(pHand, dHand, true)
      } else {
        setPhase('player_turn')
        setCommentary('Your turn! Short puff = HIT, Long puff = STAND, Blinker = DOUBLE DOWN')
      }
    }, 1200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, resolve])

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 7) {
      setPhase('complete')
      audio.playFx(scoreRef.current > 0 ? 'win' : 'lose')
      player.recordGameResult(scoreRef.current > 0, scoreRef.current > 0 ? 20 : 0, scoreRef.current > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'fortune', gameActive: game.gameActive })
      return
    }
    setRound(next); roundRef.current = next
    setBet(50); betRef.current = 50; setResult(null)
    deal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, deal, player, ble.bleConnected, game.gameActive])

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setPlayerHand([]); setDealerHand([]); setPlayerTotal(0); setDealerTotal(0)
    setBet(50); betRef.current = 50; setResult(null); setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setPhase('intro')
    audio.playFx('crowd')
    setCommentary('Welcome to Puff Blackjack! Get closer to 21!')
    schedule(() => deal(), 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, deal])

  const cleanup = useCallback(() => {
    audio.gameSoundsMuted.current = true
    clearTimers()
    setPhase(null); setPlayerHand([]); setDealerHand([])
    setPlayerTotal(0); setDealerTotal(0); setResult(null)
    setBet(50); betRef.current = 50; setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    game.exitGame()
  }, [audio, game])

  // ── Puff handlers ──
  const handlePuff = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffEnd = useCallback(() => {
    if (!puffStartRef.current || phaseRef.current !== 'player_turn') return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    if (dur >= 4.5) {
      // DOUBLE DOWN
      setBet(b => { const v = b * 2; betRef.current = v; return v })
      const newCard = drawCard()
      const newHand = [...playerHandRef.current, newCard]
      const newTotal = handTotal(newHand)
      setPlayerHand(newHand); setPlayerTotal(newTotal)
      audio.playFx('whistle')
      setCommentary('DOUBLE DOWN! Bet doubled! One more card...')
      if (newTotal > 21) {
        schedule(() => { setCommentary('BUST! Over 21!'); resolve(newHand, dealerHandRef.current, false) }, 800)
      } else {
        schedule(() => dealerPlay(newHand), 800)
      }
    } else if (dur >= 1.5) {
      // STAND
      audio.playFx('select')
      setCommentary('You STAND at ' + handTotal(playerHandRef.current) + '!')
      dealerPlay(playerHandRef.current)
    } else {
      // HIT
      const newCard = drawCard()
      const newHand = [...playerHandRef.current, newCard]
      const newTotal = handTotal(newHand)
      setPlayerHand(newHand); setPlayerTotal(newTotal)
      audio.playFx('select')
      if (newTotal > 21) {
        setCommentary('BUST! ' + newTotal + ' — over 21!')
        schedule(() => resolve(newHand, dealerHandRef.current, false), 800)
      } else if (newTotal === 21) {
        setCommentary('21! Perfect! Standing...')
        schedule(() => dealerPlay(newHand), 800)
      } else {
        setCommentary('HIT! You have ' + newTotal + '. Hit or Stand?')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, dealerPlay, resolve])

  // Tap actions for HIT/STAND buttons
  const tapHit = () => {
    if (phaseRef.current !== 'player_turn') return
    const newCard = drawCard()
    const newHand = [...playerHandRef.current, newCard]
    const newTotal = handTotal(newHand)
    setPlayerHand(newHand); setPlayerTotal(newTotal)
    audio.playFx('select')
    if (newTotal > 21) {
      setCommentary('BUST! ' + newTotal + ' — over 21!')
      schedule(() => resolve(newHand, dealerHandRef.current, false), 800)
    } else if (newTotal === 21) {
      setCommentary('21! Perfect! Standing...')
      schedule(() => dealerPlay(newHand), 800)
    } else {
      setCommentary('HIT! You have ' + newTotal + '. Hit or Stand?')
    }
  }
  const tapStand = () => {
    if (phaseRef.current !== 'player_turn') return
    audio.playFx('select')
    setCommentary('You STAND at ' + handTotal(playerHandRef.current) + '!')
    dealerPlay(playerHandRef.current)
  }

  // Mount: start the game
  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'puffblackjack') return
    startedRef.current = true
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // BLE puff handlers (lazy wrappers — Rule 3)
  useEffect(() => {
    if (game.gameActive?.id !== 'puffblackjack') return
    audio.gameSoundsMuted.current = false
    ble.registerPuffHandlers('puffblackjack', () => handlePuff(), () => handlePuffEnd())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimers()
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'puffblackjack') return null

  const isPlayerTurn = phase === 'player_turn'
  const isDealerTurn = phase === 'dealer_turn'
  const isResult = phase === 'result'
  const isComp = phase === 'complete'
  const winMult = (player.getCoinMultiplier(ble.bleConnected) || 1)

  const renderCard = (c: Card | undefined, hidden: boolean) => (
    <div style={{
      width: 48, height: 68, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: hidden ? 'linear-gradient(135deg,#1a3a5c,#0a1a30)' : 'linear-gradient(180deg,#fafafa,#e0e0e0)',
      border: hidden ? '2px solid #2a5a8c' : '2px solid #ccc',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      fontSize: hidden ? 20 : 12, fontWeight: 800,
      color: hidden ? '#4a8abf' : (c && (c.suit === '♥️' || c.suit === '♦️')) ? '#dc2626' : '#1a1a1a',
    }}>
      {hidden ? '🂠' : c?.display}
    </div>
  )

  const onSurfaceDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return
    handlePuff()
  }
  const onSurfaceUp = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return
    handlePuffEnd()
  }

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={onSurfaceDown} onMouseUp={onSurfaceUp}
      onTouchStart={onSurfaceDown} onTouchEnd={onSurfaceUp}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0a1e0a 0%,#0d3d0d 40%,#0a2a0a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.06), transparent 60%)', pointerEvents: 'none' }} />

      {/* Back button */}
      <div data-back="true" style={{ position: 'absolute', top: 12, left: 14, zIndex: 30 }}>
        <div onClick={(e) => { e.stopPropagation(); cleanup() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, touchAction: 'none' }}>
          <span style={{ fontSize: 12, color: C.text2 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>Back</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg,#22C55E,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PUFF BLACKJACK</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/7</div><div style={{ fontSize: 8, color: C.text3 }}>HAND</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>Bet:{bet}</div><div style={{ fontSize: 8, color: C.text3 }}>WAGER</div></div>
        </div>

        <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
          Win up to: {Math.round(bet * 2.5 * winMult)} 🪙 ({(2.5 * winMult).toFixed(1)}x)
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
                {dealerHand.map((c, i) => (
                  <div key={i}>{renderCard(c, (i === 1 && phase === 'dealing') || (i === 1 && isPlayerTurn))}</div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 12, fontWeight: 800, color: C.gold }}>
              {isResult && result === 'win' ? 'YOU WIN!' :
                isResult && result === 'blackjack' ? 'BLACKJACK!' :
                isResult && result === 'lose' ? 'DEALER WINS' :
                isResult && result === 'bust' ? 'BUST!' :
                isResult && result === 'push' ? 'PUSH' : 'VS'}
            </div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, marginBottom: 4 }}>YOU ({playerTotal})</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {playerHand.map((c, i) => (
                  <div key={i}>{renderCard(c, false)}</div>
                ))}
              </div>
            </div>
            {isPlayerTurn && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <div data-btn="true" onClick={(e) => { e.stopPropagation(); tapHit() }} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)', touchAction: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>HIT</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>&lt;1.5s</div>
                  </div>
                  <div data-btn="true" onClick={(e) => { e.stopPropagation(); tapStand() }} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', touchAction: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.red }}>STAND</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>&gt;1.5s</div>
                  </div>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(147,51,234,0.10)', border: '1px solid rgba(147,51,234,0.20)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.purple }}>DOUBLE</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>4.5s+</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginTop: 10, animation: 'pulse 1.5s infinite' }}>TAP: Hit/Stand · PUFF: Double Down 🃏</div>
              </div>
            )}
            {isResult && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: result === 'win' || result === 'blackjack' ? C.gold : result === 'push' ? C.cyan : C.red }}>
                  {result === 'win' || result === 'blackjack'
                    ? `+${bet * (result === 'blackjack' ? 2.5 : 2)} coins`
                    : result === 'push' ? 'Bet returned' : `-${bet} coins`}
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
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); start() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)', fontSize: 13, fontWeight: 800, color: '#22C55E', touchAction: 'none' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
