import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'pick' | 'puffing' | 'reveal' | 'complete'

interface Prize { name: string; value: number; emoji: string; rarity: string; color: string }

const MB_PRIZES: Prize[] = [
  { name: '50 Coins',    value: 50,   emoji: '🪙', rarity: 'common',    color: C.cyan },
  { name: '100 Coins',   value: 100,  emoji: '💰', rarity: 'common',    color: C.green },
  { name: '200 Coins',   value: 200,  emoji: '💎', rarity: 'rare',      color: C.purple },
  { name: '500 Coins',   value: 500,  emoji: '🏆', rarity: 'rare',      color: C.gold },
  { name: 'Lucky Charm', value: 150,  emoji: '🍀', rarity: 'rare',      color: C.lime },
  { name: 'JACKPOT!',    value: 1000, emoji: '👑', rarity: 'legendary', color: C.gold },
  { name: 'Empty Box',   value: 0,    emoji: '📦', rarity: 'common',    color: C.text3 },
  { name: 'Blinker Badge', value: 100, emoji: '💀', rarity: 'rare',     color: C.red },
]

function randPrize() { return MB_PRIZES[Math.floor(Math.random() * MB_PRIZES.length)] }
function genBoxes() { return [randPrize(), randPrize(), randPrize()] }

export default function MysteryBox() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [boxes, setBoxes] = useState<Prize[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [prize, setPrize] = useState<Prize | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const pickedRef = useRef<number | null>(null)
  const boxesRef = useRef<Prize[]>([])
  const scoreRef = useRef(0)
  const roundRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { pickedRef.current = picked }, [picked])
  useEffect(() => { boxesRef.current = boxes }, [boxes])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { roundRef.current = round }, [round])

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1
    if (next >= 5) {
      setPhase('complete')
      awardGame({ won: scoreRef.current > 0, baseCoins: scoreRef.current > 0 ? 20 : 0, baseXP: scoreRef.current > 0 ? 20 : 8 })
      return
    }
    setRound(next); setBoxes(genBoxes()); setPicked(null); setPrize(null)
    setPhase('pick')
    setCommentary(`Round ${next + 1}/5 — Pick a box!`)
  }, [awardGame])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'puffing' || pickedRef.current === null) return
    puffStart.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (phaseRef.current !== 'puffing' || pickedRef.current === null || !puffStart.current) return
    const dur = (Date.now() - puffStart.current) / 1000
    puffStart.current = 0
    if (dur < 0.2) return

    const isBlinker = dur >= 4.5
    let p = boxesRef.current[pickedRef.current]

    if (isBlinker && p.rarity === 'common') {
      const rarePool = MB_PRIZES.filter(x => x.rarity !== 'common')
      p = rarePool[Math.floor(Math.random() * rarePool.length)]
      setCommentary('BLINKER UPGRADE! Rarity boosted!')
    }

    setPrize(p); setPhase('reveal'); playFx('select')

    if (p.rarity === 'legendary') {
      setCommentary(`LEGENDARY! ${p.emoji} ${p.name}!`); playFx('crowd')
    } else if (p.rarity === 'rare') {
      setCommentary(`Rare find! ${p.emoji} ${p.name}`)
    } else if (p.value > 0) {
      setCommentary(`${p.emoji} ${p.name} — nice!`)
    } else {
      setCommentary('Empty box... better luck next time!')
    }

    if (p.value > 0) setScore(s => s + p.value)
    setTimeout(() => nextRound(), 2500)
  }, [playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    const b = genBoxes()
    setBoxes(b); setPicked(null); setPrize(null); setRound(0); setScore(0); scoreRef.current = 0
    setPhase('intro')
    playFx('crowd')
    setCommentary('Mystery Box! Pick a box and puff to reveal!')
    setTimeout(() => setPhase('pick'), 1500)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPick = phase === 'pick'
  const isPuffing = phase === 'puffing'
  const isReveal = phase === 'reveal'
  const isComp = phase === 'complete'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1000 40%, #0d0a00 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.06), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 12, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #FFD700, #FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MYSTERY BOX</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🎁</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>MYSTERY BOX</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Pick a box, then puff to reveal!</div>
          </div>
        )}

        {(isPick || isPuffing) && (
          <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {isPick && <div style={{ fontSize: 13, color: C.text2 }}>TAP a box to select it</div>}
              {isPuffing && <div style={{ fontSize: 13, color: C.gold, animation: 'pulse 1.2s infinite' }}>PUFF to open Box {picked! + 1}! 💨</div>}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {boxes.map((_, i) => (
                <div
                  key={i}
                  data-btn="true"
                  onClick={() => {
                    if (phase !== 'pick') return
                    setPicked(i); setPhase('puffing'); playFx('select')
                    setCommentary(`Box ${i + 1} selected! HOLD to puff and open it!`)
                  }}
                  style={{ width: 90, height: 90, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: phase === 'pick' ? 'pointer' : 'default', background: picked === i ? `linear-gradient(135deg, ${C.gold}30, ${C.gold}10)` : 'rgba(255,255,255,0.04)', border: `2px solid ${picked === i ? C.gold : 'rgba(255,255,255,0.1)'}`, boxShadow: picked === i ? `0 0 20px ${C.gold}30` : 'none', transition: 'all 0.2s', fontSize: 36 }}>
                  🎁
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>Box {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isReveal && prize && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 80, marginBottom: 8, animation: 'goalBurst 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>{prize.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: prize.color }}>{prize.name}</div>
            {prize.value > 0 && <div style={{ fontSize: 16, color: C.gold, marginTop: 4 }}>+{prize.value} coins!</div>}
            <div style={{ fontSize: 10, color: prize.rarity === 'legendary' ? C.gold : prize.rarity === 'rare' ? C.purple : C.text3, marginTop: 4, fontWeight: 700 }}>{prize.rarity.toUpperCase()}</div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>ALL BOXES OPENED!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.30)', fontSize: 13, fontWeight: 800, color: C.gold }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
