import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'match' | 'prediction' | 'result' | 'complete'

interface Match { id: string; home: string; away: string; time: string; pool: [number, number, number]; group: string }

const MP_MATCHES: Match[] = [
  { id: 'mp1', home: '🇧🇷 Brazil',    away: '🇩🇪 Germany',     time: '3:00 PM',  pool: [65, 20, 15], group: 'F' },
  { id: 'mp2', home: '🇫🇷 France',    away: '🇦🇷 Argentina',   time: '9:00 PM',  pool: [40, 25, 35], group: 'C' },
  { id: 'mp3', home: '🇺🇸 USA',       away: '🇲🇽 Mexico',      time: '6:00 PM',  pool: [45, 30, 25], group: 'A' },
  { id: 'mp4', home: '🇪🇸 Spain',     away: '🇳🇱 Netherlands', time: '12:00 PM', pool: [50, 28, 22], group: 'B' },
  { id: 'mp5', home: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England',  away: '🇵🇹 Portugal',    time: '3:00 AM',  pool: [38, 32, 30], group: 'D' },
  { id: 'mp6', home: '🇮🇹 Italy',     away: '🇧🇪 Belgium',     time: '6:00 AM',  pool: [42, 30, 28], group: 'E' },
  { id: 'mp7', home: '🇯🇵 Japan',     away: '🇰🇷 South Korea', time: '9:00 AM',  pool: [35, 30, 35], group: 'G' },
  { id: 'mp8', home: '🇳🇬 Nigeria',   away: '🇨🇲 Cameroon',    time: '12:00 AM', pool: [40, 35, 25], group: 'H' },
]

export default function MatchPredictor() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [prediction, setPrediction] = useState<string | null>(null)
  const [results, setResults] = useState<{ correct: boolean }[]>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [used, setUsed] = useState<string[]>([])
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const roundRef = useRef(0)
  const scoreRef = useRef(0)
  const matchRef = useRef<Match | null>(null)
  const usedRef = useRef<string[]>([])

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { matchRef.current = match }, [match])
  useEffect(() => { usedRef.current = used }, [used])

  const nextRound = useCallback((currentRound: number, currentScore: number, currentUsed: string[]) => {
    const next = currentRound + 1
    if (next >= 5) {
      setPhase('complete')
      awardGame({ won: currentScore > 0, baseCoins: currentScore > 0 ? 20 : 0, baseXP: currentScore > 0 ? 20 : 8 })
      return
    }
    const shuffled = [...MP_MATCHES].sort(() => Math.random() - 0.5)
    const nextMatch = shuffled.find(m => !currentUsed.includes(m.id)) || shuffled[0]
    const newUsed = [...currentUsed, nextMatch.id]
    setUsed(newUsed); usedRef.current = newUsed
    setMatch(nextMatch); matchRef.current = nextMatch
    setPrediction(null); setRound(next)
    setPhase('match')
  }, [awardGame])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'match') return
    puffStart.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (phaseRef.current !== 'match') return
    const dur = (Date.now() - puffStart.current) / 1000
    let pred: string
    if (dur < 1.0) pred = 'home'
    else if (dur < 2.5) pred = 'draw'
    else pred = 'away'

    setPrediction(pred)
    setPhase('prediction')
    playFx('whistle')
    const label = pred === 'home' ? 'Home Win' : pred === 'draw' ? 'Draw' : 'Away Win'
    setCommentary(`You predict: ${label}!`)

    const m = matchRef.current!
    setTimeout(() => {
      const r = Math.random()
      const simResult = r < m.pool[0] / 100 ? 'home' : r < (m.pool[0] + m.pool[1]) / 100 ? 'draw' : 'away'
      const correct = simResult === pred
      const pts = correct ? 100 : 0

      setResults(prev => {
        const newResults = [...prev, { correct }]
        const newScore = scoreRef.current + pts
        setScore(newScore); scoreRef.current = newScore

        if (correct) { playFx('crowd'); setCommentary('Correct prediction! +20 coins!') }
        else {
          const rLabel = simResult === 'home' ? 'Home Win' : simResult === 'draw' ? 'Draw' : 'Away Win'
          setCommentary(`Not this time... result was: ${rLabel}`)
        }

        setPhase('result')
        setTimeout(() => nextRound(roundRef.current, newScore, usedRef.current), 2500)
        return newResults
      })
    }, 2000)
  }, [playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    const shuffled = [...MP_MATCHES].sort(() => Math.random() - 0.5)
    const firstMatch = shuffled[0]
    const initUsed = [firstMatch.id]
    setUsed(initUsed); usedRef.current = initUsed
    setMatch(firstMatch); matchRef.current = firstMatch
    setPrediction(null); setResults([]); setRound(0); setScore(0); scoreRef.current = 0
    setPhase('intro')
    playFx('crowd')
    setCommentary('Match Predictor! Call the winner!')
    setTimeout(() => setPhase('match'), 1500)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isMatch = phase === 'match'
  const isResult = phase === 'result'
  const isComp = phase === 'complete'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #060a18 0%, #0c1030 40%, #060a18 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 12, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MATCH PREDICTOR</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>PTS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>MATCH</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.green }}>{results.filter(r => r.correct).length}</div><div style={{ fontSize: 8, color: C.text3 }}>CORRECT</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 11, color: C.text3 }}>Short puff = Home | Medium = Draw | Long = Away</div>
          </div>
        )}

        {match && (isMatch || phase === 'prediction' || isResult) && (
          <div style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize: 9, color: C.text3, textAlign: 'center', marginBottom: 12 }}>GROUP {match.group} · {match.time}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{match.home.split(' ')[0]}</div>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{match.home.split(' ').slice(1).join(' ')}</div>
                <div style={{ fontSize: 8, color: C.text3 }}>{match.pool[0]}% win</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text3 }}>VS</div>
                <div style={{ fontSize: 9, color: C.text3 }}>{match.pool[1]}% draw</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{match.away.split(' ')[0]}</div>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{match.away.split(' ').slice(1).join(' ')}</div>
                <div style={{ fontSize: 8, color: C.text3 }}>{match.pool[2]}% win</div>
              </div>
            </div>

            {prediction && (
              <div style={{ marginTop: 12, textAlign: 'center', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: 12, color: C.cyan }}>
                Your pick: {prediction === 'home' ? '🏠 Home Win' : prediction === 'draw' ? '🤝 Draw' : '✈️ Away Win'}
              </div>
            )}
          </div>
        )}

        {isMatch && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}><div style={{ fontSize: 10, color: '#3B82F6' }}>HOME</div><div style={{ fontSize: 7, color: C.text3 }}>&lt;1s</div></div>
              <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><div style={{ fontSize: 10, color: C.text2 }}>DRAW</div><div style={{ fontSize: 7, color: C.text3 }}>1-2.5s</div></div>
              <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}><div style={{ fontSize: 10, color: C.red }}>AWAY</div><div style={{ fontSize: 7, color: C.text3 }}>&gt;2.5s</div></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#3B82F6', animation: 'pulse 1.5s infinite' }}>PUFF to predict! 📊</div>
          </div>
        )}

        {isResult && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: results[results.length - 1]?.correct ? C.green : C.red }}>
              {results[results.length - 1]?.correct ? '✅ CORRECT!' : '❌ WRONG'}
            </div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>DONE!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{results.filter(r => r.correct).length}/5 correct</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)', fontSize: 13, fontWeight: 800, color: '#3B82F6' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 4 }}>{commentary}</div>
      </div>
    </div>
  )
}
