import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'pick' | 'reveal' | 'summary'

interface Question { q: string; cat: string; emoji: string; type: 'yn' | 'ab'; a?: string; b?: string }

const DP_QUESTIONS: Question[] = [
  { q: 'Will the top trending TikTok today be about food?', cat: 'morning', emoji: '🌅', type: 'yn' },
  { q: 'Will Gold price go up today?', cat: 'morning', emoji: '🌅', type: 'yn' },
  { q: 'Morning mood: Coffee or Green Tea?', cat: 'morning', emoji: '🌅', type: 'ab', a: 'Coffee', b: 'Green Tea' },
  { q: 'Will the most-streamed Spotify song today be hip-hop?', cat: 'afternoon', emoji: '☀️', type: 'yn' },
  { q: 'Afternoon sesh: Indica or Sativa?', cat: 'afternoon', emoji: '☀️', type: 'ab', a: 'Indica', b: 'Sativa' },
  { q: 'Will any crypto gain more than 5% today?', cat: 'afternoon', emoji: '☀️', type: 'yn' },
  { q: "Will tonight's biggest sports upset actually happen?", cat: 'night', emoji: '🌙', type: 'yn' },
  { q: 'Night strain pick: Edibles or Flower?', cat: 'night', emoji: '🌙', type: 'ab', a: 'Edibles', b: 'Flower' },
  { q: 'Will a viral meme break 1M shares tonight?', cat: 'night', emoji: '🌙', type: 'yn' },
  { q: 'Will the late-night game go to overtime?', cat: 'morning', emoji: '🌅', type: 'yn' },
  { q: 'Best wake-and-bake: Joint or Vape?', cat: 'morning', emoji: '🌅', type: 'ab', a: 'Joint', b: 'Vape' },
  { q: 'Will the stock market close green today?', cat: 'afternoon', emoji: '☀️', type: 'yn' },
  { q: 'Will any team score 5+ goals in tonight\'s matches?', cat: 'night', emoji: '🌙', type: 'yn' },
  { q: 'Late night munchies: Pizza or Tacos?', cat: 'night', emoji: '🌙', type: 'ab', a: 'Pizza', b: 'Tacos' },
  { q: "Will tomorrow's weather be better than today?", cat: 'morning', emoji: '🌅', type: 'yn' },
]

