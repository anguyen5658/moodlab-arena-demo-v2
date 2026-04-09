import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';
import GameHeader from '../../components/GameHeader.jsx';

// ── Constants ──────────────────────────────────────────────────────────────
const ROOF_W = 860, ROOF_H = 1000;
const ROOF_GRAVITY = 0.52;
const ROOF_JUMP_V = -10.5;
const ROOF_DOUBLE_JUMP_V = -8.5;
const ROOF_BASE_SPEED = 3.8;
const ROOF_BOOST_TAP = 1.3;
const ROOF_BOOST_DRY = 1.5;
const ROOF_BOOST_REAL = 1.7;
const ROOF_BOOST_BLINKER = 2.0;
const ROOF_BOOST_JUMP = 1.2;
const ROOF_GROUND = ROOF_H * 0.65;
const ROOF_RUNNER_COLORS = ['#00E5FF', '#FF6B8A', '#7CFF6B', '#F5B400'];
const ROOF_BOT_NAMES = ['NeonDash', 'BlazeFeet', 'CloudHop', 'PuffRunner'];
const ROOF_DPR = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
const ROOF_GC = '#00E5FF';

// ── World helpers ──────────────────────────────────────────────────────────
function mkRunner(id, isBot, name, col) {
  return { id, x: 60 + id * 30, y: 0, vy: 0, w: 18, h: 28, onG: false, jumps: 0, maxJ: 2, dead: false, isBot, col, name, boost: { fuel: 100, max: 100, on: false }, aiJumpT: 0, aiBoostT: 0, frame: 0, place: 0, deathT: 0 };
}

function initWorld() {
  const G = { runners: [], platforms: [], obstacles: [], items: [], parts: [], stars: [], bgBuildings: [], cam: 0, baseSpd: ROOF_BASE_SPEED, dist: 0, score: 0, coins: 0, t: 0, deathOrder: [], finished: false, toasts: [] };
  for (let i = 0; i < 50; i++) G.stars.push({ x: Math.random() * ROOF_W * 3, y: Math.random() * ROOF_H * 0.4, s: 0.5 + Math.random() * 1.5, b: 0.3 + Math.random() * 0.7 });
  for (let i = 0; i < 25; i++) G.bgBuildings.push({ x: i * 80 + Math.random() * 40, w: 30 + Math.random() * 60, h: 80 + Math.random() * 150, hue: Math.random() * 360 });
  let px = 0;
  for (let i = 0; i < 15; i++) {
    const w = 75 + Math.random() * 95; const gap = i === 0 ? 0 : 30 + Math.random() * 30;
    const y = ROOF_GROUND + Math.random() * 30 - 15;
    G.platforms.push({ x: px + gap, y: Math.max(ROOF_H * 0.45, Math.min(ROOF_H * 0.8, y)), w, h: 14, col: `hsl(${Math.random() * 360},15%,25%)` });
    px += gap + w;
    if (i > 0) { for (let c = 0; c < Math.floor(w / 25); c++) { if (Math.random() < 0.55) G.items.push({ x: G.platforms[G.platforms.length - 1].x + 15 + c * 25, y: G.platforms[G.platforms.length - 1].y - 20, type: 'coin', alive: true }); } }
    if (i > 2 && Math.random() < 0.1) G.items.push({ x: G.platforms[G.platforms.length - 1].x + w / 2, y: G.platforms[G.platforms.length - 1].y - 25, type: 'boost', alive: true });
    if (i > 4 && Math.random() < 0.25) { const ox = G.platforms[G.platforms.length - 1].x + 20 + Math.random() * (w - 40); const oy = G.platforms[G.platforms.length - 1].y; G.obstacles.push({ x: ox, y: oy, w: 12, h: 18, type: Math.random() < 0.5 ? 'spike' : 'barrier' }); }
  }
  return G;
}

