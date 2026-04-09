import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const PL_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const PL_TARGETS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0];
const PL_NAMES = ['CloudChaser99','BlinkerBetty','THC_Tony','VapeLord69','DabQueen','PuffDaddy_Jr','SmokeRing_Steve','HazeDaze','KushKing','FogMachine','MistWalker','NebulaNick','GreenGoblin','SkyHighSam','TokeToken','LitLenny','BubbleBoi','RipTide','SeshGremlin','GlassHouse'];

export default function PuffLimbo() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [plPhase, setPlPhase] = useState(null);
  const [plTarget, setPlTarget] = useState(1.0);
  const [plRound, setPlRound] = useState(0);
  const [plHolding, setPlHolding] = useState(false);
  const [plPuffTime, setPlPuffTime] = useState(0);
  const [plPlayers, setPlPlayers] = useState(8);
  const [plEliminatedList, setPlEliminatedList] = useState([]);
  const [plRoundResults, setPlRoundResults] = useState([]);
  const [commentary, setCommentary] = useState('');

  // Refs for stale closure safety
  const phaseRef = useRef(null);
  const targetRef = useRef(1.0);
  const roundRef = useRef(0);
  const holdingRef = useRef(false);
  const playersRef = useRef(8);
  const puffTimeRef = useRef(0);
  const roundResultsRef = useRef([]);
  const guardRef = useRef(null);

  useEffect(() => { phaseRef.current = plPhase; }, [plPhase]);
  useEffect(() => { targetRef.current = plTarget; }, [plTarget]);
  useEffect(() => { roundRef.current = plRound; }, [plRound]);
  useEffect(() => { holdingRef.current = plHolding; }, [plHolding]);
  useEffect(() => { playersRef.current = plPlayers; }, [plPlayers]);

  const plPuffInterval = useRef(null);
  const plHoldStart = useRef(0);
  const plCanvasRef = useRef(null);
  const plAnimRef = useRef(null);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const drawCanvas = useCallback(() => {
    const canvas = plCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, dpr = PL_DPR;
    ctx.clearRect(0, 0, W, H);

    const phase = phaseRef.current;
    const target = targetRef.current;
    const puffTime = puffTimeRef.current;
    const round = roundRef.current;
    const players = playersRef.current;
    const roundResults = roundResultsRef.current;
    const dangerZone = target >= 4.0;
    const isBlinkerRound = round === 7;

    // Background - circus/fire theme
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, dangerZone ? '#2a0a00' : '#1a0a00');
    bg.addColorStop(0.4, dangerZone ? '#3d1500' : '#2d1200');
    bg.addColorStop(0.7, '#1a0800');
    bg.addColorStop(1, '#050200');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Danger glow
    if (dangerZone) {
      const dg = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, W * 0.6);
      dg.addColorStop(0, 'rgba(239,68,68,0.08)'); dg.addColorStop(1, 'transparent');
      ctx.fillStyle = dg; ctx.fillRect(0, 0, W, H);
    }

    // Ground line
    const groundY = H * 0.85;
    ctx.fillStyle = 'rgba(255,165,0,0.1)'; ctx.fillRect(0, groundY, W, H - groundY);

    // Limbo bar position
    const barMaxH = H * 0.75; const barMinH = H * 0.2;
    const barY = groundY - (target / 5.5) * (barMaxH - barMinH) - barMinH * 0.2;

    // Poles
    ctx.fillStyle = 'rgba(255,165,0,0.3)';
    ctx.fillRect(W * 0.08, barY, 6 * dpr, groundY - barY);
    ctx.fillRect(W * 0.88, barY, 6 * dpr, groundY - barY);

    // Bar
    const barGrad = ctx.createLinearGradient(W * 0.08, barY, W * 0.92, barY);
    barGrad.addColorStop(0, dangerZone ? '#EF4444' : '#F97316');
    barGrad.addColorStop(0.5, isBlinkerRound ? '#EF4444' : '#FFD93D');
    barGrad.addColorStop(1, dangerZone ? '#EF4444' : '#F97316');
    ctx.fillStyle = barGrad; ctx.fillRect(W * 0.08, barY, W * 0.84, 4 * dpr);
    ctx.shadowColor = dangerZone ? 'rgba(239,68,68,0.5)' : 'rgba(249,115,22,0.3)';
    ctx.shadowBlur = 12 * dpr;
    ctx.fillRect(W * 0.08, barY, W * 0.84, 4 * dpr); ctx.shadowBlur = 0;

    // Target label
    ctx.font = `800 ${9 * dpr}px sans-serif`; ctx.textAlign = 'right';
    ctx.fillStyle = dangerZone ? '#EF4444' : '#F97316';
    ctx.fillText(target.toFixed(1) + 's', W * 0.95, barY - 4 * dpr);

    // Blinker threshold dashed line
    if (target >= 3.0) {
      const blinkerY = groundY - (5.0 / 5.5) * (barMaxH - barMinH) - barMinH * 0.2;
      ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.strokeStyle = 'rgba(239,68,68,0.3)'; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(W * 0.08, blinkerY); ctx.lineTo(W * 0.92, blinkerY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `700 ${7 * dpr}px sans-serif`; ctx.fillStyle = '#EF4444'; ctx.textAlign = 'right';
      ctx.fillText('BLINKER 5.0s', W * 0.95, blinkerY - 3 * dpr);
    }

    // Crowd row
    const crowd = Math.min(players, 8);
    for (let i = 0; i < crowd; i++) {
      const px = W * 0.15 + (i / (crowd - 1 || 1)) * W * 0.7;
      const py = groundY + 10 * dpr;
      ctx.font = `${10 * dpr}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(i === 0 ? '\uD83E\uDDD1' : '\uD83D\uDC64', px, py);
    }

    // Puff bar (rising)
    if (phase === 'puffing' || phase === 'result' || phase === 'eliminated') {
      const puffH = (puffTime / 5.5) * (barMaxH - barMinH) + barMinH * 0.2;
      const puffY = groundY - puffH;
      const puffColor = puffTime >= 5 ? '#EF4444' : puffTime >= target ? '#22C55E' : '#F97316';
      const pGrad = ctx.createLinearGradient(0, groundY, 0, puffY);
      pGrad.addColorStop(0, puffColor + '40'); pGrad.addColorStop(1, puffColor);
      ctx.fillStyle = pGrad; ctx.fillRect(W * 0.38, puffY, W * 0.24, puffH);
      ctx.shadowColor = puffColor; ctx.shadowBlur = 10 * dpr;
      ctx.fillRect(W * 0.38, puffY, W * 0.24, 3 * dpr); ctx.shadowBlur = 0;
      ctx.font = `900 ${14 * dpr}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(puffTime.toFixed(1) + 's', W / 2, puffY - 8 * dpr);
    }

    // Phase-specific text
    ctx.textAlign = 'center';
    if (phase === 'intro') {
      ctx.font = `900 ${22 * dpr}px sans-serif`; ctx.fillStyle = '#F97316';
      ctx.fillText('PUFF LIMBO', W / 2, H * 0.35);
      ctx.font = `600 ${11 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.6)';
      ctx.fillText('Hold for the target \u00B10.3s to survive', W / 2, H * 0.42);
      ctx.fillText('8 rounds. Last one standing wins!', W / 2, H * 0.47);
      ctx.font = `700 ${10 * dpr}px sans-serif`; ctx.fillStyle = '#EF4444';
      ctx.fillText('Round 8 = BLINKER (5.0s!)', W / 2, H * 0.54);
    } else if (phase === 'ready') {
      ctx.font = `900 ${20 * dpr}px sans-serif`; ctx.fillStyle = dangerZone ? '#EF4444' : '#F97316';
      ctx.fillText(isBlinkerRound ? 'BLINKER ROUND!' : 'Round ' + (round + 1), W / 2, H * 0.15);
      ctx.font = `700 ${13 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.7)';
      ctx.fillText('Hold for ' + target.toFixed(1) + 's \u00B10.3s', W / 2, H * 0.21);
      ctx.font = `600 ${10 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.4)';
      ctx.fillText('Puff to start', W / 2, H * 0.27);
    } else if (phase === 'eliminated') {
      ctx.font = `900 ${24 * dpr}px sans-serif`; ctx.fillStyle = '#EF4444';
      ctx.fillText('ELIMINATED!', W / 2, H * 0.15);
      ctx.font = `600 ${11 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.6)';
      ctx.fillText(puffTime.toFixed(2) + 's (needed ' + target.toFixed(1) + 's \u00B10.3s)', W / 2, H * 0.22);
    } else if (phase === 'result') {
      ctx.font = `900 ${20 * dpr}px sans-serif`; ctx.fillStyle = '#22C55E';
      ctx.fillText('SURVIVED!', W / 2, H * 0.15);
      if (puffTime >= 5) {
        ctx.font = `800 ${12 * dpr}px sans-serif`; ctx.fillStyle = '#FFD93D';
        ctx.fillText('BLINKER HOLD!', W / 2, H * 0.22);
      }
    } else if (phase === 'champion') {
      ctx.font = `900 ${24 * dpr}px sans-serif`; ctx.fillStyle = '#FFD93D';
      ctx.fillText('CHAMPION!', W / 2, H * 0.3);
      ctx.font = `700 ${12 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.7)';
      ctx.fillText('Survived the 5.0s BLINKER!', W / 2, H * 0.37);
    } else if (phase === 'final') {
      ctx.font = `900 ${18 * dpr}px sans-serif`; ctx.fillStyle = round >= 7 ? '#FFD93D' : '#F97316';
      ctx.fillText(round >= 7 ? 'CHAMPION!' : 'Game Over', W / 2, H * 0.2);
      ctx.font = `600 ${10 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.6)';
      ctx.fillText('Made it to Round ' + (round + 1) + ' of 8', W / 2, H * 0.27);
      roundResults.forEach((r, i) => {
        ctx.font = `600 ${8 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.5)';
        ctx.fillText('R' + r.round + ': ' + r.target.toFixed(1) + 's > ' + r.time.toFixed(2) + 's', W / 2, H * 0.34 + i * 12 * dpr);
      });
    }

    // Floating fire particles
    const t = Date.now() / 1000;
    for (let i = 0; i < 6; i++) {
      const px = W * ((i * 0.17 + t * 0.03) % 1);
      const py = H * (1 - ((i * 0.11 + t * 0.02) % 0.4));
      ctx.beginPath(); ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.08)';
      ctx.fill();
    }
  }, []); // eslint-disable-line

  // Canvas loop — restarts every render (Rule 4)
  useEffect(() => {
    if (!plCanvasRef.current || !plPhase) return;
    if (plAnimRef.current) cancelAnimationFrame(plAnimRef.current);
    { const loop = () => { drawCanvas(); plAnimRef.current = requestAnimationFrame(loop); }; plAnimRef.current = requestAnimationFrame(loop); }
    return () => { if (plAnimRef.current) { cancelAnimationFrame(plAnimRef.current); plAnimRef.current = null; } };
  });

  const plStartRound = useCallback((roundNum, players, guard) => {
    if (!guard.v) return;
    if (roundNum >= 8) {
      setPlPhase('champion'); phaseRef.current = 'champion';
      awardGame('pufflimbo', 'win');
      setCommentary('PUFF LIMBO CHAMPION!');
      spawnConfetti(80, ['#FFD93D', '#F97316', '#EF4444', '#F472B6']);
      playFx('win');
      addChat('CHAMPION! Survived ALL rounds!');
      setTimeout(() => { if (!guard.v) return; setPlPhase('final'); phaseRef.current = 'final'; }, 3000);
      return;
    }
    const target = PL_TARGETS[roundNum];
    setPlRound(roundNum); roundRef.current = roundNum;
    setPlTarget(target); targetRef.current = target;
    setPlPuffTime(0); puffTimeRef.current = 0;
    setPlHolding(false); holdingRef.current = false;
    setPlPlayers(players); playersRef.current = players;
    setPlPhase('ready'); phaseRef.current = 'ready';
    if (roundNum > 0) playFx('select');
    const isBlinkerRound = roundNum === 7;
    const dangerMsg = isBlinkerRound ? ' — BLINKER ROUND!' : target >= 3.5 ? ' — getting serious' : '';
    setCommentary('Round ' + (roundNum + 1) + ': Hold for ' + target.toFixed(1) + 's' + dangerMsg);
    addChat('Round ' + (roundNum + 1) + ': ' + target.toFixed(1) + 's target' + dangerMsg);
    if (target >= 4.0) playFx('charge');
  }, [playFx, awardGame, spawnConfetti, addChat]);

  const plReleasePuff = useCallback(() => {
    if (!holdingRef.current && phaseRef.current !== 'puffing') return;
    if (plPuffInterval.current) { clearInterval(plPuffInterval.current); plPuffInterval.current = null; }
    setPlHolding(false); holdingRef.current = false;
    const elapsed = (Date.now() - plHoldStart.current) / 1000;
    setPlPuffTime(elapsed); puffTimeRef.current = elapsed;
    const guard = guardRef.current; if (!guard || !guard.v) return;
    const round = roundRef.current;
    const target = targetRef.current;
    const currentPlayers = playersRef.current;
    const deviation = Math.abs(elapsed - target);
    const survived = deviation <= 0.3;
    const isBlinker = elapsed >= 5.0;
    const failChance = target >= 4.0 ? 0.4 : target >= 3.0 ? 0.25 : 0.15;
    let eliminatedCount = 0;
    for (let i = 0; i < currentPlayers - 1; i++) { if (Math.random() < failChance) eliminatedCount++; }
    const newPlayers = Math.max(1, currentPlayers - eliminatedCount - (survived ? 0 : 1));
    const newEliminated = [];
    for (let i = 0; i < eliminatedCount; i++) newEliminated.push(PL_NAMES[Math.floor(Math.random() * PL_NAMES.length)]);
    const nextPlayerCount = survived ? newPlayers + 1 : newPlayers;
    setPlPlayers(nextPlayerCount); playersRef.current = nextPlayerCount;

    if (!survived) {
      setPlPhase('eliminated'); phaseRef.current = 'eliminated';
      setCommentary('ELIMINATED! ' + elapsed.toFixed(2) + 's (needed ' + target.toFixed(1) + 's ±0.3s)');
      addChat('ELIMINATED at ' + elapsed.toFixed(2) + 's!');
      playFx('error'); triggerShake();
    } else {
      setPlPhase('result'); phaseRef.current = 'result';
      setPlEliminatedList(prev => [...prev, ...newEliminated]);
      const newResult = { round: round + 1, target, time: elapsed, survived: true };
      setPlRoundResults(prev => {
        const updated = [...prev, newResult];
        roundResultsRef.current = updated;
        return updated;
      });
      if (isBlinker) {
        setCommentary('BLINKER HOLD! ' + elapsed.toFixed(2) + 's — ABSOLUTE LEGEND!');
        addChat('BLINKER! LEGENDARY!');
        playFx('goal'); triggerFlash('goal'); spawnConfetti(50, ['#F97316', '#EF4444', '#FFD93D']);
      } else {
        setCommentary('SURVIVED! ' + elapsed.toFixed(2) + 's (needed ' + target.toFixed(1) + 's)');
        addChat('Made it through! ' + nextPlayerCount + ' remain');
        playFx('success');
      }
      if (eliminatedCount > 0) {
        setTimeout(() => { if (!guard.v) return; setCommentary(eliminatedCount + ' eliminated! ' + nextPlayerCount + ' remain'); }, 1500);
      }
    }

    setTimeout(() => {
      if (!guard.v) return;
      if (!survived) {
        awardGame('pufflimbo', 'lose');
        setPlPhase('final'); phaseRef.current = 'final';
        setCommentary('Puff Limbo over! Made it to round ' + (round + 1));
        playFx('lose');
      } else {
        plStartRound(round + 1, nextPlayerCount, guard);
      }
    }, 2500);
  }, [playFx, triggerShake, triggerFlash, spawnConfetti, awardGame, addChat, plStartRound]);

  const plStartPuff = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    if (holdingRef.current) return;
    setPlHolding(true); holdingRef.current = true;
    setPlPuffTime(0); puffTimeRef.current = 0;
    plHoldStart.current = Date.now();
    setPlPhase('puffing'); phaseRef.current = 'puffing';
    plPuffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - plHoldStart.current) / 1000;
      setPlPuffTime(elapsed); puffTimeRef.current = elapsed;
      if (elapsed >= 6.0) plReleasePuff();
    }, 50);
  }, [plReleasePuff]);

  const startGame = useCallback(() => {
    if (plPuffInterval.current) { clearInterval(plPuffInterval.current); plPuffInterval.current = null; }
    if (guardRef.current) guardRef.current.v = false;
    const guard = { v: true }; guardRef.current = guard;
    setPlRound(0); roundRef.current = 0;
    setPlTarget(PL_TARGETS[0]); targetRef.current = PL_TARGETS[0];
    setPlPlayers(8); playersRef.current = 8;
    setPlPuffTime(0); puffTimeRef.current = 0;
    setPlHolding(false); holdingRef.current = false;
    setPlEliminatedList([]);
    setPlRoundResults([]); roundResultsRef.current = [];
    setPlPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('Welcome to PUFF LIMBO! 8 players enter!');
    setCommentary('Welcome to PUFF LIMBO! Can you survive the blinker threshold?');
    setTimeout(() => { if (!guard.v) return; plStartRound(0, 8, guard); }, 2500);
  }, [playFx, addChat, plStartRound]);

  // BLE handlers
  useEffect(() => {
    setBLEHandlers(0, () => plStartPuff(), () => plReleasePuff());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => {
      if (guardRef.current) guardRef.current.v = false;
      if (plPuffInterval.current) clearInterval(plPuffInterval.current);
      if (plAnimRef.current) cancelAnimationFrame(plAnimRef.current);
    };
  }, []); // eslint-disable-line

  const dangerZone = plTarget >= 4.0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Header */}
      <GameHeader
        backTo={() => { if (guardRef.current) guardRef.current.v = false; if (plPuffInterval.current) clearInterval(plPuffInterval.current); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={C.orange}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: dangerZone ? C.red : C.orange }}>🎪 PUFF LIMBO</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>R{plRound + 1}/8</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{plPlayers} alive</span>
          </div>
        }
        row3={
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: plPhase === 'puffing' ? (plPuffTime >= plTarget ? C.green : C.orange) : plPhase === 'eliminated' ? C.red : plPhase === 'champion' ? C.gold : C.text3 }}>
              {plPhase === 'intro' ? 'Entering arena...' :
                plPhase === 'ready' ? `Target: ${plTarget.toFixed(1)}s ±0.3s` :
                plPhase === 'puffing' ? (plPuffTime >= plTarget ? 'RELEASE! TARGET REACHED' : `Holding... ${plPuffTime.toFixed(1)}s`) :
                plPhase === 'result' ? 'SURVIVED!' :
                plPhase === 'eliminated' ? 'ELIMINATED!' :
                plPhase === 'champion' ? 'CHAMPION!' : commentary}
            </span>
          </div>
        }
      />

      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={plCanvasRef}
          width={Math.round(420 * PL_DPR)}
          height={Math.round(600 * PL_DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </div>

      {/* Controls */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {(plPhase === 'ready' || plPhase === 'puffing') && (
          <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
            <div
              data-btn="true"
              onMouseDown={(e) => { e.stopPropagation(); plStartPuff(); }}
              onMouseUp={(e) => { e.stopPropagation(); plReleasePuff(); }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); plStartPuff(); }}
              onTouchEnd={(e) => { e.stopPropagation(); plReleasePuff(); }}
              onTouchCancel={(e) => { e.stopPropagation(); plReleasePuff(); }}
              style={{ touchAction: 'none', flex: 1.5, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: plHolding ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.08)', border: `2px solid ${plHolding ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.2)'}`, transition: 'all 0.15s', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>{plHolding ? '💨 HOLDING...' : 'PUFF & HOLD'}</div>
              <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold for {plTarget.toFixed(1)}s ±0.3s</div>
            </div>
            {plRound === 7 && (
              <div
                data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); plStartPuff(); }}
                onMouseUp={(e) => { e.stopPropagation(); plReleasePuff(); }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); plStartPuff(); }}
                onTouchEnd={(e) => { e.stopPropagation(); plReleasePuff(); }}
                onTouchCancel={(e) => { e.stopPropagation(); plReleasePuff(); }}
                style={{ touchAction: 'none', flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)', animation: 'pulse 1.5s infinite', userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>5.0s hero!</div>
              </div>
            )}
          </div>
        )}
        {plPhase === 'final' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}>Again</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic' }}>{commentary}</div>
      </div>
    </div>
  );
}
