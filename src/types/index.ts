// ── MoodLab Arena — TypeScript Interfaces ──

export type TabId = 'control' | 'arena' | 'live' | 'me'
export type ZoneId = 'arcade' | 'stage' | 'oracle' | 'wall' | 'worldcup'

export type GameId =
  | 'finalkick' | 'finalkick2' | 'finalkick3'
  | 'hotpotato' | 'russian' | 'wildwest' | 'balloon'
  | 'puffpong' | 'rhythm' | 'tugofwar' | 'hooked'
  | 'rps' | 'beatdrop' | 'puffclock' | 'pufflimbo'
  | 'puffderby' | 'tankwar' | 'fishwar' | 'rooftoppuff'
  | 'vibecheck' | 'higherlower' | 'pricepuff' | 'survivaltrivia'
  | 'simonpuffs' | 'puffauction' | 'spinwin'
  | 'crystalball' | 'strainbattle' | 'matchpredictor' | 'dailypicks'
  | 'puffslots' | 'puffblackjack' | 'coinflip' | 'crapsnclouds'
  | 'mysterybox' | 'scratchpuff' | 'fortunecookie' | 'treasuremap'
  | string

export interface ActiveGame {
  id: GameId
  wcMode?: boolean
  wcKnockout?: boolean
  wcMatchIdx?: number
  wcOpponent?: any
  mode?: string
  role?: string
  opponent?: any
  fortune?: string
  input?: string
  // Display fields (used in GameOverlay start screen)
  name?: string
  emoji?: string
  color?: string
  desc?: string
  type?: string
  players?: string
  time?: string
}

export interface BLEDevice {
  slot: number
  name: string
  deviceName: string
  connected: boolean
}

export interface BLEDeviceRef {
  slot: number
  device: any
  characteristic: any
  puffTimeout: ReturnType<typeof setTimeout> | null
  down: (() => void) | null
  up: (() => void) | null
}

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
  color?: string
}

export interface GameConfigMode {
  id: string
  emoji: string
  name: string
  sub: string
}

export interface GameConfig {
  modes?: GameConfigMode[] | null
  roles?: GameConfigMode[] | null
  puffGame: boolean
  fortunePlay?: Array<{ id: string; emoji: string; name: string }> | null
  stats: Array<{ v: string; l: string }>
  hotStats: string[]
  htp: Array<{ e: string; t: string; d: string }>
  reward: number
  solo?: boolean
}

export interface GameEntry {
  id: GameId
  name: string
  icon: string
  desc: string
  tag?: string
  zone?: ZoneId | string
  color?: string
}

export interface ChatMessage {
  u: string
  m: string
  c: string
  t?: number
  isYou?: boolean
  type?: string
}

export interface NotifState {
  msg: string
  color: string
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size?: number
  r?: number
}

export interface FloatingReaction {
  id: number
  emoji: string
  x: number
  y: number
  color: string
  born: number
}

export interface Spectator {
  id: number
  name: string
  emoji: string
  x: number
  color: string
  born: number
}

export interface ArenaAtmosphere {
  smoke: number
  energy: number
  temperature: number
  weather: string
  peakHour: boolean
  is420: boolean
  hype: number
  crowd: number
  lastEvent: string
}

export interface WCTeam {
  code: string
  name: string
  flag: string
  group?: string
  color?: string
}

export interface WCMatch {
  id: string
  home: WCTeam
  away: WCTeam
  result?: any
  phase?: string
}

export interface PuffEventState {
  type: string
  phase: string
  data: any
  timer: number
}

export interface HalftimeState {
  game: string | null
  result: any
}

export interface FloatingRewardState {
  coins: number
  xp: number
  key: number
}
