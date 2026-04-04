import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = 'intro' | 'product' | 'guessing' | 'reveal' | 'result'

interface Product { name: string; emoji: string; price: number; category: string }
interface Result { product: Product; guess: number; won: boolean; exact: boolean; coins: number }

const PIP_PRODUCTS: Product[] = [
  { name: 'Cali Clear Cart (1g)', emoji: '💨', price: 45, category: 'Cannabis' },
  { name: 'Rolling Papers (King Size)', emoji: '📜', price: 8, category: 'Accessories' },
  { name: 'Glass Bong (12 inch)', emoji: '🫧', price: 120, category: 'Glass' },
  { name: 'Grinder (4 piece)', emoji: '⚙️', price: 35, category: 'Accessories' },
  { name: 'Edible Gummies (10pk)', emoji: '🍬', price: 25, category: 'Edibles' },
  { name: 'Dab Rig Kit', emoji: '🔥', price: 180, category: 'Glass' },
  { name: 'Pre-Roll Pack (5pk)', emoji: '🌿', price: 30, category: 'Flower' },
  { name: 'Vape Battery', emoji: '🔋', price: 20, category: 'Devices' },
  { name: 'Quarter Oz Premium', emoji: '🌿', price: 80, category: 'Flower' },
  { name: 'CBD Tincture', emoji: '💧', price: 50, category: 'Wellness' },
]

const PRICE_PER_SEC = 30
const ROUNDS = 5

