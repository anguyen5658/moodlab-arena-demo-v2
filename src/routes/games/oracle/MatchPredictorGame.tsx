import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

const TEAMS = [
  { name: 'Brazil', flag: '🇧🇷' }, { name: 'Argentina', flag: '🇦🇷' },
  { name: 'France', flag: '🇫🇷' }, { name: 'Germany', flag: '🇩🇪' },
  { name: 'Spain', flag: '🇪🇸' }, { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Netherlands', flag: '🇳🇱' }, { name: 'Portugal', flag: '🇵🇹' },
]

type Phase = 'pick' | 'reveal' | 'final' | null
type Pick = 'win' | 'draw' | 'lose'

export const MatchPredictorGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [match, setMatch] = useState<[typeof TEAMS[0], typeof TEAMS[0]] | null>(null)
  const [pickVal, setPickVal] = useState<Pick | null>(null)
  const [result, setResult] = useState<Pick | null>(null)
  const [correct, setCorrect] = useState(0)
  const startedRef = useRef(false)

  const nextMatch = useCallback(() => {
    const a = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    let b = a
    while (b === a) b = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    setMatch([a, b])
    setPickVal(null); setResult(null)
    setPhase('pick')
  }, [])

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setRound(0); setCorrect(0); nextMatch()
  }, [audio, nextMatch])

  const submit = useCallback((p: Pick) => {
    if (phase !== 'pick') return
    setPickVal(p)
    audio.playFx('tap')
    // Weighted random outcome
    const r = Math.random()
    const actual: Pick = r < 0.42 ? 'win' : r < 0.70 ? 'draw' : 'lose'
    setResult(actual)
    setPhase('reveal')
    if (actual === p) { setCorrect(c => c + 1); audio.playFx('win'); player.spawnConfetti(15) }
    else audio.playFx('lose')
    setTimeout(() => {
      const nr = round + 1
      if (nr >= 5) setPhase('final')
      else { setRound(nr); nextMatch() }
    }, 1800)
  }, [phase, round, audio, player, nextMatch])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null); game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const reward = 15 + correct * 15
    player.notify(`📊 ${correct}/5 predicted · +${reward}`, correct >= 3 ? C.green : C.gold)
    player.recordGameResult(correct >= 3, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }, [correct, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'matchpredictor') return
    startedRef.current = true; start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'matchpredictor') return
    ble.registerPuffHandlers('matchpredictor', null, null)
    return () => { ble.registerPuffHandlers(null, null, null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'matchpredictor') return null
  const isFinal = phase === 'final'
  const labelFor = (p: Pick) => p === 'win' ? 'WIN' : p === 'draw' ? 'DRAW' : 'LOSE'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="📊 MATCH PREDICTOR" titleColor="#3B82F6" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/5 · ${correct}✓`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#0a1f3a,#050a14)' }}>
        {!isFinal && match && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 18 }}>
            <div style={{ fontSize: 11, color: C.text3, letterSpacing: 2 }}>PREDICT THE RESULT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, borderRadius: 16, background: 'rgba(59,130,246,0.1)', border: '2px solid #3B82F640', width: '100%', maxWidth: 340, justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>{match[0].flag}</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#3B82F6' }}>{match[0].name}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>{match[1].flag}</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: C.red }}>{match[1].name}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%', maxWidth: 340 }}>
              {(['win', 'draw', 'lose'] as Pick[]).map(p => {
                const picked = pickVal === p
                const isRight = phase === 'reveal' && result === p
                const isWrongPicked = phase === 'reveal' && picked && result !== p
                const bg = isRight ? `${C.green}25` : isWrongPicked ? `${C.red}25` : picked ? '#3B82F625' : '#3B82F612'
                const br = isRight ? C.green : isWrongPicked ? C.red : picked ? '#3B82F6' : '#3B82F640'
                return (
                  <div key={p} onClick={() => submit(p)} style={{ padding: '14px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: bg, border: `2px solid ${br}`, fontSize: 12, fontWeight: 900, color: '#fff', touchAction: 'none' }}>
                    {p === 'win' ? '🏆 WIN' : p === 'draw' ? '🤝 DRAW' : '💀 LOSE'}
                  </div>
                )
              })}
            </div>
            {phase === 'reveal' && result && (
              <div style={{ fontSize: 16, fontWeight: 900, color: result === pickVal ? C.green : C.red }}>
                {result === pickVal ? 'CORRECT! 🎯' : `WRONG — ${labelFor(result)}`}
              </div>
            )}
          </div>
        )}
        {isFinal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{correct >= 3 ? '🏆' : '📊'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: correct >= 3 ? C.green : C.gold, marginBottom: 6 }}>PREDICTIONS DONE</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>{correct}/5 correct</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
