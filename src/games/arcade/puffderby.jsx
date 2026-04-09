import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const PD_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const PD_HORSE_EMOJIS = ['🐎', '🏇', '🦄', '🐴', '🎠', '🦒'];
const PD_HORSE_NAMES = ['Thunder Puff', 'Blinker Bolt', 'Cloud Chaser', 'Sativa Sprint', 'Indica Cruise', 'Hybrid Hustle'];
const PD_HORSE_STATS = [
  { speed: 1.0, stamina: 0.9, luck: 0.5 }, { speed: 1.2, stamina: 0.7, luck: 0.3 },
  { speed: 0.8, stamina: 1.2, luck: 0.7 }, { speed: 1.3, stamina: 0.6, luck: 0.2 },
  { speed: 0.7, stamina: 1.3, luck: 0.8 }, { speed: 1.0, stamina: 1.0, luck: 0.5 },
];
const PD_AI = [
  { bs: 0.6, bc: 0.15, bz: 2.5, rc: 0.1 }, { bs: 0.9, bc: 0.25, bz: 3.0, rc: 0.05 },
  { bs: 0.5, bc: 0.08, bz: 1.5, rc: 0.15 }, { bs: 1.0, bc: 0.3, bz: 3.5, rc: 0.03 },
  { bs: 0.4, bc: 0.05, bz: 1.0, rc: 0.2 }, { bs: 0.7, bc: 0.18, bz: 2.0, rc: 0.08 },
];

