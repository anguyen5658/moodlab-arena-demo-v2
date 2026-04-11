import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'
import { TRIVIA } from './SurvivalTriviaGame'

type Phase = 'question' | 'reveal' | 'final' | null

export const VibeCheckGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState<(typeof TRIVIA)[0] | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(10)
  const [msg, setMsg] = useState('')

  const questionsRef = useRef<(typeof TRIVIA)>([])
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQuestion = useCallback(() => {
    const pool = questionsRef.current
    if (!pool.length) questionsRef.current = [...TRIVIA].sort(() => Math.random() - 0.5)
    const q = questionsRef.current.shift()!
    setQuestion(q)
    setSelected(null)
    setPhase('question')
    setTimer(10)
    setMsg(`🧠 MC Tuấn asks...`)
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    questionsRef.current = [...TRIVIA].sort(() => Math.random() - 0.5)
    setRound(0)
    setScore(0)
    nextQuestion()
    audio.playFx('crowd')
  }, [audio, nextQuestion])

  const revealRef = useRef<(timeOut: boolean) => void>(() => {})

  const reveal = useCallback((timeOut: boolean) => {
    if (phaseRef.current !== 'question') return
    setPhase('reveal')
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null }
    const q = question
    if (!q) return
    const sel = selected
    const correct = !timeOut && sel === q.correct
    if (correct) {
      const bonus = Math.max(5, timer * 5)
      const pts = 50 + bonus
      setScore(s => s + pts)
      audio.playFx('win')
      setMsg(`CORRECT! +${pts} (${bonus} speed bonus)`)
      player.spawnConfetti(20)
    } else {
      audio.playFx('lose')
      setMsg(timeOut ? "Time's up! 💀" : `Wrong! It was ${String.fromCharCode(65 + q.correct)}`)
    }
    setTimeout(() => {
      const nr = round + 1
      if (nr >= 8) {
        setPhase('final')
        audio.playFx('crowd')
      } else {
        setRound(nr)
        nextQuestion()
      }
    }, 2000)
  }, [question, selected, timer, round, audio, player, nextQuestion])

  useEffect(() => { revealRef.current = reveal }, [reveal])

  // Timer tick
  useEffect(() => {
    if (phase !== 'question') return
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    timerIntervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          revealRef.current(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
  }, [phase, question])

  const answer = useCallback((idx: number) => {
    if (phaseRef.current !== 'question') return
    setSelected(idx)
    setTimeout(() => revealRef.current(false), 200)
  }, [])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null }
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const won = score >= 300
    const reward = Math.max(15, Math.round(score / 5))
    player.notify(won ? `🧠 ${score}pts! +${reward} coins` : `🧠 ${score}pts · +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 25 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    exitGame()
  }, [score, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'vibecheck') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'vibecheck') return
    ble.registerPuffHandlers('vibecheck', null, null)
    return () => {
      audio.gameSoundsMuted.current = true
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'vibecheck') return null
  const isFinal = phase === 'final'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🧠 VIBE CHECK"
        titleColor={C.gold}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round + 1}/8 · ${score}pts · ⏱${timer}s`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#2a1f08,#0a0a1a)' }}>
        {!isFinal && question && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 14 }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2 }}>{msg}</div>
            <div style={{ width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, background: `${C.gold}12`, border: `2px solid ${C.gold}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{question.q}</div>
            </div>
            {/* Timer bar */}
            {phase === 'question' && (
              <div style={{ width: '100%', maxWidth: 360, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${(timer / 10) * 100}%`, height: '100%', background: timer > 5 ? C.green : timer > 2 ? C.gold : C.red, transition: 'width 0.5s linear, background 0.5s' }} />
              </div>
            )}
            <div style={{ width: '100%', maxWidth: 360, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {question.a.map((opt, i) => {
                const isPicked = selected === i
                const isCorrect = phase === 'reveal' && i === question.correct
                const isWrongPick = phase === 'reveal' && isPicked && i !== question.correct
                const bg = isCorrect ? `${C.green}25` : isWrongPick ? `${C.red}25` : isPicked ? `${C.cyan}20` : `${C.gold}12`
                const border = isCorrect ? C.green : isWrongPick ? C.red : isPicked ? C.cyan : C.gold
                return (
                  <div key={i}
                    onClick={() => answer(i)}
                    style={{
                      padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      background: bg, border: `2px solid ${border}40`,
                      fontSize: 12, fontWeight: 800, color: '#fff', touchAction: 'none',
                    }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isFinal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{score >= 300 ? '🏆' : '🧠'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: score >= 300 ? C.green : C.gold, marginBottom: 6 }}>SHOW OVER</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 4 }}>Final score: {score}</div>
            <div onClick={collect} style={{ marginTop: 12, padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
