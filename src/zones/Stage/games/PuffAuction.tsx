import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = 'intro' | 'bidding' | 'reveal' | 'result' | 'final'

interface Prize { name: string; value: number; emoji: string; rarity: string }

const PA_PRIZES: Prize[] = [
  { name: '100 Coins', value: 100, emoji: '🪙', rarity: 'common' },
  { name: '200 Coins', value: 200, emoji: '💰', rarity: 'common' },
  { name: 'Rare Badge', value: 300, emoji: '🏅', rarity: 'rare' },
  { name: '500 Coins', value: 500, emoji: '💎', rarity: 'rare' },
  { name: 'MYSTERY BOX', value: 1000, emoji: '🎁', rarity: 'legendary' },
]

const AI_BIDDERS = [
  { name: 'VibeKing', emoji: '👑' },
  { name: 'PuffMaster', emoji: '💨' },
  { name: 'CloudChaser', emoji: '☁️' },
]

export default function PuffAuction() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [bid, setBid] = useState(0)
  const [holding, setHolding] = useState(false)
  const [aiBids, setAiBids] = useState<{ name: string; emoji: string; bid: number }[]>([])
  const [totalWon, setTotalWon] = useState(0)
  const [roundResults, setRoundResults] = useState<{ prize: Prize; playerBid: number; won: boolean }[]>([])
  const [commentary, setCommentary] = useState('')
  const [disqualified, setDisqualified] = useState(false)

  const phaseRef = useRef<Phase>('intro')
  const holdingRef = useRef(false)
  const bidRef = useRef(0)
  const roundRef = useRef(0)
  const totalWonRef = useRef(0)
  const roundResultsRef = useRef<typeof roundResults>([])
  const disqualifiedRef = useRef(false)
  const puffStart = useRef(0)
  const bidInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const MAX_BID = 200

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { holdingRef.current = holding }, [holding])
  useEffect(() => { bidRef.current = bid }, [bid])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { totalWonRef.current = totalWon }, [totalWon])
  useEffect(() => { roundResultsRef.current = roundResults }, [roundResults])
  useEffect(() => { disqualifiedRef.current = disqualified }, [disqualified])

  const startRound = useCallback((roundNum: number) => {
    if (roundNum >= PA_PRIZES.length) {
      setPhase('final'); phaseRef.current = 'final'
      awardGame({ won: totalWonRef.current > 0, baseCoins: totalWonRef.current > 0 ? 20 : 0, baseXP: totalWonRef.current > 0 ? 20 : 8 })
      return
    }
    setRound(roundNum); roundRef.current = roundNum
    setBid(0); bidRef.current = 0
    setHolding(false); holdingRef.current = false
    setAiBids([])
    setDisqualified(false); disqualifiedRef.current = false
    const prize = PA_PRIZES[roundNum]
    setCommentary(`Round ${roundNum + 1}: BID for ${prize.emoji} ${prize.name}!`)
    setPhase('bidding'); phaseRef.current = 'bidding'
    playFx('tap')
  }, [playFx, awardGame])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'bidding' || holdingRef.current || disqualifiedRef.current) return
    setHolding(true); holdingRef.current = true
    puffStart.current = Date.now()
    setBid(0); bidRef.current = 0
    playFx('tap')
    bidInterval.current = setInterval(() => {
      const elapsed = (Date.now() - puffStart.current) / 1000
      const newBid = Math.min(Math.round(elapsed * 25), MAX_BID)
      setBid(newBid); bidRef.current = newBid
      if (newBid >= MAX_BID) {
        // Disqualified for overbidding
        setHolding(false); holdingRef.current = false
        if (bidInterval.current) { clearInterval(bidInterval.current); bidInterval.current = null }
        setDisqualified(true); disqualifiedRef.current = true
        setCommentary('OVERBID! Disqualified this round! 💀')
        playFx('lose')
        // Auto reveal
        setTimeout(() => revealRound(MAX_BID + 1, true), 1000)
      }
    }, 50)
  }, [playFx])

  const revealRound = useCallback((playerBid: number, isDisq: boolean) => {
    const prize = PA_PRIZES[roundRef.current]
    // Generate AI bids
    const aiGuesses = AI_BIDDERS.map(ai => ({
      ...ai,
      bid: Math.max(1, Math.round(prize.value * (0.3 + Math.random() * 0.5))),
    }))
    setAiBids(aiGuesses)

    const validBids = [{ name: 'You', bid: isDisq ? 0 : playerBid }, ...aiGuesses].filter(b => b.bid <= prize.value)
    validBids.sort((a, b) => b.bid - a.bid)
    const playerWon = !isDisq && validBids[0]?.name === 'You'

    setPhase('reveal'); phaseRef.current = 'reveal'

    if (playerWon) {
      const newTotal = totalWonRef.current + prize.value
      setTotalWon(newTotal); totalWonRef.current = newTotal
      setCommentary(`🏆 YOU WIN ${prize.emoji} ${prize.name}! +${prize.value} coins!`)
      playFx('crowd')
    } else if (isDisq) {
      setCommentary(`💀 Overbid! You lose this round.`)
      playFx('lose')
    } else {
      const winner = validBids[0]
      setCommentary(winner ? `${winner.name} wins with bid ${winner.bid}!` : 'Nobody won! All overbid!')
      playFx('lose')
    }

    const newResult = { prize, playerBid: isDisq ? -1 : playerBid, won: playerWon }
    const newResults = [...roundResultsRef.current, newResult]
    setRoundResults(newResults); roundResultsRef.current = newResults

    setTimeout(() => {
      const nextRound = roundRef.current + 1
      if (nextRound >= PA_PRIZES.length) {
        setPhase('final'); phaseRef.current = 'final'
        awardGame({ won: totalWonRef.current > 0, baseCoins: totalWonRef.current > 0 ? 20 : 0, baseXP: totalWonRef.current > 0 ? 20 : 8 })
      } else {
        startRound(nextRound)
      }
    }, 3000)
  }, [awardGame, startRound])

  const handlePuffUp = useCallback(() => {
    if (!holdingRef.current || phaseRef.current !== 'bidding') return
    setHolding(false); holdingRef.current = false
    if (bidInterval.current) { clearInterval(bidInterval.current); bidInterval.current = null }
    const finalBid = bidRef.current
    revealRound(finalBid, false)
  }, [revealRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    setTotalWon(0); totalWonRef.current = 0
    setRoundResults([]); roundResultsRef.current = []
    setCommentary('Welcome to Puff Auction!')
    setPhase('intro'); phaseRef.current = 'intro'
    playFx('crowd')
    setTimeout(() => startRound(0), 1800)
  }, [playFx, startRound])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentPrize = PA_PRIZES[Math.min(round, PA_PRIZES.length - 1)]
  const isBidding = phase === 'bidding'
  const isReveal = phase === 'reveal'
  const isFinal = phase === 'final'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0800 0%, #1a1000 40%, #0a0800 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 16px 20px', gap: 12, maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.gold}, ${C.lime})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔨 PUFF AUCTION</div>

        {/* Round dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PA_PRIZES.map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i < round ? C.gold : i === round ? `${C.gold}80` : `${C.text3}30`, border: `1px solid ${i === round ? C.gold : `${C.text3}20`}`, boxShadow: i === round ? `0 0 8px ${C.gold}40` : 'none' }} />
          ))}
        </div>

        <div style={{ fontSize: 10, color: C.text3 }}>Round {round + 1} of {PA_PRIZES.length} · Won: {totalWon} coins</div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔨</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>PUFF AUCTION</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 8 }}>Hold to bid! Longer = higher bid!</div>
            <div style={{ fontSize: 9, color: C.text3 }}>Stay UNDER the prize value to win!</div>
          </div>
        )}

        {(isBidding || isReveal) && currentPrize && (
          <div style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: currentPrize.rarity === 'legendary' ? C.gold : currentPrize.rarity === 'rare' ? C.purple : C.text3, fontWeight: 700, marginBottom: 4 }}>{currentPrize.rarity.toUpperCase()}</div>
            <div style={{ fontSize: 40, marginBottom: 6 }}>{currentPrize.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{currentPrize.name}</div>
            <div style={{ fontSize: 12, color: C.gold, marginTop: 4 }}>Value: {currentPrize.value} coins</div>
          </div>
        )}

        {isBidding && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: C.text3, marginBottom: 4 }}>YOUR BID</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: disqualified ? C.red : holding ? C.cyan : C.gold, animation: holding ? 'pulse 0.5s infinite' : undefined }}>
                {disqualified ? '💀 DISQ!' : bid}
              </div>
            </div>
            {/* Bid bar */}
            <div style={{ width: '100%', height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (bid / MAX_BID) * 100)}%`, background: bid > (currentPrize?.value ?? 100) ? `linear-gradient(90deg, ${C.red}, #ff0000)` : `linear-gradient(90deg, ${C.gold}, ${C.lime})`, transition: 'width 0.05s' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: C.text3 }}>Max: {MAX_BID} · Stay under {currentPrize?.value}!</div>
            {!holding && !disqualified && (
              <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>HOLD TO BID! 💨</div>
            )}
            {holding && (
              <div style={{ fontSize: 13, fontWeight: 800, color: C.cyan }}>💨 BIDDING... {bid}</div>
            )}
          </>
        )}

        {isReveal && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ textAlign: 'center', fontSize: 9, color: C.text3, fontWeight: 700 }}>ALL BIDS</div>
            {[{ name: 'You', emoji: '🎮', bid }, ...aiBids].map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: b.name === 'You' ? `${C.cyan}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${b.name === 'You' ? C.cyan + '30' : C.border}` }}>
                <span style={{ fontSize: 10, color: C.text2 }}>{b.emoji} {b.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.bid > (currentPrize?.value ?? 100) ? C.red : C.gold }}>{b.bid > (currentPrize?.value ?? 100) ? 'OVER' : b.bid}</span>
              </div>
            ))}
          </div>
        )}

        {isFinal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease', width: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{totalWon >= 500 ? '🏆' : totalWon > 0 ? '🎉' : '😔'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold }}>AUCTION OVER!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>Won: {totalWon} coins</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, marginBottom: 12 }}>
              {roundResults.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: r.won ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${r.won ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <span style={{ fontSize: 9, color: C.text2 }}>{r.prize.emoji} {r.prize.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.won ? C.green : C.red }}>{r.won ? `+${r.prize.value}` : r.playerBid === -1 ? 'DISQ' : '✗'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
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
