import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

// Direct lift from monolith line 340
interface Prediction { q: string; cat: string; emoji: string }
const CB_PREDICTIONS: Prediction[] = [
  { q: 'Will Bitcoin hit $100K this month?', cat: 'crypto', emoji: '🪙' },
  { q: 'Will a new cannabis strain go viral on TikTok this week?', cat: 'cannabis', emoji: '🌿' },
  { q: 'Will Brazil win their next World Cup match?', cat: 'sports', emoji: '⚽' },
  { q: 'Will Snoop Dogg drop a surprise album this year?', cat: 'culture', emoji: '🎤' },
  { q: 'Will THC prices drop below $5/g in Colorado?', cat: 'cannabis', emoji: '💰' },
  { q: 'Will the next FIFA game outsell the last one?', cat: 'gaming', emoji: '🎮' },
  { q: 'Will a meme coin 10x this month?', cat: 'crypto', emoji: '🚀' },
  { q: 'Will indica outsell sativa this quarter?', cat: 'cannabis', emoji: '🌿' },
  { q: 'Will Argentina make it to the WC final?', cat: 'sports', emoji: '🇦🇷' },
  { q: 'Will AI replace more than 10% of jobs this year?', cat: 'culture', emoji: '🤖' },
  { q: 'Will edibles become legal in 3 more states?', cat: 'cannabis', emoji: '🍫' },
  { q: 'Will the next Super Bowl break viewership records?', cat: 'sports', emoji: '🏈' },
  { q: 'Will Drake drop a collab with a cannabis brand?', cat: 'culture', emoji: '🎵' },
  { q: 'Will Ethereum flip Bitcoin in market cap?', cat: 'crypto', emoji: '💎' },
  { q: 'Will the MLS become a top 5 global league?', cat: 'sports', emoji: '⚽' },
]

type Answer = 'no' | 'yes' | 'certain'
type Phase = 'intro' | 'question' | 'reveal' | 'result' | 'complete' | null

