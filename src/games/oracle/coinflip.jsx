import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

export default function CoinFlip() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [choice, setChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [puffConfidence, setPuffConfidence] = useState(0);
  const [puffing, setPuffing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const choiceRef = useRef(choice);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);
  const BET = 50;

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { choiceRef.current = choice; }, [choice]);
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
      awardGame('coinflip', scoreRef.current > 0 ? 'win' : 'lose');
      return;
    }
    setRound(next);
    setChoice(null); choiceRef.current = null;
    setResult(null); setPuffConfidence(0);
    setPhase('betting');
    setCommentary(`Round ${next + 1}/8 — Pick heads or tails!`);
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    setChoice(null); setResult(null); setPuffConfidence(0);
    setStreak(0); setRound(0); setScore(0); setPuffing(false);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Coin Flip! Pick heads or tails, then puff your confidence!');
    timerRef.current = setTimeout(() => setPhase('betting'), 1500);
  }, [playFx]);

  const pickSide = useCallback((side) => {
    setChoice(side);
    choiceRef.current = side;
    playFx('select');
    setCommentary(`You picked ${side.toUpperCase()}! PUFF to set confidence. Longer = higher multiplier!`);
    setPhase('puffing');
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'puffing' || !choiceRef.current) return;
    setPuffing(true);
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (!puffStartRef.current || phaseRef.current !== 'puffing') return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    setPuffing(false);

    let mult = 1;
    if (dur >= 4.5) { mult = 5; }
    else if (dur >= 3.5) { mult = 3; }
    else if (dur >= 2.0) { mult = 2; }
    else if (dur >= 0.5) { mult = 1.5; }

    setPuffConfidence(mult);
    setCommentary(`${mult}x confidence locked! Flipping...`);
    setPhase('flipping');
    playFx('coin_flip');

    timerRef.current = setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
      setResult(outcome);
      playFx('coin_land');

      const won = outcome === choiceRef.current;
      if (won) {
        const winAmt = Math.floor(BET * mult);
        setScore(s => { scoreRef.current = s + winAmt; return s + winAmt; });
        setStreak(s => s + 1);
        setCoins(c => c + winAmt);
        spawnConfetti(25);
        playFx('crowd');
        if (mult >= 5) triggerFlash('goal');
        setCommentary(`WIN! ${outcome.toUpperCase()}! +${winAmt} coins${mult >= 3 ? ` (${mult}x!)` : ''}!`);
        addChat(`🪙 WIN! +${winAmt} coins`);
      } else {
        const lossAmt = mult >= 5 ? BET * 2 : 0;
        if (lossAmt > 0) setCoins(c => Math.max(0, c - lossAmt));
        setStreak(0);
        setCommentary(`${outcome.toUpperCase()}! You guessed wrong.${mult >= 5 ? ` Blinker penalty: -${lossAmt}` : ''}`);
        addChat(`🪙 LOSE — ${outcome.toUpperCase()}`);
      }
      setPhase('result');
      timerRef.current = setTimeout(() => nextRound(), 2500);
    }, 1500);
  }, [playFx, spawnConfetti, triggerFlash, addChat, nextRound, setCoins]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line

  const isBet = phase === 'betting';
  const isPuff = phase === 'puffing';
  const isFlip = phase === 'flipping';
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a1500 0%, #2a1f00 40%, #0a0800 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(245,158,11,0.10), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #F59E0B, #D97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COIN FLIP</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/8</div><div style={{ fontSize: 8, color: C.text3 }}>FLIP</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.orange }}>{streak}</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🪙</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', letterSpacing: 3 }}>COIN FLIP</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Pick a side, puff your confidence, win big!</div>
          </div>
        )}

        {isBet && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🪙</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 16 }}>Pick your side!</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); pickSide('heads'); }} style={{ padding: '16px 28px', borderRadius: 16, cursor: 'pointer', background: 'rgba(245,158,11,0.10)', border: '2px solid rgba(245,158,11,0.30)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>👑</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>HEADS</div>
              </div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); pickSide('tails'); }} style={{ padding: '16px 28px', borderRadius: 16, cursor: 'pointer', background: 'rgba(168,85,247,0.10)', border: '2px solid rgba(168,85,247,0.30)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>🌿</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#A855F7' }}>TAILS</div>
              </div>
            </div>
          </div>
        )}

        {isPuff && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{choice === 'heads' ? '👑' : '🌿'}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>You picked: {choice?.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              {[['TAP: 1x', C.green], ['SHORT: 1.5x', '#3B82F6'], ['MED: 2x', '#F59E0B'], ['LONG: 3x', C.red], ['BLINKER: 5x', C.purple]].map(([lbl, col]) => (
                <div key={lbl} style={{ padding: '4px 10px', borderRadius: 8, background: `${col}10`, border: `1px solid ${col}20` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: col }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, animation: 'pulse 1.5s infinite' }}>PUFF TO FLIP 🪙</div>
            {puffing && <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan, marginTop: 8, animation: 'pulse 0.5s infinite' }}>FLIPPING...</div>}
          </div>
        )}

        {(isFlip || isRes) && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 12, animation: isFlip ? 'spin 1.5s linear' : 'none' }}>
              {isFlip ? '🪙' : result === 'heads' ? '👑' : '🌿'}
            </div>
            {isRes && (
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: result === choice ? C.gold : C.red, marginBottom: 4 }}>
                  {result === choice ? 'YOU WIN!' : 'YOU LOSE!'}
                </div>
                <div style={{ fontSize: 14, color: C.text2 }}>It was {result?.toUpperCase()}{puffConfidence > 1 ? ` at ${puffConfidence}x` : ''}</div>
                {result === choice && <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginTop: 4 }}>+{Math.floor(BET * puffConfidence)} coins!</div>}
                {result !== choice && puffConfidence >= 5 && <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginTop: 4 }}>Blinker penalty: -{BET * 2}</div>}
              </div>
            )}
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🪙</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>ALL FLIPS COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ fontSize: 13, color: C.orange, marginTop: 4 }}>Best Streak: {streak}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>Play Again</div>
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
