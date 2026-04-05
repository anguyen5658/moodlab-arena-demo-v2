import type { GameDefinition, HookFish } from '@/types'
import { C } from './theme'

export const PLAY_GAMES: GameDefinition[] = [
  { id: 'finalkick',  name: 'Final Kick',      emoji: '⚽',   players: '2',   time: '1-2m',  type: 'Skill',      color: C.cyan,   desc: 'Penalty kick 1v1. Aim your shot, pick your save direction.', hot: true, difficulty: 5 },
  { id: 'finalkick2', name: 'Final Kick 2',    emoji: '⚽🔥', players: '2',   time: '2-3m',  type: 'Precision',  color: C.gold,   desc: 'Double puff! Aim X-axis + Y-axis separately.', hot: true, difficulty: 6 },
  { id: 'finalkick3', name: 'Final Kick 3D',   emoji: '⚽🌐', players: '2',   time: '2-3m',  type: '3D Precision', color: C.purple, desc: '3D behind-the-ball view! Double puff aim in 3D.', hot: true, difficulty: 6 },
  { id: 'hotpotato',  name: 'Hot Potato',      emoji: '💣',   players: '3-8', time: '1-3m',  type: 'Luck',       color: C.orange, desc: 'Bomb jumps randomly. Puff to pass. Get caught = eliminated.', difficulty: 2 },
  { id: 'russian',    name: 'Russian Roulette', emoji: '🎲',  players: '2-6', time: '1-2m',  type: 'Luck',       color: C.red,    desc: 'Take turns puffing. Random elimination each round. Maximum tension.', difficulty: 2 },
  { id: 'wildwest',   name: 'Wild West Duel',  emoji: '🤠',   players: '2',   time: '1-2m',  type: 'Reaction',   color: C.gold,   desc: 'Best of 5 showdown! Wait for DRAW, puff fastest. Reaction time in ms.', hot: true, difficulty: 5 },
  { id: 'balloon',    name: 'Balloon Pop',     emoji: '🎈',   players: '2-8', time: '1-3m',  type: 'Strategy',   color: C.pink,   desc: 'Puff inflates the balloon. Pop it and you lose.', difficulty: 4 },
  { id: 'puffpong',   name: 'Puff Pong',       emoji: '🏓',   players: '2',   time: '1-2m',  type: 'Skill',      color: C.green,  desc: 'Virtual ping pong. Puff = hit the ball. Timing is everything.', difficulty: 5 },
  { id: 'rhythm',     name: 'Rhythm Puff',     emoji: '🎵',   players: '1-4', time: '1-3m',  type: 'Rhythm',     color: C.purple, desc: 'Notes fall down, puff on beat. Guitar Hero style.', difficulty: 5 },
  { id: 'tugofwar',   name: 'Tug of War',      emoji: '💪',   players: '2-8', time: '30s-1m', type: 'Team',      color: C.blue,   desc: 'Two teams puff nonstop. Stronger side wins.', hot: true, difficulty: 4 },
  { id: 'hooked',     name: 'Hooked',          emoji: '🎣',   players: '1',   time: '2-5m',  type: 'Skill',      color: C.blue,   desc: 'Stack fishing! Puff to reel in fish. Control your suction!', difficulty: 4 },
  { id: 'rps',        name: 'Puff RPS',        emoji: '✊',   players: '2',   time: '1-2m',  type: 'Strategy',   color: C.purple, desc: 'Rock Paper Scissors with Puff Power!', hot: true, difficulty: 2 },
  { id: 'beatdrop',   name: 'Beat Drop',       emoji: '🎧',   players: '1',   time: '3-5m',  type: 'Music',      color: C.pink,   desc: 'Hold your puff until the beat drops. Release on time!', difficulty: 4 },
  { id: 'puffclock',  name: 'Puff Clock',      emoji: '⏱️',   players: '1-100+', time: '3-5m', type: 'Precision', color: C.orange, desc: 'Puff for EXACTLY the target time. Closest wins!', difficulty: 5 },
  { id: 'pufflimbo',  name: 'Puff Limbo',      emoji: '🎪',   players: '1-50', time: '3-5m', type: 'Endurance', color: C.orange, desc: 'Target puff gets longer each round. Survive the blinker!', difficulty: 5 },
  { id: 'puffderby',  name: 'Puff Derby',      emoji: '🏇',   players: '6',   time: '2-3m',  type: 'Racing',     color: C.green,  desc: 'Pick a horse. Spam puff to make it run!', difficulty: 2 },
]

