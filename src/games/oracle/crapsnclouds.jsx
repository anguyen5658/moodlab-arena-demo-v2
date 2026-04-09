import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const DICE_FACES = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

export default function CrapsNClouds() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [point, setPoint] = useState(null);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [hotDice, setHotDice] = useState(false);
  const [puffing, setPuffing] = useState(false);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const pointRef = useRef(point);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);
  const BET = 50;

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pointRef.current = point; }, [point]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= 8) {
      setPhase('complete');
      playFx(scoreRef.current > 0 ? 'win' : 'lose');
      awardGame('crapsnclouds', scoreRef.current > 0 ? 'win' : 'lose');
      return;
    }
    setRound(next);
    setDice([1, 1]); setResult(null); setHotDice(false); setPoint(null); pointRef.current = null;
    setPhase('rolling');
    setCommentary(`Round ${next + 1}/8 — Come-out roll! HOLD to puff!`);
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    setDice([1, 1]); setRolling(false); setPoint(null); pointRef.current = null;
    setResult(null); setRound(0); setScore(0); setHotDice(false); setPuffing(false);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Craps & Clouds! Puff to roll the dice!');
    timerRef.current = setTimeout(() => { setPhase('rolling'); setCommentary('Come-out roll! HOLD to puff your roll!'); }, 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'rolling') return;
    setPuffing(true);
    puffStartRef.current = Date.now();
    setRolling(true);
    playFx('dice_shake');
    setCommentary('Rolling...');
  }, [playFx]);

  const handleUp = useCallback(() => {
    if (!puffStartRef.current || phaseRef.current !== 'rolling') return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    setPuffing(false);
    setRolling(false);

    const isBlinker = dur >= 4.5;
    setHotDice(isBlinker);

    let base;
    if (dur < 0.5) base = 2 + Math.floor(Math.random() * 2);
    else if (dur < 1.5) base = 4 + Math.floor(Math.random() * 2);
    else if (dur < 2.5) base = 6 + Math.floor(Math.random() * 3);
    else if (dur < 3.5) base = 9 + Math.floor(Math.random() * 2);
    else base = 11 + Math.floor(Math.random() * 2);

    const variance = Math.random() > 0.5 ? 1 : -1;
    let total = Math.max(2, Math.min(12, Math.round(base + (Math.random() > 0.6 ? variance : 0))));
    const d1 = Math.max(1, Math.min(6, Math.floor(total / 2) + (Math.random() > 0.5 ? 1 : 0)));
    const d2 = Math.max(1, Math.min(6, total - d1));
    setDice([d1, d2]);
    playFx('dice_roll');
    if (isBlinker) { setCommentary('HOT DICE! +50% payout if you win!'); triggerFlash('goal'); }
    addChat(`🎲 Rolled ${d1 + d2}${isBlinker ? ' 🔥 HOT DICE' : ''}`);

    timerRef.current = setTimeout(() => {
      const diceTotal = d1 + d2;
      const currentPoint = pointRef.current;

      if (currentPoint === null) {
        if (diceTotal === 7 || diceTotal === 11) {
          const win = isBlinker ? Math.floor(BET * 1.5) : BET;
          setResult('win');
          setScore(s => { scoreRef.current = s + win; return s + win; });
          setCoins(c => c + win);
          spawnConfetti(20); playFx('crowd');
          setCommentary(`NATURAL ${diceTotal}! You WIN +${win}!`);
          addChat(`✅ NATURAL! +${win} coins`);
          setPhase('result');
          timerRef.current = setTimeout(() => nextRound(), 2500);
        } else if (diceTotal === 2 || diceTotal === 3 || diceTotal === 12) {
          setResult('lose');
          setCommentary(`CRAPS! ${diceTotal} — you lose!`);
          addChat(`❌ Craps! ${diceTotal}`);
          setPhase('result');
          timerRef.current = setTimeout(() => nextRound(), 2500);
        } else {
          setPoint(diceTotal); pointRef.current = diceTotal;
          setResult(null);
          setCommentary(`Point is ${diceTotal}! Roll it again to win!`);
          addChat(`🎯 Point set: ${diceTotal}`);
          // Keep rolling
        }
      } else {
        if (diceTotal === currentPoint) {
          const win = isBlinker ? Math.floor(BET * 1.5) : BET;
          setResult('win');
          setScore(s => { scoreRef.current = s + win; return s + win; });
          setCoins(c => c + win);
          spawnConfetti(30); playFx('crowd'); triggerFlash('goal');
          setCommentary(`HIT THE POINT! ${diceTotal}! You WIN +${win}!`);
          addChat(`✅ Point hit! +${win} coins`);
          setPoint(null); pointRef.current = null;
          setPhase('result');
          timerRef.current = setTimeout(() => nextRound(), 2500);
        } else if (diceTotal === 7) {
          setResult('lose');
          setCommentary(`SEVEN OUT! You lose. Point was ${currentPoint}`);
          addChat('❌ Seven out!');
          setPoint(null); pointRef.current = null;
          setPhase('result');
          timerRef.current = setTimeout(() => nextRound(), 2500);
        } else {
          setCommentary(`Rolled ${diceTotal}. Need ${currentPoint} to win. Roll again!`);
          // Keep rolling
        }
      }
    }, 800);
  }, [playFx, spawnConfetti, triggerFlash, addChat, nextRound, setCoins]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line

  const isRoll = phase === 'rolling';
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a1e0a 0%, #1a3a1a 40%, #0d2a0d 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.06), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CRAPS & CLOUDS</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/8</div><div style={{ fontSize: 8, color: C.text3 }}>ROLL</div></div>
          {point && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>Point:{point}</div><div style={{ fontSize: 8, color: C.text3 }}>TARGET</div></div>}
          {hotDice && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.red }}>HOT</div><div style={{ fontSize: 8, color: C.text3 }}>+50%</div></div>}
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎲</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#EF4444', letterSpacing: 3 }}>CRAPS & CLOUDS</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Puff duration controls your roll! Blinker = HOT DICE!</div>
          </div>
        )}

        {(isRoll || isRes) && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ padding: 20, borderRadius: 20, border: '3px solid rgba(239,68,68,0.30)', background: 'linear-gradient(180deg, rgba(34,100,34,0.3), rgba(10,40,10,0.5))', margin: '0 auto', maxWidth: 300 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: point ? C.cyan : C.gold, marginBottom: 12, letterSpacing: 2 }}>
                {point ? `POINT PHASE: Hit ${point} to WIN!` : 'COME-OUT ROLL'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                {dice.map((d, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, background: 'linear-gradient(135deg, #fafafa, #e8e8e8)', border: '2px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', color: '#1a1a1a', fontWeight: 900, animation: rolling ? `pulse 0.2s infinite ${i * 0.1}s` : 'none' }}>
                    {DICE_FACES[d] || d}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Total: {dice[0] + dice[1]}</div>
              {hotDice && <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginTop: 4, animation: 'pulse 1s infinite' }}>HOT DICE ACTIVE! +50% payout</div>}
              {isRes && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: result === 'win' ? C.gold : C.red }}>
                    {result === 'win' ? 'YOU WIN!' : 'CRAPS OUT!'}
                  </div>
                  {result === 'win' && <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>+{hotDice ? Math.floor(BET * 1.5) : BET} coins</div>}
                </div>
              )}
            </div>
            {isRoll && !rolling && (
              <div style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>
                {point ? `ROLL AGAIN — Need ${point}!` : 'HOLD TO PUFF & ROLL 🎲'}
              </div>
            )}
            {rolling && <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, color: C.cyan, animation: 'pulse 0.5s infinite' }}>ROLLING... RELEASE TO THROW</div>}
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎲</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>SESSION COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', fontSize: 13, fontWeight: 800, color: '#EF4444' }}>Play Again</div>
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
