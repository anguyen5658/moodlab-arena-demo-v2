import { useArena } from '@/context/ArenaContext'
import { C, LOYALTY_TIERS } from '@/constants'

export function CoinHeader() {
  const { coins, xp, bleConnected, btPuffActive } = useArena()

  const getCurrentTier = () => {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (xp >= LOYALTY_TIERS[i].xpReq) return LOYALTY_TIERS[i]
    }
    return LOYALTY_TIERS[0]
  }

  const tier = getCurrentTier()

  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: 430, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px 8px',
      background: 'linear-gradient(180deg, rgba(5,5,16,0.95) 0%, rgba(5,5,16,0) 100%)',
    }}>
      {/* Tier badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{tier.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{tier.name}</span>
      </div>

      {/* Coins + XP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>{coins.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: C.text3 }}>XP</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>{xp.toLocaleString()}</span>
        </div>
      </div>

      {/* BLE status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: bleConnected ? C.green : C.text3,
          boxShadow: bleConnected ? `0 0 8px ${C.green}` : 'none',
          animation: btPuffActive ? 'pulse 0.5s infinite' : bleConnected ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: 10, color: bleConnected ? C.green : C.text3 }}>
          {bleConnected ? 'Connected' : 'No Device'}
        </span>
      </div>
    </div>
  )
}
