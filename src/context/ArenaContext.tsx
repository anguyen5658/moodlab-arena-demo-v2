import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { useAudio } from '@/hooks/useAudio'
import { useBle } from '@/hooks/useBle'
import { FloatingReward } from '@/components/FloatingReward'
import { AchievementPopup } from '@/components/AchievementPopup'
import {
  LOYALTY_TIERS, LOYALTY_BADGES, DAILY_REWARDS, DAILY_CHALLENGES, SHOP_ITEMS,
} from '@/constants/config'
import { PLAY_GAMES } from '@/constants/games'
import { C } from '@/constants/theme'
import type { ArenaContextValue, LoyaltyBadge, ShopItem, FloatingRewardData } from '@/types'

const ArenaContext = createContext<ArenaContextValue | null>(null)

interface ArenaProviderProps {
  children: ReactNode
}

export function ArenaProvider({ children }: ArenaProviderProps) {
  // ── Currency ──
  const [coins, setCoins] = useState(12580)
  const [xp, setXp] = useState(7450)

  // ── Loyalty ──
  const [dailyStreak, setDailyStreak] = useState(0)
  const [dailyCheckedIn, setDailyCheckedIn] = useState(false)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [earnedBadges, setEarnedBadges] = useState<string[]>(['fp'])
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])
  const [currentWinStreak, setCurrentWinStreak] = useState(0)
  const [bestWinStreak, setBestWinStreak] = useState(0)
  const [sessionGamesPlayed, setSessionGamesPlayed] = useState<string[]>([])
  const [chatsSent, setChatsSent] = useState(0)
  const [fortuneCooldown, setFortuneCooldown] = useState<Record<string, number>>({})

  // ── Profile ──
  const [deviceRegistered] = useState(false)
  const [deviceActivated] = useState(true)
  const [currentZone, setCurrentZone] = useState<string | null>(null)

  // ── UI Overlays ──
  const [floatingReward, setFloatingReward] = useState<FloatingRewardData | null>(null)
  const [achievementPopup, setAchievementPopup] = useState<LoyaltyBadge | null>(null)
  const [coinPulse, setCoinPulse] = useState(false)

  // ── Player profile tracking ──
  const playerProfileRef = useRef({ gamesPlayed: 0, blinkerCount: 0, perfectCount: 0, totalPuffTime: 0 })

  // ── Audio ──
  const { audioOn, setAudioOn, playFx, playAudio } = useAudio()

  // ── Notification (transient toast) ──
  const notify = useCallback((msg: string, _color: string) => {
    // Simple implementation — could upgrade to a toast stack
    console.info(`[notify] ${msg}`)
  }, [])

  // ── Confetti ──
  const spawnConfetti = useCallback((_count: number, _colors: string[]) => {
    // Confetti logic can be wired to a global overlay component later
  }, [])

  // ── BLE ──
  const ble = useBle({ playFx, notify })

  // ── Helpers ──
  const getCurrentTier = useCallback(() => {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (xp >= LOYALTY_TIERS[i].xpReq) return { ...LOYALTY_TIERS[i], idx: i }
    }
    return { ...LOYALTY_TIERS[0], idx: 0 }
  }, [xp])

  const getCoinMultiplier = useCallback(() => {
    const tier = getCurrentTier()
    const deviceBonus = ble.bleConnected ? 1.2 : 1.0
    const mult = tier.mult * deviceBonus
    return isNaN(mult) ? 1.0 : mult
  }, [getCurrentTier, ble.bleConnected])

  const showFloatingReward = useCallback((coinsAmt: number, xpAmt: number) => {
    setFloatingReward({ coins: coinsAmt, xp: xpAmt, key: Date.now() })
    setCoinPulse(true)
    setTimeout(() => {
      setFloatingReward(null)
      setCoinPulse(false)
    }, 2000)
  }, [])

  const showAchievementPopup = useCallback((badge: LoyaltyBadge) => {
    setAchievementPopup(badge)
    playFx('achievement')
    setTimeout(() => setAchievementPopup(null), 3000)
  }, [playFx])

  const earnBadge = useCallback((id: string) => {
    setEarnedBadges(prev => {
      if (prev.includes(id)) return prev
      const badge = LOYALTY_BADGES.find(b => b.id === id)
      if (badge) setTimeout(() => showAchievementPopup(badge), 600)
      return [...prev, id]
    })
  }, [showAchievementPopup])

  const awardXP = useCallback((amount: number, _reason: string) => {
    const safeAmount = Math.max(0, Number(amount) || 0)
    setXp(x => {
      const newXp = x + safeAmount
      const currentIdx = (() => {
        for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
          if (x >= LOYALTY_TIERS[i].xpReq) return i
        }
        return 0
      })()
      for (let i = currentIdx + 1; i < LOYALTY_TIERS.length; i++) {
        if (newXp >= LOYALTY_TIERS[i].xpReq) {
          setTimeout(() => {
            playFx('level_up')
            notify(
              `TIER UP! ${LOYALTY_TIERS[i].icon} ${LOYALTY_TIERS[i].name} — ${LOYALTY_TIERS[i].mult}x multiplier!`,
              LOYALTY_TIERS[i].color
            )
            spawnConfetti(50, [LOYALTY_TIERS[i].color, C.gold, '#fff'])
            if (LOYALTY_TIERS[i].name === 'Legend') earnBadge('legend')
          }, 500)
          break
        }
      }
      return newXp
    })
  }, [playFx, notify, spawnConfetti, earnBadge])

  const claimDaily = useCallback(() => {
    if (dailyCheckedIn) return
    const dayIdx = dailyStreak % 7
    const reward = DAILY_REWARDS[dayIdx]
    awardXP(reward.xp, 'daily_checkin')
    if (ble.bleConnected && reward.coins) {
      setCoins(c => c + reward.coins)
      playFx('coin_collect')
      notify(`+${reward.coins} 🪙 +${reward.xp} XP — Streak ${dailyStreak + 1} 🔥`, C.green)
    } else {
      playFx('success')
      notify(`+${reward.xp} XP — Streak ${dailyStreak + 1} 🔥  (Connect device for coins!)`, C.cyan)
    }
    setDailyStreak(s => s + 1)
    setDailyCheckedIn(true)
    if ((dailyStreak + 1) % 7 === 0) {
      playFx('crowd')
      earnBadge('weekwarrior')
    }
  }, [dailyCheckedIn, dailyStreak, awardXP, ble.bleConnected, playFx, notify, earnBadge])

  const completeChallenge = useCallback((challengeId: string) => {
    if (completedChallenges.includes(challengeId)) return
    const ch = DAILY_CHALLENGES.find(c => c.id === challengeId)
    if (!ch) return
    const mult = getCoinMultiplier()
    const earnedCoins = Math.round(ch.reward * mult)
    setCoins(c => c + earnedCoins)
    setXp(x => x + ch.xpReward)
    setCompletedChallenges(cc => {
      const next = [...cc, challengeId]
      if (next.length >= DAILY_CHALLENGES.length) {
        setTimeout(() => {
          const bonusCoins = Math.round(50 * mult)
          setCoins(c => c + bonusCoins)
          notify(`All challenges done! +${bonusCoins} BONUS`, C.gold)
          playFx('win')
        }, 800)
      }
      return next
    })
    playFx('success')
    notify(`+${earnedCoins} coins Challenge complete!`, C.green)
  }, [completedChallenges, getCoinMultiplier, playFx, notify])

  const buyShopItem = useCallback((item: ShopItem) => {
    if (ownedItems.includes(item.id)) return
    if (coins < item.price) { notify('Not enough coins!', C.red); return }
    if (item.tier) {
      const tier = getCurrentTier()
      const tierIdx = LOYALTY_TIERS.findIndex(t => t.name === item.tier)
      if (tier.idx < tierIdx) { notify(`Requires ${item.tier} tier!`, C.orange); return }
    }
    setCoins(c => c - item.price)
    setOwnedItems(o => {
      const next = [...o, item.id]
      if (next.length >= 5) earnBadge('collector')
      return next
    })
    playFx('success')
    notify(`Purchased ${item.name}!`, C.green)
  }, [ownedItems, coins, getCurrentTier, playFx, notify, earnBadge])

  const awardGame = useCallback(({ won, baseCoins, baseXP }: { won: boolean; baseCoins: number; baseXP: number }) => {
    const safeCoins = Math.max(0, Math.round(Number(baseCoins) || 0))
    const safeXP = Math.max(0, Number(baseXP) || 0)
    const deviceGameMult = ble.bleConnected ? 1.0 : 0.7
    const totalCoins = Math.round(safeCoins * deviceGameMult)
    const totalXP = safeXP + (won ? 15 : 5)

    setCoins(c => c + totalCoins)
    awardXP(totalXP, won ? 'game_win' : 'game_played')
    showFloatingReward(totalCoins, totalXP)

    // Update profile tracking
    playerProfileRef.current.gamesPlayed += 1

    // Daily challenges
    if (won) completeChallenge('win1')
    if (playerProfileRef.current.gamesPlayed >= 3) setTimeout(() => completeChallenge('play3'), 400)

    // Badges
    if (playerProfileRef.current.blinkerCount >= 10) earnBadge('blinker')
    if (playerProfileRef.current.gamesPlayed >= PLAY_GAMES.length) earnBadge('allgames')
    if (playerProfileRef.current.gamesPlayed >= 100) earnBadge('puff100')
    if (playerProfileRef.current.gamesPlayed <= 1 && earnedBadges.includes('fp')) {
      setTimeout(() => {
        const badge = LOYALTY_BADGES.find(b => b.id === 'fp')
        if (badge) showAchievementPopup(badge)
      }, 2000)
    }

    if (won) {
      if (currentZone === 'stage') earnBadge('showchamp')
      setCurrentWinStreak(s => {
        const newStreak = s + 1
        setBestWinStreak(b => Math.max(b, newStreak))
        if (newStreak === 3) notify('3 Win Streak!', C.orange)
        if (newStreak === 5) { notify('5 Win Streak! +50 bonus!', C.gold); setCoins(c => c + 50); playFx('streak_fire') }
        if (newStreak === 10) { notify('10 WIN STREAK! +200 bonus!', C.pink); setCoins(c => c + 200); playFx('crowd'); spawnConfetti(60, [C.gold, C.pink, C.cyan, '#fff']) }
        if (newStreak === 5) earnBadge('streak5')
        if (newStreak === 10) earnBadge('streak10')
        return newStreak
      })
    } else {
      if (currentWinStreak >= 3) notify(`Streak ended at ${currentWinStreak}`, C.text3)
      setCurrentWinStreak(0)
    }
  }, [
    ble.bleConnected, awardXP, showFloatingReward, completeChallenge, earnBadge,
    earnedBadges, currentWinStreak, currentZone, playFx, notify, spawnConfetti,
    showAchievementPopup,
  ])

  const value: ArenaContextValue = {
    // Currency
    coins, xp, setCoins, setXp,
    awardXP, awardGame, getCoinMultiplier,

    // Loyalty
    dailyStreak, dailyCheckedIn,
    ownedItems, earnedBadges, completedChallenges,
    currentWinStreak, bestWinStreak,
    sessionGamesPlayed, chatsSent, fortuneCooldown,
    setCurrentWinStreak, setBestWinStreak,
    setSessionGamesPlayed, setChatsSent, setFortuneCooldown,
    claimDaily, completeChallenge, earnBadge, buyShopItem,

    // BLE
    bleConnected: ble.bleConnected,
    btPuffActive: ble.btPuffActive,
    bleScanning: ble.bleScanning,
    connectBle: ble.connectBle,
    disconnectBle: ble.disconnectBle,
    registerPuffHandlers: ble.registerPuffHandlers,

    // Audio
    audioOn, setAudioOn, playFx, playAudio,

    // Overlays
    floatingReward, achievementPopup, coinPulse,
    showFloatingReward, showAchievementPopup, notify, spawnConfetti,

    // Profile
    deviceRegistered, deviceActivated,
    currentZone, setCurrentZone,
  }

  return (
    <ArenaContext.Provider value={value}>
      {children}
      <FloatingReward data={floatingReward} />
      <AchievementPopup badge={achievementPopup} />
    </ArenaContext.Provider>
  )
}

export function useArena(): ArenaContextValue {
  const ctx = useContext(ArenaContext)
  if (!ctx) throw new Error('useArena must be used inside ArenaProvider')
  return ctx
}
