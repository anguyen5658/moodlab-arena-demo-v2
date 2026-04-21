import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

interface Product { name: string; emoji: string; price: number; category: string }
interface AiPlayer { name: string; emoji: string }
interface AiGuess extends AiPlayer { guess: number }
interface RoundResult { product: Product; guess: number; realPrice: number; winner: string | null; coins: number; over: boolean; exact: boolean }

// Direct lift from monolith line 14140
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
const PIP_ROUNDS = 5
const PIP_PRICE_PER_SEC = 30
const PIP_AI_PLAYERS: AiPlayer[] = [
  { name: 'SmokeBot', emoji: '🤖' },
  { name: 'PuffMaster', emoji: '🎯' },
  { name: 'CloudChaser', emoji: '☁️' },
]

type Phase = 'intro' | 'product' | 'guessing' | 'reveal' | 'result' | null

export const PriceIsPuffGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [introStep, setIntroStep] = useState(0)
  const [round, setRound] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [guess, setGuess] = useState(0)
  const [puffing, setPuffing] = useState(false)
  const [aiGuesses, setAiGuesses] = useState<AiGuess[]>([])
  const [comment, setComment] = useState('')
  const [commentary, setCommentary] = useState('')
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])

  const usedRef = useRef<number[]>([])
  const puffStartRef = useRef(0)
  const puffIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const scoreRef = useRef(0)
  useEffect(() => { scoreRef.current = score }, [score])
  const productRef = useRef<Product | null>(null)
  useEffect(() => { productRef.current = product }, [product])
  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])
  const usedProductsRef = useRef<number[]>([])
  const puffingRef = useRef(false)

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
  }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const startRound = useCallback((roundNum: number, usedSoFar: number[]) => {
    const available = PIP_PRODUCTS.map((_, i) => i).filter(i => !usedSoFar.includes(i))
    const pool = available.length ? available : PIP_PRODUCTS.map((_, i) => i)
    const idx = pool[Math.floor(Math.random() * pool.length)]
    const prod = PIP_PRODUCTS[idx]
    const newUsed = [...usedSoFar, idx]
    usedProductsRef.current = newUsed
    setProduct(prod)
    setRound(roundNum)
    setGuess(0)
    setPuffing(false); puffingRef.current = false
    setAiGuesses([])
    setComment('')
    setPhase('product')
    setCommentary(`Round ${roundNum + 1}: What's the price of ${prod.name}?`)
    audio.playFx('tap')
    addTimeout(() => {
      setPhase('guessing')
      setCommentary('HOLD TO SET PRICE 💰 Longer = higher!')
    }, 2000)
  }, [audio])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    usedRef.current = []
    usedProductsRef.current = []
    setPhase('intro')
    setIntroStep(0)
    setRound(0)
    setScore(0)
    setResults([])
    setProduct(null)
    setGuess(0)
    setPuffing(false); puffingRef.current = false
    setAiGuesses([])
    setComment('')
    audio.playFx('crowd')
    setCommentary('Welcome to The Price is Puff!')
    addTimeout(() => setIntroStep(1), 400)
    addTimeout(() => setIntroStep(2), 1000)
    addTimeout(() => setIntroStep(3), 1800)
    addTimeout(() => { setIntroStep(4); audio.playFx('whistle') }, 2600)
    addTimeout(() => startRound(0, []), 3400)
  }, [audio, startRound])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    clearTimeouts()
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const stopPuff = useCallback(() => {
    if (!puffingRef.current) return
    puffingRef.current = false
    setPuffing(false)
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    const prod = productRef.current
    if (!prod) return
    const elapsed = (Date.now() - puffStartRef.current) / 1000
    const finalGuess = Math.min(Math.round(elapsed * PIP_PRICE_PER_SEC), 300)
    setGuess(finalGuess)
    const realPrice = prod.price
    const ai = PIP_AI_PLAYERS.map(a => {
      const variance = (Math.random() - 0.4) * realPrice * 0.6
      return { ...a, guess: Math.max(1, Math.round(realPrice + variance)) }
    })
    setAiGuesses(ai)
    setPhase('reveal')
    audio.playFx('crowd')
    const allGuesses = [{ name: 'You', emoji: '🎮', guess: finalGuess }, ...ai]
    const valid = allGuesses.filter(g => g.guess <= realPrice)
    let winner: string | null = null
    let roundCoins = 0
    if (valid.length > 0) {
      valid.sort((a, b) => b.guess - a.guess)
      winner = valid[0].name
    }
    const playerOver = finalGuess > realPrice
    const playerExact = finalGuess === realPrice
    if (winner === 'You') {
      roundCoins = playerExact ? 50 : 25
      setComment(playerExact ? 'EXACT PRICE! JACKPOT! 🎰💰' : 'WINNER! Closest without going over! 🏆')
      audio.playFx('goal')
      setCommentary(playerExact ? 'UNBELIEVABLE! Exact price nailed!' : 'Great guess! You win this round!')
    } else if (playerOver) {
      setComment(`TOO HIGH! You guessed $${finalGuess} — real price $${realPrice} 📈`)
      setCommentary('Overbid! The price was lower!')
      audio.playFx('miss')
    } else {
      const winnerObj = allGuesses.find(g => g.name === winner)
      setComment(`${winner} wins! Their $${winnerObj?.guess || '?'} was closer! 😤`)
      setCommentary(`${winner} takes this round!`)
      audio.playFx('miss')
    }
    setScore(prev => prev + roundCoins)
    setResults(prev => [...prev, {
      product: prod, guess: finalGuess, realPrice, winner, coins: roundCoins, over: playerOver, exact: playerExact,
    }])
    const curRound = roundRef.current
    const curUsed = [...usedProductsRef.current]
    addTimeout(() => {
      const nextRound = curRound + 1
      if (nextRound >= PIP_ROUNDS) {
        setPhase('result')
        const finalScore = scoreRef.current + roundCoins
        player.recordGameResult(finalScore > 0, finalScore > 0 ? 60 : 10, finalScore > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
        audio.playFx(finalScore > 0 ? 'win' : 'lose')
        setCommentary("That's the show! Let's see how you did!")
        player.spawnConfetti(30)
      } else {
        startRound(nextRound, curUsed)
      }
    }, 3500)
  }, [audio, player, ble.bleConnected, game.gameActive, startRound])

  const startPuff = useCallback(() => {
    if (phaseRef.current !== 'guessing' || puffingRef.current) return
    puffingRef.current = true
    setPuffing(true)
    setGuess(0)
    puffStartRef.current = Date.now()
    audio.playFx('tap')
    puffIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - puffStartRef.current) / 1000
      const g = Math.round(elapsed * PIP_PRICE_PER_SEC)
      setGuess(Math.min(g, 300))
    }, 50)
  }, [audio])

  const collect = useCallback(() => {
    exitGame()
  }, [exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'pricepuff') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'pricepuff') return
    ble.registerPuffHandlers('pricepuff', () => startPuff(), () => stopPuff())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimeouts()
      if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'pricepuff') return null
  const isResult = phase === 'result'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="💰 THE PRICE IS PUFF"
        titleColor={C.green}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${Math.min(round + 1, PIP_ROUNDS)}/${PIP_ROUNDS} · ${score}c`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#0a3020,#0a1a10)' }}>
        {commentary && !isResult && (
          <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', fontSize: 10, color: C.gold, fontWeight: 700 }}>{commentary}</div>
          </div>
        )}

        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 60, gap: 14 }}>
            <div style={{ fontSize: 56, opacity: introStep >= 1 ? 1 : 0, transition: 'opacity 0.4s' }}>💰</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.green, opacity: introStep >= 2 ? 1 : 0, transition: 'opacity 0.4s' }}>THE PRICE IS PUFF</div>
            <div style={{ fontSize: 11, color: C.text2, opacity: introStep >= 3 ? 1 : 0, transition: 'opacity 0.4s', textAlign: 'center' }}>Hold to set price. Closest without going over wins!</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, opacity: introStep >= 4 ? 1 : 0, transition: 'opacity 0.4s', marginTop: 10 }}>GET READY!</div>
          </div>
        )}

        {(phase === 'product' || phase === 'guessing' || phase === 'reveal') && product && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 46, paddingBottom: 60, gap: 14 }}>
            <div style={{ width: '100%', maxWidth: 340, padding: 18, borderRadius: 16, background: `${C.green}12`, border: `2px solid ${C.green}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 6 }}>{product.emoji}</div>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1 }}>{product.category.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.green, marginTop: 2 }}>{product.name}</div>
              {phase === 'reveal' && (
                <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900, color: C.gold }}>${product.price}</div>
              )}
            </div>

            {phase === 'guessing' && (
              <>
                <div style={{ textAlign: 'center', fontSize: 42, fontWeight: 900, color: puffing ? C.gold : C.text3, fontFamily: "'Courier New',monospace" }}>${guess}</div>
                <div
                  onMouseDown={(e) => { e.preventDefault(); startPuff() }}
                  onMouseUp={(e) => { e.preventDefault(); stopPuff() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startPuff() }}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); stopPuff() }}
                  onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); stopPuff() }}
                  style={{ padding: '16px 28px', borderRadius: 60, cursor: 'pointer', background: puffing ? `${C.gold}28` : `${C.green}20`, border: `2px solid ${puffing ? C.gold : C.green}60`, fontSize: 14, fontWeight: 900, color: puffing ? C.gold : C.green, touchAction: 'none', userSelect: 'none' }}
                >
                  {puffing ? '💨 HOLDING...' : '💨 HOLD TO SET PRICE'}
                </div>
                <div style={{ fontSize: 9, color: C.text3 }}>${PIP_PRICE_PER_SEC}/sec · Max $300</div>
              </>
            )}

            {phase === 'reveal' && (
              <div style={{ width: '100%', maxWidth: 340 }}>
                <div style={{ textAlign: 'center', fontSize: 12, color: C.text2, marginBottom: 6 }}>Your guess: <b style={{ color: C.gold }}>${guess}</b></div>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{comment}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {aiGuesses.map(a => (
                    <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 12 }}>{a.emoji}</span>
                      <span style={{ flex: 1, fontSize: 10, color: C.text2 }}>{a.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: a.guess > product.price ? C.red : C.gold }}>${a.guess}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, padding: 20, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 6 }}>{score > 0 ? '🏆' : '💰'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: score > 0 ? C.green : C.gold, marginBottom: 6 }}>{score > 0 ? 'WINNER!' : 'Thanks for playing!'}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.gold, marginBottom: 10 }}>{score} coins</div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 10 }}>Rounds won: {results.filter(r => r.winner === 'You').length}/{PIP_ROUNDS}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
