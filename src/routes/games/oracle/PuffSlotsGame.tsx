import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

const SYMBOLS = ['🍒', '🍋', '🍇', '🌿', '💎', '7️⃣']
const PAYOUTS: Record<string, number> = { '🍒': 3, '🍋': 5, '🍇': 8, '🌿': 15, '💎': 30, '7️⃣': 100 }

type Phase = 'idle' | 'spinning' | 'reveal' | null

export const PuffSlotsGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [reels, setReels] = useState<string[]>(['🍒', '🍋', '🍇'])
  const [winAmount, setWinAmount] = useState(0)
  const [totalWon, setTotalWon] = useState(0)
  const [spins, setSpins] = useState(0)
  const startedRef = useRef(false)
  const reelIntRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setPhase('idle'); setWinAmount(0); setTotalWon(0); setSpins(0)
  }, [audio])

  const spin = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('spinning')
    audio.playFx('charge')
    setSpins(s => s + 1)
    if (reelIntRef.current) clearInterval(reelIntRef.current)
    reelIntRef.current = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ])
    }, 80)
    setTimeout(() => {
      if (reelIntRef.current) { clearInterval(reelIntRef.current); reelIntRef.current = null }
      // Decide final reels — ~20% chance of match for good drama
      const roll = Math.random()
      let final: string[]
      if (roll < 0.12) {
        const s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        final = [s, s, s]
      } else if (roll < 0.30) {
        const s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        final = [s, s, SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]
      } else {
        final = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ]
      }
      setReels(final)
      // Win check
      let win = 0
      if (final[0] === final[1] && final[1] === final[2]) {
        win = (PAYOUTS[final[0]] || 5) * 5
        audio.playFx('win'); player.spawnConfetti(40)
      } else if (final[0] === final[1] || final[1] === final[2]) {
        win = 5
        audio.playFx('success')
      } else {
        audio.playFx('miss')
      }
      setWinAmount(win)
      setTotalWon(t => t + win)
      setPhase('reveal')
    }, 1800)
  }, [phase, audio, player])

  const again = () => { setWinAmount(0); setPhase('idle') }

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    if (reelIntRef.current) { clearInterval(reelIntRef.current); reelIntRef.current = null }
    setPhase(null); game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const reward = Math.max(10, totalWon)
    player.notify(`🎰 Won ${totalWon} over ${spins} spins · +${reward}`, totalWon > 0 ? C.gold : C.text3)
    player.recordGameResult(totalWon > 20, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }, [totalWon, spins, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'puffslots') return
    startedRef.current = true; start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'puffslots') return
    ble.registerPuffHandlers('puffslots', null, () => spin())
    return () => { ble.registerPuffHandlers(null, null, null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'puffslots') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🎰 PUFF SLOTS" titleColor="#FFD700" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`Won: ${totalWon}`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 30%,#3a2a0a,#0a0800)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 18, justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 10, padding: '18px 16px', borderRadius: 16, background: 'rgba(255,215,0,0.08)', border: '3px solid #FFD700', boxShadow: '0 0 30px #FFD70040' }}>
            {reels.map((r, i) => (
              <div key={i} style={{ width: 80, height: 100, borderRadius: 10, background: '#1a1408', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, border: '2px solid #FFD70080' }}>
                {r}
              </div>
            ))}
          </div>

          {phase === 'reveal' && winAmount > 0 && (
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, animation: 'pulse 0.8s infinite' }}>+{winAmount} WIN! 🎉</div>
          )}
          {phase === 'reveal' && winAmount === 0 && (
            <div style={{ fontSize: 14, color: C.text3 }}>No match — spin again</div>
          )}

          {phase === 'idle' && (
            <div onClick={spin} style={{ padding: '16px 36px', borderRadius: 14, cursor: 'pointer', background: '#FFD70020', border: '2px solid #FFD70050', fontSize: 16, fontWeight: 900, color: '#FFD700', touchAction: 'none' }}>SPIN</div>
          )}
          {phase === 'reveal' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div onClick={again} style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: '#FFD70015', border: '1px solid #FFD70030', fontSize: 13, fontWeight: 800, color: '#FFD700', touchAction: 'none' }}>Spin again</div>
              <div onClick={collect} style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
