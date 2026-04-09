import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

// ── Constants ──────────────────────────────────────────────────────────────
const TW_W = 860, TW_H = 600;
const TW_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const TW_GRAVITY = 0.26;
const TW_WIND_FACTOR = 0.018;
const TW_TURN_TIME = 22;
const TW_ZONES = [
  { k: 'low',   mn: 0,  mx: 15,  dmg: 14, cr: 0.04, color: '#FF8C00', label: 'LOW' },
  { k: 'mid',   mn: 15, mx: 45,  dmg: 28, cr: 0.09, color: '#7CFF6B', label: 'MID' },
  { k: 'sweet', mn: 45, mx: 80,  dmg: 55, cr: 0.28, color: '#7CFF6B', label: 'SWEET!' },
  { k: 'over',  mn: 80, mx: 101, dmg: 85, cr: 0.55, color: '#FF5A5A', label: 'OVERLOAD' },
];
const TW_BOSSES = [
  { name: 'Fire Dragon', emoji: '🐉', maxHp: 600, color: '#FF4500', attacks: [{ name: 'Flame', dmg: 35 }, { name: 'Fireball', dmg: 50 }] },
  { name: 'Iron Titan',  emoji: '🤖', maxHp: 500, color: '#708090', attacks: [{ name: 'Laser',  dmg: 40 }, { name: 'Slam',     dmg: 55 }] },
  { name: 'Death Lord',  emoji: '💀', maxHp: 700, color: '#8B0000', attacks: [{ name: 'Scythe', dmg: 45 }, { name: 'Curse',    dmg: 30 }] },
  { name: 'Volcano',     emoji: '🌋', maxHp: 800, color: '#FF6347', attacks: [{ name: 'Meteor', dmg: 60 }, { name: 'Lava',     dmg: 35 }] },
];
const TW_AI_NAMES = ['GreenCloud','PuffSniper','BlazeTank','SmokeRider','IronPuff','NeonGunner','CaliKiller','TankMaster'];
const TW_RANKS = [
  { name: 'BRONZE',  emoji: '🥉', color: '#cd7f32', mn: 0,   mx: 100  },
  { name: 'SILVER',  emoji: '🥈', color: '#c0c0c0', mn: 100, mx: 250  },
  { name: 'GOLD',    emoji: '🥇', color: '#FFD700', mn: 250, mx: 450  },
  { name: 'DIAMOND', emoji: '💎', color: '#b9f2ff', mn: 450, mx: 700  },
  { name: 'MASTER',  emoji: '👑', color: '#FF4500', mn: 700, mx: 9999 },
];
const TW_SHOP = [
  { id: 'skin_default', cat: 'skin',  name: 'Military',  emoji: '🪖', desc: 'Default camo',  price: 0,   color: '#4CAF50' },
  { id: 'skin_camo',    cat: 'skin',  name: 'Jungle',    emoji: '🌿', desc: 'Forest blend',  price: 50,  color: '#5a7247' },
  { id: 'skin_gold',    cat: 'skin',  name: 'Gold',      emoji: '✨', desc: 'Flex mode',     price: 150, color: '#DAA520' },
  { id: 'skin_neon',    cat: 'skin',  name: 'Neon',      emoji: '💜', desc: 'Glow up',       price: 100, color: '#B44DFF' },
  { id: 'skin_lava',    cat: 'skin',  name: 'Legendary', emoji: '🔥', desc: 'On fire',       price: 300, color: '#FF4500' },
  { id: 'trail_fire',   cat: 'trail', name: 'Fire',      emoji: '🔥', desc: 'Classic orange',price: 0,   color: '#FF6B35' },
  { id: 'trail_blue',   cat: 'trail', name: 'Ice',       emoji: '💙', desc: 'Cold streak',   price: 80,  color: '#4DB8FF' },
  { id: 'trail_star',   cat: 'trail', name: 'Star',      emoji: '⭐', desc: 'Sparkle',       price: 60,  color: '#FFD700' },
  { id: 'trail_toxic',  cat: 'trail', name: 'Toxic',     emoji: '☠️', desc: 'Deadly',        price: 120, color: '#7CFF6B' },
  { id: 'boost_2xp',    cat: 'boost', name: 'x2 XP',    emoji: '⚡', desc: 'Next game',     price: 25,  color: '#FFD700' },
  { id: 'boost_bags',   cat: 'boost', name: '+1 Bag',    emoji: '🎁', desc: '4 mystery bags',price: 30,  color: '#F472B6' },
];
const TW_BOT_HIT   = ['Direct hit! 🎯', 'That was CLEAN 💀', 'Ez target 😎'];
const TW_BOT_MISS  = ['Wind saved you 😤', 'Next time... 🔥', 'Hmm 🤔'];
const TW_BOT_GOTHIT = ['OW! 😭', 'That hurt! 😤', 'Revenge time! 🔥', 'Not bad... 😏'];
const TW_ROASTS = [
  'That shot was FILTHY','Bro the wind said no','THE CROWD GOES INSANE',
  'Did you just heal? COWARD','That angle was... creative','The terrain is crying right now',
  'CloudChaser420 would\'ve hit that','That\'s a war crime, not a shot',
  'Someone call the Geneva Convention','The wind: \'I gotchu fam\'',
  'Absolute SNIPER precision','Even the AI felt that one','The tank said NOPE',
];
const twRoast = () => TW_ROASTS[Math.floor(Math.random() * TW_ROASTS.length)];

function genTerrain() {
  const t = new Array(TW_W);
  let h = TW_H * 0.48 + (Math.random() - 0.5) * 30;
  for (let i = 0; i < TW_W; i++) { h += (Math.random() - 0.5) * 3; h = Math.max(TW_H * 0.32, Math.min(TW_H * 0.68, h)); t[i] = h; }
  for (let p = 0; p < 3; p++) for (let i = 1; i < TW_W - 1; i++) t[i] = (t[i - 1] + t[i] + t[i + 1]) / 3;
  return t;
}

