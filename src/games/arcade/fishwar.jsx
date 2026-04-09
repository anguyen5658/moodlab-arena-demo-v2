import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const FW_W = 860, FW_H = 1000;
const FW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

const FW_FORMS = [
  { name: 'Ca Chep', lvl: 1, col: '#FF9E40', body: '#E07020', form: 'fish', emoji: '🐟' },
  { name: 'Ca Noc', lvl: 2, col: '#FFD93D', body: '#CCB020', form: 'puffer', emoji: '🐡' },
  { name: 'Ca He', lvl: 3, col: '#FF6B8A', body: '#E04060', form: 'clown', emoji: '🐠' },
  { name: 'Ca Heo', lvl: 5, col: '#5BCEFA', body: '#2EA0CC', form: 'dolphin', emoji: '🐬' },
  { name: 'Ca Kiem', lvl: 7, col: '#A0D2DB', body: '#70A0B0', form: 'sword', emoji: '🗡' },
  { name: 'Ca Map', lvl: 9, col: '#64748B', body: '#475569', form: 'shark', emoji: '🦈' },
  { name: 'Ca Voi', lvl: 12, col: '#3B82F6', body: '#1E40AF', form: 'whale', emoji: '🐋' },
  { name: 'Ca Rong', lvl: 15, col: '#F59E0B', body: '#D97706', form: 'dragon', emoji: '🐉' },
];

const FW_NPC = [
  { sz: 0.5, spd: 2.0, col: '#FF9E40', body: '#E07020', pts: 4, form: 'fish' },
  { sz: 0.7, spd: 1.7, col: '#FFD93D', body: '#CCB020', pts: 6, form: 'fish' },
  { sz: 0.55, spd: 2.3, col: '#FF6B8A', body: '#E04060', pts: 5, form: 'puffer' },
  { sz: 1.0, spd: 1.3, col: '#5BCEFA', body: '#2EA0CC', pts: 10, form: 'clown' },
  { sz: 1.4, spd: 1.0, col: '#A855F7', body: '#7030B0', pts: 15, form: 'dolphin' },
  { sz: 1.8, spd: 0.8, col: '#64748B', body: '#475569', pts: 20, form: 'shark' },
  { sz: 2.5, spd: 0.6, col: '#374151', body: '#1F2937', pts: 30, form: 'shark' },
  { sz: 3.2, spd: 0.4, col: '#1E40AF', body: '#1E3A5F', pts: 45, form: 'whale' },
];

const FW_BOSSES = [
  { name: 'Mega Shark', emoji: '🦈', sz: 5.0, hp: 800, col: '#64748B', spd: 0.7 },
  { name: 'Kraken', emoji: '🐙', sz: 6.0, hp: 1000, col: '#7C3AED', spd: 0.5 },
  { name: 'Leviathan', emoji: '🐋', sz: 7.0, hp: 1200, col: '#1E40AF', spd: 0.4 },
  { name: 'Sea Dragon', emoji: '🐉', sz: 5.5, hp: 900, col: '#F59E0B', spd: 0.6 },
];

const FW_ROASTS = [
  'That fish had a FAMILY', 'EVOLUTION! Who\'s the big fish now?',
  'Blinker boost through the ocean!', 'NeonFish just got SWALLOWED',
  'The kraken is NOT happy', 'Someone call Aquaman',
  'Eat or be eaten — nature is BRUTAL', 'That was a 500 IQ swim path',
  'BlazeFin is NOT surviving this', 'Ocean said: YOU SHALL GROW',
  'The deep end just got DEEPER', 'Puff streak is COOKING',
  'That fish didn\'t even see it coming', 'Size advantage is REAL',
  'The sea is getting DANGEROUS', 'Evolution hits different',
];

const fwRoast = () => FW_ROASTS[Math.floor(Math.random() * FW_ROASTS.length)];
const fwGetForm = (lvl) => { let f = FW_FORMS[0]; for (const fm of FW_FORMS) if (lvl >= fm.lvl) f = fm; return f; };
const fwDist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const makeLightRays = () =>
  Array.from({ length: 7 }, (_, i) => ({
    x: 60 + i * 65,
    phase: i * 1.1,
    speed: 0.0008 + Math.random() * 0.0004,
    width: 25 + Math.random() * 20,
  }));

const makeNPC = (maxSz) => {
  const pool = FW_NPC.filter(n => n.sz / Math.max(1, maxSz) < 2.0);
  const cfg = pool[Math.floor(Math.random() * pool.length)] || FW_NPC[0];
  const side = Math.random() < 0.5 ? -1 : 1;
  const actualSz = cfg.sz * (0.85 + Math.random() * 0.3);
  return {
    x: side < 0 ? -25 : FW_W + 25,
    y: 35 + Math.random() * (FW_H - 90),
    sz: actualSz,
    spd: cfg.spd * (0.8 + Math.random() * 0.4),
    vx: side * cfg.spd * (0.8 + Math.random() * 0.4) * -1,
    vy: (Math.random() - 0.5) * 0.4,
    col: cfg.col, body: cfg.body, pts: cfg.pts, form: cfg.form,
    facing: side < 0 ? 1 : -1, alive: true,
  };
};

