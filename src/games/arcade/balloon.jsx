import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const BP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const BP_AI_PLAYERS = [
  {name:'CautiousCarl',emoji:'🐢',strategy:'cautious',taunt:'Easy does it...'},
  {name:'YOLO Yolanda',emoji:'🔥',strategy:'reckless',taunt:'FULL SEND BABY'},
  {name:'RandomRick',emoji:'🎲',strategy:'random',taunt:'Who knows lol'},
  {name:'SmoothSam',emoji:'😎',strategy:'cautious',taunt:'Calculated risk'},
  {name:'MadMax420',emoji:'💀',strategy:'reckless',taunt:'Send it or go home'},
  {name:'NervousNate',emoji:'😰',strategy:'cautious',taunt:'Oh god oh no...'},
  {name:'ChillChris',emoji:'😌',strategy:'random',taunt:'Vibes only bro'},
  {name:'BoldBella',emoji:'💪',strategy:'reckless',taunt:'I eat balloons for breakfast'},
  {name:'SneakySue',emoji:'🦊',strategy:'cautious',taunt:'Patience is a virtue...'},
  {name:'TurboTom',emoji:'⚡',strategy:'reckless',taunt:'SPEED RUN LETS GO'},
];
const BP_COMMENTS = {
  small: ['Baby puff','My grandma hits harder','Ant-sized','Whisper puff','Barely a breeze'],
  big: ['MADMAN!','FULL SEND!','Balloon said YIKES','LUNGS OF STEEL','Risky business!'],
  blinker: ['BLINKER PUFF! Trying to end it in one shot','ABSOLUTE PSYCHOPATH','BLINKER MODE ACTIVATED!!'],
  pop: ['BOOOOM!','THE BALLOON HAS LEFT THE CHAT','R.I.P. BALLOON','POP! Too powerful!'],
  shaking: ['IT COULD GO ANY MOMENT!','DANGER ZONE!','The balloon is SWEATING'],
  survive: ['Living on the edge!','Still alive... for now','That was CLOSE'],
};
const BP_PLAYER_COLORS = ['#00E5FF','#FF6B8A','#FFD93D','#7CFF6B','#C084FC','#FF8800','#34D399','#60A5FA'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const getBalloonColor = pct => pct < 30 ? '#4CAF50' : pct < 50 ? '#8BC34A' : pct < 65 ? '#FFEB3B' : pct < 75 ? '#FF9800' : pct < 85 ? '#FF5722' : '#F44336';

export default function BalloonPop() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [bpPhase, setBpPhase] = useState(null);
  const [bpPlayers, setBpPlayers] = useState([]);
  const [bpCurrentTurn, setBpCurrentTurn] = useState(0);
  const [bpAirLevel, setBpAirLevel] = useState(0);
  const [bpPopThreshold, setBpPopThreshold] = useState(100);
  const [bpPuffAmount, setBpPuffAmount] = useState(0);
  const [bpCharging, setBpCharging] = useState(false);
  const [bpComment, setBpComment] = useState('');
  const [bpRound, setBpRound] = useState(0);
  const [bpLoser, setBpLoser] = useState(null);
  const [bpShaking, setBpShaking] = useState(false);
  const [bpWinner, setBpWinner] = useState(null);
  const [bpEliminatedList, setBpEliminatedList] = useState([]);

  // Refs for stale closures
  const phaseRef = useRef(null);
  const playersRef = useRef([]);
  const currentTurnRef = useRef(0);
  const airLevelRef = useRef(0);
  const thresholdRef = useRef(100);
  const chargingRef = useRef(false);
  const shakingRef = useRef(false);
  const guardRef = useRef(null);

  useEffect(() => { phaseRef.current = bpPhase; }, [bpPhase]);
  useEffect(() => { playersRef.current = bpPlayers; }, [bpPlayers]);
  useEffect(() => { currentTurnRef.current = bpCurrentTurn; }, [bpCurrentTurn]);
  useEffect(() => { airLevelRef.current = bpAirLevel; }, [bpAirLevel]);
  useEffect(() => { thresholdRef.current = bpPopThreshold; }, [bpPopThreshold]);
  useEffect(() => { chargingRef.current = bpCharging; }, [bpCharging]);
  useEffect(() => { shakingRef.current = bpShaking; }, [bpShaking]);

  const bpCanvasRef = useRef(null);
  const bpAnimRef = useRef(null);
  const bpParticles = useRef([]);
  const bpBokeh = useRef([]);
  const bpConfettiParts = useRef([]);
  const bpChargeInterval = useRef(null);
  const bpPuffStart = useRef(0);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const bpSpawnParticle = (x, y, color) => {
    bpParticles.current.push({ x, y, color, vx: (Math.random() - 0.5) * 4, vy: -1 - Math.random() * 3, life: 1, maxLife: 1, size: 3 + Math.random() * 5 });
  };
  const bpSpawnExplosion = (cx, cy) => {
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2; const sp = 3 + Math.random() * 6;
      bpParticles.current.push({ x: cx, y: cy, color: ['#FF4D8D','#FFD93D','#00E5FF','#C084FC','#FF4444','#FB923C'][i % 6], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2 + Math.random() * 0.5, maxLife: 1.5, size: 3 + Math.random() * 5 });
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = bpCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const airLevel = airLevelRef.current;
    const threshold = thresholdRef.current;
    const phase = phaseRef.current;
    const shaking = shakingRef.current;
    const charging = chargingRef.current;
    const players = playersRef.current;
    const currentTurn = currentTurnRef.current;
    const airPct = threshold > 0 ? Math.min(100, (airLevel / threshold) * 100) : 0;
    const nearPop = airPct > 70, dangerZone = airPct > 85;
    const t = Date.now() * 0.001;

    // Dark carnival background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (dangerZone) { bgGrad.addColorStop(0, '#1a0000'); bgGrad.addColorStop(0.4, '#3d0a0a'); bgGrad.addColorStop(0.7, '#6b1a1a'); bgGrad.addColorStop(1, '#1a0505'); }
    else if (nearPop) { bgGrad.addColorStop(0, '#0a0520'); bgGrad.addColorStop(0.4, '#1a0a3d'); bgGrad.addColorStop(0.7, '#3d1a3d'); bgGrad.addColorStop(1, '#150a20'); }
    else { bgGrad.addColorStop(0, '#060818'); bgGrad.addColorStop(0.3, '#0c1030'); bgGrad.addColorStop(0.6, '#141850'); bgGrad.addColorStop(1, '#080c20'); }
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

    // Bokeh lights
    if (bpBokeh.current.length === 0) {
      for (let i = 0; i < 20; i++) {
        bpBokeh.current.push({ x: Math.random() * W, y: Math.random() * H * 0.7, r: 8 + Math.random() * 20, color: ['#FF4D8D','#FFD93D','#00E5FF','#C084FC','#34D399','#FB923C'][i % 6], phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 1.5 });
      }
    }
    bpBokeh.current.forEach(b => {
      const pulse = 0.15 + Math.sin(t * b.speed + b.phase) * 0.1;
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * BP_DPR);
      grad.addColorStop(0, b.color + (dangerZone ? '40' : '30')); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * BP_DPR * (0.8 + pulse * 0.4), 0, Math.PI * 2); ctx.fill();
    });

    // Vignette
    const vigGrad = ctx.createRadialGradient(W / 2, H * 0.4, W * 0.2, W / 2, H * 0.4, W * 0.7);
    vigGrad.addColorStop(0, 'transparent'); vigGrad.addColorStop(1, 'rgba(0,0,0,' + (dangerZone ? 0.7 : nearPop ? 0.5 : 0.35) + ')');
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, W, H);

    // Balloon center
    const bCX = W / 2, bCY = H * 0.35;
    const bScale = 0.5 + (airPct / 100) * 1.2;
    const bRadius = 40 * BP_DPR * bScale;
    const bColor = getBalloonColor(airPct);

    if (phase !== 'popped' && phase !== 'result') {
      const glowGrad = ctx.createRadialGradient(bCX, bCY, bRadius * 0.3, bCX, bCY, bRadius * 2);
      glowGrad.addColorStop(0, bColor + '25'); glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(bCX, bCY, bRadius * 2, 0, Math.PI * 2); ctx.fill();

      const wobX = shaking ? (Math.sin(t * 25) * 4 * BP_DPR) : 0;
      const wobY = shaking ? (Math.cos(t * 30) * 3 * BP_DPR) : 0;
      const inflateOsc = charging ? (Math.sin(t * 12) * 2 * BP_DPR) : 0;

      ctx.save(); ctx.translate(bCX + wobX, bCY + wobY);
      const ballGrad = ctx.createRadialGradient(-bRadius * 0.3, -bRadius * 0.3, 0, 0, 0, bRadius);
      ballGrad.addColorStop(0, bColor + 'FF'); ballGrad.addColorStop(0.6, bColor + 'DD'); ballGrad.addColorStop(1, bColor + '88');
      ctx.fillStyle = ballGrad;
      ctx.beginPath(); ctx.ellipse(0, 0, bRadius + inflateOsc, bRadius * 1.2 + inflateOsc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(-bRadius * 0.25, -bRadius * 0.35, bRadius * 0.2, bRadius * 0.35, Math.PI * -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bColor + 'CC';
      ctx.beginPath(); ctx.moveTo(-3 * BP_DPR, bRadius * 1.2); ctx.lineTo(3 * BP_DPR, bRadius * 1.2); ctx.lineTo(0, bRadius * 1.2 + 6 * BP_DPR); ctx.closePath(); ctx.fill();
      // String
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1 * BP_DPR; ctx.beginPath();
      ctx.moveTo(0, bRadius * 1.2 + 6 * BP_DPR);
      const stringLen = 50 * BP_DPR;
      for (let s = 0; s < stringLen; s += 4) { ctx.lineTo(Math.sin(s * 0.15 + t * 2) * 3 * BP_DPR, bRadius * 1.2 + 6 * BP_DPR + s); }
      ctx.stroke(); ctx.restore();

      // Air % badge
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const badgeW = 44 * BP_DPR, badgeH = 18 * BP_DPR;
      const badgeX = bCX + bRadius + 10 * BP_DPR, badgeY = bCY - bRadius;
      ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6 * BP_DPR); ctx.fill();
      ctx.fillStyle = bColor; ctx.font = 'bold ' + Math.round(10 * BP_DPR) + 'px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(airPct) + '%', badgeX + badgeW / 2, badgeY + badgeH / 2);
    }

    // Particles
    bpParticles.current = bpParticles.current.filter(p => {
      p.life -= 0.016; if (p.life <= 0) return false;
      p.x += p.vx; p.y += p.vy; p.vy += 0.15;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * BP_DPR * alpha, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; return true;
    });

    // Confetti canvas
    bpConfettiParts.current = bpConfettiParts.current.filter(c => {
      c.life -= 0.016; if (c.life <= 0) return false;
      c.x += c.vx; c.y += c.vy; c.vy += 0.12; c.vx *= 0.99; c.rot += c.rotV;
      const alpha = Math.max(0, c.life / 3);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot * Math.PI / 180);
      ctx.globalAlpha = alpha; ctx.fillStyle = c.color; ctx.fillRect(-c.w / 2, -c.h / 2, c.w * BP_DPR, c.h * BP_DPR);
      ctx.globalAlpha = 1; ctx.restore(); return true;
    });

    // Player indicators along bottom arc
    const arcCX = W / 2, arcCY = H * 0.78;
    const arcR = Math.min(W * 0.38, 140 * BP_DPR);
    players.forEach((p, i) => {
      const totalP = players.length || 1;
      const angle = Math.PI + (i / (totalP - 1 || 1)) * Math.PI;
      const px = arcCX + Math.cos(angle) * arcR;
      const py = arcCY + Math.sin(angle) * arcR * 0.35;
      const isCur = i === currentTurn && phase !== 'popped' && phase !== 'result';
      const isDead = !p.alive;
      const dotR = isCur ? 14 * BP_DPR : 10 * BP_DPR;

      if (isCur) {
        ctx.fillStyle = (p.isYou ? C.cyan : C.orange) + '30';
        ctx.beginPath(); ctx.arc(px, py, dotR * 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = isDead ? '#333' : (BP_PLAYER_COLORS[i % 8] + (isCur ? 'FF' : '80'));
      ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.font = Math.round((isCur ? 12 : 9) * BP_DPR) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isDead ? 'X' : p.emoji, px, py);
      ctx.fillStyle = isDead ? '#555' : (isCur ? (p.isYou ? C.cyan : C.orange) : C.text3);
      ctx.font = Math.round((isCur ? 8 : 7) * BP_DPR) + 'px sans-serif';
      ctx.fillText(p.isYou ? 'YOU' : p.name.slice(0, 6), px, py + dotR + 8 * BP_DPR);
    });

    // Danger pulse
    if (dangerZone && phase !== 'popped' && phase !== 'result') {
      const pulse = Math.abs(Math.sin(t * 4)) * 0.08;
      ctx.fillStyle = 'rgba(255,0,0,' + pulse + ')'; ctx.fillRect(0, 0, W, H);
    }
  }, []); // eslint-disable-line

  // Canvas loop — restarts every render (Rule 4)
  useEffect(() => {
    if (!bpCanvasRef.current || !bpPhase) return;
    if (bpAnimRef.current) cancelAnimationFrame(bpAnimRef.current);
    { const loop = () => { drawCanvas(); bpAnimRef.current = requestAnimationFrame(loop); }; bpAnimRef.current = requestAnimationFrame(loop); }
    return () => { if (bpAnimRef.current) { cancelAnimationFrame(bpAnimRef.current); bpAnimRef.current = null; } };
  });

  const bpFindNextAlive = (players, fromIdx) => {
    for (let i = 1; i <= players.length; i++) {
      const ni = (fromIdx + i) % players.length;
      if (players[ni].alive) return ni;
    }
    return null;
  };

  const bpProcessPuff = useCallback((pidx, amount, players, airLevel, threshold) => {
    const ca = Math.max(3, Math.min(30, amount));
    const newAir = airLevel + ca;
    const popped = newAir >= threshold;
    const up = players.map((p, i) => i === pidx ? { ...p, puffs: p.puffs + 1, totalAir: p.totalAir + ca } : p);
    const dAir = Math.min(newAir, threshold);

    setBpPlayers(up); playersRef.current = up;
    setBpAirLevel(newAir); airLevelRef.current = newAir;
    setBpRound(r => r + 1);

    if (ca >= 20) { setBpComment(pick(BP_COMMENTS.blinker)); addChat(pick(BP_COMMENTS.blinker)); }
    else if (ca <= 5) { setBpComment(pick(BP_COMMENTS.small)); }
    else if (ca >= 15) { setBpComment(pick(BP_COMMENTS.big)); addChat(pick(BP_COMMENTS.big)); }
    else { setBpComment(pick(BP_COMMENTS.survive)); }

    const nearPop = dAir > threshold * 0.7;
    if (nearPop && !popped) {
      setBpShaking(true); shakingRef.current = true;
      if (dAir > threshold * 0.85) setTimeout(() => { setBpComment(pick(BP_COMMENTS.shaking)); addChat(pick(BP_COMMENTS.shaking)); }, 600);
    }

    if (popped) {
      setBpShaking(false); shakingRef.current = false;
      const elimPlayer = up[pidx];
      setBpLoser(elimPlayer); setBpPhase('popped'); phaseRef.current = 'popped';
      setBpComment(pick(BP_COMMENTS.pop));
      playFx('error'); triggerShake(); triggerFlash('miss'); spawnConfetti(10, ['#FF4444', '#FF8800', '#FFCC00']);
      addChat((elimPlayer.isYou ? 'YOU' : elimPlayer.name) + ' POPPED IT!');
      if (bpCanvasRef.current) bpSpawnExplosion(bpCanvasRef.current.width / 2, bpCanvasRef.current.height * 0.35);
      const newPlayers = up.map((p, i) => i === pidx ? { ...p, alive: false } : p);
      setBpPlayers(newPlayers); playersRef.current = newPlayers;
      setBpEliminatedList(prev => [...prev, elimPlayer]);
      const aliveList = newPlayers.filter(p => p.alive);

      setTimeout(() => {
        if (!guardRef.current?.v) return;
        if (aliveList.length <= 1) {
          const winner = aliveList[0] || null;
          setBpWinner(winner); setBpPhase('result'); phaseRef.current = 'result';
          if (winner && winner.isYou) {
            spawnConfetti(50, [C.gold, C.green, C.cyan, C.pink]); playFx('win'); triggerFlash('goal');
            awardGame('balloon', 'win');
            addChat('LAST ONE STANDING! YOU WIN!');
          } else {
            playFx('lose'); awardGame('balloon', 'lose');
            if (winner) addChat(winner.name + ' is the SOLE SURVIVOR!');
          }
        } else {
          const newThreshold = 80 + Math.floor(Math.random() * 41);
          setBpAirLevel(0); airLevelRef.current = 0;
          setBpPopThreshold(newThreshold); thresholdRef.current = newThreshold;
          setBpShaking(false); shakingRef.current = false;
          addChat('New balloon! ' + aliveList.length + ' players remain.');
          const nextAlive = bpFindNextAlive(newPlayers, pidx);
          if (nextAlive !== null) {
            setBpCurrentTurn(nextAlive); currentTurnRef.current = nextAlive;
            if (newPlayers[nextAlive].isAI) {
              setBpPhase('ai_turn'); phaseRef.current = 'ai_turn';
              setTimeout(() => bpDoAITurn(newPlayers, nextAlive, 0, newThreshold), 1500 + Math.random() * 1000);
            } else {
              setBpPhase('playing'); phaseRef.current = 'playing';
              setBpComment((newPlayers[nextAlive].isYou ? 'YOUR' : newPlayers[nextAlive].name + '\'s') + ' TURN!');
              playFx('select');
            }
          }
        }
      }, 2200);
      return;
    }

    const nextAlive = bpFindNextAlive(up, pidx);
    if (nextAlive === null) return;
    setBpCurrentTurn(nextAlive); currentTurnRef.current = nextAlive;
    if (up[nextAlive].isAI) {
      setBpPhase('ai_turn'); phaseRef.current = 'ai_turn';
      setTimeout(() => bpDoAITurn(up, nextAlive, newAir, threshold), 1000 + Math.random() * 1500);
    } else {
      setBpPhase('playing'); phaseRef.current = 'playing';
      const tn = up[nextAlive].isYou ? 'YOUR' : up[nextAlive].name + '\'s';
      setBpComment(tn + ' TURN!'); playFx('select');
      addChat(tn + ' turn!');
    }
  }, [addChat, playFx, spawnConfetti, triggerFlash, triggerShake, awardGame]); // eslint-disable-line

  const bpDoAITurn = useCallback((players, idx, airLevel, threshold) => {
    const p = players[idx]; if (!p || !p.alive) return;
    const strat = p.strategy;
    const amt = strat === 'cautious' ? 3 + Math.floor(Math.random() * 5) : strat === 'reckless' ? 10 + Math.floor(Math.random() * 13) : 5 + Math.floor(Math.random() * 10);
    setBpCharging(true); chargingRef.current = true; setBpPuffAmount(0);
    addChat(p.name + ': ' + pick([p.taunt, 'Here goes nothing...', 'Please dont pop']));
    const dur = 400 + (amt / 25) * 1800; const st = Date.now();
    const iv = setInterval(() => { setBpPuffAmount(Math.min(100, (Date.now() - st) / dur * 100)); }, 50);
    setTimeout(() => {
      clearInterval(iv); setBpCharging(false); chargingRef.current = false; setBpPuffAmount(0);
      playFx('kick'); bpProcessPuff(idx, amt, players, airLevel, threshold);
    }, dur);
  }, [addChat, playFx, bpProcessPuff]);

  const bpTapInflate = useCallback(() => {
    if (phaseRef.current !== 'playing' || chargingRef.current) return;
    const cur = playersRef.current[currentTurnRef.current];
    if (cur && cur.isAI) return;
    const amt = 3 + Math.floor(Math.random() * 3);
    playFx('tap');
    bpProcessPuff(currentTurnRef.current, amt, playersRef.current, airLevelRef.current, thresholdRef.current);
  }, [playFx, bpProcessPuff]);

  const bpStartCharge = useCallback(() => {
    if (phaseRef.current !== 'playing' || chargingRef.current) return;
    const cur = playersRef.current[currentTurnRef.current];
    if (cur && cur.isAI) return;
    setBpCharging(true); chargingRef.current = true; setBpPuffAmount(0);
    bpPuffStart.current = Date.now(); playFx('charge');
    bpChargeInterval.current = setInterval(() => {
      const e = (Date.now() - bpPuffStart.current) / 1000;
      setBpPuffAmount(Math.min(100, (e / 4.5) * 100));
      if (e >= 5.0) bpStopCharge();
    }, 50);
  }, [playFx]); // eslint-disable-line

  const bpStopCharge = useCallback(() => {
    if (!chargingRef.current) return;
    setBpCharging(false); chargingRef.current = false;
    if (bpChargeInterval.current) { clearInterval(bpChargeInterval.current); bpChargeInterval.current = null; }
    const e = (Date.now() - bpPuffStart.current) / 1000;
    let amt;
    if (e < 0.8) amt = 8 + Math.round(Math.random() * 3);
    else if (e < 2.0) amt = 11 + Math.round(Math.random() * 4);
    else amt = 13 + Math.round(Math.random() * 3);
    playFx('kick'); setBpPuffAmount(0);
    bpProcessPuff(currentTurnRef.current, amt, playersRef.current, airLevelRef.current, thresholdRef.current);
  }, [playFx, bpProcessPuff]);

  const bpBlinkerInflate = useCallback(() => {
    if (phaseRef.current !== 'playing' || chargingRef.current) return;
    const cur = playersRef.current[currentTurnRef.current];
    if (cur && cur.isAI) return;
    const amt = 20 + Math.floor(Math.random() * 11);
    playFx('kick'); triggerShake();
    addChat('BLINKER INFLATION! INSANE RISK!');
    bpProcessPuff(currentTurnRef.current, amt, playersRef.current, airLevelRef.current, thresholdRef.current);
  }, [playFx, triggerShake, addChat, bpProcessPuff]);

  const startGame = useCallback(() => {
    if (bpAnimRef.current) { cancelAnimationFrame(bpAnimRef.current); bpAnimRef.current = null; }
    if (bpChargeInterval.current) { clearInterval(bpChargeInterval.current); bpChargeInterval.current = null; }
    if (guardRef.current) guardRef.current.v = false;
    const guard = { v: true }; guardRef.current = guard;
    bpParticles.current = []; bpBokeh.current = []; bpConfettiParts.current = [];

    const shuffled = [...BP_AI_PLAYERS].sort(() => Math.random() - 0.5);
    const aiP = shuffled.slice(0, 7).map((a, i) => ({ ...a, isYou: false, isAI: true, isHuman: false, alive: true, puffs: 0, totalAir: 0, color: BP_PLAYER_COLORS[(i + 1) % 8] }));
    const youIdx = Math.floor(Math.random() * (aiP.length + 1));
    aiP.splice(youIdx, 0, { name: 'You', emoji: '\uD83D\uDE24', isYou: true, isAI: false, isHuman: false, alive: true, puffs: 0, totalAir: 0, strategy: 'human', color: BP_PLAYER_COLORS[0] });
    const players = aiP;
    const threshold = 80 + Math.floor(Math.random() * 41);

    setBpPlayers(players); playersRef.current = players;
    setBpCurrentTurn(0); currentTurnRef.current = 0;
    setBpAirLevel(0); airLevelRef.current = 0;
    setBpPopThreshold(threshold); thresholdRef.current = threshold;
    setBpPuffAmount(0); setBpCharging(false); chargingRef.current = false;
    setBpComment(''); setBpRound(0); setBpLoser(null);
    setBpShaking(false); shakingRef.current = false;
    setBpWinner(null); setBpEliminatedList([]);
    setBpPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('8 players sit down... the balloon awaits.');

    setTimeout(() => { if (!guard.v) return; addChat('The balloon is ready...'); }, 2000);
    setTimeout(() => {
      if (!guard.v) return;
      setBpPhase('playing'); phaseRef.current = 'playing';
      setBpComment('Let the game begin!'); playFx('whistle');
      addChat('INFLATE! First player, go!');
      if (players[0].isAI) setTimeout(() => bpDoAITurn(players, 0, 0, threshold), 1200);
    }, 3000);
  }, [playFx, addChat, bpDoAITurn]);

  // BLE handlers
  useEffect(() => {
    setBLEHandlers(0, () => bpStartCharge(), () => bpStopCharge());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => {
      if (guardRef.current) guardRef.current.v = false;
      if (bpChargeInterval.current) clearInterval(bpChargeInterval.current);
      if (bpAnimRef.current) cancelAnimationFrame(bpAnimRef.current);
    };
  }, []); // eslint-disable-line

  const curP = bpPlayers[bpCurrentTurn];
  const isYourTurn = curP && curP.isYou && bpPhase === 'playing';
  const airPct = bpPopThreshold > 0 ? Math.min(100, (bpAirLevel / bpPopThreshold) * 100) : 0;
  const dangerZone = airPct > 85;
  const aliveCount = bpPlayers.filter(p => p.alive).length;
  const won = bpWinner && bpWinner.isYou;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#060818,#0c1030,#141850,#080c20)', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: `1px solid ${dangerZone ? 'rgba(255,50,50,0.15)' : 'rgba(255,77,141,0.1)'}` }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div data-back="true" onClick={() => { if (guardRef.current) guardRef.current.v = false; if (bpChargeInterval.current) clearInterval(bpChargeInterval.current); navigate('/arcade'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: dangerZone ? C.red : C.pink }}>🎈 BALLOON POP</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{aliveCount}/8 alive</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {bpRound + 1}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: curP ? (curP.isYou ? C.cyan : C.orange) : C.text3 }}>
            {bpPhase === 'intro' ? 'Preparing...' : bpPhase === 'result' ? 'Game Over' : bpPhase === 'popped' ? 'POP!' : curP ? (curP.isYou ? 'YOUR TURN' : curP.name + '\'s turn') : '...'}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={bpCanvasRef} width={Math.round(420 * BP_DPR)} height={Math.round(600 * BP_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Intro overlay */}
        {bpPhase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎈</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, color: C.pink, textAlign: 'center' }}>BALLOON POP</div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700 }}>DON'T POP IT!</div>
            <div style={{ marginTop: 16, fontSize: 11, color: C.text3, animation: 'pulse 1s infinite' }}>{bpPlayers.length} players — Getting ready...</div>
          </div>
        )}

        {/* Popped overlay */}
        {bpPhase === 'popped' && bpLoser && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,0,0,0.6)', animation: 'fadeIn 0.3s ease', pointerEvents: 'none' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💥🎈💥</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{bpLoser.isYou ? 'YOU POPPED IT!' : bpLoser.name + ' POPPED IT!'}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>{aliveCount} players remain</div>
          </div>
        )}

        {/* Result overlay */}
        {bpPhase === 'result' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '👑' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : C.red }}>{won ? 'LAST ONE STANDING!' : bpWinner ? bpWinner.name + ' WINS!' : 'Game Over!'}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>+{won ? 80 : 10} coins</div>
            <div style={{ marginTop: 14, textAlign: 'left', width: '80%', maxWidth: 260 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>ELIMINATION ORDER</div>
              {bpEliminatedList.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <span style={{ fontSize: 8, color: C.red }}>💀 #{i + 1}</span>
                  <span style={{ fontSize: 9, color: C.text2 }}>{p.isYou ? 'You' : p.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.pink}15`, border: `1px solid ${C.pink}30`, fontSize: 13, fontWeight: 800, color: C.pink }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {bpCharging && (
          <div style={{ width: '90%', maxWidth: 300 }}>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: bpPuffAmount + '%', height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${C.orange},${C.red})`, transition: 'width 0.05s' }} />
            </div>
          </div>
        )}
        {isYourTurn && !bpCharging && (
          <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); bpTapInflate(); }} style={{ flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}20,${C.purple}10)`, border: `2px solid ${C.cyan}30`, userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>TAP</div>
              <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+3-5%</div>
            </div>
            <div
              data-btn="true"
              onMouseDown={(e) => { e.stopPropagation(); bpStartCharge(); }}
              onMouseUp={(e) => { e.stopPropagation(); bpStopCharge(); }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); bpStartCharge(); }}
              onTouchEnd={(e) => { e.stopPropagation(); bpStopCharge(); }}
              onTouchCancel={(e) => { e.stopPropagation(); bpStopCharge(); }}
              style={{ flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,rgba(255,165,0,0.12),rgba(255,70,70,0.06))`, border: `2px solid rgba(255,165,0,0.25)`, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>PUFF</div>
              <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +8-15%</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); bpBlinkerInflate(); }} style={{ flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)', animation: 'pulse 1.5s infinite', userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
              <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+20-30%!</div>
            </div>
          </div>
        )}
        {isYourTurn && bpCharging && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.2)' }}>
            <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>INFLATING... release to puff!</span>
          </div>
        )}
        {bpPhase === 'ai_turn' && curP && curP.isAI && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.15)' }}>
            <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{curP.name} is inflating...</span>
            {bpCharging && <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', margin: '4px auto 0' }}><div style={{ width: bpPuffAmount + '%', height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${C.orange},${C.red})`, transition: 'width 0.05s' }} /></div>}
          </div>
        )}
        {bpComment && <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{bpComment}</div>}
      </div>
    </div>
  );
}
