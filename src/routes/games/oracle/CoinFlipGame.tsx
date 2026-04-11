import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

type Phase = 'idle' | 'flipping' | 'reveal' | null

export const CoinFlipGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [pick, setPick] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [bet, setBet] = useState(10)
  const [won, setWon] = useState(0)
  const [lost, setLost] = useState(0)
  const [earned, setEarned] = useState(0)
  const startedRef = useRef(false)

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setPhase('idle'); setWon(0); setLost(0); setEarned(0); setPick(null); setResult(null)
  }, [audio])

  const flip = useCallback((p: 'heads' | 'tails') => {
    if (phase !== 'idle') return
    setPick(p)
    setPhase('flipping')
    audio.playFx('tap')
    setTimeout(() => {
      const r = Math.random() < 0.5 ? 'heads' : 'tails'
      setResult(r)
      setPhase('reveal')
      if (r === p) {
        audio.playFx('win')
        setWon(w => w + 1)
        setEarned(e => e + bet * 2)
        player.spawnConfetti(15)
      } else {
        audio.playFx('lose')
        setLost(l => l + 1)
      }
    }, 1100)
  }, [phase, bet, audio, player])

  const again = () => { setPick(null); setResult(null); setPhase('idle') }

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null); game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const reward = Math.max(10, earned)
    player.notify(`🪙 ${won}W ${lost}L · +${reward} coins`, won > lost ? C.green : C.gold)
    player.recordGameResult(won > lost, reward, 8, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }, [won, lost, earned, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'coinflip') return
    startedRef.current = true; start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'coinflip') return
    ble.registerPuffHandlers('coinflip', null, null)
    return () => { ble.registerPuffHandlers(null, null, null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'coinflip') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🪙 COIN FLIP" titleColor="#F59E0B" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`${won}W ${lost}L`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 40%,#3a2a0a,#0a0a00)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 18 }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #FFD700, #F59E0B 50%, #92570a)`,
            boxShadow: '0 0 40px #F59E0B60, inset 0 0 20px #ffffff22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 80, marginTop: 20,
            animation: phase === 'flipping' ? 'spin 0.15s linear infinite' : 'none',
          }}>
            {phase === 'reveal' && result === 'heads' ? '👑' : phase === 'reveal' && result === 'tails' ? '🌿' : '🪙'}
          </div>

          {phase === 'idle' && (
            <>
              <div style={{ fontSize: 12, color: C.text2 }}>Bet: {bet} coins</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div onClick={() => flip('heads')} style={{ padding: '16px 28px', borderRadius: 14, cursor: 'pointer', background: '#F59E0B20', border: '2px solid #F59E0B50', fontSize: 15, fontWeight: 900, color: '#F59E0B', touchAction: 'none' }}>👑 HEADS</div>
                <div onClick={() => flip('tails')} style={{ padding: '16px 28px', borderRadius: 14, cursor: 'pointer', background: '#22C55E20', border: '2px solid #22C55E50', fontSize: 15, fontWeight: 900, color: '#22C55E', touchAction: 'none' }}>🌿 TAILS</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[10, 25, 50].map(b => (
                  <div key={b} onClick={() => setBet(b)} style={{ padding: '8px 16px', borderRadius: 10, cursor: 'pointer', background: bet === b ? `${C.gold}25` : 'rgba(255,255,255,0.04)', border: `1px solid ${bet === b ? C.gold : 'rgba(255,255,255,0.1)'}`, fontSize: 11, fontWeight: 800, color: bet === b ? C.gold : C.text3 }}>{b}</div>
                ))}
              </div>
            </>
          )}
          {phase === 'flipping' && <div style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B' }}>FLIPPING...</div>}
          {phase === 'reveal' && result && (
            <>
              <div style={{ fontSize: 24, fontWeight: 900, color: result === pick ? C.green : C.red }}>
                {result === pick ? `YOU WON +${bet * 2}!` : 'YOU LOST 💀'}
              </div>
              <div style={{ fontSize: 11, color: C.text3 }}>Called {pick?.toUpperCase()} · Result: {result.toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div onClick={again} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: '#F59E0B15', border: '1px solid #F59E0B30', fontSize: 13, fontWeight: 800, color: '#F59E0B', touchAction: 'none' }}>Flip again</div>
                <div onClick={collect} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
