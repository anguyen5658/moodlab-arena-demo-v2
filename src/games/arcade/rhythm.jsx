import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const RP_LANES = ['🎸', '🥁', '🎹', '🎷'];
const RP_LANE_COLORS = [C.red, '#00E5FF', C.gold, C.purple];
const RP_HIT_ZONE = 82;
const RP_COMBO_TIERS = [{ min: 50, mult: 10 }, { min: 20, mult: 5 }, { min: 10, mult: 3 }, { min: 5, mult: 2 }, { min: 0, mult: 1 }];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rpGetMultiplier = (combo) => { for (const t of RP_COMBO_TIERS) { if (combo >= t.min) return t.mult; } return 1; };

const RP_COMEDY = {
  perfect: ['PERFECT! Your timing is suspiciously good... 🤔💨', 'NAILED IT! Are you even high right now? 🎯', 'FLAWLESS! The puff gods smile upon you 🙏💨'],
  good: ['GOOD! Almost perfect, almost sober 😏', 'Nice one! The beat approves 🎵', 'Solid hit! Keep vibing 🌊'],
  ok: ["OK! Close enough... like your aim after a blinker 😵‍💫", "Ehhh, we'll count it 🤷", 'OK! The rhythm felt that 😬'],
  miss: ["Miss! Your finger went on vacation 🏖️", 'MISS! Was that a cough or a puff? 🫁', 'The beat is crying right now 💀', "Miss! Maybe try a different strain 🌿"],
  combo5: ['COMBO x5! Warming up! 🔥', '5 streak! The stage lights notice you ✨'],
  combo10: ["COMBO x10! You're in the ZONE (the puff zone) 🌊", 'x10! The crowd is going WILD 🤯'],
  combo20: ['COMBO x20! LEGENDARY rhythm! 👑💨', 'x20! Are you a metronome? 🎶🔥'],
  combo50: ['COMBO x50! INHUMAN! This is FOCUS 🧠💨', 'x50! WHAT ARE YOU?! 🫨🔥🔥🔥'],
  blinker: ['BLINKER HIT! Caught ALL the notes! 🫁🎵', 'BLINKER ACTIVATED! Screen clear! 💨💨💨'],
  puff: ['PUFF COMBO! Multiple notes in one breath! 🫁', 'Big puff energy! Caught them all! 💨🎵'],
  gameover: ["Game over! 15 misses... maybe try a different strain 🌿", "The concert's over! Your rhythm needs rehab 🏥🎵"],
  win: ['ENCORE! ENCORE! What a performance! 🎤🔥', 'Standing ovation! The crowd wants MORE! 👏💨', 'YOU CRUSHED IT! Puff game STRONG! 🫁🏆'],
};

