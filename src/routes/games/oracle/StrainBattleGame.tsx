import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

// Direct lift from monolith line 358
interface Strain { name: string; emoji: string; thc: number; type: 'Sativa' | 'Indica' | 'Hybrid'; effects: string; flavor: string }
const SB_STRAINS: Strain[] = [
  { name: 'OG Kush', emoji: '🌿', thc: 23, type: 'Hybrid', effects: 'Relaxed, Euphoric, Happy', flavor: 'Earthy, Pine, Woody' },
  { name: 'Blue Dream', emoji: '💙', thc: 21, type: 'Sativa', effects: 'Creative, Euphoric, Uplifted', flavor: 'Berry, Sweet, Herbal' },
  { name: 'Gorilla Glue', emoji: '🦍', thc: 28, type: 'Hybrid', effects: 'Relaxed, Euphoric, Sleepy', flavor: 'Diesel, Earthy, Pine' },
  { name: 'Girl Scout Cookies', emoji: '🍪', thc: 25, type: 'Hybrid', effects: 'Happy, Euphoric, Relaxed', flavor: 'Sweet, Earthy, Pungent' },
  { name: 'Sour Diesel', emoji: '⛽', thc: 22, type: 'Sativa', effects: 'Energetic, Happy, Uplifted', flavor: 'Diesel, Pungent, Earthy' },
  { name: 'Purple Haze', emoji: '💜', thc: 20, type: 'Sativa', effects: 'Creative, Euphoric, Energetic', flavor: 'Berry, Earthy, Sweet' },
  { name: 'Wedding Cake', emoji: '🎂', thc: 27, type: 'Indica', effects: 'Relaxed, Happy, Euphoric', flavor: 'Sweet, Vanilla, Earthy' },
  { name: 'Gelato', emoji: '🍨', thc: 25, type: 'Hybrid', effects: 'Relaxed, Happy, Euphoric', flavor: 'Sweet, Citrus, Fruity' },
  { name: 'Jack Herer', emoji: '🌲', thc: 20, type: 'Sativa', effects: 'Creative, Energetic, Focused', flavor: 'Pine, Earthy, Woody' },
  { name: 'Northern Lights', emoji: '🌌', thc: 21, type: 'Indica', effects: 'Relaxed, Sleepy, Happy', flavor: 'Earthy, Pine, Sweet' },
  { name: 'Pineapple Express', emoji: '🍍', thc: 22, type: 'Hybrid', effects: 'Happy, Uplifted, Energetic', flavor: 'Tropical, Pineapple, Citrus' },
  { name: 'White Widow', emoji: '🕸️', thc: 20, type: 'Hybrid', effects: 'Euphoric, Energetic, Creative', flavor: 'Earthy, Woody, Pungent' },
  { name: 'AK-47', emoji: '💥', thc: 22, type: 'Hybrid', effects: 'Relaxed, Happy, Uplifted', flavor: 'Earthy, Pungent, Floral' },
  { name: 'Granddaddy Purple', emoji: '🍇', thc: 23, type: 'Indica', effects: 'Relaxed, Sleepy, Happy', flavor: 'Grape, Berry, Sweet' },
  { name: 'Skywalker OG', emoji: '🌠', thc: 26, type: 'Indica', effects: 'Relaxed, Sleepy, Happy', flavor: 'Earthy, Pine, Diesel' },
  { name: 'Durban Poison', emoji: '☀️', thc: 19, type: 'Sativa', effects: 'Energetic, Uplifted, Creative', flavor: 'Sweet, Earthy, Pine' },
]

type Phase = 'intro' | 'matchup' | 'results' | 'complete' | null

