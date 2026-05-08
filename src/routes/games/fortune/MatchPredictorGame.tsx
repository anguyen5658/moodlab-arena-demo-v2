import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

// Direct lift from monolith line 377
interface Match { id: string; home: string; away: string; time: string; pool: [number, number, number]; group: string }
const MP_MATCHES: Match[] = [
  { id: 'mp1', home: '🇧🇷 Brazil', away: '🇩🇪 Germany', time: '3:00 PM', pool: [65, 20, 15], group: 'F' },
  { id: 'mp2', home: '🇫🇷 France', away: '🇦🇷 Argentina', time: '9:00 PM', pool: [40, 25, 35], group: 'C' },
  { id: 'mp3', home: '🇺🇸 USA', away: '🇲🇽 Mexico', time: '6:00 PM', pool: [45, 30, 25], group: 'A' },
  { id: 'mp4', home: '🇪🇸 Spain', away: '🇳🇱 Netherlands', time: '12:00 PM', pool: [50, 28, 22], group: 'B' },
  { id: 'mp5', home: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', away: '🇵🇹 Portugal', time: '3:00 AM', pool: [38, 32, 30], group: 'D' },
  { id: 'mp6', home: '🇮🇹 Italy', away: '🇧🇪 Belgium', time: '6:00 AM', pool: [42, 30, 28], group: 'E' },
  { id: 'mp7', home: '🇯🇵 Japan', away: '🇰🇷 South Korea', time: '9:00 AM', pool: [35, 30, 35], group: 'G' },
  { id: 'mp8', home: '🇳🇬 Nigeria', away: '🇨🇲 Cameroon', time: '12:00 AM', pool: [40, 35, 25], group: 'H' },
]

type Pred = 'home' | 'draw' | 'away'
type Phase = 'intro' | 'match' | 'prediction' | 'result' | 'complete' | null

export const MatchPredictorGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [prediction, setPrediction] = useState<Pred | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [actualResult, setActualResult] = useState<Pred | null>(null)

  const usedRef = useRef<string[]>([])
  const puffStartRef = useRef(0)
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const matchRef = useRef<Match | null>(null)
  useEffect(() => { matchRef.current = match }, [match])
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
    if (next >= 5) {
      setPhase('complete')
      audio.playFx(scoreRef.current > 0 ? 'win' : 'lose')
      player.recordGameResult(scoreRef.current > 0, scoreRef.current > 0 ? 20 : 0, scoreRef.current > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'fortune', gameActive: game.gameActive })
      return
    }
    const shuffled = [...MP_MATCHES].sort(() => Math.random() - 0.5)
    const nextMatch = shuffled.find(m => !usedRef.current.includes(m.id)) || shuffled[0]
    usedRef.current = [...usedRef.current, nextMatch.id]
    setMatch(nextMatch)
    setPrediction(null)
    setActualResult(null)
    setRound(next)
    setPhase('match')
  }, [audio, player, ble.bleConnected, game.gameActive])

  const nextRef = useRef(nextRound)
  useEffect(() => { nextRef.current = nextRound }, [nextRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    const shuffled = [...MP_MATCHES].sort(() => Math.random() - 0.5)
    usedRef.current = [shuffled[0].id]
    setMatch(shuffled[0])
    setPrediction(null)
    setActualResult(null)
    setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => setPhase('match'), 1500)
  }, [audio])

  const handlePuff = useCallback(() => {
    if (phaseRef.current !== 'match') return
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffEnd = useCallback(() => {
    if (phaseRef.current !== 'match' || !puffStartRef.current) return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    const pred: Pred = dur < 1.0 ? 'home' : dur < 2.5 ? 'draw' : 'away'
    setPrediction(pred)
    setPhase('prediction')
    audio.playFx('whistle')
    addTimeout(() => {
      const m = matchRef.current
      if (!m) return
      const r = Math.random()
      const simResult: Pred = r < m.pool[0] / 100 ? 'home' : r < (m.pool[0] + m.pool[1]) / 100 ? 'draw' : 'away'
      const correct = simResult === pred
      setActualResult(simResult)
      setScore(s => s + (correct ? 100 : 0))
      if (correct) { player.spawnConfetti(30); audio.playFx('win') }
      else audio.playFx('miss')
      setPhase('result')
      addTimeout(() => nextRef.current(), 2500)
    }, 2000)
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
    if (game.gameActive?.id !== 'matchpredictor') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'matchpredictor') return
    ble.registerPuffHandlers('matchpredictor', () => handlePuff(), () => handlePuffEnd())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'matchpredictor') return null
  const isComplete = phase === 'complete'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="📊 MATCH PREDICTOR" titleColor="#3B82F6" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/5 · ${score}pts`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#0a1a3a,#050a14)' }}>
        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 60, gap: 10 }}>
            <div style={{ fontSize: 56 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#3B82F6' }}>MATCH PREDICTOR</div>
            <div style={{ fontSize: 11, color: C.text2 }}>Call the winner. Puff your prediction!</div>
          </div>
        )}

        {(phase === 'match' || phase === 'prediction' || phase === 'result') && match && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 24, paddingBottom: 60, gap: 14 }}>
            <div style={{ fontSize: 9, color: C.text3, letterSpacing: 2 }}>GROUP {match.group} · {match.time}</div>
            <div style={{ width: '100%', maxWidth: 340, padding: 18, borderRadius: 16, background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>{match.home}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>VS</div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>{match.away}</div>
              </div>
              <div style={{ display: 'flex', marginTop: 12, gap: 6, fontSize: 9 }}>
                <div style={{ flex: match.pool[0], padding: '4px 0', textAlign: 'center', borderRadius: 4, background: `${C.green}30`, color: C.green, fontWeight: 800 }}>{match.pool[0]}%</div>
                <div style={{ flex: match.pool[1], padding: '4px 0', textAlign: 'center', borderRadius: 4, background: `${C.gold}30`, color: C.gold, fontWeight: 800 }}>{match.pool[1]}%</div>
                <div style={{ flex: match.pool[2], padding: '4px 0', textAlign: 'center', borderRadius: 4, background: `${C.red}30`, color: C.red, fontWeight: 800 }}>{match.pool[2]}%</div>
              </div>
            </div>

            {phase === 'match' && (
              <>
                <div style={{ fontSize: 9, color: C.text3 }}>SHORT = HOME · MED = DRAW · LONG = AWAY</div>
                <div
                  onMouseDown={(e) => { e.preventDefault(); handlePuff() }}
                  onMouseUp={(e) => { e.preventDefault(); handlePuffEnd() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handlePuff() }}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                  onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                  style={{ padding: '14px 28px', borderRadius: 60, cursor: 'pointer', background: '#3B82F622', border: '2px solid #3B82F670', fontSize: 13, fontWeight: 900, color: '#3B82F6', touchAction: 'none', userSelect: 'none' }}
                >
                  💨 HOLD TO PREDICT
                </div>
              </>
            )}

            {(phase === 'prediction' || phase === 'result') && prediction && (
              <div style={{ padding: '12px 20px', borderRadius: 12, background: actualResult ? (actualResult === prediction ? `${C.green}20` : `${C.red}20`) : '#3B82F620', border: `2px solid ${actualResult ? (actualResult === prediction ? C.green : C.red) : '#3B82F6'}`, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.text3 }}>YOUR PICK</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{prediction === 'home' ? 'HOME WIN' : prediction === 'draw' ? 'DRAW' : 'AWAY WIN'}</div>
                {actualResult && (
                  <div style={{ marginTop: 6, fontSize: 11, color: actualResult === prediction ? C.green : C.red, fontWeight: 800 }}>
                    {actualResult === prediction ? '✓ CORRECT!' : `✗ Actual: ${actualResult.toUpperCase()}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#3B82F6', marginBottom: 6 }}>PREDICTIONS CLOSED</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>Score: {score}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: '#3B82F615', border: '1px solid #3B82F630', fontSize: 14, fontWeight: 800, color: '#3B82F6', touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
