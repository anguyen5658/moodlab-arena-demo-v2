// ── LOYALTY SYSTEM ──
export const LOYALTY_TIERS = [
  { name:"Bronze", icon:"🥉", color:"#CD7F32", xpReq:0, mult:1.0 },
  { name:"Silver", icon:"🥈", color:"#C0C0C0", xpReq:2000, mult:1.05 },
  { name:"Gold", icon:"🥇", color:"#FFD700", xpReq:8000, mult:1.1 },
  { name:"Diamond", icon:"💎", color:"#00E5FF", xpReq:25000, mult:1.15 },
  { name:"Legend", icon:"🔥", color:"#FF4D8D", xpReq:75000, mult:1.2 },
];

export const DIFFICULTY_LEVELS = [
  { level:1, label:"Chill", icon:"🌱", color:"#34D399", coins:20 },
  { level:2, label:"Easy", icon:"😎", color:"#00E5FF", coins:30 },
  { level:3, label:"Medium", icon:"🔥", color:"#FB923C", coins:50 },
  { level:4, label:"Hard", icon:"💪", color:"#C084FC", coins:60 },
  { level:5, label:"Intense", icon:"⚡", color:"#FFD93D", coins:80 },
  { level:6, label:"Expert", icon:"👑", color:"#FF4D8D", coins:100 },
];

export const DAILY_REWARDS = [
  { day:1, xp:20, coins:10 },
  { day:2, xp:25, coins:15 },
  { day:3, xp:30, coins:20 },
  { day:4, xp:40, coins:30, bonus:"🎁" },
  { day:5, xp:50, coins:40 },
  { day:6, xp:60, coins:50 },
  { day:7, xp:100, coins:100, bonus:"🏆 Milestone!" },
];

export const DAILY_CHALLENGES = [
  { id:"play3", task:"Play 3 games today", reward:25, xpReward:20, icon:"🎮" },
  { id:"win1", task:"Win 1 game", reward:30, xpReward:25, icon:"🏆" },
  { id:"fortune1", task:"Try 1 Fortune game", reward:20, xpReward:15, icon:"🔮" },
];

export const SHOP_ITEMS = [
  { id:"avatar_cat", icon:"🐱", name:"Cat Avatar", price:200, cat:"Avatar" },
  { id:"avatar_alien", icon:"👽", name:"Alien Avatar", price:200, cat:"Avatar" },
  { id:"effect_smoke", icon:"💨", name:"Smoke Trail", price:300, cat:"Puff Effect" },
  { id:"effect_fire", icon:"🔥", name:"Fire Trail", price:500, cat:"Puff Effect" },
  { id:"frame_gold", icon:"✨", name:"Gold Frame", price:400, cat:"Frame", tier:"Gold" },
  { id:"theme_neon", icon:"🎨", name:"Neon Theme", price:600, cat:"Theme", tier:"Diamond" },
  { id:"shield", icon:"🛡️", name:"Streak Shield", price:100, cat:"Power-up" },
  { id:"extratime", icon:"⏰", name:"Extra Time x3", price:150, cat:"Power-up" },
];

export const LOYALTY_BADGES = [
  { id:"fp", icon:"💨", name:"First Puff", desc:"Play your first game" },
  { id:"puff100", icon:"🌬️", name:"Cloud Chaser", desc:"Play 100 games" },
  { id:"blinker", icon:"😤", name:"Blinker Beast", desc:"Hit 10 blinkers" },
  { id:"streak5", icon:"🔥", name:"On Fire", desc:"5 win streak" },
  { id:"streak10", icon:"💥", name:"Unstoppable", desc:"10 win streak" },
  { id:"showchamp", icon:"🌟", name:"Show Champ", desc:"Win a Stage show" },
  { id:"fortuneking", icon:"👑", name:"Fortune King", desc:"Win 5,000 coins in Fortune" },
  { id:"social", icon:"🦋", name:"Social Butterfly", desc:"Chat 50 messages" },
  { id:"collector", icon:"📦", name:"Collector", desc:"Buy 5 shop items" },
  { id:"weekwarrior", icon:"🛡️", name:"Week Warrior", desc:"7-day streak" },
  { id:"legend", icon:"🏆", name:"Legend", desc:"Reach Legend tier" },
  { id:"allgames", icon:"🎯", name:"Explorer", desc:"Try every game" },
];

export const FORTUNE_LEVELS = [
  {name:"Bronze Gambler", emoji:"🥉", minWager:0, color:"#CD7F32"},
  {name:"Silver Gambler", emoji:"🥈", minWager:1000, color:"#C0C0C0"},
  {name:"Gold Gambler", emoji:"🥇", minWager:5000, color:"#FFD700"},
  {name:"Platinum Player", emoji:"💎", minWager:15000, color:"#E5E4E2"},
  {name:"Diamond Dealer", emoji:"💠", minWager:50000, color:"#B9F2FF"},
  {name:"High Roller", emoji:"👑", minWager:200000, color:"#FFD700"},
];

export const MOCK_FRIENDS = [
  { name:"CloudChaser", avatar:"😎", status:"online", playing:"Final Kick" },
  { name:"PuffMaster", avatar:"🤖", status:"online", playing:"Puff Slots" },
  { name:"BlinkerQueen", avatar:"👑", status:"online", playing:null },
  { name:"VapeGod420", avatar:"🔥", status:"away", playing:null },
  { name:"ChillPill", avatar:"😌", status:"offline", playing:null },
  { name:"NeonQueen", avatar:"💜", status:"online", playing:"Vibe Check" },
];

export const LEADERBOARD = [
  { name:"ChillMaster42", score:2847000, emoji:"👑", streak:23, place:"🥇" },
  { name:"VibeKing", score:2654000, emoji:"😎", streak:18, place:"🥈" },
  { name:"Steve", score:420690, emoji:"🌟", streak:7, place:"🥉", isYou:true },
  { name:"BlazedPanda", score:350000, emoji:"🐼", streak:5, place:"4" },
  { name:"NeonQueen", score:280000, emoji:"👸", streak:12, place:"5" },
  { name:"CloudNine99", score:245000, emoji:"☁️", streak:9, place:"6" },
  { name:"PuffDaddy", score:198000, emoji:"💨", streak:4, place:"7" },
];

export const TOURNAMENTS = [
  { id:1, name:"Flash Frenzy", emoji:"⚡", prize:"5,000", max:50, current:47, time:"2:30", hot:true, game:"wildwest" },
  { id:2, name:"Brain Battle", emoji:"🧠", prize:"25,000", max:100, current:72, time:"15:00", game:"vibecheck" },
  { id:3, name:"Mega Championship", emoji:"🏆", prize:"100,000", max:200, current:198, time:"1:00:00", hot:true, game:"finalkick" },
];

export const USER = { name:"Steve", level:24, xp:7450, xpNext:10000, tier:"Gold" };
