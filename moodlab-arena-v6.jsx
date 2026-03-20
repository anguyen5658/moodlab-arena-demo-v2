import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// MOOD LAB — ARENA EXPERIENCE v6.2
// Immersive 3D Alley · Virtual Tour · Walk-Between-Views
// "You don't scroll through Arena — you WALK through it."
// ═══════════════════════════════════════════════════════════════

// ── ARENA VIEW IMAGES (place in assets/arena/) ──
const ARENA_IMAGES = {
  hub:      "assets/arena/hub.png",
  arcade:   "assets/arena/arcade.png",
  stage:    "assets/arena/stage.png",
  oracle:   "assets/arena/oracle.png",
  wall:     "assets/arena/wall.png",
  worldcup: "assets/arena/worldcup.png",
};
const ARENA_VIDEOS = {
  hub:      "assets/arena/hub.mp4",
  arcade:   "assets/arena/arcade.mp4",
  stage:    "assets/arena/stage.mp4",
  oracle:   "assets/arena/oracle.mp4",
  wall:     "assets/arena/wall.mp4",
  worldcup: "assets/arena/worldcup.mp4",
};

// ── ZONE COLORS ──
const Z = {
  arcade: { primary:"#00E5FF", glow:"rgba(0,229,255,0.35)", dim:"rgba(0,229,255,0.08)", name:"The Arcade", icon:"🎮", sub:"8 Action Games" },
  stage:  { primary:"#FFD93D", glow:"rgba(255,217,61,0.35)", dim:"rgba(255,217,61,0.08)", name:"The Stage", icon:"🎪", sub:"4 Live Shows" },
  oracle: { primary:"#C084FC", glow:"rgba(192,132,252,0.35)", dim:"rgba(192,132,252,0.08)", name:"The Oracle", icon:"🔮", sub:"6 Predict Types" },
  wall:   { primary:"#FB923C", glow:"rgba(251,146,60,0.35)", dim:"rgba(251,146,60,0.08)", name:"The Wall", icon:"🏆", sub:"Rankings & Glory" },
};

const C = {
  bg:"#050510", bg2:"#0a0a20", bg3:"#0f0f2a", card:"#12123a",
  border:"rgba(255,255,255,0.06)", border2:"rgba(255,255,255,0.12)",
  text:"#F0EEFF", text2:"#8B85B8", text3:"#4A4570",
  cyan:"#00E5FF", gold:"#FFD93D", pink:"#FF4D8D", purple:"#C084FC",
  orange:"#FB923C", red:"#FF4444", green:"#34D399", lime:"#7FFF00", blue:"#60A5FA",
  glass:"rgba(255,255,255,0.03)", glassBorder:"rgba(255,255,255,0.08)",
};

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
  { id:"finalkick", name:"Final Kick", emoji:"⚽", players:"2", time:"1-2m", type:"Skill", color:C.cyan, desc:"Penalty kick 1v1. Chọn hướng sút, chọn hướng cản.", hot:true, inputs:["puff","button","tap"] },
  { id:"hotpotato", name:"Hot Potato", emoji:"💣", players:"3-8", time:"1-3m", type:"Luck", color:C.orange, desc:"Bom nhảy ngẫu nhiên. Puff để pass. Ai bị nổ = loại.", inputs:["puff","button"] },
  { id:"russian", name:"Russian Roulette", emoji:"🎲", players:"2-6", time:"1-2m", type:"Luck", color:C.red, desc:"Lần lượt puff. Random ai bị loại. Tension cực cao.", inputs:["puff","button"] },
  { id:"wildwest", name:"Wild West Duel", emoji:"🤠", players:"2", time:"15-30s", type:"Reaction", color:C.gold, desc:"Đếm ngược, ai puff nhanh hơn thắng.", hot:true, inputs:["puff","button"] },
  { id:"balloon", name:"Balloon Pop", emoji:"🎈", players:"2-8", time:"1-3m", type:"Strategy", color:C.pink, desc:"Puff bóng phình dần. Ai làm nổ thì thua.", inputs:["puff","button"] },
  { id:"puffpong", name:"Puff Pong", emoji:"🏓", players:"2", time:"1-2m", type:"Skill", color:C.green, desc:"Bóng bàn ảo. Puff = đánh bóng. Timing là tất cả.", inputs:["puff","tap"] },
  { id:"rhythm", name:"Rhythm Puff", emoji:"🎵", players:"1-4", time:"1-3m", type:"Rhythm", color:C.purple, desc:"Nốt nhạc rơi, puff đúng nhịp. Guitar Hero style.", inputs:["puff","button"] },
  { id:"tugofwar", name:"Tug of War", emoji:"💪", players:"2-8", time:"30s-1m", type:"Team", color:C.blue, desc:"2 team puff liên tục. Bên mạnh hơn thắng.", hot:true, inputs:["puff","button"] },
];

const SHOW_GAMES = [
  { id:"vibecheck", name:"Vibe Check", emoji:"🧠", players:"1-100+", time:"5-15m", type:"Trivia", color:C.gold, desc:"Trivia Game Show. Host hỏi, contestants trả lời, audience vote.", live:true, inputs:["puff","tap"] },
  { id:"spinwin", name:"Spin & Win", emoji:"🎰", players:"1-50+", time:"2-5m", type:"Luck", color:C.pink, desc:"Vòng quay may mắn. Puff để spin. Addictive.", live:true, inputs:["puff","button"] },
  { id:"higherlow", name:"Higher or Lower", emoji:"📊", players:"1-100+", time:"5-10m", type:"Knowledge", color:C.cyan, desc:"Đoán số tiếp theo cao hay thấp. Streak = thưởng lớn.", live:true, inputs:["puff","tap"] },
  { id:"pricepuff", name:"The Price is Puff", emoji:"💰", players:"2-50+", time:"5-10m", type:"Knowledge", color:C.green, desc:"Đoán giá sản phẩm. Gần nhất thắng.", live:true, inputs:["puff","tap"] },
];

