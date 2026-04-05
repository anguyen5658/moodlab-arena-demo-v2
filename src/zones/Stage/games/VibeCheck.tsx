import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'question' | 'reveal' | 'result'

interface Question { q: string; opts: string[]; correct: number; cat: string }

const VC_QUESTIONS: Question[] = [
  { q: 'Which country has won the most FIFA World Cups?', opts: ['Germany', 'Argentina', 'Brazil', 'France'], correct: 2, cat: 'Football' },
  { q: 'What year was the first World Cup held?', opts: ['1928', '1930', '1934', '1926'], correct: 1, cat: 'History' },
  { q: 'Which stadium hosted the 2014 World Cup Final?', opts: ['Wembley', 'Azteca', 'Maracana', 'Lusail'], correct: 2, cat: 'Stadiums' },
  { q: 'How many teams play in the 2026 World Cup?', opts: ['32', '40', '48', '64'], correct: 2, cat: 'WC 2026' },
  { q: 'Which country has appeared in every World Cup?', opts: ['Germany', 'Argentina', 'Italy', 'Brazil'], correct: 3, cat: 'Football' },
  { q: 'What is the most goals scored in a single WC match?', opts: ['10', '12', '14', '16'], correct: 1, cat: 'Records' },
  { q: 'Which host city is furthest north in WC 2026?', opts: ['Seattle', 'Vancouver', 'Toronto', 'Boston'], correct: 1, cat: 'WC 2026' },
  { q: 'Who scored the fastest World Cup hat-trick?', opts: ['Mbappe', 'Haaland', 'Batistuta', 'Muller'], correct: 2, cat: 'Records' },
]

const OPT_COLORS = [C.cyan, C.gold, C.green, C.pink]
const PUFF_ANSWER = (ms: number) => ms < 800 ? 0 : ms < 2000 ? 1 : ms < 3500 ? 2 : 3

