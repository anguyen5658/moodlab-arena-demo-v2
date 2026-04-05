import { useArena } from '@/context/ArenaContext'
import { C, LG } from '@/constants'
import { LOYALTY_TIERS } from '@/constants/config'

const TICKER_ITEMS = [
  '⚽ USA vs MEX · 9:00 PM Tonight',
  '🏆 Flash Frenzy · 3 SPOTS LEFT',
  '🧠 Vibe Check LIVE · 1,247 watching',
  '🔥 ChillMaster42 on 23-win streak',
  '📊 BRA vs GER predictions open',
  '💰 JACKPOT: 100,000 coins up for grabs',
  '⚡ NeonQueen just won Wild West Duel',
  '🎰 Spin & Win Mega Friday at 8PM',
]

export function CoinHeader() {
  const { coins, xp, bleConnected, deviceActivated, connectBle, currentWinStreak, coinPulse } = useArena()

  const getCurrentTier = () => {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (xp >= LOYALTY_TIERS[i].xpReq) return { ...LOYALTY_TIERS[i], idx: i }
    }
    return { ...LOYALTY_TIERS[0], idx: 0 }
  }

  const tier = getCurrentTier()
  const nextTier = LOYALTY_TIERS[tier.idx + 1]
  const xpProgress = nextTier
    ? Math.min(100, ((xp - tier.xpReq) / (nextTier.xpReq - tier.xpReq)) * 100)
    : 100

  const tickerItems = TICKER_ITEMS.concat(TICKER_ITEMS)

  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 100,
    }}>
      {/* Main header row */}
      <div style={{
        padding: '12px 14px 4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 20,
        background: 'rgba(5,5,16,0.85)',
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: C.text3, letterSpacing: 1.5 }}>
          <span style={{ fontWeight: 800, color: C.text2, letterSpacing: 1 }}>
            Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* BLE status pill */}
          <div
            onClick={() => connectBle()}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 100, cursor: 'pointer',
              background: bleConnected ? `${C.green}10` : `${C.orange}10`,
              border: `1px solid ${bleConnected ? C.green + '30' : C.orange + '30'}`,
              transition: 'all 0.3s',
              boxShadow: bleConnected ? `0 0 8px ${C.green}15` : `0 0 8px ${C.orange}20`,
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: bleConnected ? C.green : C.orange,
              boxShadow: bleConnected ? `0 0 6px ${C.green}` : `0 0 6px ${C.orange}`,
              animation: bleConnected ? '' : 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
              {bleConnected ? 'Connected' : deviceActivated ? '70%' : 'Connect'}
            </span>
          </div>

          {/* Coins */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '3px 8px', borderRadius: 100,
            background: `${C.gold}08`, border: `1px solid ${C.gold}15`,
            transform: coinPulse ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.3s ease',
          }}>
            <span style={{ fontSize: 10 }}>🪙</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: coinPulse ? '#fff' : C.gold, fontFamily: "'Courier New',monospace", transition: 'color 0.3s ease' }}>
              {coins.toLocaleString()}
            </span>
          </div>

          {/* Win streak */}
          {currentWinStreak >= 2 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 100,
              ...LG.pill,
              border: `1px solid ${currentWinStreak >= 5 ? C.gold : C.orange}30`,
            }}>
              <span style={{ fontSize: 10 }}>🔥</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: currentWinStreak >= 5 ? C.gold : C.orange }}>
                {currentWinStreak}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* XP micro-bar */}
      <div style={{ height: 2, background: C.bg3, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg,${tier.color || C.cyan},${C.purple})`,
          width: `${xpProgress}%`,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Live Ticker */}
      <div style={{
        width: '100%', overflow: 'hidden', height: 28,
        background: 'rgba(255,255,255,0.02)',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', height: '100%',
          whiteSpace: 'nowrap',
          animation: 'tickerScroll 30s linear infinite',
          willChange: 'transform',
        }}>
          {tickerItems.map((t, i) => {
            const dotColor = i % 2 === 0 ? C.red : C.cyan
            const anim = i % 3 === 0 ? 'pulse 1.5s infinite' : 'none'
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 24px', fontSize: 11, fontWeight: 600, color: C.text2, letterSpacing: 0.3 }}>
                <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: dotColor, animation: anim }} />
                {t}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
