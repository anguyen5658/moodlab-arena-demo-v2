import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const SP_COMEDY = [
  'Round 1! Easy peasy!', 'Getting warmer! Can you remember?', '3 puffs! Your short-term memory is being tested!',
  '4 in a row! Not bad!', '5 puffs! Simon is impressed!', '6?! Your brain is on FIRE!',
  '7 puffs! Are you even human?!', '8! This is INSANE!', '9 PUFFS! You\'re a LEGEND!', '10! SIMON MASTER!',
]

const getPuffType = (dur: number): 'short' | 'medium' | 'long' => {
  if (dur < 1.2) return 'short'
  if (dur < 3.0) return 'medium'
  return 'long'
}
const typeColor = (t: string) => t === 'short' ? C.cyan : t === 'medium' ? C.gold : C.pink
const typeLabel = (t: string) => t === 'short' ? 'SHORT' : t === 'medium' ? 'MEDIUM' : 'LONG'

type GamePhase = 'intro' | 'watch' | 'repeat' | 'result'

export default function SimonPuffsStage() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<GamePhase>('intro')
  const [sequence, setSequence] = useState<Array<'short' | 'medium' | 'long'>>([])
  const [userSeq, setUserSeq] = useState<Array<'short' | 'medium' | 'long'>>([])
  const [watching, setWatching] = useState(-1)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [failed, setFailed] = useState(false)
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<GamePhase>('intro')
  const sequenceRef = useRef<Array<'short' | 'medium' | 'long'>>([])
  const userSeqRef = useRef<Array<'short' | 'medium' | 'long'>>([])
  const puffStartRef = useRef(0)
  const roundRef = useRef(0)
  const scoreRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { sequenceRef.current = sequence }, [sequence])
  useEffect(() => { userSeqRef.current = userSeq }, [userSeq])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])

  const addRound = useCallback((prevSeq: Array<'short' | 'medium' | 'long'>, rnd: number) => {
    const types: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long']
    const newType = types[Math.floor(Math.random() * 3)]
    const newSeq = [...prevSeq, newType]
    setSequence(newSeq); sequenceRef.current = newSeq
    setUserSeq([]); userSeqRef.current = []
    setRound(rnd); roundRef.current = rnd
    setWatching(0)
    setPhase('watch'); phaseRef.current = 'watch'
    setCommentary(SP_COMEDY[Math.min(rnd - 1, SP_COMEDY.length - 1)])

    // Play the sequence with delays
    newSeq.forEach((t, i) => {
      setTimeout(() => {
        setWatching(i)
        playFx('tap')
        setTimeout(() => {
          setWatching(-1)
          if (i === newSeq.length - 1) {
            setTimeout(() => {
              setPhase('repeat'); phaseRef.current = 'repeat'
              setCommentary('YOUR TURN! Repeat the sequence!')
            }, 500)
          }
        }, t === 'short' ? 400 : t === 'medium' ? 800 : 1400)
      }, i * 1600 + 500)
    })
  }, [playFx])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'repeat') return
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (phaseRef.current !== 'repeat' || !puffStartRef.current) return
    const dur = (Date.now() - puffStartRef.current) / 1000
    puffStartRef.current = 0
    const puffType = getPuffType(dur)
    const expected = sequenceRef.current[userSeqRef.current.length]
    const correct = puffType === expected
    const newUserSeq = [...userSeqRef.current, puffType]
    setUserSeq(newUserSeq); userSeqRef.current = newUserSeq

    if (!correct) {
      setFailed(true)
      setPhase('result'); phaseRef.current = 'result'
      setCommentary(`Wrong! Expected ${typeLabel(expected)}, got ${typeLabel(puffType)}`)
      playFx('lose')
      awardGame({ won: scoreRef.current >= 3, baseCoins: scoreRef.current >= 3 ? 30 : 0, baseXP: scoreRef.current >= 3 ? 20 : 8 })
    } else {
      playFx('select')
      if (newUserSeq.length === sequenceRef.current.length) {
        const newScore = scoreRef.current + roundRef.current * 10
        setScore(newScore); scoreRef.current = newScore
        setCommentary(`PERFECT! Round ${roundRef.current} complete! +${roundRef.current * 10}`)
        playFx('crowd')
        if (roundRef.current >= 10) {
          setPhase('result'); phaseRef.current = 'result'
          setFailed(false)
          awardGame({ won: true, baseCoins: 50, baseXP: 20 })
        } else {
          setTimeout(() => addRound(sequenceRef.current, roundRef.current + 1), 1500)
        }
      }
    }
  }, [playFx, awardGame, addRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    setSequence([]); sequenceRef.current = []
    setUserSeq([]); userSeqRef.current = []
    setRound(0); roundRef.current = 0
    setScore(0); scoreRef.current = 0
    setFailed(false); setWatching(-1)
    setPhase('intro'); phaseRef.current = 'intro'
    playFx('crowd')
    setCommentary('Watch the sequence, then repeat it!')
    setTimeout(() => addRound([], 1), 1500)
  }, [playFx, addRound])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0a050f' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 16px 20px', gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 3, color: C.red }}>🔴 SIMON PUFFS</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>SCORE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.red }}>{round}/10</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {/* Sequence display */}
        {(phase === 'watch' || phase === 'repeat') && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
            {sequence.map((t, i) => {
              const isActive = phase === 'watch' && watching === i
              const isUserDone = phase === 'repeat' && i < userSeq.length
              const isCorrect = isUserDone && userSeq[i] === t
              return (
                <div key={i} style={{ width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: isActive ? typeColor(t) + '40' : isUserDone ? (isCorrect ? typeColor(t) + '30' : '#ef444430') : 'rgba(255,255,255,0.05)', border: `2px solid ${isActive ? typeColor(t) : isUserDone ? (isCorrect ? typeColor(t) : '#ef4444') : 'rgba(255,255,255,0.1)'}`, color: isActive ? typeColor(t) : isUserDone ? (isCorrect ? typeColor(t) : '#ef4444') : C.text3, transition: 'all 0.2s' }}>
                  {isActive ? typeLabel(t) : isUserDone ? (isCorrect ? '✓' : '✗') : '?'}
                </div>
              )
            })}
          </div>
        )}

        {/* Puff type indicators */}
        <div style={{ display: 'flex', gap: 12 }}>
          {(['short', 'medium', 'long'] as const).map(t => (
            <div key={t} style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: typeColor(t) + '15', border: `1px solid ${typeColor(t)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: typeColor(t) }}>{typeLabel(t)}</div>
              <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{t === 'short' ? '<1.2s' : t === 'medium' ? '1.2-3s' : '>3s'}</div>
            </div>
          ))}
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔴</div>
            <div style={{ fontSize: 12, color: C.text3 }}>Watch the puff sequence, then repeat!</div>
          </div>
        )}

        {phase === 'watch' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.text2, fontWeight: 700 }}>👀 WATCH THE SEQUENCE</div>
          </div>
        )}

        {phase === 'repeat' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.cyan, fontWeight: 800, animation: 'pulse 1.5s infinite' }}>💨 YOUR TURN! ({userSeq.length}/{sequence.length})</div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{!failed ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: !failed ? C.gold : C.red }}>{!failed ? 'SIMON MASTER!' : 'GAME OVER'}</div>
            <div style={{ fontSize: 14, color: C.text3, marginTop: 4 }}>Round {round} · Score: {score}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 13, fontWeight: 800, color: C.red }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{commentary}</div>
      </div>
    </div>
  )
}
