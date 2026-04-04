import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = null | 'intro' | 'playing' | 'result'

interface TileInfo { emoji: string; label: string; value: number; color: string }
const TM_TILE_INFO: Record<string, TileInfo> = {
  treasure: { emoji: '💎', label: 'TREASURE', value: 200, color: '#FFD700' },
  bomb:     { emoji: '💣', label: 'BOMB!',    value: 0,   color: '#EF4444' },
  coin:     { emoji: '🪙', label: '+25',      value: 25,  color: '#00E5FF' },
  star:     { emoji: '⭐', label: '+50',      value: 50,  color: '#FFD700' },
  clover:   { emoji: '🍀', label: '+75',      value: 75,  color: '#7FFF00' },
}

function genGrid(): string[] {
  const types: string[] = []
  for (let i = 0; i < 3; i++) types.push('treasure')
  for (let i = 0; i < 3; i++) types.push('bomb')
  const smalls = ['coin','coin','coin','coin','star','star','star','clover','clover','clover']
  types.push(...smalls)
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]]
  }
  return types
}

export default function TreasureMap() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>(null)
  const [grid, setGrid] = useState<string[]>([])
  const [revealed, setRevealed] = useState<boolean[]>(Array(16).fill(false))
  const [treasures, setTreasures] = useState(0)
  const [coins, setCoins] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [xrayTiles, setXrayTiles] = useState<number[]>([])
  const [commentary, setCommentary] = useState('')

  const puffStart = useRef(0)
  const phaseRef = useRef<Phase>(null)
  const selectedRef = useRef<number | null>(null)
  const gridRef = useRef<string[]>([])
  const revealedRef = useRef<boolean[]>(Array(16).fill(false))
  const gameOverRef = useRef(false)
  const treasuresRef = useRef(0)
  const coinsRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { revealedRef.current = revealed }, [revealed])
  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { treasuresRef.current = treasures }, [treasures])
  useEffect(() => { coinsRef.current = coins }, [coins])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'playing' || selectedRef.current === null || gameOverRef.current) return
    puffStart.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (phaseRef.current !== 'playing' || selectedRef.current === null || !puffStart.current || gameOverRef.current) return
    const dur = (Date.now() - puffStart.current) / 1000
    puffStart.current = 0
    if (dur < 0.15) return

    const isBlinker = dur >= 4.5
    if (isBlinker) {
      const unrev: number[] = []
      gridRef.current.forEach((t, i) => { if (!revealedRef.current[i] && i !== selectedRef.current) unrev.push(i) })
      const treeTiles = unrev.filter(i => gridRef.current[i] === 'treasure')
      const bombTiles = unrev.filter(i => gridRef.current[i] === 'bomb')
      const xray: number[] = []
      if (treeTiles.length > 0) xray.push(treeTiles[Math.floor(Math.random() * treeTiles.length)])
      if (bombTiles.length > 0) xray.push(bombTiles[Math.floor(Math.random() * bombTiles.length)])
      if (xray.length > 0) {
        setXrayTiles(xray)
        setCommentary('X-RAY VISION! Peeking at hidden tiles!')
        setTimeout(() => setXrayTiles([]), 800)
      }
    }

    const idx = selectedRef.current
    const newRevealed = [...revealedRef.current]
    newRevealed[idx] = true
    setRevealed(newRevealed); revealedRef.current = newRevealed
    setSelected(null)

    const tileType = gridRef.current[idx]
    const info = TM_TILE_INFO[tileType] || { emoji: '❓', label: '', value: 0, color: C.text3 }

    if (tileType === 'treasure') {
      const newT = treasuresRef.current + 1
      setTreasures(newT); treasuresRef.current = newT
      const newCoins = coinsRef.current + info.value
      setCoins(newCoins); coinsRef.current = newCoins
      playFx('crowd')
      setCommentary(`TREASURE FOUND! ${info.emoji} +${info.value} coins!`)
      if (newT >= 3) {
        const bonus = 500
        setTimeout(() => {
          const total = newCoins + bonus
          setCoins(total)
          setCommentary(`ALL 3 TREASURES! JACKPOT BONUS +${bonus}!`)
          awardGame({ won: true, baseCoins: 20, baseXP: 20 })
          setPhase('result'); setGameOver(true); gameOverRef.current = true
        }, 500)
        return
      }
    } else if (tileType === 'bomb') {
      playFx('error')
      const lost = Math.floor(coinsRef.current / 2)
      setCommentary(`BOOM! Lost ${lost} coins!`)
      setGameOver(true); gameOverRef.current = true
      setTimeout(() => {
        const remaining = Math.max(0, coinsRef.current - lost)
        setCoins(remaining)
        awardGame({ won: false, baseCoins: 0, baseXP: 8 })
        setPhase('result')
      }, 1500)
      return
    } else {
      const newCoins = coinsRef.current + info.value
      setCoins(newCoins); coinsRef.current = newCoins
      playFx('select')
      setCommentary(`${info.emoji} ${info.label} coins!`)
    }
  }, [playFx, awardGame])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    const g = genGrid()
    setGrid(g); gridRef.current = g
    setRevealed(Array(16).fill(false)); revealedRef.current = Array(16).fill(false)
    setTreasures(0); treasuresRef.current = 0
    setCoins(0); coinsRef.current = 0
    setGameOver(false); gameOverRef.current = false
    setSelected(null); setXrayTiles([])
    setPhase('intro')
    playFx('crowd')
    setCommentary('Treasure Map! Tap a tile, then PUFF to flip. Find 3 treasures!')
    setTimeout(() => setPhase('playing'), 1500)
  }, [playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPlaying = phase === 'playing'
  const isResult = phase === 'result'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0800 0%, #1a1000 40%, #0d0800 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.06), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '60px 16px 20px', gap: 10, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #FFD700, #FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TREASURE MAP</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{coins}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>{treasures}/3</div><div style={{ fontSize: 8, color: C.text3 }}>TREASURES</div></div>
          {selected !== null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.lime }}>Tile {selected + 1}</div><div style={{ fontSize: 8, color: C.text3 }}>SELECTED</div></div>}
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>TREASURE MAP</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>16 tiles. Find 3 💎 treasures. Avoid 💣 bombs!</div>
          </div>
        )}

        {isPlaying && (
          <div style={{ width: '100%' }}>
            {selected !== null && <div style={{ textAlign: 'center', fontSize: 12, color: C.gold, marginBottom: 6, animation: 'pulse 1s infinite' }}>PUFF to flip tile {selected + 1}! 💨</div>}
            {selected === null && <div style={{ textAlign: 'center', fontSize: 11, color: C.text2, marginBottom: 6 }}>TAP a tile, then PUFF to reveal</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxWidth: 340, margin: '0 auto' }}>
              {grid.map((tile, i) => {
                const isRevealed = revealed[i]
                const isSelected = selected === i
                const isXray = xrayTiles.includes(i)
                const info = TM_TILE_INFO[tile] || { emoji: '?', color: C.text3, label: '', value: 0 }
                return (
                  <div
                    key={i}
                    data-btn="true"
                    onClick={() => {
                      if (!isPlaying || isRevealed || gameOver) return
                      setSelected(i); playFx('select')
                    }}
                    style={{ height: 64, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: !isRevealed && !gameOver ? 'pointer' : 'default', background: isRevealed ? `${info.color}15` : isSelected ? `${C.gold}20` : 'rgba(255,255,255,0.04)', border: `2px solid ${isRevealed ? info.color + '40' : isSelected ? C.gold : isXray ? C.purple + '80' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s', fontSize: isRevealed ? 28 : 20 }}>
                    {isRevealed ? info.emoji : isXray ? TM_TILE_INFO[tile]?.emoji || '?' : '❓'}
                    {isRevealed && info.value > 0 && <div style={{ fontSize: 7, color: info.color, fontWeight: 700 }}>+{info.value}</div>}
                  </div>
                )
              })}
            </div>

            {!gameOver && (
              <div data-btn="true" onClick={() => {
                const w = coins
                if (w > 0) awardGame({ won: true, baseCoins: 20, baseXP: 20 })
                setGameOver(true); setPhase('result')
                setCommentary(`Cashed out with ${w} coins!`)
                playFx('crowd')
              }} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, background: `${C.lime}15`, border: `1px solid ${C.lime}30`, fontSize: 12, fontWeight: 700, color: C.lime, textAlign: 'center', cursor: 'pointer' }}>
                💰 CASH OUT ({coins} coins)
              </div>
            )}
          </div>
        )}

        {isResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{treasures >= 3 ? '👑' : gameOver ? '💣' : '💰'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: treasures >= 3 ? C.gold : C.text }}>{treasures >= 3 ? 'ALL TREASURES FOUND!' : 'GAME OVER'}</div>
            <div style={{ fontSize: 18, color: C.gold, marginTop: 8 }}>+{coins} coins!</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.30)', fontSize: 13, fontWeight: 800, color: C.gold }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 4 }}>{commentary}</div>
      </div>
    </div>
  )
}
