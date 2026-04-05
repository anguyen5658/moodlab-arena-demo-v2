import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = 'intro' | 'question' | 'reveal' | 'winner' | 'eliminated'

interface Question { text: string; answers: string[]; correctIdx: number }

const ST_QUESTIONS = [
  { q: 'What color is cannabis?', a: ['Green', 'Blue', 'Red', 'Yellow'], c: 0 },
  { q: 'What does CBD stand for?', a: ['Cannabidiol', 'Carbon Dioxide', 'Chill Buzz Drug', 'Cool Bud Drop'], c: 0 },
  { q: 'What is a blinker?', a: ['Max-length puff', 'A car signal', 'Eye twitch', 'Short puff'], c: 0 },
  { q: 'What year was cannabis first legalized in a US state?', a: ['2012', '2000', '2016', '1995'], c: 0 },
  { q: 'Which US state legalized recreational cannabis first?', a: ['Colorado', 'California', 'Oregon', 'Alaska'], c: 0 },
  { q: 'What does 420 refer to in cannabis culture?', a: ['April 20th', '4:20 PM break', 'Police code', 'A strain name'], c: 0 },
  { q: 'Which terpene smells like citrus?', a: ['Limonene', 'Myrcene', 'Pinene', 'Linalool'], c: 0 },
  { q: 'Indica is known for making you feel...?', a: ['Relaxed', 'Energized', 'Focused', 'Anxious'], c: 0 },
  { q: 'Which cannabinoid is non-psychoactive?', a: ['CBD', 'THC', 'THCV', 'Delta-8'], c: 0 },
  { q: 'What is a dab rig used for?', a: ['Concentrates', 'Flower', 'Edibles', 'Topicals'], c: 0 },
  { q: 'What terpene gives cannabis its piney smell?', a: ['Pinene', 'Myrcene', 'Caryophyllene', 'Terpinolene'], c: 0 },
  { q: 'What is the entourage effect?', a: ['Compounds working together', 'VIP treatment', 'Crowd high', 'Tolerance buildup'], c: 0 },
]

