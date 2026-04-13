import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

type Side = 'heads' | 'tails'
type Phase = 'intro' | 'betting' | 'puffing' | 'flipping' | 'result' | 'complete' | null

export const CoinFlipGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [choice, setChoice] = useState<Side | null>(null)
  const [result, setResult] = useState<Side | null>(null)
  const bet = 50
  const [puffConfidence, setPuffConfidence] = useState(1)
  const [streak, setStreak] = useState(0)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [puffing, setPuffing] = useState(false)
  const [comment, setComment] = useState('')

  const puffStartRef = useRef(0)
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const choiceRef = useRef<Side | null>(null)
  useEffect(() => { choiceRef.current = choice }, [choice])
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
      player.recordGameResult(scoreRef.current > 0, scoreRef.current > 0 ? 20 : 0, scoreRef.current > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
      return
    }
    setRound(next)
    setChoice(null)
    setResult(null)
    setPuffConfidence(1)
    setFlipping(false)
    setPhase('betting')
    setComment(`Round ${next + 1}/8 — Pick heads or tails!`)
  }, [audio, player, ble.bleConnected, game.gameActive])

  const nextRef = useRef(nextRound)
  useEffect(() => { nextRef.current = nextRound }, [nextRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    setChoice(null)
    setResult(null)
    setPuffConfidence(1)
    setStreak(0)
    setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setFlipping(false)
    setPuffing(false)
    setPhase('intro')
    setComment('Coin Flip! Pick heads or tails, then puff your confidence!')
    audio.playFx('crowd')
    addTimeout(() => setPhase('betting'), 1500)
  }, [audio])

  const pickSide = useCallback((side: Side) => {
    setChoice(side)
    audio.playFx('tap')
    setComment(`You picked ${side.toUpperCase()}! Now PUFF to set confidence. Longer = higher multiplier!`)
    setPhase('puffing')
  }, [audio])

  const handlePuff = useCallback(() => {
    if (phaseRef.current !== 'puffing' || !choiceRef.current) return
    setPuffing(true)
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffEnd = useCallback(() => {
    if (phaseRef.current !== 'puffing' || !puffStartRef.current) return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    setPuffing(false)
    let mult = 1
    let label = 'SAFE'
    if (dur >= 4.5) { mult = 5; label = 'BLINKER 5x' }
    else if (dur >= 3.5) { mult = 3; label = '3x' }
    else if (dur >= 2.0) { mult = 2; label = '2x' }
    else if (dur >= 0.5) { mult = 1.5; label = '1.5x' }
    setPuffConfidence(mult)
    setComment(`${label} confidence locked! Flipping...`)
    setFlipping(true)
    setPhase('flipping')
    audio.playFx('whistle')
    addTimeout(() => {
      const outcome: Side = Math.random() > 0.5 ? 'heads' : 'tails'
      setResult(outcome)
      setFlipping(false)
      audio.playFx('tap')
      const won = outcome === choiceRef.current
      if (won) {
        const winAmt = Math.floor(bet * mult)
        setScore(s => s + winAmt)
        setStreak(s => s + 1)
        player.spawnConfetti(25)
        audio.playFx('win')
        setComment(`WIN! ${outcome.toUpperCase()}! +${winAmt} coins${mult >= 3 ? ` (${mult}x!)` : ''}!`)
      } else {
        const loss = mult >= 5 ? bet * 2 : 0
        if (loss > 0) setScore(s => Math.max(0, s - loss))
        setStreak(0)
        audio.playFx('miss')
        setComment(`${outcome.toUpperCase()}! Wrong.${mult >= 5 ? ` Blinker penalty: -${loss}` : ''}`)
      }
      setPhase('result')
      addTimeout(() => nextRef.current(), 2500)
    }, 1500)
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
    if (game.gameActive?.id !== 'coinflip') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'coinflip') return
    ble.registerPuffHandlers('coinflip', () => handlePuff(), () => handlePuffEnd())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'coinflip') return null
  const isComplete = phase === 'complete'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🪙 COIN FLIP" titleColor="#F59E0B" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/8 · ${score}c · 🔥${streak}`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#2a1e08,#0a0800)' }}>
        {comment && (
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', fontSize: 9, color: C.gold, fontWeight: 700, maxWidth: '90%' }}>{comment}</div>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 40, gap: 16, justifyContent: 'center' }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: result === 'tails' ? 'radial-gradient(circle at 35% 35%, #fff8 0%, #F59E0B 30%, #92400e 100%)' : 'radial-gradient(circle at 35% 35%, #fff8 0%, #FCD34D 30%, #92400e 100%)',
            boxShadow: '0 0 40px #F59E0B70',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 64, animation: flipping ? 'pulse 0.15s infinite' : 'none',
          }}>
            {flipping ? '🪙' : result === 'heads' ? '👑' : result === 'tails' ? '🦅' : '🪙'}
          </div>

          {phase === 'betting' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div onClick={() => pickSide('heads')} style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: '#F59E0B20', border: '2px solid #F59E0B60', fontSize: 15, fontWeight: 900, color: '#F59E0B', touchAction: 'none' }}>👑 HEADS</div>
              <div onClick={() => pickSide('tails')} style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: '#FCD34D20', border: '2px solid #FCD34D60', fontSize: 15, fontWeight: 900, color: '#FCD34D', touchAction: 'none' }}>🦅 TAILS</div>
            </div>
          )}

          {phase === 'puffing' && choice && (
            <>
              <div style={{ fontSize: 11, color: C.text3, textAlign: 'center' }}>You picked <b style={{ color: C.gold }}>{choice.toUpperCase()}</b>. Longer puff = higher multiplier!</div>
              <div style={{ display: 'flex', gap: 6, fontSize: 8, color: C.text3, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>TAP=1x</span><span>0.5s=1.5x</span><span>2s=2x</span><span>3.5s=3x</span><span style={{ color: C.red }}>4.5s=5x BLINKER</span>
              </div>
              <div
                onMouseDown={(e) => { e.preventDefault(); handlePuff() }}
                onMouseUp={(e) => { e.preventDefault(); handlePuffEnd() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handlePuff() }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                style={{ padding: '16px 32px', borderRadius: 60, cursor: 'pointer', background: puffing ? '#F59E0B40' : '#F59E0B22', border: '2px solid #F59E0B80', fontSize: 14, fontWeight: 900, color: '#F59E0B', touchAction: 'none', userSelect: 'none' }}
              >
                {puffing ? '💨 HOLDING...' : '💨 HOLD TO LOCK CONFIDENCE'}
              </div>
            </>
          )}

          {(phase === 'flipping' || phase === 'result') && (
            <div style={{ textAlign: 'center' }}>
              {puffConfidence > 1 && <div style={{ fontSize: 11, color: C.gold, fontWeight: 800 }}>{puffConfidence}x multiplier</div>}
              {phase === 'result' && result && (
                <div style={{ fontSize: 20, fontWeight: 900, color: result === choice ? C.green : C.red, marginTop: 4 }}>
                  {result === choice ? '✓ WIN!' : '✗ LOSS'}
                </div>
              )}
            </div>
          )}
        </div>

        {isComplete && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🪙</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', marginBottom: 6 }}>FLIPS COMPLETE</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>Total: {score} coins</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: '#F59E0B15', border: '1px solid #F59E0B30', fontSize: 14, fontWeight: 800, color: '#F59E0B', touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
