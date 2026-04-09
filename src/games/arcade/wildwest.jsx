import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import UniversalPuffBar from '../../components/UniversalPuffBar.jsx';
import GameChatOverlay from '../../components/GameChatOverlay.jsx';

const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const OPPONENTS = [
  { name: 'Sheriff Puffington', emoji: '🤠', rank: '#1',  record: '420-69',  taunt: "This town ain't big enough for the two of us", speed: 450 },
  { name: 'Quick Draw McGraw',  emoji: '🔫', rank: '#3',  record: '380-88',  taunt: '0.2 seconds is all I need',                   speed: 380 },
  { name: 'Cactus Jack',        emoji: '🌵', rank: '#7',  record: '301-120', taunt: 'Prickly and fast',                             speed: 420 },
  { name: 'Dusty Rhodes',       emoji: '🏜️', rank: '#12', record: '250-140', taunt: 'Faster than a tumbleweed in a tornado',        speed: 500 },
  { name: 'Dynamite Dan',       emoji: '🧨', rank: '#5',  record: '350-95',  taunt: 'BOOM. Already drew.',                          speed: 400 },
  { name: 'Whiskey Wilma',      emoji: '🥃', rank: '#15', record: '220-160', taunt: "I shoot straighter when I'm drunk",            speed: 550 },
];

const ROASTS_WIN  = ['YEEHAW! Faster than a rattlesnake!', 'Sheriff WHO? You\'re the law now!', 'That draw was ILLEGAL it was so fast!', 'Billy the Kid would be jealous!', 'SMOKING. LITERALLY.'];
const ROASTS_LOSE = ["Bro forgot which hand holds the gun!", 'A SNAIL could draw faster!', 'The tumbleweed outran you!', 'Were you napping at high noon?!', 'AI didn\'t even break a sweat!'];
const ROASTS_FOUL = ['FOUL! Trigger-happy much?!', 'Jumped the gun LITERALLY!', 'Patience isn\'t your thing huh!', 'The ref is APPALLED!', 'Even cowboys have RULES!'];
const WW_TENSION  = ['Eyes locked... who blinks first?', 'The desert holds its breath...', 'A pin drop would be DEAFENING...', 'Fingers twitching... hearts pounding...', 'The crowd is SILENT...'];

const BOTS = ['Cactus_Carl', 'DesertFox', 'TumbleweedTina', 'SheriffBot', 'DustyDave'];

