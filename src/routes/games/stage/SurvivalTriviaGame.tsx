import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

// Direct lift from monolith line 14711
interface RawQ { q: string; a: string[]; c: number }
const ST_QUESTIONS: RawQ[] = [
  { q: 'What color is cannabis?', a: ['Green', 'Blue', 'Red', 'Yellow'], c: 0 },
  { q: 'What do you light a joint with?', a: ['Lighter', 'Spoon', 'Pen', 'Phone'], c: 0 },
  { q: 'What is THC?', a: ['A cannabinoid', 'A vitamin', 'A mineral', 'A protein'], c: 0 },
  { q: 'Which part of the plant do you smoke?', a: ['Flower', 'Root', 'Stem', 'Bark'], c: 0 },
  { q: 'What does CBD stand for?', a: ['Cannabidiol', 'Carbon Dioxide', 'Chill Buzz Drug', 'Cool Bud Drop'], c: 0 },
  { q: 'What is a blinker?', a: ['Max-length puff', 'A car signal', 'Eye twitch', 'Short puff'], c: 0 },
  { q: 'Which snack is the classic munchie?', a: ['Doritos', 'Salad', 'Rice cakes', 'Broccoli'], c: 0 },
  { q: 'What year was cannabis first legalized in a US state?', a: ['2012', '2000', '2016', '1995'], c: 0 },
  { q: 'Which US state legalized recreational cannabis first?', a: ['Colorado', 'California', 'Oregon', 'Alaska'], c: 0 },
  { q: 'What is a dab rig used for?', a: ['Concentrates', 'Flower', 'Edibles', 'Topicals'], c: 0 },
  { q: 'What does 420 refer to in cannabis culture?', a: ['April 20th', '4:20 PM break', 'Police code', 'A strain name'], c: 0 },
  { q: 'Which terpene smells like citrus?', a: ['Limonene', 'Myrcene', 'Pinene', 'Linalool'], c: 0 },
  { q: 'What is decarboxylation?', a: ['Heating to activate THC', 'Drying process', 'Trimming buds', 'Removing seeds'], c: 0 },
  { q: 'Indica is known for making you feel...?', a: ['Relaxed', 'Energized', 'Focused', 'Anxious'], c: 0 },
  { q: 'What terpene gives cannabis its piney smell?', a: ['Pinene', 'Myrcene', 'Caryophyllene', 'Terpinolene'], c: 0 },
  { q: 'What is the entourage effect?', a: ['Compounds working together', 'VIP treatment', 'Crowd high', 'Tolerance buildup'], c: 0 },
  { q: 'Which cannabinoid is non-psychoactive?', a: ['CBD', 'THC', 'THCV', 'Delta-8'], c: 0 },
  { q: 'What temperature (F) does THC vaporize?', a: ['315-392', '100-200', '500-600', '200-250'], c: 0 },
  { q: 'What is a landrace strain?', a: ['Original wild strain', 'Lab hybrid', 'GMO cannabis', 'Indoor variety'], c: 0 },
  { q: 'What is trichome?', a: ['Crystal resin gland', 'Root hair', 'Leaf vein', 'Seed coating'], c: 0 },
  { q: 'What country has the longest cannabis history?', a: ['China', 'USA', 'Jamaica', 'Netherlands'], c: 0 },
  { q: 'What is rosin?', a: ['Heat-pressed extract', 'Edible oil', 'Rolling paper', 'Fertilizer'], c: 0 },
  { q: 'What is a phenotype in cannabis?', a: ['Physical trait expression', 'Smell category', 'THC level', 'Grow method'], c: 0 },
  { q: 'Which cannabinoid may suppress appetite?', a: ['THCV', 'CBN', 'CBD', 'CBG'], c: 0 },
]

const ST_DEATH_MSGS = [
  'ELIMINATED! Your brain needed more THC... or less',
  'WRONG! The grim reaper puffs on your soul',
  'DEAD! Even a goldfish would know that one',
  'ELIMINATED! Your third eye was clearly closed',
  'RIP! That answer was rougher than shake',
  'GONE! You just got trimmed from the game',
  "WRONG! Pack it up, you're done",
  'ELIMINATED! Not even a blinker could save you',
]
const ST_SURVIVE_MSGS = [
  'CORRECT! You live to puff another round!',
  'RIGHT! Your cannabis IQ is showing',
  'SURVIVED! The reaper passes you by... this time',
  'CORRECT! That big brain energy though',
  'YES! Knowledge is power, and power is THC',
  "NAILED IT! You're built different",
]

interface Avatar { id: number; emoji: string; alive: boolean; name: string; isYou?: boolean }
interface Question { text: string; answers: string[]; correctIdx: number }

export const TRIVIA = ST_QUESTIONS // exported for VibeCheck back-compat — remove when VC is ported
type Phase = 'intro' | 'question' | 'reveal' | 'eliminated' | 'winner' | null

