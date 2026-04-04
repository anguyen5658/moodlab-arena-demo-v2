import type { LoyaltyTier, LoyaltyBadge, DailyReward, DailyChallenge, ShopItem, DifficultyLevel } from '@/types'
import { C } from './theme'

export const FORTUNE_LEVELS = [
  { name: 'Bronze Gambler',   emoji: '🥉', minWager: 0,      color: '#CD7F32' },
  { name: 'Silver Gambler',   emoji: '🥈', minWager: 1000,   color: '#C0C0C0' },
  { name: 'Gold Gambler',     emoji: '🥇', minWager: 5000,   color: '#FFD700' },
  { name: 'Platinum Player',  emoji: '💎', minWager: 15000,  color: '#E5E4E2' },
  { name: 'Diamond Dealer',   emoji: '💠', minWager: 50000,  color: '#B9F2FF' },
  { name: 'High Roller',      emoji: '👑', minWager: 200000, color: '#FFD700' },
]

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze',  icon: '🥉', color: '#CD7F32', xpReq: 0,     mult: 1.0  },
  { name: 'Silver',  icon: '🥈', color: '#C0C0C0', xpReq: 2000,  mult: 1.05 },
  { name: 'Gold',    icon: '🥇', color: '#FFD700', xpReq: 8000,  mult: 1.1  },
  { name: 'Diamond', icon: '💎', color: '#00E5FF', xpReq: 25000, mult: 1.15 },
  { name: 'Legend',  icon: '🔥', color: '#FF4D8D', xpReq: 75000, mult: 1.2  },
]

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { level: 1, label: 'Chill',   icon: '🌱', color: '#34D399', coins: 20  },
  { level: 2, label: 'Easy',    icon: '😎', color: '#00E5FF', coins: 30  },
  { level: 3, label: 'Medium',  icon: '🔥', color: '#FB923C', coins: 50  },
  { level: 4, label: 'Hard',    icon: '💪', color: '#C084FC', coins: 60  },
  { level: 5, label: 'Intense', icon: '⚡', color: '#FFD93D', coins: 80  },
  { level: 6, label: 'Expert',  icon: '👑', color: '#FF4D8D', coins: 100 },
]

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, xp: 20,  coins: 10  },
  { day: 2, xp: 25,  coins: 15  },
  { day: 3, xp: 30,  coins: 20  },
  { day: 4, xp: 40,  coins: 30, bonus: '🎁' },
  { day: 5, xp: 50,  coins: 40  },
  { day: 6, xp: 60,  coins: 50  },
  { day: 7, xp: 100, coins: 100, bonus: '🏆 Milestone!' },
]

export const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'play3',    task: 'Play 3 games today',    reward: 25, xpReward: 20, icon: '🎮' },
  { id: 'win1',     task: 'Win 1 game',             reward: 30, xpReward: 25, icon: '🏆' },
  { id: 'fortune1', task: 'Try 1 Fortune game',     reward: 20, xpReward: 15, icon: '🔮' },
]

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'avatar_cat',   icon: '🐱', name: 'Cat Avatar',      price: 200,  cat: 'Avatar' },
  { id: 'avatar_alien', icon: '👽', name: 'Alien Avatar',    price: 200,  cat: 'Avatar' },
  { id: 'effect_smoke', icon: '💨', name: 'Smoke Trail',     price: 300,  cat: 'Puff Effect' },
  { id: 'effect_fire',  icon: '🔥', name: 'Fire Trail',      price: 500,  cat: 'Puff Effect' },
  { id: 'frame_gold',   icon: '✨', name: 'Gold Frame',      price: 400,  cat: 'Frame', tier: 'Gold' },
  { id: 'theme_neon',   icon: '🎨', name: 'Neon Theme',      price: 600,  cat: 'Theme', tier: 'Diamond' },
  { id: 'shield',       icon: '🛡️', name: 'Streak Shield',   price: 100,  cat: 'Power-up' },
  { id: 'extratime',    icon: '⏰', name: 'Extra Time x3',   price: 150,  cat: 'Power-up' },
]

