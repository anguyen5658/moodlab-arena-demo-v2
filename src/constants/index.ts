// ── MoodLab Arena — All Constants (verbatim lift from monolith) ──
// eslint-disable-next-line

// ═══════════════════════════════════════════════════════════════
// MOOD LAB — ARENA EXPERIENCE v6.2
// Immersive 3D Alley · Virtual Tour · Walk-Between-Views
// "You don't scroll through Arena — you WALK through it."
// ═══════════════════════════════════════════════════════════════

// ── ARENA VIEW IMAGES (place in /assets/arena/) ──
const ARENA_IMAGES = {
  hub:      "/assets/arena/hub.png",
  arcade:   "/assets/arena/arcade.png",
  stage:    "/assets/arena/stage.png",
  oracle:   "/assets/arena/oracle.png",
  wall:     "/assets/arena/wall.png",
  worldcup: "/assets/arena/worldcup.png",
};
const ARENA_VIDEOS = {
  hub:      "/assets/arena/hub.mp4",
  arcade:   "/assets/arena/arcade.mp4",
  stage:    "/assets/arena/stage.mp4",
  oracle:   "/assets/arena/oracle.mp4",
  wall:     "/assets/arena/wall.mp4",
  worldcup: "/assets/arena/worldcup.mp4",
};

// ── ZONE COLORS ──
const Z = {
  arcade: { primary:"#00E5FF", glow:"rgba(0,229,255,0.35)", dim:"rgba(0,229,255,0.08)", name:"The Arcade", icon:"🎮", sub:"16 Action Games" },
  stage:  { primary:"#FFD93D", glow:"rgba(255,217,61,0.35)", dim:"rgba(255,217,61,0.08)", name:"The Stage", icon:"🎪", sub:"6 Live Shows" },
  oracle: { primary:"#FFD93D", glow:"rgba(255,217,61,0.35)", dim:"rgba(255,217,61,0.08)", name:"The Fortune", icon:"🔮", sub:"16 Fortune Games" },
  wall:   { primary:"#FB923C", glow:"rgba(251,146,60,0.35)", dim:"rgba(251,146,60,0.08)", name:"The Wall", icon:"🏆", sub:"Rankings & Glory" },
  worldcup:{ primary:"#FFD93D", glow:"rgba(255,217,61,0.35)", dim:"rgba(255,217,61,0.08)", name:"World Cup 2026", icon:"⚽", sub:"Limited Event" },
};

const FORTUNE_LEVELS = [
  {name:"Bronze Gambler", emoji:"🥉", minWager:0, color:"#CD7F32"},
  {name:"Silver Gambler", emoji:"🥈", minWager:1000, color:"#C0C0C0"},
  {name:"Gold Gambler", emoji:"🥇", minWager:5000, color:"#FFD700"},
  {name:"Platinum Player", emoji:"💎", minWager:15000, color:"#E5E4E2"},
  {name:"Diamond Dealer", emoji:"💠", minWager:50000, color:"#B9F2FF"},
  {name:"High Roller", emoji:"👑", minWager:200000, color:"#FFD700"},
];

// ── LOYALTY SYSTEM ──
const LOYALTY_TIERS = [
  { name:"Bronze", icon:"🥉", color:"#CD7F32", xpReq:0, mult:1.0 },
  { name:"Silver", icon:"🥈", color:"#C0C0C0", xpReq:2000, mult:1.05 },
  { name:"Gold", icon:"🥇", color:"#FFD700", xpReq:8000, mult:1.1 },
  { name:"Diamond", icon:"💎", color:"#00E5FF", xpReq:25000, mult:1.15 },
  { name:"Legend", icon:"🔥", color:"#FF4D8D", xpReq:75000, mult:1.2 },
];

const DIFFICULTY_LEVELS = [
  { level:1, label:"Chill", icon:"\u{1F331}", color:"#34D399", coins:20 },
  { level:2, label:"Easy", icon:"\u{1F60E}", color:"#00E5FF", coins:30 },
  { level:3, label:"Medium", icon:"\u{1F525}", color:"#FB923C", coins:50 },
  { level:4, label:"Hard", icon:"\u{1F4AA}", color:"#C084FC", coins:60 },
  { level:5, label:"Intense", icon:"\u26A1", color:"#FFD93D", coins:80 },
  { level:6, label:"Expert", icon:"\u{1F451}", color:"#FF4D8D", coins:100 },
];

const DAILY_REWARDS = [
  { day:1, xp:20, coins:10 },
  { day:2, xp:25, coins:15 },
  { day:3, xp:30, coins:20 },
  { day:4, xp:40, coins:30, bonus:"🎁" },
  { day:5, xp:50, coins:40 },
  { day:6, xp:60, coins:50 },
  { day:7, xp:100, coins:100, bonus:"🏆 Milestone!" },
];

const DAILY_CHALLENGES = [
  { id:"play3", task:"Play 3 games today", reward:25, xpReward:20, icon:"🎮" },
  { id:"win1", task:"Win 1 game", reward:30, xpReward:25, icon:"🏆" },
  { id:"fortune1", task:"Try 1 Fortune game", reward:20, xpReward:15, icon:"🔮" },
];

const SHOP_ITEMS = [
  { id:"avatar_cat", icon:"🐱", name:"Cat Avatar", price:200, cat:"Avatar" },
  { id:"avatar_alien", icon:"👽", name:"Alien Avatar", price:200, cat:"Avatar" },
  { id:"effect_smoke", icon:"💨", name:"Smoke Trail", price:300, cat:"Puff Effect" },
  { id:"effect_fire", icon:"🔥", name:"Fire Trail", price:500, cat:"Puff Effect" },
  { id:"frame_gold", icon:"✨", name:"Gold Frame", price:400, cat:"Frame", tier:"Gold" },
  { id:"theme_neon", icon:"🎨", name:"Neon Theme", price:600, cat:"Theme", tier:"Diamond" },
  { id:"shield", icon:"🛡️", name:"Streak Shield", price:100, cat:"Power-up" },
  { id:"extratime", icon:"⏰", name:"Extra Time x3", price:150, cat:"Power-up" },
];