export const SHOW_GAMES: GameDefinition[] = [
  { id: 'vibecheck',      name: 'Vibe Check',       emoji: '🧠', players: '1-100+', time: '5-15m',  type: 'Trivia',    color: C.gold,   desc: 'Trivia Game Show. Host asks, contestants answer, audience votes.', live: true, difficulty: 3 },
  { id: 'higherlower',    name: 'Higher or Lower',  emoji: '📊', players: '1-100+', time: '5-10m',  type: 'Knowledge', color: C.cyan,   desc: 'Guess if the next number is higher or lower. Streak = big rewards.', live: true, difficulty: 3 },
  { id: 'pricepuff',      name: 'The Price is Puff', emoji: '💰', players: '2-50+', time: '5-10m',  type: 'Knowledge', color: C.green,  desc: 'Guess the product price. Closest wins.', live: true, difficulty: 4 },
  { id: 'survivaltrivia', name: 'Survival Trivia',  emoji: '🏆', players: '2-100+', time: '5-15m', type: 'Trivia',    color: C.purple, desc: 'Answer correctly or get eliminated. Last one standing wins!', live: true, difficulty: 3 },
  { id: 'simonpuffs',     name: 'Simon Puffs',      emoji: '🔴', players: '1-50+', time: '3-8m',   type: 'Memory',    color: C.red,    desc: 'Remember the pattern, repeat with puffs. Memory master!', live: true, difficulty: 3 },
  { id: 'puffauction',    name: 'Puff Auction',     emoji: '🔨', players: '2-50+', time: '3-8m',   type: 'Strategy',  color: C.lime,   desc: 'Bid with your lungs! Biggest puff wins the auction.', live: true, difficulty: 4 },
]

export const ORACLE_GAMES: GameDefinition[] = [
  { id: 'crystalball',    name: 'Crystal Ball',    emoji: '🔮', players: '1', time: '1-2m', type: 'Prediction', color: '#9333EA', desc: 'Yes/No universal predictions. Puff to decide destiny.', difficulty: 1 },
  { id: 'strainbattle',   name: 'Strain Battle',   emoji: '🌿', players: '1', time: '2-3m', type: 'Vote',       color: '#22C55E', desc: 'Vote for the best strain in epic matchups.', difficulty: 1 },
  { id: 'matchpredictor', name: 'Match Predictor', emoji: '📊', players: '1', time: '1-2m', type: 'Sports',     color: '#3B82F6', desc: 'Predict WC match outcomes. Win/Draw/Lose.', difficulty: 1 },
  { id: 'dailypicks',     name: 'Daily Picks',     emoji: '📅', players: '1', time: '2-3m', type: 'Daily',      color: '#F97316', desc: '3 daily predictions with streak multipliers.', difficulty: 1 },
  { id: 'puffslots',      name: 'Puff Slots',      emoji: '🎰', players: '1', time: '2-3m', type: 'Fortune',    color: '#FFD700', desc: '3-reel slot machine. Puff to spin the reels!', difficulty: 1 },
  { id: 'puffblackjack',  name: 'Puff Blackjack',  emoji: '🃏', players: '1', time: '3-5m', type: 'Fortune',    color: '#22C55E', desc: 'Classic blackjack with puff controls. Hit or Stand!', difficulty: 1 },
  { id: 'coinflip',       name: 'Coin Flip',       emoji: '🪙', players: '1', time: '1-2m', type: 'Fortune',    color: '#F59E0B', desc: '50/50 flip with puff confidence multiplier.', difficulty: 1 },
  { id: 'crapsnclouds',   name: 'Craps & Clouds',  emoji: '🎲', players: '1', time: '2-3m', type: 'Fortune',    color: '#EF4444', desc: 'Dice game where your puff controls the roll!', difficulty: 1 },
  { id: 'mysterybox',     name: 'Mystery Box',     emoji: '🎁', players: '1', time: '2-3m', type: 'Fortune',    color: '#FFD700', desc: '3 mystery boxes. Pick one. Puff to reveal!', difficulty: 1 },
  { id: 'scratchpuff',    name: 'Scratch & Puff',  emoji: '🎫', players: '1', time: '2-3m', type: 'Fortune',    color: '#EC4899', desc: '6 scratch areas. Puff to scratch. Match 3 wins!', difficulty: 1 },
  { id: 'fortunecookie',  name: 'Fortune Cookie',  emoji: '🥠', players: '1', time: '1-2m', type: 'Fortune',    color: '#F97316', desc: 'Crack open wisdom + coins. Blinker = golden cookie!', difficulty: 1 },
  { id: 'treasuremap',    name: 'Treasure Map',    emoji: '🗺️', players: '1', time: '3-5m', type: 'Fortune',    color: '#FFD700', desc: '16 tiles. Find 3 treasures. Avoid 3 bombs!', difficulty: 1 },
]

