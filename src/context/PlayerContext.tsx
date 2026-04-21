import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  LOYALTY_TIERS, LOYALTY_BADGES, DAILY_REWARDS, DAILY_CHALLENGES,
  PLAY_GAMES, SHOW_GAMES, C
} from '../constants'
import { useAudioContext } from './AudioContext'

interface PlayerProfile {
  rank: string
  rankProgress: number
  totalPuffs: number
  totalPuffTime: number
  blinkerCount: number
  streak: number
  lastActive: number
  achievements: string[]
  gamesPlayed: number
  gamesWon: number
  favoriteGame: string
  crewName: string | null
  joinDate: number
}

interface NotifState {
  msg: string
  color: string
}

interface FloatingRewardState {
  coins: number
  xp: number
  key: number
}

interface PlayerContextValue {
  coins: number
  setCoins: React.Dispatch<React.SetStateAction<number>>
  xp: number
  setXp: React.Dispatch<React.SetStateAction<number>>
  dailyStreak: number
  setDailyStreak: React.Dispatch<React.SetStateAction<number>>
  dailyCheckedIn: boolean
  setDailyCheckedIn: React.Dispatch<React.SetStateAction<boolean>>
  ownedItems: string[]
  setOwnedItems: React.Dispatch<React.SetStateAction<string[]>>
  earnedBadges: string[]
  setEarnedBadges: React.Dispatch<React.SetStateAction<string[]>>
  completedChallenges: string[]
  setCompletedChallenges: React.Dispatch<React.SetStateAction<string[]>>
  currentWinStreak: number
  setCurrentWinStreak: React.Dispatch<React.SetStateAction<number>>
  bestWinStreak: number
  setBestWinStreak: React.Dispatch<React.SetStateAction<number>>
  floatingReward: FloatingRewardState | null
  setFloatingReward: React.Dispatch<React.SetStateAction<FloatingRewardState | null>>
  coinPulse: boolean
  achievementPopup: any
  setAchievementPopup: React.Dispatch<React.SetStateAction<any>>
  chatsSent: number
  setChatsSent: React.Dispatch<React.SetStateAction<number>>
  sessionGamesPlayed: string[]
  fortuneCooldown: Record<string, number>
  setFortuneCooldown: React.Dispatch<React.SetStateAction<Record<string, number>>>
  welcomeBackShown: boolean
  deviceRegistered: boolean
  setDeviceRegistered: React.Dispatch<React.SetStateAction<boolean>>
  deviceActivated: boolean
  setDeviceActivated: React.Dispatch<React.SetStateAction<boolean>>
  playerProfile: PlayerProfile
  setPlayerProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>
  showProfile: boolean
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>
  showAchievements: boolean
  setShowAchievements: React.Dispatch<React.SetStateAction<boolean>>
  notif: NotifState | null
  confettiParticles: any[]
  smokeParticles: any[]
  // actions
  notify: (msg: string, color?: string) => void
  awardXP: (amount: number, reason?: string) => void
  showFloatingReward: (coins: number, xpAmt: number) => void
  showAchievementPopup: (badge: any) => void
  spawnConfetti: (count?: number, colors?: string[]) => void
  spawnSmoke: (count?: number) => void
  getCurrentTier: () => any
  getCoinMultiplier: (bleConnected?: boolean) => number
  recordGameResult: (won: boolean, baseCoins: number, baseXP: number, deps: { bleConnected: boolean; zone: string; gameActive: any }) => void
  claimDaily: (deps: { bleConnected: boolean }) => void
  completeChallenge: (challengeId: string) => void
  buyShopItem: (item: any) => void
  updateProfileAfterGame: (won: boolean) => void
}