const LOYALTY_BADGES = [
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

const MOCK_FRIENDS = [
  { name:"CloudChaser", avatar:"😎", status:"online", playing:"Final Kick" },
  { name:"PuffMaster", avatar:"🤖", status:"online", playing:"Puff Slots" },
  { name:"BlinkerQueen", avatar:"👑", status:"online", playing:null },
  { name:"VapeGod420", avatar:"🔥", status:"away", playing:null },
  { name:"ChillPill", avatar:"😌", status:"offline", playing:null },
  { name:"NeonQueen", avatar:"💜", status:"online", playing:"Vibe Check" },
];

const MOCK_COMMUNITIES = [
  { name:"Cali Clear Fam", members:1247, icon:"🌿", active:true },
  { name:"WC 2026 Predictions", members:834, icon:"⚽", active:true },
  { name:"Blinker Gang", members:420, icon:"💀", active:false },
  { name:"Arena Champions", members:2103, icon:"🏆", active:true },
];

const MOCK_COLLECTIONS = [
  { name:"Rare Puff Effects", count:3, total:8, icon:"💨", color:"#00E5FF" },
  { name:"Arena Trophies", count:5, total:12, icon:"🏆", color:"#FFD93D" },
  { name:"Limited Avatars", count:2, total:6, icon:"👾", color:"#C084FC" },
];

// ── LIVE TAB DATA ──
const LIVE_HERO_SLIDES = [
  {id:"wc",type:"match",tag:"⚽ FIFA WORLD CUP 2026",tagColor:"#FFD93D",title:"Brazil vs Argentina",subtitle:"Quarter Final — Watch Party",host:{name:"VibeKing",avatar:"👑",badge:"Partner"},meta:"1,247 watching • 3,420 puffs",cta:"JOIN WATCH PARTY",gradient:"linear-gradient(135deg, #0c1445 0%, #1a0a30 40%, #2d0a24 100%)",visual:{teamA:"🇧🇷",teamB:"🇦🇷",score:"LIVE"}},
  {id:"celeb",type:"kol",tag:"🔥 FEATURED CREATOR",tagColor:"#FF4D8D",title:"SnoopCloud420",subtitle:"Celebrity Chill Session",host:{name:"SnoopCloud420",avatar:"🎤",badge:"Partner"},meta:"8,912 watching • VIP",cta:"WATCH NOW",gradient:"linear-gradient(135deg, #1a0a2e 0%, #0a1628 40%, #0c2a1a 100%)",visual:{emoji:"🎤",ring:"#C084FC"}},
  {id:"gameshow",type:"gameshow",tag:"🎮 ARENA × LIVE",tagColor:"#00E5FF",title:"Vibe Check LIVE",subtitle:"Trivia Game Show — Play along!",host:{name:"AI Host Max",avatar:"🤖",badge:"Official"},meta:"342 watching • 1,200 playing",cta:"JOIN AS AUDIENCE",gradient:"linear-gradient(135deg, #1a0a2e 0%, #2d0a24 40%, #0c1445 100%)",visual:{emoji:"🧠",ring:"#00E5FF",emoji2:"⚡",emoji3:"🏆"}},
  {id:"brand",type:"brand",tag:"📦 BRAND DROP",tagColor:"#34D399",title:"Cali Clear × Mood Lab",subtitle:"Exclusive Launch Stream",host:{name:"Cali Clear",avatar:"✨",badge:"Official"},meta:"Tomorrow 8PM • Giveaways",cta:"GET NOTIFIED",gradient:"linear-gradient(135deg, #1a1a0a 0%, #0a1a14 40%, #0a0f1a 100%)",visual:{emoji:"✨",ring:"#34D399"}},
  {id:"tournament",type:"tournament",tag:"🏆 TOURNAMENT FINALS",tagColor:"#FFD93D",title:"FK Championship Final",subtitle:"PuffDaddy vs NeonNinja",host:{name:"Arena",avatar:"🏆",badge:"Official"},meta:"LIVE • 2,100 spectators",cta:"WATCH FINAL",gradient:"linear-gradient(135deg, #0a0f1a 0%, #1a1a0a 40%, #2d0a24 100%)",visual:{p1:"🔥",p2:"⚡",vs:true}},
];

const LIVE_STREAMS = [
  {id:1,host:"ChillQueen",avatar:"🌙",viewers:892,category:"Chill",title:"Late Night Chill Sesh 🌌",puffs:1205,badge:"Partner",followers:8200},
  {id:2,host:"GameMaster420",avatar:"🎮",viewers:634,category:"Games",title:"Hot Potato Tournament 🥔🔥",puffs:876,badge:"Creator",followers:3100},
  {id:3,host:"CloudNine",avatar:"☁️",viewers:421,category:"Chill",title:"Morning Mist Session ☀️",puffs:340,badge:"Creator",followers:1800},
  {id:4,host:"NeonVibes",avatar:"✨",viewers:315,category:"Brand",title:"Stack Launch Party 🎉",puffs:2100,badge:"Official",followers:25000},
  {id:5,host:"TerpQueen",avatar:"🧪",viewers:189,category:"Chill",title:"Strain Review: OG Kush 🌿",puffs:450,badge:"Creator",followers:2400},
];

const LIVE_CATEGORIES = [
  {name:"All",icon:"🔥",c:"#FF4D8D"},{name:"Following",icon:"♡",c:"#FB923C"},
  {name:"World Cup",icon:"⚽",c:"#FFD93D"},{name:"Arena",icon:"🎮",c:"#00E5FF"},
  {name:"Chill",icon:"🌙",c:"#C084FC"},{name:"Games",icon:"🕹️",c:"#34D399"},
];

const LIVE_ARENA_ITEMS = [
  {icon:"🧠",title:"Vibe Check",status:"LIVE NOW",statusColor:"#FF4444",sub:"342 playing",isLive:true},
  {icon:"⚽",title:"Final Kick",status:"FINALS",statusColor:"#FFD93D",sub:"2.1K watching",isLive:true},
  {icon:"🎡",title:"Spin & Win",status:"IN 30 MIN",statusColor:"#FB923C",sub:"KOL hosted"},
  {icon:"🔮",title:"WC Predictor",status:"OPEN",statusColor:"#34D399",sub:"BRA vs ARG"},
];

const LIVE_CREATORS = [
  {name:"DankReviews",avatar:"🔬",badge:"Partner",followers:"15.2K",schedule:"Mon/Thu 9PM"},
  {name:"CloudChaser",avatar:"🌬️",badge:"Partner",followers:"9.8K",schedule:"Daily 8PM"},
  {name:"TerpQueen",avatar:"🧪",badge:"Creator",followers:"4.1K",schedule:"Fri/Sat 10PM"},
  {name:"VapeSensei",avatar:"🥷",badge:"Partner",followers:"22K",schedule:"Wed/Sun 7PM"},
];

const LIVE_REACTIONS = ["🔥","😱","💨","😂","💀","👏","⚽","🎉"];
const LIVE_BADGE = {Creator:{icon:"⚡",c:"#00E5FF"},Partner:{icon:"💎",c:"#FFD93D"},Official:{icon:"✦",c:"#FF4D8D"}};


const C = {
  bg:"#050510", bg2:"#0a0a20", bg3:"#0f0f2a", card:"#12123a",
  border:"rgba(255,255,255,0.06)", border2:"rgba(255,255,255,0.12)",
  text:"#F0EEFF", text2:"#A8A3D0", text3:"#6E6A95",
  cyan:"#00E5FF", gold:"#FFD93D", pink:"#FF4D8D", purple:"#C084FC",
  orange:"#FB923C", red:"#FF4444", green:"#34D399", lime:"#7FFF00", blue:"#60A5FA",
  glass:"rgba(255,255,255,0.03)", glassBorder:"rgba(255,255,255,0.08)",
};

// ── LIVE SPECTATOR SYSTEM ──
const SPECTATOR_NAMES = [
  "Puff_Master_420","Blinker_Betty","CloudChaser99","THC_Tony","DabQueen",
  "SmokeRing_Steve","VapeLord69","HazeDaze","KushKing","RollerCoaster",
  "BlazeRunner","FogMachine","MistWalker","PuffDaddy_Jr","ChillPill",
  "NebulaNick","GreenGoblin","SkyHighSam","TokeToken","LitLenny",
  "CloudNine_OG","BubbleBoi","RipTide","SeshGremlin","GlassHouse",
  "TerpQueen","HotBoxHank","MoonRock_Mike","DankDiva","CouchLock",
  "WhiteLung","PurpleRain","GoldLeaf","CrystalClear","IceIce_Baby",
  "StoneAge","RollingThunder","PeacePipe","ChiefKeef_Fan","HighNoon",
];
const SPECTATOR_EMOJIS = ["😤","😶‍🌫️","🤤","😎","🥴","😮‍💨","🫠","🤩","😵‍💫","🥳","😈","👽","🤖","👻","💀","🫡","🧿","🦊","🐸","🌚"];
const SPECTATOR_TICKER_MSGS = [
  "just joined the arena",
  "puffed a blinker",
  "is watching live",
  "just hit a 3-second pull",
  "went cloud mode",
  "is vibing hard",
  "joined from the lobby",
  "brought the energy",
  "is hyped up",
  "entered spectator mode",
];

// ── LIQUID GLASS DESIGN SYSTEM (iOS-inspired) ──
// "clear" is the ONE style used for jumbotron, nav, side buttons — all match
// GLASS_CLEAR — for nav, side buttons, small UI (more transparent)
const GLASS_CLEAR = {
  background:"rgba(255,255,255,0.06)",
  backdropFilter:"blur(50px) saturate(1.5) brightness(1.1)",
  WebkitBackdropFilter:"blur(50px) saturate(1.5) brightness(1.1)",
  border:"1px solid rgba(255,255,255,0.15)",
  boxShadow:"0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.04)",
};
// GLASS_CARD — for jumbotron, info cards, content panels (readable over video/images)
const GLASS_CARD = {
  background:"rgba(8,8,25,0.72)",
  backdropFilter:"blur(40px) saturate(1.4)",
  WebkitBackdropFilter:"blur(40px) saturate(1.4)",
  border:"1px solid rgba(255,255,255,0.1)",
  boxShadow:"0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)",
};
const LG = {
  // Base liquid glass — for overlays, cards, panels
  base: {
    background:"rgba(255,255,255,0.05)",
    backdropFilter:"blur(40px) saturate(1.8) brightness(1.1)",
    WebkitBackdropFilter:"blur(40px) saturate(1.8) brightness(1.1)",
    border:"1px solid rgba(255,255,255,0.12)",
    boxShadow:"0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)",
  },
  // Thick glass — for panels, sheets
  thick: {
    background:"rgba(10,10,32,0.45)",
    backdropFilter:"blur(60px) saturate(2) brightness(1.05)",
    WebkitBackdropFilter:"blur(60px) saturate(2) brightness(1.05)",
    border:"1px solid rgba(255,255,255,0.1)",
    boxShadow:"0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)",
  },
  // Pill — for small buttons, tags
  pill: {
    background:"rgba(255,255,255,0.06)",
    backdropFilter:"blur(24px) saturate(1.6)",
    WebkitBackdropFilter:"blur(24px) saturate(1.6)",
    border:"1px solid rgba(255,255,255,0.1)",
    boxShadow:"0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  // Tinted — for zone-colored glass
  tinted: (color) => ({
    background:`${color}08`,
    backdropFilter:"blur(40px) saturate(1.8)",
    WebkitBackdropFilter:"blur(40px) saturate(1.8)",
    border:`1px solid ${color}18`,
    boxShadow:`0 8px 32px ${color}08, inset 0 1px 0 ${color}10, inset 0 -1px 0 ${color}05`,
  }),
};

// ── GAME DATA (identical content) ──
const PLAY_GAMES = [
  { id:"finalkick", name:"Final Kick", emoji:"⚽", players:"2", time:"1-2m", type:"Skill", color:C.cyan, desc:"Penalty kick 1v1. Aim your shot, pick your save direction.", hot:true, difficulty:5, mp:{mode:"100 Keepers",count:"1v100",badge:"🥅"} },
  { id:"finalkick2", name:"Final Kick 2", emoji:"⚽🔥", players:"2", time:"2-3m", type:"Precision", color:C.gold, desc:"Double puff! Aim X-axis + Y-axis separately.", hot:true, difficulty:6, mp:{mode:"Pressure Cooker",count:"8 players",badge:"🔥"} },
  // Final Kick 3D removed — too similar to FK2
  { id:"hotpotato", name:"Hot Potato", emoji:"💣", players:"3-8", time:"1-3m", type:"Luck", color:C.orange, desc:"Bomb jumps randomly. Puff to pass. Get caught = eliminated.", difficulty:2, mp:{mode:"Pass the Nuke",count:"16 players",badge:"☢️"} },
  { id:"russian", name:"Russian Roulette", emoji:"🎲", players:"2-6", time:"1-2m", type:"Luck", color:C.red, desc:"Take turns puffing. Random elimination each round. Maximum tension.", difficulty:2, mp:{mode:"The Gauntlet",count:"1,000→1",badge:"💀"} },
  { id:"wildwest", name:"Wild West Duel", emoji:"🤠", players:"2", time:"1-2m", type:"Reaction", color:C.gold, desc:"Best of 5 showdown! Wait for DRAW, puff fastest. Reaction time in ms.", hot:true, difficulty:5, mp:{mode:"High Noon Town",count:"8 bracket",badge:"🌵"} },
  { id:"balloon", name:"Balloon Pop", emoji:"🎈", players:"2-8", time:"1-3m", type:"Strategy", color:C.pink, desc:"Puff inflates the balloon. Pop it and you lose.", difficulty:4, mp:{mode:"Relay Race",count:"2 teams×4",badge:"🏁"} },
  { id:"puffpong", name:"Puff Pong", emoji:"🏓", players:"2", time:"1-2m", type:"Skill", color:C.green, desc:"Virtual ping pong. Puff = hit the ball. Timing is everything.", difficulty:5, mp:{mode:"Doubles Chaos",count:"2v2",badge:"🎾"} },
  { id:"rhythm", name:"Rhythm Puff", emoji:"🎵", players:"1-4", time:"1-3m", type:"Rhythm", color:C.purple, desc:"Notes fall down, puff on beat. Guitar Hero style.", difficulty:5, mp:{mode:"Band Battle",count:"4-piece band",badge:"🎸"} },
  { id:"tugofwar", name:"Tug of War", emoji:"💪", players:"2-8", time:"30s-1m", type:"Team", color:C.blue, desc:"Two teams puff nonstop. Stronger side wins.", hot:true, difficulty:4, mp:{mode:"50v50 War",count:"50v50",badge:"⚔️"} },
  { id:"hooked", name:"Hooked", emoji:"🎣", players:"1", time:"2-5m", type:"Skill", color:C.blue, desc:"Stack fishing! Puff to reel in fish. Control your suction!", difficulty:4, mp:{mode:"Fishing Tournament",count:"8 anglers",badge:"🐟"} },
  { id:"rps", name:"Puff RPS", emoji:"✊", players:"2", time:"1-2m", type:"Strategy", color:C.purple, desc:"Rock Paper Scissors with Puff Power!", hot:true, difficulty:2, mp:{mode:"Thunderdome",count:"16 bracket",badge:"⚡"} },
  { id:"beatdrop", name:"Beat Drop", emoji:"🎧", players:"4", time:"3-5m", type:"Music", color:C.pink, desc:"4 DJs compete -- release your puff at the EXACT beat drop! Closest timing wins.", difficulty:4, mp:{mode:"DJ Battle",count:"4 DJs",badge:"🎤"} },
  { id:"puffclock", name:"Puff Clock", emoji:"⏱️", players:"1-100+", time:"3-5m", type:"Precision", color:C.orange, desc:"Puff for EXACTLY the target time. Closest wins!", difficulty:5, mp:{mode:"World Sync",count:"500+ players",badge:"🌍"} },
  { id:"pufflimbo", name:"Puff Limbo", emoji:"🎪", players:"1-50", time:"3-5m", type:"Endurance", color:C.orange, desc:"Target puff gets longer each round. Survive the blinker!", difficulty:5, mp:{mode:"The Eliminator",count:"50→1",badge:"💀"} },
  { id:"puffderby", name:"Puff Derby", emoji:"🏇", players:"6", time:"2-3m", type:"Racing", color:C.green, desc:"Pick a horse. Spam puff to make it run!", difficulty:2, mp:{mode:"Grand National",count:"6 horses×2",badge:"🐴"} },
  { id:"tankwar", name:"Tank War", emoji:"🔫", players:"1-4", time:"2-3m", type:"Artillery", color:"#4CAF50", desc:"Aim, fire, destroy! Tap to shoot, puff for super shots!", difficulty:3, hot:true, mp:{mode:"Clan Wars",count:"4v4",badge:"💥"} },
  { id:"fishwar", name:"Fish War", emoji:"🐟", players:"1-4", time:"2-3m", type:"Survival", color:"#3B82F6", desc:"Eat smaller fish, evolve, survive! Puff to boost!", difficulty:3, hot:true, mp:{mode:"Ocean Royale",count:"50 fish BR",badge:"🌊"} },
  { id:"rooftoppuff", name:"Rooftop Puff", emoji:"🏃", players:"1-4", time:"1-3m", type:"Runner", color:"#00E5FF", desc:"Parkour across rooftops! Tap to jump, puff to boost!", difficulty:2, hot:true, mp:{mode:"Race",count:"4 runners",badge:"🏙️"} },
];

const SHOW_GAMES = [
  { id:"vibecheck", name:"Vibe Check", emoji:"🧠", players:"1-100+", time:"5-15m", type:"Trivia", color:C.gold, desc:"Trivia Game Show. Host asks, contestants answer, audience votes.", live:true, difficulty:3, mp:{mode:"Crowd vs Contestant",count:"1+99",badge:"🧠"} },
  // Spin & Win moved to Fortune zone
  { id:"higherlower", name:"Higher or Lower", emoji:"📊", players:"1-100+", time:"5-10m", type:"Knowledge", color:C.cyan, desc:"Guess if the next number is higher or lower. Streak = big rewards.", live:true, difficulty:3, mp:{mode:"Chain Gang",count:"10 relay",badge:"🔗"} },
  { id:"pricepuff", name:"The Price is Puff", emoji:"💰", players:"2-50+", time:"5-10m", type:"Knowledge", color:C.green, desc:"Guess the product price. Closest wins.", live:true, difficulty:4, mp:{mode:"Bidding Frenzy",count:"6 players",badge:"💸"} },
  { id:"survivaltrivia", name:"Survival Trivia", emoji:"🏆", players:"2-100+", time:"5-15m", type:"Trivia", color:C.purple, desc:"Answer correctly or get eliminated. Last one standing wins!", live:true, difficulty:3, mp:{mode:"Last Brain Standing",count:"100→1",badge:"🧠"} },
  { id:"simonpuffs", name:"Simon Puffs", emoji:"🔴", players:"1-50+", time:"3-8m", type:"Memory", color:C.red, desc:"Remember the pattern, repeat with puffs. Memory master!", live:true, difficulty:3, mp:{mode:"Mind Meld",count:"4 co-op",badge:"🧩"} },
  { id:"puffauction", name:"Puff Auction", emoji:"🔨", players:"2-50+", time:"3-8m", type:"Strategy", color:C.lime, desc:"Bid with your lungs! Biggest puff wins the auction.", live:true, difficulty:4, mp:{mode:"Auction House Madness",count:"16 bidders",badge:"🏛️"} },
];

const MC_LINES = {
  intro: ["Ladies and gentlemen, welcome to {show}!", "The stage is SET! Tonight's show: {show}!", "Welcome back to {show}! Let's get started!"],
  contestant_pick: ["And our contestant tonight is... YOU! 🎯", "The spotlight is on YOU! Ready?", "Step up to the stage! You're our star tonight! ⭐"],
  round_start: ["Round {n}! Here we go!", "Next round coming up!", "Can they keep the streak alive?"],
  correct: ["CORRECT! The crowd goes wild! 🎉", "Nailed it! Brilliant!", "That's RIGHT! {points} points!"],
  wrong: ["Ohhh! Not quite! 😬", "The crowd groans! Wrong answer!", "So close! Better luck next round!"],
  audience_react: ["The audience is LOVING this!", "Puff reactions flooding in! 💨", "What a show tonight!"],
  finale: ["What a performance! Give it up! 👏", "That's a wrap! Final scores coming in!", "Incredible show tonight! See you next time!"],
};

const ORACLE_GAMES = [
  { id:"crystalball", name:"Crystal Ball", emoji:"🔮", players:"1", time:"1-2m", type:"Prediction", color:"#9333EA", desc:"Yes/No universal predictions. Puff to decide destiny.", difficulty:1 },
  { id:"strainbattle", name:"Strain Battle", emoji:"🌿", players:"1", time:"2-3m", type:"Vote", color:"#22C55E", desc:"Vote for the best strain in epic matchups.", difficulty:1 },
  { id:"matchpredictor", name:"Match Predictor", emoji:"📊", players:"1", time:"1-2m", type:"Sports", color:"#3B82F6", desc:"Predict WC match outcomes. Win/Draw/Lose.", difficulty:1 },
  { id:"dailypicks", name:"Daily Picks", emoji:"📅", players:"1", time:"2-3m", type:"Daily", color:"#F97316", desc:"3 daily predictions with streak multipliers.", difficulty:1 },
  { id:"puffslots", name:"Puff Slots", emoji:"🎰", players:"1", time:"2-3m", type:"Fortune", color:"#FFD700", desc:"3-reel slot machine. Puff to spin the reels!", difficulty:1 },
  { id:"puffblackjack", name:"Puff Blackjack", emoji:"🃏", players:"1", time:"3-5m", type:"Fortune", color:"#22C55E", desc:"Classic blackjack with puff controls. Hit or Stand!", difficulty:1 },
  { id:"coinflip", name:"Coin Flip", emoji:"🪙", players:"1", time:"1-2m", type:"Fortune", color:"#F59E0B", desc:"50/50 flip with puff confidence multiplier.", difficulty:1 },
  { id:"crapsnclouds", name:"Craps & Clouds", emoji:"🎲", players:"1", time:"2-3m", type:"Fortune", color:"#EF4444", desc:"Dice game where your puff controls the roll!", difficulty:1 },
  { id:"mysterybox", name:"Mystery Box", emoji:"🎁", players:"1", time:"2-3m", type:"Fortune", color:"#FFD700", desc:"3 mystery boxes. Pick one. Puff to reveal!", difficulty:1 },
  { id:"scratchpuff", name:"Scratch & Puff", emoji:"🎫", players:"1", time:"2-3m", type:"Fortune", color:"#EC4899", desc:"6 scratch areas. Puff to scratch. Match 3 wins!", difficulty:1 },
  { id:"fortunecookie", name:"Fortune Cookie", emoji:"🥠", players:"1", time:"1-2m", type:"Fortune", color:"#F97316", desc:"Crack open wisdom + coins. Blinker = golden cookie!", difficulty:1 },
  { id:"treasuremap", name:"Treasure Map", emoji:"🗺️", players:"1", time:"3-5m", type:"Fortune", color:"#FFD700", desc:"16 tiles. Find 3 treasures. Avoid 3 bombs!", difficulty:1 },
];

const ORACLE_WC_MATCHES = [
  {id:1, home:"USA", homeFlag:"🇺🇸", away:"Mexico", awayFlag:"🇲🇽", time:"Tonight 9PM", group:"A", hot:true, predictions:{home:45,draw:28,away:27}},
  {id:2, home:"Brazil", homeFlag:"🇧🇷", away:"Germany", awayFlag:"🇩🇪", time:"Tomorrow 3AM", group:"B", predictions:{home:52,draw:22,away:26}},
  {id:3, home:"France", homeFlag:"🇫🇷", away:"Argentina", awayFlag:"🇦🇷", time:"Tomorrow 9PM", group:"C", hot:true, predictions:{home:38,draw:25,away:37}},
  {id:4, home:"England", homeFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", away:"Spain", awayFlag:"🇪🇸", time:"Wed 6PM", group:"D", predictions:{home:35,draw:30,away:35}},
  {id:5, home:"Japan", homeFlag:"🇯🇵", away:"Netherlands", awayFlag:"🇳🇱", time:"Wed 9PM", group:"E", predictions:{home:28,draw:25,away:47}},
  {id:6, home:"Vietnam", homeFlag:"🇻🇳", away:"Portugal", awayFlag:"🇵🇹", time:"Thu 3AM", group:"F", predictions:{home:15,draw:20,away:65}},
];

const ORACLE_WC_SPECIALS = [
  {id:"winner", question:"Who wins the World Cup?", emoji:"🏆", topPick:"Brazil 🇧🇷", topPct:24, total:3847},
  {id:"scorer", question:"Top Scorer?", emoji:"⚽", topPick:"Mbappé 🇫🇷", topPct:18, total:2103},
  {id:"dark", question:"Dark Horse Team?", emoji:"🐴", topPick:"Japan 🇯🇵", topPct:15, total:1456},
  {id:"group_death", question:"Group of Death?", emoji:"💀", topPick:"Group C", topPct:42, total:890},
];

const ORACLE_FUN_PREDS = [
  {question:"Will Bitcoin close above $100K this week?", emoji:"₿", topAnswer:"68% say Yes", votes:1247, color:C.gold},
  {question:"Will Elon tweet about crypto today?", emoji:"🐦", topAnswer:"72% say Yes", votes:892, color:C.cyan},
  {question:"Pineapple on pizza: Yes or No?", emoji:"🍕", topAnswer:"54% say YES", votes:2341, color:C.orange},
  {question:"Will it rain in LA tomorrow?", emoji:"🌧️", topAnswer:"23% say Yes", votes:456, color:C.blue},
  {question:"Is a hot dog a sandwich?", emoji:"🌭", topAnswer:"61% say NO", votes:1876, color:C.red},
  {question:"Will the next viral meme be about cats?", emoji:"🐱", topAnswer:"45% say Yes", votes:743, color:C.pink},
  {question:"Coffee or tea for productivity?", emoji:"☕", topAnswer:"71% Coffee", votes:1532, color:C.orange},
  {question:"Will AI take over by 2030?", emoji:"🤖", topAnswer:"38% say Yes", votes:2104, color:C.purple},
];

const CB_PREDICTIONS = [
  { q:"Will Bitcoin hit $100K this month?", cat:"crypto", emoji:"🪙" },
  { q:"Will a new cannabis strain go viral on TikTok this week?", cat:"cannabis", emoji:"🌿" },
  { q:"Will Brazil win their next World Cup match?", cat:"sports", emoji:"⚽" },
  { q:"Will Snoop Dogg drop a surprise album this year?", cat:"culture", emoji:"🎤" },
  { q:"Will THC prices drop below $5/g in Colorado?", cat:"cannabis", emoji:"💰" },
  { q:"Will the next FIFA game outsell the last one?", cat:"gaming", emoji:"🎮" },
  { q:"Will a meme coin 10x this month?", cat:"crypto", emoji:"🚀" },
  { q:"Will indica outsell sativa this quarter?", cat:"cannabis", emoji:"🌿" },
  { q:"Will Argentina make it to the WC final?", cat:"sports", emoji:"🇦🇷" },
  { q:"Will AI replace more than 10% of jobs this year?", cat:"culture", emoji:"🤖" },
  { q:"Will edibles become legal in 3 more states?", cat:"cannabis", emoji:"🍫" },
  { q:"Will the next Super Bowl break viewership records?", cat:"sports", emoji:"🏈" },
  { q:"Will Drake drop a collab with a cannabis brand?", cat:"culture", emoji:"🎵" },
  { q:"Will Ethereum flip Bitcoin in market cap?", cat:"crypto", emoji:"💎" },
  { q:"Will the MLS become a top 5 global league?", cat:"sports", emoji:"⚽" },
];

const SB_STRAINS = [
  { name:"OG Kush", emoji:"🌿", thc:23, type:"Hybrid", effects:"Relaxed, Euphoric, Happy", flavor:"Earthy, Pine, Woody" },
  { name:"Blue Dream", emoji:"💙", thc:21, type:"Sativa", effects:"Creative, Euphoric, Uplifted", flavor:"Berry, Sweet, Herbal" },
  { name:"Gorilla Glue", emoji:"🦍", thc:28, type:"Hybrid", effects:"Relaxed, Euphoric, Sleepy", flavor:"Diesel, Earthy, Pine" },
  { name:"Girl Scout Cookies", emoji:"🍪", thc:25, type:"Hybrid", effects:"Happy, Euphoric, Relaxed", flavor:"Sweet, Earthy, Pungent" },
  { name:"Sour Diesel", emoji:"⛽", thc:22, type:"Sativa", effects:"Energetic, Happy, Uplifted", flavor:"Diesel, Pungent, Earthy" },
  { name:"Purple Haze", emoji:"💜", thc:20, type:"Sativa", effects:"Creative, Euphoric, Energetic", flavor:"Berry, Earthy, Sweet" },
  { name:"Wedding Cake", emoji:"🎂", thc:27, type:"Indica", effects:"Relaxed, Happy, Euphoric", flavor:"Sweet, Vanilla, Earthy" },
  { name:"Gelato", emoji:"🍨", thc:25, type:"Hybrid", effects:"Relaxed, Happy, Euphoric", flavor:"Sweet, Citrus, Fruity" },
  { name:"Jack Herer", emoji:"🌲", thc:20, type:"Sativa", effects:"Creative, Energetic, Focused", flavor:"Pine, Earthy, Woody" },
  { name:"Northern Lights", emoji:"🌌", thc:21, type:"Indica", effects:"Relaxed, Sleepy, Happy", flavor:"Earthy, Pine, Sweet" },
  { name:"Pineapple Express", emoji:"🍍", thc:22, type:"Hybrid", effects:"Happy, Uplifted, Energetic", flavor:"Tropical, Pineapple, Citrus" },
  { name:"White Widow", emoji:"🕸️", thc:20, type:"Hybrid", effects:"Euphoric, Energetic, Creative", flavor:"Earthy, Woody, Pungent" },
  { name:"AK-47", emoji:"💥", thc:22, type:"Hybrid", effects:"Relaxed, Happy, Uplifted", flavor:"Earthy, Pungent, Floral" },
  { name:"Granddaddy Purple", emoji:"🍇", thc:23, type:"Indica", effects:"Relaxed, Sleepy, Happy", flavor:"Grape, Berry, Sweet" },
  { name:"Skywalker OG", emoji:"🌠", thc:26, type:"Indica", effects:"Relaxed, Sleepy, Happy", flavor:"Earthy, Pine, Diesel" },
  { name:"Durban Poison", emoji:"☀️", thc:19, type:"Sativa", effects:"Energetic, Uplifted, Creative", flavor:"Sweet, Earthy, Pine" },
];

const MP_MATCHES = [
  { id:"mp1", home:"🇧🇷 Brazil", away:"🇩🇪 Germany", time:"3:00 PM", pool:[65,20,15], group:"F" },
  { id:"mp2", home:"🇫🇷 France", away:"🇦🇷 Argentina", time:"9:00 PM", pool:[40,25,35], group:"C" },
  { id:"mp3", home:"🇺🇸 USA", away:"🇲🇽 Mexico", time:"6:00 PM", pool:[45,30,25], group:"A" },
  { id:"mp4", home:"🇪🇸 Spain", away:"🇳🇱 Netherlands", time:"12:00 PM", pool:[50,28,22], group:"B" },
  { id:"mp5", home:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", away:"🇵🇹 Portugal", time:"3:00 AM", pool:[38,32,30], group:"D" },
  { id:"mp6", home:"🇮🇹 Italy", away:"🇧🇪 Belgium", time:"6:00 AM", pool:[42,30,28], group:"E" },
  { id:"mp7", home:"🇯🇵 Japan", away:"🇰🇷 South Korea", time:"9:00 AM", pool:[35,30,35], group:"G" },
  { id:"mp8", home:"🇳🇬 Nigeria", away:"🇨🇲 Cameroon", time:"12:00 AM", pool:[40,35,25], group:"H" },
];

const DP_QUESTIONS = [
  { q:"Will the top trending TikTok today be about food?", cat:"morning", emoji:"🌅", type:"yn" },
  { q:"Will Gold price go up today?", cat:"morning", emoji:"🌅", type:"yn" },
  { q:"Morning mood: Coffee or Green Tea?", cat:"morning", emoji:"🌅", type:"ab", a:"Coffee", b:"Green Tea" },
  { q:"Will the most-streamed Spotify song today be hip-hop?", cat:"afternoon", emoji:"☀️", type:"yn" },
  { q:"Afternoon sesh: Indica or Sativa?", cat:"afternoon", emoji:"☀️", type:"ab", a:"Indica", b:"Sativa" },
  { q:"Will any crypto gain more than 5% today?", cat:"afternoon", emoji:"☀️", type:"yn" },
  { q:"Will tonight's biggest sports upset actually happen?", cat:"night", emoji:"🌙", type:"yn" },
  { q:"Night strain pick: Edibles or Flower?", cat:"night", emoji:"🌙", type:"ab", a:"Edibles", b:"Flower" },
  { q:"Will a viral meme break 1M shares tonight?", cat:"night", emoji:"🌙", type:"yn" },
  { q:"Will the late-night game go to overtime?", cat:"morning", emoji:"🌅", type:"yn" },
  { q:"Best wake-and-bake: Joint or Vape?", cat:"morning", emoji:"🌅", type:"ab", a:"Joint", b:"Vape" },
  { q:"Will the stock market close green today?", cat:"afternoon", emoji:"☀️", type:"yn" },
  { q:"Will any team score 5+ goals in tonight's matches?", cat:"night", emoji:"🌙", type:"yn" },
  { q:"Late night munchies: Pizza or Tacos?", cat:"night", emoji:"🌙", type:"ab", a:"Pizza", b:"Tacos" },
  { q:"Will tomorrow's weather be better than today?", cat:"morning", emoji:"🌅", type:"yn" },
];

const VC_QUESTIONS_V2 = [
  { q:"Which country has won the most FIFA World Cups?", opts:["Germany","Argentina","Brazil","France"], correct:2, cat:"Football" },
  { q:"What year was the first World Cup held?", opts:["1928","1930","1934","1926"], correct:1, cat:"History" },
  { q:"Which stadium hosted the 2014 World Cup Final?", opts:["Wembley","Azteca","Maracana","Lusail"], correct:2, cat:"Stadiums" },
  { q:"Who scored the fastest World Cup hat-trick?", opts:["Mbappe","Haaland","Batistuta","Muller"], correct:2, cat:"Records" },
  { q:"How many teams play in the 2026 World Cup?", opts:["32","40","48","64"], correct:2, cat:"WC 2026" },
  { q:"Which host city is furthest north in WC 2026?", opts:["Seattle","Vancouver","Toronto","Boston"], correct:1, cat:"WC 2026" },
  { q:"What is the most goals scored in a single WC match?", opts:["10","12","14","16"], correct:1, cat:"Records" },
  { q:"Which country has appeared in every World Cup?", opts:["Germany","Argentina","Italy","Brazil"], correct:3, cat:"Football" },
];

const PREDICT_TYPES = [
  { id:"match", name:"Match Predictor", emoji:"🏟️", desc:"Win/Draw/Lose", color:C.purple },
  { id:"score", name:"Score Predictor", emoji:"🎯", desc:"Exact score ×10", color:C.cyan },
  { id:"mvp", name:"MVP Pick", emoji:"⭐", desc:"Best player", color:C.gold },
  { id:"bracket", name:"Bracket Challenge", emoji:"🗓️", desc:"Full tournament bracket", color:C.lime },
  { id:"showpred", name:"Show Predictor", emoji:"🎪", desc:"Who wins the show?", color:C.pink },
  { id:"daily", name:"Daily Picks", emoji:"📅", desc:"3-5 picks per day", color:C.orange },
];

const MATCHES = [
  { id:1, home:"🇺🇸 USA", away:"🇲🇽 MEX", time:"9:00 PM", odds:[2.1,3.2,3.5], group:"A", hot:true },
  { id:2, home:"🇧🇷 BRA", away:"🇩🇪 GER", time:"3:00 AM", odds:[1.8,3.5,4.2], group:"F" },
  { id:3, home:"🇫🇷 FRA", away:"🇦🇷 ARG", time:"Tomorrow", odds:[2.5,3.1,2.8], group:"C" },
];

const LEADERBOARD = [
  { name:"ChillMaster42", score:2847000, emoji:"👑", streak:23, place:"🥇" },
  { name:"VibeKing", score:2654000, emoji:"😎", streak:18, place:"🥈" },
  { name:"Steve", score:420690, emoji:"🌟", streak:7, place:"🥉", isYou:true },
  { name:"BlazedPanda", score:350000, emoji:"🐼", streak:5, place:"4" },
  { name:"NeonQueen", score:280000, emoji:"👸", streak:12, place:"5" },
  { name:"CloudNine99", score:245000, emoji:"☁️", streak:9, place:"6" },
  { name:"PuffDaddy", score:198000, emoji:"💨", streak:4, place:"7" },
];

const TOURNAMENTS = [
  { id:1, name:"Flash Frenzy", emoji:"⚡", prize:"5,000", max:50, current:47, time:"2:30", hot:true, game:"wildwest" },
  { id:2, name:"Brain Battle", emoji:"🧠", prize:"25,000", max:100, current:72, time:"15:00", game:"vibecheck" },
  { id:3, name:"Mega Championship", emoji:"🏆", prize:"100,000", max:200, current:198, time:"1:00:00", hot:true, game:"finalkick" },
];

const BADGES = [
  { name:"First Win", emoji:"🏅", earned:true },{ name:"5 Streak", emoji:"🔥", earned:true },
  { name:"Show Star", emoji:"⭐", earned:true },{ name:"Predictor", emoji:"🔮", earned:true },
  { name:"Bracket King", emoji:"👑", earned:false },{ name:"100 Games", emoji:"💯", earned:false },
  { name:"WC Champion", emoji:"🏆", earned:false },{ name:"Social", emoji:"🦋", earned:false },
];

// ── WALL: MEGA LEADERBOARD DATA ──
const WALL_LEADERBOARD = {
  all:[
    {name:"CloudChaser99",emoji:"😎",rank:"Diamond",value:4200,metric:"coins",trend:"up"},
    {name:"PuffMaster420",emoji:"🤠",rank:"Platinum",value:3800,metric:"coins",trend:"up"},
    {name:"THC_Tony",emoji:"😤",rank:"Gold",value:3200,metric:"coins",trend:"down"},
    {name:"BlinkerBetty",emoji:"💀",rank:"Gold",value:3050,metric:"coins",trend:"up"},
    {name:"PuffSensei",emoji:"🥋",rank:"Platinum",value:2900,metric:"coins",trend:"up"},
    {name:"QuickDraw_420",emoji:"🔫",rank:"Diamond",value:2800,metric:"coins",trend:"down"},
    {name:"OracleKing",emoji:"🔮",rank:"Gold",value:2650,metric:"coins",trend:"up"},
    {name:"IronLungs",emoji:"🫁",rank:"Platinum",value:2500,metric:"coins",trend:"up"},
    {name:"BeatMaster",emoji:"🎵",rank:"Silver",value:2350,metric:"coins",trend:"down"},
    {name:"GentlePuffer",emoji:"🎈",rank:"Gold",value:2200,metric:"coins",trend:"up"},
    {name:"TimeLord",emoji:"⏱️",rank:"Silver",value:2150,metric:"coins",trend:"down"},
    {name:"You",emoji:"😎",rank:"Gold",value:2100,metric:"coins",trend:"up",isYou:true},
    {name:"The420Master",emoji:"🌿",rank:"Silver",value:1950,metric:"coins",trend:"up"},
    {name:"DabQueen",emoji:"👸",rank:"Bronze",value:1800,metric:"coins",trend:"down"},
    {name:"PuffDaddy_Jr",emoji:"💨",rank:"Bronze",value:1650,metric:"coins",trend:"up"},
  ],
  arcade:[
    {name:"PuffMaster420",emoji:"🤠",rank:"Diamond",value:89,metric:"wins",trend:"up"},
    {name:"CloudChaser99",emoji:"😎",rank:"Platinum",value:82,metric:"wins",trend:"up"},
    {name:"BlinkerBetty",emoji:"💀",rank:"Gold",value:76,metric:"wins",trend:"down"},
    {name:"GentlePuffer",emoji:"🎈",rank:"Gold",value:71,metric:"wins",trend:"up"},
    {name:"IronLungs",emoji:"🫁",rank:"Platinum",value:68,metric:"wins",trend:"up"},
    {name:"THC_Tony",emoji:"😤",rank:"Silver",value:64,metric:"wins",trend:"down"},
    {name:"BeatMaster",emoji:"🎵",rank:"Silver",value:59,metric:"wins",trend:"up"},
    {name:"You",emoji:"😎",rank:"Gold",value:55,metric:"wins",trend:"up",isYou:true},
    {name:"QuickDraw_420",emoji:"🔫",rank:"Gold",value:52,metric:"wins",trend:"down"},
    {name:"TimeLord",emoji:"⏱️",rank:"Silver",value:48,metric:"wins",trend:"up"},
    {name:"PuffSensei",emoji:"🥋",rank:"Bronze",value:44,metric:"wins",trend:"up"},
    {name:"The420Master",emoji:"🌿",rank:"Bronze",value:41,metric:"wins",trend:"down"},
    {name:"DabQueen",emoji:"👸",rank:"Bronze",value:38,metric:"wins",trend:"up"},
    {name:"OracleKing",emoji:"🔮",rank:"Bronze",value:35,metric:"wins",trend:"down"},
    {name:"PuffDaddy_Jr",emoji:"💨",rank:"Bronze",value:31,metric:"wins",trend:"up"},
  ],
  stage:[
    {name:"PuffSensei",emoji:"🥋",rank:"Diamond",value:45,metric:"wins",trend:"up"},
    {name:"BeatMaster",emoji:"🎵",rank:"Platinum",value:41,metric:"wins",trend:"up"},
    {name:"CloudChaser99",emoji:"😎",rank:"Gold",value:38,metric:"wins",trend:"down"},
    {name:"IronLungs",emoji:"🫁",rank:"Gold",value:35,metric:"wins",trend:"up"},
    {name:"THC_Tony",emoji:"😤",rank:"Silver",value:32,metric:"wins",trend:"up"},
    {name:"BlinkerBetty",emoji:"💀",rank:"Silver",value:29,metric:"wins",trend:"down"},
    {name:"You",emoji:"😎",rank:"Gold",value:27,metric:"wins",trend:"up",isYou:true},
    {name:"GentlePuffer",emoji:"🎈",rank:"Silver",value:25,metric:"wins",trend:"up"},
    {name:"PuffMaster420",emoji:"🤠",rank:"Bronze",value:22,metric:"wins",trend:"down"},
    {name:"QuickDraw_420",emoji:"🔫",rank:"Bronze",value:19,metric:"wins",trend:"up"},
    {name:"OracleKing",emoji:"🔮",rank:"Bronze",value:17,metric:"wins",trend:"down"},
    {name:"TimeLord",emoji:"⏱️",rank:"Bronze",value:15,metric:"wins",trend:"up"},
    {name:"The420Master",emoji:"🌿",rank:"Bronze",value:13,metric:"wins",trend:"up"},
    {name:"DabQueen",emoji:"👸",rank:"Bronze",value:11,metric:"wins",trend:"down"},
    {name:"PuffDaddy_Jr",emoji:"💨",rank:"Bronze",value:9,metric:"wins",trend:"up"},
  ],
  oracle:[
    {name:"OracleKing",emoji:"🔮",rank:"Diamond",value:92,metric:"winpct",trend:"up"},
    {name:"CloudChaser99",emoji:"😎",rank:"Platinum",value:87,metric:"winpct",trend:"up"},
    {name:"The420Master",emoji:"🌿",rank:"Gold",value:83,metric:"winpct",trend:"down"},
    {name:"PuffSensei",emoji:"🥋",rank:"Gold",value:79,metric:"winpct",trend:"up"},
    {name:"TimeLord",emoji:"⏱️",rank:"Silver",value:76,metric:"winpct",trend:"up"},
    {name:"You",emoji:"😎",rank:"Gold",value:73,metric:"winpct",trend:"up",isYou:true},
    {name:"DabQueen",emoji:"👸",rank:"Silver",value:70,metric:"winpct",trend:"down"},
    {name:"THC_Tony",emoji:"😤",rank:"Silver",value:68,metric:"winpct",trend:"up"},
    {name:"BlinkerBetty",emoji:"💀",rank:"Bronze",value:65,metric:"winpct",trend:"down"},
    {name:"PuffMaster420",emoji:"🤠",rank:"Bronze",value:62,metric:"winpct",trend:"up"},
    {name:"IronLungs",emoji:"🫁",rank:"Bronze",value:59,metric:"winpct",trend:"up"},
    {name:"BeatMaster",emoji:"🎵",rank:"Bronze",value:56,metric:"winpct",trend:"down"},
    {name:"GentlePuffer",emoji:"🎈",rank:"Bronze",value:53,metric:"winpct",trend:"up"},
    {name:"QuickDraw_420",emoji:"🔫",rank:"Bronze",value:50,metric:"winpct",trend:"down"},
    {name:"PuffDaddy_Jr",emoji:"💨",rank:"Bronze",value:47,metric:"winpct",trend:"up"},
  ],
  tournament:[
    {name:"CloudChaser99",emoji:"😎",rank:"Diamond",value:12,metric:"wins",trend:"up"},
    {name:"QuickDraw_420",emoji:"🔫",rank:"Platinum",value:10,metric:"wins",trend:"up"},
    {name:"PuffSensei",emoji:"🥋",rank:"Platinum",value:9,metric:"wins",trend:"down"},
    {name:"THC_Tony",emoji:"😤",rank:"Gold",value:8,metric:"wins",trend:"up"},
    {name:"PuffMaster420",emoji:"🤠",rank:"Gold",value:7,metric:"wins",trend:"up"},
    {name:"IronLungs",emoji:"🫁",rank:"Gold",value:6,metric:"wins",trend:"down"},
    {name:"BlinkerBetty",emoji:"💀",rank:"Silver",value:5,metric:"wins",trend:"up"},
    {name:"OracleKing",emoji:"🔮",rank:"Silver",value:5,metric:"wins",trend:"up"},
    {name:"You",emoji:"😎",rank:"Silver",value:4,metric:"wins",trend:"up",isYou:true},
    {name:"BeatMaster",emoji:"🎵",rank:"Silver",value:4,metric:"wins",trend:"down"},
    {name:"GentlePuffer",emoji:"🎈",rank:"Bronze",value:3,metric:"wins",trend:"up"},
    {name:"TimeLord",emoji:"⏱️",rank:"Bronze",value:3,metric:"wins",trend:"down"},
    {name:"The420Master",emoji:"🌿",rank:"Bronze",value:2,metric:"wins",trend:"up"},
    {name:"DabQueen",emoji:"👸",rank:"Bronze",value:2,metric:"wins",trend:"down"},
    {name:"PuffDaddy_Jr",emoji:"💨",rank:"Bronze",value:1,metric:"wins",trend:"up"},
  ],
};
const WALL_RECORDS = [
  {emoji:"⚡",name:"Fastest Draw",value:"127ms",holder:"QuickDraw_420",today:false},
  {emoji:"🫁",name:"Longest Puff Limbo",value:"Round 7",holder:"IronLungs",today:true},
  {emoji:"🎵",name:"Highest Combo",value:"47x",holder:"BeatMaster",today:false},
  {emoji:"🎈",name:"Most Survivals",value:"12",holder:"GentlePuffer",today:false},
  {emoji:"⏱️",name:"Best Puff Clock",value:"\u00b10.02s",holder:"TimeLord",today:false},
  {emoji:"🌿",name:"Perfect 4.20",value:"3 times",holder:"The420Master",today:true},
  {emoji:"🔮",name:"Prediction Streak",value:"23 days",holder:"OracleKing",today:false},
  {emoji:"💀",name:"Most Blinkers",value:"420",holder:"BlinkerBetty",today:false},
];
const WALL_ACTIVITY = [
  {emoji:"😎",msg:"CloudChaser99 won FK1 World Cup! 🏆",time:"3m ago"},
  {emoji:"😤",msg:"THC_Tony hit a blinker in Puff Limbo 💀",time:"7m ago"},
  {emoji:"👸",msg:"PuffQueen predicted Brazil correctly 🔮",time:"12m ago"},
  {emoji:"⏱️",msg:"BlinkerBetty set Puff Clock record ⏱️",time:"18m ago"},
  {emoji:"💪",msg:"Team Iron Lungs won The Puff Games 💪",time:"25m ago"},
  {emoji:"🤠",msg:"PuffMaster420 got a 15-game streak 🔥",time:"32m ago"},
  {emoji:"🥋",msg:"PuffSensei cleared Dojo Grand Master 🏯",time:"41m ago"},
  {emoji:"🔫",msg:"QuickDraw_420 set new fastest draw ⚡",time:"48m ago"},
  {emoji:"🎵",msg:"BeatMaster hit 47x combo in Rhythm Puff 🎶",time:"55m ago"},
  {emoji:"🌿",msg:"The420Master hit perfect 4.20 again 🌿",time:"1h ago"},
  {emoji:"💀",msg:"BlinkerBetty reached 420 total blinkers 💀",time:"1.5h ago"},
  {emoji:"🎈",msg:"GentlePuffer survived 12 rounds in BP 🎈",time:"2h ago"},
];
const WALL_ACHIEVEMENTS_RECENT = [
  {player:"PuffMaster420",achievement:"Iron Lungs 🫁",time:"2m ago",emoji:"🤠"},
  {player:"CloudChaser99",achievement:"Dragon Scroll 📜",time:"15m ago",emoji:"😎"},
  {player:"THC_Tony",achievement:"Blinker King 💀",time:"28m ago",emoji:"😤"},
  {player:"BeatMaster",achievement:"Rhythm God 🎵",time:"45m ago",emoji:"🎵"},
  {player:"GentlePuffer",achievement:"Survivor 🎈",time:"1h ago",emoji:"🎈"},
];
const WALL_ACHIEVEMENTS_RARE = [
  {name:"Living Legend",emoji:"⭐",pct:"0.3%"},
  {name:"The 420",emoji:"🌿",pct:"1.2%"},
  {name:"Iron Lungs",emoji:"🫁",pct:"2.1%"},
];
const WALL_FRIENDS = [
  {name:"PuffMaster420",emoji:"🤠",rank:"Platinum",online:true,lastSeen:null},
  {name:"THC_Tony",emoji:"😤",rank:"Gold",online:true,lastSeen:null},
  {name:"BeatMaster",emoji:"🎵",rank:"Silver",online:false,lastSeen:"2h ago"},
  {name:"GentlePuffer",emoji:"🎈",rank:"Gold",online:false,lastSeen:"5h ago"},
  {name:"DabQueen",emoji:"👸",rank:"Bronze",online:true,lastSeen:null},
];
const WALL_OPPONENTS = [
  {name:"IronLungs",emoji:"🫁",game:"Puff Limbo",result:"Lost"},
  {name:"QuickDraw_420",emoji:"🔫",game:"Wild West Duel",result:"Won"},
  {name:"OracleKing",emoji:"🔮",game:"Vibe Check",result:"Lost"},
];
const WALL_CHAMPIONS = [
  {tournament:"FK1 WC Champion",player:"CloudChaser99",emoji:"🏆",flag:"🇧🇷",badge:"😎"},
  {tournament:"Outlaw Circuit Sheriff",player:"QuickDraw_420",emoji:"🤠",flag:"🇺🇸",badge:"🔫"},
  {tournament:"Dojo Grand Master",player:"PuffSensei",emoji:"🥋",flag:"🇯🇵",badge:"🥋"},
];

// ── SOCIAL: ACHIEVEMENTS ──
const ACHIEVEMENTS = [
  {id:"first_puff", name:"First Puff", desc:"Puff for the first time", emoji:"💨", color:C.cyan, rare:false},
  {id:"first_win", name:"Winner!", desc:"Win your first game", emoji:"🏆", color:C.gold, rare:false},
  {id:"blinker_king", name:"Blinker King", desc:"Hit 10 blinkers", emoji:"💀", color:C.red, rare:false},
  {id:"sweet_spot", name:"Sweet Spot Merchant", desc:"Hit 50 perfect puffs", emoji:"🎯", color:C.green, rare:false},
  {id:"marathon", name:"Puff Marathon", desc:"Puff for 420 total seconds", emoji:"🏃", color:C.orange, rare:true},
  {id:"streak_7", name:"Weekly Warrior", desc:"7-day puff streak", emoji:"🔥", color:C.orange, rare:true},
  {id:"all_games", name:"Arcade Master", desc:"Play all 16 games", emoji:"🎮", color:C.purple, rare:true},
  {id:"tournament_win", name:"Champion", desc:"Win any tournament", emoji:"👑", color:C.gold, rare:true},
  {id:"crowd_surfer", name:"Crowd Surfer", desc:"Trigger 10 Puff Waves", emoji:"🌊", color:C.blue, rare:true},
  {id:"legend", name:"Living Legend", desc:"Reach Legendary rank", emoji:"⭐", color:C.gold, rare:true},
  {id:"the_420", name:"The 420", desc:"Have exactly 420 total puffs", emoji:"🌿", color:C.lime, rare:true},
  {id:"blinker_100", name:"Iron Lungs", desc:"Hit 100 blinkers", emoji:"🫁", color:C.red, rare:true},
];

// ── SOCIAL: RANK SYSTEM ──
const RANKS = [
  {name:"Bronze", emoji:"🥉", color:"#CD7F32", minXP:0},
  {name:"Silver", emoji:"🥈", color:"#C0C0C0", minXP:500},
  {name:"Gold", emoji:"🥇", color:"#FFD700", minXP:2000},
  {name:"Platinum", emoji:"💎", color:"#E5E4E2", minXP:5000},
  {name:"Diamond", emoji:"💠", color:"#B9F2FF", minXP:15000},
  {name:"Legendary", emoji:"⭐", color:"#FFD700", minXP:50000},
];

// ── SOCIAL: STREAK REWARDS ──
const STREAK_REWARDS = [
  {day:3, coins:100, label:"3-Day Bonus"},
  {day:7, coins:500, label:"Weekly Warrior"},
  {day:14, coins:1500, label:"Two-Week Terror"},
  {day:30, coins:5000, label:"Monthly Monster"},
];

// ── WORLD CUP 2026 — NATIONAL TEAMS (48 qualified + Vietnam + China) ──
const WC_TEAMS = [
  // CONCACAF (Hosts + qualified)
  {id:"usa",name:"USA",flag:"🇺🇸",group:"A",rating:4,confederation:"CONCACAF"},
  {id:"mex",name:"Mexico",flag:"🇲🇽",group:"A",rating:3,confederation:"CONCACAF"},
  {id:"can",name:"Canada",flag:"🇨🇦",group:"A",rating:3,confederation:"CONCACAF"},
  // CONMEBOL
  {id:"bra",name:"Brazil",flag:"🇧🇷",group:"F",rating:5,confederation:"CONMEBOL"},
  {id:"arg",name:"Argentina",flag:"🇦🇷",group:"C",rating:5,confederation:"CONMEBOL"},
  {id:"col",name:"Colombia",flag:"🇨🇴",group:"H",rating:4,confederation:"CONMEBOL"},
  {id:"uru",name:"Uruguay",flag:"🇺🇾",group:"H",rating:4,confederation:"CONMEBOL"},
  {id:"ecu",name:"Ecuador",flag:"🇪🇨",group:"G",rating:3,confederation:"CONMEBOL"},
  {id:"per",name:"Peru",flag:"🇵🇪",group:"I",rating:3,confederation:"CONMEBOL"},
  {id:"par",name:"Paraguay",flag:"🇵🇾",group:"L",rating:2,confederation:"CONMEBOL"},
  // UEFA
  {id:"ger",name:"Germany",flag:"🇩🇪",group:"F",rating:5,confederation:"UEFA"},
  {id:"fra",name:"France",flag:"🇫🇷",group:"C",rating:5,confederation:"UEFA"},
  {id:"eng",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",group:"B",rating:5,confederation:"UEFA"},
  {id:"esp",name:"Spain",flag:"🇪🇸",group:"E",rating:5,confederation:"UEFA"},
  {id:"por",name:"Portugal",flag:"🇵🇹",group:"E",rating:5,confederation:"UEFA"},
  {id:"ned",name:"Netherlands",flag:"🇳🇱",group:"D",rating:4,confederation:"UEFA"},
  {id:"bel",name:"Belgium",flag:"🇧🇪",group:"D",rating:4,confederation:"UEFA"},
  {id:"ita",name:"Italy",flag:"🇮🇹",group:"B",rating:4,confederation:"UEFA"},
  {id:"cro",name:"Croatia",flag:"🇭🇷",group:"G",rating:4,confederation:"UEFA"},
  {id:"den",name:"Denmark",flag:"🇩🇰",group:"J",rating:3,confederation:"UEFA"},
  {id:"sui",name:"Switzerland",flag:"🇨🇭",group:"J",rating:3,confederation:"UEFA"},
  {id:"aut",name:"Austria",flag:"🇦🇹",group:"K",rating:3,confederation:"UEFA"},
  {id:"srb",name:"Serbia",flag:"🇷🇸",group:"K",rating:3,confederation:"UEFA"},
  {id:"pol",name:"Poland",flag:"🇵🇱",group:"I",rating:3,confederation:"UEFA"},
  {id:"sco",name:"Scotland",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",group:"L",rating:2,confederation:"UEFA"},
  {id:"wal",name:"Wales",flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",group:"L",rating:2,confederation:"UEFA"},
  {id:"tur",name:"Turkey",flag:"🇹🇷",group:"K",rating:3,confederation:"UEFA"},
  {id:"ukr",name:"Ukraine",flag:"🇺🇦",group:"I",rating:3,confederation:"UEFA"},
  // AFC
  {id:"jpn",name:"Japan",flag:"🇯🇵",group:"D",rating:4,confederation:"AFC"},
  {id:"kor",name:"South Korea",flag:"🇰🇷",group:"G",rating:3,confederation:"AFC"},
  {id:"aus",name:"Australia",flag:"🇦🇺",group:"B",rating:3,confederation:"AFC"},
  {id:"ksa",name:"Saudi Arabia",flag:"🇸🇦",group:"F",rating:2,confederation:"AFC"},
  {id:"irn",name:"Iran",flag:"🇮🇷",group:"C",rating:3,confederation:"AFC"},
  {id:"qat",name:"Qatar",flag:"🇶🇦",group:"J",rating:2,confederation:"AFC"},
  {id:"irq",name:"Iraq",flag:"🇮🇶",group:"J",rating:2,confederation:"AFC"},
  {id:"uzb",name:"Uzbekistan",flag:"🇺🇿",group:"H",rating:2,confederation:"AFC"},
  {id:"idn",name:"Indonesia",flag:"🇮🇩",group:"E",rating:1,confederation:"AFC"},
  {id:"bhr",name:"Bahrain",flag:"🇧🇭",group:"L",rating:1,confederation:"AFC"},
  // CAF
  {id:"mar",name:"Morocco",flag:"🇲🇦",group:"F",rating:4,confederation:"CAF"},
  {id:"sen",name:"Senegal",flag:"🇸🇳",group:"C",rating:4,confederation:"CAF"},
  {id:"nga",name:"Nigeria",flag:"🇳🇬",group:"D",rating:3,confederation:"CAF"},
  {id:"egy",name:"Egypt",flag:"🇪🇬",group:"G",rating:3,confederation:"CAF"},
  {id:"cmr",name:"Cameroon",flag:"🇨🇲",group:"H",rating:3,confederation:"CAF"},
  {id:"rsa",name:"South Africa",flag:"🇿🇦",group:"E",rating:2,confederation:"CAF"},
  {id:"mli",name:"Mali",flag:"🇲🇱",group:"I",rating:2,confederation:"CAF"},
  {id:"cod",name:"DR Congo",flag:"🇨🇩",group:"K",rating:2,confederation:"CAF"},
  {id:"civ",name:"Ivory Coast",flag:"🇨🇮",group:"A",rating:3,confederation:"CAF"},
  // OFC
  {id:"nzl",name:"New Zealand",flag:"🇳🇿",group:"B",rating:2,confederation:"OFC"},
  // BONUS TEAMS
  {id:"vnm",name:"Vietnam",flag:"🇻🇳",group:"BONUS",rating:1,confederation:"AFC"},
  {id:"chn",name:"China",flag:"🇨🇳",group:"BONUS",rating:2,confederation:"AFC"},
];

// ── THEMED TEAMS FOR NON-FK GAMES ──
const GAME_TEAMS = {
  wildwest: [
    {id:"puffbandits",name:"Puff Bandits",emoji:"🤠💨",color:C.orange},
    {id:"blinkerboys",name:"Blinker Boys",emoji:"💀🤠",color:C.red},
    {id:"smokesignal",name:"Smoke Signal Posse",emoji:"🌫️🏜️",color:C.purple},
    {id:"cactuscartel",name:"Cactus Cartel",emoji:"🌵😎",color:C.green},
    {id:"goldrush",name:"Gold Rush Gang",emoji:"💰🤠",color:C.gold},
    {id:"tumbleweeds",name:"The Tumbleweeds",emoji:"🌾💨",color:C.lime},
  ],
  russian: [
    {id:"luckylungs",name:"Lucky Lungs",emoji:"🫁🍀",color:C.green},
    {id:"deadmanpuff",name:"Dead Man's Puff",emoji:"💀💨",color:C.red},
    {id:"chambersmoke",name:"Chamber of Smoke",emoji:"🔫🌫️",color:C.purple},
    {id:"triggerhappy",name:"Trigger Happy Club",emoji:"🎯😈",color:C.orange},
    {id:"sixshooters",name:"Six Shooters",emoji:"6️⃣🔫",color:C.cyan},
    {id:"lastpuff",name:"The Last Puff",emoji:"💨☠️",color:C.gold},
  ],
  balloon: [
    {id:"birthdayblink",name:"Birthday Blinkers",emoji:"🎂💀",color:C.pink},
    {id:"popsquad",name:"Pop Squad",emoji:"💥🎈",color:C.red},
    {id:"inflatenation",name:"Inflate Nation",emoji:"🎈💨",color:C.orange},
    {id:"heliumhomies",name:"Helium Homies",emoji:"🎈😂",color:C.cyan},
    {id:"partycrashers",name:"Party Crashers",emoji:"🎉💣",color:C.purple},
    {id:"bigbangs",name:"The Big Bangs",emoji:"💥🤯",color:C.gold},
  ],
  puffpong: [
    {id:"neonninjas",name:"Neon Ninjas",emoji:"🥷✨",color:C.cyan},
    {id:"pixelpuffers",name:"Pixel Puffers",emoji:"🕹️💨",color:C.green},
    {id:"retrorippers",name:"Retro Rippers",emoji:"🎮🔥",color:C.orange},
    {id:"glowgang",name:"Glow Gang",emoji:"💡😎",color:C.lime},
    {id:"arcadeapes",name:"Arcade Apes",emoji:"🦍🕹️",color:C.purple},
    {id:"pongpros",name:"Pong Pros",emoji:"🏓👑",color:C.gold},
  ],
  rhythm: [
    {id:"rollingclouds",name:"Rolling Clouds",emoji:"☁️🎸",color:C.purple},
    {id:"puffdaddy",name:"Puff Daddy & Fam",emoji:"💨👨‍👩‍👧‍👦",color:C.gold},
    {id:"blinkerbeats",name:"Blinker Beats",emoji:"💀🥁",color:C.red},
    {id:"420hz",name:"420 Hz",emoji:"🎵🌿",color:C.green},
    {id:"bassdrops",name:"Bass Drops",emoji:"🔊💥",color:C.cyan},
    {id:"smokemachine",name:"Smoke Machine",emoji:"🌫️🎹",color:C.pink},
  ],
  tugofwar: [
    {id:"ironlungs",name:"Iron Lungs",emoji:"🫁💪",color:C.cyan},
    {id:"puffpushers",name:"Puff Pushers",emoji:"💨🏋️",color:C.green},
    {id:"blinkerbeasts",name:"Blinker Beasts",emoji:"💀💪",color:C.red},
    {id:"smokestrongmen",name:"Smoke Strongmen",emoji:"🌫️🦍",color:C.purple},
    {id:"lunglegion",name:"Lung Legion",emoji:"🫁⚔️",color:C.gold},
    {id:"exhaleempire",name:"Exhale Empire",emoji:"💨👑",color:C.orange},
  ],
  hotpotato: [
    {id:"bakedbunch",name:"The Baked Bunch",emoji:"🍪😵",color:C.orange},
    {id:"friedsquad",name:"Fried Squad",emoji:"🍳💀",color:C.red},
    {id:"slowcookers",name:"Slow Cookers",emoji:"🍲😴",color:C.green},
    {id:"burntofferings",name:"Burnt Offerings",emoji:"🔥🍞",color:C.gold},
    {id:"hothandlers",name:"Hot Handlers",emoji:"🔥🤲",color:C.pink},
    {id:"bombsquad",name:"Bomb Squad",emoji:"💣😎",color:C.cyan},
  ],
  rps: [
    {id:"stonepuffers",name:"Stone Temple Puffers",emoji:"🪨💨",color:C.orange},
    {id:"papertrail",name:"Paper Trail Gang",emoji:"📄😎",color:C.cyan},
    {id:"scissorsensei",name:"Scissor Sensei",emoji:"✂️🥷",color:C.red},
    {id:"blinkerdojo",name:"Blinker Dojo",emoji:"💀🥋",color:C.purple},
    {id:"rocksolid",name:"Rock Solid Crew",emoji:"🪨💪",color:C.green},
    {id:"paperchasers",name:"Paper Chasers",emoji:"📄💰",color:C.gold},
  ],
  hooked: [
    {id:"deeppuffers",name:"Deep Puffers",emoji:"🐟💨",color:C.blue},
    {id:"blinkerbait",name:"Blinker Bait Co",emoji:"🎣💀",color:C.red},
    {id:"cloudanglers",name:"Cloud Anglers",emoji:"☁️🎣",color:C.cyan},
    {id:"reeldeal",name:"The Reel Deal",emoji:"🎣😎",color:C.green},
    {id:"krakenpuffs",name:"Kraken Puffs",emoji:"🦑💨",color:C.purple},
    {id:"tidalpull",name:"Tidal Pull",emoji:"🌊💪",color:C.gold},
  ],
  beatdrop: [
    {id:"rolling_bass",name:"Rolling Bass",emoji:"🎸",color:"#FF4D8D"},
    {id:"cloud_beats",name:"Cloud Beats",emoji:"☁️",color:"#A855F7"},
    {id:"neon_drop",name:"Neon Drop",emoji:"💜",color:"#00E5FF"},
    {id:"bass_blinkers",name:"Bass Blinkers",emoji:"🔊",color:"#FF8C42"},
    {id:"tempo_titans",name:"Tempo Titans",emoji:"⚡",color:"#FFD93D"},
    {id:"sub_zero",name:"Sub Zero",emoji:"❄️",color:"#60A5FA"},
  ],
  puffclock: [
    {id:"time_lords",name:"Time Lords",emoji:"⏰",color:"#00E5FF"},
    {id:"precision_crew",name:"Precision Crew",emoji:"🎯",color:"#7FFF00"},
    {id:"clock_stoppers",name:"Clock Stoppers",emoji:"⏱️",color:"#FFD93D"},
    {id:"four_twenty",name:"The 4:20s",emoji:"🌿",color:"#34D399"},
    {id:"nano_second",name:"Nano Second",emoji:"⚡",color:"#FF8C42"},
    {id:"zen_timers",name:"Zen Timers",emoji:"🧘",color:"#A855F7"},
  ],
  pufflimbo: [
    {id:"iron_lungs",name:"Iron Lungs",emoji:"🫁",color:"#FF4444"},
    {id:"blinker_gang",name:"Blinker Gang",emoji:"💀",color:"#A855F7"},
    {id:"endurance_elite",name:"Endurance Elite",emoji:"💪",color:"#00E5FF"},
    {id:"limbo_legends",name:"Limbo Legends",emoji:"🎪",color:"#FF8C42"},
    {id:"breath_masters",name:"Breath Masters",emoji:"💨",color:"#7FFF00"},
    {id:"cloud_chasers",name:"Cloud Chasers",emoji:"☁️",color:"#FFD93D"},
  ],
  puffderby: [
    {id:"thunder_stable",name:"Thunder Stable",emoji:"⚡",color:"#FFD93D"},
    {id:"cloud_riders",name:"Cloud Riders",emoji:"☁️",color:"#00E5FF"},
    {id:"sativa_sprint",name:"Sativa Sprint",emoji:"🌿",color:"#34D399"},
    {id:"blinker_bolt",name:"Blinker Bolt",emoji:"💀",color:"#FF4444"},
    {id:"indica_cruise",name:"Indica Cruise",emoji:"🍃",color:"#A855F7"},
    {id:"hybrid_hustle",name:"Hybrid Hustle",emoji:"🔥",color:"#FF8C42"},
  ],
};

const GAME_TOURNAMENTS = {
  wildwest: {
    name: "The Outlaw Circuit", emoji: "🤠",
    format: "16-player Single Elimination", formatShort: "Bracket",
    duration: "~30 min", rounds: ["Round of 16","Quarterfinal","Semifinal","HIGH NOON Final"],
    rules: "Best of 3 per match. Each round DRAW! timing gets shorter. Win or go home.",
    teamType: "gang",
    prizes: {gold:{pts:30000,coins:800,label:"Sheriff's Badge 🏅"},silver:{pts:15000,coins:400,label:"Deputy Star ⭐"},bronze:{pts:7500,coins:200,label:"Wanted Poster 📜"},fourth:{pts:3000,coins:100,label:"Bounty Hunter"}},
  },
  russian: {
    name: "The Underground", emoji: "🎲",
    format: "Survival Series (4 Tables → Final)", formatShort: "Survival",
    duration: "~20 min", rounds: ["Table 1","Table 2","Table 3","Table 4","FINAL TABLE"],
    rules: "6 players per table. 1 bullet. Survive → advance. Final table has 2 bullets!",
    teamType: "crew",
    prizes: {gold:{pts:30000,coins:800,label:"Diamond Chip 💎"},silver:{pts:15000,coins:400,label:"Gold Chip 🪙"},bronze:{pts:7500,coins:200,label:"Silver Chip 🥈"},fourth:{pts:3000,coins:100,label:"Survivor"}},
  },
  balloon: {
    name: "Puff Fest", emoji: "🎈",
    format: "Party Rounds (3 Heats + Final)", formatShort: "Party",
    duration: "~15 min", rounds: ["Heat 1","Heat 2","Heat 3","GRAND FINALE"],
    rules: "8 players per heat. Top 2 advance. Final: 6 players, lowest pop threshold!",
    teamType: "crew",
    prizes: {gold:{pts:30000,coins:800,label:"Golden Balloon 🎈"},silver:{pts:15000,coins:400,label:"Silver Pop 💥"},bronze:{pts:7500,coins:200,label:"Bronze Burst 🟤"},fourth:{pts:3000,coins:100,label:"Party Animal"}},
  },
  puffpong: {
    name: "Neon League", emoji: "🏓",
    format: "Swiss System (4 Rounds + Final)", formatShort: "Swiss",
    duration: "~25 min", rounds: ["Match 1","Match 2","Match 3","Match 4","CHAMPIONSHIP"],
    rules: "8 players. Play 4 matches vs different opponents. Win=3pts. Top 2 play Final.",
    teamType: "clan",
    prizes: {gold:{pts:30000,coins:800,label:"Arcade Crown 👑"},silver:{pts:15000,coins:400,label:"Neon Trophy 🏆"},bronze:{pts:7500,coins:200,label:"Pixel Medal 🎮"},fourth:{pts:3000,coins:100,label:"Challenger"}},
  },
  rhythm: {
    name: "Tour de Puff", emoji: "🎵",
    format: "Score Chase (3 Songs)", formatShort: "Score",
    duration: "~15 min", rounds: ["Opening Act","Main Set","ENCORE (2x Speed)"],
    rules: "Everyone plays 3 rounds. Total score = final ranking. No elimination! Round 3 is double speed.",
    teamType: "label",
    prizes: {gold:{pts:30000,coins:800,label:"Platinum Record 💿"},silver:{pts:15000,coins:400,label:"Gold Record 🥇"},bronze:{pts:7500,coins:200,label:"Silver Record 🥈"},fourth:{pts:3000,coins:100,label:"Roadie"}},
  },
  tugofwar: {
    name: "The Puff Games", emoji: "💪",
    format: "Round Robin Teams (4 Teams)", formatShort: "Round Robin",
    duration: "~20 min", rounds: ["Match 1","Match 2","Match 3","CHAMPIONSHIP PULL"],
    rules: "4 teams. Each plays all others. Win=3pts, Draw=1pt. Top 2 play Final.",
    teamType: "legion",
    prizes: {gold:{pts:30000,coins:800,label:"Champion's Belt 🏅"},silver:{pts:15000,coins:400,label:"Gladiator Shield 🛡️"},bronze:{pts:7500,coins:200,label:"Bronze Sword ⚔️"},fourth:{pts:3000,coins:100,label:"Warrior"}},
  },
  hotpotato: {
    name: "Bomb Squad Cup", emoji: "💣",
    format: "Heats + Grand Final", formatShort: "Heats",
    duration: "~15 min", rounds: ["Heat A","Heat B","GRAND FINAL"],
    rules: "2 heats of 8 players. 3 bomb rounds each. Top 3 survive → 6-player Final.",
    teamType: "squad",
    prizes: {gold:{pts:30000,coins:800,label:"Expert Badge 🎖️"},silver:{pts:15000,coins:400,label:"Defuser Medal 🏅"},bronze:{pts:7500,coins:200,label:"Survivor Pin 📌"},fourth:{pts:3000,coins:100,label:"Recruit"}},
  },
  rps: {
    name: "Dojo Championship", emoji: "✊",
    format: "Double Elimination (16 Players)", formatShort: "Double Elim",
    duration: "~30 min", rounds: ["Winners R1","Winners QF","Winners SF","Losers R1","Losers QF","Losers SF","GRAND FINAL"],
    rules: "Lose once → losers bracket. Lose twice → out. Best of 5 each match. Grand Final: Winners vs Losers champion.",
    teamType: "dojo",
    prizes: {gold:{pts:30000,coins:800,label:"Dragon Scroll 📜"},silver:{pts:15000,coins:400,label:"Tiger Claw 🐯"},bronze:{pts:7500,coins:200,label:"Crane Feather 🪶"},fourth:{pts:3000,coins:100,label:"White Belt"}},
  },
  hooked: {
    name: "Deep Sea Masters", emoji: "🎣",
    format: "Catch Competition (3 Sessions)", formatShort: "Catch Comp",
    duration: "~10 min", rounds: ["Session 1","Session 2","SESSION 3 (Legendary Waters)"],
    rules: "3 fishing sessions, 2 min each. Total catch points = ranking. Legendary=60, Rare=25, Common=10.",
    teamType: "crew",
    prizes: {gold:{pts:30000,coins:800,label:"Golden Rod 🎣"},silver:{pts:15000,coins:400,label:"Silver Hook 🪝"},bronze:{pts:7500,coins:200,label:"Bronze Reel 🔄"},fourth:{pts:3000,coins:100,label:"Deckhand"}},
  },
  beatdrop: {
    name: "The Drop Zone", emoji: "🎧",
    format: "DJ Battle (4 Songs)", formatShort: "Timing",
    duration: "~5 min", rounds: ["Neon Rise","Phantom Drop","Bass Quake","Chaos Theory"],
    rules: "4 DJs compete across 4 rounds. Release on the DROP -- closest timing wins. Best total score takes the crown.",
    teamType: "crew",
    prizes: {gold:{pts:30000,coins:800,label:"Platinum Beat 🎵"},silver:{pts:15000,coins:400,label:"Gold Record 🥇"},bronze:{pts:7500,coins:200,label:"Silver Mix 🥈"},fourth:{pts:3000,coins:100,label:"DJ Trainee"}},
  },
  puffclock: {
    name: "Time Masters", emoji: "⏱️",
    format: "Precision Tournament (5 Rounds)", formatShort: "Precision",
    duration: "~20 min", rounds: ["Round 1 (2.0s)","Round 2 (3.5s)","Round 3 (1.75s)","Round 4 (4.20s!)","Finals (Random)"],
    rules: "5 precision rounds. Closest to target time wins points. Total points = ranking. The 4.20s round is worth double!",
    teamType: "squad",
    prizes: {gold:{pts:30000,coins:800,label:"Time Lord Crown ⏱️"},silver:{pts:15000,coins:400,label:"Precision Medal 🎯"},bronze:{pts:7500,coins:200,label:"Clock Watcher 🕐"},fourth:{pts:3000,coins:100,label:"Timekeeper"}},
  },
  pufflimbo: {
    name: "Limbo Legends", emoji: "🎪",
    format: "Survival (7 Rounds)", formatShort: "Survival",
    duration: "~15 min", rounds: ["3.0s","3.5s","4.0s","4.2s","4.5s","4.7s","5.0s BLINKER!"],
    rules: "Target puff gets longer each round. Fall short = eliminated. Survive the 5.0s blinker round to win!",
    teamType: "crew",
    prizes: {gold:{pts:30000,coins:800,label:"Limbo Champion 🎪"},silver:{pts:15000,coins:400,label:"Endurance Medal 💪"},bronze:{pts:7500,coins:200,label:"Survivor Badge 🏅"},fourth:{pts:3000,coins:100,label:"Participant"}},
  },
  puffderby: {
    name: "Grand Derby", emoji: "🏇",
    format: "Race Series (3 Races)", formatShort: "Racing",
    duration: "~10 min", rounds: ["Heat 1","Heat 2","CHAMPIONSHIP RACE"],
    rules: "3 races. Pick a horse, spam puff to run. Watch stamina! Total finishing positions = final ranking.",
    teamType: "stable",
    prizes: {gold:{pts:30000,coins:800,label:"Derby Champion 🏇"},silver:{pts:15000,coins:400,label:"Silver Saddle 🥈"},bronze:{pts:7500,coins:200,label:"Bronze Horseshoe 🐴"},fourth:{pts:3000,coins:100,label:"Stable Hand"}},
  },
};

// ═══════════════════════════════════════════════════════════════
// GAME CONFIG — Drives the unified Start Screen for all 37 games
// ═══════════════════════════════════════════════════════════════
const GAME_CONFIG = {
  // ── Tournament + Multi-Mode ──
  tankwar:    { modes:[{id:"1v1",emoji:"\u{1F3AF}",name:"1v1 Duel",sub:"Classic"},{id:"2v2",emoji:"\u{1F465}",name:"2v2 Teams",sub:"You + ally"},{id:"ffa",emoji:"\u{1F480}",name:"Free-for-All",sub:"4 tanks"},{id:"boss",emoji:"\u{1F409}",name:"Boss Battle",sub:"Co-op"}], puffGame:false,
    stats:[{v:"680",l:"online"},{v:"58%",l:"win rate"},{v:"312",l:"max dmg"}], hotStats:["A blinker shot destroyed 3 tanks at once \u{1F480}","Someone won 1v4 FFA with 1 HP \u{1F92F}"],
    htp:[{e:"\u{1F3AF}",t:"Aim cannon",d:"Pointer sweeps left-right. Tap to lock."},{e:"\u{1F4AA}",t:"Set power",d:"Bar fills 0-100%. 50-80% = best zone."},{e:"\u{1F4A8}",t:"Puff for bonus",d:"+15% damage. Blinker = +20% LEGENDARY!"},{e:"\u{1F3C6}",t:"Destroy enemies",d:"Wind affects shots. Terrain destructible."}],
    reward:60 },
  fishwar:    { modes:[{id:"solo",emoji:"\u{1F41F}",name:"Solo",sub:"500pts target"},{id:"1v1",emoji:"\u{1F3AF}",name:"1v1",sub:"Eliminate bot"},{id:"pvp",emoji:"\u{1F480}",name:"PvP",sub:"Last standing"},{id:"boss",emoji:"\u{1F409}",name:"Boss",sub:"Defeat boss"}], puffGame:false,
    stats:[{v:"520",l:"swimming"},{v:"8",l:"forms"},{v:"45",l:"max pts"}], hotStats:["Someone evolved to Dragon in 90 seconds \u{1F409}","A fish ate 47 others in one game \u{1F92F}"],
    htp:[{e:"\u{1F3CA}",t:"Auto-swim",d:"Fish moves forward automatically."},{e:"\u{1F446}",t:"Tap to turn",d:"Tap anywhere to change direction."},{e:"\u{1F4A8}",t:"Puff = boost",d:"Hold puff for x2.2 speed. Fuel limited."},{e:"\u{1F37D}\uFE0F",t:"Eat & evolve",d:"Eat smaller fish. Every 5 = level up!"}],
    reward:60 },
  rooftoppuff: { modes:[{id:"solo",emoji:"\u{1F3C3}",name:"Solo Run",sub:"Run forever"},{id:"1v1",emoji:"\u{1F3AF}",name:"1v1 Race",sub:"Beat the bot"},{id:"race",emoji:"\u{1F3C1}",name:"Race 4",sub:"4 runners"}], puffGame:false,
    stats:[{v:"430",l:"running"},{v:"342m",l:"record"},{v:"4",l:"runners"}], hotStats:["Someone ran 500m without double jump \u{1F480}","Blinker boost across a 60px gap \u{1F525}\u{1F3C3}"],
    htp:[{e:"\u{1F446}",t:"Tap to jump",d:"Tap screen to jump. Tap again mid-air for double jump."},{e:"\u{1F4A8}",t:"Hold = boost",d:"Hold puff bar for speed x1.5 + jump x1.2."},{e:"\u{1FA99}",t:"Collect coins",d:"Grab coins on rooftops for bonus score."},{e:"\u{1F3C6}",t:"Survive longest",d:"Gaps widen, platforms shrink. Don't fall!"}],
    reward:60 },
  finalkick:  { modes:null, puffGame:false,
    stats:[{v:"2.1K",l:"playing"},{v:"62%",l:"win rate"},{v:"15",l:"top goals"}], hotStats:["NeonQueen scored from the moon \u{1F319}","A blinker kick bent like Beckham \u{1F525}"],
    htp:[{e:"\u{1F446}",t:"Pick zone",d:"Choose where to aim your shot."},{e:"\u{1F4A8}",t:"Kick power",d:"Hold to charge. Release in sweet spot."},{e:"\u{1F9E4}",t:"Save phase",d:"Dive to block the AI's shot."},{e:"\u{1F3C6}",t:"Win 5 rounds",d:"First to 3 goals wins the match!"}],
    reward:80 },
  finalkick2: { modes:null, puffGame:false,
    stats:[{v:"356",l:"playing"},{v:"54%",l:"win rate"},{v:"0.02s",l:"precision"}], hotStats:["Someone hit perfect X AND Y on a blinker \u{1F480}"],
    htp:[{e:"\u2194\uFE0F",t:"Puff 1: X-aim",d:"First puff controls horizontal aim."},{e:"\u2195\uFE0F",t:"Puff 2: Y-aim",d:"Second puff controls vertical aim."},{e:"\u{1F4A8}",t:"Double precision",d:"Two puffs, one shot. Maximum skill."},{e:"\u{1F3C6}",t:"Outscore AI",d:"5 rounds of precision penalties."}],
    reward:80 },
  // finalkick3 config removed
  wildwest:   { modes:null, puffGame:false,
    stats:[{v:"720",l:"dueling"},{v:"0.18s",l:"fastest"},{v:"5",l:"rounds"}], hotStats:["Someone drew in 0.18s... is that legal? \u{1F920}","Blinker draw \u2014 who blinkers in a DUEL?! \u{1F480}"],
    htp:[{e:"\u{1F440}",t:"Staredown",d:"Wait for the DRAW signal..."},{e:"\u{1F4A8}",t:"DRAW!",d:"Puff fastest when you see DRAW!"},{e:"\u23F1\uFE0F",t:"Reaction time",d:"Measured in milliseconds."},{e:"\u{1F3C6}",t:"Best of 5",d:"Win 3 rounds to claim victory."}],
    reward:60 },
  hotpotato:  { modes:null, puffGame:false,
    stats:[{v:"890",l:"playing"},{v:"16",l:"players"},{v:"3s",l:"avg hold"}], hotStats:["Someone held the bomb for 8 seconds on PURPOSE \u{1F480}","YEET pass across 5 players in 0.2s"],
    htp:[{e:"\u{1F4A3}",t:"Bomb incoming!",d:"The bomb jumps to you randomly."},{e:"\u{1F4A8}",t:"Puff to pass",d:"Puff fast to pass it along!"},{e:"\u{1F4A5}",t:"Don't get caught",d:"Holding when timer hits = eliminated."},{e:"\u{1F3C6}",t:"Last alive",d:"Survive to win!"}],
    reward:50 },
  russian:    { modes:[{id:"quick",emoji:"\u{1F3B2}",name:"Quick (6)",sub:"6 players"},{id:"gauntlet",emoji:"\u{1F480}",name:"Gauntlet",sub:"1,000\u21921"}], puffGame:false,
    stats:[{v:"167",l:"surviving"},{v:"17%",l:"survival"},{v:"12",l:"longest"}], hotStats:["Someone dodged 8 chambers in a row \u{1F92F}","The chamber was angry today \u{1F624}"],
    htp:[{e:"\u{1F52B}",t:"Spin chamber",d:"The revolver spins..."},{e:"\u{1F4A8}",t:"Pull trigger",d:"Puff to pull. Pray it clicks."},{e:"\u{1FAC1}",t:"Blinker dodge",d:"5s blinker = 80% dodge chance!"},{e:"\u{1F3C6}",t:"Survive",d:"Last one standing wins."}],
    reward:50 },
  balloon:    { modes:null, puffGame:true,
    stats:[{v:"145",l:"inflating"},{v:"73%",l:"pop rate"},{v:"8",l:"players"}], hotStats:["Someone popped on their FIRST puff \u{1F602}","Balloon survived 47 puffs \u2014 record!"],
    htp:[{e:"\u{1F388}",t:"Inflate balloon",d:"Each puff inflates it more."},{e:"\u{1F630}",t:"Don't pop it!",d:"Pop it = you're eliminated."},{e:"\u{1F4A8}",t:"Real puff = real fear",d:"Feel it inflate with your lungs!"},{e:"\u{1F3C6}",t:"Last alive",d:"Be the last one NOT popping."}],
    reward:50 },
  puffpong:   { modes:null, puffGame:false,
    stats:[{v:"289",l:"rallying"},{v:"5",l:"to win"},{v:"23",l:"longest rally"}], hotStats:["23-hit rally \u2014 both players forgot to breathe \u{1F3D3}","NUCLEAR PUFF smash \u2014 ball broke the sound barrier \u{1F4A5}"],
    htp:[{e:"\u{1F3D3}",t:"Hit the ball",d:"Puff or tap to return the ball."},{e:"\u2195\uFE0F",t:"Move paddle",d:"Tap up/down to position."},{e:"\u{1F4A8}",t:"Power shot",d:"Puff for stronger returns."},{e:"\u{1F3C6}",t:"First to 5",d:"Score 5 points to win."}],
    reward:60 },
  rhythm:     { modes:null, puffGame:false,
    stats:[{v:"134",l:"jamming"},{v:"50",l:"max combo"},{v:"15",l:"max miss"}], hotStats:["x50 combo \u2014 inhuman rhythm! \u{1F3B5}\u{1F4A8}","Someone missed every note. Every. Single. One. \u{1F602}"],
    htp:[{e:"\u{1F3B5}",t:"Notes fall down",d:"Tap the matching lane on beat."},{e:"\u{1F525}",t:"Build combos",d:"Hit consecutive notes for multiplier."},{e:"\u{1F4A8}",t:"Puff for power",d:"Puff on beat for bonus points!"},{e:"\u{1F3C6}",t:"Survive 15 misses",d:"Miss 15 notes = game over."}],
    reward:60 },
  tugofwar:   { modes:null, puffGame:true,
    stats:[{v:"312",l:"pulling"},{v:"50v50",l:"war size"},{v:"47",l:"avg puffs"}], hotStats:["Team fell into mud in 4 seconds flat \u{1F602}\u{1F480}","Someone did 89 puffs in one game \u2014 LUNGS \u{1FAC1}"],
    htp:[{e:"\u{1F4AA}",t:"PULL!",d:"Puff continuously to pull the rope."},{e:"\u{1FAC1}",t:"Puff = power",d:"Harder puff = stronger pull."},{e:"\u{1F91D}",t:"Team effort",d:"Your whole team pulls together."},{e:"\u{1F3C6}",t:"Pull them in!",d:"Drag the other team into the mud!"}],
    reward:60 },
  hooked:     { modes:null, puffGame:false,
    stats:[{v:"410",l:"fishing"},{v:"\u{1F41F}",l:"rare catch"},{v:"8",l:"max stack"}], hotStats:["Caught Sir Gill-a-lot on a blinker reel \u{1F3A3}\u{1F451}","Line snapped at 98% tension \u2014 heartbreaking \u{1F494}"],
    htp:[{e:"\u{1F3A3}",t:"Cast line",d:"Puff to cast into the water."},{e:"\u{1F41F}",t:"Fish bites!",d:"A fish appears on your hook."},{e:"\u{1F4A8}",t:"Reel in",d:"Hold puff to control suction."},{e:"\u26A0\uFE0F",t:"Watch tension",d:"Too much = line snaps!"}],
    reward:60 },
  rps:        { modes:null, puffGame:false,
    stats:[{v:"540",l:"throwing"},{v:"43%",l:"pick rock"},{v:"5",l:"best of"}], hotStats:["Everyone picks rock first. Be different. \u{1FAA8}","Blinker power throw \u2014 the ground SHOOK \u{1F480}"],
    htp:[{e:"\u270A",t:"Pick your throw",d:"Rock, Paper, or Scissors."},{e:"\u{1F4A8}",t:"Charge power",d:"Hold puff for power multiplier."},{e:"\u2694\uFE0F",t:"Clash!",d:"See who wins the round."},{e:"\u{1F3C6}",t:"Best of 5",d:"Win 3 rounds to claim victory."}],
    reward:60 },
  beatdrop:   { modes:null, puffGame:false,
    stats:[{v:"245",l:"dropping"},{v:"12ms",l:"best timing"},{v:"4",l:"DJs compete"}], hotStats:["BLINKER PERFECT -- 8ms off the beat \u{1F3A7}\u{1F480}","DJ Haze released 3ms early... LEGENDARY timing \u2728"],
    htp:[{e:"\u{1F3A7}",t:"Beat builds up",d:"Music tension rises for 3-8 seconds."},{e:"\u{1F4A8}",t:"Hold your puff",d:"Tap, dry puff, real puff, or blinker hold."},{e:"\u{1F3B5}",t:"RELEASE on DROP!",d:"Release at the EXACT moment the beat drops."},{e:"\u{1F3C6}",t:"4 rounds, best avg",d:"4 players compete. Closest timing wins!"}],
    reward:80 },
  puffclock:  { modes:null, puffGame:true,
    stats:[{v:"310",l:"timing"},{v:"\u00B10.02s",l:"record"},{v:"6s",l:"max target"}], hotStats:["Someone puffed for 3.470s on a 3.47 target \u2014 INHUMAN \u23F1\uFE0F\u{1F480}"],
    htp:[{e:"\u23F1\uFE0F",t:"See the target",d:"Target time shown (e.g., 3.47s)."},{e:"\u{1F4A8}",t:"Puff that long",d:"Hold your puff for EXACTLY that time."},{e:"\u{1F3AF}",t:"Precision counts",d:"Closest to target wins."},{e:"\u{1F3C6}",t:"Body control",d:"Your lungs ARE the clock."}],
    reward:50 },
  pufflimbo:  { modes:null, puffGame:true,
    stats:[{v:"178",l:"surviving"},{v:"5.0s",l:"blinker round"},{v:"50",l:"enter"}], hotStats:["Someone survived the 5.0s blinker round \u2014 LEGEND \u{1F480}\u{1F451}"],
    htp:[{e:"\u{1F3AA}",t:"Target puff",d:"Each round has a longer target."},{e:"\u{1F4A8}",t:"Hold to survive",d:"Puff for the EXACT duration."},{e:"\u{1F480}",t:"Fall short = out",d:"Stop too early = eliminated."},{e:"\u{1F3C6}",t:"Survive the blinker",d:"Final round: 5.0s BLINKER!"}],
    reward:50 },
  puffderby:  { modes:null, puffGame:true,
    stats:[{v:"420",l:"racing"},{v:"6",l:"horses"},{v:"30s",l:"race time"}], hotStats:["Sir Puffs-a-Lot won by a NOSE \u{1F3C7}","Someone ran out of stamina at 95% \u2014 tragic \u{1F62D}"],
    htp:[{e:"\u{1F3C7}",t:"Pick your horse",d:"6 horses with different stats."},{e:"\u{1F4A8}",t:"PUFF = SPEED",d:"Spam puff to make it run!"},{e:"\u26A1",t:"Manage stamina",d:"Puffs drain stamina. Rest to recover."},{e:"\u{1F3C6}",t:"Cross finish line",d:"First horse to 100% wins!"}],
    reward:50 },
  // ── Stage games ──
  vibecheck:      { roles:[{id:"contestant",emoji:"\u{1F3AF}",name:"Contestant",sub:"Answer trivia"},{id:"audience",emoji:"\u{1F465}",name:"Audience",sub:"Watch & react"}], puffGame:false,
    stats:[{v:"1.2K",l:"watching"},{v:"100",l:"enter"},{v:"1",l:"survives"}], hotStats:["100 entered, 1 survived \u2014 BRUTAL \u{1F9E0}\u{1F480}"],
    htp:[{e:"\u{1F9E0}",t:"Trivia question",d:"Host asks, you answer."},{e:"\u{1F4A8}",t:"Puff your answer",d:"TAP=A, SHORT=B, MED=C, LONG=D."},{e:"\u274C",t:"Wrong = eliminated",d:"One wrong answer and you're OUT."},{e:"\u{1F3C6}",t:"Last standing",d:"Survive all rounds to win!"}],
    reward:80 },
  higherlower:    { roles:[{id:"contestant",emoji:"\u{1F3AF}",name:"Contestant",sub:"Guess stats"},{id:"audience",emoji:"\u{1F465}",name:"Audience",sub:"Watch & react"}], puffGame:false,
    stats:[{v:"450",l:"guessing"},{v:"10",l:"rounds"},{v:"7",l:"best streak"}], hotStats:["7-round streak \u2014 galaxy brain \u{1F9E0}\u2728"],
    htp:[{e:"\u{1F4CA}",t:"See a stat",d:"A number is shown (e.g., '4.5M Google searches')."},{e:"\u{1F53C}",t:"Higher or Lower?",d:"Is the NEXT stat higher or lower?"},{e:"\u{1F4A8}",t:"Puff to guess",d:"Short=Lower, Long=Higher."},{e:"\u{1F525}",t:"Build streaks",d:"Consecutive correct = multiplier!"}],
    reward:60 },
  pricepuff:      { roles:[{id:"contestant",emoji:"\u{1F3AF}",name:"Contestant",sub:"Guess prices"},{id:"audience",emoji:"\u{1F465}",name:"Audience",sub:"Watch & react"}], puffGame:false,
    stats:[{v:"200",l:"guessing"},{v:"$5\u2192$50K",l:"range"},{v:"6",l:"rounds"}], hotStats:["Someone guessed $5 for a $50K car \u{1F602}\u{1F480}"],
    htp:[{e:"\u{1F3F7}\uFE0F",t:"See product",d:"A product is shown to you."},{e:"\u{1F4A8}",t:"Puff = price",d:"Puff duration maps to your price guess."},{e:"\u{1F3AF}",t:"Closest wins",d:"Without going OVER the real price!"},{e:"\u{1F3C6}",t:"6 rounds",d:"Best total accuracy wins."}],
    reward:60 },
  survivaltrivia: { roles:[{id:"contestant",emoji:"\u{1F3AF}",name:"Contestant",sub:"Answer or die"},{id:"audience",emoji:"\u{1F465}",name:"Audience",sub:"Watch & react"}], puffGame:false,
    stats:[{v:"800",l:"entering"},{v:"100",l:"start"},{v:"12s",l:"per question"}], hotStats:["40 eliminated on ONE question \u{1F480}","Phone-a-friend gave the WRONG answer \u{1F602}"],
    htp:[{e:"\u{1F9E0}",t:"Answer fast",d:"12 seconds per question."},{e:"\u274C",t:"Wrong = DEAD",d:"One mistake = instant elimination."},{e:"\u{1F4A8}",t:"Puff answer",d:"TAP=A, SHORT=B, MED=C, LONG=D."},{e:"\u{1F3C6}",t:"100 enter, 1 wins",d:"Last brain standing!"}],
    reward:80 },
  simonpuffs:     { roles:[{id:"contestant",emoji:"\u{1F3AF}",name:"Contestant",sub:"Remember patterns"},{id:"audience",emoji:"\u{1F465}",name:"Audience",sub:"Watch & react"}], puffGame:false,
    stats:[{v:"150",l:"memorizing"},{v:"8",l:"max rounds"},{v:"4",l:"colors"}], hotStats:["Someone remembered a 12-step pattern \u2014 MEMORY GOD \u{1F9E0}"],
    htp:[{e:"\u{1F534}",t:"Watch the pattern",d:"Colors flash in sequence."},{e:"\u{1F4A8}",t:"Repeat with puffs",d:"SHORT/MED/LONG/BLINKER = different colors."},{e:"\u274C",t:"Wrong = out",d:"Miss one step = eliminated."},{e:"\u{1F3C6}",t:"Longest memory",d:"Survive the most rounds!"}],
    reward:60 },
  puffauction:    { roles:null, puffGame:true,
    stats:[{v:"180",l:"bidding"},{v:"16",l:"bidders"},{v:"8.2s",l:"longest bid"}], hotStats:["World's Largest Joint sold for a 8.2s puff \u{1F480}\u{1FAC1}"],
    htp:[{e:"\u{1F528}",t:"Item for auction",d:"Absurd items up for grabs!"},{e:"\u{1F4A8}",t:"PUFF = BID",d:"Hold puff to bid. Longest wins!"},{e:"\u{1FAC1}",t:"Lung management",d:"Your lung meter depletes each round."},{e:"\u{1F3C6}",t:"Win the item",d:"Highest bidder takes the prize!"}],
    reward:60 },
  // ── Fortune games ──
  // fortunePlay: solo=always, table=casino vibe, group=compare results, stream=watch live
  // playWith per fortunePlay: solo→none, table→[ai,friends,random], group→[friends,random], stream→none
  crystalball:    { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"450",l:"predicting"},{v:"54%",l:"accuracy"},{v:"11",l:"best streak"}], hotStats:["The oracle was wrong 7 times today. Fire the oracle. \u{1F52E}\u{1F602}"],
    htp:[{e:"\u{1F52E}",t:"See prediction",d:"A yes/no question appears."},{e:"\u{1F4A8}",t:"Puff your answer",d:"Short=NO, Long=YES, Blinker=CERTAIN."},{e:"\u26A1",t:"Blinker risk",d:"CERTAIN: 3x if right, -2x if wrong!"},{e:"\u{1F3C6}",t:"5 rounds",d:"Build accuracy streak!"}],
    reward:50 },
  strainbattle:   { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"380",l:"voting"},{v:"64",l:"strains"},{v:"50+",l:"voters"}], hotStats:["OG Kush beat Gorilla Glue \u2014 the chat RIOTED \u{1F33F}\u{1F602}"],
    htp:[{e:"\u{1F33F}",t:"Two strains",d:"Two strains face off."},{e:"\u{1F4A8}",t:"Puff to vote",d:"Short=Left, Long=Right."},{e:"\u{1F4CA}",t:"Results shown",d:"See how the community voted."},{e:"\u{1F3C6}",t:"5 matchups",d:"Vote with the majority for bonus!"}],
    reward:50 },
  matchpredictor: { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"290",l:"predicting"},{v:"\u26BD",l:"WC matches"},{v:"6",l:"pundits"}], hotStats:["Someone predicted 5/5 correct \u2014 are they from the future? \u{1F52E}"],
    htp:[{e:"\u26BD",t:"See the match",d:"Two teams shown with stats."},{e:"\u{1F4A8}",t:"Predict result",d:"Short=Home, Med=Draw, Long=Away."},{e:"\u{1F4CA}",t:"Watch it unfold",d:"See if your prediction was right!"},{e:"\u{1F3C6}",t:"5 matches",d:"Most accurate pundit wins."}],
    reward:50 },
  dailypicks:     { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"group",emoji:"\u{1F4CA}",name:"Daily Board"}],
    stats:[{v:"1.2K",l:"picked today"},{v:"54%",l:"avg right"},{v:"30",l:"max streak"}], hotStats:["Someone hit 30-day streak \u2014 LEGENDARY \u{1F525}\u{1F451}"],
    htp:[{e:"\u{1F4C5}",t:"3 daily picks",d:"Morning, afternoon, night predictions."},{e:"\u{1F4A8}",t:"Puff your pick",d:"Short or Long = different answers."},{e:"\u{1F525}",t:"Build streak",d:"Consecutive correct = multiplier!"},{e:"\u{1F3C6}",t:"30-day = legend",d:"Daily ritual \u2014 come back tomorrow!"}],
    reward:50 },
  puffslots:      { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"380",l:"spinning"},{v:"3",l:"jackpots today"},{v:"1K",l:"biggest win"}], hotStats:["\u{1F33F}\u{1F33F}\u{1F33F} Someone hit the WEED JACKPOT \u{1F3B0}\u{1F480}"],
    htp:[{e:"\u{1F3B0}",t:"3 reels",d:"Match symbols to win!"},{e:"\u{1F4A8}",t:"Puff to spin",d:"Hold and release to stop reels."},{e:"\u26A1",t:"Blinker bonus",d:"4.5s+ = guaranteed 2 match!"},{e:"\u{1F48E}",t:"Jackpot",d:"\u{1F33F}=1000 \u00B7 7\uFE0F\u20E3=500 \u00B7 \u{1F48E}=200"}],
    reward:50 },
  coinflip:       { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"group",emoji:"\u{1F4CA}",name:"Group"}],
    stats:[{v:"600",l:"flipping"},{v:"50%",l:"it's fair!"},{v:"8",l:"flips/game"}], hotStats:["Heads came up 7 times in a row \u2014 rigged? \u{1FA99}\u{1F602}"],
    htp:[{e:"\u{1FA99}",t:"Pick a side",d:"Heads or Tails \u2014 50/50 chance."},{e:"\u{1F4A8}",t:"Puff confidence",d:"Longer puff = higher multiplier."},{e:"\u26A1",t:"Blinker = 5x",d:"Win 5x or lose 2x \u2014 BOLD!"},{e:"\u{1F3C6}",t:"8 flips",d:"Build your streak!"}],
    reward:50 },
  puffblackjack:  { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"290",l:"at table"},{v:"48%",l:"house edge"},{v:"21",l:"blackjack!"}], hotStats:["Someone hit on 20. We don't talk about it. \u{1F0CF}\u{1F480}"],
    htp:[{e:"\u{1F0CF}",t:"Get dealt cards",d:"Try to reach 21 without going over."},{e:"\u{1F4A8}",t:"Puff: Hit/Stand",d:"Short=HIT, Long=STAND."},{e:"\u26A1",t:"Blinker double",d:"4.5s+ = DOUBLE DOWN!"},{e:"\u{1F3C6}",t:"7 hands",d:"Beat the dealer for coins."}],
    reward:60 },
  crapsnclouds:   { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"200",l:"rolling"},{v:"7",l:"lucky number"},{v:"8",l:"at table"}], hotStats:["Natural 7 on the come-out \u2014 TABLE ERUPTS \u{1F3B2}\u{1F525}"],
    htp:[{e:"\u{1F3B2}",t:"Roll dice",d:"Puff duration influences the roll."},{e:"\u{1F3AF}",t:"7 or 11",d:"Come-out roll: 7/11 = instant win!"},{e:"\u{1F4A8}",t:"Hot dice",d:"Blinker = +50% payout!"},{e:"\u{1F3C6}",t:"Hit your point",d:"Set a point, then hit it again."}],
    reward:50 },
  mysterybox:     { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"350",l:"opening"},{v:"\u{1F381}",l:"3 boxes"},{v:"\u{1F48E}",l:"legendary!"}], hotStats:["Someone found a legendary on their FIRST pick \u{1F381}\u2728"],
    htp:[{e:"\u{1F381}",t:"3 mystery boxes",d:"Pick one to open."},{e:"\u{1F4A8}",t:"Puff to reveal",d:"Hold to open your box."},{e:"\u26A1",t:"Blinker upgrade",d:"Common \u2192 Rare guaranteed!"},{e:"\u{1F48E}",t:"Find legendary",d:"5 rounds of mystery!"}],
    reward:50 },
  scratchpuff:    { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"280",l:"scratching"},{v:"6",l:"zones"},{v:"3",l:"match to win"}], hotStats:["Matched 3 diamonds on a blinker scratch \u{1F48E}\u{1F48E}\u{1F48E}"],
    htp:[{e:"\u{1F3AB}",t:"6 scratch zones",d:"Tap a zone to select it."},{e:"\u{1F4A8}",t:"Puff to scratch",d:"Hold to reveal what's underneath."},{e:"\u{1F3AF}",t:"Match 3",d:"Find 3 matching symbols to win!"},{e:"\u26A1",t:"Blinker scratch",d:"Double prize on matches!"}],
    reward:50 },
  fortunecookie:  { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"320",l:"cracking"},{v:"\u{1F960}",l:"wisdom"},{v:"8",l:"traders"}], hotStats:["The golden fortune was traded 3 times before reveal \u{1F602}"],
    htp:[{e:"\u{1F960}",t:"Cookie appears",d:"What fortune awaits?"},{e:"\u{1F4A8}",t:"Puff to crack",d:"Hold to build suspense!"},{e:"\u{1F4DC}",t:"Read fortune",d:"Wisdom + coins inside."},{e:"\u26A1",t:"Blinker = golden",d:"Premium fortune + bonus coins!"}],
    reward:50 },
  treasuremap:    { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"250",l:"exploring"},{v:"16",l:"tiles"},{v:"3",l:"treasures"}], hotStats:["Hit a bomb RIGHT next to treasure \u2014 tragic \u{1F4A3}\u{1F62D}"],
    htp:[{e:"\u{1F5FA}\uFE0F",t:"16 tiles",d:"3 treasures hidden, 3 bombs!"},{e:"\u{1F446}",t:"Tap to select",d:"Choose which tile to dig."},{e:"\u{1F4A8}",t:"Puff to dig",d:"Reveal what's underneath."},{e:"\u{1F48E}",t:"Find 3 treasures",d:"Avoid bombs \u2014 game over!"}],
    reward:50 },
  spinwin:        { modes:null, puffGame:false, fortunePlay:[{id:"solo",emoji:"\u{1F3B2}",name:"Solo"},{id:"table",emoji:"\u{1FA91}",name:"Table"},{id:"group",emoji:"\u{1F4CA}",name:"Group"},{id:"stream",emoji:"\u{1F440}",name:"Stream It"}],
    stats:[{v:"400",l:"spinning"},{v:"12",l:"segments"},{v:"500",l:"gold wedge"}], hotStats:["GOLD WEDGE! 500 coins in one spin \u{1F3A1}\u2728"],
    htp:[{e:"\u{1F3A1}",t:"Big wheel",d:"12 prize segments."},{e:"\u{1F4A8}",t:"Puff to spin",d:"Puff force = spin power."},{e:"\u{1F3AF}",t:"Land on prize",d:"Each segment has different coins."},{e:"\u26A1",t:"Gold wedge",d:"Land on gold = 500+ coins!"}],
    reward:50 },
};

