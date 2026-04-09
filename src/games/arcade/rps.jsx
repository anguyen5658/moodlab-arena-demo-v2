import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import UniversalPuffBar from '../../components/UniversalPuffBar.jsx';
import GameChatOverlay from '../../components/GameChatOverlay.jsx';

const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const PILL = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(24px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const OPPONENTS = [
  { name: 'Sensei Stoner',  emoji: '🧘', taunt: 'My third eye sees your throw',  style: 'balanced' },
  { name: 'Rocky Blaze',   emoji: '🪨', taunt: 'Rock solid every time',          style: 'rock_heavy' },
  { name: 'Scissor Hands', emoji: '✂️', taunt: 'Snip snip, smokey',             style: 'scissors_heavy' },
  { name: 'Paper Trail',   emoji: '📄', taunt: 'Roll it up and smoke it',        style: 'paper_heavy' },
  { name: 'The Blinker',   emoji: '💨', taunt: 'MAXIMUM POWER always',           style: 'blinker' },
  { name: 'Puff Master',   emoji: '👑', taunt: 'I read you like a rolling paper', style: 'adaptive' },
];

const CHOICES  = ['rock', 'paper', 'scissors'];
const EMOJI    = { rock: '✊', paper: '✋', scissors: '✌️' };
const BEATS    = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

const WIN_COMMENTS = [
  ['Paper wraps rock like a rolling paper!', 'Rock crushes scissors through the smoke!', 'Scissors cut through the haze!'],
  ['CLEAN WIN! That throw was precise!', "The puff powered that throw HARD!", "AI didn't see that coming!"],
  ['POWER THROW! The dojo is shaking!', 'That throw is ON FIRE!', 'Blinker energy on that throw!'],
];
const LOSE_COMMENTS = [
  "AI read you like a menu at the dispensary", "Outplayed! Time to recalibrate", "The bot's got smoke-vision",
  "That throw was weaker than mids", "AI flexed HARD on that one", "Counter-puffed! Better luck next round",
];
const TIE_COMMENTS = [
  'SAME THROW! Draw round, replay!', 'Mirror match! Nobody wins this one!', 'Identical minds... REPLAY!',
];
const BLINKER_COMMENTS = [
  'BLINKER THROW! MAXIMUM POWER!', 'ULTRA POWER! Maximum puff energy!', 'BLINKER RISK! High reward or high regret!',
];
const CHAT_WIN  = ['That was FILTHY', 'CLEAN ROUND W', 'Dojo energy is INSANE', 'Someone clip that', 'W throw'];
const CHAT_LOSE = ['RIP', "Nah that's tough", 'F in the chat', 'That was brutal', 'AI is on another level'];
const CHAT_HYPE = ['This match is INSANE', 'The tension is unreal', "Who's gonna take it", 'Crowd is going WILD'];

const getAiChoice = (opp) => {
  if (!opp) return pick(CHOICES);
  const r = Math.random();
  if (opp.style === 'rock_heavy')     return r < 0.5 ? 'rock' : r < 0.75 ? 'paper' : 'scissors';
  if (opp.style === 'scissors_heavy') return r < 0.5 ? 'scissors' : r < 0.75 ? 'rock' : 'paper';
  if (opp.style === 'paper_heavy')    return r < 0.5 ? 'paper' : r < 0.75 ? 'scissors' : 'rock';
  return pick(CHOICES);
};

const getPowerLabel = (power) => {
  if (power < 10) return { label: 'Tap',      tier: 'weak',   bonus: 0,  color: C.text3 };
  if (power < 40) return { label: 'Dry Puff', tier: 'normal', bonus: 5,  color: C.cyan  };
  if (power < 70) return { label: 'Real Puff',tier: 'power',  bonus: 15, color: C.green };
  if (power < 90) return { label: 'Long Puff',tier: 'strong', bonus: 15, color: C.orange };
  return           { label: 'BLINKER',        tier: 'ultra',  bonus: 20, color: C.red   };
};

export default function RPSGame() {
  const navigate = useNavigate();
  const {
    coins, bleConnected, setShowBlePopup, playFx,
    triggerFlash, triggerShake, spawnConfetti, confettiParticles, screenShake, screenFlash,
    setGameChatMsgs, awardGame, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  // ── Local game state ──
  const [phase, setPhase]             = useState(null); // null|intro|choose|puff|clash|round_result|final
  const [round, setRound]             = useState(0);
  const [score, setScore]             = useState({ you: 0, ai: 0 });
  const [playerChoice, setPlayerChoice] = useState(null);
  const [aiChoice, setAiChoice]       = useState(null);
  const [puffPower, setPuffPower]     = useState(0);
  const [aiPuffPower, setAiPuffPower] = useState(0);
  const [result, setResult]           = useState(null); // win|lose|draw
  const [streak, setStreak]           = useState(0);
  const [intro, setIntro]             = useState(0);
  const [puffHeld, setPuffHeld]       = useState(false);
  const [clashAnim, setClashAnim]     = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [opponent, setOpponent]       = useState(null);
  const [commentary, setCommentary]   = useState('');

  // ── Refs (for canvas + stale-closure prevention) ──
  const roundRef        = useRef(0);
  const playerChoiceRef = useRef(null);
  const phaseRef        = useRef(null);
  const aiChoiceRef     = useRef(null);
  const aiPuffPowerRef  = useRef(0);
  const puffHeldRef     = useRef(false);
  const clashAnimRef    = useRef(false);
  const resultRef       = useRef(null);
  const roundResultsRef = useRef([]);
  const puffStartRef    = useRef(0);
  const puffIntervalRef = useRef(null);
  const puffActiveRef   = useRef(false);
  const resolveRef      = useRef(null);
  const canvasRef       = useRef(null);
  const animRef         = useRef(null);
  const auraRef         = useRef(0);
  const clashTRef       = useRef(0);
  const slowMoRef       = useRef(0);
  const guardRef        = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { aiChoiceRef.current = aiChoice; }, [aiChoice]);
  useEffect(() => { aiPuffPowerRef.current = aiPuffPower; }, [aiPuffPower]);
  useEffect(() => { puffHeldRef.current = puffHeld; }, [puffHeld]);
  useEffect(() => { clashAnimRef.current = clashAnim; }, [clashAnim]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { roundResultsRef.current = roundResults; }, [roundResults]);

  const addChat = useCallback((name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { name, msg, color, t: Date.now() }]);
  }, [setGameChatMsgs]);

  // ── Canvas draw ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / DPR, H = canvas.height / DPR;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(DPR, DPR);
    const t = Date.now() * 0.001;
    const curPhase = phaseRef.current;
    const aura  = auraRef.current;
    const clash = clashTRef.current;
    const slowMo = slowMoRef.current;

    // Dark dojo background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a1a'); bg.addColorStop(0.3, '#12082a');
    bg.addColorStop(0.6, '#1a0e2a'); bg.addColorStop(1, '#0a0812');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Wooden floor
    const floorY = H * 0.68;
    const floor = ctx.createLinearGradient(0, floorY, 0, H);
    floor.addColorStop(0, '#2a1a0a'); floor.addColorStop(0.3, '#3a2210');
    floor.addColorStop(0.7, '#2a1808'); floor.addColorStop(1, '#1a0e04');
    ctx.fillStyle = floor; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(60,40,20,0.4)'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = floorY + i * (H - floorY) / 7;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Shoji screens
    const wallH = floorY * 0.7;
    ctx.fillStyle = 'rgba(240,230,210,0.04)';
    for (let i = 0; i < 5; i++) {
      const x = i * (W / 4) - W * 0.06;
      ctx.fillRect(x, floorY * 0.1, W * 0.28, wallH);
    }
    ctx.strokeStyle = 'rgba(100,70,30,0.15)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const x = i * (W / 4) - W * 0.06;
      ctx.strokeRect(x, floorY * 0.1, W * 0.28, wallH);
      ctx.beginPath(); ctx.moveTo(x + W * 0.14, floorY * 0.1); ctx.lineTo(x + W * 0.14, floorY * 0.1 + wallH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, floorY * 0.1 + wallH * 0.5); ctx.lineTo(x + W * 0.28, floorY * 0.1 + wallH * 0.5); ctx.stroke();
    }

    // Dust particles
    for (let i = 0; i < 12; i++) {
      const px = (i * 37 + Math.sin(t * 0.3 + i) * 30) % W;
      const py = (i * 29 + Math.cos(t * 0.4 + i * 1.7) * 20) % (floorY * 0.8) + floorY * 0.1;
      ctx.fillStyle = `rgba(255,230,180,${0.03 + Math.sin(t + i) * 0.02})`;
      ctx.beginPath(); ctx.arc(px, py, 1 + i % 2, 0, Math.PI * 2); ctx.fill();
    }

    // Fighters
    const fY = floorY - 8;
    const youX = W * 0.25, aiX = W * 0.75;
    const drawFighter = (x, y, col, choice, power, isClashing, label) => {
      const bodyH = 40, headR = 12;
      ctx.fillStyle = col + '40'; ctx.fillRect(x - 8, y - bodyH, 16, bodyH);
      ctx.fillStyle = col + '60'; ctx.beginPath(); ctx.arc(x, y - bodyH - headR + 2, headR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col + '80'; ctx.fillRect(x - 10, y - bodyH * 0.45, 20, 4);
      if (power > 0) {
        const aR = 20 + power * 0.4;
        const aGrad = ctx.createRadialGradient(x, y - bodyH * 0.5, 0, x, y - bodyH * 0.5, aR);
        aGrad.addColorStop(0, col + '30'); aGrad.addColorStop(0.5, col + '10'); aGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = aGrad; ctx.beginPath(); ctx.arc(x, y - bodyH * 0.5, aR, 0, Math.PI * 2); ctx.fill();
        if (power > 30) {
          for (let p = 0; p < Math.min(6, Math.floor(power / 15)); p++) {
            const pa = t * 2 + p * 1.05; const pr = 18 + Math.sin(pa * 1.5) * 8 + power * 0.12;
            ctx.fillStyle = col + '40'; ctx.beginPath(); ctx.arc(x + Math.cos(pa) * pr, y - bodyH * 0.5 + Math.sin(pa) * pr * 0.7, 2 + power * 0.02, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      if (choice) {
        ctx.font = 'bold ' + Math.round(28 + (isClashing ? Math.sin(t * 15) * 4 : 0)) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(EMOJI[choice], x, y - bodyH - headR * 2 - 14);
      }
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = col; ctx.fillText(label, x, y + 6);
    };

    drawFighter(youX, fY, '#00E5FF', playerChoiceRef.current, aura, !!clash, 'YOU');
    drawFighter(aiX, fY, '#FF4444', aiChoiceRef.current, aiPuffPowerRef.current * (clash ? 1 : 0), !!clash, 'AI');

    // Clash VFX
    if (clash > 0) {
      const cx = W * 0.5, cy = fY - 30;
      const impactR = 15 + clash * 25;
      const impGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, impactR);
      impGrad.addColorStop(0, 'rgba(255,200,50,0.6)'); impGrad.addColorStop(0.4, 'rgba(255,150,30,0.3)'); impGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = impGrad; ctx.beginPath(); ctx.arc(cx, cy, impactR, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 8; i++) {
        const sa = i * Math.PI / 4 + t * 3; const sr = impactR * 0.6 + Math.sin(t * 10 + i) * 8;
        ctx.strokeStyle = 'rgba(255,220,80,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(sa) * 6, cy + Math.sin(sa) * 6); ctx.lineTo(cx + Math.cos(sa) * sr, cy + Math.sin(sa) * sr); ctx.stroke();
      }
      ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,200,50,0.9)'; ctx.fillText('CLASH!', cx, cy - impactR - 10);
    }

    // Slow-mo result overlay
    if (slowMo > 0) {
      const rr = resultRef.current;
      const cx = W * 0.5, cy = H * 0.35;
      ctx.fillStyle = `rgba(0,0,0,${0.3 * slowMo})`; ctx.fillRect(0, 0, W, H);
      ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rr === 'win' ? 'rgba(52,211,153,0.9)' : rr === 'lose' ? 'rgba(255,68,68,0.9)' : 'rgba(255,217,61,0.9)';
      ctx.fillText(rr === 'win' ? 'YOU WIN!' : rr === 'lose' ? 'DEFEATED!' : 'DRAW!', cx, cy);
    }

    // Score + round indicators
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Round ' + (Math.min(roundRef.current + 1, 5)) + '/5', W * 0.5, 8);
    for (let i = 0; i < 5; i++) {
      const rr = roundResultsRef.current[i];
      const dx = W * 0.5 + (i - 2) * 20;
      ctx.fillStyle = rr ? (rr.result === 'win' ? 'rgba(52,211,153,0.7)' : rr.result === 'lose' ? 'rgba(255,68,68,0.7)' : 'rgba(255,217,61,0.7)') : 'rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.arc(dx, 26, 6, 0, Math.PI * 2); ctx.fill();
      if (rr) { ctx.font = 'bold 7px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'D', dx, 23); }
    }
    ctx.restore();

    // Update animated refs
    if (puffHeldRef.current) auraRef.current = Math.min(100, (auraRef.current || 0) + 2);
    else auraRef.current = Math.max(0, (auraRef.current || 0) - 3);
    if (clashAnimRef.current) clashTRef.current = Math.min(1, (clashTRef.current || 0) + 0.06);
    else clashTRef.current = Math.max(0, (clashTRef.current || 0) - 0.04);
    const p = phaseRef.current;
    if (p === 'round_result' || p === 'final') slowMoRef.current = Math.min(1, (slowMoRef.current || 0) + 0.04);
    else slowMoRef.current = Math.max(0, (slowMoRef.current || 0) - 0.06);
  }, []);

  // Canvas animation loop — restart on every render (Rule 4)
  useEffect(() => {
    if (!phase) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => { drawCanvas(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); animRef.current = null; };
  });

  // ── Puff handlers ──
  const startPuff = useCallback(() => {
    if (puffActiveRef.current) return;
    if (phaseRef.current !== 'puff') return;
    puffActiveRef.current = true;
    setPuffHeld(true);
    puffStartRef.current = Date.now();
    puffIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - puffStartRef.current) / 1000;
      setPuffPower(Math.min(100, elapsed * 20));
    }, 30);
  }, []);

  const stopPuff = useCallback(() => {
    if (!puffActiveRef.current) return;
    puffActiveRef.current = false;
    setPuffHeld(false);
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null; }
    const elapsed = (Date.now() - puffStartRef.current) / 1000;
    const finalPower = Math.min(100, elapsed * 20);
    setPuffPower(finalPower);

    const guard = guardRef.current;
    if (!guard?.v) return;
    const opp = opponent;
    const aiC = getAiChoice(opp);
    setAiChoice(aiC); aiChoiceRef.current = aiC;
    const aiPwr = opp?.style === 'blinker' ? 80 + Math.random() * 20 : 30 + Math.random() * 40;
    setAiPuffPower(aiPwr); aiPuffPowerRef.current = aiPwr;

    const playerPwrInfo = getPowerLabel(finalPower);
    const pc = playerChoiceRef.current;
    resolveRef.current = { pc, aiChoice: aiC, finalPower, aiPwr, playerPwrInfo };

    setPhase('clash'); phaseRef.current = 'clash';
    setClashAnim(true); clashAnimRef.current = true;
    clashTRef.current = 0;
    triggerShake();
    playFx('punch_clash');

    if (playerPwrInfo.tier === 'ultra') {
      setCommentary(pick(BLINKER_COMMENTS));
      addChat('Announcer', 'BLINKER THROW! INSANE POWER!', C.red);
    } else {
      setCommentary('CLASH!');
      addChat('Announcer', 'CLASH!', C.gold);
    }

    setTimeout(() => {
      if (!guard?.v) return;
      setClashAnim(false); clashAnimRef.current = false;
      const d = resolveRef.current; if (!d) return;
      const { pc: ppc, aiChoice: aic, finalPower: fp, aiPwr: ap, playerPwrInfo: ppI } = d;

      let res;
      if (ppc === aic) {
        res = 'draw';
        setCommentary(pick(TIE_COMMENTS));
        addChat(pick(['CloudChaser', 'BlinkerBaron']), pick(CHAT_HYPE), C.gold);
      } else if (BEATS[ppc] === aic) {
        res = 'win';
        if (ppI.tier === 'ultra') { triggerFlash('goal'); spawnConfetti(40); }
        else if (ppI.tier === 'power') { triggerFlash('goal'); spawnConfetti(20); }
        const ci = ppI.tier === 'power' || ppI.tier === 'ultra' ? 2 : ppI.tier === 'normal' ? 1 : 0;
        setCommentary(pick(WIN_COMMENTS[ci]));
        playFx('goal');
        addChat(pick(['NeonQueen', 'PuffDaddy', 'CloudChaser']), pick(CHAT_WIN), pick(['#7CFF6B', '#FFD93D', '#00E5FF']));
      } else {
        res = 'lose';
        setCommentary(pick(LOSE_COMMENTS));
        playFx('miss'); triggerShake();
        addChat(pick(['BlazedPanda', 'SeshGremlin']), pick(CHAT_LOSE), pick(['#FF6B8A', '#C084FC']));
      }

      setResult(res); resultRef.current = res;
      setStreak(prev => {
        const ns = res === 'win' ? prev + 1 : 0;
        if (ns >= 3) playFx('streak_fire');
        return ns;
      });
      setScore(prev => {
        const ns = { ...prev };
        if (res === 'win') ns.you += 1;
        else if (res === 'lose') ns.ai += 1;
        return ns;
      });
      setRoundResults(prev => {
        const next = [...prev, { round: roundRef.current, playerChoice: ppc, aiChoice: aic, result: res, bonus: ppI.bonus, playerPower: fp, aiPower: ap }];
        roundResultsRef.current = next;
        return next;
      });
      setPhase('round_result'); phaseRef.current = 'round_result';
      slowMoRef.current = 0;

      setTimeout(() => {
        if (!guard?.v) return;
        setScore(prev => {
          if (prev.you >= 3) {
            setPhase('final'); phaseRef.current = 'final';
            const bonusMult = 1 + (ppI.bonus / 100);
            const baseCoins = Math.round(80 * bonusMult);
            playFx('win'); spawnConfetti(50); triggerFlash('goal');
            setCommentary('CHAMPION! You dominated the Puff Dojo!');
            addChat('Announcer', 'CHAMPION! ' + baseCoins + ' coins earned!', C.gold);
            awardGame('rps', 'win');
            return prev;
          }
          if (prev.ai >= 3) {
            setPhase('final'); phaseRef.current = 'final';
            playFx('lose'); triggerFlash('miss');
            setCommentary('Defeated... ' + (opp?.name || 'AI') + ' was too strong!');
            addChat('Announcer', (opp?.name || 'AI') + ' wins the match!', C.red);
            awardGame('rps', 'lose');
            return prev;
          }
          const nextRound = roundRef.current + 1;
          if (nextRound >= 5) {
            setPhase('final'); phaseRef.current = 'final';
            if (prev.you > prev.ai) { playFx('win'); spawnConfetti(50); triggerFlash('goal'); setCommentary('CHAMPION!'); awardGame('rps', 'win'); }
            else if (prev.ai > prev.you) { playFx('lose'); triggerFlash('miss'); setCommentary('Defeated!'); awardGame('rps', 'lose'); }
            else { playFx('crowd'); setCommentary('DRAW! Equal warriors!'); awardGame('rps', 'lose'); }
            return prev;
          }
          if (res === 'draw') {
            setPlayerChoice(null); playerChoiceRef.current = null;
            setAiChoice(null); aiChoiceRef.current = null;
            setPuffPower(0); setResult(null); resultRef.current = null;
            setPhase('choose'); phaseRef.current = 'choose';
            setCommentary('DRAW! Replay Round ' + (roundRef.current + 1) + '!');
            addChat('Announcer', 'Draw! Replay the round!', C.gold);
          } else {
            setRound(nextRound); roundRef.current = nextRound;
            setPlayerChoice(null); playerChoiceRef.current = null;
            setAiChoice(null); aiChoiceRef.current = null;
            setPuffPower(0); setResult(null); resultRef.current = null;
            setPhase('choose'); phaseRef.current = 'choose';
            setCommentary('Round ' + (nextRound + 1) + ' -- Choose your throw!');
            addChat('Announcer', 'Round ' + (nextRound + 1) + '! Choose wisely!', C.gold);
          }
          return prev;
        });
      }, 2500);
    }, 1200);
  }, [opponent, triggerShake, triggerFlash, spawnConfetti, playFx, addChat, awardGame]);

  // ── BLE handlers ──
  const handleDown = useCallback(() => { startPuff(); }, [startPuff]);
  const handleUp   = useCallback(() => { stopPuff(); }, [stopPuff]);
  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  // ── Start game ──
  const startGame = useCallback(() => {
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    const guard = { v: true };
    guardRef.current = guard;

    const opp = pick(OPPONENTS);
    setOpponent(opp);
    setRound(0); roundRef.current = 0;
    setScore({ you: 0, ai: 0 });
    setPlayerChoice(null); playerChoiceRef.current = null;
    setAiChoice(null); aiChoiceRef.current = null;
    setPuffPower(0); setAiPuffPower(0);
    setResult(null); resultRef.current = null;
    setStreak(0); setIntro(1);
    setRoundResults([]); roundResultsRef.current = [];
    setPuffHeld(false); puffHeldRef.current = false;
    auraRef.current = 0; clashTRef.current = 0; slowMoRef.current = 0;

    setPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('Announcer', 'Welcome to the PUFF DOJO!', C.gold);
    setCommentary('Welcome to the Puff Dojo! ' + opp.emoji);

    setTimeout(() => { if (!guard.v) return; setIntro(2); setCommentary(opp.name + ': "' + opp.taunt + '"'); addChat(opp.name, '"' + opp.taunt + '"', C.red); }, 1000);
    setTimeout(() => { if (!guard.v) return; setIntro(3); playFx('whistle'); setCommentary('Best of 5 — First to 3 wins! FIGHT!'); addChat('Announcer', 'Best of 5, first to 3! FIGHT!', C.gold); }, 2000);
    setTimeout(() => { if (!guard.v) return; setIntro(4); triggerFlash('goal'); playFx('crowd'); }, 2800);
    setTimeout(() => { if (!guard.v) return; setPhase('choose'); phaseRef.current = 'choose'; setIntro(0); setRound(0); roundRef.current = 0; setCommentary('Round 1 -- Choose your throw!'); }, 3500);
  }, [playFx, addChat, triggerFlash]);

  // ── Pick choice ──
  const pickChoice = useCallback((choice) => {
    if (phaseRef.current !== 'choose') return;
    setPlayerChoice(choice); playerChoiceRef.current = choice;
    playFx('select');
    setCommentary('Now CHARGE your puff power! Hold or puff!');
    addChat('Announcer', 'Throw chosen! Charge that puff power!', C.cyan);
    setPhase('puff'); phaseRef.current = 'puff';
    setPuffPower(0); setAiPuffPower(0);
    auraRef.current = 0;
  }, [playFx, addChat]);

  // ── Exit ──
  const exitGame = useCallback(() => {
    if (guardRef.current) { guardRef.current.v = false; guardRef.current = null; }
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    navigate('/arcade');
  }, [navigate]);

  // ── Mount: auto-start ──
  useEffect(() => {
    startGame();
    return () => {
      if (guardRef.current) { guardRef.current.v = false; }
      if (puffIntervalRef.current) clearInterval(puffIntervalRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // eslint-disable-line

  if (!phase) return null;

  const opp = opponent || OPPONENTS[0];
  const pwrInfo = getPowerLabel(puffPower);
  const isIntro       = phase === 'intro';
  const isChoose      = phase === 'choose';
  const isPuff        = phase === 'puff';
  const isClash       = phase === 'clash';
  const isRoundResult = phase === 'round_result';
  const isFinal       = phase === 'final';
  const youWinFinal   = score.you >= 3;
  const youLoseFinal  = score.ai >= 3;

  // ── Final overlay ──
  const finalOverlay = isFinal ? (() => {
    const won  = youWinFinal;
    const lost = youLoseFinal;
    const draw = !won && !lost;
    const bonusMult = 1 + ((resolveRef.current?.playerPwrInfo?.bonus || 0) / 100);
    const baseR = won ? Math.round(80 * bonusMult) : draw ? 40 : 20;
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '🏆' : lost ? '💀' : '🤝'}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : lost ? C.red : C.gold }}>{won ? 'CHAMPION!' : lost ? 'DEFEATED' : 'DRAW!'}</div>
        <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{won ? 'You dominated the Puff Dojo!' : lost ? (opp.name + ' was too strong!') : 'Equal warriors in the dojo!'}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 8 }}>{score.you} - {score.ai}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8, marginBottom: 8 }}>
          {roundResults.map((rr, i) => (
            <div key={i} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700, background: `${rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold}15`, color: rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold, border: `1px solid ${rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold}30` }}>
              R{i + 1}: {EMOJI[rr.playerChoice]} {rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'D'}
            </div>
          ))}
        </div>
        {streak >= 2 && <div style={{ fontSize: 11, color: C.green, marginBottom: 4 }}>Win streak: {streak}</div>}
        <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', maxWidth: 260, textAlign: 'center', marginBottom: 8 }}>{commentary}</div>
        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: '80%', maxWidth: 260, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
            <span style={{ color: C.text }}>Earned</span>
            <span style={{ color: C.gold }}>+{baseR} 🪙</span>
          </div>
          {won && (resolveRef.current?.playerPwrInfo?.bonus || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.green, marginTop: 4 }}><span>Puff bonus</span><span>+{resolveRef.current.playerPwrInfo.bonus}%</span></div>
          )}
          {!bleConnected && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.orange, marginTop: 4 }}><span>Without device</span><span>70%</span></div>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 13, fontWeight: 800, color: C.purple }}>🥊 Rematch</div>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); exitGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
        </div>
      </div>
    );
  })() : null;

  // ── Controls slot (for GameChatOverlay) ──
  const controlsSlot = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
      {isIntro && (
        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: `rgba(255,217,61,0.06)`, border: `1px solid ${C.gold}20` }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, letterSpacing: 1 }}>
            {intro >= 4 ? 'FIGHT!' : intro >= 3 ? 'BEST OF 5!' : intro >= 2 ? '"' + opp.taunt + '"' : 'VS ' + opp.name}
          </div>
        </div>
      )}
      {isChoose && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {CHOICES.map(ch => {
            const chCol = ch === 'rock' ? C.orange : ch === 'paper' ? C.cyan : C.red;
            return (
              <div key={ch} data-btn="true" onClick={(e) => { e.stopPropagation(); pickChoice(ch); }}
                style={{ width: 80, height: 80, borderRadius: 14, cursor: 'pointer', touchAction: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: `linear-gradient(135deg, ${chCol}15, ${chCol}08)`, border: `2px solid ${chCol}35`, boxShadow: `0 4px 16px ${chCol}12`, userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div style={{ fontSize: 32 }}>{EMOJI[ch]}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: chCol, textTransform: 'uppercase' }}>{ch}</div>
              </div>
            );
          })}
        </div>
      )}
      {isPuff && (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{EMOJI[playerChoice]}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.text2 }}>{(playerChoice || '').toUpperCase()} chosen</span>
          </div>
          <div style={{ width: '90%', maxWidth: 300, margin: '0 auto 4px' }}>
            <UniversalPuffBar power={puffPower} charging={puffHeld} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: pwrInfo.color }}>{pwrInfo.label} {puffPower >= 90 ? '💀' : ''} +{pwrInfo.bonus}%</div>
          {puffHeld && <div style={{ fontSize: 9, color: C.gold, animation: 'pulse 0.5s infinite' }}>Charging... release to clash!</div>}
          {!puffHeld && puffPower === 0 && <div style={{ fontSize: 9, color: C.text3 }}>Hold anywhere or puff to charge</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 2, fontSize: 7, color: C.text3 }}>
            <span>Tap: +0%</span><span>Puff: +5%</span><span>Real: +15%</span><span>Blinker: +20%</span>
          </div>
        </div>
      )}
      {isClash && (
        <div style={{ textAlign: 'center', padding: '6px 16px', borderRadius: 12, background: 'rgba(255,200,50,0.1)', border: '1px solid rgba(255,200,50,0.2)' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.gold, letterSpacing: 2, animation: 'pulse 0.3s infinite' }}>CLASH!</div>
        </div>
      )}
      {isRoundResult && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>{EMOJI[playerChoice]}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.text3 }}>vs</span>
            <span style={{ fontSize: 28 }}>{aiChoice ? EMOJI[aiChoice] : '?'}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: result === 'win' ? C.green : result === 'lose' ? C.red : C.gold }}>
            {result === 'win' ? 'YOU WIN!' : result === 'lose' ? 'DEFEATED!' : 'DRAW - REPLAY!'}
          </div>
          {result === 'win' && <div style={{ fontSize: 10, color: C.green }}>+{pwrInfo.bonus}% coin bonus</div>}
          <div style={{ fontSize: 10, color: C.text2, fontStyle: 'italic', marginTop: 2 }}>{commentary}</div>
        </div>
      )}
      {isFinal && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Rematch</div>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); exitGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none', animation: screenShake ? 'shake 0.4s ease' : 'none' }}>
      {/* Screen flash */}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(192,132,252,0.12)' }}>
        {/* Row 1: brand + BLE + coins */}
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}><span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></div>
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
        {/* Row 2: back + title + score */}
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={exitGame} data-btn="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, touchAction: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.purple }}>🥊 PUFF DOJO</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>You: {score.you}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.red }}>AI: {score.ai}</span>
          </div>
        </div>
        {/* Row 3: round indicators */}
        <div style={{ padding: '2px 12px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: C.text3, marginRight: 4 }}>First to 3</span>
            {[0, 1, 2, 3, 4].map(i => {
              const rr = roundResults[i];
              const col = rr ? (rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold) : 'rgba(255,255,255,0.12)';
              return (
                <div key={i} style={{ width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: rr ? '#fff' : C.text3, background: rr ? col + '30' : col, border: `1px solid ${rr ? col + '50' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.3s' }}>
                  {rr ? (rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'D') : (i + 1)}
                </div>
              );
            })}
            {streak >= 2 && <span style={{ fontSize: 8, fontWeight: 800, color: C.green, marginLeft: 4 }}>x{streak}</span>}
          </div>
        </div>
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
        onMouseDown={(e) => { if (e.target.closest('[data-btn]')) return; if (isPuff) startPuff(); }}
        onMouseUp={(e) => { if (e.target.closest('[data-btn]')) return; stopPuff(); }}
        onTouchStart={(e) => { if (e.target.closest('[data-btn]')) return; if (isPuff) startPuff(); }}
        onTouchEnd={(e) => { if (e.target.closest('[data-btn]')) return; stopPuff(); }}>
        <canvas ref={canvasRef} width={Math.round(420 * DPR)} height={Math.round(600 * DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        {/* Opponent info */}
        {!isFinal && (
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.red, textShadow: '0 0 8px rgba(255,68,68,0.3)' }}>vs {opp.emoji} {opp.name}</div>
          </div>
        )}
        {/* Commentary */}
        {commentary && !isFinal && (
          <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '4px 14px', borderRadius: 10, ...PILL, maxWidth: 300, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.text, fontStyle: 'italic' }}>{commentary}</div>
          </div>
        )}
        {finalOverlay}
        <GameChatOverlay controlsSlot={controlsSlot} />
      </div>
    </div>
  );
}