export default function PuffDerby() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
    screenShake, screenFlash,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [playerHorse, setPlayerHorse] = useState(null);
  const [raceTime, setRaceTime] = useState(30);
  const [puffCount, setPuffCount] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [positions, setPositions] = useState([0, 0, 0, 0, 0, 0]);
  const [finishOrder, setFinishOrder] = useState([]);

  const phaseRef = useRef(phase);
  const playerHorseRef = useRef(playerHorse);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const aiIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const posRef = useRef([0, 0, 0, 0, 0, 0]);
  const staminaRef = useRef(100);
  const lastPuffRef = useRef(0);
  const finishRef = useRef([]);
  const blinkerStartRef = useRef(0);
  const puffHoldingRef = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { playerHorseRef.current = playerHorse; }, [playerHorse]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  // ── Canvas draw ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, dpr = PD_DPR;
    ctx.clearRect(0, 0, W, H);
    const pi = playerHorseRef.current;
    const curPhase = phaseRef.current;
    const now = Date.now();

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#071a0d'); bg.addColorStop(0.3, '#0a2814');
    bg.addColorStop(0.7, '#0d3318'); bg.addColorStop(1, '#051408');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    if (curPhase === 'pick') {
      ctx.font = `900 ${24 * dpr}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = '#22C55E'; ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 15 * dpr;
      ctx.fillText('🏇 PICK YOUR HORSE', W / 2, H * 0.25); ctx.shadowBlur = 0;
      ctx.font = `600 ${10 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.35)';
      ctx.fillText('Tap a horse below to select', W / 2, H * 0.31);
      return;
    }

    if (curPhase === 'countdown') {
      ctx.font = `900 ${44 * dpr}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD93D'; ctx.shadowColor = '#FFD93D'; ctx.shadowBlur = 25 * dpr;
      ctx.fillText('GET READY!', W / 2, H * 0.40); ctx.shadowBlur = 0;
      if (pi !== null) {
        ctx.font = `${60 * dpr}px sans-serif`; ctx.fillText(PD_HORSE_EMOJIS[pi], W / 2, H * 0.55);
        ctx.font = `700 ${14 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.6)';
        ctx.fillText(PD_HORSE_NAMES[pi], W / 2, H * 0.64);
      }
      return;
    }

    // Crowd
    ctx.fillStyle = 'rgba(30,25,15,0.5)'; ctx.fillRect(0, 0, W, H * 0.08);
    for (let i = 0; i < 30; i++) {
      const bounce = Math.sin(now / 300 + i * 0.5) * 2;
      ctx.font = `${8 * dpr}px sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(now / 500 + i) * 0.05})`;
      ctx.fillText(i % 5 === 0 ? '🏇' : '👤', W * 0.03 + i * W * 0.032, H * 0.05 + bounce * dpr);
    }

    // Track
    const trackTop = H * 0.10, trackH = H * 0.62, laneH = trackH / 6;
    const trackStartX = 10 * dpr, finishX = W * 0.90, trackW = finishX - trackStartX;
    const curPositions = posRef.current;
    const curFinish = finishRef.current;

    for (let i = 0; i < 6; i++) {
      const y = trackTop + i * laneH; const isP = i === pi;
      if (isP) {
        const lg = ctx.createLinearGradient(0, y, 0, y + laneH);
        lg.addColorStop(0, 'rgba(0,229,255,0.08)'); lg.addColorStop(0.5, 'rgba(0,229,255,0.04)'); lg.addColorStop(1, 'rgba(0,229,255,0.08)');
        ctx.fillStyle = lg; ctx.fillRect(0, y, W, laneH);
        ctx.strokeStyle = 'rgba(0,229,255,0.15)'; ctx.lineWidth = 1 * dpr;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y + laneH); ctx.lineTo(W, y + laneH); ctx.stroke();
      } else {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, y, W, laneH);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y + laneH); ctx.lineTo(W, y + laneH); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,217,61,0.08)'; ctx.fillRect(finishX, y, W - finishX, laneH);

      ctx.textAlign = 'left';
      ctx.font = `800 ${10 * dpr}px sans-serif`;
      ctx.fillStyle = isP ? '#00E5FF' : 'rgba(232,235,246,0.35)';
      ctx.fillText((i + 1) + '.', 4 * dpr, y + laneH * 0.45);
      ctx.font = `700 ${9 * dpr}px sans-serif`;
      ctx.fillStyle = isP ? 'rgba(0,229,255,0.8)' : 'rgba(232,235,246,0.25)';
      ctx.fillText(PD_HORSE_NAMES[i], 16 * dpr, y + laneH * 0.45);
      if (isP) { ctx.font = `600 ${7 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(0,229,255,0.5)'; ctx.fillText('(YOU)', 16 * dpr, y + laneH * 0.72); }

      const pos = curPositions[i] || 0;
      const horseX = trackStartX + (pos / 100) * trackW;
      const fin = curFinish.includes(i); const pl = curFinish.indexOf(i) + 1;
      const horseCy = y + laneH * 0.55;

      if (pos > 3) {
        const trailLen = Math.min(pos * 0.4, 30) * dpr;
        const trailG = ctx.createLinearGradient(horseX - trailLen, horseCy, horseX, horseCy);
        trailG.addColorStop(0, 'transparent');
        trailG.addColorStop(1, isP ? 'rgba(0,229,255,0.15)' : 'rgba(34,197,94,0.08)');
        ctx.fillStyle = trailG;
        ctx.fillRect(horseX - trailLen, y + laneH * 0.25, trailLen, laneH * 0.5);
      }

      const hSize = isP ? 28 * dpr : 22 * dpr;
      ctx.font = `${hSize}px sans-serif`; ctx.textAlign = 'center';
      if (isP) { ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 12 * dpr; }
      else if (fin && pl <= 3) { ctx.shadowColor = '#FFD93D'; ctx.shadowBlur = 6 * dpr; }
      ctx.fillText(PD_HORSE_EMOJIS[i], horseX, horseCy + hSize * 0.15);
      ctx.shadowBlur = 0;

      ctx.textAlign = 'right';
      if (fin) {
        const medal = pl === 1 ? '🥇' : pl === 2 ? '🥈' : pl === 3 ? '🥉' : '';
        ctx.font = `900 ${10 * dpr}px sans-serif`;
        ctx.fillStyle = pl === 1 ? '#FFD93D' : pl <= 3 ? '#22C55E' : 'rgba(232,235,246,0.35)';
        ctx.fillText(medal + ' #' + pl, W - 4 * dpr, y + laneH * 0.55);
      } else {
        ctx.font = `700 ${9 * dpr}px sans-serif`;
        ctx.fillStyle = isP ? 'rgba(0,229,255,0.7)' : 'rgba(232,235,246,0.3)';
        ctx.fillText(Math.round(pos) + '%', W - 4 * dpr, y + laneH * 0.55);
      }
      ctx.textAlign = 'center';
    }

    // Finish line
    const dashOffset = (now / 100) % (8 * dpr);
    ctx.strokeStyle = 'rgba(255,217,61,0.5)'; ctx.lineWidth = 2.5 * dpr;
    ctx.setLineDash([5 * dpr, 3 * dpr]); ctx.lineDashOffset = dashOffset;
    ctx.beginPath(); ctx.moveTo(finishX, trackTop); ctx.lineTo(finishX, trackTop + trackH); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;

    // Stamina bar
    const curStamina = staminaRef.current;
    const stY = trackTop + trackH + 14 * dpr, stH = 12 * dpr, stW = W * 0.75, stX = (W - stW) / 2;
    const stC = curStamina > 60 ? '#22C55E' : curStamina > 30 ? '#FFD93D' : '#EF4444';
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(stX, stY, stW, stH, 6 * dpr); ctx.fill();
    const stFill = ctx.createLinearGradient(stX, stY, stX + stW * curStamina / 100, stY);
    stFill.addColorStop(0, stC); stFill.addColorStop(1, stC + '90');
    ctx.fillStyle = stFill;
    ctx.beginPath(); ctx.roundRect(stX, stY, stW * Math.max(0.01, curStamina / 100), stH, 6 * dpr); ctx.fill();
    ctx.font = `800 ${9 * dpr}px sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = stC;
    ctx.fillText('⚡ ' + Math.round(curStamina) + '%', stX, stY - 4 * dpr);
    if (curStamina <= 0) {
      ctx.font = `800 ${11 * dpr}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#EF4444';
      ctx.fillText('EXHAUSTED! ⚠️', W / 2, stY + stH + 14 * dpr);
    }

    // Live standings during race
    if (curPhase === 'racing') {
      const ranked = [0, 1, 2, 3, 4, 5].slice().sort((a, b) => (curPositions[b] || 0) - (curPositions[a] || 0));
      const rankY = stY + stH + (curStamina <= 0 ? 28 : 14) * dpr;
      ctx.font = `700 ${8 * dpr}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(232,235,246,0.3)';
      ctx.fillText('LIVE STANDINGS', W / 2, rankY);
      ranked.forEach((idx, rank) => {
        const rx = W * 0.08 + rank * W * 0.15; const ry2 = rankY + 14 * dpr;
        ctx.font = `${14 * dpr}px sans-serif`; ctx.fillText(PD_HORSE_EMOJIS[idx], rx, ry2);
        ctx.font = `700 ${7 * dpr}px sans-serif`;
        ctx.fillStyle = rank === 0 ? '#FFD93D' : rank <= 2 ? '#22C55E' : 'rgba(232,235,246,0.3)';
        ctx.fillText('#' + (rank + 1), rx, ry2 + 12 * dpr);
        if (idx === pi) { ctx.fillStyle = '#00E5FF'; ctx.fillText('YOU', rx, ry2 + 20 * dpr); }
        ctx.fillStyle = 'rgba(232,235,246,0.3)';
      });
    }

    // Result overlay
    if (curPhase === 'result' && curFinish.length > 0) {
      ctx.fillStyle = 'rgba(4,10,4,0.75)'; ctx.fillRect(0, 0, W, H);
      const place = pi !== null ? curFinish.indexOf(pi) + 1 : 0;
      const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '🏇';
      ctx.font = `${40 * dpr}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(medal, W / 2, H * 0.32);
      ctx.font = `900 ${24 * dpr}px sans-serif`;
      ctx.fillStyle = place === 1 ? '#FFD93D' : place <= 3 ? '#22C55E' : 'rgba(232,235,246,0.6)';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15 * dpr;
      ctx.fillText(place === 1 ? 'WINNER!' : '#' + place + ' PLACE', W / 2, H * 0.40);
      ctx.shadowBlur = 0;
      ctx.font = `600 ${11 * dpr}px sans-serif`;
      curFinish.slice(0, 6).forEach((hI, pl) => {
        const ry = H * 0.46 + pl * 14 * dpr; const isYou = hI === pi;
        ctx.fillStyle = isYou ? '#00E5FF' : 'rgba(232,235,246,0.4)'; ctx.textAlign = 'center';
        ctx.fillText('#' + (pl + 1) + ' ' + PD_HORSE_EMOJIS[hI] + ' ' + PD_HORSE_NAMES[hI] + (isYou ? ' (YOU)' : ''), W / 2, ry);
      });
    }
  }, []); // eslint-disable-line

  // Canvas loop — restarts every render
  useEffect(() => {
    if (!canvasRef.current || !phase || phase === 'pick') {
      if (canvasRef.current && phase === 'pick') drawCanvas();
      return;
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }); // eslint-disable-line

  // ── Race end ──
  const endRace = useCallback((pi) => {
    if (aiIntervalRef.current) { clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    const fin = [...finishRef.current];
    const rem = [0, 1, 2, 3, 4, 5].filter(i => !fin.includes(i));
    rem.sort((a, b) => posRef.current[b] - posRef.current[a]);
    const fo = [...fin, ...rem];
    setFinishOrder(fo); finishRef.current = fo;
    const place = fo.indexOf(pi) + 1;
    playFx(place <= 2 ? 'win' : 'lose');
    const won = place <= 2;
    const baseCoins = place === 1 ? 30 : place === 2 ? 15 : 5;
    setCoins(c => c + baseCoins);
    awardGame('puffderby', won ? 'win' : 'lose');
    setPhase('result'); phaseRef.current = 'result';
    addChat(`🏇 ${PD_HORSE_NAMES[pi]} finishes #${place}!`);
    if (place === 1) { triggerFlash('goal'); playFx('crowd'); spawnConfetti(30, [C.green, C.gold, C.cyan, C.pink]); }
  }, [playFx, setCoins, awardGame, triggerFlash, spawnConfetti, addChat]);

  // ── Race start ──
  const startRace = useCallback((pi) => {
    posRef.current = [0, 0, 0, 0, 0, 0]; finishRef.current = []; staminaRef.current = 100;
    lastPuffRef.current = Date.now();
    let tl = 30; setRaceTime(30);

    aiIntervalRef.current = setInterval(() => {
      if (Date.now() - lastPuffRef.current > 500) {
        staminaRef.current = Math.min(100, staminaRef.current + 0.6);
        setStamina(Math.round(staminaRef.current));
      }
      const np = [...posRef.current];
      for (let i = 0; i < 6; i++) {
        if (i === pi || finishRef.current.includes(i)) continue;
        const p = PD_AI[i]; let mv = p.bs * (0.6 + Math.random() * 0.8);
        if (Math.random() < p.bc) mv += p.bz;
        if (Math.random() < p.rc) mv = 0;
        if (np[i] > 70) mv *= 1.2;
        if (np[i] > 90) mv *= 1.1;
        np[i] = Math.min(100, np[i] + mv * 0.16);
        if (np[i] >= 100 && !finishRef.current.includes(i)) {
          finishRef.current = [...finishRef.current, i];
          setFinishOrder([...finishRef.current]);
        }
      }
      if (np[pi] >= 100 && !finishRef.current.includes(pi)) {
        finishRef.current = [...finishRef.current, pi];
        setFinishOrder([...finishRef.current]);
      }
      posRef.current = np; setPositions([...np]);
      if (finishRef.current.length >= 6) endRace(pi);
    }, 50);

    timerIntervalRef.current = setInterval(() => {
      tl--;
      setRaceTime(tl);
      if (tl <= 0) endRace(pi);
    }, 1000);
  }, [endRace]);

  // ── Pick horse ──
  const pickHorse = useCallback((idx) => {
    setPlayerHorse(idx); playerHorseRef.current = idx;
    playFx('select');
    addChat(`🏇 ${PD_HORSE_NAMES[idx]} in gate ${idx + 1}!`);
    setPhase('countdown'); phaseRef.current = 'countdown';
    let c = 3;
    const cd = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(cd);
        setPhase('racing'); phaseRef.current = 'racing';
        playFx('whistle'); triggerFlash('goal');
        startRace(idx);
      }
    }, 800);
  }, [playFx, triggerFlash, addChat, startRace]);

  // ── Puff actions ──
  const tapBoost = useCallback(() => {
    if (phaseRef.current !== 'racing' || playerHorseRef.current === null) return;
    const idx = playerHorseRef.current;
    lastPuffRef.current = Date.now(); setPuffCount(p => p + 1);
    playFx('horse_gallop');
    let boost = 1 + Math.random() * 0.5;
    if (staminaRef.current <= 0) boost = 0.5;
    else { staminaRef.current = Math.max(0, staminaRef.current - 1); setStamina(Math.round(staminaRef.current)); }
    const np = [...posRef.current]; np[idx] = Math.min(100, np[idx] + boost);
    posRef.current = np; setPositions([...np]);
    if (np[idx] >= 100 && !finishRef.current.includes(idx)) {
      finishRef.current = [...finishRef.current, idx]; setFinishOrder([...finishRef.current]);
    }
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'racing' || playerHorseRef.current === null) return;
    puffHoldingRef.current = true;
    blinkerStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (!puffHoldingRef.current) return;
    puffHoldingRef.current = false;
    const holdDur = (Date.now() - blinkerStartRef.current) / 1000;
    const idx = playerHorseRef.current;
    if (idx === null) return;
    lastPuffRef.current = Date.now(); setPuffCount(p => p + 1);
    const isBlinker = holdDur >= 5.0;
    const isPuff = holdDur >= 0.3;
    let boost, staminaCost;
    if (isBlinker) { boost = 10 + Math.random() * 3; staminaCost = 25; playFx('crowd'); addChat('🏇 BLINKER MEGA BURST!'); }
    else if (isPuff) { boost = 3 + Math.random() * 1.5; staminaCost = 4; playFx('horse_gallop'); }
    else { boost = 1 + Math.random() * 0.5; staminaCost = 1; playFx('horse_gallop'); }
    if (staminaRef.current <= 0) { boost = 0.5; staminaCost = 0; }
    else { staminaRef.current = Math.max(0, staminaRef.current - staminaCost); setStamina(Math.round(staminaRef.current)); }
    const np = [...posRef.current]; np[idx] = Math.min(100, np[idx] + boost);
    posRef.current = np; setPositions([...np]);
    if (np[idx] >= 100 && !finishRef.current.includes(idx)) {
      finishRef.current = [...finishRef.current, idx]; setFinishOrder([...finishRef.current]);
    }
  }, [playFx, addChat]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    if (aiIntervalRef.current) { clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  // ── Start game ──
  const startGame = useCallback(() => {
    cleanup();
    setPlayerHorse(null); playerHorseRef.current = null;
    setRaceTime(30);
    setPuffCount(0);
    setStamina(100); staminaRef.current = 100;
    setPositions([0, 0, 0, 0, 0, 0]); posRef.current = [0, 0, 0, 0, 0, 0];
    setFinishOrder([]); finishRef.current = [];
    puffHoldingRef.current = false;
    setPhase('pick'); phaseRef.current = 'pick';
    playFx('crowd');
    addChat('🏇 Welcome to Puff Derby! Pick your horse!');
  }, [cleanup, playFx, addChat]);

  useEffect(() => {
    startGame();
    return cleanup;
  }, []); // eslint-disable-line

  const statusText = phase === 'pick' ? 'Choose your horse!' : phase === 'countdown' ? 'Gates opening...' : phase === 'racing' ? 'RACE! Tap/Puff/Blinker!' : phase === 'result' ? 'Race Over' : '...';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none', animation: screenShake ? 'shake 0.4s ease' : 'none' }}>
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      {/* Header */}
      <GameHeader
        backTo={() => { cleanup(); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={C.green}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.green }}>🏇 PUFF DERBY</span>
            {phase === 'racing' && <span style={{ fontSize: 9, fontWeight: 700, color: raceTime <= 10 ? C.red : C.gold }}>{raceTime}s</span>}
            {playerHorse !== null && <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>{PD_HORSE_EMOJIS[playerHorse]}</span>}
          </div>
        }
        row3={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: phase === 'racing' ? C.green : phase === 'result' ? (finishOrder.indexOf(playerHorse) === 0 ? C.gold : C.text3) : C.text3 }}>{statusText}</span>
            {phase === 'racing' && <span style={{ fontSize: 9, color: stamina > 60 ? C.green : stamina > 30 ? C.gold : C.red, fontWeight: 700 }}>STA:{stamina}%</span>}
          </div>
        }
      />

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * PD_DPR)} height={Math.round(600 * PD_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Controls overlay at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, padding: '8px 12px', background: 'rgba(6,16,30,0.85)', backdropFilter: 'blur(8px)' }}>
          {phase === 'pick' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, width: '90%', maxWidth: 360, margin: '0 auto' }}>
              {PD_HORSE_NAMES.map((h, i) => (
                <div key={i} data-btn="true" onClick={(e) => { e.stopPropagation(); pickHorse(i); }}
                  style={{ touchAction: 'none', padding: '8px 4px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ fontSize: 22 }}>{PD_HORSE_EMOJIS[i]}</div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: C.text, marginTop: 2 }}>{PD_HORSE_NAMES[i]}</div>
                  <div style={{ fontSize: 7, color: C.cyan }}>SPD:{PD_HORSE_STATS[i].speed.toFixed(1)} STA:{PD_HORSE_STATS[i].stamina.toFixed(1)}</div>
                </div>
              ))}
            </div>
          )}

          {phase === 'racing' && (
            <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360, margin: '0 auto' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); tapBoost(); }}
                style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.2)', userSelect: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.green, letterSpacing: 1 }}>TAP</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+1% speed</div>
              </div>
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); handleDown(); }}
                onMouseUp={(e) => { e.stopPropagation(); handleUp(); }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleDown(); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleUp(); }}
                onTouchCancel={(e) => { e.stopPropagation(); handleUp(); }}
                style={{ touchAction: 'none', flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', userSelect: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.green, letterSpacing: 1 }}>PUFF</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+3% -stamina</div>
              </div>
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); handleDown(); }}
                onMouseUp={(e) => { e.stopPropagation(); handleUp(); }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleDown(); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleUp(); }}
                onTouchCancel={(e) => { e.stopPropagation(); handleUp(); }}
                style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'rgba(255,50,50,0.1)', border: '2px solid rgba(255,50,50,0.25)', animation: 'countPulse 1.5s infinite', userSelect: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>5s+ MEGA</div>
              </div>
            </div>
          )}

          {phase === 'result' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green }}>Race Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