const WC_GROUPS = {
  A:["usa","mex","can","civ"], B:["eng","ita","aus","nzl"], C:["arg","fra","irn","sen"],
  D:["ned","bel","jpn","nga"], E:["esp","por","idn","rsa"], F:["bra","ger","ksa","mar"],
  G:["cro","kor","ecu","egy"], H:["col","uru","uzb","cmr"], I:["pol","ukr","per","mli"],
  J:["den","sui","qat","irq"], K:["aut","srb","tur","cod"], L:["par","sco","wal","bhr"],
};

const WC_PRIZES = {
  gold:   {label:"🥇 Champion",  pts:50000, coins:500, title:"World Champion"},
  silver: {label:"🥈 Runner-Up", pts:25000, coins:250, title:"Runner-Up"},
  bronze: {label:"🥉 Third",     pts:10000, coins:100, title:"Third Place"},
  fourth: {label:"4th Place",           pts:5000,  coins:50,  title:"Semifinalist"},
  group:  {label:"Group Exit",          pts:1000,  coins:10,  title:"Group Stage"},
};

const WC_CONFEDERATIONS = [
  {id:"CONCACAF",label:"CONCACAF",color:"#00E5FF"},
  {id:"CONMEBOL",label:"CONMEBOL",color:"#FFD93D"},
  {id:"UEFA",label:"UEFA",color:"#C084FC"},
  {id:"AFC",label:"AFC",color:"#FB923C"},
  {id:"CAF",label:"CAF",color:"#34D399"},
  {id:"OFC",label:"OFC",color:"#60A5FA"},
];

