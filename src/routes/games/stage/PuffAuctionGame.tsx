import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader, pick } from './_shared'

interface AuctionItem { name: string; emoji: string; realValue: number; hint: string }

const ITEMS: AuctionItem[] = [
  { name: 'Vintage Glass Bong (1970s)', emoji: '🫧', realValue: 1200, hint: 'Rare find' },
  { name: 'Signed Snoop Dogg Poster', emoji: '📜', realValue: 400, hint: 'Celeb merch' },
  { name: '1-oz Golden Rolling Tray', emoji: '🏆', realValue: 2500, hint: 'Luxury' },
  { name: 'Cali Clear Prototype', emoji: '💎', realValue: 800, hint: 'Collector' },
  { name: 'Glass Pipe Art Piece', emoji: '🎨', realValue: 350, hint: 'Artisan' },
]

interface Bot { name: string; emoji: string; color: string }
const BOTS: Bot[] = [
  { name: 'CloudMogul', emoji: '💰', color: '#FFD93D' },
  { name: 'BaronPuff', emoji: '🎩', color: '#C084FC' },
  { name: 'MoneyHaze', emoji: '💸', color: '#00E5FF' },
]

type Phase = 'bidding' | 'reveal' | 'final' | null

export const PuffAuctionGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [item, setItem] = useState<AuctionItem | null>(null)
  const [yourBid, setYourBid] = useState(0)
  const [bids, setBids] = useState<{ name: string; bid: number; isYou: boolean; color: string }[]>([])
  const [totalWins, setTotalWins] = useState(0)
  const [msg, setMsg] = useState('')

  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const itemsRef = useRef<AuctionItem[]>([])

  const startRound = useCallback(() => {
    const pool = itemsRef.current.length ? itemsRef.current : [...ITEMS].sort(() => Math.random() - 0.5)
    itemsRef.current = pool
    const it = pool.shift()!
    setItem(it)
    setYourBid(0)
    setBids([])
    setPhase('bidding')
    setMsg(`Bid on the ${it.name}!`)
    audio.playFx('select')
  }, [audio])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    itemsRef.current = [...ITEMS].sort(() => Math.random() - 0.5)
    setRound(0)
    setTotalWins(0)
    startRound()
  }, [audio, startRound])

  const submitBid = useCallback((bid: number) => {
    if (phaseRef.current !== 'bidding' || !item) return
    setYourBid(bid)
    // Generate bot bids — biased around realValue with noise
    const botBids = BOTS.map(b => ({
      name: b.name,
      color: b.color,
      bid: Math.max(50, Math.round(item.realValue * (0.6 + Math.random() * 0.9))),
      isYou: false,
    }))
    const all = [{ name: 'You', bid, isYou: true, color: C.cyan }, ...botBids]
    all.sort((a, b) => b.bid - a.bid)
    setBids(all)
    const youWon = all[0].isYou
    // Profit if won = realValue - bid (good if bid < realValue)
    setPhase('reveal')
    audio.playFx(youWon ? 'whistle' : 'tap')
    if (youWon) {
      const profit = item.realValue - bid
      if (profit > 0) {
        setTotalWins(w => w + 1)
        setMsg(`YOU WIN! Profit: $${profit.toLocaleString()}`)
        audio.playFx('win')
      } else {
        setMsg(`You won but overpaid $${Math.abs(profit).toLocaleString()}`)
        audio.playFx('miss')
      }
    } else {
      setMsg(`${all[0].name} won with $${all[0].bid.toLocaleString()}`)
    }
    setTimeout(() => {
      const nr = round + 1
      if (nr >= 4) {
        setPhase('final')
        setMsg('Auction complete!')
      } else {
        setRound(nr)
        startRound()
      }
    }, 2400)
  }, [item, round, audio, startRound])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const won = totalWins >= 2
    const reward = 20 + totalWins * 25
    player.notify(won ? `🔨 ${totalWins} wins! +${reward} coins` : `🔨 +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    exitGame()
  }, [totalWins, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'puffauction') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'puffauction') return
    ble.registerPuffHandlers('puffauction', null, null)
    return () => {
      audio.gameSoundsMuted.current = true
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'puffauction') return null
  const isFinal = phase === 'final'
  const isReveal = phase === 'reveal'

  const bidOptions = item ? [
    Math.round(item.realValue * 0.5),
    Math.round(item.realValue * 0.8),
    Math.round(item.realValue * 1.0),
    Math.round(item.realValue * 1.3),
  ] : []

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🔨 PUFF AUCTION"
        titleColor={C.gold}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`Round ${round + 1}/4 · Wins ${totalWins}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#2a1f08,#0a0804)' }}>
        {!isFinal && item && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 14 }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2 }}>{msg}</div>
            <div style={{ width: '100%', maxWidth: 340, padding: 24, borderRadius: 16, background: `${C.gold}12`, border: `2px solid ${C.gold}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.gold, marginBottom: 4 }}>{item.name}</div>
              <div style={{ fontSize: 9, color: C.text3 }}>{item.hint}</div>
            </div>

            {phase === 'bidding' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 340 }}>
                {bidOptions.map((b, i) => (
                  <div key={i}
                    onClick={() => submitBid(b)}
                    style={{
                      padding: '14px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      background: `${C.gold}15`, border: `1px solid ${C.gold}30`,
                      fontSize: 14, fontWeight: 900, color: C.gold, touchAction: 'none',
                    }}>
                    ${b.toLocaleString()}
                  </div>
                ))}
              </div>
            )}

            {isReveal && bids.length > 0 && (
              <div style={{ width: '100%', maxWidth: 340 }}>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>FINAL BIDS · REAL VALUE: ${item.realValue.toLocaleString()}</div>
                {bids.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 3, borderRadius: 8,
                    background: b.isYou ? `${C.cyan}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? C.gold + '40' : b.isYou ? C.cyan + '25' : 'rgba(255,255,255,0.05)'}` }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: i === 0 ? C.gold : C.text3, width: 18 }}>#{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: b.isYou ? C.cyan : b.color, flex: 1 }}>{b.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, fontFamily: 'monospace' }}>${b.bid.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isFinal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{totalWins >= 2 ? '🏆' : '🔨'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: totalWins >= 2 ? C.green : C.gold, marginBottom: 6 }}>AUCTION COMPLETE</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>Items won: {totalWins}/4</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 14, fontWeight: 800, color: C.gold, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}

void pick
