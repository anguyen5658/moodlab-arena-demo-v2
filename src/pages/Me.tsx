import { useState } from 'react'
import { C, GLASS_CARD } from '@/constants'
import { useArena } from '@/context/ArenaContext'
import {
  LOYALTY_TIERS, LOYALTY_BADGES, DAILY_REWARDS, DAILY_CHALLENGES, SHOP_ITEMS,
  MOCK_FRIENDS, MOCK_COMMUNITIES, MOCK_COLLECTIONS,
} from '@/constants/config'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentTier(xp: number) {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LOYALTY_TIERS[i].xpReq) return { ...LOYALTY_TIERS[i], idx: i }
  }
  return { ...LOYALTY_TIERS[0], idx: 0 }
}

function getNextTier(xp: number) {
  const tier = getCurrentTier(xp)
  return tier.idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[tier.idx + 1] : null
}

// ── Stat card used in multiple grids ─────────────────────────────────────────

interface StatCardProps {
  icon: string
  value: string | number
  label: string
  color: string
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div style={{
      padding: '12px 4px', borderRadius: 14, textAlign: 'center', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${color}0a, ${color}04, rgba(8,8,24,0.6))`,
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${color}20`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 25px ${color}08, inset 0 1px 0 rgba(255,255,255,0.05)`,
    }}>
      <div style={{ fontSize: 14 }}>{icon}</div>
      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 16, fontWeight: 900, color, textShadow: `0 0 10px ${color}30` }}>{value}</div>
      <div style={{ fontSize: 7, color: C.text3, marginTop: 2, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Me() {
  const {
    coins, xp,
    bestWinStreak,
    earnedBadges, dailyStreak, dailyCheckedIn,
    claimDaily, bleConnected, getCoinMultiplier,
    ownedItems, completedChallenges,
    notify,
  } = useArena()

  const [loyaltyTab, setLoyaltyTab] = useState<'overview' | 'arena' | 'social'>('overview')

  const tier = getCurrentTier(xp)
  const nextTier = getNextTier(xp)
  const xpProgress = nextTier ? Math.min(((xp - tier.xpReq) / (nextTier.xpReq - tier.xpReq)) * 100, 100) : 100
  const totalMultiplier = getCoinMultiplier()
  const earnedBadgeCount = earnedBadges.length
  const userLevel = Math.floor(xp / 500) + 1
  const unreadMessages = 3
  const unreadNotifs = 5

  // Hardcoded player profile (static demo data)
  const playerProfile = {
    totalPuffs: 420,
    totalPuffTime: 1260,
    blinkerCount: 69,
    gamesPlayed: 47,
    gamesWon: 28,
    favoriteGame: 'finalkick',
  }
  const winRate = playerProfile.gamesPlayed > 0 ? Math.round((playerProfile.gamesWon / playerProfile.gamesPlayed) * 100) : 0

  // Tab pill style helper
  const ltPill = (id: 'overview' | 'arena' | 'social', color: string) => ({
    flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' as const,
    background: loyaltyTab === id ? `linear-gradient(135deg,${color},${color}cc)` : 'rgba(255,255,255,0.04)',
    color: loyaltyTab === id ? '#fff' : C.text3,
    border: loyaltyTab === id ? `1px solid ${color}50` : `1px solid ${C.border}`,
    boxShadow: loyaltyTab === id ? `0 0 25px ${color}40, 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)` : '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
    transform: loyaltyTab === id ? 'scale(1.03)' : 'scale(1)',
    backdropFilter: loyaltyTab === id ? 'none' : 'blur(16px)',
    WebkitBackdropFilter: loyaltyTab === id ? 'none' : 'blur(16px)',
    position: 'relative' as const,
    letterSpacing: loyaltyTab === id ? 0.5 : 0,
  })

  return (
    <div style={{ padding: '0 14px', position: 'relative', overflowY: 'auto', paddingBottom: 80 }}>
      {/* Atmospheric background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tier.color}08 0%, #050510 25%, #080818 50%, ${C.purple}05 80%, #050510 100%)` }} />
        <div style={{ position: 'absolute', top: '-15%', left: '20%', width: '60%', height: '40%', background: `radial-gradient(ellipse, ${tier.color}12 0%, transparent 70%)`, filter: 'blur(50px)', animation: 'vipBreathe 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '50%', height: '35%', background: 'radial-gradient(ellipse, rgba(192,132,252,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-15%', width: '40%', height: '30%', background: 'radial-gradient(ellipse, rgba(255,77,141,0.04) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2 + (i * 0.2) % 2,
            height: 2 + (i * 0.2) % 2,
            borderRadius: '50%',
            background: `${tier.color}40`,
            left: (8 + (i * 8.4) % 84) + '%',
            top: (8 + (i * 7.6) % 84) + '%',
            animation: `floatParticle ${10 + (i * 1.0) % 10}s ease-in-out infinite ${(i * 0.5) % 5}s`,
            filter: 'blur(1px)',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div style={{ position: 'absolute', top: '22%', left: '15%', right: '15%', height: 1, background: `linear-gradient(90deg, transparent, ${tier.color}15, ${C.purple}10, transparent)`, boxShadow: `0 0 15px ${tier.color}08` }} />
      </div>

      {/* ── PROFILE HEADER ── */}
      <div style={{
        padding: 20, borderRadius: 22, marginBottom: 16, position: 'relative', zIndex: 1, overflow: 'hidden',
        background: `linear-gradient(145deg,${C.bg3},${tier.color}10,${C.bg2})`,
        boxShadow: `0 0 60px ${tier.color}15, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}>
        {/* Animated gradient border overlay */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, padding: 1.5, pointerEvents: 'none', background: `linear-gradient(135deg,${tier.color}60,${C.purple}40,${C.cyan}50,${tier.color}60)`, backgroundSize: '300% 300%', animation: 'borderShift 4s ease infinite', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
        {/* VIP card inner glow */}
        <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '50%', background: `radial-gradient(ellipse, ${tier.color}08 0%, transparent 70%)`, filter: 'blur(20px)', pointerEvents: 'none' }} />

        {/* Top row: avatar + info */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: 26, background: `radial-gradient(circle, ${tier.color}15 40%, transparent 70%)`, filter: 'blur(8px)', animation: 'vipBreathe 4s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: -4, borderRadius: 22, background: `conic-gradient(from 0deg, ${tier.color}, ${C.purple}, ${C.cyan}, ${tier.color})`, animation: 'spin 6s linear infinite', opacity: 0.6, filter: 'blur(3px)' }} />
            <div style={{ width: 72, height: 72, borderRadius: 20, position: 'relative', background: `linear-gradient(135deg,${tier.color}40,${C.purple}25,${C.bg3})`, border: `2px solid ${tier.color}70`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, boxShadow: `0 0 35px ${tier.color}30, 0 0 60px ${tier.color}10, inset 0 0 15px ${tier.color}12` }}>
              {ownedItems.includes('avatar_cat') ? '🐱' : ownedItems.includes('avatar_alien') ? '👽' : '🌟'}
            </div>
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg,${tier.color},${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, border: `2px solid ${C.bg3}`, boxShadow: `0 0 8px ${tier.color}40` }}>{tier.icon}</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: C.text, letterSpacing: 0.3 }}>Cameron Williamson</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: C.text3 }}>@camwill</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}60` }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{tier.icon} {tier.name}</span>
              <span style={{ fontSize: 10, color: C.text3 }}>Lv {userLevel}</span>
            </div>
            {/* XP Progress bar */}
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.text3, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>XP {xp.toLocaleString()}</span>
                <span>{nextTier ? nextTier.name : 'MAX'}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)', position: 'relative' }}>
                <div style={{ height: '100%', width: xpProgress + '%', borderRadius: 4, position: 'relative', overflow: 'hidden', background: `linear-gradient(90deg,${tier.color},${C.cyan},${C.purple})`, backgroundSize: '200% 100%', animation: 'borderShift 3s ease infinite', transition: 'width 0.5s ease', boxShadow: `0 0 12px ${tier.color}40` }}>
                  <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', animation: 'lightSweep 3s ease-in-out infinite', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action icons row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
          <div onClick={() => notify('Messages coming soon', C.cyan)} style={{ cursor: 'pointer', position: 'relative', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
            💬
            {unreadMessages > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: C.pink, fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 8px ${C.pink}60` }}>{unreadMessages}</span>}
          </div>
          <div onClick={() => notify('Notifications coming soon', C.orange)} style={{ cursor: 'pointer', position: 'relative', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
            🔔
            {unreadNotifs > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: C.orange, fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 8px ${C.orange}60` }}>{unreadNotifs}</span>}
          </div>
          <div onClick={() => notify('Settings coming soon', C.text2)} style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, fontSize: 13 }}>⚙️</div>
          <div style={{ flex: 1 }} />
          {totalMultiplier > 1.0 && (
            <div style={{ padding: '4px 10px', borderRadius: 8, background: `${C.gold}12`, border: `1px solid ${C.gold}25`, fontSize: 10, fontWeight: 800, color: C.gold }}>
              {totalMultiplier.toFixed(1)}x
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          {[
            { l: 'Coins', v: coins.toLocaleString(), icon: '🪙', c: C.gold },
            { l: 'Friends', v: '17,524', icon: '👥', c: C.cyan },
            { l: 'Streak', v: dailyStreak.toString(), icon: '🔥', c: C.orange },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 10, background: `linear-gradient(180deg, ${s.c}06, transparent)`, border: `1px solid ${s.c}10`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${s.c}20, transparent)` }} />
              <div style={{ fontSize: 11 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 18, fontWeight: 900, color: s.c, textShadow: `0 0 12px ${s.c}30, 0 0 24px ${s.c}10` }}>{s.v}</div>
              <div style={{ fontSize: 7, color: C.text3, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={ltPill('overview', C.pink)} onClick={() => setLoyaltyTab('overview')}>Overview</div>
        <div style={ltPill('arena', C.cyan)} onClick={() => setLoyaltyTab('arena')}>Arena</div>
        <div style={ltPill('social', C.purple)} onClick={() => setLoyaltyTab('social')}>Social</div>
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {loyaltyTab === 'overview' && <>
        {/* Usage Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
          <StatCard icon="💨" value={playerProfile.totalPuffs} label="Puffs" color={C.cyan} />
          <StatCard icon="🌿" value="143mg" label="THC" color={C.green} />
          <StatCard icon="💊" value="143mg" label="CBD" color={C.purple} />
          <StatCard icon="🔥" value={playerProfile.blinkerCount} label="Beast" color={C.orange} />
        </div>

        {/* Tier Progress Ladder */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3, marginBottom: 12 }}>TIER PROGRESS</div>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 18, left: '12%', right: '12%', height: 4, borderRadius: 2, background: C.bg, zIndex: 0, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, position: 'relative', overflow: 'hidden', background: `linear-gradient(90deg,${tier.color},${C.cyan})`, width: `${Math.min(100, tier.idx / (LOYALTY_TIERS.length - 1) * 100)}%`, transition: 'width 0.5s ease', boxShadow: `0 0 8px ${tier.color}40` }}>
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', animation: 'lightSweep 3s ease-in-out infinite', pointerEvents: 'none' }} />
              </div>
            </div>
            {LOYALTY_TIERS.map((t, i) => (
              <div key={i} style={{ textAlign: 'center', opacity: i <= tier.idx ? 1 : 0.3, transition: 'all 0.3s', flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 30, filter: i === tier.idx ? `drop-shadow(0 0 10px ${t.color})` : 'none', animation: i === tier.idx ? 'countPulse 2s ease-in-out infinite' : 'none' }}>{t.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.color, marginTop: 2 }}>{t.name}</div>
                <div style={{ fontSize: 7, color: C.text3 }}>{t.mult}x</div>
              </div>
            ))}
          </div>
          {nextTier && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: `linear-gradient(135deg, ${C.bg}, ${nextTier.color}06)`, border: `1px solid ${nextTier.color}15`, fontSize: 11, color: C.text2 }}>
              Next: <strong style={{ color: nextTier.color }}>{nextTier.name}</strong> — {(nextTier.xpReq - xp) > 0 ? (nextTier.xpReq - xp).toLocaleString() : 0} XP to go
            </div>
          )}
        </div>

        {/* Daily Check-in */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3 }}>DAILY CHECK-IN</div>
            <div style={{ fontSize: 11, color: C.orange, fontWeight: 800 }}>🔥 {dailyStreak} streak</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 12 }}>
            {DAILY_REWARDS.map((d, i) => {
              const isCurrent = (dailyStreak % 7) === i && !dailyCheckedIn
              const isPast = i < (dailyStreak % 7) || (dailyCheckedIn && i <= (dailyStreak - 1) % 7)
              const isDay7 = d.day === 7
              return (
                <div key={i} style={{
                  padding: '6px 2px', borderRadius: 10, textAlign: 'center',
                  background: isDay7 ? `linear-gradient(135deg,${C.gold}18,${C.orange}10)` : isCurrent ? `linear-gradient(135deg,${C.green}10,${C.cyan}08)` : C.bg,
                  border: `1px solid ${isCurrent ? C.green + '70' : isDay7 ? C.gold + '40' : C.border}`,
                  opacity: isPast ? 0.4 : 1,
                  boxShadow: isCurrent ? `0 0 12px ${C.green}20` : 'none',
                  animation: isCurrent ? 'countPulse 2s ease-in-out infinite' : 'none',
                }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: isDay7 ? C.gold : isCurrent ? C.green : C.text3 }}>{isDay7 ? '👑' : 'D' + d.day}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: isPast ? C.text3 : isDay7 ? C.gold : isCurrent ? C.green : C.cyan, marginTop: 1 }}>+{d.xp}</div>
                  {isPast && <div style={{ fontSize: 8, marginTop: 1 }}>✅</div>}
                </div>
              )
            })}
          </div>
          <button
            onClick={claimDaily}
            style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, cursor: dailyCheckedIn ? 'default' : 'pointer', letterSpacing: 0.3, background: dailyCheckedIn ? C.bg3 : `linear-gradient(90deg,${C.green},${C.cyan})`, color: dailyCheckedIn ? C.text3 : '#fff', boxShadow: dailyCheckedIn ? 'none' : `0 0 20px ${C.green}30, 0 4px 12px rgba(0,0,0,0.3)`, animation: dailyCheckedIn ? 'none' : 'claimPulse 2s ease-in-out infinite' }}
          >
            {dailyCheckedIn ? 'Claimed Today' : 'Claim Daily Reward'}
          </button>
        </div>

        {/* Today's Challenges */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3 }}>TODAY'S CHALLENGES</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: completedChallenges.length >= DAILY_CHALLENGES.length ? C.gold : C.text3 }}>
              {completedChallenges.length}/{DAILY_CHALLENGES.length}
            </div>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: C.bg, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', borderRadius: 2, background: completedChallenges.length >= DAILY_CHALLENGES.length ? `linear-gradient(90deg,${C.gold},${C.orange})` : `linear-gradient(90deg,${C.green},${C.cyan})`, width: `${(completedChallenges.length / DAILY_CHALLENGES.length) * 100}%`, transition: 'width 0.5s ease' }} />
          </div>
          {DAILY_CHALLENGES.slice(0, 3).map((ch, i) => {
            const done = completedChallenges.includes(ch.id)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: done ? `linear-gradient(135deg, ${C.green}06, transparent)` : C.bg, border: `1px solid ${done ? C.green + '20' : C.border}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: done ? `${C.green}15` : C.bg3, border: `1px solid ${done ? C.green + '25' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  {done ? '✅' : ch.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: done ? C.text3 : C.text, fontWeight: 700, textDecoration: done ? 'line-through' : 'none' }}>{ch.task}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: done ? C.text3 : C.green }}>
                  {done ? 'Done' : '+' + Math.round(ch.reward * getCoinMultiplier()) + ' 🪙'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3, marginBottom: 10 }}>RECENT ACTIVITY</div>
          {playerProfile.gamesPlayed > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { game: playerProfile.favoriteGame === 'finalkick' ? 'Final Kick' : 'Games', result: 'Won', xpLabel: '+40 XP', icon: '🎮', color: C.green, time: '2h ago' },
                { game: 'Arena Session', result: playerProfile.gamesWon > 0 ? 'Won' : 'Played', xpLabel: '+20 XP', icon: '🏟️', color: C.cyan, time: '4h ago' },
                { game: 'Daily Check-in', result: dailyCheckedIn ? 'Claimed' : 'Pending', xpLabel: '+20 XP', icon: '📅', color: dailyCheckedIn ? C.green : C.orange, time: 'Today' },
                { game: 'Badge Earned', result: 'First Puff', xpLabel: '+50 XP', icon: '🏅', color: C.gold, time: 'Yesterday' },
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: `linear-gradient(135deg, ${act.color}04, transparent)`, border: `1px solid ${act.color}08` }}>
                  <div style={{ fontSize: 16 }}>{act.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{act.game}</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>{act.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: act.color }}>{act.result}</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>{act.xpLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 14, color: C.text3, fontSize: 11 }}>Play your first game to see activity here!</div>
          )}
        </div>
      </>}

      {/* ═══ ARENA TAB ═══ */}
      {loyaltyTab === 'arena' && <>
        {/* Game Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
          <StatCard icon="🎮" value={playerProfile.gamesPlayed} label="Played" color={C.cyan} />
          <StatCard icon="🏆" value={winRate + '%'} label="Win%" color={C.green} />
          <StatCard icon="🔥" value={bestWinStreak} label="Streak" color={C.orange} />
          <StatCard icon="🪙" value={coins.toLocaleString()} label="Earned" color={C.gold} />
        </div>

        {/* Badge Collection */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Badge Collection</div>
            <div style={{ padding: '3px 10px', borderRadius: 10, background: `linear-gradient(135deg,${C.purple}18,${C.pink}10)`, border: `1px solid ${C.purple}25`, fontSize: 11, fontWeight: 900, color: C.purple }}>
              {earnedBadgeCount}/{LOYALTY_BADGES.length}
            </div>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: C.bg, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${C.purple},${C.pink})`, width: `${(earnedBadgeCount / LOYALTY_BADGES.length) * 100}%`, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${C.purple}30` }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {LOYALTY_BADGES.map(b => {
              const earned = earnedBadges.includes(b.id)
              return (
                <div key={b.id} style={{ padding: 10, borderRadius: 14, textAlign: 'center', position: 'relative', overflow: 'hidden', background: earned ? 'linear-gradient(135deg, rgba(255,217,61,0.06), rgba(8,8,25,0.65))' : C.bg3, border: `1px solid ${earned ? C.gold + '30' : C.border}`, opacity: earned ? 1 : 0.35, boxShadow: earned ? `0 0 16px ${C.gold}08` : 'none', transition: 'all 0.3s ease' }}>
                  {earned && <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,217,61,0.08),transparent)', animation: 'lightSweep 3.5s ease-in-out infinite', pointerEvents: 'none' }} />}
                  <div style={{ fontSize: 28, filter: earned ? 'drop-shadow(0 0 6px rgba(255,217,61,0.3))' : 'grayscale(1)', animation: earned ? 'gentleFloat 3s ease-in-out infinite' : 'none' }}>{b.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: earned ? C.text : C.text3, marginTop: 4 }}>{b.name}</div>
                  {earned && <div style={{ fontSize: 7, color: C.gold, marginTop: 2, fontWeight: 800, letterSpacing: 0.8 }}>EARNED</div>}
                  {!earned && <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>🔒</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Shop */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Shop</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 10, background: `linear-gradient(135deg,${C.gold}15,${C.orange}08)`, border: `1px solid ${C.gold}25` }}>
              <span style={{ fontSize: 12 }}>🪙</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: C.gold }}>{coins.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {SHOP_ITEMS.map((item, i) => {
              const bought = ownedItems.includes(item.id)
              const canAfford = coins >= item.price
              const tierLocked = item.tier ? tier.idx < LOYALTY_TIERS.findIndex(t => t.name === item.tier) : false
              return (
                <div key={i} style={{ padding: 10, borderRadius: 14, textAlign: 'center', cursor: bought || tierLocked || !canAfford ? 'default' : 'pointer', opacity: bought ? 0.45 : 1, position: 'relative', overflow: 'hidden', background: bought ? C.bg3 : 'linear-gradient(135deg, rgba(8,8,25,0.72), rgba(8,8,25,0.65))', border: `1px solid ${C.border}`, transition: 'all 0.3s ease' }}>
                  {tierLocked && !bought && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 2, borderRadius: 14 }}>
                      <div style={{ fontSize: 18 }}>🔒</div>
                      <div style={{ fontSize: 7, fontWeight: 800, color: C.text3, marginTop: 2 }}>{item.tier}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 28, marginBottom: 4, filter: bought ? 'grayscale(0.5)' : 'none' }}>{item.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.text }}>{item.name}</div>
                  <div style={{ fontSize: 8, marginTop: 3, fontWeight: 700, color: bought ? C.text3 : canAfford ? C.gold : C.red }}>
                    {bought ? 'Owned' : tierLocked ? 'Locked' : item.price + ' 🪙'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Puff Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Total Puffs', value: playerProfile.totalPuffs, icon: '💨', color: C.cyan },
            { label: 'Blinkers', value: playerProfile.blinkerCount, icon: '💀', color: C.red },
            { label: 'Puff Time', value: Math.floor(playerProfile.totalPuffTime / 60) + 'm', icon: '⏱️', color: C.purple },
          ].map((st, i) => (
            <div key={i} style={{ ...GLASS_CARD, borderRadius: 14, padding: 12, textAlign: 'center', background: `linear-gradient(135deg, ${st.color}06, rgba(8,8,25,0.72))`, border: `1px solid ${st.color}15` }}>
              <div style={{ fontSize: 16 }}>{st.icon}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: st.color, textShadow: `0 0 8px ${st.color}20` }}>{st.value}</div>
              <div style={{ fontSize: 7, color: C.text3, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{st.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Device status */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>🔵 Device</div>
          <div style={{ fontSize: 11, color: bleConnected ? C.green : C.text3 }}>
            {bleConnected ? '✓ Cali Clear Connected — rewards boosted 1.2x' : 'No device connected — connect for bonus rewards'}
          </div>
        </div>
      </>}

      {/* ═══ SOCIAL TAB ═══ */}
      {loyaltyTab === 'social' && <>
        {/* Friends Online */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Friends Online</div>
            <div style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>
              {MOCK_FRIENDS.filter(f => f.status === 'online').length} online
            </div>
          </div>
          {MOCK_FRIENDS.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, marginBottom: 6, background: f.status === 'online' ? `linear-gradient(135deg, ${C.green}04, transparent)` : 'rgba(255,255,255,0.02)', border: `1px solid ${f.status === 'online' ? C.green + '12' : C.border}` }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.bg3}, ${C.purple}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${C.border}` }}>
                  {f.avatar}
                </div>
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', border: `2px solid ${C.bg3}`, background: f.status === 'online' ? C.green : f.status === 'away' ? C.orange : C.text3, boxShadow: f.status === 'online' ? `0 0 6px ${C.green}60` : 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{f.name}</div>
                {f.playing ? (
                  <div style={{ fontSize: 9, color: C.cyan, marginTop: 1 }}>Playing {f.playing}</div>
                ) : (
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>
                    {f.status === 'online' ? 'In the Arena' : f.status === 'away' ? 'Away' : 'Offline'}
                  </div>
                )}
              </div>
              {f.status === 'online' && (
                <div onClick={() => notify('Challenge coming soon', C.cyan)} style={{ cursor: 'pointer', padding: '5px 10px', borderRadius: 8, fontSize: 9, fontWeight: 700, background: `${C.cyan}12`, border: `1px solid ${C.cyan}20`, color: C.cyan }}>
                  Challenge
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Communities */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>Communities</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {MOCK_COMMUNITIES.map((comm, i) => (
              <div key={i} onClick={() => notify('Community hub coming soon', C.purple)} style={{ cursor: 'pointer', padding: 14, borderRadius: 14, textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(8,8,25,0.72), rgba(8,8,25,0.6))', border: `1px solid ${comm.active ? C.purple + '20' : C.border}`, boxShadow: comm.active ? `0 0 16px ${C.purple}08` : 'none', transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{comm.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{comm.name}</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>{comm.members.toLocaleString()} members</div>
                {comm.active && <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}60` }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Collection */}
        <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>Collection</div>
          {MOCK_COLLECTIONS.map((coll, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: `linear-gradient(135deg, ${coll.color}04, transparent)`, border: `1px solid ${coll.color}10` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${coll.color}15, ${C.bg3})`, border: `1px solid ${coll.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {coll.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{coll.name}</div>
                <div style={{ height: 4, borderRadius: 2, background: C.bg, overflow: 'hidden', marginTop: 4, width: '100%' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${coll.color},${coll.color}aa)`, width: `${(coll.count / coll.total) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: coll.color }}>{coll.count}/{coll.total}</div>
            </div>
          ))}
        </div>
      </>}

      <div style={{ height: 80 }} />
    </div>
  )
}