export default function FishWar() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
    bleConnected, screenFlash,
  } = useApp();

  const [phase, setPhase] = useState('modeselect');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [, setForm] = useState('fish');
  const [eaten, setEaten] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [evolution, setEvolution] = useState(null);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [alive, setAlive] = useState(true);
  const [puffStreak, setPuffStreak] = useState(0);
  const [boostVisible, setBoostVisible] = useState(false);
  const [mode, setMode] = useState('solo');

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const playerRef = useRef(null);
  const botsRef = useRef([]);
  const fishesRef = useRef([]);
  const bossRef = useRef(null);
  const bubblesRef = useRef([]);
  const particlesRef = useRef([]);
  const lightRaysRef = useRef(makeLightRays());
  const targetRef = useRef({ x: 200, y: FW_H / 2 });
  const boostRef = useRef(false);
  const puffStartRef = useRef(0);
  const gameOverRef = useRef(false);
  const puffStreakRef = useRef(0);
  const inputTypeRef = useRef('tap');
  const blinkerActive = useRef(false);
  const spawnTimer = useRef(0);
  const timeRef = useRef(0);
  const modeRef = useRef('solo');
  const phaseRef = useRef('modeselect');

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { puffStreakRef.current = puffStreak; }, [puffStreak]);

  const addChat = useCallback((msg, col) => {
    setGameChatMsgs(prev => [...prev.slice(-24), { id: Date.now() + Math.random(), text: msg, ts: Date.now(), col: col || C.cyan }]);
  }, [setGameChatMsgs]);

  const boostMult = useCallback(() => {
    if (!boostRef.current) return 1.0;
    if (blinkerActive.current) return 2.5;
    if (inputTypeRef.current === 'puff') return 2.2;
    if (inputTypeRef.current === 'dry') return 2.0;
    return 1.5;
  }, []);

  const spawnEatParticles = useCallback((x, y, col, count) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 2.5;
      particlesRef.current.push({
        x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        r: 1.5 + Math.random() * 2, life: 25 + Math.random() * 15, alpha: 0.8, col: col || '#FFD700',
      });
    }
  }, []);

  const gameOver = useCallback((won) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    playFx(won ? 'win' : 'lose');
    if (won) spawnConfetti(25);
    const tierCoins = modeRef.current === 'boss' ? 100 : modeRef.current === 'pvp' ? 80 : modeRef.current === '1v1' ? 60 : 50;
    setTimeout(() => {
      awardGame('fishwar', won ? 'win' : 'lose');
      if (won) setCoins(c => c + tierCoins);
      setPhase('complete');
    }, 1500);
  }, [playFx, spawnConfetti, awardGame, setCoins]);

  const update = useCallback(() => {
    const p = playerRef.current;
    if (!p || !p.alive) return;
    const t = ++timeRef.current;

    const dx = targetRef.current.x - p.x, dy = targetRef.current.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const boost = boostRef.current && p.fuel > 0;
    const spdMult = boostMult();
    const spd = p.spd * spdMult;
    if (d > 3) { p.x += (dx / d) * spd; p.y += (dy / d) * spd; if (dx > 0.5) p.facing = 1; if (dx < -0.5) p.facing = -1; }
    p.x = Math.max(12, Math.min(FW_W - 12, p.x));
    p.y = Math.max(12, Math.min(FW_H - 12, p.y));
    p.boosting = boost;
    if (boost) {
      p.fuel = Math.max(0, p.fuel - 1.1);
      if (p.fuel <= 0) boostRef.current = false;
      if (t % 3 === 0) bubblesRef.current.push({ x: p.x - p.facing * 10 * p.sz, y: p.y, r: 2 + Math.random() * 3, life: 40 + Math.random() * 20, alpha: 0.6 });
      if (blinkerActive.current && t % 2 === 0) bubblesRef.current.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y + (Math.random() - 0.5) * 12, r: 3 + Math.random() * 3, life: 25, alpha: 0.7 });
    } else { p.fuel = Math.min(100, p.fuel + 0.18); }
    setFuel(Math.round(p.fuel));

    const bots = botsRef.current;
    bots.forEach(bot => {
      if (!bot.alive) return;
      if (--bot.aiTimer <= 0) {
        bot.aiTimer = 30 + Math.floor(Math.random() * 40);
        const allFish = fishesRef.current.filter(f => f.alive);
        let bestTarget = null, bestScore = -1, flee = false;
        if (p.alive && p.sz > bot.sz * 1.15 && fwDist(p, bot) < 120) { bot.targetX = bot.x - (p.x - bot.x); bot.targetY = bot.y - (p.y - bot.y); flee = true; }
        if (!flee) bots.forEach(ob => { if (ob === bot || !ob.alive) return; if (ob.sz > bot.sz * 1.15 && fwDist(ob, bot) < 120) { bot.targetX = bot.x - (ob.x - bot.x); bot.targetY = bot.y - (ob.y - bot.y); flee = true; } });
        if (!flee) {
          allFish.forEach(f => { if (f.sz < bot.sz * 0.95) { const sc = f.pts / (fwDist(f, bot) + 50); if (sc > bestScore) { bestScore = sc; bestTarget = f; } } });
          if (p.alive && p.sz < bot.sz * 0.9 && fwDist(p, bot) < 200) { bestTarget = p; bestScore = 999; }
          if (bestTarget) { bot.targetX = bestTarget.x; bot.targetY = bestTarget.y; } else { bot.targetX = Math.random() * FW_W; bot.targetY = Math.random() * FW_H; }
        }
      }
      const bdx = bot.targetX - bot.x, bdy = bot.targetY - bot.y;
      const bd = Math.sqrt(bdx * bdx + bdy * bdy);
      const bBoost = bot.fuel > 30 && bd > 80;
      if (bBoost) { bot.fuel = Math.max(0, bot.fuel - 0.8); } else { bot.fuel = Math.min(100, bot.fuel + 0.12); }
      bot.boosting = bBoost; const bSpd = bot.spd * (bBoost ? 2.2 : 1);
      if (bd > 3) { bot.x += (bdx / bd) * bSpd; bot.y += (bdy / bd) * bSpd; if (bdx > 0.5) bot.facing = 1; if (bdx < -0.5) bot.facing = -1; }
      bot.x = Math.max(12, Math.min(FW_W - 12, bot.x));
      bot.y = Math.max(12, Math.min(FW_H - 12, bot.y));
      if (bBoost && t % 4 === 0) bubblesRef.current.push({ x: bot.x - bot.facing * 8, y: bot.y, r: 2 + Math.random() * 2, life: 30, alpha: 0.4 });
    });

    const fishes = fishesRef.current;
    fishes.forEach(f => {
      if (!f.alive) return;
      f.x += f.vx; f.y += f.vy;
      if (f.sz > p.sz * 1.15 && fwDist(p, f) < 130) { f.vx += (p.x - f.x) / fwDist(p, f) * 0.018; f.vy += (p.y - f.y) / fwDist(p, f) * 0.008; f.vx = Math.max(-2.5, Math.min(2.5, f.vx)); }
      if (f.x < -40 || f.x > FW_W + 40 || f.y < -40 || f.y > FW_H + 40) f.alive = false;
    });

    // Player eats NPC
    fishes.forEach(f => {
      if (!f.alive || !p.alive) return;
      const cd = (12 * p.sz + 12 * f.sz) * 0.5;
      if (fwDist(p, f) < cd) {
        if (p.sz > f.sz * 1.1) {
          f.alive = false;
          let scoreBonus = 1.0;
          const iType = inputTypeRef.current, isBlinker = blinkerActive.current;
          if (boostRef.current && iType === 'puff') {
            scoreBonus = isBlinker ? 1.20 : 1.15;
            const newStreak = Math.min(5, (puffStreakRef.current || 0) + 1);
            puffStreakRef.current = newStreak; setPuffStreak(newStreak);
            scoreBonus *= (1 + newStreak * 0.02);
          } else if (boostRef.current && iType === 'dry') { scoreBonus = 1.05; } else { if (puffStreakRef.current > 0) { puffStreakRef.current = 0; setPuffStreak(0); } }
          const pts = Math.round(f.pts * scoreBonus);
          p.score += pts; p.eaten++; p.sz += f.sz * 0.06; p.spd = 3 + p.level * 0.12;
          const newLvl = Math.floor(p.eaten / 5) + 1;
          if (newLvl > p.level) {
            p.level = newLvl; const nf = fwGetForm(newLvl);
            if (nf.form !== p.form) {
              p.form = nf.form; p.col = nf.col; p.body = nf.body;
              setEvolution({ form: nf.form, name: nf.name, emoji: nf.emoji });
              playFx('crowd'); setForm(nf.form);
              addChat('EVOLUTION! ' + nf.name + ' unlocked! ' + nf.emoji, C.gold);
              triggerFlash('goal'); setTimeout(() => setEvolution(null), 2500);
            } else { playFx('select'); addChat('Level ' + newLvl + '! Keep eating!', C.cyan); }
          }
          setScore(p.score); setLevel(p.level); setEaten(p.eaten);
          playFx('tap'); spawnEatParticles(f.x, f.y, f.col, 5);
          for (let i = 0; i < 3; i++) bubblesRef.current.push({ x: f.x, y: f.y, r: 3 + Math.random() * 3, life: 30, alpha: 0.5 });
          if (f.sz >= 1.0 && Math.random() < 0.5) addChat(fwRoast(), C.text2);
          if (isBlinker && Math.random() < 0.7) addChat('Blinker boost through the ocean!', C.gold);
        } else if (f.sz > p.sz * 1.1) {
          p.alive = false; setAlive(false); addChat('You got EATEN!', '#EF4444'); gameOver(false);
        }
      }
    });

    // Bot collisions
    bots.forEach(bot => {
      if (!bot.alive) return;
      fishes.forEach(f => {
        if (!f.alive) return;
        const cd = (12 * bot.sz + 12 * f.sz) * 0.5;
        if (fwDist(bot, f) < cd && bot.sz > f.sz * 1.1) {
          f.alive = false; bot.score += f.pts; bot.eaten++; bot.sz += f.sz * 0.06;
          const nl = Math.floor(bot.eaten / 5) + 1;
          if (nl > bot.level) { bot.level = nl; const nf = fwGetForm(nl); bot.form = nf.form; bot.col = nf.col; bot.body = nf.body; bot.spd = 3 + nl * 0.12; if (Math.random() < 0.3) addChat(bot.name + ' evolved to ' + nf.name + '!', bot.col); }
        }
      });
      if (p.alive) { const cd = (12 * bot.sz + 12 * p.sz) * 0.5; if (fwDist(bot, p) < cd && bot.sz > p.sz * 1.1) { p.alive = false; setAlive(false); addChat(bot.name + ' swallowed you!', '#EF4444'); gameOver(false); } }
      bots.forEach(ob => {
        if (ob === bot || !ob.alive) return;
        if (modeRef.current === 'boss' && ob.team === bot.team) return;
        const cd = (12 * bot.sz + 12 * ob.sz) * 0.5;
        if (fwDist(bot, ob) < cd && bot.sz > ob.sz * 1.1) { ob.alive = false; bot.score += Math.round(ob.sz * 10); bot.eaten++; bot.sz += ob.sz * 0.06; addChat(bot.name + ' ate ' + ob.name + '!', bot.col); }
      });
    });

    // Boss
    if (bossRef.current && bossRef.current.alive) {
      const boss = bossRef.current;
      let nearest = p.alive ? p : null; let nd = p.alive ? fwDist(boss, p) : 9999;
      bots.forEach(b => { if (b.alive && b.team === 0) { const d = fwDist(boss, b); if (d < nd) { nd = d; nearest = b; } } });
      if (nearest) {
        const bdx = nearest.x - boss.x, bdy = nearest.y - boss.y;
        const bd = Math.sqrt(bdx * bdx + bdy * bdy);
        boss.x += (bdx / bd) * boss.spd; boss.y += (bdy / bd) * boss.spd;
        if (bdx > 0) boss.facing = 1; if (bdx < 0) boss.facing = -1;
        if (bd < (12 * boss.sz + 12 * nearest.sz) * 0.4) {
          if (nearest === p) { p.alive = false; setAlive(false); addChat(boss.name + ' ate you!', '#EF4444'); gameOver(false); } else { nearest.alive = false; addChat(boss.name + ' devoured ' + nearest.name + '!', '#EF4444'); }
        }
      }
      const attackers = [p, ...bots].filter(a => a && a.alive && a.sz > 3.0);
      attackers.forEach(a => {
        if (fwDist(a, boss) < (12 * a.sz + 12 * boss.sz) * 0.5) {
          let dmg = Math.round(a.sz * 8);
          if (a === p && boostRef.current) {
            if (blinkerActive.current) dmg = Math.round(dmg * 1.20);
            else if (inputTypeRef.current === 'puff') dmg = Math.round(dmg * 1.15);
            else if (inputTypeRef.current === 'dry') dmg = Math.round(dmg * 1.05);
          }
          boss.hp = Math.max(0, boss.hp - dmg);
          setBossHp(boss.hp);
          if (a === p) { setScore(s => s + dmg); playFx('select'); if (Math.random() < 0.4) addChat('Hit ' + boss.name + ' for ' + dmg + '!', C.gold); }
          if (boss.hp <= 0) { boss.alive = false; playFx('crowd'); spawnConfetti(40); triggerFlash('goal'); addChat(boss.name + ' DEFEATED! VICTORY!', C.gold); gameOver(true); }
        }
      });
    }

    // Win conditions
    if (modeRef.current === 'solo' && p.score >= 500 && !gameOverRef.current) { addChat('500 pts! VICTORY!', C.gold); gameOver(true); }
    if (modeRef.current === '1v1' && bots.length > 0 && !bots[0].alive && p.alive && !gameOverRef.current) { addChat('Enemy fish eliminated!', C.gold); gameOver(true); }
    if (modeRef.current === 'pvp') { const aliveCount = bots.filter(b => b.alive).length; if (aliveCount === 0 && p.alive && !gameOverRef.current) { addChat('Last fish standing!', C.gold); gameOver(true); } }

    const spawnInterval = Math.max(18, 55 - t * 0.002);
    if (++spawnTimer.current >= spawnInterval && fishes.filter(f => f.alive).length < 28) {
      spawnTimer.current = 0;
      const maxSz = Math.max(p.sz, ...bots.filter(b => b.alive).map(b => b.sz));
      fishes.push(makeNPC(maxSz));
    }
    bubblesRef.current = bubblesRef.current.filter(b => { b.y -= 0.5; b.r += 0.02; b.life--; b.alpha -= 0.015; return b.life > 0 && b.alpha > 0; });
    particlesRef.current = particlesRef.current.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy -= 0.02; pt.life--; pt.alpha -= 0.03; return pt.life > 0 && pt.alpha > 0; });
    fishesRef.current = fishes.filter(f => f.alive);
  }, [boostMult, spawnEatParticles, gameOver, playFx, triggerFlash, spawnConfetti, addChat]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(FW_DPR, FW_DPR);
    const w = FW_W, h = FW_H, now = Date.now();

    // Ocean gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#062040'); bg.addColorStop(0.15, '#0a3060');
    bg.addColorStop(0.5, '#082848'); bg.addColorStop(0.8, '#061830'); bg.addColorStop(1, '#041828');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // Light rays
    ctx.save();
    lightRaysRef.current.forEach(ray => {
      const rx = ray.x + Math.sin(now * ray.speed + ray.phase) * 20;
      const alpha = Math.max(0.01, 0.03 + Math.sin(now * 0.0005 + ray.phase) * 0.015);
      ctx.globalAlpha = alpha;
      const rayG = ctx.createLinearGradient(rx, 0, rx, h * 0.7);
      rayG.addColorStop(0, '#5BC8FF'); rayG.addColorStop(0.4, '#3090CC'); rayG.addColorStop(1, 'transparent');
      ctx.fillStyle = rayG;
      ctx.beginPath(); ctx.moveTo(rx - ray.width / 2, 0); ctx.lineTo(rx - ray.width * 1.2, h * 0.7);
      ctx.lineTo(rx + ray.width * 1.2, h * 0.7); ctx.lineTo(rx + ray.width / 2, 0); ctx.closePath(); ctx.fill();
    });
    ctx.restore();

    // Caustics
    ctx.save(); ctx.globalAlpha = 0.025;
    for (let i = 0; i < 8; i++) {
      const cx = 50 + i * 55 + Math.sin(now * 0.001 + i * 0.7) * 12;
      const cy = h * 0.88 + Math.cos(now * 0.0008 + i) * 5;
      ctx.fillStyle = '#5BC8FF'; ctx.beginPath();
      ctx.ellipse(cx, cy, 15 + Math.sin(now * 0.002 + i) * 5, 8, Math.sin(now * 0.001 + i) * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Seabed
    const sb = ctx.createLinearGradient(0, h * 0.85, 0, h);
    sb.addColorStop(0, 'transparent'); sb.addColorStop(0.2, '#0a2a10'); sb.addColorStop(0.6, '#082008'); sb.addColorStop(1, '#061a08');
    ctx.fillStyle = sb; ctx.fillRect(0, h * 0.85, w, h * 0.15);
    ctx.fillStyle = '#0d3012';
    for (let i = 0; i < 7; i++) { const rx = 30 + i * 65 + Math.sin(i * 2.1) * 15; ctx.beginPath(); ctx.ellipse(rx, h - 4, 12 + i * 3, 6 + i * 1.5, 0, Math.PI, 0); ctx.fill(); }

    // Seaweed + coral
    for (let i = 0; i < 8; i++) {
      const sx = 25 + i * 55;
      if (i % 3 === 0) {
        ctx.fillStyle = ['#E04060', '#FF6B8A', '#FF9E40'][i % 3];
        const ch = 20 + i * 4;
        for (let b = 0; b < 3; b++) {
          const ba = (-0.4 + b * 0.4) + Math.sin(now * 0.001 + i) * 0.05;
          ctx.beginPath(); ctx.moveTo(sx, h);
          ctx.quadraticCurveTo(sx + Math.sin(ba) * ch * 0.5, h - ch * 0.6, sx + Math.sin(ba) * ch * 0.3, h - ch);
          ctx.quadraticCurveTo(sx + Math.sin(ba) * ch * 0.5 - 3, h - ch * 0.6, sx, h); ctx.fill();
        }
      } else {
        ctx.strokeStyle = ['#1a6a25', '#1d7a2a', '#167020'][i % 3]; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sx, h);
        const swH = 35 + i * 7;
        for (let y = h; y > h - swH; y -= 4) { ctx.lineTo(sx + Math.sin(y * 0.04 + now * 0.002 + i * 1.3) * 9, y); }
        ctx.stroke();
      }
    }

    // Bubbles
    bubblesRef.current.forEach(b => {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,200,255,${Math.max(0, b.alpha)})`; ctx.fill();
      if (b.r > 2) { ctx.fillStyle = `rgba(255,255,255,${Math.max(0, b.alpha * 0.4)})`; ctx.beginPath(); ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2); ctx.fill(); }
    });

    // Eat particles
    particlesRef.current.forEach(pt => {
      ctx.fillStyle = `rgba(255,215,0,${Math.max(0, pt.alpha)})`; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    });

    // Entities sorted by size
    const p = playerRef.current;
    const entities = [];
    fishesRef.current.forEach(f => { if (f.alive) entities.push({ ...f, type: 'npc' }); });
    botsRef.current.forEach(b => { if (b.alive) entities.push({ ...b, type: 'bot' }); });
    if (p && p.alive) entities.push({ ...p, type: 'player' });
    if (bossRef.current && bossRef.current.alive) entities.push({ ...bossRef.current, type: 'boss' });
    entities.sort((a, b) => a.sz - b.sz);

    entities.forEach(e => {
      const R = 12 * e.sz; const ex = e.x, ey = e.y;
      ctx.save(); ctx.translate(ex, ey); if (e.facing === -1) ctx.scale(-1, 1);

      if (e.type === 'player' && blinkerActive.current) {
        ctx.save(); ctx.globalAlpha = 0.15 + Math.sin(now * 0.008) * 0.08;
        const blG = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 2.5);
        blG.addColorStop(0, '#FFD700'); blG.addColorStop(0.5, '#FF8C00'); blG.addColorStop(1, 'transparent');
        ctx.fillStyle = blG; ctx.beginPath(); ctx.arc(0, 0, R * 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Body
      ctx.fillStyle = e.col; ctx.beginPath(); ctx.ellipse(0, 0, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      // Sheen
      ctx.save(); ctx.globalAlpha = 0.15;
      const sheen = ctx.createLinearGradient(-R, -R * 0.4, R, R * 0.4);
      sheen.addColorStop(0, '#fff'); sheen.addColorStop(0.5, 'transparent'); sheen.addColorStop(1, 'transparent');
      ctx.fillStyle = sheen; ctx.beginPath(); ctx.ellipse(0, -R * 0.1, R * 0.8, R * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // Tail
      const tw = Math.sin(now * 0.008 * (e.boosting ? 2.5 : 1)) * R * 0.18;
      ctx.fillStyle = e.body || e.col; ctx.beginPath(); ctx.moveTo(-R * 0.8, 0); ctx.lineTo(-R * 1.3 + tw, -R * 0.4); ctx.lineTo(-R * 1.3 + tw, R * 0.4); ctx.closePath(); ctx.fill();
      // Eye
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R * 0.4, -R * 0.15, R * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(R * 0.45, -R * 0.15, R * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(R * 0.43, -R * 0.2, R * 0.04, 0, Math.PI * 2); ctx.fill();
      // Dorsal fin
      ctx.fillStyle = e.body || e.col; ctx.beginPath(); ctx.moveTo(0, -R * 0.5); ctx.lineTo(-R * 0.3, -R * 0.9); ctx.lineTo(R * 0.2, -R * 0.5); ctx.closePath(); ctx.fill();
      // Pelvic fin
      ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(R * 0.1, R * 0.2); ctx.lineTo(R * 0.05, R * 0.55); ctx.lineTo(-R * 0.25, R * 0.3); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1.0;
      // Gill line
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(R * 0.7, R * 0.05, R * 0.12, 0.2, Math.PI * 0.6); ctx.stroke();

      // Form-specific details
      if (e.form === 'puffer') { ctx.strokeStyle = e.col; ctx.lineWidth = 1; for (let s = 0; s < 8; s++) { const a = s * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.4); ctx.lineTo(Math.cos(a) * R * (e.boosting ? 1.2 : 1.0), Math.sin(a) * R * (e.boosting ? 0.8 : 0.6)); ctx.stroke(); } }
      if (e.form === 'clown') { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let s = 0; s < 3; s++) ctx.fillRect(-R * 0.3 + s * R * 0.4, -R * 0.5, R * 0.12, R * 1.0); }
      if (e.form === 'sword') { ctx.fillStyle = e.col; ctx.beginPath(); ctx.moveTo(R * 0.6, -R * 0.04); ctx.lineTo(R * 1.5, 0); ctx.lineTo(R * 0.6, R * 0.04); ctx.closePath(); ctx.fill(); }
      if (e.form === 'shark') { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(0, R * 0.15, R * 0.7, R * 0.25, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = e.body || e.col; ctx.beginPath(); ctx.moveTo(-R * 0.1, -R * 0.5); ctx.lineTo(R * 0.15, -R * 1.1); ctx.lineTo(R * 0.35, -R * 0.5); ctx.closePath(); ctx.fill(); }
      if (e.form === 'dolphin') { ctx.fillStyle = e.body || e.col; ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.1); ctx.quadraticCurveTo(R * 0.8, -R * 0.4, R * 1.0, -R * 0.05); ctx.lineTo(R * 0.5, 0); ctx.closePath(); ctx.fill(); }
      if (e.form === 'whale') {
        ctx.fillStyle = 'rgba(200,220,255,0.25)'; ctx.beginPath(); ctx.ellipse(R * 0.1, R * 0.1, R * 0.5, R * 0.2, 0, 0, Math.PI); ctx.fill();
        if (e.boosting) { ctx.fillStyle = 'rgba(100,200,255,0.4)'; ctx.beginPath(); ctx.moveTo(0, -R * 0.6); ctx.lineTo(-R * 0.15, -R * 1.5); ctx.lineTo(R * 0.15, -R * 1.5); ctx.closePath(); ctx.fill(); }
      }
      if (e.form === 'dragon') {
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(R * 0.5, R * 0.1); ctx.quadraticCurveTo(R * 1.0, R * 0.5, R * 0.8, R * 0.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.1); ctx.quadraticCurveTo(R * 1.0, -R * 0.5, R * 0.8, -R * 0.35); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.moveTo(R * 0.2, -R * 0.5); ctx.lineTo(R * 0.3, -R * 1.0); ctx.lineTo(R * 0.45, -R * 0.5); ctx.closePath(); ctx.fill();
        if (e.boosting) { ctx.fillStyle = 'rgba(255,100,0,0.5)'; ctx.beginPath(); ctx.moveTo(R * 0.8, 0); ctx.lineTo(R * 1.8 + Math.sin(now * 0.02) * 5, -R * 0.25); ctx.lineTo(R * 1.8 + Math.sin(now * 0.02) * 5, R * 0.25); ctx.closePath(); ctx.fill(); }
      }
      ctx.restore();

      // Eat/threat indicators
      if (p && p.alive && e.type === 'npc') {
        if (e.sz < p.sz * 0.95) { ctx.fillStyle = 'rgba(124,255,107,0.35)'; ctx.beginPath(); ctx.arc(ex, ey - R - 5, 3, 0, Math.PI * 2); ctx.fill(); }
        else if (e.sz > p.sz * 1.1) { const wa = Math.sin(now * 0.005) * 0.3 + 0.5; ctx.fillStyle = `rgba(255,90,90,${wa * 0.5})`; ctx.beginPath(); ctx.arc(ex, ey - R - 5, 3.5, 0, Math.PI * 2); ctx.fill(); }
      }
      if (e.type === 'player' || e.type === 'bot') {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3;
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(e.type === 'player' ? 'You' : e.name, ex, ey - R - 10);
        ctx.font = '7px sans-serif'; ctx.fillText('Lv' + Math.floor(e.eaten / 5 + 1), ex, ey - R - 2);
        ctx.restore();
      }
      if (e.type === 'boss') {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(e.emoji + ' ' + e.name, ex, ey - R * 1.2 - 12); ctx.restore();
        const barW = R * 2, barH = 4, bx = ex - barW / 2, by = ey - R * 1.2 - 6;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = e.col; ctx.fillRect(bx, by, barW * (e.hp / ((e.maxHp || e.hp) || 1)), barH);
      }
      if (e.type === 'player') {
        const glowCol = blinkerActive.current ? 'rgba(255,215,0,' : 'rgba(0,229,255,';
        ctx.strokeStyle = glowCol + (0.15 + Math.sin(now * 0.004) * 0.1) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(ex, ey, R + 5, R * 0.6 + 5, 0, 0, Math.PI * 2); ctx.stroke();
        if (boostRef.current) {
          ctx.strokeStyle = glowCol + (0.08 + Math.sin(now * 0.008) * 0.06) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(ex, ey, R + 10, R * 0.6 + 10, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
    });

    ctx.restore();
  }, []); // eslint-disable-line

  const startGame = useCallback((m) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setMode(m); modeRef.current = m;
    setScore(0); setLevel(1); setForm('fish'); setEaten(0); setFuel(100);
    setEvolution(null); setAlive(true); setBossHp(0); setBossMaxHp(0);
    setPuffStreak(0); setBoostVisible(false);
    gameOverRef.current = false; boostRef.current = false; puffStartRef.current = 0;
    puffStreakRef.current = 0; inputTypeRef.current = 'tap'; blinkerActive.current = false;
    bubblesRef.current = []; particlesRef.current = [];
    spawnTimer.current = 0; timeRef.current = 0;

    const p = { x: 100, y: FW_H / 2, sz: 1.0, spd: 3, facing: 1, level: 1, eaten: 0, score: 0, form: 'fish', fuel: 100, boosting: false, col: '#00E5FF', body: '#0090A0', alive: true };
    playerRef.current = p; targetRef.current = { x: 200, y: FW_H / 2 };

    const botNames = ['BlazeFin', 'NeonFish', 'PuffGill', 'CoralKing'];
    const bots = [];
    if (m === '1v1') { bots.push({ x: FW_W - 100, y: FW_H / 2, sz: 1.0, spd: 3, facing: -1, level: 1, eaten: 0, score: 0, form: 'fish', fuel: 100, boosting: false, col: '#EF4444', body: '#B91C1C', alive: true, name: botNames[0], aiTimer: 0, targetX: FW_W / 2, targetY: FW_H / 2 }); }
    else if (m === 'pvp') { for (let i = 0; i < 3; i++) bots.push({ x: 80 + i * 120, y: 100 + i * 100, sz: 1.0, spd: 3, facing: 1, level: 1, eaten: 0, score: 0, form: 'fish', fuel: 100, boosting: false, col: ['#EF4444', '#F59E0B', '#A855F7'][i], body: ['#B91C1C', '#D97706', '#7C3AED'][i], alive: true, name: botNames[i], aiTimer: 0, targetX: FW_W / 2, targetY: FW_H / 2 }); }
    else if (m === 'boss') { for (let i = 0; i < 3; i++) bots.push({ x: 60 + i * 50, y: FW_H / 2 - 60 + i * 60, sz: 1.0, spd: 3, facing: 1, level: 1, eaten: 0, score: 0, form: 'fish', fuel: 100, boosting: false, col: ['#4CAF50', '#66BB6A', '#81C784'][i], body: ['#2E7D32', '#388E3C', '#43A047'][i], alive: true, name: botNames[i + 1], aiTimer: 0, targetX: FW_W / 2, targetY: FW_H / 2, team: 0 }); }
    botsRef.current = bots;

    if (m === 'boss') { const b = FW_BOSSES[Math.floor(Math.random() * FW_BOSSES.length)]; const boss = { ...b, x: FW_W - 60, y: FW_H / 2, alive: true, facing: -1, maxHp: b.hp }; bossRef.current = boss; setBossHp(boss.hp); setBossMaxHp(boss.hp); } else { bossRef.current = null; }

    const fishes = []; for (let i = 0; i < 10; i++) fishes.push(makeNPC(1.0)); fishesRef.current = fishes;
    addChat(m === 'boss' ? 'Team up! Defeat the sea boss!' : m === 'pvp' ? 'Last fish standing wins!' : m === '1v1' ? 'Eliminate the enemy fish!' : 'Eat to 500 pts!', C.cyan);

    setPhase('playing'); phaseRef.current = 'playing'; playFx('crowd');

    const loop = () => { if (gameOverRef.current) return; update(); drawCanvas(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  }, [update, drawCanvas, playFx, addChat]);

  const puffStart = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    boostRef.current = true; puffStartRef.current = Date.now();
    inputTypeRef.current = bleConnected ? 'puff' : 'dry';
    setBoostVisible(true);
  }, [bleConnected]);

  const puffStop = useCallback(() => {
    const dur = puffStartRef.current ? (Date.now() - puffStartRef.current) / 1000 : 0;
    boostRef.current = false; puffStartRef.current = 0;
    setBoostVisible(false);
    if (dur >= 5.0 && inputTypeRef.current === 'puff') {
      blinkerActive.current = true; setBoostVisible(true);
      addChat('BLINKER ACTIVATED! 2.5x speed + 20% bonus!', C.gold);
      triggerFlash('goal');
      setTimeout(() => { blinkerActive.current = false; setBoostVisible(false); }, 3000);
    }
  }, [addChat, triggerFlash]);

  const handleClick = useCallback((e) => {
    if (e.target.closest('[data-back],[data-btn]')) return;
    if (phaseRef.current !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    targetRef.current = {
      x: (e.clientX - rect.left) * (FW_W / rect.width),
      y: (e.clientY - rect.top) * (FW_H / rect.height),
    };
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('[data-back],[data-btn]')) return;
    e.preventDefault();
    if (phaseRef.current !== 'playing') return;
    puffStart();
    if (canvasRef.current && e.touches[0]) {
      const rect = canvasRef.current.getBoundingClientRect();
      targetRef.current = {
        x: (e.touches[0].clientX - rect.left) * (FW_W / rect.width),
        y: (e.touches[0].clientY - rect.top) * (FW_H / rect.height),
      };
    }
  }, [puffStart]);

  const handleTouchEnd = useCallback((e) => {
    if (e.target.closest('[data-back],[data-btn]')) return;
    e.preventDefault(); puffStop();
  }, [puffStop]);

  useEffect(() => {
    setBLEHandlers(0, () => puffStart(), () => puffStop());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const GC = '#3B82F6';
  const GLASS = { background: 'rgba(3,7,20,0.7)', backdropFilter: 'blur(6px)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12 };
  const fwForm = fwGetForm(level);

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={handleClick}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; if (phaseRef.current === 'playing') puffStart(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; puffStop(); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Canvas background */}
      {phase === 'playing' && (
        <canvas ref={canvasRef} width={Math.round(FW_W * FW_DPR)} height={Math.round(FW_H * FW_DPR)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
      )}
      {phase !== 'playing' && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #041828 0%, #0a3060 30%, #082848 60%, #062040 100%)', zIndex: 1 }} />
      )}

      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(255,215,0,0.3)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}><span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
            <span style={{ fontSize: 9 }}>🪙</span><span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>FISH WAR</span>
          </div>
        </div>
        <div style={{ padding: '3px 12px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div data-back="true" onClick={(e) => { e.stopPropagation(); if (rafRef.current) cancelAnimationFrame(rafRef.current); navigate('/arcade'); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Arcade</span>
          </div>
          {phase === 'playing' && (<>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <span style={{ fontSize: 10 }}>{fwForm.emoji || '🐟'}</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: fwForm.col }}>{fwForm.name}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.cyan, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,229,255,0.08)' }}>LV{level}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#FFD700' }}>🪙{score}</span>
            </div>
            {puffStreak > 0 && <span style={{ fontSize: 8, fontWeight: 900, color: C.gold, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,100,0,0.15)', border: '1px solid rgba(255,150,0,0.25)', flexShrink: 0 }}>🔥{puffStreak}x</span>}
          </>)}
        </div>
        {phase === 'playing' && (
          <div style={{ padding: '0 12px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 7, fontWeight: 800, color: fuel > 50 ? C.cyan : fuel > 20 ? '#F59E0B' : '#EF4444', flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: fuel + '%', borderRadius: 2, background: fuel > 50 ? 'linear-gradient(90deg, #00E5FF, #0090FF)' : fuel > 20 ? 'linear-gradient(90deg, #F59E0B, #FF9800)' : 'linear-gradient(90deg, #EF4444, #FF1744)', transition: 'width 0.15s' }} />
              </div>
              <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{fuel}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {phase === 'playing' && (<>
          {bossHp > 0 && (
            <div style={{ position: 'absolute', top: 8, left: 12, right: 12, zIndex: 50, pointerEvents: 'none' }}>
              <div style={{ ...GLASS, padding: '4px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11 }}>{bossRef.current?.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: bossRef.current?.col }}>{bossRef.current?.name}</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>{bossHp}/{bossMaxHp}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (bossHp / bossMaxHp * 100) + '%', borderRadius: 3, background: `linear-gradient(90deg, ${bossRef.current?.col || '#EF4444'}, #FF0000)`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          )}

          {evolution && (
            <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 100, pointerEvents: 'none' }}>
              <div style={{ ...GLASS, padding: '16px 32px', textAlign: 'center', border: `2px solid ${C.gold}`, boxShadow: `0 0 40px ${C.gold}30`, animation: 'pulse 0.5s infinite' }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{evolution.emoji || '✨'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, letterSpacing: 2 }}>EVOLUTION!</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 4 }}>{evolution.name}</div>
              </div>
            </div>
          )}

          {boostVisible && fuel > 0 && (
            <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none' }}>
              <div style={{ ...GLASS, padding: '3px 12px', background: blinkerActive.current ? 'rgba(255,150,0,0.25)' : 'rgba(0,229,255,0.15)', border: blinkerActive.current ? '1px solid rgba(255,200,0,0.4)' : '1px solid rgba(0,229,255,0.3)' }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: blinkerActive.current ? C.gold : C.cyan }}>{blinkerActive.current ? '🔥 BLINKER 2.5x' : '💨 BOOST ' + boostMult().toFixed(1) + 'x'}</span>
              </div>
            </div>
          )}

          {timeRef.current < 180 && (
            <div style={{ position: 'absolute', bottom: '28%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none' }}>
              <div style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(6,16,30,0.7)', border: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(6px)' }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Tap to move · Hold for boost · Puff for 2.2x speed!</span>
              </div>
            </div>
          )}
        </>)}

        {/* Mode select */}
        {phase === 'modeselect' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #3B82F6, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>FISH WAR</div>
            <div style={{ fontSize: 48, marginBottom: 8, animation: 'gentleFloat 2s infinite' }}>🐟</div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 16 }}>Choose your ocean</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 300 }}>
              {[
                { m: 'solo', emoji: '🐟', name: 'Solo Survival', sub: 'Eat to 500 pts', color: GC },
                { m: '1v1', emoji: '🎯', name: '1v1 Duel', sub: 'Eliminate the bot', color: C.cyan },
                { m: 'pvp', emoji: '💀', name: 'PvP Free-for-All', sub: 'Last fish standing', color: '#EF4444' },
                { m: 'boss', emoji: '🐉', name: 'Boss Battle', sub: 'Defeat the sea boss', color: C.gold },
              ].map(b => (
                <div key={b.m} data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(b.m); }}
                  style={{ padding: '14px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', ...GLASS, background: `${b.color}08`, border: `1px solid ${b.color}25` }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: b.color }}>{b.name}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete screen */}
        {phase === 'complete' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ ...GLASS, padding: '24px 32px', textAlign: 'center', maxWidth: 340, width: '100%', border: alive ? `1px solid ${C.gold}30` : `1px solid #EF444430` }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{alive ? '🏆' : '💀'}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: alive ? C.gold : '#EF4444', marginBottom: 8 }}>{alive ? 'VICTORY!' : 'EATEN!'}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Score: {score}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>Level {level} · {fwForm.name} · {eaten} fish eaten</div>
              {puffStreak > 0 && <div style={{ fontSize: 10, color: C.gold, marginTop: 4 }}>Best Puff Streak: x{puffStreak}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); setPhase('modeselect'); }}
                  style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${GC}15`, border: `1px solid ${GC}30`, fontSize: 13, fontWeight: 800, color: GC }}>Play Again</div>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade'); }}
                  style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
              </div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }}
                style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 10, width: '100%' }}>👤 My Progress</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