const WC_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

// ── LIVE MATCH DATA (simulated real-time WC matches) ──
const WC_LIVE_MATCHES = [
  {
    id: "live1",
    home: {name:"USA", flag:"🇺🇸", score:1},
    away: {name:"Mexico", flag:"🇲🇽", score:0},
    minute: 67,
    status: "LIVE",
    events: [
      {min:23, type:"goal", team:"home", player:"Pulisic", emoji:"⚽"},
      {min:45, type:"halftime", emoji:"⏱️"},
      {min:55, type:"yellow", team:"away", player:"Lozano", emoji:"🟡"},
    ],
    nextEvent: "Corner kick for Mexico",
    viewers: 4247,
  },
  {
    id: "live2",
    home: {name:"Brazil", flag:"🇧🇷", score:2},
    away: {name:"Germany", flag:"🇩🇪", score:2},
    minute: 82,
    status: "LIVE",
    events: [
      {min:12, type:"goal", team:"home", player:"Vinicius Jr", emoji:"⚽"},
      {min:34, type:"goal", team:"away", player:"Musiala", emoji:"⚽"},
      {min:45, type:"halftime", emoji:"⏱️"},
      {min:56, type:"goal", team:"home", player:"Rodrygo", emoji:"⚽"},
      {min:71, type:"goal", team:"away", player:"Wirtz", emoji:"⚽"},
    ],
    nextEvent: "Free kick for Brazil",
    viewers: 8934,
  },
];

