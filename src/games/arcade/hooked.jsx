import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const HOOK_FISH = [
  { name: 'Blue Snap', emoji: '🐟', rarity: 'common', pts: 10, resistance: 0.8, instability: 0.3, tensionRate: 1.0, escapeRate: 0.8, color: C.cyan },
  { name: 'Lunar Carp', emoji: '🐠', rarity: 'common', pts: 10, resistance: 0.9, instability: 0.35, tensionRate: 1.0, escapeRate: 0.9, color: C.cyan },
  { name: 'Pond Darter', emoji: '🐡', rarity: 'common', pts: 10, resistance: 0.7, instability: 0.25, tensionRate: 0.9, escapeRate: 0.7, color: C.cyan },
  { name: 'Neon Koi', emoji: '🎏', rarity: 'rare', pts: 25, resistance: 1.2, instability: 0.5, tensionRate: 1.3, escapeRate: 1.1, color: C.purple },
  { name: 'Glitch Fin', emoji: '🦈', rarity: 'rare', pts: 25, resistance: 1.4, instability: 0.55, tensionRate: 1.4, escapeRate: 1.2, color: C.purple },
  { name: 'Gold Pike', emoji: '🐊', rarity: 'rare', pts: 25, resistance: 1.1, instability: 0.45, tensionRate: 1.2, escapeRate: 1.0, color: C.purple },
  { name: 'Void Eel', emoji: '🐉', rarity: 'legendary', pts: 60, resistance: 1.8, instability: 0.5, tensionRate: 1.8, escapeRate: 1.5, color: C.gold },
  { name: 'Abyssal Ray', emoji: '🦑', rarity: 'legendary', pts: 60, resistance: 2.0, instability: 0.55, tensionRate: 2.0, escapeRate: 1.6, color: C.gold },
];

