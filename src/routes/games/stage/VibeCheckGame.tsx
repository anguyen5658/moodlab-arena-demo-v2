import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

// Direct lift from monolith line 406
interface VcQuestion { q: string; opts: string[]; correct: number; cat: string }
const VC_QUESTIONS_V2: VcQuestion[] = [
  { q: 'Which country has won the most FIFA World Cups?', opts: ['Germany', 'Argentina', 'Brazil', 'France'], correct: 2, cat: 'Football' },
  { q: 'What year was the first World Cup held?', opts: ['1928', '1930', '1934', '1926'], correct: 1, cat: 'History' },
  { q: 'Which stadium hosted the 2014 World Cup Final?', opts: ['Wembley', 'Azteca', 'Maracana', 'Lusail'], correct: 2, cat: 'Stadiums' },
  { q: 'Who scored the fastest World Cup hat-trick?', opts: ['Mbappe', 'Haaland', 'Batistuta', 'Muller'], correct: 2, cat: 'Records' },
  { q: 'How many teams play in the 2026 World Cup?', opts: ['32', '40', '48', '64'], correct: 2, cat: 'WC 2026' },
  { q: 'Which host city is furthest north in WC 2026?', opts: ['Seattle', 'Vancouver', 'Toronto', 'Boston'], correct: 1, cat: 'WC 2026' },
  { q: 'What is the most goals scored in a single WC match?', opts: ['10', '12', '14', '16'], correct: 1, cat: 'Records' },
  { q: 'Which country has appeared in every World Cup?', opts: ['Germany', 'Argentina', 'Italy', 'Brazil'], correct: 3, cat: 'Football' },
]

type Phase = 'intro' | 'question' | 'reveal' | 'result' | null