export default function PricePuff() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [product, setProduct] = useState<Product | null>(null)
  const [round, setRound] = useState(0)
  const [guess, setGuess] = useState(0)
  const [puffing, setPuffing] = useState(false)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<Phase>('intro')
  const puffingRef = useRef(false)
  const productRef = useRef<Product | null>(null)
  const roundRef = useRef(0)
  const scoreRef = useRef(0)
  const resultsRef = useRef<Result[]>([])
  const usedRef = useRef<number[]>([])
  const puffStartRef = useRef(0)
  const puffInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { puffingRef.current = puffing }, [puffing])
  useEffect(() => { productRef.current = product }, [product])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { resultsRef.current = results }, [results])

  const startRound = useCallback((roundNum: number, usedSoFar: number[]) => {
    const available = PIP_PRODUCTS.filter((_, i) => !usedSoFar.includes(i))
    const idx = PIP_PRODUCTS.indexOf(available[Math.floor(Math.random() * available.length)])
    const prod = PIP_PRODUCTS[idx]
    const newUsed = [...usedSoFar, idx]
    usedRef.current = newUsed
    setProduct(prod); productRef.current = prod
    setRound(roundNum); roundRef.current = roundNum
    setGuess(0); setPuffing(false); puffingRef.current = false
    setCommentary(`Round ${roundNum + 1}: What's the price of ${prod.name}?`)
    setPhase('product'); phaseRef.current = 'product'
    playFx('tap')
    setTimeout(() => {
      setPhase('guessing'); phaseRef.current = 'guessing'
      setCommentary('HOLD TO SET PRICE 💰 Longer = higher!')
    }, 2000)
  }, [playFx])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'guessing' || puffingRef.current) return
    setPuffing(true); puffingRef.current = true
    setGuess(0)
    puffStartRef.current = Date.now()
    playFx('tap')
    puffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - puffStartRef.current) / 1000
      setGuess(Math.min(Math.round(elapsed * PRICE_PER_SEC), 300))
    }, 50)
  }, [playFx])

  const handlePuffUp = useCallback(() => {
    if (!puffingRef.current) return
    setPuffing(false); puffingRef.current = false
    if (puffInterval.current) { clearInterval(puffInterval.current); puffInterval.current = null }
    const elapsed = (Date.now() - puffStartRef.current) / 1000
    const finalGuess = Math.min(Math.round(elapsed * PRICE_PER_SEC), 300)
    setGuess(finalGuess)

    const prod = productRef.current!
    const realPrice = prod.price
    const playerOver = finalGuess > realPrice
    const playerExact = finalGuess === realPrice
    const diff = Math.abs(finalGuess - realPrice)
    const won = !playerOver
    let roundCoins = 0
    let msg = ''
    if (playerExact) {
      roundCoins = 50; msg = 'EXACT PRICE! JACKPOT! 🎰💰'
      playFx('crowd')
    } else if (playerOver) {
      msg = `TOO HIGH! Guessed $${finalGuess} — real price $${realPrice} 📈`
      playFx('lose')
    } else if (diff <= 5) {
      roundCoins = 30; msg = `SO CLOSE! $${finalGuess} vs $${realPrice} 🎯`
      playFx('crowd')
    } else if (diff <= 15) {
      roundCoins = 20; msg = `Good guess! $${finalGuess} vs $${realPrice} 👍`
      playFx('select')
    } else {
      msg = `Off by $${diff}. Real price: $${realPrice}`
      playFx('lose')
    }
    setCommentary(msg)

    const newScore = scoreRef.current + roundCoins
    setScore(newScore); scoreRef.current = newScore
    const newResult: Result = { product: prod, guess: finalGuess, won: !playerOver, exact: playerExact, coins: roundCoins }
    const newResults = [...resultsRef.current, newResult]
    setResults(newResults); resultsRef.current = newResults

    setPhase('reveal'); phaseRef.current = 'reveal'

    const curRound = roundRef.current
    const curUsed = [...usedRef.current]
    setTimeout(() => {
      const nextRound = curRound + 1
      if (nextRound >= ROUNDS) {
        setPhase('result'); phaseRef.current = 'result'
        awardGame({ won: newScore > 0, baseCoins: newScore > 0 ? 60 : 10, baseXP: newScore > 0 ? 20 : 8 })
        playFx('crowd')
      } else {
        startRound(nextRound, curUsed)
      }
    }, 3000)
  }, [awardGame, startRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    usedRef.current = []
    setScore(0); scoreRef.current = 0
    setResults([]); resultsRef.current = []
    setGuess(0); setPuffing(false); puffingRef.current = false
    setCommentary('Welcome to The Price is Puff!')
    setPhase('intro'); phaseRef.current = 'intro'
    playFx('crowd')
    setTimeout(() => startRound(0, []), 1800)
  }, [playFx, startRound])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isGuessing = phase === 'guessing'
  const isReveal = phase === 'reveal'
  const isResult = phase === 'result'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #040e08 0%, #0a1a0a 40%, #040e08 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 16px 20px', gap: 12, maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.green}, ${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>💰 THE PRICE IS PUFF</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/{ROUNDS}</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.green }}>THE PRICE IS PUFF</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 8 }}>Hold longer = higher price guess!</div>
            <div style={{ fontSize: 9, color: C.text3 }}>Closest without going over WINS!</div>
          </div>
        )}

        {(phase === 'product' || isGuessing || isReveal) && product && (
          <div style={{ width: '100%', padding: 20, borderRadius: 16, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 4 }}>{product.category}</div>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{product.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 12 }}>{product.name}</div>
            <div style={{ fontSize: 9, color: C.text3 }}>What's the real price?</div>
          </div>
        )}

        {(isGuessing || isReveal) && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 4 }}>YOUR GUESS</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: puffing ? C.cyan : C.gold, animation: puffing ? 'pulse 0.5s infinite' : undefined }}>${guess}</div>
            {isReveal && product && (
              <div style={{ fontSize: 14, color: C.text3, marginTop: 4 }}>Real price: <span style={{ color: C.green, fontWeight: 800 }}>${product.price}</span></div>
            )}
          </div>
        )}

        {isGuessing && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.green, animation: 'pulse 1.5s infinite' }}>
              {puffing ? `💨 PUFFING... $${guess}` : 'HOLD TO PUFF and set price!'}
            </div>
            <div style={{ fontSize: 9, color: C.text3 }}>1s = $30 · 2s = $60 · 3s = $90</div>
          </div>
        )}

        {isReveal && (
          <div style={{ padding: 12, borderRadius: 14, background: results[results.length - 1]?.won ? `${C.green}10` : `${C.red}10`, border: `1px solid ${results[results.length - 1]?.won ? C.green : C.red}20`, textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: results[results.length - 1]?.won ? C.green : C.red }}>
              {results[results.length - 1]?.exact ? '🎰 EXACT!' : results[results.length - 1]?.won ? '✅ Under price!' : '❌ Over price!'}
            </div>
            {results[results.length - 1]?.coins > 0 && (
              <div style={{ fontSize: 12, color: C.gold }}>+{results[results.length - 1]?.coins} coins!</div>
            )}
          </div>
        )}

        {isResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease', width: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{score >= 100 ? '🏆' : score > 0 ? '🎉' : '😔'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold }}>GAME OVER!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>Total: {score} coins</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, marginBottom: 12, width: '100%' }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: r.won ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${r.won ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <span style={{ fontSize: 9, color: C.text2 }}>{r.product.emoji} {r.product.name.slice(0, 20)}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.won ? C.green : C.red }}>${r.guess} / ${r.product.price}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{commentary}</div>
      </div>
    </div>
  )
}
