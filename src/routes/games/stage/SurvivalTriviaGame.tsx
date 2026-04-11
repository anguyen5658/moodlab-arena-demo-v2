import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

interface Question { q: string; a: string[]; correct: number }

export const TRIVIA: Question[] = [
  { q: 'What year was cannabis first legalized recreationally in a US state?', a: ['2010', '2012', '2014', '2018'], correct: 1 },
  { q: 'Which terpene smells like pine?', a: ['Limonene', 'Myrcene', 'Pinene', 'Linalool'], correct: 2 },
  { q: 'THC was first isolated in...', a: ['1937', '1964', '1978', '1992'], correct: 1 },
  { q: 'How many cannabinoids has science identified?', a: ['~50', '~80', '~113', '~200'], correct: 2 },
  { q: 'Which country first legalized cannabis nationwide?', a: ['Netherlands', 'Uruguay', 'Canada', 'Portugal'], correct: 1 },
  { q: 'CBD stands for...', a: ['Cannabis Derivative', 'Cannabinol', 'Cannabidiol', 'Canna Blend'], correct: 2 },
  { q: 'Which plant family does cannabis belong to?', a: ['Solanaceae', 'Cannabaceae', 'Rosaceae', 'Fabaceae'], correct: 1 },
  { q: 'Hemp is legal in the US under the...', a: ['2014 Farm Bill', '2018 Farm Bill', '2020 Act', '2016 Amendment'], correct: 1 },
  { q: 'Sativa strains generally produce...', a: ['Couch-lock', 'Uplifting energy', 'Pain relief only', 'Nothing'], correct: 1 },
  { q: 'Trichomes are...', a: ['Leaves', 'Resin glands', 'Seeds', 'Roots'], correct: 1 },
  { q: 'Average grow cycle (days)?', a: ['30', '60', '90', '120'], correct: 2 },
  { q: 'Which is NOT a cannabinoid?', a: ['CBN', 'CBG', 'BHT', 'THCV'], correct: 2 },
]

type Phase = 'question' | 'reveal' | 'eliminated' | 'winner' | null

export const SurvivalTriviaGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [lives, setLives] = useState(3)
  const [streak, setStreak] = useState(0)
  const [msg, setMsg] = useState('')

  const questionsRef = useRef<Question[]>([])
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const livesRef = useRef(3)
  useEffect(() => { livesRef.current = lives }, [lives])

  const nextQuestion = useCallback(() => {
    const pool = questionsRef.current
    if (!pool.length) { questionsRef.current = [...TRIVIA].sort(() => Math.random() - 0.5) }
    const q = questionsRef.current.shift()!
    setQuestion(q)
    setSelected(null)
    setPhase('question')
    setMsg('Pick wisely...')
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    questionsRef.current = [...TRIVIA].sort(() => Math.random() - 0.5)
    setRound(0)
    setLives(3)
    setStreak(0)
    nextQuestion()
    audio.playFx('crowd')
  }, [audio, nextQuestion])

  const answer = useCallback((idx: number) => {
    if (phaseRef.current !== 'question' || !question) return
    setSelected(idx)
    const correct = idx === question.correct
    setPhase('reveal')
    if (correct) {
      audio.playFx('win')
      setStreak(s => s + 1)
      setMsg('CORRECT! 🔥')
    } else {
      audio.playFx('lose')
      setStreak(0)
      const nl = livesRef.current - 1
      setLives(nl)
      setMsg(nl > 0 ? `WRONG! ${nl} ❤️ left` : 'WRONG! GAME OVER')
    }
    setTimeout(() => {
      const nl = livesRef.current
      if (nl <= 0) {
        setPhase('eliminated')
        return
      }
      const nr = round + 1
      if (nr >= 10) {
        setPhase('winner')
        audio.playFx('win'); audio.playFx('crowd')
        player.spawnConfetti(50)
        return
      }
      setRound(nr)
      nextQuestion()
    }, 1800)
  }, [question, round, audio, player, nextQuestion])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const won = phase === 'winner'
    const reward = won ? 120 : 15 + streak * 5
    player.notify(won ? `🏆 SURVIVOR! +${reward} coins` : `💀 +${reward} coins`, won ? C.green : C.red)
    player.recordGameResult(won, reward, won ? 25 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    exitGame()
  }, [phase, streak, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'survivaltrivia') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'survivaltrivia') return
    ble.registerPuffHandlers('survivaltrivia', null, null)
    return () => {
      audio.gameSoundsMuted.current = true
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'survivaltrivia') return null
  const isOver = phase === 'eliminated' || phase === 'winner'
  const won = phase === 'winner'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🏆 SURVIVAL TRIVIA"
        titleColor={C.red}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round + 1}/10 · ❤️${lives} · 🔥${streak}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#2a0810,#0e0408)' }}>
        {!isOver && question && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 16 }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2 }}>{msg}</div>
            <div style={{ width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, background: `${C.red}12`, border: `2px solid ${C.red}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{question.q}</div>
            </div>
            <div style={{ width: '100%', maxWidth: 360, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {question.a.map((opt, i) => {
                const isPicked = selected === i
                const isCorrect = phase === 'reveal' && i === question.correct
                const isWrongPick = phase === 'reveal' && isPicked && i !== question.correct
                const bg = isCorrect ? `${C.green}25` : isWrongPick ? `${C.red}25` : isPicked ? `${C.cyan}20` : `${C.purple}12`
                const border = isCorrect ? C.green : isWrongPick ? C.red : isPicked ? C.cyan : C.purple
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

        {isOver && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: won ? C.green : C.red, marginBottom: 6 }}>{won ? 'SURVIVED!' : 'ELIMINATED'}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>Reached round {round + 1}/10</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${won ? C.green : C.red}15`, border: `1px solid ${won ? C.green : C.red}30`, fontSize: 14, fontWeight: 800, color: won ? C.green : C.red, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
