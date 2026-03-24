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
  text:"#F0EEFF", text2:"#A8A3D0", text3:"#6E6A95",
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
  { id:"finalkick2", name:"Final Kick 2", emoji:"⚽🔥", players:"2", time:"2-3m", type:"Precision", color:C.gold, desc:"Double puff! Aim X-axis + Y-axis separately.", hot:true, inputs:["puff","button"] },
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

// ── WORLD CUP 2026 — NATIONAL TEAMS (48 qualified + Vietnam + China) ──
const WC_TEAMS = [
  // CONCACAF (Hosts + qualified)
  {id:"usa",name:"USA",flag:"\u{1F1FA}\u{1F1F8}",group:"A",rating:4,confederation:"CONCACAF"},
  {id:"mex",name:"Mexico",flag:"\u{1F1F2}\u{1F1FD}",group:"A",rating:3,confederation:"CONCACAF"},
  {id:"can",name:"Canada",flag:"\u{1F1E8}\u{1F1E6}",group:"A",rating:3,confederation:"CONCACAF"},
  // CONMEBOL
  {id:"bra",name:"Brazil",flag:"\u{1F1E7}\u{1F1F7}",group:"F",rating:5,confederation:"CONMEBOL"},
  {id:"arg",name:"Argentina",flag:"\u{1F1E6}\u{1F1F7}",group:"C",rating:5,confederation:"CONMEBOL"},
  {id:"col",name:"Colombia",flag:"\u{1F1E8}\u{1F1F4}",group:"H",rating:4,confederation:"CONMEBOL"},
  {id:"uru",name:"Uruguay",flag:"\u{1F1FA}\u{1F1FE}",group:"H",rating:4,confederation:"CONMEBOL"},
  {id:"ecu",name:"Ecuador",flag:"\u{1F1EA}\u{1F1E8}",group:"G",rating:3,confederation:"CONMEBOL"},
  {id:"per",name:"Peru",flag:"\u{1F1F5}\u{1F1EA}",group:"I",rating:3,confederation:"CONMEBOL"},
  {id:"par",name:"Paraguay",flag:"\u{1F1F5}\u{1F1FE}",group:"L",rating:2,confederation:"CONMEBOL"},
  // UEFA
  {id:"ger",name:"Germany",flag:"\u{1F1E9}\u{1F1EA}",group:"F",rating:5,confederation:"UEFA"},
  {id:"fra",name:"France",flag:"\u{1F1EB}\u{1F1F7}",group:"C",rating:5,confederation:"UEFA"},
  {id:"eng",name:"England",flag:"\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",group:"B",rating:5,confederation:"UEFA"},
  {id:"esp",name:"Spain",flag:"\u{1F1EA}\u{1F1F8}",group:"E",rating:5,confederation:"UEFA"},
  {id:"por",name:"Portugal",flag:"\u{1F1F5}\u{1F1F9}",group:"E",rating:5,confederation:"UEFA"},
  {id:"ned",name:"Netherlands",flag:"\u{1F1F3}\u{1F1F1}",group:"D",rating:4,confederation:"UEFA"},
  {id:"bel",name:"Belgium",flag:"\u{1F1E7}\u{1F1EA}",group:"D",rating:4,confederation:"UEFA"},
  {id:"ita",name:"Italy",flag:"\u{1F1EE}\u{1F1F9}",group:"B",rating:4,confederation:"UEFA"},
  {id:"cro",name:"Croatia",flag:"\u{1F1ED}\u{1F1F7}",group:"G",rating:4,confederation:"UEFA"},
  {id:"den",name:"Denmark",flag:"\u{1F1E9}\u{1F1F0}",group:"J",rating:3,confederation:"UEFA"},
  {id:"sui",name:"Switzerland",flag:"\u{1F1E8}\u{1F1ED}",group:"J",rating:3,confederation:"UEFA"},
  {id:"aut",name:"Austria",flag:"\u{1F1E6}\u{1F1F9}",group:"K",rating:3,confederation:"UEFA"},
  {id:"srb",name:"Serbia",flag:"\u{1F1F7}\u{1F1F8}",group:"K",rating:3,confederation:"UEFA"},
  {id:"pol",name:"Poland",flag:"\u{1F1F5}\u{1F1F1}",group:"I",rating:3,confederation:"UEFA"},
  {id:"sco",name:"Scotland",flag:"\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",group:"L",rating:2,confederation:"UEFA"},
  {id:"wal",name:"Wales",flag:"\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",group:"L",rating:2,confederation:"UEFA"},
  {id:"tur",name:"Turkey",flag:"\u{1F1F9}\u{1F1F7}",group:"K",rating:3,confederation:"UEFA"},
  {id:"ukr",name:"Ukraine",flag:"\u{1F1FA}\u{1F1E6}",group:"I",rating:3,confederation:"UEFA"},
  // AFC
  {id:"jpn",name:"Japan",flag:"\u{1F1EF}\u{1F1F5}",group:"D",rating:4,confederation:"AFC"},
  {id:"kor",name:"South Korea",flag:"\u{1F1F0}\u{1F1F7}",group:"G",rating:3,confederation:"AFC"},
  {id:"aus",name:"Australia",flag:"\u{1F1E6}\u{1F1FA}",group:"B",rating:3,confederation:"AFC"},
  {id:"ksa",name:"Saudi Arabia",flag:"\u{1F1F8}\u{1F1E6}",group:"F",rating:2,confederation:"AFC"},
  {id:"irn",name:"Iran",flag:"\u{1F1EE}\u{1F1F7}",group:"C",rating:3,confederation:"AFC"},
  {id:"qat",name:"Qatar",flag:"\u{1F1F6}\u{1F1E6}",group:"J",rating:2,confederation:"AFC"},
  {id:"irq",name:"Iraq",flag:"\u{1F1EE}\u{1F1F6}",group:"J",rating:2,confederation:"AFC"},
  {id:"uzb",name:"Uzbekistan",flag:"\u{1F1FA}\u{1F1FF}",group:"H",rating:2,confederation:"AFC"},
  {id:"idn",name:"Indonesia",flag:"\u{1F1EE}\u{1F1E9}",group:"E",rating:1,confederation:"AFC"},
  {id:"bhr",name:"Bahrain",flag:"\u{1F1E7}\u{1F1ED}",group:"L",rating:1,confederation:"AFC"},
  // CAF
  {id:"mar",name:"Morocco",flag:"\u{1F1F2}\u{1F1E6}",group:"F",rating:4,confederation:"CAF"},
  {id:"sen",name:"Senegal",flag:"\u{1F1F8}\u{1F1F3}",group:"C",rating:4,confederation:"CAF"},
  {id:"nga",name:"Nigeria",flag:"\u{1F1F3}\u{1F1EC}",group:"D",rating:3,confederation:"CAF"},
  {id:"egy",name:"Egypt",flag:"\u{1F1EA}\u{1F1EC}",group:"G",rating:3,confederation:"CAF"},
  {id:"cmr",name:"Cameroon",flag:"\u{1F1E8}\u{1F1F2}",group:"H",rating:3,confederation:"CAF"},
  {id:"rsa",name:"South Africa",flag:"\u{1F1FF}\u{1F1E6}",group:"E",rating:2,confederation:"CAF"},
  {id:"mli",name:"Mali",flag:"\u{1F1F2}\u{1F1F1}",group:"I",rating:2,confederation:"CAF"},
  {id:"cod",name:"DR Congo",flag:"\u{1F1E8}\u{1F1E9}",group:"K",rating:2,confederation:"CAF"},
  {id:"civ",name:"Ivory Coast",flag:"\u{1F1E8}\u{1F1EE}",group:"A",rating:3,confederation:"CAF"},
  // OFC
  {id:"nzl",name:"New Zealand",flag:"\u{1F1F3}\u{1F1FF}",group:"B",rating:2,confederation:"OFC"},
  // BONUS TEAMS
  {id:"vnm",name:"Vietnam",flag:"\u{1F1FB}\u{1F1F3}",group:"BONUS",rating:1,confederation:"AFC"},
  {id:"chn",name:"China",flag:"\u{1F1E8}\u{1F1F3}",group:"BONUS",rating:2,confederation:"AFC"},
];

const WC_GROUPS = {
  A:["usa","mex","can","civ"], B:["eng","ita","aus","nzl"], C:["arg","fra","irn","sen"],
  D:["ned","bel","jpn","nga"], E:["esp","por","idn","rsa"], F:["bra","ger","ksa","mar"],
  G:["cro","kor","ecu","egy"], H:["col","uru","uzb","cmr"], I:["pol","ukr","per","mli"],
  J:["den","sui","qat","irq"], K:["aut","srb","tur","cod"], L:["par","sco","wal","bhr"],
};