export default function RhythmPuff() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const [phase, setPhase] = useState(null); // null|"intro"|"playing"|"result"
  const [notes, setNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [blinker, setBlinker] = useState(false);
  const [rating, setRating] = useState(null); // {text, color, lane, id}
  const [particles, setParticles] = useState([]);
  const [comment, setComment] = useState('');
  const [beat, setBeat] = useState(0);
  const [crowdJump, setCrowdJump] = useState(false);
  const [introStep, setIntroStep] = useState(0);

  const phaseRef = useRef(phase);
  const comboRef = useRef(0);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const intervalRef = useRef(null);
  const blinkerTimerRef = useRef(null);
  const blinkerIntervalRef = useRef(null);
  const guardRef = useRef(null);

  const addChat = useCallback((name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: `${name}: ${msg}`, ts: Date.now(), color }]);
  }, [setGameChatMsgs]);

  const spawnParticles = useCallback((lane, color, count = 8) => {
    const px = 12.5 + lane * 25;
    const parts = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + Math.random() + i, x: px + (Math.random() - 0.5) * 10, y: RP_HIT_ZONE + (Math.random() - 0.5) * 5,
      vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 4, color, size: 3 + Math.random() * 4, life: 1,
    }));
    setParticles(p => [...p, ...parts]);
    setTimeout(() => setParticles(p => p.filter(pp => pp.id < Date.now() - 600)), 700);
  }, []);

  const showRating = useCallback((text, color, lane) => {
    setRating({ text, color, lane, id: Date.now() });
    setTimeout(() => setRating(null), 600);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const dpr = DPR;
    const t = Date.now() * 0.001;
    ctx.clearRect(0, 0, W, H);

    // Background
    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, '#0a0a28'); skyG.addColorStop(0.3, '#150030');
    skyG.addColorStop(0.6, '#0d0a2e'); skyG.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

    // Spotlights
    const laneColors = ['#FF4444', '#00E5FF', '#FFD93D', '#C084FC'];
    for (let i = 0; i < 4; i++) {
      const cx = W * (0.125 + i * 0.25);
      const glow = ctx.createRadialGradient(cx, 0, 0, cx, H * 0.6, W * 0.15);
      glow.addColorStop(0, laneColors[i] + '18'); glow.addColorStop(0.5, laneColors[i] + '08'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.moveTo(cx - 4 * dpr, 0); ctx.lineTo(cx - W * 0.12, H * 0.7); ctx.lineTo(cx + W * 0.12, H * 0.7); ctx.lineTo(cx + 4 * dpr, 0); ctx.fill();
    }

    // Roving spotlight
    const rovX = W * (0.3 + Math.sin(t * 0.5) * 0.25);
    const rovG = ctx.createRadialGradient(rovX, 0, 0, rovX, H * 0.5, W * 0.1);
    rovG.addColorStop(0, 'rgba(255,50,140,0.08)'); rovG.addColorStop(1, 'transparent');
    ctx.fillStyle = rovG; ctx.fillRect(0, 0, W, H * 0.7);

    // Lane tints + dividers
    for (let i = 0; i < 4; i++) {
      const lx = W * (i * 0.25);
      const laneG = ctx.createLinearGradient(0, 0, 0, H);
      laneG.addColorStop(0, laneColors[i] + '03'); laneG.addColorStop(0.8, laneColors[i] + '0A'); laneG.addColorStop(1, laneColors[i] + '15');
      ctx.fillStyle = laneG; ctx.fillRect(lx, 0, W * 0.25, H);
      if (i > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1 * dpr; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke(); }
      const guideCx = lx + W * 0.125;
      const guideG = ctx.createLinearGradient(0, 0, 0, H);
      guideG.addColorStop(0, 'transparent'); guideG.addColorStop(0.5, laneColors[i] + '10'); guideG.addColorStop(1, laneColors[i] + '20');
      ctx.strokeStyle = guideG; ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.moveTo(guideCx, 0); ctx.lineTo(guideCx, H); ctx.stroke();
    }

    // Hit zone
    const hitY = H * (RP_HIT_ZONE / 100);
    const beatPulse = Math.sin(t * 8) * 0.3 + 0.7;
    for (let i = 0; i < 4; i++) {
      const lx = W * (i * 0.25);
      const hzG = ctx.createLinearGradient(0, hitY - 6 * dpr, 0, hitY + 6 * dpr);
      hzG.addColorStop(0, 'transparent'); hzG.addColorStop(0.5, laneColors[i] + (beatPulse > 0.8 ? '50' : '25')); hzG.addColorStop(1, 'transparent');
      ctx.fillStyle = hzG; ctx.fillRect(lx, hitY - 6 * dpr, W * 0.25, 12 * dpr);
      ctx.save(); ctx.translate(lx + W * 0.125, hitY); ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = laneColors[i] + '60'; ctx.lineWidth = 2 * dpr;
      const ds = 5 * dpr; ctx.strokeRect(-ds, -ds, ds * 2, ds * 2); ctx.restore();
    }
    ctx.fillStyle = `rgba(255,255,255,${0.02 * beatPulse})`; ctx.fillRect(0, hitY - 4 * dpr, W, 8 * dpr);

    // Ambient particles
    for (let i = 0; i < 15; i++) {
      const px = ((i * 67 + t * 15) % W);
      const py = ((i * 43 + t * 8) % H);
      ctx.fillStyle = laneColors[i % 4] + '12';
      ctx.beginPath(); ctx.arc(px, py, 1.5 * dpr, 0, Math.PI * 2); ctx.fill();
    }

    // Crowd silhouettes
    const crowdBaseY = H * 0.92;
    for (let i = 0; i < 24; i++) {
      const cx = (i / 24) * W + Math.sin(i * 2.3) * 3 * dpr;
      const waveOff = Math.sin(t * 3 + i * 0.7) * 3 * dpr;
      const headR = 4 * dpr;
      ctx.fillStyle = 'rgba(20,10,35,0.85)';
      ctx.beginPath(); ctx.arc(cx, crowdBaseY - waveOff, headR, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx - headR * 0.6, crowdBaseY - waveOff + headR, headR * 1.2, 10 * dpr);
    }

    // Stage edge
    const edgeG = ctx.createLinearGradient(0, H - 20 * dpr, 0, H);
    edgeG.addColorStop(0, 'transparent'); edgeG.addColorStop(1, 'rgba(160,50,220,0.1)');
    ctx.fillStyle = edgeG; ctx.fillRect(0, H - 20 * dpr, W, 20 * dpr);
  }, [DPR]); // eslint-disable-line

  // Canvas loop (Rule 4)
  useEffect(() => {
    if (!canvasRef.current || !phase) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
  });

  const cleanup = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (blinkerTimerRef.current) { clearTimeout(blinkerTimerRef.current); blinkerTimerRef.current = null; }
    if (blinkerIntervalRef.current) { clearInterval(blinkerIntervalRef.current); blinkerIntervalRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (guardRef.current) { guardRef.current.v = false; }
  }, []);

  const hitNote = useCallback((lane) => {
    setNotes(notes => {
      const candidates = notes.map((n, i) => ({ ...n, idx: i })).filter(n => n.lane === lane && !n.hit);
      const inZone = candidates.filter(n => n.y > RP_HIT_ZONE - 18 && n.y < RP_HIT_ZONE + 12);
      if (inZone.length === 0) {
        setCombo(0); setMisses(m => m + 1); setComment('Wrong lane! 😬'); playFx('rhythm_miss');
        showRating('MISS', C.red, lane); return notes;
      }
      const closest = inZone.reduce((a, b) => Math.abs(a.y - RP_HIT_ZONE) < Math.abs(b.y - RP_HIT_ZONE) ? a : b);
      const dist = Math.abs(closest.y - RP_HIT_ZONE);
      const newN = [...notes]; newN[closest.idx] = { ...newN[closest.idx], hit: true };
      let ratingText, pts, ratingColor;
      if (dist <= 8) { ratingText = 'PERFECT'; pts = 100; ratingColor = C.gold; spawnParticles(lane, RP_LANE_COLORS[lane], 12); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 300); }
      else if (dist <= 14) { ratingText = 'GOOD'; pts = 75; ratingColor = C.green; spawnParticles(lane, RP_LANE_COLORS[lane], 6); }
      else if (dist <= 22) { ratingText = 'OK'; pts = 50; ratingColor = C.orange; }
      else { ratingText = 'MISS'; pts = 0; ratingColor = C.red; }
      if (ratingText === 'MISS') {
        setCombo(0); setMisses(m => m + 1); setComment(pick(RP_COMEDY.miss)); playFx('rhythm_miss');
      } else {
        const mult = rpGetMultiplier(comboRef.current);
        setScore(s => s + pts * mult);
        setCombo(c => {
          const nc = c + 1; setMaxCombo(m => Math.max(m, nc));
          if (nc === 50) setComment(pick(RP_COMEDY.combo50));
          else if (nc === 20) setComment(pick(RP_COMEDY.combo20));
          else if (nc === 10) { setComment(pick(RP_COMEDY.combo10)); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 500); }
          else if (nc === 5) setComment(pick(RP_COMEDY.combo5));
          else if (ratingText === 'PERFECT') setComment(pick(RP_COMEDY.perfect));
          else if (ratingText === 'GOOD') setComment(pick(RP_COMEDY.good));
          else setComment(pick(RP_COMEDY.ok));
          return nc;
        });
        if (ratingText === 'PERFECT') { playFx('rhythm_perfect'); triggerFlash('save'); }
        else playFx('rhythm_hit');
      }
      showRating(ratingText, ratingColor, lane);
      return newN;
    });
  }, [playFx, triggerFlash, spawnParticles, showRating]);

  const puffHit = useCallback(() => {
    setNotes(notes => {
      const inZone = notes.filter(n => !n.hit && n.y > RP_HIT_ZONE - 15 && n.y < RP_HIT_ZONE + 10);
      if (inZone.length === 0) return notes;
      const newN = [...notes];
      inZone.forEach(n => {
        const idx = newN.findIndex(nn => nn.id === n.id);
        if (idx >= 0) newN[idx] = { ...newN[idx], hit: true };
        spawnParticles(n.lane, RP_LANE_COLORS[n.lane], 8);
      });
      const mult = rpGetMultiplier(comboRef.current);
      setScore(s => s + inZone.length * 75 * mult);
      setCombo(c => { const nc = c + inZone.length; setMaxCombo(m => Math.max(m, nc)); return nc; });
      setComment(inZone.length > 3 ? pick(RP_COMEDY.blinker) : pick(RP_COMEDY.puff));
      playFx('kick'); triggerFlash('save'); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 400);
      showRating('PUFF x' + inZone.length, C.cyan, 1);
      return newN;
    });
  }, [playFx, triggerFlash, spawnParticles, showRating]);

  const blinkerPuff = useCallback(() => {
    if (blinker) return;
    setBlinker(true);
    setComment(pick(RP_COMEDY.blinker)); triggerFlash('blinker'); playFx('win');
    setNotes(notes => {
      const unhit = notes.filter(n => !n.hit);
      if (unhit.length === 0) return notes;
      unhit.forEach(n => spawnParticles(n.lane, RP_LANE_COLORS[n.lane], 6));
      const mult = rpGetMultiplier(comboRef.current);
      setScore(s => s + unhit.length * 100 * mult);
      setCombo(c => { const nc = c + unhit.length; setMaxCombo(m => Math.max(m, nc)); return nc; });
      showRating('BLINKER! x' + unhit.length, C.pink, 2);
      return notes.map(n => n.hit ? n : { ...n, hit: true });
    });
    blinkerIntervalRef.current = setInterval(() => {
      setNotes(notes => {
        const unhit = notes.filter(n => !n.hit);
        if (unhit.length > 0) {
          unhit.forEach(n => spawnParticles(n.lane, RP_LANE_COLORS[n.lane], 4));
          setScore(s => s + unhit.length * 50); setCombo(c => c + unhit.length);
        }
        return notes.map(n => ({ ...n, hit: true }));
      });
    }, 200);
    blinkerTimerRef.current = setTimeout(() => { clearInterval(blinkerIntervalRef.current); setBlinker(false); }, 2000);
    spawnConfetti(25); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 2000);
  }, [blinker, triggerFlash, playFx, spawnParticles, showRating, spawnConfetti]);

  const startGame = useCallback(() => {
    cleanup();
    const guard = { v: true }; guardRef.current = guard;
    setNotes([]); setScore(0); setCombo(0); setMaxCombo(0); setMisses(0);
    setComment(''); setRating(null); setParticles([]); setBlinker(false);
    setBeat(0); setCrowdJump(false); setIntroStep(0); setPhase('intro');
    comboRef.current = 0;
    playFx('crowd');
    setTimeout(() => { if (!guard.v) return; setIntroStep(1); }, 400);
    setTimeout(() => { if (!guard.v) return; setIntroStep(2); }, 1200);
    setTimeout(() => { if (!guard.v) return; setIntroStep(3); }, 2200);
    setTimeout(() => { if (!guard.v) return; setIntroStep(4); playFx('whistle'); }, 3000);
    setTimeout(() => {
      if (!guard.v) return;
      setPhase('playing'); phaseRef.current = 'playing'; setIntroStep(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      let beatCount = 0; let currentSpeed = 3;
      intervalRef.current = setInterval(() => {
        if (!guard.v) return;
        beatCount++;
        if (beatCount % 500 === 0 && currentSpeed < 6) currentSpeed += 0.25;
        setBeat(b => b + 1);
        setNotes(notes => {
          let nn = [...notes.map(n => ({ ...n, y: n.y + currentSpeed })).filter(n => {
            if (n.y > 95 && !n.hit) {
              setMisses(m => {
                const newM = m + 1;
                if (newM >= 15) {
                  clearInterval(intervalRef.current);
                  setPhase('result'); phaseRef.current = 'result';
                  playFx('lose'); setComment(pick(RP_COMEDY.gameover));
                }
                return newM;
              });
              setCombo(0); comboRef.current = 0; setComment(pick(RP_COMEDY.miss)); playFx('error'); triggerShake();
              return false;
            }
            return n.y < 110;
          })];
          const spawnRate = beatCount < 300 ? 10 : beatCount < 600 ? 8 : 6;
          if (beatCount % spawnRate === 0) {
            const lane = Math.floor(Math.random() * 4);
            nn.push({ id: Date.now() + Math.random(), lane, y: -5, hit: false, spawned: Date.now() });
          }
          if (beatCount > 200 && beatCount % 20 === 0 && Math.random() > 0.5) {
            const lane2 = Math.floor(Math.random() * 4);
            nn.push({ id: Date.now() + Math.random() + 0.5, lane: lane2, y: -5, hit: false, spawned: Date.now() });
          }
          return nn;
        });
      }, 60);
    }, 4000);
  }, [cleanup, playFx, triggerShake]);

  // BLE: slot 0 → puff hit on down, null on up
  useEffect(() => {
    setBLEHandlers(0, () => puffHit(), null);
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => cleanup();
  }, []); // eslint-disable-line

  const isPlaying = phase === 'playing';
  const isIntro = phase === 'intro';
  const mult = rpGetMultiplier(combo);
  const beatPulse = beat % 8 < 4;
  const comboFire = combo >= 20 ? '🔥🔥🔥' : combo >= 10 ? '🔥🔥' : combo >= 5 ? '🔥' : '';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}
      {blinker && <div style={{ position: 'absolute', inset: 0, zIndex: 195, pointerEvents: 'none', background: 'radial-gradient(circle,rgba(255,0,200,0.15),rgba(200,50,255,0.08))', animation: 'pulse 0.5s infinite' }} />}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: `1px solid ${blinker ? 'rgba(255,50,200,0.2)' : 'rgba(160,50,220,0.15)'}` }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>Powered by <span style={{ letterSpacing: 2 }}>MOOD LAB</span></span>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div data-back="true" onClick={() => { cleanup(); navigate('/arcade'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: blinker ? C.pink : C.purple }}>🎵 RHYTHM PUFF</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{score.toLocaleString()}pts</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: combo >= 10 ? C.orange : combo >= 5 ? C.gold : C.text, animation: combo >= 10 ? 'countPulse 0.5s infinite' : 'none' }}>
            {isPlaying ? `${combo}x Combo ${comboFire}` : isIntro ? 'Get Ready...' : 'Game Over'}
          </span>
          {mult > 1 && <span style={{ fontSize: 8, fontWeight: 900, color: C.cyan, animation: 'countPulse 0.5s infinite' }}>x{mult} MULT</span>}
          {isPlaying && <span style={{ fontSize: 9, fontWeight: 700, color: misses >= 12 ? C.red : misses >= 8 ? C.orange : C.text3 }}>{misses}/15 miss</span>}
          {blinker && <span style={{ fontSize: 8, fontWeight: 900, color: C.pink, animation: 'countPulse 0.3s infinite' }}>FEVER</span>}
        </div>
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * DPR)} height={Math.round(600 * DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Note overlays */}
        {(isPlaying || phase === 'result') && (
          <>
            {/* Hit zone glow */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: `${RP_HIT_ZONE - 2}%`, height: '4%', zIndex: 8, display: 'flex' }}>
              {RP_LANES.map((_, li) => (
                <div key={li} style={{ flex: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,transparent,${RP_LANE_COLORS[li]}${beatPulse ? '40' : '20'},transparent)`, boxShadow: `0 0 ${beatPulse ? 15 : 8}px ${RP_LANE_COLORS[li]}30`, transition: 'all 0.15s ease' }} />
                  <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(45deg)', width: 10, height: 10, border: `2px solid ${RP_LANE_COLORS[li]}60`, borderRadius: 2 }} />
                </div>
              ))}
            </div>

            {/* Falling notes */}
            {notes.filter(n => !n.hit).map(n => {
              const nc = RP_LANE_COLORS[n.lane];
              const nearHit = n.y > RP_HIT_ZONE - 15;
              return (
                <div key={n.id} style={{ position: 'absolute', left: `${n.lane * 25 + 7}%`, top: `${n.y}%`, width: '11%', height: 14, borderRadius: 7, zIndex: 6, background: `linear-gradient(135deg,${nc},${nc}CC)`, boxShadow: `0 0 ${nearHit ? 16 : 8}px ${nc}${nearHit ? '80' : '40'},0 2px 8px rgba(0,0,0,0.3)`, transition: 'top 0.06s linear', transform: nearHit ? 'scale(1.1)' : 'scale(1)' }}>
                  <div style={{ position: 'absolute', left: '20%', right: '20%', bottom: '100%', height: n.y > 10 ? 20 : 0, background: `linear-gradient(to top,${nc}30,transparent)`, borderRadius: '4px 4px 0 0' }} />
                  <div style={{ position: 'absolute', inset: 2, borderRadius: 5, background: 'radial-gradient(circle,rgba(255,255,255,0.4),transparent)' }} />
                </div>
              );
            })}

            {/* Hit effects */}
            {notes.filter(n => n.hit && n.y < 95).map(n => (
              <div key={n.id + 'h'} style={{ position: 'absolute', left: `${n.lane * 25 + 4}%`, top: `${n.y - 2}%`, width: '17%', height: 18, borderRadius: 9, background: `radial-gradient(circle,${RP_LANE_COLORS[n.lane]}60,transparent)`, animation: 'flashOverlay 0.3s ease forwards', zIndex: 5 }} />
            ))}

            {/* Burst particles */}
            {particles.map(p => (
              <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}`, zIndex: 12, pointerEvents: 'none', animation: 'rpParticleBurst 0.6s ease-out forwards' }} />
            ))}

            {/* Rating popup */}
            {rating && (
              <div style={{ position: 'absolute', left: `${(rating.lane || 0) * 25 + 12.5}%`, top: `${RP_HIT_ZONE - 12}%`, transform: 'translateX(-50%)', zIndex: 15, animation: 'scaleIn 0.6s ease forwards', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: rating.color, letterSpacing: 2, textShadow: `0 0 10px ${rating.color},0 0 20px ${rating.color}60` }}>{rating.text}</div>
              </div>
            )}

            {/* Lane labels */}
            {RP_LANES.map((lane, li) => (
              <div key={'ll' + li} style={{ position: 'absolute', left: `${li * 25}%`, bottom: 2, width: '25%', textAlign: 'center', fontSize: 14, opacity: 0.4, zIndex: 7 }}>{lane}</div>
            ))}

            {/* Miss dots */}
            <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', gap: 2, zIndex: 20 }}>
              {[...Array(15)].map((_, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i < misses ? C.red : `${C.text3}30`, boxShadow: i < misses ? `0 0 4px ${C.red}` : '' }} />
              ))}
            </div>

            {/* Combo bar */}
            {combo >= 5 && (
              <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: Math.min(200, combo * 4), height: 3, borderRadius: 2, zIndex: 6, background: `linear-gradient(90deg,transparent,${combo >= 20 ? C.orange : C.gold},transparent)`, boxShadow: `0 0 ${combo >= 20 ? 20 : 10}px ${combo >= 20 ? C.orange : C.gold}60`, animation: 'pulse 0.5s infinite' }} />
            )}
          </>
        )}

        {/* Intro overlay */}
        {isIntro && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
            {introStep >= 1 && (
              <div style={{ position: 'absolute', inset: 0 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ position: 'absolute', top: 0, left: `${15 + i * 20}%`, width: 40, height: '100%', background: `linear-gradient(180deg,${RP_LANE_COLORS[i]}30,transparent 60%)`, transform: `rotate(${(i - 1.5) * 12}deg)`, transformOrigin: 'top center', animation: `fadeIn .5s ease ${i * 0.15}s both` }} />
                ))}
              </div>
            )}
            {introStep >= 2 && (
              <div style={{ animation: 'scaleIn 0.8s ease both', textAlign: 'center', zIndex: 55 }}>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: C.purple, textShadow: `0 0 20px ${C.purple},0 0 40px ${C.purple}80` }}>RHYTHM PUFF</div>
                <div style={{ fontSize: 14, color: C.pink, fontWeight: 700, marginTop: 4, letterSpacing: 2 }}>🎵 Guitar Hero x Puff Session 🎵</div>
              </div>
            )}
            {introStep >= 3 && (
              <div style={{ display: 'flex', gap: 16, marginTop: 24, animation: 'fadeIn 0.5s ease both' }}>
                {RP_LANES.map((lane, i) => (
                  <div key={i} style={{ fontSize: 28, animation: `fadeIn .3s ease ${i * 0.1}s both`, filter: `drop-shadow(0 0 8px ${RP_LANE_COLORS[i]})` }}>{lane}</div>
                ))}
              </div>
            )}
            {introStep >= 4 && (
              <div style={{ marginTop: 20, animation: 'scaleIn 0.6s ease both' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, letterSpacing: 4, textShadow: `0 0 20px ${C.gold}80` }}>3, 2, 1, DROP!</div>
              </div>
            )}
          </div>
        )}

        {/* Result overlay */}
        {phase === 'result' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{score > 500 ? '🏆' : '🎤'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: score > 500 ? C.gold : C.purple, animation: score > 500 ? 'countPulse 1s infinite' : 'none' }}>{score > 500 ? 'ENCORE!' : 'SHOW OVER'}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, textShadow: `0 0 20px ${C.gold}60`, marginTop: 8 }}>{score.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>points</div>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>PERFORMANCE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 18, fontWeight: 900, color: C.orange }}>{maxCombo}x</div><div style={{ fontSize: 8, color: C.text3 }}>MAX COMBO</div></div>
                <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 18, fontWeight: 900, color: C.red }}>{misses}</div><div style={{ fontSize: 8, color: C.text3 }}>MISSES</div></div>
                <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 18, fontWeight: 900, color: C.green }}>+{score > 500 ? 80 : 12}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div data-btn="true" style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 13, fontWeight: 800, color: C.purple }} onClick={() => startGame()}>Play Again</div>
              <div data-btn="true" style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }} onClick={() => { cleanup(); navigate('/arcade'); }}>Done</div>
            </div>
            <div data-btn="true" onClick={() => { cleanup(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8, width: '60%' }}>👤 My Progress</div>
          </div>
        )}

        {/* Controls slot */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '6px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {isPlaying && (
            <div style={{ display: 'flex', gap: 6, width: '90%', maxWidth: 360 }}>
              {RP_LANES.map((lane, li) => (
                <div key={li} data-btn="true"
                  onClick={(e) => { e.stopPropagation(); if (isPlaying) hitNote(li); }}
                  onTouchStart={(e) => { e.stopPropagation(); if (isPlaying) hitNote(li); }}
                  style={{ touchAction: 'none', flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${RP_LANE_COLORS[li]}15,${RP_LANE_COLORS[li]}08)`, border: `2px solid ${RP_LANE_COLORS[li]}35`, fontSize: 20, userSelect: 'none', WebkitUserSelect: 'none', boxShadow: `0 0 12px ${RP_LANE_COLORS[li]}15` }}>
                  {lane}
                </div>
              ))}
            </div>
          )}
          {isPlaying && (
            <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
              <div data-btn="true"
                onClick={(e) => { e.stopPropagation(); puffHit(); }}
                onTouchStart={(e) => { e.stopPropagation(); puffHit(); }}
                style={{ touchAction: 'none', flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}12,${C.cyan}06)`, border: `2px solid ${C.cyan}35`, fontSize: 13, fontWeight: 800, color: C.cyan, userSelect: 'none', WebkitUserSelect: 'none' }}>
                💨 PUFF
              </div>
              <div data-btn="true"
                onClick={(e) => { e.stopPropagation(); blinkerPuff(); }}
                onTouchStart={(e) => { e.stopPropagation(); blinkerPuff(); }}
                style={{ touchAction: 'none', flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: blinker ? `linear-gradient(135deg,${C.pink}25,${C.pink}15)` : `linear-gradient(135deg,${C.pink}12,${C.pink}06)`, border: `2px solid ${blinker ? C.pink : C.pink + '35'}`, fontSize: 13, fontWeight: 800, color: C.pink, opacity: blinker ? 0.5 : 1, animation: !blinker ? 'countPulse 1.5s infinite' : 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
                🫁 BLINKER
              </div>
            </div>
          )}
          {comment && isPlaying && (
            <div style={{ padding: '4px 14px', borderRadius: 10, maxWidth: 340, textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: combo >= 10 ? C.gold : combo >= 5 ? C.orange : C.text, lineHeight: 1.3 }}>{comment}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
