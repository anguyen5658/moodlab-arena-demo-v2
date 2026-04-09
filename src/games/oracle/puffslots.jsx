import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const SLOTS_SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🌿'];
const SLOTS_PAYOUTS = { '🍒': 50, '🍋': 75, '🔔': 100, '💎': 200, '7️⃣': 500, '🌿': 1000 };

export default function PuffSlots() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [win, setWin] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [bonusRound, setBonusRound] = useState(false);
  const [history, setHistory] = useState([]);
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
    if (next >= 8) {
      setPhase('complete');
      const sc = scoreRef.current;
      playFx(sc > 0 ? 'win' : 'lose');
      awardGame('puffslots', sc > 0 ? 'win' : 'lose');
      return;
    }
    setRound(next);
    setWin(0);
    setBonusRound(false);
    setPhase('ready');
    setCommentary(`Spin ${next + 1}/8 — HOLD to puff!`);
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    setReels(['🍒', '🍒', '🍒']);
    setWin(0);
    setRound(0);
    setScore(0);
    setBonusRound(false);
    setHistory([]);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Welcome to Puff Slots! Hold to spin!');
    timerRef.current = setTimeout(() => setPhase('ready'), 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    puffStartRef.current = Date.now();
    setPhase('spinning');
    playFx('whistle');
    setCommentary('Reels are spinning...');
  }, [playFx]);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'spinning') return;
    if (!puffStartRef.current) return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;

    const isBlinker = dur >= 4.5;
    setBonusRound(isBlinker);

    const pick = () => SLOTS_SYMBOLS[Math.floor(Math.random() * SLOTS_SYMBOLS.length)];
    let r1, r2, r3;
    if (isBlinker) {
      r1 = pick(); r2 = r1;
      r3 = Math.random() > 0.5 ? r1 : pick();
      setCommentary('BLINKER BONUS! 2x multiplier active!');
      addChat('🎰 BLINKER BONUS! 2x multiplier!');
    } else {
      r1 = pick(); r2 = pick(); r3 = pick();
    }

    const finalReels = [r1, r2, r3];
    setReels(['❓', '❓', '❓']);
    playFx('slot_spin');

    timerRef.current = setTimeout(() => { setReels([r1, '❓', '❓']); playFx('slot_stop'); }, 400);
    timerRef.current = setTimeout(() => { setReels([r1, r2, '❓']); playFx('slot_stop'); }, 800);
    timerRef.current = setTimeout(() => {
      setReels(finalReels);
      playFx('slot_stop');

      let w = 0;
      if (r1 === r2 && r2 === r3) {
        w = SLOTS_PAYOUTS[r1] || 50;
        if (isBlinker) w *= 2;
        spawnConfetti(40);
        triggerFlash('goal');
        playFx('crowd');
        if (r1 === '🌿') setCommentary('JACKPOT! 🌿🌿🌿 CANNABIS JACKPOT!!!');
        else if (r1 === '7️⃣') setCommentary('TRIPLE SEVENS! MASSIVE WIN!');
        else setCommentary(`WINNER! ${r1}${r1}${r1} pays out ${w}!`);
        addChat(`🎰 JACKPOT! ${r1}${r1}${r1} = +${w} coins!`);
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        w = isBlinker ? 20 : 10;
        setCommentary(`Two matching! Small win: +${w}`);
        addChat(`🎰 Two match! +${w} coins`);
      } else {
        setCommentary('No match. Try again!');
      }

      setWin(w);
      setScore(s => { scoreRef.current = s + w; return s + w; });
      if (w > 0) setCoins(c => c + w);
      setHistory(h => [...h, { reels: finalReels, win: w, bonus: isBlinker }]);
      setPhase('result');
      timerRef.current = setTimeout(() => nextRound(), 2500);
    }, 1200);
  }, [playFx, spawnConfetti, triggerFlash, addChat, nextRound, setCoins]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line

  const handleBack = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    navigate('/oracle');
  }, [navigate]);

  const isReady = phase === 'ready';
  const isSpin = phase === 'spinning';
  const isRes = phase === 'result';
  const isComp = phase === 'complete';

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 40%, #0d0d20 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.08), transparent 60%)', pointerEvents: 'none' }} />

      {/* Confetti */}
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={handleBack} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #FFD700, #FF6B00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PUFF SLOTS</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/8</div><div style={{ fontSize: 8, color: C.text3 }}>SPIN</div></div>
          {bonusRound && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.purple }}>2x</div><div style={{ fontSize: 8, color: C.text3 }}>BONUS</div></div>}
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎰</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFD700', letterSpacing: 3 }}>PUFF SLOTS</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Hold to spin! Blinker (4.5s+) = BONUS ROUND</div>
          </div>
        )}

        {/* Machine */}
        {(isReady || isSpin || isRes) && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ padding: 20, borderRadius: 20, border: '3px solid #FFD70050', background: 'linear-gradient(180deg, rgba(255,215,0,0.08), rgba(0,0,0,0.4))', boxShadow: '0 0 40px rgba(255,215,0,0.15), inset 0 0 30px rgba(255,215,0,0.05)', margin: '0 auto', maxWidth: 300 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, marginBottom: 12, letterSpacing: 3 }}>CASINO ROYALE</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {reels.map((sym, i) => (
                  <div key={i} style={{ width: 70, height: 80, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(20,10,30,0.8))', border: '2px solid rgba(255,215,0,0.3)', boxShadow: sym !== '❓' ? '0 0 15px rgba(255,215,0,0.2)' : 'none', animation: isSpin ? `pulse 0.3s infinite ${i * 0.1}s` : 'none', transition: 'all 0.3s' }}>
                    {sym}
                  </div>
                ))}
              </div>
              {isRes && win > 0 && <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, animation: 'pulse 1s infinite', marginBottom: 8 }}>WIN +{win}{bonusRound ? ' (2x BONUS!)' : ''}</div>}
              {isRes && win === 0 && <div style={{ fontSize: 16, fontWeight: 700, color: C.text3, marginBottom: 8 }}>No match</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 8 }}>
                {SLOTS_SYMBOLS.map(s => (
                  <div key={s} style={{ fontSize: 8, color: C.text3, padding: '2px 4px', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }}>{s}{s}{s} = {SLOTS_PAYOUTS[s]}</div>
                ))}
              </div>
            </div>
            {isReady && <div style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>PUFF TO SPIN 🎰</div>}
            {isSpin && <div style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: C.cyan, animation: 'pulse 0.5s infinite' }}>SPINNING... RELEASE TO STOP</div>}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: h.win > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.03)', border: h.win > 0 ? '1px solid rgba(34,197,94,0.20)' : '1px solid rgba(255,255,255,0.06)', color: h.win > 0 ? C.green : C.text3 }}>
                {h.reels.join('')}{h.win > 0 ? ' +' + h.win : ''}
              </div>
            ))}
          </div>
        )}

        {/* Complete */}
        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎰</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>ALL SPINS COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.30)', fontSize: 13, fontWeight: 800, color: '#FFD700' }}>Play Again</div>
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