const WC_PRIZES = {
  gold:   {label:"\u{1F947} Champion",  pts:50000, coins:500, title:"World Champion"},
  silver: {label:"\u{1F948} Runner-Up", pts:25000, coins:250, title:"Runner-Up"},
  bronze: {label:"\u{1F949} Third",     pts:10000, coins:100, title:"Third Place"},
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
  const [actionTimer, setActionTimer] = useState(3); // 3s countdown for actions
  const actionTimerRef = useRef(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [wcDeviceInput, setWcDeviceInput] = useState(null); // device input locked for tournament
  const [fanMode, setFanMode] = useState(null); // null | "team_select" | "device_select" | "watching"
  const [fanTeam, setFanTeam] = useState(null); // fan's chosen team
  const [fanDevice, setFanDevice] = useState(null); // fan's device control
  const kickChargeInterval = useRef(null);
  const [kickComment, setKickComment] = useState("");
  const [kickSweetMin, setKickSweetMin] = useState(70); // random sweet spot per round
  const [kickSweetMax, setKickSweetMax] = useState(95);
  const [kickBonusAvail, setKickBonusAvail] = useState(false); // double-hold bonus available
  const [kickBonusUsed, setKickBonusUsed] = useState(false); // already used this game
  const [kickBonusActive, setKickBonusActive] = useState(false); // currently in bonus shot
  const [kickStats, setKickStats] = useState({goals:0,saves:0,perfects:0,blinkers:0,misses:0});
  const [kickChatOn, setKickChatOn] = useState(true); // chat panel ON by default in game
  // ── Final Kick 2 ──
  const [isFK2Mode, setIsFK2Mode] = useState(false); // persisted FK2 flag
  const isFK2Ref = useRef(false); // synchronous FK2 flag (refs update immediately)
  const [fk2Phase, setFk2Phase] = useState(null); // "x" | "y" | null
  const [fk2X, setFk2X] = useState(0);
  const [fk2Y, setFk2Y] = useState(0);
  const [fk2XDone, setFk2XDone] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [arcadeTab, setArcadeTab] = useState("games");

  // ── Visual Effects Engine ──
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState(null); // null | "goal" | "save" | "miss" | "blinker"
  const [confettiParticles, setConfettiParticles] = useState([]);
  const [smokeParticles, setSmokeParticles] = useState([]);
  const [puffWaveActive, setPuffWaveActive] = useState(false);
  const [matchIntro, setMatchIntro] = useState(null); // null | {stage:"enter"|"stats"|"countdown"|"go", count:3}
  const [commentatorText, setCommentatorText] = useState("");
  const [dimLights, setDimLights] = useState(false); // dims during puff charge
  const [puffBubbles, setPuffBubbles] = useState([]); // floating puff bubbles during charge
  const [audienceBubbles, setAudienceBubbles] = useState([]); // random audience puff bubbles

  // ── Audience Side System ──
  const [audienceSide, setAudienceSide] = useState("you"); // "you" | "ai"
  const [audienceTraitor, setAudienceTraitor] = useState(false); // switched sides
  const [audienceSwitchCount, setAudienceSwitchCount] = useState(0);
  const [sideChat, setSideChat] = useState({you:[
    {u:"Fan_420",m:"LET'S GO STEVE! 🔥",c:C.cyan,t:Date.now()-10000},
    {u:"PuffQueen",m:"Sweet spot this round 💨👑",c:C.pink,t:Date.now()-5000},
  ],ai:[
    {u:"BotFan1",m:"AI got this 🤖",c:C.red,t:Date.now()-8000},
    {u:"Skeptic",m:"No way human wins lol 💀",c:C.orange,t:Date.now()-3000},
  ]});
  const [sideFans, setSideFans] = useState({you:Math.floor(8+Math.random()*15), ai:Math.floor(5+Math.random()*12)});
  const [kickPrediction, setKickPrediction] = useState(null); // "goal" | "save" | null
  const [kickPredResult, setKickPredResult] = useState(null); // {correct:bool} for last prediction
  const [gameBottomTab, setGameBottomTab] = useState("chat"); // "chat" | "stats"

  // ── Device ──
  const [deviceModel, setDeviceModel] = useState("cc_s2");

  // ── Social ──
  const [chatMessages, setChatMessages] = useState([
    {u:"VibeKing",m:"Who's ready for USA vs MEX? 🇺🇸🔥",c:C.pink,t:Date.now()-60000},
    {u:"NeonQueen",m:"My bracket is locked 🔮",c:C.purple,t:Date.now()-45000},
    {u:"CloudNine99",m:"Just won 3 in a row ⚽",c:C.cyan,t:Date.now()-30000},
  ]);
  const [chatInput, setChatInput] = useState("");
  const [mergedChat, setMergedChat] = useState([]); // merged both-sides chat for breaks/postgame
  const [postGameChat, setPostGameChat] = useState(false); // 10min postgame chat active
  const [chatExpanded, setChatExpanded] = useState(false);
  const [lbTab, setLbTab] = useState("global");
  const [tournaments, setTournaments] = useState(TOURNAMENTS);
  const chatRef = useRef(null);

  // ── Input Method ──
  const [inputMode, setInputMode] = useState("auto");
  const [primaryInput, setPrimaryInput] = useState("puff");
  const [tapEnabled, setTapEnabled] = useState(true);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [showBlePopup, setShowBlePopup] = useState(false);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleScanning, setBleScanning] = useState(false);
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

  // ── World Cup Tournament ──
  const [wcTeam, setWcTeam] = useState(null);           // selected team {id,name,flag,...}
  const [wcTournament, setWcTournament] = useState(null); // active tournament state {group,opponents,standings,knockoutRound,...}
  const [wcGameId, setWcGameId] = useState("finalkick");  // which FK variant for WC ("finalkick" or "finalkick2")
  const [wcPhase, setWcPhase] = useState(null);          // null|"team_select"|"group_draw"|"group_stage"|"knockout"|"result"
  const [wcCooldown, setWcCooldown] = useState(null);    // timestamp of last tournament entry
  const [wcMatchday, setWcMatchday] = useState(0);       // current matchday in group (0-2)
  const [wcBracket, setWcBracket] = useState(null);      // knockout bracket data {round,opponent,results}
  const [wcDrawAnim, setWcDrawAnim] = useState(false);   // group draw animation active
  const [wcGroupResult, setWcGroupResult] = useState(null); // after group stage — "advance"|"eliminated"
  const [wcFinalResult, setWcFinalResult] = useState(null); // "gold"|"silver"|"bronze"|"fourth"|"group"
  const [wcViewTab, setWcViewTab] = useState("mygroup"); // "mygroup" | "allgroups" | "bracket"

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
  useEffect(() => { const t=setInterval(()=>{setTick(p=>p+1);if(gameActive&&(gameActive.id==="finalkick"||gameActive.id==="finalkick2")&&kickState&&Math.random()<0.3)spawnAudienceBubble();},1000); return()=>clearInterval(t); }, [gameActive,kickState]);
  useEffect(() => { const t=setInterval(()=>setMainStage(p=>(p+1)%3),5000); return()=>clearInterval(t); }, []);
  useEffect(() => { const t=setInterval(()=>setTickerOffset(p=>p-0.5),30); return()=>clearInterval(t); }, []);

  // ── 3s Action Timer ──
  // Timer runs for: shoot (FK1 zone pick), save_dive (pick zone)
  // FK2 shoot_x/shoot_y: NO timer — user puffs at their own pace
  // Timer STOPS once user starts charging (kickCharging=true)
  // Timer does NOT start during match intro (matchIntro !== null)
  useEffect(() => {
    const timerStates = ["shoot","save_dive"]; // FK2 excluded — no timer for puff aiming
    if(timerStates.includes(kickState) && !kickCharging && !matchIntro) {
      setActionTimer(3);
      if(actionTimerRef.current) clearInterval(actionTimerRef.current);
      actionTimerRef.current = setInterval(()=>{
        setActionTimer(p=>{
          if(p<=1) {
            clearInterval(actionTimerRef.current); actionTimerRef.current=null;
            if(kickState==="shoot") { const rz=Math.floor(Math.random()*6); kickSelectZone(rz); playFx("error"); setCommentary("Too slow! Auto-kick! 🐌"); }
            else if(kickState==="save_dive") { const rz=Math.floor(Math.random()*6); kickDive(rz); playFx("error"); setCommentary("Too slow! Random dive! 🐌"); }
            return 0;
          }
          return p-1;
        });
      },1000);
    } else {
      // Clear timer when charging starts or state changes to non-timer state
      if(actionTimerRef.current){clearInterval(actionTimerRef.current);actionTimerRef.current=null;}
      if(kickCharging) setActionTimer(0);
    }
    return()=>{if(actionTimerRef.current){clearInterval(actionTimerRef.current);actionTimerRef.current=null;}};
  }, [kickState, kickCharging, matchIntro]);

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
    // Always ask user to choose input method before each game
    setShowAskPrompt(game);window._inputCb=callback;
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
        setTimeout(()=>{setMatchmaking(null);setGameActive({...game,activeInput:input});if(game.id==="wildwest")startDuel();if(game.id==="finalkick"||game.id==="finalkick2"){startKick(game.id);startMatchIntro(kickOpponent.current);}},800);
      },mode==="ai"?400:1200);
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
      // ── UI tap sounds ──
      else if(type==="tap"){osc.type="sine";osc.frequency.setValueAtTime(800,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(600,ac.currentTime+0.06);gain.gain.setValueAtTime(0.08,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.08);osc.start();osc.stop(ac.currentTime+0.08);}
      else if(type==="select"){osc.type="sine";osc.frequency.setValueAtTime(600,ac.currentTime);osc.frequency.setValueAtTime(900,ac.currentTime+0.05);gain.gain.setValueAtTime(0.1,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.12);osc.start();osc.stop(ac.currentTime+0.12);}
      else if(type==="nav"){osc.type="sine";osc.frequency.setValueAtTime(440,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(660,ac.currentTime+0.08);gain.gain.setValueAtTime(0.06,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.1);osc.start();osc.stop(ac.currentTime+0.1);}
      else if(type==="back"){osc.type="sine";osc.frequency.setValueAtTime(660,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(330,ac.currentTime+0.1);gain.gain.setValueAtTime(0.06,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.12);osc.start();osc.stop(ac.currentTime+0.12);}
      else if(type==="success"){osc.type="sine";osc.frequency.setValueAtTime(523,ac.currentTime);osc.frequency.setValueAtTime(659,ac.currentTime+0.08);osc.frequency.setValueAtTime(784,ac.currentTime+0.16);gain.gain.setValueAtTime(0.1,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.25);osc.start();osc.stop(ac.currentTime+0.25);}
      else if(type==="error"){osc.type="square";osc.frequency.setValueAtTime(200,ac.currentTime);osc.frequency.setValueAtTime(150,ac.currentTime+0.1);gain.gain.setValueAtTime(0.06,ac.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.15);osc.start();osc.stop(ac.currentTime+0.15);}
    } catch(e){}
  }, [audioOn]);

  // ── Visual Effects Functions ──
  const triggerFlash = (type) => { setScreenFlash(type); setTimeout(()=>setScreenFlash(null), 400); };
  const triggerShake = () => { setScreenShake(true); setTimeout(()=>setScreenShake(false), 500); };
  const spawnConfetti = (count=30,colors=[C.cyan,C.gold,C.green,C.pink,C.orange]) => {
    const particles = Array.from({length:count},(_,i)=>({
      id:Date.now()+i, x:30+Math.random()*40, y:-5, color:colors[Math.floor(Math.random()*colors.length)],
      vx:(Math.random()-0.5)*4, vy:2+Math.random()*3, rot:Math.random()*360, size:3+Math.random()*5,
    }));
    setConfettiParticles(p=>[...p,...particles]);
    setTimeout(()=>setConfettiParticles([]),3000);
  };
  const spawnSmoke = (count=8) => {
    const puffs = Array.from({length:count},(_,i)=>({
      id:Date.now()+i, x:20+Math.random()*60, y:70+Math.random()*20,
      size:20+Math.random()*40, dur:2+Math.random()*2,
    }));
    setSmokeParticles(p=>[...p,...puffs]);
    setTimeout(()=>setSmokeParticles([]),4000);
  };
  const triggerPuffWave = () => { setPuffWaveActive(true); spawnSmoke(15); setTimeout(()=>setPuffWaveActive(false),3000); };
  const setCommentary = (text) => { setCommentatorText(text); };

  // ── Match Intro Sequence ──
  const startMatchIntro = (opponent) => {
    setMatchIntro({stage:"enter",count:3});
    setCommentary("The players are entering the field... 🏟️");
    playFx("crowd");
    setTimeout(()=>{
      setMatchIntro({stage:"stats",count:3});
      setCommentary("Let's see the stats! Who has the edge? 📊");
    },1200);
    setTimeout(()=>{
      setMatchIntro({stage:"countdown",count:3});
      setCommentary("HERE WE GO!");
      playFx("whistle");
    },2400);
    setTimeout(()=>setMatchIntro(p=>p?{...p,count:2}:null),3100);
    setTimeout(()=>setMatchIntro(p=>p?{...p,count:1}:null),3800);
    setTimeout(()=>{
      setMatchIntro({stage:"go",count:0});
      setCommentary("⚽ KICK OFF! Let the game begin!");
      triggerFlash("goal"); playFx("crowd");
    },4500);
    setTimeout(()=>setMatchIntro(null),5200);
  };

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

  // gameId param needed because gameActive may not be set yet (React async state)
  const startKick = (gameId) => {
    const resolvedId = gameId || gameActive?.id || "finalkick";
    const isFK2 = resolvedId === "finalkick2";
    const baseOpp = pick(AI_OPPONENTS);
    // If user has a team selected (quick play), assign opponent a random nation too
    if(wcTeam && !gameActive?.wcMode) {
      const oppTeam = pick(WC_TEAMS.filter(t=>t.id!==wcTeam.id));
      kickOpponent.current = {...baseOpp, emoji:oppTeam.flag, name:oppTeam.name+" "+baseOpp.name, oppTeam};
    } else {
      kickOpponent.current = baseOpp;
    }
    setKickRound(0); setKickScore({you:0,ai:0});
    setKickAim(null); setKickPower(0); setKickAiZone(null);
    setKickSaveZone(null); setKickBallAnim(null); setKickDiveAnim(null);
    setKickCharging(false); setKickBonusUsed(false); setKickBonusAvail(false); setKickBonusActive(false);
    setKickStats({goals:0,saves:0,perfects:0,blinkers:0,misses:0});
    const ss = randomizeSweetSpot();
    setIsFK2Mode(isFK2); isFK2Ref.current = isFK2;
    if(isFK2) {
      setKickState("shoot_x");
      setFk2Phase("x"); setFk2X(0); setFk2Y(0); setFk2XDone(false);
      setKickComment("Aim LEFT or RIGHT! Tap to lock! ← → 👆");
    } else {
      setKickState("shoot");
      setKickComment(pick(["Let's gooo 🔥","Time to ball ⚽","No pressure 😅","Sweet spot: "+ss.holdMin+"-"+ss.holdMax+"s 🎯"]));
    }
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

  // ── FK2: Hold-to-puff for X and Y axes ──
  // X: hold longer = further RIGHT. Y: hold longer = HIGHER.
  // Uses same kickPower (0-100%) as FK1 but maps to position instead of shot power.

  // FK2 lock X position (called from kickStopCharge)
  const fk2LockX = (xPos) => {
    setFk2X(xPos);
    setFk2XDone(true);
    setFk2Phase("y");
    setKickState("shoot_y");
    setKickPower(0); setKickCharging(false);
    const inSweet = xPos >= kickSweetMin && xPos <= kickSweetMax;
    const outOfBounds = xPos < 10 || xPos > 90;
    if(outOfBounds) { setKickComment(pick(["WIDE! Too far! 🌊","That's the stands! 💀","Off the pitch! 😂"])); playFx("laugh"); }
    else if(inSweet) { setKickComment("Nice X aim! 🎯 Now puff for HEIGHT! ↕️"); }
    else { setKickComment("X locked! Now HOLD TO PUFF for height! ↕️ 💨"); }
    playFx("select");
    setCommentary("Horizontal locked! Now aim VERTICAL! ↕️");
  };

  // FK2 lock Y position + execute kick (called from kickStopCharge)
  const fk2LockY = (yPos) => {
    setFk2Y(yPos);
    setFk2Phase(null);
    setKickCharging(false);
    // Map X+Y to zone (3 cols x 2 rows)
    const col = fk2X < 33 ? 0 : fk2X < 67 ? 1 : 2;
    const row = yPos > 50 ? 0 : 1; // high puff = top row
    const zone = row * 3 + col;
    const xOutOfBounds = fk2X < 10 || fk2X > 90;
    const yOutOfBounds = yPos > 95;
    const xInSweet = fk2X >= kickSweetMin && fk2X <= kickSweetMax;
    const yInSweet = yPos >= kickSweetMin && yPos <= kickSweetMax;
    const bothSweet = xInSweet && yInSweet;
    const forceMiss = xOutOfBounds || yOutOfBounds;
    setKickAim(zone);
    if(yOutOfBounds) { setKickComment(pick(["OVER THE BAR! 🚀","Ball in orbit 🛸","That's a satellite 💀"])); playFx("laugh"); }
    else if(xOutOfBounds) { setKickComment(pick(["WIDE LEFT/RIGHT! 🌊","Ball's in the car park 💀"])); playFx("laugh"); }
    else if(bothSweet) { setKickComment(pick(["DOUBLE SWEET SPOT! 🎯🎯","SNIPER PUFF! 🔥","PRECISION KING! 👑"])); }
    else if(!xInSweet && !yInSweet) { setKickComment(pick(["Both axes off 😬","Need better puff control!"])); playFx("laugh"); }
    // Execute kick
    const avgPower = Math.round((fk2X + yPos) / 2);
    if(forceMiss) {
      setKickState("flight"); playFx("kick");
      setKickBallAnim({zone, power:avgPower, result:"missed", wasBlinker:false});
      triggerFlash("miss"); triggerShake(); spawnSmoke(8);
      setCommentary(pick(["The ball has left the PLANET! 🛸💀","Off target! Way off!","Not even close! 😂"]));
      setTimeout(()=>{ setKickState("shoot_result"); playFx("lose"); },800);
      setTimeout(()=>{ setKickState("save_ready"); setKickBallAnim(null); },2600);
    } else {
      const aiSaveZone = Math.floor(Math.random()*6);
      setKickAiZone(aiSaveZone); setKickDiveAnim(aiSaveZone);
      setKickState("flight"); playFx("kick");
      const pool = getDevicePool();
      const sameZone = zone === aiSaveZone;

      // FK2 scoring: based on accuracy + zone difference (NOT sweet spot)
      // Both sweet = 90% goal. One sweet = 60% goal. Neither sweet = 35% goal.
      // If AI picks same zone, reduce by pool.aiSave chance
      let goalChance = bothSweet ? 0.90 : (xInSweet || yInSweet) ? 0.60 : 0.35;
      if(sameZone) goalChance *= (1 - pool.aiSave); // AI has a chance to save if same zone
      const isGoal = Math.random() < goalChance;

      setKickBallAnim({zone, power:avgPower, result:isGoal?"goal":"saved", wasBlinker:false});
      setTimeout(()=>{
        setKickState("shoot_result");
        if(isGoal) {
          setKickScore(s=>({...s,you:s.you+1}));
          setKickStats(s=>({...s,goals:s.goals+1,perfects:bothSweet?s.perfects+1:s.perfects}));
          playFx("win"); playFx("crowd"); triggerFlash("goal"); triggerShake(); spawnConfetti(40); spawnSmoke(5);
          if(bothSweet) setCommentary(pick(["WHAT A GOAL! DOUBLE PRECISION! 🎯🎯","TOP BINS! Both axes PERFECT!","CLINICAL! The crowd erupts!"]));
          else setCommentary(pick(["GOAL! Good aim!","It's in! The keeper couldn't reach it!","GOLAZO! Nice placement!"]));
        } else {
          playFx("lose"); triggerFlash("save");
          if(sameZone) setCommentary(pick(["SAVED! Keeper read it perfectly!","The goalkeeper says NO! 🧤","Denied! Right at the keeper!"]));
          else setCommentary(pick(["Just wide of the post!","So close! The keeper got lucky!","Almost! Better aim next time!"]));
          setKickComment(pick(["Aim for the corners! 🎯","Different zone from keeper = goal 💡","Keep trying! 💪"]));
        }
      },800);
      setTimeout(()=>{ setKickState("save_ready"); setKickBallAnim(null); },2600);
    }
  };

  // ── Bubble spawner during puff charge ──
  const spawnPuffBubble = () => {
    const b = {id:Date.now()+Math.random(),x:35+Math.random()*30,y:100,size:4+Math.random()*8,dur:1.5+Math.random()*1.5,color:[C.cyan,C.green,C.lime,"rgba(255,255,255,0.3)"][Math.floor(Math.random()*4)]};
    setPuffBubbles(p=>[...p.slice(-15),b]);
  };
  const spawnAudienceBubble = () => {
    const b = {id:Date.now()+Math.random(),x:5+Math.random()*90,y:60+Math.random()*30,size:2+Math.random()*5,dur:2+Math.random()*2,color:[C.cyan+"40",C.pink+"30",C.gold+"30",C.purple+"30"][Math.floor(Math.random()*4)]};
    setAudienceBubbles(p=>[...p.slice(-10),b]);
  };

  const kickStartCharge = () => {
    // FK1: only charge during "power" state (after zone pick). FK2: charge during shoot_x/shoot_y.
    if(!["power","shoot_x","shoot_y"].includes(kickState)) return;
    if(kickState==="power" && kickAim===null) return; // FK1 needs zone picked first
    if(kickCharging) return;
    setKickCharging(true); setKickPower(0); setDimLights(true);
    puffStartTime.current = Date.now();
    isPuffBlinker.current = false;

    kickChargeInterval.current = setInterval(()=>{
      const elapsed = (Date.now() - puffStartTime.current) / 1000;
      const pwr = getPuffPower(elapsed);
      setKickPower(pwr);

      // Spawn puff bubbles during charge (every ~200ms)
      if(Math.random()<0.4) spawnPuffBubble();
      // Random audience bubbles (less frequent)
      if(Math.random()<0.1) spawnAudienceBubble();

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
    setKickCharging(false); setDimLights(false);
    setTimeout(()=>{setPuffBubbles([]);setAudienceBubbles([]);},2000); // cleanup after float
    if(kickChargeInterval.current){clearInterval(kickChargeInterval.current);kickChargeInterval.current=null;}
    const elapsed = (Date.now() - puffStartTime.current) / 1000;
    const wasBlinker = elapsed >= 4.5;

    // FK2: route to X or Y lock function with current power as position
    if(isFK2Mode || isFK2Ref.current) {
      const pos = kickPower; // 0-100% maps to position
      if(kickState==="shoot_x" || fk2Phase==="x") { fk2LockX(pos); return; }
      if(kickState==="shoot_y" || fk2Phase==="y") { fk2LockY(pos); return; }
      return;
    }

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
        playFx("lose"); triggerFlash("miss"); triggerShake();
        if(wasBlinker) { playFx("laugh"); spawnSmoke(12); setCommentary("BLINKER! The ball has left the PLANET! 🛸💀"); }
        setKickStats(s=>({...s, misses:s.misses+1, blinkers:wasBlinker?s.blinkers+1:s.blinkers}));
        if(wasBlinker) setKickComment(pick([
          "BLINKER KICK! Your leg went full helicopter 🚁🦵","Lungs quit, leg quit, ball quit 💀😂",
          "Puffed so long your leg forgot what year it is 🫁🦵💀","Blinker + kick = ball in orbit 🛸⚽",
          "Your foot launched that into another dimension 🌀🦶",""+kickOpponent.current.name+": 'Bro your leg ok??' 🤣",
        ]));
        else setKickComment(pick([
          "Leg went FULL SEND... over the bar 🦵🚀","Your foot aimed for the parking lot 😂🅿️",
          "Ball said 'I'm moving to another game' ✈️⚽","Leg had too much energy, zero aim 🦵🎯💀",
          "That kick is still in the atmosphere 🌍⚽","Your foot needs GPS fr 🦶📍😂",
        ]));
      } else if(isGoal) {
        const pts = bonusMult;
        setKickScore(s=>({...s, you:s.you+pts}));
        setKickStats(s=>({...s, goals:s.goals+1, perfects:puffZone==="perfect"?s.perfects+1:s.perfects}));
        playFx("win"); playFx("crowd");
        triggerFlash("goal"); triggerShake(); spawnConfetti(40); spawnSmoke(5);
        setCommentary(pick(["WHAT A GOAL! The stadium ERUPTS! 🏟️🔥","The net RIPPLES! Keeper is STUNNED!","CLINICAL FINISH! The crowd goes WILD!","TOP BINS! Absolute SCENES in the stadium! 📸"]));
        const bonusTag = kickBonusActive ? " (×2 BONUS! 💰)" : "";
        if(puffZone==="perfect") setKickComment(pick(["PERFECT PUFF GOAL! 💨👑🔥"+bonusTag,"SWEET SPOT MERCHANT! Unstoppable!"+bonusTag,"That "+holdLabel+" puff was CLINICAL 🎯"+bonusTag,"The puff-to-goal pipeline is REAL 💨→⚽","Keeper didn't stand a CHANCE 🧤💀"]));
        else setKickComment(pick(["GOLAZOOO! 🔥🔥"+bonusTag,"SHEEEESH! 🥶","NET GO BRRR 😤","That ball had SMOKE on it 💨",""+holdLabel+" puff = GOAL!"+bonusTag,"ABSOLUTE BANGER 💥"]));
      } else {
        playFx("lose"); triggerFlash("save");
        // Only laugh on funny misses (tap/blinker/short), not normal saves
        if(puffZone==="tap"||puffZone==="short"||puffZone==="blinker") playFx("laugh");
        setCommentary(pick(["SAVED! The keeper reads it perfectly!","Denied! That puff wasn't enough!","The goalkeeper says NO! 🧤","Not today! Better puff next time! 💨"]));
        if(puffZone==="tap") setKickComment(pick([
          "Did your leg fall asleep?? 🦵💤","That wasn't a kick, that was a WHISPER 😂",
          "Ball barely moved... are you ok? 🥲","Your foot said 'nah I'm good' 🦶😴",
          "Was that a kick or a gentle caress? 💀","Bro tapped it like a sleeping baby 👶",
          "Even the ball felt embarrassed 😂⚽","Weakest kick since grandma tried 👵",
        ]));
        else if(puffZone==="short") setKickComment(pick([
          "Your leg gave up halfway through 🦵💀","Half-kick energy... commit bro! 😂",
          "Leg said 'loading...' then crashed 📱💀","That kick had zero follow-through 🦶😬",
          "Did you pull a hamstring mid-kick? 🤕","Leg.exe has stopped working 💻🦵",
          "Your foot phoned it in fr 📞🦶","Kicked it like you're wearing flip flops 🩴😂",
        ]));
        else if(puffZone==="good") setKickComment(pick([
          "Close but your leg chickened out! 🐔🦵","Almost had it... foot got shy 😳🦶",
          "SO CLOSE! Leg needed 0.5s more juice 💀","Your kick was good, not GREAT 🦵📉",
          "Foot was THIS close to glory 🤏😂","Almost sweet spot... almost 😤🦶",
          "Leg says 'I tried my best' 🥲🦵","97% there... your foot fumbled the bag 💼💀",
        ]));
        else setKickComment(pick([
          "Your leg went on vacation mid-kick ✈️🦵","Leg cramp at the worst moment?? 🤕😂",
          "Foot overcooked it like burnt toast 🍞🦶💀","Leg held too long and forgot how to kick 🦵🤔",
          "Your foot needs a timeout 🦶⏰","Leg said 'I'm done' before the ball 💀",
          "That kick had boomer energy 👴🦵",""+kickOpponent.current.name+" is literally crying laughing 😂",
        ]));
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
        playFx("lose"); triggerFlash("miss"); triggerShake();
        setCommentary(pick(["GOAL for the AI! The away fans celebrate!","It's in! Wrong way for the keeper!","The AI slots it home coolly!"]));
        setKickComment(pick(["Bruh... 💀",""+kickOpponent.current.name+": 'Too easy' 😂","Wrong way lmaooo 🤣","Keeper had lag 📡","You dove like a fish... wrong fish 🐟",""+kickOpponent.current.emoji+" is doing a victory dance"]));
      } else {
        setKickStats(s=>({...s, saves:s.saves+1}));
        playFx("win"); playFx("crowd"); triggerFlash("save"); triggerShake(); spawnConfetti(20,[C.orange,C.gold,C.green]);
        setCommentary(pick(["WHAT A SAVE! INCREDIBLE reflexes!","The keeper is a WALL! Denied!","PHENOMENAL stop! The crowd roars!"]));
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
      setKickAim(null); setKickPower(0); setKickAiZone(null); setKickDiveAnim(null); setKickBallAnim(null);
      if(isFK2Mode) {
        setKickState("shoot_x");
        setFk2Phase("x"); setFk2X(0); setFk2Y(0); setFk2XDone(false); setKickCharging(false);
        setKickComment("Round "+(nextRound+1)+"! Aim LEFT or RIGHT! ← → 👆");
      } else {
        setKickState("shoot");
        setKickComment(pick(["Round "+(nextRound+1)+"! Sweet spot shifted: "+ss.holdMin+"-"+ss.holdMax+"s 🎯","New round, new sweet spot 🔄","Adapt or miss! "+ss.holdMin+"s-"+ss.holdMax+"s 💨"]));
      }
    }
  };

  // Bonus shot: accept or skip
  const kickAcceptBonus = () => {
    playFx("success");
    setKickBonusUsed(true); setKickBonusActive(true); setKickBonusAvail(false);
    // Bonus has a TIGHTER sweet spot (harder)
    const holdMin = 2.2 + Math.random()*0.6;
    const window = 0.5 + Math.random()*0.3; // narrower!
    const holdMax = holdMin + window;
    const pMin = Math.round(40 + (holdMin-1.5)/2.0 * 55);
    const pMax = Math.min(96, Math.round(40 + (holdMax-1.5)/2.0 * 55));
    setKickSweetMin(Math.max(50, pMin)); setKickSweetMax(pMax);
    setKickAim(null); setKickPower(0);
    if(isFK2Mode) {
      setKickState("shoot_x");
      setFk2Phase("x"); setFk2X(0); setFk2Y(0); setFk2XDone(false);
      setKickComment(pick(["BONUS! Double precision with tighter sweet spots! ⚡🎯","This one's HARDER! Both axes need precision! 🔥","Double rewards — double precision challenge! 💰💰"]));
    } else {
      setKickState("shoot");
      setKickComment(pick(["BONUS SHOT! Tighter sweet spot: "+holdMin.toFixed(1)+"-"+holdMax.toFixed(1)+"s ⚡","This one's HARDER! Nail the puff! 🎯","Double rewards if you score! 💰💰"]));
    }
    playFx("crowd");
  };

  // Audience side switch — requires a BLINKER PUFF (5s hold) to switch!
  const [switchPuffing, setSwitchPuffing] = useState(false);
  const [switchPuffProgress, setSwitchPuffProgress] = useState(0);
  const switchPuffTimer = useRef(null);

  const startSwitchPuff = () => {
    if(switchPuffing) return;
    setSwitchPuffing(true); setSwitchPuffProgress(0);
    switchPuffTimer.current = setInterval(()=>{
      setSwitchPuffProgress(p=>{
        if(p>=100){
          clearInterval(switchPuffTimer.current); switchPuffTimer.current=null;
          // Blinker reached! Execute switch
          setTimeout(()=>executeSwitchSide(), 200);
          return 100;
        }
        return p+2; // fills in ~2.5s (simulated blinker, not full 5s for demo UX)
      });
    },50);
  };
  const stopSwitchPuff = () => {
    setSwitchPuffing(false);
    if(switchPuffTimer.current){clearInterval(switchPuffTimer.current);switchPuffTimer.current=null;}
    if(switchPuffProgress<100){
      setSwitchPuffProgress(0);
      if(switchPuffProgress>20) notify("💨 Hold longer to switch! Need a full puff 🫁",C.gold);
    }
  };
  const executeSwitchSide = () => {
    setSwitchPuffing(false); setSwitchPuffProgress(0);
    const newSide = audienceSide==="you"?"ai":"you";
    setAudienceSide(newSide);
    setAudienceSwitchCount(c=>c+1);
    setAudienceTraitor(true);
    const traitorMsg = {u:"⚠ SYSTEM",m:`🐍 A fan puffed a BLINKER to switch to ${newSide==="you"?"Steve":"AI"}'s side! 💀`,c:C.gold,t:Date.now()};
    setSideChat(p=>({you:[...p.you,traitorMsg],ai:[...p.ai,traitorMsg]}));
    setSideFans(p=>({...p,[audienceSide]:Math.max(1,p[audienceSide]-1),[newSide]:p[newSide]+1}));
    playFx("laugh");
    notify("🐍 BLINKER SWITCH! You're a traitor now!",C.gold);
  };

  const kickSkipBonus = () => {
    playFx("tap");
    setKickBonusAvail(false);
    setKickState("final");
  };

  const kickEndGame = () => {
    const pool = getDevicePool();
    const mult = pool.rewardMult;
    const isWc = gameActive?.wcMode;
    let reward = 0;
    if(kickScore.you > kickScore.ai) { reward = Math.round((isWc ? 20 : 80) * mult); notify(`⚽ YOU WIN! +${reward} coins!`,C.green); playFx("win"); }
    else if(kickScore.you < kickScore.ai) { reward = Math.round((isWc ? 5 : 10) * mult); notify(`😢 +${reward} coins`,C.red); playFx("lose"); }
    else { reward = Math.round((isWc ? 10 : 30) * mult); notify(`🤝 Draw! +${reward} coins`,C.gold); }
    setCoins(c=>c+reward);

    // Handle WC tournament progression
    if(isWc) {
      const myS = kickScore.you;
      const aiS = kickScore.ai;
      const isKnockout = gameActive?.wcKnockout;
      const matchIdx = gameActive?.wcMatchIdx;
      setGameActive(null); setKickState(null); setKickCharging(false);
      if(kickChargeInterval.current){clearInterval(kickChargeInterval.current);kickChargeInterval.current=null;}
      // Defer to WC handler with captured data
      setTimeout(() => {
        if(isKnockout) wcFinishKnockoutMatch(myS, aiS);
        else wcFinishGroupMatch(matchIdx, myS, aiS);
      }, 300);
      return;
    }

    setGameActive(null); setKickState(null); setKickCharging(false);
    if(kickChargeInterval.current){clearInterval(kickChargeInterval.current);kickChargeInterval.current=null;}
  };

  // ── WORLD CUP TOURNAMENT LOGIC ──
  const wcCanEnter = () => {
    return true; // DEMO: unlimited entries. Production: check cooldown
    // if(!wcCooldown) return true;
    // return (Date.now() - wcCooldown) >= WC_COOLDOWN_MS;
  };
  const wcCooldownRemaining = () => {
    if(!wcCooldown) return 0;
    return Math.max(0, WC_COOLDOWN_MS - (Date.now() - wcCooldown));
  };
  const formatCooldown = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const wcSelectTeam = (team) => {
    playFx("select");
    setWcTeam(team);
  };

  const wcConfirmTeam = () => {
    if(!wcTeam) return;
    playFx("success");
    // Show device selection before group draw
    setWcPhase("device_select");
  };

  const wcConfirmDevice = (inputId) => {
    playFx("success");
    setWcDeviceInput(inputId);
    setWcPhase("group_draw");
    setWcDrawAnim(true);

    // Generate group: user's team + 3 random opponents (not same team)
    const pool = WC_TEAMS.filter(t => t.id !== wcTeam.id && t.group !== "BONUS");
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const groupOpps = shuffled.slice(0, 3);
    const groupTeams = [wcTeam, ...groupOpps];
    const groupLetter = String.fromCharCode(65 + Math.floor(Math.random() * 12)); // A-L

    const standings = groupTeams.map(t => ({
      ...t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
    }));

    setWcTournament({
      group: groupLetter,
      teams: groupTeams,
      standings,
      matchday: 0,
      groupMatches: [
        { opp: groupOpps[0], played: false, result: null },
        { opp: groupOpps[1], played: false, result: null },
        { opp: groupOpps[2], played: false, result: null },
      ],
      knockoutRound: null,
      knockoutOpps: [],
      knockoutResults: [],
    });
    setWcMatchday(0);
    setWcCooldown(Date.now());

    // Draw animation: show for 3s then transition
    setTimeout(() => {
      setWcDrawAnim(false);
      setWcPhase("group_stage");
      setWcViewTab("mygroup");
    }, 3000);
  };

  const wcStartGroupMatch = (matchIdx) => {
    if(!wcTournament || wcTournament.groupMatches[matchIdx].played) return;
    playFx("select");
    // Start a Final Kick game — store context for callback
    const opp = wcTournament.groupMatches[matchIdx].opp;
    kickOpponent.current = {
      name: opp.name,
      emoji: opp.flag,
      img: `https://api.dicebear.com/9.x/icons/svg?seed=${opp.id}&backgroundColor=transparent`,
      rank: `#${Math.floor(Math.random()*50)+1}`,
      record: `${Math.floor(Math.random()*100)}-${Math.floor(Math.random()*50)}`,
      taunt: pick(["You have no chance!","We will win!","My team is the best!","Bring it on!","Easy match 😎"]),
    };
    setWcMatchday(matchIdx);
    // Use locked tournament device input (no ask prompt)
    const fkGame = PLAY_GAMES.find(g => g.id === wcGameId) || PLAY_GAMES.find(g => g.id === "finalkick");
    const input = wcDeviceInput || "puff";
    setGameActive({ ...fkGame, activeInput: input, wcMode: true, wcMatchIdx: matchIdx });
    startKick(fkGame.id);
    startMatchIntro(kickOpponent.current);
  };

  const wcFinishGroupMatch = (matchIdx, myScore, aiScore) => {
    if(!wcTournament) return;
    const result = myScore > aiScore ? "win" : myScore < aiScore ? "loss" : "draw";
    const opp = wcTournament.groupMatches[matchIdx].opp;

    const newTournament = { ...wcTournament };
    newTournament.groupMatches = [...newTournament.groupMatches];
    newTournament.groupMatches[matchIdx] = { ...newTournament.groupMatches[matchIdx], played: true, result, myScore, aiScore };

    // Update standings
    const newStandings = [...newTournament.standings].map(s => ({ ...s }));
    const myIdx = newStandings.findIndex(s => s.id === wcTeam.id);
    const oppIdx = newStandings.findIndex(s => s.id === opp.id);

    if(myIdx >= 0) {
      newStandings[myIdx].played++;
      newStandings[myIdx].gf += myScore;
      newStandings[myIdx].ga += aiScore;
      if(result === "win") { newStandings[myIdx].won++; newStandings[myIdx].pts += 3; }
      else if(result === "draw") { newStandings[myIdx].drawn++; newStandings[myIdx].pts += 1; }
      else { newStandings[myIdx].lost++; }
    }
    if(oppIdx >= 0) {
      newStandings[oppIdx].played++;
      newStandings[oppIdx].gf += aiScore;
      newStandings[oppIdx].ga += myScore;
      if(result === "loss") { newStandings[oppIdx].won++; newStandings[oppIdx].pts += 3; }
      else if(result === "draw") { newStandings[oppIdx].drawn++; newStandings[oppIdx].pts += 1; }
      else { newStandings[oppIdx].lost++; }
    }

    // Simulate other matches for AI teams
    const otherTeams = newStandings.filter(s => s.id !== wcTeam.id && s.id !== opp.id);
    if(otherTeams.length >= 2) {
      const a = newStandings.findIndex(s => s.id === otherTeams[0].id);
      const b = newStandings.findIndex(s => s.id === otherTeams[1].id);
      const r = Math.random();
      if(r < 0.4) { newStandings[a].won++; newStandings[a].pts += 3; newStandings[a].gf += 2; newStandings[a].ga += 1; newStandings[b].lost++; newStandings[b].gf += 1; newStandings[b].ga += 2; }
      else if(r < 0.7) { newStandings[a].drawn++; newStandings[a].pts += 1; newStandings[a].gf += 1; newStandings[a].ga += 1; newStandings[b].drawn++; newStandings[b].pts += 1; newStandings[b].gf += 1; newStandings[b].ga += 1; }
      else { newStandings[b].won++; newStandings[b].pts += 3; newStandings[b].gf += 2; newStandings[b].ga += 1; newStandings[a].lost++; newStandings[a].gf += 1; newStandings[a].ga += 2; }
      newStandings[a].played++; newStandings[b].played++;
    }

    // Sort by pts, then GD
    newStandings.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
    newTournament.standings = newStandings;
    setWcTournament(newTournament);

    // Check if all 3 group matches played
    const allPlayed = newTournament.groupMatches.every(m => m.played);
    if(allPlayed) {
      const myRank = newStandings.findIndex(s => s.id === wcTeam.id);
      if(myRank <= 1) {
        // Top 2: advance to knockout
        setWcGroupResult("advance");
        setTimeout(() => {
          // Generate knockout bracket — 4 rounds: R32, R16, QF, SF, Final
          const knockoutRounds = ["Round of 32","Round of 16","Quarterfinal","Semifinal","Final"];
          const knockoutOpps = knockoutRounds.map(() => {
            const r = WC_TEAMS.filter(t => t.id !== wcTeam.id && t.group !== "BONUS");
            return r[Math.floor(Math.random() * r.length)];
          });
          setWcBracket({ rounds: knockoutRounds, opponents: knockoutOpps, results: [], currentRound: 0 });
          setWcPhase("knockout");
          setWcGroupResult(null);
        }, 3000);
      } else {
        // Eliminated
        setWcGroupResult("eliminated");
        setTimeout(() => {
          setWcFinalResult("group");
          setWcPhase("result");
          setWcGroupResult(null);
        }, 3000);
      }
    }
  };

  const wcStartKnockoutMatch = () => {
    if(!wcBracket || wcBracket.currentRound >= wcBracket.rounds.length) return;
    playFx("select");
    const opp = wcBracket.opponents[wcBracket.currentRound];
    kickOpponent.current = {
      name: opp.name,
      emoji: opp.flag,
      img: `https://api.dicebear.com/9.x/icons/svg?seed=${opp.id}&backgroundColor=transparent`,
      rank: `#${Math.floor(Math.random()*30)+1}`,
      record: `${Math.floor(Math.random()*150)}-${Math.floor(Math.random()*50)}`,
      taunt: pick(["This is our moment!","You'll never take us down!","Knockout time!","Last chance, play hard!"]),
    };
    const fkGame = PLAY_GAMES.find(g => g.id === wcGameId) || PLAY_GAMES.find(g => g.id === "finalkick");
    const input = wcDeviceInput || "puff";
    setGameActive({ ...fkGame, activeInput: input, wcMode: true, wcKnockout: true, wcRoundIdx: wcBracket.currentRound });
    startKick(fkGame.id);
    startMatchIntro(kickOpponent.current);
  };

  const wcFinishKnockoutMatch = (myScore, aiScore) => {
    if(!wcBracket) return;
    const win = myScore > aiScore;
    // On draw in knockout: random extra time result (slight player advantage)
    const actualWin = myScore === aiScore ? Math.random() < 0.55 : win;

    const newBracket = { ...wcBracket };
    newBracket.results = [...newBracket.results, { round: newBracket.currentRound, win: actualWin, myScore, aiScore, extraTime: myScore === aiScore }];

    if(!actualWin) {
      // Eliminated — determine placement
      const round = newBracket.currentRound;
      let placement = "group";
      if(round === 4) placement = "silver"; // lost final
      else if(round === 3) placement = "fourth"; // lost SF (simplified — no 3rd place match)
      else placement = "group"; // lost earlier rounds
      // Special: if lost in SF, offer bronze
      if(round === 3) placement = "bronze"; // give bronze for reaching SF

      setWcBracket(newBracket);
      setWcFinalResult(placement);
      setTimeout(() => setWcPhase("result"), 1500);
    } else {
      newBracket.currentRound++;
      setWcBracket(newBracket);

      if(newBracket.currentRound >= newBracket.rounds.length) {
        // Won the final!
        setWcFinalResult("gold");
        spawnConfetti(60, [C.gold, C.cyan, C.green, "#fff"]);
        playFx("win");
        setTimeout(() => setWcPhase("result"), 1500);
      }
    }
  };

  // Called from kickEndGame when in WC mode
  const wcHandleMatchEnd = (myScore, aiScore) => {
    if(gameActive?.wcKnockout) {
      wcFinishKnockoutMatch(myScore, aiScore);
    } else if(gameActive?.wcMode) {
      wcFinishGroupMatch(gameActive.wcMatchIdx, myScore, aiScore);
    }
  };

  const wcClaimPrize = () => {
    if(!wcFinalResult) return;
    const prize = WC_PRIZES[wcFinalResult];
    if(prize) {
      setCoins(c => c + prize.coins);
      setXp(x => x + Math.floor(prize.pts / 10));
      notify(`${prize.label} — +${prize.coins} coins!`, wcFinalResult === "gold" ? C.gold : C.cyan);
      if(wcFinalResult === "gold") spawnConfetti(80, [C.gold, "#fff", C.cyan]);
      playFx("success");
    }
    // Reset tournament state
    setWcPhase(null);
    setWcTeam(null);
    setWcTournament(null);
    setWcBracket(null);
    setWcMatchday(0);
    setWcFinalResult(null);
    setWcGroupResult(null);
  };

  const wcExitTournament = () => {
    playFx("back");
    // Pause tournament — keep state for continue later
    setWcPhase(null);
    // Don't clear wcTeam, wcTournament, wcBracket — user can resume
    setWcGroupResult(null);
    setWcDrawAnim(false);
    notify("⏸️ Tournament paused — continue anytime!",C.gold);
  };

  const wcResumeTournament = () => {
    playFx("nav");
    if(wcBracket && wcBracket.currentRound < wcBracket.rounds.length) {
      setWcPhase("knockout");
    } else if(wcTournament && wcTournament.groupMatches.some(m=>!m.played)) {
      setWcPhase("group_stage");
    } else {
      notify("No active tournament to resume",C.text3);
    }
  };

  const wcAbandonTournament = () => {
    playFx("back");
    setWcPhase(null);
    setWcTeam(null);
    setWcTournament(null);
    setWcBracket(null);
    setWcMatchday(0);
    setWcFinalResult(null);
    setWcGroupResult(null);
    setWcDrawAnim(false);
    setWcDeviceInput(null);
    notify("🏳️ Tournament abandoned",C.text3);
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
            <div key={g.id} onClick={()=>{playFx("select");setZone("arcade");setArenaView("hub");setSelectedGame(g);}} style={{textAlign:"center",padding:"8px 4px",borderRadius:10,background:`${g.color}06`,border:`1px solid ${g.color}10`,position:"relative",cursor:"pointer",transition:"all 0.2s"}}>
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
    const enterZone = viewKey === "worldcup" ? ()=>notify("World Cup hub coming soon!",C.gold) : ()=>{playFx("nav");setZone(viewKey);setArenaView("hub");};

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
          <div onClick={()=>{playFx("back");walkBack();}} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",padding:"7px 14px",borderRadius:100,...GLASS_CLEAR}}>
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
                <div key={t.id} onClick={()=>{playFx("nav");if(t.id!=="arena"){notify("Coming Soon — Arena Demo Only",C.cyan);return;}setTab(t.id);setZone(null);setArenaView("hub");}} style={{
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
            <div key={t.key} onClick={()=>{playFx("nav");walkTo(t.key);}} style={{
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
                <div key={t.id} onClick={()=>{playFx("nav");if(t.id!=="arena"){notify("Coming Soon — Arena Demo Only",C.cyan);return;}setTab(t.id);setZone(null);setArenaView("hub");}} style={{
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
        <div onClick={()=>{playFx("back");setZone(null);setSelectedGame(null);setArenaView("hub");}} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:12,padding:"6px 12px",borderRadius:8,background:`${C.text3}06`,border:`1px solid ${C.border}`}}>
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
    {label:"Arcade Games Today",value:"3,847",emoji:"🎮",color:C.cyan,sub:"Final Kick: 2,100 · Hot Potato: 890"},
    {label:"Blinkers Today",value:"1,247",emoji:"💀",color:C.red,sub:"That's 1,247 trips to the moon 🌙"},
    {label:"Perfect Puffs",value:"8,420",emoji:"💨",color:C.green,sub:"Sweet spot merchants are out here"},
    {label:"Active Players Now",value:"856",emoji:"👥",color:C.gold,sub:"142 in Final Kick · 89 in Puff Pong"},
    {label:"Longest Win Streak",value:"23",emoji:"🔥",color:C.orange,sub:"ChillMaster42 is on FIRE"},
    {label:"Funniest Blinker",value:"0.1s tap",emoji:"😂",color:C.pink,sub:"Ball didn't even move lmao"},
  ];

  const renderArcade = () => (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:`radial-gradient(circle, ${Z.arcade.glow.replace("0.35","0.1")}, transparent 70%)`,pointerEvents:"none"}}/>
      {renderZoneHeader("arcade")}

      {/* ═══ TAB BAR ═══ */}
      <div style={{display:"flex",gap:0,margin:"0 14px 12px",borderRadius:12,overflow:"hidden",...GLASS_CLEAR}}>
        {[{id:"games",label:"🎮 Games",count:PLAY_GAMES.length},{id:"tournament",label:"⚽ Tournament",count:null},{id:"leaderboard",label:"🏆 Board",count:null}].map(t=>(
          <div key={t.id} onClick={()=>{playFx("nav");setArcadeTab(t.id);}} style={{
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
            <div key={g.id} onClick={()=>{playFx("select");setSelectedGame(g);}} style={{
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

      {/* ═══ TOURNAMENT TAB ═══ */}
      {arcadeTab==="tournament" && (
        <div style={{padding:"0 14px",animation:"fadeIn 0.3s ease"}}>
          {/* World Cup 2026 Card */}
          <div onClick={()=>{playFx("select");setWcPhase("team_select");}} style={{
            padding:"16px",borderRadius:16,cursor:"pointer",marginBottom:10,
            background:`linear-gradient(135deg, ${C.gold}12, ${C.cyan}06, ${C.bg2})`,
            border:`1px solid ${C.gold}25`,boxShadow:`0 0 20px ${C.gold}08`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:28}}>🏆</span>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:C.gold}}>World Cup 2026</div>
                <div style={{fontSize:9,color:C.text2}}>48 Teams · Group Stage + Knockout</div>
              </div>
              <div style={{marginLeft:"auto",fontSize:8,fontWeight:800,color:C.green,padding:"3px 8px",borderRadius:6,background:`${C.green}15`,border:`1px solid ${C.green}25`}}>OPEN</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              <span style={{fontSize:7,padding:"2px 6px",borderRadius:4,background:`${C.gold}10`,color:C.gold,fontWeight:700}}>🥇 50K pts</span>
              <span style={{fontSize:7,padding:"2px 6px",borderRadius:4,background:`rgba(192,192,192,0.1)`,color:"#C0C0C0",fontWeight:700}}>🥈 25K</span>
              <span style={{fontSize:7,padding:"2px 6px",borderRadius:4,background:`rgba(205,127,50,0.1)`,color:"#CD7F32",fontWeight:700}}>🥉 10K</span>
            </div>
            <div style={{fontSize:8,color:C.text3}}>DEMO: Unlimited entries · Choose your nation</div>
          </div>

          {/* Join as Fan */}
          <div onClick={()=>{playFx("select");setFanMode("team_select");}} style={{
            padding:"12px 14px",borderRadius:14,cursor:"pointer",
            background:`${C.cyan}06`,border:`1px solid ${C.cyan}15`,
            display:"flex",alignItems:"center",gap:10,
          }}>
            <span style={{fontSize:20}}>👀</span>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.cyan}}>Join as Fan</div>
              <div style={{fontSize:8,color:C.text3}}>Watch live matches · Pick a side · Chat & react</div>
            </div>
            <div style={{marginLeft:"auto",fontSize:12,color:`${C.cyan}40`}}>›</div>
          </div>

          {/* Active/paused tournament */}
          {wcTeam && wcTournament && (
            <div style={{marginTop:10,padding:"12px 14px",borderRadius:12,
              background:`${C.green}08`,border:`1px solid ${C.green}20`,
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div>
                  <div style={{fontSize:9,fontWeight:800,color:C.green}}>⏸️ TOURNAMENT PAUSED</div>
                  <div style={{fontSize:8,color:C.text2,marginTop:2}}>{wcTeam.flag} {wcTeam.name} · {wcDeviceInput?INPUT_TYPES.find(t=>t.id===wcDeviceInput)?.icon:""} {wcDeviceInput||""}</div>
                </div>
                <div style={{fontSize:16}}>{wcTeam.flag}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <div onClick={()=>{playFx("success");wcResumeTournament();}} style={{
                  flex:2,padding:"8px 0",borderRadius:8,textAlign:"center",cursor:"pointer",
                  background:`${C.green}15`,border:`1px solid ${C.green}30`,fontSize:10,fontWeight:800,color:C.green,
                }}>▶ Continue</div>
                <div onClick={()=>{playFx("tap");wcAbandonTournament();}} style={{
                  flex:1,padding:"8px 0",borderRadius:8,textAlign:"center",cursor:"pointer",
                  background:`${C.red}08`,border:`1px solid ${C.red}20`,fontSize:10,fontWeight:700,color:C.red,
                }}>Abandon</div>
              </div>
            </div>
          )}
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
          <div style={{fontSize:10,fontWeight:800,color:C.gold,marginBottom:8}}>🏆 ARCADE HALL OF FAME</div>
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
    <div onClick={()=>{playFx("back");onClose();}} style={{position:"absolute",top:8,left:10,zIndex:250,cursor:"pointer",padding:"5px 10px",borderRadius:8,background:`rgba(6,8,15,0.7)`,backdropFilter:"blur(8px)",border:`1px solid ${C.border}`}}>
      <span style={{fontSize:11,fontWeight:600,color:C.text2}}>← Back</span>
    </div>
  );

  // Game detail / matchmaking
  const renderGameOverlay = () => {
    if(matchmaking) {
      const gc = matchmaking.game.color;
      const pool = getDevicePool();
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,overflow:"hidden"}}>
          {/* Background — matching other pages */}
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>
          {/* Ambient particles */}
          {[...Array(12)].map((_,i)=>(
            <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,width:2,height:2,borderRadius:"50%",background:gc,opacity:0.1+Math.random()*0.15,animation:`pulse ${2+Math.random()*3}s infinite ${Math.random()*2}s`}}/>
          ))}
          {/* Grass */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"20%",background:`linear-gradient(180deg, transparent, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0.10))`,pointerEvents:"none"}}/>

          {overlayBack(()=>setMatchmaking(null))}

          <div style={{position:"relative",zIndex:2,flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",textAlign:"center",padding:20}}>
            {/* Game icon with glow */}
            <div style={{width:80,height:80,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle, ${gc}15, ${gc}05)`,border:`2px solid ${gc}25`,boxShadow:`0 0 40px ${gc}20`,marginBottom:16,animation:"gentleFloat 2s infinite"}}>
              <span style={{fontSize:40,filter:`drop-shadow(0 0 10px ${gc}40)`}}>{matchmaking.game.emoji}</span>
            </div>

            <div style={{fontSize:20,fontWeight:900,color:C.text,textShadow:`0 0 15px ${gc}30`,marginBottom:6}}>{matchmaking.game.name}</div>

            {matchmaking.stage==="searching" && (
              <div style={{animation:"fadeIn 0.3s ease"}}>
                {/* Device badges */}
                <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:14}}>
                  <span style={{fontSize:8,fontWeight:700,color:pool.color,padding:"3px 10px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ {pool.label}</span>
                  <span style={{fontSize:8,fontWeight:700,color:C.text2,padding:"3px 10px",borderRadius:20,...LG.tinted(C.text3)}}>{getDeviceShort()}</span>
                </div>
                {/* Searching animation */}
                <div style={{fontSize:14,color:C.text2,marginBottom:16,fontWeight:600}}>
                  {matchmaking.mode==="random"?"Finding same-device opponent...":"Finding opponent..."}
                </div>
                <div style={{position:"relative",width:50,height:50,margin:"0 auto"}}>
                  <div style={{width:50,height:50,border:`3px solid ${gc}15`,borderTopColor:gc,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  <div style={{position:"absolute",inset:6,border:`2px solid ${gc}10`,borderBottomColor:`${gc}60`,borderRadius:"50%",animation:"spin 1.2s linear infinite reverse"}}/>
                </div>
                <div style={{fontSize:10,color:C.text3,marginTop:12,fontStyle:"italic"}}>"Scanning the arena for worthy opponents... 👀"</div>
              </div>
            )}

            {matchmaking.stage==="found" && (
              <div style={{animation:"fadeIn 0.4s ease"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:20,animation:"countPulse 0.5s ease"}}>⚡</span>
                  <span style={{fontSize:16,fontWeight:800,color:C.green}}>OPPONENT FOUND!</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>{matchmaking.opp}</div>
                <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:8}}>
                  <span style={{fontSize:8,fontWeight:700,color:pool.color,padding:"3px 10px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ Fair Match</span>
                  <span style={{fontSize:8,fontWeight:700,color:C.green,padding:"3px 10px",borderRadius:20,...LG.tinted(C.green)}}>✓ Same Device Pool</span>
                </div>
                <div style={{fontSize:10,color:C.text3,marginTop:10}}>Starting match... 🔥</div>
              </div>
            )}
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
      if((gameActive.id==="finalkick"||gameActive.id==="finalkick2") && kickState) {
        const isFK2 = isFK2Mode || isFK2Ref.current || gameActive.id==="finalkick2"; // triple fallback
        const pool = getDevicePool();
        const inp = gameActive.activeInput;
        const inpInfo = INPUT_TYPES.find(t=>t.id===inp)||INPUT_TYPES[0];
        const isShootPhase = ["shoot","power","flight","shoot_result","shoot_x","shoot_y"].includes(kickState);
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
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,overflow:"hidden",
            animation:screenShake?"shake 0.4s ease":"none",
            filter:dimLights?"brightness(0.6)":"brightness(1)",transition:"filter 0.3s",
          }}>
            {/* ═══ SCREEN FLASH OVERLAY ═══ */}
            {screenFlash && <div style={{position:"absolute",inset:0,zIndex:200,pointerEvents:"none",opacity:0,
              background:screenFlash==="goal"?"rgba(0,255,100,0.25)":screenFlash==="save"?"rgba(255,165,0,0.2)":screenFlash==="miss"?"rgba(255,50,50,0.2)":"rgba(255,0,0,0.3)",
              animation:"flashOverlay 0.4s ease forwards",
            }}/>}

            {/* ═══ CONFETTI PARTICLES ═══ */}
            {confettiParticles.length>0 && confettiParticles.map(p=>(
              <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size*0.6,
                background:p.color,borderRadius:1,transform:`rotate(${p.rot}deg)`,zIndex:210,pointerEvents:"none",
                animation:`confettiFall ${1.5+Math.random()}s ease-out forwards`,
              }}/>
            ))}

            {/* ═══ SMOKE PARTICLES ═══ */}
            {smokeParticles.length>0 && smokeParticles.map(p=>(
              <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,
                borderRadius:"50%",background:`radial-gradient(circle, rgba(255,255,255,0.06), transparent)`,
                zIndex:205,pointerEvents:"none",filter:"blur(8px)",
                animation:`smokeRise ${p.dur}s ease-out forwards`,
              }}/>
            ))}

            {/* ═══ PUFF BUBBLES — Avatar + Duration (like real app) ═══ */}
            {puffBubbles.length>0 && puffBubbles.map(b=>(
              <div key={b.id} style={{position:"absolute",left:`${b.x}%`,bottom:`${b.y}%`,
                zIndex:206,pointerEvents:"none",
                animation:`bubbleFloat ${b.dur}s ease-out forwards`,
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              }}>
                {/* Mini avatar circle */}
                <div style={{width:b.size*2.5,height:b.size*2.5,borderRadius:"50%",
                  background:`linear-gradient(135deg, ${b.color}, ${b.color}80)`,
                  border:`2px solid ${b.color}`,boxShadow:`0 0 10px ${b.color}40`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:b.size*1.2,
                }}>💨</div>
                {/* +Xs label */}
                <div style={{fontSize:7,fontWeight:800,color:b.color,textShadow:`0 0 6px rgba(0,0,0,0.8)`,
                  background:`rgba(0,0,0,0.4)`,padding:"1px 4px",borderRadius:6,
                }}>+{(Math.random()*3+0.5).toFixed(1)}s</div>
              </div>
            ))}

            {/* ═══ AUDIENCE BUBBLES — small ambient with random emojis ═══ */}
            {audienceBubbles.length>0 && audienceBubbles.map(b=>(
              <div key={b.id} style={{position:"absolute",left:`${b.x}%`,bottom:`${b.y}%`,
                zIndex:204,pointerEvents:"none",opacity:0.4,
                animation:`bubbleFloat ${b.dur}s ease-out forwards`,
                display:"flex",flexDirection:"column",alignItems:"center",
              }}>
                <div style={{width:b.size*3,height:b.size*3,borderRadius:"50%",
                  background:`radial-gradient(circle, ${b.color}, transparent)`,
                  border:`1px solid ${b.color}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:b.size*1.5,
                }}>{["💨","🔥","😤","👀","🫁"][Math.floor(Math.random()*5)]}</div>
              </div>
            ))}

            {/* ═══ SCREEN EDGE GLOW during active puff ═══ */}
            {kickCharging && <div style={{position:"absolute",inset:0,zIndex:203,pointerEvents:"none",
              boxShadow:`inset 0 0 60px ${C.lime}15, inset 0 0 120px ${C.cyan}08`,
              borderRadius:"inherit",animation:"pulse 1.5s infinite",
            }}/>}

            {/* ═══ PUFF WAVE ═══ */}
            {puffWaveActive && <div style={{position:"absolute",bottom:0,left:0,right:0,height:"100%",zIndex:208,pointerEvents:"none",
              background:`linear-gradient(0deg, rgba(0,229,255,0.08) 0%, rgba(127,255,0,0.04) 30%, transparent 60%)`,
              animation:"puffWaveSweep 3s ease forwards",
            }}>
              <div style={{position:"absolute",bottom:"20%",left:"50%",transform:"translateX(-50%)",fontSize:12,fontWeight:900,color:C.cyan,textShadow:`0 0 20px ${C.cyan}`,animation:"fadeIn 0.5s ease"}}>
                🌊💨 PUFF WAVE! THE STADIUM IS CLOUDED! ☁️💨 🌊
              </div>
            </div>}

            {/* ═══ AI COMMENTATOR — aligned with back button ═══ */}
            {commentatorText && <div style={{position:"absolute",top:8,left:80,right:10,zIndex:215,display:"flex",alignItems:"center",animation:"fadeIn 0.3s ease",pointerEvents:"none"}}>
              <div style={{flex:1,padding:"5px 10px",borderRadius:8,background:`rgba(6,8,15,0.7)`,backdropFilter:"blur(8px)",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:10,flexShrink:0}}>🎙️</span>
                <span style={{fontSize:8,fontWeight:600,color:C.text,fontStyle:"italic",lineHeight:1.2}}>{commentatorText}</span>
              </div>
            </div>}

            {/* ═══ MATCH INTRO — COMBINED VS + STATS + COUNTDOWN ═══ */}
            {matchIntro && (
              <div style={{position:"absolute",inset:0,zIndex:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:`radial-gradient(ellipse at 50% 30%, rgba(0,229,255,0.06) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 70%, rgba(255,217,61,0.04) 0%, transparent 50%),
                  rgba(4,8,18,0.92)`,
                backdropFilter:"blur(12px)",animation:"fadeIn 0.3s ease",
              }}>
                {/* Stadium spotlight beams */}
                <div style={{position:"absolute",top:0,left:"20%",width:2,height:"40%",background:`linear-gradient(180deg, ${C.cyan}25, transparent)`,filter:"blur(3px)"}}/>
                <div style={{position:"absolute",top:0,right:"20%",width:2,height:"40%",background:`linear-gradient(180deg, ${C.red}25, transparent)`,filter:"blur(3px)"}}/>

                {/* Title badge */}
                <div style={{marginBottom:16,padding:"4px 16px",borderRadius:20,background:`${C.gold}12`,border:`1px solid ${C.gold}30`}}>
                  <span style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:3}}>{isFK2?"⚽🔥 FINAL KICK 2 — DOUBLE PUFF":"🏆 FINAL KICK CHAMPIONSHIP"}</span>
                </div>

                {/* ── VS PLAYERS — Always visible ── */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:16}}>
                  {/* Player left */}
                  <div style={{textAlign:"center",animation:"slideInLeft 0.8s ease"}}>
                    <div style={{width:60,height:60,borderRadius:16,overflow:"hidden",border:`2px solid ${C.cyan}60`,background:`${C.cyan}10`,margin:"0 auto 6px",boxShadow:`0 0 20px ${C.cyan}30`}}>
                      <img src={PLAYER_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:32px;text-align:center;padding-top:10px">😎</div>';}}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:C.cyan,textShadow:`0 0 10px ${C.cyan}40`}}>Steve</div>
                    <div style={{fontSize:8,color:C.text3}}>Lv.24 · {getDeviceShort()}</div>
                  </div>

                  {/* VS center — shows countdown when active */}
                  <div style={{textAlign:"center",minWidth:50}}>
                    {(matchIntro.stage==="countdown") ? (
                      <div style={{fontSize:60,fontWeight:900,color:C.gold,textShadow:`0 0 40px ${C.gold}60`,animation:"countPulse 0.8s ease",lineHeight:1}}>
                        {matchIntro.count}
                      </div>
                    ) : matchIntro.stage==="go" ? (
                      <div style={{fontSize:24,fontWeight:900,color:C.green,textShadow:`0 0 20px ${C.green}60`,animation:"countPulse 0.5s ease",lineHeight:1}}>
                        ⚽
                      </div>
                    ) : (
                      <div style={{fontSize:24,fontWeight:900,color:C.gold,textShadow:`0 0 20px ${C.gold}60`,animation:"countPulse 1.5s infinite"}}>VS</div>
                    )}
                  </div>

                  {/* Player right */}
                  <div style={{textAlign:"center",animation:"slideInRight 0.8s ease"}}>
                    <div style={{width:60,height:60,borderRadius:16,overflow:"hidden",border:`2px solid ${C.red}60`,background:`${C.red}10`,margin:"0 auto 6px",boxShadow:`0 0 20px ${C.red}30`}}>
                      <img src={kickOpponent.current.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:32px;text-align:center;padding-top:10px">'+kickOpponent.current.emoji+'</div>';}}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:C.red,textShadow:`0 0 10px ${C.red}40`}}>{kickOpponent.current.name}</div>
                    <div style={{fontSize:8,color:C.text3}}>{kickOpponent.current.rank} · {kickOpponent.current.record}</div>
                  </div>
                </div>

                {/* ── STATS — Slides up after enter ── */}
                {(matchIntro.stage==="stats"||matchIntro.stage==="countdown"||matchIntro.stage==="go") && (
                  <div style={{width:"80%",maxWidth:280,padding:"10px 14px",borderRadius:14,...GLASS_CLEAR,animation:"fadeIn 0.5s ease",marginBottom:12}}>
                    <div style={{fontSize:8,fontWeight:800,color:C.gold,marginBottom:8,textAlign:"center",letterSpacing:2}}>📊 HEAD TO HEAD</div>
                    {[
                      ["72%","Win Rate",(45+Math.floor(Math.random()*20))+"%"],
                      ["420","Goals",kickOpponent.current.record.split("-")[0]],
                      ["69","Blinkers 💀",Math.floor(Math.random()*30)+""],
                      ["2.9s","Avg Puff",(2.5+Math.random()).toFixed(1)+"s"],
                    ].map(([l,mid,r],i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,padding:"2px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
                        <span style={{fontSize:11,fontWeight:800,color:C.cyan,minWidth:35}}>{l}</span>
                        <span style={{fontSize:8,color:C.text3,flex:1,textAlign:"center"}}>{mid}</span>
                        <span style={{fontSize:11,fontWeight:800,color:C.red,minWidth:35,textAlign:"right"}}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── GO text ── */}
                {matchIntro.stage==="go" && (
                  <div style={{animation:"fadeIn 0.2s ease",marginTop:4}}>
                    <div style={{fontSize:28,fontWeight:900,color:C.green,textShadow:`0 0 30px ${C.green}60`,animation:"countPulse 0.5s ease",textAlign:"center"}}>
                      KICK OFF!
                    </div>
                  </div>
                )}

                {/* Crowd watching count */}
                <div style={{marginTop:12,fontSize:8,color:C.text3}}>
                  👁️ {120+Math.floor(Math.random()*80)} watching · 🏟️ Round of 16
                </div>
              </div>
            )}

            {/* ═══ STADIUM BACKGROUND ═══ */}
            <div style={{position:"absolute",inset:0,background:`
              radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, rgba(127,255,0,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 40%),
              linear-gradient(180deg, #06101E 0%, #0c1a38 30%, #102240 60%, #081830 100%)
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

            {overlayBack(()=>{setGameActive(null);setKickState(null);setIsFK2Mode(false);isFK2Ref.current=false;})}

            {/* DEBUG: remove after testing */}
            <div style={{position:"absolute",top:8,right:10,zIndex:300,padding:"2px 6px",borderRadius:4,background:"rgba(255,0,0,0.8)",fontSize:8,fontWeight:900,color:"#fff"}}>
              {isFK2?"FK2":"FK1"} | {kickState} | mode:{isFK2Mode?"Y":"N"} ref:{isFK2Ref.current?"Y":"N"} gid:{gameActive?.id}
            </div>

            <div style={{position:"relative",zIndex:2,flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"38px 14px 52px",height:"100%",overflowY:"auto"}}>

              {/* ═══ VS ARENA HEADER WITH CHARACTER IMAGES ═══ */}
              <div style={{width:"100%",maxWidth:390,marginTop:28,marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  {gameActive?.wcMode ? (
                    <span style={{fontSize:8,fontWeight:800,color:C.gold,letterSpacing:2}}>
                      🏆 {gameActive?.wcKnockout && wcBracket ? wcBracket.rounds[wcBracket.currentRound].toUpperCase() : `GROUP ${wcTournament?.group || "?"} · MATCH ${(gameActive?.wcMatchIdx ?? 0)+1}/3`}
                    </span>
                  ) : (
                    <span style={{fontSize:8,fontWeight:800,color:C.gold,letterSpacing:2}}>{isFK2?"⚽🔥 FINAL KICK 2":"🏆 FINAL KICK"}</span>
                  )}
                  <span style={{fontSize:7,fontWeight:700,color:pool.color,padding:"2px 8px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ {pool.label}</span>
                  <span style={{fontSize:7,fontWeight:700,color:inpInfo.color,padding:"2px 8px",borderRadius:20,...LG.tinted(inpInfo.color)}}>{inpInfo.icon} {inpInfo.label}</span>
                  {kickBonusActive && <span style={{fontSize:7,fontWeight:800,color:C.gold,padding:"2px 8px",borderRadius:20,background:`${C.gold}20`,border:`1px solid ${C.gold}40`,animation:"pulse 1s infinite"}}>⚡ BONUS</span>}
                </div>
                {/* ═══ ARENA VS CARD — BIGGER ═══ */}
                <div style={{display:"flex",alignItems:"stretch",borderRadius:18,overflow:"hidden",...LG.tinted(C.cyan),position:"relative",minHeight:80}}>
                  <div style={{position:"absolute",top:0,left:"50%",width:2,height:"100%",background:`linear-gradient(180deg, ${C.gold}60, ${C.gold}10)`,transform:"skewX(-8deg)",zIndex:3}}/>
                  {/* ── Glow behind avatars ── */}
                  <div style={{position:"absolute",left:0,top:0,width:"40%",height:"100%",background:`radial-gradient(ellipse at 20% 50%, ${C.cyan}12, transparent 70%)`,pointerEvents:"none"}}/>
                  <div style={{position:"absolute",right:0,top:0,width:"40%",height:"100%",background:`radial-gradient(ellipse at 80% 50%, ${C.red}12, transparent 70%)`,pointerEvents:"none"}}/>
                  {/* YOU — avatar with flag badge */}
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:`linear-gradient(135deg, ${C.cyan}08, transparent)`}}>
                    <div style={{position:"relative",flexShrink:0}}>
                      <div style={{width:50,height:50,borderRadius:14,overflow:"hidden",border:`2px solid ${C.cyan}50`,background:`${C.cyan}10`,boxShadow:`0 0 16px ${C.cyan}30`}}>
                        <img src={PLAYER_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:28px;text-align:center;padding-top:8px">😎</div>';}}/>
                      </div>
                      {gameActive?.wcMode && wcTeam && <div style={{position:"absolute",bottom:-3,right:-3,fontSize:16,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.8))"}}>{wcTeam.flag}</div>}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:800,color:C.cyan}}>{gameActive?.wcMode&&wcTeam?wcTeam.flag+" ":""}Steve</div>
                      <div style={{fontSize:7,color:C.text3}}>{gameActive?.wcMode&&wcTeam?wcTeam.name+" · ":""}{getDeviceShort()}</div>
                      <div style={{fontSize:28,fontWeight:900,color:"#fff",textShadow:`0 0 12px ${C.cyan}60`,lineHeight:1,marginTop:2}}>{kickScore.you}</div>
                    </div>
                  </div>
                  {/* VS */}
                  <div style={{width:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:4}}>
                    <div style={{fontSize:7,color:C.text3,fontWeight:700}}>R{kickRound+1}/5</div>
                    <div style={{display:"flex",gap:3,marginTop:2}}>{[0,1,2,3,4].map(r=>(<div key={r} style={{width:5,height:5,borderRadius:"50%",background:r<kickRound?C.cyan:r===kickRound?C.gold:`${C.text3}30`,boxShadow:r===kickRound?`0 0 6px ${C.gold}`:""}}/>))}</div>
                    <div style={{fontSize:13,fontWeight:900,color:C.gold,textShadow:`0 0 10px ${C.gold}50`,marginTop:2}}>VS</div>
                  </div>
                  {/* AI — avatar with flag badge */}
                  <div style={{flex:1,display:"flex",alignItems:"center",flexDirection:"row-reverse",gap:8,padding:"10px 12px",background:`linear-gradient(225deg, ${C.red}08, transparent)`}}>
                    <div style={{position:"relative",flexShrink:0}}>
                      <div style={{width:50,height:50,borderRadius:14,overflow:"hidden",border:`2px solid ${C.red}50`,background:`${C.red}10`,boxShadow:`0 0 16px ${C.red}30`}}>
                        <img src={kickOpponent.current.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:28px;text-align:center;padding-top:8px">'+kickOpponent.current.emoji+'</div>';}}/>
                      </div>
                      {gameActive?.wcMode && <div style={{position:"absolute",bottom:-3,left:-3,fontSize:16,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.8))"}}>{kickOpponent.current.emoji}</div>}
                    </div>
                    <div style={{textAlign:"right",minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:800,color:C.red,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{gameActive?.wcMode?kickOpponent.current.emoji+" ":"" }{kickOpponent.current.name}</div>
                      <div style={{fontSize:7,color:C.text3}}>{kickOpponent.current.rank}</div>
                      <div style={{fontSize:28,fontWeight:900,color:"#fff",textShadow:`0 0 12px ${C.red}60`,lineHeight:1,marginTop:2}}>{kickScore.ai}</div>
                    </div>
                  </div>
                </div>
                {/* Stats strip */}
                <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:4}}>
                  <span style={{fontSize:7,color:C.text3}}>⚽{kickStats.goals}</span>
                  <span style={{fontSize:7,color:C.text3}}>🧤{kickStats.saves}</span>
                  <span style={{fontSize:7,color:C.green}}>💨{kickStats.perfects}</span>
                  {kickStats.blinkers>0&&<span style={{fontSize:7,color:C.red}}>💀{kickStats.blinkers}</span>}
                  {kickStats.misses>0&&<span style={{fontSize:7,color:C.gold}}>🚀{kickStats.misses}</span>}
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
                  position:"relative",width:goalW,height:goalH,cursor:kickState==="shoot"||kickState==="save_dive"?"pointer":"default",
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

                  {/* FK2: Vertical line showing X position (during shoot_x charging) */}
                  {isFK2 && kickState==="shoot_x" && kickCharging && kickPower>0 && (
                    <div style={{position:"absolute",top:0,bottom:0,left:`${kickPower}%`,width:3,
                      background:(kickPower<10||kickPower>90)?C.red:(kickPower>=kickSweetMin&&kickPower<=kickSweetMax)?C.green:C.cyan,
                      boxShadow:`0 0 12px ${(kickPower<10||kickPower>90)?C.red:(kickPower>=kickSweetMin&&kickPower<=kickSweetMax)?C.green:C.cyan}`,
                      zIndex:5,pointerEvents:"none",transition:"left 0.06s linear",
                    }}/>
                  )}
                  {/* FK2: Locked X line + horizontal Y line (during shoot_y) */}
                  {isFK2 && (kickState==="shoot_y"||fk2XDone) && (
                    <div style={{position:"absolute",top:0,bottom:0,left:`${fk2X}%`,width:2,background:`${C.green}80`,boxShadow:`0 0 8px ${C.green}40`,zIndex:4,pointerEvents:"none"}}/>
                  )}
                  {isFK2 && kickState==="shoot_y" && kickCharging && kickPower>0 && <>
                    <div style={{position:"absolute",left:0,right:0,bottom:`${kickPower}%`,height:3,
                      background:kickPower>95?C.red:(kickPower>=kickSweetMin&&kickPower<=kickSweetMax)?C.green:C.orange,
                      boxShadow:`0 0 12px ${kickPower>95?C.red:(kickPower>=kickSweetMin&&kickPower<=kickSweetMax)?C.green:C.orange}`,
                      zIndex:5,pointerEvents:"none",transition:"bottom 0.06s linear",
                    }}/>
                    {/* Crosshair dot at intersection */}
                    <div style={{position:"absolute",left:`${fk2X}%`,bottom:`${kickPower}%`,width:10,height:10,borderRadius:"50%",
                      background:"#fff",border:`2px solid ${C.green}`,transform:"translate(-50%,50%)",
                      boxShadow:`0 0 12px ${C.green}`,zIndex:6,pointerEvents:"none",
                    }}/>
                  </>}
                  {/* FK2 out-of-bounds zones */}
                  {isFK2 && kickState==="shoot_x" && <>
                    <div style={{position:"absolute",top:0,bottom:0,left:0,width:"10%",background:`${C.red}08`,borderRight:`1px dashed ${C.red}25`,pointerEvents:"none",zIndex:3}}/>
                    <div style={{position:"absolute",top:0,bottom:0,right:0,width:"10%",background:`${C.red}08`,borderLeft:`1px dashed ${C.red}25`,pointerEvents:"none",zIndex:3}}/>
                  </>}
                  {isFK2 && kickState==="shoot_y" && (
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"5%",background:`${C.red}08`,borderBottom:`1px dashed ${C.red}25`,pointerEvents:"none",zIndex:3}}/>
                  )}
                  {/* FK2 sweet spot indicator on edge */}
                  {isFK2 && kickState==="shoot_x" && (
                    <div style={{position:"absolute",bottom:-4,left:`${kickSweetMin}%`,width:`${kickSweetMax-kickSweetMin}%`,height:3,background:C.green,borderRadius:2,opacity:0.5,zIndex:3}}/>
                  )}
                  {isFK2 && kickState==="shoot_y" && (
                    <div style={{position:"absolute",right:-4,bottom:`${kickSweetMin}%`,height:`${kickSweetMax-kickSweetMin}%`,width:3,background:C.green,borderRadius:2,opacity:0.5,zIndex:3}}/>
                  )}

                  {/* Tap zones with glow effect (FK1 only + save_dive for both) */}
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
                  {/* Duration timer + zone label + action countdown */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,padding:"0 2px"}}>
                    <span style={{fontSize:9,fontWeight:800,color:zoneColor}}>{kickCharging?zoneLabel:"PUFF DURATION"}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {kickCharging && <span style={{fontSize:10,fontWeight:900,color:zoneColor,fontFamily:"monospace"}}>{elapsed.toFixed(1)}s</span>}
                      {!kickCharging && <span style={{fontSize:10,fontWeight:900,color:actionTimer<=1?C.red:C.gold,animation:actionTimer<=1?"pulse 0.5s infinite":"none"}}>{actionTimer}s</span>}
                    </div>
                  </div>
                  {/* Power bar with puff zone markers */}
                  <div style={{height:28,borderRadius:14,background:`rgba(255,255,255,0.04)`,overflow:"hidden",border:`2px solid ${kickCharging?zoneColor+"60":"rgba(255,255,255,0.1)"}`,position:"relative",transition:"border-color 0.2s",boxShadow:kickCharging?`0 0 15px ${zoneColor}25`:"none",
                    animation:!kickCharging?"countPulse 2s infinite":"none",
                  }}>
                    {/* Sweet spot highlight zone */}
                    <div style={{position:"absolute",left:`${kickSweetMin}%`,width:`${kickSweetMax-kickSweetMin}%`,height:"100%",background:`${C.green}08`,borderLeft:`1px solid ${C.green}30`,borderRight:`1px solid ${C.green}30`}}/>
                    <div style={{position:"absolute",left:`${kickSweetMin+2}%`,top:2,fontSize:7,color:`${C.green}50`,fontWeight:800,zIndex:2}}>SWEET</div>
                    {/* Empty state hint */}
                    {!kickCharging && kickPower===0 && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,pointerEvents:"none"}}>
                      <span style={{fontSize:10,fontWeight:700,color:`${C.text3}80`,animation:"countPulse 1.5s infinite"}}>⬇️ Press & Hold below to charge</span>
                    </div>}
                    {/* Fill bar — absolute to ensure it renders on top */}
                    <div style={{
                      position:"absolute",left:0,top:0,bottom:0,
                      width:`${kickPower}%`,
                      background:barColor,
                      borderRadius:12,transition:"width 0.05s linear",
                      boxShadow:kickCharging?`0 0 20px ${zoneColor}40`:`0 0 8px ${C.cyan}20`,
                      zIndex:1,
                    }}/>
                    {/* Power % label */}
                    {kickPower>8 && <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:900,color:"#fff",textShadow:"0 0 6px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)",zIndex:3}}>
                      {Math.round(kickPower)}%
                    </div>}
                    {/* Zone markers */}
                    <div style={{position:"absolute",top:0,left:"15%",width:1,height:"100%",background:`rgba(255,255,255,0.1)`,zIndex:2}}/>
                    <div style={{position:"absolute",top:0,left:"40%",width:1,height:"100%",background:`rgba(255,255,255,0.12)`,zIndex:2}}/>
                    <div style={{position:"absolute",top:0,left:`${kickSweetMax}%`,width:2,height:"100%",background:`${C.red}40`,zIndex:2}}/>
                  </div>
                  {/* Duration zone labels */}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2,padding:"0 2px"}}>
                    <span style={{fontSize:6,color:C.text3}}>TAP</span>
                    <span style={{fontSize:6,color:C.text3}}>SHORT</span>
                    <span style={{fontSize:6,color:C.text3}}>GOOD</span>
                    <span style={{fontSize:6,color:C.green,fontWeight:700}}>PERFECT 💨</span>
                    <span style={{fontSize:6,color:C.red}}>BLINKER 💀</span>
                  </div>
                  {/* Hold-to-puff button — larger, visually connected to bar */}
                  <div
                    onMouseDown={()=>{kickStartCharge();playFx("charge");}}
                    onMouseUp={kickStopCharge}
                    onMouseLeave={kickStopCharge}
                    onTouchStart={(e)=>{e.preventDefault();kickStartCharge();playFx("charge");}}
                    onTouchEnd={kickStopCharge}
                    style={{
                      marginTop:6,padding:kickCharging?"16px 20px":"14px 20px",borderRadius:16,cursor:"pointer",textAlign:"center",
                      background:kickCharging
                        ? `linear-gradient(135deg, ${zoneColor}30, ${zoneColor}10)`
                        : `linear-gradient(135deg, ${inpInfo.color}25, ${inpInfo.color}08)`,
                      border:`2px solid ${kickCharging?zoneColor+"60":inpInfo.color+"40"}`,
                      fontSize:15,fontWeight:900,
                      color:kickCharging?zoneColor:inpInfo.color,
                      animation:kickCharging?"none":"countPulse 1.2s infinite",
                      boxShadow:kickCharging?`0 0 30px ${zoneColor}30, inset 0 0 20px ${zoneColor}08`:`0 0 20px ${inpInfo.color}15`,
                      transform:kickCharging?"scale(1.05)":"scale(1)",
                      transition:"all 0.15s",
                      userSelect:"none",WebkitUserSelect:"none",
                      position:"relative",overflow:"hidden",
                    }}
                  >
                    {/* Fill progress behind button text */}
                    {kickCharging && <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${kickPower}%`,background:`${zoneColor}12`,transition:"width 0.06s linear",borderRadius:16}}/>}
                    <div style={{position:"relative",zIndex:1}}>
                      {kickCharging
                        ? (zone==="perfect"?"🎯 RELEASE NOW!":isPuffBlinker.current?"💀 BLINKER! LET GO!":zone==="good"?"💨 Almost... keep going!":"💨 PUFFING... "+elapsed.toFixed(1)+"s")
                        : (inp==="puff"?"💨 HOLD TO PUFF":"🔘 HOLD TO CHARGE")}
                      <div style={{fontSize:8,color:`${kickCharging?zoneColor:inpInfo.color}80`,marginTop:3}}>
                        {kickCharging
                          ? (zone==="perfect"?`🎯 ${elapsed.toFixed(1)}s — SWEET SPOT! RELEASE!`:`${elapsed.toFixed(1)}s — Hold for 2.5-3.5s`)
                          : "Hold & release in the SWEET SPOT 💨👑"}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* ═══ BONUS OFFER ═══ */}
              {kickState==="bonus_offer" && (
                <div style={{textAlign:"center",animation:"fadeIn 0.4s ease",padding:"8px 0"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:18,animation:"gentleFloat 1s infinite"}}>⚡🎰⚡</span>
                    <span style={{fontSize:14,fontWeight:900,color:C.gold,textShadow:`0 0 15px ${C.gold}40`}}>BONUS SHOT!</span>
                  </div>
                  <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Tighter sweet spot · Double score if you nail it!</div>
                  <div style={{fontSize:9,color:C.text3,marginBottom:12,fontStyle:"italic"}}>"{kickOpponent.current.name}: 'No way you hit this one' 😏"</div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <div onClick={kickAcceptBonus} style={{padding:"12px 24px",borderRadius:12,cursor:"pointer",background:`linear-gradient(135deg, ${C.gold}25, ${C.gold}08)`,border:`1px solid ${C.gold}40`,fontSize:14,fontWeight:900,color:C.gold,boxShadow:`0 0 20px ${C.gold}15`,animation:"countPulse 1s infinite"}}>🔥 BRING IT</div>
                    <div onClick={kickSkipBonus} style={{padding:"12px 24px",borderRadius:12,cursor:"pointer",background:`${C.text3}08`,border:`1px solid ${C.text3}20`,fontSize:14,fontWeight:700,color:C.text3}}>Skip →</div>
                  </div>
                </div>
              )}

              {/* ═══ SHOOT instruction + timer (FK1 only) ═══ */}
              {!isFK2 && kickState==="shoot" && (
                <div style={{textAlign:"center"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{fontSize:11,color:C.text2,fontWeight:600}}>👆 Pick your corner</span>
                    <span style={{fontSize:12,fontWeight:900,color:actionTimer<=1?C.red:C.gold,minWidth:20,animation:actionTimer<=1?"pulse 0.5s infinite":"none"}}>{actionTimer}s</span>
                  </div>
                </div>
              )}

              {/* ═══ FK2: Phase label + TAP TO LOCK (line auto-sweeps, tap to stop) ═══ */}
              {isFK2 && (kickState==="shoot_x"||kickState==="shoot_y") && (
                <div style={{textAlign:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:900,color:kickState==="shoot_x"?C.cyan:C.orange}}>
                      {kickState==="shoot_x"?"← HORIZONTAL AIM →":"↕ VERTICAL AIM"}
                    </span>
                  </div>
                  {/* Labels */}
                  {kickState==="shoot_x" && <div style={{display:"flex",justifyContent:"space-between",width:goalW,margin:"0 auto 6px"}}>
                    <span style={{fontSize:7,color:C.red}}>WIDE</span><span style={{fontSize:7,color:C.text3}}>LEFT</span>
                    <span style={{fontSize:7,color:C.green,fontWeight:700}}>🎯 SWEET SPOT</span>
                    <span style={{fontSize:7,color:C.text3}}>RIGHT</span><span style={{fontSize:7,color:C.red}}>WIDE</span>
                  </div>}
                  {kickState==="shoot_y" && <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:6}}>
                    <span style={{fontSize:7,color:C.text3}}>GROUND</span>
                    <span style={{fontSize:7,color:C.green,fontWeight:700}}>🎯 SWEET SPOT</span>
                    <span style={{fontSize:7,color:C.red}}>OVER BAR</span>
                    <span style={{fontSize:7,color:C.green}}>X: {Math.round(fk2X)}% ✓</span>
                  </div>}
                  {/* HOLD TO PUFF button for FK2 — X or Y */}
                  <div
                    onMouseDown={()=>{kickStartCharge();playFx("charge");}}
                    onMouseUp={kickStopCharge}
                    onMouseLeave={kickStopCharge}
                    onTouchStart={(e)=>{e.preventDefault();kickStartCharge();playFx("charge");}}
                    onTouchEnd={kickStopCharge}
                    style={{
                      marginTop:4,padding:kickCharging?"14px 20px":"12px 20px",borderRadius:14,cursor:"pointer",textAlign:"center",
                      background:kickCharging
                        ? `linear-gradient(135deg, ${kickState==="shoot_x"?C.cyan:C.orange}30, ${kickState==="shoot_x"?C.cyan:C.orange}10)`
                        : `linear-gradient(135deg, ${kickState==="shoot_x"?C.cyan:C.orange}20, ${kickState==="shoot_x"?C.cyan:C.orange}08)`,
                      border:`1px solid ${kickCharging?(kickState==="shoot_x"?C.cyan:C.orange)+"60":(kickState==="shoot_x"?C.cyan:C.orange)+"40"}`,
                      fontSize:14,fontWeight:900,
                      color:kickState==="shoot_x"?C.cyan:C.orange,
                      animation:kickCharging?"none":"countPulse 1s infinite",
                      boxShadow:kickCharging?`0 0 25px ${kickState==="shoot_x"?C.cyan:C.orange}25`:`0 0 15px ${kickState==="shoot_x"?C.cyan:C.orange}12`,
                      transform:kickCharging?"scale(1.03)":"scale(1)",
                      transition:"all 0.15s",
                      userSelect:"none",WebkitUserSelect:"none",
                    }}
                  >
                    {kickCharging
                      ? (kickState==="shoot_x"
                        ? `← PUFFING... ${Math.round(kickPower)}% →`
                        : `↕ PUFFING... ${Math.round(kickPower)}%`)
                      : (kickState==="shoot_x"
                        ? "💨 HOLD TO PUFF — AIM LEFT/RIGHT ← →"
                        : "💨 HOLD TO PUFF — AIM HEIGHT ↕")}
                    <div style={{fontSize:7,color:`${kickState==="shoot_x"?C.cyan:C.orange}70`,marginTop:2}}>
                      {kickCharging
                        ? (kickState==="shoot_x"?"Longer puff = further RIGHT":"Longer puff = HIGHER")
                        : (kickState==="shoot_x"?"Hold & release to set horizontal position":"Hold & release to set vertical position")}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SAVE READY ═══ */}
              {kickState==="save_ready" && (
                <div style={{textAlign:"center",animation:"fadeIn 0.4s ease"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:18}}>🧤</span>
                    <span style={{fontSize:14,fontWeight:900,color:C.orange,textShadow:`0 0 15px ${C.orange}40`}}>YOUR TURN TO SAVE</span>
                  </div>
                  <div style={{fontSize:9,color:C.text3,marginBottom:10,fontStyle:"italic"}}>"AI is stepping up... look confident 😤"</div>
                  <div onClick={()=>{kickSaveStart();playFx("whistle");playFx("success");}} style={{
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
                <div style={{textAlign:"center",marginTop:4}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{fontSize:14,animation:"breathe 0.5s infinite"}}>💨</span>
                    <span style={{fontSize:12,fontWeight:900,color:C.gold,textShadow:`0 0 15px ${C.gold}40`}}>AI winding up...</span>
                  </div>
                  <div style={{fontSize:8,color:C.text3,marginTop:2}}>Watch for the hint!</div>
                </div>
              )}

              {/* ═══ SAVE DIVE instruction + timer ═══ */}
              {kickState==="save_dive" && (
                <div style={{textAlign:"center"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:900,color:C.orange,animation:"countPulse 0.4s infinite",textShadow:`0 0 15px ${C.orange}60`}}>🧤 DIVE NOW!</span>
                    <span style={{fontSize:14,fontWeight:900,color:actionTimer<=1?C.red:C.gold,animation:actionTimer<=1?"pulse 0.5s infinite":"none"}}>{actionTimer}s</span>
                  </div>
                  <div style={{fontSize:8,color:C.text3,marginTop:1}}>👆 TAP a zone!</div>
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
                      {/* No rematch in tournament mode */}
                      {!gameActive?.wcMode && <div onClick={()=>{startKick(gameActive?.id);playFx("whistle");}} style={{
                        padding:"12px 28px",borderRadius:12,cursor:"pointer",
                        background:`linear-gradient(135deg, ${C.cyan}18, ${C.cyan}06)`,
                        border:`1px solid ${C.cyan}30`,fontSize:14,fontWeight:800,color:C.cyan,
                        boxShadow:`0 0 15px ${C.cyan}10`,
                      }}>🔄 Rematch</div>}
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

            {/* ═══ BOTTOM PANEL: Side Pick + Reactions + Chat/Stats ═══ */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:20,display:"flex",flexDirection:"column"}}>

              {/* ── REACTION BAR + Audio (compact) ── */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,padding:"3px 6px",...GLASS_CLEAR,borderRadius:"10px 10px 0 0"}}>
                {[{e:"😂"},{e:"👏"},{e:"😱"},{e:"🔥"},{e:"💀"},{e:"😘"},{e:"👋"},{e:"💨"}].map((r,i)=>(
                  <div key={i} onClick={()=>{
                    playFx("tap");
                    const msg = {u:"You",m:r.e,c:audienceSide==="you"?C.cyan:C.red,t:Date.now()};
                    setSideChat(p=>({...p,[audienceSide]:[...p[audienceSide],msg]}));
                    setFloatingReactions(p=>[...p,{id:Date.now()+i,emoji:r.e,x:20+Math.random()*60,dur:1.5+Math.random()}]);
                    if(r.e==="😂") playFx("laugh");
                    if(r.e==="💨"&&Math.random()<0.15&&!puffWaveActive){triggerPuffWave();playFx("crowd");setCommentary("🌊 PUFF WAVE! "+sideFans.you+sideFans.ai+" fans puffed at once!");}
                  }} style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,background:`rgba(255,255,255,0.04)`,border:`1px solid rgba(255,255,255,0.06)`}}>
                    {r.e}
                  </div>
                ))}
                <div onClick={()=>{playFx("tap");setAudioOn(!audioOn);}} style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,marginLeft:1,background:audioOn?`${C.green}10`:`${C.red}10`,border:`1px solid ${audioOn?C.green+"20":C.red+"20"}`}}>
                  {audioOn?"🔊":"🔇"}
                </div>
              </div>

              {/* ── MAIN PANEL ── */}
              <div style={{...GLASS_CARD,display:"flex",flexDirection:"column",maxHeight:"30%",overflow:"hidden"}}>
                {/* ── SIDE PICKER + CROWD BAR ── */}
                <div style={{display:"flex",alignItems:"center",padding:"3px 6px",gap:3,borderBottom:`1px solid ${C.border}`}}>
                  {/* Your side */}
                  <div style={{
                    flex:1,padding:"5px 6px",borderRadius:8,textAlign:"center",
                    background:audienceSide==="you"?`${C.cyan}15`:"transparent",border:`1px solid ${audienceSide==="you"?C.cyan+"30":"transparent"}`,
                  }}>
                    <div style={{fontSize:9,fontWeight:800,color:audienceSide==="you"?C.cyan:C.text3}}>{gameActive?.wcMode&&wcTeam?wcTeam.flag:""} 😎 Steve</div>
                    <div style={{fontSize:7,color:C.text3}}>👥 {sideFans.you}</div>
                  </div>
                  {/* SWITCH BUTTON — tap to start puff meter */}
                  <div style={{width:70,textAlign:"center"}}>
                    <div style={{height:4,borderRadius:2,background:`${C.text3}15`,overflow:"hidden",display:"flex",marginBottom:3}}>
                      <div style={{width:`${sideFans.you/(sideFans.you+sideFans.ai)*100}%`,background:C.cyan,transition:"width 0.5s"}}/>
                      <div style={{flex:1,background:C.red}}/>
                    </div>
                    <div
                      onMouseDown={startSwitchPuff} onMouseUp={stopSwitchPuff} onMouseLeave={stopSwitchPuff}
                      onTouchStart={(e)=>{e.preventDefault();startSwitchPuff();}} onTouchEnd={stopSwitchPuff}
                      style={{
                        padding:"4px 6px",borderRadius:8,cursor:"pointer",
                        background:switchPuffing?`${C.red}15`:`${C.gold}08`,
                        border:`1px solid ${switchPuffing?C.red+"40":C.gold+"25"}`,
                        userSelect:"none",WebkitUserSelect:"none",position:"relative",overflow:"hidden",
                        transition:"all 0.2s",
                      }}
                    >
                      {/* Progress fill behind text */}
                      {switchPuffing && <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${switchPuffProgress}%`,background:switchPuffProgress>=80?`${C.red}20`:`${C.gold}15`,transition:"width 0.05s linear",borderRadius:8}}/>}
                      <div style={{position:"relative",zIndex:1}}>
                        <div style={{fontSize:7,fontWeight:800,color:switchPuffing?C.red:C.gold}}>
                          {switchPuffing ? `💨 ${(switchPuffProgress*2.5/100).toFixed(1)}s` : "🔄 Hold"} {audienceTraitor?"🐍":""}
                        </div>
                        {switchPuffing && <div style={{fontSize:6,color:C.text3,marginTop:1}}>
                          {switchPuffProgress<80?"Keep puffing...":"Almost! 🔥"}
                        </div>}
                        {!switchPuffing && <div style={{fontSize:5,color:C.text3,marginTop:1}}>Puff to Switch</div>}
                      </div>
                    </div>
                  </div>
                  {/* AI side */}
                  <div style={{
                    flex:1,padding:"5px 6px",borderRadius:8,textAlign:"center",
                    background:audienceSide==="ai"?`${C.red}15`:"transparent",border:`1px solid ${audienceSide==="ai"?C.red+"30":"transparent"}`,
                  }}>
                    <div style={{fontSize:9,fontWeight:800,color:audienceSide==="ai"?C.red:C.text3}}>{kickOpponent.current.emoji} {kickOpponent.current.name.split(" ")[0]}</div>
                    <div style={{fontSize:7,color:C.text3}}>👥 {sideFans.ai}</div>
                  </div>
                </div>

                {/* ── TAB BAR: Chat | Stats ── */}
                <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
                  {[{id:"chat",label:"💬 Chat"},{id:"stats",label:"📊 Stats"}].map(t=>(
                    <div key={t.id} onClick={()=>{playFx("nav");setGameBottomTab(t.id);}} style={{
                      flex:1,padding:"3px 0",textAlign:"center",cursor:"pointer",
                      borderBottom:gameBottomTab===t.id?`2px solid ${t.id==="chat"?C.green:C.gold}`:`2px solid transparent`,
                    }}>
                      <span style={{fontSize:8,fontWeight:gameBottomTab===t.id?800:600,color:gameBottomTab===t.id?(t.id==="chat"?C.green:C.gold):C.text3}}>{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── CONTENT ── */}
                <div style={{flex:1,overflowY:"auto",padding:"4px 10px 6px"}}>
                  {gameBottomTab==="chat" ? (
                    /* ── CHAT — side-specific during play, merged at breaks ── */
                    <div>
                      {(()=>{
                        const isBreak = ["shoot_result","save_result","round_result","final","bonus_offer"].includes(kickState);
                        const isMerged = isBreak || postGameChat;
                        const allMsgs = isMerged
                          ? [...(sideChat.you||[]),...(sideChat.ai||[]),...mergedChat].sort((a,b)=>a.t-b.t).slice(-10)
                          : (sideChat[audienceSide]||[]).slice(-8);
                        const chatLabel = isMerged
                          ? "🏟️ STADIUM CHAT — Both sides"
                          : (audienceSide==="you"?"😎 Steve's Side":""+kickOpponent.current.emoji+" "+kickOpponent.current.name+"'s Side");
                        const chatColor = isMerged ? C.gold : (audienceSide==="you"?C.cyan:C.red);
                        return <>
                          <div style={{fontSize:6,fontWeight:700,color:chatColor,marginBottom:2,display:"flex",alignItems:"center",gap:3}}>
                            <span>{chatLabel}</span>
                            {audienceTraitor && !isMerged && <span style={{fontSize:6,color:C.gold}}>🐍</span>}
                            {isMerged && <span style={{fontSize:5,color:C.text3,background:`${C.gold}12`,padding:"1px 4px",borderRadius:3}}>OPEN</span>}
                            <span style={{fontSize:5,color:C.text3,marginLeft:"auto"}}>👥 {sideFans.you+sideFans.ai}</span>
                          </div>
                          {allMsgs.map((m,i)=>(
                            <div key={i} style={{fontSize:7,marginBottom:1,lineHeight:1.3,animation:"fadeIn 0.2s ease"}}>
                              {m.isPlayer && <span style={{fontSize:6,color:C.gold,marginRight:2}}>⭐</span>}
                              <span style={{fontWeight:700,color:m.c||C.text2}}>{m.u==="⚠ SYSTEM"?"⚠":m.u.slice(0,6)}</span>
                              <span style={{color:C.text3}}> {m.m}</span>
                            </div>
                          ))}
                        </>;
                      })()}
                      {(()=>{
                        const isBreak = ["shoot_result","save_result","round_result","final","bonus_offer"].includes(kickState) || postGameChat;
                        const sendMsg = (txt) => {
                          if(!txt.trim()) return;
                          const msg = {u:"You",m:txt.trim(),c:audienceSide==="you"?C.cyan:C.red,t:Date.now(),isPlayer:false};
                          if(isBreak) {
                            setMergedChat(p=>[...p,msg]);
                          } else {
                            setSideChat(p=>({...p,[audienceSide]:[...p[audienceSide],msg]}));
                            if(Math.random()<0.05){const os=audienceSide==="you"?"ai":"you";setTimeout(()=>{setSideChat(p=>({...p,[os]:[...p[os],{u:"[LEAKED]🔓",m:txt.trim(),c:C.gold,t:Date.now()}]}));notify("💀 LEAKED!",C.gold);},2000);}
                          }
                          setChatInput("");
                        };
                        return <div style={{display:"flex",gap:3,marginTop:2}}>
                          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg(chatInput);}}
                            placeholder={isBreak?"Chat with everyone...":"Cheer..."} style={{flex:1,background:`${C.text3}06`,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 6px",fontSize:7,color:C.text,outline:"none"}}/>
                          <div onClick={()=>sendMsg(chatInput)} style={{padding:"3px 7px",borderRadius:6,cursor:"pointer",fontSize:7,fontWeight:700,color:isBreak?C.gold:audienceSide==="you"?C.cyan:C.red,...LG.tinted(isBreak?C.gold:audienceSide==="you"?C.cyan:C.red)}}>Send</div>
                        </div>;
                      })()}
                    </div>
                  ) : (
                    /* ── STATS — compact 2-column layout ── */
                    <div>
                      {/* Stats row — inline compact */}
                      <div style={{display:"flex",gap:2,marginBottom:4}}>
                        {[
                          {v:kickStats.goals,l:"Goal",c:C.cyan,e:"⚽"},
                          {v:kickStats.saves,l:"Save",c:C.orange,e:"🧤"},
                          {v:kickStats.perfects,l:"Perf",c:C.green,e:"💨"},
                          {v:kickStats.blinkers,l:"Blink",c:C.red,e:"💀"},
                          {v:kickStats.misses,l:"Miss",c:C.gold,e:"🚀"},
                        ].map((s,i)=>(
                          <div key={i} style={{flex:1,textAlign:"center",padding:"3px 0",borderRadius:6,background:`${s.c}08`,border:`1px solid ${s.c}15`}}>
                            <div style={{fontSize:12,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
                            <div style={{fontSize:5,color:C.text3,marginTop:1}}>{s.e} {s.l}</div>
                          </div>
                        ))}
                      </div>
                      {/* Fun facts — 2 columns, compact */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px"}}>
                        {[
                          {l:"Avg Puff",v:(2.5+Math.random()).toFixed(1)+"s"},
                          {l:"Near Blink",v:""+(kickStats.blinkers+Math.floor(Math.random()*3))},
                          {l:"Keeper",v:kickScore.you>kickScore.ai?"Shattered":"Confident"},
                          {l:"Leg",v:kickStats.goals>2?"On Fire":"Sleepy"},
                          {l:"Crowd",v:sideFans.you>sideFans.ai?"HYPE":"Nervous"},
                          {l:"Traitor",v:""+audienceSwitchCount+(audienceSwitchCount>0?" 🐍":"0")},
                        ].map((f,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:`1px solid ${C.border}`}}>
                            <span style={{fontSize:7,color:C.text3}}>{f.l}</span>
                            <span style={{fontSize:7,fontWeight:700,color:C.text2}}>{f.v}</span>
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
      // Final Kick 2 shares FK1's render (handled above via isFK2 flag)
      if(false) { // FK2 block removed — uses FK1 render with isFK2 flag
        const pool = getDevicePool();
        const inp = gameActive.activeInput;
        const inpInfo = INPUT_TYPES.find(t=>t.id===inp)||INPUT_TYPES[0];
        const isShootPhase = ["shoot_x","shoot_y","flight","shoot_result"].includes(kickState);
        const isSavePhase = ["save_ready","save_countdown","save_dive","save_result"].includes(kickState);
        const isResult = kickState==="shoot_result"||kickState==="save_result";
        const goalW = 290, goalH = 140;
        const zoneW = goalW/3, zoneH = goalH/2;
        const getBallPos = (z) => ({ x: KICK_ZONES[z].col * zoneW + zoneW/2, y: KICK_ZONES[z].row * zoneH + zoneH/2 });

        const SHOOT_TAUNTS = ["Double puff incoming 🎯","Two puffs, one goal 😏","X then Y... easy right? 🤔","Precision mode ON 😂","Sniper puff activated 🥶"];
        const GOAL_CHEERS = ["GOLAZOOO! 🔥🔥🔥","DOUBLE PUFF BANGER! 💥","PRECISION = PERFECTION 😤","SHEEEESH! 🥶","SNIPER MERCHANT 👑"];
        const SAVE_TAUNTS = ["AI's got the ball... 👀","Keeper mode: ON 🧤","Don't let it in! 😬","Quick reflexes or nah? 🤣","This one's SPICY 🌶️"];
        const SAVE_CHEERS = ["DENIED! 🚫🧤","WALL MODE ACTIVATED 🧱","NOT TODAY! 😤","BRICK WALL ENERGY 💪","AI IS CRYING RN 😭"];
        const CONCEDE_REACT = ["Bruh... 💀","That one hurt 😂","AI said 'sit down' 😤","Pain. Just pain. 🥲","Keeper had lag 📡"];
        const crowdEmojis = ["🎉","🔥","😤","💨","🤣","😱","👏","🥳","💀","😂","🙌","⚡"];

        return (
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,overflow:"hidden",
            animation:screenShake?"shake 0.4s ease":"none",
            filter:dimLights?"brightness(0.6)":"brightness(1)",transition:"filter 0.3s",
          }}>
            {/* ═══ SCREEN FLASH OVERLAY ═══ */}
            {screenFlash && <div style={{position:"absolute",inset:0,zIndex:200,pointerEvents:"none",opacity:0,
              background:screenFlash==="goal"?"rgba(0,255,100,0.25)":screenFlash==="save"?"rgba(255,165,0,0.2)":screenFlash==="miss"?"rgba(255,50,50,0.2)":"rgba(255,0,0,0.3)",
              animation:"flashOverlay 0.4s ease forwards",
            }}/>}

            {/* ═══ CONFETTI PARTICLES ═══ */}
            {confettiParticles.length>0 && confettiParticles.map(p=>(
              <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size*0.6,
                background:p.color,borderRadius:1,transform:`rotate(${p.rot}deg)`,zIndex:210,pointerEvents:"none",
                animation:`confettiFall ${1.5+Math.random()}s ease-out forwards`,
              }}/>
            ))}

            {/* ═══ SMOKE PARTICLES ═══ */}
            {smokeParticles.length>0 && smokeParticles.map(p=>(
              <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,
                borderRadius:"50%",background:`radial-gradient(circle, rgba(255,255,255,0.06), transparent)`,
                zIndex:205,pointerEvents:"none",filter:"blur(8px)",
                animation:`smokeRise ${p.dur}s ease-out forwards`,
              }}/>
            ))}

            {/* ═══ PUFF BUBBLES ═══ */}
            {puffBubbles.length>0 && puffBubbles.map(b=>(
              <div key={b.id} style={{position:"absolute",left:`${b.x}%`,bottom:`${b.y}%`,
                zIndex:206,pointerEvents:"none",
                animation:`bubbleFloat ${b.dur}s ease-out forwards`,
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              }}>
                <div style={{width:b.size*2.5,height:b.size*2.5,borderRadius:"50%",
                  background:`linear-gradient(135deg, ${b.color}, ${b.color}80)`,
                  border:`2px solid ${b.color}`,boxShadow:`0 0 10px ${b.color}40`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:b.size*1.2,
                }}>💨</div>
                <div style={{fontSize:7,fontWeight:800,color:b.color,textShadow:`0 0 6px rgba(0,0,0,0.8)`,
                  background:`rgba(0,0,0,0.4)`,padding:"1px 4px",borderRadius:6,
                }}>+{(Math.random()*3+0.5).toFixed(1)}s</div>
              </div>
            ))}

            {/* ═══ AUDIENCE BUBBLES ═══ */}
            {audienceBubbles.length>0 && audienceBubbles.map(b=>(
              <div key={b.id} style={{position:"absolute",left:`${b.x}%`,bottom:`${b.y}%`,
                zIndex:204,pointerEvents:"none",opacity:0.4,
                animation:`bubbleFloat ${b.dur}s ease-out forwards`,
                display:"flex",flexDirection:"column",alignItems:"center",
              }}>
                <div style={{width:b.size*3,height:b.size*3,borderRadius:"50%",
                  background:`radial-gradient(circle, ${b.color}, transparent)`,
                  border:`1px solid ${b.color}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:b.size*1.5,
                }}>{["💨","🔥","😤","👀","🫁"][Math.floor(Math.random()*5)]}</div>
              </div>
            ))}

            {/* ═══ SCREEN EDGE GLOW during active puff ═══ */}
            {kickCharging && <div style={{position:"absolute",inset:0,zIndex:203,pointerEvents:"none",
              boxShadow:`inset 0 0 60px ${C.lime}15, inset 0 0 120px ${C.cyan}08`,
              borderRadius:"inherit",animation:"pulse 1.5s infinite",
            }}/>}

            {/* ═══ PUFF WAVE ═══ */}
            {puffWaveActive && <div style={{position:"absolute",bottom:0,left:0,right:0,height:"100%",zIndex:208,pointerEvents:"none",
              background:`linear-gradient(0deg, rgba(0,229,255,0.08) 0%, rgba(127,255,0,0.04) 30%, transparent 60%)`,
              animation:"puffWaveSweep 3s ease forwards",
            }}>
              <div style={{position:"absolute",bottom:"20%",left:"50%",transform:"translateX(-50%)",fontSize:12,fontWeight:900,color:C.cyan,textShadow:`0 0 20px ${C.cyan}`,animation:"fadeIn 0.5s ease"}}>
                🌊💨 PUFF WAVE! THE STADIUM IS CLOUDED! ☁️💨 🌊
              </div>
            </div>}

            {/* ═══ AI COMMENTATOR ═══ */}
            {commentatorText && <div style={{position:"absolute",top:8,left:80,right:10,zIndex:215,display:"flex",alignItems:"center",animation:"fadeIn 0.3s ease",pointerEvents:"none"}}>
              <div style={{flex:1,padding:"5px 10px",borderRadius:8,background:`rgba(6,8,15,0.7)`,backdropFilter:"blur(8px)",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:10,flexShrink:0}}>🎙️</span>
                <span style={{fontSize:8,fontWeight:600,color:C.text,fontStyle:"italic",lineHeight:1.2}}>{commentatorText}</span>
              </div>
            </div>}

            {/* ═══ MATCH INTRO ═══ */}
            {matchIntro && (
              <div style={{position:"absolute",inset:0,zIndex:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:`radial-gradient(ellipse at 50% 30%, rgba(0,229,255,0.06) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 70%, rgba(255,217,61,0.04) 0%, transparent 50%),
                  rgba(4,8,18,0.92)`,
                backdropFilter:"blur(12px)",animation:"fadeIn 0.3s ease",
              }}>
                <div style={{position:"absolute",top:0,left:"20%",width:2,height:"40%",background:`linear-gradient(180deg, ${C.cyan}25, transparent)`,filter:"blur(3px)"}}/>
                <div style={{position:"absolute",top:0,right:"20%",width:2,height:"40%",background:`linear-gradient(180deg, ${C.red}25, transparent)`,filter:"blur(3px)"}}/>
                <div style={{marginBottom:16,padding:"4px 16px",borderRadius:20,background:`${C.gold}12`,border:`1px solid ${C.gold}30`}}>
                  <span style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:3}}>⚽🔥 FINAL KICK 2 — DOUBLE PUFF</span>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:16}}>
                  <div style={{textAlign:"center",animation:"slideInLeft 0.8s ease"}}>
                    <div style={{width:60,height:60,borderRadius:16,overflow:"hidden",border:`2px solid ${C.cyan}60`,background:`${C.cyan}10`,margin:"0 auto 6px",boxShadow:`0 0 20px ${C.cyan}30`}}>
                      <img src={PLAYER_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:32px;text-align:center;padding-top:10px">😎</div>';}}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:C.cyan,textShadow:`0 0 10px ${C.cyan}40`}}>Steve</div>
                    <div style={{fontSize:8,color:C.text3}}>Lv.24 · {getDeviceShort()}</div>
                  </div>
                  <div style={{textAlign:"center",minWidth:50}}>
                    {(matchIntro.stage==="countdown") ? (
                      <div style={{fontSize:60,fontWeight:900,color:C.gold,textShadow:`0 0 40px ${C.gold}60`,animation:"countPulse 0.8s ease",lineHeight:1}}>{matchIntro.count}</div>
                    ) : matchIntro.stage==="go" ? (
                      <div style={{fontSize:24,fontWeight:900,color:C.green,textShadow:`0 0 20px ${C.green}60`,animation:"countPulse 0.5s ease",lineHeight:1}}>⚽</div>
                    ) : (
                      <div style={{fontSize:24,fontWeight:900,color:C.gold,textShadow:`0 0 20px ${C.gold}60`,animation:"countPulse 1.5s infinite"}}>VS</div>
                    )}
                  </div>
                  <div style={{textAlign:"center",animation:"slideInRight 0.8s ease"}}>
                    <div style={{width:60,height:60,borderRadius:16,overflow:"hidden",border:`2px solid ${C.red}60`,background:`${C.red}10`,margin:"0 auto 6px",boxShadow:`0 0 20px ${C.red}30`}}>
                      <img src={kickOpponent.current.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:32px;text-align:center;padding-top:10px">'+kickOpponent.current.emoji+'</div>';}}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:C.red,textShadow:`0 0 10px ${C.red}40`}}>{kickOpponent.current.name}</div>
                    <div style={{fontSize:8,color:C.text3}}>{kickOpponent.current.rank} · {kickOpponent.current.record}</div>
                  </div>
                </div>
                {(matchIntro.stage==="stats"||matchIntro.stage==="countdown"||matchIntro.stage==="go") && (
                  <div style={{width:"80%",maxWidth:280,padding:"10px 14px",borderRadius:14,...GLASS_CLEAR,animation:"fadeIn 0.5s ease",marginBottom:12}}>
                    <div style={{fontSize:8,fontWeight:800,color:C.gold,marginBottom:8,textAlign:"center",letterSpacing:2}}>📊 HEAD TO HEAD</div>
                    {[
                      ["72%","Win Rate",(45+Math.floor(Math.random()*20))+"%"],
                      ["420","Goals",kickOpponent.current.record.split("-")[0]],
                      ["69","Blinkers 💀",Math.floor(Math.random()*30)+""],
                      ["2.9s","Avg Puff",(2.5+Math.random()).toFixed(1)+"s"],
                    ].map(([l,mid,r],i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,padding:"2px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
                        <span style={{fontSize:11,fontWeight:800,color:C.cyan,minWidth:35}}>{l}</span>
                        <span style={{fontSize:8,color:C.text3,flex:1,textAlign:"center"}}>{mid}</span>
                        <span style={{fontSize:11,fontWeight:800,color:C.red,minWidth:35,textAlign:"right"}}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {matchIntro.stage==="go" && (
                  <div style={{animation:"fadeIn 0.2s ease",marginTop:4}}>
                    <div style={{fontSize:28,fontWeight:900,color:C.green,textShadow:`0 0 30px ${C.green}60`,animation:"countPulse 0.5s ease",textAlign:"center"}}>KICK OFF!</div>
                  </div>
                )}
                <div style={{marginTop:12,fontSize:8,color:C.text3}}>
                  👁️ {120+Math.floor(Math.random()*80)} watching · 🏟️ Double Puff Mode
                </div>
              </div>
            )}

            {/* ═══ STADIUM BACKGROUND ═══ */}
            <div style={{position:"absolute",inset:0,background:`
              radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, rgba(127,255,0,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 40%),
              linear-gradient(180deg, #06101E 0%, #0c1a38 30%, #102240 60%, #081830 100%)
            `}}/>
            <div style={{position:"absolute",top:0,left:"15%",width:3,height:"35%",background:`linear-gradient(180deg, ${C.cyan}30, transparent)`,filter:"blur(4px)",animation:"pulse 3s infinite"}}/>
            <div style={{position:"absolute",top:0,right:"15%",width:3,height:"35%",background:`linear-gradient(180deg, ${C.gold}30, transparent)`,filter:"blur(4px)",animation:"pulse 3s infinite 0.5s"}}/>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:200,height:60,borderRadius:"0 0 100% 100%",background:`radial-gradient(ellipse, rgba(255,255,255,0.04), transparent)`,filter:"blur(20px)"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"30%",background:`linear-gradient(180deg, transparent, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0.12))`,pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:"15%",left:"10%",right:"10%",height:1,background:`${C.green}10`}}/>
            <div style={{position:"absolute",bottom:"25%",left:"20%",right:"20%",height:1,background:`${C.green}06`}}/>
            {[...Array(8)].map((_,i)=>(
              <div key={`crowd${i}`} style={{position:"absolute",left:`${8+i*12}%`,bottom:`${(tick*1.5+i*47)%120-10}%`,fontSize:12+Math.random()*8,opacity:0.15+Math.random()*0.15,transition:"bottom 2s linear",pointerEvents:"none"}}>{crowdEmojis[(i+tick)%crowdEmojis.length]}</div>
            ))}
            {[...Array(20)].map((_,i)=>(
              <div key={`dot${i}`} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*30}%`,width:2,height:2,borderRadius:"50%",background:[C.cyan,C.gold,C.pink,C.orange][i%4],opacity:0.1+Math.random()*0.15,animation:`pulse ${2+Math.random()*3}s infinite ${Math.random()*2}s`}}/>
            ))}

            {overlayBack(()=>{setGameActive(null);setKickState(null);setFk2Phase(null);})}

            <div style={{position:"relative",zIndex:2,flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"38px 14px 52px",height:"100%",overflowY:"auto"}}>

              {/* ═══ VS ARENA HEADER ═══ */}
              <div style={{width:"100%",maxWidth:390,marginTop:28,marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  {gameActive?.wcMode ? (
                    <span style={{fontSize:8,fontWeight:800,color:C.gold,letterSpacing:2}}>
                      🏆 {gameActive?.wcKnockout && wcBracket ? wcBracket.rounds[wcBracket.currentRound].toUpperCase() : `GROUP ${wcTournament?.group || "?"} · MATCH ${(gameActive?.wcMatchIdx ?? 0)+1}/3`}
                    </span>
                  ) : (
                    <span style={{fontSize:8,fontWeight:800,color:C.gold,letterSpacing:2}}>⚽🔥 FINAL KICK 2</span>
                  )}
                  <span style={{fontSize:7,fontWeight:700,color:pool.color,padding:"2px 8px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ {pool.label}</span>
                  <span style={{fontSize:7,fontWeight:700,color:inpInfo.color,padding:"2px 8px",borderRadius:20,...LG.tinted(inpInfo.color)}}>{inpInfo.icon} {inpInfo.label}</span>
                  {kickBonusActive && <span style={{fontSize:7,fontWeight:800,color:C.gold,padding:"2px 8px",borderRadius:20,background:`${C.gold}20`,border:`1px solid ${C.gold}40`,animation:"pulse 1s infinite"}}>⚡ BONUS</span>}
                </div>
                {/* ═══ ARENA VS CARD ═══ */}
                <div style={{display:"flex",alignItems:"stretch",borderRadius:18,overflow:"hidden",...LG.tinted(C.cyan),position:"relative",minHeight:80}}>
                  <div style={{position:"absolute",top:0,left:"50%",width:2,height:"100%",background:`linear-gradient(180deg, ${C.gold}60, ${C.gold}10)`,transform:"skewX(-8deg)",zIndex:3}}/>
                  <div style={{position:"absolute",left:0,top:0,width:"40%",height:"100%",background:`radial-gradient(ellipse at 20% 50%, ${C.cyan}12, transparent 70%)`,pointerEvents:"none"}}/>
                  <div style={{position:"absolute",right:0,top:0,width:"40%",height:"100%",background:`radial-gradient(ellipse at 80% 50%, ${C.red}12, transparent 70%)`,pointerEvents:"none"}}/>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:`linear-gradient(135deg, ${C.cyan}08, transparent)`}}>
                    <div style={{position:"relative",flexShrink:0}}>
                      <div style={{width:50,height:50,borderRadius:14,overflow:"hidden",border:`2px solid ${C.cyan}50`,background:`${C.cyan}10`,boxShadow:`0 0 16px ${C.cyan}30`}}>
                        <img src={PLAYER_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:28px;text-align:center;padding-top:8px">😎</div>';}}/>
                      </div>
                      {gameActive?.wcMode && wcTeam && <div style={{position:"absolute",bottom:-3,right:-3,fontSize:16,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.8))"}}>{wcTeam.flag}</div>}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:800,color:C.cyan}}>{gameActive?.wcMode&&wcTeam?wcTeam.flag+" ":""}Steve</div>
                      <div style={{fontSize:7,color:C.text3}}>{gameActive?.wcMode&&wcTeam?wcTeam.name+" · ":""}{getDeviceShort()}</div>
                      <div style={{fontSize:28,fontWeight:900,color:"#fff",textShadow:`0 0 12px ${C.cyan}60`,lineHeight:1,marginTop:2}}>{kickScore.you}</div>
                    </div>
                  </div>
                  <div style={{width:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:4}}>
                    <div style={{fontSize:7,color:C.text3,fontWeight:700}}>R{kickRound+1}/5</div>
                    <div style={{display:"flex",gap:3,marginTop:2}}>{[0,1,2,3,4].map(r=>(<div key={r} style={{width:5,height:5,borderRadius:"50%",background:r<kickRound?C.cyan:r===kickRound?C.gold:`${C.text3}30`,boxShadow:r===kickRound?`0 0 6px ${C.gold}`:""}}/>))}</div>
                    <div style={{fontSize:13,fontWeight:900,color:C.gold,textShadow:`0 0 10px ${C.gold}50`,marginTop:2}}>VS</div>
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",flexDirection:"row-reverse",gap:8,padding:"10px 12px",background:`linear-gradient(225deg, ${C.red}08, transparent)`}}>
                    <div style={{position:"relative",flexShrink:0}}>
                      <div style={{width:50,height:50,borderRadius:14,overflow:"hidden",border:`2px solid ${C.red}50`,background:`${C.red}10`,boxShadow:`0 0 16px ${C.red}30`}}>
                        <img src={kickOpponent.current.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{e.target.outerHTML='<div style="font-size:28px;text-align:center;padding-top:8px">'+kickOpponent.current.emoji+'</div>';}}/>
                      </div>
                      {gameActive?.wcMode && <div style={{position:"absolute",bottom:-3,left:-3,fontSize:16,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.8))"}}>{kickOpponent.current.emoji}</div>}
                    </div>
                    <div style={{textAlign:"right",minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:800,color:C.red,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{gameActive?.wcMode?kickOpponent.current.emoji+" ":"" }{kickOpponent.current.name}</div>
                      <div style={{fontSize:7,color:C.text3}}>{kickOpponent.current.rank}</div>
                      <div style={{fontSize:28,fontWeight:900,color:"#fff",textShadow:`0 0 12px ${C.red}60`,lineHeight:1,marginTop:2}}>{kickScore.ai}</div>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:4}}>
                  <span style={{fontSize:7,color:C.text3}}>⚽{kickStats.goals}</span>
                  <span style={{fontSize:7,color:C.text3}}>🧤{kickStats.saves}</span>
                  <span style={{fontSize:7,color:C.green}}>💨{kickStats.perfects}</span>
                  {kickStats.blinkers>0&&<span style={{fontSize:7,color:C.red}}>💀{kickStats.blinkers}</span>}
                  {kickStats.misses>0&&<span style={{fontSize:7,color:C.gold}}>🚀{kickStats.misses}</span>}
                </div>
              </div>

              {/* ═══ PHASE LABEL + LIVE COMMENTARY ═══ */}
              <div style={{textAlign:"center",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:900,letterSpacing:2,color:isShootPhase?C.cyan:isSavePhase?C.orange:C.gold,textShadow:`0 0 15px ${isShootPhase?C.cyan:C.orange}40`}}>
                  {kickBonusActive ? "⚡ BONUS SHOT" : isShootPhase ? (kickState==="shoot_x"?"← HORIZONTAL AIM →":kickState==="shoot_y"?"↕ VERTICAL AIM":"🦶 YOUR KICK") : isSavePhase ? "🧤 YOUR SAVE" : kickState==="bonus_offer" ? "🎰 BONUS!" : ""}
                </div>
                {kickComment && (
                  <div style={{fontSize:10,color:C.text2,marginTop:3,fontStyle:"italic",animation:"fadeIn 0.4s ease",maxWidth:300}}>
                    "{kickComment}"
                  </div>
                )}
              </div>

              {/* ═══ GOAL FRAME ═══ */}
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
                  <div style={{position:"absolute",top:0,left:"33.3%",width:1,height:"100%",background:`rgba(255,255,255,0.12)`}}/>
                  <div style={{position:"absolute",top:0,left:"66.6%",width:1,height:"100%",background:`rgba(255,255,255,0.12)`}}/>
                  <div style={{position:"absolute",top:"50%",left:0,width:"100%",height:1,background:`rgba(255,255,255,0.12)`}}/>

                  {/* FK2: Show locked X indicator on goal during Y phase */}
                  {(kickState==="shoot_y") && fk2XDone && (()=>{
                    const xPos = (fk2X / 100) * goalW;
                    return <div style={{position:"absolute",bottom:0,left:xPos-1,width:3,height:"100%",background:`${C.cyan}40`,zIndex:6,
                      boxShadow:`0 0 8px ${C.cyan}30`,
                    }}>
                      <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",fontSize:7,fontWeight:800,color:C.cyan,textShadow:"0 0 4px rgba(0,0,0,0.8)",whiteSpace:"nowrap"}}>X:{Math.round(fk2X)}%</div>
                    </div>;
                  })()}

                  {/* Tap zones for SAVE DIVE (reuse FK1) */}
                  {kickState==="save_dive" && KICK_ZONES.map((z,i)=>(
                    <div key={i} onClick={()=>{kickDive(i);playFx("kick");}} style={{
                      position:"absolute",
                      left:z.col*zoneW, top:z.row*zoneH, width:zoneW, height:zoneH,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:"pointer",
                      background: kickAim===i ? `radial-gradient(circle, ${C.cyan}30, ${C.cyan}08)` : "transparent",
                      borderRadius:4, transition:"all 0.15s ease",
                      fontSize:22, color:`rgba(255,255,255,0.15)`,
                    }}>
                      <span style={{filter:kickAim===i?`drop-shadow(0 0 8px ${C.cyan})`:""}}>{z.label}</span>
                    </div>
                  ))}

                  {/* Ball animation */}
                  {kickBallAnim && (()=>{
                    const bp = getBallPos(kickBallAnim.zone);
                    const isGoal = kickBallAnim.result==="goal";
                    return <>
                      <div style={{position:"absolute",left:bp.x-30,top:bp.y-30,width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle, ${isGoal?C.green:C.red}30, transparent)`,animation:"fadeIn 0.2s ease",zIndex:4}}/>
                      <div style={{position:"absolute",left:bp.x-16,top:bp.y-16,fontSize:32,zIndex:5,animation:"fadeIn 0.2s ease",
                        filter:`drop-shadow(0 0 20px ${isGoal?C.green:C.red}) drop-shadow(0 0 40px ${isGoal?C.green:C.red}80)`,
                      }}>⚽</div>
                    </>;
                  })()}

                  {/* Keeper dive */}
                  {kickDiveAnim!==null && (()=>{
                    const col = KICK_ZONES[kickDiveAnim].col;
                    const kx = col===0?"15%":col===1?"50%":"85%";
                    return <div style={{position:"absolute",bottom:8,left:kx,transform:"translateX(-50%)",
                      fontSize:36,zIndex:4,transition:"left 0.25s cubic-bezier(0.22,1,0.36,1)",
                      filter:`drop-shadow(0 0 10px rgba(255,165,0,0.4))`,
                    }}>{col===0?"🤸":"🧤"}</div>;
                  })()}

                  {/* Save countdown hint */}
                  {kickState==="save_countdown" && kickAiZone!==null && (()=>{
                    const hintCol = KICK_ZONES[kickAiZone].col;
                    return <div style={{position:"absolute",
                      left:hintCol===0?"0%":hintCol===1?"25%":"55%",
                      top:0, width:"45%", height:"100%",
                      background:`linear-gradient(90deg, transparent, ${C.orange}06, transparent)`,
                      animation:"pulse 0.8s infinite",pointerEvents:"none",
                    }}/>;
                  })()}

                  {/* Result overlay */}
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
                {(kickState==="shoot_x"||kickState==="shoot_y") && <div style={{width:6,height:6,borderRadius:"50%",background:`${C.text}20`,boxShadow:`0 0 8px ${C.text}10`}}/>}
              </div>

              {/* ═══ FK2: HORIZONTAL PUFF BAR (X-axis) ═══ */}
              {kickState==="shoot_x" && (()=>{
                const zone = getPuffZone(kickPower);
                const elapsed = kickCharging ? (Date.now()-puffStartTime.current)/1000 : 0;
                const zoneColor = zone==="perfect"?C.green:zone==="good"?C.cyan:zone==="short"?C.gold:zone==="tap"?C.text3:C.red;
                const xOutZone = kickPower < 10 || kickPower > 90;
                const barColor = xOutZone
                  ? `linear-gradient(90deg, ${C.red}, ${C.cyan}, ${C.green}, ${C.cyan}, ${C.red})`
                  : `linear-gradient(90deg, ${C.red}40, ${C.cyan}, ${C.green}, ${C.cyan}, ${C.red}40)`;
                return (
                <div style={{width:goalW,animation:"fadeIn 0.3s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,padding:"0 2px"}}>
                    <span style={{fontSize:9,fontWeight:800,color:C.gold}}>← HORIZONTAL AIM →</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {kickCharging && <span style={{fontSize:10,fontWeight:900,color:zoneColor,fontFamily:"monospace"}}>{elapsed.toFixed(1)}s</span>}
                      {!kickCharging && <span style={{fontSize:10,fontWeight:900,color:actionTimer<=1?C.red:C.gold,animation:actionTimer<=1?"pulse 0.5s infinite":"none"}}>{actionTimer}s</span>}
                    </div>
                  </div>
                  {/* Horizontal bar */}
                  <div style={{height:28,borderRadius:14,background:`rgba(255,255,255,0.04)`,overflow:"hidden",border:`2px solid ${kickCharging?zoneColor+"60":"rgba(255,255,255,0.1)"}`,position:"relative",transition:"border-color 0.2s",boxShadow:kickCharging?`0 0 15px ${zoneColor}25`:"none",
                    animation:!kickCharging?"countPulse 2s infinite":"none",
                  }}>
                    {/* Out of bounds zones (edges) */}
                    <div style={{position:"absolute",left:0,width:"10%",height:"100%",background:`${C.red}15`,borderRight:`1px solid ${C.red}30`}}/>
                    <div style={{position:"absolute",right:0,width:"10%",height:"100%",background:`${C.red}15`,borderLeft:`1px solid ${C.red}30`}}/>
                    {/* Sweet spot highlight */}
                    <div style={{position:"absolute",left:`${kickSweetMin}%`,width:`${kickSweetMax-kickSweetMin}%`,height:"100%",background:`${C.green}08`,borderLeft:`1px solid ${C.green}30`,borderRight:`1px solid ${C.green}30`}}/>
                    <div style={{position:"absolute",left:`${kickSweetMin+2}%`,top:2,fontSize:7,color:`${C.green}50`,fontWeight:800,zIndex:2}}>SWEET</div>
                    {/* Empty state hint */}
                    {!kickCharging && kickPower===0 && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,pointerEvents:"none"}}>
                      <span style={{fontSize:10,fontWeight:700,color:`${C.text3}80`,animation:"countPulse 1.5s infinite"}}>⬇️ Hold to aim LEFT ↔ RIGHT</span>
                    </div>}
                    {/* Fill bar */}
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${kickPower}%`,
                      background:barColor,borderRadius:12,transition:"width 0.05s linear",
                      boxShadow:kickCharging?`0 0 20px ${zoneColor}40`:`0 0 8px ${C.cyan}20`,zIndex:1,
                    }}/>
                    {kickPower>8 && <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:900,color:"#fff",textShadow:"0 0 6px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)",zIndex:3}}>
                      {Math.round(kickPower)}%
                    </div>}
                  </div>
                  {/* Labels */}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2,padding:"0 2px"}}>
                    <span style={{fontSize:7,color:C.red,fontWeight:700}}>← WIDE</span>
                    <span style={{fontSize:6,color:C.text3}}>LEFT</span>
                    <span style={{fontSize:6,color:C.green,fontWeight:700}}>CENTER 🎯</span>
                    <span style={{fontSize:6,color:C.text3}}>RIGHT</span>
                    <span style={{fontSize:7,color:C.red,fontWeight:700}}>WIDE →</span>
                  </div>
                  {/* Hold-to-puff button */}
                  <div
                    onMouseDown={()=>{kickStartCharge();playFx("charge");}}
                    onMouseUp={kickStopCharge}
                    onMouseLeave={kickStopCharge}
                    onTouchStart={(e)=>{e.preventDefault();kickStartCharge();playFx("charge");}}
                    onTouchEnd={kickStopCharge}
                    style={{
                      marginTop:6,padding:kickCharging?"16px 20px":"14px 20px",borderRadius:16,cursor:"pointer",textAlign:"center",
                      background:kickCharging
                        ? `linear-gradient(135deg, ${zoneColor}30, ${zoneColor}10)`
                        : `linear-gradient(135deg, ${inpInfo.color}25, ${inpInfo.color}08)`,
                      border:`2px solid ${kickCharging?zoneColor+"60":inpInfo.color+"40"}`,
                      fontSize:15,fontWeight:900,
                      color:kickCharging?zoneColor:inpInfo.color,
                      animation:kickCharging?"none":"countPulse 1.2s infinite",
                      boxShadow:kickCharging?`0 0 30px ${zoneColor}30, inset 0 0 20px ${zoneColor}08`:`0 0 20px ${inpInfo.color}15`,
                      transform:kickCharging?"scale(1.05)":"scale(1)",
                      transition:"all 0.15s",userSelect:"none",WebkitUserSelect:"none",position:"relative",overflow:"hidden",
                    }}
                  >
                    {kickCharging && <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${kickPower}%`,background:`${zoneColor}12`,transition:"width 0.06s linear",borderRadius:16}}/>}
                    <div style={{position:"relative",zIndex:1}}>
                      {kickCharging
                        ? `💨 AIMING... ${elapsed.toFixed(1)}s — Release to lock X!`
                        : "💨 HOLD TO AIM HORIZONTAL"}
                      <div style={{fontSize:8,color:`${kickCharging?zoneColor:inpInfo.color}80`,marginTop:3}}>
                        {kickCharging ? `${Math.round(kickPower)}% — ${kickPower<10?"WIDE LEFT!":kickPower>90?"WIDE RIGHT!":kickPower>=kickSweetMin&&kickPower<=kickSweetMax?"SWEET SPOT!":"Aiming..."}` : "Puff 1 of 2: Aim left ↔ right"}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* ═══ FK2: VERTICAL PUFF BAR (Y-axis) ═══ */}
              {kickState==="shoot_y" && (()=>{
                const zone = getPuffZone(kickPower);
                const elapsed = kickCharging ? (Date.now()-puffStartTime.current)/1000 : 0;
                const zoneColor = zone==="perfect"?C.green:zone==="good"?C.cyan:zone==="short"?C.gold:zone==="tap"?C.text3:C.red;
                const yOutZone = kickPower > 95;
                return (
                <div style={{width:goalW,animation:"fadeIn 0.3s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,padding:"0 2px"}}>
                    <span style={{fontSize:9,fontWeight:800,color:C.gold}}>↕ VERTICAL AIM</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:8,color:C.cyan,fontWeight:700}}>X: {Math.round(fk2X)}% ✓</span>
                      {kickCharging && <span style={{fontSize:10,fontWeight:900,color:zoneColor,fontFamily:"monospace"}}>{elapsed.toFixed(1)}s</span>}
                      {!kickCharging && <span style={{fontSize:10,fontWeight:900,color:actionTimer<=1?C.red:C.gold,animation:actionTimer<=1?"pulse 0.5s infinite":"none"}}>{actionTimer}s</span>}
                    </div>
                  </div>
                  {/* Vertical bar rendered horizontally (same UX as X bar) */}
                  <div style={{height:28,borderRadius:14,background:`rgba(255,255,255,0.04)`,overflow:"hidden",border:`2px solid ${kickCharging?zoneColor+"60":"rgba(255,255,255,0.1)"}`,position:"relative",transition:"border-color 0.2s",boxShadow:kickCharging?`0 0 15px ${zoneColor}25`:"none",
                    animation:!kickCharging?"countPulse 2s infinite":"none",
                  }}>
                    {/* Over the bar zone (top = right side of bar) */}
                    <div style={{position:"absolute",right:0,width:"5%",height:"100%",background:`${C.red}15`,borderLeft:`1px solid ${C.red}30`}}/>
                    {/* Sweet spot */}
                    <div style={{position:"absolute",left:`${kickSweetMin}%`,width:`${kickSweetMax-kickSweetMin}%`,height:"100%",background:`${C.green}08`,borderLeft:`1px solid ${C.green}30`,borderRight:`1px solid ${C.green}30`}}/>
                    <div style={{position:"absolute",left:`${kickSweetMin+2}%`,top:2,fontSize:7,color:`${C.green}50`,fontWeight:800,zIndex:2}}>SWEET</div>
                    {/* Empty state hint */}
                    {!kickCharging && kickPower===0 && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,pointerEvents:"none"}}>
                      <span style={{fontSize:10,fontWeight:700,color:`${C.text3}80`,animation:"countPulse 1.5s infinite"}}>⬇️ Hold to aim GROUND ↔ HIGH</span>
                    </div>}
                    {/* Fill bar */}
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${kickPower}%`,
                      background:yOutZone ? `linear-gradient(90deg, ${C.cyan}, ${C.green}, ${C.gold}, ${C.red})` : `linear-gradient(90deg, ${C.cyan}, ${C.green})`,
                      borderRadius:12,transition:"width 0.05s linear",
                      boxShadow:kickCharging?`0 0 20px ${zoneColor}40`:`0 0 8px ${C.cyan}20`,zIndex:1,
                    }}/>
                    {kickPower>8 && <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:900,color:"#fff",textShadow:"0 0 6px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)",zIndex:3}}>
                      {Math.round(kickPower)}%
                    </div>}
                  </div>
                  {/* Labels */}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2,padding:"0 2px"}}>
                    <span style={{fontSize:6,color:C.text3}}>GROUND ↓</span>
                    <span style={{fontSize:6,color:C.text3}}>LOW</span>
                    <span style={{fontSize:6,color:C.green,fontWeight:700}}>MID-HIGH 🎯</span>
                    <span style={{fontSize:6,color:C.text3}}>HIGH</span>
                    <span style={{fontSize:7,color:C.red,fontWeight:700}}>↑ OVER BAR</span>
                  </div>
                  {/* Hold-to-puff button */}
                  <div
                    onMouseDown={()=>{kickStartCharge();playFx("charge");}}
                    onMouseUp={kickStopCharge}
                    onMouseLeave={kickStopCharge}
                    onTouchStart={(e)=>{e.preventDefault();kickStartCharge();playFx("charge");}}
                    onTouchEnd={kickStopCharge}
                    style={{
                      marginTop:6,padding:kickCharging?"16px 20px":"14px 20px",borderRadius:16,cursor:"pointer",textAlign:"center",
                      background:kickCharging
                        ? `linear-gradient(135deg, ${zoneColor}30, ${zoneColor}10)`
                        : `linear-gradient(135deg, ${inpInfo.color}25, ${inpInfo.color}08)`,
                      border:`2px solid ${kickCharging?zoneColor+"60":inpInfo.color+"40"}`,
                      fontSize:15,fontWeight:900,
                      color:kickCharging?zoneColor:inpInfo.color,
                      animation:kickCharging?"none":"countPulse 1.2s infinite",
                      boxShadow:kickCharging?`0 0 30px ${zoneColor}30, inset 0 0 20px ${zoneColor}08`:`0 0 20px ${inpInfo.color}15`,
                      transform:kickCharging?"scale(1.05)":"scale(1)",
                      transition:"all 0.15s",userSelect:"none",WebkitUserSelect:"none",position:"relative",overflow:"hidden",
                    }}
                  >
                    {kickCharging && <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${kickPower}%`,background:`${zoneColor}12`,transition:"width 0.06s linear",borderRadius:16}}/>}
                    <div style={{position:"relative",zIndex:1}}>
                      {kickCharging
                        ? `💨 AIMING... ${elapsed.toFixed(1)}s — Release to lock Y!`
                        : "💨 HOLD TO AIM HEIGHT"}
                      <div style={{fontSize:8,color:`${kickCharging?zoneColor:inpInfo.color}80`,marginTop:3}}>
                        {kickCharging ? `${Math.round(kickPower)}% — ${kickPower>95?"OVER THE BAR!":kickPower>=kickSweetMin&&kickPower<=kickSweetMax?"SWEET SPOT!":"Aiming..."}` : "Puff 2 of 2: Aim low ↔ high"}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* ═══ POWER BAR — reuse FK1 for "power" state (shouldn't normally appear in FK2 but safety) ═══ */}
              {kickState==="power" && inp!=="tap" && (()=>{
                const zone = getPuffZone(kickPower);
                const elapsed = kickCharging ? (Date.now()-puffStartTime.current)/1000 : 0;
                const zoneColor = zone==="perfect"?C.green:zone==="good"?C.cyan:zone==="short"?C.gold:zone==="tap"?C.text3:C.red;
                return (
                <div style={{width:goalW,animation:"fadeIn 0.3s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,padding:"0 2px"}}>
                    <span style={{fontSize:9,fontWeight:800,color:zoneColor}}>{kickCharging?"PUFF POWER":"PUFF DURATION"}</span>
                  </div>
                  <div style={{height:28,borderRadius:14,background:`rgba(255,255,255,0.04)`,overflow:"hidden",border:`2px solid ${kickCharging?zoneColor+"60":"rgba(255,255,255,0.1)"}`,position:"relative"}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${kickPower}%`,background:`linear-gradient(90deg, ${C.cyan}, ${C.green})`,borderRadius:12,transition:"width 0.05s linear",zIndex:1}}/>
                  </div>
                </div>
                );
              })()}

              {/* ═══ BONUS OFFER ═══ */}
              {kickState==="bonus_offer" && (
                <div style={{textAlign:"center",animation:"fadeIn 0.4s ease",padding:"8px 0"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:18,animation:"gentleFloat 1s infinite"}}>⚡🎰⚡</span>
                    <span style={{fontSize:14,fontWeight:900,color:C.gold,textShadow:`0 0 15px ${C.gold}40`}}>BONUS SHOT!</span>
                  </div>
                  <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Double puff bonus — tighter sweet spots!</div>
                  <div style={{fontSize:9,color:C.text3,marginBottom:12,fontStyle:"italic"}}>"Both axes need precision 🎯🎯"</div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <div onClick={kickAcceptBonus} style={{padding:"12px 24px",borderRadius:12,cursor:"pointer",background:`linear-gradient(135deg, ${C.gold}25, ${C.gold}08)`,border:`1px solid ${C.gold}40`,fontSize:14,fontWeight:900,color:C.gold,boxShadow:`0 0 20px ${C.gold}15`,animation:"countPulse 1s infinite"}}>🔥 BRING IT</div>
                    <div onClick={kickSkipBonus} style={{padding:"12px 24px",borderRadius:12,cursor:"pointer",background:`${C.text3}08`,border:`1px solid ${C.text3}20`,fontSize:14,fontWeight:700,color:C.text3}}>Skip →</div>
                  </div>
                </div>
              )}

              {/* ═══ SAVE READY ═══ */}
              {kickState==="save_ready" && (
                <div style={{textAlign:"center",animation:"fadeIn 0.4s ease"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:18}}>🧤</span>
                    <span style={{fontSize:14,fontWeight:900,color:C.orange,textShadow:`0 0 15px ${C.orange}40`}}>YOUR TURN TO SAVE</span>
                  </div>
                  <div style={{fontSize:9,color:C.text3,marginBottom:10,fontStyle:"italic"}}>"AI is stepping up... look confident 😤"</div>
                  <div onClick={()=>{kickSaveStart();playFx("whistle");playFx("success");}} style={{
                    padding:"14px 36px",borderRadius:14,cursor:"pointer",
                    background:`linear-gradient(135deg, ${C.orange}20, ${C.orange}08)`,
                    border:`1px solid ${C.orange}35`,
                    fontSize:15,fontWeight:900,color:C.orange,
                    boxShadow:`0 0 20px ${C.orange}15`,
                    animation:"countPulse 1.2s infinite",
                  }}>BRING IT ON 🔥</div>
                </div>
              )}

              {/* ═══ SAVE COUNTDOWN ═══ */}
              {kickState==="save_countdown" && (
                <div style={{textAlign:"center",marginTop:4}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{fontSize:14,animation:"breathe 0.5s infinite"}}>💨</span>
                    <span style={{fontSize:12,fontWeight:900,color:C.gold,textShadow:`0 0 15px ${C.gold}40`}}>AI winding up...</span>
                  </div>
                  <div style={{fontSize:8,color:C.text3,marginTop:2}}>Watch for the hint!</div>
                </div>
              )}

              {/* ═══ SAVE DIVE ═══ */}
              {kickState==="save_dive" && (
                <div style={{textAlign:"center"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:900,color:C.orange,animation:"countPulse 0.4s infinite",textShadow:`0 0 15px ${C.orange}60`}}>🧤 DIVE NOW!</span>
                    <span style={{fontSize:14,fontWeight:900,color:actionTimer<=1?C.red:C.gold,animation:actionTimer<=1?"pulse 0.5s infinite":"none"}}>{actionTimer}s</span>
                  </div>
                  <div style={{fontSize:8,color:C.text3,marginTop:1}}>👆 TAP a zone!</div>
                </div>
              )}

              {/* ═══ FINAL RESULT ═══ */}
              {kickState==="final" && (()=>{
                const won = kickScore.you>kickScore.ai;
                const draw = kickScore.you===kickScore.ai;
                const resultColor = won?C.green:draw?C.gold:C.red;
                const WIN_MSGS=["YOU'RE GOATED 🐐","DOUBLE PUFF CHAMPION 👑","AI NEEDS THERAPY 😂","PRECISION KING 💎",""+kickOpponent.current.name+" is crying rn 😭","Sniper puff vibes 💨👑"];
                const LOSE_MSGS=["GG next time 😤","Blame the double puff 🎮",""+kickOpponent.current.name+" got lucky fr 💀","Both puffs betrayed you 😂","Run it back! 🔄","That wasn't even fair bro 🤣"];
                return (
                  <div style={{textAlign:"center",animation:"fadeIn 0.5s ease"}}>
                    {won && <div style={{fontSize:30,marginBottom:6,animation:"gentleFloat 1s infinite"}}>🎉🏆🎉</div>}
                    {!won && !draw && <div style={{fontSize:30,marginBottom:6}}>😤💀😂</div>}
                    {draw && <div style={{fontSize:30,marginBottom:6}}>🤝⚽🤝</div>}
                    <div style={{fontSize:28,fontWeight:900,color:resultColor,marginBottom:4,textShadow:`0 0 30px ${resultColor}60`,animation:"countPulse 0.8s ease"}}>
                      {won?"YOU WIN!":draw?"DRAW!":"DEFEATED"}
                    </div>
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
                      "{won?pick(WIN_MSGS):draw?"Fair game! Both puffs equal apparently 😂":pick(LOSE_MSGS)}"
                    </div>
                    <div style={{fontSize:10,color:C.gold,marginBottom:14,padding:"4px 14px",borderRadius:20,...LG.tinted(C.gold)}}>
                      💰 ×{pool.rewardMult} {pool.label} · {getDeviceShort()}
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                      {!gameActive?.wcMode && <div onClick={()=>{startKick(gameActive?.id);playFx("whistle");}} style={{
                        padding:"12px 28px",borderRadius:12,cursor:"pointer",
                        background:`linear-gradient(135deg, ${C.cyan}18, ${C.cyan}06)`,
                        border:`1px solid ${C.cyan}30`,fontSize:14,fontWeight:800,color:C.cyan,
                        boxShadow:`0 0 15px ${C.cyan}10`,
                      }}>🔄 Rematch</div>}
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

            {/* ═══ BOTTOM PANEL: Side Pick + Reactions + Chat/Stats ═══ */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:20,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,padding:"3px 6px",...GLASS_CLEAR,borderRadius:"10px 10px 0 0"}}>
                {[{e:"😂"},{e:"👏"},{e:"😱"},{e:"🔥"},{e:"💀"},{e:"😘"},{e:"👋"},{e:"💨"}].map((r,i)=>(
                  <div key={i} onClick={()=>{
                    playFx("tap");
                    const msg = {u:"You",m:r.e,c:audienceSide==="you"?C.cyan:C.red,t:Date.now()};
                    setSideChat(p=>({...p,[audienceSide]:[...p[audienceSide],msg]}));
                    setFloatingReactions(p=>[...p,{id:Date.now()+i,emoji:r.e,x:20+Math.random()*60,dur:1.5+Math.random()}]);
                    if(r.e==="😂") playFx("laugh");
                    if(r.e==="💨"&&Math.random()<0.15&&!puffWaveActive){triggerPuffWave();playFx("crowd");setCommentary("🌊 PUFF WAVE! "+sideFans.you+sideFans.ai+" fans puffed at once!");}
                  }} style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,background:`rgba(255,255,255,0.04)`,border:`1px solid rgba(255,255,255,0.06)`}}>
                    {r.e}
                  </div>
                ))}
                <div onClick={()=>{playFx("tap");setAudioOn(!audioOn);}} style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,marginLeft:1,background:audioOn?`${C.green}10`:`${C.red}10`,border:`1px solid ${audioOn?C.green+"20":C.red+"20"}`}}>
                  {audioOn?"🔊":"🔇"}
                </div>
              </div>
              <div style={{...GLASS_CARD,display:"flex",flexDirection:"column",maxHeight:"30%",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",padding:"3px 6px",gap:3,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{flex:1,padding:"5px 6px",borderRadius:8,textAlign:"center",
                    background:audienceSide==="you"?`${C.cyan}15`:"transparent",border:`1px solid ${audienceSide==="you"?C.cyan+"30":"transparent"}`,
                  }}>
                    <div style={{fontSize:9,fontWeight:800,color:audienceSide==="you"?C.cyan:C.text3}}>{gameActive?.wcMode&&wcTeam?wcTeam.flag:""} 😎 Steve</div>
                    <div style={{fontSize:7,color:C.text3}}>👥 {sideFans.you}</div>
                  </div>
                  <div style={{width:70,textAlign:"center"}}>
                    <div style={{height:4,borderRadius:2,background:`${C.text3}15`,overflow:"hidden",display:"flex",marginBottom:3}}>
                      <div style={{width:`${sideFans.you/(sideFans.you+sideFans.ai)*100}%`,background:C.cyan,transition:"width 0.5s"}}/>
                      <div style={{flex:1,background:C.red}}/>
                    </div>
                    <div
                      onMouseDown={startSwitchPuff} onMouseUp={stopSwitchPuff} onMouseLeave={stopSwitchPuff}
                      onTouchStart={(e)=>{e.preventDefault();startSwitchPuff();}} onTouchEnd={stopSwitchPuff}
                      style={{padding:"4px 6px",borderRadius:8,cursor:"pointer",
                        background:switchPuffing?`${C.red}15`:`${C.gold}08`,
                        border:`1px solid ${switchPuffing?C.red+"40":C.gold+"25"}`,
                        userSelect:"none",WebkitUserSelect:"none",position:"relative",overflow:"hidden",transition:"all 0.2s",
                      }}
                    >
                      {switchPuffing && <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${switchPuffProgress}%`,background:switchPuffProgress>=80?`${C.red}20`:`${C.gold}15`,transition:"width 0.05s linear",borderRadius:8}}/>}
                      <div style={{position:"relative",zIndex:1}}>
                        <div style={{fontSize:7,fontWeight:800,color:switchPuffing?C.red:C.gold}}>
                          {switchPuffing ? `💨 ${(switchPuffProgress*2.5/100).toFixed(1)}s` : "🔄 Hold"} {audienceTraitor?"🐍":""}
                        </div>
                        {switchPuffing && <div style={{fontSize:6,color:C.text3,marginTop:1}}>{switchPuffProgress<80?"Keep puffing...":"Almost! 🔥"}</div>}
                        {!switchPuffing && <div style={{fontSize:5,color:C.text3,marginTop:1}}>Puff to Switch</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{flex:1,padding:"5px 6px",borderRadius:8,textAlign:"center",
                    background:audienceSide==="ai"?`${C.red}15`:"transparent",border:`1px solid ${audienceSide==="ai"?C.red+"30":"transparent"}`,
                  }}>
                    <div style={{fontSize:9,fontWeight:800,color:audienceSide==="ai"?C.red:C.text3}}>{kickOpponent.current.emoji} {kickOpponent.current.name.split(" ")[0]}</div>
                    <div style={{fontSize:7,color:C.text3}}>👥 {sideFans.ai}</div>
                  </div>
                </div>
                <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
                  {[{id:"chat",label:"💬 Chat"},{id:"stats",label:"📊 Stats"}].map(t=>(
                    <div key={t.id} onClick={()=>{playFx("nav");setGameBottomTab(t.id);}} style={{
                      flex:1,padding:"3px 0",textAlign:"center",cursor:"pointer",
                      borderBottom:gameBottomTab===t.id?`2px solid ${t.id==="chat"?C.green:C.gold}`:`2px solid transparent`,
                    }}>
                      <span style={{fontSize:8,fontWeight:gameBottomTab===t.id?800:600,color:gameBottomTab===t.id?(t.id==="chat"?C.green:C.gold):C.text3}}>{t.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"4px 10px 6px"}}>
                  {gameBottomTab==="chat" ? (
                    <div>
                      {(()=>{
                        const isBreak = ["shoot_result","save_result","round_result","final","bonus_offer"].includes(kickState);
                        const isMerged = isBreak || postGameChat;
                        const allMsgs = isMerged
                          ? [...(sideChat.you||[]),...(sideChat.ai||[]),...mergedChat].sort((a,b)=>a.t-b.t).slice(-10)
                          : (sideChat[audienceSide]||[]).slice(-8);
                        const chatLabel = isMerged
                          ? "🏟️ STADIUM CHAT — Both sides"
                          : (audienceSide==="you"?"😎 Steve's Side":""+kickOpponent.current.emoji+" "+kickOpponent.current.name+"'s Side");
                        const chatColor = isMerged ? C.gold : (audienceSide==="you"?C.cyan:C.red);
                        return <>
                          <div style={{fontSize:6,fontWeight:700,color:chatColor,marginBottom:2,display:"flex",alignItems:"center",gap:3}}>
                            <span>{chatLabel}</span>
                            {audienceTraitor && !isMerged && <span style={{fontSize:6,color:C.gold}}>🐍</span>}
                            {isMerged && <span style={{fontSize:5,color:C.text3,background:`${C.gold}12`,padding:"1px 4px",borderRadius:3}}>OPEN</span>}
                            <span style={{fontSize:5,color:C.text3,marginLeft:"auto"}}>👥 {sideFans.you+sideFans.ai}</span>
                          </div>
                          {allMsgs.map((m,i)=>(
                            <div key={i} style={{fontSize:7,marginBottom:1,lineHeight:1.3,animation:"fadeIn 0.2s ease"}}>
                              {m.isPlayer && <span style={{fontSize:6,color:C.gold,marginRight:2}}>⭐</span>}
                              <span style={{fontWeight:700,color:m.c||C.text2}}>{m.u==="⚠ SYSTEM"?"⚠":m.u.slice(0,6)}</span>
                              <span style={{color:C.text3}}> {m.m}</span>
                            </div>
                          ))}
                        </>;
                      })()}
                      {(()=>{
                        const isBreak = ["shoot_result","save_result","round_result","final","bonus_offer"].includes(kickState) || postGameChat;
                        const sendMsg = (txt) => {
                          if(!txt.trim()) return;
                          const msg = {u:"You",m:txt.trim(),c:audienceSide==="you"?C.cyan:C.red,t:Date.now(),isPlayer:false};
                          if(isBreak) { setMergedChat(p=>[...p,msg]); }
                          else { setSideChat(p=>({...p,[audienceSide]:[...p[audienceSide],msg]})); }
                          setChatInput("");
                        };
                        return <div style={{display:"flex",gap:3,marginTop:2}}>
                          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg(chatInput);}}
                            placeholder={isBreak?"Chat with everyone...":"Cheer..."} style={{flex:1,background:`${C.text3}06`,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 6px",fontSize:7,color:C.text,outline:"none"}}/>
                          <div onClick={()=>sendMsg(chatInput)} style={{padding:"3px 7px",borderRadius:6,cursor:"pointer",fontSize:7,fontWeight:700,color:isBreak?C.gold:audienceSide==="you"?C.cyan:C.red,...LG.tinted(isBreak?C.gold:audienceSide==="you"?C.cyan:C.red)}}>Send</div>
                        </div>;
                      })()}
                    </div>
                  ) : (
                    <div>
                      <div style={{display:"flex",gap:2,marginBottom:4}}>
                        {[
                          {v:kickStats.goals,l:"Goal",c:C.cyan,e:"⚽"},
                          {v:kickStats.saves,l:"Save",c:C.orange,e:"🧤"},
                          {v:kickStats.perfects,l:"Perf",c:C.green,e:"💨"},
                          {v:kickStats.blinkers,l:"Blink",c:C.red,e:"💀"},
                          {v:kickStats.misses,l:"Miss",c:C.gold,e:"🚀"},
                        ].map((s,i)=>(
                          <div key={i} style={{flex:1,textAlign:"center",padding:"3px 0",borderRadius:6,background:`${s.c}08`,border:`1px solid ${s.c}15`}}>
                            <div style={{fontSize:12,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
                            <div style={{fontSize:5,color:C.text3,marginTop:1}}>{s.e} {s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px"}}>
                        {[
                          {l:"Avg Puff",v:(2.5+Math.random()).toFixed(1)+"s"},
                          {l:"X Accuracy",v:Math.floor(60+Math.random()*30)+"%"},
                          {l:"Y Accuracy",v:Math.floor(50+Math.random()*40)+"%"},
                          {l:"Double Sweet",v:kickStats.perfects+""},
                          {l:"Crowd",v:sideFans.you>sideFans.ai?"HYPE":"Nervous"},
                          {l:"Traitor",v:""+audienceSwitchCount+(audienceSwitchCount>0?" 🐍":"0")},
                        ].map((f,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:`1px solid ${C.border}`}}>
                            <span style={{fontSize:7,color:C.text3}}>{f.l}</span>
                            <span style={{fontSize:7,fontWeight:700,color:C.text2}}>{f.v}</span>
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
    // Game detail sheet — IMMERSIVE with Quick Play + Tournament
    if(selectedGame) {
      const gc = selectedGame.color;
      const pool = getDevicePool();
      const canEnterWC = wcCanEnter();
      const cooldownMs = wcCooldownRemaining();
      const isFinalkick = selectedGame.id === "finalkick" || selectedGame.id === "finalkick2";
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,overflow:"hidden"}}>
          {/* Background — matching other pages */}
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>

          {overlayBack(()=>setSelectedGame(null))}

          <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",padding:"50px 16px 20px",overflowY:"auto"}}>
            {/* Game header */}
            <div style={{width:60,height:60,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`${gc}10`,border:`2px solid ${gc}25`,marginBottom:8}}>
              <span style={{fontSize:30}}>{selectedGame.emoji}</span>
            </div>
            <div style={{fontSize:20,fontWeight:900,color:C.text,textShadow:`0 0 20px ${gc}30`,marginBottom:3}}>{selectedGame.name}</div>
            <div style={{fontSize:10,color:C.text2,marginBottom:6,maxWidth:280,textAlign:"center"}}>{selectedGame.desc}</div>
            <div style={{display:"flex",gap:5,marginBottom:4,flexWrap:"wrap",justifyContent:"center"}}>
              <span style={{fontSize:8,fontWeight:700,color:gc,padding:"2px 8px",borderRadius:20,...LG.tinted(gc)}}>{selectedGame.type}</span>
              <span style={{fontSize:8,fontWeight:700,color:C.text2,padding:"2px 8px",borderRadius:20,...LG.tinted(C.text3)}}>👥 {selectedGame.players}</span>
              <span style={{fontSize:8,fontWeight:700,color:C.text2,padding:"2px 8px",borderRadius:20,...LG.tinted(C.text3)}}>⏱ {selectedGame.time}</span>
              {selectedGame.hot && <span style={{fontSize:8,fontWeight:800,color:C.red,padding:"2px 8px",borderRadius:20,background:`${C.red}15`,border:`1px solid ${C.red}25`,animation:"pulse 2s infinite"}}>🔥 HOT</span>}
            </div>
            <div style={{display:"flex",gap:4,marginBottom:8}}>
              <span style={{fontSize:7,fontWeight:700,color:pool.color,padding:"2px 7px",borderRadius:20,...LG.tinted(pool.color)}}>⚖️ {pool.label}</span>
              {(selectedGame.inputs||["puff"]).map(inp=>{const t=INPUT_TYPES.find(x=>x.id===inp)||INPUT_TYPES[0];return <span key={inp} style={{fontSize:7,fontWeight:700,color:t.color,padding:"2px 7px",borderRadius:20,...LG.tinted(t.color)}}>{t.icon} {t.label}</span>;})}
            </div>
            {/* How to Play button */}
            <div onClick={()=>{playFx("tap");setShowHowToPlay(true);}} style={{
              padding:"6px 16px",borderRadius:20,cursor:"pointer",marginBottom:12,
              background:`rgba(255,255,255,0.04)`,border:`1px solid ${C.border}`,
              display:"flex",alignItems:"center",gap:5,
            }}>
              <span style={{fontSize:12}}>📖</span>
              <span style={{fontSize:9,fontWeight:700,color:C.text2}}>How to Play</span>
            </div>

            {/* ═══ TEAM PICKER (for Quick Play) ═══ */}
            <div onClick={()=>{playFx("tap");setWcPhase("team_select_quick");}} style={{
              display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:10,cursor:"pointer",marginBottom:8,
              background:wcTeam?`${C.cyan}08`:`rgba(255,255,255,0.03)`,border:`1px solid ${wcTeam?C.cyan+"25":C.border}`,
              width:"100%",maxWidth:340,
            }}>
              <span style={{fontSize:18}}>{wcTeam?wcTeam.flag:"🏳️"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:9,fontWeight:700,color:wcTeam?C.cyan:C.text3}}>{wcTeam?wcTeam.name:"Choose Your Team"}</div>
                <div style={{fontSize:7,color:C.text3}}>Tap to {wcTeam?"change":"select"} nation</div>
              </div>
              <span style={{fontSize:10,color:C.text3}}>›</span>
            </div>

            {/* ═══ SECTION A: QUICK PLAY ═══ */}
            <div style={{width:"100%",maxWidth:340,marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:800,color:C.text2,letterSpacing:1.5,marginBottom:6}}>⚡ QUICK PLAY</div>
              <div style={{display:"flex",gap:6}}>
                {[
                  {icon:"🎲",label:"Random",m:"random",sub:"~5s wait",reward:"+80"},
                  {icon:"🤖",label:"VS AI",m:"ai",sub:"Instant",reward:"+50"},
                  {icon:"👥",label:"Friend",m:"invite",sub:"Via link",reward:"+80"},
                ].map(b=>(
                  <div key={b.m} onClick={()=>{playFx("select");startMatch(selectedGame,b.m);}} style={{
                    flex:1,padding:"10px 6px",borderRadius:12,cursor:"pointer",textAlign:"center",
                    ...GLASS_CARD,transition:"all 0.2s",
                  }}>
                    <div style={{fontSize:22,marginBottom:4}}>{b.icon}</div>
                    <div style={{fontSize:10,fontWeight:800,color:C.text}}>{b.label}</div>
                    <div style={{fontSize:7,color:C.text3,marginTop:2}}>{b.sub}</div>
                    <div style={{fontSize:7,color:C.green,fontWeight:700,marginTop:2}}>{b.reward}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ SECTION B: TOURNAMENT ═══ */}
            {isFinalkick && (
              <div style={{width:"100%",maxWidth:340}}>
                <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:1.5,marginBottom:6}}>🏆 TOURNAMENT</div>
                <div style={{
                  padding:"14px 14px 12px",borderRadius:16,cursor:canEnterWC?"pointer":"default",
                  background:"rgba(8,8,25,0.82)",
                  border:`1px solid ${C.gold}25`,
                  boxShadow:`0 0 30px ${C.gold}08, inset 0 1px 0 ${C.gold}10`,
                  position:"relative",overflow:"hidden",
                }} onClick={()=>{if(canEnterWC){playFx("select");setWcGameId(selectedGame?.id||"finalkick");setWcPhase("team_select");setSelectedGame(null);}}}>
                  {/* Gold shimmer */}
                  <div style={{position:"absolute",top:0,left:"-50%",width:"200%",height:"100%",background:`linear-gradient(90deg, transparent, ${C.gold}06, transparent)`,animation:"lightSweep 4s infinite",pointerEvents:"none"}}/>

                  <div style={{position:"relative",zIndex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:24}}>⚽</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:900,color:C.gold,textShadow:`0 0 10px ${C.gold}30`}}>World Cup 2026</div>
                        <div style={{fontSize:8,color:C.text2}}>48 Teams · Group Stage + Knockout</div>
                      </div>
                    </div>

                    {/* Prizes */}
                    <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                      {[
                        {e:"🥇",label:"Gold",pts:"50,000",color:C.gold},
                        {e:"🥈",label:"Silver",pts:"25,000",color:"#C0C0C0"},
                        {e:"🥉",label:"Bronze",pts:"10,000",color:"#CD7F32"},
                        {e:"4th",label:"",pts:"5,000",color:C.text3},
                      ].map((p,i)=>(
                        <div key={i} style={{padding:"3px 7px",borderRadius:8,background:`${p.color}10`,border:`1px solid ${p.color}18`,display:"flex",alignItems:"center",gap:3}}>
                          <span style={{fontSize:10}}>{p.e}</span>
                          <span style={{fontSize:7,fontWeight:700,color:p.color}}>{p.pts}</span>
                        </div>
                      ))}
                    </div>

                    {/* Enter button or cooldown */}
                    {canEnterWC ? (
                      <div style={{
                        padding:"10px 0",borderRadius:10,textAlign:"center",
                        background:`linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`,
                        border:`1px solid ${C.gold}35`,
                        boxShadow:`0 0 20px ${C.gold}10`,
                      }}>
                        <div style={{fontSize:12,fontWeight:900,color:C.gold,letterSpacing:1}}>ENTER TOURNAMENT</div>
                        <div style={{fontSize:7,color:C.text3,marginTop:2}}>Choose your nation and compete for glory</div>
                        <div style={{fontSize:6,color:C.gold+"60",marginTop:2,fontStyle:"italic"}}>DEMO: Unlimited entries. Production: 1 entry per 6 hours</div>
                      </div>
                    ) : (
                      <div style={{padding:"10px 0",borderRadius:10,textAlign:"center",background:`${C.text3}08`,border:`1px solid ${C.text3}15`}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.text3}}>Next entry in {formatCooldown(cooldownMs)}</div>
                        <div style={{fontSize:7,color:C.text3,marginTop:2}}>Cooldown active — play Quick Play in the meantime</div>
                      </div>
                    )}
                  </div>

                  {/* Active WC tournament indicator */}
                  {wcPhase && wcPhase !== "result" && (
                    <div style={{marginTop:8,padding:"6px 10px",borderRadius:8,background:`${C.green}10`,border:`1px solid ${C.green}20`,display:"flex",alignItems:"center",gap:6}} onClick={(e)=>{e.stopPropagation();setSelectedGame(null);}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 1.5s infinite"}}/>
                      <div style={{fontSize:9,fontWeight:700,color:C.green}}>Tournament in progress — tap to continue</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ HOW TO PLAY — MASSIVE VISUAL REDESIGN ═══ */}
          {showHowToPlay && (
            <div style={{position:"absolute",inset:0,zIndex:120,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",animation:"fadeIn 0.2s ease",overflowY:"auto"}}
              onClick={()=>setShowHowToPlay(false)}>
              <div onClick={(e)=>e.stopPropagation()} style={{minHeight:"100%",padding:"16px 14px 30px"}}>

                {/* Close button */}
                <div onClick={()=>setShowHowToPlay(false)} style={{position:"sticky",top:8,float:"right",zIndex:5,width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:`rgba(6,16,30,0.9)`,border:`1px solid ${C.border}`,fontSize:14,color:C.text3,backdropFilter:"blur(8px)"}}>✕</div>

                {/* Hero */}
                <div style={{textAlign:"center",marginBottom:16,paddingTop:8}}>
                  <div style={{fontSize:40,marginBottom:4}}>{selectedGame.id==="finalkick2"?"⚽🔥":"⚽"}</div>
                  <div style={{fontSize:18,fontWeight:900,color:C.text}}>{selectedGame.id==="finalkick2"?"Final Kick 2":"Final Kick"}</div>
                  <div style={{fontSize:10,color:C.text2}}>{selectedGame.id==="finalkick2"?"Double Puff Precision — 2 Puffs, 1 Shot!":"1v1 Penalty Shootout Powered by Puff"}</div>
                </div>

                {selectedGame.id==="finalkick" ? (<>

                {/* ═══ SECTION 1: GAME FLOW DIAGRAM ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:8,textAlign:"center"}}>⚡ GAME FLOW</div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    {[
                      {step:"1",icon:"👆",label:"Pick Zone",sub:"Choose where to kick",color:C.cyan,arrow:true},
                      {step:"2",icon:"💨",label:"PUFF!",sub:"Hold & release in sweet spot",color:C.lime,arrow:true},
                      {step:"3",icon:"⚽",label:"Goal or Miss?",sub:"Only perfect puffs score!",color:C.gold,arrow:true},
                      {step:"4",icon:"🧤",label:"Save Phase",sub:"Block the AI's shot",color:C.orange,arrow:true},
                      {step:"5",icon:"🔄",label:"Repeat x5",sub:"5 rounds total",color:C.purple,arrow:false},
                    ].map((s,i)=>(
                      <React.Fragment key={i}>
                        <div style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 10px",borderRadius:10,background:`${s.color}08`,border:`1px solid ${s.color}15`}}>
                          <div style={{width:28,height:28,borderRadius:8,background:`${s.color}20`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{s.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,fontWeight:800,color:s.color}}>{s.label}</div>
                            <div style={{fontSize:7,color:C.text3}}>{s.sub}</div>
                          </div>
                          <div style={{width:18,height:18,borderRadius:"50%",background:`${s.color}15`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:s.color}}>{s.step}</div>
                        </div>
                        {s.arrow && <div style={{fontSize:10,color:C.text3+"60",lineHeight:1}}>↓</div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* ═══ SECTION 2: PUFF POWER METER (big visual) ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.lime,letterSpacing:2,marginBottom:8,textAlign:"center"}}>💨 THE PUFF METER</div>
                  <div style={{fontSize:8,color:C.text2,textAlign:"center",marginBottom:8}}>Hold to charge. Release in the GREEN zone to score!</div>

                  {/* Big visual power bar */}
                  <div style={{height:32,borderRadius:16,overflow:"hidden",display:"flex",marginBottom:6,border:`2px solid ${C.border}`}}>
                    <div style={{width:"10%",background:`${C.text3}25`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:6,fontWeight:800,color:C.text3}}>TAP</span>
                    </div>
                    <div style={{width:"18%",background:`linear-gradient(90deg, ${C.text3}15, ${C.cyan}10)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:6,fontWeight:700,color:C.text3}}>SHORT</span>
                    </div>
                    <div style={{width:"18%",background:`${C.cyan}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:6,fontWeight:700,color:C.cyan}}>GOOD</span>
                    </div>
                    <div style={{width:"22%",background:`linear-gradient(90deg, ${C.green}25, ${C.lime}30)`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.green}50`,borderRadius:4,position:"relative"}}>
                      <span style={{fontSize:7,fontWeight:900,color:C.green}}>PERFECT 💨</span>
                    </div>
                    <div style={{width:"16%",background:`${C.orange}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:6,fontWeight:700,color:C.orange}}>LONG</span>
                    </div>
                    <div style={{width:"16%",background:`${C.red}20`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:6,fontWeight:800,color:C.red}}>💀 BLINK</span>
                    </div>
                  </div>

                  {/* Time labels */}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"0 2px",marginBottom:6}}>
                    <span style={{fontSize:6,color:C.text3}}>0s</span>
                    <span style={{fontSize:6,color:C.text3}}>1s</span>
                    <span style={{fontSize:6,color:C.text3}}>2s</span>
                    <span style={{fontSize:6,color:C.green,fontWeight:800}}>2.5-3.5s ✓</span>
                    <span style={{fontSize:6,color:C.text3}}>4s</span>
                    <span style={{fontSize:6,color:C.red}}>5s+</span>
                  </div>

                  {/* Outcome cards */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    <div style={{padding:"8px",borderRadius:10,background:`${C.green}08`,border:`1px solid ${C.green}15`,textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:2}}>⚽</div>
                      <div style={{fontSize:8,fontWeight:800,color:C.green}}>PERFECT = GOAL</div>
                      <div style={{fontSize:7,color:C.text3}}>Only way to score!</div>
                    </div>
                    <div style={{padding:"8px",borderRadius:10,background:`${C.red}08`,border:`1px solid ${C.red}15`,textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:2}}>💀</div>
                      <div style={{fontSize:8,fontWeight:800,color:C.red}}>BLINKER = MISS</div>
                      <div style={{fontSize:7,color:C.text3}}>Ball goes to the moon 🌙</div>
                    </div>
                  </div>
                </div>

                {/* ═══ SECTION 3: GOAL ZONES VISUAL ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.cyan,letterSpacing:2,marginBottom:8,textAlign:"center"}}>🥅 GOAL ZONES</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,marginBottom:6}}>
                    {["↖ Top\nLeft","↑ Top\nCenter","↗ Top\nRight","↙ Bottom\nLeft","↓ Bottom\nCenter","↘ Bottom\nRight"].map((z,i)=>(
                      <div key={i} style={{padding:"10px 4px",borderRadius:8,background:`${C.cyan}08`,border:`1px solid ${C.cyan}15`,textAlign:"center",fontSize:7,fontWeight:600,color:C.text2,whiteSpace:"pre-line",lineHeight:1.3}}>
                        {z}
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1,padding:"6px",borderRadius:8,background:`${C.orange}06`,border:`1px solid ${C.orange}12`,textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:700,color:C.orange}}>⚽ KICK</div>
                      <div style={{fontSize:7,color:C.text3}}>Choose where to aim</div>
                    </div>
                    <div style={{flex:1,padding:"6px",borderRadius:8,background:`${C.green}06`,border:`1px solid ${C.green}12`,textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:700,color:C.green}}>🧤 SAVE</div>
                      <div style={{fontSize:7,color:C.text3}}>Dive to block shot</div>
                    </div>
                  </div>
                </div>

                {/* ═══ SECTION 4: SPECIAL FEATURES ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.purple,letterSpacing:2,marginBottom:8,textAlign:"center"}}>✨ SPECIAL FEATURES</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[
                      {icon:"⏱️",title:"3s Timer",desc:"Pick fast or auto-action!",color:C.gold},
                      {icon:"⚡",title:"Bonus Shot",desc:"2x reward, harder puff",color:C.gold},
                      {icon:"🌊",title:"Puff Wave",desc:"10+ fans puff at once!",color:C.cyan},
                      {icon:"🐍",title:"Traitor",desc:"Switch sides = badge!",color:C.red},
                    ].map((f,i)=>(
                      <div key={i} style={{padding:"8px",borderRadius:10,background:`${f.color}06`,border:`1px solid ${f.color}12`,textAlign:"center"}}>
                        <div style={{fontSize:16,marginBottom:2}}>{f.icon}</div>
                        <div style={{fontSize:8,fontWeight:800,color:f.color}}>{f.title}</div>
                        <div style={{fontSize:7,color:C.text3}}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ═══ SECTION 5: TOURNAMENT PATH ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:8,textAlign:"center"}}>🏆 TOURNAMENT PATH</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,flexWrap:"wrap"}}>
                    {[
                      {label:"Group",sub:"3 matches",color:C.cyan},
                      {label:"R32",sub:"Win to advance",color:C.blue},
                      {label:"R16",sub:"Knockout",color:C.green},
                      {label:"QF",sub:"Quarter",color:C.lime},
                      {label:"SF",sub:"Semi",color:C.gold},
                      {label:"FINAL",sub:"🏆",color:C.gold},
                    ].map((r,i)=>(
                      <React.Fragment key={i}>
                        <div style={{padding:"5px 6px",borderRadius:8,background:`${r.color}10`,border:`1px solid ${r.color}20`,textAlign:"center",minWidth:40}}>
                          <div style={{fontSize:8,fontWeight:800,color:r.color}}>{r.label}</div>
                          <div style={{fontSize:6,color:C.text3}}>{r.sub}</div>
                        </div>
                        {i<5 && <span style={{fontSize:8,color:C.text3+"60"}}>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  {/* Prizes */}
                  <div style={{display:"flex",gap:4,marginTop:8,justifyContent:"center"}}>
                    <div style={{padding:"4px 8px",borderRadius:6,background:`${C.gold}12`,border:`1px solid ${C.gold}20`,fontSize:7,fontWeight:700,color:C.gold}}>🥇 50K pts</div>
                    <div style={{padding:"4px 8px",borderRadius:6,background:`rgba(192,192,192,0.08)`,border:`1px solid rgba(192,192,192,0.2)`,fontSize:7,fontWeight:700,color:"#C0C0C0"}}>🥈 25K</div>
                    <div style={{padding:"4px 8px",borderRadius:6,background:`rgba(205,127,50,0.08)`,border:`1px solid rgba(205,127,50,0.2)`,fontSize:7,fontWeight:700,color:"#CD7F32"}}>🥉 10K</div>
                  </div>
                </div>

                {/* ═══ SECTION 6: PRO TIPS ═══ */}
                <div style={{padding:"12px",borderRadius:16,background:`${C.lime}06`,border:`1px solid ${C.lime}15`,marginBottom:8}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.lime,letterSpacing:2,marginBottom:6,textAlign:"center"}}>🧠 PRO TIPS</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {[
                      "Sweet spot shifts EVERY round — stay focused!",
                      "The bar fills FASTER at higher power — release early rather than late",
                      "Blinker (5s+) = funniest moment but you MISS 💀",
                      "Watch the AI's eyes during save — they sometimes hint the direction 👀",
                    ].map((tip,i)=>(
                      <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                        <span style={{fontSize:8,color:C.lime,fontWeight:900,flexShrink:0}}>💡</span>
                        <span style={{fontSize:8,color:C.text2,lineHeight:1.3}}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                </>) : selectedGame.id==="finalkick2" ? (<>

                {/* ═══ FK2 SECTION 1: DOUBLE PUFF FLOW ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:8,textAlign:"center"}}>⚡ DOUBLE PUFF FLOW</div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    {[
                      {step:"1",icon:"←→",label:"PUFF #1: Horizontal Aim",sub:"Hold to slide left/right. Release to lock X position",color:C.cyan,arrow:true},
                      {step:"2",icon:"↕",label:"PUFF #2: Vertical Aim",sub:"Hold to slide up/down. Release to lock Y position",color:C.orange,arrow:true},
                      {step:"3",icon:"🎯",label:"Both Sweet Spots Hit?",sub:"X center + Y mid-high = DOUBLE PRECISION!",color:C.green,arrow:true},
                      {step:"4",icon:"🧤",label:"Save Phase",sub:"Block the AI's shot (same as FK1)",color:C.purple,arrow:true},
                      {step:"5",icon:"🔄",label:"Repeat x5",sub:"5 rounds total, 2 puffs per shot!",color:C.gold,arrow:false},
                    ].map((s,i)=>(
                      <React.Fragment key={i}>
                        <div style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 10px",borderRadius:10,background:`${s.color}08`,border:`1px solid ${s.color}15`}}>
                          <div style={{width:28,height:28,borderRadius:8,background:`${s.color}20`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s.icon.length>2?10:14,fontWeight:900,color:s.color,flexShrink:0}}>{s.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,fontWeight:800,color:s.color}}>{s.label}</div>
                            <div style={{fontSize:7,color:C.text3}}>{s.sub}</div>
                          </div>
                          <div style={{width:18,height:18,borderRadius:"50%",background:`${s.color}15`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:s.color}}>{s.step}</div>
                        </div>
                        {s.arrow && <div style={{fontSize:10,color:C.text3+"60",lineHeight:1}}>↓</div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* ═══ FK2 SECTION 2: X-AXIS AIM VISUAL ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.cyan,letterSpacing:2,marginBottom:8,textAlign:"center"}}>←→ HORIZONTAL AIM (Puff #1)</div>
                  <div style={{fontSize:8,color:C.text2,textAlign:"center",marginBottom:8}}>Hold to slide the marker. Release when it's in the GREEN center zone!</div>
                  <div style={{height:28,borderRadius:14,overflow:"hidden",display:"flex",marginBottom:4,border:`2px solid ${C.border}`}}>
                    <div style={{width:"10%",background:`${C.red}20`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:6,fontWeight:800,color:C.red}}>WIDE</span></div>
                    <div style={{width:"23%",background:`${C.cyan}10`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:6,fontWeight:700,color:C.text3}}>LEFT</span></div>
                    <div style={{width:"34%",background:`${C.green}20`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.green}50`,borderRadius:4}}><span style={{fontSize:7,fontWeight:900,color:C.green}}>CENTER 🎯</span></div>
                    <div style={{width:"23%",background:`${C.cyan}10`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:6,fontWeight:700,color:C.text3}}>RIGHT</span></div>
                    <div style={{width:"10%",background:`${C.red}20`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:6,fontWeight:800,color:C.red}}>WIDE</span></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    <div style={{padding:"6px",borderRadius:8,background:`${C.green}06`,border:`1px solid ${C.green}12`,textAlign:"center"}}>
                      <div style={{fontSize:14,marginBottom:1}}>✅</div>
                      <div style={{fontSize:7,fontWeight:800,color:C.green}}>CENTER = On Target</div>
                    </div>
                    <div style={{padding:"6px",borderRadius:8,background:`${C.red}06`,border:`1px solid ${C.red}12`,textAlign:"center"}}>
                      <div style={{fontSize:14,marginBottom:1}}>❌</div>
                      <div style={{fontSize:7,fontWeight:800,color:C.red}}>WIDE = Ball goes out!</div>
                    </div>
                  </div>
                </div>

                {/* ═══ FK2 SECTION 3: Y-AXIS AIM VISUAL ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.orange,letterSpacing:2,marginBottom:8,textAlign:"center"}}>↕ VERTICAL AIM (Puff #2)</div>
                  <div style={{fontSize:8,color:C.text2,textAlign:"center",marginBottom:8}}>Vertical bar fills from bottom up. Release in the sweet spot height!</div>
                  <div style={{display:"flex",gap:10,justifyContent:"center",alignItems:"stretch"}}>
                    {/* Vertical bar mockup */}
                    <div style={{width:32,height:120,borderRadius:14,border:`2px solid ${C.border}`,overflow:"hidden",display:"flex",flexDirection:"column-reverse",position:"relative"}}>
                      <div style={{height:"25%",background:`${C.text3}15`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:5,fontWeight:700,color:C.text3,writingMode:"vertical-rl"}}>GND</span></div>
                      <div style={{height:"25%",background:`${C.cyan}10`}}/>
                      <div style={{height:"30%",background:`${C.green}20`,border:`2px solid ${C.green}50`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:5,fontWeight:900,color:C.green,writingMode:"vertical-rl"}}>🎯</span></div>
                      <div style={{height:"15%",background:`${C.orange}15`}}/>
                      <div style={{height:"5%",background:`${C.red}25`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:4,fontWeight:800,color:C.red}}>↑</span></div>
                    </div>
                    {/* Labels */}
                    <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"4px 0"}}>
                      <div style={{padding:"4px 8px",borderRadius:6,background:`${C.red}08`,border:`1px solid ${C.red}15`}}>
                        <div style={{fontSize:7,fontWeight:800,color:C.red}}>OVER BAR ↑</div>
                        <div style={{fontSize:6,color:C.text3}}>Ball flies over = miss!</div>
                      </div>
                      <div style={{padding:"4px 8px",borderRadius:6,background:`${C.green}08`,border:`1px solid ${C.green}15`}}>
                        <div style={{fontSize:7,fontWeight:800,color:C.green}}>SWEET SPOT 🎯</div>
                        <div style={{fontSize:6,color:C.text3}}>Perfect height to score!</div>
                      </div>
                      <div style={{padding:"4px 8px",borderRadius:6,background:`${C.text3}08`,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:7,fontWeight:700,color:C.text3}}>GROUND / LOW</div>
                        <div style={{fontSize:6,color:C.text3}}>Keeper can reach easier</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ FK2 SECTION 4: CROSSHAIR ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.lime,letterSpacing:2,marginBottom:8,textAlign:"center"}}>🎯 THE CROSSHAIR</div>
                  <div style={{fontSize:8,color:C.text2,textAlign:"center",marginBottom:8}}>X + Y combine to create your shot placement on the goal!</div>
                  <div style={{position:"relative",width:"100%",aspectRatio:"3/2",border:`2px solid ${C.border}`,borderRadius:8,background:`rgba(255,255,255,0.02)`,marginBottom:6,overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:"33%",width:1,height:"100%",background:`${C.text3}20`}}/>
                    <div style={{position:"absolute",top:0,left:"66%",width:1,height:"100%",background:`${C.text3}20`}}/>
                    <div style={{position:"absolute",top:"50%",left:0,width:"100%",height:1,background:`${C.text3}20`}}/>
                    {/* X line */}
                    <div style={{position:"absolute",top:0,bottom:0,left:"55%",width:2,background:C.cyan,boxShadow:`0 0 6px ${C.cyan}`}}/>
                    {/* Y line */}
                    <div style={{position:"absolute",left:0,right:0,bottom:"60%",height:2,background:C.orange,boxShadow:`0 0 6px ${C.orange}`}}/>
                    {/* Crosshair dot */}
                    <div style={{position:"absolute",left:"55%",bottom:"60%",width:12,height:12,borderRadius:"50%",background:C.green,border:"2px solid #fff",transform:"translate(-50%,50%)",boxShadow:`0 0 12px ${C.green}`}}/>
                    <div style={{position:"absolute",bottom:4,right:6,fontSize:7,fontWeight:800,color:C.green}}>GOAL! ⚽🎯</div>
                  </div>
                  <div style={{textAlign:"center",fontSize:8,color:C.text2}}>
                    <span style={{color:C.cyan,fontWeight:800}}>X: Center ✓</span>
                    <span style={{color:C.text3,margin:"0 6px"}}>+</span>
                    <span style={{color:C.orange,fontWeight:800}}>Y: Mid-High ✓</span>
                    <span style={{color:C.text3,margin:"0 6px"}}>=</span>
                    <span style={{color:C.green,fontWeight:900}}>DOUBLE PRECISION! 🎯🎯</span>
                  </div>
                </div>

                {/* ═══ FK2 SECTION 5: SPECIAL FEATURES (shared) ═══ */}
                <div style={{padding:"12px",borderRadius:16,...GLASS_CARD,marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.purple,letterSpacing:2,marginBottom:8,textAlign:"center"}}>✨ SPECIAL FEATURES</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[
                      {icon:"🎯",title:"Double Puff",desc:"2 puffs per shot = more skill!",color:C.lime},
                      {icon:"⏱️",title:"3s to Start",desc:"Tap fast, then puff!",color:C.gold},
                      {icon:"🌊",title:"Puff Wave",desc:"10+ fans puff at once!",color:C.cyan},
                      {icon:"🐍",title:"Traitor",desc:"Switch sides = badge!",color:C.red},
                    ].map((f,i)=>(
                      <div key={i} style={{padding:"8px",borderRadius:10,background:`${f.color}06`,border:`1px solid ${f.color}12`,textAlign:"center"}}>
                        <div style={{fontSize:16,marginBottom:2}}>{f.icon}</div>
                        <div style={{fontSize:8,fontWeight:800,color:f.color}}>{f.title}</div>
                        <div style={{fontSize:7,color:C.text3}}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ═══ FK2 SECTION 6: PRO TIPS ═══ */}
                <div style={{padding:"12px",borderRadius:16,background:`${C.orange}06`,border:`1px solid ${C.orange}15`,marginBottom:8}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.orange,letterSpacing:2,marginBottom:6,textAlign:"center"}}>🧠 FK2 PRO TIPS</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {[
                      "X sweet spot is CENTER — avoid the red WIDE edges!",
                      "Y sweet spot is MID-HIGH — too high = over the bar! 💀",
                      "Both sweet spots hit = DOUBLE PRECISION 🎯🎯 — almost unstoppable",
                      "Blinker on either axis = comedy gold but you MISS 😂",
                      "Watch the crosshair on the goal — it shows your live aim!",
                    ].map((tip,i)=>(
                      <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                        <span style={{fontSize:8,color:C.orange,fontWeight:900,flexShrink:0}}>💡</span>
                        <span style={{fontSize:8,color:C.text2,lineHeight:1.3}}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                </>) : (
                  <div style={{textAlign:"center",padding:"30px 20px",...GLASS_CARD,borderRadius:16}}>
                    <div style={{fontSize:48,marginBottom:10}}>{selectedGame.emoji}</div>
                    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>{selectedGame.name}</div>
                    <div style={{fontSize:10,color:C.text2,lineHeight:1.5}}>{selectedGame.desc}</div>
                    <div style={{fontSize:9,color:C.text3,marginTop:16,padding:"8px 16px",borderRadius:8,background:`rgba(255,255,255,0.03)`,border:`1px solid ${C.border}`,display:"inline-block"}}>Full rules coming soon!</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ── WORLD CUP OVERLAY ──
  // ═══ FAN MODE OVERLAY ═══
  const renderFanMode = () => {
    if(!fanMode) return null;
    const bgStyle = {position:"absolute",inset:0,background:`
      radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
      linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
    `};

    // ── FAN: Choose Team ──
    if(fanMode === "team_select") {
      const confeds = [...new Set(WC_TEAMS.map(t=>t.confederation))];
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden"}}>
          <div style={bgStyle}/>
          {overlayBack(()=>setFanMode(null))}
          <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",padding:"44px 14px 20px",overflowY:"auto"}}>
            <div style={{textAlign:"center",marginBottom:12}}>
              <div style={{fontSize:24,marginBottom:4}}>👀</div>
              <div style={{fontSize:14,fontWeight:900,color:C.text}}>Join as Fan</div>
              <div style={{fontSize:9,color:C.text3,marginTop:3}}>Choose a team to support · Watch live matches</div>
            </div>
            {confeds.map(conf=>(
              <div key={conf} style={{marginBottom:10}}>
                <div style={{fontSize:8,fontWeight:800,color:C.text3,letterSpacing:1,marginBottom:4,padding:"0 4px"}}>{conf}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:4}}>
                  {WC_TEAMS.filter(t=>t.confederation===conf).map(t=>(
                    <div key={t.id} onClick={()=>{playFx("select");setFanTeam(t);}} style={{
                      padding:"6px 2px",borderRadius:8,cursor:"pointer",textAlign:"center",
                      background:fanTeam?.id===t.id?`${C.cyan}15`:`rgba(255,255,255,0.02)`,
                      border:`1px solid ${fanTeam?.id===t.id?C.cyan+"40":C.border}`,
                      transition:"all 0.15s",
                    }}>
                      <div style={{fontSize:18}}>{t.flag}</div>
                      <div style={{fontSize:6,color:fanTeam?.id===t.id?C.cyan:C.text3,fontWeight:600,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {fanTeam && (
              <div style={{position:"sticky",bottom:0,padding:"10px 0",background:`linear-gradient(0deg, #06101E, transparent)`}}>
                <div onClick={()=>{playFx("success");setFanMode("device_select");}} style={{
                  padding:"12px 0",borderRadius:14,textAlign:"center",cursor:"pointer",
                  background:`linear-gradient(135deg, ${C.cyan}40, ${C.gold}30)`,
                  border:`2px solid ${C.cyan}60`,backdropFilter:"blur(8px)",
                }}>
                  <div style={{fontSize:13,fontWeight:900,color:C.cyan}}>SUPPORT {fanTeam.flag} {fanTeam.name.toUpperCase()}</div>
                  <div style={{fontSize:8,color:C.text3,marginTop:2}}>Next: choose your device</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── FAN: Choose Device ──
    if(fanMode === "device_select") {
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={bgStyle}/>
          {overlayBack(()=>setFanMode("team_select"))}
          <div style={{position:"relative",zIndex:2,width:"88%",maxWidth:360,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:6}}>{fanTeam?.flag}</div>
            <div style={{fontSize:14,fontWeight:900,color:C.text,marginBottom:2}}>Fan of {fanTeam?.name}</div>
            <div style={{fontSize:10,fontWeight:700,color:C.cyan,marginBottom:4}}>👀 SPECTATOR MODE</div>
            <div style={{fontSize:9,color:C.text3,marginBottom:14}}>Choose device to match with live games using this control</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {INPUT_TYPES.map(t=>(
                <div key={t.id} onClick={()=>{
                  playFx("success"); setFanDevice(t.id); setFanMode("watching");
                  notify(`👀 Watching as ${fanTeam?.flag} ${fanTeam?.name} fan! (${t.label})`,C.cyan);
                }} style={{
                  padding:"12px 14px",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                  background:`linear-gradient(135deg, ${t.color}08, ${t.color}03)`,border:`1px solid ${t.color}20`,
                }}>
                  <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.color}12`,border:`1px solid ${t.color}20`,fontSize:18}}>{t.icon}</div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{fontSize:12,fontWeight:700,color:t.color}}>{t.label}</div>
                    <div style={{fontSize:8,color:C.text3}}>{t.desc}</div>
                  </div>
                  <span style={{fontSize:14,color:`${t.color}40`}}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── FAN: Watching lobby ──
    if(fanMode === "watching") {
      const devLabel = INPUT_TYPES.find(t=>t.id===fanDevice)?.label||"Puff";
      const fn = fanTeam?.name||"";
      const ff = fanTeam?.flag||"🏳️";
      // Generate matches involving the fan's team + a few others
      const otherTeams = WC_TEAMS.filter(t=>t.id!==fanTeam?.id).slice(0,8);
      const liveMatches = [
        {hf:ff,hn:fn,af:otherTeams[0]?.flag,an:otherTeams[0]?.name,score:"1-0",phase:`Group ${fanTeam?.group||"A"} · Match 2`,viewers:87,round:3},
        {hf:ff,hn:fn,af:otherTeams[1]?.flag,an:otherTeams[1]?.name,score:"0-0",phase:`Group ${fanTeam?.group||"A"} · Match 1`,viewers:42,round:2},
      ];
      const upcomingMatches = [
        {hf:ff,hn:fn,af:otherTeams[2]?.flag,an:otherTeams[2]?.name,phase:`Group ${fanTeam?.group||"A"} · Match 3`,time:"In 25 min"},
        {hf:ff,hn:fn,af:otherTeams[3]?.flag,an:otherTeams[3]?.name,phase:"Round of 16",time:"In 2h"},
      ];
      // Enter a match as spectator
      const fanEnterMatch = (match) => {
        playFx("success");
        // Set up spectator view using the game's audience system
        const homeTeam = WC_TEAMS.find(t=>t.name===match.hn)||WC_TEAMS[0];
        const awayTeam = WC_TEAMS.find(t=>t.name===match.an)||WC_TEAMS[1];
        kickOpponent.current = {
          name:awayTeam.name, emoji:awayTeam.flag,
          img:`https://api.dicebear.com/9.x/icons/svg?seed=${awayTeam.id}&backgroundColor=transparent`,
          rank:`#${Math.floor(Math.random()*30)+1}`, record:`${Math.floor(Math.random()*100)}-${Math.floor(Math.random()*50)}`,
          taunt:"Let's see what you got!", oppTeam:awayTeam,
        };
        if(!wcTeam) setWcTeam(homeTeam);
        const fkGame = PLAY_GAMES.find(g=>g.id===wcGameId) || PLAY_GAMES.find(g=>g.id==="finalkick");
        setGameActive({...fkGame, activeInput:fanDevice||"puff", wcMode:true, fanSpectator:true});
        startKick(fkGame.id);
        startMatchIntro(kickOpponent.current);
        setFanMode(null);
        notify(`👀 Watching ${match.hf} ${match.hn} vs ${match.af} ${match.an}`,C.cyan);
      };
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden"}}>
          <div style={bgStyle}/>
          {overlayBack(()=>{setFanMode(null);setFanTeam(null);setFanDevice(null);})}
          <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",padding:"44px 14px 20px",overflowY:"auto"}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:24}}>{fanTeam?.flag}</span>
                <span style={{fontSize:14,fontWeight:900,color:C.text}}>Fan Zone</span>
              </div>
              <div style={{fontSize:9,color:C.text3}}>Supporting {fanTeam?.name} · {devLabel} matches · Tap a match to enter</div>
            </div>

            {/* Live matches */}
            <div style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:1,marginBottom:6}}>🔴 LIVE MATCHES ({liveMatches.length})</div>
            {liveMatches.map((g,i)=>(
              <div key={i} onClick={()=>fanEnterMatch(g)} style={{
                padding:"10px 12px",borderRadius:14,marginBottom:6,cursor:"pointer",
                ...GLASS_CARD,transition:"all 0.2s",
              }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,flex:1}}>
                    <span style={{fontSize:14}}>{g.hf}</span>
                    <span style={{fontSize:9,fontWeight:700,color:C.text}}>{g.hn}</span>
                  </div>
                  <div style={{fontSize:12,fontWeight:900,color:C.gold,minWidth:36,textAlign:"center"}}>{g.score}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,flex:1,justifyContent:"flex-end"}}>
                    <span style={{fontSize:9,fontWeight:700,color:C.text}}>{g.an}</span>
                    <span style={{fontSize:14}}>{g.af}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:7,color:C.text3}}>{g.phase}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}}/>
                    <span style={{fontSize:7,color:C.red,fontWeight:700}}>LIVE</span>
                    <span style={{fontSize:7,color:C.text3}}>👁️ {g.viewers}</span>
                    <span style={{fontSize:7,fontWeight:700,color:C.cyan,padding:"1px 5px",borderRadius:4,background:`${C.cyan}12`,border:`1px solid ${C.cyan}20`}}>ENTER</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Upcoming */}
            <div style={{fontSize:9,fontWeight:800,color:C.text3,letterSpacing:1,marginBottom:6,marginTop:6}}>⏳ UPCOMING ({upcomingMatches.length})</div>
            {upcomingMatches.map((g,i)=>(
              <div key={i} style={{padding:"8px 12px",borderRadius:12,marginBottom:5,...GLASS_CARD,opacity:0.7}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:12}}>{g.hf}</span>
                    <span style={{fontSize:9,fontWeight:600,color:C.text2}}>{g.hn} vs {g.an}</span>
                    <span style={{fontSize:12}}>{g.af}</span>
                  </div>
                  <span style={{fontSize:7,color:C.gold,fontWeight:600}}>{g.time}</span>
                </div>
                <div style={{fontSize:7,color:C.text3,marginTop:2}}>{g.phase}</div>
              </div>
            ))}

            {/* Fan chat preview */}
            <div style={{marginTop:8,padding:"10px 14px",borderRadius:14,...GLASS_CARD}}>
              <div style={{fontSize:9,fontWeight:800,color:C.cyan,marginBottom:4}}>💬 FAN CHAT</div>
              {["LET'S GO "+fanTeam?.name+"! 🔥","Anyone watching the group match?","Sweet spot merchant in match 2 😂","This keeper is INSANE 🧤"].map((m,i)=>(
                <div key={i} style={{fontSize:7,color:C.text2,marginBottom:2}}>
                  <span style={{fontWeight:700,color:i===0?C.cyan:C.text3}}>Fan_{100+i*23} </span>{m}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderWorldCup = () => {
    if(!wcPhase) return null;
    // Hide WC overlay when actively playing a match (game screen takes over)
    if(gameActive && gameActive.wcMode) return null;

    // ═══ TEAM SELECTION (Tournament or Quick Play) ═══
    if(wcPhase === "team_select" || wcPhase === "team_select_quick") {
      const isQuickMode = wcPhase === "team_select_quick";
      const confeds = WC_CONFEDERATIONS;
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>
          {/* Stadium lights */}
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{position:"absolute",top:0,left:`${10+i*16}%`,width:2,height:`${15+Math.random()*15}%`,background:`linear-gradient(180deg, ${C.gold}20, transparent)`,filter:"blur(3px)",animation:`pulse ${2+Math.random()*2}s infinite ${Math.random()}s`}}/>
          ))}

          {overlayBack(wcExitTournament)}

          <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",padding:"48px 12px 16px"}}>
            {/* Title */}
            <div style={{textAlign:"center",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:C.gold,letterSpacing:2,textShadow:`0 0 15px ${C.gold}40`}}>{isQuickMode?"⚡ QUICK PLAY":"🏆 WORLD CUP 2026"}</div>
              <div style={{fontSize:16,fontWeight:900,color:C.text,marginTop:2}}>Choose Your Team</div>
              <div style={{fontSize:9,color:C.text3,marginTop:3}}>{isQuickMode?"Pick a nation for your match":"50 nations · Select your squad and fight for glory"}</div>
            </div>

            {/* Team grid — scrollable */}
            <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
              {confeds.map(conf => {
                const teams = WC_TEAMS.filter(t => t.confederation === conf.id);
                if(teams.length === 0) return null;
                return (
                  <div key={conf.id} style={{marginBottom:10}}>
                    <div style={{fontSize:8,fontWeight:800,color:conf.color,letterSpacing:1,marginBottom:4,paddingLeft:4}}>{conf.label}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:4}}>
                      {teams.map(team => {
                        const selected = wcTeam?.id === team.id;
                        return (
                          <div key={team.id} onClick={()=>wcSelectTeam(team)} style={{
                            padding:"8px 2px 6px",borderRadius:10,textAlign:"center",cursor:"pointer",
                            background: selected ? `${C.cyan}15` : "rgba(255,255,255,0.03)",
                            border: selected ? `2px solid ${C.cyan}60` : "1px solid rgba(255,255,255,0.06)",
                            boxShadow: selected ? `0 0 15px ${C.cyan}20, inset 0 0 10px ${C.cyan}08` : "none",
                            transition:"all 0.2s",
                          }}>
                            <div style={{fontSize:22,lineHeight:1}}>{team.flag}</div>
                            <div style={{fontSize:7,fontWeight:700,color:selected?C.cyan:C.text,marginTop:3,lineHeight:1.1}}>{team.name}</div>
                            <div style={{fontSize:7,color:C.gold,marginTop:2}}>{"⭐".repeat(team.rating)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm button — fixed bottom */}
            {wcTeam && (
              <div style={{position:"absolute",bottom:16,left:16,right:16,zIndex:5,animation:"fadeIn 0.3s ease"}}>
                <div onClick={()=>{if(isQuickMode){playFx("success");setWcPhase(null);}else{wcConfirmTeam();}}} style={{
                  padding:"12px 0",borderRadius:14,textAlign:"center",cursor:"pointer",
                  background:`linear-gradient(135deg, ${C.cyan}40, ${C.gold}30)`,
                  border:`2px solid ${C.cyan}60`,
                  boxShadow:`0 0 30px ${C.cyan}25`,
                  backdropFilter:"blur(8px)",
                }}>
                  <div style={{fontSize:14,fontWeight:900,color:C.cyan}}>
                    CONFIRM {wcTeam.flag} {wcTeam.name.toUpperCase()}
                  </div>
                  <div style={{fontSize:8,color:C.text3,marginTop:2}}>Enter the World Cup as {wcTeam.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ═══ DEVICE SELECTION FOR TOURNAMENT ═══
    if(wcPhase === "device_select") {
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>
          {overlayBack(()=>setWcPhase("team_select"))}
          <div style={{position:"relative",zIndex:2,width:"88%",maxWidth:360,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>{wcTeam?.flag}</div>
            <div style={{fontSize:16,fontWeight:900,color:C.text,marginBottom:2}}>{wcTeam?.name}</div>
            <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:16}}>🏆 WORLD CUP 2026</div>
            <div style={{fontSize:12,fontWeight:700,color:C.text2,marginBottom:4}}>Choose Device Control</div>
            <div style={{fontSize:8,color:C.text3,marginBottom:14}}>You'll be matched with players using the same input type</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {INPUT_TYPES.map(t=>(
                <div key={t.id} onClick={()=>wcConfirmDevice(t.id)} style={{
                  padding:"14px 16px",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,
                  background:`linear-gradient(135deg, ${t.color}10, ${t.color}03)`,
                  border:`1px solid ${t.color}25`,transition:"all 0.2s",
                  boxShadow:`0 0 15px ${t.color}08`,
                }}>
                  <div style={{width:42,height:42,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.color}15`,border:`1px solid ${t.color}25`,fontSize:22}}>{t.icon}</div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:800,color:t.color}}>{t.label}</div>
                    <div style={{fontSize:8,color:C.text3}}>{t.desc}</div>
                    <div style={{fontSize:7,color:C.text3+"80",marginTop:2}}>Pool: {t.id==="puff"?"High (2.5x rewards)":t.id==="dry_puff"?"Mid (1.5x rewards)":"Standard (1x rewards)"}</div>
                  </div>
                  <span style={{fontSize:16,color:`${t.color}40`}}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ═══ GROUP DRAW ANIMATION ═══
    if(wcPhase === "group_draw" && wcTournament) {
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden",
          background:`radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%), linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)`,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{textAlign:"center",animation:"fadeIn 0.5s ease"}}>
            <div style={{fontSize:12,fontWeight:800,color:C.gold,letterSpacing:3,marginBottom:16,animation:"pulse 1s infinite"}}>GROUP DRAW</div>
            <div style={{
              padding:"20px 30px",borderRadius:20,
              ...GLASS_CARD,
              boxShadow:`0 0 40px ${C.gold}15`,
              animation: wcDrawAnim ? "countPulse 0.8s ease infinite" : "none",
            }}>
              <div style={{fontSize:14,fontWeight:900,color:C.gold,marginBottom:12}}>GROUP {wcTournament.group}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {wcTournament.teams.map((team, i) => (
                  <div key={team.id} style={{
                    display:"flex",alignItems:"center",gap:10,
                    padding:"6px 12px",borderRadius:10,
                    background: team.id === wcTeam.id ? `${C.cyan}12` : "rgba(255,255,255,0.03)",
                    border: team.id === wcTeam.id ? `1px solid ${C.cyan}30` : `1px solid ${C.border}`,
                    animation:`fadeIn 0.4s ease ${i*0.3}s both`,
                  }}>
                    <span style={{fontSize:24}}>{team.flag}</span>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontSize:12,fontWeight:700,color: team.id === wcTeam.id ? C.cyan : C.text}}>{team.name}</div>
                      <div style={{fontSize:7,color:C.gold}}>{"⭐".repeat(team.rating)}</div>
                    </div>
                    {team.id === wcTeam.id && <span style={{fontSize:8,fontWeight:800,color:C.cyan,padding:"2px 6px",borderRadius:6,background:`${C.cyan}15`}}>YOU</span>}
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,color:C.text3,marginTop:12}}>3 matches to play — Top 2 advance</div>
            </div>
          </div>
        </div>
      );
    }

    // ═══ GROUP STAGE ═══
    if(wcPhase === "group_stage" && wcTournament) {
      const st = wcTournament.standings;
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>
          {overlayBack(wcExitTournament)}

          <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",padding:"48px 14px 20px"}}>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2}}>🏆 WORLD CUP 2026 — GROUP {wcTournament.group}</div>
              <div style={{fontSize:8,color:C.text3,marginTop:2}}>Playing as {wcTeam?.flag} {wcTeam?.name}</div>
            </div>

            {/* Tab bar */}
            <div style={{display:"flex",gap:0,marginBottom:10,borderBottom:`1px solid ${C.border}`}}>
              {[{key:"mygroup",label:"Your Group"},{key:"allgroups",label:"All Groups"},{key:"bracket",label:"Bracket"}].map(tab=>(
                <div key={tab.key} onClick={()=>{playFx("nav");setWcViewTab(tab.key);}} style={{
                  flex:1,textAlign:"center",padding:"3px 0",cursor:"pointer",
                  fontSize:8,fontWeight:wcViewTab===tab.key?800:600,
                  color:wcViewTab===tab.key?C.cyan:C.text3,
                  borderBottom:wcViewTab===tab.key?`2px solid ${C.cyan}`:"2px solid transparent",
                  transition:"all 0.2s",
                }}>{tab.label}</div>
              ))}
            </div>

            <div style={{flex:1,overflowY:"auto"}}>

            {/* ── YOUR GROUP TAB ── */}
            {wcViewTab === "mygroup" && (<>
            {/* Group standings table */}
            <div style={{padding:"10px 12px",borderRadius:14,...GLASS_CARD,marginBottom:12}}>
              <div style={{fontSize:9,fontWeight:800,color:C.text2,marginBottom:6}}>STANDINGS</div>
              <div style={{display:"grid",gridTemplateColumns:"24px 1fr 24px 24px 24px 24px 28px",gap:"2px 4px",alignItems:"center",fontSize:8}}>
                <div style={{color:C.text3,fontWeight:700}}>#</div>
                <div style={{color:C.text3,fontWeight:700}}>Team</div>
                <div style={{color:C.text3,fontWeight:700,textAlign:"center"}}>P</div>
                <div style={{color:C.text3,fontWeight:700,textAlign:"center"}}>W</div>
                <div style={{color:C.text3,fontWeight:700,textAlign:"center"}}>D</div>
                <div style={{color:C.text3,fontWeight:700,textAlign:"center"}}>L</div>
                <div style={{color:C.gold,fontWeight:700,textAlign:"center"}}>Pts</div>
                {st.map((s, i) => {
                  const isYou = s.id === wcTeam?.id;
                  const qualifies = i < 2;
                  return [
                    <div key={`r${i}`} style={{color:qualifies?C.green:C.text3,fontWeight:700}}>{i+1}</div>,
                    <div key={`n${i}`} style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:12}}>{s.flag}</span>
                      <span style={{fontWeight:isYou?800:600,color:isYou?C.cyan:C.text,fontSize:8}}>{s.name}</span>
                    </div>,
                    <div key={`p${i}`} style={{textAlign:"center",color:C.text2}}>{s.played}</div>,
                    <div key={`w${i}`} style={{textAlign:"center",color:C.green}}>{s.won}</div>,
                    <div key={`d${i}`} style={{textAlign:"center",color:C.text2}}>{s.drawn}</div>,
                    <div key={`l${i}`} style={{textAlign:"center",color:C.red}}>{s.lost}</div>,
                    <div key={`pt${i}`} style={{textAlign:"center",fontWeight:800,color:C.gold}}>{s.pts}</div>,
                  ];
                })}
              </div>
            </div>

            {/* Group result message */}
            {wcGroupResult === "advance" && (
              <div style={{padding:"12px 16px",borderRadius:14,textAlign:"center",marginBottom:12,...LG.tinted(C.green),animation:"fadeIn 0.5s ease",border:`1px solid ${C.green}30`}}>
                <div style={{fontSize:16,fontWeight:900,color:C.green}}>QUALIFIED!</div>
                <div style={{fontSize:10,color:C.text2,marginTop:2}}>You advance to the knockout stage</div>
              </div>
            )}
            {wcGroupResult === "eliminated" && (
              <div style={{padding:"12px 16px",borderRadius:14,textAlign:"center",marginBottom:12,...LG.tinted(C.red),animation:"fadeIn 0.5s ease",border:`1px solid ${C.red}30`}}>
                <div style={{fontSize:16,fontWeight:900,color:C.red}}>ELIMINATED</div>
                <div style={{fontSize:10,color:C.text2,marginTop:2}}>Your World Cup journey ends here</div>
              </div>
            )}

            {/* Match cards */}
            <div style={{fontSize:9,fontWeight:800,color:C.text2,marginBottom:6}}>MATCHES</div>
            {wcTournament.groupMatches.map((match, idx) => {
              const played = match.played;
              const isNext = !played && wcTournament.groupMatches.slice(0, idx).every(m => m.played);
              return (
                <div key={idx} onClick={()=>{if(isNext && !wcGroupResult) wcStartGroupMatch(idx);}} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,marginBottom:6,cursor:isNext?"pointer":"default",
                  background: isNext ? `${C.cyan}08` : played ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                  border: isNext ? `1px solid ${C.cyan}25` : `1px solid ${C.border}`,
                  opacity: played ? 0.7 : 1,
                  transition:"all 0.2s",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                    <span style={{fontSize:18}}>{wcTeam?.flag}</span>
                    <span style={{fontSize:10,fontWeight:700,color:C.text}}>vs</span>
                    <span style={{fontSize:18}}>{match.opp.flag}</span>
                    <span style={{fontSize:10,fontWeight:600,color:C.text2}}>{match.opp.name}</span>
                  </div>
                  {played ? (
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:12,fontWeight:800,color:match.result==="win"?C.green:match.result==="loss"?C.red:C.gold}}>
                        {match.myScore} - {match.aiScore}
                      </div>
                      <div style={{fontSize:7,fontWeight:700,color:match.result==="win"?C.green:match.result==="loss"?C.red:C.gold}}>
                        {match.result==="win"?"WIN":match.result==="loss"?"LOSS":"DRAW"}
                      </div>
                    </div>
                  ) : isNext ? (
                    <div style={{fontSize:9,fontWeight:800,color:C.cyan,padding:"4px 10px",borderRadius:8,background:`${C.cyan}12`,border:`1px solid ${C.cyan}25`}}>PLAY</div>
                  ) : (
                    <div style={{fontSize:8,color:C.text3}}>Match {idx+1}</div>
                  )}
                </div>
              );
            })}
            </>)}

            {/* ── ALL GROUPS TAB ── */}
            {wcViewTab === "allgroups" && (()=>{
              // Generate all 12 groups (A-L) using WC_GROUPS data with seeded random standings
              const groupLetters = Object.keys(WC_GROUPS);
              return groupLetters.map(letter => {
                const teamIds = WC_GROUPS[letter];
                const teams = teamIds.map(id => WC_TEAMS.find(t => t.id === id)).filter(Boolean);
                const isUserGroup = letter === wcTournament.group;
                // For user's group use real standings, for others generate fake ones
                const standings = isUserGroup ? st : teams.map((t, ti) => {
                  // Deterministic fake points based on team rating + letter code
                  const seed = letter.charCodeAt(0) * 7 + ti * 13;
                  const pts = t.rating >= 4 ? (seed % 3 === 0 ? 9 : seed % 2 === 0 ? 7 : 6) :
                              t.rating >= 3 ? (seed % 3 === 0 ? 6 : seed % 2 === 0 ? 4 : 3) :
                              (seed % 3 === 0 ? 3 : seed % 2 === 0 ? 1 : 0);
                  return { ...t, pts };
                }).sort((a, b) => b.pts - a.pts);
                return (
                  <div key={letter} style={{marginBottom:10,padding:"8px 10px",borderRadius:12,...GLASS_CARD,border:isUserGroup?`1px solid ${C.cyan}25`:undefined}}>
                    <div style={{fontSize:9,fontWeight:800,color:isUserGroup?C.cyan:C.gold,marginBottom:5,letterSpacing:1}}>GROUP {letter}{isUserGroup?" (YOUR GROUP)":""}</div>
                    {standings.map((t, i) => (
                      <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0",borderBottom:i<standings.length-1?`1px solid ${C.border}`:"none"}}>
                        <div style={{width:14,fontSize:7,fontWeight:700,color:i<2?C.green:C.text3}}>{i+1}</div>
                        <span style={{fontSize:12}}>{t.flag}</span>
                        <span style={{flex:1,fontSize:8,fontWeight:t.id===wcTeam?.id?800:600,color:t.id===wcTeam?.id?C.cyan:C.text}}>{t.name}</span>
                        <span style={{fontSize:8,fontWeight:700,color:C.gold,width:20,textAlign:"right"}}>{t.pts}</span>
                      </div>
                    ))}
                  </div>
                );
              });
            })()}

            {/* ── BRACKET TAB ── */}
            {wcViewTab === "bracket" && (()=>{
              const bracketRounds = ["R32","R16","QF","SF","Final"];
              // Generate fake bracket matchups from group winners/runners
              const groupLetters = Object.keys(WC_GROUPS);
              const fakeSlots = groupLetters.flatMap(letter => {
                const teamIds = WC_GROUPS[letter];
                const teams = teamIds.map(id => WC_TEAMS.find(t => t.id === id)).filter(Boolean);
                return teams.slice(0, 2); // top 2 per group
              });
              return (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:8,color:C.text3,textAlign:"center",marginBottom:4}}>48 Teams -- Top 2 per group advance to R32</div>
                  {bracketRounds.map((roundName, rIdx) => {
                    const matchCount = rIdx === 0 ? 16 : rIdx === 1 ? 8 : rIdx === 2 ? 4 : rIdx === 3 ? 2 : 1;
                    const isActive = rIdx === 0;
                    return (
                      <div key={roundName} style={{padding:"6px 10px",borderRadius:10,...GLASS_CARD,border:isActive?`1px solid ${C.gold}20`:undefined}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{fontSize:9,fontWeight:800,color:isActive?C.gold:C.text2,letterSpacing:1}}>{roundName}</div>
                          <div style={{fontSize:7,color:C.text3}}>{matchCount} matches</div>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                          {[...Array(Math.min(matchCount, 8))].map((_, mi) => {
                            const t1 = fakeSlots[(rIdx * 7 + mi * 2) % fakeSlots.length];
                            const t2 = fakeSlots[(rIdx * 7 + mi * 2 + 1) % fakeSlots.length];
                            return (
                              <div key={mi} style={{display:"flex",alignItems:"center",gap:2,padding:"2px 5px",borderRadius:6,background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,fontSize:7}}>
                                <span style={{fontSize:10}}>{t1?.flag}</span>
                                <span style={{color:C.text3,fontWeight:700}}>v</span>
                                <span style={{fontSize:10}}>{t2?.flag}</span>
                              </div>
                            );
                          })}
                          {matchCount > 8 && <div style={{fontSize:7,color:C.text3,padding:"2px 5px",display:"flex",alignItems:"center"}}>+{matchCount - 8} more</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            </div>{/* end scrollable wrapper */}
          </div>
        </div>
      );
    }

    // ═══ KNOCKOUT STAGE ═══
    if(wcPhase === "knockout" && wcBracket) {
      const current = wcBracket.currentRound;
      const rounds = wcBracket.rounds;
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>
          {overlayBack(wcExitTournament)}

          <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 16px 20px",overflowY:"auto"}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2}}>🏆 KNOCKOUT STAGE</div>
              <div style={{fontSize:8,color:C.text3,marginTop:2}}>{wcTeam?.flag} {wcTeam?.name} — Win or go home</div>
            </div>

            {/* Bracket visualization */}
            <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:6}}>
              {rounds.map((roundName, idx) => {
                const result = wcBracket.results[idx];
                const isCurrent = idx === current && !result;
                const opp = wcBracket.opponents[idx];
                const isPast = idx < current || result;
                const isFuture = idx > current;

                return (
                  <div key={idx} onClick={()=>{if(isCurrent) wcStartKnockoutMatch();}} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,
                    cursor: isCurrent ? "pointer" : "default",
                    background: isCurrent ? `${C.gold}10` : isPast ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                    border: isCurrent ? `1px solid ${C.gold}30` : `1px solid ${C.border}`,
                    opacity: isFuture ? 0.4 : 1,
                    boxShadow: isCurrent ? `0 0 20px ${C.gold}10` : "none",
                    transition:"all 0.2s",
                  }}>
                    <div style={{width:10,height:10,borderRadius:"50%",
                      background: result?.win ? C.green : result && !result.win ? C.red : isCurrent ? C.gold : C.text3,
                      boxShadow: isCurrent ? `0 0 8px ${C.gold}40` : "none",
                    }}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:700,color: isCurrent ? C.gold : C.text}}>{roundName}</div>
                      {(isCurrent || isPast) && opp && (
                        <div style={{fontSize:8,color:C.text2,marginTop:1}}>
                          {wcTeam?.flag} vs {opp.flag} {opp.name}
                        </div>
                      )}
                      {isFuture && <div style={{fontSize:8,color:C.text3,marginTop:1}}>TBD</div>}
                    </div>
                    {result ? (
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,fontWeight:800,color:result.win?C.green:C.red}}>
                          {result.myScore}-{result.aiScore}{result.extraTime?" (ET)":""}
                        </div>
                        <div style={{fontSize:7,fontWeight:700,color:result.win?C.green:C.red}}>{result.win?"WIN":"LOSS"}</div>
                      </div>
                    ) : isCurrent ? (
                      <div style={{fontSize:9,fontWeight:800,color:C.gold,padding:"4px 10px",borderRadius:8,background:`${C.gold}15`,border:`1px solid ${C.gold}25`,animation:"pulse 2s infinite"}}>PLAY</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ═══ RESULT SCREEN ═══
    if(wcPhase === "result" && wcFinalResult) {
      const prize = WC_PRIZES[wcFinalResult];
      const isGold = wcFinalResult === "gold";
      const accentColor = isGold ? C.gold : wcFinalResult === "silver" ? "#C0C0C0" : wcFinalResult === "bronze" ? "#CD7F32" : C.text3;
      return (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:110,overflow:"hidden",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{position:"absolute",inset:0,background:`
            radial-gradient(ellipse at 50% 30%, ${accentColor}15 0%, transparent 50%),
            radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.04) 0%, transparent 40%),
            linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)
          `}}/>
          {/* Gold rays for champion */}
          {isGold && [...Array(8)].map((_,i)=>(
            <div key={i} style={{position:"absolute",top:"30%",left:"50%",width:2,height:"40%",
              background:`linear-gradient(180deg, ${C.gold}15, transparent)`,
              transform:`translateX(-50%) rotate(${i*45}deg)`,transformOrigin:"top center",
              filter:"blur(3px)",animation:`pulse ${2+Math.random()}s infinite ${Math.random()}s`,
            }}/>
          ))}

          <div style={{textAlign:"center",padding:24,animation:"fadeIn 0.6s ease",position:"relative",zIndex:2}}>
            {/* Trophy / medal */}
            <div style={{fontSize:60,marginBottom:8,animation:"gentleFloat 2s infinite",filter:`drop-shadow(0 0 20px ${accentColor}40)`}}>
              {isGold ? "🏆" : wcFinalResult === "silver" ? "🥈" : wcFinalResult === "bronze" ? "🥉" : "⚽"}
            </div>

            <div style={{fontSize:20,fontWeight:900,color:accentColor,textShadow:`0 0 20px ${accentColor}30`,marginBottom:4}}>
              {prize.title.toUpperCase()}
            </div>
            <div style={{fontSize:12,color:C.text2,marginBottom:16}}>
              {wcTeam?.flag} {wcTeam?.name}
            </div>

            {/* Prize breakdown */}
            <div style={{
              padding:"16px 24px",borderRadius:16,...GLASS_CARD,
              border:`1px solid ${accentColor}20`,
              boxShadow:`0 0 30px ${accentColor}10`,
              marginBottom:20,
            }}>
              <div style={{fontSize:9,fontWeight:800,color:C.text3,letterSpacing:1,marginBottom:8}}>REWARDS</div>
              <div style={{display:"flex",justifyContent:"center",gap:16}}>
                <div>
                  <div style={{fontSize:20,fontWeight:900,color:C.gold}}>{prize.pts.toLocaleString()}</div>
                  <div style={{fontSize:8,color:C.text3}}>Points</div>
                </div>
                <div>
                  <div style={{fontSize:20,fontWeight:900,color:C.cyan}}>{prize.coins}</div>
                  <div style={{fontSize:8,color:C.text3}}>Coins</div>
                </div>
              </div>
            </div>

            <div onClick={wcClaimPrize} style={{
              padding:"12px 40px",borderRadius:14,cursor:"pointer",
              background:`linear-gradient(135deg, ${accentColor}25, ${accentColor}10)`,
              border:`1px solid ${accentColor}35`,
              boxShadow:`0 0 20px ${accentColor}15`,
            }}>
              <div style={{fontSize:14,fontWeight:900,color:accentColor}}>CLAIM REWARDS</div>
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
  // ═══ BLE DEVICE CONNECT POPUP ═══
  const renderBlePopup = () => {
    if(!showBlePopup) return null;
    const devices = [
      {name:"Cali Clear S2",model:"CC S2",battery:"87%",emoji:"📱",connected:bleConnected},
      {name:"Cali Clear S1",model:"CC S1",battery:"--",emoji:"📱",connected:false},
    ];
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:260,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div onClick={()=>setShowBlePopup(false)} style={{position:"absolute",inset:0,background:"rgba(5,5,16,0.85)",backdropFilter:"blur(10px)"}}/>
        <div style={{position:"relative",width:"88%",maxWidth:340,
          background:`radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%), linear-gradient(180deg, #06101E 0%, #0c1a38 50%, #102240 100%)`,
          borderRadius:22,border:`1px solid ${C.border2}`,padding:"20px 18px",animation:"fadeIn 0.3s ease",
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:C.text}}>Connect Device</div>
              <div style={{fontSize:9,color:C.text3,marginTop:2}}>Bluetooth Low Energy (BLE)</div>
            </div>
            <div onClick={()=>setShowBlePopup(false)} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:`rgba(255,255,255,0.06)`,border:`1px solid ${C.border}`,fontSize:12,color:C.text3}}>✕</div>
          </div>

          {/* Status */}
          <div style={{padding:"8px 12px",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:8,
            background:bleConnected?`${C.green}08`:`${C.orange}06`,border:`1px solid ${bleConnected?C.green+"20":C.orange+"15"}`,
          }}>
            <div style={{width:8,height:8,borderRadius:"50%",background:bleConnected?C.green:C.orange,animation:bleConnected?"":"pulse 1.5s infinite"}}/>
            <div style={{fontSize:10,fontWeight:700,color:bleConnected?C.green:C.orange}}>{bleConnected?"Connected":"Not Connected"}</div>
          </div>

          {/* Device list */}
          <div style={{fontSize:8,fontWeight:700,color:C.text3,letterSpacing:1,marginBottom:6}}>DEVICES</div>
          {devices.map((d,i)=>(
            <div key={i} onClick={()=>{
              if(!d.connected){
                playFx("select");setBleScanning(true);
                setTimeout(()=>{setBleScanning(false);setBleConnected(true);playFx("success");notify(`✅ ${d.name} connected!`,C.green);},2000);
              }
            }} style={{
              display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,marginBottom:6,cursor:"pointer",
              background:d.connected?`${C.green}08`:`rgba(255,255,255,0.02)`,border:`1px solid ${d.connected?C.green+"20":C.border}`,
            }}>
              <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:`${C.cyan}10`,border:`1px solid ${C.cyan}15`,fontSize:18}}>{d.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:d.connected?C.green:C.text}}>{d.name}</div>
                <div style={{fontSize:8,color:C.text3}}>{d.model} · Battery: {d.battery}</div>
              </div>
              {d.connected ? (
                <div style={{fontSize:8,fontWeight:700,color:C.green,padding:"3px 8px",borderRadius:6,background:`${C.green}12`}}>✓ Active</div>
              ) : (
                <div style={{fontSize:8,fontWeight:700,color:C.cyan,padding:"3px 8px",borderRadius:6,background:`${C.cyan}10`,border:`1px solid ${C.cyan}20`}}>Connect</div>
              )}
            </div>
          ))}

          {/* Scan button */}
          <div onClick={()=>{
            playFx("tap");setBleScanning(true);
            setTimeout(()=>{setBleScanning(false);notify("🔍 Scan complete",C.cyan);},2500);
          }} style={{
            padding:"10px 0",borderRadius:12,textAlign:"center",cursor:"pointer",marginTop:6,
            background:bleScanning?`${C.cyan}12`:`rgba(255,255,255,0.03)`,border:`1px solid ${bleScanning?C.cyan+"30":C.border}`,
          }}>
            <div style={{fontSize:11,fontWeight:700,color:bleScanning?C.cyan:C.text2}}>
              {bleScanning?"🔄 Scanning...":"🔍 Scan for Devices"}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              <div style={{fontSize:15,fontWeight:900,color:C.text}}>Device Control</div>
              <div style={{fontSize:10,color:C.text3,marginTop:2}}>Choose your preferred input · Selected before each game</div>
            </div>
            <div onClick={()=>setShowInputPanel(false)} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:`${C.text3}08`,border:`1px solid ${C.border}`,fontSize:12,color:C.text3}}>✕</div>
          </div>
          <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:1.5,marginBottom:6}}>DEVICE INPUTS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {INPUT_TYPES.map(t=>(
              <div key={t.id} onClick={()=>{setPrimaryInput(t.id);triggerInputPulse();}} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:primaryInput===t.id?`${t.color}08`:C.bg3,border:`1.5px solid ${primaryInput===t.id?t.color+"35":C.border}`,transition:"all 0.25s"}}>
                <div style={{width:34,height:34,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.color}12`,border:`1px solid ${t.color}20`,fontSize:16}}>{t.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:primaryInput===t.id?t.color:C.text}}>{t.label}</div><div style={{fontSize:9,color:C.text3}}>{t.desc}</div></div>
                {primaryInput===t.id && <div style={{width:18,height:18,borderRadius:"50%",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",fontWeight:900}}>✓</div>}
              </div>
            ))}
          </div>
          <div style={{padding:"8px 12px",borderRadius:8,background:`${(INPUT_TYPES.find(t=>t.id===primaryInput)||INPUT_TYPES[0]).color}05`,border:`1px solid ${(INPUT_TYPES.find(t=>t.id===primaryInput)||INPUT_TYPES[0]).color}10`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13}}>{(INPUT_TYPES.find(t=>t.id===primaryInput)||INPUT_TYPES[0]).icon}</span>
            <div style={{fontSize:10,fontWeight:600,color:(INPUT_TYPES.find(t=>t.id===primaryInput)||INPUT_TYPES[0]).color}}>
              You'll choose your input before each game starts
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
        <div style={{position:"relative",width:"88%",maxWidth:340,
          background:`radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%), linear-gradient(180deg, #06101E 0%, #0c1a38 50%, #102240 100%)`,
          borderRadius:22,border:`1px solid ${C.border2}`,padding:"22px 18px",animation:"fadeIn 0.3s ease",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:28,marginBottom:4}}>{game.emoji}</div>
            <div style={{fontSize:14,fontWeight:900,color:C.text}}>{game.name}</div>
            <div style={{fontSize:10,color:C.text3,marginTop:3}}>Choose your device control</div>
            <div style={{fontSize:8,color:C.text3+"80",marginTop:2}}>You'll be matched with players using the same input</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {INPUT_TYPES.filter(t=>{if(t.id==="puff"||t.id==="dry_puff") return supported.includes("puff"); return supported.includes(t.id);}).map(t=>(
              <div key={t.id} onClick={()=>handleAskPick(t.id)} style={{padding:"12px 14px",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                background:`linear-gradient(135deg, ${t.color}08, ${t.color}03)`,border:`1px solid ${t.color}20`,transition:"all 0.2s",
                boxShadow:`0 0 12px ${t.color}06`,
              }}>
                <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.color}12`,border:`1px solid ${t.color}20`,fontSize:18}}>{t.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:t.color}}>{t.label}</div><div style={{fontSize:8,color:C.text3}}>{t.desc}</div></div>
                <span style={{fontSize:14,color:`${t.color}40`}}>›</span>
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
          <div onClick={()=>{playFx("tap");setShowBlePopup(true);}} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:100,cursor:"pointer",background:bleConnected?`${C.green}08`:`${C.text3}08`,border:`1px solid ${bleConnected?C.green+"15":C.text3+"15"}`}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:bleConnected?C.green:C.text3,animation:bleConnected?"":"pulse 2s infinite"}}/><span style={{fontSize:9,fontWeight:600,color:bleConnected?C.green:C.text3}}>{bleConnected?"BLE":"BLE"}</span>
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
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:11,fontWeight:800,color:C.text}}>💬</span>
              <span style={{fontSize:8,fontWeight:700,color:C.cyan,padding:"2px 6px",borderRadius:4,background:`${C.cyan}10`,border:`1px solid ${C.cyan}15`}}>
                {arenaView==="hub"?"🏠 Hub Lobby":arenaView==="arcade"?"🎮 Arcade":arenaView==="stage"?"🎪 Stage":arenaView==="oracle"?"🔮 Oracle":arenaView==="wall"?"🧱 Wall":"🏟️ Arena"}
              </span>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:8,fontWeight:700,color:C.green}}>{playersNow.toLocaleString()}</span>
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
      {renderWorldCup()}
      {renderFanMode()}
      {renderVibeCheck()}
      {renderSpin()}
      {renderPuffLock()}
      {renderBlePopup()}
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
              <div key={t.id} onClick={()=>{playFx("nav");if(t.id!=="arena"){notify("Coming Soon — Arena Demo Only",C.cyan);return;}setTab(t.id);setZone(null);setArenaView("hub");}} style={{
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
        @keyframes shake{0%,100%{transform:translateX(0)}10%{transform:translateX(-4px) rotate(-0.5deg)}30%{transform:translateX(4px) rotate(0.5deg)}50%{transform:translateX(-3px)}70%{transform:translateX(3px)}90%{transform:translateX(-1px)}}
        @keyframes flashOverlay{0%{opacity:0.8}100%{opacity:0}}
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(400px) translateX(40px) rotate(720deg);opacity:0}}
        @keyframes smokeRise{0%{transform:scale(0.5) translateY(0);opacity:0.15}50%{opacity:0.08}100%{transform:scale(2.5) translateY(-150px);opacity:0}}
        @keyframes puffWaveSweep{0%{transform:translateY(100%);opacity:0}20%{opacity:1}80%{opacity:0.6}100%{transform:translateY(-20%);opacity:0}}
        @keyframes slideInLeft{from{transform:translateX(-80px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes slideInRight{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes bubbleFloat{0%{transform:translateY(0) scale(1);opacity:0.6}50%{opacity:0.4}100%{transform:translateY(-200px) scale(0.3) translateX(20px);opacity:0}}
        *{-webkit-tap-highlight-color:transparent;user-select:none;box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:2px;height:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}
      `}</style>
    </div>
  );
}
