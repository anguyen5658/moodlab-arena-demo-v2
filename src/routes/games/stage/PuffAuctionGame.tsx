import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

// Direct lift from monolith line 1186 + 16097
interface Prize { name: string; value: number; emoji: string; rarity: 'common' | 'rare' | 'legendary' }
const PA_PRIZES: Prize[] = [
  { name: '100 Coins', value: 100, emoji: '🪙', rarity: 'common' },
  { name: '200 Coins', value: 200, emoji: '💰', rarity: 'common' },
  { name: 'Rare Badge', value: 300, emoji: '🏅', rarity: 'rare' },
  { name: '500 Coins', value: 500, emoji: '💎', rarity: 'rare' },
  { name: 'MYSTERY BOX', value: 1000, emoji: '🎁', rarity: 'legendary' },
]
const PA_BLINKER_THRESHOLD = 5.0
const PA_DANGER_ZONE = 4.5

const SPECTATOR_NAMES = ['CloudMogul', 'BaronPuff', 'MoneyHaze', 'VibeKing', 'NeonQueen', 'BlazedPanda', 'PuffDaddy', 'ChillMaster42']

interface Bid { name: string; time: number; disqualified: boolean; isYou?: boolean }

type Phase = 'intro' | 'reveal' | 'bidding' | 'result' | 'final' | null