export default function VibeCheck() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(15)
  const [answered, setAnswered] = useState(false)
  const [eliminated, setEliminated] = useState(false)
  const [puffAnswer, setPuffAnswer] = useState<number | null>(null)
  const [players, setPlayers] = useState(100)
  const [streak, setStreak] = useState(0)
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<Phase>(null)
  const answeredRef = useRef(false)
  const eliminatedRef = useRef(false)
  const roundRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStartRef = useRef<number | null>(null)
  const puffHighlightRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const timerValueRef = useRef(15)
  const streakRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { answeredRef.current = answered }, [answered])
  useEffect(() => { eliminatedRef.current = eliminated }, [eliminated])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { timerValueRef.current = timer }, [timer])
  useEffect(() => { streakRef.current = streak }, [streak])

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (puffHighlightRef.current) { clearInterval(puffHighlightRef.current); puffHighlightRef.current = null }
  }, [])

  const answerQuestion = useCallback((ansIdx: number) => {
    if (answeredRef.current) return
    if (eliminatedRef.current && ansIdx !== -1) return
    clearTimers()
    setAnswered(true); answeredRef.current = true
    setPuffAnswer(ansIdx)
    const q = VC_QUESTIONS[roundRef.current]
    const isCorrect = ansIdx === q.correct
    if (isCorrect) {
      const pts = 100 + timerValueRef.current * 10
      setScore(s => { const ns = s + pts; scoreRef.current = ns; return ns })
      setStreak(s => { const ns = s + 1; streakRef.current = ns; return ns })
      setCommentary(`✅ CORRECT! +${pts} pts`)
      playFx('crowd')
    } else {
      setStreak(0); streakRef.current = 0
      if (!eliminatedRef.current) { setEliminated(true); eliminatedRef.current = true }
      setCommentary(ansIdx === -1 ? '⏰ Time up! Eliminated!' : '❌ Wrong answer! Eliminated!')
      playFx('lose')
    }
    setTimeout(() => {
      setPhase('reveal'); phaseRef.current = 'reveal'
      setPlayers(p => Math.max(3, p - Math.floor(Math.random() * 15) - 5))
    }, 500)
  }, [playFx, clearTimers])

  useEffect(() => {
    if (phase === 'question' && !answered) {
      setTimer(15); timerValueRef.current = 15
      timerRef.current = setInterval(() => {
        setTimer(t => {
          const next = t - 1
          timerValueRef.current = next
          if (next <= 0) {
            clearInterval(timerRef.current!); timerRef.current = null
            setTimeout(() => answerQuestion(-1), 100)
            return 0
          }
          if (next <= 4) playFx('tap')
          return next
        })
      }, 1000)
      return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
    }
  }, [phase, answered, answerQuestion, playFx])

  const handlePuffDown = useCallback(() => {
    if (answeredRef.current || phaseRef.current !== 'question') return
    puffStartRef.current = Date.now()
    setPuffAnswer(0)
    puffHighlightRef.current = setInterval(() => {
      if (!puffStartRef.current) return
      setPuffAnswer(PUFF_ANSWER(Date.now() - puffStartRef.current))
    }, 100)
  }, [])

  const handlePuffUp = useCallback(() => {
    if (puffHighlightRef.current) { clearInterval(puffHighlightRef.current); puffHighlightRef.current = null }
    if (!puffStartRef.current || answeredRef.current) { puffStartRef.current = null; setPuffAnswer(null); return }
    const ans = PUFF_ANSWER(Date.now() - puffStartRef.current)
    puffStartRef.current = null; setPuffAnswer(null)
    answerQuestion(ans)
  }, [answerQuestion])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    clearTimers()
    setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setTimer(15); timerValueRef.current = 15
    setAnswered(false); answeredRef.current = false
    setEliminated(false); eliminatedRef.current = false
    setPuffAnswer(null); setPlayers(100); setStreak(0); streakRef.current = 0
    setCommentary('')
    setPhase('intro'); phaseRef.current = 'intro'
    playFx('crowd')
    setTimeout(() => { setPhase('question'); phaseRef.current = 'question'; setAnswered(false); answeredRef.current = false }, 2500)
  }, [playFx, clearTimers])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= VC_QUESTIONS.length || players <= 3 || eliminatedRef.current) {
      setPhase('result'); phaseRef.current = 'result'
      awardGame({ won: !eliminatedRef.current, baseCoins: scoreRef.current > 0 ? 50 : 8, baseXP: scoreRef.current > 0 ? 20 : 8 })
      return
    }
    setRound(next); roundRef.current = next
    setAnswered(false); answeredRef.current = false
    setPuffAnswer(null)
    setPhase('question'); phaseRef.current = 'question'
  }, [players, awardGame])

  const q = VC_QUESTIONS[round] || VC_QUESTIONS[0]
  const isQuestion = phase === 'question'
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0618 0%, #120830 40%, #080614 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.1), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 16px 20px', gap: 12, maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.gold}, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🧠 VIBE CHECK</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>PTS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.purple }}>{round + 1}/{VC_QUESTIONS.length}</div><div style={{ fontSize: 8, color: C.text3 }}>Q</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>{players}</div><div style={{ fontSize: 8, color: C.text3 }}>PLAYERS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: streak > 2 ? C.red : C.text2 }}>{streak}🔥</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>VIBE CHECK</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 8 }}>Puff duration = Answer choice!</div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>TAP=A · SHORT=B · MED=C · LONG=D</div>
          </div>
        )}

        {(isQuestion || isReveal) && (
          <div style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
            {isQuestion && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 8, color: C.purple, fontWeight: 700 }}>{q.cat}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: timer <= 4 ? C.red : C.gold, animation: timer <= 4 ? 'pulse 0.5s infinite' : undefined }}>{timer}s ⏰</span>
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>{q.q}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.opts.map((opt, i) => {
                const isSel = puffAnswer === i && !answered
                const isCorrect = isReveal && i === q.correct
                const isWrong = isReveal && answered && puffAnswer === i && i !== q.correct
                return (
                  <div
                    key={i}
                    data-btn="true"
                    onClick={() => { if (!answered && isQuestion) answerQuestion(i) }}
                    style={{ padding: '10px 14px', borderRadius: 10, cursor: answered ? 'default' : 'pointer', background: isCorrect ? `${C.green}20` : isWrong ? `${C.red}20` : isSel ? `${OPT_COLORS[i]}25` : `${OPT_COLORS[i]}06`, border: `1.5px solid ${isCorrect ? C.green : isWrong ? C.red : isSel ? OPT_COLORS[i] + '80' : OPT_COLORS[i] + '20'}`, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s', transform: isSel ? 'scale(1.02)' : undefined }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: OPT_COLORS[i] }}>{['A', 'B', 'C', 'D'][i]}</span>
                    <span style={{ fontSize: 11, color: C.text, flex: 1 }}>{opt}</span>
                    {isCorrect && <span style={{ fontSize: 14 }}>✅</span>}
                    {isWrong && <span style={{ fontSize: 14 }}>❌</span>}
                  </div>
                )
              })}
            </div>
            {isQuestion && !answered && (
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, color: C.text3 }}>
                TAP=A · SHORT=B · MED=C · LONG=D
              </div>
            )}
          </div>
        )}

        {isReveal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            {eliminated ? (
              <div style={{ fontSize: 13, color: C.red, fontWeight: 700 }}>💀 Eliminated at Q{round + 1}</div>
            ) : (
              <div style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>✅ Correct! Streak: {streak} 🔥</div>
            )}
            <div
              data-btn="true"
              onClick={() => nextRound()}
              style={{ marginTop: 10, padding: '10px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 13, fontWeight: 800, color: C.purple }}
            >
              {round + 1 >= VC_QUESTIONS.length || players <= 3 || eliminated ? 'See Results' : 'Next Question →'}
            </div>
          </div>
        )}

        {isResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease', width: '100%' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{eliminated ? '👻' : '🏆'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: eliminated ? C.text2 : C.gold, marginBottom: 6 }}>
              {eliminated ? 'GAME OVER' : 'CHAMPION!'}
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>{eliminated ? `Eliminated at Q${round + 1}` : `Survived ${round + 1} rounds!`}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, marginBottom: 12 }}>Score: {score}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 13, fontWeight: 800, color: C.purple }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{commentary}</div>
      </div>
    </div>
  )
}