function placeTanks(mode, terrain) {
  const w = TW_W; const tanks = [];
  const mk = (id, name, x, color, team, isP) => { const tx = Math.max(22, Math.min(w - 22, x)); return { id, name, hp: 100, maxHp: 100, x: tx, y: terrain[Math.floor(tx)], color, team, isPlayer: isP, isAI: !isP, alive: true }; };
  if (mode === '1v1')  { tanks.push(mk(0,'You',60,'#4CAF50',0,true)); tanks.push(mk(1,TW_AI_NAMES[0],w-60,'#EF4444',1,false)); }
  else if (mode === '2v2') { tanks.push(mk(0,'You',40,'#4CAF50',0,true)); tanks.push(mk(1,TW_AI_NAMES[1],100,'#66BB6A',0,false)); tanks.push(mk(2,TW_AI_NAMES[2],w-100,'#EF4444',1,false)); tanks.push(mk(3,TW_AI_NAMES[3],w-40,'#E53935',1,false)); }
  else if (mode === 'ffa') { tanks.push(mk(0,'You',50,'#4CAF50',0,true)); tanks.push(mk(1,TW_AI_NAMES[0],Math.floor(w*0.33),'#EF4444',1,false)); tanks.push(mk(2,TW_AI_NAMES[1],Math.floor(w*0.66),'#3B82F6',2,false)); tanks.push(mk(3,TW_AI_NAMES[2],w-50,'#F59E0B',3,false)); }
  else if (mode === 'boss') { tanks.push(mk(0,'You',40,'#4CAF50',0,true)); tanks.push(mk(1,TW_AI_NAMES[4],100,'#66BB6A',0,false)); tanks.push(mk(2,TW_AI_NAMES[5],160,'#81C784',0,false)); tanks.push(mk(3,TW_AI_NAMES[6],220,'#A5D6A7',0,false)); }
  return tanks;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TankWar() {
  const navigate = useNavigate();
  const { playFx, awardGame, setCoins, confettiParticles, spawnConfetti, triggerFlash, setBLEHandlers, clearBLEHandlers } = useApp();

  const [phase, setPhase] = useState('modeselect'); // modeselect|intro|aiming|power|puff_charging|puff_angle_set|heal_charging|flying|boss_attack|ai|complete
  const [mode, setMode] = useState('1v1');
  const [tanks, setTanks] = useState([]);
  const [boss, setBoss] = useState(null);
  const [angle, setAngle] = useState(45);
  const [lockedAngle, setLockedAngle] = useState(null);
  const [power, setPower] = useState(0);
  const [lockedPower, setLockedPower] = useState(null);
  const [wind, setWind] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [lastHit, setLastHit] = useState(null);
  const [score, setScore] = useState(0);
  const [flying, setFlying] = useState(false);
  const [explosion, setExplosion] = useState(null);
  const [puffStreak, setPuffStreak] = useState(0);
  const [puffPhase, setPuffPhase] = useState(0);
  const [timer, setTimer] = useState(TW_TURN_TIME);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [lobbyTab, setLobbyTab] = useState('battle');
  const [bossIdx, setBossIdx] = useState(0);
  const [selectedMode, setSelectedMode] = useState(null);
  const [action, setAction] = useState('fire');
  const [commentary, setCommentary] = useState('');
  const [zoom, setZoom] = useState(1);

  const phaseRef = useRef(phase);
  const modeRef = useRef(mode);
  const angleRef = useRef(angle);
  const windRef = useRef(wind);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { angleRef.current = angle; }, [angle]);
  useEffect(() => { windRef.current = wind; }, [wind]);

  const canvasRef = useRef(null);
  const terrainRef = useRef(null);
  const bulletRef = useRef(null);
  const rafRef = useRef(null);
  const aimRef = useRef(null);
  const powerRef = useRef(null);
  const puffStartRef = useRef(0);
  const tanksRef = useRef([]);
  const bossRef = useRef(null);
  const puffStreakRef = useRef(0);
  const sweetSpot = useRef({ mn: 45, mx: 78 });
  const charging = useRef(false);
  const timerRef = useRef(null);
  const turnIdxRef = useRef(0);
  const pinchRef = useRef(null);

  useEffect(() => { puffStreakRef.current = puffStreak; }, [puffStreak]);

  const addChat = useCallback((name, msg, color) => {
    setChatMsgs(prev => [...prev.slice(-8), { name, msg, color, t: Date.now() }]);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = TW_W, h = TW_H;
    const terrain = terrainRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(TW_DPR, TW_DPR);
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#06101E'); sky.addColorStop(0.2, '#0c1a38'); sky.addColorStop(0.5, '#102240'); sky.addColorStop(0.8, '#0e1c35'); sky.addColorStop(1, '#081830');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // Stars
    for (let i = 0; i < 60; i++) { const sx = ((i * 137.5) % 1) * w, sy = ((i * 73.3) % 0.35) * h; const bright = 0.08 + ((i * 31) % 60) / 150; ctx.fillStyle = `rgba(200,210,255,${bright})`; ctx.fillRect(sx, sy, 1, 1); }
    // Moon
    ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = '#4DB8FF'; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.12, 40, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Terrain
    if (terrain) {
      ctx.beginPath(); ctx.moveTo(0, h); for (let i = 0; i < TW_W; i++) ctx.lineTo(i, terrain[i]); ctx.lineTo(w, h); ctx.closePath();
      const tG = ctx.createLinearGradient(0, h * 0.3, 0, h); tG.addColorStop(0, '#1a2a45'); tG.addColorStop(0.4, '#142035'); tG.addColorStop(1, '#0a1525');
      ctx.fillStyle = tG; ctx.fill();
      ctx.strokeStyle = 'rgba(0,229,255,0.15)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < TW_W; i++) { if (i === 0) ctx.moveTo(i, terrain[i]); else ctx.lineTo(i, terrain[i]); } ctx.stroke();
      ctx.strokeStyle = 'rgba(0,229,255,0.06)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < TW_W; i++) { if (i === 0) ctx.moveTo(i, terrain[i]); else ctx.lineTo(i, terrain[i]); } ctx.stroke();
    }
    const tanks2 = tanksRef.current; const ci = turnIdxRef.current;
    const curAngle = angleRef.current; const curWind = windRef.current;
    const curPhase = phaseRef.current;
    tanks2.forEach((t, idx) => {
      if (!t.alive) return;
      const tx = t.x, ty = terrain ? terrain[Math.floor(Math.max(0, Math.min(TW_W - 1, t.x)))] : h * 0.6;
      const tw = 26, th = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(tx - tw / 2, ty - th, tw, th);
      const bw = 22, bh = 7;
      const hullG = ctx.createLinearGradient(tx - bw / 2, ty - th - bh, tx + bw / 2, ty - th); hullG.addColorStop(0, t.color); hullG.addColorStop(1, t.color + 'AA');
      ctx.fillStyle = hullG; ctx.fillRect(tx - bw / 2, ty - th - bh, bw, bh);
      const trtW = 12, trtH = 5; ctx.fillStyle = t.color; ctx.fillRect(tx - trtW / 2, ty - th - bh - trtH, trtW, trtH);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(tx, ty - th - bh - trtH / 2, 5, Math.PI, 0); ctx.fill();
      const fr = t.x < TW_W / 2; let ba;
      if (idx === ci && (lockedAngle !== null || curPhase === 'aiming' || curPhase === 'power' || curPhase === 'puff_charging' || curPhase === 'heal_charging' || curPhase === 'puff_angle_set')) {
        const a = lockedAngle !== null ? lockedAngle : curAngle; ba = fr ? -a * Math.PI / 180 : -(180 - a) * Math.PI / 180;
      } else ba = fr ? -45 * Math.PI / 180 : -135 * Math.PI / 180;
      const barrelOriginY = ty - th - bh - trtH / 2;
      ctx.strokeStyle = t.color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(tx, barrelOriginY); ctx.lineTo(tx + Math.cos(ba) * 20, barrelOriginY + Math.sin(ba) * 20); ctx.stroke(); ctx.lineCap = 'butt';
      const hp = t.hp / t.maxHp; const hpY = ty - th - bh - trtH - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(tx - 14, hpY, 28, 4);
      ctx.fillStyle = hp > 0.5 ? '#4CAF50' : hp > 0.25 ? '#FF9800' : '#EF4444'; ctx.fillRect(tx - 14, hpY, 28 * hp, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = `7px 'Courier New',monospace`; ctx.textAlign = 'center'; ctx.fillText(t.name, tx, hpY - 3);
      if (idx === ci) { ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.strokeRect(tx - tw / 2 - 2, hpY - 6, tw + 4, ty - hpY + 8); ctx.setLineDash([]); }
    });
    // Trajectory preview
    if (!bulletRef.current && tanks2[ci]?.isPlayer && tanks2[ci]?.alive && (curPhase === 'aiming' || curPhase === 'power' || curPhase === 'puff_charging' || curPhase === 'heal_charging' || curPhase === 'puff_angle_set')) {
      const shooter = tanks2[ci]; const sx = shooter.x;
      const sy = terrain ? terrain[Math.floor(Math.max(0, Math.min(TW_W - 1, sx)))] : h * 0.6;
      const barrelY = sy - 16; const ang = curAngle; const rad2 = ang * Math.PI / 180; const fr = sx < TW_W / 2;
      const previewPower = (curPhase === 'power' || curPhase === 'puff_charging') ? power : 50;
      const spd = (previewPower / 100) * 11 + 3; const vx0 = Math.cos(rad2) * spd * (fr ? 1 : -1); const vy0 = -Math.sin(rad2) * spd;
      ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); let px = sx, py = barrelY, pvx = vx0, pvy = vy0; ctx.moveTo(px, py);
      for (let step = 0; step < 60; step++) {
        pvx += curWind * TW_WIND_FACTOR; pvy += TW_GRAVITY; px += pvx; py += pvy;
        if (px < 0 || px > TW_W || py > h || py < -50) break;
        const gx = Math.floor(Math.max(0, Math.min(TW_W - 1, px))); if (terrain && py >= terrain[gx]) break;
        ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,215,0,0.5)'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8); ctx.stroke();
      ctx.restore();
    }
    // Boss
    if (bossRef.current && bossRef.current.hp > 0) {
      const b2 = bossRef.current; const bx = b2.x, by = terrain ? terrain[Math.floor(Math.min(TW_W - 1, b2.x))] : h * 0.5;
      ctx.fillStyle = b2.color; ctx.fillRect(bx - 22, by - 22, 44, 22); ctx.beginPath(); ctx.arc(bx, by - 26, 12, 0, Math.PI * 2); ctx.fill();
      const bhp = b2.hp / b2.maxHp; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx - 25, by - 40, 50, 5);
      ctx.fillStyle = bhp > 0.5 ? '#FF4500' : '#FF0000'; ctx.fillRect(bx - 25, by - 40, 50 * bhp, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b2.emoji + ' ' + b2.name, bx, by - 44);
    }
    // Bullet
    if (bulletRef.current) {
      const b2 = bulletRef.current;
      b2.trail.forEach((p, i) => { const a = (i / b2.trail.length) * 0.6; ctx.fillStyle = b2.isPuff ? `rgba(255,215,0,${a})` : `rgba(255,100,50,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, (b2.isPuff ? 3 : 2) + i * 0.06, 0, Math.PI * 2); ctx.fill(); });
      const flightAngle = Math.atan2(b2.vy, b2.vx);
      ctx.save(); ctx.translate(b2.x, b2.y); ctx.rotate(flightAngle);
      ctx.shadowColor = b2.isPuff ? '#FFD700' : '#FF6B35'; ctx.shadowBlur = 10;
      ctx.fillStyle = b2.isPuff ? '#FFD700' : '#FF6B35'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -3); ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = b2.isPuff ? 'rgba(255,180,0,0.7)' : 'rgba(255,80,30,0.7)'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-8, 0); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    }
    // Explosion
    if (explosion) {
      const e = explosion; const age = (Date.now() - e.t) / 700;
      if (age < 1) {
        const r = e.radius * age; const a = 1 - age;
        ctx.fillStyle = e.isBlinker ? `rgba(255,215,0,${a * 0.3})` : `rgba(255,100,50,${a * 0.2})`; ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = e.isPuff ? `rgba(255,215,0,${a * 0.6})` : `rgba(255,100,50,${a * 0.5})`; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${a * 0.4})`; ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.3, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 6; i++) { const pa = i / 6 * Math.PI * 2 + age * 3; const pr = r * 0.7; ctx.fillStyle = `rgba(255,${e.isPuff ? 200 : 80},0,${a * 0.5})`; ctx.beginPath(); ctx.arc(e.x + Math.cos(pa) * pr, e.y + Math.sin(pa) * pr, 3, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.restore();
  }, [lockedAngle, power, explosion]); // eslint-disable-line

  // Redraw on every relevant state change
  useEffect(() => {
    if (phase && phase !== 'intro' && phase !== 'modeselect' && phase !== 'complete' && canvasRef.current) {
      drawCanvas();
    }
  });

  const calcDmg = useCallback((pwr) => {
    const ss = sweetSpot.current; const inSweet = pwr >= ss.mn && pwr <= ss.mx;
    const zone = TW_ZONES.find(z => pwr >= z.mn && pwr < z.mx) || TW_ZONES[3];
    let baseDmg = zone.dmg;
    if (inSweet) baseDmg = Math.round(baseDmg * 1.42);
    const crit = Math.random() < zone.cr;
    return { baseDmg, crit, zone, inSweet };
  }, []);

  const winGame = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setCommentary('VICTORY! ' + twRoast()); playFx('win'); spawnConfetti(30); triggerFlash('goal');
    setTimeout(() => { awardGame('tankwar', 'win'); setPhase('complete'); }, 1500);
  }, [playFx, spawnConfetti, triggerFlash, awardGame]);

  const loseGame = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setCommentary('Defeated! ' + twRoast()); playFx('lose');
    setTimeout(() => { awardGame('tankwar', 'lose'); setPhase('complete'); }, 1500);
  }, [playFx, awardGame]);

  const checkWin = useCallback((tanks2, boss2, mode2) => {
    const p = tanks2.find(t => t.isPlayer);
    if (mode2 === '1v1') { const e = tanks2.find(t => !t.isPlayer); if (!e.alive) { winGame(); return true; } if (!p.alive) { loseGame(); return true; } }
    else if (mode2 === '2v2') { if (tanks2.filter(t => t.team === 1).every(t => !t.alive)) { winGame(); return true; } if (tanks2.filter(t => t.team === 0).every(t => !t.alive)) { loseGame(); return true; } }
    else if (mode2 === 'ffa') { const alive = tanks2.filter(t => t.alive); if (alive.length <= 1) { if (alive.length === 1 && alive[0].isPlayer) winGame(); else loseGame(); return true; } if (!p.alive) { loseGame(); return true; } }
    else if (mode2 === 'boss') { if (!p.alive && tanks2.filter(t => t.team === 0 && t.alive).length === 0) { loseGame(); return true; } }
    return false;
  }, [winGame, loseGame]);

  const doAI = useCallback((idx) => {
    const tanks2 = tanksRef.current; const ai = tanks2[idx]; if (!ai || !ai.alive) return;
    let target;
    if (modeRef.current === 'boss' && bossRef.current && bossRef.current.hp > 0) target = { x: bossRef.current.x, y: bossRef.current.y - 20 };
    else { const enemies = tanks2.filter((t, i) => t.alive && i !== idx && (modeRef.current === 'ffa' || t.team !== ai.team)); if (enemies.length === 0) return; target = enemies[Math.floor(Math.random() * enemies.length)]; }
    const dx = (target.x || 0) - ai.x, dy = ((target.y || 0) - 10) - ai.y;
    const ideal = Math.atan2(-dy, Math.abs(dx)) * 180 / Math.PI;
    const baseScatter = 16; const modeBonus = modeRef.current === 'boss' ? 4 : modeRef.current === '1v1' ? 2 : 0;
    const scatter = Math.max(5, baseScatter - modeBonus + Math.random() * 8);
    const aiAngle = Math.max(10, Math.min(150, ideal + (Math.random() - 0.5) * scatter)); const aiPower = 45 + Math.random() * 30;
    setLockedAngle(aiAngle); setAngle(aiAngle); playFx('select');
    setTimeout(() => { setLockedPower(aiPower); setPower(aiPower); playFx('tap'); setTimeout(() => fireShot(aiAngle, aiPower, 1.0, false, false), 400); }, 600);
  }, [playFx]); // eslint-disable-line

  const next = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const tanks2 = tanksRef.current; const alive = tanks2.filter(t => t.alive);
    if (alive.length <= 1 && modeRef.current !== 'boss') { checkWin(tanks2, bossRef.current, modeRef.current); return; }
    let ni = turnIdxRef.current;
    for (let i = 0; i < tanks2.length; i++) { ni = (ni + 1) % tanks2.length; if (tanks2[ni].alive) break; }
    turnIdxRef.current = ni; setTurnIdx(ni);
    const nt = tanks2[ni];
    setWind(Math.round((Math.random() - 0.5) * 4.5 * 10) / 10);
    setLockedAngle(null); setLockedPower(null); setPower(0); setLastHit(null); setPuffPhase(0);
    const ssMin = 35 + Math.floor(Math.random() * 15); const ssMax = ssMin + 12 + Math.floor(Math.random() * 10);
    sweetSpot.current = { mn: ssMin, mx: Math.min(82, ssMax) };
    setRound(r => r + 1);
    if (nt.isAI) {
      setPhase('ai'); setCommentary(nt.name + "'s turn...");
      setTimeout(() => doAI(ni), 1500);
    } else {
      setPhase('aiming'); setCommentary("Your turn!"); setAction('fire');
      setTimer(TW_TURN_TIME);
      timerRef.current = setInterval(() => { setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); timerRef.current = null; next(); return 0; } return t - 1; }); }, 1000);
    }
  }, [checkWin, doAI]); // eslint-disable-line

  const explode = useCallback((x, y, dmg, crit, isPuff, isBlinker) => {
    bulletRef.current = null; setFlying(false);
    const radius = isBlinker ? 50 : isPuff ? 42 : 35;
    setExplosion({ x, y, radius, isPuff, isBlinker, t: Date.now() });
    playFx(isPuff ? 'crowd' : 'error'); if (isPuff) triggerFlash('goal');
    const terrain = terrainRef.current;
    if (terrain) {
      for (let i = Math.max(0, Math.floor(x - radius)); i < Math.min(TW_W, Math.ceil(x + radius)); i++) { const d = Math.abs(i - x); const depth = Math.sqrt(Math.max(0, radius * radius - d * d)); terrain[i] = Math.min(TW_H, terrain[i] + depth * 0.4); }
      for (let p = 0; p < 2; p++) for (let i = 1; i < TW_W - 1; i++) terrain[i] = (terrain[i - 1] + terrain[i] + terrain[i + 1]) / 3;
    }
    const tanks2 = [...tanksRef.current]; let hitAny = false;
    const shooterIdx = turnIdxRef.current; const shooter = tanks2[shooterIdx];
    tanks2.forEach((t, i) => {
      if (!t.alive || i === shooterIdx) return;
      const dx2 = t.x - x, dy2 = (t.y - 10) - y; const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (dist < radius * 1.2) {
        const falloff = Math.max(0.3, 1 - dist / (radius * 1.5)); const ad = Math.round(dmg * falloff);
        t.hp = Math.max(0, t.hp - ad); if (terrain) t.y = terrain[Math.floor(t.x)]; hitAny = true;
        setLastHit({ amt: ad, crit, isPuff, isBlinker, x: t.x, y: t.y - 20, t: Date.now() });
        if (t.hp <= 0) { t.alive = false; playFx('crowd'); setCommentary(t.name + ' DESTROYED! ' + twRoast()); if (isPuff) spawnConfetti(30); if (shooter && !shooter.isPlayer) addChat(shooter.name, TW_BOT_HIT[Math.floor(Math.random() * TW_BOT_HIT.length)], shooter.color); }
        else { setCommentary((crit ? 'CRIT! ' : '') + ad + ' dmg to ' + t.name + '! ' + (Math.random() < 0.4 ? twRoast() : '')); if (!t.isPlayer && t.isAI) addChat(t.name, TW_BOT_GOTHIT[Math.floor(Math.random() * TW_BOT_GOTHIT.length)], t.color); if (shooter && !shooter.isPlayer) addChat(shooter.name, TW_BOT_HIT[Math.floor(Math.random() * TW_BOT_HIT.length)], shooter.color); }
        if (isPuff) { setScore(s => s + 25); }
      }
    });
    if (!hitAny) setCommentary('Terrain hit! No direct damage. ' + twRoast());
    if (terrain) tanks2.forEach(t => { if (t.alive) t.y = terrain[Math.floor(t.x)]; });
    tanksRef.current = tanks2; setTanks([...tanks2]);
    setTimeout(() => { setExplosion(null); checkWin(tanks2, bossRef.current, modeRef.current) || next(); }, 800);
  }, [playFx, triggerFlash, spawnConfetti, addChat, checkWin, next]); // eslint-disable-line

  const hitBoss = useCallback((dmg, crit, isPuff, isBlinker) => {
    bulletRef.current = null; setFlying(false);
    const b2 = { ...bossRef.current }; const ad = crit ? Math.round(dmg * 1.5) : dmg;
    b2.hp = Math.max(0, b2.hp - ad); bossRef.current = b2; setBoss({ ...b2 });
    setLastHit({ amt: ad, crit, isPuff, isBlinker, x: b2.x, y: b2.y - 30, t: Date.now() });
    playFx(crit ? 'crowd' : 'select'); setCommentary((crit ? 'CRIT! ' : '') + ad + ' dmg to ' + b2.name + '! ' + twRoast());
    if (isPuff) { setScore(s => s + 25); spawnConfetti(20); }
    if (b2.hp <= 0) { setCommentary(b2.name + ' DEFEATED! ' + twRoast()); playFx('win'); spawnConfetti(40); triggerFlash('goal'); setTimeout(() => { setScore(s => s + 200); awardGame('tankwar', 'win'); setPhase('complete'); }, 1500); return; }
    setTimeout(() => { checkWin(tanksRef.current, b2, modeRef.current) || next(); }, 800);
  }, [playFx, spawnConfetti, triggerFlash, awardGame, checkWin, next]); // eslint-disable-line

  const fireShot = useCallback((ang, pwr, mult, isPuff, isBlinker) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPhase('flying'); setFlying(true);
    const rad = ang * Math.PI / 180; const speed = (pwr / 100) * 11 + 3;
    const tanks2 = tanksRef.current; const currentIdx = turnIdxRef.current;
    const shooter = tanks2[currentIdx]; if (!shooter || !shooter.alive) { next(); return; }
    const { baseDmg, crit, inSweet } = calcDmg(pwr);
    const dmg = Math.round(baseDmg * mult); const finalDmg = crit ? Math.round(dmg * 1.5) : dmg;
    const terrain = terrainRef.current; const curWind = windRef.current;
    const bullet = { x: shooter.x, y: shooter.y - 12, vx: Math.cos(rad) * speed * (shooter.x < TW_W / 2 ? 1 : -1), vy: -Math.sin(rad) * speed, dmg: finalDmg, crit, isPuff, isBlinker: !!isBlinker, mult, inSweet, trail: [] };
    bulletRef.current = bullet;
    const anim = () => {
      if (!bulletRef.current) return;
      const b2 = bulletRef.current;
      b2.vx += curWind * TW_WIND_FACTOR; b2.vy += TW_GRAVITY; b2.x += b2.vx; b2.y += b2.vy;
      b2.trail.push({ x: b2.x, y: b2.y }); if (b2.trail.length > 25) b2.trail.shift();
      const bx2 = Math.floor(b2.x);
      if (bx2 >= 0 && bx2 < TW_W && terrain && b2.y >= terrain[bx2]) { explode(b2.x, terrain[bx2], b2.dmg, b2.crit, b2.isPuff, b2.isBlinker); return; }
      const targets2 = tanks2.filter((t, i) => i !== currentIdx && t.alive);
      for (const t of targets2) { const dx2 = b2.x - t.x, dy2 = b2.y - (t.y - 10); if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 18) { explode(t.x, t.y - 10, b2.dmg, b2.crit, b2.isPuff, b2.isBlinker); return; } }
      if (bossRef.current && bossRef.current.hp > 0) { const boss2 = bossRef.current; const dx2 = b2.x - boss2.x, dy2 = b2.y - (boss2.y - 20); if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 30) { hitBoss(b2.dmg, b2.crit, b2.isPuff, b2.isBlinker); return; } }
      if (b2.x < -20 || b2.x > TW_W + 20 || b2.y > TW_H + 50) {
        bulletRef.current = null; setFlying(false);
        if (shooter.isPlayer) addChat('You', 'Miss!', '#999'); else addChat(shooter.name, TW_BOT_MISS[Math.floor(Math.random() * TW_BOT_MISS.length)], shooter.color);
        setCommentary('Miss! ' + twRoast()); playFx('error'); setTimeout(() => next(), 1200); return;
      }
      drawCanvas(); rafRef.current = requestAnimationFrame(anim);
    };
    rafRef.current = requestAnimationFrame(anim);
  }, [calcDmg, explode, hitBoss, next, addChat, playFx, drawCanvas]); // eslint-disable-line

  const bossAtk = useCallback(() => {
    const b2 = bossRef.current; if (!b2 || b2.hp <= 0) { next(); return; }
    setPhase('boss_attack'); setCommentary(b2.name + ' attacks! ' + b2.emoji);
    playFx('error');
    const atk = b2.attacks[Math.floor(Math.random() * b2.attacks.length)];
    const tanks2 = tanksRef.current; const ap = tanks2.filter(t => t.team === 0 && t.alive);
    if (ap.length === 0) { loseGame(); return; }
    const target = ap[Math.floor(Math.random() * ap.length)]; const bd = atk.dmg + Math.floor(Math.random() * 15);
    const terrain = terrainRef.current;
    const bossX = b2.x, bossY = b2.y - 20; const tgtX = target.x, tgtY = target.y - 10;
    const bDx = tgtX - bossX; const bAng = Math.atan2(-(tgtY - bossY), Math.abs(bDx));
    const bSpd = 6 + Math.random() * 3; const bDir = bDx > 0 ? 1 : -1;
    const bossBullet = { x: bossX, y: bossY, vx: Math.cos(bAng) * bSpd * bDir, vy: -Math.sin(bAng) * bSpd, dmg: bd, trail: [] };
    bulletRef.current = bossBullet; setFlying(true);
    const bAnim = () => {
      if (!bulletRef.current) return;
      const bl = bulletRef.current; bl.vy += TW_GRAVITY; bl.x += bl.vx; bl.y += bl.vy;
      bl.trail.push({ x: bl.x, y: bl.y }); if (bl.trail.length > 20) bl.trail.shift();
      const bx2 = Math.floor(bl.x);
      if (bx2 >= 0 && bx2 < TW_W && terrain && bl.y >= terrain[bx2]) {
        bulletRef.current = null; setFlying(false);
        const cr = 25;
        for (let i = Math.max(0, Math.floor(bl.x - cr)); i < Math.min(TW_W, Math.ceil(bl.x + cr)); i++) { const dd = Math.abs(i - bl.x); const dep = Math.sqrt(Math.max(0, cr * cr - dd * dd)); terrain[i] = Math.min(TW_H, terrain[i] + dep * 0.3); }
        for (let p = 0; p < 2; p++) for (let i = 1; i < TW_W - 1; i++) terrain[i] = (terrain[i - 1] + terrain[i] + terrain[i + 1]) / 3;
        const ut = [...tanksRef.current]; let bHit = false;
        ut.forEach(t => {
          if (!t.alive || t.team !== 0) return;
          const ddx = t.x - bl.x, ddy = (t.y - 10) - bl.y;
          if (Math.sqrt(ddx * ddx + ddy * ddy) < cr * 1.2) {
            const ff = Math.max(0.4, 1 - Math.sqrt(ddx * ddx + ddy * ddy) / (cr * 1.5)); const ad2 = Math.round(bd * ff);
            t.hp = Math.max(0, t.hp - ad2); if (terrain) t.y = terrain[Math.floor(t.x)]; bHit = true;
            setLastHit({ amt: ad2, crit: false, isPuff: false, isBlinker: false, x: t.x, y: t.y - 20, t: Date.now() });
            if (t.hp <= 0) { t.alive = false; setCommentary(target.name + ' destroyed!'); } else setCommentary(atk.name + ' hits ' + t.name + ' for ' + ad2 + '!');
          }
        });
        if (!bHit) setCommentary(b2.name + "'s " + atk.name + ' missed! ' + twRoast());
        if (terrain) ut.forEach(t => { if (t.alive) t.y = terrain[Math.floor(t.x)]; });
        tanksRef.current = ut; setTanks([...ut]);
        setExplosion({ x: bl.x, y: terrain[bx2], radius: cr, isPuff: false, isBlinker: false, t: Date.now() });
        setTimeout(() => { setExplosion(null); checkWin(ut, bossRef.current, modeRef.current) || next(); }, 1000); return;
      }
      if (bl.x < -20 || bl.x > TW_W + 20 || bl.y > TW_H + 50) { bulletRef.current = null; setFlying(false); setCommentary(b2.name + ' missed! ' + twRoast()); setTimeout(() => { checkWin(tanksRef.current, bossRef.current, modeRef.current) || next(); }, 800); return; }
      drawCanvas(); rafRef.current = requestAnimationFrame(bAnim);
    };
    rafRef.current = requestAnimationFrame(bAnim);
  }, [playFx, loseGame, next, checkWin, drawCanvas]); // eslint-disable-line

  const startCharge = useCallback(() => {
    if (phaseRef.current !== 'aiming' || !tanksRef.current[turnIdxRef.current]?.isPlayer) return;
    charging.current = true; setPhase('power');
    if (powerRef.current) clearInterval(powerRef.current);
    let pwr = 0;
    powerRef.current = setInterval(() => { pwr = Math.min(100, pwr + 1.2); setPower(pwr); }, 33);
  }, []);

  const releaseCharge = useCallback(() => {
    if (!charging.current || phaseRef.current !== 'power') return;
    charging.current = false;
    if (powerRef.current) { clearInterval(powerRef.current); powerRef.current = null; }
    setPuffStreak(0); playFx('tap');
    // Read power from powerRef via closure — use functional updater pattern
    setPower(pwr => { fireShot(angleRef.current, pwr, 1.0, false, false); return pwr; });
  }, [playFx, fireShot]); // eslint-disable-line

  const puffStart = useCallback(() => {
    if (!tanksRef.current[turnIdxRef.current]?.isPlayer) return;
    const cur = phaseRef.current;
    if (modeRef.current === '1v1' && cur === 'aiming') {
      setPuffPhase(0); setPhase('puff_charging'); puffStartRef.current = Date.now(); charging.current = true;
      if (powerRef.current) clearInterval(powerRef.current);
      let pwr = 0;
      powerRef.current = setInterval(() => { pwr = Math.min(100, pwr + 0.8); setPower(pwr); setAngle(10 + (pwr / 100) * 160); }, 33);
      playFx('charge'); return;
    }
    if (cur === 'aiming' || (modeRef.current === '1v1' && puffPhase === 1 && cur === 'puff_angle_set')) {
      setPhase('puff_charging'); puffStartRef.current = Date.now(); charging.current = true;
      if (powerRef.current) clearInterval(powerRef.current);
      let pwr = 0;
      powerRef.current = setInterval(() => { pwr = Math.min(100, pwr + 0.8); setPower(pwr); }, 33);
      playFx('charge');
    }
  }, [playFx, puffPhase]);

  const puffStop = useCallback(() => {
    if (!puffStartRef.current || !charging.current) return;
    charging.current = false;
    if (powerRef.current) { clearInterval(powerRef.current); powerRef.current = null; }
    const dur = (Date.now() - puffStartRef.current) / 1000; puffStartRef.current = 0;
    if (modeRef.current === '1v1' && puffPhase === 0) {
      setPuffPhase(1); setPhase('puff_angle_set'); setPower(0); playFx('select'); return;
    }
    let inputMult = 1.15; const isBlinker = dur >= 5.0; if (isBlinker) inputMult = 1.20;
    const newStreak = Math.min(5, puffStreakRef.current + 1); setPuffStreak(newStreak);
    const streakMult = 1 + newStreak * 0.02; const totalMult = inputMult * streakMult;
    playFx(isBlinker ? 'crowd' : 'whistle');
    if (isBlinker) spawnConfetti(20);
    setPower(pwr => { fireShot(angleRef.current, pwr, totalMult, true, isBlinker); return pwr; });
  }, [playFx, spawnConfetti, puffPhase, fireShot]); // eslint-disable-line

  const adjustAngle = useCallback((delta) => {
    if (phaseRef.current !== 'aiming' || !tanksRef.current[turnIdxRef.current]?.isPlayer) return;
    setAngle(a => Math.max(5, Math.min(175, Math.round(a + delta)))); playFx('tap');
  }, [playFx]);

  const startHeal = useCallback(() => {
    if (phaseRef.current !== 'aiming' || !tanksRef.current[turnIdxRef.current]?.isPlayer || modeRef.current !== 'boss') return;
    charging.current = true; setPhase('heal_charging');
    if (powerRef.current) clearInterval(powerRef.current);
    let pwr = 0;
    powerRef.current = setInterval(() => { pwr = Math.min(100, pwr + 1.0); setPower(pwr); }, 33);
  }, []);

  const releaseHeal = useCallback(() => {
    if (!charging.current || phaseRef.current !== 'heal_charging') return;
    charging.current = false;
    if (powerRef.current) { clearInterval(powerRef.current); powerRef.current = null; }
    const ss = sweetSpot.current;
    setPower(pwr => {
      const inSweet = pwr >= ss.mn && pwr <= ss.mx; const healPct = inSweet ? 0.40 : 0.22;
      const tanks2 = [...tanksRef.current]; const ci = turnIdxRef.current;
      if (tanks2[ci]) {
        const healAmt = Math.round(tanks2[ci].maxHp * healPct);
        tanks2[ci] = { ...tanks2[ci], hp: Math.min(tanks2[ci].maxHp, tanks2[ci].hp + healAmt) };
        tanksRef.current = tanks2; setTanks([...tanks2]);
        setCommentary('+' + healAmt + ' HP!' + (inSweet ? ' SWEET SPOT HEAL!' : ''));
      }
      return 0;
    });
    playFx('select'); setAction('fire');
    setTimeout(() => next(), 1000);
  }, [playFx, next]); // eslint-disable-line

  const cleanup = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (aimRef.current) { clearInterval(aimRef.current); aimRef.current = null; }
    if (powerRef.current) { clearInterval(powerRef.current); powerRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    bulletRef.current = null; terrainRef.current = null; puffStartRef.current = 0;
    tanksRef.current = []; bossRef.current = null; charging.current = false;
  }, []);

  const startGame = useCallback((m) => {
    cleanup();
    const terrain = genTerrain(); terrainRef.current = terrain;
    const tanks2 = placeTanks(m, terrain); setTanks(tanks2); tanksRef.current = tanks2;
    if (m === 'boss') { const b2 = TW_BOSSES[bossIdx]; const boss2 = { ...b2, hp: b2.maxHp, x: TW_W - 40, y: terrain[TW_W - 40] }; setBoss(boss2); bossRef.current = boss2; } else { setBoss(null); bossRef.current = null; }
    setAngle(45); setLockedAngle(null); setPower(0); setLockedPower(null);
    setWind(Math.round((Math.random() - 0.5) * 4.5 * 10) / 10);
    turnIdxRef.current = 0; setTurnIdx(0); setRound(0); setScore(0);
    setFlying(false); setExplosion(null); setAction('fire');
    setPuffStreak(0); setPuffPhase(0); setTimer(TW_TURN_TIME); setChatMsgs([]);
    setZoom(1); setMode(m); modeRef.current = m;
    const ssMin = 35 + Math.floor(Math.random() * 15); const ssMax = ssMin + 12 + Math.floor(Math.random() * 10);
    sweetSpot.current = { mn: ssMin, mx: Math.min(82, ssMax) };
    setPhase('intro'); playFx('crowd'); setCommentary('Tank War! Aim and fire to destroy the enemy!');
    setTimeout(() => {
      setPhase('aiming'); setTimer(TW_TURN_TIME);
      timerRef.current = setInterval(() => { setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); timerRef.current = null; next(); return 0; } return t - 1; }); }, 1000);
    }, 1800);
  }, [cleanup, playFx, bossIdx, next]); // eslint-disable-line

  // BLE: puff = fire
  useEffect(() => {
    setBLEHandlers(0, () => puffStart(), () => puffStop());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => cleanup();
  }, []); // eslint-disable-line

  const ss = sweetSpot.current;
  const isGameplay = phase !== 'intro' && phase !== 'modeselect' && phase !== 'complete';
  const is1v1Puff = mode === '1v1';
  const isPlayerTurn = tanks[turnIdx]?.isPlayer && !flying;
  const showControls = isGameplay && phase !== 'flying' && phase !== 'boss_attack' && phase !== 'ai' && (tanks[turnIdx]?.isPlayer || phase === 'power' || phase === 'puff_charging' || phase === 'heal_charging');
  const showAIBar = (phase === 'ai' || phase === 'boss_attack') && isGameplay;
  const playerTank = tanks.find(t => t.isPlayer);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'none' }}
      onTouchStart={(e) => {
        if (e.target.closest('[data-btn]')) return;
        if (e.touches.length === 2) { e.preventDefault(); const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom }; }
      }}
      onTouchMove={(e) => { if (e.touches.length === 2 && pinchRef.current) { e.preventDefault(); const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; const newDist = Math.sqrt(dx * dx + dy * dy); const scale = newDist / pinchRef.current.dist; setZoom(Math.max(1, Math.min(4, pinchRef.current.zoom * scale))); } }}
      onTouchEnd={(e) => { if (e.touches.length < 2) pinchRef.current = null; }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #06101E 0%, #0c1a38 30%, #102240 60%, #081830 100%)', zIndex: 0 }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      {/* Header */}
      <GameHeader
        backTo={() => { playFx('tap'); if (isGameplay) { cleanup(); setPhase('modeselect'); setSelectedMode(null); setLobbyTab('battle'); } else { cleanup(); navigate('/arcade'); } }}
        backLabel={isGameplay ? 'Lobby' : 'Arcade'}
        accent="#4CAF50"
        mid={isGameplay ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
            {tanks.filter(t => t.alive).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 6, background: tanks[turnIdx] === t ? 'rgba(255,255,255,0.06)' : 'transparent', border: `1px solid ${tanks[turnIdx] === t ? t.color + '50' : 'transparent'}` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color }} />
                <span style={{ fontSize: 7, fontWeight: 700, color: tanks[turnIdx] === t ? t.color : '#999' }}>{t.name}</span>
                <span style={{ fontSize: 6, color: '#777' }}>{t.hp}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#4CAF50' }}>🔫 TANK WAR</span>
          </div>
        )}
        row3={isGameplay ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(200,220,255,0.6)' }}>{wind > 0 ? '→' : wind < 0 ? '←' : '•'} {Math.abs(wind).toFixed(1)}m/s</span>
            {isPlayerTurn && <span style={{ fontSize: 8, fontWeight: 900, color: timer <= 5 ? '#FF5A5A' : C.gold, fontFamily: "'Courier New',monospace" }}>⏱{timer}s</span>}
            <div style={{ flex: 1 }} />
            {puffStreak > 0 && <span style={{ fontSize: 7, fontWeight: 900, color: C.gold }}>🔥{puffStreak}x</span>}
            {boss && boss.hp > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9 }}>{boss.emoji}</span>
                <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (boss.hp / boss.maxHp * 100) + '%', borderRadius: 2, background: `linear-gradient(90deg, ${boss.color}, #FF0000)`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 6, color: '#999' }}>{boss.hp}/{boss.maxHp}</span>
              </div>
            )}
          </div>
        ) : null}
      />

      {/* Game Area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {isGameplay && (
          <canvas ref={canvasRef} width={Math.round(TW_W * TW_DPR)} height={Math.round(TW_H * TW_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.1s ease' }} />
        )}

        {/* Zoom buttons */}
        {isGameplay && (
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 25, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(4, z + 0.5)); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 14, cursor: 'pointer' }}>+</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(1, z - 0.5)); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 14, cursor: 'pointer' }}>−</div>
            {zoom !== 1 && <div data-btn="true" onClick={(e) => { e.stopPropagation(); setZoom(1); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,16,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 9, cursor: 'pointer' }}>1x</div>}
          </div>
        )}

        {/* Damage numbers */}
        {lastHit && Date.now() - lastHit.t < 1500 && isGameplay && (
          <div style={{ position: 'absolute', left: Math.min(90, Math.max(10, lastHit.x / 430 * 100)) + '%', top: Math.min(80, Math.max(10, lastHit.y / 400 * 100)) + '%', transform: 'translate(-50%,-100%)', zIndex: 30, pointerEvents: 'none', animation: 'floatUp 1.5s ease-out forwards' }}>
            <div style={{ fontSize: lastHit.crit ? 22 : lastHit.isPuff ? 18 : 14, fontWeight: 900, color: lastHit.isPuff ? C.gold : lastHit.crit ? '#FF6B35' : '#EF4444', textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>-{lastHit.amt}{lastHit.crit ? ' CRIT!' : ''}{lastHit.isPuff ? ' 💨' : ''}</div>
          </div>
        )}

        {/* Commentary */}
        {isGameplay && commentary && (
          <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 25, pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', textShadow: '0 0 12px rgba(0,0,0,0.9)', padding: '6px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', maxWidth: 300 }}>{commentary}</div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, zIndex: 30, padding: '5px 10px 9px' }}>
            {/* Boss action toggle */}
            {mode === 'boss' && phase === 'aiming' && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 5 }}>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); setAction('fire'); }} style={{ padding: '5px 18px', borderRadius: 8, cursor: 'pointer', background: action === 'fire' ? 'rgba(245,180,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${action === 'fire' ? C.gold + '50' : 'rgba(255,255,255,0.08)'}`, fontSize: 11, fontWeight: 800, color: action === 'fire' ? C.gold : '#999' }}>FIRE</div>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); setAction('heal'); }} style={{ padding: '5px 18px', borderRadius: 8, cursor: 'pointer', background: action === 'heal' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${action === 'heal' ? C.green + '50' : 'rgba(255,255,255,0.08)'}`, fontSize: 11, fontWeight: 800, color: action === 'heal' ? C.green : '#999' }}>HEAL</div>
              </div>
            )}

            {/* Angle row */}
            {(phase === 'aiming' || phase === 'power' || phase === 'puff_charging') && action === 'fire' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 5 }}>
                {!is1v1Puff && (
                  <>
                    <div data-btn="true" onClick={(e) => { e.stopPropagation(); adjustAngle(-10); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold }}>«</div>
                    <div data-btn="true" onClick={(e) => { e.stopPropagation(); adjustAngle(-1); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold }}>‹</div>
                  </>
                )}
                <div style={{ minWidth: 44, textAlign: 'center', fontSize: 16, fontWeight: 900, color: C.gold, fontFamily: "'Courier New',monospace" }}>{Math.round(angle)}°</div>
                {is1v1Puff && <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, marginLeft: 6 }}>PUFF 1: ANGLE</div>}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 9, fontWeight: 900, color: timer <= 5 ? '#FF5A5A' : C.gold, fontFamily: "'Courier New',monospace" }}>{timer}s</div>
                {!is1v1Puff && (
                  <>
                    <div data-btn="true" onClick={(e) => { e.stopPropagation(); adjustAngle(1); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold }}>›</div>
                    <div data-btn="true" onClick={(e) => { e.stopPropagation(); adjustAngle(10); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + C.gold + '30', fontSize: 11, fontWeight: 900, color: C.gold }}>»</div>
                  </>
                )}
              </div>
            )}

            {/* Puff angle set label */}
            {phase === 'puff_angle_set' && is1v1Puff && (
              <div style={{ textAlign: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, animation: 'pulse 1s infinite' }}>Angle: {Math.round(angle)}° — PUFF 2: FIRE</span>
              </div>
            )}

            {/* Power bar (tap/hold) */}
            {(phase === 'aiming' || phase === 'power' || phase === 'puff_charging' || phase === 'puff_angle_set') && action === 'fire' && (
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); startCharge(); }}
                onMouseUp={(e) => { e.stopPropagation(); releaseCharge(); }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startCharge(); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); releaseCharge(); }}
                style={{ position: 'relative', height: 38, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', touchAction: 'none' }}
              >
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  {TW_ZONES.map(z => <div key={z.k} style={{ flex: z.mx - z.mn, background: z.color + '12', borderRight: '1px solid rgba(255,255,255,0.05)' }} />)}
                </div>
                <div style={{ position: 'absolute', left: ss.mn + '%', width: (ss.mx - ss.mn) + '%', top: 0, bottom: 0, background: 'rgba(124,255,107,0.08)', borderLeft: '2px solid #7CFF6B40', borderRight: '2px solid #7CFF6B40' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: power + '%', background: power < 15 ? '#FF8C00' : power < 45 ? '#7CFF6B' : power >= ss.mn && power <= ss.mx ? '#7CFF6B' : '#FF5A5A', transition: 'width 0.02s', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                    {phase === 'power' || phase === 'puff_charging' ? Math.round(power) + '%' : 'HOLD TO FIRE'}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: 1, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                  {TW_ZONES.map(z => <span key={z.k} style={{ fontSize: 6, fontWeight: 700, color: z.color + '80' }}>{z.label}</span>)}
                </div>
              </div>
            )}

            {/* Heal bar */}
            {phase === 'aiming' && action === 'heal' && mode === 'boss' && (
              <div data-btn="true"
                onMouseDown={(e) => { e.stopPropagation(); startHeal(); }}
                onMouseUp={(e) => { e.stopPropagation(); releaseHeal(); }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startHeal(); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); releaseHeal(); }}
                style={{ position: 'relative', height: 38, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(76,175,80,0.3)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', touchAction: 'none' }}
              >
                <div style={{ position: 'absolute', left: ss.mn + '%', width: (ss.mx - ss.mn) + '%', top: 0, bottom: 0, background: 'rgba(76,175,80,0.12)', borderLeft: '2px solid #4CAF5040', borderRight: '2px solid #4CAF5040' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: power + '%', background: power >= ss.mn && power <= ss.mx ? C.green : '#66BB6A', transition: 'width 0.02s', opacity: 0.5 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>{phase === 'heal_charging' ? Math.round(power) + '%' : 'HOLD TO HEAL'}</span>
                </div>
              </div>
            )}

            {/* Puff charging label */}
            {phase === 'puff_charging' && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, animation: 'pulse 0.5s infinite' }}>{is1v1Puff && puffPhase === 0 ? 'SETTING ANGLE... ' + Math.round(angle) + '°' : 'CHARGING... ' + Math.round(power) + '%'}</span>
              </div>
            )}
            {phase === 'heal_charging' && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.green, animation: 'pulse 0.5s infinite' }}>HEALING... {Math.round(power)}%{power >= ss.mn && power <= ss.mx ? ' SWEET SPOT!' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* AI bar */}
        {showAIBar && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(0deg, rgba(3,7,5,0.9), rgba(5,11,8,0.6))', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ccc', marginBottom: 6 }}>{phase === 'boss_attack' ? (boss?.name + ' attacks!') : (tanks[turnIdx]?.name + ' aiming...')}</div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.gold}, transparent)`, animation: 'aiProgress 1.5s ease infinite' }} /></div>
          </div>
        )}

        {/* Chat */}
        {chatMsgs.length > 0 && isGameplay && (
          <div style={{ position: 'absolute', top: 10, left: 8, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 160, pointerEvents: 'none' }}>
            {chatMsgs.slice(-4).map((m, i) => (
              <div key={i} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.55)', border: `1px solid ${m.color}30` }}>
                <span style={{ fontWeight: 800, color: m.color }}>{m.name}: </span>
                <span style={{ color: '#ddd' }}>{m.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lobby */}
        {(phase === 'intro' || phase === 'modeselect') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, padding: '16px 14px', overflowY: 'auto', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 70%), linear-gradient(180deg, #06101E, #0c1a38 50%, #081830)' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>🔫</div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #4CAF50, #81C784)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TANK WAR</div>
              <div style={{ fontSize: 8, color: '#666', letterSpacing: 2, marginTop: 2 }}>MOOD LAB PUFF SYSTEM</div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 4, marginBottom: 12 }}>
              {[{ id: 'battle', emoji: '⚔️', label: 'BATTLE' }, { id: 'shop', emoji: '🛒', label: 'SHOP' }, { id: 'rank', emoji: '🏆', label: 'RANK' }].map(tab => (
                <div key={tab.id} data-btn="true" onClick={(e) => { e.stopPropagation(); playFx('tap'); setLobbyTab(tab.id); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: lobbyTab === tab.id ? 'linear-gradient(135deg, rgba(245,180,0,0.14), rgba(245,180,0,0.06))' : 'transparent', border: `1px solid ${lobbyTab === tab.id ? 'rgba(245,180,0,0.35)' : 'transparent'}`, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span>{tab.emoji}</span>
                    <span style={{ fontWeight: 700, color: lobbyTab === tab.id ? C.gold : '#888', fontSize: 9 }}>{tab.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {lobbyTab === 'battle' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[{ m: '1v1', emoji: '🎯', name: '1v1 Duel', sub: 'Dual-puff aim+fire', color: '#4CAF50' }, { m: '2v2', emoji: '👥', name: '2v2 Teams', sub: 'You + ally vs 2', color: C.cyan }, { m: 'ffa', emoji: '💀', name: 'Free-for-All', sub: '4 tanks, chaos!', color: C.red }, { m: 'boss', emoji: '🐉', name: 'Boss Battle', sub: 'Co-op vs mega boss', color: C.gold }].map(b => {
                    const sel = selectedMode === b.m;
                    return (
                      <div key={b.m} data-btn="true" onClick={(e) => { e.stopPropagation(); playFx('tap'); setSelectedMode(b.m); if (b.m !== 'boss') setBossIdx(0); }} style={{ padding: '14px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: sel ? `${b.color}15` : `${b.color}06`, border: `1px solid ${sel ? b.color + '40' : b.color + '18'}`, transform: sel ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: sel ? b.color : '#ccc' }}>{b.name}</div>
                        <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>{b.sub}</div>
                        {sel && <div style={{ marginTop: 4, width: 20, height: 3, borderRadius: 2, background: b.color, margin: '4px auto 0' }} />}
                      </div>
                    );
                  })}
                </div>
                {selectedMode === 'boss' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: C.red, letterSpacing: 1.5, marginBottom: 8 }}>CHOOSE BOSS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {TW_BOSSES.map((b, i) => {
                        const sel = bossIdx === i;
                        return (
                          <div key={i} data-btn="true" onClick={(e) => { e.stopPropagation(); playFx('tap'); setBossIdx(i); }} style={{ padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: sel ? `linear-gradient(135deg, ${b.color}15, ${b.color}05)` : 'rgba(255,90,90,0.04)', border: `1.5px solid ${sel ? b.color + '40' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s' }}>
                            <div style={{ fontSize: 24, marginBottom: 3 }}>{b.emoji}</div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: sel ? '#fff' : '#ccc' }}>{b.name}</div>
                            <div style={{ fontSize: 7, color: b.color, marginTop: 2 }}>HP {b.maxHp}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedMode ? (
                  <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(selectedMode); }} style={{ padding: '14px 0', borderRadius: 50, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg, #FFB800, #F5B400, #E09600, #FFB800)', backgroundSize: '200% 100%', boxShadow: '0 8px 32px rgba(245,180,0,0.35)', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: '#0a0600' }}>✦ START BATTLE ✦</span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#666', marginBottom: 12 }}>Select a mode to begin</div>
                )}
              </>
            )}

            {lobbyTab === 'shop' && (
              <>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 8 }}>SHOP</div>
                {['skin', 'trail', 'boost'].map(cat => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 6 }}>{cat === 'skin' ? '🎨 Skins' : cat === 'trail' ? '✨ Trails' : '⚡ Boosts'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {TW_SHOP.filter(s => s.cat === cat).map(item => (
                        <div key={item.id} data-btn="true" onClick={(e) => { e.stopPropagation(); playFx('tap'); }} style={{ padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{item.emoji}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: '#ddd' }}>{item.name}</div>
                          <div style={{ fontSize: 7, fontWeight: 800, color: item.price === 0 ? '#4CAF50' : C.gold, marginTop: 3 }}>{item.price === 0 ? 'FREE' : '🪙 ' + item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {lobbyTab === 'rank' && (
              <>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 10 }}>RANKING</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {TW_RANKS.map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: i === 0 ? 'rgba(245,180,0,0.06)' : 'rgba(0,0,0,0.25)', border: `1px solid ${i === 0 ? 'rgba(245,180,0,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                      <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{r.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: r.color }}>{r.name}</div>
                        <div style={{ fontSize: 7, color: '#888' }}>{r.mn} - {r.mx === 9999 ? '∞' : r.mx} RP</div>
                      </div>
                      {i === 0 && <div style={{ fontSize: 7, fontWeight: 800, color: C.gold }}>YOU</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 20, background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{playerTank?.alive ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: playerTank?.alive ? C.gold : C.red, marginBottom: 8 }}>{playerTank?.alive ? 'VICTORY!' : 'DEFEATED'}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Score: {score}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Mode: {mode === '1v1' ? '1v1 Duel' : mode === '2v2' ? '2v2 Teams' : mode === 'ffa' ? 'Free-for-All' : 'Boss Battle'}</div>
            {puffStreak > 0 && <div style={{ fontSize: 10, color: C.gold, marginTop: 4 }}>Puff Streak: {puffStreak}x</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(mode); }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: '#4CAF5015', border: '1px solid #4CAF5030', fontSize: 12, fontWeight: 800, color: '#4CAF50' }}>🔄 Replay</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); setPhase('modeselect'); setSelectedMode(null); setLobbyTab('battle'); }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, fontSize: 12, fontWeight: 800, color: C.cyan }}>⚔️ Change Mode</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/arcade'); }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, fontWeight: 800, color: '#999' }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8, width: 200 }}>👤 My Progress</div>
          </div>
        )}
      </div>
    </div>
  );
}
