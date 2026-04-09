import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

const HP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const HP_COMMENTS = {
  hold: ['The bomb chose you... personally','PUFF FASTER! It\'s about to blow!','Tick tock... your turn!','Don\'t panic... actually, PANIC!','Hot hands! Pass it NOW!'],
  pass: ['Quick pass! Smart move','Strategic skip! Sent it ahead!','Away it goes... someone else\'s problem','Fast hands! Bomb transferred','YEET! That bomb is someone else\'s now'],
  skip: ['YEET! Skipped a player!','Long throw! Jumped right over them!','Power puff = power pass!','Skipped the neighbor! Big brain play'],
  explode: ['BOOM! Too slow!','KABOOM! Should\'ve puffed faster!','EXPLOSION! Held it too long!','DETONATED! That\'s gonna leave a mark!','BLEW UP! The bomb wins this round!'],
  aiPass: ['Bot yeets the bomb instantly','AI reflexes! Passed in a blink','Bot doesn\'t hesitate. Neither should you','AI passed it lightning fast'],
  win: ['SOLE SURVIVOR! The bomb fears you!','Last one standing! Legendary!','Champion! Everyone else got roasted!','WINNER! The others are toast!'],
  tension: ['The fuse is getting shorter...','Everyone\'s sweating now...','Timer shrinking... danger rising!','This round will be FAST!'],
};
const HP_AI = [
  {name:'BombBot',emoji:'\uD83E\uDD16',color:'#FF6B8A'},
  {name:'HotHands',emoji:'\uD83D\uDD25',color:'#FFD93D'},
  {name:'FuseRunner',emoji:'\uD83E\uDDE8',color:'#7CFF6B'},
  {name:'BlastZone',emoji:'\uD83D\uDCA5',color:'#C084FC'},
  {name:'TickTock',emoji:'\u23F0',color:'#60A5FA'},
  {name:'KaBoom',emoji:'\uD83D\uDCA3',color:'#FF4D8D'},
  {name:'PuffQuick',emoji:'\uD83D\uDCA8',color:'#FB923C'},
];
const HP_PLAYER_COLORS = ['#00E5FF','#FF6B8A','#FFD93D','#7CFF6B','#C084FC','#60A5FA','#FF4D8D','#FB923C'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export default function HotPotato() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, triggerShake,
    awardGame, setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [hpPhase, setHpPhase] = useState(null);
  const [hpPlayers, setHpPlayers] = useState([]);
  const [hpCurrentHolder, setHpCurrentHolder] = useState(0);
  const [hpBombTimer, setHpBombTimer] = useState(0);
  const [hpMaxTimer, setHpMaxTimer] = useState(5);
  const [hpRound, setHpRound] = useState(1);
  const [hpPassing, setHpPassing] = useState(false);
  const [hpExploded, setHpExploded] = useState(null);
  const [hpComment, setHpComment] = useState('');
  const [hpPuffHeld, setHpPuffHeld] = useState(false);
  const [hpPuffPower, setHpPuffPower] = useState(0);
  const [hpWinner, setHpWinner] = useState(null);
  const [hpEliminatedList, setHpEliminatedList] = useState([]);
  const [hpFuse, setHpFuse] = useState(1);
  const [hpPassTarget, setHpPassTarget] = useState(null);
  const [hpExplosionParticles, setHpExplosionParticles] = useState([]);

  // Refs for stale-closure safety in BLE handlers and draw callbacks
  const phaseRef = useRef(null);
  const playersRef = useRef([]);
  const currentHolderRef = useRef(0);
  const puffHeldRef = useRef(false);
  const passingRef = useRef(false);
  const passTargetRef = useRef(null);
  const fuseRef = useRef(1);
  const maxTimerRef = useRef(5);
  const bombTimerRef = useRef(0);
  const winnerRef = useRef(null);
  const roundRef = useRef(1);
  const guardRef = useRef(null);

  useEffect(() => { phaseRef.current = hpPhase; }, [hpPhase]);
  useEffect(() => { playersRef.current = hpPlayers; }, [hpPlayers]);
  useEffect(() => { currentHolderRef.current = hpCurrentHolder; }, [hpCurrentHolder]);
  useEffect(() => { puffHeldRef.current = hpPuffHeld; }, [hpPuffHeld]);
  useEffect(() => { passingRef.current = hpPassing; }, [hpPassing]);
  useEffect(() => { passTargetRef.current = hpPassTarget; }, [hpPassTarget]);
  useEffect(() => { fuseRef.current = hpFuse; }, [hpFuse]);
  useEffect(() => { maxTimerRef.current = hpMaxTimer; }, [hpMaxTimer]);
  useEffect(() => { bombTimerRef.current = hpBombTimer; }, [hpBombTimer]);
  useEffect(() => { winnerRef.current = hpWinner; }, [hpWinner]);
  useEffect(() => { roundRef.current = hpRound; }, [hpRound]);

  const hpTimerRef = useRef(null);
  const hpPuffRef = useRef(null);
  const hpPuffStart = useRef(0);
  const hpCanvasRef = useRef(null);
  const hpAnimRef = useRef(null);
  const hpBombArcProgress = useRef(0);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const drawCanvas = useCallback(() => {
    const canvas = hpCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / HP_DPR, H = canvas.height / HP_DPR;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(HP_DPR, HP_DPR);
    const now = Date.now();
    const players = playersRef.current;
    const holderIdx = currentHolderRef.current;
    const fuse = fuseRef.current;
    const phase = phaseRef.current;
    const passing = passingRef.current;
    const passTarget = passTargetRef.current;
    const maxTimer = maxTimerRef.current;
    const bombTimer = bombTimerRef.current;
    const winner = winnerRef.current;
    const isExploding = phase === 'exploding';
    const isIntro = phase === 'intro';

    // Background
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, '#0f0820'); bgGrad.addColorStop(0.5, '#080412'); bgGrad.addColorStop(1, '#020108');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H * 0.45;
    const radius = Math.min(W, H) * 0.32;

    // Neon circle ring
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,100,0,0.08)'; ctx.lineWidth = 2; ctx.stroke();
    if (fuse < 0.4) {
      ctx.beginPath(); ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,50,0,${0.15 * (1 - fuse)})`; ctx.lineWidth = 3; ctx.stroke();
    }

    if (isIntro) {
      ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF8800';
      const pulse = 1 + 0.1 * Math.sin(now / 200);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
      ctx.fillText('\uD83D\uDCA3', 0, 0); ctx.restore();
      ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#FFA500';
      ctx.fillText('HOT POTATO', cx, cy + 50);
      ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(players.length + ' players entering...', cx, cy + 72);
      ctx.restore(); return;
    }

    // Draw players in circle
    const total = players.length;
    for (let i = 0; i < total; i++) {
      const p = players[i];
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      const isHolder = i === holderIdx && !isExploding;
      const isVictim = isExploding && i === holderIdx;
      const isElim = !p.alive;
      const isTarget = i === passTarget;
      const dotR = isHolder ? 18 : isTarget ? 16 : 14;

      if (isElim) {
        ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60,60,60,0.4)'; ctx.fill();
        ctx.strokeStyle = 'rgba(100,100,100,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 6, py - 6); ctx.lineTo(px + 6, py + 6);
        ctx.moveTo(px + 6, py - 6); ctx.lineTo(px - 6, py + 6);
        ctx.strokeStyle = 'rgba(255,50,50,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillText(p.isYou ? 'YOU' : p.name, px, py + dotR + 4);
        continue;
      }

      if (isHolder) {
        const glowColor = p.isYou ? 'rgba(0,229,255,0.25)' : 'rgba(255,100,0,0.25)';
        const pulseR = dotR + 6 + 3 * Math.sin(now / 150);
        ctx.beginPath(); ctx.arc(px, py, pulseR, 0, Math.PI * 2); ctx.fillStyle = glowColor; ctx.fill();
      }
      if (isVictim) {
        const pulseR = dotR + 10 + 8 * Math.sin(now / 80);
        ctx.beginPath(); ctx.arc(px, py, pulseR, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,50,0,0.35)'; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2);
      const pColor = p.color || HP_PLAYER_COLORS[i % HP_PLAYER_COLORS.length];
      if (isHolder) {
        const g = ctx.createRadialGradient(px, py, 0, px, py, dotR);
        g.addColorStop(0, pColor); g.addColorStop(1, pColor + '80'); ctx.fillStyle = g;
      } else if (isTarget) {
        ctx.fillStyle = pColor + '90';
      } else {
        ctx.fillStyle = pColor + '60';
      }
      ctx.fill();
      ctx.strokeStyle = isHolder ? (p.isYou ? '#00E5FF' : '#FF8800') : isVictim ? '#FF0000' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isHolder ? 2.5 : 1.5; ctx.stroke();
      ctx.font = `${dotR * 0.9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText(p.emoji, px, py);
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = isHolder ? (p.isYou ? '#00E5FF' : '#FFA500') : 'rgba(255,255,255,0.6)';
      ctx.fillText(p.isYou ? 'YOU' : p.name, px, py + dotR + 4);

      if (isHolder && !isExploding) {
        const bombPulse = 1 + 0.15 * Math.sin(now / 120);
        ctx.save(); ctx.translate(px, py - dotR - 10); ctx.scale(bombPulse, bombPulse);
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('\uD83D\uDCA3', 0, 0); ctx.restore();
        for (let s = 0; s < 3; s++) {
          const sa = (now / 200 + s * 2.1) % (Math.PI * 2);
          const sr = 10 + 3 * Math.sin(now / 100 + s);
          const sx = px + Math.cos(sa) * sr, sy = py - dotR - 10 + Math.sin(sa) * sr;
          ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = ['#FF8800', '#FFCC00', '#FF4400'][s]; ctx.fill();
        }
      }
      if (isVictim) {
        ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('\uD83D\uDCA5', px, py);
        for (let r = 0; r < 12; r++) {
          const ra = (r / 12) * Math.PI * 2 + (now / 200);
          const rl = 20 + 10 * Math.sin(now / 100 + r);
          ctx.beginPath(); ctx.moveTo(px + Math.cos(ra) * dotR, py + Math.sin(ra) * dotR);
          ctx.lineTo(px + Math.cos(ra) * (dotR + rl), py + Math.sin(ra) * (dotR + rl));
          ctx.strokeStyle = `rgba(255,${100 + Math.floor(Math.random() * 100)},0,${0.6 - r * 0.04})`;
          ctx.lineWidth = 2; ctx.stroke();
        }
      }
    }

    // Bomb pass arc
    if (passing && passTarget !== null && holderIdx >= 0) {
      const fromAngle = (holderIdx / total) * Math.PI * 2 - Math.PI / 2;
      const toAngle = (passTarget / total) * Math.PI * 2 - Math.PI / 2;
      const fx = cx + Math.cos(fromAngle) * radius, fy = cy + Math.sin(fromAngle) * radius;
      const tx = cx + Math.cos(toAngle) * radius, ty = cy + Math.sin(toAngle) * radius;
      hpBombArcProgress.current = Math.min(1, hpBombArcProgress.current + 0.06);
      const t = hpBombArcProgress.current;
      const midX = (fx + tx) / 2, midY = (fy + ty) / 2 - 40;
      const bx = (1 - t) * (1 - t) * fx + 2 * (1 - t) * t * midX + t * t * tx;
      const by = (1 - t) * (1 - t) * fy + 2 * (1 - t) * t * midY + t * t * ty;
      for (let tr = 0; tr < 5; tr++) {
        const tt = Math.max(0, t - tr * 0.04);
        const tbx = (1 - tt) * (1 - tt) * fx + 2 * (1 - tt) * tt * midX + tt * tt * tx;
        const tby = (1 - tt) * (1 - tt) * fy + 2 * (1 - tt) * tt * midY + tt * tt * ty;
        ctx.beginPath(); ctx.arc(tbx, tby, 3 - tr * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${150 - tr * 20},0,${0.6 - tr * 0.1})`; ctx.fill();
      }
      ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\uD83D\uDCA3', bx, by);
    }

    // Timer bar
    const barY = 8, barH = 6, barW = W - 40, barX = 20;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 3); ctx.fill();
    const fuseW = barW * Math.max(0, fuse);
    const fuseColor = fuse > 0.6 ? '#34D399' : fuse > 0.3 ? '#FB923C' : '#FF4444';
    if (fuseW > 0) {
      const fg = ctx.createLinearGradient(barX, 0, barX + fuseW, 0);
      fg.addColorStop(0, fuseColor); fg.addColorStop(1, fuse > 0.3 ? fuseColor : '#FF0000');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.roundRect(barX, barY, fuseW, barH, 3); ctx.fill();
      ctx.shadowColor = fuseColor; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.roundRect(barX, barY, fuseW, barH, 3); ctx.fill();
      ctx.shadowBlur = 0;
    }
    const timeLeft = Math.max(0, maxTimer - bombTimer);
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = fuse > 0.3 ? 'rgba(255,255,255,0.6)' : '#FF4444';
    ctx.fillText(timeLeft.toFixed(1) + 's', W / 2, barY + barH + 3);

    // Winner confetti
    if (phase === 'result' && winner && winner.isYou) {
      for (let c = 0; c < 20; c++) {
        const cx2 = (Math.sin(now / 300 + c * 1.3) * 0.4 + 0.5) * W;
        const cy2 = ((now / 2000 + c * 0.07) % 1) * H;
        const sz = 3 + Math.sin(c) * 2;
        ctx.fillStyle = ['#FFD93D', '#FF4D8D', '#00E5FF', '#7CFF6B', '#C084FC'][c % 5];
        ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(now / 500 + c);
        ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2); ctx.restore();
      }
    }
    ctx.restore();
  }, []); // eslint-disable-line

  // Canvas loop — restarts every render (Rule 4)
  useEffect(() => {
    if (!hpCanvasRef.current || !hpPhase) return;
    if (hpAnimRef.current) cancelAnimationFrame(hpAnimRef.current);
    { const loop = () => { drawCanvas(); hpAnimRef.current = requestAnimationFrame(loop); }; hpAnimRef.current = requestAnimationFrame(loop); }
    return () => { if (hpAnimRef.current) { cancelAnimationFrame(hpAnimRef.current); hpAnimRef.current = null; } };
  });

  const hpFindNextAlive = (players, fromIdx, skip = 0) => {
    let found = 0;
    for (let i = 1; i <= players.length * 2; i++) {
      const ni = (fromIdx + i) % players.length;
      if (players[ni].alive) {
        if (found >= skip) return ni;
        found++;
      }
    }
    return null;
  };

  const hpPassBomb = useCallback((players, fromIdx, skipCount, round) => {
    if (hpTimerRef.current === null) return;
    const target = hpFindNextAlive(players, fromIdx, skipCount);
    if (target === null) return;
    setHpPassing(true); passingRef.current = true;
    setHpPassTarget(target); passTargetRef.current = target;
    hpBombArcProgress.current = 0;
    if (skipCount > 0) {
      addChat(pick(HP_COMMENTS.skip)); setHpComment(pick(HP_COMMENTS.skip)); playFx('laugh');
    } else {
      addChat(pick(HP_COMMENTS.pass)); setHpComment(pick(HP_COMMENTS.pass)); playFx('bomb_pass');
    }
    setTimeout(() => {
      if (!guardRef.current?.v) return;
      setHpCurrentHolder(target); currentHolderRef.current = target;
      setHpPassing(false); passingRef.current = false;
      setHpPassTarget(null); passTargetRef.current = null;
      hpBombArcProgress.current = 0;
      if (players[target].isAI) {
        setTimeout(() => {
          if (guardRef.current?.v && hpTimerRef.current) hpAiTurn(players, target, round);
        }, 400 + Math.random() * 1200);
      }
    }, 400);
  }, [addChat, playFx]); // eslint-disable-line

  const hpAiTurn = useCallback((players, idx, round) => {
    if (!guardRef.current?.v || hpTimerRef.current === null) return;
    addChat(players[idx].name + ': ' + pick(HP_COMMENTS.aiPass));
    setHpComment(players[idx].name + ' holds the bomb...');
    setTimeout(() => {
      if (!guardRef.current?.v || hpTimerRef.current === null) return;
      const skip = Math.random() < 0.15 ? 1 : 0;
      hpPassBomb(players, idx, skip, round);
    }, 500 + Math.random() * 1500);
  }, [addChat, hpPassBomb]);

  const hpExplodeBomb = useCallback((players, round) => {
    if (hpTimerRef.current) { clearInterval(hpTimerRef.current); hpTimerRef.current = null; }
    if (hpPuffRef.current) { clearInterval(hpPuffRef.current); hpPuffRef.current = null; }
    setHpPuffHeld(false); puffHeldRef.current = false; setHpPuffPower(0);
    setHpPhase('exploding'); phaseRef.current = 'exploding';
    setHpComment(pick(HP_COMMENTS.explode));
    triggerShake(); triggerFlash('miss'); playFx('bomb_explode');
    spawnConfetti(15, ['#FF4444', '#FF8800', '#FFCC00']);
    const parts = Array.from({ length: 24 }, (_, i) => ({
      id: Date.now() + i, x: Math.random() * 60 + 20, y: Math.random() * 40 + 30,
      size: 4 + Math.random() * 8, color: ['#FF4444','#FF8800','#FFCC00','#FF6600'][Math.floor(Math.random() * 4)], rot: Math.random() * 360,
    }));
    setHpExplosionParticles(parts);
    setTimeout(() => setHpExplosionParticles([]), 1500);

    setHpCurrentHolder(currentHolder => {
      const victim = players[currentHolder];
      setHpExploded(victim);
      addChat((victim.isYou ? 'YOU' : victim.name) + ' EXPLODED!!! ' + pick(HP_COMMENTS.explode));
      const updated = players.map((p, i) => i === currentHolder ? { ...p, alive: false } : p);
      setHpPlayers(updated); playersRef.current = updated;
      setHpEliminatedList(el => [...el, victim]);
      setHpFuse(f => Math.min(f, 0)); fuseRef.current = 0;

      setTimeout(() => {
        if (!guardRef.current?.v) return;
        const aliveCount = updated.filter(p => p.alive).length;
        if (aliveCount <= 1) {
          const winner = updated.find(p => p.alive);
          setHpWinner(winner || null); winnerRef.current = winner || null;
          setHpPhase('result'); phaseRef.current = 'result';
          if (winner && winner.isYou) {
            spawnConfetti(50, [C.orange, C.gold, C.red, C.pink]);
            playFx('win'); triggerFlash('goal');
            awardGame('hotpotato', 'win');
          } else {
            playFx('lose');
            awardGame('hotpotato', 'lose');
          }
          addChat(winner ? (winner.isYou ? 'SOLE SURVIVOR!' : winner.name + ' wins!') : 'Game over!');
          setHpComment(pick(HP_COMMENTS.win));
        } else {
          setHpPhase('next_round'); phaseRef.current = 'next_round';
          setHpComment(aliveCount + ' remain... next round!');
          addChat(aliveCount + ' players remain! Round ' + (round + 1) + ' incoming!');
          setTimeout(() => { if (guardRef.current?.v) hpStartRound(updated, round + 1); }, 2200);
        }
      }, 2200);
      return currentHolder;
    });
  }, [addChat, playFx, spawnConfetti, triggerFlash, triggerShake, awardGame]); // eslint-disable-line

  const hpStartRound = useCallback((players, round) => {
    const alive = players.filter(p => p.alive);
    if (alive.length <= 1) return;
    const maxT = Math.max(3, 8 - (round - 1) * 0.5 + (Math.random() * 2 - 1));
    setHpMaxTimer(maxT); maxTimerRef.current = maxT;
    setHpBombTimer(0); bombTimerRef.current = 0;
    setHpFuse(1); fuseRef.current = 1;
    setHpRound(round); roundRef.current = round;
    setHpPassing(false); passingRef.current = false;
    setHpExploded(null); setHpPuffHeld(false); puffHeldRef.current = false;
    setHpPuffPower(0); setHpPassTarget(null); passTargetRef.current = null;
    hpBombArcProgress.current = 0;

    const aliveIdxs = players.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
    const startHolder = aliveIdxs[Math.floor(Math.random() * aliveIdxs.length)];
    setHpCurrentHolder(startHolder); currentHolderRef.current = startHolder;
    setHpPhase('playing'); phaseRef.current = 'playing';

    if (round > 1) {
      addChat(pick(HP_COMMENTS.tension));
    } else {
      addChat('Bomb activated! Who gets it first?');
    }
    setHpComment(round > 1 ? pick(HP_COMMENTS.tension) : 'Bomb activated!');
    playFx('bomb_tick');

    const startTime = Date.now();
    if (hpTimerRef.current) clearInterval(hpTimerRef.current);
    hpTimerRef.current = setInterval(() => {
      if (!guardRef.current?.v) { clearInterval(hpTimerRef.current); return; }
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(1, elapsed / maxT);
      setHpBombTimer(elapsed); bombTimerRef.current = elapsed;
      setHpFuse(1 - pct); fuseRef.current = 1 - pct;
      if (elapsed >= maxT) {
        clearInterval(hpTimerRef.current); hpTimerRef.current = null;
        hpExplodeBomb(players, round);
      }
    }, 50);

    if (players[startHolder].isAI) {
      setTimeout(() => { if (guardRef.current?.v) hpAiTurn(players, startHolder, round); }, 600 + Math.random() * 800);
    }
  }, [addChat, playFx, hpAiTurn, hpExplodeBomb]);

  const hpTapPass = useCallback(() => {
    if (phaseRef.current !== 'playing' || puffHeldRef.current || passingRef.current) return;
    const cur = playersRef.current[currentHolderRef.current];
    if (!cur || (!cur.isYou && !cur.isHuman)) return;
    hpPassBomb(playersRef.current, currentHolderRef.current, 0, roundRef.current);
    playFx('tap');
  }, [hpPassBomb, playFx]);

  const hpStartPuff = useCallback(() => {
    if (phaseRef.current !== 'playing' || puffHeldRef.current) return;
    const cur = playersRef.current[currentHolderRef.current];
    if (!cur || (!cur.isYou && !cur.isHuman)) return;
    setHpPuffHeld(true); puffHeldRef.current = true;
    setHpPuffPower(0); hpPuffStart.current = Date.now();
    playFx('charge');
    if (hpPuffRef.current) clearInterval(hpPuffRef.current);
    hpPuffRef.current = setInterval(() => {
      const e = (Date.now() - hpPuffStart.current) / 1000;
      setHpPuffPower(Math.min(100, (e / 3.0) * 100));
    }, 50);
  }, [playFx]);

  const hpStopPuff = useCallback(() => {
    if (!puffHeldRef.current) return;
    setHpPuffHeld(false); puffHeldRef.current = false;
    if (hpPuffRef.current) { clearInterval(hpPuffRef.current); hpPuffRef.current = null; }
    const holdTime = (Date.now() - hpPuffStart.current) / 1000;
    let skip = 0;
    if (holdTime >= 3) { skip = 2; addChat('PUFF PASS! Skip 2 bonus!'); }
    else if (holdTime >= 1.5) { skip = 1; addChat('PUFF PASS! Skip 1 bonus!'); }
    setHpPuffPower(0);
    hpPassBomb(playersRef.current, currentHolderRef.current, skip, roundRef.current);
  }, [hpPassBomb, addChat]);

  const startGame = useCallback(() => {
    if (hpTimerRef.current) { clearInterval(hpTimerRef.current); hpTimerRef.current = null; }
    if (hpPuffRef.current) { clearInterval(hpPuffRef.current); hpPuffRef.current = null; }
    if (guardRef.current) guardRef.current.v = false;
    const guard = { v: true }; guardRef.current = guard;

    const aiCount = 7;
    const shuffled = [...HP_AI].sort(() => Math.random() - 0.5).slice(0, aiCount);
    const aiPlayers = shuffled.map(a => ({ ...a, isYou: false, isAI: true, isHuman: false, alive: true }));
    const youIdx = Math.floor(Math.random() * (aiPlayers.length + 1));
    aiPlayers.splice(youIdx, 0, { name: 'You', emoji: '\uD83D\uDE24', color: '#00E5FF', isYou: true, isAI: false, isHuman: false, alive: true });
    const players = aiPlayers;

    setHpPlayers(players); playersRef.current = players;
    setHpCurrentHolder(-1); currentHolderRef.current = -1;
    setHpRound(1); roundRef.current = 1;
    setHpMaxTimer(5); maxTimerRef.current = 5;
    setHpBombTimer(0); bombTimerRef.current = 0;
    setHpComment(''); setHpExploded(null); setHpWinner(null); winnerRef.current = null;
    setHpEliminatedList([]); setHpFuse(1); fuseRef.current = 1;
    setHpPuffHeld(false); puffHeldRef.current = false;
    setHpPuffPower(0); setHpPassTarget(null); passTargetRef.current = null;
    setHpPassing(false); passingRef.current = false;
    setHpExplosionParticles([]);
    hpBombArcProgress.current = 0;
    setHpPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    addChat('\uD83D\uDCA3 HOT POTATO! 8 players enter the circle!');

    setTimeout(() => { if (!guard.v) return; hpStartRound(players, 1); }, 4200);
  }, [playFx, addChat, hpStartRound]);

  // BLE handlers
  useEffect(() => {
    setBLEHandlers(0, () => hpStartPuff(), () => hpStopPuff());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => {
      if (guardRef.current) guardRef.current.v = false;
      if (hpTimerRef.current) clearInterval(hpTimerRef.current);
      if (hpPuffRef.current) clearInterval(hpPuffRef.current);
      if (hpAnimRef.current) cancelAnimationFrame(hpAnimRef.current);
    };
  }, []); // eslint-disable-line

  const curP = hpPlayers[hpCurrentHolder];
  const isYourTurn = curP && curP.isYou && hpPhase === 'playing' && !hpPassing;
  const aliveCount = hpPlayers.filter(p => p.alive).length;
  const isExploding = hpPhase === 'exploding';
  const pulseSpeed = hpFuse > 0.6 ? '2s' : hpFuse > 0.3 ? '0.8s' : '0.3s';
  const won = hpWinner && hpWinner.isYou;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}
      onMouseDown={(e) => { if (e.target.closest('[data-btn],[data-back]')) return; if (isYourTurn && !hpPuffHeld) hpStartPuff(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-btn],[data-back]')) return; if (hpPuffHeld) hpStopPuff(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-btn],[data-back]')) return; if (isYourTurn && !hpPuffHeld) hpStartPuff(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-btn],[data-back]')) return; if (hpPuffHeld) hpStopPuff(); }}
    >
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}
      {hpExplosionParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size, borderRadius: '50%', background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}`, animation: 'confettiFall 1s ease-out forwards', pointerEvents: 'none', zIndex: 200 }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #06101E 0%, #0a0400 30%, #1a0800 60%, #080200 100%)', zIndex: 0 }} />

      {/* Header */}
      <GameHeader
        backTo={() => { if (guardRef.current) guardRef.current.v = false; if (hpTimerRef.current) clearInterval(hpTimerRef.current); navigate('/arcade'); }}
        backLabel="Arcade"
        accent={C.orange}
        mid={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.orange }}>💣 HOT POTATO</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{aliveCount}/{hpPlayers.length} alive</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {hpRound}</span>
          </div>
        }
        row3={
          <div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: (hpFuse * 100) + '%', height: '100%', borderRadius: 3, transition: 'width 0.1s', background: hpFuse > 0.6 ? `linear-gradient(90deg,${C.green},${C.cyan})` : hpFuse > 0.3 ? `linear-gradient(90deg,${C.orange},${C.gold})` : `linear-gradient(90deg,${C.red},#FF0000)` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
              <span style={{ fontSize: 7, color: C.text3 }}>Fuse</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: hpFuse > 0.3 ? C.text2 : C.red, fontFamily: 'monospace' }}>{hpFuse > 0 ? Math.max(0, hpMaxTimer - hpBombTimer).toFixed(1) + 's' : 'BOOM!'}</span>
            </div>
          </div>
        }
      />

      {/* Canvas area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={hpCanvasRef} width={Math.round(420 * HP_DPR)} height={Math.round(600 * HP_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Exploding overlay */}
        {isExploding && hpExploded && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,0,0,0.6)', animation: 'fadeIn 0.3s ease', pointerEvents: 'none' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💥💀💥</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{hpExploded.isYou ? 'YOU BLEW UP!' : hpExploded.name + ' EXPLODED!'}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>{aliveCount} players remain</div>
          </div>
        )}

        {/* Next round overlay */}
        {hpPhase === 'next_round' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,4,0,0.7)', animation: 'fadeIn 0.4s ease', pointerEvents: 'none' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>Round {hpRound + 1} Coming...</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>Timer gets SHORTER!</div>
          </div>
        )}

        {/* Result overlay */}
        {hpPhase === 'result' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '👑' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : C.red }}>{won ? 'SOLE SURVIVOR!' : hpWinner ? hpWinner.name + ' WINS!' : 'Game Over!'}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>+{won ? 60 : 10} coins</div>
            <div style={{ marginTop: 14, textAlign: 'left', width: '80%', maxWidth: 260 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>ELIMINATION ORDER</div>
              {hpEliminatedList.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <span style={{ fontSize: 8, color: C.red }}>💀 #{i + 1}</span>
                  <span style={{ fontSize: 9, color: C.text2 }}>{p.isYou ? 'You' : p.name}</span>
                </div>
              ))}
              {hpWinner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <span style={{ fontSize: 8, color: C.gold }}>👑 Winner</span>
                  <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>{hpWinner.isYou ? 'You' : hpWinner.name}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {hpPuffHeld && (
          <div style={{ width: '90%', maxWidth: 300 }}>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: hpPuffPower + '%', height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${C.cyan},${C.purple})`, transition: 'width 0.05s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 7, color: C.cyan }}>Quick pass</span>
              <span style={{ fontSize: 7, color: C.gold }}>Skip 1</span>
              <span style={{ fontSize: 7, color: C.orange }}>YEET skip 2!</span>
            </div>
          </div>
        )}
        {isYourTurn && !hpPuffHeld && (
          <div style={{ display: 'flex', gap: 8, width: '90%', maxWidth: 340 }}>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); hpTapPass(); }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.orange}25,${C.red}12)`, border: `2px solid ${C.orange}40`, animation: `pulse ${pulseSpeed} infinite`, userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>TAP PASS</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Normal speed</div>
            </div>
            <div
              data-btn="true"
              onMouseDown={(e) => { e.stopPropagation(); hpStartPuff(); }}
              onMouseUp={(e) => { e.stopPropagation(); hpStopPuff(); }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); hpStartPuff(); }}
              onTouchEnd={(e) => { e.stopPropagation(); hpStopPuff(); }}
              onTouchCancel={(e) => { e.stopPropagation(); hpStopPuff(); }}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}20,${C.purple}10)`, border: `2px solid ${C.cyan}30`, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>PUFF PASS</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Hold = faster</div>
            </div>
          </div>
        )}
        {hpPhase === 'playing' && curP && curP.isAI && !hpPassing && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.15)' }}>
            <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{curP.name} holds the bomb...</span>
          </div>
        )}
        {hpPassing && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,217,61,0.08)', border: '1px solid rgba(255,217,61,0.15)' }}>
            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>Passing...</span>
          </div>
        )}
        {hpComment && <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{hpComment}</div>}
      </div>
    </div>
  );
}