// ── WC 2026 GROUP STANDINGS ──
const WC_2026_GROUPS = {
  A: [{team:"USA",flag:"🇺🇸",pts:6,gd:3},{team:"Mexico",flag:"🇲🇽",pts:4,gd:1},{team:"Canada",flag:"🇨🇦",pts:3,gd:0},{team:"Morocco",flag:"🇲🇦",pts:0,gd:-4}],
  B: [{team:"Brazil",flag:"🇧🇷",pts:7,gd:5},{team:"Germany",flag:"🇩🇪",pts:5,gd:2},{team:"Japan",flag:"🇯🇵",pts:4,gd:1},{team:"Nigeria",flag:"🇳🇬",pts:0,gd:-8}],
  C: [{team:"France",flag:"🇫🇷",pts:9,gd:7},{team:"Argentina",flag:"🇦🇷",pts:6,gd:4},{team:"Australia",flag:"🇦🇺",pts:3,gd:-2},{team:"Saudi Arabia",flag:"🇸🇦",pts:0,gd:-9}],
  D: [{team:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",pts:7,gd:4},{team:"Spain",flag:"🇪🇸",pts:6,gd:3},{team:"South Korea",flag:"🇰🇷",pts:3,gd:-1},{team:"Colombia",flag:"🇨🇴",pts:1,gd:-6}],
};

const VC_QUESTIONS = [
  { q:"How many host cities does World Cup 2026 have?", opts:["12","14","16","20"], correct:2 },
  { q:"Which team has won the most World Cups?", opts:["Germany","Argentina","Italy","Brazil"], correct:3 },
  { q:"How many teams compete in World Cup 2026?", opts:["32","40","48","64"], correct:2 },
  { q:"Where is the WC 2026 final?", opts:["Dallas","Miami","LA","New Jersey"], correct:3 },
  { q:"Total matches in WC 2026?", opts:["64","80","96","104"], correct:3 },
];

// ── UNIVERSAL PUFF ACTION BAR CONFIG ──
const UNIVERSAL_PUFF_CONFIG = {
  // Sweet spot shifts randomly each round
  randomizeSweetSpot: () => {
    const min = 30 + Math.random() * 20; // 30-50%
    const max = min + 20 + Math.random() * 20; // +20-40% window
    return { min: Math.round(min), max: Math.min(95, Math.round(max)) };
  },
  // Blinker threshold
  blinkerThreshold: 95, // 95%+ = blinker territory
  // Power zones
  zones: [
    { name: "TAP", max: 15, color: "#555F85" },
    { name: "SHORT", max: 40, color: "#8892B8" },
    { name: "GOOD", max: 65, color: "#00E5FF" },
    { name: "PERFECT", max: 90, color: "#7FFF00" }, // sweet spot (randomized)
    { name: "BLINKER", max: 100, color: "#FF4444" },
  ],
};
const getTriviaPuffAnswer = (ms) => ms < 800 ? 0 : ms < 2000 ? 1 : ms < 3500 ? 2 : 3;

const HOOK_FISH = [
  {name:"Blue Snap",emoji:"🐟",rarity:"common",pts:10,zoneWidth:35,resistance:0.8,instability:0.3,tensionRate:1.0,escapeRate:0.8,color:C.cyan},
  {name:"Lunar Carp",emoji:"🐠",rarity:"common",pts:10,zoneWidth:33,resistance:0.9,instability:0.35,tensionRate:1.0,escapeRate:0.9,color:C.cyan},
  {name:"Pond Darter",emoji:"🐡",rarity:"common",pts:10,zoneWidth:38,resistance:0.7,instability:0.25,tensionRate:0.9,escapeRate:0.7,color:C.cyan},
  {name:"Neon Koi",emoji:"🎏",rarity:"rare",pts:25,zoneWidth:30,resistance:1.2,instability:0.5,tensionRate:1.3,escapeRate:1.1,color:C.purple},
  {name:"Glitch Fin",emoji:"🦈",rarity:"rare",pts:25,zoneWidth:28,resistance:1.4,instability:0.55,tensionRate:1.4,escapeRate:1.2,color:C.purple},
  {name:"Gold Pike",emoji:"🐊",rarity:"rare",pts:25,zoneWidth:32,resistance:1.1,instability:0.45,tensionRate:1.2,escapeRate:1.0,color:C.purple},
  {name:"Void Eel",emoji:"🐉",rarity:"legendary",pts:60,zoneWidth:22,resistance:1.8,instability:0.50,tensionRate:1.8,escapeRate:1.5,color:C.gold},
  {name:"Abyssal Ray",emoji:"🦑",rarity:"legendary",pts:60,zoneWidth:20,resistance:2.0,instability:0.55,tensionRate:2.0,escapeRate:1.6,color:C.gold},
];


// ── Simon Puffs Constants ──
const SP_PUFF_TYPES = [{name:"Short",maxDur:1.2,color:"#00E5FF"},{name:"Medium",maxDur:3.0,color:"#FFD93D"},{name:"Long",maxDur:99,color:"#FF4D8D"}];
const SP_COMEDY = [
  "Round 1! Easy peasy!","Getting warmer! Can you remember?","3 puffs! Your short-term memory is being tested!",
  "4 in a row! Not bad for someone who's probably baked!","5 puffs! Simon is impressed!","6?! Your brain is on FIRE!",
  "7 puffs! Are you even human?!","8! This is INSANE! The crowd can't believe it!",
  "9 PUFFS! You're a LEGEND!","10! SIMON MASTER! You've beaten the game!",
];

// ── Puff Auction Constants ──
const PA_PRIZES = [
  {name:"100 Coins",value:100,emoji:"🪙",rarity:"common"},
  {name:"200 Coins",value:200,emoji:"💰",rarity:"common"},
  {name:"Rare Badge",value:300,emoji:"🏅",rarity:"rare"},
  {name:"500 Coins",value:500,emoji:"💎",rarity:"rare"},
  {name:"MYSTERY BOX",value:1000,emoji:"🎁",rarity:"legendary"},
];

const CHAT_BOTS = ["VibeKing","ChillMaster","NeonQueen","BlazedPanda","CloudNine99","PuffDaddy","MoodMaster"];
const CHAT_MSGS = ["Let's go! 🔥","Ez 😎","GG 👏","Nah that's cap 💀","LETSGOOO 🎉","🤯🤯🤯","Hmm tricky 🤔","W play 🏆","Clutch! 💪","Prediction locked 🔮"];

const INPUT_MODES = [
  { id:"auto", label:"Auto", icon:"🤖", desc:"App auto-selects best input for game & device", color:C.cyan },
  { id:"fixed", label:"Fixed", icon:"📌", desc:"Always use one input type you choose", color:C.gold },
  { id:"ask", label:"Ask", icon:"❓", desc:"Ask before each game", color:C.lime },
];
const INPUT_TYPES = [
  { id:"puff", label:"Puff", icon:"💨", desc:"MIC-detected puff action", color:C.orange },
];

const DEVICE_MODELS = [
  { id:"cc_s1", name:"Cali Clear Season 1", short:"CC S1", pool:"standard", emoji:"📱" },
  { id:"cc_s2", name:"Cali Clear Season 2", short:"CC S2", pool:"standard", emoji:"📱" },
  { id:"cc_s3", name:"Cali Clear Season 3", short:"CC S3", pool:"standard", emoji:"📱" },
  { id:"cc_sel1", name:"Cali Clear Select S1", short:"CC Select S1", pool:"select", emoji:"✨" },
  { id:"cc_sel2", name:"Cali Clear Select S2", short:"CC Select S2", pool:"select", emoji:"✨" },
  { id:"none", name:"No Device", short:"Tap Only", pool:"open", emoji:"👆" },
];
const DEVICE_POOLS = {
  select: { label:"Select Pool", color:C.gold, aiSave:0.25, aiScore:0.45, rewardMult:2 },
  standard: { label:"Standard Pool", color:C.cyan, aiSave:0.20, aiScore:0.40, rewardMult:1.5 },
  open: { label:"Open Pool", color:C.text3, aiSave:0.12, aiScore:0.30, rewardMult:1 },
};
const KICK_ZONES = [
  { label:"↖", col:0, row:0 }, { label:"⬆", col:1, row:0 }, { label:"↗", col:2, row:0 },
  { label:"↙", col:0, row:1 }, { label:"⬇", col:1, row:1 }, { label:"↘", col:2, row:1 },
];

const USER = { name:"Steve", level:24, xp:7450, xpNext:10000, tier:"Gold" };

// ── TICKER FEED ──
const TICKER_ITEMS = [
  "⚽ USA vs MEX · 9:00 PM Tonight",
  "🏆 Flash Frenzy · 3 SPOTS LEFT",
  "🧠 Vibe Check LIVE · 1,247 watching",
  "🔥 ChillMaster42 on 23-win streak",
  "📊 BRA vs GER predictions open",
  "💰 JACKPOT: 100,000 coins up for grabs",
  "⚡ NeonQueen just won Wild West Duel",
  "🎰 Spin & Win Mega Friday at 8PM",
];


// ── WEB BLUETOOTH — Cali Clear device UUIDs ──
const BLE_SERVICE_UUID     = "0000ffe0-0000-1000-8000-00805f9b34fb";
const BLE_WRITE_CHAR_UUID  = "0000ffe5-0000-1000-8000-00805f9b34fb"; // reserved for future commands
const BLE_NOTIFY_CHAR_UUID = "0000ffe6-0000-1000-8000-00805f9b34fb";
// Notification payloads (6 bytes each)
const BLE_PUFF_START = [0xb4, 0xb4, 0x02, 0x00, 0x04, 0x4b]; // heating   → puff starts
const BLE_PUFF_STOP  = [0xb4, 0xb5, 0x02, 0x00, 0x05, 0x4b]; // cancelled → puff stops


export {
  ARENA_IMAGES, ARENA_VIDEOS, Z, FORTUNE_LEVELS, LOYALTY_TIERS,
  DIFFICULTY_LEVELS, DAILY_REWARDS, DAILY_CHALLENGES, SHOP_ITEMS, LOYALTY_BADGES,
  MOCK_FRIENDS, MOCK_COMMUNITIES, MOCK_COLLECTIONS,
  LIVE_HERO_SLIDES, LIVE_STREAMS, LIVE_CATEGORIES, LIVE_ARENA_ITEMS,
  LIVE_CREATORS, LIVE_REACTIONS, LIVE_BADGE,
  C, GLASS_CLEAR, GLASS_CARD, LG,
  SPECTATOR_NAMES, SPECTATOR_EMOJIS, SPECTATOR_TICKER_MSGS,
  PLAY_GAMES, SHOW_GAMES, MC_LINES, ORACLE_GAMES,
  ORACLE_WC_MATCHES, ORACLE_WC_SPECIALS, ORACLE_FUN_PREDS,
  CB_PREDICTIONS, SB_STRAINS, MP_MATCHES, DP_QUESTIONS,
  VC_QUESTIONS_V2, VC_QUESTIONS, PREDICT_TYPES,
  MATCHES, LEADERBOARD, TOURNAMENTS, BADGES, ACHIEVEMENTS, RANKS, STREAK_REWARDS,
  WALL_LEADERBOARD, WALL_RECORDS, WALL_ACTIVITY, WALL_ACHIEVEMENTS_RECENT,
  WALL_ACHIEVEMENTS_RARE, WALL_FRIENDS, WALL_OPPONENTS, WALL_CHAMPIONS,
  GAME_TEAMS, GAME_TOURNAMENTS, GAME_CONFIG,
  WC_TEAMS, WC_GROUPS, WC_PRIZES, WC_CONFEDERATIONS, WC_COOLDOWN_MS,
  WC_LIVE_MATCHES, WC_2026_GROUPS,
  UNIVERSAL_PUFF_CONFIG, getTriviaPuffAnswer,
  HOOK_FISH, SP_PUFF_TYPES, SP_COMEDY, PA_PRIZES,
  CHAT_BOTS, CHAT_MSGS, INPUT_MODES, INPUT_TYPES,
  DEVICE_MODELS, DEVICE_POOLS, KICK_ZONES, USER, TICKER_ITEMS,
  BLE_SERVICE_UUID, BLE_WRITE_CHAR_UUID, BLE_NOTIFY_CHAR_UUID,
  BLE_PUFF_START, BLE_PUFF_STOP,
};