const PlayerCtx = createContext<PlayerContextValue>(null!)
export const usePlayerContext = () => useContext(PlayerCtx)

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audio = useAudioContext()

  // ── Economy State ──
  const [coins, setCoins] = useState(12580)
  const [xp, setXp] = useState(7450)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [dailyCheckedIn, setDailyCheckedIn] = useState(false)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [earnedBadges, setEarnedBadges] = useState<string[]>(["fp"])
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])
  const [currentWinStreak, setCurrentWinStreak] = useState(0)
  const [bestWinStreak, setBestWinStreak] = useState(0)
  const [floatingReward, setFloatingReward] = useState<FloatingRewardState | null>(null)
  const [coinPulse, setCoinPulse] = useState(false)
  const [achievementPopup, setAchievementPopup] = useState<any>(null)
  const [chatsSent, setChatsSent] = useState(0)
  const [sessionGamesPlayed, setSessionGamesPlayed] = useState<string[]>([])
  const [fortuneCooldown, setFortuneCooldown] = useState<Record<string, number>>({})
  const [welcomeBackShown, setWelcomeBackShown] = useState(false)
  const [deviceRegistered, setDeviceRegistered] = useState(false)
  const [deviceActivated, setDeviceActivated] = useState(true)

  // ── Profile State ──
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    rank: "Gold",
    rankProgress: 35,
    totalPuffs: 420,
    totalPuffTime: 1260,
    blinkerCount: 69,
    streak: 5,
    lastActive: Date.now(),
    achievements: ["first_puff", "first_win", "blinker_king"],
    gamesPlayed: 47,
    gamesWon: 28,
    favoriteGame: "finalkick",
    crewName: null,
    joinDate: Date.now() - 86400000 * 42,
  })
  const [showProfile, setShowProfile] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)

  // ── UI State owned by Player ──
  const [notif, setNotif] = useState<NotifState | null>(null)
  const [confettiParticles, setConfettiParticles] = useState<any[]>([])
  const [smokeParticles, setSmokeParticles] = useState<any[]>([])

  // ── localStorage load ──
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moodlab_loyalty') || 'null')
      if (saved) {
        if (saved.coins !== undefined) setCoins(saved.coins)
        if (saved.xp !== undefined) setXp(saved.xp)
        if (saved.dailyStreak !== undefined) setDailyStreak(saved.dailyStreak)
        if (saved.dailyCheckedIn !== undefined) setDailyCheckedIn(saved.dailyCheckedIn)
        if (saved.earnedBadges?.length) setEarnedBadges(saved.earnedBadges)
        if (saved.ownedItems?.length) setOwnedItems(saved.ownedItems)
        if (saved.completedChallenges?.length) setCompletedChallenges(saved.completedChallenges)
        if (saved.currentWinStreak !== undefined) setCurrentWinStreak(saved.currentWinStreak)
        if (saved.bestWinStreak !== undefined) setBestWinStreak(saved.bestWinStreak)
        if (saved.deviceRegistered !== undefined) setDeviceRegistered(saved.deviceRegistered)
        if (saved.deviceActivated !== undefined) setDeviceActivated(saved.deviceActivated)
        if (saved.chatsSent !== undefined) setChatsSent(saved.chatsSent)
      }
    } catch (e) {}
  }, [])

  // ── localStorage save ──
  useEffect(() => {
    try {
      localStorage.setItem('moodlab_loyalty', JSON.stringify({
        coins, xp, dailyStreak, dailyCheckedIn, earnedBadges,
        ownedItems, completedChallenges, currentWinStreak, bestWinStreak,
        deviceRegistered, deviceActivated, chatsSent
      }))
    } catch (e) {}
  }, [coins, xp, dailyStreak, dailyCheckedIn, earnedBadges, ownedItems, completedChallenges, currentWinStreak, bestWinStreak, deviceRegistered, deviceActivated, chatsSent])

  // ── Coin pulse ──
  useEffect(() => {
    if (coins > 0) {
      setCoinPulse(true)
      setTimeout(() => setCoinPulse(false), 600)
    }
  }, [coins])

  // ── Actions ──
  const notify = (msg: string, color = C.cyan) => {
    setNotif({ msg, color })
    setTimeout(() => setNotif(null), 2200)
  }

  const spawnConfetti = (count = 30, colors = [C.cyan, C.gold, C.green, C.pink, C.orange]) => {
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, x: 30 + Math.random() * 40, y: -5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3,
      rot: Math.random() * 360, size: 3 + Math.random() * 5,
    }))
    setConfettiParticles(p => [...p, ...particles].slice(-50))
    setTimeout(() => setConfettiParticles([]), 3000)
  }

  const spawnSmoke = (count = 8) => {
    const puffs = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, x: 20 + Math.random() * 60, y: 70 + Math.random() * 20,
      size: 20 + Math.random() * 40, dur: 2 + Math.random() * 2,
    }))
    setSmokeParticles(p => [...p, ...puffs].slice(-20))
    setTimeout(() => setSmokeParticles([]), 4000)
  }

  const getCurrentTier = () => {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (xp >= LOYALTY_TIERS[i].xpReq) return { ...LOYALTY_TIERS[i], idx: i }
    }
    return { ...LOYALTY_TIERS[0], idx: 0 }
  }

  const getCoinMultiplier = (bleConnected = false) => {
    const tier = getCurrentTier()
    const deviceBonus = bleConnected ? 1.2 : 1.0
    const mult = tier.mult * deviceBonus
    return isNaN(mult) ? 1.0 : mult
  }

  const showFloatingReward = (c: number, xpAmt: number) => {
    setFloatingReward({ coins: c, xp: xpAmt, key: Date.now() })
    setTimeout(() => setFloatingReward(null), 2000)
  }

  const showAchievementPopup = (badge: any) => {
    setAchievementPopup(badge)
    audio.playFx("achievement")
    setTimeout(() => setAchievementPopup(null), 3000)
  }

  const awardXP = (amount: number, _reason?: string) => {
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
            audio.playFx("level_up")
            notify("TIER UP! " + LOYALTY_TIERS[i].icon + " " + LOYALTY_TIERS[i].name + " -- " + LOYALTY_TIERS[i].mult + "x multiplier!", LOYALTY_TIERS[i].color)
            spawnConfetti(50, [LOYALTY_TIERS[i].color, C.gold, "#fff"])
            if (LOYALTY_TIERS[i].name === "Legend") {
              setEarnedBadges(b => {
                if (!b.includes("legend")) {
                  const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "legend")
                  if (badge) setTimeout(() => showAchievementPopup(badge), 1500)
                  return [...b, "legend"]
                }
                return b
              })
            }
          }, 500)
          break
        }
      }
      return newXp
    })
  }

  const updateProfileAfterGame = (won: boolean) => {
    setPlayerProfile(p => ({
      ...p,
      gamesPlayed: p.gamesPlayed + 1,
      gamesWon: won ? p.gamesWon + 1 : p.gamesWon,
      totalPuffs: p.totalPuffs + 1,
      rankProgress: Math.min(100, p.rankProgress + (won ? 8 : 3)),
    }))
  }

  const completeChallenge = (challengeId: string) => {
    if (completedChallenges.includes(challengeId)) return
    const ch = DAILY_CHALLENGES.find((c: any) => c.id === challengeId)
    if (!ch) return
    const mult = getCoinMultiplier()
    const earnedCoins = Math.round(ch.reward * mult)
    setCoins(c => c + earnedCoins)
    setXp(x => x + ch.xpReward)
    setCompletedChallenges(cc => [...cc, challengeId])
    audio.playFx("success")
    notify("+" + earnedCoins + " coins Challenge complete!", C.green)
    if (completedChallenges.length + 1 >= DAILY_CHALLENGES.length) {
      setTimeout(() => {
        const bonusCoins = Math.round(50 * mult)
        setCoins(c => c + bonusCoins)
        notify("All challenges done! +" + bonusCoins + " BONUS", C.gold)
        audio.playFx("win")
      }, 800)
    }
  }

  const recordGameResult = (won: boolean, baseCoins: number, baseXP: number, deps: { bleConnected: boolean; zone: string; gameActive: any }) => {
    const safeCoins = Math.max(0, Math.round(Number(baseCoins) || 0))
    const safeXP = Math.max(0, Number(baseXP) || 0)
    const deviceGameMult = deps.bleConnected ? 1.0 : 0.7
    const totalCoins = Math.round(safeCoins * deviceGameMult)
    const totalXP = safeXP + (won ? 15 : 5)

    setCoins(c => c + totalCoins)
    awardXP(totalXP, won ? "game_win" : "game_played")
    updateProfileAfterGame(won)
    showFloatingReward(totalCoins, totalXP)

    if (won && !completedChallenges.includes("win1")) {
      completeChallenge("win1")
    }

    setPlayerProfile(p => {
      if (p.gamesPlayed >= 3 && !completedChallenges.includes("play3")) {
        setTimeout(() => completeChallenge("play3"), 400)
      }
      return p
    })

    setEarnedBadges(b => {
      const updates = [...b]
      if (!updates.includes("blinker") && playerProfile.blinkerCount >= 10) {
        updates.push("blinker")
        const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "blinker")
        if (badge) setTimeout(() => showAchievementPopup(badge), 800)
      }
      if (!updates.includes("allgames") && playerProfile.gamesPlayed >= PLAY_GAMES.length) {
        updates.push("allgames")
        const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "allgames")
        if (badge) setTimeout(() => showAchievementPopup(badge), 800)
      }
      if (!updates.includes("puff100") && playerProfile.gamesPlayed >= 100) {
        updates.push("puff100")
        const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "puff100")
        if (badge) setTimeout(() => showAchievementPopup(badge), 800)
      }
      return updates
    })

    if (playerProfile.gamesPlayed <= 1 && earnedBadges.includes("fp")) {
      const fpBadge = LOYALTY_BADGES.find((b: any) => b.id === "fp")
      if (fpBadge) setTimeout(() => showAchievementPopup(fpBadge), 2000)
    }

    if (won) {
      if (deps.zone === "stage" && !earnedBadges.includes("showchamp")) {
        setEarnedBadges(b => {
          if (!b.includes("showchamp")) {
            const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "showchamp")
            if (badge) setTimeout(() => showAchievementPopup(badge), 800)
            return [...b, "showchamp"]
          }
          return b
        })
      }
      setCurrentWinStreak(s => {
        const newStreak = s + 1
        setBestWinStreak(b => Math.max(b, newStreak))
        if (newStreak === 3) notify("3 Win Streak!", C.orange)
        if (newStreak === 5) { notify("5 Win Streak! +50 bonus!", C.gold); setCoins(c => c + 50); audio.playFx("streak_fire") }
        if (newStreak === 10) { notify("10 WIN STREAK! +200 bonus!", C.pink); setCoins(c => c + 200); audio.playFx("crowd"); spawnConfetti(60, [C.gold, C.pink, C.cyan, "#fff"]) }
        if (newStreak === 5) {
          setEarnedBadges(b => {
            if (!b.includes("streak5")) {
              const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "streak5")
              if (badge) setTimeout(() => showAchievementPopup(badge), 800)
              return [...b, "streak5"]
            }
            return b
          })
        }
        if (newStreak === 10) {
          setEarnedBadges(b => {
            if (!b.includes("streak10")) {
              const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "streak10")
              if (badge) setTimeout(() => showAchievementPopup(badge), 800)
              return [...b, "streak10"]
            }
            return b
          })
        }
        return newStreak
      })
    } else {
      if (currentWinStreak >= 3) notify("Streak ended at " + currentWinStreak, (C as any).text3)
      setCurrentWinStreak(0)
    }

    const gId = deps.gameActive?.id
    if (gId && !sessionGamesPlayed.includes(gId)) {
      setSessionGamesPlayed(prev => {
        const updated = [...prev, gId]
        if (updated.length === 5) {
          setTimeout(() => {
            setCoins(c => c + Math.round(50 * getCoinMultiplier(deps.bleConnected)))
            notify("🎯 Explorer Bonus! 5 games played! +50 🪙", C.purple)
            audio.playFx("achievement")
          }, 1500)
        }
        const getZone = (id: string) => {
          if (PLAY_GAMES.find((g: any) => g.id === id)) return "arcade"
          if (SHOW_GAMES.find((g: any) => g.id === id)) return "stage"
          return "fortune"
        }
        const zones = updated.map(getZone)
        const uniqueZones = [...new Set(zones)]
        if (uniqueZones.length === 3 && prev.length > 0) {
          const prevZones = [...new Set(prev.map(getZone))]
          if (prevZones.length < 3) {
            setTimeout(() => {
              setCoins(c => c + Math.round(100 * getCoinMultiplier(deps.bleConnected)))
              notify("🌟 All-Rounder! All 3 zones! +100 🪙", C.gold)
              audio.playFx("crowd")
            }, 2500)
          }
        }
        return updated
      })
    }

    localStorage.setItem('moodlab_lastActive', Date.now().toString())
  }

  const claimDaily = (deps: { bleConnected: boolean }) => {
    if (dailyCheckedIn) return
    const dayIdx = dailyStreak % 7
    const reward = DAILY_REWARDS[dayIdx]
    awardXP(reward.xp, "daily_checkin")
    if (deps.bleConnected && reward.coins) {
      setCoins(c => c + reward.coins)
      audio.playFx("coin_collect")
      notify("+" + reward.coins + " 🪙 +" + reward.xp + " XP — Streak " + (dailyStreak + 1) + " 🔥", C.green)
    } else {
      audio.playFx("success")
      notify("+" + reward.xp + " XP — Streak " + (dailyStreak + 1) + " 🔥  (Connect device for coins!)", C.cyan)
    }
    setDailyStreak(s => s + 1)
    setDailyCheckedIn(true)
    if ((dailyStreak + 1) % 7 === 0) {
      audio.playFx("crowd")
      setEarnedBadges(b => {
        if (!b.includes("weekwarrior")) {
          const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "weekwarrior")
          if (badge) setTimeout(() => showAchievementPopup(badge), 600)
          return [...b, "weekwarrior"]
        }
        return b
      })
    }
  }

  const buyShopItem = (item: any) => {
    if (ownedItems.includes(item.id)) return
    if (coins < item.price) { notify("Not enough coins!", C.red); return }
    if (item.tier) {
      const tier = getCurrentTier()
      const tierIdx = LOYALTY_TIERS.findIndex((t: any) => t.name === item.tier)
      if (tier.idx < tierIdx) { notify("Requires " + item.tier + " tier!", C.orange); return }
    }
    setCoins(c => c - item.price)
    setOwnedItems(o => [...o, item.id])
    audio.playFx("success")
    notify("Purchased " + item.name + "!", C.green)
    if (ownedItems.length + 1 >= 5 && !earnedBadges.includes("collector")) {
      setEarnedBadges(b => {
        if (!b.includes("collector")) {
          const badge = LOYALTY_BADGES.find((b2: any) => b2.id === "collector")
          if (badge) setTimeout(() => showAchievementPopup(badge), 600)
          return [...b, "collector"]
        }
        return b
      })
    }
  }

  // ── Welcome back bonus ──
  useEffect(() => {
    const stored = localStorage.getItem('moodlab_lastActive')
    if (stored) {
      const daysSince = Math.floor((Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24))
      if (daysSince >= 3 && !welcomeBackShown) {
        let bonus = 0
        let message = ""
        if (daysSince >= 30) { bonus = 1000; message = "Legend returns! 👑" }
        else if (daysSince >= 14) { bonus = 500; message = "The Arena awaits! 🏆" }
        else if (daysSince >= 7) { bonus = 200; message = "We missed you! 🔥" }
        else if (daysSince >= 3) { bonus = 100; message = "Welcome back! 🎉" }
        if (bonus > 0) {
          setTimeout(() => {
            setCoins(c => c + bonus)
            awardXP(50, "welcome_back")
            notify(message + " +" + bonus + " coins!", C.gold)
            showFloatingReward(bonus, 50)
            spawnConfetti(30, [C.gold, C.cyan, C.green])
            audio.playFx("crowd")
            setWelcomeBackShown(true)
          }, 2000)
        }
      }
    }
    localStorage.setItem('moodlab_lastActive', Date.now().toString())
  }, [])

  return (
    <PlayerCtx.Provider value={{
      coins, setCoins, xp, setXp, dailyStreak, setDailyStreak, dailyCheckedIn, setDailyCheckedIn,
      ownedItems, setOwnedItems, earnedBadges, setEarnedBadges, completedChallenges, setCompletedChallenges,
      currentWinStreak, setCurrentWinStreak, bestWinStreak, setBestWinStreak,
      floatingReward, setFloatingReward, coinPulse, achievementPopup, setAchievementPopup,
      chatsSent, setChatsSent, sessionGamesPlayed, fortuneCooldown, setFortuneCooldown,
      welcomeBackShown, deviceRegistered, setDeviceRegistered, deviceActivated, setDeviceActivated,
      playerProfile, setPlayerProfile, showProfile, setShowProfile, showAchievements, setShowAchievements,
      notif, confettiParticles, smokeParticles,
      notify, awardXP, showFloatingReward, showAchievementPopup, spawnConfetti, spawnSmoke,
      getCurrentTier, getCoinMultiplier, recordGameResult, claimDaily, completeChallenge, buyShopItem, updateProfileAfterGame,
    }}>
      {children}
    </PlayerCtx.Provider>
  )
}
