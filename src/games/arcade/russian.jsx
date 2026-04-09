import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const RR_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const RR_AI = [
  {name:'Lucky Luke',emoji:'🤠',personality:'cocky'},
  {name:'Nervous Nick',emoji:'😰',personality:'nervous'},
  {name:'Bold Betty',emoji:'💪',personality:'brave'},
  {name:'Chill Chad',emoji:'😎',personality:'chill'},
  {name:'Sweaty Steve',emoji:'😓',personality:'scared'},
];
const RR_COMMENTS = {
  spin: ['The revolver SPINS... 🔄','Round and round it goes...','Where it stops, nobody knows! 🎲','Fate is loading... 💀'],
  click: ['*CLICK*... SAFE! 😮‍💨','Empty chamber! You live! ✨','The luck continues... 🍀','Phew! Not this time! 😅'],
  bang: ['BANG! 💥🔫','IT FIRED! 💀','The chamber was LOADED! 💥','Game over for this one... 🪦'],
  tension: ['The tension is UNREAL...','Everyone\'s holding their breath...','Who\'s next?! 😱'],
  dodge: ['BLINKER DODGE! Puffed so hard the bullet got scared 💀','Your lungs are your guardian angel 👼💨','The cloud of smoke saved you!! 🌫️'],
  yourTurn: ['YOUR TURN... Hold to puff for dodge chance 💨','The revolver is pointing at YOU 🔫'],
};
const RR_PLAYER_COLORS = ['#FF6B8A','#00E5FF','#FFD93D','#7CFF6B','#C084FC','#FF8800'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rrGetDodgeChance = pct => pct < 10 ? 0 : pct < 25 ? 3 : pct < 50 ? 8 : pct < 80 ? 15 : 30;
const rrGetPuffTier = pct => pct < 10 ? {name:'Tap',emoji:'😐'} : pct < 25 ? {name:'Short',emoji:'😤'} : pct < 50 ? {name:'Good',emoji:'💨'} : pct < 80 ? {name:'Long',emoji:'🌬️'} : {name:'BLINKER',emoji:'🫁🔥'};

export default function RussianRoulette() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [rrPhase, setRrPhase] = useState(null);
  const [rrPlayers, setRrPlayers] = useState([]);
  const [rrCurrentTurn, setRrCurrentTurn] = useState(0);
  const [rrChamber, setRrChamber] = useState(0);
  const [rrCurrentChamber, setRrCurrentChamber] = useState(0);
  const [rrComment, setRrComment] = useState('');
  const [rrEliminated, setRrEliminated] = useState(null);
  const [rrSpinAngle, setRrSpinAngle] = useState(0);
  const [rrTension, setRrTension] = useState(0);
  const [rrPuffCharge, setRrPuffCharge] = useState(0);
  const [rrIntroStage, setRrIntroStage] = useState(0);
  const [rrEliminatedList, setRrEliminatedList] = useState([]);
  const [rrWinner, setRrWinner] = useState(null);
  const [rrChambers, setRrChambers] = useState([false,false,false,false,false,false]);

  // Refs for stale closures
  const phaseRef = useRef(null);
  const playersRef = useRef([]);
  const currentTurnRef = useRef(0);
  const chamberRef = useRef(0);
  const currentChamberRef = useRef(0);
  const tensionRef = useRef(0);
  const spinAngleRef = useRef(0);
  const chambersRef = useRef([false,false,false,false,false,false]);
  const introStageRef = useRef(0);
  const winnerRef = useRef(null);
  const guardRef = useRef(null);

  useEffect(() => { phaseRef.current = rrPhase; }, [rrPhase]);
  useEffect(() => { playersRef.current = rrPlayers; }, [rrPlayers]);
  useEffect(() => { currentTurnRef.current = rrCurrentTurn; }, [rrCurrentTurn]);
  useEffect(() => { chamberRef.current = rrChamber; }, [rrChamber]);
  useEffect(() => { currentChamberRef.current = rrCurrentChamber; }, [rrCurrentChamber]);
  useEffect(() => { tensionRef.current = rrTension; }, [rrTension]);
  useEffect(() => { spinAngleRef.current = rrSpinAngle; }, [rrSpinAngle]);
  useEffect(() => { chambersRef.current = rrChambers; }, [rrChambers]);
  useEffect(() => { introStageRef.current = rrIntroStage; }, [rrIntroStage]);
  useEffect(() => { winnerRef.current = rrWinner; }, [rrWinner]);

  const rrCanvasRef = useRef(null);
  const rrAnimRef = useRef(null);
  const rrPuffStart = useRef(0);
  const rrPuffInterval = useRef(null);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const drawCanvas = useCallback(() => {
    const canvas = rrCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / RR_DPR, H = canvas.height / RR_DPR;
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(RR_DPR, RR_DPR);
    const now = Date.now();
    const players = playersRef.current;
    const curIdx = currentTurnRef.current;
    const phase = phaseRef.current;
    const tension = tensionRef.current;
    const spinAngle = spinAngleRef.current;
    const chambers = chambersRef.current;
    const bullet = chamberRef.current;
    const currentChamber = currentChamberRef.current;
    const introStage = introStageRef.current;

    // Smoky room background
    const bgGrad = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, Math.max(W, H) * 0.8);
    bgGrad.addColorStop(0, '#12091a'); bgGrad.addColorStop(0.3, '#0d0815'); bgGrad.addColorStop(0.6, '#0a0510'); bgGrad.addColorStop(1, '#050208');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

    // Dim overhead lamp
    const lampX = W / 2, lampY = 12;
    const lightGrad = ctx.createRadialGradient(lampX, lampY, 5, lampX, H * 0.5, H * 0.45);
    lightGrad.addColorStop(0, 'rgba(255,200,100,0.06)'); lightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGrad; ctx.fillRect(0, 0, W, H);
    const lampSwing = Math.sin(now / 1200) * 3;
    ctx.save(); ctx.translate(lampX + lampSwing, lampY);
    ctx.fillStyle = 'rgba(80,60,40,0.5)'; ctx.fillRect(-1, 0, 2, 18);
    ctx.beginPath(); ctx.ellipse(0, 22, 8, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,100,0.6)'; ctx.fill();
    ctx.shadowColor = 'rgba(255,200,100,0.3)'; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();

    // Smoke wisps
    for (let i = 0; i < 6; i++) {
      const sx = W * 0.1 + i * (W * 0.16), sy = H * 0.25 + Math.sin(now / 3000 + i * 1.7) * H * 0.15;
      const sAlpha = 0.015 + 0.008 * Math.sin(now / 4000 + i * 2.3);
      ctx.beginPath(); ctx.ellipse(sx, sy, 30 + i * 10, 12 + i * 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,160,140,' + sAlpha + ')'; ctx.fill();
    }

    // Vignette
    const vigI = phase === 'bang' ? 0.9 : phase === 'puffing' ? 0.7 : 0.45;
    const vigGrad = ctx.createRadialGradient(W / 2, H * 0.42, W * 0.15, W / 2, H * 0.42, W * 0.65);
    vigGrad.addColorStop(0, 'transparent'); vigGrad.addColorStop(1, 'rgba(0,0,0,' + vigI + ')');
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, W, H);

    // Tension border glow
    if (tension > 30) {
      const tAlpha = 0.05 + (tension / 100) * 0.15;
      const tR = tension > 60 ? '180,30,30' : '120,40,20';
      ctx.strokeStyle = 'rgba(' + tR + ',' + tAlpha + ')'; ctx.lineWidth = 20; ctx.strokeRect(-10, -10, W + 20, H + 20);
    }

    // Table
    const cx = W / 2, cy = H * 0.42, tableR = Math.min(W, H) * 0.26;
    ctx.beginPath(); ctx.ellipse(cx, cy, tableR, tableR * 0.6, 0, 0, Math.PI * 2);
    const tableGrad = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy, tableR);
    tableGrad.addColorStop(0, '#1a1510'); tableGrad.addColorStop(0.7, '#0f0c08'); tableGrad.addColorStop(1, '#080604');
    ctx.fillStyle = tableGrad; ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,40,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Revolver
    const gunPulse = 1 + 0.03 * Math.sin(now / 300);
    const gunAngle = (spinAngle || 0) * (Math.PI / 180);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(gunPulse, gunPulse); ctx.rotate(gunAngle);
    ctx.font = '36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\uD83D\uDD2B', 0, 0); ctx.restore();
    if (phase === 'spinning') {
      const sAlpha = 0.6 + 0.4 * Math.sin(now / 150);
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,217,61,' + sAlpha + ')'; ctx.fillText('SPINNING...', cx, cy + 28);
    }

    // Chamber dots
    for (let c = 0; c < 6; c++) {
      const cAngle = (c / 6) * Math.PI * 2 - Math.PI / 2, cR = 22;
      const dotX = cx + Math.cos(cAngle) * cR, dotY = cy + Math.sin(cAngle) * cR;
      const isRevealed = chambers[c], isCurrent = c === currentChamber;
      ctx.beginPath(); ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      if (isRevealed) { ctx.fillStyle = c === bullet ? '#FF3333' : '#33FF33'; }
      else if (isCurrent) { ctx.fillStyle = 'rgba(255,217,61,0.7)'; }
      else { ctx.fillStyle = 'rgba(255,255,255,0.15)'; }
      ctx.fill();
    }

    // Player seats
    const total = players.length, seatR = tableR + 35;
    for (let i = 0; i < total; i++) {
      const p = players[i];
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * seatR, py = cy + Math.sin(angle) * (seatR * 0.65);
      const isCur = i === curIdx && phase !== 'bang' && phase !== 'result';
      const isElim = !p.alive, dotR = isCur ? 20 : 16;

      if (isElim) {
        ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2); ctx.fillStyle = 'rgba(40,40,40,0.5)'; ctx.fill();
        ctx.strokeStyle = 'rgba(80,80,80,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('\uD83D\uDC80', px, py);
        ctx.font = 'bold 7px sans-serif'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(p.isYou ? 'YOU' : p.name, px, py + dotR + 3); continue;
      }

      if (isCur) {
        const glowC = p.isYou ? 'rgba(0,229,255,0.2)' : 'rgba(255,136,0,0.2)';
        const pulseR = dotR + 5 + 3 * Math.sin(now / 180);
        ctx.beginPath(); ctx.arc(px, py, pulseR, 0, Math.PI * 2); ctx.fillStyle = glowC; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py);
        ctx.strokeStyle = p.isYou ? 'rgba(0,229,255,0.12)' : 'rgba(255,136,0,0.12)';
        ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }

      ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2);
      const pColor = p.color || RR_PLAYER_COLORS[i % 6];
      ctx.fillStyle = isCur ? pColor : pColor + '80'; ctx.fill();
      ctx.strokeStyle = isCur ? (p.isYou ? '#00E5FF' : '#FF8800') : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = isCur ? 2.5 : 1.5; ctx.stroke();
      ctx.font = (dotR * 0.85) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, px, py);
      ctx.font = 'bold 8px sans-serif'; ctx.textBaseline = 'top';
      ctx.fillStyle = isCur ? (p.isYou ? '#00E5FF' : '#FFA500') : 'rgba(255,255,255,0.5)';
      ctx.fillText(p.isYou ? 'YOU' : p.name, px, py + dotR + 3);
      if (isCur) { ctx.font = 'bold 6px sans-serif'; ctx.fillStyle = '#FF3333'; ctx.fillText('TRIGGER', px, py + dotR + 13); }
    }

    // BANG flash
    if (phase === 'bang') {
      const bangAlpha = 0.15 + 0.1 * Math.sin(now / 80);
      ctx.fillStyle = 'rgba(255,0,0,' + bangAlpha + ')'; ctx.fillRect(0, 0, W, H);
      ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF0000'; ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 30;
      ctx.fillText('\uD83D\uDCA5', cx, cy - 50); ctx.font = 'bold 20px sans-serif'; ctx.fillText('BANG!', cx, cy - 20); ctx.shadowBlur = 0;
    }
    if (phase === 'click') {
      ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#33FF88';
      ctx.fillText('*click*', cx, cy - 45); ctx.font = 'bold 12px sans-serif'; ctx.fillText('SAFE', cx, cy - 25);
    }
    if (phase === 'intro') {
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
      if (introStage >= 1) ctx.fillText('6 players sit down...', cx, H * 0.18);
      if (introStage >= 2) { ctx.fillStyle = '#FF3333'; ctx.fillText('1 bullet. 6 chambers.', cx, H * 0.24); }
      if (introStage >= 3) { ctx.fillStyle = '#FFD93D'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('RUSSIAN ROULETTE', cx, H * 0.7); }
      if (introStage >= 4) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'; ctx.fillText('Puff long for dodge chance...', cx, H * 0.76); }
    }

    // Tension meter
    if (phase !== 'intro' && phase !== 'result') {
      const barW = W * 0.6, barH = 5, barX = (W - barW) / 2, barY = H * 0.88;
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(barX, barY, barW, barH);
      const tPct = tension / 100, tColor = tension < 30 ? '#33FF88' : tension < 60 ? '#FFD93D' : tension < 80 ? '#FF8800' : '#FF3333';
      ctx.fillStyle = tColor; ctx.fillRect(barX, barY, barW * tPct, barH);
      ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('TENSION', W / 2, barY + barH + 10);
    }
    ctx.restore();
  }, []); // eslint-disable-line

  // Canvas loop — restarts every render (Rule 4)
  useEffect(() => {
    if (!rrCanvasRef.current || !rrPhase) return;
    if (rrAnimRef.current) cancelAnimationFrame(rrAnimRef.current);
    { const loop = () => { drawCanvas(); rrAnimRef.current = requestAnimationFrame(loop); }; rrAnimRef.current = requestAnimationFrame(loop); }
    return () => { if (rrAnimRef.current) { cancelAnimationFrame(rrAnimRef.current); rrAnimRef.current = null; } };
  });

  const rrFindNextAlive = (players, fromIdx) => {
    for (let i = 1; i <= players.length; i++) {
      const ni = (fromIdx + i) % players.length; if (players[ni].alive) return ni;
    } return null;
  };

  const rrStartTurn = useCallback((players, idx, bullet, chamberPos) => {
    const p = players[idx];
    if (!p.alive) {
      const next = rrFindNextAlive(players, idx);
      if (next === null) return;
      setRrCurrentTurn(next); currentTurnRef.current = next;
      setTimeout(() => rrStartTurn(players, next, bullet, chamberPos), 200);
      return;
    }
    setRrCurrentTurn(idx); currentTurnRef.current = idx;
    setRrPuffCharge(0);
    if (p.isAI) {
      setRrComment(pick(RR_COMMENTS.tension)); playFx('select');
      addChat(p.name + ': ' + pick(['Here goes nothing...','Please be empty','I hate this game','*deep breath*']));
      setTimeout(() => {
        setRrPhase('pulling'); phaseRef.current = 'pulling';
        setTimeout(() => rrResolveTurn(players, idx, bullet, chamberPos, Math.random() * 60), 800);
      }, 1200 + Math.random() * 800);
    } else {
      const rrTurnName = p.isYou ? 'YOUR' : p.name + '\'s';
      setRrComment(rrTurnName + ' TURN... Hold to puff for dodge chance!');
      setRrPhase('player_turn'); phaseRef.current = 'player_turn';
      playFx('select');
      setRrTension(t => { const v = Math.min(160, t + 10); tensionRef.current = v; return v; });
      addChat('Announcer: ' + rrTurnName + ' TURN... ' + pick(RR_COMMENTS.yourTurn));
    }
  }, [addChat, playFx]); // eslint-disable-line

  const rrResolveTurn = useCallback((players, idx, bullet, chamberPos, dodgeCharge) => {
    const newChamber = (chamberPos + 1) % 6;
    const isLoaded = newChamber === bullet;
    setRrCurrentChamber(newChamber); currentChamberRef.current = newChamber;
    setRrChambers(ch => { const c = [...ch]; c[newChamber] = true; chambersRef.current = c; return c; });
    playFx('select');

    const dodgePct = rrGetDodgeChance(dodgeCharge);
    const dodged = isLoaded && Math.random() * 100 < dodgePct;

    if (isLoaded && !dodged) {
      setRrPhase('bang'); phaseRef.current = 'bang';
      setRrComment(pick(RR_COMMENTS.bang)); setRrEliminated(players[idx]);
      triggerShake(); triggerFlash('miss'); playFx('error');
      addChat('Announcer: ' + pick(RR_COMMENTS.bang));
      addChat(players[idx].isYou ? 'YOU GOT HIT!' : players[idx].name + ' is OUT!');
      const up = players.map((p, i) => i === idx ? { ...p, alive: false } : p);
      setRrPlayers(up); playersRef.current = up;
      setRrEliminatedList(el => [...el, players[idx]]);
      setRrTension(t => { const v = Math.min(100, t + 20); tensionRef.current = v; return v; });

      setTimeout(() => {
        if (!guardRef.current?.v) return;
        const aliveCount = up.filter(p => p.alive).length;
        if (aliveCount <= 1) {
          const winner = up.find(p => p.alive);
          setRrWinner(winner || null); winnerRef.current = winner || null;
          setRrPhase('result'); phaseRef.current = 'result';
          if (winner && winner.isYou) {
            spawnConfetti(50, [C.gold, C.green, C.cyan, C.pink]); playFx('win'); triggerFlash('goal');
            awardGame('russian', 'win');
            addChat('SOLE SURVIVOR! YOU WIN!');
          } else {
            playFx('lose'); awardGame('russian', 'lose');
            addChat((winner ? winner.name : 'Nobody') + ' is the last one standing!');
          }
        } else {
          const nb = Math.floor(Math.random() * 6);
          setRrChamber(nb); chamberRef.current = nb;
          setRrCurrentChamber(0); currentChamberRef.current = 0;
          const freshCh = [false,false,false,false,false,false];
          setRrChambers(freshCh); chambersRef.current = freshCh;
          setRrPhase('spinning'); phaseRef.current = 'spinning';
          setRrSpinAngle(a => { const v = a + 720 + Math.random() * 720; spinAngleRef.current = v; return v; });
          setRrComment('Respinning... ' + aliveCount + ' remain'); playFx('select');
          addChat('Announcer: ' + aliveCount + ' players remain... re-spinning!');
          setTimeout(() => {
            if (!guardRef.current?.v) return;
            const next = rrFindNextAlive(up, idx);
            if (next !== null) { setRrPhase('player_turn'); phaseRef.current = 'player_turn'; rrStartTurn(up, next, nb, 0); }
          }, 2200);
        }
      }, 2500);
    } else if (isLoaded && dodged) {
      setRrPhase('click'); phaseRef.current = 'click';
      setRrComment(pick(RR_COMMENTS.dodge)); playFx('win'); triggerFlash('goal');
      if (dodgeCharge >= 80) playFx('laugh');
      addChat('Announcer: ' + pick(RR_COMMENTS.dodge));
      const up = players.map((p, i) => i === idx ? { ...p, dodges: (p.dodges || 0) + 1, survived: (p.survived || 0) + 1 } : p);
      setRrPlayers(up); playersRef.current = up;
      setRrTension(t => { const v = Math.min(100, t + 15); tensionRef.current = v; return v; });
      setTimeout(() => {
        if (!guardRef.current?.v) return;
        const nb = Math.floor(Math.random() * 6);
        setRrChamber(nb); chamberRef.current = nb;
        setRrCurrentChamber(0); currentChamberRef.current = 0;
        const freshCh = [false,false,false,false,false,false];
        setRrChambers(freshCh); chambersRef.current = freshCh;
        setRrPhase('spinning'); phaseRef.current = 'spinning';
        setRrSpinAngle(a => { const v = a + 720 + Math.random() * 720; spinAngleRef.current = v; return v; });
        setTimeout(() => {
          if (!guardRef.current?.v) return;
          const next = rrFindNextAlive(up, idx);
          if (next !== null) { setRrPhase('player_turn'); phaseRef.current = 'player_turn'; rrStartTurn(up, next, nb, 0); }
        }, 2200);
      }, 2000);
    } else {
      setRrPhase('click'); phaseRef.current = 'click';
      setRrComment(pick(RR_COMMENTS.click)); playFx('select');
      const up = players.map((p, i) => i === idx ? { ...p, survived: (p.survived || 0) + 1 } : p);
      setRrPlayers(up); playersRef.current = up;
      addChat(pick(['The LUCK','How many empty chambers left?','This is so tense','I can\'t breathe rn']));
      setRrTension(t => { const v = Math.min(100, t + 8); tensionRef.current = v; return v; });
      setTimeout(() => {
        if (!guardRef.current?.v) return;
        const next = rrFindNextAlive(up, idx);
        if (next !== null) { setRrPhase('player_turn'); phaseRef.current = 'player_turn'; rrStartTurn(up, next, bullet, newChamber); }
      }, 1800);
    }
  }, [addChat, playFx, spawnConfetti, triggerFlash, triggerShake, awardGame, rrStartTurn]);

  const rrStartPuff = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return;
    const cur = playersRef.current[currentTurnRef.current];
    if (!cur || cur.isAI) return;
    setRrPhase('puffing'); phaseRef.current = 'puffing';
    setRrPuffCharge(0); rrPuffStart.current = Date.now(); playFx('charge');
    rrPuffInterval.current = setInterval(() => {
      const e = (Date.now() - rrPuffStart.current) / 1000;
      setRrPuffCharge(Math.min(100, (e / 5.0) * 100));
      if (e >= 5.5) rrStopPuff();
    }, 50);
  }, [playFx]); // eslint-disable-line

  const rrStopPuff = useCallback(() => {
    if (phaseRef.current !== 'puffing') return;
    if (rrPuffInterval.current) { clearInterval(rrPuffInterval.current); rrPuffInterval.current = null; }
    const charge = Math.min(100, ((Date.now() - rrPuffStart.current) / 5000) * 100);
    setRrPuffCharge(charge);
    setRrPhase('pulling'); phaseRef.current = 'pulling';
    const tier = rrGetPuffTier(charge);
    setRrComment(tier.name + ' puff! ' + tier.emoji + ' (' + rrGetDodgeChance(charge) + '% dodge)');
    if (charge >= 80) { playFx('laugh'); addChat('BLINKER PUFF! 80% dodge chance!'); }
    else if (charge >= 50) { addChat('Long puff! ' + rrGetDodgeChance(charge) + '% dodge'); }
    setTimeout(() => rrResolveTurn(playersRef.current, currentTurnRef.current, chamberRef.current, currentChamberRef.current, charge), 600);
  }, [playFx, addChat, rrResolveTurn]);

  const startGame = useCallback(() => {
    if (rrAnimRef.current) { cancelAnimationFrame(rrAnimRef.current); rrAnimRef.current = null; }
    if (rrPuffInterval.current) { clearInterval(rrPuffInterval.current); rrPuffInterval.current = null; }
    if (guardRef.current) guardRef.current.v = false;
    const guard = { v: true }; guardRef.current = guard;

    const shuffled = [...RR_AI].sort(() => Math.random() - 0.5).slice(0, 5);
    const aiPlayers = shuffled.map((a, i) => ({ ...a, isYou: false, isAI: true, isHuman: false, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[(i + 1) % 6] }));
    const youIdx = Math.floor(Math.random() * (aiPlayers.length + 1));
    aiPlayers.splice(youIdx, 0, { name: 'You', emoji: '\uD83D\uDE24', isYou: true, isAI: false, isHuman: false, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[0] });
    const players = aiPlayers;
    const bullet = Math.floor(Math.random() * 6);

    setRrPlayers(players); playersRef.current = players;
    setRrCurrentTurn(0); currentTurnRef.current = 0;
    setRrChamber(bullet); chamberRef.current = bullet;
    setRrCurrentChamber(0); currentChamberRef.current = 0;
    setRrComment(''); setRrEliminated(null);
    setRrSpinAngle(0); spinAngleRef.current = 0;
    setRrTension(0); tensionRef.current = 0;
    setRrPuffCharge(0); setRrIntroStage(0); introStageRef.current = 0;
    setRrEliminatedList([]); setRrWinner(null); winnerRef.current = null;
    const freshCh = [false,false,false,false,false,false];
    setRrChambers(freshCh); chambersRef.current = freshCh;
    setRrPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd'); addChat('6 souls sit down... only 1 leaves.');

    setTimeout(() => { if (!guard.v) return; setRrIntroStage(1); introStageRef.current = 1; addChat(pick(['This is gonna be NASTY','My palms are sweating rn'])); }, 600);
    setTimeout(() => { if (!guard.v) return; setRrIntroStage(2); introStageRef.current = 2; }, 1800);
    setTimeout(() => { if (!guard.v) return; setRrIntroStage(3); introStageRef.current = 3; addChat('The revolver is loaded...'); }, 3500);
    setTimeout(() => { if (!guard.v) return; setRrIntroStage(4); introStageRef.current = 4; playFx('whistle'); }, 5000);
    setTimeout(() => {
      if (!guard.v) return;
      setRrPhase('spinning'); phaseRef.current = 'spinning';
      setRrSpinAngle(1080 + Math.random() * 720); spinAngleRef.current = 1080 + Math.random() * 720;
      setRrComment(pick(RR_COMMENTS.spin)); playFx('select');
      addChat(pick(RR_COMMENTS.spin));
      setTimeout(() => {
        if (!guard.v) return;
        setRrPhase('player_turn'); phaseRef.current = 'player_turn';
        setRrTension(10); tensionRef.current = 10;
        rrStartTurn(players, 0, bullet, 0);
      }, 2500);
    }, 6500);
  }, [playFx, addChat, rrStartTurn]);

  // BLE handlers
  useEffect(() => {
    setBLEHandlers(0, () => rrStartPuff(), () => rrStopPuff());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => {
      if (guardRef.current) guardRef.current.v = false;
      if (rrPuffInterval.current) clearInterval(rrPuffInterval.current);
      if (rrAnimRef.current) cancelAnimationFrame(rrAnimRef.current);
    };
  }, []); // eslint-disable-line

  const curP = rrPlayers[rrCurrentTurn];
  const isYourTurn = curP && curP.isYou && rrPhase === 'player_turn';
  const isPuffing = rrPhase === 'puffing';
  const aliveCount = rrPlayers.filter(p => p.alive).length;
  const won = rrWinner && rrWinner.isYou;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      <GameHeader
        backTo={() => { if (guardRef.current) guardRef.current.v = false; if (rrPuffInterval.current) clearInterval(rrPuffInterval.current); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={C.red}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.red }}>🔫 RUSSIAN ROULETTE</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{aliveCount}/6 alive</span>
          </div>
        }
        row3={
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: rrPhase === 'bang' ? C.red : rrPhase === 'click' ? C.green : C.text3 }}>
              {rrPhase === 'intro' ? 'Preparing...' : rrPhase === 'result' ? 'Game Over' : rrPhase === 'spinning' ? 'Spinning chamber...' : curP ? (curP.isYou ? 'YOUR TURN' : curP.name + "'s turn") : '...'}
            </span>
          </div>
        }
      />

      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={rrCanvasRef} width={Math.round(420 * RR_DPR)} height={Math.round(600 * RR_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Bang overlay */}
        {rrPhase === 'bang' && rrEliminated && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(50,0,0,0.7)', animation: 'fadeIn 0.3s ease', pointerEvents: 'none' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💥🔫💥</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.red }}>{rrEliminated.isYou ? 'YOU GOT HIT!' : rrEliminated.name + ' IS OUT!'}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>{aliveCount} players remain</div>
          </div>
        )}

        {/* Result overlay */}
        {rrPhase === 'result' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,2,8,0.9)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: won ? C.green : C.red }}>{won ? 'SOLE SURVIVOR!' : rrWinner ? rrWinner.name + ' WINS!' : 'Game Over!'}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>+{won ? 30 : 5} coins</div>
            <div style={{ marginTop: 14, textAlign: 'left', width: '80%', maxWidth: 260 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>ELIMINATION ORDER</div>
              {rrEliminatedList.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <span style={{ fontSize: 8, color: C.red }}>💀 #{i + 1}</span>
                  <span style={{ fontSize: 9, color: C.text2 }}>{p.isYou ? 'You' : p.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 13, fontWeight: 800, color: C.red }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,4,12,0.98)', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {isPuffing && (
          <div style={{ width: '90%', maxWidth: 300 }}>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: rrPuffCharge + '%', height: '100%', borderRadius: 4, background: rrPuffCharge >= 80 ? `linear-gradient(90deg,${C.red},#FF0000)` : rrPuffCharge >= 50 ? `linear-gradient(90deg,${C.gold},${C.orange})` : `linear-gradient(90deg,${C.cyan},${C.purple})`, transition: 'width 0.05s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 7, color: C.text3 }}>Tap (0%)</span>
              <span style={{ fontSize: 7, color: C.cyan }}>Short (3%)</span>
              <span style={{ fontSize: 7, color: C.gold }}>Long (15%)</span>
              <span style={{ fontSize: 7, color: C.red }}>BLINKER (80%)</span>
            </div>
          </div>
        )}
        {isYourTurn && !isPuffing && (
          <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 340 }}>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); rrResolveTurn(rrPlayers, rrCurrentTurn, rrChamber, rrCurrentChamber, 0); }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)', animation: 'pulse 1s infinite', userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.red, letterSpacing: 1 }}>TAP PULL</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>No dodge bonus</div>
            </div>
            <div
              data-btn="true"
              onMouseDown={(e) => { e.stopPropagation(); rrStartPuff(); }}
              onMouseUp={(e) => { e.stopPropagation(); rrStopPuff(); }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); rrStartPuff(); }}
              onTouchEnd={(e) => { e.stopPropagation(); rrStopPuff(); }}
              onTouchCancel={(e) => { e.stopPropagation(); rrStopPuff(); }}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}20,${C.purple}10)`, border: `2px solid ${C.cyan}30`, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>PUFF PULL</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Hold = dodge %</div>
            </div>
          </div>
        )}
        {rrPhase !== 'result' && curP && curP.isAI && rrPhase !== 'intro' && rrPhase !== 'spinning' && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.15)' }}>
            <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{curP.name} pulls the trigger...</span>
          </div>
        )}
        {rrComment && <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{rrComment}</div>}
      </div>
    </div>
  );
}