export const CrystalBallGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState<Prediction | null>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [puffing, setPuffing] = useState(false)

  const usedRef = useRef<string[]>([])
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

  const pickQuestion = useCallback((): Prediction => {
    let q: Prediction
    let attempts = 0
    do {
      q = CB_PREDICTIONS[Math.floor(Math.random() * CB_PREDICTIONS.length)]
      attempts++
    } while (usedRef.current.includes(q.q) && attempts < 30 && usedRef.current.length < CB_PREDICTIONS.length)
    usedRef.current = [...usedRef.current, q.q]
    return q
  }, [])

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 5) {
      setPhase('complete')
      audio.playFx(scoreRef.current > 0 ? 'win' : 'lose')
      player.recordGameResult(scoreRef.current > 0, scoreRef.current > 0 ? 20 : 0, scoreRef.current > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
      return
    }
    const q = pickQuestion()
    setQuestion(q)
    setAnswer(null)
    setResult(null)
    setRound(next)
    setPhase('question')
  }, [audio, player, ble.bleConnected, game.gameActive, pickQuestion])

  const nextRef = useRef(nextRound)
  useEffect(() => { nextRef.current = nextRound }, [nextRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    usedRef.current = []
    const q = pickQuestion()
    setQuestion(q)
    setAnswer(null)
    setResult(null)
    setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setStreak(0)
    setPuffing(false)
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => setPhase('question'), 1500)
  }, [audio, pickQuestion])

  const handlePuff = useCallback(() => {
    if (phaseRef.current !== 'question') return
    setPuffing(true)
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffEnd = useCallback(() => {
    if (!puffStartRef.current) return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    setPuffing(false)
    const ans: Answer = dur >= 3.0 ? 'certain' : dur >= 1.5 ? 'yes' : 'no'
    setAnswer(ans)
    setPhase('reveal')
    audio.playFx('whistle')
    addTimeout(() => {
      const correct = Math.random() > 0.45
      setResult(correct ? 'correct' : 'wrong')
      if (correct) {
        const pts = ans === 'certain' ? 150 : 50
        setScore(s => s + pts)
        setStreak(s => s + 1)
        player.spawnConfetti(30)
        audio.playFx('win')
      } else {
        const penalty = ans === 'certain' ? -100 : 0
        if (penalty) setScore(s => s + penalty)
        setStreak(0)
        audio.playFx('miss')
      }
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
    if (game.gameActive?.id !== 'crystalball') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'crystalball') return
    ble.registerPuffHandlers('crystalball', () => handlePuff(), () => handlePuffEnd())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'crystalball') return null
  const isComplete = phase === 'complete'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🔮 CRYSTAL BALL" titleColor="#9333EA" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/5 · ${score}pts · 🔥${streak}`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 40%,#2d1b4e,#0a0014)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingBottom: 60, gap: 14 }}>
          <div style={{
            width: 150, height: 150, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fff5 0%, #9333EA66 30%, #4c1d95 70%, #1e0a3a 100%)',
            boxShadow: '0 0 50px #9333EA80, inset 0 0 30px #fff2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 10,
            animation: phase === 'reveal' ? 'pulse 0.6s infinite' : 'none',
          }}>
            <div style={{ fontSize: 56, filter: 'drop-shadow(0 0 20px #A855F7)' }}>{question?.emoji || '🔮'}</div>
          </div>

          {phase === 'intro' && (
            <div style={{ fontSize: 12, color: '#A855F7', fontWeight: 900 }}>The Crystal Ball awaits your predictions...</div>
          )}

          {(phase === 'question' || phase === 'reveal' || phase === 'result') && question && (
            <>
              <div style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(147,51,234,0.12)', border: '1px solid #9333EA30', maxWidth: 340, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#A855F7', letterSpacing: 2, marginBottom: 4 }}>{question.cat.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{question.q}</div>
              </div>

              {phase === 'question' && (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', fontSize: 9, color: C.text3 }}>
                    <span>TAP/SHORT = NO</span>
                    <span>MED = YES</span>
                    <span style={{ color: C.gold }}>LONG (3s+) = CERTAIN 3x</span>
                  </div>
                  <div
                    onMouseDown={(e) => { e.preventDefault(); handlePuff() }}
                    onMouseUp={(e) => { e.preventDefault(); handlePuffEnd() }}
                    onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handlePuff() }}
                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                    onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                    style={{ padding: '16px 30px', borderRadius: 60, cursor: 'pointer', background: puffing ? '#A855F738' : '#9333EA22', border: '2px solid #A855F770', fontSize: 14, fontWeight: 900, color: '#A855F7', touchAction: 'none', userSelect: 'none' }}
                  >
                    {puffing ? '💨 HOLDING...' : '💨 HOLD TO PREDICT'}
                  </div>
                </>
              )}

              {(phase === 'reveal' || phase === 'result') && answer && (
                <div style={{ padding: '14px 24px', borderRadius: 14, background: result === 'correct' ? `${C.green}20` : result === 'wrong' ? `${C.red}20` : '#9333EA20', border: `2px solid ${result === 'correct' ? C.green : result === 'wrong' ? C.red : '#9333EA'}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: answer === 'certain' ? C.gold : answer === 'yes' ? C.green : C.red, marginBottom: 4 }}>
                    {answer === 'certain' ? '⚡ CERTAIN ⚡' : answer === 'yes' ? 'YES' : 'NO'}
                  </div>
                  {result && (
                    <div style={{ fontSize: 11, color: result === 'correct' ? C.green : C.red, fontWeight: 800 }}>
                      {result === 'correct' ? '✓ The vision was TRUE!' : '✗ The vision was FALSE'}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {isComplete && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🔮</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#A855F7', marginBottom: 6 }}>ORACLE COMPLETE</div>
              <div style={{ fontSize: 14, color: C.text2, marginBottom: 4 }}>Final score: {score}</div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 12 }}>Best streak: {streak}</div>
              <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: '#9333EA15', border: '1px solid #9333EA30', fontSize: 14, fontWeight: 800, color: '#A855F7', touchAction: 'none' }}>Collect</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
