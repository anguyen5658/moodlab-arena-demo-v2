import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

// Direct lift from monolith line 11299
const SLOTS_SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🌿']
const SLOTS_PAYOUTS: Record<string, number> = { '🍒': 50, '🍋': 75, '🔔': 100, '💎': 200, '7️⃣': 500, '🌿': 1000 }

type Phase = 'intro' | 'ready' | 'spinning' | 'result' | 'complete' | null

interface HistoryEntry { reels: string[]; win: number; bonus: boolean }

export const PuffSlotsGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [reels, setReels] = useState<string[]>(['🍒', '🍒', '🍒'])
  const [spinning, setSpinning] = useState(false)
  const [win, setWin] = useState(0)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [bonus, setBonus] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [comment, setComment] = useState('')

  const puffStartRef = useRef(0)
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])
  const scoreRef = useRef(0)
  useEffect(() => { scoreRef.current = score }, [score])

  const clearTimeouts = () => { timeoutsRef.current.forEach(t => clearTimeout(t)); timeoutsRef.current = [] }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 8) {
      setPhase('complete')
      audio.playFx(scoreRef.current > 0 ? 'win' : 'lose')
      player.recordGameResult(scoreRef.current > 0, scoreRef.current > 0 ? 20 : 0, scoreRef.current > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'fortune', gameActive: game.gameActive })
      return
    }
    setRound(next)
    setWin(0)
    setBonus(false)
    setPhase('ready')
    setComment(`Spin ${next + 1}/8 — HOLD to puff!`)
  }, [audio, player, ble.bleConnected, game.gameActive])

  const nextRef = useRef(nextRound)
  useEffect(() => { nextRef.current = nextRound }, [nextRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    setReels(['🍒', '🍒', '🍒'])
    setSpinning(false)
    setWin(0)
    setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setBonus(false)
    setHistory([])
    setPhase('intro')
    setComment('Welcome to Puff Slots! Hold to spin!')
    audio.playFx('crowd')
    addTimeout(() => setPhase('ready'), 1500)
  }, [audio])

  const handlePuff = useCallback(() => {
    if (phaseRef.current !== 'ready') return
    setSpinning(true)
    puffStartRef.current = Date.now()
    setPhase('spinning')
    audio.playFx('whistle')
    setComment('Reels are spinning...')
  }, [audio])

  const handlePuffEnd = useCallback(() => {
    if (!puffStartRef.current) return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    setSpinning(false)
    const isBonus = dur >= 4.5
    setBonus(isBonus)
    const pickSym = () => SLOTS_SYMBOLS[Math.floor(Math.random() * SLOTS_SYMBOLS.length)]
    let r1: string, r2: string, r3: string
    if (isBonus) {
      r1 = pickSym()
      r2 = r1
      r3 = Math.random() > 0.5 ? r1 : pickSym()
      setComment('BLINKER BONUS! 2x multiplier active!')
    } else {
      r1 = pickSym(); r2 = pickSym(); r3 = pickSym()
    }
    const finalReels = [r1, r2, r3]
    setReels(['❓', '❓', '❓'])
    audio.playFx('tap')
    addTimeout(() => { setReels([r1, '❓', '❓']); audio.playFx('tap') }, 400)
    addTimeout(() => { setReels([r1, r2, '❓']); audio.playFx('tap') }, 800)
    addTimeout(() => {
      setReels(finalReels)
      audio.playFx('tap')
      let w = 0
      if (r1 === r2 && r2 === r3) {
        w = SLOTS_PAYOUTS[r1] || 50
        if (isBonus) w *= 2
        player.spawnConfetti(40)
        audio.playFx('win')
        setComment(r1 === '🌿' ? 'JACKPOT! 🌿🌿🌿 CANNABIS JACKPOT!!!' : r1 === '7️⃣' ? 'TRIPLE SEVENS! MASSIVE WIN!' : `WINNER! ${r1}${r1}${r1} pays out ${w}!`)
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        w = 10
        if (isBonus) w *= 2
        setComment(`Two matching! Small win: +${w}`)
      } else {
        setComment('No match. Try again!')
      }
      setWin(w)
      setScore(s => s + w)
      setHistory(h => [...h, { reels: finalReels, win: w, bonus: isBonus }])
      setPhase('result')
      addTimeout(() => nextRef.current(), 2500)
    }, 1200)
  }, [audio, player])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    clearTimeouts()
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => exitGame(), [exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'puffslots') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'puffslots') return
    ble.registerPuffHandlers('puffslots', () => handlePuff(), () => handlePuffEnd())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'puffslots') return null
  const isComplete = phase === 'complete'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🎰 PUFF SLOTS" titleColor="#FFD700" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/8 · ${score}c`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#3a2a0a,#0a0800)' }}>
        {comment && (
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', fontSize: 9, color: C.gold, fontWeight: 700 }}>{comment}</div>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 40, paddingBottom: 60, gap: 18, justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 10, padding: '18px 16px', borderRadius: 16, background: bonus ? 'rgba(255,107,157,0.1)' : 'rgba(255,215,0,0.08)', border: `3px solid ${bonus ? '#FF6B9D' : '#FFD700'}`, boxShadow: `0 0 30px ${bonus ? '#FF6B9D' : '#FFD700'}40` }}>
            {reels.map((r, i) => (
              <div key={i} style={{ width: 70, height: 88, borderRadius: 10, background: '#1a1408', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, border: `2px solid ${bonus ? '#FF6B9D80' : '#FFD70080'}`, animation: spinning ? 'pulse 0.2s infinite' : 'none' }}>
                {r}
              </div>
            ))}
          </div>

          {/* Paytable */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 340 }}>
            {SLOTS_SYMBOLS.map(s => (
              <div key={s} style={{ fontSize: 8, color: C.text3, padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }}>{s}{s}{s} = {SLOTS_PAYOUTS[s]}</div>
            ))}
          </div>

          {phase === 'ready' && (
            <div
              onMouseDown={(e) => { e.preventDefault(); handlePuff() }}
              onMouseUp={(e) => { e.preventDefault(); handlePuffEnd() }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handlePuff() }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
              onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
              style={{ padding: '16px 36px', borderRadius: 60, cursor: 'pointer', background: '#FFD70022', border: '2px solid #FFD70070', fontSize: 14, fontWeight: 900, color: '#FFD700', touchAction: 'none', userSelect: 'none' }}
            >
              💨 HOLD TO SPIN (4.5s = BONUS)
            </div>
          )}
          {phase === 'spinning' && <div style={{ fontSize: 12, color: C.gold, fontWeight: 900 }}>Release for result...</div>}
          {phase === 'result' && win > 0 && <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>+{win} WIN! 🎉</div>}
        </div>

        {isComplete && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎰</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 6 }}>SLOTS COMPLETE</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 4 }}>Total won: {score}</div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 12 }}>{history.filter(h => h.win > 0).length}/8 wins</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
