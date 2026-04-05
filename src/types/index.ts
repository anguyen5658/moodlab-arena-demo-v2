import type React from 'react'

// ── Navigation / Routing ──
export type ZoneId = 'arcade' | 'stage' | 'fortune' | 'wall' | 'worldcup'
export type TabId = 'arena' | 'control' | 'live' | 'me'
export type GamePhase = 'intro' | 'playing' | 'result'

// ── Game Definitions ──
export interface GameDefinition {
  id: string
  name: string
  emoji: string
  players: string
  time: string
  type: string
  color: string
  desc: string
  hot?: boolean
  live?: boolean
  difficulty: number
}

// ── Zone Theme ──
export interface ZoneTheme {
  primary: string
  glow: string
  dim: string
  name: string
  icon: string
  sub: string
}

// ── Design Tokens ──
export interface ColorPalette {
  bg: string
  bg2: string
  bg3: string
  card: string
  border: string
  border2: string
  text: string
  text2: string
  text3: string
  cyan: string
  gold: string
  pink: string
  purple: string
  orange: string
  red: string
  green: string
  lime: string
  blue: string
  glass: string
  glassBorder: string
}

export interface GlassStyle {
  background: string
  backdropFilter: string
  WebkitBackdropFilter: string
  border: string
  boxShadow: string
}

// ── Loyalty / Profile ──
export interface LoyaltyTier {
  name: string
  icon: string
  color: string
  xpReq: number
  mult: number
}

export interface LoyaltyBadge {
  id: string
  icon: string
  name: string
  desc: string
}

export interface DailyReward {
  day: number
  xp: number
  coins: number
  bonus?: string
}

export interface DailyChallenge {
  id: string
  task: string
  reward: number
  xpReward: number
  icon: string
}

export interface ShopItem {
  id: string
  icon: string
  name: string
  price: number
  cat: string
  tier?: string
}

export interface DifficultyLevel {
  level: number
  label: string
  icon: string
  color: string
  coins: number
}

// ── BLE ──
export interface BleRefs {
  btDeviceRef: React.MutableRefObject<BluetoothDevice | null>
  btCharNotify: React.MutableRefObject<BluetoothRemoteGATTCharacteristic | null>
  btPuffDown: React.MutableRefObject<(() => void) | null>
  btPuffUp: React.MutableRefObject<(() => void) | null>
  btPuffEventDown: React.MutableRefObject<(() => void) | null>
  btPuffEventUp: React.MutableRefObject<(() => void) | null>
  btPuffTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
}

// ── UI Overlays ──
export interface FloatingRewardData {
  coins: number
  xp: number
  key: number
}

// ── Puff Bar ──
export type PuffZone = 'tap' | 'short' | 'good' | 'perfect' | 'blinker'

export interface PuffResult {
  zone: PuffZone
  multiplier: number
  label: string
  color: string
  emoji: string
  blinkerBonus?: boolean
}

export interface SweetSpot {
  min: number
  max: number
}

export interface PuffZoneConfig {
  name: string
  max: number
  color: string
}

// ── Arena Context ──
export interface ArenaContextValue {
  // Currency
  coins: number
  xp: number
  setCoins: React.Dispatch<React.SetStateAction<number>>
  setXp: React.Dispatch<React.SetStateAction<number>>
  awardXP: (amount: number, reason: string) => void
  awardGame: (opts: { won: boolean; baseCoins: number; baseXP: number }) => void
  getCoinMultiplier: () => number

  // Loyalty
  dailyStreak: number
  dailyCheckedIn: boolean
  ownedItems: string[]
  earnedBadges: string[]
  completedChallenges: string[]
  currentWinStreak: number
  bestWinStreak: number
  sessionGamesPlayed: string[]
  chatsSent: number
  fortuneCooldown: Record<string, number>
  setCurrentWinStreak: React.Dispatch<React.SetStateAction<number>>
  setBestWinStreak: React.Dispatch<React.SetStateAction<number>>
  setSessionGamesPlayed: React.Dispatch<React.SetStateAction<string[]>>
  setChatsSent: React.Dispatch<React.SetStateAction<number>>
  setFortuneCooldown: React.Dispatch<React.SetStateAction<Record<string, number>>>
  claimDaily: () => void
  completeChallenge: (id: string) => void
  earnBadge: (id: string) => void
  buyShopItem: (item: ShopItem) => void

  // BLE
  bleConnected: boolean
  btPuffActive: boolean
  bleScanning: boolean
  connectBle: () => Promise<void>
  disconnectBle: () => void
  registerPuffHandlers: (down: (() => void) | null, up: (() => void) | null) => void

  // Audio
  audioOn: boolean
  setAudioOn: React.Dispatch<React.SetStateAction<boolean>>
  playFx: (type: string, vol?: number) => void
  playAudio: (src: string, vol?: number) => void

  // UI Overlays
  floatingReward: FloatingRewardData | null
  achievementPopup: LoyaltyBadge | null
  coinPulse: boolean
  showFloatingReward: (coins: number, xp: number) => void
  showAchievementPopup: (badge: LoyaltyBadge) => void
  notify: (msg: string, color: string) => void
  spawnConfetti: (count: number, colors: string[]) => void

  // Profile state
  deviceRegistered: boolean
  deviceActivated: boolean

  // Current zone (for badge tracking)
  currentZone: string | null
  setCurrentZone: React.Dispatch<React.SetStateAction<string | null>>
}

// ── Leaderboard ──
export interface LeaderboardEntry {
  name: string
  emoji: string
  rank?: string
  value: number
  metric: string
  trend: 'up' | 'down'
  isYou?: boolean
}

// ── WC Teams ──
export interface WcTeam {
  id: string
  name: string
  flag: string
  group: string
  rating: number
  confederation: string
}

// ── Puff Event ──
export interface PuffEventSchedule {
  nextType: string
  nextAt: number
}

// ── Fish ──
export interface HookFish {
  name: string
  emoji: string
  rarity: 'common' | 'rare' | 'legendary'
  pts: number
  zoneWidth: number
  resistance: number
  instability: number
  tensionRate: number
  escapeRate: number
  color: string
}

// ── Live Stream ──
export interface LiveStream {
  id: number
  host: string
  avatar: string
  viewers: number
  category: string
  title: string
  puffs: number
  badge: string
  followers: number
}

// ── Player Profile ──
export interface PlayerProfile {
  gamesPlayed: number
  blinkerCount: number
  perfectCount: number
  totalPuffTime: number
}