export const PuffAuctionGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [prize, setPrize] = useState<Prize | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [winner, setWinner] = useState<Bid | null>(null)
  const [disqualified, setDisqualified] = useState(false)
  const [holding, setHolding] = useState(false)
  const [bidTime, setBidTime] = useState(0)
  const [totalWon, setTotalWon] = useState(0)
  const [comment, setComment] = useState('')
  const [introStep, setIntroStep] = useState(0)

  const roundRef = useRef(0)
  useEffect(() => { roundRef.current = round }, [round])
  const totalWonRef = useRef(0)
  useEffect(() => { totalWonRef.current = totalWon }, [totalWon])
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const holdingRef = useRef(false)
  const puffStartRef = useRef(0)
  const puffIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimeouts = () => { timeoutsRef.current.forEach(t => clearTimeout(t)); timeoutsRef.current = [] }
  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const startRound = useCallback((rn: number) => {
    const pz = PA_PRIZES[Math.min(rn, PA_PRIZES.length - 1)]
    setRound(rn)
    setPrize(pz)
    setBids([])
    setWinner(null)
    setDisqualified(false)
    setHolding(false); holdingRef.current = false
    setBidTime(0)
    setPhase('reveal')
    setComment(`Round ${rn + 1}: ${pz.emoji} ${pz.name}!`)
    audio.playFx('tap')
    addTimeout(() => {
      setPhase('bidding')
      setComment(`Hold your puff... but stay under ${PA_BLINKER_THRESHOLD}s!`)
    }, 2000)
  }, [audio])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    clearTimeouts()
    setRound(0); roundRef.current = 0
    setBids([])
    setWinner(null)
    setDisqualified(false)
    setHolding(false); holdingRef.current = false
    setBidTime(0)
    setTotalWon(0); totalWonRef.current = 0
    setPrize(null)
    setComment('')
    setIntroStep(0)
    setPhase('intro')
    audio.playFx('crowd')
    addTimeout(() => setIntroStep(1), 400)
    addTimeout(() => setIntroStep(2), 1000)
    addTimeout(() => setIntroStep(3), 1800)
    addTimeout(() => { setIntroStep(4); audio.playFx('whistle') }, 2600)
    addTimeout(() => startRound(0), 3400)
  }, [audio, startRound])

  const finishRound = useCallback((myBid: Bid) => {
    const aiBids: Bid[] = []
    const numAi = 3 + Math.floor(Math.random() * 4)
    for (let i = 0; i < numAi; i++) {
      const aiDur = 1.5 + Math.random() * 3.2
      aiBids.push({
        name: SPECTATOR_NAMES[Math.floor(Math.random() * SPECTATOR_NAMES.length)],
        time: Math.min(aiDur, PA_BLINKER_THRESHOLD - 0.1),
        disqualified: aiDur >= PA_BLINKER_THRESHOLD,
      })
    }
    const allBids = [myBid, ...aiBids]
    const valid = allBids.filter(b => !b.disqualified).sort((a, b) => b.time - a.time)
    const dq = allBids.filter(b => b.disqualified)
    setBids([...valid, ...dq])
    const w = valid[0] || null
    setWinner(w)
    setPhase('result')
    audio.playFx('crowd')
    let lastWonValue = 0
    if (w && w.isYou && prize) {
      lastWonValue = prize.value
      setTotalWon(t => t + prize.value)
      player.spawnConfetti(30)
      audio.playFx('win')
      setComment(`SOLD to the champion puffer! +${prize.value} coins!`)
    } else if (myBid.disqualified) {
      setComment('The greed got you! DISQUALIFIED!')
    } else {
      setComment(`Better luck next round! Your bid: ${myBid.time.toFixed(2)}s`)
    }
    addTimeout(() => {
      if (roundRef.current < PA_PRIZES.length - 1) {
        startRound(roundRef.current + 1)
      } else {
        const finalTotal = totalWonRef.current + (w && w.isYou ? lastWonValue : 0)
        setPhase('final')
        audio.playFx(finalTotal > 0 ? 'win' : 'lose')
        player.recordGameResult(finalTotal > 0, finalTotal > 0 ? 60 : 10, finalTotal > 0 ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
      }
    }, 3000)
  }, [prize, audio, player, ble.bleConnected, game.gameActive, startRound])

  const finishRef = useRef(finishRound)
  useEffect(() => { finishRef.current = finishRound }, [finishRound])

  const startBid = useCallback(() => {
    if (phaseRef.current !== 'bidding' || holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    setBidTime(0)
    puffStartRef.current = Date.now()
    audio.playFx('tap')
    if (puffIntervalRef.current) clearInterval(puffIntervalRef.current)
    puffIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - puffStartRef.current) / 1000
      setBidTime(elapsed)
      if (elapsed >= PA_BLINKER_THRESHOLD) {
        if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
        holdingRef.current = false
        setHolding(false)
        setDisqualified(true)
        setBidTime(elapsed)
        audio.playFx('miss')
        setComment(`BLINKER! DISQUALIFIED! Over ${PA_BLINKER_THRESHOLD}s!`)
        addTimeout(() => finishRef.current({ name: 'You', time: elapsed, disqualified: true, isYou: true }), 1500)
      }
    }, 50)
  }, [audio])

  const endBid = useCallback(() => {
    if (!holdingRef.current) return
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    const dur = (Date.now() - puffStartRef.current) / 1000
    holdingRef.current = false
    setHolding(false)
    if (dur >= PA_BLINKER_THRESHOLD) return
    setBidTime(dur)
    finishRef.current({ name: 'You', time: dur, disqualified: false, isYou: true })
  }, [])

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
    if (game.gameActive?.id !== 'puffauction') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'puffauction') return
    ble.registerPuffHandlers('puffauction', () => startBid(), () => endBid())
    return () => {
      audio.gameSoundsMuted.current = true
      if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
      clearTimeouts()
      startedRef.current = false
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'puffauction') return null
  const dangerZone = bidTime >= PA_DANGER_ZONE
  const barColor = dangerZone ? C.red : bidTime > 3 ? C.orange : C.gold

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🔨 PUFF AUCTION"
        titleColor={C.gold}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round + 1}/${PA_PRIZES.length} · Won ${totalWon}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#2a1f08,#0a0804)' }}>
        {comment && (
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', fontSize: 9, color: C.gold, fontWeight: 700 }}>{comment}</div>
          </div>
        )}

        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 60, gap: 14 }}>
            <div style={{ fontSize: 56, opacity: introStep >= 1 ? 1 : 0, transition: 'opacity 0.4s' }}>🔨</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, opacity: introStep >= 2 ? 1 : 0, transition: 'opacity 0.4s' }}>PUFF AUCTION</div>
            <div style={{ fontSize: 11, color: C.text2, opacity: introStep >= 3 ? 1 : 0, transition: 'opacity 0.4s', textAlign: 'center' }}>Longest puff wins... but don't BLINKER!</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.red, opacity: introStep >= 4 ? 1 : 0, transition: 'opacity 0.4s' }}>5.0s = DISQUALIFIED</div>
          </div>
        )}

        {(phase === 'reveal' || phase === 'bidding' || phase === 'result') && prize && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 44, paddingBottom: 60, gap: 12 }}>
            <div style={{ width: '100%', maxWidth: 340, padding: 18, borderRadius: 16, background: prize.rarity === 'legendary' ? `${C.gold}20` : prize.rarity === 'rare' ? `${C.purple}15` : `${C.cyan}12`, border: `2px solid ${prize.rarity === 'legendary' ? C.gold : prize.rarity === 'rare' ? C.purple : C.cyan}40`, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 4 }}>{prize.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: prize.rarity === 'legendary' ? C.gold : prize.rarity === 'rare' ? C.purple : C.cyan }}>{prize.name}</div>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 2, marginTop: 2 }}>{prize.rarity.toUpperCase()}</div>
            </div>

            {phase === 'bidding' && (
              <>
                <div style={{ fontSize: 42, fontWeight: 900, color: barColor, fontFamily: "'Courier New',monospace" }}>{bidTime.toFixed(2)}s</div>
                <div style={{ width: '100%', maxWidth: 300, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (bidTime / PA_BLINKER_THRESHOLD) * 100)}%`, height: '100%', background: barColor, transition: 'width 0.05s, background 0.2s' }} />
                </div>
                {dangerZone && !disqualified && <div style={{ fontSize: 11, color: C.red, fontWeight: 900, animation: 'pulse 0.5s infinite' }}>⚠️ DANGER ZONE — RELEASE NOW!</div>}
                <div
                  onMouseDown={(e) => { e.preventDefault(); startBid() }}
                  onMouseUp={(e) => { e.preventDefault(); endBid() }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startBid() }}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); endBid() }}
                  onTouchCancel={(e) => { e.stopPropagation(); e.preventDefault(); endBid() }}
                  style={{ padding: '18px 32px', borderRadius: 60, cursor: 'pointer', background: holding ? `${barColor}30` : `${C.gold}22`, border: `2px solid ${holding ? barColor : C.gold}70`, fontSize: 14, fontWeight: 900, color: holding ? barColor : C.gold, touchAction: 'none', userSelect: 'none' }}
                >
                  {holding ? `💨 BIDDING... ${bidTime.toFixed(1)}s` : '💨 HOLD TO BID'}
                </div>
              </>
            )}

            {phase === 'result' && bids.length > 0 && (
              <div style={{ width: '100%', maxWidth: 340 }}>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>{winner ? `WINNER: ${winner.name} · ${winner.time.toFixed(2)}s` : 'NO WINNER'}</div>
                {bids.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', marginBottom: 3, borderRadius: 8, background: b.isYou ? `${C.cyan}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 && !b.disqualified ? C.gold + '40' : b.isYou ? C.cyan + '25' : 'rgba(255,255,255,0.05)'}`, opacity: b.disqualified ? 0.5 : 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: i === 0 && !b.disqualified ? C.gold : C.text3, width: 18 }}>{b.disqualified ? '💀' : `#${i + 1}`}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: b.isYou ? C.cyan : '#fff', flex: 1 }}>{b.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: b.disqualified ? C.red : C.gold, fontFamily: 'monospace' }}>{b.time.toFixed(2)}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'final' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, background: 'rgba(4,8,18,0.92)', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{totalWon > 0 ? '🏆' : '🔨'}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: totalWon > 0 ? C.gold : C.text2, marginBottom: 6 }}>AUCTION COMPLETE</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>Total value won: {totalWon}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