export default function WildWestGame() {
  const navigate = useNavigate();
  const {
    coins, bleConnected, setShowBlePopup, playFx,
    triggerFlash, triggerShake, spawnConfetti, confettiParticles, screenShake, screenFlash,
    setGameChatMsgs, awardGame, setBLEHandlers, clearBLEHandlers, notify,
    smokeParticles, setSmokeParticles,
  } = useApp();

  // ── Game state ──
  const [phase, setPhase]                 = useState('menu');
  const [round, setRound]                 = useState(0);
  const [score, setScore]                 = useState({ you: 0, ai: 0 });
  const [result, setResult]               = useState(null);
  const [roundResults, setRoundResults]   = useState([]);
  const [opponent, setOpponent]           = useState(null);
  const [introStage, setIntroStage]       = useState(null);
  const [introCount, setIntroCount]       = useState(3);
  const [countdown, setCountdown]         = useState(null);
  const [firedShot, setFiredShot]         = useState(false);
  const [puffing, setPuffing]             = useState(false);
  const [puffMeter, setPuffMeter]         = useState(0);
  const [puffBonus, setPuffBonus]         = useState(null);
  const [muzzleFlash, setMuzzleFlash]     = useState(null);
  const [staredownStage, setStaredownStage] = useState(0);
  const [staredownText, setStaredownText] = useState('');
  const [stats, setStats]                 = useState({ fastestDraw: 999, avgDraw: 0, drawTimes: [], fouls: 0, wins: 0, streak: 0 });
  const [commentary, setCommentary]       = useState('');
  const [puffBubbles, setPuffBubbles]     = useState([]);

  // ── Refs ──
  const phaseRef           = useRef('menu');
  const staredownStageRef  = useRef(0);
  const muzzleFlashRef     = useRef(null);
  const puffingRef         = useRef(false);
  const roundRef           = useRef(0);
  const oppRef             = useRef(null);
  const drawTimeRef        = useRef(null);
  const expectedDrawRef    = useRef(null);
  const timerRef           = useRef(null);
  const steadyTimerRef     = useRef(null);
  const puffStartRef       = useRef(null);
  const puffIntervalRef    = useRef(null);
  const reactionTimeRef    = useRef(null);
  const firedShotRef       = useRef(false);
  const comedyRef          = useRef({ lastRoast: '', streak: 0 });
  const tumbleXRef         = useRef(-50);
  const dustRef            = useRef([]);
  const canvasRef          = useRef(null);
  const animRef            = useRef(null);
  const guardRef           = useRef(null);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { staredownStageRef.current = staredownStage; }, [staredownStage]);
  useEffect(() => { muzzleFlashRef.current = muzzleFlash; }, [muzzleFlash]);
  useEffect(() => { puffingRef.current = puffing; }, [puffing]);

  const addChat = useCallback((name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { name, msg, color, t: Date.now() }]);
  }, [setGameChatMsgs]);

  const autoChat = useCallback((msgs, color) => {
    addChat(pick(BOTS), pick(msgs), color || C.gold);
  }, [addChat]);

  const spawnSmoke = useCallback((count = 8) => {
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60, y: 40 + Math.random() * 20,
      size: 20 + Math.random() * 30, dur: 2 + Math.random() * 2,
    }));
    setSmokeParticles(p => [...p.slice(-20), ...particles]);
    setTimeout(() => setSmokeParticles([]), 3500);
  }, [setSmokeParticles]);

  // ── Canvas draw ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width / DPR, H = canvas.height / DPR;
    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();
    const curPhase = phaseRef.current;
    const ssStage = staredownStageRef.current;
    const mFlash = muzzleFlashRef.current;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#0a0515'); skyGrad.addColorStop(0.12, '#150a2e');
    skyGrad.addColorStop(0.22, '#2d1b4e'); skyGrad.addColorStop(0.32, '#6b2fa0');
    skyGrad.addColorStop(0.42, '#c04060'); skyGrad.addColorStop(0.55, '#e8875c');
    skyGrad.addColorStop(0.65, '#f4a742'); skyGrad.addColorStop(0.78, '#c87533');
    skyGrad.addColorStop(0.88, '#8b4513'); skyGrad.addColorStop(1, '#3d1f0a');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 15; i++) {
      const sx = (7 + i * 28) % W, sy = 5 + Math.sin(i * 1.3) * 25;
      const a = 0.15 + 0.25 * Math.sin(now * 0.001 + i * 1.1);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(sx, sy, 1 + i % 3 * 0.5, 0, Math.PI * 2); ctx.fill();
    }

    // Sun glow
    const sunGrad = ctx.createRadialGradient(W / 2, H * 0.15, 0, W / 2, H * 0.15, H * 0.25);
    sunGrad.addColorStop(0, 'rgba(255,200,50,0.7)'); sunGrad.addColorStop(0.3, 'rgba(255,140,50,0.35)');
    sunGrad.addColorStop(0.6, 'rgba(255,100,30,0.12)'); sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad; ctx.fillRect(0, 0, W, H * 0.5);

    // Moon
    ctx.save(); ctx.globalAlpha = 0.6;
    const moonGrad = ctx.createRadialGradient(W * 0.85, H * 0.06, 2, W * 0.85, H * 0.06, 12);
    moonGrad.addColorStop(0, '#f5eed8'); moonGrad.addColorStop(0.6, '#ddd0a8'); moonGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGrad; ctx.beginPath(); ctx.arc(W * 0.85, H * 0.06, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // Mountains
    ctx.fillStyle = 'rgba(26,10,8,0.6)';
    ctx.beginPath(); ctx.moveTo(0, H * 0.68);
    for (let x = 0; x <= W; x += 20) { ctx.lineTo(x, H * 0.68 - Math.sin(x * 0.02) * 15 - Math.cos(x * 0.035) * 10); }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

    // Town silhouette
    ctx.fillStyle = '#1a0a05';
    const townY = H * 0.62;
    ctx.beginPath(); ctx.moveTo(0, townY);
    const blds = [15, 30, 20, 45, 25, 35, 15, 50, 20, 40, 30, 25, 45, 20, 35, 50, 15, 30, 25, 40];
    let bx = 0;
    blds.forEach((bh, i) => {
      const bw = W / blds.length;
      ctx.lineTo(bx, townY); ctx.lineTo(bx, townY - bh * (0.5 + Math.sin(i) * 0.3));
      if (i % 3 === 0) { ctx.lineTo(bx + bw * 0.3, townY - bh * (0.5 + Math.sin(i) * 0.3) - 8); ctx.lineTo(bx + bw * 0.6, townY - bh * (0.5 + Math.sin(i) * 0.3)); }
      ctx.lineTo(bx + bw, townY - bh * (0.5 + Math.sin(i) * 0.3)); ctx.lineTo(bx + bw, townY);
      bx += bw;
    });
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

    // Desert floor
    const floorY = H * 0.72;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, '#8b4513'); floorGrad.addColorStop(0.3, '#6b3410');
    floorGrad.addColorStop(0.6, '#5a2a0e'); floorGrad.addColorStop(1, '#2d1205');
    ctx.fillStyle = floorGrad; ctx.fillRect(0, floorY, W, H - floorY);

    // Cactus silhouettes
    ctx.fillStyle = 'rgba(26,10,5,0.3)';
    [W * 0.08, W * 0.92, W * 0.48].forEach((cx, i) => {
      const ch = 20 + i * 5; const cy = floorY - 5;
      ctx.fillRect(cx - 2, cy - ch, 4, ch);
      if (i < 2) { ctx.fillRect(cx - 8, cy - ch * 0.6, 6, 3); ctx.fillRect(cx + 2, cy - ch * 0.4, 8, 3); }
    });

    // Tumbleweed
    tumbleXRef.current += 0.6;
    if (tumbleXRef.current > W + 50) tumbleXRef.current = -50;
    const twX = tumbleXRef.current, twY = floorY - 8 + Math.sin(now * 0.003) * 4;
    ctx.save(); ctx.globalAlpha = 0.4;
    ctx.translate(twX, twY); ctx.rotate(now * 0.002);
    ctx.fillStyle = '#8b6914'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b4a0a'; ctx.lineWidth = 1;
    for (let a = 0; a < 6; a++) { const ang = a * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 7, Math.sin(ang) * 7); ctx.stroke(); }
    ctx.restore();

    // Dust particles
    dustRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < floorY - 30) { p.y = floorY + Math.random() * 50; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      ctx.fillStyle = `rgba(210,170,120,${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
    });

    // Vulture
    const vAngle = now * 0.0005;
    ctx.save(); ctx.globalAlpha = 0.3; ctx.font = '12px serif'; ctx.fillText('🦅', W * 0.3 + Math.cos(vAngle) * 40, H * 0.15 + Math.sin(vAngle * 2) * 10); ctx.restore();

    // Campfire glow
    ctx.save(); ctx.globalAlpha = 0.12 + Math.sin(now * 0.004) * 0.04;
    const cfGrad = ctx.createRadialGradient(W * 0.18, floorY - 5, 0, W * 0.18, floorY - 5, 25);
    cfGrad.addColorStop(0, 'rgba(255,140,20,0.4)'); cfGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cfGrad; ctx.fillRect(W * 0.05, floorY - 30, W * 0.3, 50); ctx.restore();

    // Cowboy silhouettes
    const cowboyY = floorY - 50;
    const playerX = W * 0.22, aiX = W * 0.78;

    // Player (left, cyan)
    ctx.save();
    ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = mFlash === 'left' ? 20 : 8;
    ctx.fillStyle = '#111';
    ctx.fillRect(playerX - 8, cowboyY, 16, 35); ctx.beginPath(); ctx.arc(playerX, cowboyY - 5, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(playerX - 14, cowboyY - 18, 28, 5); ctx.fillRect(playerX - 7, cowboyY - 25, 14, 8);
    ctx.fillRect(playerX + 8, cowboyY + 10, 18, 4); ctx.restore();

    // AI (right, orange)
    ctx.save();
    ctx.shadowColor = '#FF8800'; ctx.shadowBlur = mFlash === 'right' ? 20 : 8;
    ctx.fillStyle = '#111';
    ctx.fillRect(aiX - 8, cowboyY, 16, 35); ctx.beginPath(); ctx.arc(aiX, cowboyY - 5, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(aiX - 14, cowboyY - 18, 28, 5); ctx.fillRect(aiX - 7, cowboyY - 25, 14, 8);
    ctx.fillRect(aiX - 26, cowboyY + 10, 18, 4); ctx.restore();

    // Eye glow during staredown
    if (ssStage >= 1) {
      ctx.fillStyle = '#00E5FF'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(playerX + 4, cowboyY - 6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FF8800'; ctx.shadowColor = '#FF8800';
      ctx.beginPath(); ctx.arc(aiX - 4, cowboyY - 6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Muzzle flash
    if (mFlash) {
      const flashX = mFlash === 'left' ? playerX + 26 : aiX - 26;
      const flashGrad = ctx.createRadialGradient(flashX, cowboyY + 12, 0, flashX, cowboyY + 12, 20);
      flashGrad.addColorStop(0, 'rgba(255,200,50,0.9)'); flashGrad.addColorStop(0.4, 'rgba(255,100,0,0.5)'); flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad; ctx.beginPath(); ctx.arc(flashX, cowboyY + 12, 20, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.3;
      for (let i = 0; i < 5; i++) {
        const smX = flashX + (mFlash === 'left' ? 1 : -1) * (5 + i * 6);
        ctx.fillStyle = `rgba(180,180,180,${0.3 - i * 0.05})`; ctx.beginPath(); ctx.arc(smX, cowboyY + 8 - i * 3, 3 + i * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // Vignette
    const vigA = ssStage >= 2 ? 0.7 : ssStage >= 1 ? 0.5 : 0.35;
    const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
    vigGrad.addColorStop(0, 'transparent'); vigGrad.addColorStop(1, `rgba(0,0,0,${vigA})`);
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, W, H);

    // Phase tints
    if (curPhase === 'draw' || curPhase === 'puffing') {
      ctx.fillStyle = `rgba(180,0,0,${0.1 + 0.05 * Math.sin(now * 0.01)})`; ctx.fillRect(0, 0, W, H);
    }
    if (curPhase === 'staredown') {
      ctx.fillStyle = `rgba(180,20,0,${0.02 + ssStage * 0.03})`; ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }, []);

  // Canvas loop — restart every render (Rule 4)
  useEffect(() => {
    if (phase === 'menu') return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); animRef.current = null; };
  });

  const getAiSpeed = useCallback((roundNum) => {
    const opp = oppRef.current || OPPONENTS[0];
    return Math.max(280, Math.floor(opp.speed - roundNum * (15 + Math.random() * 10) + (Math.random() - 0.5) * 80));
  }, []);

  const handleRoundEnd = useCallback((win, wasFoul, resultObj) => {
    const newResults = [...roundResults, { win, foul: wasFoul, you: resultObj?.you || 0, ai: resultObj?.ai || 0, bonus: resultObj?.bonus || null, bonusCoins: resultObj?.bonusCoins || 0 }];
    setRoundResults(newResults);
    setScore(prev => {
      const ns = { ...prev };
      if (win) ns.you++; else ns.ai++;

      setTimeout(() => {
        if (ns.you >= 3 || ns.ai >= 3) {
          setPhase('final'); phaseRef.current = 'final';
          const matchWin = ns.you >= 3;
          if (matchWin) {
            playFx('win'); playFx('crowd');
            spawnConfetti(60, [C.gold, C.orange, '#fff', C.green]);
            setCommentary(pick(['FASTEST GUN IN THE WEST!', 'CHAMPION DUELIST!', 'YOU ARE THE SHERIFF NOW!']));
            notify('DUEL WON! +80 coins!', C.gold);
            addChat('Announcer', 'MATCH WON! YOU ARE THE FASTEST GUN!', C.gold);
            setStats(s => ({ ...s, wins: s.wins + 1, streak: s.streak + 1 }));
            awardGame('wildwest', 'win');
          } else {
            playFx('lose');
            setCommentary((oppRef.current?.name || 'AI') + ' wins the duel!');
            addChat('Announcer', (oppRef.current?.name || 'AI') + ' WINS THE DUEL!', C.red);
            setStats(s => ({ ...s, streak: 0 }));
            awardGame('wildwest', 'lose');
          }
        } else {
          setPhase('round_result'); phaseRef.current = 'round_result';
          setTimeout(() => {
            const nextRound = roundRef.current + 1;
            setRound(nextRound); roundRef.current = nextRound;
            startRound(nextRound);
          }, 2500);
        }
      }, 1800);

      return ns;
    });
  // eslint-disable-next-line
  }, [roundResults, playFx, spawnConfetti, notify, addChat, awardGame]);

  const startRound = useCallback((roundNum) => {
    setFiredShot(false); firedShotRef.current = false;
    setResult(null); setPuffing(false); puffingRef.current = false;
    setPuffMeter(0); setPuffBonus(null);
    setMuzzleFlash(null); muzzleFlashRef.current = null;
    setStaredownStage(0); staredownStageRef.current = 0;
    setStaredownText('');
    drawTimeRef.current = null; reactionTimeRef.current = null;

    setPhase('countdown'); phaseRef.current = 'countdown';
    setCountdown(3);
    playFx('tap');
    setCommentary('Round ' + (roundNum + 1) + '... Get ready!');
    if (roundNum > 0) autoChat(['Round ' + (roundNum + 1) + '! HERE WE GO!', 'The tension is UNREAL!', 'Who draws first?!'], C.gold);

    setTimeout(() => { setCountdown(2); playFx('tap'); }, 900);
    setTimeout(() => { setCountdown(1); playFx('select'); setCommentary('Here it comes...'); }, 1800);
    setTimeout(() => { setCountdown('DRAW!'); playFx('whistle'); triggerFlash('save'); }, 2700);

    // Staredown
    const tensionBase = 1500 + Math.random() * 3000 + roundNum * 400;
    expectedDrawRef.current = Date.now() + 3200 + tensionBase;

    setTimeout(() => {
      setCountdown(null);
      setPhase('staredown'); phaseRef.current = 'staredown';
      setStaredownStage(0); staredownStageRef.current = 0;
      setCommentary(pick(WW_TENSION));

      timerRef.current = setTimeout(() => {
        setStaredownStage(1); staredownStageRef.current = 1;
        setStaredownText(pick(WW_TENSION));
        autoChat(['The tension is INSANE!', 'Nobody moves...', "I can't breathe!"], C.orange);
      }, tensionBase * 0.3);

      steadyTimerRef.current = setTimeout(() => {
        setStaredownStage(2); staredownStageRef.current = 2;
        setStaredownText(pick(['WHO WILL DRAW FIRST?', 'The air CRACKLES...', 'DRAW OR DIE...']));
      }, tensionBase * 0.6);

      setTimeout(() => {
        setStaredownStage(3); staredownStageRef.current = 3;
        setStaredownText('...');
      }, tensionBase * 0.85);

      // DRAW phase
      timerRef.current = setTimeout(() => {
        setPhase('draw'); phaseRef.current = 'draw';
        drawTimeRef.current = Date.now();
        triggerShake(); triggerFlash('miss'); playFx('whistle');
        setCommentary('DRAW! HOLD TO SHOOT!');
        setStaredownText('');
        addChat('Announcer', 'DRAW! REACT NOW!', C.red);

        // Timeout if player doesn't react
        timerRef.current = setTimeout(() => {
          if (drawTimeRef.current) {
            const aiSpeed = getAiSpeed(roundRef.current);
            const timeoutResult = { win: false, you: 5000, ai: aiSpeed, puffDur: 0, bonus: null, bonusCoins: 0 };
            setResult(timeoutResult);
            setPhase('result'); phaseRef.current = 'result';
            drawTimeRef.current = null;
            setFiredShot(true); firedShotRef.current = true;
            setMuzzleFlash('right'); muzzleFlashRef.current = 'right';
            setTimeout(() => { setMuzzleFlash(null); muzzleFlashRef.current = null; }, 500);
            playFx('lose');
            setCommentary(pick(['Too slow, partner!', 'You froze up!', 'Asleep at high noon!']));
            autoChat(ROASTS_LOSE, C.red);
            handleRoundEnd(false, false, timeoutResult);
          }
        }, 5000);
      }, tensionBase);
    }, 3200);
  }, [playFx, triggerFlash, triggerShake, addChat, autoChat, getAiSpeed, handleRoundEnd]);

  const shoot = useCallback(() => {
    if (firedShotRef.current) return;

    // Foul: shot before DRAW with >200ms grace
    if ((phaseRef.current === 'staredown' || phaseRef.current === 'countdown') &&
        !(expectedDrawRef.current && (expectedDrawRef.current - Date.now()) < 200)) {
      setFiredShot(true); firedShotRef.current = true;
      clearTimeout(timerRef.current); clearTimeout(steadyTimerRef.current);
      drawTimeRef.current = null;
      const foulResult = { foul: true, bonusCoins: 0, you: 0, ai: 0 };
      setResult(foulResult);
      setPhase('result'); phaseRef.current = 'result';
      playFx('error'); triggerShake();
      setStats(s => ({ ...s, fouls: s.fouls + 1 }));
      setCommentary(pick(ROASTS_FOUL));
      notify('FOUL! Drew too early!', C.red);
      autoChat(ROASTS_FOUL, C.red);
      handleRoundEnd(false, true, foulResult);
      return;
    }

    // Valid draw
    if (phaseRef.current === 'draw' && drawTimeRef.current) {
      const reactionMs = Date.now() - drawTimeRef.current;
      reactionTimeRef.current = reactionMs;
      clearTimeout(timerRef.current);
      setPhase('puffing'); phaseRef.current = 'puffing';
      setPuffing(true); puffingRef.current = true;
      setPuffMeter(0);
      puffStartRef.current = Date.now();
      playFx('charge');
      puffIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - puffStartRef.current) / 1000;
        const meter = Math.min(100, (elapsed / 4.5) * 100);
        setPuffMeter(meter);
        if (Math.random() < 0.3) {
          const b = { id: Date.now() + Math.random(), x: 35 + Math.random() * 30, y: 100, size: 4 + Math.random() * 8, dur: 1.5 + Math.random() * 1.5 };
          setPuffBubbles(p => [...p.slice(-15), b]);
        }
        if (elapsed >= 5.0) releasePuff();
      }, 50);
    }
  }, [playFx, triggerShake, notify, autoChat, handleRoundEnd]);

  const releasePuff = useCallback(() => {
    if (!puffingRef.current) return;
    setPuffing(false); puffingRef.current = false;
    setFiredShot(true); firedShotRef.current = true;
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null; }
    drawTimeRef.current = null;

    const reactionMs = reactionTimeRef.current || 999;
    const puffDuration = puffStartRef.current ? (Date.now() - puffStartRef.current) / 1000 : 0;
    const aiTime = getAiSpeed(roundRef.current);

    let effectiveReaction = reactionMs;
    if (puffDuration >= 4.5) effectiveReaction = Math.round(reactionMs * 0.80);
    else if (puffDuration >= 2.0) effectiveReaction = Math.round(reactionMs * 0.90);
    else if (puffDuration >= 0.8) effectiveReaction = Math.round(reactionMs * 0.95);

    const win = effectiveReaction < aiTime;
    let bonus = 'basic', bonusCoins = 0, bonusLabel = 'Tap Shot';
    if (puffDuration >= 4.5)      { bonus = 'legendary'; bonusCoins = 50; bonusLabel = 'LEGENDARY DRAW +20%'; }
    else if (puffDuration >= 2.0) { bonus = 'power';     bonusCoins = 25; bonusLabel = 'Real Puff +15%'; }
    else if (puffDuration >= 0.8) { bonus = 'quick';     bonusCoins = 10; bonusLabel = 'Dry Puff +5%'; }
    setPuffBonus(bonus);

    const resultObj = { win, you: reactionMs, ai: aiTime, effectiveReaction, puffDur: puffDuration, bonus, bonusCoins, bonusLabel };
    setResult(resultObj);
    setPhase('result'); phaseRef.current = 'result';
    playFx('gunshot');

    setMuzzleFlash(win ? 'left' : 'right'); muzzleFlashRef.current = win ? 'left' : 'right';
    setTimeout(() => { setMuzzleFlash(null); muzzleFlashRef.current = null; }, 600);

    setStats(s => {
      const times = [...s.drawTimes, reactionMs];
      return { ...s, fastestDraw: Math.min(s.fastestDraw, reactionMs), avgDraw: Math.round(times.reduce((a, b) => a + b, 0) / times.length), drawTimes: times };
    });

    if (win) {
      playFx('win'); playFx('crowd'); triggerFlash('goal'); spawnSmoke(12);
      comedyRef.current.streak++;
      if (reactionMs < 200) { setCommentary('LIGHTNING! ' + reactionMs + 'ms! INHUMAN!'); spawnConfetti(50, [C.gold, C.orange, '#fff']); }
      else if (reactionMs < 300) { setCommentary('QUICK DRAW! ' + reactionMs + 'ms!'); spawnConfetti(25, [C.gold, C.orange]); }
      else { setCommentary('Got em! ' + reactionMs + 'ms beats ' + aiTime + 'ms!'); }
      if (bonus === 'legendary') { setCommentary('LEGENDARY DRAW! ' + reactionMs + 'ms + BLINKER! +50 coins!'); spawnConfetti(60, [C.gold, C.orange, '#fff', C.green]); }
      notify('Round won! ' + reactionMs + 'ms' + (bonusCoins > 0 ? ' +' + bonusCoins : ''), C.green);
      autoChat(ROASTS_WIN, C.green);
    } else {
      playFx('lose'); triggerFlash('miss'); spawnSmoke(8);
      comedyRef.current.streak = 0;
      setCommentary(pick(ROASTS_LOSE));
      notify('AI drew faster! ' + aiTime + 'ms', C.red);
      autoChat(ROASTS_LOSE, C.red);
    }

    handleRoundEnd(win, false, resultObj);
  }, [getAiSpeed, playFx, triggerFlash, spawnSmoke, spawnConfetti, notify, autoChat, handleRoundEnd]);

  // BLE handlers
  const handleDown = useCallback(() => { shoot(); }, [shoot]);
  const handleUp   = useCallback(() => { releasePuff(); }, [releasePuff]);
  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  const startGame = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(steadyTimerRef.current);
    if (puffIntervalRef.current) clearInterval(puffIntervalRef.current);

    const opp = pick(OPPONENTS);
    oppRef.current = opp;
    setOpponent(opp);
    setRound(0); roundRef.current = 0;
    setScore({ you: 0, ai: 0 });
    setRoundResults([]);
    setResult(null);
    setFiredShot(false); firedShotRef.current = false;
    setPuffing(false); puffingRef.current = false;
    setPuffMeter(0); setPuffBonus(null);
    setMuzzleFlash(null); muzzleFlashRef.current = null;
    setStaredownStage(0); staredownStageRef.current = 0;
    setStaredownText(''); setPuffBubbles([]);
    tumbleXRef.current = -50;
    comedyRef.current = { lastRoast: '', streak: 0 };
    dustRef.current = Array.from({ length: 12 }, () => ({
      x: Math.random() * 430, y: 350 + Math.random() * 200,
      s: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.4,
      vy: -0.1 - Math.random() * 0.3, a: 0.2 + Math.random() * 0.4,
    }));

    setPhase('intro'); phaseRef.current = 'intro';
    setIntroStage('enter'); setIntroCount(3);
    playFx('crowd');
    setCommentary('The duelists approach... ' + opp.emoji);
    addChat('Announcer', 'HIGH NOON SHOWDOWN! ' + opp.name + ' vs You!', C.gold);

    setTimeout(() => { setIntroStage('stats'); setCommentary("Check the stats! Who's the fastest gun?"); autoChat(['This is gonna be INTENSE!', 'Place your bets!', "My money's on you!", 'I got ' + opp.name + ' easy!'], C.cyan); }, 1200);
    setTimeout(() => { setIntroStage('countdown'); setIntroCount(3); playFx('whistle'); setCommentary('HIGH NOON approaches...'); }, 2400);
    setTimeout(() => setIntroCount(2), 3100);
    setTimeout(() => setIntroCount(1), 3800);
    setTimeout(() => { setIntroStage('go'); setCommentary('DUEL! May the fastest draw win!'); triggerFlash('goal'); playFx('crowd'); }, 4500);
    setTimeout(() => { setIntroStage(null); startRound(0); }, 5200);
  }, [playFx, addChat, autoChat, triggerFlash, startRound]);

  const exitGame = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(steadyTimerRef.current);
    if (puffIntervalRef.current) clearInterval(puffIntervalRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    navigate('/arcade');
  }, [navigate]);

  useEffect(() => {
    startGame();
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(steadyTimerRef.current);
      if (puffIntervalRef.current) clearInterval(puffIntervalRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // eslint-disable-line

  if (phase === 'menu') return null;

  const opp = opponent || OPPONENTS[0];
  const isIntro       = !!introStage;
  const isStaredown   = phase === 'staredown' && !introStage;
  const isDraw        = phase === 'draw' && !introStage;
  const isPuff        = phase === 'puffing';
  const isCountdown   = phase === 'countdown' && !introStage;
  const isResult      = phase === 'result' || phase === 'round_result';
  const isFinal       = phase === 'final';
  const puffColor     = puffMeter < 20 ? C.text3 : puffMeter < 45 ? C.cyan : puffMeter < 70 ? C.gold : puffMeter < 90 ? C.orange : C.red;
  const phaseLabel    = phase === 'staredown' ? 'STAREDOWN' : phase === 'draw' ? 'DRAW!' : phase === 'puffing' ? 'HOLD...' : (phase === 'result' || phase === 'round_result') ? 'RESULT' : phase === 'final' ? 'MATCH OVER' : phase === 'countdown' ? 'GET READY' : 'DUEL';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; if (['staredown', 'countdown', 'draw'].includes(phase)) shoot(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; if (phase === 'puffing') releasePuff(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; if (['staredown', 'countdown', 'draw'].includes(phase)) shoot(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; if (phase === 'puffing') releasePuff(); }}>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(255,165,0,0.08)' }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>MOOD LAB</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div onClick={() => { playFx('tap'); setShowBlePopup(true); }} data-btn="true" style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, cursor: 'pointer', touchAction: 'none', background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>{bleConnected ? 'Puff' : 'Connect'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
              <span style={{ fontSize: 9 }}>🪙</span><span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: 'monospace' }}>{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={exitGame} data-btn="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, touchAction: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2, 3, 4].map(i => {
                const rr = roundResults[i];
                const isCurr = i === round && !rr;
                return (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, background: rr ? (rr.win ? `${C.green}30` : `${C.red}30`) : isCurr ? `${C.gold}20` : 'rgba(60,40,20,0.4)', border: `2px solid ${rr ? (rr.win ? C.green + '70' : C.red + '70') : isCurr ? C.gold + '70' : 'rgba(139,69,19,0.3)'}`, color: rr ? (rr.win ? C.green : C.red) : isCurr ? C.gold : 'rgba(139,69,19,0.5)' }}>
                    {rr ? (rr.win ? 'W' : rr.foul ? 'F' : 'L') : isCurr ? (round + 1) : ''}
                  </div>
                );
              })}
              <span style={{ fontSize: 8, color: 'rgba(210,170,120,0.6)', marginLeft: 3, fontWeight: 700 }}>R{round + 1}/5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 10, background: 'rgba(20,10,5,0.5)', border: '1px solid rgba(139,69,19,0.3)' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>{score.you}</span>
              <span style={{ fontSize: 10, color: 'rgba(139,69,19,0.6)', fontWeight: 900 }}>:</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: C.orange }}>{score.ai}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', textAlign: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: phase === 'draw' ? C.red : phase === 'staredown' ? C.gold : (phase === 'result' || phase === 'round_result') ? (result?.win ? C.green : C.red) : C.text3 }}>{phaseLabel}</span>
        </div>
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(430 * DPR)} height={Math.round(600 * DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Screen flash */}
        {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(255,215,0,0.35)' : screenFlash === 'save' ? 'rgba(255,165,0,0.2)' : screenFlash === 'miss' ? 'rgba(255,20,20,0.4)' : 'rgba(255,0,0,0.3)', animation: 'flashOverlay 0.4s ease forwards' }} />}

        {/* Confetti */}
        {confettiParticles.map(p => (
          <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
        ))}

        {/* Smoke */}
        {smokeParticles.map(p => (
          <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent)', zIndex: 205, pointerEvents: 'none', filter: 'blur(8px)', animation: `smokeRise ${p.dur}s ease-out forwards` }} />
        ))}

        {/* Puff bubbles */}
        {puffBubbles.map(b => (
          <div key={b.id} style={{ position: 'absolute', left: b.x + '%', bottom: b.y + '%', zIndex: 206, pointerEvents: 'none', animation: `bubbleFloat ${b.dur}s ease-out forwards`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: b.size * 2.5, height: b.size * 2.5, borderRadius: '50%', background: `linear-gradient(135deg, ${C.cyan}, ${C.cyan}80)`, border: `2px solid ${C.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: b.size * 1.2 }}>💨</div>
          </div>
        ))}

        {/* Intro overlay */}
        {introStage && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.94)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: 16, padding: '4px 18px', borderRadius: 20, background: `${C.gold}12`, border: `1px solid ${C.gold}30` }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 4 }}>HIGH NOON SHOWDOWN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, border: `2px solid ${C.cyan}60`, background: `${C.cyan}10`, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>😎</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>YOU</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                {introStage === 'countdown' ? (
                  <div style={{ fontSize: 64, fontWeight: 900, color: C.gold, animation: 'duelCountdownPop 0.7s ease', lineHeight: 1 }}>{introCount}</div>
                ) : introStage === 'go' ? (
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.green, animation: 'duelCountdownPop 0.5s ease', lineHeight: 1 }}>DUEL!</div>
                ) : (
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, animation: 'countPulse 1.5s infinite' }}>VS</div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, border: `2px solid ${C.orange}60`, background: `${C.orange}10`, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{opp.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>{opp.name.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: C.text3 }}>{opp.rank} {opp.record}</div>
              </div>
            </div>
            {(introStage === 'stats' || introStage === 'countdown' || introStage === 'go') && (
              <div style={{ width: '82%', maxWidth: 280, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', animation: 'fadeIn 0.5s ease', marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.gold, marginBottom: 8, textAlign: 'center', letterSpacing: 3 }}>GUNSLINGER STATS</div>
                {[[stats.fastestDraw < 999 ? stats.fastestDraw + 'ms' : '---', 'Fastest Draw', (opp.speed - 50 + Math.floor(Math.random() * 40)) + 'ms'], [stats.wins + '', 'Duels Won', opp.record.split('-')[0]], [stats.fouls + '', 'Fouls', Math.floor(Math.random() * 15) + ''], [stats.streak + '', 'Win Streak', Math.floor(Math.random() * 8) + '']].map(([l, mid, r], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, padding: '2px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, minWidth: 35 }}>{l}</span>
                    <span style={{ fontSize: 8, color: C.text3, flex: 1, textAlign: 'center' }}>{mid}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.orange, minWidth: 35, textAlign: 'right' }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {introStage === 'go' && <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, textAlign: 'center', letterSpacing: 3, animation: 'countPulse 0.5s ease' }}>HIGH NOON!</div>}
            <div style={{ marginTop: 12, fontSize: 8, color: C.text3, letterSpacing: 1 }}>120+ watching — Best of 5</div>
          </div>
        )}

        {/* Staredown overlay */}
        {isStaredown && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, opacity: 0.4 + staredownStage * 0.15, animation: `duelBreathe ${2 - staredownStage * 0.3}s ease-in-out infinite`, letterSpacing: 3 }}>
              {staredownStage < 1 ? '. . .' : '...'}
            </div>
            {staredownText && <div style={{ fontSize: 9, color: C.gold, opacity: 0.7, marginTop: 6, letterSpacing: 1, fontStyle: 'italic' }}>{staredownText}</div>}
            <div style={{ fontSize: 8, color: C.red + '70', marginTop: 8, letterSpacing: 1 }}>TAP BEFORE DRAW = FOUL</div>
          </div>
        )}

        {/* DRAW! overlay */}
        {isDraw && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.red, textShadow: `0 0 50px ${C.red}, 0 0 100px ${C.red}60`, animation: 'countPulse 0.3s infinite', letterSpacing: 5 }}>DRAW!</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginTop: 8, animation: 'countPulse 0.5s infinite', letterSpacing: 2 }}>HOLD TO SHOOT!</div>
          </div>
        )}

        {/* Puffing overlay */}
        {isPuff && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: puffColor, textShadow: `0 0 15px ${puffColor}60`, letterSpacing: 2, marginBottom: 10 }}>
              {puffMeter < 20 ? 'DRAWING...' : puffMeter < 45 ? 'QUICK DRAW' : puffMeter < 70 ? 'POWER SHOT' : puffMeter < 90 ? 'MEGA PUFF' : 'LEGENDARY!'}
            </div>
            <div style={{ width: '70%', maxWidth: 200, margin: '0 auto 6px' }}>
              <UniversalPuffBar power={puffMeter} charging />
            </div>
            <div style={{ fontSize: 9, color: '#fff', marginTop: 6, opacity: 0.7 }}>Release to fire!</div>
          </div>
        )}

        {/* Countdown overlay */}
        {isCountdown && countdown && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, pointerEvents: 'none' }}>
            {typeof countdown === 'number' ? (
              <div style={{ fontSize: 100, fontWeight: 900, color: C.gold, textShadow: `0 0 60px ${C.gold}80`, animation: 'duelCountdownPop 0.8s ease', lineHeight: 1 }}>{countdown}</div>
            ) : (
              <div style={{ fontSize: 42, fontWeight: 900, color: C.red, textShadow: `0 0 50px ${C.red}80`, animation: 'duelCountdownPop 0.6s ease', lineHeight: 1, letterSpacing: 4 }}>{countdown}</div>
            )}
          </div>
        )}

        {/* Result overlay */}
        {isResult && result && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              {result.foul ? (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.red, letterSpacing: 3 }}>FOUL!</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>Drew too early! Round lost.</div>
                </div>
              ) : result.win ? (
                <div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: C.green, textShadow: `0 0 40px ${C.green}60`, lineHeight: 1, animation: 'duelCountdownPop 0.5s ease' }}>{result.you}ms</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.gold, marginTop: 6, letterSpacing: 2 }}>FASTER!</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>vs AI {result.ai}ms</div>
                  {result.bonusCoins > 0 && <div style={{ marginTop: 6, padding: '3px 10px', borderRadius: 8, background: `${C.gold}15`, border: `1px solid ${C.gold}30`, display: 'inline-block' }}><span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{result.bonusLabel} +{result.bonusCoins}</span></div>}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: C.red, lineHeight: 1 }}>{result.you}ms</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.red, marginTop: 6, letterSpacing: 2 }}>OUTDRAWN!</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>AI drew at {result.ai}ms</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final overlay */}
        {isFinal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.85)', backdropFilter: 'blur(8px)' }}>
            <div style={{ textAlign: 'center', padding: 20, maxWidth: 320, width: '90%' }}>
              <div style={{ fontSize: 40, marginBottom: 4 }}>{score.you >= 3 ? '🏆' : '💀'}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: score.you >= 3 ? C.gold : C.red, marginBottom: 4, letterSpacing: 3 }}>{score.you >= 3 ? 'FASTEST GUN!' : 'OUTDRAWN!'}</div>
              <div style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>Final Score: {score.you} - {score.ai}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                {roundResults.map((rr, i) => (
                  <div key={i} style={{ padding: '5px 8px', borderRadius: 8, background: rr.win ? `${C.green}12` : `${C.red}12`, border: `1px solid ${rr.win ? C.green : C.red}25`, textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: rr.win ? C.green : C.red }}>{rr.foul ? 'FOUL' : rr.win ? 'WIN' : 'LOSS'}</div>
                    {!rr.foul && rr.you > 0 && <div style={{ fontSize: 7, color: C.text3, marginTop: 1 }}>{rr.you}ms</div>}
                    {rr.bonus && rr.bonusCoins > 0 && <div style={{ fontSize: 6, color: C.gold, marginTop: 1 }}>+{rr.bonusCoins}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12, padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,69,19,0.15)' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: C.cyan }}>{stats.fastestDraw < 999 ? stats.fastestDraw + 'ms' : '---'}</div><div style={{ fontSize: 7, color: C.text3 }}>Fastest</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: C.gold }}>{stats.avgDraw || '---'}{stats.avgDraw ? 'ms' : ''}</div><div style={{ fontSize: 7, color: C.text3 }}>Average</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: C.red }}>{stats.fouls}</div><div style={{ fontSize: 7, color: C.text3 }}>Fouls</div></div>
              </div>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}><span style={{ color: C.text }}>Earned</span><span style={{ color: C.gold }}>{score.you >= 3 ? '+80' : '+12'} 🪙</span></div>
                {!bleConnected && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.orange, marginTop: 4 }}><span>Without device</span><span>70%</span></div>}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div onClick={(e) => { e.stopPropagation(); startGame(); }} data-btn="true" style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`, border: `1px solid ${C.gold}40`, fontSize: 14, fontWeight: 800, color: C.gold, letterSpacing: 1 }}>REMATCH</div>
                <div onClick={(e) => { e.stopPropagation(); exitGame(); }} data-btn="true" style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,69,19,0.3)', fontSize: 14, fontWeight: 700, color: C.text2 }}>Exit</div>
              </div>
            </div>
          </div>
        )}

        <GameChatOverlay controlsSlot={null} />
      </div>
    </div>
  );
}