function extWorld(G) {
  const lastP = G.platforms[G.platforms.length - 1]; const edge = lastP.x + lastP.w; const ahead = G.cam + ROOF_W * 3;
  if (edge < ahead) {
    const diffMult = 1 + G.dist * 0.0003; const count = 8 + Math.floor(Math.random() * 4); let px = edge;
    for (let i = 0; i < count; i++) {
      const gap = Math.min(80, 30 + Math.random() * 25 * diffMult); const w = Math.max(40, 90 - G.dist * 0.008 + Math.random() * 50);
      const prevY = G.platforms.length > 0 ? G.platforms[G.platforms.length - 1].y : ROOF_GROUND;
      const y = Math.max(ROOF_H * 0.4, Math.min(ROOF_H * 0.82, prevY + (Math.random() - 0.5) * 40));
      G.platforms.push({ x: px + gap, y, w, h: 14, col: `hsl(${Math.random() * 360},15%,25%)` }); px += gap + w;
      for (let c = 0; c < Math.floor(w / 25); c++) { if (Math.random() < 0.5) G.items.push({ x: G.platforms[G.platforms.length - 1].x + 15 + c * 25, y: G.platforms[G.platforms.length - 1].y - 22, type: 'coin', alive: true }); }
      if (Math.random() < 0.08) G.items.push({ x: G.platforms[G.platforms.length - 1].x + w / 2, y: G.platforms[G.platforms.length - 1].y - 28, type: 'boost', alive: true });
      if (G.dist > 200 && Math.random() < 0.3) { const ox = G.platforms[G.platforms.length - 1].x + 15 + Math.random() * (w - 30); const oy = G.platforms[G.platforms.length - 1].y; G.obstacles.push({ x: ox, y: oy, w: 12, h: 18, type: Math.random() < 0.5 ? 'spike' : 'barrier' }); }
    }
  }
  G.platforms = G.platforms.filter(p => p.x + p.w > G.cam - 200);
  G.items = G.items.filter(it => it.x > G.cam - 200);
  G.obstacles = G.obstacles.filter(o => o.x + o.w > G.cam - 200);
  const lastB = G.bgBuildings[G.bgBuildings.length - 1];
  if (lastB && lastB.x < G.cam * 0.12 + ROOF_W + 200) { for (let i = 0; i < 5; i++) G.bgBuildings.push({ x: lastB.x + 80 + i * 80 + Math.random() * 40, w: 30 + Math.random() * 60, h: 80 + Math.random() * 150, hue: Math.random() * 360 }); }
  G.bgBuildings = G.bgBuildings.filter(b => b.x + b.w > G.cam * 0.12 - 200);
  const maxStarX = G.stars.reduce((mx, s) => Math.max(mx, s.x), 0);
  if (maxStarX < G.cam * 0.04 + ROOF_W + 300) { for (let i = 0; i < 10; i++) G.stars.push({ x: maxStarX + 100 + Math.random() * 200, y: Math.random() * ROOF_H * 0.4, s: 0.5 + Math.random() * 1.5, b: 0.3 + Math.random() * 0.7 }); }
  G.stars = G.stars.filter(s => s.x > G.cam * 0.04 - 200);
}

