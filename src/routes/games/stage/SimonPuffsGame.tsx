import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

type PuffType = 'short' | 'medium' | 'long'
interface PuffStep { type: PuffType; duration: number }

const SP_COMEDY = [
  'Easy mode. Grandma could do this.',
  'Now we\'re cooking!',
  'Focus. The pattern is speaking to you.',
  "Your short-term memory is being tested.",
  "Don't let THC betray you now.",
  'Blinker endurance incoming!',
  'This is how champions are made.',
  'Legends only from here.',
  "You're in the zone, maintain!",
  'HALL OF FAME territory!',
]

const TYPE_LABEL: Record<PuffType, string> = { short: 'SHORT', medium: 'MEDIUM', long: 'LONG' }
const TYPE_COLOR: Record<PuffType, string> = { short: '#FFD93D', medium: '#00E5FF', long: '#FF6B8A' }
const TYPE_EMOJI: Record<PuffType, string> = { short: '💨', medium: '💨💨', long: '💨💨💨' }

const getPuffType = (dur: number): PuffType => {
  if (dur < 1.1) return 'short'
  if (dur < 2.5) return 'medium'
  return 'long'
}

type Phase = 'intro' | 'showing' | 'input' | 'judging' | 'eliminated' | 'final' | null

export const SimonPuffsGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [pattern, setPattern] = useState<PuffStep[]>([])
  const [playerPattern, setPlayerPattern] = useState<PuffStep[]>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [currentShow, setCurrentShow] = useState(-1)
  const [puffing, setPuffing] = useState(false)
  const [puffTime, setPuffTime] = useState(0)
  const [comment, setComment] = useState('')
  const [introStep, setIntroStep] = useState(0)
  const [bestRound, setBestRound] = useState(0)
  const [playersLeft, setPlayersLeft] = useState(50)

  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const patternRef = useRef<PuffStep[]>([])
  useEffect(() => { patternRef.current = pattern }, [pattern])
  const playerPatternRef = useRef<PuffStep[]>([])
  useEffect(() => { playerPatternRef.current = playerPattern }, [playerPattern])
  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])
  const puffStartRef = useRef(0)
  const puffIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const puffingRef = useRef(false)

  const clearTimeouts = () => { timeoutsRef.current.forEach(t => clearTimeout(t)); timeoutsRef.current = [] }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const startRound = useCallback((roundNum: number) => {
    const types: PuffType[] = ['short', 'medium', 'long']
    const prev = roundNum === 1 ? [] : patternRef.current
    const newType = types[Math.floor(Math.random() * 3)]
    const newStep: PuffStep = { type: newType, duration: newType === 'short' ? 0.6 : newType === 'medium' ? 1.8 : 3.2 }
    const pat = [...prev, newStep]
    setPattern(pat); patternRef.current = pat
    setRound(roundNum)
    setPlayerPattern([])
    setResult(null)
    setCurrentShow(-1)
    setPhase('showing')
    setComment(SP_COMEDY[Math.min(roundNum - 1, SP_COMEDY.length - 1)])
    audio.playFx('select')

    let delay = 600
    pat.forEach((p, idx) => {
      addTimeout(() => {
        setCurrentShow(idx)
        audio.playFx('tap')
      }, delay)
      const showDur = p.type === 'short' ? 600 : p.type === 'medium' ? 1200 : 2000
      delay += showDur + 400
      addTimeout(() => setCurrentShow(-1), delay - 400)
    })
    addTimeout(() => {
      setCurrentShow(-1)
      setPhase('input')
      setComment(`Puff the pattern! ${pat.length} puffs to go...`)
    }, delay + 200)
  }, [audio])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    setPattern([]); patternRef.current = []
    setPlayerPattern([])
    setRound(0)
    setScore(0)
    setResult(null)
    setCurrentShow(-1)
    setPuffing(false); puffingRef.current = false
    setPuffTime(0)
    setComment('')
    setIntroStep(0)
    setBestRound(0)
    setPlayersLeft(Math.floor(30 + Math.random() * 70))
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => setIntroStep(1), 400)
    addTimeout(() => setIntroStep(2), 1000)
    addTimeout(() => setIntroStep(3), 1800)
    addTimeout(() => { setIntroStep(4); audio.playFx('whistle') }, 2600)
    addTimeout(() => startRound(1), 3400)
  }, [audio, startRound])

  const endPuff = useCallback(() => {
    if (!puffingRef.current) return
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffingRef.current = false
    setPuffing(false)
    setPuffTime(0)
    const puffType = getPuffType(dur)
    const newPlayer = [...playerPatternRef.current, { type: puffType, duration: dur }]
    setPlayerPattern(newPlayer); playerPatternRef.current = newPlayer
    const idx = newPlayer.length - 1
    const pat = patternRef.current
    if (pat[idx] && puffType === pat[idx].type) {
      audio.playFx('select')
      if (newPlayer.length === pat.length) {
        const rs = roundRef.current * 100
        setScore(s => s + rs)
        setBestRound(roundRef.current)
        setResult('correct')
        setPhase('judging')
        setComment(`Perfect memory! +${rs} points!`)
        setPlayersLeft(p => Math.max(1, Math.floor(p * (0.6 + Math.random() * 0.2))))
        audio.playFx('win')
        addTimeout(() => {
          if (roundRef.current >= 10) {
            setPhase('final')
            player.spawnConfetti(30)
            player.recordGameResult(true, 80, 25, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
          } else {
            startRound(roundRef.current + 1)
          }
        }, 2200)
      } else {
        setComment(`${pat.length - newPlayer.length} more to go...`)
      }
    } else {
      setResult('wrong')
      setPhase('eliminated')
      audio.playFx('miss')
      const expected = pat[idx] ? pat[idx].type : '???'
      setComment(`WRONG! You puffed ${puffType.toUpperCase()} but needed ${expected.toUpperCase()}!`)
      player.recordGameResult(roundRef.current >= 5, roundRef.current >= 5 ? 40 : 8, roundRef.current >= 5 ? 18 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    }
  }, [audio, player, ble.bleConnected, game.gameActive, startRound])

  const startPuff = useCallback(() => {
    if (phaseRef.current !== 'input' || puffingRef.current) return
    puffingRef.current = true
    setPuffing(true)
    setPuffTime(0)
    puffStartRef.current = Date.now()
    audio.playFx('tap')
    if (puffIntervalRef.current) clearInterval(puffIntervalRef.current)
    puffIntervalRef.current = setInterval(() => {
      setPuffTime((Date.now() - puffStartRef.current) / 1000)
    }, 50)
  }, [audio])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    clearTimeouts()
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => exitGame(), [exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'simonpuffs') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'simonpuffs') return
    ble.registerPuffHandlers('simonpuffs', () => startPuff(), () => endPuff())
    return () => {
      audio.gameSoundsMuted.current = true
      if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'simonpuffs') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🔴 SIMON PUFFS"
        titleColor={C.red}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round} · ${score}pts · ${playersLeft} alive`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#2a0828,#0a0a1e)' }}>
        {comment && (
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', fontSize: 9, color: C.gold, fontWeight: 700 }}>{comment}</div>
          </div>
        )}

        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 60, gap: 14 }}>
            <div style={{ fontSize: 56, opacity: introStep >= 1 ? 1 : 0, transition: 'opacity 0.4s' }}>🔴</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.red, opacity: introStep >= 2 ? 1 : 0, transition: 'opacity 0.4s' }}>SIMON PUFFS</div>
            <div style={{ fontSize: 11, color: C.text2, opacity: introStep >= 3 ? 1 : 0, transition: 'opacity 0.4s', textAlign: 'center' }}>Memorize the puff pattern. Short · Medium · Long</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, opacity: introStep >= 4 ? 1 : 0, transition: 'opacity 0.4s', marginTop: 10 }}>GET READY!</div>
          </div>
        )}

        {(phase === 'showing' || phase === 'input' || phase === 'judging') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 44, paddingBottom: 60, gap: 14 }}>
            {/* Pattern display */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}>
              {pattern.map((p, i) => {
                const done = i < playerPattern.length
                const isCurrent = phase === 'showing' && i === currentShow
                const isNext = phase === 'input' && i === playerPattern.length
                return (
                  <div key={i} style={{
                    padding: '8px 10px', borderRadius: 10, background: isCurrent ? TYPE_COLOR[p.type] : done ? `${TYPE_COLOR[p.type]}50` : `${TYPE_COLOR[p.type]}15`,
                    border: `2px solid ${isNext ? '#fff' : TYPE_COLOR[p.type]}`,
                    fontSize: 10, fontWeight: 800, color: isCurrent ? '#0a0a14' : '#fff', transition: 'all 0.2s',
                    boxShadow: isCurrent ? `0 0 20px ${TYPE_COLOR[p.type]}` : 'none',
                  }}>
                    {done ? '✓ ' : ''}{TYPE_EMOJI[p.type]}
                  </div>
                )
              })}
            </div>

            {phase === 'input' && (
              <>
                <div style={{ fontSize: 10, color: C.text3, textAlign: 'center' }}>Next: {TYPE_LABEL[pattern[playerPattern.length]?.type || 'short']}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: puffing ? TYPE_COLOR[getPuffType(puffTime)] : C.text3, fontFamily: "'Courier New',monospace" }}>{puffTime.toFixed(1)}s</div>
                <div
                  onMouseDown={(e) => { e.preventDefault(); startPuff() }}
                  onMouseUp={(e) => { e.preventDefault(); endPuff() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startPuff() }}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); endPuff() }}
                  onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); endPuff() }}
                  style={{ padding: '18px 32px', borderRadius: 60, cursor: 'pointer', background: puffing ? `${C.gold}30` : `${C.red}22`, border: `2px solid ${puffing ? C.gold : C.red}60`, fontSize: 14, fontWeight: 900, color: puffing ? C.gold : C.red, touchAction: 'none', userSelect: 'none' }}
                >
                  {puffing ? '💨 HOLDING...' : '💨 HOLD TO PUFF'}
                </div>
                <div style={{ fontSize: 8, color: C.text3, textAlign: 'center' }}>SHORT &lt;1.1s · MEDIUM &lt;2.5s · LONG ≥2.5s</div>
              </>
            )}
          </div>
        )}

        {(phase === 'eliminated' || phase === 'final') && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.92)', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{phase === 'final' ? '🏆' : result === 'wrong' ? '💀' : '🎪'}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: phase === 'final' ? C.gold : C.red, marginBottom: 6 }}>{phase === 'final' ? 'CHAMPION!' : 'ELIMINATED'}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 4, textAlign: 'center' }}>{comment}</div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 10 }}>Best round: {bestRound} · {score} pts</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 14, fontWeight: 800, color: C.red, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
