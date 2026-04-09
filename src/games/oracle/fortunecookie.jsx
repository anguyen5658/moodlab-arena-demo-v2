import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const FC_FORTUNES = [
  "Your next blinker will bring unexpected joy",
  "The strain you're smoking right now chose YOU",
  "Someone in this Arena is thinking about your last play",
  "Your puff-to-win ratio is cosmically aligned today",
  "A legendary catch awaits you in HOOKED",
  "The number 420 will appear in your life within 24 hours",
  "Your lungs are your greatest asset. Treat them well",
  "The dealer fears your next hand",
  "Today's high will lead to tomorrow's idea",
  "Your tolerance break starts... eventually",
  "The munchies you're about to get will be LEGENDARY",
  "A friend will ask you for a hit. Share generously",
  "Your next roll will be a natural 7",
  "The universe rewards those who puff with purpose",
  "You will discover a new favorite strain this month",
  "Your smoke circle is about to get an upgrade",
  "The edible will hit exactly when you forgot about it",
  "Your Puff Clock accuracy will improve by 0.1s tomorrow",
  "A winning streak is written in your stars",
  "The best ideas come after the second puff",
  "Your cart will last exactly as long as you need it to",
  "The dab rig is ready when you are",
];

const FC_RARE_FORTUNES = [
  "You are the chosen one. The Arena bows to you",
  "A 1000-coin jackpot is in your near future",
  "Your next 3 games will all be winners",
  "The stars align for a perfect blinker tonight",
];

export default function FortuneCookie() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [fortune, setFortune] = useState('');
  const [coins, setLocalCoins] = useState(0);
  const [cracking, setCracking] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [golden, setGolden] = useState(false);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
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
      awardGame('fortunecookie', scoreRef.current > 0 ? 'win' : 'lose');
      return;
    }
    setRound(next); setFortune(''); setLocalCoins(0); setCracking(false); setGolden(false);
    setPhase('holding');
    setCommentary(`Cookie ${next + 1}/5 — HOLD to crack!`);
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    setFortune(''); setLocalCoins(0); setCracking(false); setRound(0); setScore(0); setGolden(false);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Fortune Cookie! HOLD to puff and crack it open!');
    timerRef.current = setTimeout(() => setPhase('holding'), 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'holding') return;
    puffStartRef.current = Date.now();
    setCracking(true);
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'holding' || !puffStartRef.current) return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    setCracking(false);
    if (dur < 0.3) return;

    playFx('cookie_crack');
    const isBlinker = dur >= 4.5;
    setGolden(isBlinker);

    let f;
    if (isBlinker) {
      f = FC_RARE_FORTUNES[Math.floor(Math.random() * FC_RARE_FORTUNES.length)];
      spawnConfetti(30); triggerFlash('goal'); playFx('treasure_find');
      setCommentary('GOLDEN FORTUNE COOKIE! 2x coins!');
      addChat('🥠 GOLDEN FORTUNE COOKIE! 2x coins!');
    } else {
      f = FC_FORTUNES[Math.floor(Math.random() * FC_FORTUNES.length)];
    }

    const fcWin = isBlinker ? Math.floor(50 + Math.random() * 450) : Math.floor(10 + Math.random() * 190);
    setFortune(f);
    setLocalCoins(fcWin);
    setScore(s => { scoreRef.current = s + fcWin; return s + fcWin; });
    setCoins(c => c + fcWin);
    addChat(`🥠 +${fcWin} coins`);
    setPhase('reading');
    timerRef.current = setTimeout(() => setPhase('result'), 3000);
    timerRef.current = setTimeout(() => nextRound(), 4500);
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a0a00 0%, #2a1800 40%, #0a0600 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(251,146,60,0.10), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #FB923C, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FORTUNE COOKIE</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>COOKIE</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🥠</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: 3 }}>FORTUNE COOKIE</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Hold to puff and crack open your fortune!</div>
          </div>
        )}

        {phase === 'holding' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 80, marginBottom: 16, animation: cracking ? 'shake 0.3s infinite' : 'gentleFloat 2s infinite', filter: cracking ? `drop-shadow(0 0 20px ${C.gold})` : 'none' }}>🥠</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>
              {cracking ? 'CRACKING... keep holding!' : 'HOLD TO PUFF & CRACK 🥠'}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Blinker (4.5s+) = GOLDEN COOKIE! 2x coins</div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>{commentary}</div>
          </div>
        )}

        {(phase === 'reading' || phase === 'result') && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 60, marginBottom: 12, filter: golden ? `drop-shadow(0 0 20px ${C.gold})` : 'none' }}>🥠</div>
            {golden && <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, marginBottom: 8, animation: 'pulse 1s infinite' }}>✨ GOLDEN FORTUNE COOKIE ✨</div>}
            <div style={{ padding: '16px 20px', borderRadius: 16, background: `${C.orange}08`, border: `1px solid ${C.orange}20`, marginBottom: 12, maxWidth: 300, margin: '0 auto 12px' }}>
              <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', lineHeight: 1.5 }}>"{fortune}"</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>+{coins} coins!</div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🥠</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 4 }}>ALL COOKIES OPENED!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}
      </div>
    </div>
  );
}