const HOOK_COMEDY = {
  cast: ['Here goes nothing...', 'Plop! Nice cast!', 'Into the deep...', 'The fish are watching...'],
  wait: ['Any second now...', 'I see bubbles!', 'Something\'s moving down there...', 'The water is still...'],
  bite: ['FISH ON! REEL IT IN!', "IT'S BITING! GO GO GO!", 'BIG ONE! Hold steady!', "Don't let it get away!"],
  caught: ['WHAT A CATCH! 🐟', 'Absolute UNIT!', "That's a trophy fish!", 'The crowd goes WILD!', 'Fish dinner tonight!'],
  snap: ["SNAP! Line's gone 💥", 'That fish just laughed at you', "RIP line tension", 'Too aggressive! The line couldn\'t handle it'],
  escape: ['It got away... 🐟💨', 'That fish is telling stories now', "You'll get the next one!"],
  legendary: ['Is that... a LEGENDARY?!', 'HOLY MOLY what IS that thing!', 'The water is GLOWING!'],
  combo: ['COMBO x', 'DOUBLE CATCH streak!', "The fish can't stop biting!", "You're on FIRE 🔥"],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function Hooked() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const [phase, setPhase] = useState(null); // null|"idle"|"waiting"|"bite"|"reeling"|"caught"|"line_break"|"escaped"
  const [fish, setFish] = useState(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lineTension, setLineTension] = useState(0);
  const [catchProgress, setCatchProgress] = useState(0);
  const [recentCatches, setRecentCatches] = useState([]);
  const [comment, setComment] = useState('');
  const [catches, setCatches] = useState(0);
  const [snaps, setSnaps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [reelSpeed, setReelSpeed] = useState(0);
  const [bobberBounce, setBobberBounce] = useState(false);

  const phaseRef = useRef(phase);
  const catchesRef = useRef(0);
  const snapsRef = useRef(0);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { catchesRef.current = catches; }, [catches]);
  useEffect(() => { snapsRef.current = snaps; }, [snaps]);

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const gameLoopRef = useRef(null);
  const reelRef = useRef(0);
  const holdingRef = useRef(false);
  const tensionRef = useRef(0);
  const progressRef = useRef(0);
  const puffStartRef = useRef(0);
  const fishListRef = useRef([]);
  const activeRef = useRef({ v: false });
  const recentCatchesRef = useRef([]);

  const addChat = useCallback((name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: `${name}: ${msg}`, ts: Date.now(), color }]);
  }, [setGameChatMsgs]);

  const spawnFish = useCallback(() => {
    const roll = Math.random();
    const pool = roll < 0.60 ? HOOK_FISH.filter(f => f.rarity === 'common') : roll < 0.88 ? HOOK_FISH.filter(f => f.rarity === 'rare') : HOOK_FISH.filter(f => f.rarity === 'legendary');
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / DPR, H = canvas.height / DPR;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(DPR, DPR);
    const t = Date.now() * 0.001;
    const tension = tensionRef.current;
    const progress = progressRef.current;
    const p = phaseRef.current;
    const waterY = H * 0.42;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, waterY);
    sky.addColorStop(0, '#0B1026'); sky.addColorStop(0.3, '#1A1040');
    sky.addColorStop(0.6, '#2D1B4E'); sky.addColorStop(0.8, '#5C2D6E'); sky.addColorStop(1.0, '#8B3A62');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, waterY + 4);

    // Stars
    for (let i = 0; i < 20; i++) {
      const sx = (i * 47.3 + 13) % W, sy = (i * 31.7 + 7) % (waterY * 0.6);
      const flicker = 0.3 + Math.sin(t * 1.5 + i) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${flicker})`;
      ctx.beginPath(); ctx.arc(sx, sy, 0.6 + i % 2 * 0.4, 0, Math.PI * 2); ctx.fill();
    }

    // Moon
    const moonGrad = ctx.createRadialGradient(W * 0.78, H * 0.08, 0, W * 0.78, H * 0.08, 18);
    moonGrad.addColorStop(0, 'rgba(255,230,180,0.9)'); moonGrad.addColorStop(0.5, 'rgba(255,220,150,0.4)'); moonGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGrad; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.08, 18, 0, Math.PI * 2); ctx.fill();

    // Water
    const water = ctx.createLinearGradient(0, waterY, 0, H);
    water.addColorStop(0, '#0A2342'); water.addColorStop(0.3, '#071B33'); water.addColorStop(0.6, '#051428'); water.addColorStop(1, '#030E1A');
    ctx.fillStyle = water; ctx.fillRect(0, waterY, W, H - waterY);

    // Wave surface
    ctx.beginPath(); ctx.moveTo(0, waterY);
    for (let x = 0; x <= W; x += 2) {
      const wave1 = Math.sin(x * 0.025 + t * 1.2) * 3;
      const wave2 = Math.sin(x * 0.04 + t * 0.8 + 1) * 2;
      ctx.lineTo(x, waterY + wave1 + wave2);
    }
    ctx.lineTo(W, waterY + 20); ctx.lineTo(0, waterY + 20); ctx.closePath();
    ctx.fillStyle = 'rgba(10,35,66,0.6)'; ctx.fill();

    // Water shimmer
    for (let i = 0; i < 6; i++) {
      const rx = (i * 70 + Math.sin(t + i) * 15) % W;
      const ry = waterY + 8 + i * 12 + Math.sin(t * 0.7 + i * 2) * 3;
      ctx.fillStyle = `rgba(100,180,255,${0.04 + Math.sin(t + i * 1.3) * 0.02})`;
      ctx.fillRect(rx, ry, 20 + Math.sin(t + i) * 8, 1);
    }

    // Dock
    const dockY = waterY - 6, dockW = 60, dockX = W * 0.18;
    ctx.fillStyle = '#3B2415'; ctx.fillRect(dockX, dockY, dockW, 8);
    ctx.fillStyle = '#2A1A0E'; ctx.fillRect(dockX + 8, dockY + 6, 4, 20); ctx.fillRect(dockX + dockW - 12, dockY + 6, 4, 20);
    ctx.fillStyle = '#4A3020';
    for (let i = 0; i < 4; i++) ctx.fillRect(dockX + i * 15 + 2, dockY, 12, 3);

    // Fishing rod
    const rodBase = { x: dockX + dockW - 8, y: dockY - 2 };
    const rodTip = { x: W * 0.52, y: waterY - 30 };
    ctx.strokeStyle = '#5A4030'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(rodBase.x, rodBase.y); ctx.quadraticCurveTo(rodBase.x + 20, rodBase.y - 40, rodTip.x, rodTip.y); ctx.stroke();

    // Fishing line
    const bobberX = W * 0.52 + Math.sin(t * 1.5) * 2;
    const bobFloat = (p === 'bite' || p === 'reeling') ? Math.sin(t * 8) * 4 : Math.sin(t * 1.2) * 1.5;
    const bobberY = waterY + 2 + bobFloat;
    const tensionColor = tension > 80 ? '#FF2222' : tension > 55 ? '#FF8C42' : tension > 30 ? '#FFD93D' : '#60A5FA';
    ctx.strokeStyle = tensionColor; ctx.lineWidth = tension > 80 ? 1.8 : 1;
    ctx.setLineDash(tension > 80 ? [3, 2] : []);
    ctx.beginPath(); ctx.moveTo(rodTip.x, rodTip.y); ctx.lineTo(bobberX, bobberY); ctx.stroke();
    ctx.setLineDash([]);
    const lineDepth = p === 'reeling' ? waterY + 40 + (100 - progress) * 0.8 : waterY + 60;
    ctx.strokeStyle = `${tensionColor}60`; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(bobberX, bobberY); ctx.lineTo(bobberX + Math.sin(t) * 2, lineDepth); ctx.stroke();

    // Bobber
    const bobScale = p === 'bite' ? 1 + Math.sin(t * 12) * 0.15 : 1;
    ctx.save(); ctx.translate(bobberX, bobberY); ctx.scale(bobScale, bobScale);
    ctx.fillStyle = '#FF3333'; ctx.beginPath(); ctx.arc(0, -3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(-0.5, -8, 1, 5);
    ctx.restore();
    if (p === 'bite') {
      const glow = ctx.createRadialGradient(bobberX, bobberY, 0, bobberX, bobberY, 15);
      glow.addColorStop(0, 'rgba(255,100,0,0.3)'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bobberX, bobberY, 15, 0, Math.PI * 2); ctx.fill();
    }

    // Ambient fish
    const fl = fishListRef.current;
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      f.x += f.speed;
      if (f.x > W + 20) f.x = -20;
      if (f.x < -20) f.x = W + 20;
      const fy = f.y + Math.sin(t * f.wobble + i) * 4;
      ctx.save(); ctx.translate(f.x, fy);
      if (f.speed < 0) ctx.scale(-1, 1);
      ctx.fillStyle = `rgba(${f.r},${f.g},${f.b},${f.alpha})`;
      ctx.beginPath(); ctx.ellipse(0, 0, f.size * 1.5, f.size * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-f.size * 1.4, 0); ctx.lineTo(-f.size * 2, -f.size * 0.5); ctx.lineTo(-f.size * 2, f.size * 0.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Splash when reeling near caught
    if (p === 'reeling' && progress > 60) {
      for (let i = 0; i < 4; i++) {
        const sx = bobberX + (Math.random() - 0.5) * 20;
        const sy = waterY - Math.random() * 8;
        ctx.fillStyle = `rgba(150,200,255,${0.2 + Math.random() * 0.2})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Fish emerging
    if (p === 'reeling' && progress > 40) {
      const emergeY = waterY - (progress - 40) * 0.5;
      const wobble = Math.sin(t * 6) * 3;
      // use stored fish emoji from ref
      ctx.font = `${20 + progress * 0.1}px serif`; ctx.textAlign = 'center';
    }

    // Tension meter
    const meterX = W - 22, meterY = waterY - 60, meterH = 80;
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(meterX - 4, meterY, 12, meterH);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.strokeRect(meterX - 4, meterY, 12, meterH);
    const tensionFill = tension / 100;
    const tensionH = meterH * tensionFill;
    const tGrad = ctx.createLinearGradient(0, meterY + meterH, 0, meterY);
    tGrad.addColorStop(0, '#34D399'); tGrad.addColorStop(0.4, '#FFD93D'); tGrad.addColorStop(0.7, '#FF8C42'); tGrad.addColorStop(1, '#FF2222');
    ctx.fillStyle = tGrad; ctx.fillRect(meterX - 3, meterY + meterH - tensionH, 10, tensionH);
    ctx.fillStyle = tensionColor; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(Math.round(tension) + '%', meterX + 2, meterY - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '6px sans-serif';
    ctx.fillText('TENSION', meterX + 2, meterY + meterH + 10);
    if (tension > 75) {
      ctx.fillStyle = `rgba(255,34,34,${0.5 + Math.sin(t * 8) * 0.3})`;
      ctx.font = 'bold 8px sans-serif'; ctx.fillText('SNAP!', meterX + 2, meterY + meterH + 20);
    }

    // Catch log
    const catches = recentCatchesRef.current;
    if (catches.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('CATCHES', 8, waterY - 65);
      catches.forEach((c, i) => {
        const cy2 = waterY - 55 + i * 18;
        ctx.font = '14px serif'; ctx.textAlign = 'left'; ctx.fillText(c.emoji, 8, cy2 + 4);
        ctx.fillStyle = c.color || '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.fillText(c.name, 24, cy2);
        ctx.fillStyle = '#FFD93D'; ctx.font = 'bold 7px sans-serif'; ctx.fillText('+' + c.total, 24, cy2 + 10);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
      });
    }
    ctx.restore();
  }, [DPR]); // eslint-disable-line

  // Canvas loop (Rule 4)
  useEffect(() => {
    if (!canvasRef.current || !phase) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
  });

  const cleanup = useCallback(() => {
    activeRef.current.v = false;
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    holdingRef.current = false;
  }, []);

  const startGameLoop = useCallback((fishData) => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    let catchP = 0, lineT = 0;
    const dt = 1 / 30;
    gameLoopRef.current = setInterval(() => {
      if (!activeRef.current.v) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; return; }
      const reelForce = reelRef.current;
      if (reelForce > 0) {
        lineT = Math.min(100, lineT + reelForce * fishData.tensionRate * 0.8 * dt);
      } else {
        lineT = Math.max(0, lineT - 15 * dt);
      }
      if (reelForce > 0 && lineT < 85) {
        catchP = Math.min(100, catchP + reelForce * 0.35 * dt);
      } else if (reelForce === 0) {
        catchP = Math.max(0, catchP - fishData.escapeRate * 8 * dt);
      }
      if (Math.random() < fishData.instability * dt * 2) {
        lineT = Math.min(100, lineT + fishData.resistance * 5);
      }
      tensionRef.current = lineT; progressRef.current = catchP;
      setLineTension(lineT); setCatchProgress(catchP);

      if (catchP >= 100) {
        clearInterval(gameLoopRef.current); gameLoopRef.current = null;
        setCombo(prevCombo => {
          const comboMult = 1 + prevCombo * 0.15;
          const bonus = Math.round(fishData.pts * (comboMult - 1));
          const total = fishData.pts + bonus;
          setScore(prev => { const ns = prev + total; setBestScore(b => Math.max(b, ns)); return ns; });
          const newCatch = { ...fishData, bonus, total };
          setRecentCatches(prev => { const updated = [newCatch, ...prev].slice(0, 5); recentCatchesRef.current = updated; return updated; });
          setCatches(prev => { catchesRef.current = prev + 1; return prev + 1; });
          setPhase('caught'); phaseRef.current = 'caught';
          const comboStr = prevCombo > 0 ? ` COMBO x${prevCombo + 1}!` : '';
          setComment(`CAUGHT! ${fishData.emoji} ${fishData.name} +${total}pts!${comboStr}`);
          triggerFlash('goal'); spawnConfetti(25); playFx('fishing_catch');
          addChat('Announcer', pick(HOOK_COMEDY.caught), C.gold);
          return prevCombo + 1;
        });
      } else if (lineT >= 100) {
        clearInterval(gameLoopRef.current); gameLoopRef.current = null;
        setSnaps(prev => { snapsRef.current = prev + 1; return prev + 1; }); setCombo(0);
        setPhase('line_break'); phaseRef.current = 'line_break';
        setComment('LINE SNAPPED! 💥 Too much tension!');
        triggerFlash('miss'); triggerShake(); playFx('fishing_snap');
        addChat('Announcer', pick(HOOK_COMEDY.snap), C.red);
      }
    }, 1000 / 30);
  }, [triggerFlash, triggerShake, playFx, addChat, spawnConfetti]);

  const castLine = useCallback(() => {
    if (!activeRef.current.v) return;
    playFx('fishing_cast');
    setPhase('waiting'); phaseRef.current = 'waiting';
    setComment('Line in the water... wait for a bite! 🎣');
    setFish(null); setCatchProgress(0); setLineTension(0); setReelSpeed(0);
    reelRef.current = 0; tensionRef.current = 0; progressRef.current = 0;
    setBobberBounce(false);
    addChat('Announcer', pick(HOOK_COMEDY.wait), C.gold);
    const waitTime = 2000 + Math.random() * 4000;
    const hasFakeBite = Math.random() < 0.3;
    if (hasFakeBite) {
      setTimeout(() => {
        if (!activeRef.current.v) return;
        setComment('...nibble? 👀'); setBobberBounce(true); triggerShake();
        addChat(pick(['BaitMaster', 'DeepPuffer']), 'Was that a nibble?!', C.cyan);
        setTimeout(() => { if (!activeRef.current.v) return; setComment('False alarm! Keep waiting...'); setBobberBounce(false); }, 900);
      }, waitTime * 0.35);
    }
    setTimeout(() => {
      if (!activeRef.current.v) return;
      const f = spawnFish();
      setFish(f); setPhase('bite'); phaseRef.current = 'bite'; setBobberBounce(true);
      setComment(`${f.emoji} ${f.name} is biting! REEL IN!`);
      triggerShake(); playFx('fishing_bite');
      if (f.rarity === 'legendary') addChat('Announcer', pick(HOOK_COMEDY.legendary), C.gold);
      else addChat('Announcer', pick(HOOK_COMEDY.bite), C.gold);
      startGameLoop(f);
    }, waitTime);
  }, [playFx, triggerShake, addChat, spawnFish, startGameLoop]);

  const startGame = useCallback(() => {
    cleanup();
    activeRef.current = { v: true };
    setPhase('idle'); phaseRef.current = 'idle';
    setScore(0); setFish(null); setCatchProgress(0); setLineTension(0);
    setRecentCatches([]); setComment('Cast your line into the deep...');
    setCatches(0); setSnaps(0); setCombo(0); setReelSpeed(0); setBobberBounce(false);
    reelRef.current = 0; holdingRef.current = false; tensionRef.current = 0;
    progressRef.current = 0; puffStartRef.current = 0;
    catchesRef.current = 0; snapsRef.current = 0;
    recentCatchesRef.current = [];
    const ambient = [];
    for (let i = 0; i < 8; i++) {
      ambient.push({ x: Math.random() * 420, y: 280 + Math.random() * 200, speed: (Math.random() - 0.5) * 0.6, size: 4 + Math.random() * 6, wobble: 0.5 + Math.random(), alpha: 0.08 + Math.random() * 0.12, r: Math.floor(40 + Math.random() * 60), g: Math.floor(100 + Math.random() * 100), b: Math.floor(180 + Math.random() * 75) });
    }
    fishListRef.current = ambient;
    addChat('Announcer', pick(HOOK_COMEDY.cast), C.gold);
    setTimeout(() => { if (!activeRef.current.v) return; addChat(pick(['ReelDeal', 'CloudAngler', 'PuffFisher']), pick(['Ready to catch some monsters!', 'Big fish energy today', 'My line is READY']), C.cyan); }, 800);
  }, [cleanup, addChat]);

  const startPuff = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'idle') { castLine(); return; }
    if (p === 'waiting') return;
    if (p !== 'bite' && p !== 'reeling') return;
    if (p === 'bite') { setPhase('reeling'); phaseRef.current = 'reeling'; }
    holdingRef.current = true;
    puffStartRef.current = Date.now();
    playFx('fishing_reel');
  }, [castLine, playFx]);

  const stopPuff = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    const dur = puffStartRef.current ? (Date.now() - puffStartRef.current) / 1000 : 0;
    puffStartRef.current = 0;
    if (dur >= 4.5 && phaseRef.current === 'reeling') {
      progressRef.current = Math.min(100, progressRef.current + 30);
      tensionRef.current = Math.max(0, tensionRef.current - 15);
      setCatchProgress(progressRef.current); setLineTension(tensionRef.current);
      addChat('Announcer', 'BLINKER POWER REEL! 🔥 MASSIVE pull!', C.red); triggerFlash('goal');
    }
    reelRef.current = 0; setReelSpeed(0);
  }, [addChat, triggerFlash]);

  // Reel ramp while holding
  useEffect(() => {
    const p = phase;
    if (p !== 'bite' && p !== 'reeling') return;
    const id = setInterval(() => {
      if (holdingRef.current) {
        const dur = puffStartRef.current ? (Date.now() - puffStartRef.current) / 1000 : 0;
        let targetForce = 5;
        if (dur >= 4.5) targetForce = 20;
        else if (dur >= 2.0) targetForce = 15;
        else if (dur >= 0.8) targetForce = 10;
        reelRef.current = Math.min(targetForce, reelRef.current + targetForce * 0.15);
      } else {
        reelRef.current = Math.max(0, reelRef.current - 8 / 30);
      }
      setReelSpeed(reelRef.current);
    }, 1000 / 30);
    return () => clearInterval(id);
  }, [phase]);

  // BLE: slot 0
  useEffect(() => {
    setBLEHandlers(0, () => startPuff(), () => stopPuff());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => cleanup();
  }, []); // eslint-disable-line

  const isReeling = phase === 'bite' || phase === 'reeling';
  const highTension = lineTension > 55;
  const critTension = lineTension > 80;
  const gameOver = catches >= 5 || snaps >= 3;
  const isResult = phase === 'caught' || phase === 'line_break' || phase === 'escaped';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; startPuff(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; stopPuff(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; e.preventDefault(); startPuff(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; stopPuff(); }}
    >
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Header */}
      <GameHeader
        backTo={() => { cleanup(); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={C.cyan}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.cyan }}>🎣 HOOKED</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{catches}/5 caught</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: snaps >= 2 ? C.red : C.text3 }}>{snaps}/3 snaps</span>
          </div>
        }
        row3={
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>{score} pts</span>
              {combo > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: C.green }}>COMBO x{combo}</span>}
              <span style={{ fontSize: 8, color: C.text3 }}>Best: {bestScore}</span>
            </div>
            {isReeling && (
              <>
                <div style={{ marginBottom: 2 }}>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: catchProgress + '%', height: '100%', borderRadius: 3, transition: 'width 0.05s', background: `linear-gradient(90deg,${C.green}80,${C.green})` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                    <span style={{ fontSize: 7, color: C.green }}>Catch</span>
                    <span style={{ fontSize: 7, fontWeight: 700, color: catchProgress > 80 ? C.green : C.text3 }}>{Math.round(catchProgress)}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: lineTension + '%', height: '100%', borderRadius: 2, transition: 'width 0.05s', background: lineTension > 70 ? `linear-gradient(90deg,${C.orange},${C.red})` : `linear-gradient(90deg,${C.gold}80,${C.orange})` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                    <span style={{ fontSize: 7, color: lineTension > 70 ? C.red : C.orange }}>Tension</span>
                    <span style={{ fontSize: 7, fontWeight: 700, color: lineTension > 70 ? C.red : C.text3 }}>{Math.round(lineTension)}%{critTension ? ' DANGER!' : ''}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * DPR)} height={Math.round(600 * DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Fish info overlay */}
        {isReeling && fish && (
          <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: fish.color, textShadow: `0 0 10px ${fish.color}40` }}>{fish.emoji} {fish.name}</div>
            <div style={{ fontSize: 8, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{fish.rarity} · {fish.pts}pts</div>
          </div>
        )}

        {/* Commentary */}
        {comment && (
          <div style={{ position: 'absolute', top: isReeling ? 40 : 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '4px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 300, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.text, fontStyle: 'italic' }}>{comment}</div>
          </div>
        )}

        {/* Result overlay */}
        {isResult && gameOver && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{catches > 0 ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: catches > 0 ? C.green : C.red }}>{catches > 0 ? 'GREAT HAUL!' : 'GAME OVER'}</div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{catches} fish caught · {snaps} line snaps</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, marginTop: 6 }}>{score} pts</div>
            {combo > 1 && <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>Best combo: x{combo}</div>}
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>CATCH LOG</div>
              {recentCatches.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                  <span style={{ fontSize: 14 }}>{c.emoji}</span>
                  <span style={{ fontSize: 9, color: c.color, fontWeight: 700 }}>{c.name}</span>
                  <span style={{ fontSize: 8, color: C.gold, fontWeight: 700, marginLeft: 'auto' }}>+{c.total}</span>
                  {c.bonus > 0 && <span style={{ fontSize: 7, color: C.green }}>({c.bonus} combo)</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div data-btn="true" onClick={() => startGame()} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Play Again</div>
              <div data-btn="true" onClick={() => { awardGame('hooked', catches > 0 ? 'win' : 'lose'); cleanup(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={() => { awardGame('hooked', catches > 0 ? 'win' : 'lose'); cleanup(); navigate('/me'); }} style={{ padding: '8px 16px', borderRadius: 10, cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '6px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {phase === 'idle' && (
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); castLine(); }} style={{ padding: '14px 40px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', touchAction: 'none', background: `linear-gradient(135deg,${C.cyan}20,${C.blue}10)`, border: `2px solid ${C.cyan}30`, animation: 'pulse 2s infinite', userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, letterSpacing: 2 }}>CAST LINE</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Tap or puff to cast</div>
            </div>
          )}
          {isReeling && !holdingRef.current && (
            <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: critTension ? 'rgba(255,34,34,0.1)' : 'rgba(0,229,255,0.06)', border: `1px solid ${critTension ? C.red + '30' : C.cyan + '20'}` }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: critTension ? C.red : C.cyan, letterSpacing: 1 }}>{critTension ? 'EASE UP! LINE BREAKING!' : 'HOLD TO REEL IN!'}</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Puff longer = stronger reel</div>
            </div>
          )}
          {phase === 'waiting' && (
            <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 11, color: C.cyan, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>Waiting for bite... 🎣</span>
            </div>
          )}
          {isResult && !gameOver && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); castLine(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Cast Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); awardGame('hooked', catches > 0 ? 'win' : 'lose'); cleanup(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
