import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

// Shared hook for boilerplate: lifecycle, exit, collect
function useOracleGame(id: string) {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const startedRef = useRef(false)
  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    game.exitGame()
  }, [audio, game])
  useEffect(() => {
    if (game.gameActive?.id !== id) return
    ble.registerPuffHandlers(id, null, null)
    return () => { ble.registerPuffHandlers(null, null, null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])
  return { game, player, ble, audio, startedRef, exitGame }
}

// ═══════════════════════════════════════════════════════════
// DAILY PICKS — 3 daily yes/no predictions with streak bonus
// ═══════════════════════════════════════════════════════════
// Direct lift from monolith line 388
const DAILY_QUESTIONS = [
  '🌅 Will the top trending TikTok today be about food?',
  '🌅 Will Gold price go up today?',
  '☀️ Will the most-streamed Spotify song today be hip-hop?',
  '☀️ Will any crypto gain more than 5% today?',
  "🌙 Will tonight's biggest sports upset actually happen?",
  '🌙 Will a viral meme break 1M shares tonight?',
  '🌅 Will the late-night game go to overtime?',
  '☀️ Will the stock market close green today?',
  "🌙 Will any team score 5+ goals in tonight's matches?",
  '🌅 Will tomorrow be warmer than today?',
  '☀️ Will a celebrity drop surprise news today?',
  '🌙 Will someone set a new world record tonight?',
]

export const DailyPicksGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('dailypicks')
  const [phase, setPhase] = useState<'pick' | 'reveal' | 'final' | null>(null)
  const [round, setRound] = useState(0)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<'yes' | 'no' | null>(null)
  const [result, setResult] = useState<'yes' | 'no' | null>(null)
  const [correct, setCorrect] = useState(0)

  const next = useCallback(() => {
    setQ(DAILY_QUESTIONS[Math.floor(Math.random() * DAILY_QUESTIONS.length)])
    setPick(null); setResult(null); setPhase('pick')
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'dailypicks') return
    startedRef.current = true
    audio.gameSoundsMuted.current = false
    setRound(0); setCorrect(0); next()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (p: 'yes' | 'no') => {
    if (phase !== 'pick') return
    setPick(p)
    const actual = Math.random() < 0.5 ? 'yes' : 'no'
    setResult(actual)
    setPhase('reveal')
    if (actual === p) { setCorrect(c => c + 1); audio.playFx('win') } else audio.playFx('miss')
    setTimeout(() => {
      const nr = round + 1
      if (nr >= 3) setPhase('final')
      else { setRound(nr); next() }
    }, 1600)
  }

  const collect = () => {
    const reward = 15 + correct * 15 + (correct === 3 ? 20 : 0)
    player.notify(`📅 ${correct}/3 · +${reward}`, correct >= 2 ? C.green : C.gold)
    player.recordGameResult(correct >= 2, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'dailypicks') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="📅 DAILY PICKS" titleColor="#F97316" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`${round + 1}/3 · ${correct}✓`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#3a1f0a,#0a0604)' }}>
        {phase !== 'final' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 18, justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2 }}>PICK {round + 1} OF 3</div>
            <div style={{ padding: 20, borderRadius: 16, background: '#F9731612', border: '2px solid #F9731640', fontSize: 16, fontWeight: 800, color: '#fff', textAlign: 'center', maxWidth: 340 }}>{q}</div>
            <div style={{ display: 'flex', gap: 14 }}>
              {(['yes', 'no'] as const).map(v => {
                const isPicked = pick === v
                const isRight = phase === 'reveal' && result === v
                const isWrong = phase === 'reveal' && isPicked && result !== v
                const bg = isRight ? `${C.green}25` : isWrong ? `${C.red}25` : isPicked ? '#F9731625' : '#F9731612'
                const br = isRight ? C.green : isWrong ? C.red : '#F97316'
                return (
                  <div key={v} onClick={() => submit(v)} style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: bg, border: `2px solid ${br}50`, fontSize: 16, fontWeight: 900, color: '#fff', touchAction: 'none' }}>
                    {v === 'yes' ? '✓ YES' : '✕ NO'}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {phase === 'final' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{correct === 3 ? '🏆' : '📅'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.orange, marginBottom: 6 }}>DAILY DONE</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>{correct}/3 correct</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PUFF BLACKJACK — simplified 21
// ═══════════════════════════════════════════════════════════
const cardValue = (v: number) => v > 10 ? 10 : v === 1 ? 11 : v
const drawCard = () => Math.floor(Math.random() * 13) + 1
const cardDisplay = (v: number) => v === 1 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v)

export const PuffBlackjackGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('puffblackjack')
  const [phase, setPhase] = useState<'playing' | 'dealer' | 'result' | null>(null)
  const [playerCards, setPlayerCards] = useState<number[]>([])
  const [dealerCards, setDealerCards] = useState<number[]>([])
  const [outcome, setOutcome] = useState<'win' | 'lose' | 'push' | 'bust' | null>(null)

  const totalVal = (cs: number[]) => {
    let t = cs.reduce((s, c) => s + cardValue(c), 0)
    let aces = cs.filter(c => c === 1).length
    while (t > 21 && aces > 0) { t -= 10; aces-- }
    return t
  }

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setPlayerCards([drawCard(), drawCard()])
    setDealerCards([drawCard()])
    setOutcome(null); setPhase('playing')
  }, [audio])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'puffblackjack') return
    startedRef.current = true; start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hit = () => {
    if (phase !== 'playing') return
    const next = [...playerCards, drawCard()]
    setPlayerCards(next)
    audio.playFx('tap')
    if (totalVal(next) > 21) { setOutcome('bust'); setPhase('result'); audio.playFx('lose') }
  }

  const stand = () => {
    if (phase !== 'playing') return
    setPhase('dealer')
    const dCards = [...dealerCards]
    while (totalVal(dCards) < 17) dCards.push(drawCard())
    setDealerCards(dCards)
    const pT = totalVal(playerCards)
    const dT = totalVal(dCards)
    let out: 'win' | 'lose' | 'push' = 'push'
    if (dT > 21 || pT > dT) out = 'win'
    else if (pT < dT) out = 'lose'
    setTimeout(() => {
      setOutcome(out); setPhase('result')
      audio.playFx(out === 'win' ? 'win' : out === 'lose' ? 'lose' : 'select')
      if (out === 'win') player.spawnConfetti(20)
    }, 1000)
  }

  const collect = () => {
    const won = outcome === 'win'
    const reward = won ? 50 : outcome === 'push' ? 20 : 10
    player.notify(`🃏 ${outcome?.toUpperCase()} · +${reward}`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'puffblackjack') return null
  const pT = totalVal(playerCards)
  const dT = totalVal(dealerCards)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🃏 PUFF BLACKJACK" titleColor="#22C55E" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#0a2a18,#0a1408)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 24 }}>
          <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>DEALER — {phase === 'playing' ? '?' : dT}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {dealerCards.map((c, i) => (
                <div key={i} style={{ width: 60, height: 84, borderRadius: 8, background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                  {phase === 'playing' && i > 0 ? '?' : cardDisplay(c)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>YOU — {pT}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {playerCards.map((c, i) => (
                <div key={i} style={{ width: 60, height: 84, borderRadius: 8, background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                  {cardDisplay(c)}
                </div>
              ))}
            </div>
          </div>
          {phase === 'playing' && (
            <div style={{ display: 'flex', gap: 14 }}>
              <div onClick={hit} style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: '#22C55E20', border: '2px solid #22C55E50', fontSize: 15, fontWeight: 900, color: '#22C55E', touchAction: 'none' }}>HIT</div>
              <div onClick={stand} style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: '#EF444420', border: '2px solid #EF444450', fontSize: 15, fontWeight: 900, color: '#EF4444', touchAction: 'none' }}>STAND</div>
            </div>
          )}
          {phase === 'result' && outcome && (
            <>
              <div style={{ fontSize: 28, fontWeight: 900, color: outcome === 'win' ? C.green : outcome === 'lose' || outcome === 'bust' ? C.red : C.gold }}>
                {outcome === 'win' ? 'YOU WIN!' : outcome === 'bust' ? 'BUST!' : outcome === 'lose' ? 'DEALER WINS' : 'PUSH'}
              </div>
              <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CRAPS & CLOUDS — roll 2 dice, predict over/under/exact 7
// ═══════════════════════════════════════════════════════════
export const CrapsNCloudsGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('crapsnclouds')
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'reveal' | null>(null)
  const [dice, setDice] = useState<[number, number]>([1, 1])
  const [bet, setBet] = useState<'under' | 'seven' | 'over' | null>(null)
  const [won, setWon] = useState(0)
  const [rolls, setRolls] = useState(0)
  const rollIntRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'crapsnclouds') return
    startedRef.current = true
    audio.gameSoundsMuted.current = false
    setPhase('idle'); setWon(0); setRolls(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const roll = (b: 'under' | 'seven' | 'over') => {
    if (phase !== 'idle') return
    setBet(b); setPhase('rolling'); setRolls(r => r + 1)
    audio.playFx('charge')
    if (rollIntRef.current) clearInterval(rollIntRef.current)
    rollIntRef.current = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])
    }, 80)
    setTimeout(() => {
      if (rollIntRef.current) { clearInterval(rollIntRef.current); rollIntRef.current = null }
      const d1 = Math.floor(Math.random() * 6) + 1
      const d2 = Math.floor(Math.random() * 6) + 1
      setDice([d1, d2])
      const total = d1 + d2
      const correct = (b === 'under' && total < 7) || (b === 'seven' && total === 7) || (b === 'over' && total > 7)
      const payout = correct ? (b === 'seven' ? 50 : 20) : 0
      setWon(w => w + payout)
      if (correct) { audio.playFx('win'); player.spawnConfetti(20) } else audio.playFx('lose')
      setPhase('reveal')
    }, 1400)
  }

  const again = () => { setBet(null); setPhase('idle') }
  const collect = () => {
    const reward = Math.max(10, won)
    player.notify(`🎲 Won ${won} over ${rolls} rolls · +${reward}`, won > 0 ? C.green : C.gold)
    player.recordGameResult(won > 0, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'crapsnclouds') return null
  const total = dice[0] + dice[1]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🎲 CRAPS & CLOUDS" titleColor="#EF4444" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`Won: ${won}`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#2a0a0a,#0a0404)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 20, justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {dice.map((d, i) => (
              <div key={i} style={{ width: 90, height: 90, borderRadius: 16, background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 900, boxShadow: '0 0 20px #EF444460', animation: phase === 'rolling' ? 'shake 0.12s infinite' : 'none' }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: C.text3 }}>Total: <span style={{ fontWeight: 900, color: '#fff', fontSize: 18 }}>{total}</span></div>
          {phase === 'idle' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%', maxWidth: 360 }}>
              <div onClick={() => roll('under')} style={{ padding: '14px 4px', borderRadius: 12, cursor: 'pointer', background: '#EF444420', border: '2px solid #EF444450', fontSize: 11, fontWeight: 900, color: '#EF4444', textAlign: 'center', touchAction: 'none' }}>&lt; 7<br /><span style={{ fontSize: 8, opacity: 0.7 }}>2x</span></div>
              <div onClick={() => roll('seven')} style={{ padding: '14px 4px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}20`, border: `2px solid ${C.gold}50`, fontSize: 11, fontWeight: 900, color: C.gold, textAlign: 'center', touchAction: 'none' }}>= 7<br /><span style={{ fontSize: 8, opacity: 0.7 }}>5x</span></div>
              <div onClick={() => roll('over')} style={{ padding: '14px 4px', borderRadius: 12, cursor: 'pointer', background: `${C.green}20`, border: `2px solid ${C.green}50`, fontSize: 11, fontWeight: 900, color: C.green, textAlign: 'center', touchAction: 'none' }}>&gt; 7<br /><span style={{ fontSize: 8, opacity: 0.7 }}>2x</span></div>
            </div>
          )}
          {phase === 'reveal' && bet && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: won > 0 && ((bet === 'under' && total < 7) || (bet === 'seven' && total === 7) || (bet === 'over' && total > 7)) ? C.green : C.red }}>
                {(bet === 'under' && total < 7) || (bet === 'seven' && total === 7) || (bet === 'over' && total > 7) ? 'WIN!' : 'LOSE'}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div onClick={again} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: '#EF444415', border: '1px solid #EF444430', fontSize: 13, fontWeight: 800, color: '#EF4444', touchAction: 'none' }}>Roll again</div>
                <div onClick={collect} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MYSTERY BOX — pick 1 of 3 boxes
// ═══════════════════════════════════════════════════════════
const BOX_PRIZES = [
  { emoji: '🪙', label: '+20 coins', value: 20 },
  { emoji: '💰', label: '+50 coins', value: 50 },
  { emoji: '💎', label: '+100 coins', value: 100 },
  { emoji: '🧨', label: 'Bust!', value: 5 },
  { emoji: '🎁', label: '+75 coins', value: 75 },
]

export const MysteryBoxGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('mysterybox')
  const [phase, setPhase] = useState<'pick' | 'reveal' | null>(null)
  const [boxes, setBoxes] = useState<{ emoji: string; label: string; value: number }[]>([])
  const [picked, setPicked] = useState<number | null>(null)

  const setup = useCallback(() => {
    audio.gameSoundsMuted.current = false
    const shuffled = [...BOX_PRIZES].sort(() => Math.random() - 0.5).slice(0, 3)
    setBoxes(shuffled); setPicked(null); setPhase('pick')
  }, [audio])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'mysterybox') return
    startedRef.current = true; setup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickBox = (i: number) => {
    if (phase !== 'pick') return
    setPicked(i); setPhase('reveal')
    const prize = boxes[i]
    audio.playFx(prize.value >= 50 ? 'win' : prize.value >= 20 ? 'success' : 'miss')
    if (prize.value >= 50) player.spawnConfetti(30)
  }

  const collect = () => {
    const prize = picked !== null ? boxes[picked] : null
    const reward = prize?.value ?? 10
    player.notify(`🎁 ${prize?.label ?? 'done'} · +${reward}`, reward >= 50 ? C.gold : C.text2)
    player.recordGameResult(reward >= 50, reward, 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'mysterybox') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🎁 MYSTERY BOX" titleColor="#FFD700" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#3a2a0a,#0a0800)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 24, justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: C.text3, letterSpacing: 2 }}>PICK A BOX</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {boxes.map((b, i) => {
              const isOpen = phase === 'reveal' && picked === i
              return (
                <div key={i} onClick={() => pickBox(i)} style={{ width: 90, height: 110, borderRadius: 14, cursor: phase === 'pick' ? 'pointer' : 'default', background: isOpen ? `${C.gold}25` : '#FFD70015', border: `3px solid ${isOpen ? C.gold : '#FFD70050'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 50, touchAction: 'none', boxShadow: isOpen ? `0 0 24px ${C.gold}` : 'none' }}>
                  {isOpen ? b.emoji : '🎁'}
                </div>
              )
            })}
          </div>
          {phase === 'reveal' && picked !== null && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: boxes[picked].value >= 50 ? C.gold : boxes[picked].value >= 20 ? C.green : C.red }}>
                {boxes[picked].label}
              </div>
              <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SCRATCH & PUFF — 6 scratch tiles, match 3 wins
// ═══════════════════════════════════════════════════════════
export const ScratchPuffGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('scratchpuff')
  const [phase, setPhase] = useState<'playing' | 'result' | null>(null)
  const [tiles, setTiles] = useState<{ symbol: string; revealed: boolean }[]>([])
  const [won, setWon] = useState(false)

  const setup = useCallback(() => {
    audio.gameSoundsMuted.current = false
    const symbols = ['🌿', '💎', '🪙', '🔥', '🍀', '⭐']
    const deck: string[] = []
    // Ensure 25% chance of 3 matching
    if (Math.random() < 0.25) {
      const win = symbols[Math.floor(Math.random() * symbols.length)]
      deck.push(win, win, win)
      while (deck.length < 6) deck.push(symbols[Math.floor(Math.random() * symbols.length)])
    } else {
      while (deck.length < 6) deck.push(symbols[Math.floor(Math.random() * symbols.length)])
    }
    const shuffled = deck.sort(() => Math.random() - 0.5).map(s => ({ symbol: s, revealed: false }))
    setTiles(shuffled); setWon(false); setPhase('playing')
  }, [audio])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'scratchpuff') return
    startedRef.current = true; setup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scratch = (i: number) => {
    if (phase !== 'playing' || tiles[i].revealed) return
    const next = tiles.map((t, idx) => idx === i ? { ...t, revealed: true } : t)
    setTiles(next)
    audio.playFx('tap')
    if (next.every(t => t.revealed)) {
      // Check 3 matching
      const counts: Record<string, number> = {}
      for (const t of next) counts[t.symbol] = (counts[t.symbol] || 0) + 1
      const hasWin = Object.values(counts).some(v => v >= 3)
      setWon(hasWin)
      if (hasWin) { audio.playFx('win'); player.spawnConfetti(30) } else audio.playFx('miss')
      setTimeout(() => setPhase('result'), 600)
    }
  }

  const collect = () => {
    const reward = won ? 80 : 10
    player.notify(`🎫 ${won ? 'WINNER!' : 'no match'} · +${reward}`, won ? C.pink : C.text3)
    player.recordGameResult(won, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'scratchpuff') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🎫 SCRATCH & PUFF" titleColor="#EC4899" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#3a0a1f,#0a040a)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 20, justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: 2 }}>TAP TO SCRATCH · MATCH 3 WINS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%', maxWidth: 340 }}>
            {tiles.map((t, i) => (
              <div key={i} onClick={() => scratch(i)} style={{ aspectRatio: '1 / 1', borderRadius: 12, cursor: t.revealed ? 'default' : 'pointer', background: t.revealed ? '#EC489925' : '#EC489912', border: `2px solid ${t.revealed ? '#EC4899' : '#EC489940'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, touchAction: 'none' }}>
                {t.revealed ? t.symbol : '❓'}
              </div>
            ))}
          </div>
          {phase === 'result' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.pink : C.text3 }}>{won ? 'WINNER! 🎉' : 'No match'}</div>
              <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.pink}15`, border: `1px solid ${C.pink}30`, fontSize: 14, fontWeight: 800, color: C.pink, touchAction: 'none' }}>Collect</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FORTUNE COOKIE — crack for wisdom + coins
// ═══════════════════════════════════════════════════════════
const FORTUNES = [
  { text: 'Your next puff will be legendary.', coins: 30 },
  { text: 'Clouds form where preparation meets opportunity.', coins: 25 },
  { text: 'The wind favors the patient smoker.', coins: 40 },
  { text: 'A blinker saves nine.', coins: 35 },
  { text: 'You will encounter a friend bearing gifts.', coins: 20 },
  { text: 'GOLDEN COOKIE! 🌟', coins: 100 },
]

export const FortuneCookieGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('fortunecookie')
  const [phase, setPhase] = useState<'idle' | 'cracked' | null>(null)
  const [fortune, setFortune] = useState<typeof FORTUNES[0] | null>(null)

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'fortunecookie') return
    startedRef.current = true
    audio.gameSoundsMuted.current = false
    setPhase('idle'); setFortune(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const crack = () => {
    if (phase !== 'idle') return
    audio.playFx('tap')
    const isGolden = Math.random() < 0.08
    const f = isGolden ? FORTUNES[FORTUNES.length - 1] : FORTUNES[Math.floor(Math.random() * (FORTUNES.length - 1))]
    setFortune(f)
    setPhase('cracked')
    audio.playFx(isGolden ? 'win' : 'success')
    if (isGolden) player.spawnConfetti(50)
  }

  const collect = () => {
    const reward = fortune?.coins ?? 15
    player.notify(`🥠 +${reward} coins`, reward >= 100 ? C.gold : C.orange)
    player.recordGameResult(reward >= 50, reward, 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'fortunecookie') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🥠 FORTUNE COOKIE" titleColor="#F97316" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#3a1f0a,#0a0604)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 24, justifyContent: 'center' }}>
          <div style={{ fontSize: 140, filter: 'drop-shadow(0 0 24px #F97316)' }}>🥠</div>
          {phase === 'idle' && (
            <div onClick={crack} style={{ padding: '16px 32px', borderRadius: 14, cursor: 'pointer', background: '#F9731620', border: '2px solid #F9731650', fontSize: 15, fontWeight: 900, color: '#F97316', touchAction: 'none' }}>CRACK IT OPEN</div>
          )}
          {phase === 'cracked' && fortune && (
            <>
              <div style={{ padding: 20, borderRadius: 16, background: 'rgba(249,115,22,0.12)', border: '2px solid #F9731650', maxWidth: 340, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontStyle: 'italic', color: '#fff', marginBottom: 8 }}>"{fortune.text}"</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: fortune.coins >= 100 ? C.gold : C.orange }}>+{fortune.coins} coins</div>
              </div>
              <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 14, fontWeight: 800, color: C.orange, touchAction: 'none' }}>Collect</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TREASURE MAP — 16 tiles, find 3 treasures, avoid 3 bombs
// ═══════════════════════════════════════════════════════════
interface Tile { kind: 'treasure' | 'bomb' | 'empty'; revealed: boolean }

export const TreasureMapGame: React.FC = () => {
  const { game, player, ble, audio, startedRef, exitGame } = useOracleGame('treasuremap')
  const [phase, setPhase] = useState<'playing' | 'result' | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [found, setFound] = useState(0)
  const [hit, setHit] = useState(false)

  const setup = useCallback(() => {
    audio.gameSoundsMuted.current = false
    const kinds: Tile['kind'][] = []
    for (let i = 0; i < 3; i++) kinds.push('treasure')
    for (let i = 0; i < 3; i++) kinds.push('bomb')
    while (kinds.length < 16) kinds.push('empty')
    const shuffled = kinds.sort(() => Math.random() - 0.5).map(k => ({ kind: k, revealed: false }))
    setTiles(shuffled); setFound(0); setHit(false); setPhase('playing')
  }, [audio])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'treasuremap') return
    startedRef.current = true; setup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dig = (i: number) => {
    if (phase !== 'playing' || tiles[i].revealed) return
    const t = tiles[i]
    const next = tiles.map((x, idx) => idx === i ? { ...x, revealed: true } : x)
    setTiles(next)
    if (t.kind === 'treasure') {
      audio.playFx('win')
      const nf = found + 1
      setFound(nf)
      player.spawnConfetti(10)
      if (nf >= 3) setTimeout(() => setPhase('result'), 800)
    } else if (t.kind === 'bomb') {
      audio.playFx('lose')
      setHit(true)
      setTimeout(() => setPhase('result'), 800)
    } else {
      audio.playFx('tap')
    }
  }

  const collect = () => {
    const won = !hit && found >= 3
    const reward = won ? 100 : found * 20 + 5
    player.notify(`🗺️ ${found} 💎 · ${hit ? '💣' : ''}${won ? ' WIN' : ''} · +${reward}`, won ? C.gold : C.orange)
    player.recordGameResult(won, reward, 12, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }

  if (!phase || game.gameActive?.id !== 'treasuremap') return null
  const isResult = phase === 'result'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🗺️ TREASURE MAP" titleColor="#FFD700" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`💎 ${found}/3`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#3a2a08,#0a0804)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 14 }}>
          <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2 }}>FIND 3 TREASURES · AVOID 3 BOMBS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%', maxWidth: 340 }}>
            {tiles.map((t, i) => (
              <div key={i} onClick={() => dig(i)} style={{
                aspectRatio: '1 / 1', borderRadius: 10, cursor: t.revealed ? 'default' : 'pointer',
                background: t.revealed ? (t.kind === 'treasure' ? `${C.gold}30` : t.kind === 'bomb' ? `${C.red}30` : 'rgba(255,255,255,0.04)') : '#FFD70012',
                border: `2px solid ${t.revealed ? (t.kind === 'treasure' ? C.gold : t.kind === 'bomb' ? C.red : 'rgba(255,255,255,0.1)') : '#FFD70035'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, touchAction: 'none',
              }}>
                {t.revealed ? (t.kind === 'treasure' ? '💎' : t.kind === 'bomb' ? '💣' : '·') : '❓'}
              </div>
            ))}
          </div>
          {isResult && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: hit ? C.red : C.gold }}>
                {hit ? 'BOOM! 💀' : `FOUND ${found} TREASURES!`}
              </div>
              <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