export const StrainBattleGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [matchups, setMatchups] = useState<[Strain, Strain][]>([])
  const [matchup, setMatchup] = useState<[Strain, Strain] | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [vote, setVote] = useState<'left' | 'right' | null>(null)
  const [results, setResults] = useState<{ left: number; right: number } | null>(null)

  const puffStartRef = useRef(0)
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const matchupRef = useRef<[Strain, Strain] | null>(null)
  useEffect(() => { matchupRef.current = matchup }, [matchup])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])
  const matchupsRef = useRef<[Strain, Strain][]>([])
  useEffect(() => { matchupsRef.current = matchups }, [matchups])

  const clearTimeouts = () => { timeoutsRef.current.forEach(t => clearTimeout(t)); timeoutsRef.current = [] }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 5) {
      setPhase('complete')
      audio.playFx('win')
      player.recordGameResult(score > 0, score > 0 ? 20 : 0, score > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
      return
    }
    const m = matchupsRef.current[next]
    setMatchup(m)
    setVote(null)
    setResults(null)
    setRound(next)
    setPhase('matchup')
  }, [audio, player, ble.bleConnected, game.gameActive, score])

  const nextRef = useRef(nextRound)
  useEffect(() => { nextRef.current = nextRound }, [nextRound])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    const shuffled = [...SB_STRAINS].sort(() => Math.random() - 0.5)
    const ms: [Strain, Strain][] = []
    for (let i = 0; i < 10; i += 2) ms.push([shuffled[i], shuffled[i + 1]])
    setMatchups(ms)
    setRound(0)
    setScore(0)
    setVote(null)
    setResults(null)
    setMatchup(ms[0])
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => setPhase('matchup'), 1500)
  }, [audio])

  const handlePuff = useCallback(() => {
    if (phaseRef.current !== 'matchup') return
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffEnd = useCallback(() => {
    if (phaseRef.current !== 'matchup' || !puffStartRef.current) return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    const v: 'left' | 'right' = dur < 1.5 ? 'left' : 'right'
    setVote(v)
    const leftPct = 30 + Math.floor(Math.random() * 40)
    const rightPct = 100 - leftPct
    setResults({ left: leftPct, right: rightPct })
    setPhase('results')
    audio.playFx('tap')
    const correct = (v === 'left' && leftPct > 50) || (v === 'right' && rightPct > 50)
    const pts = correct ? 30 : 10
    setScore(s => s + pts)
    audio.playFx(correct ? 'win' : 'miss')
    addTimeout(() => nextRef.current(), 2500)
  }, [audio])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    clearTimeouts()
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => exitGame(), [exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'strainbattle') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'strainbattle') return
    ble.registerPuffHandlers('strainbattle', () => handlePuff(), () => handlePuffEnd())
    return () => {
      audio.gameSoundsMuted.current = true
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'strainbattle') return null
  const isComplete = phase === 'complete'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🌿 STRAIN BATTLE" titleColor="#22C55E" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/5 · ${score}pts`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#0a2a14,#050a08)' }}>
        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 60, gap: 10 }}>
            <div style={{ fontSize: 56 }}>🌿</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.green }}>STRAIN BATTLE</div>
            <div style={{ fontSize: 11, color: C.text2 }}>5 matchups · vote with your puffs</div>
          </div>
        )}

        {(phase === 'matchup' || phase === 'results') && matchup && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 16, paddingTop: 18, paddingBottom: 60, gap: 10 }}>
            <div style={{ fontSize: 10, color: C.text3, textAlign: 'center', letterSpacing: 2 }}>WHICH STRAIN WINS?</div>
            {[0, 1].map(i => {
              const s = matchup[i]
              const side: 'left' | 'right' = i === 0 ? 'left' : 'right'
              const v = results ? (side === 'left' ? results.left : results.right) : 0
              const wasVoted = vote === side
              const col = s.type === 'Sativa' ? '#FBBF24' : s.type === 'Indica' ? '#A855F7' : '#22C55E'
              return (
                <div key={i} style={{
                  width: '100%', padding: 14, borderRadius: 14,
                  background: `${col}12`, border: `2px solid ${wasVoted ? col : col + '35'}`,
                  boxShadow: wasVoted ? `0 0 24px ${col}60` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 36 }}>{s.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: col }}>{s.name}</div>
                      <div style={{ fontSize: 8, color: C.text3 }}>{s.type} · THC {s.thc}%</div>
                      <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>{s.effects}</div>
                      <div style={{ fontSize: 8, color: C.text3 }}>{s.flavor}</div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: C.text3 }}>{side === 'left' ? 'SHORT PUFF' : 'LONG PUFF'}</div>
                  </div>
                  {results && (
                    <>
                      <div style={{ marginTop: 6, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${v}%`, height: '100%', background: col, transition: 'width 0.6s' }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: col, marginTop: 2, textAlign: 'right' }}>{v}%</div>
                    </>
                  )}
                </div>
              )
            })}
            {phase === 'matchup' && (
              <div
                onMouseDown={(e) => { e.preventDefault(); handlePuff() }}
                onMouseUp={(e) => { e.preventDefault(); handlePuffEnd() }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handlePuff() }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); handlePuffEnd() }}
                style={{ padding: '14px 28px', borderRadius: 60, cursor: 'pointer', background: '#22C55E20', border: '2px solid #22C55E60', fontSize: 13, fontWeight: 900, color: '#22C55E', touchAction: 'none', userSelect: 'none', textAlign: 'center' }}
              >
                💨 HOLD TO VOTE
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.green, marginBottom: 6 }}>BATTLE OVER</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>{score} points</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