export default function DailyPicks() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [picks, setPicks] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [results, setResults] = useState<{ q: Question; ans: string; correct: boolean; pts: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const currentIdxRef = useRef(0)
  const streakRef = useRef(0)
  const picksRef = useRef<Question[]>([])
  const resultsRef = useRef<typeof results>([])

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { currentIdxRef.current = currentIdx }, [currentIdx])
  useEffect(() => { streakRef.current = streak }, [streak])
  useEffect(() => { picksRef.current = picks }, [picks])
  useEffect(() => { resultsRef.current = results }, [results])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'pick') return
    puffStart.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (phaseRef.current !== 'pick') return
    const dur = (Date.now() - puffStart.current) / 1000
    const pick = picksRef.current[currentIdxRef.current]
    let ans: string
    if (pick.type === 'yn') ans = dur < 1.5 ? 'no' : 'yes'
    else ans = dur < 1.5 ? pick.a! : pick.b!

    setAnswer(ans); setPhase('reveal'); playFx('tap')

    const correct = Math.random() > 0.4
    const mult = streakRef.current >= 30 ? 10 : streakRef.current >= 14 ? 5 : streakRef.current >= 7 ? 3 : 1
    const pts = correct ? 50 * mult : 0

    setTimeout(() => {
      const newResult = { q: pick, ans, correct, pts }
      const newResults = [...resultsRef.current, newResult]
      setResults(newResults); resultsRef.current = newResults

      if (correct) {
        const newStreak = streakRef.current + 1
        setStreak(newStreak); streakRef.current = newStreak
        setCommentary(mult > 1 ? `Streak bonus! ${mult}x! +${pts} coins!` : `Correct! +${pts} coins!`)
        playFx('crowd')
      } else {
        setStreak(0); streakRef.current = 0
        setCommentary('Not this time... streak reset!')
      }

      if (currentIdxRef.current < 2) {
        setTimeout(() => {
          setCurrentIdx(c => c + 1)
          setAnswer(null)
          setPhase('pick')
        }, 1500)
      } else {
        setTimeout(() => {
          const wins = newResults.filter(r => r.correct).length
          setPhase('summary')
          awardGame({ won: wins > 0, baseCoins: wins > 0 ? 20 : 0, baseXP: wins > 0 ? 20 : 8 })
        }, 1500)
      }
    }, 1500)
  }, [playFx, awardGame])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    const shuffled = [...DP_QUESTIONS].sort(() => Math.random() - 0.5)
    const p = [
      shuffled.find(q => q.cat === 'morning') || shuffled[0],
      shuffled.find(q => q.cat === 'afternoon') || shuffled[1],
      shuffled.find(q => q.cat === 'night') || shuffled[2],
    ]
    setPicks(p); picksRef.current = p
    setCurrentIdx(0); currentIdxRef.current = 0
    setAnswer(null); setResults([]); resultsRef.current = []
    setPhase('intro')
    playFx('crowd')
    setCommentary('Daily Picks! 3 predictions, build your streak!')
    setTimeout(() => setPhase('pick'), 1500)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPick = phase === 'pick'
  const isReveal = phase === 'reveal'
  const isSummary = phase === 'summary'
  const currentPick = picks[currentIdx]
  const totalPts = results.reduce((s, r) => s + r.pts, 0)

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0800 0%, #1a1200 40%, #0a0a00 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(249,115,22,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 12, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DAILY PICKS</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{totalPts}</div><div style={{ fontSize: 8, color: C.text3 }}>PTS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.orange }}>{streak}</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{currentIdx + 1}/3</div><div style={{ fontSize: 8, color: C.text3 }}>PICK</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 11, color: C.text3 }}>Short puff = NO/A · Long puff = YES/B</div>
          </div>
        )}

        {(isPick || isReveal) && currentPick && (
          <div style={{ width: '100%', padding: 20, borderRadius: 16, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>{currentPick.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>{currentPick.q}</div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {currentPick.type === 'yn' ? (
                <>
                  <div style={{ padding: '8px 20px', borderRadius: 10, background: answer === 'no' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)', border: `1px solid ${answer === 'no' ? C.red : 'rgba(239,68,68,0.2)'}`, fontSize: 14, fontWeight: 700, color: C.red }}>NO</div>
                  <div style={{ padding: '8px 20px', borderRadius: 10, background: answer === 'yes' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.06)', border: `1px solid ${answer === 'yes' ? C.green : 'rgba(34,197,94,0.2)'}`, fontSize: 14, fontWeight: 700, color: C.green }}>YES</div>
                </>
              ) : (
                <>
                  <div style={{ padding: '8px 16px', borderRadius: 10, background: answer === currentPick.a ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.06)', border: `1px solid ${answer === currentPick.a ? '#3B82F6' : 'rgba(59,130,246,0.2)'}`, fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>{currentPick.a}</div>
                  <div style={{ padding: '8px 16px', borderRadius: 10, background: answer === currentPick.b ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.06)', border: `1px solid ${answer === currentPick.b ? C.orange : 'rgba(249,115,22,0.2)'}`, fontSize: 13, fontWeight: 700, color: C.orange }}>{currentPick.b}</div>
                </>
              )}
            </div>

            {isPick && (
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: C.orange, animation: 'pulse 1.5s infinite', fontWeight: 700 }}>
                {currentPick.type === 'yn' ? 'Short=NO · Long=YES' : `Short=${currentPick.a} · Long=${currentPick.b}`}
              </div>
            )}
          </div>
        )}

        {isSummary && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease', width: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, marginBottom: 8 }}>PICKS COMPLETE!</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, width: '100%' }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: r.correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${r.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <span style={{ fontSize: 10, color: C.text2 }}>{r.q.q.slice(0, 30)}...</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: r.correct ? C.green : C.red }}>{r.correct ? `+${r.pts}` : '✗'}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 12 }}>Total: {totalPts} pts</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)', fontSize: 13, fontWeight: 800, color: C.orange }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 4 }}>{commentary}</div>
      </div>
    </div>
  )
}
