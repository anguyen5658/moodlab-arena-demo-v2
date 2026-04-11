import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

interface Item { name: string; emoji: string; price: number }

const ITEMS: Item[] = [
  { name: 'Gram of Premium Flower', emoji: '🌿', price: 15 },
  { name: '3.5g Eighth (Top Shelf)', emoji: '💚', price: 45 },
  { name: 'Disposable Vape Pen', emoji: '💨', price: 40 },
  { name: '10mg Chocolate Bar', emoji: '🍫', price: 25 },
  { name: 'Rolling Tray (Metal)', emoji: '📐', price: 18 },
  { name: 'Glass Bubbler', emoji: '🫧', price: 85 },
  { name: '1oz Shake Bag', emoji: '💨', price: 120 },
  { name: 'Grinder (4-piece)', emoji: '⚙️', price: 35 },
  { name: 'Pre-Roll Pack (5)', emoji: '🚬', price: 50 },
  { name: 'Battery Charger', emoji: '🔋', price: 22 },
]

type Phase = 'guessing' | 'reveal' | 'final' | null

export const PriceIsPuffGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [item, setItem] = useState<Item | null>(null)
  const [guessValue, setGuessValue] = useState(25)
  const [lastAward, setLastAward] = useState(0)
  const [totalPts, setTotalPts] = useState(0)
  const [msg, setMsg] = useState('')

  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const itemsRef = useRef<Item[]>([])

  const startRound = useCallback(() => {
    const pool = itemsRef.current.length ? itemsRef.current : [...ITEMS].sort(() => Math.random() - 0.5)
    itemsRef.current = pool
    const it = pool.shift()!
    setItem(it)
    setGuessValue(20 + Math.floor(Math.random() * 40))
    setPhase('guessing')
    setMsg(`What's the price of ${it.name}?`)
    audio.playFx('select')
  }, [audio])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    itemsRef.current = [...ITEMS].sort(() => Math.random() - 0.5)
    setRound(0)
    setTotalPts(0)
    setLastAward(0)
    startRound()
  }, [audio, startRound])

  const submit = useCallback(() => {
    if (phaseRef.current !== 'guessing' || !item) return
    const diff = Math.abs(guessValue - item.price)
    const pct = diff / item.price
    let pts = 0
    if (pct <= 0.05) pts = 100
    else if (pct <= 0.15) pts = 70
    else if (pct <= 0.30) pts = 40
    else if (pct <= 0.50) pts = 20
    setLastAward(pts)
    setTotalPts(t => t + pts)
    setPhase('reveal')
    if (pts === 100) { audio.playFx('win'); player.spawnConfetti(30) }
    else if (pts >= 40) audio.playFx('success')
    else audio.playFx('miss')
    setMsg(pts === 100 ? 'PERFECT! 🎯' : pts >= 70 ? 'Great guess!' : pts >= 40 ? 'Not bad!' : 'Way off 😬')
    setTimeout(() => {
      const nr = round + 1
      if (nr >= 5) {
        setPhase('final')
        setMsg('Game complete!')
      } else {
        setRound(nr)
        startRound()
      }
    }, 2200)
  }, [item, guessValue, round, audio, player, startRound])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const won = totalPts >= 250
    const reward = Math.max(10, Math.round(totalPts / 4))
    player.notify(won ? `💰 ${totalPts}pts! +${reward} coins` : `💰 ${totalPts}pts · +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 22 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    exitGame()
  }, [totalPts, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'pricepuff') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'pricepuff') return
    ble.registerPuffHandlers('pricepuff', null, null)
    return () => {
      audio.gameSoundsMuted.current = true
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'pricepuff') return null
  const isFinal = phase === 'final'
  const isReveal = phase === 'reveal'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="💰 THE PRICE IS PUFF"
        titleColor={C.green}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round + 1}/5 · ${totalPts}pts`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#0a3020,#0a1a10)' }}>
        {!isFinal && item && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 16 }}>
            <div style={{ fontSize: 11, color: C.text3, letterSpacing: 2 }}>{msg}</div>
            <div style={{ width: '100%', maxWidth: 340, padding: 20, borderRadius: 16, background: `${C.green}12`, border: `2px solid ${C.green}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.green }}>{item.name}</div>
              {isReveal && (
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: C.gold }}>${item.price}</div>
              )}
            </div>

            {phase === 'guessing' && (
              <div style={{ width: '100%', maxWidth: 340 }}>
                <div style={{ textAlign: 'center', fontSize: 36, fontWeight: 900, color: C.gold, marginBottom: 12 }}>${guessValue}</div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={guessValue}
                  onChange={(e) => setGuessValue(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div onClick={submit} style={{ marginTop: 14, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `${C.green}20`, border: `2px solid ${C.green}45`, fontSize: 15, fontWeight: 900, color: C.green, touchAction: 'none' }}>
                  LOCK IN GUESS
                </div>
              </div>
            )}

            {isReveal && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: C.text2, marginBottom: 4 }}>Your guess: ${guessValue}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: lastAward >= 70 ? C.green : lastAward >= 40 ? C.gold : C.red }}>+{lastAward} pts</div>
              </div>
            )}
          </div>
        )}

        {isFinal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{totalPts >= 250 ? '🏆' : '💰'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: totalPts >= 250 ? C.green : C.gold, marginBottom: 6 }}>FINAL SCORE</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, marginBottom: 12 }}>{totalPts} pts</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