export const SurvivalTriviaGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [players, setPlayers] = useState(100)
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [answerIdx, setAnswerIdx] = useState<number | null>(null)
  const [correctIdx, setCorrectIdx] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [eliminated, setEliminated] = useState(false)
  const [finalMode, setFinalMode] = useState(false)
  const [comment, setComment] = useState('')
  const [timer, setTimer] = useState(15)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const startedRef = useRef(false)
  const answerRef = useRef<number | null>(null)
  useEffect(() => { answerRef.current = answerIdx }, [answerIdx])
  const streakRef = useRef(0)
  useEffect(() => { streakRef.current = streak }, [streak])
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
  }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const revealAnswer = useCallback((rn: number, playerAnswer: number, cIdx: number, playersLeft: number, avs: Avatar[]) => {
    setCorrectIdx(cIdx)
    setPhase('reveal')
    const isCorrect = playerAnswer === cIdx
    const elimRate = Math.min(0.25, 0.08 + rn * 0.015)
    let newAvs = avs.map(a => {
      if (!a.alive) return a
      if (a.isYou) return { ...a, alive: isCorrect }
      return { ...a, alive: Math.random() > elimRate }
    })
    const aliveCount = newAvs.filter(a => a.alive).length
    if (aliveCount < 2 && isCorrect) {
      let revived = 0
      newAvs = newAvs.map(a => {
        if (!a.alive && !a.isYou && revived < 2) { revived++; return { ...a, alive: true } }
        return a
      })
    }
    const newAlive = newAvs.filter(a => a.alive).length
    const elimCount = playersLeft - newAlive
    setAvatars(newAvs)
    setPlayers(newAlive)

    if (isCorrect) {
      setStreak(s => s + 1)
      if (streakRef.current + 1 === 5) audio.playFx('streak_fire')
      setComment(ST_SURVIVE_MSGS[Math.floor(Math.random() * ST_SURVIVE_MSGS.length)])
      audio.playFx('select')
      const streakBonus = (streakRef.current + 1) >= 5 ? 50 : (streakRef.current + 1) >= 3 ? 25 : 10
      player.notify(`Correct! +${streakBonus} streak bonus`, C.green)
      void elimCount
    } else {
      setEliminated(true)
      if (streakRef.current >= 2) audio.playFx('streak_break')
      setStreak(0)
      setComment(ST_DEATH_MSGS[Math.floor(Math.random() * ST_DEATH_MSGS.length)])
      audio.playFx('miss')
    }

    addTimeout(() => {
      if (!isCorrect) {
        setPhase('eliminated')
        audio.playFx('lose')
        player.recordGameResult(false, 8, 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
        return
      }
      if (newAlive <= 1) {
        setPhase('winner')
        setComment('YOU ARE THE LAST ONE STANDING!')
        audio.playFx('win')
        player.spawnConfetti(50)
        player.recordGameResult(true, 50, 20, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
        return
      }
      nextQuestionRef.current(rn + 1, newAlive, newAvs)
    }, 2500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, player, ble.bleConnected, game.gameActive])

  const nextQuestion = useCallback((roundNum: number, playersLeft: number, avs: Avatar[]) => {
    if (playersLeft <= 1 || roundNum >= ST_QUESTIONS.length) {
      setPhase('winner')
      setComment('WINNER WINNER! You survived all rounds!')
      audio.playFx('win')
      player.recordGameResult(true, 50, 20, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
      return
    }
    const isFinal = playersLeft <= 3
    setFinalMode(isFinal)
    const timerDur = isFinal ? 12 : 15
    const q = ST_QUESTIONS[roundNum % ST_QUESTIONS.length]
    const indices = [0, 1, 2, 3]
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const shuffled = indices.map(i => q.a[i])
    const cIdx = indices.indexOf(q.c)
    setQuestion({ text: q.q, answers: shuffled, correctIdx: cIdx })
    setAnswerIdx(null)
    setCorrectIdx(null)
    setRound(roundNum + 1)
    setTimer(timerDur)
    setPhase('question')
    setComment(isFinal ? 'FINAL 3 SHOWDOWN! 12 SECONDS!' : `Round ${roundNum + 1} - ${playersLeft} alive`)
    if (timerRef.current) clearInterval(timerRef.current)
    let t = timerDur
    timerRef.current = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 3 && t > 0) audio.playFx('tap')
      if (t <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setAnswerIdx(-1)
        revealAnswer(roundNum, -1, cIdx, playersLeft, avs)
      }
    }, 1000)
  }, [audio, player, ble.bleConnected, game.gameActive, revealAnswer])

  const nextQuestionRef = useRef(nextQuestion)
  useEffect(() => { nextQuestionRef.current = nextQuestion }, [nextQuestion])

  const selectAnswer = useCallback((idx: number) => {
    if (answerRef.current !== null) return
    setAnswerIdx(idx)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const q = question
    if (!q) return
    revealAnswer(round - 1, idx, q.correctIdx, players, avatars)
  }, [question, round, players, avatars, revealAnswer])

  const selectRef = useRef(selectAnswer)
  useEffect(() => { selectRef.current = selectAnswer }, [selectAnswer])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    const emojis = ['😤', '😎', '🥴', '🤩', '😈', '👽', '🤖', '👻', '🐸', '🌚', '🦊', '💀', '🧠', '👑', '🔥', '💨', '🌿', '🍕', '🎮', '🎵']
    const list: Avatar[] = []
    for (let i = 0; i < 100; i++) list.push({ id: i, emoji: emojis[i % emojis.length], alive: true, name: 'Player_' + (100 + i) })
    list[42] = { id: 42, emoji: '🌟', alive: true, name: 'You', isYou: true }
    setAvatars(list)
    setPlayers(100)
    setRound(0)
    setStreak(0)
    setEliminated(false)
    setAnswerIdx(null)
    setCorrectIdx(null)
    setFinalMode(false)
    setComment('')
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => setComment('SURVIVAL TRIVIA'), 500)
    addTimeout(() => setComment('Wrong answer = INSTANT DEATH'), 2000)
    addTimeout(() => setComment('Last one standing WINS'), 3500)
    addTimeout(() => nextQuestionRef.current(0, 100, list), 5000)
  }, [audio])

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
    if (game.gameActive?.id !== 'survivaltrivia') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'survivaltrivia') return
    // Puff-to-answer: duration maps to index (TAP=A, SHORT=B, MED=C, LONG=D)
    let puffStart = 0
    const puffDown = () => { puffStart = Date.now() }
    const puffUp = () => {
      if (!puffStart) return
      const dur = Date.now() - puffStart
      puffStart = 0
      const idx = dur < 500 ? 0 : dur < 1500 ? 1 : dur < 3000 ? 2 : 3
      selectRef.current(idx)
    }
    ble.registerPuffHandlers('survivaltrivia', puffDown, puffUp)
    return () => {
      audio.gameSoundsMuted.current = true
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'survivaltrivia') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🏆 SURVIVAL TRIVIA"
        titleColor={C.purple}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`${players} alive · 🔥${streak}${phase === 'question' ? ` · ⏱${timer}s` : ''}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#1a0a2a,#0a0a14)' }}>
        {/* Comment banner */}
        {comment && (
          <div style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', fontSize: 9, color: C.gold, fontWeight: 700 }}>{comment}</div>
          </div>
        )}

        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }}>
            <div style={{ fontSize: 56 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.purple }}>SURVIVAL TRIVIA</div>
            <div style={{ fontSize: 11, color: C.text2 }}>100 players enter... only 1 survives!</div>
          </div>
        )}

        {(phase === 'question' || phase === 'reveal') && question && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 14, paddingTop: 40, gap: 10 }}>
            {/* Avatar grid (10x10) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20,1fr)', gap: 2, padding: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 8, maxHeight: 90, overflow: 'hidden' }}>
              {avatars.map(a => (
                <div key={a.id} style={{ fontSize: 10, textAlign: 'center', opacity: a.alive ? 1 : 0.15, filter: a.alive ? 'none' : 'grayscale(1)', color: a.isYou ? C.gold : '#fff', textShadow: a.isYou ? `0 0 4px ${C.gold}` : 'none' }}>
                  {a.alive ? a.emoji : '💀'}
                </div>
              ))}
            </div>
            {finalMode && <div style={{ fontSize: 9, fontWeight: 800, color: C.red, textAlign: 'center', letterSpacing: 2 }}>🔥 FINAL SHOWDOWN 🔥</div>}
            {/* Question */}
            <div style={{ padding: 14, borderRadius: 12, background: `${C.purple}14`, border: `2px solid ${C.purple}40`, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>{question.text}</div>
            </div>
            {/* Timer bar */}
            {phase === 'question' && (
              <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${(timer / (finalMode ? 12 : 15)) * 100}%`, height: '100%', background: timer > 5 ? C.green : timer > 2 ? C.gold : C.red }} />
              </div>
            )}
            {/* Answers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {question.answers.map((opt, i) => {
                const isPicked = answerIdx === i
                const isCorrect = phase === 'reveal' && i === correctIdx
                const isWrongPick = phase === 'reveal' && isPicked && i !== correctIdx
                const bg = isCorrect ? `${C.green}25` : isWrongPick ? `${C.red}25` : isPicked ? `${C.purple}25` : `${C.purple}10`
                const border = isCorrect ? C.green : isWrongPick ? C.red : isPicked ? C.purple : C.purple
                return (
                  <div key={i} onClick={() => selectAnswer(i)} style={{ padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: bg, border: `2px solid ${border}50`, fontSize: 11, fontWeight: 700, color: '#fff', touchAction: 'none' }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(phase === 'eliminated' || phase === 'winner') && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.92)', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{phase === 'winner' ? '👑' : '💀'}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: phase === 'winner' ? C.gold : C.red, marginBottom: 6 }}>{phase === 'winner' ? 'WINNER!' : 'ELIMINATED'}</div>
            <div style={{ fontSize: 11, color: C.text2, marginBottom: 10, textAlign: 'center' }}>{comment}</div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 12 }}>Survived {round} rounds · Best streak {streak}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 14, fontWeight: 800, color: C.purple, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}

void eliminated