export const LOYALTY_BADGES: LoyaltyBadge[] = [
  { id: 'fp',           icon: '💨',  name: 'First Puff',        desc: 'Play your first game' },
  { id: 'puff100',      icon: '🌬️',  name: 'Cloud Chaser',      desc: 'Play 100 games' },
  { id: 'blinker',      icon: '😤',  name: 'Blinker Beast',     desc: 'Hit 10 blinkers' },
  { id: 'streak5',      icon: '🔥',  name: 'On Fire',           desc: '5 win streak' },
  { id: 'streak10',     icon: '💥',  name: 'Unstoppable',       desc: '10 win streak' },
  { id: 'showchamp',    icon: '🌟',  name: 'Show Champ',        desc: 'Win a Stage show' },
  { id: 'fortuneking',  icon: '👑',  name: 'Fortune King',      desc: 'Win 5,000 coins in Fortune' },
  { id: 'social',       icon: '🦋',  name: 'Social Butterfly',  desc: 'Chat 50 messages' },
  { id: 'collector',    icon: '📦',  name: 'Collector',         desc: 'Buy 5 shop items' },
  { id: 'weekwarrior',  icon: '🛡️',  name: 'Week Warrior',      desc: '7-day streak' },
  { id: 'legend',       icon: '🏆',  name: 'Legend',            desc: 'Reach Legend tier' },
  { id: 'allgames',     icon: '🎯',  name: 'Explorer',          desc: 'Try every game' },
]

export const RANKS = [
  { name: 'Bronze',    emoji: '🥉', color: '#CD7F32', minXP: 0     },
  { name: 'Silver',    emoji: '🥈', color: '#C0C0C0', minXP: 500   },
  { name: 'Gold',      emoji: '🥇', color: '#FFD700', minXP: 2000  },
  { name: 'Platinum',  emoji: '💎', color: '#E5E4E2', minXP: 5000  },
  { name: 'Diamond',   emoji: '💠', color: '#B9F2FF', minXP: 15000 },
  { name: 'Legendary', emoji: '⭐', color: '#FFD700', minXP: 50000 },
]

export const STREAK_REWARDS = [
  { day: 3,  coins: 100,  label: '3-Day Bonus'      },
  { day: 7,  coins: 500,  label: 'Weekly Warrior'   },
  { day: 14, coins: 1500, label: 'Two-Week Terror'  },
  { day: 30, coins: 5000, label: 'Monthly Monster'  },
]

export const ACHIEVEMENTS = [
  { id: 'first_puff',    name: 'First Puff',              desc: 'Puff for the first time',       emoji: '💨', color: C.cyan,   rare: false },
  { id: 'first_win',     name: 'Winner!',                 desc: 'Win your first game',            emoji: '🏆', color: C.gold,   rare: false },
  { id: 'blinker_king',  name: 'Blinker King',            desc: 'Hit 10 blinkers',                emoji: '💀', color: C.red,    rare: false },
  { id: 'sweet_spot',    name: 'Sweet Spot Merchant',     desc: 'Hit 50 perfect puffs',           emoji: '🎯', color: C.green,  rare: false },
  { id: 'marathon',      name: 'Puff Marathon',           desc: 'Puff for 420 total seconds',     emoji: '🏃', color: C.orange, rare: true  },
  { id: 'streak_7',      name: 'Weekly Warrior',          desc: '7-day puff streak',              emoji: '🔥', color: C.orange, rare: true  },
  { id: 'all_games',     name: 'Arcade Master',           desc: 'Play all 16 games',              emoji: '🎮', color: C.purple, rare: true  },
  { id: 'tournament_win',name: 'Champion',                desc: 'Win any tournament',             emoji: '👑', color: C.gold,   rare: true  },
  { id: 'crowd_surfer',  name: 'Crowd Surfer',            desc: 'Trigger 10 Puff Waves',          emoji: '🌊', color: C.blue,   rare: true  },
  { id: 'legend',        name: 'Living Legend',           desc: 'Reach Legendary rank',           emoji: '⭐', color: C.gold,   rare: true  },
  { id: 'the_420',       name: 'The 420',                 desc: 'Have exactly 420 total puffs',   emoji: '🌿', color: C.lime,   rare: true  },
  { id: 'blinker_100',   name: 'Iron Lungs',              desc: 'Hit 100 blinkers',               emoji: '🫁', color: C.red,    rare: true  },
]

export const MOCK_FRIENDS = [
  { name: 'CloudChaser',  avatar: '😎', status: 'online',  playing: 'Final Kick' },
  { name: 'PuffMaster',   avatar: '🤖', status: 'online',  playing: 'Puff Slots' },
  { name: 'BlinkerQueen', avatar: '👑', status: 'online',  playing: null },
  { name: 'VapeGod420',   avatar: '🔥', status: 'away',    playing: null },
  { name: 'ChillPill',    avatar: '😌', status: 'offline', playing: null },
  { name: 'NeonQueen',    avatar: '💜', status: 'online',  playing: 'Vibe Check' },
]