const PUFF_ANSWER = (ms: number) => ms < 800 ? 0 : ms < 2000 ? 1 : ms < 3500 ? 2 : 3
const OPT_COLORS = [C.cyan, C.gold, C.green, C.pink]
const PICK = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export default function SurvivalTrivia() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [question, setQuestion] = useState<Question | null>(null)
  const [round, setRound] = useState(0)
  const [players, setPlayers] = useState(100)
  const [streak, setStreak] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [timer, setTimer] = useState(15)
  const [puffAnswer, setPuffAnswer] = useState<number | null>(null)
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<Phase>('intro')
  const answerRef = useRef<number | null>(null)
  const roundRef = useRef(0)
  const playersRef = useRef(100)
  const streakRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStartRef = useRef<number | null>(null)
  const puffHighlightRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerValueRef = useRef(15)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { answerRef.current = answer }, [answer])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { streakRef.current = streak }, [streak])
  useEffect(() => { timerValueRef.current = timer }, [timer])

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (puffHighlightRef.current) { clearInterval(puffHighlightRef.current); puffHighlightRef.current = null }
  }, [])

  const nextQuestion = useCallback((roundNum: number, pl: number) => {
    if (pl <= 1 || roundNum >= ST_QUESTIONS.length) {
      setPhase('winner'); phaseRef.current = 'winner'
      setCommentary('WINNER! You survived all rounds! 🏆')
      playFx('crowd')
      awardGame({ won: true, baseCoins: 50, baseXP: 20 })
      return
    }
    const rawQ = ST_QUESTIONS[roundNum % ST_QUESTIONS.length]
    const indices = [0, 1, 2, 3]
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const shuffled = indices.map(i => rawQ.a[i])
    const correctIdx = indices.indexOf(rawQ.c)
    const q: Question = { text: rawQ.q, answers: shuffled, correctIdx }
    setQuestion(q)
    setAnswer(null); answerRef.current = null
    setPuffAnswer(null)
    setRound(roundNum + 1); roundRef.current = roundNum + 1
    const timerDur = pl <= 3 ? 12 : 15
    setTimer(timerDur); timerValueRef.current = timerDur
    setPhase('question'); phaseRef.current = 'question'
    setCommentary(`${pl} players left! Round ${roundNum + 1}`)
  }, [playFx, awardGame])

  const answerQuestion = useCallback((ansIdx: number, q: Question | null) => {
    if (answerRef.current !== null || phaseRef.current !== 'question') return
    clearTimers()
    setAnswer(ansIdx); answerRef.current = ansIdx
    setPuffAnswer(null)
    const currentQ = q
    if (!currentQ) return
    const isCorrect = ansIdx === currentQ.correctIdx

    if (isCorrect) {
      const ns = streakRef.current + 1
      setStreak(ns); streakRef.current = ns
      setCommentary(PICK(['CORRECT! You live to puff another round!', 'RIGHT! Your cannabis IQ is showing', 'SURVIVED! The reaper passes you by... this time']))
      playFx('crowd')
      setTimeout(() => {
        const dropAmt = Math.floor(Math.random() * 20) + 10
        const newPlayers = Math.max(1, playersRef.current - dropAmt)
        setPlayers(newPlayers); playersRef.current = newPlayers
        setPhase('reveal'); phaseRef.current = 'reveal'
        setTimeout(() => nextQuestion(roundRef.current, newPlayers), 2000)
      }, 500)
    } else {
      setCommentary(PICK(['ELIMINATED! Wrong answer = instant death!', 'DEAD! The grim reaper puffs on your soul', 'RIP! Pack it up, you\'re done']))
      playFx('lose')
      setTimeout(() => {
        setPhase('eliminated'); phaseRef.current = 'eliminated'
        awardGame({ won: false, baseCoins: streakRef.current > 0 ? 20 : 0, baseXP: 8 })
      }, 800)
    }
  }, [playFx, awardGame, clearTimers, nextQuestion])

  useEffect(() => {
    if (phase === 'question' && answer === null) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          const next = t - 1
          timerValueRef.current = next
          if (next <= 0) {
            clearInterval(timerRef.current!); timerRef.current = null
            setTimeout(() => answerQuestion(-1, question), 100)
            return 0
          }
          if (next <= 4) playFx('tap')
          return next
        })
      }, 1000)
      return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
    }
  }, [phase, answer, question, answerQuestion, playFx])

  const handlePuffDown = useCallback(() => {
    if (answerRef.current !== null || phaseRef.current !== 'question') return
    puffStartRef.current = Date.now()
    setPuffAnswer(0)
    puffHighlightRef.current = setInterval(() => {
      if (!puffStartRef.current) return
      setPuffAnswer(PUFF_ANSWER(Date.now() - puffStartRef.current))
    }, 100)
  }, [])

  const handlePuffUp = useCallback(() => {
    if (puffHighlightRef.current) { clearInterval(puffHighlightRef.current); puffHighlightRef.current = null }
    if (!puffStartRef.current || answerRef.current !== null) { puffStartRef.current = null; setPuffAnswer(null); return }
    const ans = PUFF_ANSWER(Date.now() - puffStartRef.current)
    puffStartRef.current = null; setPuffAnswer(null)
    answerQuestion(ans, question)
  }, [answerQuestion, question])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    clearTimers()
    setRound(0); roundRef.current = 0
    setPlayers(100); playersRef.current = 100
    setStreak(0); streakRef.current = 0
    setAnswer(null); answerRef.current = null
    setPuffAnswer(null); setQuestion(null)
    setPhase('intro'); phaseRef.current = 'intro'
    playFx('crowd')
    setCommentary('100 players enter... only 1 survives!')
    setTimeout(() => nextQuestion(0, 100), 2000)
  }, [playFx, clearTimers, nextQuestion])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isQuestion = phase === 'question'
  const isReveal = phase === 'reveal'
  const isWinner = phase === 'winner'
  const isEliminated = phase === 'eliminated'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0418 0%, #14062e 40%, #0a0418 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.1), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 16px 20px', gap: 12, maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.red}, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🏆 SURVIVAL TRIVIA</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.red }}>{players}</div><div style={{ fontSize: 8, color: C.text3 }}>ALIVE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.purple }}>{round}</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: streak > 3 ? C.gold : C.text2 }}>{streak}🔥</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💀</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.red }}>SURVIVAL TRIVIA</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 8 }}>Wrong answer = ELIMINATED!</div>
            <div style={{ fontSize: 9, color: C.text3 }}>TAP=A · SHORT=B · MED=C · LONG=D</div>
          </div>
        )}

        {(isQuestion || isReveal) && question && (
          <div style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {isQuestion && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 8, color: C.red, fontWeight: 700 }}>Q{round}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: timer <= 4 ? C.red : C.gold, animation: timer <= 4 ? 'pulse 0.5s infinite' : undefined }}>{timer}s ⏰</span>
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>{question.text}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {question.answers.map((opt, i) => {
                const isSel = puffAnswer === i && answer === null
                const isCorrect = isReveal && i === question.correctIdx
                const isWrong = answer !== null && answer === i && i !== question.correctIdx
                return (
                  <div
                    key={i}
                    data-btn="true"
                    onClick={() => { if (answer === null && isQuestion) answerQuestion(i, question) }}
                    style={{ padding: '10px 14px', borderRadius: 10, cursor: answer !== null ? 'default' : 'pointer', background: isCorrect ? `${C.green}20` : isWrong ? `${C.red}20` : isSel ? `${OPT_COLORS[i]}25` : `${OPT_COLORS[i]}06`, border: `1.5px solid ${isCorrect ? C.green : isWrong ? C.red : isSel ? OPT_COLORS[i] + '80' : OPT_COLORS[i] + '20'}`, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: OPT_COLORS[i] }}>{['A', 'B', 'C', 'D'][i]}</span>
                    <span style={{ fontSize: 11, color: C.text, flex: 1 }}>{opt}</span>
                    {isCorrect && <span>✅</span>}
                    {isWrong && <span>❌</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isWinner && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.gold }}>CHAMPION!</div>
            <div style={{ fontSize: 14, color: C.text3, marginTop: 4 }}>Last player standing!</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginTop: 8 }}>Streak: {streak} 🔥</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 13, fontWeight: 800, color: C.red }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        {isEliminated && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>💀</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.red }}>ELIMINATED!</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Survived {round - 1} rounds · Streak: {streak}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 13, fontWeight: 800, color: C.red }}>Try Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{commentary}</div>
      </div>
    </div>
  )
}
