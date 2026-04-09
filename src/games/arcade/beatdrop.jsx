import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const BD_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const BD_SONGS = [
  { name: 'Neon Rise', buildTime: 5000, fakeAt: null, color: '#FF69B4', bpm: 128 },
  { name: 'Phantom Drop', buildTime: 7000, fakeAt: 3500, color: '#A855F7', bpm: 140 },
  { name: 'Bass Quake', buildTime: 4000, fakeAt: null, color: '#00E5FF', bpm: 150 },
  { name: 'Chaos Theory', buildTime: 6500, fakeAt: 4000, color: '#FF4D8D', bpm: 160 },
];
const BD_BOT_NAMES = ['DJ Haze', 'MC Vapor', 'BassBot', 'CloudDrop'];
const BD_BOT_EMOJIS = ['🎧', '🎵', '🔊', '☁️'];
const BD_BOT_COLORS = ['#A855F7', '#00E5FF', '#FB923C', '#34D399'];
const BD_BOT_ACCURACY = [180, 280, 120];
const BD_CHAT_BUILD = ['The bass is RISING', 'I can feel it coming', 'Hold hold hold...', 'Not yet... NOT YET', 'My hands are shaking', 'This build is INSANE', 'Wait for itttt', 'The tension is REAL'];
const BD_CHAT_DROP = ['DROP!!!', 'THAT WAS FILTHY', 'DID YOU FEEL THAT?!', 'THE BASS JUST HIT', 'EARTHQUAKE MODE', 'That drop was NASTY'];
const BD_CHAT_RESULT = ['Clean timing!', 'That was surgical', 'Millisecond precision', 'DJ reflexes on point', 'The crowd felt that one'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function BeatDrop() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers, screenShake, screenFlash,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [round, setRound] = useState(0);
  const [players, setPlayers] = useState([]);
  const [roundResults, setRoundResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [introStep, setIntroStep] = useState(0);
  const [holding, setHolding] = useState(false);
  const [charging, setCharging] = useState(false);
  const [puffIntensity, setPuffIntensity] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [fakeDropped, setFakeDropped] = useState(false);

  const phaseRef = useRef(phase);
  const roundRef = useRef(round);
  const playersRef = useRef(players);
  const holdingRef = useRef(holding);
  const holdStartRef = useRef(0);
  const dropTimeRef = useRef(0);
  const releasedRef = useRef(false);
  const guardRef = useRef(null);

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const buildIntervalRef = useRef(null);
  const dropTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const strobeRef = useRef(0);
  const particlesRef = useRef([]);
  const eqBarsRef = useRef(Array.from({ length: 32 }, () => Math.random() * 0.3));

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { holdingRef.current = holding; }, [holding]);

  const addChat = useCallback((name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: `${name}: ${msg}`, ts: Date.now(), color }]);
  }, [setGameChatMsgs]);

  // ── Audio ──
  const stopAudio = useCallback(() => {
    try {
      if (oscillatorRef.current) { oscillatorRef.current.stop(); oscillatorRef.current.disconnect(); oscillatorRef.current = null; }
      if (gainNodeRef.current) { gainNodeRef.current.disconnect(); gainNodeRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    } catch (e) {}
  }, []);

  const playBuildAudio = useCallback((duration) => {
    stopAudio();
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ac;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + duration / 1000);
      gain.gain.setValueAtTime(0.04, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + duration / 1000);
      osc.connect(gain); gain.connect(ac.destination); osc.start();
      oscillatorRef.current = osc; gainNodeRef.current = gain;
    } catch (e) {}
  }, [stopAudio]);

  const playDropSound = useCallback(() => {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator(); const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.6);
      gain.gain.setValueAtTime(0.2, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.7);
      osc.connect(gain); gain.connect(ac.destination); osc.start(); osc.stop(ac.currentTime + 0.7);
    } catch (e) {}
  }, []);

  // ── Canvas Draw ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const d = BD_DPR;
    const intensity = phaseRef.current === 'dropped' ? 1 : beatIntensity;
    const dropped = phaseRef.current === 'dropped';
    const building = phaseRef.current === 'building';

    // Background
    ctx.fillStyle = '#04081a';
    ctx.fillRect(0, 0, W, H);

    // Laser beams during building/dropped
    if (building || dropped) {
      const laserColors = ['#FF4D8D', '#A855F7', '#00E5FF', '#FFD700'];
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 4) + (Date.now() / 3000) * (i % 2 === 0 ? 1 : -1);
        const cx = W / 2, cy = H * 0.35;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(0, 0, W * 0.7, 0);
        grad.addColorStop(0, laserColors[i] + '60');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, -1 * d, W * 0.7, 2 * d);
        ctx.restore();
      }
    }

    // Strobe on drop
    if (dropped) {
      strobeRef.current += 1;
      if (strobeRef.current % 4 < 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, W, H);
      }
    }

    // DJ Booth platform
    const boothY = H * 0.62;
    const boothW = W * 0.6;
    const boothH = H * 0.08;
    const boothX = (W - boothW) / 2;
    const boothGrad = ctx.createLinearGradient(boothX, boothY, boothX + boothW, boothY);
    boothGrad.addColorStop(0, '#1a1a2e');
    boothGrad.addColorStop(0.5, '#2d2d44');
    boothGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = boothGrad;
    ctx.beginPath();
    ctx.roundRect(boothX, boothY, boothW, boothH, 8 * d);
    ctx.fill();

    // EQ Bars
    const bars = eqBarsRef.current;
    const barCount = 32;
    const barW = (W * 0.55) / barCount;
    const barMaxH = H * 0.15;
    const barBaseY = boothY;
    const barStartX = (W - W * 0.55) / 2;
    for (let i = 0; i < barCount; i++) {
      const target = (building || dropped) ? (0.3 + 0.7 * intensity * (0.5 + 0.5 * Math.sin(Date.now() / 200 + i))) : 0.1 + Math.random() * 0.1;
      bars[i] += (target - bars[i]) * 0.15;
      const bH = bars[i] * barMaxH;
      const hue = 270 + (i / barCount) * 120;
      ctx.fillStyle = dropped ? `hsl(${hue},100%,${50 + bars[i] * 30}%)` : `hsla(${hue},80%,55%,0.7)`;
      ctx.fillRect(barStartX + i * barW, barBaseY - bH, barW * 0.75, bH);
    }

    // Center orb
    const orbR = (building || dropped) ? (H * 0.06 + H * 0.04 * intensity * (0.8 + 0.2 * Math.sin(Date.now() / 300))) : H * 0.05;
    const orbX = W / 2, orbY = boothY - H * 0.12;
    const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR);
    const orbColor = dropped ? '#FFD700' : building ? `hsl(${280 + intensity * 80},100%,65%)` : '#6b21a8';
    orbGrad.addColorStop(0, orbColor + 'ff');
    orbGrad.addColorStop(0.5, orbColor + '80');
    orbGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fillStyle = orbGrad;
    ctx.fill();

    // Particles
    const parts = particlesRef.current;
    if ((building || dropped) && Math.random() < intensity * 0.4) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.3,
        y: boothY, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 3,
        life: 1, color: pick(['#FF4D8D', '#A855F7', '#00E5FF', '#FFD700']),
      });
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2 * d, 2 * d);
    }
    ctx.globalAlpha = 1;

    // Player avatars bottom row
    const pList = playersRef.current;
    if (pList.length === 4) {
      const avatarY = H * 0.8;
      const spacing = W / 5;
      pList.forEach((p, i) => {
        const ax = spacing + i * spacing;
        ctx.font = `${18 * d}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, ax, avatarY);
        ctx.font = `bold ${7 * d}px sans-serif`;
        ctx.fillStyle = p.isYou ? C.pink : p.color;
        ctx.fillText(p.isYou ? 'YOU' : p.name, ax, avatarY + 14 * d);
        ctx.fillStyle = C.gold;
        ctx.font = `bold ${8 * d}px monospace`;
        ctx.fillText(p.totalPts + 'pt', ax, avatarY + 24 * d);
      });
    }

    // Hold bar
    if (holdingRef.current && holdStartRef.current > 0) {
      const holdSec = (Date.now() - holdStartRef.current) / 1000;
      const barPct = Math.min(holdSec / 6, 1);
      const hbW = W * 0.7, hbH = 6 * d, hbX = (W - hbW) / 2, hbY = H * 0.93;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.roundRect(hbX, hbY, hbW, hbH, 3 * d); ctx.fill();
      const hColor = holdSec >= 5 ? C.red : holdSec >= 2 ? C.purple : C.pink;
      ctx.fillStyle = hColor;
      ctx.beginPath(); ctx.roundRect(hbX, hbY, hbW * barPct, hbH, 3 * d); ctx.fill();
    }

    // BUILD text
    if (building && intensity > 0.6) {
      ctx.font = `bold ${Math.round(intensity * 28 * d)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,77,141,${intensity * 0.8})`;
      ctx.fillText('BUILDING...', W / 2, H * 0.28);
    }

    // FAKE DROP
    if (fakeDropped) {
      ctx.font = `bold ${22 * d}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = C.purple;
      ctx.fillText('PSYCH!', W / 2, H * 0.45);
    }

    // DROP text
    if (dropped) {
      ctx.font = `bold ${36 * d}px sans-serif`;
      ctx.textAlign = 'center';
      const glow = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.5);
      glow.addColorStop(0, C.gold);
      glow.addColorStop(1, C.pink);
      ctx.fillStyle = glow;
      ctx.fillText('DROP!', W / 2, H * 0.48);
    }

    // Vignette
    const vGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vGrad.addColorStop(0, 'transparent');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, W, H);
  }, [beatIntensity, fakeDropped]);

  // Canvas loop — restarts on every render (CLAUDE.md Rule 4)
  useEffect(() => {
    if (!canvasRef.current || !phase || phase === 'intro' || phase === 'final' || phase === 'round_result') return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }); // eslint-disable-line

  // ── Scoring ──
  const scoreRound = useCallback((roundNum, releaseT, dropT, guard, playersIn) => {
    if (!guard || !guard.v) return;
    if (buildIntervalRef.current) { clearInterval(buildIntervalRef.current); buildIntervalRef.current = null; }
    stopAudio();

    const holdDuration = holdStartRef.current > 0 ? ((releaseT || Date.now()) - holdStartRef.current) : 0;
    const holdSec = holdDuration / 1000;
    let inputType = 'tap';
    if (holdSec >= 5) inputType = 'blinker';
    else if (holdSec >= 2) inputType = 'real_puff';
    else if (holdSec >= 0.5) inputType = 'dry_puff';

    const calcScore = (relT, drpT, input) => {
      if (!relT || drpT === 0) return { ms: 9999, pts: 0, label: 'EARLY' };
      if (!drpT) return { ms: 9999, pts: 5, label: 'MISSED' };
      const diffMs = relT - drpT;
      const absDiff = Math.abs(diffMs);
      let pts = 0, label = '';
      let bonus = 0;
      if (input === 'dry_puff') bonus = 0.05;
      else if (input === 'real_puff') bonus = 0.15;
      else if (input === 'blinker' && absDiff <= 100) bonus = 0.20;
      else if (input === 'blinker') bonus = 0.10;
      if (absDiff <= 50) { pts = 100; label = 'PERFECT'; }
      else if (absDiff <= 150) { pts = 80; label = 'GREAT'; }
      else if (absDiff <= 350) { pts = 60; label = 'GOOD'; }
      else if (absDiff <= 700) { pts = 35; label = 'OK'; }
      else if (diffMs < 0) { pts = 0; label = 'EARLY'; }
      else { pts = 10; label = 'LATE'; }
      pts = Math.round(pts * (1 + bonus));
      if (input === 'blinker' && absDiff <= 100) label = 'BLINKER PERFECT';
      return { ms: absDiff, pts, label };
    };

    const playerResult = calcScore(releaseT, dropT, inputType);
    playerResult.input = inputType;

    const botResults = [];
    for (let b = 0; b < 3; b++) {
      const accuracy = BD_BOT_ACCURACY[b];
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const botDiffMs = Math.abs(Math.round(z * accuracy));
      const botInput = Math.random() < 0.15 ? 'real_puff' : Math.random() < 0.3 ? 'dry_puff' : 'tap';
      const botScore = calcScore(dropT ? dropT + botDiffMs : null, dropT, botInput);
      botScore.input = botInput;
      botResults.push(botScore);
    }

    const allResults = [playerResult, ...botResults];
    const updatedPlayers = playersIn.map((p, idx) => {
      const r = allResults[idx];
      const newScores = [...p.scores, r.pts];
      return { ...p, scores: newScores, totalPts: newScores.reduce((a, b) => a + b, 0), avgMs: r.ms };
    });

    setPlayers(updatedPlayers); playersRef.current = updatedPlayers;
    setLastResult(playerResult);
    const roundRes = {
      round: roundNum + 1,
      playerResults: updatedPlayers.map((p, i) => ({ name: p.name, ms: allResults[i].ms, pts: allResults[i].pts, label: allResults[i].label, input: allResults[i].input })),
    };
    setRoundResults(prev => [...prev, roundRes]);

    if (playerResult.label === 'PERFECT' || playerResult.label === 'BLINKER PERFECT') {
      playFx('goal'); triggerFlash('goal'); spawnConfetti(40, [C.pink, C.purple, C.gold]);
      addChat('Announcer', `PERFECT TIMING! ${playerResult.ms}ms off the beat!`, C.gold);
    } else if (playerResult.label === 'GREAT') {
      playFx('success');
      addChat('Announcer', `Great drop! ${playerResult.ms}ms -- solid timing!`, C.green);
    } else if (playerResult.label === 'GOOD') {
      playFx('select');
      addChat(pick(BD_BOT_NAMES), pick(BD_CHAT_RESULT), C.cyan);
    } else if (playerResult.label === 'EARLY') {
      playFx('error');
      addChat('Announcer', 'Too early! Wait for the DROP!', C.red);
    } else {
      playFx('miss');
      addChat('Announcer', 'A bit late... the party moved on!', C.orange);
    }

    setPhase('round_result'); phaseRef.current = 'round_result';

    setTimeout(() => {
      if (!guard.v) return;
      if (roundNum < 3) {
        startRound(roundNum + 1, guard, updatedPlayers);
      } else {
        setPhase('final'); phaseRef.current = 'final';
        if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
        const sorted = [...updatedPlayers].sort((a, b) => b.totalPts - a.totalPts);
        const won = sorted[0].isYou;
        const rank = sorted.findIndex(p => p.isYou) + 1;
        const baseCoins = rank === 1 ? 80 : rank === 2 ? 40 : rank === 3 ? 20 : 10;
        setCoins(c => c + baseCoins);
        awardGame('beatdrop', won ? 'win' : 'lose');
        if (won) {
          spawnConfetti(60, [C.pink, C.purple, C.gold, C.cyan]);
          playFx('win'); playFx('crowd');
          addChat('Announcer', 'YOU WIN BEAT DROP! Best ears in the club!', C.gold);
        } else {
          playFx('lose');
          addChat('Announcer', `${sorted[0].name} wins Beat Drop! Better luck next mix!`, C.red);
        }
      }
    }, 2800);
  }, [stopAudio, playFx, triggerFlash, spawnConfetti, addChat, awardGame, setCoins]); // eslint-disable-line

  // ── Round start ──
  const startRound = useCallback((roundNum, guard, playersIn) => {
    if (!guard.v) return;
    const song = BD_SONGS[roundNum];
    const buildTime = song.buildTime + Math.floor(Math.random() * 3000);
    setRound(roundNum); roundRef.current = roundNum;
    setHolding(false); holdingRef.current = false;
    holdStartRef.current = 0;
    dropTimeRef.current = 0;
    releasedRef.current = false;
    setBeatIntensity(0);
    setFakeDropped(false);
    setLastResult(null);
    setCharging(false);
    setPuffIntensity(0);
    setPhase('building'); phaseRef.current = 'building';
    addChat('Announcer', `Round ${roundNum + 1}: ${song.name} -- LISTEN CLOSELY!`, C.gold);
    playFx('beat_buildup');
    playBuildAudio(buildTime);
    const startT = Date.now();
    buildIntervalRef.current = setInterval(() => {
      if (!guard.v) return;
      const elapsed = Date.now() - startT;
      const progress = Math.min(elapsed / buildTime, 1);
      setBeatIntensity(progress);
      if (Math.random() < 0.003) {
        addChat(pick(BD_BOT_NAMES), pick(BD_CHAT_BUILD), pick(BD_BOT_COLORS));
      }
    }, 50);

    if (song.fakeAt) {
      setTimeout(() => {
        if (!guard.v) return;
        setFakeDropped(true);
        triggerShake();
        addChat('Announcer', 'PSYCH! Fake drop!', C.purple);
        setTimeout(() => { if (guard.v) setFakeDropped(false); }, 800);
      }, song.fakeAt + Math.floor(Math.random() * 1000));
    }

    dropTimerRef.current = setTimeout(() => {
      if (!guard.v) return;
      if (buildIntervalRef.current) { clearInterval(buildIntervalRef.current); buildIntervalRef.current = null; }
      stopAudio();
      const dropT = Date.now();
      dropTimeRef.current = dropT;
      setBeatIntensity(1);
      setPhase('dropped'); phaseRef.current = 'dropped';
      playDropSound();
      triggerFlash('goal');
      triggerShake();
      playFx('beat_drop');
      addChat('Announcer', pick(BD_CHAT_DROP), C.gold);
      setTimeout(() => {
        if (!guard.v) return;
        if (!releasedRef.current) {
          scoreRound(roundNum, null, dropT, guard, playersIn);
        }
      }, 3000);
    }, buildTime);
  }, [playFx, playBuildAudio, playDropSound, stopAudio, triggerFlash, triggerShake, addChat, scoreRound]);

  // ── Input handlers ──
  const startHold = useCallback(() => {
    const p = phaseRef.current;
    if (p !== 'building' && p !== 'dropped') return;
    if (holdingRef.current) return;
    const now = Date.now();
    setHolding(true); holdingRef.current = true;
    holdStartRef.current = now;
    setCharging(true);
    setPuffIntensity(0);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - holdStartRef.current) / 1000;
      setPuffIntensity(Math.min(elapsed / 6, 1));
    }, 50);
  }, []);

  const releaseHold = useCallback(() => {
    if (!holdingRef.current) return;
    setHolding(false); holdingRef.current = false;
    setCharging(false);
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
    const releaseT = Date.now();
    releasedRef.current = true;
    const dropT = dropTimeRef.current;
    const guard = guardRef.current;
    const curPlayers = playersRef.current;
    if (phaseRef.current === 'building') {
      addChat('Announcer', 'Too early! The beat hadn\'t dropped!', C.red);
      playFx('error');
      scoreRound(roundRef.current, releaseT, 0, guard, curPlayers);
    } else if (phaseRef.current === 'dropped' && dropT > 0) {
      scoreRound(roundRef.current, releaseT, dropT, guard, curPlayers);
    }
  }, [addChat, playFx, scoreRound]);

  // ── BLE ──
  useEffect(() => {
    setBLEHandlers(0, () => startHold(), () => releaseHold());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  // ── Cleanup helper ──
  const cleanup = useCallback(() => {
    stopAudio();
    if (buildIntervalRef.current) { clearInterval(buildIntervalRef.current); buildIntervalRef.current = null; }
    if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null; }
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    const guard = guardRef.current;
    if (guard) { guard.v = false; guardRef.current = null; }
    particlesRef.current = [];
  }, [stopAudio]);

  // ── Start game ──
  const startGame = useCallback(() => {
    cleanup();
    const guard = { v: true };
    guardRef.current = guard;
    const initPlayers = [
      { name: 'You', emoji: '🎧', isYou: true, scores: [], totalPts: 0, avgMs: 0, color: C.pink },
      { name: BD_BOT_NAMES[0], emoji: BD_BOT_EMOJIS[0], isYou: false, scores: [], totalPts: 0, avgMs: 0, color: BD_BOT_COLORS[0] },
      { name: BD_BOT_NAMES[1], emoji: BD_BOT_EMOJIS[1], isYou: false, scores: [], totalPts: 0, avgMs: 0, color: BD_BOT_COLORS[1] },
      { name: BD_BOT_NAMES[2], emoji: BD_BOT_EMOJIS[2], isYou: false, scores: [], totalPts: 0, avgMs: 0, color: BD_BOT_COLORS[2] },
    ];
    setPlayers(initPlayers); playersRef.current = initPlayers;
    setRound(0); roundRef.current = 0;
    setRoundResults([]);
    setLastResult(null);
    setIntroStep(0);
    setBeatIntensity(0);
    particlesRef.current = [];
    strobeRef.current = 0;
    setPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('Announcer', '4 DJs enter the booth... only the best ears survive!', C.gold);
    setTimeout(() => { if (!guard.v) return; setIntroStep(1); }, 300);
    setTimeout(() => { if (!guard.v) return; setIntroStep(2); }, 800);
    setTimeout(() => { if (!guard.v) return; setIntroStep(3); }, 1400);
    setTimeout(() => { if (!guard.v) return; setIntroStep(4); addChat(pick(BD_BOT_NAMES), pick(["Let's GO!", 'My ears are READY', 'I was born for this', 'Drop it like it\'s hot']), pick(BD_BOT_COLORS)); }, 2000);
    setTimeout(() => { if (!guard.v) return; startRound(0, guard, initPlayers); }, 3200);
  }, [cleanup, playFx, addChat, startRound]);

  useEffect(() => {
    startGame();
    return cleanup;
  }, []); // eslint-disable-line

  // ── Derived ──
  const song = BD_SONGS[round] || BD_SONGS[0];
  const yourScore = players.find(p => p.isYou)?.totalPts || 0;
  const sorted = [...players].sort((a, b) => b.totalPts - a.totalPts);
  const yourRank = sorted.findIndex(p => p.isYou) + 1;
  const isIntro = phase === 'intro';
  const isBuilding = phase === 'building';
  const isDropped = phase === 'dropped';
  const isRoundResult = phase === 'round_result';
  const isFinal = phase === 'final';

  const puffBarEl = charging ? (
    <div style={{ width: '90%', maxWidth: 300 }}>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${puffIntensity * 100}%`, background: puffIntensity >= 0.83 ? C.red : puffIntensity >= 0.33 ? C.purple : C.pink, transition: 'width 0.05s', borderRadius: 4 }} />
      </div>
    </div>
  ) : null;

  const controlsSlot = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
      {puffBarEl}
      {(isBuilding || isDropped) && !charging && (
        <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 360 }}>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); startHold(); setTimeout(() => releaseHold(), 80); }}
            style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,77,141,0.12),rgba(192,132,252,0.06))', border: '2px solid rgba(255,77,141,0.2)', userSelect: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.pink, letterSpacing: 1 }}>TAP</div>
            <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Quick release</div>
          </div>
          <div data-btn="true"
            onMouseDown={(e) => { e.stopPropagation(); startHold(); }}
            onMouseUp={(e) => { e.stopPropagation(); releaseHold(); }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startHold(); }}
            onTouchEnd={(e) => { e.stopPropagation(); releaseHold(); }}
            onTouchCancel={(e) => { e.stopPropagation(); releaseHold(); }}
            style={{ touchAction: 'none', flex: 1.3, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(192,132,252,0.12),rgba(255,77,141,0.06))', border: '2px solid rgba(192,132,252,0.25)', userSelect: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.purple, letterSpacing: 1 }}>PUFF</div>
            <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Hold +5%</div>
          </div>
          <div data-btn="true"
            onMouseDown={(e) => { e.stopPropagation(); startHold(); }}
            onMouseUp={(e) => { e.stopPropagation(); releaseHold(); }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startHold(); }}
            onTouchEnd={(e) => { e.stopPropagation(); releaseHold(); }}
            onTouchCancel={(e) => { e.stopPropagation(); releaseHold(); }}
            style={{ touchAction: 'none', flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)', animation: 'countPulse 1.5s infinite', userSelect: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 1 }}>BLINKER</div>
            <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>+20% if 100ms!</div>
          </div>
        </div>
      )}
      {charging && (
        <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
          <span style={{ fontSize: 11, color: C.purple, fontWeight: 700 }}>HOLDING... release on the DROP!</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none', animation: screenShake ? 'shake 0.4s ease' : 'none' }}>
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(255,215,0,0.25)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      {/* Header */}
      <GameHeader
        backTo={() => { cleanup(); navigate('/arcade'); }}
        backLabel="Arcade"
        accent="#FF4D8D"
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.pink }}>🎧 BEAT DROP</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{yourScore}pts</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>#{yourRank}</span>
          </div>
        }
        row3={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.pink }}>Round {round + 1}/4</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: song.color || C.purple }}>{song.name}</span>
            {isBuilding && <span style={{ fontSize: 8, fontWeight: 700, color: beatIntensity > 0.8 ? C.gold : C.purple, animation: beatIntensity > 0.7 ? 'countPulse 0.5s infinite' : 'none' }}>{Math.round(beatIntensity * 100)}%</span>}
            {isDropped && <span style={{ fontSize: 8, fontWeight: 900, color: C.gold, animation: 'countPulse 0.3s infinite' }}>DROP!</span>}
          </div>
        }
      />

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * BD_DPR)} height={Math.round(600 * BD_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Intro overlay */}
        {isIntro && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
            {introStep >= 1 && <div style={{ fontSize: 56, marginBottom: 8, animation: 'scaleIn 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>🎧</div>}
            {introStep >= 2 && <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, background: `linear-gradient(135deg,${C.pink},${C.purple},${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>BEAT DROP</div>}
            {introStep >= 3 && <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700 }}>4 DJs — RELEASE ON THE DROP!</div>}
            {introStep >= 4 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <span style={{ fontSize: 7, color: p.isYou ? C.pink : p.color, fontWeight: 800, marginTop: 2 }}>{p.isYou ? 'YOU' : p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Round result overlay */}
        {isRoundResult && lastResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.85)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, color: lastResult.label.includes('PERFECT') ? C.gold : lastResult.label.includes('GREAT') ? C.green : lastResult.label.includes('EARLY') ? C.red : C.text2 }}>{lastResult.label}</div>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 4 }}>{lastResult.ms < 9999 ? `${lastResult.ms}ms off the beat` : 'Missed the drop!'}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, marginBottom: 8 }}>+{lastResult.pts} pts</div>
            {lastResult.input !== 'tap' && (
              <div style={{ fontSize: 10, color: lastResult.input === 'blinker' ? C.red : C.purple, fontWeight: 700, marginBottom: 8 }}>
                {lastResult.input === 'blinker' ? 'BLINKER BONUS!' : lastResult.input === 'real_puff' ? 'Real Puff +15%' : 'Dry Puff +5%'}
              </div>
            )}
            <div style={{ width: '85%', maxWidth: 280, marginTop: 8 }}>
              <div style={{ fontSize: 8, color: C.text3, letterSpacing: 2, marginBottom: 4, textAlign: 'center' }}>ROUND {round + 1} STANDINGS</div>
              {sorted.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 2, borderRadius: 6, background: p.isYou ? 'rgba(255,77,141,0.08)' : 'rgba(255,255,255,0.02)', border: p.isYou ? '1px solid rgba(255,77,141,0.15)' : '1px solid transparent' }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? C.gold : C.text3, width: 14 }}>{i + 1}.</span>
                  <span style={{ fontSize: 11 }}>{p.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.isYou ? C.pink : C.text, flex: 1 }}>{p.isYou ? 'You' : p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: 'monospace' }}>{p.totalPts}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final overlay */}
        {isFinal && (() => {
          const won = sorted[0]?.isYou;
          const rank = sorted.findIndex(p => p.isYou) + 1;
          const baseCoins = rank === 1 ? 80 : rank === 2 ? 40 : rank === 3 ? 20 : 10;
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease', overflowY: 'auto', padding: '20px 0' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : '🎧'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.gold : C.pink }}>{won ? 'YOU WIN BEAT DROP!' : 'Beat Drop Complete!'}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>Your rank: #{rank} of 4</div>
              <div style={{ width: '85%', maxWidth: 300, marginTop: 16 }}>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>FINAL STANDINGS</div>
                {sorted.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', marginBottom: 3, borderRadius: 8, background: p.isYou ? 'rgba(255,77,141,0.1)' : 'rgba(255,255,255,0.03)', border: p.isYou ? '1px solid rgba(255,77,141,0.2)' : '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? C.gold : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : C.text3, width: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '4.'}</span>
                    <span style={{ fontSize: 14 }}>{p.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.isYou ? C.pink : C.text, flex: 1 }}>{p.isYou ? 'You' : p.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: C.gold, fontFamily: 'monospace' }}>{p.totalPts}</span>
                  </div>
                ))}
              </div>
              {roundResults.length > 0 && (
                <div style={{ width: '85%', maxWidth: 300, marginTop: 12 }}>
                  <div style={{ fontSize: 8, color: C.text3, letterSpacing: 2, marginBottom: 4, textAlign: 'center' }}>YOUR ROUNDS</div>
                  {roundResults.map((r, i) => {
                    const you = r.playerResults.find(p => p.name === 'You');
                    return you ? (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', marginBottom: 2, borderRadius: 6, background: 'rgba(255,77,141,0.05)' }}>
                        <span style={{ fontSize: 10, color: C.text2 }}>R{r.round}: {BD_SONGS[i]?.name || '?'}</span>
                        <span style={{ fontSize: 10, color: C.text3 }}>{you.ms < 9999 ? `${you.ms}ms` : '--'}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: you.pts >= 80 ? C.gold : you.pts >= 50 ? C.green : C.text3 }}>+{you.pts}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 12, width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: C.text }}>Earned</span>
                  <span style={{ color: C.gold }}>+{baseCoins} 🪙</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ touchAction: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.pink}15`, border: `1px solid ${C.pink}30`, fontSize: 13, fontWeight: 800, color: C.pink }}>Play Again</div>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/arcade'); }} style={{ touchAction: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
              </div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/me'); }} style={{ touchAction: 'none', padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8, width: '60%' }}>👤 My Progress</div>
            </div>
          );
        })()}

        {/* Controls at bottom */}
        {!isFinal && !isIntro && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, padding: '8px 12px', background: 'rgba(4,8,18,0.7)', backdropFilter: 'blur(8px)' }}>
            {controlsSlot}
          </div>
        )}
      </div>
    </div>
  );
}