export const UNIVERSAL_PUFF_CONFIG = {
  randomizeSweetSpot: () => {
    const min = 30 + Math.random() * 20
    const max = min + 20 + Math.random() * 20
    return { min: Math.round(min), max: Math.min(95, Math.round(max)) }
  },
  blinkerThreshold: 95,
  zones: [
    { name: 'TAP',     max: 15,  color: '#555F85' },
    { name: 'SHORT',   max: 40,  color: '#8892B8' },
    { name: 'GOOD',    max: 65,  color: '#00E5FF' },
    { name: 'PERFECT', max: 90,  color: '#7FFF00' },
    { name: 'BLINKER', max: 100, color: '#FF4444' },
  ],
}

export const getTriviaPuffAnswer = (ms: number): number =>
  ms < 800 ? 0 : ms < 2000 ? 1 : ms < 3500 ? 2 : 3

export const HOOK_FISH: HookFish[] = [
  { name: 'Blue Snap',    emoji: '🐟', rarity: 'common',    pts: 10,  zoneWidth: 35, resistance: 0.8, instability: 0.30, tensionRate: 1.0, escapeRate: 0.8, color: C.cyan   },
  { name: 'Lunar Carp',   emoji: '🐠', rarity: 'common',    pts: 10,  zoneWidth: 33, resistance: 0.9, instability: 0.35, tensionRate: 1.0, escapeRate: 0.9, color: C.cyan   },
  { name: 'Pond Darter',  emoji: '🐡', rarity: 'common',    pts: 10,  zoneWidth: 38, resistance: 0.7, instability: 0.25, tensionRate: 0.9, escapeRate: 0.7, color: C.cyan   },
  { name: 'Neon Koi',     emoji: '🎏', rarity: 'rare',      pts: 25,  zoneWidth: 30, resistance: 1.2, instability: 0.50, tensionRate: 1.3, escapeRate: 1.1, color: C.purple },
  { name: 'Glitch Fin',   emoji: '🦈', rarity: 'rare',      pts: 25,  zoneWidth: 28, resistance: 1.4, instability: 0.55, tensionRate: 1.4, escapeRate: 1.2, color: C.purple },
  { name: 'Gold Pike',    emoji: '🐊', rarity: 'rare',      pts: 25,  zoneWidth: 32, resistance: 1.1, instability: 0.45, tensionRate: 1.2, escapeRate: 1.0, color: C.purple },
  { name: 'Void Eel',     emoji: '🐉', rarity: 'legendary', pts: 60,  zoneWidth: 22, resistance: 1.8, instability: 0.50, tensionRate: 1.8, escapeRate: 1.5, color: C.gold   },
  { name: 'Abyssal Ray',  emoji: '🦑', rarity: 'legendary', pts: 60,  zoneWidth: 20, resistance: 2.0, instability: 0.55, tensionRate: 2.0, escapeRate: 1.6, color: C.gold   },
]

export const SP_PUFF_TYPES = [
  { name: 'Short',  maxDur: 1.2,  color: '#00E5FF' },
  { name: 'Medium', maxDur: 3.0,  color: '#FFD93D' },
  { name: 'Long',   maxDur: 99,   color: '#FF4D8D' },
]

export const SP_COMEDY = [
  'Round 1! Easy peasy!',
  'Getting warmer! Can you remember?',
  '3 puffs! Your short-term memory is being tested!',
  '4 in a row! Not bad for someone who\'s probably baked!',
  '5 puffs! Simon is impressed!',
  '6?! Your brain is on FIRE!',
  '7 puffs! Are you even human?!',
  '8! This is INSANE! The crowd can\'t believe it!',
  '9 PUFFS! You\'re a LEGEND!',
  '10! SIMON MASTER! You\'ve beaten the game!',
]

export const PA_PRIZES = [
  { name: '100 Coins',   value: 100,  emoji: '🪙', rarity: 'common'    },
  { name: '200 Coins',   value: 200,  emoji: '💰', rarity: 'common'    },
  { name: 'Rare Badge',  value: 300,  emoji: '🏅', rarity: 'rare'      },
  { name: '500 Coins',   value: 500,  emoji: '💎', rarity: 'rare'      },
  { name: 'MYSTERY BOX', value: 1000, emoji: '🎁', rarity: 'legendary' },
]

export const KICK_ZONES = [
  { label: '↖', col: 0, row: 0 }, { label: '⬆', col: 1, row: 0 }, { label: '↗', col: 2, row: 0 },
  { label: '↙', col: 0, row: 1 }, { label: '⬇', col: 1, row: 1 }, { label: '↘', col: 2, row: 1 },
]