const PREDICT_TYPES = [
  { id:"match", name:"Match Predictor", emoji:"🏟️", desc:"Win/Draw/Lose", color:C.purple },
  { id:"score", name:"Score Predictor", emoji:"🎯", desc:"Exact score ×10", color:C.cyan },
  { id:"mvp", name:"MVP Pick", emoji:"⭐", desc:"Best player", color:C.gold },
  { id:"bracket", name:"Bracket Challenge", emoji:"🗓️", desc:"Cả giải", color:C.lime },
  { id:"showpred", name:"Show Predictor", emoji:"🎪", desc:"Ai thắng show?", color:C.pink },
  { id:"daily", name:"Daily Picks", emoji:"📅", desc:"3-5 câu/ngày", color:C.orange },
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

const VC_QUESTIONS = [
  { q:"World Cup 2026 tổ chức ở bao nhiêu thành phố?", opts:["12","14","16","20"], correct:2 },
  { q:"Đội nào vô địch World Cup nhiều nhất?", opts:["Đức","Argentina","Italy","Brazil"], correct:3 },
  { q:"World Cup 2026 có bao nhiêu đội?", opts:["32","40","48","64"], correct:2 },
  { q:"Chung kết WC 2026 ở đâu?", opts:["Dallas","Miami","LA","New Jersey"], correct:3 },
  { q:"Tổng số trận WC 2026?", opts:["64","80","96","104"], correct:3 },
];

const CHAT_BOTS = ["VibeKing","ChillMaster","NeonQueen","BlazedPanda","CloudNine99","PuffDaddy","MoodMaster"];
const CHAT_MSGS = ["Let's go! 🔥","Ez 😎","GG 👏","Nah that's cap 💀","LETSGOOO 🎉","🤯🤯🤯","Hmm tricky 🤔","W play 🏆","Clutch! 💪","Prediction locked 🔮"];

const INPUT_MODES = [
  { id:"auto", label:"Auto", icon:"🤖", desc:"App tự chọn tối ưu theo game & device", color:C.cyan },
  { id:"fixed", label:"Fixed", icon:"📌", desc:"Luôn dùng 1 kiểu input bạn chọn", color:C.gold },
  { id:"ask", label:"Ask", icon:"❓", desc:"Hỏi trước mỗi game", color:C.lime },
];
const INPUT_TYPES = [
  { id:"puff", label:"Puff", icon:"💨", desc:"Hút thật · MIC + Heating ON", color:C.orange },
  { id:"dry_puff", label:"Dry Puff", icon:"🌀", desc:"MIC detect · Heating OFF", color:C.blue },
  { id:"button", label:"Button", icon:"🔘", desc:"Nút vật lý · BLE signal", color:C.purple },
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
  select: { label:"Select Pool", color:C.gold, aiSave:0.38, aiScore:0.58, rewardMult:2 },
  standard: { label:"Standard Pool", color:C.cyan, aiSave:0.30, aiScore:0.50, rewardMult:1.5 },
  open: { label:"Open Pool", color:C.text3, aiSave:0.20, aiScore:0.40, rewardMult:1 },
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


// ═══════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════
export default function MoodLabArena() {
  // ── Navigation ──
  const [tab, setTab] = useState("arena");
  const [zone, setZone] = useState(null); // null=hub, "arcade"|"stage"|"oracle"|"wall"
  const [liveTab, setLiveTab] = useState("now");
  const [meTab, setMeTab] = useState("stats");

  // ── Arena State ──
  const [coins, setCoins] = useState(12580);
  const [xp, setXp] = useState(7450);
  const [selectedGame, setSelectedGame] = useState(null);
  const [matchmaking, setMatchmaking] = useState(null);
  const [gameActive, setGameActive] = useState(null);
  const [puffLocking, setPuffLocking] = useState(false);

  // ── Vibe Check ──
  const [showVibeCheck, setShowVibeCheck] = useState(false);
  const [vcQ, setVcQ] = useState(0);
  const [vcScore, setVcScore] = useState(0);
  const [vcAnswered, setVcAnswered] = useState(false);
  const [vcStreak, setVcStreak] = useState(0);

  // ── Spin & Win ──
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);

  // ── Predictions ──
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [predictLocked, setPredictLocked] = useState({});

  // ── Duel ──
  const [duelState, setDuelState] = useState(null);
  const [duelResult, setDuelResult] = useState(null);

  // ── Final Kick ──
  const [kickState, setKickState] = useState(null); // null|"shoot"|"power"|"flight"|"shoot_result"|"save_ready"|"save_countdown"|"save_dive"|"save_result"|"round_result"|"final"
  const [kickRound, setKickRound] = useState(0); // 0-4
  const [kickScore, setKickScore] = useState({you:0, ai:0});
  const [kickAim, setKickAim] = useState(null); // 0-5
  const [kickPower, setKickPower] = useState(0); // 0-100
  const [kickAiZone, setKickAiZone] = useState(null);
  const [kickSaveZone, setKickSaveZone] = useState(null);
  const [kickBallAnim, setKickBallAnim] = useState(null); // {zone, power, result}
  const [kickDiveAnim, setKickDiveAnim] = useState(null); // keeper dive zone

  const [kickCharging, setKickCharging] = useState(false);
  const kickChargeInterval = useRef(null);
  const [kickComment, setKickComment] = useState("");
  const [kickSweetMin, setKickSweetMin] = useState(70); // random sweet spot per round
  const [kickSweetMax, setKickSweetMax] = useState(95);
  const [kickBonusAvail, setKickBonusAvail] = useState(false); // double-hold bonus available
  const [kickBonusUsed, setKickBonusUsed] = useState(false); // already used this game
  const [kickBonusActive, setKickBonusActive] = useState(false); // currently in bonus shot
  const [kickStats, setKickStats] = useState({goals:0,saves:0,perfects:0,blinkers:0,misses:0});
  const [kickChatOn, setKickChatOn] = useState(true); // chat panel ON by default in game
  const [audioOn, setAudioOn] = useState(true);
  const [arcadeTab, setArcadeTab] = useState("games"); // "games" | "leaderboard"

  // ── Device ──
  const [deviceModel, setDeviceModel] = useState("cc_s2");

  // ── Social ──
  const [chatMessages, setChatMessages] = useState([
    {u:"VibeKing",m:"Who's ready for USA vs MEX? 🇺🇸🔥",c:C.pink,t:Date.now()-60000},
    {u:"NeonQueen",m:"My bracket is locked 🔮",c:C.purple,t:Date.now()-45000},
    {u:"CloudNine99",m:"Just won 3 in a row ⚽",c:C.cyan,t:Date.now()-30000},
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatExpanded, setChatExpanded] = useState(false);
  const [lbTab, setLbTab] = useState("global");
  const [tournaments, setTournaments] = useState(TOURNAMENTS);
  const chatRef = useRef(null);

  // ── Input Method ──
  const [inputMode, setInputMode] = useState("auto");
  const [primaryInput, setPrimaryInput] = useState("puff");
  const [tapEnabled, setTapEnabled] = useState(true);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [showAskPrompt, setShowAskPrompt] = useState(null);
  const [sessionInput, setSessionInput] = useState(null);
  const [inputPulse, setInputPulse] = useState(false);

  // ── Atmosphere ──
  const [tick, setTick] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [particles] = useState(() => Array.from({length:30}, (_,i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100, s:Math.random()*3+1, d:Math.random()*20+10, o:Math.random()*0.4+0.1,
    color:[C.cyan,C.gold,C.purple,C.orange,C.pink][Math.floor(Math.random()*5)],
  })));
  const [tickerOffset, setTickerOffset] = useState(0);
  const [mainStage, setMainStage] = useState(0);
  const [controlHeat, setControlHeat] = useState([2,1]);
  const [liveScore, setLiveScore] = useState({home:1,away:0,min:34});
  const [notif, setNotif] = useState(null);

  // ── Arena View (Virtual Tour) ──
  const [arenaView, setArenaView] = useState("hub"); // "hub"|"arcade"|"stage"|"oracle"|"wall"|"worldcup"
  const [walking, setWalking] = useState(false);
  const [walkFrom, setWalkFrom] = useState(null);
  const [chatPanel, setChatPanel] = useState(false);
  const [arenaLoading, setArenaLoading] = useState(true); // loading screen on first Arena entry

  // ── Derived ──
  const wcDays = Math.max(0, Math.floor((new Date("2026-06-11") - new Date()) / 86400000));
  const playersNow = 1247 + (tick % 13) * 7;
  const friendsOnline = 3 + (tick % 5);

  const getActiveInputInfo = () => {
    if (inputMode==="auto") return {icon:"🤖",label:"Auto",color:C.cyan};
    if (inputMode==="fixed") { const t=INPUT_TYPES.find(i=>i.id===primaryInput); return {icon:t.icon,label:t.label,color:t.color}; }
    if (inputMode==="ask" && sessionInput) { const t=INPUT_TYPES.find(i=>i.id===sessionInput); return {icon:t.icon,label:t.label,color:t.color}; }
    return {icon:"❓",label:"Ask",color:C.lime};
  };
  const activeInput = getActiveInputInfo();

  // ── EFFECTS ──
  useEffect(() => { const t=setInterval(()=>setTick(p=>p+1),1000); return()=>clearInterval(t); }, []);
  useEffect(() => { const t=setInterval(()=>setMainStage(p=>(p+1)%3),5000); return()=>clearInterval(t); }, []);
  useEffect(() => { const t=setInterval(()=>setTickerOffset(p=>p-0.5),30); return()=>clearInterval(t); }, []);

  // Bot chat
  useEffect(() => {
    const i=setInterval(()=>{
      const bot=CHAT_BOTS[Math.floor(Math.random()*CHAT_BOTS.length)];
      const msg=CHAT_MSGS[Math.floor(Math.random()*CHAT_MSGS.length)];
      const colors=[C.pink,C.cyan,C.gold,C.purple,C.orange,C.green];
      setChatMessages(p=>[...p.slice(-20),{u:bot,m:msg,c:colors[Math.floor(Math.random()*colors.length)],t:Date.now()}]);
    }, 4000+Math.random()*3000);
    return()=>clearInterval(i);
  }, []);

  // Tournament filling
  useEffect(() => {
    const i=setInterval(()=>{
      setTournaments(ts=>ts.map(t=>({...t,current:Math.min(t.max,t.current+(Math.random()>0.6?1:0))})));
    },5000);
    return()=>clearInterval(i);
  },[]);

  // Floating reactions
  useEffect(() => {
    const i=setInterval(()=>{
      if(Math.random()>0.4) {
        const emojis=["🔥","⚽","🏆","💪","😎","🎉","💀","👏","🤯","⭐"];
        setFloatingReactions(p=>[...p.slice(-8),{
          id:Date.now(), emoji:emojis[Math.floor(Math.random()*emojis.length)],
          x:10+Math.random()*80, dur:3+Math.random()*3,
        }]);
      }
    },2000);
    return()=>clearInterval(i);
  },[]);

  // Auto-scroll chat
  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[chatMessages]);

  // ── ACTIONS ──
  const notify = useCallback((msg,color=C.cyan) => { setNotif({msg,color}); setTimeout(()=>setNotif(null),2200); }, []);
  const sendChat = useCallback((msg) => { const t=msg||chatInput.trim(); if(!t) return; setChatMessages(p=>[...p.slice(-20),{u:"Steve",m:t,c:C.cyan,t:Date.now(),isYou:true}]); setChatInput(""); },[chatInput]);
  const puffLockIn = (cb) => { setPuffLocking(true); setTimeout(()=>{setPuffLocking(false);notify("✓ Locked In!",C.green);if(cb)cb();},1100); };
  const triggerInputPulse = () => { setInputPulse(true); setTimeout(()=>setInputPulse(false),600); };

  const resolveInputForGame = (game, callback) => {
    if(inputMode==="auto"){const s=game?.inputs||["puff"];const p=s.includes("puff")?"puff":s[0];notify(`🤖 Auto → ${INPUT_TYPES.find(t=>t.id===p)?.icon} ${INPUT_TYPES.find(t=>t.id===p)?.label}`,C.cyan);callback(p);}
    else if(inputMode==="fixed"){const s=game?.inputs||["puff"];if(s.includes(primaryInput))callback(primaryInput);else{const f=s[0];notify(`⚠ Fallback → ${INPUT_TYPES.find(t=>t.id===f)?.label}`,C.orange);callback(f);}}
    else{setShowAskPrompt(game);window._inputCb=callback;}
  };
  const handleAskPick = (id) => { setSessionInput(id); setShowAskPrompt(null); triggerInputPulse(); if(window._inputCb){window._inputCb(id);window._inputCb=null;} };

  // ── Preload arena images + loading screen ──
  useEffect(() => {
    let loaded = 0;
    const total = Object.values(ARENA_IMAGES).length;
    Object.values(ARENA_IMAGES).forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => { loaded++; if (loaded >= total) setTimeout(() => setArenaLoading(false), 1200); };
      img.src = src;
    });
    // Fallback: dismiss after 2.5s even if images haven't loaded
    const fallback = setTimeout(() => setArenaLoading(false), 2500);
    return () => clearTimeout(fallback);
  }, []);

  // ── Walk transition between views ──
  const walkTo = useCallback((target) => {
    if (walking || arenaView === target) return;
    setWalkFrom(arenaView);
    setWalking(true);
    setTimeout(() => {
      setArenaView(target);
      setTimeout(() => { setWalking(false); setWalkFrom(null); }, 50);
    }, 400);
  }, [walking, arenaView]);

  const walkBack = useCallback(() => { walkTo("hub"); }, [walkTo]);

  const startMatch = (game, mode) => {
    resolveInputForGame(game, (input) => {
      setMatchmaking({game,mode,stage:"searching",input});
      setTimeout(()=>{
        setMatchmaking(p=>p?{...p,stage:"found",opp:mode==="ai"?"🤖 AI Bot":mode==="random"?"🎲 Player_847":"👫 Minh"}:null);
        setTimeout(()=>{setMatchmaking(null);setGameActive({...game,activeInput:input});if(game.id==="wildwest")startDuel();if(game.id==="finalkick")startKick();},1500);
      },mode==="ai"?800:2200);
    });
  };

  const startDuel = () => {
    setDuelState("ready"); setDuelResult(null);
    setTimeout(()=>setDuelState("steady"),1000);
    setTimeout(()=>{const d=1500+Math.random()*2000;setTimeout(()=>setDuelState("shoot"),d);},2000);
  };
  const duelShoot = () => {
    if(duelState==="shoot"){const you=Math.floor(200+Math.random()*300),ai=Math.floor(400+Math.random()*400);const win=you<ai;setDuelResult({win,you,ai});setDuelState("result");if(win){setCoins(c=>c+50);notify("🤠 YOU WIN! +50",C.green);}else notify("💀 AI faster!",C.red);}
    else if(duelState&&duelState!=="shoot"&&duelState!=="result"){setDuelResult({foul:true});setDuelState("result");notify("⚠ FOUL!",C.red);}
  };
  // ── Sound FX — real audio files + synthesized fallbacks ──
  const playAudio = useCallback((src, vol=0.5) => {
    if(!audioOn) return;
    try { const a = new Audio(src); a.volume = vol; a.play().catch(()=>{}); } catch(e){}
  }, [audioOn]);
  const playFx = useCallback((type) => {
    if(!audioOn) return;
    // Real audio files for key moments
    if(type==="laugh"){ playAudio("assets/arena/laugh.m4a", 0.6); return; }
    if(type==="win"){ playAudio("assets/arena/win.m4a", 0.7); return; }
    if(type==="lose"){ playAudio("assets/arena/lose.m4a", 0.6); return; }
    // Synthesized sounds for quick feedback
    try {
      const ac = new (window.AudioContext||window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      if(type==="kick"){osc.type="sine";osc.frequency.setValueAtTime(220,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(880,ac.currentTime+0.15);gain.gain.setValueAtTime(0.3,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.2);osc.start();osc.stop(ac.currentTime+0.2);}
      else if(type==="goal"){osc.type="square";osc.frequency.setValueAtTime(523,ac.currentTime);osc.frequency.setValueAtTime(659,ac.currentTime+0.1);osc.frequency.setValueAtTime(784,ac.currentTime+0.2);gain.gain.setValueAtTime(0.2,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.4);osc.start();osc.stop(ac.currentTime+0.4);}
      else if(type==="save"){osc.type="sawtooth";osc.frequency.setValueAtTime(300,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(100,ac.currentTime+0.3);gain.gain.setValueAtTime(0.15,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.3);osc.start();osc.stop(ac.currentTime+0.3);}
      else if(type==="whistle"){osc.type="sine";osc.frequency.setValueAtTime(2800,ac.currentTime);osc.frequency.setValueAtTime(3200,ac.currentTime+0.15);osc.frequency.setValueAtTime(2800,ac.currentTime+0.3);gain.gain.setValueAtTime(0.12,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.5);osc.start();osc.stop(ac.currentTime+0.5);}
      else if(type==="crowd"){const n=ac.createBufferSource();const b=ac.createBuffer(1,ac.sampleRate*0.6,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*0.15*Math.sin(i/d.length*Math.PI);n.buffer=b;const g2=ac.createGain();g2.gain.setValueAtTime(0.3,ac.currentTime);g2.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.6);n.connect(g2);g2.connect(ac.destination);n.start();}
      else if(type==="charge"){osc.type="sine";osc.frequency.setValueAtTime(200,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(1200,ac.currentTime+1.5);gain.gain.setValueAtTime(0.08,ac.currentTime);gain.gain.setValueAtTime(0.08,ac.currentTime+1.4);gain.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+1.5);osc.start();osc.stop(ac.currentTime+1.5);}
    } catch(e){}
  }, []);

  // ── Final Kick Logic ──
  const getDevicePool = () => DEVICE_POOLS[(DEVICE_MODELS.find(d=>d.id===deviceModel)||DEVICE_MODELS[5]).pool] || DEVICE_POOLS.open;
  const getDeviceShort = () => (DEVICE_MODELS.find(d=>d.id===deviceModel)||DEVICE_MODELS[5]).short;
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

  // AI Opponents pool — with DiceBear avatar URLs
  const AI_OPPONENTS = [
    {name:"SmokeBot 3000",emoji:"🤖",img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=SmokeBot&backgroundColor=transparent",rank:"#47",record:"142-89",taunt:"I don't even need lungs 💨"},
    {name:"Sir Puffs-a-Lot",emoji:"🧐",img:"https://api.dicebear.com/9.x/adventurer/svg?seed=SirPuffs&backgroundColor=transparent&skinColor=f2d3b1",rank:"#23",record:"201-67",taunt:"Indubitably, I shall save this"},
    {name:"Baked Baker",emoji:"👨‍🍳",img:"https://api.dicebear.com/9.x/adventurer/svg?seed=BakedBaker&backgroundColor=transparent",rank:"#88",record:"69-42",taunt:"420 saves per game bro"},
    {name:"Goalkeeper Gary",emoji:"🦸",img:"https://api.dicebear.com/9.x/adventurer/svg?seed=GoalkeeperGary&backgroundColor=transparent",rank:"#12",record:"310-55",taunt:"These hands don't miss 🧤"},
    {name:"Cloud Nine",emoji:"☁️",img:"https://api.dicebear.com/9.x/adventurer/svg?seed=CloudNine&backgroundColor=transparent",rank:"#31",record:"188-101",taunt:"Floating to victory~"},
    {name:"The Lobster",emoji:"🦞",img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lobster&backgroundColor=transparent",rank:"#99",record:"50-50",taunt:"I pinch, I save, I win 🦀"},
  ];
  const PLAYER_IMG = "https://api.dicebear.com/9.x/adventurer/svg?seed=Steve420&backgroundColor=transparent&skinColor=f2d3b1";
  const kickOpponent = useRef(AI_OPPONENTS[0]);

  // Randomize sweet spot: min hold ~1.8-2.8s, window 0.8-1.2s, never < 1.5s hold
  const randomizeSweetSpot = () => {
    const holdMin = 1.8 + Math.random()*1.0; // 1.8-2.8s minimum hold for sweet spot
    const window = 0.8 + Math.random()*0.4; // 0.8-1.2s window width
    const holdMax = holdMin + window;
    // Convert to power % using the curve (~40% at 1.5s, ~70% at 2.5s, ~95% at 3.5s)
    const pMin = Math.round(40 + (holdMin-1.5)/2.0 * 55);
    const pMax = Math.min(96, Math.round(40 + (holdMax-1.5)/2.0 * 55));
    setKickSweetMin(Math.max(45, pMin));
    setKickSweetMax(pMax);
    return {holdMin:holdMin.toFixed(1), holdMax:holdMax.toFixed(1)};
  };

  const startKick = () => {
    kickOpponent.current = pick(AI_OPPONENTS);
    setKickState("shoot"); setKickRound(0); setKickScore({you:0,ai:0});
    setKickAim(null); setKickPower(0); setKickAiZone(null);
    setKickSaveZone(null); setKickBallAnim(null); setKickDiveAnim(null);
    setKickCharging(false); setKickBonusUsed(false); setKickBonusAvail(false); setKickBonusActive(false);
    setKickStats({goals:0,saves:0,perfects:0,blinkers:0,misses:0});
    const ss = randomizeSweetSpot();
    setKickComment(pick(["Let's gooo 🔥","Time to ball ⚽","No pressure 😅","Sweet spot: "+ss.holdMin+"-"+ss.holdMax+"s 🎯"]));
  };

  const kickSelectZone = (zone) => {
    if(kickState!=="shoot") return;
    setKickAim(zone);
    setKickState("power");
    setKickPower(0);
    setKickComment(pick(["Now PUFF it! 💨","Hold that puff... 🫁","How long can you go? 😏","Full lungs energy 💨","Inhale... and HOLD 🌬️"]));
    const inp = gameActive?.activeInput;
    if(inp==="tap"||!inp) {
      const autoPwr = 55+Math.floor(Math.random()*30);
      setKickPower(autoPwr);
      setTimeout(()=>kickExecute(zone, autoPwr), 600);
    }
  };

  // ── PUFF DURATION SYSTEM ──
  // Power curve based on hold duration (mirrors real device puff timing):
  //   0-0.5s  = TAP (0-15%)        — barely a puff
  //   0.5-1.5s = SHORT (15-40%)    — quick hit
  //   1.5-2.5s = GOOD (40-70%)     — solid puff
  //   2.5-3.5s = PERFECT (70-95%)  — sweet spot 💨👑
  //   3.5-4.5s = LONG (95→75%)     — held too long, power drops
  //   5s+      = BLINKER (→30%)    — device cutoff! ball goes wild 💀
  const puffStartTime = useRef(0);
  const getPuffPower = (elapsed) => {
    // elapsed in seconds
    if(elapsed < 0.5) return Math.round(elapsed / 0.5 * 15); // 0-15%
    if(elapsed < 1.5) return Math.round(15 + (elapsed-0.5)/1.0 * 25); // 15-40%
    if(elapsed < 2.5) return Math.round(40 + (elapsed-1.5)/1.0 * 30); // 40-70%
    if(elapsed < 3.5) return Math.round(70 + (elapsed-2.5)/1.0 * 25); // 70-95% SWEET SPOT
    if(elapsed < 4.5) return Math.round(95 - (elapsed-3.5)/1.0 * 20); // 95→75% dropping
    if(elapsed < 5.0) return Math.round(75 - (elapsed-4.5)/0.5 * 45); // 75→30% BLINKER ZONE
    return 30; // capped at blinker
  };

  const getPuffZone = (power) => {
    if(power >= kickSweetMin && power <= kickSweetMax) return "perfect";
    if(power >= 40 && power < kickSweetMin) return "good";
    if(power >= 15 && power < 40) return "short";
    if(power < 15) return "tap";
    if(power > kickSweetMax) return "long";
    return "good";
  };

  // Check if blinker territory (held 4.5s+, power is dropping fast)
  const isPuffBlinker = useRef(false);

  const kickStartCharge = () => {
    if(kickState!=="power"||kickAim===null||kickCharging) return;
    setKickCharging(true); setKickPower(0);
    puffStartTime.current = Date.now();
    isPuffBlinker.current = false;

    kickChargeInterval.current = setInterval(()=>{
      const elapsed = (Date.now() - puffStartTime.current) / 1000;
      const pwr = getPuffPower(elapsed);
      setKickPower(pwr);

      // Update commentary based on zone
      if(elapsed > 4.5 && !isPuffBlinker.current) {
        isPuffBlinker.current = true;
        setKickComment(pick(["BLINKER! 💀 You hit the cutoff!","Bro your lungs ok?? 🫁💀","DEVICE SAYS STOP 🚨","That's a blinker hit my guy 😂"]));
        playFx("laugh");
      } else if(elapsed > 3.5 && elapsed <= 4.5) {
        setKickComment("Too long! Power dropping... 📉😬");
      } else if(elapsed > 2.5 && elapsed <= 3.5) {
        setKickComment(pick(["💨👑 SWEET SPOT! Release NOW!","PERFECT PUFF ZONE! 🎯","THIS IS IT! LET GO! 🔥"]));
      } else if(elapsed > 1.5 && elapsed <= 2.5) {
        setKickComment("Keep going... almost there 💨");
      }

      // Auto-stop at 5.5s (blinker max)
      if(elapsed >= 5.5) {
        kickStopCharge();
      }
    }, 50);
  };

  const kickStopCharge = () => {
    if(!kickCharging) return;
    setKickCharging(false);
    if(kickChargeInterval.current){clearInterval(kickChargeInterval.current);kickChargeInterval.current=null;}
    const elapsed = (Date.now() - puffStartTime.current) / 1000;
    const wasBlinker = elapsed >= 4.5;

    setKickPower(p=>{
      // Add minor intensity variance (+/- 5%)
      const intensity = (Math.random()-0.5)*10;
      const finalPwr = Math.max(5, Math.min(100, p + intensity));
      setTimeout(()=>kickExecute(kickAim, Math.round(finalPwr), wasBlinker, elapsed), 200);
      return Math.round(finalPwr);
    });
  };

  const kickExecute = (zone, power, wasBlinker=false, holdTime=0) => {
    const pool = getDevicePool();
    const aiSaveZone = Math.floor(Math.random()*6);
    setKickAiZone(aiSaveZone);
    setKickDiveAnim(aiSaveZone);
    setKickState("flight");
    playFx("kick");

    const puffZone = getPuffZone(power);
    const sameZone = zone === aiSaveZone;

    // Outside sweet spot = automatic lose. Only perfect puffs can score.
    let aiSaveChance = 1.0; // default: saved
    let missChance = 0;
    let autoFail = false;
    if(puffZone==="perfect"){ aiSaveChance=pool.aiSave; } // sweet spot = real chance to score
    else { autoFail=true; } // tap/short/good/long = instant fail
    if(wasBlinker){ missChance=1.0; autoFail=true; } // blinker = always miss
    else if(puffZone==="long"){ missChance=0.6; autoFail=true; } // held too long = mostly miss

    const missed = autoFail ? (Math.random() < Math.max(missChance, 0.4)) : false; // non-sweet: 40%+ miss, rest saved
    const aiSaves = !missed && (autoFail || (sameZone && Math.random() < aiSaveChance));
    const isGoal = !missed && !aiSaves;

    const holdLabel = holdTime>=4.5?"BLINKER 💀":holdTime>=2.5?`${holdTime.toFixed(1)}s PERFECT 💨`:holdTime>=1.5?`${holdTime.toFixed(1)}s`:holdTime>0?`${holdTime.toFixed(1)}s quick`:"";
    setKickBallAnim({zone, power, result: missed?"missed":aiSaves?"saved":"goal", wasBlinker});

    setTimeout(()=>{
      const bonusMult = kickBonusActive ? 2 : 1;
      if(missed) {
        playFx("lose");
        if(wasBlinker) playFx("laugh");
        setKickStats(s=>({...s, misses:s.misses+1, blinkers:wasBlinker?s.blinkers+1:s.blinkers}));
        if(wasBlinker) setKickComment(pick(["BLINKER SHOT! Ball left the stadium 💀😂","Your lungs said goodbye, so did the ball 🫁💨","That puff was so long the ball evaporated 🌫️","Blinker = automatic L bro 😭",""+kickOpponent.current.name+": 'Did you just blinker??' 🤣"]));
        else setKickComment(pick(["OVER THE BAR! Too much power 😂","Ball said 'I'm out' ✈️💀","That shot is still flying somewhere 🚀","Bro aimed for the moon fr 🌙😭",""+kickOpponent.current.emoji+" is laughing at you rn"]));
      } else if(isGoal) {
        const pts = bonusMult;
        setKickScore(s=>({...s, you:s.you+pts}));
        setKickStats(s=>({...s, goals:s.goals+1, perfects:puffZone==="perfect"?s.perfects+1:s.perfects}));
        playFx("win"); playFx("crowd");
        const bonusTag = kickBonusActive ? " (×2 BONUS! 💰)" : "";
        if(puffZone==="perfect") setKickComment(pick(["PERFECT PUFF GOAL! 💨👑🔥"+bonusTag,"SWEET SPOT MERCHANT! Unstoppable!"+bonusTag,"That "+holdLabel+" puff was CLINICAL 🎯"+bonusTag,"The puff-to-goal pipeline is REAL 💨→⚽","Keeper didn't stand a CHANCE 🧤💀"]));
        else setKickComment(pick(["GOLAZOOO! 🔥🔥"+bonusTag,"SHEEEESH! 🥶","NET GO BRRR 😤","That ball had SMOKE on it 💨",""+holdLabel+" puff = GOAL!"+bonusTag,"ABSOLUTE BANGER 💥"]));
      } else {
        playFx("lose");
        if(puffZone==="tap"||puffZone==="short") playFx("laugh"); // off sweet spot = laugh
        if(puffZone==="tap") setKickComment(pick(["That wasn't a kick, that was a PASS 😂","Bro barely puffed 💨... more like a sigh","Even "+kickOpponent.current.name+" felt bad saving that 🥲","0.3 second puff energy 💀"]));
        else if(puffZone==="short") setKickComment(pick(["Too short bro! 💨 Need longer puff!","Quick puff = easy save 😂",""+kickOpponent.current.name+" didn't even try 🥱","Hold longer next time! 🫁"]));
        else setKickComment(pick([""+kickOpponent.current.name+" says 'nah' 🧤","Saved... try a longer puff next time 💨","Keeper ate that "+holdLabel+" puff 😤",""+kickOpponent.current.emoji+" blocked your dreams"]));
      }
      setKickState("shoot_result");
      setTimeout(()=>{
        setKickBallAnim(null); setKickDiveAnim(null); setKickAim(null);
        if(kickBonusActive) {
          // Bonus shot done — go to final
          setKickBonusActive(false);
          setKickState("final");
        } else {
          setKickState("save_ready");
          setKickComment(pick(["Your turn in goal 🧤","Don't let "+kickOpponent.current.name+" score 😤","Channel your inner wall 🧱","Time to earn that keeper badge 🏅"]));
        }
      }, 1800);
    }, 800);
  };

  const kickSaveStart = () => {
    const aiKickZone = Math.floor(Math.random()*6);
    setKickAiZone(aiKickZone);
    setKickState("save_countdown");
    playFx("whistle");
    setKickComment(pick([""+kickOpponent.current.name+" is lining up... 👀","Those eyes... which way? 🤔",""+kickOpponent.current.emoji+" whispers: '"+kickOpponent.current.taunt+"'","Trust your gut 🫁"]));
    setTimeout(()=>{
      setKickState("save_dive");
      setKickComment(pick(["DIVE DIVE DIVE! 🧤","NOW! 💨","QUICK! PICK A SIDE!","LEFT OR RIGHT?! 😱"]));
    }, 1200);
  };

  const kickDive = (zone) => {
    if(kickState!=="save_dive") return;
    setKickSaveZone(zone);
    setKickDiveAnim(zone);
    setKickState("save_result");
    playFx("kick");

    const pool = getDevicePool();
    const aiKickZone = kickAiZone;
    const sameZone = zone === aiKickZone;
    const aiScores = !sameZone || (sameZone && Math.random() < (pool.aiScore - 0.20));

    setKickBallAnim({zone:aiKickZone, power:70, result: aiScores ? "goal" : "saved"});

    setTimeout(()=>{
      if(aiScores) {
        setKickScore(s=>({...s, ai:s.ai+1}));
        playFx("lose"); playFx("laugh");
        setKickComment(pick(["Bruh... 💀",""+kickOpponent.current.name+": 'Too easy' 😂","Wrong way lmaooo 🤣","Keeper had lag 📡","You dove like a fish... wrong fish 🐟",""+kickOpponent.current.emoji+" is doing a victory dance"]));
      } else {
        setKickStats(s=>({...s, saves:s.saves+1}));
        playFx("win"); playFx("crowd");
        setKickComment(pick(["DENIED! 🚫🧤",""+kickOpponent.current.name+" is SHOOK 😱","BRICK WALL! 🧱","You read that like a BOOK 📖",""+kickOpponent.current.emoji+" is questioning life rn","WHAT A SAVE! Crowd goes crazy 🙌"]));
      }
      setTimeout(()=>{
        setKickBallAnim(null); setKickDiveAnim(null);
        setKickSaveZone(null); setKickAiZone(null);
        kickAdvanceRound();
      }, 1800);
    }, 800);
  };

  const kickAdvanceRound = () => {
    const nextRound = kickRound + 1;
    if(nextRound >= 5) {
      // Check for bonus shot: available on final round if not used yet, 50% chance
      if(!kickBonusUsed && Math.random() < 0.5) {
        setKickBonusAvail(true);
        setKickState("bonus_offer");
        setKickComment(pick(["🎰 BONUS SHOT! Double-hold challenge!","⚡ SUDDEN DEATH BONUS! One extra kick!","🔥 BONUS ROUND! Harder puff, bigger reward!"]));
        playFx("whistle");
        return;
      }
      setKickState("final");
    } else {
      setKickRound(nextRound);
      const ss = randomizeSweetSpot(); // New sweet spot each round!
      setKickState("shoot");
      setKickAim(null); setKickPower(0);
      setKickComment(pick(["Round "+(nextRound+1)+"! Sweet spot shifted: "+ss.holdMin+"-"+ss.holdMax+"s 🎯","New round, new sweet spot 🔄","Adapt or miss! "+ss.holdMin+"s-"+ss.holdMax+"s 💨"]));
    }
  };

  // Bonus shot: accept or skip
  const kickAcceptBonus = () => {
    setKickBonusUsed(true); setKickBonusActive(true); setKickBonusAvail(false);
    // Bonus has a TIGHTER sweet spot (harder)
    const holdMin = 2.2 + Math.random()*0.6;
    const window = 0.5 + Math.random()*0.3; // narrower!
    const holdMax = holdMin + window;
    const pMin = Math.round(40 + (holdMin-1.5)/2.0 * 55);
    const pMax = Math.min(96, Math.round(40 + (holdMax-1.5)/2.0 * 55));
    setKickSweetMin(Math.max(50, pMin)); setKickSweetMax(pMax);
    setKickState("shoot");
    setKickAim(null); setKickPower(0);
    setKickComment(pick(["BONUS SHOT! Tighter sweet spot: "+holdMin.toFixed(1)+"-"+holdMax.toFixed(1)+"s ⚡","This one's HARDER! Nail the puff! 🎯","Double rewards if you score! 💰💰"]));
    playFx("crowd");
  };

  const kickSkipBonus = () => {
    setKickBonusAvail(false);
    setKickState("final");
  };

  const kickEndGame = () => {
    const pool = getDevicePool();
    const mult = pool.rewardMult;
    let reward = 0;
    if(kickScore.you > kickScore.ai) { reward = Math.round(80 * mult); notify(`⚽ YOU WIN! +${reward} coins!`,C.green); playFx("win"); }
    else if(kickScore.you < kickScore.ai) { reward = Math.round(10 * mult); notify(`😢 +${reward} coins`,C.red); playFx("lose"); }
    else { reward = Math.round(30 * mult); notify(`🤝 Draw! +${reward} coins`,C.gold); }
    setCoins(c=>c+reward);
    setGameActive(null); setKickState(null); setKickCharging(false);
    if(kickChargeInterval.current){clearInterval(kickChargeInterval.current);kickChargeInterval.current=null;}
  };

  const doSpin = () => {
    if(spinning) return; setSpinning(true); setSpinResult(null);
    setSpinAngle(p=>p+1440+Math.random()*1440);
    setTimeout(()=>{
      const r=[{t:"100 Coins 🪙",c:100},{t:"200 Coins 🪙",c:200},{t:"JACKPOT 500!",c:500},{t:"50 XP ✨",c:0},{t:"Power-up ⚡",c:25},{t:"150 Coins 🪙",c:150}][Math.floor(Math.random()*6)];
      setSpinResult(r);if(r.c)setCoins(c=>c+r.c);setSpinning(false);notify(`🎰 ${r.t}`,r.c>200?C.gold:C.cyan);
    },3500);
  };

  // ═════════════════════════════════════════
  // ── RENDER: FLOATING ATMOSPHERE ──
  // ═════════════════════════════════════════
  const renderAtmosphere = () => (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}}>
      {particles.map(p=>{
        const blurAmt = p.s > 2 ? 1 : 0;
        return (
          <div key={p.id} style={{
            position:"absolute",width:p.s,height:p.s,borderRadius:"50%",background:p.color,opacity:p.o,
            left:`${p.x}%`,bottom:`${(tick*2+p.id*37)%140-20}%`,
            transition:"bottom 1s linear",
            filter:`blur(${blurAmt}px)`,
          }}/>
        );
      })}
      {floatingReactions.map(r=>(
        <div key={r.id} style={{
          position:"fixed",left:`${r.x}%`,fontSize:20,pointerEvents:"none",zIndex:60,opacity:0,
          animation:`floatUp ${r.dur}s ease-out forwards`,
        }}>{r.emoji}</div>
      ))}
    </div>
  );

  // ═════════════════════════════════════════
  // ── RENDER: LIVE TICKER ──
  // ═════════════════════════════════════════
  const renderTicker = () => {
    const items = TICKER_ITEMS.concat(TICKER_ITEMS);
    return (
      <div style={{width:"100%",overflow:"hidden",height:28,background:"rgba(255,255,255,0.02)",borderBottom:`1px solid ${C.border}`,position:"relative",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",height:"100%",whiteSpace:"nowrap",transform:`translateX(${tickerOffset}px)`,willChange:"transform"}}>
          {items.map((t,i)=>{
            const dotColor = i % 2 === 0 ? C.red : C.cyan;
            const anim = i % 3 === 0 ? "pulse 1.5s infinite" : "none";
            return (
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 24px",fontSize:11,fontWeight:600,color:C.text2,letterSpacing:0.3}}>
                <span style={{width:4,height:4,borderRadius:"50%",background:dotColor,animation:anim}}/>
                {t}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ── RENDER: ARENA HUB V2 — THE IMMERSIVE 3D ALLEY ──
  // "You WALK through the arena. Tap a kiosk to approach it."
  // ═══════════════════════════════════════════════════════════

  const stageData = [
    { tag:"LIVE EVENT", tagColor:C.red, title:"🇺🇸 USA vs Mexico 🇲🇽", sub:`Tonight 9:00 PM · ${playersNow.toLocaleString()} predicting`, cta:"Predict Now", ctaColor:C.lime, act:()=>{setZone("oracle");setArenaView("hub");}, bg:`radial-gradient(ellipse at 30% 40%, ${C.red}18, transparent 60%), radial-gradient(ellipse at 70% 60%, ${C.lime}10, transparent 60%)` },
    { tag:"SHOW LIVE", tagColor:C.gold, title:"🧠 Vibe Check — WC Edition", sub:"MC Tuấn · 1,247 watching · Top prize: 5,000", cta:"Join Show", ctaColor:C.gold, act:()=>setShowVibeCheck(true), bg:`radial-gradient(ellipse at 30% 40%, ${C.gold}15, transparent 60%), radial-gradient(ellipse at 70% 60%, ${C.purple}10, transparent 60%)` },
    { tag:"TOURNAMENT", tagColor:C.cyan, title:"⚽ Final Kick WC Tournament", sub:"64 players · Your rank: #12 · Round of 16", cta:"Play Match", ctaColor:C.cyan, act:()=>{setZone("arcade");setArenaView("hub");setSelectedGame(PLAY_GAMES[0]);}, bg:`radial-gradient(ellipse at 30% 40%, ${C.cyan}12, transparent 60%), radial-gradient(ellipse at 70% 60%, ${C.blue}10, transparent 60%)` },
  ];

  /* ── Invisible tap zones — positioned exactly over neon sign text in hub.png ──
     Coordinates are % within a 52vh-tall container that starts after jumbotron.
     Container top ≈ 27% of viewport (250px on 932px screen). */
  const HUB_TAP_ZONES = [
    { key:"arcade",   top:"38%", left:"0%",   width:"18%", height:"24%" },
    { key:"stage",    top:"38%", right:"0%",  width:"19%", height:"24%" },
    { key:"wall",     top:"42%", left:"18%",  width:"16%", height:"18%" },
    { key:"oracle",   top:"40%", right:"16%", width:"16%", height:"18%" },
    { key:"worldcup", top:"42%", left:"28%",  width:"28%", height:"22%" },
  ];

  /* ── Glass floating buttons ── */
  const renderGlassButtons = () => (
    <div style={{position:"absolute",right:14,bottom:18,zIndex:15,display:"flex",flexDirection:"column",gap:8}}>
      {[
        {icon:"💬",label:"Chat",action:()=>setChatPanel(!chatPanel),dot:true},
      ].map((btn,i) => (
        <div key={i} onClick={btn.action} style={{
          width:42,height:42,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
          ...GLASS_CLEAR,
          cursor:"pointer",fontSize:16,position:"relative",
          animation:`glassFloatIn 0.5s ease ${0.1+i*0.1}s both`,
        }}>
          {btn.icon}
          {btn.dot ? <div style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 4px ${C.green}`}}/> : null}
        </div>
      ))}
    </div>
  );

  /* ── Inline chat — sits above nav on lobby, toggle on/off ── */
  const renderInlineChat = () => {
    if (!chatPanel) return null;
    return (
      <div style={{position:"absolute",bottom:62,left:10,right:10,zIndex:11,animation:"panelSlideUp 0.3s ease both"}}>
        <div style={{borderRadius:18,overflow:"hidden",...GLASS_CARD}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:12,fontWeight:800,color:C.text}}>💬 Chat</span>
              <div style={{display:"flex",alignItems:"center",gap:3}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:9,fontWeight:700,color:C.green}}>{playersNow.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div ref={chatRef} style={{padding:"6px 12px",maxHeight:80,overflow:"auto"}}>
            {chatMessages.slice(-8).map((m,i)=>(
              <div key={i} style={{marginBottom:4,borderLeft:m.isYou?`2px solid ${C.cyan}`:"none",paddingLeft:m.isYou?6:0}}>
                <span style={{fontSize:9,fontWeight:700,color:m.c}}>{m.u}</span>
                <span style={{fontSize:9,color:m.isYou?C.text:C.text2,marginLeft:4}}>{m.m}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:2,padding:"4px 8px",borderTop:`1px solid ${C.border}`}}>
            {["🔥","😂","🤯","👏","💀","❤️","⚽","🏆"].map((e,i)=>(
              <div key={i} onClick={()=>sendChat(e)} style={{width:26,height:24,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",background:`${C.text3}06`}}>{e}</div>
            ))}
          </div>
          <div style={{display:"flex",gap:5,padding:"5px 8px 8px",borderTop:`1px solid ${C.border}`}}>
            <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendChat();}} placeholder="Say something..." style={{flex:1,padding:"6px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.03)",color:C.text,fontSize:10,outline:"none",fontFamily:"inherit"}}/>
            <div onClick={()=>sendChat()} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",background:`${C.cyan}12`,border:`1px solid ${C.cyan}20`,fontSize:10,fontWeight:700,color:C.cyan}}>Send</div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Zone Focus Panel Content (per zone) ── */
  const renderFocusContent = (viewKey) => {
    if (viewKey === "arcade") return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
          {PLAY_GAMES.map(g=>(
            <div key={g.id} onClick={()=>{setZone("arcade");setArenaView("hub");setSelectedGame(g);}} style={{textAlign:"center",padding:"8px 4px",borderRadius:10,background:`${g.color}06`,border:`1px solid ${g.color}10`,position:"relative",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{fontSize:20,filter:`drop-shadow(0 0 5px ${g.color}40)`,marginBottom:3}}>{g.emoji}</div>
              <div style={{fontSize:8,fontWeight:700,color:g.color}}>{g.name.split(" ")[0]}</div>
              <div style={{fontSize:7,color:C.text3,marginTop:1}}>{g.type}</div>
              {g.hot ? <div style={{position:"absolute",top:3,right:3,fontSize:7,fontWeight:800,color:C.red,padding:"1px 4px",borderRadius:3,background:`${C.red}15`}}>HOT</div> : null}
            </div>
          ))}
        </div>
        <div style={{padding:"8px 10px",borderRadius:10,background:`${C.cyan}04`,border:`1px solid ${C.cyan}08`,marginBottom:8}}>
          <div style={{fontSize:9,fontWeight:700,color:C.cyan,marginBottom:4}}>🔥 TRENDING NOW</div>
          <div style={{fontSize:11,fontWeight:600,color:C.text}}>Wild West Duel · 234 playing · Reaction</div>
        </div>
      </div>
    );
    if (viewKey === "stage") return (
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {SHOW_GAMES.map(g=>(
          <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:`${g.color}05`,border:`1px solid ${g.color}10`}}>
            <span style={{fontSize:24,filter:`drop-shadow(0 0 4px ${g.color}40)`}}>{g.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text}}>{g.name}</div>
              <div style={{fontSize:9,color:C.text3,marginTop:2}}>{g.type} · 👥{g.players}</div>
            </div>
            {g.live ? <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:6,background:`${C.red}12`}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:9,fontWeight:700,color:C.red}}>LIVE</span>
            </div> : null}
          </div>
        ))}
        <div style={{padding:"8px 10px",borderRadius:10,background:`${C.gold}04`,border:`1px solid ${C.gold}08`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.gold}}>🔥 UP NEXT</div>
          <div style={{fontSize:10,color:C.text,marginTop:2}}>Vibe Check WC Edition in 12 min</div>
        </div>
      </div>
    );
    if (viewKey === "oracle") return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
          {PREDICT_TYPES.map(p=>(
            <div key={p.id} style={{textAlign:"center",padding:"8px 4px",borderRadius:10,background:`${p.color}06`,border:`1px solid ${p.color}10`}}>
              <div style={{fontSize:18,filter:`drop-shadow(0 0 4px ${p.color}40)`,marginBottom:2}}>{p.emoji}</div>
              <div style={{fontSize:8,fontWeight:700,color:p.color}}>{p.name.split(" ")[0]}</div>
              <div style={{fontSize:7,color:C.text3}}>{p.desc}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:1,marginBottom:6}}>TODAY&apos;S MATCHES</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {MATCHES.map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:10,background:`${C.purple}04`,border:`1px solid ${C.purple}08`}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text}}>{m.home}</div>
              <div style={{fontSize:9,color:C.text3}}>vs</div>
              <div style={{fontSize:12,fontWeight:700,color:C.text}}>{m.away}</div>
              <div style={{fontSize:9,color:C.text3}}>{m.time}</div>
              {m.hot ? <div style={{fontSize:7,fontWeight:800,color:C.red,padding:"1px 5px",borderRadius:3,background:`${C.red}12`}}>HOT</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
    if (viewKey === "wall") return (
      <div>
        <div style={{marginBottom:12}}>
          {LEADERBOARD.slice(0,5).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,marginBottom:4,background:p.isYou?`${C.cyan}06`:"transparent",border:p.isYou?`1px solid ${C.cyan}15`:`1px solid transparent`}}>
              <span style={{fontSize:16,width:24,textAlign:"center"}}>{p.place}</span>
              <span style={{fontSize:16}}>{p.emoji}</span>
              <div style={{flex:1,fontSize:12,fontWeight:p.isYou?700:500,color:p.isYou?C.cyan:C.text}}>{p.name}{p.isYou?" (You)":""}</div>
              <div style={{fontSize:10,fontWeight:700,color:C.text3,fontFamily:"'Courier New',monospace"}}>{(p.score/1000).toFixed(0)}K</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:1,marginBottom:6}}>YOUR BADGES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {BADGES.map((b,i)=>(
            <div key={i} style={{textAlign:"center",padding:"6px 4px",borderRadius:8,background:b.earned?`${C.orange}06`:`${C.text3}04`,border:`1px solid ${b.earned?C.orange+"10":C.text3+"06"}`}}>
              <div style={{fontSize:18,opacity:b.earned?1:0.25,filter:b.earned?"none":"grayscale(1)"}}>{b.emoji}</div>
              <div style={{fontSize:7,fontWeight:600,color:b.earned?C.text:C.text3,marginTop:2}}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
    if (viewKey === "worldcup") return (
      <div>
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontFamily:"'Courier New',monospace",fontSize:36,fontWeight:900,color:C.pink,animation:"countPulse 2s ease-in-out infinite"}}>{wcDays}</div>
          <div style={{fontSize:10,color:C.text3,letterSpacing:2,fontWeight:700}}>DAYS UNTIL KICKOFF</div>
          <div style={{fontSize:11,color:C.text2,marginTop:4}}>48 teams · 104 matches · 16 cities</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>
          {[{l:"Bracket Challenge",e:"🗓️",c:C.lime,d:"Predict the whole tournament"},{l:"Golden Boot",e:"⭐",c:C.gold,d:"Who scores most?"},{l:"Country LB",e:"🌍",c:C.cyan,d:"Represent your nation"},{l:"WC Pass",e:"🎫",c:C.pink,d:"Exclusive rewards"}].map((f,i)=>(
            <div key={i} onClick={()=>notify(`${f.l} — Opening soon!`,f.c)} style={{padding:"12px 10px",borderRadius:14,textAlign:"center",cursor:"pointer",background:`${f.c}05`,border:`1px solid ${f.c}10`}}>
              <div style={{fontSize:24,marginBottom:4,filter:`drop-shadow(0 0 6px ${f.c}40)`}}>{f.e}</div>
              <div style={{fontSize:10,fontWeight:800,color:f.c}}>{f.l}</div>
              <div style={{fontSize:8,color:C.text3,marginTop:2}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    );
    return null;
  };

  /* ── Zone Focus View (walked to a kiosk) ── */
  const renderZoneFocus = (viewKey) => {
    const zoneMap = {arcade:Z.arcade,stage:Z.stage,oracle:Z.oracle,wall:Z.wall,worldcup:{primary:C.gold,name:"World Cup 2026",icon:"⚽",sub:"Limited Event"}};
    const z = zoneMap[viewKey];
    if (!z) return null;
    const enterZone = viewKey === "worldcup" ? ()=>notify("World Cup hub coming soon!",C.gold) : ()=>{setZone(viewKey);setArenaView("hub");};

    return (
      <div style={{position:"fixed",inset:0,overflow:"hidden"}}>
        {/* Background video — FULL SCREEN (falls back to image poster) */}
        <div style={{position:"absolute",inset:0,zIndex:0}}>
          <video autoPlay loop muted playsInline poster={ARENA_IMAGES[viewKey]} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}>
            <source src={ARENA_VIDEOS[viewKey]} type="video/mp4"/>
          </video>
          {/* Subtle bottom gradient only — let video dominate */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(5,5,16,0.4) 75%, rgba(5,5,16,0.7) 90%)"}}/>
        </div>

        {/* Back button — below header + ticker */}
        <div style={{position:"absolute",top:72,left:14,zIndex:12}}>
          <div onClick={walkBack} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",padding:"7px 14px",borderRadius:100,...GLASS_CLEAR}}>
            <span style={{fontSize:12,color:C.text2}}>←</span>
            <span style={{fontSize:11,fontWeight:600,color:C.text2}}>Lobby</span>
          </div>
        </div>

        {/* ═══ BOTTOM HUD — pushes up when chat is open ═══ */}
        <div style={{position:"absolute",bottom:chatPanel?248:62,left:10,right:10,zIndex:10,animation:"panelSlideUp 0.4s ease 0.15s both",transition:"bottom 0.3s ease"}}>
          {/* Info card — readable liquid glass */}
          <div style={{borderRadius:20,overflow:"hidden",marginBottom:8,...GLASS_CARD}}>
            <div style={{padding:"14px 16px"}}>
              {/* Zone header row */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{fontSize:26,filter:`drop-shadow(0 0 10px ${z.primary}50)`}}>{z.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:900,color:z.primary}}>{z.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:1}}>
                    <span style={{fontSize:9,color:C.text3}}>{z.sub}</span>
                    {viewKey !== "worldcup" ? <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <div style={{width:4,height:4,borderRadius:"50%",background:C.green}}/>
                      <span style={{fontSize:9,fontWeight:600,color:C.text3}}>{viewKey==="arcade"?"856 playing":viewKey==="stage"?"2 LIVE":viewKey==="oracle"?"104 open":"#3 rank"}</span>
                    </div> : null}
                  </div>
                </div>
              </div>
              {/* Scrollable content — compact */}
              <div style={{maxHeight:chatPanel?"15vh":"28vh",overflow:"auto",marginBottom:10,transition:"max-height 0.3s ease"}}>
                {renderFocusContent(viewKey)}
              </div>
              {/* Enter button — centered */}
              <div style={{display:"flex",justifyContent:"center"}}>
                <div onClick={enterZone} style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  padding:"8px 24px",borderRadius:100,cursor:"pointer",
                  ...GLASS_CLEAR,
                  border:`1px solid ${z.primary}30`,
                  boxShadow:`0 0 16px ${z.primary}10, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}>
                  <span style={{fontSize:12,fontWeight:800,color:z.primary,letterSpacing:0.5}}>{"Enter "+z.name}</span>
                  <span style={{fontSize:12,color:z.primary}}>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM NAV — same as lobby ═══ */}
        <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:12}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:3,padding:"4px 5px",borderRadius:100,
            ...GLASS_CLEAR,
          }}>
            {[{id:"control",l:"Control",i:"🎛",c:C.cyan},{id:"arena",l:"Arena",i:"🎮",c:C.cyan},{id:"live",l:"Live",i:"📡",c:C.pink},{id:"me",l:"Me",i:"👤",c:C.purple}].map(t=>{
              const active = tab===t.id;
              return (
                <div key={t.id} onClick={()=>{if(t.id!=="arena"){notify("Coming Soon — Arena Demo Only",C.cyan);return;}setTab(t.id);setZone(null);setArenaView("hub");}} style={{
                  display:"flex",alignItems:"center",gap:active?5:0,
                  padding:active?"7px 14px":"7px 10px",
                  borderRadius:100,cursor:"pointer",
                  background:active?`${t.c}20`:"transparent",
                  transition:"all 0.3s ease",position:"relative",
                }}>
                  <span style={{fontSize:16,opacity:active?1:0.4,transition:"opacity 0.3s"}}>{t.i}</span>
                  {active ? <span style={{fontSize:11,fontWeight:700,color:t.c,whiteSpace:"nowrap"}}>{t.l}</span> : null}
                  {t.id==="live" ? <div style={{position:"absolute",top:3,right:active?8:4,width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ── Hub View (the corridor) ── */
  const renderArenaHub = () => {
    const s = stageData[mainStage];
    const isHub = arenaView === "hub";

    /* Walk transition overlay */
    const walkOverlay = walking ? (
      <div style={{position:"fixed",inset:0,zIndex:200,pointerEvents:"all",background:C.bg,animation:"walkFlash 0.45s ease both"}}/>
    ) : null;

    /* If viewing a zone focus */
    if (!isHub) {
      return (
        <div style={{margin:"-6px -0px -0px",position:"relative",zIndex:5}}>
          {walkOverlay}
          {renderZoneFocus(arenaView)}
        </div>
      );
    }

    /* ══════ HUB VIEW ══════ */

    /* Loading screen — cinematic arena entrance */
    if (arenaLoading) {
      return (
        <div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <img src={ARENA_IMAGES.hub} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0,animation:"loadingImageReveal 1.8s ease 0.2s forwards"}}/>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(5,5,16,0.6) 70%, ${C.bg} 100%)`}}/>
          <div style={{position:"relative",zIndex:2,textAlign:"center",animation:"loadingTextReveal 1s ease 0.4s both"}}>
            <div style={{fontSize:36,fontWeight:900,letterSpacing:12,color:C.cyan,textShadow:`0 0 15px ${C.cyan}, 0 0 30px ${C.cyan}80, 0 0 60px ${C.cyan}40`}}>ARENA</div>
            <div style={{fontSize:10,letterSpacing:6,color:C.text3,marginTop:6,fontWeight:600}}>ENTERING THE EXPERIENCE</div>
            <div style={{marginTop:20,width:120,height:2,borderRadius:1,background:`${C.text3}15`,margin:"20px auto 0",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:1,background:`linear-gradient(90deg, ${C.cyan}, ${C.gold})`,animation:"loadingBar 1.5s ease 0.3s forwards",width:0}}/>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{position:"fixed",inset:0,zIndex:5,overflow:"hidden"}}>
        {walkOverlay}

        {/* ═══ BACKGROUND VIDEO (falls back to image poster) ═══ */}
        <div style={{position:"absolute",inset:"-2% -10%",width:"120%",height:"104%",zIndex:0}}>
          <video autoPlay loop muted playsInline poster={ARENA_IMAGES.hub} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}>
            <source src={ARENA_VIDEOS.hub} type="video/mp4"/>
          </video>
          {/* Cali Clear logo — right above the World Cup arch */}
          <div style={{position:"absolute",top:"42%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}>
            {/* Outer glow pulse */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:200,height:140,borderRadius:"50%",background:`radial-gradient(ellipse, ${C.gold}12, transparent 65%)`,animation:"breathe 3s ease-in-out infinite"}}/>
            {/* Inner bright glow */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:130,height:90,borderRadius:"50%",background:`radial-gradient(ellipse, ${C.gold}20, transparent 70%)`,animation:"breathe 4s ease-in-out 1s infinite"}}/>
            {/* Logo */}
            <img src="assets/arena/cali-clear-logo.png" alt="" style={{
              position:"relative",width:110,height:"auto",display:"block",
              filter:`drop-shadow(0 0 10px ${C.gold}70) drop-shadow(0 0 24px ${C.gold}40) drop-shadow(0 0 48px ${C.gold}20)`,
            }}/>
          </div>
        </div>

        {/* ═══ CALI CLEAR LOGO — at the red circle location ═══ */}

        {/* ═══ JUMBOTRON — taller for visual balance ═══ */}
        <div style={{position:"absolute",top:72,left:18,right:18,zIndex:10,animation:"arenaFadeIn 0.6s ease 0.1s both"}}>
          <div style={{
            borderRadius:22,overflow:"hidden",cursor:"pointer",
            ...GLASS_CARD,
          }} onClick={s.act}>
            <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,255,255,0.04), transparent 60%)",pointerEvents:"none"}}/>
            <div style={{position:"relative",padding:"18px 18px 16px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:100,background:`${s.tagColor}15`,marginBottom:8}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:s.tagColor,boxShadow:`0 0 6px ${s.tagColor}`,animation:"pulse 1.5s infinite"}}/>
                <span style={{fontSize:8,fontWeight:800,color:s.tagColor,letterSpacing:1.5}}>{s.tag}</span>
              </div>
              <div style={{fontSize:20,fontWeight:900,color:C.text,lineHeight:1.15}}>{s.title}</div>
              <div style={{fontSize:11,color:C.text2,marginTop:5,fontWeight:500}}>{s.sub}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}>
                <div style={{padding:"7px 16px",borderRadius:100,background:`${s.ctaColor}12`,border:`1px solid ${s.ctaColor}25`,fontSize:11,fontWeight:800,color:s.ctaColor}}>{s.cta}</div>
                <div style={{display:"flex",gap:4}}>
                  {[0,1,2].map(i=>(<div key={i} onClick={(e)=>{e.stopPropagation();setMainStage(i);}} style={{width:i===mainStage?14:5,height:4,borderRadius:2,background:i===mainStage?C.text:`${C.text3}30`,transition:"all 0.4s",cursor:"pointer"}}/>))}
                </div>
              </div>
              <div key={mainStage} style={{position:"absolute",bottom:0,left:0,height:2,borderRadius:1,background:`linear-gradient(90deg, transparent, ${s.ctaColor}50)`,animation:"jumbotronProgress 5s linear forwards"}}/>
            </div>
          </div>
          {/* ═══ STATUS BAR — centered, tight gap below jumbotron ═══ */}
          <div style={{display:"flex",justifyContent:"center",marginTop:6,animation:"arenaFadeIn 0.6s ease 0.2s both"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:100,
              ...GLASS_CARD,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:3}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}60`,animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:8,fontWeight:600,color:C.text3}}>In Arena</span>
                <span style={{fontSize:9,fontWeight:700,color:C.text2}}>{playersNow.toLocaleString()}</span>
              </div>
              <span style={{width:1,height:10,background:C.text3+"30"}}/>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                <span style={{fontSize:8,fontWeight:600,color:C.text3}}>Level</span>
                <span style={{fontSize:9,fontWeight:700,color:C.gold}}>{USER.level}</span>
              </div>
              <span style={{width:1,height:10,background:C.text3+"30"}}/>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                <span style={{fontSize:8,fontWeight:600,color:C.text3}}>Puff</span>
                <span style={{fontSize:9,fontWeight:700,color:C.orange}}>🔥5</span>
              </div>
              <span style={{width:1,height:10,background:C.text3+"30"}}/>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                <span style={{fontSize:8,fontWeight:600,color:C.text3}}>Blinker</span>
                <span style={{fontSize:9,fontWeight:700,color:C.green}}>👥{friendsOnline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ INVISIBLE TAP ZONES ═══ */}
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:60,zIndex:10,pointerEvents:"none"}}>
          {HUB_TAP_ZONES.map(t => (
            <div key={t.key} onClick={()=>walkTo(t.key)} style={{
              position:"absolute",
              top:t.top, left:t.left||undefined, right:t.right||undefined,
              width:t.width, height:t.height,
              cursor:"pointer",pointerEvents:"auto",
              borderRadius:8,
            }}/>
          ))}
        </div>

        {/* ═══ BOTTOM NAV — Floating pill dock ═══ */}
        <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:3,padding:"4px 5px",borderRadius:100,
            ...GLASS_CLEAR,
          }}>
            {[{id:"control",l:"Control",i:"🎛",c:C.cyan},{id:"arena",l:"Arena",i:"🎮",c:C.cyan},{id:"live",l:"Live",i:"📡",c:C.pink},{id:"me",l:"Me",i:"👤",c:C.purple}].map(t=>{
              const active = tab===t.id;
              return (
                <div key={t.id} onClick={()=>{if(t.id!=="arena"){notify("Coming Soon — Arena Demo Only",C.cyan);return;}setTab(t.id);setZone(null);setArenaView("hub");}} style={{
                  display:"flex",alignItems:"center",gap:active?5:0,
                  padding:active?"7px 14px":"7px 10px",
                  borderRadius:100,cursor:"pointer",
                  background:active?`${t.c}20`:"transparent",
                  transition:"all 0.3s ease",position:"relative",
                }}>
                  <span style={{fontSize:16,opacity:active?1:0.4,transition:"opacity 0.3s"}}>{t.i}</span>
                  {active ? <span style={{fontSize:11,fontWeight:700,color:t.c,whiteSpace:"nowrap"}}>{t.l}</span> : null}
                  {t.id==="live" ? <div style={{position:"absolute",top:3,right:active?8:4,width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat button + inline chat are now universal at root level */}
      </div>
    );
  };

  // ═════════════════════════════════════════
  // ── RENDER: ZONE DETAIL VIEWS ──
  // ═════════════════════════════════════════
  const renderZoneHeader = (zKey) => {
    const z = Z[zKey];
    return (
      <div style={{padding:"0 14px",marginBottom:16}}>
        <div onClick={()=>{setZone(null);setSelectedGame(null);setArenaView("hub");}} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:12,padding:"6px 12px",borderRadius:8,background:`${C.text3}06`,border:`1px solid ${C.border}`}}>
          <span style={{fontSize:14,color:C.text2}}>←</span>
          <span style={{fontSize:11,fontWeight:600,color:C.text2}}>Arena</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:32,filter:`drop-shadow(0 0 12px ${z.primary}50)`}}>{z.icon}</div>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:z.primary,letterSpacing:-0.3}}>{z.name}</div>
            <div style={{fontSize:11,color:C.text3}}>{z.sub}</div>
          </div>
        </div>
      </div>
    );
  };

  // Fun leaderboard stats data
  const ARCADE_LEADERBOARD = [
    {name:"ChillMaster42",emoji:"👑",stat:"847 goals",detail:"Perfect puff rate: 72%",color:C.gold,badge:"🐐 GOAT"},
    {name:"VibeKing",emoji:"😎",stat:"623 goals",detail:"Blinker count: 0 (legend)",color:C.pink,badge:"🧘 Zen"},
    {name:"NeonQueen",emoji:"👸",stat:"591 goals",detail:"Longest puff streak: 14",color:C.purple,badge:"👸 Queen"},
    {name:"Steve",emoji:"🌟",stat:"420 goals",detail:"Blinker count: 69 (nice)",color:C.cyan,badge:"💨 Stoner",you:true},
    {name:"BlazedPanda",emoji:"🐼",stat:"318 goals",detail:"Most misses: 47 (lol)",color:C.green,badge:"🎯 Tryhard"},
    {name:"PuffDaddy",emoji:"💨",stat:"290 goals",detail:"Avg puff: 2.8s (precise)",color:C.orange,badge:"🫁 Lungs"},
    {name:"CloudNine99",emoji:"☁️",stat:"245 goals",detail:"Blinker rate: 31% 💀",color:C.blue,badge:"💀 Blinker King"},
    {name:"TheLobster",emoji:"🦞",stat:"199 goals",detail:"Win rate: exactly 50%",color:C.red,badge:"⚖️ Balanced"},
  ];
  const FUN_STATS = [
    {label:"Total Blinkers Today",value:"1,247",emoji:"💀",color:C.red,sub:"Players' lungs: questionable"},
    {label:"Longest Perfect Streak",value:"23",emoji:"💨",color:C.green,sub:"by ChillMaster42"},
    {label:"Funniest Miss",value:"0.1s puff",emoji:"😂",color:C.gold,sub:"Ball didn't even move"},
    {label:"Most Rematches",value:"47",emoji:"🔄",color:C.cyan,sub:"BlazedPanda vs AI (addiction?)"},
  ];

  const renderArcade = () => (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:`radial-gradient(circle, ${Z.arcade.glow.replace("0.35","0.1")}, transparent 70%)`,pointerEvents:"none"}}/>
      {renderZoneHeader("arcade")}

      {/* ═══ TAB BAR ═══ */}
      <div style={{display:"flex",gap:0,margin:"0 14px 12px",borderRadius:12,overflow:"hidden",...GLASS_CLEAR}}>
        {[{id:"games",label:"🎮 Games",count:PLAY_GAMES.length},{id:"leaderboard",label:"🏆 Leaderboard",count:null}].map(t=>(
          <div key={t.id} onClick={()=>setArcadeTab(t.id)} style={{
            flex:1,padding:"10px 0",textAlign:"center",cursor:"pointer",
            background:arcadeTab===t.id?`${C.cyan}12`:"transparent",
            borderBottom:arcadeTab===t.id?`2px solid ${C.cyan}`:`2px solid transparent`,
            transition:"all 0.2s",
          }}>
            <div style={{fontSize:11,fontWeight:arcadeTab===t.id?800:600,color:arcadeTab===t.id?C.cyan:C.text3}}>
              {t.label} {t.count!==null?<span style={{fontSize:8,opacity:0.7}}>({t.count})</span>:null}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ GAMES TAB ═══ */}
      {arcadeTab==="games" && (
        <div style={{padding:"0 14px",animation:"fadeIn 0.3s ease"}}>
          {PLAY_GAMES.map((g,i)=>(
            <div key={g.id} onClick={()=>setSelectedGame(g)} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:16,marginBottom:8,cursor:"pointer",
              background:`linear-gradient(135deg, ${g.color}08, ${C.bg2} 70%)`,
              border:`1px solid ${g.color}15`,
              boxShadow:`0 2px 12px ${g.color}06`,
              transition:"all 0.2s",animation:`fadeIn 0.3s ease ${i*0.05}s both`,
            }}>
              <div style={{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
                background:`radial-gradient(circle, ${g.color}15, ${g.color}05)`,border:`1px solid ${g.color}20`,
                flexShrink:0,filter:`drop-shadow(0 0 8px ${g.color}30)`,boxShadow:`0 0 16px ${g.color}10`}}>
                {g.emoji}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14,fontWeight:800,color:C.text}}>{g.name}</span>
                  {g.hot && <span style={{fontSize:7,fontWeight:800,color:C.red,padding:"1px 5px",borderRadius:4,background:`${C.red}15`,border:`1px solid ${C.red}20`,animation:"pulse 2s infinite"}}>🔥 HOT</span>}
                </div>
                <div style={{fontSize:10,color:C.text3,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.desc}</div>
                <div style={{display:"flex",gap:4,marginTop:5}}>
                  <span style={{fontSize:8,fontWeight:700,color:g.color,padding:"2px 7px",borderRadius:6,...LG.tinted(g.color)}}>{g.type}</span>
                  <span style={{fontSize:8,fontWeight:600,color:C.text3,padding:"2px 7px",borderRadius:6,background:`${C.text3}06`}}>👥 {g.players}</span>
                  <span style={{fontSize:8,fontWeight:600,color:C.text3,padding:"2px 7px",borderRadius:6,background:`${C.text3}06`}}>⏱ {g.time}</span>
                </div>
              </div>
              <div style={{fontSize:16,color:`${g.color}40`,fontWeight:300}}>›</div>
            </div>
          ))}
          {/* Active players */}
          <div style={{padding:"10px 14px",borderRadius:14,marginBottom:8,...LG.tinted(C.cyan)}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:9,fontWeight:800,color:C.cyan}}>🟢 856 PLAYING NOW</div>
                <div style={{fontSize:8,color:C.text3,marginTop:2}}>Wild West Duel trending · 234 active</div>
              </div>
              <div style={{fontSize:8,fontWeight:700,color:C.gold,padding:"3px 8px",borderRadius:6,...LG.tinted(C.gold)}}>🏆 3 Tournaments</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEADERBOARD TAB ═══ */}
      {arcadeTab==="leaderboard" && (
        <div style={{padding:"0 14px",animation:"fadeIn 0.3s ease"}}>
          {/* Fun community stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {FUN_STATS.map((s,i)=>(
              <div key={i} style={{padding:"10px",borderRadius:12,...LG.tinted(s.color),animation:`fadeIn 0.3s ease ${i*0.1}s both`}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <span style={{fontSize:16}}>{s.emoji}</span>
                  <span style={{fontSize:16,fontWeight:900,color:s.color}}>{s.value}</span>
                </div>
                <div style={{fontSize:8,fontWeight:700,color:C.text}}>{s.label}</div>
                <div style={{fontSize:7,color:C.text3,marginTop:1,fontStyle:"italic"}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Player rankings */}
          <div style={{fontSize:10,fontWeight:800,color:C.gold,marginBottom:8}}>🏆 ALL-TIME ARCADE RANKINGS</div>
          {ARCADE_LEADERBOARD.map((p,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,marginBottom:6,
              background:p.you?`linear-gradient(135deg, ${C.cyan}10, ${C.cyan}04)`:`${C.bg2}`,
              border:`1px solid ${p.you?C.cyan+"25":C.border}`,
              animation:`fadeIn 0.3s ease ${i*0.05}s both`,
            }}>
              <div style={{width:24,fontSize:i<3?14:10,fontWeight:800,color:i<3?C.gold:C.text3,textAlign:"center"}}>
                {i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}
              </div>
              <span style={{fontSize:18}}>{p.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:11,fontWeight:p.you?800:700,color:p.you?C.cyan:C.text}}>{p.name}</span>
                  <span style={{fontSize:7,fontWeight:700,color:p.color,padding:"1px 5px",borderRadius:4,...LG.tinted(p.color)}}>{p.badge}</span>
                </div>
                <div style={{fontSize:8,color:C.text3,marginTop:1}}>{p.detail}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,fontWeight:800,color:p.you?C.cyan:C.text2,fontFamily:"monospace"}}>{p.stat.split(" ")[0]}</div>
                <div style={{fontSize:7,color:C.text3}}>{p.stat.split(" ").slice(1).join(" ")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{height:80}}/>
    </div>
  );

  const renderStage = () => (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:`radial-gradient(circle, ${Z.stage.glow.replace("0.35","0.1")}, transparent 70%)`,pointerEvents:"none"}}/>
      {renderZoneHeader("stage")}
      <div style={{padding:"0 14px"}}>
        {SHOW_GAMES.map(g=>(
          <div key={g.id} onClick={()=>{if(g.id==="vibecheck")setShowVibeCheck(true);else if(g.id==="spinwin"){setSelectedGame(g);doSpin();}else notify(`${g.name} — tap to join!`,g.color);}} style={{
            padding:"16px",borderRadius:16,marginBottom:10,cursor:"pointer",position:"relative",overflow:"hidden",
            background:`radial-gradient(ellipse at 0% 50%, ${g.color}08, ${C.bg2} 60%)`,
            border:`1px solid ${g.color}15`,transition:"all 0.3s",
          }}>
            {g.live && <div style={{position:"absolute",top:12,right:12,display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:9,fontWeight:700,color:C.red}}>LIVE</span></div>}
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:34,filter:`drop-shadow(0 0 8px ${g.color}40)`}}>{g.emoji}</div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:C.text}}>{g.name}</div>
                <div style={{fontSize:11,color:C.text3,marginTop:2}}>{g.desc}</div>
                <div style={{display:"flex",gap:4,marginTop:6}}>
                  <span style={{fontSize:9,fontWeight:600,color:g.color,padding:"2px 6px",borderRadius:4,background:`${g.color}10`}}>{g.type}</span>
                  <span style={{fontSize:9,color:C.text3,padding:"2px 6px",borderRadius:4,background:`${C.text3}08`}}>👥{g.players}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{height:80}}/>
    </div>
  );

  const renderOracle = () => (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:`radial-gradient(circle, ${Z.oracle.glow.replace("0.35","0.1")}, transparent 70%)`,pointerEvents:"none"}}/>
      {renderZoneHeader("oracle")}
      <div style={{padding:"0 14px"}}>
        {/* Predict Types */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {PREDICT_TYPES.map(p=>(
            <div key={p.id} onClick={()=>notify(`${p.name}`,p.color)} style={{
              padding:"14px 8px",borderRadius:14,textAlign:"center",cursor:"pointer",
              background:`${(p.color||C.purple)}06`,border:`1px solid ${(p.color||C.purple)}12`,transition:"all 0.3s",
            }}>
              <div style={{fontSize:24,marginBottom:4,filter:`drop-shadow(0 0 6px ${(p.color||C.purple)}40)`}}>{p.emoji}</div>
              <div style={{fontSize:10,fontWeight:800,color:p.color||C.purple}}>{p.name}</div>
              <div style={{fontSize:8,color:C.text3,marginTop:2}}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Match Predictions */}
        <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:10}}>Today's Matches</div>
        {MATCHES.map(m=>(
          <div key={m.id} style={{
            padding:"14px",borderRadius:14,marginBottom:10,
            background:predictLocked[m.id]?`${C.lime}04`:C.bg2,
            border:`1px solid ${predictLocked[m.id]?C.lime+"20":C.border}`,position:"relative",
          }}>
            {m.hot && <div style={{position:"absolute",top:8,right:10,padding:"2px 6px",borderRadius:3,background:`${C.red}15`,fontSize:8,fontWeight:800,color:C.red}}>🔥HOT</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:9,fontWeight:700,color:C.text3,padding:"2px 6px",borderRadius:3,background:`${C.text3}08`}}>Group {m.group}</span>
              <span style={{fontSize:10,color:C.text3}}>{m.time}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:700,color:C.text,flex:1,textAlign:"right"}}>{m.home}</span>
              <span style={{fontSize:10,color:C.text3,fontWeight:800}}>VS</span>
              <span style={{fontSize:14,fontWeight:700,color:C.text,flex:1}}>{m.away}</span>
            </div>
            {predictLocked[m.id] ? (
              <div style={{textAlign:"center",padding:"6px",borderRadius:8,background:`${C.lime}08`}}>
                <span style={{fontSize:11,fontWeight:700,color:C.lime}}>✓ {predictLocked[m.id].pick} · {predictLocked[m.id].bet} coins</span>
              </div>
            ) : (
              <div>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  {["Home","Draw","Away"].map((o,j)=>(
                    <div key={j} onClick={()=>{setSelectedMatch(m.id);setSelectedOutcome(j);}} style={{
                      flex:1,padding:"7px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                      background:selectedMatch===m.id&&selectedOutcome===j?`${C.lime}12`:`${C.text3}05`,
                      border:`1px solid ${selectedMatch===m.id&&selectedOutcome===j?C.lime+"35":C.border}`,transition:"all 0.2s",
                    }}>
                      <div style={{fontSize:10,fontWeight:600,color:selectedMatch===m.id&&selectedOutcome===j?C.lime:C.text2}}>{o}</div>
                      <div style={{fontSize:13,fontWeight:800,color:selectedMatch===m.id&&selectedOutcome===j?C.lime:C.text,marginTop:1}}>×{m.odds[j]}</div>
                    </div>
                  ))}
                </div>
                {selectedMatch===m.id && selectedOutcome!==null && (
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:4,background:`${C.text3}08`,borderRadius:8,padding:"6px 8px"}}>
                      <span style={{fontSize:10,color:C.text3}}>🪙</span>
                      <input type="number" value={betAmount} onChange={e=>setBetAmount(Math.max(10,+e.target.value))} style={{width:"100%",background:"transparent",border:"none",color:C.text,fontSize:13,fontWeight:700,outline:"none",fontFamily:"inherit"}}/>
                    </div>
                    <div onClick={()=>puffLockIn(()=>{
                      setPredictLocked(p=>({...p,[m.id]:{pick:["Home","Draw","Away"][selectedOutcome],bet:betAmount}}));
                      setCoins(c=>c-betAmount);setSelectedMatch(null);setSelectedOutcome(null);
                    })} style={{padding:"8px 16px",borderRadius:8,cursor:"pointer",background:`${C.lime}15`,border:`1px solid ${C.lime}30`,fontSize:11,fontWeight:800,color:C.lime}}>
                      💨 Lock In
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{height:80}}/>
    </div>
  );

  const renderWall = () => (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:`radial-gradient(circle, ${Z.wall.glow.replace("0.35","0.1")}, transparent 70%)`,pointerEvents:"none"}}/>
      {renderZoneHeader("wall")}
      <div style={{padding:"0 14px"}}>
        {/* Leaderboard */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:800,color:C.text}}>🏅 Leaderboard</span>
            <div style={{display:"flex",gap:4}}>
              {[{id:"global",l:"🌍"},{id:"friends",l:"👥"},{id:"weekly",l:"📅"}].map(t=>(
                <div key={t.id} onClick={()=>setLbTab(t.id)} style={{
                  width:30,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",fontSize:12,background:lbTab===t.id?`${C.gold}12`:`${C.text3}06`,
                  border:`1px solid ${lbTab===t.id?C.gold+"25":C.border}`,transition:"all 0.2s",
                }}>{t.l}</div>
              ))}
            </div>
          </div>
          <div style={{borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,background:`rgba(255,255,255,0.015)`}}>
            {LEADERBOARD.map((p,i)=>(
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                borderBottom:i<LEADERBOARD.length-1?`1px solid ${C.border}`:"none",
                background:p.isYou?`${C.cyan}06`:"transparent",
              }}>
                <div style={{width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:typeof p.place==="string"&&p.place.length>1?13:11,fontWeight:800,color:i<3?[C.gold,"#C0C0C0","#CD7F32"][i]:C.text3,background:i<3?`${[C.gold,"#C0C0C0","#CD7F32"][i]}12`:`${C.text3}08`}}>{p.place}</div>
                <span style={{fontSize:16}}>{p.emoji}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:p.isYou?C.cyan:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:9,color:C.text3}}>🔥 {p.streak} streak</div>
                </div>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:12,fontWeight:800,color:p.isYou?C.cyan:C.text2}}>{(p.score/1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>🎖 Badges</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {BADGES.map((b,i)=>(
              <div key={i} style={{padding:"12px 4px",borderRadius:12,textAlign:"center",background:b.earned?`${C.gold}06`:`${C.text3}04`,border:`1px solid ${b.earned?C.gold+"15":C.text3+"08"}`,opacity:b.earned?1:0.4}}>
                <div style={{fontSize:22,marginBottom:2,filter:b.earned?`drop-shadow(0 0 4px ${C.gold}40)`:"grayscale(1)"}}>{b.emoji}</div>
                <div style={{fontSize:8,fontWeight:700,color:b.earned?C.gold:C.text3}}>{b.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Stats */}
        <div style={{padding:"14px",borderRadius:14,background:C.bg2,border:`1px solid ${C.border}`,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:10}}>📊 Your Stats</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{l:"Games",v:"142",c:C.cyan},{l:"Win Rate",v:"67%",c:C.green},{l:"Best Streak",v:"12",c:C.gold}].map((s,i)=>(
              <div key={i} style={{textAlign:"center",padding:"8px",borderRadius:10,background:`${s.c}06`,border:`1px solid ${s.c}10`}}>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:8,color:C.text3,fontWeight:600,letterSpacing:0.5,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Friends Activity */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:10}}>👥 Friends Activity</div>
          {[
            {name:"Minh Anh",action:"just won Final Kick 🏆",time:"2m ago",emoji:"⚽"},
            {name:"Hà Linh",action:"predicted USA vs Mexico",time:"5m ago",emoji:"◆"},
            {name:"Đức Trung",action:"is playing Balloon Pop",time:"now",emoji:"🎈",live:true},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
              <div style={{width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:`${C.purple}08`,border:`1px solid ${C.purple}15`,fontSize:14}}>{f.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.text}}><strong>{f.name}</strong> <span style={{color:C.text3}}>{f.action}</span></div>
                <div style={{fontSize:9,color:C.text3}}>{f.time}</div>
              </div>
              {f.live && <div onClick={()=>notify("👀 Spectating...",C.cyan)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:`${C.cyan}08`,border:`1px solid ${C.cyan}15`,fontSize:9,fontWeight:700,color:C.cyan}}>Watch</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{height:80}}/>
    </div>
  );

  // ═════════════════════════════════════════
  // ── RENDER: GAME OVERLAYS ──
  // ═════════════════════════════════════════
  const overlayStyle = {position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,background:"rgba(5,5,16,0.97)",backdropFilter:"blur(16px)",display:"flex",flexDirection:"column",overflowY:"auto"};
  const overlayBack = (onClose) => (
    <div onClick={onClose} style={{position:"absolute",top:16,left:16,zIndex:10,cursor:"pointer",padding:"6px 12px",borderRadius:8,background:`${C.text3}08`,border:`1px solid ${C.border}`}}>
      <span style={{fontSize:12,fontWeight:600,color:C.text2}}>← Back</span>
    </div>
  );

  // Game detail / matchmaking
  const renderGameOverlay = () => {
    if(matchmaking) {
      return (
        <div style={overlayStyle}>{overlayBack(()=>setMatchmaking(null))}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:20}}>
            <div style={{fontSize:48,marginBottom:16,animation:"breathe 1.5s infinite"}}>{matchmaking.game.emoji}</div>
            <div style={{fontSize:18,fontWeight:900,color:C.text,marginBottom:8}}>{matchmaking.game.name}</div>
            {matchmaking.stage==="searching" && <div>
              <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:12}}>
                <span style={{fontSize:9,fontWeight:700,color:getDevicePool().color,padding:"2px 8px",borderRadius:20,background:`${getDevicePool().color}12`,border:`1px solid ${getDevicePool().color}20`}}>⚖️ {getDevicePool().label}</span>
                <span style={{fontSize:9,fontWeight:700,color:C.text3,padding:"2px 8px",borderRadius:20,background:`${C.text3}08`}}>{getDeviceShort()}</span>
              </div>
              <div style={{fontSize:13,color:C.text2,marginBottom:16}}>Finding {matchmaking.mode==="random"?"same-device":""}  opponent...</div>
              <div style={{width:32,height:32,border:`3px solid ${C.cyan}30`,borderTopColor:C.cyan,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>
            </div>}
            {matchmaking.stage==="found" && <div style={{fontSize:16,fontWeight:700,color:C.green,animation:"fadeIn 0.3s ease"}}>{matchmaking.opp}<div style={{fontSize:11,color:C.text3,marginTop:4}}>⚖️ Fair Match · Starting...</div></div>}
          </div>
        </div>
      );
    }
    if(gameActive) {
      // Wild West Duel
      if(gameActive.id==="wildwest") {
        return (
          <div style={overlayStyle}>{overlayBack(()=>{setGameActive(null);setDuelState(null);setDuelResult(null);})}
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:20}}>
              <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:20}}>🤠 WILD WEST DUEL</div>
              {duelState==="ready" && <div style={{fontSize:40,fontWeight:900,color:C.text,animation:"breathe 1s infinite"}}>READY...</div>}
              {duelState==="steady" && <div style={{fontSize:40,fontWeight:900,color:C.gold,animation:"breathe 0.8s infinite"}}>STEADY...</div>}
              {duelState==="shoot" && <div onClick={duelShoot} style={{cursor:"pointer"}}><div style={{fontSize:48,fontWeight:900,color:C.red,animation:"pulse 0.3s infinite",textShadow:`0 0 30px ${C.red}`}}>SHOOT!</div><div style={{fontSize:12,color:C.text3,marginTop:8}}>Puff NOW!</div></div>}
              {!["ready","steady","shoot","result"].includes(duelState) && duelState && <div onClick={duelShoot} style={{cursor:"pointer",fontSize:14,color:C.text3}}>Waiting...</div>}
              {duelState==="result" && duelResult && (
                <div style={{animation:"fadeIn 0.3s ease"}}>
                  {duelResult.foul ? <div style={{fontSize:28,fontWeight:900,color:C.red}}>⚠ FOUL!</div> :
                    duelResult.win ? <div><div style={{fontSize:28,fontWeight:900,color:C.green}}>🤠 YOU WIN!</div><div style={{fontSize:12,color:C.text3,marginTop:6}}>You: {duelResult.you}ms · AI: {duelResult.ai}ms</div><div style={{fontSize:12,color:C.gold,marginTop:4}}>+50 coins</div></div> :
                    <div><div style={{fontSize:28,fontWeight:900,color:C.red}}>💀 DEFEATED</div><div style={{fontSize:12,color:C.text3,marginTop:6}}>You: {duelResult.you}ms · AI: {duelResult.ai}ms</div></div>
                  }
                  <div onClick={()=>{startDuel();}} style={{marginTop:20,padding:"10px 24px",borderRadius:10,cursor:"pointer",background:`${C.gold}15`,border:`1px solid ${C.gold}30`,fontSize:13,fontWeight:700,color:C.gold}}>Rematch</div>
                </div>
              )}
            </div>
          </div>
        );
      }
      // Final Kick ⚽ — IMMERSIVE VERSION
      if(gameActive.id==="finalkick" && kickState) {
        const pool = getDevicePool();
        const inp = gameActive.activeInput;
        const inpInfo = INPUT_TYPES.find(t=>t.id===inp)||INPUT_TYPES[0];
        const isShootPhase = ["shoot","power","flight","shoot_result"].includes(kickState);
        const isSavePhase = ["save_ready","save_countdown","save_dive","save_result"].includes(kickState);
        const isResult = kickState==="shoot_result"||kickState==="save_result";
        const goalW = 290, goalH = 140;
        const zoneW = goalW/3, zoneH = goalH/2;
        const getBallPos = (z) => ({ x: KICK_ZONES[z].col * zoneW + zoneW/2, y: KICK_ZONES[z].row * zoneH + zoneH/2 });

        // Fun commentary
        const SHOOT_TAUNTS = ["Pick your poison 🎯","Where you aiming, champ? 😏","Top bins or nah? 🤔","Don't choke now 😂","AI keeper is SHOOK 🥶"];
        const GOAL_CHEERS = ["GOLAZOOO! 🔥🔥🔥","ABSOLUTE BANGER! 💥","NET GO BRRR 😤","SHEEEESH! 🥶","TOP BINS MERCHANT 👑"];
        const SAVE_TAUNTS = ["AI's got the ball... 👀","Keeper mode: ON 🧤","Don't let it in! 😬","Quick reflexes or nah? 🤣","This one's SPICY 🌶️"];
        const SAVE_CHEERS = ["DENIED! 🚫🧤","WALL MODE ACTIVATED 🧱","NOT TODAY! 😤","BRICK WALL ENERGY 💪","AI IS CRYING RN 😭"];
        const CONCEDE_REACT = ["Bruh... 💀","That one hurt 😂","AI said 'sit down' 😤","Pain. Just pain. 🥲","Keeper had lag 📡"];


        // Crowd emojis floating
        const crowdEmojis = ["🎉","🔥","😤","💨","🤣","😱","👏","🥳","💀","😂","🙌","⚡"];

        return (
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,overflow:"hidden"}}>
            {/* ═══ STADIUM BACKGROUND ═══ */}
            <div style={{position:"absolute",inset:0,background:`
              radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, rgba(127,255,0,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 40%),
              linear-gradient(180deg, #040812 0%, #0a1628 30%, #0d1f20 60%, #061210 100%)
            `}}/>

            {/* Stadium lights */}
            <div style={{position:"absolute",top:0,left:"15%",width:3,height:"35%",background:`linear-gradient(180deg, ${C.cyan}30, transparent)`,filter:"blur(4px)",animation:"pulse 3s infinite"}}/>
            <div style={{position:"absolute",top:0,right:"15%",width:3,height:"35%",background:`linear-gradient(180deg, ${C.gold}30, transparent)`,filter:"blur(4px)",animation:"pulse 3s infinite 0.5s"}}/>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:200,height:60,borderRadius:"0 0 100% 100%",background:`radial-gradient(ellipse, rgba(255,255,255,0.04), transparent)`,filter:"blur(20px)"}}/>

            {/* Grass field gradient at bottom */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"30%",background:`linear-gradient(180deg, transparent, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0.12))`,pointerEvents:"none"}}/>
            {/* Grass line marks */}
            <div style={{position:"absolute",bottom:"15%",left:"10%",right:"10%",height:1,background:`${C.green}10`}}/>
            <div style={{position:"absolute",bottom:"25%",left:"20%",right:"20%",height:1,background:`${C.green}06`}}/>

            {/* Floating crowd emojis */}
            {[...Array(8)].map((_,i)=>(
              <div key={`crowd${i}`} style={{
                position:"absolute",
                left:`${8+i*12}%`,
                bottom:`${(tick*1.5+i*47)%120-10}%`,
                fontSize:12+Math.random()*8,
                opacity:0.15+Math.random()*0.15,
                transition:"bottom 2s linear",
                pointerEvents:"none",
              }}>{crowdEmojis[(i+tick)%crowdEmojis.length]}</div>
            ))}

            {/* Ambient crowd noise dots */}
            {[...Array(20)].map((_,i)=>(
              <div key={`dot${i}`} style={{
                position:"absolute",
                left:`${Math.random()*100}%`, top:`${Math.random()*30}%`,
                width:2, height:2, borderRadius:"50%",
                background:[C.cyan,C.gold,C.pink,C.orange][i%4],
                opacity:0.1+Math.random()*0.15,
                animation:`pulse ${2+Math.random()*3}s infinite ${Math.random()*2}s`,
              }}/>
            ))}

            {overlayBack(()=>{setGameActive(null);setKickState(null);})}

            <div style={{position:"relative",zIndex:2,flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"38px 14px 52px",height:"100%",overflowY:"auto"}}>

              {/* ═══ VS ARENA HEADER WITH CHARACTER IMAGES ═══ */}
              <div style={{width:"100%",maxWidth:390,marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:7,fontWeight:800,color:C.gold,letterSpacing:2}}>🏆 FINAL KICK</span>
                  <span style={{fontSize:6,fontWeight:700,color:pool.color,padding:"2px 6px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ {pool.label}</span>
                  <span style={{fontSize:6,fontWeight:700,color:inpInfo.color,padding:"2px 6px",borderRadius:20,...LG.tinted(inpInfo.color)}}>{inpInfo.icon} {inpInfo.label}</span>
                  {kickBonusActive && <span style={{fontSize:6,fontWeight:800,color:C.gold,padding:"2px 6px",borderRadius:20,background:`${C.gold}20`,border:`1px solid ${C.gold}40`,animation:"pulse 1s infinite"}}>⚡ BONUS</span>}
                </div>
                {/* ═══ ARENA VS CARD ═══ */}
                <div style={{display:"flex",alignItems:"stretch",borderRadius:16,overflow:"hidden",...LG.tinted(C.cyan),position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:"50%",width:2,height:"100%",background:`linear-gradient(180deg, ${C.gold}40, ${C.gold}10)`,transform:"skewX(-8deg)",zIndex:3}}/>
                  {/* YOU */}
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:`linear-gradient(135deg, ${C.cyan}08, transparent)`}}>
                    <div style={{width:36,height:36,borderRadius:10,overflow:"hidden",border:`2px solid ${C.cyan}40`,background:`${C.cyan}10`,flexShrink:0,boxShadow:`0 0 10px ${C.cyan}20`}}>
                      <img src={PLAYER_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:24px;text-align:center;padding-top:6px">😎</div>';}}/>
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9,fontWeight:800,color:C.cyan}}>Steve</div>
                      <div style={{fontSize:6,color:C.text3}}>{getDeviceShort()} · Lv.24</div>
                      <div style={{fontSize:22,fontWeight:900,color:"#fff",textShadow:`0 0 10px ${C.cyan}60`,lineHeight:1,marginTop:1}}>{kickScore.you}</div>
                    </div>
                  </div>
                  {/* VS */}
                  <div style={{width:32,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:4}}>
                    <div style={{fontSize:6,color:C.text3}}>R{kickRound+1}</div>
                    <div style={{display:"flex",gap:2,marginTop:1}}>{[0,1,2,3,4].map(r=>(<div key={r} style={{width:4,height:4,borderRadius:"50%",background:r<kickRound?C.cyan:r===kickRound?C.gold:`${C.text3}30`}}/>))}</div>
                    <div style={{fontSize:10,fontWeight:900,color:C.gold,textShadow:`0 0 6px ${C.gold}40`}}>VS</div>
                  </div>
                  {/* AI */}
                  <div style={{flex:1,display:"flex",alignItems:"center",flexDirection:"row-reverse",gap:6,padding:"6px 8px",background:`linear-gradient(225deg, ${C.red}08, transparent)`}}>
                    <div style={{width:36,height:36,borderRadius:10,overflow:"hidden",border:`2px solid ${C.red}40`,background:`${C.red}10`,flexShrink:0,boxShadow:`0 0 10px ${C.red}20`}}>
                      <img src={kickOpponent.current.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:24px;text-align:center;padding-top:6px">'+kickOpponent.current.emoji+'</div>';}}/>
                    </div>
                    <div style={{textAlign:"right",minWidth:0}}>
                      <div style={{fontSize:9,fontWeight:800,color:C.red,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{kickOpponent.current.name}</div>
                      <div style={{fontSize:6,color:C.text3}}>{kickOpponent.current.rank} · {kickOpponent.current.record}</div>
                      <div style={{fontSize:22,fontWeight:900,color:"#fff",textShadow:`0 0 10px ${C.red}60`,lineHeight:1,marginTop:1}}>{kickScore.ai}</div>
                    </div>
                  </div>
                </div>
                {/* Stats strip */}
                <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:2}}>
                  <span style={{fontSize:6,color:C.text3}}>⚽{kickStats.goals}</span>
                  <span style={{fontSize:6,color:C.text3}}>🧤{kickStats.saves}</span>
                  <span style={{fontSize:6,color:C.green}}>💨{kickStats.perfects}</span>
                  {kickStats.blinkers>0&&<span style={{fontSize:6,color:C.red}}>💀{kickStats.blinkers}</span>}
                  {kickStats.misses>0&&<span style={{fontSize:6,color:C.gold}}>🚀{kickStats.misses}</span>}
                </div>
              </div>

              {/* ═══ PHASE LABEL + LIVE COMMENTARY ═══ */}
              <div style={{textAlign:"center",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:900,letterSpacing:2,color:isShootPhase?C.cyan:isSavePhase?C.orange:C.gold,textShadow:`0 0 15px ${isShootPhase?C.cyan:C.orange}40`}}>
                  {kickBonusActive ? "⚡ BONUS SHOT" : isShootPhase ? "🦶 YOUR KICK" : isSavePhase ? "🧤 YOUR SAVE" : kickState==="bonus_offer" ? "🎰 BONUS!" : ""}
                </div>
                {kickComment && (
                  <div style={{fontSize:10,color:C.text2,marginTop:3,fontStyle:"italic",animation:"fadeIn 0.4s ease",maxWidth:300}}>
                    "{kickComment}"
                  </div>
                )}
              </div>

              {/* ═══ GOAL FRAME — 3D perspective ═══ */}
              <div style={{perspective:"600px",marginBottom:4}}>
                <div style={{
                  position:"relative",width:goalW,height:goalH,
                  border:`3px solid rgba(255,255,255,0.2)`,
                  borderBottom:`4px solid ${C.green}80`,
                  borderRadius:"12px 12px 0 0",
                  background:`linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
                  boxShadow:`0 0 40px rgba(0,229,255,0.06), inset 0 0 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)`,
                  transform: isSavePhase ? "rotateX(2deg)" : "rotateX(-2deg)",
                  transition:"transform 0.5s ease",
                  overflow:"hidden",
                }}>
                  {/* Net pattern */}
                  {[...Array(9)].map((_,i)=>(
                    <div key={`nv${i}`} style={{position:"absolute",top:0,left:`${(i+1)*10}%`,width:1,height:"100%",background:`rgba(255,255,255,0.04)`}}/>
                  ))}
                  {[...Array(5)].map((_,i)=>(
                    <div key={`nh${i}`} style={{position:"absolute",top:`${(i+1)*16.6}%`,left:0,width:"100%",height:1,background:`rgba(255,255,255,0.04)`}}/>
                  ))}

                  {/* Main dividers (thicker) */}
                  <div style={{position:"absolute",top:0,left:"33.3%",width:1,height:"100%",background:`rgba(255,255,255,0.12)`}}/>
                  <div style={{position:"absolute",top:0,left:"66.6%",width:1,height:"100%",background:`rgba(255,255,255,0.12)`}}/>
                  <div style={{position:"absolute",top:"50%",left:0,width:"100%",height:1,background:`rgba(255,255,255,0.12)`}}/>

                  {/* Tap zones with glow effect */}
                  {(kickState==="shoot"||kickState==="save_dive") && KICK_ZONES.map((z,i)=>(
                    <div key={i} onClick={()=>{
                      if(kickState==="shoot"){kickSelectZone(i);playFx("kick");}
                      else if(kickState==="save_dive"){kickDive(i);playFx("kick");}
                    }} style={{
                      position:"absolute",
                      left:z.col*zoneW, top:z.row*zoneH, width:zoneW, height:zoneH,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:"pointer",
                      background: kickAim===i ? `radial-gradient(circle, ${C.cyan}30, ${C.cyan}08)` : "transparent",
                      borderRadius:4,
                      transition:"all 0.15s ease",
                      fontSize:22, color:`rgba(255,255,255,0.15)`,
                    }}>
                      <span style={{filter:kickAim===i?`drop-shadow(0 0 8px ${C.cyan})`:""}}>{z.label}</span>
                    </div>
                  ))}

                  {/* Ball animation — with trail */}
                  {kickBallAnim && (()=>{
                    const bp = getBallPos(kickBallAnim.zone);
                    const isGoal = kickBallAnim.result==="goal";
                    return <>
                      {/* Impact flash */}
                      <div style={{position:"absolute",left:bp.x-30,top:bp.y-30,width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle, ${isGoal?C.green:C.red}30, transparent)`,animation:"fadeIn 0.2s ease",zIndex:4}}/>
                      <div style={{
                        position:"absolute",left:bp.x-16,top:bp.y-16,
                        fontSize:32, zIndex:5,
                        animation:"fadeIn 0.2s ease",
                        filter:`drop-shadow(0 0 20px ${isGoal?C.green:C.red}) drop-shadow(0 0 40px ${isGoal?C.green:C.red}80)`,
                      }}>⚽</div>
                    </>;
                  })()}

                  {/* Keeper with dive animation */}
                  {kickDiveAnim!==null && (()=>{
                    const col = KICK_ZONES[kickDiveAnim].col;
                    const kx = col===0?"15%":col===1?"50%":"85%";
                    return <div style={{
                      position:"absolute",bottom:8,left:kx,transform:"translateX(-50%)",
                      fontSize:36,zIndex:4,transition:"left 0.25s cubic-bezier(0.22,1,0.36,1)",
                      filter:`drop-shadow(0 0 10px rgba(255,165,0,0.4))`,
                    }}>{col===0?"🤸":"🧤"}</div>;
                  })()}

                  {/* Save countdown — danger zone flash */}
                  {kickState==="save_countdown" && kickAiZone!==null && (()=>{
                    const hintCol = KICK_ZONES[kickAiZone].col;
                    return <div style={{
                      position:"absolute",
                      left:hintCol===0?"0%":hintCol===1?"25%":"55%",
                      top:0, width:"45%", height:"100%",
                      background:`linear-gradient(90deg, transparent, ${C.orange}06, transparent)`,
                      animation:"pulse 0.8s infinite",pointerEvents:"none",
                    }}/>;
                  })()}

                  {/* ═══ RESULT OVERLAY — Big & Fun ═══ */}
                  {isResult && kickBallAnim && (()=>{
                    const isMiss = kickBallAnim.result==="missed";
                    const isGoal = kickBallAnim.result==="goal";
                    const youScored = isShootPhase && isGoal;
                    const youSaved = isSavePhase && !isGoal && !isMiss;
                    const youMissed = isShootPhase && isMiss;
                    const good = youScored || youSaved;
                    return (
                      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:10,
                        background:good?`radial-gradient(circle, ${C.green}20, rgba(0,0,0,0.7))`:`radial-gradient(circle, ${C.red}15, rgba(0,0,0,0.7))`,
                        animation:"fadeIn 0.2s ease",
                      }}>
                        <div style={{fontSize:28,fontWeight:900,color:youMissed?C.gold:good?C.green:C.red,textShadow:`0 0 30px ${youMissed?C.gold:good?C.green:C.red}`,animation:"countPulse 0.5s ease"}}>
                          {youMissed?(kickBallAnim.wasBlinker?"💀 BLINKER!":"🚀 MISS!"):youScored?"⚽ GOLAZO!":youSaved?"🧤 DENIED!":isShootPhase?"🧤 Saved!":"⚽ AI Scores!"}
                        </div>
                        <div style={{fontSize:10,color:C.text2,marginTop:4,fontStyle:"italic"}}>
                          {good?pick(youScored?GOAL_CHEERS:SAVE_CHEERS):pick(CONCEDE_REACT)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ═══ GRASS / PENALTY SPOT ═══ */}
              <div style={{width:goalW,height:20,background:`linear-gradient(180deg, ${C.green}08, transparent)`,borderRadius:"0 0 8px 8px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                {kickState==="shoot" && <div style={{width:6,height:6,borderRadius:"50%",background:`${C.text}20`,boxShadow:`0 0 8px ${C.text}10`}}/>}
              </div>

              {/* ═══ PUFF DURATION METER — Hold to puff ═══ */}
              {kickState==="power" && inp!=="tap" && (()=>{
                const zone = getPuffZone(kickPower);
                const elapsed = kickCharging ? (Date.now()-puffStartTime.current)/1000 : 0;
                const zoneColor = zone==="perfect"?C.green:zone==="good"?C.cyan:zone==="short"?C.gold:zone==="tap"?C.text3:C.red;
                const zoneLabel = zone==="perfect"?"💨👑 PERFECT PUFF":zone==="good"?"Good puff 👌":zone==="short"?"Short puff":zone==="tap"?"Barely a puff":"Too long! 📉";
                const barColor = kickPower>=kickSweetMin&&kickPower<=kickSweetMax
                  ? `linear-gradient(90deg, ${C.cyan}, ${C.green}, ${C.gold})`
                  : kickPower>kickSweetMax
                    ? `linear-gradient(90deg, ${C.cyan}, ${C.green}, ${C.gold}, ${C.red})`
                    : `linear-gradient(90deg, ${C.cyan}, ${C.green})`;
                return (
                <div style={{width:goalW,animation:"fadeIn 0.3s ease"}}>
                  {/* Duration timer + zone label */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,padding:"0 2px"}}>
                    <span style={{fontSize:9,fontWeight:800,color:zoneColor}}>{kickCharging?zoneLabel:"PUFF DURATION"}</span>
                    {kickCharging && <span style={{fontSize:10,fontWeight:900,color:zoneColor,fontFamily:"monospace"}}>{elapsed.toFixed(1)}s</span>}
                  </div>
                  {/* Power bar with puff zone markers */}
                  <div style={{height:24,borderRadius:12,background:`rgba(255,255,255,0.04)`,overflow:"hidden",border:`1px solid ${kickCharging?zoneColor+"40":"rgba(255,255,255,0.08)"}`,position:"relative",transition:"border-color 0.2s"}}>
                    {/* Sweet spot highlight zone */}
                    <div style={{position:"absolute",left:`${kickSweetMin}%`,width:`${kickSweetMax-kickSweetMin}%`,height:"100%",background:`${C.green}08`,borderLeft:`1px solid ${C.green}30`,borderRight:`1px solid ${C.green}30`}}/>
                    <div style={{position:"absolute",left:`${kickSweetMin+2}%`,top:2,fontSize:7,color:`${C.green}50`,fontWeight:800}}>SWEET</div>
                    {/* Fill bar */}
                    <div style={{
                      height:"100%",width:`${kickPower}%`,
                      background:barColor,
                      borderRadius:12,transition:"width 0.06s linear",
                      boxShadow:kickCharging?`0 0 20px ${zoneColor}40`:`0 0 8px ${C.cyan}20`,
                    }}/>
                    {/* Power % label */}
                    {kickPower>8 && <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:900,color:"#fff",textShadow:"0 0 4px rgba(0,0,0,0.9)"}}>
                      {Math.round(kickPower)}%
                    </div>}
                    {/* Zone markers */}
                    <div style={{position:"absolute",top:0,left:"15%",width:1,height:"100%",background:`rgba(255,255,255,0.06)`}}/>
                    <div style={{position:"absolute",top:0,left:"40%",width:1,height:"100%",background:`rgba(255,255,255,0.08)`}}/>
                    <div style={{position:"absolute",top:0,left:`${kickSweetMax}%`,width:1,height:"100%",background:`${C.red}30`}}/>
                  </div>
                  {/* Duration zone labels */}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2,padding:"0 2px"}}>
                    <span style={{fontSize:6,color:C.text3}}>TAP</span>
                    <span style={{fontSize:6,color:C.text3}}>SHORT</span>
                    <span style={{fontSize:6,color:C.text3}}>GOOD</span>
                    <span style={{fontSize:6,color:C.green,fontWeight:700}}>PERFECT 💨</span>
                    <span style={{fontSize:6,color:C.red}}>BLINKER 💀</span>
                  </div>
                  {/* Hold-to-puff button */}
                  <div
                    onMouseDown={()=>{kickStartCharge();playFx("charge");}}
                    onMouseUp={kickStopCharge}
                    onMouseLeave={kickStopCharge}
                    onTouchStart={(e)=>{e.preventDefault();kickStartCharge();playFx("charge");}}
                    onTouchEnd={kickStopCharge}
                    style={{
                      marginTop:8,padding:kickCharging?"14px 20px":"12px 20px",borderRadius:14,cursor:"pointer",textAlign:"center",
                      background:kickCharging
                        ? `linear-gradient(135deg, ${zoneColor}30, ${zoneColor}10)`
                        : `linear-gradient(135deg, ${inpInfo.color}20, ${inpInfo.color}08)`,
                      border:`1px solid ${kickCharging?zoneColor+"50":inpInfo.color+"35"}`,
                      fontSize:14,fontWeight:900,
                      color:kickCharging?zoneColor:inpInfo.color,
                      animation:kickCharging?"none":"countPulse 1s infinite",
                      boxShadow:kickCharging?`0 0 25px ${zoneColor}25`:`0 0 15px ${inpInfo.color}12`,
                      transform:kickCharging?"scale(1.03)":"scale(1)",
                      transition:"all 0.15s",
                      userSelect:"none",WebkitUserSelect:"none",
                    }}
                  >
                    {kickCharging
                      ? (zone==="perfect"?"🎯 RELEASE NOW!":isPuffBlinker.current?"💀 BLINKER! LET GO!":zone==="good"?"💨 Almost... keep going!":"💨 PUFFING... "+elapsed.toFixed(1)+"s")
                      : (inp==="puff"?"💨 HOLD TO PUFF":"🔘 HOLD TO CHARGE")}
                    <div style={{fontSize:7,color:`${kickCharging?zoneColor:inpInfo.color}70`,marginTop:2}}>
                      {kickCharging
                        ? (zone==="perfect"?"2.5-3.5s = Sweet Spot!":"Hold for 2.5-3.5s for PERFECT puff")
                        : "Hold & release in the SWEET SPOT 💨👑"}
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* ═══ BONUS OFFER ═══ */}
              {kickState==="bonus_offer" && (
                <div style={{textAlign:"center",animation:"fadeIn 0.4s ease",padding:"8px 0"}}>
                  <div style={{fontSize:36,marginBottom:6,animation:"gentleFloat 1s infinite"}}>⚡🎰⚡</div>
                  <div style={{fontSize:16,fontWeight:900,color:C.gold,marginBottom:4,textShadow:`0 0 15px ${C.gold}40`}}>BONUS SHOT!</div>
                  <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Tighter sweet spot · Double score if you nail it!</div>
                  <div style={{fontSize:9,color:C.text3,marginBottom:12,fontStyle:"italic"}}>"{kickOpponent.current.name}: 'No way you hit this one' 😏"</div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <div onClick={kickAcceptBonus} style={{padding:"12px 24px",borderRadius:12,cursor:"pointer",background:`linear-gradient(135deg, ${C.gold}25, ${C.gold}08)`,border:`1px solid ${C.gold}40`,fontSize:14,fontWeight:900,color:C.gold,boxShadow:`0 0 20px ${C.gold}15`,animation:"countPulse 1s infinite"}}>🔥 BRING IT</div>
                    <div onClick={kickSkipBonus} style={{padding:"12px 24px",borderRadius:12,cursor:"pointer",background:`${C.text3}08`,border:`1px solid ${C.text3}20`,fontSize:14,fontWeight:700,color:C.text3}}>Skip →</div>
                  </div>
                </div>
              )}

              {/* ═══ SHOOT instruction ═══ */}
              {kickState==="shoot" && (
                <div style={{textAlign:"center",animation:"gentleFloat 2s infinite"}}>
                  <div style={{fontSize:13,color:C.text2,fontWeight:600}}>👆 Pick your corner</div>
                  <div style={{fontSize:9,color:C.text3,marginTop:2}}>Choose wisely... AI keeper is watching 👀</div>
                </div>
              )}

              {/* ═══ SAVE READY — Big dramatic ═══ */}
              {kickState==="save_ready" && (
                <div style={{textAlign:"center",animation:"fadeIn 0.4s ease"}}>
                  <div style={{fontSize:40,marginBottom:8,animation:"gentleFloat 1.5s infinite"}}>🧤</div>
                  <div style={{fontSize:16,fontWeight:900,color:C.orange,marginBottom:4,textShadow:`0 0 15px ${C.orange}40`}}>YOUR TURN TO SAVE</div>
                  <div style={{fontSize:10,color:C.text3,marginBottom:12,fontStyle:"italic"}}>"AI is stepping up... look confident 😤"</div>
                  <div onClick={()=>{kickSaveStart();playFx("whistle");}} style={{
                    padding:"14px 36px",borderRadius:14,cursor:"pointer",
                    background:`linear-gradient(135deg, ${C.orange}20, ${C.orange}08)`,
                    border:`1px solid ${C.orange}35`,
                    fontSize:15,fontWeight:900,color:C.orange,
                    boxShadow:`0 0 20px ${C.orange}15`,
                    animation:"countPulse 1.2s infinite",
                  }}>BRING IT ON 🔥</div>
                </div>
              )}

              {/* ═══ SAVE COUNTDOWN — Tension ═══ */}
              {kickState==="save_countdown" && (
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:900,color:C.gold,animation:"breathe 0.5s infinite",textShadow:`0 0 20px ${C.gold}60`}}>
                    AI winding up... 💨
                  </div>
                  <div style={{fontSize:10,color:C.text3,marginTop:4}}>Watch for the hint!</div>
                </div>
              )}

              {/* ═══ SAVE DIVE instruction ═══ */}
              {kickState==="save_dive" && (
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:C.orange,animation:"countPulse 0.4s infinite",textShadow:`0 0 15px ${C.orange}60`}}>
                    DIVE NOW! 🧤💨
                  </div>
                  <div style={{fontSize:10,color:C.text3,marginTop:2}}>👆 TAP a zone!</div>
                </div>
              )}

              {/* ═══ FINAL RESULT — Full celebration ═══ */}
              {kickState==="final" && (()=>{
                const won = kickScore.you>kickScore.ai;
                const draw = kickScore.you===kickScore.ai;
                const resultColor = won?C.green:draw?C.gold:C.red;
                const WIN_MSGS=["YOU'RE GOATED 🐐","CHAMPION VIBES 👑","AI NEEDS THERAPY 😂","UNMATCHED 💎",""+kickOpponent.current.name+" is crying rn 😭","Puff of champions 💨👑"];
                const LOSE_MSGS=["GG next time 😤","Blame the controller 🎮",""+kickOpponent.current.name+" got lucky fr 💀","Keeper was HIGH key asleep 😂","Run it back! 🔄","That wasn't even fair bro 🤣"];
                return (
                  <div style={{textAlign:"center",animation:"fadeIn 0.5s ease"}}>
                    {won && <div style={{fontSize:30,marginBottom:6,animation:"gentleFloat 1s infinite"}}>🎉🏆🎉</div>}
                    {!won && !draw && <div style={{fontSize:30,marginBottom:6}}>😤💀😂</div>}
                    {draw && <div style={{fontSize:30,marginBottom:6}}>🤝⚽🤝</div>}

                    <div style={{fontSize:28,fontWeight:900,color:resultColor,marginBottom:4,textShadow:`0 0 30px ${resultColor}60`,animation:"countPulse 0.8s ease"}}>
                      {won?"YOU WIN!":draw?"DRAW!":"DEFEATED"}
                    </div>

                    {/* Final score with avatars */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:6}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:24}}>😎</div>
                        <div style={{fontSize:9,color:C.cyan,fontWeight:700}}>Steve</div>
                      </div>
                      <div style={{fontSize:36,fontWeight:900,color:"#fff",textShadow:`0 0 20px ${resultColor}40`}}>
                        {kickScore.you} — {kickScore.ai}
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:24}}>{kickOpponent.current.emoji}</div>
                        <div style={{fontSize:9,color:C.red,fontWeight:700,maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{kickOpponent.current.name}</div>
                      </div>
                    </div>

                    <div style={{fontSize:11,color:C.text2,marginBottom:6,fontStyle:"italic",maxWidth:280}}>
                      "{won?pick(WIN_MSGS):draw?"Fair game! Both high af apparently 😂":pick(LOSE_MSGS)}"
                    </div>
                    <div style={{fontSize:10,color:C.gold,marginBottom:14,padding:"4px 14px",borderRadius:20,...LG.tinted(C.gold)}}>
                      💰 ×{pool.rewardMult} {pool.label} · {getDeviceShort()}
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                      <div onClick={()=>{startKick();playFx("whistle");}} style={{
                        padding:"12px 28px",borderRadius:12,cursor:"pointer",
                        background:`linear-gradient(135deg, ${C.cyan}18, ${C.cyan}06)`,
                        border:`1px solid ${C.cyan}30`,fontSize:14,fontWeight:800,color:C.cyan,
                        boxShadow:`0 0 15px ${C.cyan}10`,
                      }}>🔄 Rematch</div>
                      <div onClick={()=>{kickEndGame();playFx("crowd");}} style={{
                        padding:"12px 28px",borderRadius:12,cursor:"pointer",
                        background:`linear-gradient(135deg, ${C.green}18, ${C.green}06)`,
                        border:`1px solid ${C.green}30`,fontSize:14,fontWeight:800,color:C.green,
                        boxShadow:`0 0 15px ${C.green}10`,
                      }}>💰 Collect</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ═══ BOTTOM PANEL: Reactions + Chat/Stats ═══ */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:20,display:"flex",flexDirection:"column"}}>

              {/* ── INTERACTIVE REACTION BAR ── */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"5px 10px",...GLASS_CLEAR,borderRadius:"12px 12px 0 0"}}>
                {[
                  {emoji:"😂",label:"Laugh"},{emoji:"👏",label:"Clap"},{emoji:"😱",label:"Shock"},
                  {emoji:"🔥",label:"Fire"},{emoji:"💀",label:"Dead"},{emoji:"😘",label:"Kiss"},
                  {emoji:"👋",label:"Slap"},{emoji:"💨",label:"Puff"},
                ].map((r,i)=>(
                  <div key={i} onClick={()=>{
                    setChatMessages(p=>[...p,{u:"Steve",m:r.emoji,c:C.cyan,t:Date.now()}]);
                    setFloatingReactions(p=>[...p,{id:Date.now()+i,emoji:r.emoji,x:20+Math.random()*60,dur:1.5+Math.random()}]);
                    if(r.emoji==="😂") playFx("laugh");
                  }} style={{
                    width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",fontSize:16,
                    background:`rgba(255,255,255,0.04)`,border:`1px solid rgba(255,255,255,0.06)`,
                    transition:"all 0.15s",
                  }}>
                    {r.emoji}
                  </div>
                ))}
                {/* Audio toggle */}
                <div onClick={()=>setAudioOn(!audioOn)} style={{
                  width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",fontSize:14,marginLeft:4,
                  background:audioOn?`${C.green}10`:`${C.red}10`,
                  border:`1px solid ${audioOn?C.green+"25":C.red+"25"}`,
                }}>
                  {audioOn?"🔊":"🔇"}
                </div>
              </div>

              {/* ── CHAT / STATS PANEL ── */}
              <div style={{...GLASS_CARD,maxHeight:kickChatOn?"35%":"40%",transition:"max-height 0.3s ease",display:"flex",flexDirection:"column"}}>
                {/* Toggle header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 12px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:12}}>🪙</span>
                    <span style={{fontSize:10,fontWeight:800,color:C.gold,fontFamily:"monospace"}}>{coins.toLocaleString()}</span>
                    <span style={{fontSize:7,color:C.text3,marginLeft:4}}>⚽{kickStats.goals} 🧤{kickStats.saves} 💨{kickStats.perfects}</span>
                  </div>
                  <div onClick={()=>setKickChatOn(!kickChatOn)} style={{padding:"2px 8px",borderRadius:16,cursor:"pointer",fontSize:8,fontWeight:700,color:kickChatOn?C.green:C.gold,...LG.tinted(kickChatOn?C.green:C.gold)}}>
                    {kickChatOn?"💬 Chat":"📊 Stats"}
                  </div>
                </div>

                {/* Content */}
                <div style={{flex:1,overflowY:"auto",padding:"4px 10px 6px"}}>
                  {kickChatOn ? (
                    /* ── CHAT (same style as home) ── */
                    <div>
                      {chatMessages.slice(-6).map((m,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
                          <div style={{width:18,height:18,borderRadius:6,background:`${m.c||C.text3}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,flexShrink:0,marginTop:1}}>{m.u[0]}</div>
                          <div>
                            <span style={{fontSize:8,fontWeight:700,color:m.c||C.text2}}>{m.u} </span>
                            <span style={{fontSize:8,color:C.text3}}>{m.m}</span>
                          </div>
                        </div>
                      ))}
                      {/* Emoji quick-send row */}
                      <div style={{display:"flex",gap:3,marginTop:3,marginBottom:3}}>
                        {["🔥","GG 👏","Let's go!","💀","😂","💨"].map((q,i)=>(
                          <div key={i} onClick={()=>setChatMessages(p=>[...p,{u:"Steve",m:q,c:C.cyan,t:Date.now()}])} style={{
                            padding:"2px 6px",borderRadius:6,cursor:"pointer",fontSize:7,fontWeight:600,color:C.text3,
                            background:`rgba(255,255,255,0.04)`,border:`1px solid ${C.border}`,
                          }}>{q}</div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{
                          if(e.key==="Enter"&&chatInput.trim()){setChatMessages(p=>[...p,{u:"Steve",m:chatInput.trim(),c:C.cyan,t:Date.now()}]);setChatInput("");}
                        }} placeholder="Say something..." style={{flex:1,background:`${C.text3}06`,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 8px",fontSize:9,color:C.text,outline:"none"}}/>
                        <div onClick={()=>{if(chatInput.trim()){setChatMessages(p=>[...p,{u:"Steve",m:chatInput.trim(),c:C.cyan,t:Date.now()}]);setChatInput("");}}} style={{padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:9,fontWeight:700,color:C.cyan,...LG.tinted(C.cyan)}}>Send</div>
                      </div>
                    </div>
                  ) : (
                    /* ── EXPANDED STATS / RANKINGS ── */
                    <div>
                      <div style={{fontSize:8,fontWeight:800,color:C.gold,marginBottom:3}}>🏆 TOURNAMENT RANKINGS</div>
                      {[
                        {rank:1,name:"ChillMaster42",score:"2,847K",emoji:"👑"},
                        {rank:2,name:"VibeKing",score:"2,654K",emoji:"😎"},
                        {rank:3,name:"NeonQueen",score:"1,980K",emoji:"👸"},
                        {rank:4,name:"PuffDaddy",score:"890K",emoji:"💨"},
                        {rank:5,name:"BakedBaker",score:"720K",emoji:"👨‍🍳"},
                        {rank:12,name:"Steve (You)",score:"420K",emoji:"🌟",you:true},
                        {rank:13,name:"BlazedPanda",score:"350K",emoji:"🐼"},
                        {rank:14,name:"CloudNine99",score:"245K",emoji:"☁️"},
                      ].map((p,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",borderBottom:`1px solid ${C.border}`}}>
                          <span style={{fontSize:7,fontWeight:800,color:p.rank<=3?C.gold:p.you?C.cyan:C.text3,width:18}}>{p.rank<=3?["🥇","🥈","🥉"][p.rank-1]:"#"+p.rank}</span>
                          <span style={{fontSize:9}}>{p.emoji}</span>
                          <span style={{fontSize:8,fontWeight:p.you?800:600,color:p.you?C.cyan:C.text,flex:1}}>{p.name}</span>
                          <span style={{fontSize:7,fontWeight:700,color:C.text3,fontFamily:"monospace"}}>{p.score}</span>
                        </div>
                      ))}
                      {/* Match stats cards */}
                      <div style={{display:"flex",gap:6,marginTop:5,justifyContent:"center"}}>
                        {[
                          {v:kickStats.goals,l:"Goals",c:C.cyan,e:"⚽"},
                          {v:kickStats.saves,l:"Saves",c:C.orange,e:"🧤"},
                          {v:kickStats.perfects,l:"Perfect",c:C.green,e:"💨"},
                          {v:kickStats.blinkers,l:"Blinker",c:C.red,e:"💀"},
                          {v:kickStats.misses,l:"Miss",c:C.gold,e:"🚀"},
                        ].map((s,i)=>(
                          <div key={i} style={{textAlign:"center",padding:"4px 6px",borderRadius:8,...LG.tinted(s.c),flex:1}}>
                            <div style={{fontSize:10}}>{s.e}</div>
                            <div style={{fontSize:12,fontWeight:900,color:s.c}}>{s.v}</div>
                            <div style={{fontSize:5,color:C.text3}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }
      // Generic game
      return (
        <div style={overlayStyle}>{overlayBack(()=>setGameActive(null))}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:20}}>
            <div style={{fontSize:56,marginBottom:16}}>{gameActive.emoji}</div>
            <div style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:6}}>{gameActive.name}</div>
            <div style={{fontSize:12,color:C.text3,marginBottom:20}}>Game in progress...</div>
            <div onClick={()=>puffLockIn(()=>{setCoins(c=>c+30);notify("🎮 +30 coins!",C.green);setGameActive(null);})} style={{padding:"12px 28px",borderRadius:12,cursor:"pointer",background:`${C.cyan}15`,border:`1px solid ${C.cyan}30`,fontSize:14,fontWeight:800,color:C.cyan}}>💨 Puff to Win</div>
          </div>
        </div>
      );
    }
    // Game detail sheet — IMMERSIVE
    if(selectedGame) {
      const gc = selectedGame.color;
      const pool = getDevicePool();
      const inpInfo = INPUT_TYPES.find(t=>t.id==="puff")||INPUT_TYPES[0];
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,overflow:"hidden"}}>
          {/* Stadium background */}
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, ${gc}15 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, ${gc}08 0%, transparent 40%),
            radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 40%),
            linear-gradient(180deg, #040812 0%, #0a1628 40%, #0d1f20 70%, #061210 100%)
          `}}/>
          {/* Light beams */}
          <div style={{position:"absolute",top:0,left:"20%",width:3,height:"30%",background:`linear-gradient(180deg, ${gc}25, transparent)`,filter:"blur(4px)",animation:"pulse 3s infinite"}}/>
          <div style={{position:"absolute",top:0,right:"20%",width:3,height:"30%",background:`linear-gradient(180deg, ${gc}25, transparent)`,filter:"blur(4px)",animation:"pulse 3s infinite 1s"}}/>
          {/* Grass at bottom */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"20%",background:`linear-gradient(180deg, transparent, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0.10))`,pointerEvents:"none"}}/>

          {overlayBack(()=>setSelectedGame(null))}

          <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:"50px 20px 20px",textAlign:"center"}}>
            {/* Game icon with glow ring */}
            <div style={{width:90,height:90,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle, ${gc}15, ${gc}05)`,border:`2px solid ${gc}30`,boxShadow:`0 0 40px ${gc}20, 0 0 80px ${gc}08`,marginBottom:12,animation:"gentleFloat 3s infinite"}}>
              <span style={{fontSize:48,filter:`drop-shadow(0 0 15px ${gc}40)`}}>{selectedGame.emoji}</span>
            </div>

            <div style={{fontSize:24,fontWeight:900,color:C.text,textShadow:`0 0 20px ${gc}30`,marginBottom:4}}>{selectedGame.name}</div>
            <div style={{fontSize:12,color:C.text2,marginBottom:8,maxWidth:280}}>{selectedGame.desc}</div>

            {/* Tags */}
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <span style={{fontSize:9,fontWeight:700,color:gc,padding:"3px 10px",borderRadius:20,...LG.tinted(gc)}}>{selectedGame.type}</span>
              <span style={{fontSize:9,fontWeight:700,color:C.text2,padding:"3px 10px",borderRadius:20,...LG.tinted(C.text3)}}>👥 {selectedGame.players}</span>
              <span style={{fontSize:9,fontWeight:700,color:C.text2,padding:"3px 10px",borderRadius:20,...LG.tinted(C.text3)}}>⏱ {selectedGame.time}</span>
              {selectedGame.hot && <span style={{fontSize:9,fontWeight:800,color:C.red,padding:"3px 10px",borderRadius:20,background:`${C.red}15`,border:`1px solid ${C.red}25`,animation:"pulse 2s infinite"}}>🔥 HOT</span>}
            </div>

            {/* Device + input info */}
            <div style={{display:"flex",gap:5,marginBottom:16}}>
              <span style={{fontSize:8,fontWeight:700,color:pool.color,padding:"2px 8px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ {pool.label}</span>
              <span style={{fontSize:8,fontWeight:700,color:C.text3,padding:"2px 8px",borderRadius:20,...LG.tinted(C.text3)}}>{getDeviceShort()}</span>
              {(selectedGame.inputs||["puff"]).map(inp=>{const t=INPUT_TYPES.find(x=>x.id===inp)||INPUT_TYPES[0];return <span key={inp} style={{fontSize:8,fontWeight:700,color:t.color,padding:"2px 8px",borderRadius:20,...LG.tinted(t.color)}}>{t.icon} {t.label}</span>;})}
            </div>

            {/* Match mode buttons — large, glass, with descriptions */}
            <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {[
                {l:"🤖 vs AI",m:"ai",desc:"Practice against AI bot",sub:"Instant match · Any skill level"},
                {l:"🎲 Random Match",m:"random",desc:"Find a same-device opponent",sub:"⚖️ Fair match · "+pool.label},
                {l:"👫 Invite Friend",m:"invite",desc:"Challenge a friend",sub:"Share link · Play together"},
              ].map(b=>(
                <div key={b.m} onClick={()=>startMatch(selectedGame,b.m)} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,cursor:"pointer",
                  ...LG.tinted(gc),
                  transition:"all 0.2s",
                }}>
                  <div style={{fontSize:24,width:36,textAlign:"center"}}>{b.l.split(" ")[0]}</div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.text}}>{b.l.split(" ").slice(1).join(" ")}</div>
                    <div style={{fontSize:9,color:C.text3,marginTop:1}}>{b.sub}</div>
                  </div>
                  <div style={{fontSize:14,color:`${gc}60`}}>›</div>
                </div>
              ))}
            </div>

            {/* Tournament info */}
            <div style={{width:"100%",maxWidth:320,padding:"10px 14px",borderRadius:12,...LG.tinted(C.gold)}}>
              <div style={{fontSize:9,fontWeight:800,color:C.gold,marginBottom:4}}>🏆 ACTIVE TOURNAMENT</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.text}}>Final Kick WC Championship</div>
                  <div style={{fontSize:8,color:C.text3}}>64 players · Your rank: #12 · Round of 16</div>
                </div>
                <div style={{fontSize:8,fontWeight:800,color:C.gold,padding:"3px 8px",borderRadius:6,background:`${C.gold}15`}}>LIVE</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Vibe Check
  const renderVibeCheck = () => {
    if(!showVibeCheck) return null;
    const q = VC_QUESTIONS[vcQ];
    return (
      <div style={overlayStyle}>{overlayBack(()=>{setShowVibeCheck(false);setVcQ(0);setVcScore(0);setVcAnswered(false);setVcStreak(0);})}
        <div style={{padding:"60px 20px 20px",flex:1}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2}}>🧠 VIBE CHECK — WC EDITION</div>
            <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:10}}>
              <span style={{fontSize:12,color:C.text2}}>Q{vcQ+1}/{VC_QUESTIONS.length}</span>
              <span style={{fontSize:12,color:C.gold,fontWeight:700}}>🪙 {vcScore}</span>
              <span style={{fontSize:12,color:C.orange,fontWeight:700}}>🔥 {vcStreak}</span>
            </div>
          </div>
          {q ? (
            <div style={{animation:"fadeIn 0.3s ease"}}>
              <div style={{fontSize:17,fontWeight:800,color:C.text,textAlign:"center",lineHeight:1.4,marginBottom:24,padding:"0 8px"}}>{q.q}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {q.opts.map((o,i)=>{
                  const isCorrect = i===q.correct;
                  const answered = vcAnswered;
                  let bg = `${C.text3}06`;
                  let border = C.border;
                  let color = C.text;
                  if(answered && isCorrect){ bg=`${C.green}12`;border=`${C.green}40`;color=C.green; }
                  else if(answered && !isCorrect){ bg=`${C.red}06`;border=`${C.red}20`;color=C.red; }
                  return (
                    <div key={i} onClick={()=>{
                      if(vcAnswered) return;
                      setVcAnswered(true);
                      if(isCorrect){setVcScore(s=>s+100);setVcStreak(s=>s+1);notify("+100! 🎉",C.green);}
                      else{setVcStreak(0);notify("Wrong! 😢",C.red);}
                      setTimeout(()=>{if(vcQ<VC_QUESTIONS.length-1){setVcQ(q=>q+1);setVcAnswered(false);}else{notify(`Game Over! Score: ${vcScore+(isCorrect?100:0)}`,C.gold);}},1500);
                    }} style={{
                      padding:"16px",borderRadius:14,cursor:answered?"default":"pointer",textAlign:"center",
                      background:bg,border:`1.5px solid ${border}`,transition:"all 0.3s",
                    }}>
                      <div style={{fontSize:10,fontWeight:700,color:C.text3,marginBottom:4}}>{String.fromCharCode(65+i)}</div>
                      <div style={{fontSize:14,fontWeight:700,color}}>{o}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{textAlign:"center",marginTop:40}}>
              <div style={{fontSize:40,marginBottom:12}}>🏆</div>
              <div style={{fontSize:22,fontWeight:900,color:C.gold}}>Game Complete!</div>
              <div style={{fontSize:14,color:C.text2,marginTop:6}}>Score: {vcScore} · Best Streak: {vcStreak}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Spin & Win
  const renderSpin = () => {
    if(!selectedGame || selectedGame.id!=="spinwin") return null;
    const segs=["100🪙","50✨","200🪙","🏅","JACKPOT","↻","⚡","150🪙"];
    return (
      <div style={overlayStyle}>{overlayBack(()=>{setSelectedGame(null);setSpinResult(null);})}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:24}}>🎰 SPIN & WIN</div>
          <div style={{position:"relative",width:240,height:240,marginBottom:24}}>
            <div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",fontSize:22,zIndex:2,filter:`drop-shadow(0 0 6px ${C.gold}60)`}}>▼</div>
            <div style={{
              width:240,height:240,borderRadius:"50%",border:`3px solid ${C.gold}30`,
              transform:`rotate(${spinAngle}deg)`,transition:spinning?"transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)":"none",
              background:`conic-gradient(${segs.map((s,i)=>`${[C.gold,C.cyan,C.pink,C.purple,C.red,C.text3,C.orange,C.lime][i]}25 ${i*45}deg ${(i+1)*45}deg`).join(",")})`,
            }}>
              {segs.map((s,i)=>(<div key={i} style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${i*45+22}deg) translateY(-82px)`,transformOrigin:"0 0",fontSize:10,fontWeight:800,color:C.text,whiteSpace:"nowrap"}}>{s}</div>))}
            </div>
          </div>
          {spinResult && <div style={{fontSize:18,fontWeight:900,color:C.gold,marginBottom:16}}>🎉 {spinResult.t}</div>}
          <div onClick={()=>{if(!spinning)puffLockIn(doSpin);}} style={{padding:"12px 28px",borderRadius:12,cursor:spinning?"default":"pointer",background:spinning?`${C.text3}08`:`${C.gold}15`,border:`1px solid ${spinning?C.text3+"15":C.gold+"30"}`,color:spinning?C.text3:C.gold,fontSize:14,fontWeight:800}}>{spinning?"Spinning...":"💨 Puff to Spin!"}</div>
        </div>
      </div>
    );
  };

  // Puff Lock-In
  const renderPuffLock = () => {
    if(!puffLocking) return null;
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,background:"rgba(5,5,16,0.8)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",border:`3px solid ${C.gold}`,animation:"breathe 0.6s infinite",fontSize:28,boxShadow:`0 0 30px ${C.gold}30`}}>
            {primaryInput==="button"?"🔘":primaryInput==="dry_puff"?"🌀":"💨"}
          </div>
          <div style={{fontSize:15,fontWeight:800,color:C.gold,letterSpacing:0.5}}>
            {primaryInput==="button"?"Press to Lock In...":primaryInput==="dry_puff"?"Dry Puff to Lock In...":"Puff to Lock In..."}
          </div>
        </div>
      </div>
    );
  };

  // Input Method Panel
  const renderInputPanel = () => {
    if(!showInputPanel) return null;
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:250,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div onClick={()=>setShowInputPanel(false)} style={{position:"absolute",inset:0,background:"rgba(5,5,16,0.75)",backdropFilter:"blur(8px)"}}/>
        <div style={{position:"relative",maxWidth:430,margin:"0 auto",width:"100%",background:`linear-gradient(180deg,#0D0D28,${C.bg})`,borderRadius:"22px 22px 0 0",border:`1px solid ${C.border2}`,borderBottom:"none",padding:"8px 18px 28px",animation:"sheetUp 0.3s ease"}}>
          <div style={{width:36,height:4,borderRadius:2,background:`${C.text3}30`,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:C.text}}>Device Input Method</div>
              <div style={{fontSize:10,color:C.text3,marginTop:2}}>Arena Games + Live Shows</div>
            </div>
            <div onClick={()=>setShowInputPanel(false)} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:`${C.text3}08`,border:`1px solid ${C.border}`,fontSize:12,color:C.text3}}>✕</div>
          </div>
          <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:1.5,marginBottom:6}}>MODE</div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {INPUT_MODES.map(m=>(
              <div key={m.id} onClick={()=>{setInputMode(m.id);triggerInputPulse();if(m.id!=="ask")setSessionInput(null);}} style={{flex:1,padding:"10px 6px",borderRadius:12,cursor:"pointer",textAlign:"center",background:inputMode===m.id?`${m.color}10`:C.bg3,border:`1.5px solid ${inputMode===m.id?m.color+"40":C.border}`,transition:"all 0.25s"}}>
                <div style={{fontSize:18,marginBottom:3}}>{m.icon}</div>
                <div style={{fontSize:11,fontWeight:800,color:inputMode===m.id?m.color:C.text2}}>{m.label}</div>
                <div style={{fontSize:7,color:C.text3,marginTop:2,lineHeight:1.3}}>{m.desc}</div>
              </div>
            ))}
          </div>
          {inputMode==="fixed" && (
            <div>
              <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:1.5,marginBottom:6}}>PRIMARY INPUT</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {INPUT_TYPES.map(t=>(
                  <div key={t.id} onClick={()=>{setPrimaryInput(t.id);triggerInputPulse();}} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:primaryInput===t.id?`${t.color}08`:C.bg3,border:`1.5px solid ${primaryInput===t.id?t.color+"35":C.border}`,transition:"all 0.25s"}}>
                    <div style={{width:34,height:34,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.color}12`,border:`1px solid ${t.color}20`,fontSize:16}}>{t.icon}</div>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:primaryInput===t.id?t.color:C.text}}>{t.label}</div><div style={{fontSize:9,color:C.text3}}>{t.desc}</div></div>
                    {primaryInput===t.id && <div style={{width:18,height:18,borderRadius:"50%",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",fontWeight:900}}>✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{padding:"10px 12px",borderRadius:10,background:C.bg3,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:34,height:34,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:`${C.text3}08`,fontSize:16}}>👆</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:C.text}}>On-Screen Tap</div><div style={{fontSize:9,color:C.text3}}>Supplementary only</div></div>
            <div onClick={()=>{setTapEnabled(!tapEnabled);triggerInputPulse();}} style={{width:40,height:22,borderRadius:11,cursor:"pointer",padding:2,background:tapEnabled?C.green:`${C.text3}30`,transition:"all 0.25s",display:"flex",alignItems:"center",justifyContent:tapEnabled?"flex-end":"flex-start"}}>
              <div style={{width:18,height:18,borderRadius:9,background:"#fff",transition:"all 0.25s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
            </div>
          </div>
          <div style={{padding:"8px 12px",borderRadius:8,background:`${activeInput.color}05`,border:`1px solid ${activeInput.color}10`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13}}>{activeInput.icon}</span>
            <div style={{fontSize:10,fontWeight:600,color:activeInput.color}}>
              {inputMode==="auto"&&"Auto picks optimal input per game"}{inputMode==="fixed"&&`Always ${INPUT_TYPES.find(t=>t.id===primaryInput)?.label}`}{inputMode==="ask"&&"Will ask before each game"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Ask Prompt
  const renderAskPrompt = () => {
    if(!showAskPrompt) return null;
    const game = showAskPrompt;
    const supported = game?.inputs||["puff"];
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:260,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div onClick={()=>{setShowAskPrompt(null);window._inputCb=null;}} style={{position:"absolute",inset:0,background:"rgba(5,5,16,0.85)",backdropFilter:"blur(10px)"}}/>
        <div style={{position:"relative",width:"88%",maxWidth:340,background:`linear-gradient(135deg,#0D0D28,${C.bg2})`,borderRadius:22,border:`1px solid ${C.border2}`,padding:"22px 18px",animation:"fadeIn 0.3s ease"}}>
          <div style={{textAlign:"center",marginBottom:18}}>
            <div style={{fontSize:32,marginBottom:6}}>{game.emoji}</div>
            <div style={{fontSize:15,fontWeight:900,color:C.text}}>{game.name}</div>
            <div style={{fontSize:11,color:C.text3,marginTop:3}}>Choose input for this game</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {INPUT_TYPES.filter(t=>{if(t.id==="puff"||t.id==="dry_puff") return supported.includes("puff"); return supported.includes(t.id);}).map(t=>(
              <div key={t.id} onClick={()=>handleAskPick(t.id)} style={{padding:"12px 14px",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:`${t.color}06`,border:`1px solid ${t.color}18`,transition:"all 0.2s"}}>
                <span style={{fontSize:22}}>{t.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:t.color}}>{t.label}</div><div style={{fontSize:9,color:C.text3}}>{t.desc}</div></div>
                <span style={{fontSize:12,color:C.text3}}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════
  // ── RENDER: CONTROL TAB ──
  // ═════════════════════════════════════════
  const renderControl = () => {
    const TK=[{name:"PURPLE HAZE",type:"THC · Sativa",color:"#a855f7"},{name:"DUTCH TREAT",type:"CBD · Hybrid",color:"#22c55e"}];
    const HL=["OFF","CHILL","MED","INTENSE"],HC=[C.text3,C.blue,C.green,C.orange];
    return (
      <div style={{padding:"0 14px"}}>
        <div style={{background:`rgba(255,255,255,0.02)`,borderRadius:18,padding:"16px 14px",border:`1px solid ${C.border}`,marginBottom:16}}>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {TK.map((t,i)=>(
              <div key={i} onClick={()=>{const h=[...controlHeat];h[i]=(h[i]+1)%4;setControlHeat(h);notify(`${t.name}: ${HL[(controlHeat[i]+1)%4]}`,HC[(controlHeat[i]+1)%4]);}} style={{flex:1,padding:"12px 10px",borderRadius:12,cursor:"pointer",background:`${t.color}08`,border:`1px solid ${t.color}20`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:controlHeat[i]>0?t.color:C.text3}}/>
                  <span style={{fontSize:9,fontWeight:700,color:HC[controlHeat[i]]}}>{HL[controlHeat[i]]}</span>
                </div>
                <div style={{fontSize:12,fontWeight:800,color:C.text}}>{t.name}</div>
                <div style={{fontSize:9,color:C.text3,marginTop:1}}>{t.type}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            {[{l:"PUFFS",v:"047",c:C.cyan},{l:"VOLTAGE",v:"2.8V",c:C.orange},{l:"BATTERY",v:"78%",c:C.green}].map((s,i)=>(
              <div key={i} style={{flex:1,padding:"8px",borderRadius:10,textAlign:"center",background:`${s.c}06`,border:`1px solid ${s.c}10`}}>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:8,color:C.text3,fontWeight:600,letterSpacing:0.5}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:1.5,marginBottom:8}}>MOOD MODES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[{n:"Relax",e:"😌",c:C.blue},{n:"Focus",e:"🎯",c:C.gold},{n:"Energy",e:"⚡",c:C.green},{n:"Sleep",e:"🌙",c:C.purple},{n:"Social",e:"🎉",c:C.pink},{n:"Creative",e:"🎨",c:C.orange},{n:"Recovery",e:"💚",c:C.cyan},{n:"Custom",e:"⚙️",c:C.text2}].map((m,i)=>(
            <div key={i} onClick={()=>notify(`${m.n} Mode`,m.c)} style={{padding:"10px 4px",borderRadius:10,textAlign:"center",cursor:"pointer",background:`${m.c}06`,border:`1px solid ${m.c}12`}}>
              <div style={{fontSize:18,marginBottom:2}}>{m.e}</div>
              <div style={{fontSize:9,fontWeight:600,color:m.c}}>{m.n}</div>
            </div>
          ))}
        </div>
        <div style={{height:80}}/>
      </div>
    );
  };

  // ═════════════════════════════════════════
  // ── RENDER: LIVE TAB ──
  // ═════════════════════════════════════════
  const renderLive = () => (
    <div style={{padding:"0 14px"}}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[{id:"now",l:"🔴 Live Now"},{id:"upcoming",l:"📅 Upcoming"},{id:"watch",l:"📺 Watch Party"}].map(t=>(
          <div key={t.id} onClick={()=>setLiveTab(t.id)} style={{padding:"6px 12px",borderRadius:100,cursor:"pointer",background:liveTab===t.id?`${C.pink}12`:`${C.text3}05`,border:`1px solid ${liveTab===t.id?C.pink+"30":C.border}`,color:liveTab===t.id?C.pink:C.text3,fontSize:11,fontWeight:700,transition:"all 0.25s"}}>{t.l}</div>
        ))}
      </div>
      {liveTab==="now" && [
        {t:"🧠 Vibe Check — WC Edition",h:"MC Tuấn",v:1247,c:C.gold,act:()=>setShowVibeCheck(true)},
        {t:"⚽ Final Kick Tournament — SF",h:"System",v:856,c:C.cyan,act:()=>notify("📡 Watching...",C.cyan)},
        {t:"📺 Watch Party: USA vs Mexico",h:"Community",v:3421,c:C.lime,act:()=>setLiveTab("watch")},
      ].map((s,i)=>(
        <div key={i} onClick={s.act} style={{padding:"14px",borderRadius:14,marginBottom:10,cursor:"pointer",background:`radial-gradient(ellipse at 0% 50%, ${s.c}06, ${C.bg2} 60%)`,border:`1px solid ${s.c}12`,position:"relative"}}>
          <div style={{position:"absolute",top:10,right:10,display:"flex",alignItems:"center",gap:3}}><div style={{width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:9,fontWeight:700,color:C.red}}>LIVE</span></div>
          <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4,paddingRight:48}}>{s.t}</div>
          <div style={{display:"flex",gap:6}}><span style={{fontSize:9,color:C.text3,padding:"2px 6px",borderRadius:3,background:`${C.text3}08`}}>👁 {s.v.toLocaleString()}</span><span style={{fontSize:9,color:C.text3,padding:"2px 6px",borderRadius:3,background:`${C.text3}08`}}>🎤 {s.h}</span></div>
        </div>
      ))}
      {liveTab==="upcoming" && [
        {t:"Spin & Win Mega Friday",time:"8:00 PM",h:"DJ Minh",e:"🎰"},
        {t:"Watch Party: BRA vs GER",time:"3:00 AM",h:"Community",e:"📺"},
        {t:"WC Trivia Special",time:"Tomorrow 7PM",h:"KOL Hà Anh",e:"🧠"},
      ].map((s,i)=>(
        <div key={i} style={{padding:"12px 14px",borderRadius:12,marginBottom:8,background:C.bg2,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>{s.e}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{s.t}</div><div style={{fontSize:10,color:C.text3,marginTop:1}}>🎤 {s.h} · ⏰ {s.time}</div></div>
          <div onClick={()=>notify("🔔 Reminder set!",C.gold)} style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",background:`${C.gold}08`,border:`1px solid ${C.gold}15`,fontSize:10,fontWeight:700,color:C.gold}}>🔔</div>
        </div>
      ))}
      {liveTab==="watch" && (
        <div>
          <div style={{padding:"18px",borderRadius:16,marginBottom:12,textAlign:"center",background:`radial-gradient(ellipse at 50% 0%, ${C.lime}08, ${C.bg2} 60%)`,border:`1px solid ${C.lime}12`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:10}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:9,fontWeight:700,color:C.red,letterSpacing:1}}>LIVE · {liveScore.min+Math.floor(tick/3)%10}'</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
              <div><div style={{fontSize:26}}>🇺🇸</div><div style={{fontSize:12,fontWeight:700,color:C.text,marginTop:3}}>USA</div></div>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:32,fontWeight:900,color:C.text,letterSpacing:3}}>{liveScore.home} — {liveScore.away}</div>
              <div><div style={{fontSize:26}}>🇲🇽</div><div style={{fontSize:12,fontWeight:700,color:C.text,marginTop:3}}>MEX</div></div>
            </div>
            <div onClick={()=>{setLiveScore(s=>({...s,home:s.home+1}));notify("⚽ GOAL! USA!",C.lime);}} style={{display:"inline-block",marginTop:12,padding:"6px 14px",borderRadius:8,cursor:"pointer",background:`${C.lime}12`,border:`1px solid ${C.lime}25`,fontSize:11,fontWeight:700,color:C.lime}}>⚽ Sim Goal</div>
          </div>
          <div style={{padding:"12px",borderRadius:12,marginBottom:12,background:`${C.lime}04`,border:`1px solid ${C.lime}10`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.lime,marginBottom:6}}>⚡ Quick Predict — Next Goal?</div>
            <div style={{display:"flex",gap:6}}>
              {["🇺🇸 USA","None","🇲🇽 MEX"].map((o,i)=>(
                <div key={i} onClick={()=>puffLockIn(()=>{setCoins(c=>c+10);})} style={{flex:1,padding:"7px",borderRadius:7,textAlign:"center",cursor:"pointer",background:`${C.text3}05`,border:`1px solid ${C.border}`,fontSize:10,fontWeight:600,color:C.text2}}>{o}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{height:80}}/>
    </div>
  );

  // ═════════════════════════════════════════
  // ── RENDER: ME TAB ──
  // ═════════════════════════════════════════
  const renderMe = () => (
    <div style={{padding:"0 14px"}}>
      <div style={{textAlign:"center",padding:"20px",borderRadius:18,marginBottom:16,background:`radial-gradient(ellipse at 50% 0%, ${C.purple}08, ${C.bg2} 60%)`,border:`1px solid ${C.purple}12`}}>
        <div style={{width:56,height:56,borderRadius:18,margin:"0 auto 10px",background:`linear-gradient(135deg,${C.gold}25,${C.purple}20)`,border:`2px solid ${C.gold}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🌟</div>
        <div style={{fontSize:18,fontWeight:900,color:C.text}}>{USER.name}</div>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginTop:2}}>Lv.{USER.level} · {USER.tier}</div>
        <div style={{margin:"10px auto 0",maxWidth:200}}>
          <div style={{height:4,borderRadius:2,background:`${C.text3}15`,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:2,width:`${(xp/USER.xpNext)*100}%`,background:`linear-gradient(90deg,${C.purple},${C.cyan})`}}/>
          </div>
          <div style={{fontSize:9,color:C.text3,marginTop:3}}>{xp.toLocaleString()} / {USER.xpNext.toLocaleString()} XP</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[{l:"🪙 Coins",v:coins.toLocaleString(),c:C.gold},{l:"🎮 Games",v:"142",c:C.cyan},{l:"🏆 Wins",v:"95",c:C.green}].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"10px",borderRadius:12,textAlign:"center",background:`${s.c}06`,border:`1px solid ${s.c}10`}}>
            <div style={{fontFamily:"'Courier New',monospace",fontSize:16,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{fontSize:8,color:C.text3,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:800,color:C.text,marginBottom:8}}>🎖 Badges</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {BADGES.map((b,i)=>(
          <div key={i} style={{padding:"10px 4px",borderRadius:10,textAlign:"center",background:b.earned?`${C.gold}06`:`${C.text3}04`,border:`1px solid ${b.earned?C.gold+"12":C.text3+"06"}`,opacity:b.earned?1:0.35}}>
            <div style={{fontSize:20,filter:b.earned?"none":"grayscale(1)"}}>{b.emoji}</div>
            <div style={{fontSize:7,fontWeight:700,color:b.earned?C.gold:C.text3,marginTop:2}}>{b.name}</div>
          </div>
        ))}
      </div>
      <div style={{height:80}}/>
    </div>
  );

  // ═════════════════════════════════════════
  // ── MAIN RENDER ──
  // ═════════════════════════════════════════
  const tabColors = {control:C.cyan,arena:C.cyan,live:C.pink,me:C.purple};

  return (
    <div style={{maxWidth:430,margin:"0 auto",height:"100vh",background:(tab==="arena"&&!zone)?"transparent":C.bg,fontFamily:"'Segoe UI','SF Pro Display',system-ui,sans-serif",position:"relative",overflow:"hidden",color:C.text,display:"flex",flexDirection:"column"}}>

      {/* Background mesh (hidden when arena images are showing) */}
      {(tab!=="arena"||zone) && <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0,
        background:`radial-gradient(ellipse 60% 40% at 20% 10%, ${C.cyan}04, transparent 50%), radial-gradient(ellipse 50% 40% at 80% 90%, ${C.purple}04, transparent 50%), radial-gradient(ellipse 40% 30% at 50% 50%, ${C.gold}02, transparent 60%)`,
      }}/>}

      {/* Noise overlay (hidden when arena images are showing) */}
      {(tab!=="arena"||zone) && <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:1,opacity:0.03,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}/>}

      {renderAtmosphere()}

      {/* Notification */}
      {notif && (
        <div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",maxWidth:360,padding:"8px 18px",borderRadius:100,zIndex:300,background:`${notif.color}15`,border:`1px solid ${notif.color}30`,color:notif.color,fontSize:12,fontWeight:700,backdropFilter:"blur(12px)",textAlign:"center",animation:"fadeIn 0.25s ease",letterSpacing:0.3}}>{notif.msg}</div>
      )}

      {/* Header — always visible across all pages */}
      <div style={{padding:"12px 14px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:20}}>
        <div style={{fontSize:9,fontWeight:600,color:C.text3,letterSpacing:1.5}}>{(tab==="arena"&&!zone&&arenaView==="hub")?"Powered by ":""}<span style={{fontWeight:800,color:C.text2,letterSpacing:2}}>MOOD LAB</span></div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {/* Input method button */}
          <div onClick={()=>setShowInputPanel(true)} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:100,cursor:"pointer",...LG.pill,border:`1px solid ${activeInput.color}${inputPulse?"50":"18"}`,transition:"all 0.3s",boxShadow:inputPulse?`0 0 10px ${activeInput.color}25`:LG.pill.boxShadow}}>
            <span style={{fontSize:11}}>{activeInput.icon}</span>
            <span style={{fontSize:9,fontWeight:700,color:activeInput.color}}>{activeInput.label}</span>
            <span style={{fontSize:7,color:C.text3}}>▼</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:100,background:`${C.gold}08`,border:`1px solid ${C.gold}15`}}>
            <span style={{fontSize:10}}>🪙</span><span style={{fontSize:11,fontWeight:800,color:C.gold,fontFamily:"'Courier New',monospace"}}>{coins.toLocaleString()}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:100,background:`${C.green}08`,border:`1px solid ${C.green}15`}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.green}}/><span style={{fontSize:9,fontWeight:600,color:C.green}}>BLE</span>
          </div>
        </div>
      </div>

      {/* Live Ticker — universal across all pages */}
      {renderTicker()}

      {/* Tab Title (hide during arena zone focus — image BG handles it) */}
      {(tab!=="arena" || zone || arenaView==="hub") && (
        <div style={{padding:"6px 14px 10px",position:"relative",zIndex:5}}>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:-0.5}}>
            {tab==="control"?"Control":tab==="arena"?(zone?Z[zone]?.name:"Arena"):tab==="live"?"Live":"Me"}
          </div>
        </div>
      )}

      {/* Content — scrollable area, fixed height */}
      <div style={{position:"relative",zIndex:5,flex:1,overflow:(tab==="arena"&&!zone)?"hidden":"auto",paddingBottom:(tab==="arena"&&!zone)?0:80}}>
        {tab==="control" && renderControl()}
        {tab==="arena" && !zone && renderArenaHub()}
        {tab==="arena" && zone==="arcade" && renderArcade()}
        {tab==="arena" && zone==="stage" && renderStage()}
        {tab==="arena" && zone==="oracle" && renderOracle()}
        {tab==="arena" && zone==="wall" && renderWall()}
        {tab==="live" && renderLive()}
        {tab==="me" && renderMe()}
      </div>

      {/* Universal chat button — always visible, aligned with nav */}
      <div onClick={()=>setChatPanel(!chatPanel)} style={{position:"fixed",bottom:18,right:14,zIndex:55,
        width:42,height:42,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
        ...GLASS_CLEAR,cursor:"pointer",fontSize:16,
      }}>
        💬
        <div style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 4px ${C.green}`}}/>
      </div>

      {/* Universal inline chat — above nav when toggled on */}
      {chatPanel ? <div style={{position:"fixed",bottom:66,left:10,right:10,zIndex:54,maxWidth:410,margin:"0 auto",animation:"panelSlideUp 0.3s ease both"}}>
        <div style={{borderRadius:18,overflow:"hidden",...GLASS_CARD}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:12,fontWeight:800,color:C.text}}>💬 Chat</span>
              <div style={{display:"flex",alignItems:"center",gap:3}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:9,fontWeight:700,color:C.green}}>{playersNow.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div ref={chatRef} style={{padding:"6px 12px",maxHeight:80,overflow:"auto"}}>
            {chatMessages.slice(-6).map((m,i)=>(
              <div key={i} style={{marginBottom:3,borderLeft:m.isYou?`2px solid ${C.cyan}`:"none",paddingLeft:m.isYou?6:0}}>
                <span style={{fontSize:9,fontWeight:700,color:m.c}}>{m.u}</span>
                <span style={{fontSize:9,color:m.isYou?C.text:C.text2,marginLeft:4}}>{m.m}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:2,padding:"4px 8px",borderTop:`1px solid ${C.border}`}}>
            {["🔥","😂","🤯","👏","💀","❤️","⚽","🏆"].map((e,i)=>(
              <div key={i} onClick={()=>sendChat(e)} style={{width:26,height:24,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",background:`${C.text3}06`}}>{e}</div>
            ))}
          </div>
          <div style={{display:"flex",gap:5,padding:"5px 8px 8px",borderTop:`1px solid ${C.border}`}}>
            <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendChat();}} placeholder="Say something..." style={{flex:1,padding:"6px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.03)",color:C.text,fontSize:10,outline:"none",fontFamily:"inherit"}}/>
            <div onClick={()=>sendChat()} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",background:`${C.cyan}12`,border:`1px solid ${C.cyan}20`,fontSize:10,fontWeight:700,color:C.cyan}}>Send</div>
          </div>
        </div>
      </div> : null}

      {/* Overlays */}
      {renderGameOverlay()}
      {renderVibeCheck()}
      {renderSpin()}
      {renderPuffLock()}
      {renderInputPanel()}
      {renderAskPrompt()}

      {/* Bottom Nav — Floating pill dock (hidden on arena hub) */}
      <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:50,display:(tab==="arena"&&!zone)?"none":"flex",justifyContent:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:3,padding:"4px 5px",borderRadius:100,
          ...GLASS_CLEAR,
        }}>
          {[{id:"control",l:"Control",i:"🎛",c:C.cyan},{id:"arena",l:"Arena",i:"🎮",c:C.cyan},{id:"live",l:"Live",i:"📡",c:C.pink},{id:"me",l:"Me",i:"👤",c:C.purple}].map(t=>{
            const active = tab===t.id;
            return (
              <div key={t.id} onClick={()=>{if(t.id!=="arena"){notify("Coming Soon — Arena Demo Only",C.cyan);return;}setTab(t.id);setZone(null);setArenaView("hub");}} style={{
                display:"flex",alignItems:"center",gap:active?5:0,
                padding:active?"7px 14px":"7px 10px",
                borderRadius:100,cursor:"pointer",
                background:active?`${t.c}20`:"transparent",
                transition:"all 0.3s ease",position:"relative",
              }}>
                <span style={{fontSize:16,opacity:active?1:0.4,transition:"opacity 0.3s"}}>{t.i}</span>
                {active ? <span style={{fontSize:11,fontWeight:700,color:t.c,whiteSpace:"nowrap"}}>{t.l}</span> : null}
                {t.id==="live" ? <div style={{position:"absolute",top:3,right:active?8:4,width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/> : null}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes breathe{0%,100%{opacity:1;transform:scale(1) translateX(-50%)}50%{opacity:.7;transform:scale(1.05) translateX(-50%)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatUp{0%{opacity:0;transform:translateY(0)}15%{opacity:0.8}85%{opacity:0.5}100%{opacity:0;transform:translateY(-400px)}}
        @keyframes zoneEntry{from{opacity:0;transform:scale(0.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes borderShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes lightSweep{0%{transform:translateX(-200%) skewX(-15deg)}100%{transform:translateX(400%) skewX(-15deg)}}
        @keyframes jumbotronProgress{from{width:0%}to{width:100%}}
        @keyframes portalParticle{0%{opacity:0;transform:translateY(0) scale(0.5)}20%{opacity:0.7;transform:translateY(-10px) scale(1)}100%{opacity:0;transform:translateY(-65px) scale(0.3)}}
        @keyframes gridScan{0%{top:100%}100%{top:-2px}}
        @keyframes energyPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.15}50%{transform:translate(-50%,-50%) scale(1.15);opacity:0.04}}
        @keyframes gentleFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes countPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes arenaFadeIn{from{opacity:0;transform:translateY(15px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes glowShift{0%,100%{box-shadow:0 0 40px rgba(0,229,255,0.06),0 0 80px rgba(255,217,61,0.03)}50%{box-shadow:0 0 60px rgba(192,132,252,0.06),0 0 100px rgba(255,77,141,0.03)}}
        @keyframes neonFlicker{0%,18%,22%,25%,53%,57%,100%{opacity:1}20%{opacity:0.6}24%{opacity:0.8}55%{opacity:0.7}}
        @keyframes kioskRevealL{from{opacity:0;transform:perspective(1000px) rotateY(6deg) translateX(-20px)}to{opacity:1;transform:perspective(1000px) rotateY(1.5deg) translateX(0)}}
        @keyframes kioskRevealR{from{opacity:0;transform:perspective(1000px) rotateY(-6deg) translateX(20px)}to{opacity:1;transform:perspective(1000px) rotateY(-1.5deg) translateX(0)}}
        @keyframes neonSign{0%,100%{text-shadow:0 0 7px var(--nc),0 0 15px var(--nc),0 0 30px var(--nc)}50%{text-shadow:0 0 4px var(--nc),0 0 10px var(--nc),0 0 20px var(--nc)}}
        @keyframes corridorPulse{0%,100%{opacity:0.5}50%{opacity:0.8}}
        @keyframes walkFlash{0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}}
        @keyframes loadingImageReveal{0%{opacity:0;transform:scale(1.1)}60%{opacity:0.6;transform:scale(1.03)}100%{opacity:0.8;transform:scale(1)}}
        @keyframes loadingTextReveal{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes loadingBar{0%{width:0}100%{width:100%}}
        @keyframes panelSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glassFloatIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        *{-webkit-tap-highlight-color:transparent;user-select:none;box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:2px;height:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}
      `}</style>
    </div>
  );
}
