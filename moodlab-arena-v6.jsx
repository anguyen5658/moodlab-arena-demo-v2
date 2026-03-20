import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// MOOD LAB — FULL APP DEMO v5.0
// + Device Input Method Selector (header toggle)
// + Leaderboard (Global/Friends/Weekly tabs)
// + Live Chat (shared across Arena + Live, bot messages)
// + Live Tournaments (filling progress, urgency tags)
// Persists across Arena games + Live tab
// ═══════════════════════════════════════════════════════════

const C = {
  bg: "#06080F", bg2: "#0B0E1A", bg3: "#10142A", card: "#141935",
  border: "#1a2245", border2: "#243060",
  text: "#E8EBF6", text2: "#8892B8", text3: "#555F85",
  cyan: "#00E5FF", lime: "#7FFF00", gold: "#FFD93D",
  pink: "#FF4D8D", purple: "#A855F7", orange: "#FF8C42",
  red: "#FF4444", green: "#34D399", blue: "#60A5FA",
};

// ═══ DATA ═══
const PLAY_GAMES = [
  { id:"finalkick", name:"Final Kick", emoji:"⚽", players:"2", time:"1-2m", type:"Skill", color:C.cyan, desc:"Penalty kick 1v1", hot:true, inputs:["puff","button","tap"] },
  { id:"hotpotato", name:"Hot Potato", emoji:"💣", players:"3-8", time:"1-3m", type:"Luck", color:C.orange, desc:"Bom nhảy, Puff pass", inputs:["puff","button"] },
  { id:"russian", name:"Russian Roulette", emoji:"🔫", players:"2-6", time:"1-2m", type:"Luck", color:C.red, desc:"Tension cực cao", inputs:["puff","button"] },
  { id:"wildwest", name:"Wild West Duel", emoji:"🤠", players:"2", time:"15-30s", type:"Reaction", color:C.gold, desc:"Ai Puff nhanh thắng", hot:true, inputs:["puff","button"] },
  { id:"balloon", name:"Balloon Pop", emoji:"🎈", players:"2-8", time:"1-3m", type:"Strategy", color:C.pink, desc:"Puff bóng, nổ = thua", inputs:["puff","button"] },
  { id:"puffpong", name:"Puff Pong", emoji:"🏓", players:"2", time:"1-2m", type:"Skill", color:C.green, desc:"Bóng bàn ảo", inputs:["puff","tap"] },
  { id:"rhythm", name:"Rhythm Puff", emoji:"🎵", players:"1-4", time:"1-3m", type:"Rhythm", color:C.purple, desc:"Nốt nhạc, Puff nhịp", inputs:["puff","button"] },
  { id:"tugofwar", name:"Tug of War", emoji:"💪", players:"2-8", time:"30s-1m", type:"Team", color:C.blue, desc:"Team Puff spam", hot:true, inputs:["puff","button"] },
];

const SHOW_GAMES = [
  { id:"vibecheck", name:"Vibe Check", emoji:"🧠", players:"1-100+", time:"5-15m", type:"Trivia", color:C.gold, desc:"Trivia Game Show", live:true, inputs:["puff","tap"] },
  { id:"spinwin", name:"Spin & Win", emoji:"🎰", players:"1-50+", time:"2-5m", type:"Luck", color:C.pink, desc:"Vòng quay may mắn", live:true, inputs:["puff","button"] },
  { id:"higherlow", name:"Higher or Lower", emoji:"📈", players:"1-100+", time:"5-10m", type:"Knowledge", color:C.cyan, desc:"Streak cao = thưởng lớn", live:true, inputs:["puff","tap"] },
  { id:"pricepuff", name:"The Price is Puff", emoji:"💰", players:"2-50+", time:"5-10m", type:"Knowledge", color:C.green, desc:"Đoán giá, gần nhất thắng", live:true, inputs:["puff","tap"] },
];

const PREDICT_TYPES = [
  { id:"match", name:"Match Predictor", emoji:"🏟️", desc:"Win/Draw/Lose" },
  { id:"score", name:"Score Predictor", emoji:"🎯", desc:"Exact score ×10" },
  { id:"mvp", name:"MVP Pick", emoji:"⭐", desc:"Best player" },
  { id:"bracket", name:"Bracket Challenge", emoji:"🗓️", desc:"Cả giải" },
  { id:"showpred", name:"Show Predictor", emoji:"🎪", desc:"Ai thắng show?" },
  { id:"daily", name:"Daily Picks", emoji:"📅", desc:"3-5 câu/ngày" },
];