function botThink(runner, G, playFx) {
  if (runner.dead) return;
  runner.aiJumpT -= 1; runner.aiBoostT -= 1;
  const rx = runner.x + G.cam; let hasFloor = false;
  for (const p of G.platforms) { if (p.x <= rx + 60 && p.x + p.w >= rx && Math.abs(p.y - runner.y - runner.h) < 50) { hasFloor = true; break; } }
  let obsAhead = false; for (const o of G.obstacles) { const ox = o.x - G.cam; if (ox > runner.x && ox < runner.x + 50 && Math.abs(runner.y + runner.h - o.y) < 30) { obsAhead = true; break; } }
  if ((!hasFloor || obsAhead) && runner.aiJumpT <= 0 && runner.jumps < runner.maxJ) {
    const bm = runner.boost.on ? ROOF_BOOST_JUMP : 1;
    runner.vy = runner.jumps === 0 ? ROOF_JUMP_V * bm : ROOF_DOUBLE_JUMP_V * bm;
    runner.jumps++; runner.onG = false; runner.aiJumpT = 8 + Math.random() * 10;
    for (let i = 0; i < 3; i++) G.parts.push({ x: runner.x, y: runner.y + runner.h, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 1.5, r: 2, col: 'rgba(255,255,255,0.4)', life: 15, dec: 0.04 });
  }
  if (runner.aiBoostT <= 0 && runner.boost.fuel > 30 && Math.random() < 0.01) { runner.boost.on = true; runner.aiBoostT = 60 + Math.random() * 120; setTimeout(() => { if (runner) runner.boost.on = false; }, 1000 + Math.random() * 2000); }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function RooftopPuff() {
  const navigate = useNavigate();
  const { playFx, awardGame, setCoins, confettiParticles } = useApp();

  const [phase, setPhase] = useState('modeselect'); // modeselect | playing | complete
  const [mode, setMode] = useState('solo');
  const [score, setScore] = useState(0);
  const [dist, setDist] = useState(0);
  const [coins2, setCoins2] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [place, setPlace] = useState(1);
  const [alive, setAlive] = useState(true);
  const [lobbyTab, setLobbyTab] = useState('play');
  const [selectedMode, setSelectedMode] = useState(null);

  const phaseRef = useRef(phase);
  const modeRef = useRef(mode);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const gameRef = useRef(null);
  const boostRef = useRef(false);
  const puffStartRef = useRef(0);
  const aliveRef = useRef(true);

  const cleanup = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    gameRef.current = null; boostRef.current = false; puffStartRef.current = 0;
  }, []);

  const getBoostMult = useCallback(() => {
    const start = puffStartRef.current;
    if (!start) return ROOF_BOOST_TAP;
    const dur = (Date.now() - start) / 1000;
    return dur >= 5 ? ROOF_BOOST_BLINKER : ROOF_BOOST_REAL;
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; const G = gameRef.current; if (!canvas || !G) return;
    const ctx = canvas.getContext('2d'); const cw = canvas.width / ROOF_DPR; const ch = canvas.height / ROOF_DPR;
    ctx.save(); ctx.scale(ROOF_DPR, ROOF_DPR);
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch); skyGrad.addColorStop(0, '#050515'); skyGrad.addColorStop(0.5, '#0a0a25'); skyGrad.addColorStop(1, '#151025');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, cw, ch);
    // Stars
    const starOff = G.cam * 0.04;
    for (const s of G.stars) { const sx = s.x - starOff; if (sx < -5 || sx > cw + 5) continue; ctx.globalAlpha = s.b * (0.5 + Math.sin(G.t * 0.03 + s.x) * 0.3); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, s.y, s.s, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    // Moon
    const moonX = cw - 60, moonY = 50;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 50); moonGrad.addColorStop(0, 'rgba(200,220,255,0.25)'); moonGrad.addColorStop(0.3, 'rgba(150,180,220,0.08)'); moonGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moonGrad; ctx.fillRect(moonX - 50, moonY - 50, 100, 100); ctx.fillStyle = 'rgba(220,235,255,0.9)'; ctx.beginPath(); ctx.arc(moonX, moonY, 10, 0, Math.PI * 2); ctx.fill();
    // BG Buildings
    const bldOff = G.cam * 0.12;
    for (const b of G.bgBuildings) {
      const bx = b.x - bldOff; if (bx + b.w < -10 || bx > cw + 10) continue;
      const by = ch - b.h * 0.6; ctx.fillStyle = `hsla(${b.hue},20%,12%,0.7)`; ctx.fillRect(bx, by, b.w, b.h);
      const wR = Math.floor(b.h / 18); const wC = Math.floor(b.w / 12);
      for (let wr = 0; wr < wR; wr++) { for (let wc = 0; wc < wC; wc++) { if (Math.sin(b.x * 3 + wr * 7 + wc * 13) > 0.1) { ctx.fillStyle = `hsla(${40 + b.hue * 0.3},60%,65%,${0.15 + Math.sin(G.t * 0.01 + wr + wc) * 0.1})`; ctx.fillRect(bx + 4 + wc * 12, by + 8 + wr * 18, 5, 6); } } }
    }
    // Platforms
    for (const p of G.platforms) {
      const ppx = p.x - G.cam; if (ppx + p.w < -20 || ppx > cw + 20) continue;
      const bodyH = ch - p.y + 20; ctx.fillStyle = 'rgba(18,22,35,0.95)'; ctx.fillRect(ppx, p.y, p.w, bodyH);
      ctx.fillStyle = p.col; ctx.fillRect(ppx, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(ppx, p.y, p.w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(ppx, p.y, 2, bodyH);
    }
    // Obstacles
    for (const o of G.obstacles) {
      const ox = o.x - G.cam; if (ox < -20 || ox > cw + 20) continue;
      if (o.type === 'spike') { ctx.fillStyle = '#FF3B3B'; ctx.beginPath(); ctx.moveTo(ox, o.y); ctx.lineTo(ox + o.w / 2, o.y - o.h); ctx.lineTo(ox + o.w, o.y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,100,100,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
      else { ctx.fillStyle = '#8B4513'; ctx.fillRect(ox, o.y - o.h, o.w, o.h); ctx.fillStyle = 'rgba(200,150,100,0.3)'; ctx.fillRect(ox, o.y - o.h, o.w, 3); }
    }
    // Items
    for (const it of G.items) {
      if (!it.alive) continue; const ix = it.x - G.cam; if (ix < -15 || ix > cw + 15) continue;
      if (it.type === 'coin') { const bob = Math.sin(G.t * 0.06 + it.x * 0.1) * 3; const spin = Math.cos(G.t * 0.08 + it.x * 0.05); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.ellipse(ix, it.y + bob, 5 * Math.abs(spin), 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,215,0,0.3)'; ctx.beginPath(); ctx.arc(ix, it.y + bob, 8, 0, Math.PI * 2); ctx.fill(); }
      else if (it.type === 'boost') { const bob = Math.sin(G.t * 0.05 + it.x) * 2; ctx.fillStyle = '#00E5FF'; ctx.beginPath(); ctx.arc(ix, it.y + bob, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,229,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, it.y + bob, 9, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚡', ix, it.y + bob + 3); }
    }
    // Runners
    for (const r of G.runners) {
      if (r.dead) { if (G.t - r.deathT < 40) { ctx.globalAlpha = 1 - (G.t - r.deathT) / 40; ctx.fillStyle = r.col; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💀', r.x, r.y); ctx.globalAlpha = 1; } continue; }
      const rx = r.x, ry = r.y;
      if (r.boost.on) {
        const glG = ctx.createRadialGradient(rx + r.w / 2, ry + r.h / 2, 5, rx + r.w / 2, ry + r.h / 2, 25); glG.addColorStop(0, r.col + '40'); glG.addColorStop(1, 'transparent');
        ctx.fillStyle = glG; ctx.fillRect(rx - 15, ry - 10, r.w + 30, r.h + 20);
        for (let ti = 0; ti < 3; ti++) { ctx.globalAlpha = 0.15 - ti * 0.04; ctx.fillStyle = r.col; ctx.fillRect(rx - 5 - ti * 8, ry + 4, 4, r.h - 8); } ctx.globalAlpha = 1;
      }
      ctx.fillStyle = r.col; ctx.beginPath(); ctx.roundRect(rx + 2, ry + 2, r.w - 4, r.h * 0.6, 3); ctx.fill();
      ctx.beginPath(); ctx.arc(rx + r.w / 2, ry + 2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = r.isBot ? 'rgba(255,255,255,0.4)' : '#FFD700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rx + r.w / 2, ry + 1, 6, Math.PI * 0.8, Math.PI * 0.2); ctx.stroke();
      const legSwing = Math.sin(r.frame * 0.3) * 4; ctx.strokeStyle = r.col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(rx + r.w / 2 - 3, ry + r.h * 0.6); ctx.lineTo(rx + r.w / 2 - 3 + legSwing, ry + r.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx + r.w / 2 + 3, ry + r.h * 0.6); ctx.lineTo(rx + r.w / 2 + 3 - legSwing, ry + r.h); ctx.stroke();
      const armSwing = Math.sin(r.frame * 0.3 + Math.PI) * 3;
      ctx.beginPath(); ctx.moveTo(rx + 2, ry + r.h * 0.25); ctx.lineTo(rx - 3 + armSwing, ry + r.h * 0.45); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx + r.w - 2, ry + r.h * 0.25); ctx.lineTo(rx + r.w + 3 - armSwing, ry + r.h * 0.45); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(r.name, rx + r.w / 2, ry - 6);
    }
    // Boost speed lines
    const player = G.runners[0];
    if (player && player.boost.on && !player.dead) { for (let i = 0; i < 5; i++) { const lx = Math.random() * cw, ly = Math.random() * ch * 0.8; ctx.globalAlpha = 0.15; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 20 - Math.random() * 30, ly); ctx.stroke(); } ctx.globalAlpha = 1; }
    // Particles
    for (const pt of G.parts) { ctx.globalAlpha = pt.life * pt.dec > 1 ? 1 : pt.life * pt.dec; ctx.fillStyle = pt.col; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (pt.life / 30), 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, cw, 28);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('🏃 ' + Math.floor(G.dist) + 'm', 8, 18);
    ctx.textAlign = 'center'; ctx.fillText('🪙 ' + G.coins, cw / 2, 18);
    ctx.textAlign = 'right'; ctx.fillStyle = '#FFD700'; ctx.fillText(G.score + Math.floor(G.dist) + ' pts', cw - 8, 18);
    if (G.runners.length > 1) {
      const alive2 = G.runners.filter(r2 => !r2.dead).sort((a, b) => b.x - a.x);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(cw - 80, 30, 75, alive2.length * 14 + 6);
      alive2.forEach((r2, i) => { ctx.fillStyle = r2.col; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'right'; ctx.fillText((i + 1) + '. ' + r2.name, cw - 12, 40 + i * 14); });
    }
    // Toasts
    for (const t of G.toasts) { const age = G.t - t.t; if (age > 90) continue; ctx.globalAlpha = age < 10 ? age / 10 : age > 70 ? (90 - age) / 20 : 1; ctx.fillStyle = t.col || '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.text, cw / 2, ch * 0.35 - age * 0.3); } ctx.globalAlpha = 1;
    ctx.restore();
  }, []);

  const gameOver = useCallback((won) => {
    const G = gameRef.current; if (!G) return;
    const reward = won ? 50 + G.coins * 5 : 10 + G.coins * 2;
    setScore(G.score + Math.floor(G.dist));
    setCoins(c => c + reward);
    playFx(won ? 'win' : 'lose');
    awardGame('rooftoppuff', won ? 'win' : 'lose');
    setPhase('complete');
  }, [playFx, awardGame, setCoins]);

  const update = useCallback(() => {
    const G = gameRef.current; if (!G || G.finished) return;
    G.t++; const player = G.runners[0];
    if (player && !player.dead) {
      player.boost.on = boostRef.current && player.boost.fuel > 0;
      if (player.boost.on) { player.boost.fuel = Math.max(0, player.boost.fuel - 0.4); if (player.boost.fuel <= 0) { player.boost.on = false; boostRef.current = false; } }
      else { player.boost.fuel = Math.min(player.boost.max, player.boost.fuel + 0.08); }
    }
    const boostM = player && player.boost.on ? getBoostMult() : 1;
    const spdBase = G.baseSpd + G.dist * 0.003; const camSpd = spdBase * boostM;
    G.cam += camSpd; G.dist += camSpd * 0.3;
    for (const r of G.runners) {
      if (r.dead) continue;
      r.vy += ROOF_GRAVITY; r.y += r.vy; r.onG = false;
      for (const p of G.platforms) { const rx2 = r.x + G.cam; if (rx2 + r.w > p.x && rx2 < p.x + p.w && r.vy >= 0) { const pt2 = p.y - r.h; if (r.y >= pt2 - 6 && r.y <= pt2 + 12) { r.y = pt2; r.vy = 0; r.onG = true; r.jumps = 0; break; } } }
      const rx3 = r.x + G.cam;
      for (const o of G.obstacles) { if (rx3 + r.w > o.x + 3 && rx3 < o.x + o.w - 3 && r.y + r.h > o.y - o.h + 3 && r.y < o.y) { if (!r.dead) { r.dead = true; r.deathT = G.t; G.deathOrder.push({ name: r.name, id: r.id, t: G.t }); for (let i = 0; i < 15; i++) G.parts.push({ x: r.x, y: r.y + r.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 3, r: 2 + Math.random() * 3, col: r.col, life: 30, dec: 0.025 }); if (!r.isBot) { playFx('miss'); G.toasts.push({ text: 'You crashed!', t: G.t, col: '#EF4444' }); } else { G.toasts.push({ text: r.name + ' fell!', t: G.t, col: r.col }); } } } }
      if (r.y > ROOF_H + 60 && !r.dead) { r.dead = true; r.deathT = G.t; G.deathOrder.push({ name: r.name, id: r.id, t: G.t }); if (!r.isBot) { playFx('miss'); G.toasts.push({ text: 'You fell!', t: G.t, col: '#EF4444' }); } else { G.toasts.push({ text: r.name + ' fell!', t: G.t, col: r.col }); } }
      if (r.isBot && !r.dead) botThink(r, G, playFx);
      if (!r.isBot && !r.dead) {
        for (const it of G.items) {
          if (!it.alive) continue; const ix = it.x - G.cam;
          if (Math.abs(ix - r.x) < 20 && Math.abs(it.y - r.y - r.h / 2) < 20) {
            it.alive = false;
            if (it.type === 'coin') { G.coins++; G.score += 10; for (let i = 0; i < 4; i++) G.parts.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, r: 2, col: '#FFD700', life: 20, dec: 0.04 }); }
            if (it.type === 'boost') { r.boost.fuel = Math.min(r.boost.max, r.boost.fuel + 40); G.parts.push({ x: r.x, y: r.y, vx: 0, vy: -2, r: 4, col: '#00E5FF', life: 25, dec: 0.03 }); playFx('select'); }
          }
        }
      }
      r.frame++;
    }
    extWorld(G);
    G.parts = G.parts.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 1; return p.life > 0; });
    G.toasts = G.toasts.filter(t => G.t - t.t < 120);
    if (G.t % 6 === 0) {
      setDist(Math.floor(G.dist)); setCoins2(G.coins); setScore(G.score + Math.floor(G.dist));
      if (player) setFuel(Math.round(player.boost.fuel));
      const aliveR = G.runners.filter(r2 => !r2.dead).sort((a, b) => b.x - a.x);
      const playerR = aliveR.find(r2 => !r2.isBot);
      if (playerR) setPlace(aliveR.indexOf(playerR) + 1);
      if (player && player.dead && aliveRef.current) { aliveRef.current = false; setAlive(false); }
    }
    if (player && player.dead && !G.finished) { G.finished = true; setTimeout(() => gameOver(false), 800); }
    if (modeRef.current === 'solo' && G.dist >= 3000 && !G.finished && player && !player.dead) { G.finished = true; setTimeout(() => gameOver(true), 500); }
    if (modeRef.current !== 'solo') { const ab = G.runners.filter(r2 => r2.isBot && !r2.dead); if (ab.length === 0 && player && !player.dead && !G.finished) { G.finished = true; setTimeout(() => gameOver(true), 500); } }
  }, [getBoostMult, playFx, gameOver]);

  const startGame = useCallback((m) => {
    cleanup();
    const G = initWorld();
    const numR = m === 'solo' ? 1 : m === '1v1' ? 2 : 4;
    for (let i = 0; i < numR; i++) {
      const isBot = i > 0; const name = isBot ? ROOF_BOT_NAMES[i - 1] || ('Bot' + i) : 'You';
      const col = ROOF_RUNNER_COLORS[i % ROOF_RUNNER_COLORS.length];
      const r = mkRunner(i, isBot, name, col);
      if (G.platforms.length > 0) { r.y = G.platforms[0].y - r.h; r.x = 60 + i * 30; r.onG = true; }
      G.runners.push(r);
    }
    gameRef.current = G; boostRef.current = false; puffStartRef.current = 0;
    aliveRef.current = true;
    setMode(m); modeRef.current = m;
    setScore(0); setDist(0); setCoins2(0); setFuel(100); setPlace(1); setAlive(true);
    setPhase('playing');
    const loop = () => { if (!gameRef.current) return; update(); drawCanvas(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  }, [cleanup, update, drawCanvas]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const G = gameRef.current; if (!G) return;
    const p = G.runners[0]; if (!p || p.dead) return;
    if (p.jumps < p.maxJ) {
      const bm = p.boost.on ? ROOF_BOOST_JUMP : 1;
      p.vy = p.jumps === 0 ? ROOF_JUMP_V * bm : ROOF_DOUBLE_JUMP_V * bm;
      p.jumps++; p.onG = false;
      playFx('tap');
      for (let i = 0; i < 5; i++) G.parts.push({ x: p.x, y: p.y + p.h, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, r: 2 + Math.random() * 2, col: 'rgba(255,255,255,0.5)', life: 20, dec: 0.03 });
    }
  }, [playFx]);

  const puffStart = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    boostRef.current = true; puffStartRef.current = Date.now();
  }, []);

  const puffStop = useCallback(() => {
    boostRef.current = false; puffStartRef.current = 0;
  }, []);

  // BLE: puff = boost, tap = jump (no BLE for jump — handled by screen tap)
  // BLE down → boost start, BLE up → boost stop
  useEffect(() => {
    // No direct BLE for this game in the monolith; puff is mapped to boost
    // The game uses screen tap for jump and hold for boost
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, []); // eslint-disable-line

  const isPlaying = phase === 'playing';
  const isComplete = phase === 'complete';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #050515 0%, #0a0a25 30%, #151025 60%, #0a0a20 100%)', zIndex: 0 }} />

      <GameHeader
        backTo={() => { if (isPlaying) { cleanup(); setPhase('modeselect'); setSelectedMode(null); setLobbyTab('play'); } else { cleanup(); navigate('/arcade'); } }}
        backLabel={isPlaying ? 'Lobby' : 'Arcade'}
        accent={ROOF_GC}
        mid={isPlaying ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>🏃 {dist}m</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: C.gold }}>🪙 {coins2}</span>
            {mode !== 'solo' && <span style={{ fontSize: 8, fontWeight: 800, color: place === 1 ? C.gold : place === 2 ? '#C0C0C0' : '#CD7F32' }}>#{place}</span>}
          </div>
        ) : null}
        row3={isPlaying ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 7, fontWeight: 800, color: fuel > 50 ? ROOF_GC : fuel > 20 ? '#F59E0B' : '#EF4444', flexShrink: 0 }}>⚡</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: fuel + '%', borderRadius: 2, background: fuel > 50 ? `linear-gradient(90deg, ${ROOF_GC}, #66FFCC)` : fuel > 20 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)', transition: 'width 0.15s' }} />
            </div>
            <span style={{ fontSize: 7, fontWeight: 700, color: '#888' }}>{fuel}%</span>
          </div>
        ) : null}
      />

      {/* Game Area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
        onClick={(e) => { if (e.target.closest('[data-btn]')) return; if (isPlaying) jump(); }}
      >
        {/* Canvas */}
        {isPlaying && (
          <canvas ref={canvasRef} width={Math.round(ROOF_W * ROOF_DPR)} height={Math.round(ROOF_H * ROOF_DPR)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />
        )}

        {/* Mode Select */}
        {phase === 'modeselect' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, padding: '16px 14px', overflowY: 'auto', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 70%), linear-gradient(180deg, #050515, #0a0a25 50%, #0a0a20)' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>🏃</div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg, #00E5FF, #66FFCC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ROOFTOP PUFF</div>
              <div style={{ fontSize: 8, color: '#666', letterSpacing: 2, marginTop: 2 }}>ENDLESS RUNNER PARKOUR</div>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 4, marginBottom: 12 }}>
              {[{ id: 'play', emoji: '🎮', label: 'PLAY' }, { id: 'rank', emoji: '🏆', label: 'RANK' }].map(tab => (
                <div key={tab.id} data-btn="true" onClick={(e) => { e.stopPropagation(); playFx('tap'); setLobbyTab(tab.id); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: lobbyTab === tab.id ? 'linear-gradient(135deg, rgba(245,180,0,0.14), rgba(245,180,0,0.06))' : 'transparent', border: `1px solid ${lobbyTab === tab.id ? 'rgba(245,180,0,0.35)' : 'transparent'}`, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span>{tab.emoji}</span>
                    <span style={{ fontWeight: 700, letterSpacing: 0.5, color: lobbyTab === tab.id ? C.gold : '#888', fontSize: 9 }}>{tab.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {lobbyTab === 'play' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[{ m: 'solo', emoji: '🏃', name: 'Solo Run', sub: 'Survive 3000m', color: ROOF_GC }, { m: '1v1', emoji: '🎯', name: '1v1 Race', sub: 'Beat one rival', color: '#FF6B8A' }, { m: 'race', emoji: '💀', name: 'Race 4', sub: '4 runners, 1 wins', color: C.gold }].map(b => {
                    const sel = selectedMode === b.m;
                    return (
                      <div key={b.m} data-btn="true" onClick={(e) => { e.stopPropagation(); playFx('tap'); setSelectedMode(b.m); }} style={{ padding: '14px 6px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: sel ? `${b.color}15` : `${b.color}06`, border: `1px solid ${sel ? b.color + '40' : b.color + '18'}`, boxShadow: sel ? `0 0 16px ${b.color}20` : 'none', transform: sel ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: sel ? b.color : '#ccc' }}>{b.name}</div>
                        <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>{b.sub}</div>
                        {sel && <div style={{ marginTop: 4, width: 20, height: 3, borderRadius: 2, background: b.color, margin: '4px auto 0' }} />}
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: ROOF_GC, letterSpacing: 1, marginBottom: 6 }}>HOW TO PLAY</div>
                  <div style={{ fontSize: 8, color: '#aaa', lineHeight: 1.6 }}>
                    👆 <b style={{ color: '#fff' }}>Tap</b> = Jump (tap twice for double jump)<br />
                    💨 <b style={{ color: '#fff' }}>Hold Puff</b> = Speed Boost (uses fuel)<br />
                    🪙 Collect coins for bonus points<br />
                    ⚡ Grab boost pickups to refuel
                  </div>
                </div>
                {selectedMode ? (
                  <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(selectedMode); }} style={{ padding: '14px 0', borderRadius: 50, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg, #00E5FF, #00BCD4, #00E5FF)`, boxShadow: '0 8px 32px rgba(0,229,255,0.35)', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: '#0a0600' }}>✦ START RUN ✦</span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#666', marginBottom: 12 }}>Select a mode to begin</div>
                )}
              </>
            )}

            {lobbyTab === 'rank' && (
              <>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 10 }}>LEADERBOARD</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[{ n: 'CloudRunner', d: 4820, c: 142 }, { n: 'NeonDash', d: 3650, c: 98 }, { n: 'BlazeFeet', d: 2900, c: 75 }, { n: 'You', d: dist || 0, c: coins2 || 0 }].sort((a, b) => b.d - a.d).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: r.n === 'You' ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${r.n === 'You' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
                      <span style={{ fontSize: 14, width: 24, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏃'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: r.n === 'You' ? ROOF_GC : '#ccc' }}>{r.n}</div>
                        <div style={{ fontSize: 7, color: '#888' }}>{r.d}m | {r.c} coins</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>{r.d} pts</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Complete Overlay */}
        {isComplete && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 20, background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{alive ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: alive ? C.gold : C.red, marginBottom: 8 }}>{alive ? 'VICTORY!' : 'GAME OVER'}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Score: {score}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Distance: {dist}m | Coins: {coins2}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Mode: {mode === 'solo' ? 'Solo Run' : mode === '1v1' ? '1v1 Race' : 'Race 4'}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(mode); }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${ROOF_GC}15`, border: `1px solid ${ROOF_GC}30`, fontSize: 12, fontWeight: 800, color: ROOF_GC }}>🔄 Replay</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); setPhase('modeselect'); setSelectedMode(null); setLobbyTab('play'); }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, fontSize: 12, fontWeight: 800, color: C.cyan }}>⚔️ Change Mode</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/arcade'); }} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, fontWeight: 800, color: '#999' }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); cleanup(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8, width: 200 }}>👤 My Progress</div>
          </div>
        )}

        {/* Boost Bar */}
        {isPlaying && (
          <div data-btn="true"
            onMouseDown={(e) => { e.stopPropagation(); puffStart(); }}
            onMouseUp={(e) => { e.stopPropagation(); puffStop(); }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); puffStart(); }}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); puffStop(); }}
            onTouchCancel={(e) => { e.stopPropagation(); puffStop(); }}
            style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, zIndex: 30, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'none', userSelect: 'none' }}
          >
            <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, position: 'relative', zIndex: 1 }}>💨 HOLD FOR BOOST</span>
          </div>
        )}
      </div>
    </div>
  );
}
