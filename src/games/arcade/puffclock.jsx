import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const PC_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const PC_TARGETS = [2.00, 3.50, 1.75, 4.20, 0];
const PC_ROUND_NAMES = ['Round 1: The Warm-Up', 'Round 2: Getting Tricky', 'Round 3: Precision Mode', 'Round 4: THE 4.20 ROUND', 'Round 5: SURPRISE'];
const PC_COMEDY = ['Not even close, but A for effort', 'My grandma could time better', 'Time flies when you\'re having puffs!', 'Your temporal lobe called in sick', 'Somewhere a clock is laughing at you'];
const PC_BOT_NAMES = ['CloudTimer', 'PrecisionPuff', '4.20_King'];
const PC_BOT_SKILL = [0.25, 0.40, 0.15];

export default function PuffClock() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
    screenShake, screenFlash,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [target, setTarget] = useState(0);
  const [round, setRound] = useState(0);
  const [puffTime, setPuffTime] = useState(0);
  const [holding, setHolding] = useState(false);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [comment, setComment] = useState('');
  const [perfect420, setPerfect420] = useState(false);

  const phaseRef = useRef(phase);
  const targetRef = useRef(target);
  const roundRef = useRef(round);
  const holdingRef = useRef(holding);
  const resultsRef = useRef(results);
  const puffStartRef = useRef(0);
  const blinkerStartRef = useRef(0);
  const puffIntervalRef = useRef(null);
  const animRef = useRef(null);
  const canvasRef = useRef(null);
  const botResultsRef = useRef([]);
  const inputModeRef = useRef('none');

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { holdingRef.current = holding; }, [holding]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  // ── Canvas draw ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, dpr = PC_DPR;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#060d1e'); bg.addColorStop(0.4, '#0a1832'); bg.addColorStop(1, '#040e1a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.5);
    glow.addColorStop(0, 'rgba(0,229,255,0.06)'); glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    const curPhase = phaseRef.current;
    const curTarget = targetRef.current;
    const curHolding = holdingRef.current;
    const cx = W / 2, cy = H * 0.32, clockR = Math.min(W, H) * 0.22;

    // Clock ring
    ctx.beginPath(); ctx.arc(cx, cy, clockR, 0, Math.PI * 2);
    ctx.strokeStyle = curHolding ? 'rgba(0,229,255,0.6)' : 'rgba(0,229,255,0.15)';
    ctx.lineWidth = 3 * dpr; ctx.stroke();
    if (curHolding) {
      ctx.beginPath(); ctx.arc(cx, cy, clockR + 6 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,229,255,0.1)'; ctx.lineWidth = 2 * dpr; ctx.stroke();
    }

    // Target arc
    if (curTarget > 0 && (curPhase === 'puffing' || curPhase === 'reveal' || curPhase === 'target')) {
      const tAngle = -Math.PI / 2 + (curTarget / 6.0) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, clockR - 8 * dpr, -Math.PI / 2, tAngle);
      ctx.strokeStyle = 'rgba(255,217,61,0.5)'; ctx.lineWidth = 6 * dpr; ctx.lineCap = 'round'; ctx.stroke();
      const tx = cx + Math.cos(tAngle) * (clockR - 8 * dpr);
      const ty = cy + Math.sin(tAngle) * (clockR - 8 * dpr);
      ctx.beginPath(); ctx.arc(tx, ty, 4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD93D'; ctx.fill();
    }

    // Puff arc (read direct from DOM state via closure capture of canvas draw)
    const curPuffTime = parseFloat(canvas.dataset.puffTime || '0');
    if (curPuffTime > 0 && (curPhase === 'puffing' || curPhase === 'reveal')) {
      const pAngle = -Math.PI / 2 + (Math.min(curPuffTime, 6.0) / 6.0) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, clockR - 18 * dpr, -Math.PI / 2, pAngle);
      ctx.strokeStyle = 'rgba(0,229,255,0.7)'; ctx.lineWidth = 8 * dpr; ctx.lineCap = 'round'; ctx.stroke();
    }

    // Center text
    ctx.font = `900 ${32 * dpr}px "Courier New", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (curPhase === 'puffing' || curPhase === 'reveal') {
      ctx.fillStyle = curHolding ? '#00E5FF' : 'rgba(232,235,246,0.9)';
      ctx.fillText(curPuffTime.toFixed(2) + 's', cx, cy);
    } else if (curPhase === 'target') {
      ctx.fillStyle = curTarget === 4.20 ? '#FFD93D' : '#00E5FF';
      ctx.fillText(curTarget.toFixed(2) + 's', cx, cy);
      ctx.font = `700 ${11 * dpr}px sans-serif`;
      ctx.fillStyle = 'rgba(232,235,246,0.5)';
      ctx.fillText('TARGET', cx, cy - clockR - 14 * dpr);
    } else if (curPhase === 'intro') {
      ctx.fillStyle = '#00E5FF'; ctx.font = `900 ${28 * dpr}px sans-serif`;
      ctx.fillText('PUFF CLOCK', cx, cy);
      ctx.font = `600 ${11 * dpr}px sans-serif`; ctx.fillStyle = 'rgba(232,235,246,0.5)';
      ctx.fillText('5 rounds of precision', cx, cy + 24 * dpr);
    }

    // Error meter + leaderboard in reveal
    const curResults = resultsRef.current;
    if (curPhase === 'reveal' && curResults.length > 0) {
      const last = curResults[curResults.length - 1];
      const meterY = H * 0.58, meterW = W * 0.7, meterH = 12 * dpr, meterX = (W - meterW) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(meterX, meterY, meterW, meterH);
      ctx.fillStyle = 'rgba(52,211,153,0.5)'; ctx.fillRect(meterX + meterW / 2 - 1, meterY - 4 * dpr, 2, meterH + 8 * dpr);
      const errPct = Math.min(last.error / 2.0, 1.0);
      const errX = meterX + meterW / 2 + (last.actual > last.target ? 1 : -1) * errPct * meterW / 2;
      ctx.beginPath(); ctx.arc(errX, meterY + meterH / 2, 6 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = last.error <= 0.15 ? '#22C55E' : last.error <= 0.5 ? '#FFD93D' : '#EF4444';
      ctx.fill();
      ctx.font = `800 ${9 * dpr}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232,235,246,0.7)';
      ctx.fillText('±' + last.error.toFixed(2) + 's', W / 2, meterY + meterH + 14 * dpr);
    }

    // Ambient particles
    const t = Date.now() / 1000;
    for (let i = 0; i < 8; i++) {
      const px = W * ((i * 0.13 + t * 0.02) % 1);
      const py = H * ((i * 0.17 + t * 0.01 + i * 0.1) % 1);
      ctx.beginPath(); ctx.arc(px, py, 1.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,0.08)'; ctx.fill();
    }
  }, []); // eslint-disable-line

  // Canvas loop — restarts every render
  useEffect(() => {
    if (!canvasRef.current || !phase) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }); // eslint-disable-line

  // ── Scoring ──
  const showFinalResults = useCallback((finalResults) => {
    setPhase('result'); phaseRef.current = 'result';
    const totalError = finalResults.reduce((s, r) => s + r.error, 0);
    const avgError = finalResults.length > 0 ? totalError / finalResults.length : 0;
    const rank = avgError <= 0.50 ? 1 : 3;
    const won = rank <= 3;
    setComment(avgError <= 0.15 ? 'CHRONOMASTER! Your timing is INHUMAN!' :
      avgError <= 0.30 ? 'Impressive precision! Your internal clock is solid.' :
      avgError <= 0.60 ? 'Not bad! THC only slightly warped your time perception.' :
      'Your sense of time is... unique. Very unique.');
    addChat(`⏱️ Final avg error: ${avgError.toFixed(2)}s`);
    const baseCoins = won ? (rank === 1 ? 80 : 30) : 10;
    setCoins(c => c + baseCoins);
    awardGame('puffclock', won ? 'win' : 'lose');
    if (won) { triggerFlash('goal'); playFx('win'); }
    else { playFx('lose'); }
  }, [addChat, awardGame, setCoins, triggerFlash, playFx]);

  const startRound = useCallback((roundNum) => {
    if (roundNum >= 5) { showFinalResults(resultsRef.current); return; }
    let tgt = PC_TARGETS[roundNum];
    if (tgt === 0) tgt = +(1.0 + Math.random() * 3.5).toFixed(2);
    setTarget(tgt); targetRef.current = tgt;
    setRound(roundNum + 1); roundRef.current = roundNum;
    setPuffTime(0); setHolding(false); holdingRef.current = false;
    inputModeRef.current = 'none';
    setComment(PC_ROUND_NAMES[roundNum]);
    setPhase('target'); phaseRef.current = 'target';
    addChat(`⏱️ Target: ${tgt.toFixed(2)}s!`);
    setTimeout(() => {
      setPhase('puffing'); phaseRef.current = 'puffing';
      setComment('PUFF NOW! Hold for ' + tgt.toFixed(2) + 's!');
    }, 3000);
  }, [addChat, showFinalResults]);

  // ── Puff handlers ──
  const startPuff = useCallback(() => {
    if (holdingRef.current || phaseRef.current !== 'puffing') return;
    setHolding(true); holdingRef.current = true;
    puffStartRef.current = Date.now();
    blinkerStartRef.current = Date.now();
    setPuffTime(0);
    if (puffIntervalRef.current) clearInterval(puffIntervalRef.current);
    puffIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - puffStartRef.current) / 1000;
      setPuffTime(elapsed);
      if (canvasRef.current) canvasRef.current.dataset.puffTime = elapsed.toFixed(2);
      if (elapsed >= 6.0) stopPuff();
    }, 50);
  }, []); // eslint-disable-line

  const stopPuff = useCallback(() => {
    if (!holdingRef.current) return;
    setHolding(false); holdingRef.current = false;
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null; }
    const elapsed = +((Date.now() - puffStartRef.current) / 1000).toFixed(2);
    const clamped = Math.min(elapsed, 6.0);
    setPuffTime(clamped);
    if (canvasRef.current) canvasRef.current.dataset.puffTime = clamped.toFixed(2);

    const holdDur = (Date.now() - blinkerStartRef.current) / 1000;
    const isBlinker = holdDur >= 5.0;
    const isPuff = holdDur >= 0.3;
    inputModeRef.current = isBlinker ? 'blinker' : isPuff ? 'puff' : 'tap';

    const curTarget = targetRef.current;
    let error = +Math.abs(clamped - curTarget).toFixed(2);
    if (isPuff && !isBlinker) error = +(error * 0.85).toFixed(2);
    if (isBlinker && curTarget > 4.0) { error = 0; setPuffTime(curTarget); if (canvasRef.current) canvasRef.current.dataset.puffTime = curTarget.toFixed(2); }

    const roundResult = { round: roundRef.current, target: curTarget, actual: isBlinker && curTarget > 4.0 ? curTarget : clamped, error, input: inputModeRef.current };

    // Bot results
    PC_BOT_NAMES.forEach((_, bi) => {
      const botErr = +(PC_BOT_SKILL[bi] * (0.3 + Math.random() * 1.4)).toFixed(2);
      botResultsRef.current[bi] = [...(botResultsRef.current[bi] || []), botErr];
    });

    let isPerfect = false;
    if (curTarget === 4.20 && error <= 0.15) {
      isPerfect = true; setPerfect420(true);
      setCoins(c => c + 420);
      triggerFlash('goal'); playFx('crowd');
      addChat('⏱️ PERFECT 4.20! +420 coins! 🌿');
    }

    const newResults = [...resultsRef.current, roundResult];
    setResults(newResults); resultsRef.current = newResults;
    setPhase('reveal'); phaseRef.current = 'reveal';

    const errorComment = error === 0 ? 'AUTO-PERFECT! Blinker magic!' :
      error <= 0.10 ? 'PERFECT! Are you a robot?!' :
      error <= 0.30 ? 'Not bad! Your internal clock is pretty solid.' :
      error <= 0.50 ? `Decent! ${PC_COMEDY[Math.floor(Math.random() * PC_COMEDY.length)]}` :
      error <= 1.0 ? `Off by ${error.toFixed(2)}s... ${PC_COMEDY[Math.floor(Math.random() * PC_COMEDY.length)]}` :
      `You puffed ${clamped.toFixed(2)}s... target was ${curTarget.toFixed(2)}s. Are you even trying?!`;
    setComment(isPerfect ? '4.20 PERFECTION! LEGENDARY!' : errorComment);

    // Update leaderboard
    const youTotal = newResults.reduce((s, r) => s + r.error, 0);
    const entries = PC_BOT_NAMES.map((n, i) => ({
      name: n, totalError: +(botResultsRef.current[i] || []).reduce((s, e) => s + e, 0).toFixed(2),
    }));
    entries.push({ name: 'You', totalError: +youTotal.toFixed(2) });
    entries.sort((a, b) => a.totalError - b.totalError);
    entries.forEach((p, i) => { p.rank = i + 1; });
    setLeaderboard(entries);

    addChat(`⏱️ ${error.toFixed(2)}s off (${inputModeRef.current})`);
    const coinAmt = error <= 0.10 ? 100 : error <= 0.25 ? 50 : error <= 0.50 ? 25 : error <= 1.0 ? 10 : 5;
    if (!isPerfect) setCoins(c => c + coinAmt);

    setTimeout(() => startRound(roundRef.current), 3500);
  }, [playFx, triggerFlash, addChat, setCoins, startRound]); // eslint-disable-line

  // ── BLE ──
  useEffect(() => {
    setBLEHandlers(0, () => startPuff(), () => stopPuff());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  // ── Start game ──
  const startGame = useCallback(() => {
    cleanup();
    setRound(0); roundRef.current = 0;
    setResults([]); resultsRef.current = [];
    setPuffTime(0); setHolding(false); holdingRef.current = false;
    setPerfect420(false);
    botResultsRef.current = PC_BOT_NAMES.map(() => []);
    inputModeRef.current = 'none';
    const lb = PC_BOT_NAMES.map((n, i) => ({ name: n, totalError: 0, rank: i + 1 }));
    lb.push({ name: 'You', totalError: 0, rank: 4 });
    setLeaderboard(lb);
    setPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('⏱️ Welcome to Puff Clock! Precision is everything!');
    setTimeout(() => {
      setComment('Puff for EXACTLY the target time!');
      setTimeout(() => {
        setComment('Closest to the target wins!');
        setTimeout(() => startRound(0), 1500);
      }, 1500);
    }, 500);
  }, [cleanup, playFx, addChat, startRound]);

  useEffect(() => {
    startGame();
    return cleanup;
  }, []); // eslint-disable-line

  const phaseLabel = phase === 'intro' ? 'Get ready...' : phase === 'target' ? 'Watch the target!' :
    phase === 'puffing' ? (holding ? 'PUFFING...' : 'PUFF NOW!') :
    phase === 'reveal' ? comment : phase === 'result' ? 'Game Over' : '...';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none', animation: screenShake ? 'shake 0.4s ease' : 'none' }}>
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: 'rgba(0,255,100,0.25)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      {/* Header */}
      <GameHeader
        backTo={() => { cleanup(); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={C.cyan}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.cyan }}>⏱️ PUFF CLOCK</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {round}/5</span>
            {perfect420 && <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>4.20! 🌿</span>}
          </div>
        }
        row3={
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: phase === 'puffing' ? (holding ? C.cyan : C.gold) : phase === 'result' ? C.green : C.text3 }}>{phaseLabel}</span>
          </div>
        }
      />

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * PC_DPR)} height={Math.round(600 * PC_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, padding: '8px 12px', background: 'rgba(6,16,30,0.85)', backdropFilter: 'blur(8px)' }}>
          {phase === 'puffing' && (
            <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360, margin: '0 auto' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); if (!holding) { startPuff(); setTimeout(() => stopPuff(), 80); } }}
                style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'rgba(0,229,255,0.08)', border: '2px solid rgba(0,229,255,0.2)', userSelect: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>TAP</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Start/Stop</div>
              </div>
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); startPuff(); }}
                onMouseUp={(e) => { e.stopPropagation(); stopPuff(); }}
                onTouchStart={(e) => { e.stopPropagation(); startPuff(); }}
                onTouchEnd={(e) => { e.stopPropagation(); stopPuff(); }}
                style={{ touchAction: 'none', flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: holding ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)', border: `2px solid ${holding ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.15)'}`, userSelect: 'none', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>{holding ? '💨 PUFFING' : 'PUFF'}</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +15%</div>
              </div>
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); startPuff(); }}
                onMouseUp={(e) => { e.stopPropagation(); stopPuff(); }}
                onTouchStart={(e) => { e.stopPropagation(); startPuff(); }}
                onTouchEnd={(e) => { e.stopPropagation(); stopPuff(); }}
                style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'rgba(255,50,50,0.1)', border: '2px solid rgba(255,50,50,0.25)', animation: 'countPulse 1.5s infinite', userSelect: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>5s+ auto</div>
              </div>
            </div>
          )}

          {phase === 'reveal' && leaderboard.length > 0 && (
            <div style={{ width: '90%', maxWidth: 360, margin: '0 auto' }}>
              {leaderboard.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderRadius: 6, background: p.name === 'You' ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)', marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: p.name === 'You' ? C.cyan : C.text3 }}>#{p.rank} {p.name}</span>
                  <span style={{ fontSize: 9, color: C.text3 }}>±{p.totalError.toFixed(2)}s</span>
                </div>
              ))}
            </div>
          )}

          {phase === 'result' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