const MATCHES = [
  { id:1, home:"🇺🇸 USA", away:"🇲🇽 MEX", time:"9:00 PM", odds:[2.1,3.2,3.5], group:"A", hot:true },
  { id:2, home:"🇧🇷 BRA", away:"🇩🇪 GER", time:"3:00 AM", odds:[1.8,3.5,4.2], group:"F" },
  { id:3, home:"🇫🇷 FRA", away:"🇦🇷 ARG", time:"Tomorrow", odds:[2.5,3.1,2.8], group:"C" },
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

const USER = { name:"Steve", level:24, xp:7450, xpNext:10000, tier:"Gold" };

// Leaderboard data
const LEADERBOARD = [
  { name:"ChillMaster42", score:2847000, emoji:"👑", streak:23, place:"🥇", color:"#FFD700" },
  { name:"VibeKing", score:2654000, emoji:"😎", streak:18, place:"🥈", color:"#C0C0C0" },
  { name:"Steve", score:420690, emoji:"🌟", streak:7, place:"🥉", isYou:true, color:"#CD7F32" },
  { name:"BlazedPanda", score:350000, emoji:"🐼", streak:5, place:"4" },
  { name:"NeonQueen", score:280000, emoji:"👸", streak:12, place:"5" },
  { name:"CloudNine99", score:245000, emoji:"☁️", streak:9, place:"6" },
  { name:"PuffDaddy", score:198000, emoji:"💨", streak:4, place:"7" },
];

// Tournament data
const TOURNAMENTS = [
  { id:1, name:"Flash Frenzy ⚡", prize:"5,000", max:50, current:47, time:"2:30", hot:true, game:"wildwest" },
  { id:2, name:"Brain Battle 🧠", prize:"25,000", max:100, current:72, time:"15:00", hot:false, game:"vibecheck" },
  { id:3, name:"Mega Championship 🏆", prize:"100,000", max:200, current:198, time:"1:00:00", hot:true, game:"finalkick" },
];

// Chat bot data
const CHAT_BOTS = ["VibeKing","ChillMaster","NeonQueen","BlazedPanda","CloudNine99","PuffDaddy","MoodMaster"];
const CHAT_MSGS = ["Let's go! 🔥","Ez 😎","GG 👏","Nah that's cap 💀","LETSGOOO 🎉","🤯🤯🤯","Hmm tricky 🤔","W play 🏆","Clutch! 💪","Prediction locked 🔮"];

// Input method config
const INPUT_MODES = [
  { id:"auto", label:"Auto", icon:"🤖", desc:"App tự chọn tối ưu theo game & device", color:C.cyan },
  { id:"fixed", label:"Fixed", icon:"📌", desc:"Luôn dùng 1 kiểu input bạn chọn", color:C.gold },
  { id:"ask", label:"Ask Every Game", icon:"❓", desc:"Hỏi trước mỗi game/session", color:C.lime },
];

const INPUT_TYPES = [
  { id:"puff", label:"Puff", icon:"💨", desc:"Hút thật · MIC + Heating ON", color:C.orange },
  { id:"dry_puff", label:"Dry Puff", icon:"🌀", desc:"MIC detect · Heating OFF · Tiết kiệm", color:C.blue },
  { id:"button", label:"Button", icon:"🔘", desc:"Nút vật lý trên device · BLE signal", color:C.purple },
];

// ═══ COMPONENT ═══
export default function MoodLabApp() {
  const [tab, setTab] = useState("arena");
  const [arenaView, setArenaView] = useState("home");
  const [liveTab, setLiveTab] = useState("now");
  const [meTab, setMeTab] = useState("stats");
  const [notif, setNotif] = useState(null);
  const [coins, setCoins] = useState(12580);
  const [xp, setXp] = useState(7450);
  const [selectedGame, setSelectedGame] = useState(null);
  const [matchmaking, setMatchmaking] = useState(null);
  const [gameActive, setGameActive] = useState(null);
  const [puffLocking, setPuffLocking] = useState(false);
  const [showVibeCheck, setShowVibeCheck] = useState(false);
  const [vcQ, setVcQ] = useState(0);
  const [vcScore, setVcScore] = useState(0);
  const [vcAnswered, setVcAnswered] = useState(false);
  const [vcStreak, setVcStreak] = useState(0);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [predictLocked, setPredictLocked] = useState({});
  const [dailyPicks, setDailyPicks] = useState([null,null,null]);
  const [controlHeat, setControlHeat] = useState([2,1]);
  const [liveScore, setLiveScore] = useState({home:1,away:0,min:34});
  const [duelState, setDuelState] = useState(null);
  const [duelResult, setDuelResult] = useState(null);
  const [heroBanner, setHeroBanner] = useState(0);
  const [tick, setTick] = useState(0);

  // ═══ LEADERBOARD + CHAT + TOURNAMENT STATE ═══
  const [lbTab, setLbTab] = useState("global");
  const [chatMessages, setChatMessages] = useState([
    {u:"VibeKing",m:"Who's ready for USA vs MEX? 🇺🇸🔥",c:C.pink,t:Date.now()-60000},
    {u:"NeonQueen",m:"My bracket is locked 🔮",c:C.purple,t:Date.now()-45000},
    {u:"CloudNine99",m:"Just won 3 in a row on Final Kick ⚽",c:C.cyan,t:Date.now()-30000},
    {u:"BlazedPanda",m:"GG everyone! 🐼👏",c:C.green,t:Date.now()-15000},
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatExpanded, setChatExpanded] = useState(false);
  const [tournaments, setTournaments] = useState(TOURNAMENTS);
  const chatRef = useRef(null);

  // ═══ INPUT METHOD STATE ═══
  const [inputMode, setInputMode] = useState("auto");        // auto | fixed | ask
  const [primaryInput, setPrimaryInput] = useState("puff");   // puff | dry_puff | button
  const [tapEnabled, setTapEnabled] = useState(true);          // on-screen tap supplementary
  const [showInputPanel, setShowInputPanel] = useState(false); // bottom sheet
  const [showAskPrompt, setShowAskPrompt] = useState(null);    // game object when "ask" mode triggers
  const [sessionInput, setSessionInput] = useState(null);       // temp input chosen for "ask" mode
  const [inputPulse, setInputPulse] = useState(false);          // animation pulse on change

  // Get active input label for display
  const getActiveInputInfo = () => {
    if (inputMode === "auto") return { icon:"🤖", label:"Auto", color:C.cyan };
    if (inputMode === "fixed") {
      const t = INPUT_TYPES.find(i=>i.id===primaryInput);
      return { icon:t.icon, label:t.label, color:t.color };
    }
    if (inputMode === "ask") {
      if (sessionInput) {
        const t = INPUT_TYPES.find(i=>i.id===sessionInput);
        return { icon:t.icon, label:t.label, color:t.color };
      }
      return { icon:"❓", label:"Ask", color:C.lime };
    }
    return { icon:"🤖", label:"Auto", color:C.cyan };
  };

  // Resolve which input to use for a game
  const resolveInputForGame = (game, callback) => {
    if (inputMode === "auto") {
      // Auto: pick best available from game's supported inputs
      const supported = game?.inputs || ["puff"];
      const pick = supported.includes("puff") ? "puff" : supported[0];
      notify(`🤖 Auto → ${INPUT_TYPES.find(t=>t.id===pick)?.icon} ${INPUT_TYPES.find(t=>t.id===pick)?.label}`, C.cyan);
      callback(pick);
    } else if (inputMode === "fixed") {
      const supported = game?.inputs || ["puff"];
      if (supported.includes(primaryInput)) {
        callback(primaryInput);
      } else {
        // Fallback
        const fb = supported[0];
        notify(`⚠ ${INPUT_TYPES.find(t=>t.id===primaryInput)?.label} not supported → ${INPUT_TYPES.find(t=>t.id===fb)?.label}`, C.orange);
        callback(fb);
      }
    } else if (inputMode === "ask") {
      // Show prompt
      setShowAskPrompt(game);
      // Callback stored, will be called after user picks
      window._inputCallback = callback;
    }
  };

  const handleAskPick = (inputId) => {
    setSessionInput(inputId);
    setShowAskPrompt(null);
    triggerInputPulse();
    if (window._inputCallback) {
      window._inputCallback(inputId);
      window._inputCallback = null;
    }
  };

  const triggerInputPulse = () => {
    setInputPulse(true);
    setTimeout(() => setInputPulse(false), 600);
  };

  // Timer for live feel
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Banner auto-rotate
  useEffect(() => {
    const t = setInterval(() => setHeroBanner(p => (p + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

  // Bot chat messages
  useEffect(() => {
    const i = setInterval(() => {
      const bot = CHAT_BOTS[Math.floor(Math.random() * CHAT_BOTS.length)];
      const msg = CHAT_MSGS[Math.floor(Math.random() * CHAT_MSGS.length)];
      const colors = [C.pink,C.cyan,C.gold,C.purple,C.orange,C.green,C.blue];
      setChatMessages(prev => [...prev.slice(-20), {u:bot,m:msg,c:colors[Math.floor(Math.random()*colors.length)],t:Date.now()}]);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(i);
  }, []);

  // Tournament spots filling
  useEffect(() => {
    const i = setInterval(() => {
      setTournaments(ts => ts.map(t => ({
        ...t, current: Math.min(t.max, t.current + (Math.random() > 0.6 ? 1 : 0))
      })));
    }, 5000);
    return () => clearInterval(i);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const sendChat = useCallback((msg) => {
    const text = msg || chatInput.trim();
    if (!text) return;
    setChatMessages(prev => [...prev.slice(-20), {u:"Steve",m:text,c:C.cyan,t:Date.now(),isYou:true}]);
    setChatInput("");
  }, [chatInput]);

  const notify = useCallback((msg, color = C.cyan) => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 2200);
  }, []);

  const puffLockIn = (cb) => {
    setPuffLocking(true);
    setTimeout(() => { setPuffLocking(false); notify("✓ Locked In!", C.green); if(cb) cb(); }, 1100);
  };

  const startMatch = (game, mode) => {
    const doStart = (resolvedInput) => {
      setMatchmaking({ game, mode, stage:"searching", input:resolvedInput });
      setTimeout(() => {
        setMatchmaking(p => p ? {...p, stage:"found", opp: mode==="ai"?"🤖 AI Bot (Medium)":mode==="random"?"🎲 Player_847":"👫 Minh"} : null);
        setTimeout(() => { setMatchmaking(null); setGameActive({...game, activeInput:resolvedInput}); if(game.id==="wildwest") startDuel(); }, 1500);
      }, mode==="ai"?800:2200);
    };
    resolveInputForGame(game, doStart);
  };

  const startDuel = () => {
    setDuelState("ready"); setDuelResult(null);
    setTimeout(() => setDuelState("steady"), 1000);
    setTimeout(() => { const d = 1500+Math.random()*2000; setTimeout(()=>setDuelState("shoot"), d); }, 2000);
  };

  const duelShoot = () => {
    if(duelState==="shoot") {
      const you=Math.floor(200+Math.random()*300), ai=Math.floor(400+Math.random()*400);
      const win = you < ai;
      setDuelResult({win,you,ai}); setDuelState("result");
      if(win){setCoins(c=>c+50);setXp(x=>x+25);notify("🤠 YOU WIN! +50 coins",C.green);}
      else{setXp(x=>x+10);notify("💀 AI faster!",C.red);}
    } else if(duelState && duelState!=="shoot" && duelState!=="result") {
      setDuelResult({foul:true}); setDuelState("result"); notify("⚠ FOUL!",C.red);
    }
  };

  const doSpin = () => {
    if(spinning) return; setSpinning(true); setSpinResult(null);
    setSpinAngle(p => p + 1440 + Math.random()*1440);
    setTimeout(() => {
      const r = [{t:"100 Coins 🪙",c:100},{t:"200 Coins 🪙",c:200},{t:"JACKPOT 500! 🪙",c:500},{t:"50 XP ✨",c:0},{t:"Power-up ⚡",c:25},{t:"150 Coins 🪙",c:150}][Math.floor(Math.random()*6)];
      setSpinResult(r); if(r.c) setCoins(c=>c+r.c); setSpinning(false); notify(`🎰 ${r.t}`, r.c>200?C.gold:C.cyan);
    }, 3500);
  };

  const wcDays = Math.max(0, Math.floor((new Date("2026-06-11") - new Date()) / 86400000));
  const friendsOnline = 3 + (tick % 5);
  const playersNow = 1247 + (tick % 13) * 7;

  const tc = { control:C.cyan, arena:C.cyan, live:C.pink, me:C.purple };

  // ═══ SMALL COMPONENTS ═══
  const Pill = ({children,active,color,onClick,s}) => (
    <div onClick={onClick} style={{padding:s?"5px 12px":"8px 16px",borderRadius:100,cursor:"pointer",
      background:active?`${color}18`:`${C.text3}06`,border:`1px solid ${active?color+"40":C.border}`,
      color:active?color:C.text3,fontSize:s?11:12,fontWeight:700,letterSpacing:.5,transition:"all .25s",whiteSpace:"nowrap"}}>{children}</div>
  );
  const Tag = ({color,children}) => (
    <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:4,background:`${color}15`,color,fontSize:10,fontWeight:700,letterSpacing:.5}}>{children}</span>
  );

  // ═══════════════════════════════════════
  // INPUT METHOD SELECTOR — HEADER BUTTON
  // ═══════════════════════════════════════
  const activeInput = getActiveInputInfo();

  const renderInputHeaderButton = () => (
    <div
      onClick={() => setShowInputPanel(true)}
      style={{
        display:"flex", alignItems:"center", gap:5,
        padding:"3px 10px", borderRadius:100, cursor:"pointer",
        background:`${activeInput.color}10`,
        border:`1px solid ${activeInput.color}${inputPulse?"60":"25"}`,
        transition:"all .3s",
        boxShadow: inputPulse ? `0 0 12px ${activeInput.color}30` : "none",
        animation: inputPulse ? "inputGlow .6s ease" : "none",
      }}
    >
      <span style={{fontSize:12}}>{activeInput.icon}</span>
      <span style={{fontSize:10,fontWeight:700,color:activeInput.color,letterSpacing:.3}}>{activeInput.label}</span>
      <span style={{fontSize:8,color:C.text3,marginLeft:1}}>▼</span>
    </div>
  );

  // ═══════════════════════════════════════
  // INPUT METHOD BOTTOM SHEET
  // ═══════════════════════════════════════
  const renderInputPanel = () => {
    if (!showInputPanel) return null;
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:250,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        {/* Backdrop */}
        <div onClick={()=>setShowInputPanel(false)} style={{position:"absolute",inset:0,background:"rgba(6,8,15,0.75)",backdropFilter:"blur(6px)"}} />
        {/* Sheet */}
        <div style={{
          position:"relative",maxWidth:420,margin:"0 auto",width:"100%",
          background:`linear-gradient(180deg, #0D1225, ${C.bg})`,
          borderRadius:"24px 24px 0 0",
          border:`1px solid ${C.border2}`,borderBottom:"none",
          padding:"8px 20px 28px",
          animation:"sheetUp .3s ease",
        }}>
          {/* Handle */}
          <div style={{width:40,height:4,borderRadius:2,background:C.text3+"40",margin:"0 auto 18px"}} />

          {/* Title */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div>
              <div style={{fontSize:16,fontWeight:900,color:C.text,letterSpacing:-.3}}>Device Input Method</div>
              <div style={{fontSize:11,color:C.text3,marginTop:2}}>Áp dụng cho Arena Games + Live Shows</div>
            </div>
            <div onClick={()=>setShowInputPanel(false)} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:C.bg3,border:`1px solid ${C.border}`,fontSize:13,color:C.text3}}>✕</div>
          </div>

          {/* Mode Selection */}
          <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:1.5,marginBottom:8}}>INPUT MODE</div>
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {INPUT_MODES.map(m => (
              <div key={m.id} onClick={()=>{setInputMode(m.id);triggerInputPulse();if(m.id!=="ask")setSessionInput(null);}} style={{
                flex:1, padding:"12px 8px", borderRadius:14, cursor:"pointer", textAlign:"center",
                background: inputMode===m.id ? `${m.color}12` : C.bg3,
                border: `1.5px solid ${inputMode===m.id ? m.color+"50" : C.border}`,
                transition:"all .25s",
              }}>
                <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
                <div style={{fontSize:12,fontWeight:800,color:inputMode===m.id?m.color:C.text2}}>{m.label}</div>
                <div style={{fontSize:8,color:C.text3,marginTop:3,lineHeight:1.3}}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Primary Input Selection — only show for Fixed mode */}
          {inputMode === "fixed" && (
            <>
              <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:1.5,marginBottom:8}}>PRIMARY INPUT</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                {INPUT_TYPES.map(t => (
                  <div key={t.id} onClick={()=>{setPrimaryInput(t.id);triggerInputPulse();}} style={{
                    padding:"12px 14px", borderRadius:12, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:12,
                    background: primaryInput===t.id ? `${t.color}10` : C.bg3,
                    border: `1.5px solid ${primaryInput===t.id ? t.color+"45" : C.border}`,
                    transition:"all .25s",
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
                      background:`${t.color}15`, border:`1px solid ${t.color}25`, fontSize:18,
                    }}>{t.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:primaryInput===t.id?t.color:C.text}}>{t.label}</div>
                      <div style={{fontSize:10,color:C.text3,marginTop:1}}>{t.desc}</div>
                    </div>
                    {primaryInput===t.id && (
                      <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:t.color,fontSize:11,color:"#000",fontWeight:900}}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* On-Screen Tap Toggle */}
          <div style={{
            padding:"12px 14px", borderRadius:12,
            background: C.bg3, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", gap:12, marginBottom:14,
          }}>
            <div style={{
              width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
              background:`${C.text3}10`, fontSize:18,
            }}>👆</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text}}>On-Screen Tap</div>
              <div style={{fontSize:10,color:C.text3,marginTop:1}}>Bổ sung · Không thay thế device input</div>
            </div>
            <div onClick={()=>{setTapEnabled(!tapEnabled);triggerInputPulse();}} style={{
              width:44, height:24, borderRadius:12, cursor:"pointer", padding:2,
              background: tapEnabled ? C.green : C.text3+"30",
              transition:"all .25s", display:"flex", alignItems:"center",
              justifyContent: tapEnabled ? "flex-end" : "flex-start",
            }}>
              <div style={{width:20,height:20,borderRadius:10,background:"#fff",transition:"all .25s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}} />
            </div>
          </div>

          {/* Current config summary */}
          <div style={{
            padding:"10px 14px", borderRadius:10,
            background:`${activeInput.color}06`, border:`1px solid ${activeInput.color}15`,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{fontSize:14}}>{activeInput.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:activeInput.color}}>
                {inputMode === "auto" && "Auto sẽ chọn input tối ưu cho mỗi game"}
                {inputMode === "fixed" && `Luôn dùng ${INPUT_TYPES.find(t=>t.id===primaryInput)?.label} · Fallback nếu game không support`}
                {inputMode === "ask" && "Sẽ hỏi bạn chọn trước mỗi game/session"}
              </div>
              <div style={{fontSize:9,color:C.text3,marginTop:2}}>
                Tap: {tapEnabled ? "ON" : "OFF"} · Áp dụng Arena + Live
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // ASK EVERY GAME PROMPT
  // ═══════════════════════════════════════
  const renderAskPrompt = () => {
    if (!showAskPrompt) return null;
    const game = showAskPrompt;
    const supported = game?.inputs || ["puff"];
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:260,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div onClick={()=>{setShowAskPrompt(null);window._inputCallback=null;}} style={{position:"absolute",inset:0,background:"rgba(6,8,15,0.8)",backdropFilter:"blur(8px)"}} />
        <div style={{
          position:"relative", width:"90%", maxWidth:360,
          background:`linear-gradient(135deg, #0D1225, ${C.bg2})`,
          borderRadius:24, border:`1px solid ${C.border2}`,
          padding:"24px 20px", animation:"fadeSlide .3s ease",
        }}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:36,marginBottom:8}}>{game.emoji}</div>
            <div style={{fontSize:16,fontWeight:900,color:C.text}}>{game.name}</div>
            <div style={{fontSize:12,color:C.text3,marginTop:4}}>Chọn input method cho game này</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {INPUT_TYPES.filter(t => {
              // Show puff and dry_puff if game supports puff
              if (t.id === "puff" || t.id === "dry_puff") return supported.includes("puff");
              return supported.includes(t.id);
            }).map(t => (
              <div key={t.id} onClick={()=>handleAskPick(t.id)} style={{
                padding:"14px 16px", borderRadius:14, cursor:"pointer",
                display:"flex", alignItems:"center", gap:12,
                background:`${t.color}08`, border:`1.5px solid ${t.color}25`,
                transition:"all .2s",
              }}>
                <div style={{fontSize:24}}>{t.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:t.color}}>{t.label}</div>
                  <div style={{fontSize:10,color:C.text3}}>{t.desc}</div>
                </div>
                <div style={{fontSize:13,color:C.text3}}>→</div>
              </div>
            ))}
          </div>
          {tapEnabled && (
            <div style={{marginTop:12,textAlign:"center",fontSize:10,color:C.text3}}>
              👆 On-screen Tap: <span style={{color:C.green,fontWeight:700}}>ON</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // ACTIVE INPUT INDICATOR (in-game HUD)
  // ═══════════════════════════════════════
  const renderActiveInputHUD = () => {
    const info = getActiveInputInfo();
    const ai = gameActive?.activeInput;
    const resolved = ai ? INPUT_TYPES.find(t=>t.id===ai) : null;
    const display = resolved || { icon:info.icon, label:info.label, color:info.color };
    return (
      <div style={{
        display:"inline-flex", alignItems:"center", gap:5,
        padding:"4px 10px", borderRadius:8,
        background:`${display.color}10`, border:`1px solid ${display.color}25`,
        fontSize:10, fontWeight:700, color:display.color,
      }}>
        <span style={{fontSize:13}}>{display.icon}</span>
        {display.label}
        {tapEnabled && <span style={{color:C.text3,marginLeft:2}}>+ 👆</span>}
      </div>
    );
  };

  // ═══════════════════════════════════════
  // ARENA HOME — THE WOW SCREEN
  // ═══════════════════════════════════════
  const renderArenaHome = () => (
    <div style={{padding:"0 16px"}}>

      {/* ── HERO CAROUSEL ── */}
      <div style={{position:"relative",marginBottom:20,borderRadius:20,overflow:"hidden",height:175}}>
        {/* Banner 0: World Cup */}
        <div style={{
          position:"absolute",inset:0,transition:"opacity .8s, transform .8s",
          opacity:heroBanner===0?1:0, transform:heroBanner===0?"scale(1)":"scale(1.05)",
          background:`linear-gradient(135deg, #1a0a2e, #0a1628 40%, #0c2a1a 100%)`,
          padding:"20px",display:"flex",flexDirection:"column",justifyContent:"space-between",
        }}>
          <div style={{position:"absolute",top:-30,right:-30,fontSize:120,opacity:.06}}>⚽</div>
          <div style={{position:"absolute",bottom:-20,left:-20,fontSize:80,opacity:.04}}>🏆</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{padding:"3px 8px",borderRadius:4,background:`${C.red}30`,fontSize:9,fontWeight:800,color:C.red,letterSpacing:1}}>⬤ LIVE EVENT</div>
              <div style={{fontSize:10,color:C.text3}}>FIFA World Cup 2026</div>
            </div>
            <div style={{fontSize:22,fontWeight:900,color:C.text,lineHeight:1.2,marginBottom:4}}>
              🇺🇸 USA vs Mexico 🇲🇽
            </div>
            <div style={{fontSize:12,color:C.gold,fontWeight:600}}>Tối nay 9:00 PM · Group A · {playersNow.toLocaleString()} đang predict</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>{setArenaView("predict");}} style={{
              padding:"8px 16px",borderRadius:10,cursor:"pointer",
              background:`linear-gradient(135deg,${C.lime}30,${C.lime}12)`,border:`1px solid ${C.lime}35`,
              fontSize:12,fontWeight:800,color:C.lime,
            }}>◆ Predict Now</div>
            <div onClick={()=>{setTab("live");setLiveTab("watch");}} style={{
              padding:"8px 16px",borderRadius:10,cursor:"pointer",
              background:`${C.text3}10`,border:`1px solid ${C.border}`,
              fontSize:12,fontWeight:600,color:C.text2,
            }}>📺 Watch Party</div>
          </div>
        </div>

        {/* Banner 1: Game Show Live */}
        <div style={{
          position:"absolute",inset:0,transition:"opacity .8s, transform .8s",
          opacity:heroBanner===1?1:0, transform:heroBanner===1?"scale(1)":"scale(1.05)",
          background:`linear-gradient(135deg, #2a1a0a, #1a1028 50%, #0a1628 100%)`,
          padding:"20px",display:"flex",flexDirection:"column",justifyContent:"space-between",
        }}>
          <div style={{position:"absolute",top:-20,right:-10,fontSize:100,opacity:.06}}>🧠</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{padding:"3px 8px",borderRadius:4,background:`${C.gold}25`,fontSize:9,fontWeight:800,color:C.gold,letterSpacing:1}}>★ SHOW</div>
              <div style={{fontSize:10,color:C.text3}}>Starting in 2 hours</div>
            </div>
            <div style={{fontSize:22,fontWeight:900,color:C.text,lineHeight:1.2,marginBottom:4}}>
              Vibe Check — WC Edition 🧠
            </div>
            <div style={{fontSize:12,color:C.gold,fontWeight:600}}>Host: MC Tuấn · 1,247 registered · Top prize: 5,000 coins</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setShowVibeCheck(true)} style={{
              padding:"8px 16px",borderRadius:10,cursor:"pointer",
              background:`linear-gradient(135deg,${C.gold}30,${C.gold}12)`,border:`1px solid ${C.gold}35`,
              fontSize:12,fontWeight:800,color:C.gold,
            }}>★ Join Show</div>
            <div onClick={()=>notify("🔔 Reminder set!",C.gold)} style={{
              padding:"8px 16px",borderRadius:10,cursor:"pointer",
              background:`${C.text3}10`,border:`1px solid ${C.border}`,
              fontSize:12,fontWeight:600,color:C.text2,
            }}>🔔 Remind Me</div>
          </div>
        </div>

        {/* Banner 2: Tournament */}
        <div style={{
          position:"absolute",inset:0,transition:"opacity .8s, transform .8s",
          opacity:heroBanner===2?1:0, transform:heroBanner===2?"scale(1)":"scale(1.05)",
          background:`linear-gradient(135deg, #0a2028, #0a1428 50%, #1a0a28 100%)`,
          padding:"20px",display:"flex",flexDirection:"column",justifyContent:"space-between",
        }}>
          <div style={{position:"absolute",top:-20,right:-20,fontSize:100,opacity:.06}}>⚽</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{padding:"3px 8px",borderRadius:4,background:`${C.cyan}25`,fontSize:9,fontWeight:800,color:C.cyan,letterSpacing:1}}>▶ TOURNAMENT</div>
              <div style={{fontSize:10,color:C.text3}}>Round of 16</div>
            </div>
            <div style={{fontSize:22,fontWeight:900,color:C.text,lineHeight:1.2,marginBottom:4}}>
              Final Kick WC Tournament ⚽
            </div>
            <div style={{fontSize:12,color:C.cyan,fontWeight:600}}>64 players · Your rank: #12 · Next match in 45 min</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>{const g=PLAY_GAMES[0];setSelectedGame(g);}} style={{
              padding:"8px 16px",borderRadius:10,cursor:"pointer",
              background:`linear-gradient(135deg,${C.cyan}30,${C.cyan}12)`,border:`1px solid ${C.cyan}35`,
              fontSize:12,fontWeight:800,color:C.cyan,
            }}>▶ Play Match</div>
          </div>
        </div>

        {/* Dots */}
        <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6,zIndex:2}}>
          {[0,1,2].map(i=>(
            <div key={i} onClick={()=>setHeroBanner(i)} style={{
              width:i===heroBanner?20:6,height:6,borderRadius:3,cursor:"pointer",
              background:i===heroBanner?C.text:`${C.text3}40`,transition:"all .4s",
            }} />
          ))}
        </div>
      </div>

      {/* ── YOUR STATUS ROW ── */}
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <div style={{flex:1,padding:"12px",borderRadius:14,background:`linear-gradient(135deg,${C.gold}08,${C.bg2})`,border:`1px solid ${C.gold}15`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>🔥</div>
          <div><div style={{fontFamily:"monospace",fontSize:18,fontWeight:900,color:C.gold}}>5</div><div style={{fontSize:9,color:C.text3,letterSpacing:1}}>WIN STREAK</div></div>
        </div>
        <div style={{flex:1,padding:"12px",borderRadius:14,background:`linear-gradient(135deg,${C.purple}08,${C.bg2})`,border:`1px solid ${C.purple}15`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>⭐</div>
          <div><div style={{fontFamily:"monospace",fontSize:18,fontWeight:900,color:C.purple}}>Lv.{USER.level}</div><div style={{fontSize:9,color:C.text3,letterSpacing:1}}>{USER.tier.toUpperCase()}</div></div>
        </div>
        <div style={{flex:1,padding:"12px",borderRadius:14,background:`linear-gradient(135deg,${C.green}08,${C.bg2})`,border:`1px solid ${C.green}15`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>👥</div>
          <div><div style={{fontFamily:"monospace",fontSize:18,fontWeight:900,color:C.green}}>{friendsOnline}</div><div style={{fontSize:9,color:C.text3,letterSpacing:1}}>ONLINE</div></div>
        </div>
      </div>

      {/* ── LIVE ACTIVITY ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>⚡ Happening Now</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}} />
            <span style={{fontSize:11,color:C.green,fontWeight:600}}>{playersNow.toLocaleString()} playing</span>
          </div>
        </div>
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,margin:"0 -16px",padding:"0 16px 4px"}}>
          <div onClick={()=>setShowVibeCheck(true)} style={{minWidth:200,padding:"14px",borderRadius:14,cursor:"pointer",flexShrink:0,background:`linear-gradient(135deg,${C.gold}0A,${C.bg2})`,border:`1px solid ${C.gold}20`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}} /><span style={{fontSize:10,fontWeight:700,color:C.red}}>LIVE</span><span style={{fontSize:10,color:C.text3}}>· 1,247 watching</span>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>🧠 Vibe Check</div>
            <div style={{fontSize:11,color:C.gold}}>WC Edition · MC Tuấn</div>
          </div>
          <div onClick={()=>{const g=PLAY_GAMES[0];setSelectedGame(g);}} style={{minWidth:200,padding:"14px",borderRadius:14,cursor:"pointer",flexShrink:0,background:`linear-gradient(135deg,${C.cyan}0A,${C.bg2})`,border:`1px solid ${C.cyan}20`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.cyan,animation:"pulse 1.5s infinite"}} /><span style={{fontSize:10,fontWeight:700,color:C.cyan}}>TOURNAMENT</span><span style={{fontSize:10,color:C.text3}}>· R16</span>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>⚽ Final Kick</div>
            <div style={{fontSize:11,color:C.cyan}}>Your rank: #12 · 856 playing</div>
          </div>
          <div onClick={()=>{setTab("live");setLiveTab("watch");}} style={{minWidth:200,padding:"14px",borderRadius:14,cursor:"pointer",flexShrink:0,background:`linear-gradient(135deg,${C.lime}0A,${C.bg2})`,border:`1px solid ${C.lime}20`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}} /><span style={{fontSize:10,fontWeight:700,color:C.red}}>LIVE</span><span style={{fontSize:10,color:C.text3}}>· 3,421 watching</span>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>📺 Watch Party</div>
            <div style={{fontSize:11,color:C.lime}}>USA vs Mexico · {liveScore.min + Math.floor(tick/3)%10}'</div>
          </div>
        </div>
      </div>

      {/* ── QUICK PLAY ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>▶ Quick Play</div>
          <div onClick={()=>setArenaView("play")} style={{fontSize:12,color:C.cyan,cursor:"pointer",fontWeight:600}}>See all 8 →</div>
        </div>
        <div style={{display:"flex",gap:10,overflowX:"auto",margin:"0 -16px",padding:"0 16px 4px"}}>
          {PLAY_GAMES.filter(g=>g.hot).map(g=>(
            <div key={g.id} onClick={()=>setSelectedGame(g)} style={{
              minWidth:130,padding:"16px 14px",borderRadius:16,cursor:"pointer",textAlign:"center",flexShrink:0,
              background:C.bg2,border:`1px solid ${C.border}`,transition:"all .3s",position:"relative",
            }}>
              <div style={{fontSize:36,marginBottom:8}}>{g.emoji}</div>
              <div style={{fontSize:14,fontWeight:800,color:C.text}}>{g.name}</div>
              <div style={{fontSize:10,color:g.color,marginTop:4}}>👥 {g.players} · {g.time}</div>
              <div style={{position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}} />
            </div>
          ))}
        </div>
      </div>

      {/* ── TODAY'S PREDICTIONS ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>◆ Today's Predictions</div>
          <div onClick={()=>setArenaView("predict")} style={{fontSize:12,color:C.lime,cursor:"pointer",fontWeight:600}}>See all →</div>
        </div>

      {/* ── LIVE TOURNAMENTS ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>🏆 Live Tournaments</div>
          <div style={{padding:"2px 8px",borderRadius:4,background:`${C.red}20`,fontSize:9,fontWeight:800,color:C.red}}>🔥 HOT</div>
        </div>
        {tournaments.map(t => {
          const spotsLeft = t.max - t.current;
          const pct = (t.current / t.max) * 100;
          return (
            <div key={t.id} style={{
              padding:"14px 16px",borderRadius:14,marginBottom:8,position:"relative",overflow:"hidden",
              background:t.hot?`linear-gradient(135deg,${C.red}06,${C.bg2})`:C.bg2,
              border:`1px solid ${t.hot?C.red+"20":C.border}`,
            }}>
              {t.hot && spotsLeft < 10 && (
                <div style={{position:"absolute",top:8,right:10,padding:"2px 8px",borderRadius:4,background:`${C.red}25`,fontSize:9,fontWeight:800,color:C.red,animation:"pulse 1s infinite"}}>
                  ⚡ {spotsLeft} SPOTS!
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,paddingRight:spotsLeft<10?70:0}}>{t.name}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.gold}}>🪙 {t.prize}</div>
              </div>
              {/* Progress bar */}
              <div style={{height:6,borderRadius:3,background:C.bg3,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:pct>90?`linear-gradient(90deg,${C.red},${C.orange})`:`linear-gradient(90deg,${C.cyan},${C.green})`,transition:"width 1s"}} />
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:C.text3}}>{t.current}/{t.max} players · ⏱ {t.time}</span>
                <div onClick={()=>{
                  if(spotsLeft<=0){notify("🔒 Tournament full!",C.red);return;}
                  notify(`⚡ Joined ${t.name}!`,C.gold);setCoins(c=>c-50);
                }} style={{
                  padding:"5px 14px",borderRadius:8,cursor:spotsLeft>0?"pointer":"default",
                  background:spotsLeft>0?`linear-gradient(135deg,${C.gold}25,${C.gold}10)`:`${C.text3}10`,
                  border:`1px solid ${spotsLeft>0?C.gold+"30":C.text3+"20"}`,
                  fontSize:11,fontWeight:700,color:spotsLeft>0?C.gold:C.text3,
                }}>
                  {spotsLeft<=0?"🔒 Full":"⚡ Join"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
        {MATCHES.slice(0,2).map(m=>(
          <div key={m.id} style={{
            padding:"14px 16px",borderRadius:14,marginBottom:10,
            background:predictLocked[m.id]?`${C.lime}05`:C.bg2,
            border:`1px solid ${predictLocked[m.id]?C.lime+"25":C.border}`,position:"relative",
          }}>
            {m.hot && <div style={{position:"absolute",top:10,right:12,padding:"2px 6px",borderRadius:4,background:`${C.red}20`,fontSize:9,fontWeight:700,color:C.red}}>🔥 HOT</div>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <Tag color={C.text2}>Group {m.group}</Tag>
              <span style={{fontSize:11,color:C.text3}}>{m.time}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:10}}>
              <span style={{fontSize:16,fontWeight:700,color:C.text,textAlign:"right",flex:1}}>{m.home}</span>
              <span style={{fontSize:11,color:C.text3,fontWeight:800}}>VS</span>
              <span style={{fontSize:16,fontWeight:700,color:C.text,textAlign:"left",flex:1}}>{m.away}</span>
            </div>
            {predictLocked[m.id] ? (
              <div style={{textAlign:"center",padding:"6px",borderRadius:8,background:`${C.lime}10`}}>
                <span style={{fontSize:12,fontWeight:700,color:C.lime}}>✓ {predictLocked[m.id].pick} · {predictLocked[m.id].bet} coins</span>
              </div>
            ) : (
              <div>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  {["Home","Draw","Away"].map((o,j)=>(
                    <div key={j} onClick={()=>{setSelectedMatch(m.id);setSelectedOutcome(j);}} style={{
                      flex:1,padding:"7px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                      background:selectedMatch===m.id&&selectedOutcome===j?`${C.lime}15`:`${C.text3}06`,
                      border:`1px solid ${selectedMatch===m.id&&selectedOutcome===j?C.lime+"40":C.border}`,transition:"all .2s",
                    }}>
                      <div style={{fontSize:11,fontWeight:600,color:selectedMatch===m.id&&selectedOutcome===j?C.lime:C.text2}}>{o}</div>
                      <div style={{fontSize:14,fontWeight:800,color:selectedMatch===m.id&&selectedOutcome===j?C.lime:C.text,marginTop:1}}>×{m.odds[j]}</div>
                    </div>
                  ))}
                </div>
                {selectedMatch===m.id && selectedOutcome!==null && (
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:C.bg3,borderRadius:8,padding:"6px 10px"}}>
                      <span style={{fontSize:11,color:C.text3}}>🪙</span>
                      <input type="number" value={betAmount} onChange={e=>setBetAmount(Math.max(10,+e.target.value))}
                        style={{background:"none",border:"none",color:C.lime,fontSize:14,fontWeight:700,width:60,outline:"none",fontFamily:"monospace"}} />
                    </div>
                    <div onClick={()=>puffLockIn(()=>{
                      setPredictLocked(p=>({...p,[m.id]:{pick:["Home","Draw","Away"][selectedOutcome],bet:betAmount}}));
                      setCoins(c=>c-betAmount);setXp(x=>x+15);setSelectedMatch(null);setSelectedOutcome(null);
                    })} style={{
                      padding:"10px 18px",borderRadius:10,cursor:"pointer",
                      background:`linear-gradient(135deg,${C.lime}30,${C.lime}12)`,border:`1px solid ${C.lime}40`,
                      color:C.lime,fontSize:12,fontWeight:800,
                    }}>💨 Lock In</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── DAILY PICKS ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>📅 Daily Picks</div>
          <div style={{fontSize:11,color:C.orange,fontWeight:700}}>🔥 Streak: 5 ngày</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[{q:"LA temp?",a:["Over 80°F","Under 80°F"]},{q:"PL goals?",a:[">25","<25"]},{q:"Billboard #1?",a:["Male","Female"]}].map((dp,i)=>(
            <div key={i} style={{flex:1,padding:"12px 10px",borderRadius:12,background:dailyPicks[i]!==null?`${C.lime}06`:C.bg2,border:`1px solid ${dailyPicks[i]!==null?C.lime+"20":C.border}`}}>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.4}}>{dp.q}</div>
              {dp.a.map((a,j)=>(
                <div key={j} onClick={()=>{
                  if(dailyPicks[i]!==null) return;
                  const n=[...dailyPicks];n[i]=j;setDailyPicks(n);
                  puffLockIn(()=>{setCoins(c=>c+20);setXp(x=>x+10);});
                }} style={{
                  padding:"5px",borderRadius:6,textAlign:"center",cursor:dailyPicks[i]!==null?"default":"pointer",
                  marginBottom:4,fontSize:11,fontWeight:600,
                  background:dailyPicks[i]===j?`${C.lime}15`:`${C.text3}08`,
                  border:`1px solid ${dailyPicks[i]===j?C.lime+"35":C.border}`,
                  color:dailyPicks[i]===j?C.lime:C.text2,transition:"all .2s",
                }}>{dailyPicks[i]===j?"✓ ":""}{a}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── GAME SHOWS ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>★ Game Shows</div>
          <div onClick={()=>setArenaView("show")} style={{fontSize:12,color:C.gold,cursor:"pointer",fontWeight:600}}>See all 4 →</div>
        </div>
        <div style={{display:"flex",gap:10,overflowX:"auto",margin:"0 -16px",padding:"0 16px 4px"}}>
          {SHOW_GAMES.map(g=>(
            <div key={g.id} onClick={()=>{
              if(g.id==="vibecheck") setShowVibeCheck(true);
              else if(g.id==="spinwin") { setSelectedGame(g); doSpin(); }
              else notify(`${g.name} — tap to join!`,g.color);
            }} style={{
              minWidth:160,padding:"16px 14px",borderRadius:16,cursor:"pointer",flexShrink:0,
              background:`linear-gradient(135deg,${g.color}08,${C.bg2})`,border:`1px solid ${g.color}15`,transition:"all .3s",
            }}>
              <div style={{fontSize:30,marginBottom:8}}>{g.emoji}</div>
              <div style={{fontSize:14,fontWeight:800,color:C.text}}>{g.name}</div>
              <div style={{fontSize:10,color:g.color,marginTop:4}}>{g.type} · {g.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEADERBOARD ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>🏅 Leaderboard</div>
          <div style={{display:"flex",gap:4}}>
            {[{id:"global",l:"🌍"},{id:"friends",l:"👥"},{id:"weekly",l:"📅"}].map(t=>(
              <div key={t.id} onClick={()=>setLbTab(t.id)} style={{
                width:30,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",fontSize:13,
                background:lbTab===t.id?`${C.gold}15`:`${C.text3}08`,
                border:`1px solid ${lbTab===t.id?C.gold+"30":C.border}`,
                transition:"all .2s",
              }}>{t.l}</div>
            ))}
          </div>
        </div>
        <div style={{borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,background:C.bg2}}>
          {LEADERBOARD.map((p,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
              borderBottom:i<LEADERBOARD.length-1?`1px solid ${C.border}`:"none",
              background:p.isYou?`${C.cyan}08`:"transparent",
              transition:"all .3s",
            }}>
              <div style={{
                width:26,height:26,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:typeof p.place==="string"&&p.place.length>1?14:12,
                fontWeight:800,color:p.color||C.text3,
                background:p.color?`${p.color}15`:`${C.text3}08`,
              }}>{p.place}</div>
              <div style={{fontSize:18}}>{p.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:p.isYou?C.cyan:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{fontSize:10,color:C.text3}}>🔥 {p.streak} streak</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"monospace",fontSize:13,fontWeight:800,color:p.isYou?C.cyan:C.text2}}>{(p.score/1000).toFixed(0)}K</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WORLD CUP ZONE ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:10}}>🏆 World Cup 2026 Zone</div>
        <div style={{padding:"16px",borderRadius:16,background:`linear-gradient(135deg, ${C.gold}06, ${C.pink}04, ${C.bg2})`,border:`1px solid ${C.gold}15`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:900,color:C.gold}}>FIFA World Cup 2026</div>
              <div style={{fontSize:11,color:C.text3}}>48 đội · 104 trận · 16 thành phố</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:20,fontWeight:900,color:C.pink}}>{wcDays}</div>
              <div style={{fontSize:9,color:C.text3,letterSpacing:1}}>DAYS</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {[{label:"Bracket",emoji:"🗓️",color:C.lime},{label:"Golden Boot",emoji:"⭐",color:C.gold},{label:"Leaderboard",emoji:"🌍",color:C.cyan},{label:"WC Pass",emoji:"🎫",color:C.pink}].map((f,i)=>(
              <div key={i} onClick={()=>notify(`${f.label} — Coming soon!`,f.color)} style={{padding:"10px 4px",borderRadius:10,textAlign:"center",cursor:"pointer",background:`${f.color}08`,border:`1px solid ${f.color}15`,transition:"all .3s"}}>
                <div style={{fontSize:20,marginBottom:2}}>{f.emoji}</div>
                <div style={{fontSize:9,fontWeight:700,color:f.color}}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FRIENDS ACTIVITY ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:10}}>👥 Friends Activity</div>
        {[
          {name:"Minh Anh",action:"just won Final Kick 🏆",time:"2m ago",emoji:"⚽"},
          {name:"Hà Linh",action:"predicted USA vs Mexico",time:"5m ago",emoji:"◆"},
          {name:"Đức Trung",action:"is playing Balloon Pop",time:"now",emoji:"🎈",live:true},
        ].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
            <div style={{width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`${C.purple}10`,border:`1px solid ${C.purple}20`,fontSize:16}}>{f.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:C.text}}><strong>{f.name}</strong> <span style={{color:C.text3}}>{f.action}</span></div>
              <div style={{fontSize:10,color:C.text3,marginTop:1}}>{f.time}</div>
            </div>
            {f.live && (
              <div onClick={()=>notify("👀 Spectating...",C.cyan)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:`${C.cyan}10`,border:`1px solid ${C.cyan}20`,fontSize:10,fontWeight:700,color:C.cyan}}>Watch</div>
            )}
          </div>
        ))}
      </div>

      {/* ── LIVE CHAT ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text}}>💬 Live Chat</div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}} />
              <span style={{fontSize:10,color:C.green,fontWeight:600}}>{playersNow.toLocaleString()}</span>
            </div>
          </div>
          <div onClick={()=>setChatExpanded(!chatExpanded)} style={{fontSize:11,color:C.cyan,cursor:"pointer",fontWeight:600}}>
            {chatExpanded?"Collapse ↑":"Expand ↓"}
          </div>
        </div>
        <div style={{borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,background:C.bg2}}>
          {/* Chat messages */}
          <div ref={chatRef} style={{
            padding:"10px 14px",maxHeight:chatExpanded?240:120,overflow:"auto",
            transition:"max-height .3s ease",
          }}>
            {chatMessages.slice(chatExpanded?-15:-6).map((m,i)=>(
              <div key={i} style={{
                marginBottom:6,padding:m.isYou?"4px 8px 4px 0":"0",
                borderLeft:m.isYou?`2px solid ${C.cyan}`:"none",
                paddingLeft:m.isYou?8:0,
              }}>
                <span style={{fontSize:11,fontWeight:700,color:m.c||C.text2}}>{m.u}</span>
                <span style={{fontSize:11,color:m.isYou?C.text:C.text2,marginLeft:6}}>{m.m}</span>
              </div>
            ))}
          </div>
          {/* Emoji reactions */}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderTop:`1px solid ${C.border}`,background:C.bg3}}>
            {["🔥","😂","🤯","👏","💀","❤️","⚽","🏆"].map((e,i)=>(
              <div key={i} onClick={()=>sendChat(e)} style={{
                width:30,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,cursor:"pointer",background:`${C.text3}08`,border:`1px solid ${C.border}`,
                transition:"all .15s",
              }}>{e}</div>
            ))}
          </div>
          {/* Chat input */}
          <div style={{display:"flex",gap:6,padding:"8px 10px",borderTop:`1px solid ${C.border}`,background:C.bg3}}>
            <input
              type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")sendChat();}}
              placeholder="Say something..."
              style={{
                flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.border}`,
                background:C.bg2,color:C.text,fontSize:12,outline:"none",
                fontFamily:"'Segoe UI',system-ui,sans-serif",
              }}
            />
            <div onClick={()=>sendChat()} style={{
              padding:"8px 14px",borderRadius:10,cursor:"pointer",
              background:`${C.cyan}15`,border:`1px solid ${C.cyan}25`,
              fontSize:12,fontWeight:700,color:C.cyan,
              display:"flex",alignItems:"center",
            }}>Send</div>
          </div>
        </div>
      </div>

      {/* ── BROWSE ALL ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:10}}>Browse</div>
        <div style={{display:"flex",gap:8}}>
          {[{id:"play",label:"▶ Play",sub:"8 games",color:C.cyan},{id:"show",label:"★ Show",sub:"4 shows",color:C.gold},{id:"predict",label:"◆ Predict",sub:"6 types",color:C.lime}].map(b=>(
            <div key={b.id} onClick={()=>setArenaView(b.id)} style={{flex:1,padding:"16px 10px",borderRadius:14,textAlign:"center",cursor:"pointer",background:`${b.color}06`,border:`1px solid ${b.color}15`,transition:"all .3s"}}>
              <div style={{fontSize:16,fontWeight:900,color:b.color}}>{b.label}</div>
              <div style={{fontSize:10,color:C.text3,marginTop:4}}>{b.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{height:80}} />
    </div>
  );

  // ═══ ARENA SUB-VIEWS ═══
  const renderArenaList = (type) => {
    const items = type==="play"?PLAY_GAMES:type==="show"?SHOW_GAMES:PREDICT_TYPES;
    const color = type==="play"?C.cyan:type==="show"?C.gold:C.lime;
    const label = type==="play"?"▶ Play — Action Mini-Games":type==="show"?"★ Show — Game Shows":"◆ Predict — Prediction & Betting";
    return (
      <div style={{padding:"0 16px"}}>
        <div onClick={()=>setArenaView("home")} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:16}}>
          <span style={{fontSize:16,color:C.text2}}>←</span><span style={{fontSize:13,color:C.text2,fontWeight:600}}>Arena Home</span>
        </div>
        <div style={{fontSize:18,fontWeight:900,color:C.text,marginBottom:4}}>{label}</div>
        <div style={{fontSize:12,color:C.text3,marginBottom:16}}>{items.length} {type==="predict"?"types":"games"}</div>
        <div style={{display:"grid",gridTemplateColumns:type==="predict"?"1fr 1fr":"1fr",gap:10}}>
          {items.map(g=>(
            <div key={g.id} onClick={()=>{
              if(type==="predict") notify(`${g.name}`,C.lime);
              else if(g.id==="vibecheck") setShowVibeCheck(true);
              else if(g.id==="spinwin"){setSelectedGame(g);doSpin();}
              else setSelectedGame(g);
            }} style={{
              padding:"16px",borderRadius:14,cursor:"pointer",
              background:C.bg2,border:`1px solid ${C.border}`,transition:"all .3s",
              display:type==="predict"?"block":"flex",alignItems:"center",gap:14,
            }}>
              <div style={{
                width:type==="predict"?"auto":50,height:type==="predict"?"auto":50,
                borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:28,background:type==="predict"?"none":`${(g.color||color)}10`,
                border:type==="predict"?"none":`1px solid ${(g.color||color)}20`,
                flexShrink:0,marginBottom:type==="predict"?6:0,
              }}>{g.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:C.text}}>{g.name}</div>
                <div style={{fontSize:12,color:C.text3,marginTop:2}}>{g.desc}</div>
                {g.players && (
                  <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                    <Tag color={g.color||color}>{g.type||"Predict"}</Tag>
                    <Tag color={C.text2}>👥 {g.players}</Tag>
                    <Tag color={C.text2}>⏱ {g.time}</Tag>
                    {/* Show supported inputs */}
                    {g.inputs && <Tag color={C.text3}>{g.inputs.map(i=>INPUT_TYPES.find(t=>t.id===i||t.id==="puff"&&i==="puff")?.icon||"💨").join(" ")}</Tag>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{height:80}} />
      </div>
    );
  };

  // ═══ CONTROL TAB ═══
  const renderControl = () => {
    const TK=[{name:"PURPLE HAZE",type:"THC · Sativa",color:"#a855f7"},{name:"DUTCH TREAT",type:"CBD · Hybrid",color:"#22c55e"}];
    const HL=["OFF","CHILL","MED","INTENSE"],HC=[C.text3,C.blue,C.green,C.orange];
    return (
      <div style={{padding:"0 16px"}}>
        <div style={{background:C.bg2,borderRadius:20,padding:"18px 14px",border:`1px solid ${C.border}`,marginBottom:16}}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {TK.map((t,i)=>(
              <div key={i} onClick={()=>{const h=[...controlHeat];h[i]=(h[i]+1)%4;setControlHeat(h);notify(`${t.name}: ${HL[(controlHeat[i]+1)%4]}`,HC[(controlHeat[i]+1)%4]);}} style={{
                flex:1,padding:"14px 12px",borderRadius:14,cursor:"pointer",background:`${t.color}0C`,border:`1.5px solid ${t.color}30`,
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:controlHeat[i]>0?t.color:C.text3}} />
                  <span style={{fontSize:10,fontWeight:700,color:HC[controlHeat[i]]}}>{HL[controlHeat[i]]}</span>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:C.text}}>{t.name}</div>
                <div style={{fontSize:10,color:C.text3,marginTop:2}}>{t.type}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            {[{l:"PUFFS",v:"047",c:C.cyan},{l:"VOLTAGE",v:"2.8V",c:C.orange},{l:"BATTERY",v:"78%",c:C.green}].map((s,i)=>(
              <div key={i} style={{flex:1,padding:"10px",borderRadius:10,textAlign:"center",background:`${s.c}08`,border:`1px solid ${s.c}15`}}>
                <div style={{fontFamily:"monospace",fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:C.text3,fontWeight:600,letterSpacing:1}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:C.text3,letterSpacing:2,marginBottom:10}}>MOOD MODES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {[{n:"Relax",e:"😌",c:C.blue},{n:"Focus",e:"🎯",c:C.gold},{n:"Energy",e:"⚡",c:C.green},{n:"Sleep",e:"🌙",c:C.purple},
            {n:"Social",e:"🎉",c:C.pink},{n:"Creative",e:"🎨",c:C.orange},{n:"Recovery",e:"💚",c:C.cyan},{n:"Custom",e:"⚙️",c:C.text2}].map((m,i)=>(
            <div key={i} onClick={()=>notify(`${m.n} Mode Active`,m.c)} style={{
              padding:"12px 4px",borderRadius:12,textAlign:"center",cursor:"pointer",
              background:`${m.c}08`,border:`1px solid ${m.c}20`,
            }}>
              <div style={{fontSize:20,marginBottom:4}}>{m.e}</div>
              <div style={{fontSize:10,fontWeight:600,color:m.c}}>{m.n}</div>
            </div>
          ))}
        </div>
        <div style={{height:80}} />
      </div>
    );
  };

  // ═══ LIVE TAB ═══
  const renderLive = () => (
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"now",l:"🔴 Live Now"},{id:"upcoming",l:"📅 Upcoming"},{id:"watch",l:"📺 Watch Party"}].map(t=>(
          <Pill key={t.id} active={liveTab===t.id} color={C.pink} onClick={()=>setLiveTab(t.id)}>{t.l}</Pill>
        ))}
      </div>
      {liveTab==="now" && [
        {t:"🧠 Vibe Check — WC Edition",h:"MC Tuấn",v:1247,c:C.gold,act:()=>setShowVibeCheck(true)},
        {t:"⚽ Final Kick Tournament — SF",h:"System",v:856,c:C.cyan,act:()=>notify("📡 Watching...",C.cyan)},
        {t:"📺 Watch Party: USA vs Mexico",h:"Community",v:3421,c:C.lime,act:()=>setLiveTab("watch")},
      ].map((s,i)=>(
        <div key={i} onClick={s.act} style={{
          padding:"16px",borderRadius:16,marginBottom:12,cursor:"pointer",
          background:`linear-gradient(135deg,${s.c}08,${C.bg2})`,border:`1px solid ${s.c}20`,position:"relative",
        }}>
          <div style={{position:"absolute",top:12,right:12,display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}} />
            <span style={{fontSize:10,fontWeight:700,color:C.red}}>LIVE</span>
          </div>
          <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:6,paddingRight:50}}>{s.t}</div>
          <div style={{display:"flex",gap:8}}>
            <Tag color={C.text2}>👁 {s.v.toLocaleString()}</Tag>
            <Tag color={C.text2}>🎤 {s.h}</Tag>
          </div>
        </div>
      ))}
      {liveTab==="upcoming" && [
        {t:"Spin & Win Mega Friday",time:"8:00 PM",h:"DJ Minh",e:"🎰"},
        {t:"Watch Party: BRA vs GER",time:"3:00 AM",h:"Community",e:"📺"},
        {t:"WC Trivia Special",time:"Tomorrow 7PM",h:"KOL Hà Anh",e:"🧠"},
      ].map((s,i)=>(
        <div key={i} style={{
          padding:"14px 16px",borderRadius:14,marginBottom:10,background:C.bg2,border:`1px solid ${C.border}`,
          display:"flex",alignItems:"center",gap:12,
        }}>
          <div style={{fontSize:28}}>{s.e}</div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{s.t}</div><div style={{fontSize:11,color:C.text3,marginTop:2}}>🎤 {s.h} · ⏰ {s.time}</div></div>
          <div onClick={()=>notify("🔔 Reminder set!",C.gold)} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",background:`${C.gold}12`,border:`1px solid ${C.gold}25`,fontSize:11,fontWeight:700,color:C.gold}}>🔔</div>
        </div>
      ))}
      {liveTab==="watch" && (
        <div>
          {/* Input method indicator for Live */}
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"8px 12px",borderRadius:10,marginBottom:12,
            background:`${activeInput.color}06`,border:`1px solid ${activeInput.color}15`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13}}>{activeInput.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:activeInput.color}}>Input: {activeInput.label}</span>
              {tapEnabled && <span style={{fontSize:9,color:C.text3}}>+ 👆</span>}
            </div>
            <div onClick={()=>setShowInputPanel(true)} style={{fontSize:9,color:C.text3,cursor:"pointer",textDecoration:"underline"}}>Change</div>
          </div>
          <div style={{padding:"20px",borderRadius:16,marginBottom:14,textAlign:"center",background:`linear-gradient(135deg,${C.lime}06,${C.bg2})`,border:`1px solid ${C.lime}20`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:12}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}} />
              <span style={{fontSize:10,fontWeight:700,color:C.red,letterSpacing:1}}>LIVE · {liveScore.min + Math.floor(tick/3)%10}'</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
              <div><div style={{fontSize:28}}>🇺🇸</div><div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:4}}>USA</div></div>
              <div style={{fontFamily:"monospace",fontSize:36,fontWeight:900,color:C.text,letterSpacing:4}}>{liveScore.home} — {liveScore.away}</div>
              <div><div style={{fontSize:28}}>🇲🇽</div><div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:4}}>MEX</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
              <div onClick={()=>{setLiveScore(s=>({...s,home:s.home+1}));notify("⚽ GOAL! USA!",C.lime);}} style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",background:`${C.lime}15`,border:`1px solid ${C.lime}30`,fontSize:11,fontWeight:700,color:C.lime}}>⚽ Sim Goal</div>
            </div>
          </div>
          <div style={{padding:"14px",borderRadius:12,marginBottom:14,background:`${C.lime}06`,border:`1px solid ${C.lime}15`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.lime,marginBottom:8}}>⚡ Quick Predict — Next Goal?</div>
            <div style={{display:"flex",gap:8}}>
              {["🇺🇸 USA","None","🇲🇽 MEX"].map((o,i)=>(
                <div key={i} onClick={()=>puffLockIn(()=>{setCoins(c=>c+10);})} style={{flex:1,padding:"8px",borderRadius:8,textAlign:"center",cursor:"pointer",background:C.bg3,border:`1px solid ${C.border}`,fontSize:11,fontWeight:600,color:C.text2}}>{o}</div>
              ))}
            </div>
          </div>
          <div style={{borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`}}>
            <div style={{padding:"10px 14px",background:C.bg3,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.text3,letterSpacing:1}}>💬 LIVE CHAT</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}} />
                <span style={{fontSize:10,color:C.green}}>{playersNow.toLocaleString()} online</span>
              </div>
            </div>
            <div style={{padding:"10px 14px",maxHeight:180,overflow:"auto",background:C.bg2}}>
              {chatMessages.slice(-10).map((m,i)=>(
                <div key={i} style={{marginBottom:6,borderLeft:m.isYou?`2px solid ${C.cyan}`:"none",paddingLeft:m.isYou?8:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:m.c||C.cyan}}>{m.u}</span>
                  <span style={{fontSize:11,color:m.isYou?C.text:C.text2,marginLeft:6}}>{m.m}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:4,padding:"6px 10px",borderTop:`1px solid ${C.border}`,background:C.bg3}}>
              {["⚽","🔥","😱","🎉","👏","💀"].map((e,i)=>(<div key={i} onClick={()=>sendChat(e)} style={{width:32,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,background:`${C.text3}10`,cursor:"pointer",border:`1px solid ${C.border}`}}>{e}</div>))}
            </div>
            <div style={{display:"flex",gap:6,padding:"8px 10px",background:C.bg3,borderTop:`1px solid ${C.border}`}}>
              <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")sendChat();}}
                placeholder="Say something..."
                style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg2,color:C.text,fontSize:12,outline:"none",fontFamily:"'Segoe UI',system-ui,sans-serif"}}
              />
              <div onClick={()=>sendChat()} style={{padding:"8px 14px",borderRadius:10,cursor:"pointer",background:`${C.cyan}15`,border:`1px solid ${C.cyan}25`,fontSize:12,color:C.cyan,fontWeight:700}}>Send</div>
            </div>
          </div>
        </div>
      )}
      <div style={{height:80}} />
    </div>
  );

  // ═══ ME TAB ═══
  const renderMe = () => (
    <div style={{padding:"0 16px"}}>
      <div style={{padding:"24px 20px",borderRadius:20,marginBottom:16,textAlign:"center",background:`linear-gradient(135deg,${C.purple}08,${C.cyan}06,${C.bg2})`,border:`1px solid ${C.purple}20`}}>
        <div style={{width:64,height:64,borderRadius:"50%",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,background:`${C.purple}15`,border:`2px solid ${C.purple}40`}}>😎</div>
        <div style={{fontSize:20,fontWeight:900,color:C.text}}>{USER.name}</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:6}}><Tag color={C.gold}>🏅 {USER.tier}</Tag><Tag color={C.purple}>Lv.{USER.level}</Tag></div>
        <div style={{marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.text3,marginBottom:4}}><span>XP</span><span>{xp.toLocaleString()}/{USER.xpNext.toLocaleString()}</span></div>
          <div style={{height:6,borderRadius:3,background:C.bg3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${(xp/USER.xpNext)*100}%`,background:`linear-gradient(90deg,${C.purple},${C.cyan})`,transition:"width .5s"}} /></div>
        </div>
        <div style={{marginTop:14,padding:"10px",borderRadius:10,background:`${C.gold}08`,border:`1px solid ${C.gold}15`}}>
          <div style={{fontFamily:"monospace",fontSize:24,fontWeight:900,color:C.gold}}>{coins.toLocaleString()}</div>
          <div style={{fontSize:10,color:C.text3,letterSpacing:1}}>COINS</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"stats",l:"📊 Stats"},{id:"badges",l:"🏅 Badges"},{id:"rewards",l:"🎁 Rewards"}].map(t=>(
          <Pill key={t.id} active={meTab===t.id} color={C.purple} onClick={()=>setMeTab(t.id)} s>{t.l}</Pill>
        ))}
      </div>
      {meTab==="stats" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[{l:"Wins",v:87,c:C.green,e:"🏆"},{l:"Losses",v:42,c:C.red,e:"💀"},{l:"Predictions",v:156,c:C.lime,e:"🔮"},{l:"Accuracy",v:"68%",c:C.gold,e:"🎯"}].map((s,i)=>(
              <div key={i} style={{padding:"16px",borderRadius:14,textAlign:"center",background:C.bg2,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.e}</div>
                <div style={{fontFamily:"monospace",fontSize:24,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:10,color:C.text3,fontWeight:600,letterSpacing:1,marginTop:2}}>{s.l.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"16px",borderRadius:14,background:C.bg2,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text3,letterSpacing:2,marginBottom:10}}>WIN RATE</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,height:8,borderRadius:4,background:C.bg3,overflow:"hidden"}}><div style={{height:"100%",width:"67%",borderRadius:4,background:`linear-gradient(90deg,${C.green},${C.cyan})`}} /></div>
              <span style={{fontFamily:"monospace",fontSize:16,fontWeight:800,color:C.green}}>67%</span>
            </div>
          </div>
        </div>
      )}
      {meTab==="badges" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {BADGES.map((b,i)=>(<div key={i} style={{padding:"16px",borderRadius:14,textAlign:"center",background:b.earned?`${C.gold}06`:C.bg2,border:`1px solid ${b.earned?C.gold+"20":C.border}`,opacity:b.earned?1:.5}}>
            <div style={{fontSize:32,marginBottom:6,filter:b.earned?"none":"grayscale(1)"}}>{b.emoji}</div>
            <div style={{fontSize:12,fontWeight:700,color:b.earned?C.text:C.text3}}>{b.name}</div>
            {b.earned&&<div style={{fontSize:10,color:C.gold,fontWeight:700,marginTop:4}}>✓ EARNED</div>}
          </div>))}
        </div>
      )}
      {meTab==="rewards" && (
        <div style={{padding:"16px",borderRadius:14,background:C.bg2,border:`1px solid ${C.border}`}}>
          {[{n:"Coins",e:"🪙",v:coins.toLocaleString(),c:C.gold},{n:"XP",e:"✨",v:xp.toLocaleString(),c:C.cyan},{n:"Badges",e:"🏅",v:`${BADGES.filter(b=>b.earned).length}/${BADGES.length}`,c:C.pink},{n:"Items",e:"💎",v:"3",c:C.purple}].map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
              <div style={{fontSize:24}}>{r.e}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:r.c}}>{r.n}</div></div>
              <div style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color:r.c}}>{r.v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{height:80}} />
    </div>
  );

  // ═══ OVERLAYS ═══
  const renderGameOverlay = () => {
    if(!selectedGame && !matchmaking && !gameActive) return null;
    const g = gameActive || matchmaking?.game || selectedGame;
    if(!g) return null;
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,background:"rgba(6,8,15,0.96)",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column"}}>
        <div style={{maxWidth:420,margin:"0 auto",width:"100%",flex:1,overflow:"auto",padding:"20px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div onClick={()=>{setSelectedGame(null);setMatchmaking(null);setGameActive(null);setDuelState(null);setDuelResult(null);}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <span style={{fontSize:16,color:C.text2}}>←</span><span style={{fontSize:13,color:C.text2,fontWeight:600}}>Back</span>
            </div>
            {/* Input method HUD in game overlay */}
            {(gameActive || matchmaking) && renderActiveInputHUD()}
          </div>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:56,marginBottom:8}}>{g.emoji}</div>
            <div style={{fontSize:24,fontWeight:900,color:C.text}}>{g.name}</div>
            <div style={{fontSize:13,color:C.text3,marginTop:4}}>{g.desc}</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:10}}>
              <Tag color={g.color}>{g.type}</Tag><Tag color={C.text2}>👥 {g.players}</Tag><Tag color={C.text2}>⏱ {g.time}</Tag>
            </div>
          </div>
          {/* Duel game */}
          {gameActive?.id==="wildwest" && (
            <div style={{textAlign:"center",padding:"32px 20px",borderRadius:20,background:C.bg2,border:`1px solid ${C.border}`,marginBottom:20}}>
              {duelState && duelState!=="result" && (<div>
                <div style={{fontSize:duelState==="shoot"?42:28,fontWeight:900,color:duelState==="shoot"?C.red:C.gold,animation:duelState==="shoot"?"pulse .3s infinite":"none",marginBottom:20}}>
                  {duelState==="ready"?"READY...":duelState==="steady"?"STEADY...":"🔫 SHOOT!"}
                </div>
                <div onClick={duelShoot} style={{width:100,height:100,borderRadius:"50%",margin:"0 auto",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,
                  background:duelState==="shoot"?`linear-gradient(135deg,${C.red},${C.orange})`:`linear-gradient(135deg,${C.text3}30,${C.text3}15)`,
                  color:duelState==="shoot"?"#fff":C.text3,boxShadow:duelState==="shoot"?`0 0 40px ${C.red}40`:"none",border:`2px solid ${duelState==="shoot"?C.red:C.text3}40`}}>
                  {gameActive?.activeInput==="button"?"🔘 PRESS!":"💨 PUFF!"}
                </div>
              </div>)}
              {duelState==="result" && duelResult && (<div>
                <div style={{fontSize:48,marginBottom:12}}>{duelResult.foul?"⚠":duelResult.win?"🤠":"💀"}</div>
                <div style={{fontSize:24,fontWeight:900,color:duelResult.foul||!duelResult.win?C.red:C.green}}>{duelResult.foul?"FOUL!":duelResult.win?"YOU WIN!":"YOU LOSE!"}</div>
                {!duelResult.foul && <div style={{marginTop:12,display:"flex",justifyContent:"center",gap:20}}>
                  <div><div style={{fontSize:10,color:C.text3}}>You</div><div style={{fontFamily:"monospace",fontSize:18,fontWeight:800,color:duelResult.win?C.green:C.text2}}>{duelResult.you}ms</div></div>
                  <div><div style={{fontSize:10,color:C.text3}}>AI</div><div style={{fontFamily:"monospace",fontSize:18,fontWeight:800,color:!duelResult.win?C.green:C.text2}}>{duelResult.ai}ms</div></div>
                </div>}
                <div onClick={startDuel} style={{marginTop:20,padding:"12px 24px",borderRadius:12,cursor:"pointer",display:"inline-block",background:`${C.gold}15`,border:`1px solid ${C.gold}30`,color:C.gold,fontSize:13,fontWeight:700}}>🔄 Rematch</div>
              </div>)}
            </div>
          )}
          {/* Generic active game */}
          {gameActive && gameActive.id!=="wildwest" && (
            <div style={{textAlign:"center",padding:"32px 20px",borderRadius:20,background:C.bg2,border:`1px solid ${C.border}`,marginBottom:20}}>
              <div style={{width:100,height:100,borderRadius:"50%",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${g.color}20,${g.color}08)`,border:`2px solid ${g.color}40`,fontSize:40,animation:"pulse 2s infinite"}}>{g.emoji}</div>
              <div style={{fontSize:13,color:g.color,fontWeight:700}}>Game in progress...</div>
              <div onClick={()=>{const w=Math.random()>.4;setCoins(c=>c+(w?80:15));setXp(x=>x+(w?40:15));notify(w?"🏆 WIN! +80 coins":"GG — +15 coins",w?C.green:C.orange);setGameActive(null);}} style={{marginTop:20,padding:"12px 24px",borderRadius:12,cursor:"pointer",display:"inline-block",background:`${g.color}15`,border:`1px solid ${g.color}30`,color:g.color,fontSize:13,fontWeight:700}}>End (Simulate)</div>
            </div>
          )}
          {matchmaking && (
            <div style={{textAlign:"center",padding:"32px 20px",borderRadius:20,background:C.bg2,border:`1px solid ${C.border}`}}>
              {matchmaking.stage==="searching" && <div><div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>{matchmaking.mode==="ai"?"Loading AI...":"Searching..."}</div><div style={{width:40,height:40,border:`3px solid ${C.border}`,borderTop:`3px solid ${g.color}`,borderRadius:"50%",margin:"16px auto",animation:"spin 1s linear infinite"}} /></div>}
              {matchmaking.stage==="found" && <div><div style={{fontSize:16,fontWeight:700,color:C.green,marginBottom:8}}>✓ Found!</div><div style={{fontSize:14,color:C.text}}>{matchmaking.opp}</div></div>}
            </div>
          )}
          {!matchmaking && !gameActive && (
            <div>
              {/* Input method info before choosing mode */}
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                padding:"10px 14px",borderRadius:12,marginBottom:14,
                background:`${activeInput.color}06`,border:`1px solid ${activeInput.color}15`,
              }}>
                <span style={{fontSize:16}}>{activeInput.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:activeInput.color}}>
                    Input: {inputMode === "auto" ? "Auto-select" : inputMode === "fixed" ? `Fixed — ${INPUT_TYPES.find(t=>t.id===primaryInput)?.label}` : "Ask before game"}
                  </div>
                  <div style={{fontSize:9,color:C.text3}}>Tap: {tapEnabled?"ON":"OFF"}</div>
                </div>
                <div onClick={()=>setShowInputPanel(true)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:`${C.text3}10`,border:`1px solid ${C.border}`,fontSize:9,fontWeight:700,color:C.text3}}>Change</div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:C.text3,letterSpacing:2,marginBottom:12}}>CHỌN CHẾ ĐỘ</div>
              {[{m:"friends",l:"👫 Invite Friends",d:"Mời bạn",c:C.cyan},{m:"random",l:"🎲 Random Match",d:"Người ngẫu nhiên",c:C.lime},{m:"ai",l:"🤖 AI Bot",d:"Easy / Medium / Hard",c:C.purple}].map(mm=>(
                <div key={mm.m} onClick={()=>startMatch(g,mm.m)} style={{padding:"16px",borderRadius:14,cursor:"pointer",background:`${mm.c}06`,border:`1px solid ${mm.c}20`,display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{fontSize:24}}>{mm.l.split(" ")[0]}</div><div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{mm.l}</div><div style={{fontSize:12,color:C.text3}}>{mm.d}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vibe Check
  const renderVibeCheck = () => {
    if(!showVibeCheck) return null;
    const q = VC_QUESTIONS[vcQ];
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,background:"rgba(6,8,15,0.97)",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column"}}>
        <div style={{maxWidth:420,margin:"0 auto",width:"100%",flex:1,overflow:"auto",padding:"20px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div onClick={()=>{setShowVibeCheck(false);setVcQ(0);setVcScore(0);setVcAnswered(false);setVcStreak(0);}} style={{cursor:"pointer"}}><span style={{fontSize:13,color:C.text2,fontWeight:600}}>← Exit</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {renderActiveInputHUD()}
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}} /><span style={{fontSize:10,fontWeight:700,color:C.red}}>LIVE</span></div>
            </div>
          </div>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:2,marginBottom:8}}>🧠 VIBE CHECK — WC EDITION</div>
            <div style={{display:"flex",justifyContent:"center",gap:16}}>
              <div><span style={{fontFamily:"monospace",fontSize:20,fontWeight:900,color:C.gold}}>{vcScore}</span><span style={{fontSize:10,color:C.text3}}> pts</span></div>
              <div><span style={{fontFamily:"monospace",fontSize:20,fontWeight:900,color:C.orange}}>{vcStreak}</span><span style={{fontSize:10,color:C.text3}}> streak</span></div>
              <div><span style={{fontFamily:"monospace",fontSize:20,fontWeight:900,color:C.text2}}>{vcQ+1}</span><span style={{fontSize:10,color:C.text3}}> /{VC_QUESTIONS.length}</span></div>
            </div>
          </div>
          <div style={{padding:"24px 20px",borderRadius:20,background:`linear-gradient(135deg,${C.gold}08,${C.bg2})`,border:`1px solid ${C.gold}20`,marginBottom:16}}>
            <div style={{fontSize:17,fontWeight:700,color:C.text,lineHeight:1.5,textAlign:"center"}}>{q.q}</div>
          </div>
          {q.opts.map((opt,i)=>(
            <div key={i} onClick={()=>{
              if(vcAnswered) return; setVcAnswered(true);
              const ok = i===q.correct;
              if(ok){const p=100+vcStreak*25;setVcScore(s=>s+p);setVcStreak(s=>s+1);setCoins(c=>c+20);setXp(x=>x+15);notify(`✓ +${p} pts`,C.green);}
              else{setVcStreak(0);notify("✗ Wrong!",C.red);}
              setTimeout(()=>{if(vcQ<VC_QUESTIONS.length-1){setVcQ(q=>q+1);setVcAnswered(false);}else{notify(`🎉 Final: ${vcScore+(ok?100+vcStreak*25:0)}`,C.gold);setTimeout(()=>{setShowVibeCheck(false);setVcQ(0);setVcScore(0);setVcAnswered(false);setVcStreak(0);},2000);}},1500);
            }} style={{
              padding:"14px 16px",borderRadius:14,cursor:vcAnswered?"default":"pointer",marginBottom:10,
              background:vcAnswered?(i===q.correct?`${C.green}15`:`${C.red}08`):`${C.text3}06`,
              border:`1.5px solid ${vcAnswered?(i===q.correct?C.green+"50":C.red+"20"):C.border}`,
              display:"flex",alignItems:"center",gap:12,transition:"all .3s",
            }}>
              <div style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:vcAnswered&&i===q.correct?`${C.green}20`:`${C.text3}10`,fontSize:13,fontWeight:800,color:vcAnswered&&i===q.correct?C.green:C.text2}}>{"ABCD"[i]}</div>
              <span style={{fontSize:14,fontWeight:600,color:vcAnswered&&i===q.correct?C.green:C.text}}>{opt}</span>
              {vcAnswered&&i===q.correct&&<span style={{marginLeft:"auto",color:C.green,fontWeight:800}}>✓</span>}
            </div>
          ))}
          <div style={{marginTop:16,padding:"12px 16px",borderRadius:12,background:C.bg2,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:C.text3}}>👁 1,247 watching</span>
            <div style={{display:"flex",gap:6}}>{["🔥","😱","🎉","👏"].map((e,i)=>(<span key={i} style={{cursor:"pointer",fontSize:16}} onClick={()=>notify(`${e} sent!`,C.gold)}>{e}</span>))}</div>
          </div>
        </div>
      </div>
    );
  };

  // Spin overlay
  const renderSpin = () => {
    if(!selectedGame || selectedGame.id!=="spinwin") return null;
    const segs=["100🪙","50✨","200🪙","🏅","JACKPOT","↻","⚡","150🪙"];
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,background:"rgba(6,8,15,0.97)",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div onClick={()=>{setSelectedGame(null);setSpinResult(null);}} style={{position:"absolute",top:20,left:20,cursor:"pointer"}}><span style={{fontSize:13,color:C.text2,fontWeight:600}}>← Back</span></div>
        <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:2,marginBottom:20}}>🎰 SPIN & WIN</div>
        <div style={{position:"relative",width:260,height:260,marginBottom:24}}>
          <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",fontSize:24,zIndex:2}}>▼</div>
          <div style={{width:260,height:260,borderRadius:"50%",border:`4px solid ${C.gold}40`,transform:`rotate(${spinAngle}deg)`,transition:spinning?"transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)":"none",
            background:`conic-gradient(${segs.map((s,i)=>`${[C.gold,C.cyan,C.pink,C.purple,C.red,C.text3,C.orange,C.lime][i]}30 ${i*45}deg ${(i+1)*45}deg`).join(",")})`}}>
            {segs.map((s,i)=>(<div key={i} style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${i*45+22}deg) translateY(-90px)`,transformOrigin:"0 0",fontSize:11,fontWeight:700,color:C.text,whiteSpace:"nowrap"}}>{s}</div>))}
          </div>
        </div>
        {spinResult && <div style={{fontSize:18,fontWeight:800,color:C.gold,marginBottom:16}}>🎉 {spinResult.t}</div>}
        <div onClick={()=>{if(!spinning)puffLockIn(doSpin);}} style={{padding:"14px 32px",borderRadius:14,cursor:spinning?"default":"pointer",background:spinning?`${C.text3}15`:`linear-gradient(135deg,${C.gold}30,${C.gold}12)`,border:`1px solid ${spinning?C.text3+"20":C.gold+"40"}`,color:spinning?C.text3:C.gold,fontSize:15,fontWeight:800}}>{spinning?"Spinning...":"💨 Puff to Spin!"}</div>
      </div>
    );
  };

  // Puff Lock
  const renderPuffLock = () => {
    if(!puffLocking) return null;
    const ai = getActiveInputInfo();
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,background:"rgba(6,8,15,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",border:`3px solid ${C.gold}`,animation:"pulse .6s infinite",fontSize:32}}>
            {primaryInput==="button"?"🔘":primaryInput==="dry_puff"?"🌀":"💨"}
          </div>
          <div style={{fontSize:16,fontWeight:800,color:C.gold,letterSpacing:1}}>
            {primaryInput==="button"?"Press to Lock In...":primaryInput==="dry_puff"?"Dry Puff to Lock In...":"Puff to Lock In..."}
          </div>
        </div>
      </div>
    );
  };

  // ═══ MAIN ═══
  return (
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",pointerEvents:"none",background:`radial-gradient(circle,${tc[tab]}06 0%,transparent 70%)`,transition:"background 1s"}} />
      {notif && (<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",maxWidth:380,padding:"10px 20px",borderRadius:100,zIndex:300,background:`${notif.color}18`,border:`1px solid ${notif.color}40`,color:notif.color,fontSize:13,fontWeight:700,letterSpacing:.3,animation:"fadeSlide .3s ease",backdropFilter:"blur(12px)",textAlign:"center"}}>{notif.msg}</div>)}

      {/* Status Bar */}
      <div style={{padding:"14px 16px 6px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:2}}>
        <div style={{fontSize:11,color:C.text3,fontWeight:700,letterSpacing:1.5}}>MOOD LAB</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* ★ INPUT METHOD HEADER BUTTON ★ */}
          {renderInputHeaderButton()}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:100,background:`${C.gold}10`,border:`1px solid ${C.gold}20`}}>
            <span style={{fontSize:11}}>🪙</span><span style={{fontSize:12,fontWeight:800,color:C.gold,fontFamily:"monospace"}}>{coins.toLocaleString()}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:100,background:`${C.green}10`,border:`1px solid ${C.green}25`}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.green}} /><span style={{fontSize:11,fontWeight:600,color:C.green}}>BLE</span>
          </div>
        </div>
      </div>

      {/* Tab Title */}
      <div style={{padding:"4px 16px 12px",position:"relative",zIndex:2}}>
        <div style={{fontSize:22,fontWeight:900,color:C.text}}>
          {tab==="control"?"Control":tab==="arena"?(arenaView==="home"?"Arena":""):tab==="live"?"Live":"Me"}
        </div>
      </div>

      {/* Content */}
      <div style={{position:"relative",zIndex:2}}>
        {tab==="control" && renderControl()}
        {tab==="arena" && arenaView==="home" && renderArenaHome()}
        {tab==="arena" && ["play","show","predict"].includes(arenaView) && renderArenaList(arenaView)}
        {tab==="live" && renderLive()}
        {tab==="me" && renderMe()}
      </div>

      {renderGameOverlay()}
      {renderVibeCheck()}
      {renderSpin()}
      {renderPuffLock()}
      {renderInputPanel()}
      {renderAskPrompt()}

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,padding:"6px 12px 14px",background:`linear-gradient(to top,${C.bg} 70%,transparent)`,zIndex:50}}>
        <div style={{display:"flex",background:C.bg2,borderRadius:18,border:`1px solid ${C.border}`,padding:"4px",backdropFilter:"blur(12px)"}}>
          {[{id:"control",l:"Control",i:"🎛",c:C.cyan},{id:"arena",l:"Arena",i:"🎮",c:C.cyan},{id:"live",l:"Live",i:"📡",c:C.pink},{id:"me",l:"Me",i:"👤",c:C.purple}].map(t=>(
            <div key={t.id} onClick={()=>{setTab(t.id);if(t.id==="arena")setArenaView("home");}} style={{flex:1,padding:"10px 0",borderRadius:14,textAlign:"center",cursor:"pointer",background:tab===t.id?`${t.c}12`:"transparent",transition:"all .25s",position:"relative"}}>
              <div style={{fontSize:20,marginBottom:1}}>{t.i}</div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:.3,color:tab===t.id?t.c:C.text3}}>{t.l}</div>
              {t.id==="live"&&<div style={{position:"absolute",top:6,right:"25%",width:6,height:6,borderRadius:"50%",background:C.red,animation:"pulse 1.5s infinite"}} />}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes inputGlow{0%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 16px ${activeInput.color}40}100%{box-shadow:0 0 0 transparent}}
        *{-webkit-tap-highlight-color:transparent;user-select:none}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.text3}30;border-radius:2px}
      `}</style>
    </div>
  );
}
