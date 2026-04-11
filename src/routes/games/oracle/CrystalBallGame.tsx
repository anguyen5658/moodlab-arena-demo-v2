import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

const ANSWERS = [
  { text: 'YES — without a doubt', color: '#22C55E', good: true },
  { text: 'Absolutely, yes', color: '#22C55E', good: true },
  { text: 'Yes, in time', color: '#4ADE80', good: true },
  { text: 'The cosmos says YES', color: '#22C55E', good: true },
  { text: 'Outlook hazy... try again', color: '#A855F7', good: false },
  { text: 'Signs point to maybe', color: '#A855F7', good: false },
  { text: 'NO — the universe disagrees', color: '#EF4444', good: false },
  { text: 'Not in this lifetime', color: '#EF4444', good: false },
  { text: 'The spirits say no', color: '#EF4444', good: false },
]

type Phase = 'idle' | 'thinking' | 'reveal' | 'final' | null

export const CrystalBallGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<typeof ANSWERS[0] | null>(null)
  const [asked, setAsked] = useState(0)
  const startedRef = useRef(false)

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setAsked(0); setAnswer(null); setQuestion('')
    setPhase('idle')
    audio.playFx('crowd')
  }, [audio])

  const ask = useCallback(() => {
    if (!question.trim()) return
    setPhase('thinking')
    audio.playFx('whistle')
    setTimeout(() => {
      const a = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
      setAnswer(a)
      setPhase('reveal')
      audio.playFx(a.good ? 'win' : 'miss')
      setAsked(n => n + 1)
    }, 1800)
  }, [question, audio])

  const reset = () => { setQuestion(''); setAnswer(null); setPhase('idle') }

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null); game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const reward = 15 + asked * 5
    player.notify(`🔮 Oracle spoke ${asked} times · +${reward} coins`, C.purple)
    player.recordGameResult(asked > 0, reward, 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }, [asked, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'crystalball') return
    startedRef.current = true; start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'crystalball') return
    ble.registerPuffHandlers('crystalball', null, null)
    return () => { ble.registerPuffHandlers(null, null, null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'crystalball') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🔮 CRYSTAL BALL" titleColor="#9333EA" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`Asked: ${asked}`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 40%,#2d1b4e,#0a0014)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 18 }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #fff5 0%, #9333EA66 30%, #4c1d95 70%, #1e0a3a 100%)`,
            boxShadow: `0 0 50px #9333EA80, inset 0 0 30px #fff2`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 10,
            animation: phase === 'thinking' ? 'pulse 0.6s infinite' : 'none',
          }}>
            <div style={{ fontSize: 60, filter: 'drop-shadow(0 0 20px #A855F7)' }}>🔮</div>
          </div>

          {phase === 'idle' && (
            <>
              <div style={{ fontSize: 12, color: C.text2, textAlign: 'center' }}>Ask the oracle a yes/no question</div>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Will I...?"
                style={{ width: '90%', maxWidth: 320, padding: 12, borderRadius: 12, background: 'rgba(147,51,234,0.1)', border: '1px solid #9333EA50', color: '#fff', fontSize: 14 }}
              />
              <div onClick={ask} style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: '#9333EA20', border: '2px solid #9333EA50', fontSize: 15, fontWeight: 900, color: '#A855F7', touchAction: 'none' }}>ASK THE ORACLE</div>
            </>
          )}
          {phase === 'thinking' && <div style={{ fontSize: 14, color: '#A855F7', fontWeight: 900 }}>Consulting the spirits...</div>}
          {phase === 'reveal' && answer && (
            <>
              <div style={{ padding: 20, borderRadius: 16, background: `${answer.color}15`, border: `2px solid ${answer.color}`, maxWidth: 340, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: answer.color }}>{answer.text}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div onClick={reset} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: '#9333EA15', border: '1px solid #9333EA30', fontSize: 13, fontWeight: 800, color: '#A855F7', touchAction: 'none' }}>Ask again</div>
                <div onClick={collect} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