export const MOCK_COMMUNITIES = [
  { name: 'Cali Clear Fam',       members: 1247, icon: '🌿', active: true  },
  { name: 'WC 2026 Predictions',  members: 834,  icon: '⚽', active: true  },
  { name: 'Blinker Gang',         members: 420,  icon: '💀', active: false },
  { name: 'Arena Champions',      members: 2103, icon: '🏆', active: true  },
]

export const MOCK_COLLECTIONS = [
  { name: 'Rare Puff Effects', count: 3, total: 8,  icon: '💨', color: '#00E5FF' },
  { name: 'Arena Trophies',    count: 5, total: 12, icon: '🏆', color: '#FFD93D' },
  { name: 'Limited Avatars',   count: 2, total: 6,  icon: '👾', color: '#C084FC' },
]

export const USER = { name: 'Steve', level: 24, xp: 7450, xpNext: 10000, tier: 'Gold' }

export const TICKER_ITEMS = [
  '⚽ USA vs MEX · 9:00 PM Tonight',
  '🏆 Flash Frenzy · 3 SPOTS LEFT',
  '🧠 Vibe Check LIVE · 1,247 watching',
  '🔥 ChillMaster42 on 23-win streak',
  '📊 BRA vs GER predictions open',
  '💰 JACKPOT: 100,000 coins up for grabs',
  '⚡ NeonQueen just won Wild West Duel',
  '🎰 Spin & Win Mega Friday at 8PM',
]

export const DEVICE_MODELS = [
  { id: 'cc_s1',   name: 'Cali Clear Season 1',    short: 'CC S1',       pool: 'standard', emoji: '📱' },
  { id: 'cc_s2',   name: 'Cali Clear Season 2',    short: 'CC S2',       pool: 'standard', emoji: '📱' },
  { id: 'cc_s3',   name: 'Cali Clear Season 3',    short: 'CC S3',       pool: 'standard', emoji: '📱' },
  { id: 'cc_sel1', name: 'Cali Clear Select S1',   short: 'CC Select S1', pool: 'select',  emoji: '✨' },
  { id: 'cc_sel2', name: 'Cali Clear Select S2',   short: 'CC Select S2', pool: 'select',  emoji: '✨' },
  { id: 'none',    name: 'No Device',              short: 'Tap Only',    pool: 'open',     emoji: '👆' },
]

export const DEVICE_POOLS: Record<string, { label: string; color: string; aiSave: number; aiScore: number; rewardMult: number }> = {
  select:   { label: 'Select Pool',   color: C.gold,  aiSave: 0.25, aiScore: 0.45, rewardMult: 2   },
  standard: { label: 'Standard Pool', color: C.cyan,  aiSave: 0.20, aiScore: 0.40, rewardMult: 1.5 },
  open:     { label: 'Open Pool',     color: C.text3, aiSave: 0.12, aiScore: 0.30, rewardMult: 1   },
}

export const SPECTATOR_NAMES = [
  'Puff_Master_420','Blinker_Betty','CloudChaser99','THC_Tony','DabQueen',
  'SmokeRing_Steve','VapeLord69','HazeDaze','KushKing','RollerCoaster',
  'BlazeRunner','FogMachine','MistWalker','PuffDaddy_Jr','ChillPill',
  'NebulaNick','GreenGoblin','SkyHighSam','TokeToken','LitLenny',
  'CloudNine_OG','BubbleBoi','RipTide','SeshGremlin','GlassHouse',
  'TerpQueen','HotBoxHank','MoonRock_Mike','DankDiva','CouchLock',
  'WhiteLung','PurpleRain','GoldLeaf','CrystalClear','IceIce_Baby',
  'StoneAge','RollingThunder','PeacePipe','ChiefKeef_Fan','HighNoon',
]

export const SPECTATOR_EMOJIS = [
  '😤','😶‍🌫️','🤤','😎','🥴','😮‍💨','🫠','🤩','😵‍💫','🥳',
  '😈','👽','🤖','👻','💀','🫡','🧿','🦊','🐸','🌚',
]

export const SPECTATOR_TICKER_MSGS = [
  'just joined the arena', 'puffed a blinker', 'is watching live',
  'just hit a 3-second pull', 'went cloud mode', 'is vibing hard',
  'joined from the lobby', 'brought the energy', 'is hyped up', 'entered spectator mode',
]

export const CHAT_BOTS = ['VibeKing','ChillMaster','NeonQueen','BlazedPanda','CloudNine99','PuffDaddy','MoodMaster']
export const CHAT_MSGS = ['Let\'s go! 🔥','Ez 😎','GG 👏','Nah that\'s cap 💀','LETSGOOO 🎉','🤯🤯🤯','Hmm tricky 🤔','W play 🏆','Clutch! 💪','Prediction locked 🔮']
