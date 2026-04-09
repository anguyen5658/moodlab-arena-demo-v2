import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const MB_PRIZES = [
  { name: '50 Coins', value: 50, emoji: '🪙', rarity: 'common', color: C.cyan },
  { name: '100 Coins', value: 100, emoji: '💰', rarity: 'common', color: C.green },
  { name: '200 Coins', value: 200, emoji: '💎', rarity: 'rare', color: C.purple },
  { name: '500 Coins', value: 500, emoji: '🏆', rarity: 'rare', color: C.gold },
  { name: 'Lucky Charm', value: 150, emoji: '🍀', rarity: 'rare', color: C.lime },
  { name: 'JACKPOT!', value: 1000, emoji: '👑', rarity: 'legendary', color: C.gold },
  { name: 'Empty Box', value: 0, emoji: '📦', rarity: 'common', color: C.text3 },
  { name: 'Blinker Badge', value: 100, emoji: '💀', rarity: 'rare', color: C.red },
];

const genBoxes = () => {
  const pick = () => MB_PRIZES[Math.floor(Math.random() * MB_PRIZES.length)];
  return [pick(), pick(), pick()];
};

export default function MysteryBox() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const pickedRef = useRef(picked);
  const boxesRef = useRef(boxes);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pickedRef.current = picked; }, [picked]);
  useEffect(() => { boxesRef.current = boxes; }, [boxes]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= 5) {
      setPhase('complete');
      playFx(scoreRef.current > 0 ? 'win' : 'lose');
      awardGame('mysterybox', scoreRef.current > 0 ? 'win' : 'lose');
      return;
    }
    const newBoxes = genBoxes();
    setRound(next); setBoxes(newBoxes); boxesRef.current = newBoxes;
    setPicked(null); setRevealed(false); setPrize(null);
    setPhase('pick');
    setCommentary(`Round ${next + 1}/5 — Pick a box!`);
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    const newBoxes = genBoxes();
    setBoxes(newBoxes); boxesRef.current = newBoxes;
    setPicked(null); setRevealed(false); setPrize(null);
    setRound(0); setScore(0);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Mystery Box! Pick a box and puff to reveal!');
    timerRef.current = setTimeout(() => setPhase('pick'), 1500);
  }, [playFx]);

  const pickBox = useCallback((idx) => {
    if (phaseRef.current !== 'pick') return;
    setPicked(idx); pickedRef.current = idx;
    playFx('select');
    setCommentary(`Box ${idx + 1} selected! HOLD to puff and open it!`);
    setPhase('puffing');
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'puffing' || pickedRef.current === null) return;
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'puffing' || pickedRef.current === null || !puffStartRef.current) return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    if (dur < 0.2) return;

    const isBlinker = dur >= 4.5;
    const idx = pickedRef.current;
    let p = boxesRef.current[idx];

    if (isBlinker && p.rarity === 'common') {
      const rarePool = MB_PRIZES.filter(pr => pr.rarity !== 'common');
      p = rarePool[Math.floor(Math.random() * rarePool.length)];
      setCommentary('BLINKER UPGRADE! Rarity boosted!');
      spawnConfetti(30); triggerFlash('goal');
    }

    setPrize(p); setRevealed(true); setPhase('reveal');
    playFx('box_open');
    if (p.value > 0) {
      setScore(s => { scoreRef.current = s + p.value; return s + p.value; });
      setCoins(c => c + p.value);
    }

    if (p.rarity === 'legendary') {
      spawnConfetti(50); triggerFlash('goal'); playFx('treasure_find');
      setCommentary(`LEGENDARY! ${p.emoji} ${p.name}!`);
      addChat(`👑 LEGENDARY: ${p.name} +${p.value} coins!`);
    } else if (p.rarity === 'rare') {
      spawnConfetti(20); playFx('treasure_find');
      setCommentary(`Rare find! ${p.emoji} ${p.name}`);
      addChat(`💎 Rare: ${p.name} +${p.value} coins`);
    } else if (p.value > 0) {
      playFx('coin_collect');
      setCommentary(`${p.emoji} ${p.name} — nice!`);
      addChat(`🎁 ${p.name} +${p.value} coins`);
    } else {
      playFx('error');
      setCommentary('Empty box... better luck next time!');
      addChat('📦 Empty box...');
    }

    timerRef.current = setTimeout(() => nextRound(), 2500);
  }, [playFx, spawnConfetti, triggerFlash, addChat, nextRound, setCoins]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line

  const isComp = phase === 'complete';

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0a18 0%, #180a28 40%, #0d0d20 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.08), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #FFD700, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MYSTERY BOX</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold, letterSpacing: 3 }}>MYSTERY BOX</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Pick a box and puff to reveal your prize!</div>
          </div>
        )}

        {(phase === 'pick' || phase === 'puffing') && boxes.length > 0 && (
          <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
              {boxes.map((_, i) => (
                <div key={i} data-btn="true" onClick={(e) => { e.stopPropagation(); pickBox(i); }} style={{ width: 90, height: 90, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: phase === 'pick' ? 'pointer' : 'default', background: picked === i ? `${C.gold}12` : 'rgba(255,255,255,0.04)', border: `2px solid ${picked === i ? C.gold : 'rgba(255,255,255,0.12)'}`, transition: 'all 0.2s', transform: picked === i ? 'scale(1.08)' : 'scale(1)' }}>
                  <div style={{ fontSize: 32 }}>{picked === i && phase === 'puffing' ? '📤' : '🎁'}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: picked === i ? C.gold : C.text3, marginTop: 4 }}>Box {i + 1}</div>
                </div>
              ))}
            </div>
            {phase === 'pick' && <div style={{ textAlign: 'center', fontSize: 12, color: C.text3 }}>TAP a box to select it 🎁</div>}
            {phase === 'puffing' && <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>HOLD TO PUFF & OPEN! 🎁</div>}
          </div>
        )}

        {phase === 'reveal' && prize && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 72, marginBottom: 8, animation: 'countPulse 0.5s ease', filter: prize.rarity === 'legendary' ? `drop-shadow(0 0 20px ${prize.color})` : 'none' }}>{prize.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: prize.color, marginBottom: 4 }}>{prize.name}</div>
            {prize.value > 0 && <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>+{prize.value} coins!</div>}
            <div style={{ fontSize: 9, fontWeight: 700, color: prize.color, padding: '2px 10px', borderRadius: 4, background: `${prize.color}12`, display: 'inline-block', marginTop: 4, textTransform: 'uppercase' }}>{prize.rarity}</div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 4 }}>ALL BOXES OPENED!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 13, fontWeight: 800, color: C.gold }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  );
}