export const VibeCheckGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [players, setPlayers] = useState(48)
  const [answered, setAnswered] = useState(false)
  const [puffAnswer, setPuffAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [eliminated, setEliminated] = useState(false)
  const [timer, setTimer] = useState(10)

  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const answeredRef = useRef(false)
  useEffect(() => { answeredRef.current = answered }, [answered])
  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const puffStartRef = useRef<number | null>(null)

  const clearTimeouts = () => { timeoutsRef.current.forEach(t => clearTimeout(t)); timeoutsRef.current = [] }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const startRound = useCallback((rn: number) => {
    setRound(rn)
    setAnswered(false)
    setPuffAnswer(null)
    setPhase('question')
    setTimer(10)
    if (timerRef.current) clearInterval(timerRef.current)
    let t = 10
    timerRef.current = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        if (!answeredRef.current) revealRef.current(-1)
      }
    }, 1000)
  }, [])

  const reveal = useCallback((selected: number) => {
    if (answeredRef.current) return
    setAnswered(true)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const q = VC_QUESTIONS_V2[roundRef.current]
    const isCorrect = selected === q.correct
    setPhase('reveal')
    if (isCorrect) {
      const pts = 100 + streak * 20
      setScore(s => s + pts)
      setStreak(s => s + 1)
      audio.playFx('select')
      player.notify(`CORRECT! +${pts}`, C.green)
    } else {
      setStreak(0)
      if (selected !== -1) {
        setEliminated(true)
        audio.playFx('miss')
      }
    }
    // Eliminate audience ~20% each round
    setPlayers(p => Math.max(3, Math.floor(p * (0.72 + Math.random() * 0.12))))
    addTimeout(() => {
      const nr = roundRef.current + 1
      if (nr >= VC_QUESTIONS_V2.length || !isCorrect) {
        setPhase('result')
        const won = isCorrect && score + (isCorrect ? 100 : 0) > 0
        player.recordGameResult(won, won ? 50 : 10, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
        audio.playFx(won ? 'win' : 'lose')
      } else {
        startRound(nr)
      }
    }, 2200)
  }, [streak, score, audio, player, ble.bleConnected, game.gameActive, startRound])

  const revealRef = useRef(reveal)
  useEffect(() => { revealRef.current = reveal }, [reveal])

  const selectAnswer = useCallback((idx: number) => {
    if (answeredRef.current) return
    setPuffAnswer(idx)
    addTimeout(() => revealRef.current(idx), 150)
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    setRound(0)
    setPlayers(48)
    setScore(0)
    setStreak(0)
    setEliminated(false)
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => startRound(0), 1400)
  }, [audio, startRound])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    clearTimeouts()
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => exitGame(), [exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'vibecheck') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'vibecheck') return
    const puffDown = () => { if (answeredRef.current) return; puffStartRef.current = Date.now(); setPuffAnswer(0) }
    const puffUp = () => {
      if (!puffStartRef.current || answeredRef.current) { puffStartRef.current = null; setPuffAnswer(null); return }
      const dur = Date.now() - puffStartRef.current
      puffStartRef.current = null
      const idx = dur < 500 ? 0 : dur < 1500 ? 1 : dur < 3000 ? 2 : 3
      selectAnswer(idx)
    }
    ble.registerPuffHandlers('vibecheck', puffDown, puffUp)
    return () => {
      audio.gameSoundsMuted.current = true
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'vibecheck') return null
  const isResult = phase === 'result'
  const q = VC_QUESTIONS_V2[round]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🧠 VIBE CHECK"
        titleColor={C.gold}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round + 1}/${VC_QUESTIONS_V2.length} · ${score}pts · 🔥${streak}${phase === 'question' ? ` · ⏱${timer}s` : ''}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#2a1f08,#0a0a1a)' }}>
        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }}>
            <div style={{ fontSize: 56 }}>🧠</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>VIBE CHECK</div>
            <div style={{ fontSize: 11, color: C.text2 }}>{players} contestants · 8 questions · survive to win</div>
          </div>
        )}

        {(phase === 'question' || phase === 'reveal') && q && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 18, gap: 12 }}>
            <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, background: `${C.purple}15`, fontSize: 8, fontWeight: 800, color: C.purple, letterSpacing: 1 }}>{q.cat.toUpperCase()}</div>
            <div style={{ width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, background: `${C.gold}12`, border: `2px solid ${C.gold}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{q.q}</div>
            </div>
            {phase === 'question' && (
              <div style={{ width: '100%', maxWidth: 360, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${(timer / 10) * 100}%`, height: '100%', background: timer > 5 ? C.green : timer > 2 ? C.gold : C.red, transition: 'width 0.5s linear' }} />
              </div>
            )}
            <div style={{ width: '100%', maxWidth: 360, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {q.opts.map((opt, i) => {
                const isPicked = puffAnswer === i
                const isCorrect = phase === 'reveal' && i === q.correct
                const isWrongPick = phase === 'reveal' && isPicked && i !== q.correct
                const colors = [C.cyan, C.gold, C.green, C.pink]
                const bg = isCorrect ? `${C.green}25` : isWrongPick ? `${C.red}25` : isPicked ? `${colors[i]}28` : `${colors[i]}10`
                const border = isCorrect ? C.green : isWrongPick ? C.red : colors[i]
                return (
                  <div key={i} onClick={() => selectAnswer(i)} style={{ padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: bg, border: `2px solid ${border}50`, fontSize: 12, fontWeight: 800, color: '#fff', touchAction: 'none', transform: isPicked ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.15s' }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 9, color: C.text3, textAlign: 'center' }}>💨 Puff duration = answer · TAP=A SHORT=B MED=C LONG=D</div>
          </div>
        )}

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.9)', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{eliminated ? '💀' : score >= 400 ? '🏆' : '🧠'}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: eliminated ? C.red : score >= 400 ? C.green : C.gold, marginBottom: 6 }}>{eliminated ? 'ELIMINATED' : score >= 400 ? 'VIBE KING!' : 'SHOW OVER'}</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 12 }}>Best streak: {streak}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
