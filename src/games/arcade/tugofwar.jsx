import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const TOW_COMMENTS_PULL = ['PULL! 💪', 'Keep going! 🔥', 'More power! ⚡', 'HARDER! 😤', 'HEAVE! 🏋️', "Don't stop! 🫁", 'GRIP IT! 🤜', 'YANK IT! 💥'];
const TOW_COMMENTS_WIN = ['CHAMPIONS! The crowd goes INSANE! 🏆🎉', 'They FELL in the MUD! 😂🛁', 'DOMINANT! Your team is unstoppable! 💪', '30 puffs in 10 seconds! Your lungs are ELITE 🏆'];
const TOW_COMMENTS_LOSE = ['MUD PIT! Your team took a bath 🛁😂', 'The AI pulled harder... regroup! 💪', 'Into the mud you go! 🫠', 'Almost had it! One more puff! 😤'];
const SPECTATOR_NAMES = ['CloudChaser', 'PuffPro', 'BlinkerKing', 'DabFan', 'SmokeShow', 'RipRoller'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function TugOfWar() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const [phase, setPhase] = useState(null); // null|"intro"|"playing"|"suddendeath"|"result"
  const [position, setPosition] = useState(50); // 0-100, >50 = left (you) winning
  const [timer, setTimer] = useState(30);
  const [puffs, setPuffs] = useState(0);
  const [aiPuffs, setAiPuffs] = useState(0);
  const [towComment, setTowComment] = useState('');
  const [introStep, setIntroStep] = useState(0);
  const [surge, setSurge] = useState(false);
  const [surgeAvail, setSurgeAvail] = useState(false);
  const [holding, setHolding] = useState(false);
  const [puffIntensity, setPuffIntensity] = useState(0);
  const [charging, setCharging] = useState(false);
  const [won, setWon] = useState(false);

  const phaseRef = useRef(phase);
  const posRef = useRef(50);
  const holdRef = useRef(false);
  const surgeRef = useRef(false);
  const surgeAvailRef = useRef(false);
  const puffIntensityRef = useRef(0);

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const intervalRef = useRef(null);
  const physicsRef = useRef(null);
  const surgeTimerRef = useRef(null);
  const chargeIntervalRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { surgeRef.current = surge; }, [surge]);
  useEffect(() => { surgeAvailRef.current = surgeAvail; }, [surgeAvail]);
  useEffect(() => { puffIntensityRef.current = puffIntensity; }, [puffIntensity]);

  const addChat = useCallback((name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: `${name}: ${msg}`, ts: Date.now(), color }]);
  }, [setGameChatMsgs]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (physicsRef.current) { clearInterval(physicsRef.current); physicsRef.current = null; }
    if (surgeTimerRef.current) { clearTimeout(surgeTimerRef.current); surgeTimerRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (chargeIntervalRef.current) { clearInterval(chargeIntervalRef.current); chargeIntervalRef.current = null; }
    holdRef.current = false;
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const dpr = DPR;
    const pos = posRef.current;
    const t = Date.now() * 0.001;

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, '#0a0618'); skyG.addColorStop(0.3, '#1a0a2e');
    skyG.addColorStop(0.6, '#0d1a2f'); skyG.addColorStop(1, '#0a1408');
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

    // Stadium lights
    for (let i = 0; i < 5; i++) {
      const lx = W * 0.1 + i * (W * 0.2);
      const glow = ctx.createRadialGradient(lx, 15 * dpr, 0, lx, 15 * dpr, 50 * dpr);
      glow.addColorStop(0, 'rgba(255,220,100,0.25)'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(lx - 60 * dpr, 0, 120 * dpr, 80 * dpr);
    }

    // Crowd silhouettes
    const crowdY = H * 0.08;
    const crowdH = H * 0.28;
    for (let row = 0; row < 3; row++) {
      const ry = crowdY + row * crowdH * 0.33;
      const rowShade = 30 + row * 12;
      for (let i = 0; i < 24; i++) {
        const cx = (i / 24) * W + Math.sin(i * 2.1 + t * 1.5) * 3 * dpr;
        const waveOff = (pos > 60 || pos < 40) ? Math.sin(t * 4 + i * 0.5) * 4 * dpr : 0;
        const headR = (5 + row * 1.5) * dpr;
        const bodyH = (12 + row * 2) * dpr;
        ctx.fillStyle = `rgba(${rowShade},${rowShade - 10},${rowShade + 15},0.7)`;
        ctx.beginPath(); ctx.arc(cx, ry - waveOff, headR, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - headR * 0.6, ry - waveOff + headR, headR * 1.2, bodyH);
      }
    }

    // Arena floor
    const floorY = H * 0.55;
    const floorG = ctx.createLinearGradient(0, floorY, 0, H);
    floorG.addColorStop(0, '#1a2a15'); floorG.addColorStop(0.4, '#223318'); floorG.addColorStop(1, '#0a1408');
    ctx.fillStyle = floorG; ctx.fillRect(0, floorY, W, H - floorY);

    // Mud pit
    const mudCx = W * 0.5, mudCy = floorY + (H - floorY) * 0.45;
    const mudW = W * 0.18, mudH = (H - floorY) * 0.3;
    const mudG = ctx.createRadialGradient(mudCx, mudCy, 0, mudCx, mudCy, mudW);
    mudG.addColorStop(0, '#4a3520'); mudG.addColorStop(0.6, '#3a2815'); mudG.addColorStop(1, '#1a2a15');
    ctx.fillStyle = mudG;
    ctx.beginPath(); ctx.ellipse(mudCx, mudCy, mudW, mudH, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,30,0.3)'; ctx.lineWidth = 1 * dpr;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(mudCx, mudCy, mudW * (0.4 + r * 0.25) + Math.sin(t * 2 + r) * 3 * dpr, mudH * (0.4 + r * 0.25), 0, 0, Math.PI * 2); ctx.stroke();
    }

    // Rope
    const ropeBaseY = floorY - 15 * dpr;
    const ropeOffX = (pos - 50) * W * 0.008;
    const ribbonX = W * 0.5 + ropeOffX;
    ctx.strokeStyle = 'rgba(180,140,80,0.9)'; ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, ropeBaseY + Math.sin(t * 3) * 2 * dpr);
    ctx.quadraticCurveTo(ribbonX, ropeBaseY - 8 * dpr + Math.sin(t * 5) * 3 * dpr, W * 0.9, ropeBaseY + Math.sin(t * 3 + 1) * 2 * dpr);
    ctx.stroke();
    // Ribbon marker
    ctx.fillStyle = pos > 55 ? '#00E5FF' : pos < 45 ? '#FF4444' : '#FFD93D';
    ctx.beginPath(); ctx.moveTo(ribbonX, ropeBaseY - 12 * dpr); ctx.lineTo(ribbonX - 6 * dpr, ropeBaseY + 4 * dpr); ctx.lineTo(ribbonX + 6 * dpr, ropeBaseY + 4 * dpr); ctx.closePath(); ctx.fill();
    // Rope strain glow
    const strain = Math.abs(pos - 50) / 50;
    if (strain > 0.2) {
      ctx.save();
      ctx.shadowColor = pos > 50 ? 'rgba(0,229,255,0.4)' : 'rgba(255,68,68,0.4)';
      ctx.shadowBlur = strain * 20 * dpr;
      ctx.strokeStyle = pos > 50 ? 'rgba(0,229,255,0.15)' : 'rgba(255,68,68,0.15)'; ctx.lineWidth = 8 * dpr;
      ctx.beginPath(); ctx.moveTo(W * 0.1, ropeBaseY); ctx.quadraticCurveTo(ribbonX, ropeBaseY - 8 * dpr, W * 0.9, ropeBaseY); ctx.stroke();
      ctx.restore();
    }

    // Teams
    const drawTeam = (side, color, pullStr) => {
      const baseX = side === 'left' ? W * 0.15 + ropeOffX * 0.5 : W * 0.85 + ropeOffX * 0.5;
      const dir = side === 'left' ? 1 : -1;
      const lean = pullStr * 0.3 * dir;
      for (let i = 0; i < 5; i++) {
        const px = baseX + (i * 18 * dpr * -dir);
        const py = floorY - 10 * dpr + Math.sin(t * 6 + i) * 2 * dpr;
        const bob = Math.sin(t * 4 + i * 1.2) * 2 * dpr;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(lean);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, -28 * dpr + bob, 6 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath(); ctx.moveTo(0, -22 * dpr + bob); ctx.lineTo(0, -4 * dpr + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -18 * dpr + bob); ctx.lineTo(dir * 12 * dpr, -14 * dpr + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -15 * dpr + bob); ctx.lineTo(dir * 10 * dpr, -10 * dpr + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -4 * dpr + bob); ctx.lineTo(-5 * dpr, 10 * dpr + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -4 * dpr + bob); ctx.lineTo(5 * dpr, 10 * dpr + bob); ctx.stroke();
        ctx.restore();
      }
    };
    drawTeam('left', '#00E5FF', Math.max(0, (pos - 50) / 50));
    drawTeam('right', '#FF4444', Math.max(0, (50 - pos) / 50));

    // Mud splash
    if (pos <= 5 || pos >= 95) {
      for (let i = 0; i < 6; i++) {
        const sx = mudCx + (Math.random() - 0.5) * mudW * 1.5;
        const sy = mudCy - Math.random() * 30 * dpr;
        ctx.fillStyle = `rgba(120,80,40,${0.3 + Math.random() * 0.3})`;
        ctx.beginPath(); ctx.arc(sx, sy, (2 + Math.random() * 4) * dpr, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Position bar
    const barY = H - 20 * dpr;
    const barW = W * 0.7;
    const barX = (W - barW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(barX, barY, barW, 8 * dpr);
    const fillW = (pos / 100) * barW;
    const barG2 = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barG2.addColorStop(0, '#00E5FF'); barG2.addColorStop(0.5, '#FFD93D'); barG2.addColorStop(1, '#FF4444');
    ctx.fillStyle = barG2; ctx.fillRect(barX, barY, fillW, 8 * dpr);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(barX + barW * 0.5 - 1, barY - 2 * dpr, 2, 12 * dpr);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(barX + fillW, barY + 4 * dpr, 4 * dpr, 0, Math.PI * 2); ctx.fill();
  }, []); // eslint-disable-line

  const finishMatch = useCallback((finalPos) => {
    cleanup();
    const didWin = finalPos > 50;
    setWon(didWin);
    setPhase('result');
    if (didWin) {
      spawnConfetti(40); triggerFlash('goal'); triggerShake();
      playFx('win');
      setTowComment(pick(TOW_COMMENTS_WIN));
      addChat('Announcer', pick(TOW_COMMENTS_WIN), C.gold);
      awardGame('tugofwar', 'win');
    } else {
      triggerFlash('miss'); triggerShake();
      playFx('lose');
      setTowComment(pick(TOW_COMMENTS_LOSE));
      addChat('Announcer', pick(TOW_COMMENTS_LOSE), C.red);
      awardGame('tugofwar', 'lose');
    }
  }, [cleanup, spawnConfetti, triggerFlash, triggerShake, playFx, addChat, awardGame]);

  const startMatch = useCallback(() => {
    setPhase('playing');
    phaseRef.current = 'playing';
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed++;
      setTimer(t => {
        const newT = t - 1;
        if (elapsed % 10 === 0 && elapsed < 30) {
          setSurgeAvail(true); surgeAvailRef.current = true;
          setTowComment('⚡ SURGE AVAILABLE! Puff NOW for 3x! ⚡');
          playFx('tick');
          addChat('Announcer', 'SURGE WINDOW! Puff now for 3x power! ⚡', C.gold);
          if (surgeTimerRef.current) clearTimeout(surgeTimerRef.current);
          surgeTimerRef.current = setTimeout(() => { setSurgeAvail(false); surgeAvailRef.current = false; }, 3000);
        }
        if (newT <= 5 && newT > 0) playFx('tick');
        if (newT <= 0) {
          const pos2 = posRef.current;
          if (pos2 >= 45 && pos2 <= 55) {
            setPhase('suddendeath'); phaseRef.current = 'suddendeath';
            setTimer(10);
            setTowComment('SUDDEN DEATH! 10 more seconds! ⚡💀');
            playFx('crowd'); triggerShake();
            addChat('Announcer', 'SUDDEN DEATH! 10 seconds -- EVERYTHING counts! 💀', C.red);
            return 10;
          }
          finishMatch(posRef.current);
          return 0;
        }
        return newT;
      });
      // AI pull
      const aiStr = 0.8 + Math.random() * 1.8;
      if (Math.random() < 0.45) {
        posRef.current = Math.max(0, posRef.current - aiStr);
        setPosition(posRef.current); setAiPuffs(a => a + 1);
        if (Math.random() < 0.15) {
          posRef.current = Math.max(0, posRef.current - 2.5);
          setPosition(posRef.current); triggerShake();
          setTowComment("AI BURST! They're pulling hard!");
          addChat(pick(['BotBruiser', 'AI_Tank', 'RoboPull']), "HEAVE! We're pulling HARDER!", C.red);
        }
      }
      // Spectator chat
      if (elapsed % 8 === 0) {
        const chatMsgs = ['The rope is on FIRE 🔥', 'My hands are BURNING 🤜', 'PULL PULL PULL!', 'I can see the mud pit 😱', 'Their team is WEAK 🫠', 'BLINKER POWER incoming! 💀'];
        addChat(pick(SPECTATOR_NAMES), pick(chatMsgs), C.cyan);
      }
    }, 1000);

    physicsRef.current = setInterval(() => {
      if (holdRef.current) {
        const pf = 0.4 + Math.random() * 0.3;
        posRef.current = Math.min(100, posRef.current + pf);
        setPosition(posRef.current);
        setPuffIntensity(p => { const v = Math.min(100, p + 3); puffIntensityRef.current = v; return v; });
      } else {
        setPuffIntensity(p => { const v = Math.max(0, p - 2); puffIntensityRef.current = v; return v; });
        if (posRef.current > 50) { posRef.current = Math.max(50, posRef.current - 0.08); setPosition(posRef.current); }
      }
    }, 50);
  }, [playFx, triggerShake, addChat, finishMatch]);

  const startGame = useCallback(() => {
    cleanup();
    posRef.current = 50; holdRef.current = false;
    setPosition(50); setTimer(30); setPuffs(0); setAiPuffs(0);
    setTowComment(''); setIntroStep(0); setSurge(false); setSurgeAvail(false);
    setHolding(false); setPuffIntensity(0); setCharging(false);
    surgeRef.current = false; surgeAvailRef.current = false;
    setPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('Announcer', 'Teams are entering the arena!', C.gold);
    let step = 0;
    const introTimer = setInterval(() => {
      step++; setIntroStep(step);
      if (step === 2) addChat('Announcer', '5 vs 5 -- your team needs those LUNGS!', C.cyan);
      if (step >= 4 && step <= 6) playFx('tick');
      if (step >= 7) {
        clearInterval(introTimer);
        playFx('whistle');
        setTowComment('PULL!');
        addChat('Announcer', 'PULL! Spam puff to drag them into the MUD!', C.gold);
        startMatch();
      }
    }, 700);
  }, [cleanup, playFx, addChat, startMatch]);

  const activateSurge = useCallback(() => {
    if (!surgeAvailRef.current || surgeRef.current) return;
    setSurge(true); surgeRef.current = true;
    setSurgeAvail(false); surgeAvailRef.current = false;
    setTowComment('🔥 SURGE ACTIVATED! 3x PULL POWER! 🔥');
    playFx('blinker'); triggerFlash('blinker'); triggerShake();
    addChat('Announcer', 'SURGE! 3x PULL POWER! 🔥', C.gold);
    if (surgeTimerRef.current) clearTimeout(surgeTimerRef.current);
    surgeTimerRef.current = setTimeout(() => { setSurge(false); surgeRef.current = false; setTowComment('Surge ended!'); }, 3000);
  }, [playFx, triggerFlash, triggerShake, addChat]);

  const tapPull = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return;
    const force = 2 + Math.random() * 1;
    posRef.current = Math.min(100, posRef.current + force);
    setPosition(posRef.current); setPuffs(n => n + 1); playFx('tap');
    setTowComment(pick(TOW_COMMENTS_PULL));
    activateSurge();
  }, [playFx, activateSurge]);

  const startCharge = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return;
    setCharging(true); holdRef.current = true; setHolding(true);
    setPuffIntensity(0); puffIntensityRef.current = 0;
    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
    chargeIntervalRef.current = setInterval(() => {
      setPuffIntensity(p => { const v = Math.min(100, p + 4); puffIntensityRef.current = v; return v; });
    }, 50);
  }, []);

  const stopCharge = useCallback(() => {
    if (!holdRef.current) return;
    holdRef.current = false; setHolding(false); setCharging(false);
    if (chargeIntervalRef.current) { clearInterval(chargeIntervalRef.current); chargeIntervalRef.current = null; }
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return;
    const surgeMulti = surgeRef.current ? 3 : 1;
    const force = (5 + (puffIntensityRef.current / 100) * 5) * surgeMulti;
    posRef.current = Math.min(100, posRef.current + force);
    setPosition(posRef.current); setPuffs(n => n + 1); playFx('crowd');
    setTowComment(force > 8 ? 'POWER PULL! 💪🔥' : pick(TOW_COMMENTS_PULL));
    addChat(pick(SPECTATOR_NAMES), 'That puff was MASSIVE! 🫁💨', C.cyan);
    if (force > 6) triggerShake();
    setPuffIntensity(0); puffIntensityRef.current = 0;
    activateSurge();
  }, [playFx, triggerShake, addChat, activateSurge]);

  const blinkerPull = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return;
    const surgeMulti = surgeRef.current ? 3 : 1;
    const force = 10 * surgeMulti;
    posRef.current = Math.min(100, posRef.current + force);
    setPosition(posRef.current); setPuffs(n => n + 1);
    playFx('blinker'); triggerFlash('blinker'); triggerShake();
    setTowComment('🫁 BLINKER PULL! MEGA SURGE! 💀');
    addChat('Announcer', 'BLINKER PULL! The whole team LAUNCHED forward! 💀🔥', C.pink);
    addChat(pick(SPECTATOR_NAMES), 'THAT BLINKER THO 😤💀', C.orange);
    activateSurge();
  }, [playFx, triggerFlash, triggerShake, addChat, activateSurge]);

  // BLE: slot 0 → start/stop charge
  useEffect(() => {
    setBLEHandlers(0, () => startCharge(), () => stopCharge());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  // Canvas draw loop (Rule 4: restart every render)
  useEffect(() => {
    if (!canvasRef.current || !phase) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
  });

  useEffect(() => {
    startGame();
    return () => cleanup();
  }, []); // eslint-disable-line

  const isPlaying = phase === 'playing' || phase === 'suddendeath';
  const isSuddenDeath = phase === 'suddendeath';
  const timerDanger = timer <= 5;
  const youWinning = position > 50;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; startCharge(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; stopCharge(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; e.preventDefault(); startCharge(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; stopCharge(); }}
      onTouchCancel={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; stopCharge(); }}
    >
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      <GameHeader
        backTo={() => { cleanup(); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={isSuddenDeath ? C.red : '#60A5FA'}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: isSuddenDeath ? C.red : C.blue }}>💪 TUG OF WAR</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>You:{puffs}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.red }}>AI:{aiPuffs}</span>
          </div>
        }
        row3={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: timerDanger ? C.red : C.gold, animation: timerDanger ? 'countPulse 0.5s infinite' : 'none' }}>
              {isPlaying ? (timer + 's') : phase === 'intro' ? 'Preparing...' : 'Game Over'}
            </span>
            {isPlaying && <span style={{ fontSize: 9, fontWeight: 700, color: youWinning ? C.cyan : C.red }}>Rope: {Math.round(position)}%</span>}
            {surge && <span style={{ fontSize: 8, fontWeight: 900, color: C.orange, animation: 'countPulse 0.5s infinite' }}>3x SURGE</span>}
            {isSuddenDeath && <span style={{ fontSize: 8, fontWeight: 900, color: C.red, animation: 'countPulse 0.3s infinite' }}>SUDDEN DEATH</span>}
          </div>
        }
      />

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={Math.round(420 * DPR)}
          height={Math.round(600 * DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />

        {/* Intro overlay */}
        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
            {introStep >= 1 && <div style={{ fontSize: 56, marginBottom: 8, animation: 'scaleIn 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>💪</div>}
            {introStep >= 2 && <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, background: `linear-gradient(135deg, ${C.cyan}, ${C.gold}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'scaleIn 0.8s ease 0.2s both', textAlign: 'center' }}>TUG OF WAR</div>}
            {introStep >= 3 && <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700, animation: 'scaleIn 0.8s ease 0.4s both' }}>5 vs 5 — DRAG THEM INTO THE MUD!</div>}
            {introStep >= 4 && (
              <div style={{ display: 'flex', gap: 16, marginTop: 20, animation: 'scaleIn 0.8s ease 0.6s both' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: 20 }}>🟦</span><span style={{ fontSize: 8, color: C.cyan, fontWeight: 800, marginTop: 2 }}>YOUR TEAM</span></div>
                <span style={{ fontSize: 24, color: C.gold, fontWeight: 900 }}>VS</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: 20 }}>🟥</span><span style={{ fontSize: 8, color: C.red, fontWeight: 800, marginTop: 2 }}>AI TEAM</span></div>
              </div>
            )}
            {introStep >= 5 && <div style={{ marginTop: 16, fontSize: 11, color: C.text3, animation: 'pulse 1s infinite' }}>Getting ready...</div>}
          </div>
        )}

        {/* Result overlay */}
        {phase === 'result' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '😤'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : C.red }}>{won ? 'YOUR TEAM WINS!' : 'AI TEAM WINS!'}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>Position: {Math.round(position)}% | Pulls: {puffs}</div>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>RESULT</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: won ? C.green : C.red, textAlign: 'center' }}>{towComment}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div data-btn="true" style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.blue}15`, border: `1px solid ${C.blue}30`, fontSize: 13, fontWeight: 800, color: C.blue }} onClick={() => startGame()}>Play Again</div>
              <div data-btn="true" style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }} onClick={() => { cleanup(); navigate('/arcade'); }}>Done</div>
            </div>
            <div data-btn="true" onClick={() => { cleanup(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8, width: '60%' }}>👤 My Progress</div>
          </div>
        )}

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {charging && (
            <div style={{ width: '90%', maxWidth: 300 }}>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: puffIntensity + '%', background: `linear-gradient(90deg, ${C.cyan}, ${C.orange})`, borderRadius: 3, transition: 'width 0.05s' }} />
              </div>
            </div>
          )}
          {isPlaying && !charging && (
            <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); tapPull(); }} style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,229,255,0.12),rgba(96,165,250,0.06))', border: '2px solid rgba(0,229,255,0.2)', userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>TAP</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+2 pull</div>
              </div>
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); startCharge(); }}
                onMouseUp={(e) => { e.stopPropagation(); stopCharge(); }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startCharge(); }}
                onTouchEnd={(e) => { e.stopPropagation(); stopCharge(); }}
                onTouchCancel={(e) => { e.stopPropagation(); stopCharge(); }}
                style={{ touchAction: 'none', flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,165,0,0.12),rgba(255,70,70,0.06))', border: '2px solid rgba(255,165,0,0.25)', userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>PUFF</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +5</div>
              </div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); blinkerPull(); }} style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)', animation: 'pulse 1.5s infinite', userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+10!</div>
              </div>
            </div>
          )}
          {isPlaying && charging && (
            <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.2)' }}>
              <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>PULLING... release to puff!</span>
            </div>
          )}
          {towComment && isPlaying && (
            <div style={{ fontSize: 10, color: C.text3, fontStyle: 'italic' }}>{towComment}</div>
          )}
          {surgeAvail && !surge && (
            <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, animation: 'pulse 0.5s infinite' }}>⚡ SURGE READY — PUFF NOW!</div>
          )}
        </div>
      </div>
    </div>
  );
}
