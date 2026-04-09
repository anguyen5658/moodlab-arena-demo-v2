import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const SC_SYMBOLS = ['🍒', '🍋', '💎', '⭐', '🌿', '7️⃣'];
const SC_PAYOUTS = { '🍒': 50, '🍋': 75, '💎': 200, '⭐': 300, '🌿': 500, '7️⃣': 1000, '🌟': 500 };

const genCard = () => {
  const symbols = [];
  const base = SC_SYMBOLS[Math.floor(Math.random() * SC_SYMBOLS.length)];
  symbols.push(base, base);
  for (let i = 0; i < 4; i++) symbols.push(SC_SYMBOLS[Math.floor(Math.random() * SC_SYMBOLS.length)]);
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return symbols;
};

export default function ScratchPuff() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [card, setCard] = useState([]);
  const [revealedArr, setRevealedArr] = useState([false, false, false, false, false, false]);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [prize, setPrize] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const currentIdxRef = useRef(currentIdx);
  const cardRef = useRef(card);
  const revealedRef = useRef(revealedArr);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { cardRef.current = card; }, [card]);
  useEffect(() => { revealedRef.current = revealedArr; }, [revealedArr]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= 3) {
      setPhase('complete');
      playFx(scoreRef.current > 0 ? 'win' : 'lose');
      awardGame('scratchpuff', scoreRef.current > 0 ? 'win' : 'lose');
      return;
    }
    const newCard = genCard();
    setRound(next); setCard(newCard); cardRef.current = newCard;
    const fresh = [false, false, false, false, false, false];
    setRevealedArr(fresh); revealedRef.current = fresh;
    setCurrentIdx(null); setPrize(null);
    setPhase('scratching');
    setCommentary(`Card ${next + 1}/3 — Scratch away!`);
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    const newCard = genCard();
    setCard(newCard); cardRef.current = newCard;
    const fresh = [false, false, false, false, false, false];
    setRevealedArr(fresh); revealedRef.current = fresh;
    setCurrentIdx(null); setPrize(null); setRound(0); setScore(0);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Scratch & Puff! Tap an area then PUFF to scratch!');
    timerRef.current = setTimeout(() => setPhase('scratching'), 1500);
  }, [playFx]);

  const selectArea = useCallback((idx) => {
    if (phaseRef.current !== 'scratching' || revealedRef.current[idx]) return;
    setCurrentIdx(idx); currentIdxRef.current = idx;
    playFx('select');
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'scratching' || currentIdxRef.current === null || revealedRef.current[currentIdxRef.current]) return;
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'scratching' || currentIdxRef.current === null || !puffStartRef.current) return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    if (dur < 0.2) return;

    const isBlinker = dur >= 4.5;
    const idx = currentIdxRef.current;
    const newRevealed = [...revealedRef.current];
    newRevealed[idx] = true;
    let currentCard = [...cardRef.current];

    if (isBlinker) {
      currentCard[idx] = '🌟';
      setCard(currentCard); cardRef.current = currentCard;
      setCommentary('GOLDEN SCRATCH! Wild symbol added!');
      spawnConfetti(15);
      addChat('🎫 GOLDEN SCRATCH! Wild 🌟 added!');
    } else {
      setCommentary(`Revealed: ${currentCard[idx]}`);
    }

    setRevealedArr(newRevealed); revealedRef.current = newRevealed;
    playFx('scratch');
    setCurrentIdx(null); currentIdxRef.current = null;

    if (newRevealed.every(r => r)) {
      // Check for matches
      const counts = {};
      const wilds = currentCard.filter(s => s === '🌟').length;
      currentCard.filter(s => s !== '🌟').forEach(s => { counts[s] = (counts[s] || 0) + 1; });

      let bestSymbol = null, bestCount = 0;
      Object.entries(counts).forEach(([sym, cnt]) => {
        if (cnt + wilds >= 3 && cnt > bestCount) { bestSymbol = sym; bestCount = cnt; }
      });
      if (!bestSymbol && wilds >= 3) { bestSymbol = '🌟'; bestCount = wilds; }

      if (bestSymbol && (bestCount + wilds >= 3 || bestCount >= 3)) {
        const payout = SC_PAYOUTS[bestSymbol] || 50;
        setPrize({ symbol: bestSymbol, amount: payout });
        setScore(s => { scoreRef.current = s + payout; return s + payout; });
        setCoins(c => c + payout);
        spawnConfetti(40); triggerFlash('goal'); playFx('crowd');
        setCommentary(`WINNER! 3x ${bestSymbol} = ${payout} coins!`);
        addChat(`🎫 WIN! ${bestSymbol}${bestSymbol}${bestSymbol} = +${payout} coins`);
      } else {
        setPrize(null);
        setCommentary('No match this time!');
        addChat('🎫 No match...');
      }
      setPhase('result');
      timerRef.current = setTimeout(() => nextRound(), 2500);
    }
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a0a18 0%, #280828 40%, #0d060d 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(244,114,182,0.08), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #F472B6, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SCRATCH & PUFF</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/3</div><div style={{ fontSize: 8, color: C.text3 }}>CARD</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎫</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.pink, letterSpacing: 3 }}>SCRATCH & PUFF</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Tap a square, then puff to scratch! Match 3 to win!</div>
          </div>
        )}

        {(phase === 'scratching' || phase === 'result') && card.length > 0 && (
          <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 320, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {card.map((sym, i) => (
                  <div key={i} data-btn="true" onClick={(e) => { e.stopPropagation(); selectArea(i); }} style={{ height: 70, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: revealedArr[i] ? 32 : 28, cursor: revealedArr[i] ? 'default' : 'pointer', background: revealedArr[i] ? 'rgba(255,255,255,0.06)' : currentIdx === i ? `${C.pink}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${revealedArr[i] ? 'rgba(255,255,255,0.10)' : currentIdx === i ? C.pink + '40' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}>
                    {revealedArr[i] ? sym : '❓'}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {SC_SYMBOLS.map(s => (
                  <div key={s} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: C.text3 }}>{s}x3={SC_PAYOUTS[s]}</div>
                ))}
              </div>
            </div>
            {phase === 'scratching' && currentIdx === null && (
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: C.text3 }}>TAP a square to select, then PUFF to scratch!</div>
            )}
            {phase === 'scratching' && currentIdx !== null && (
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: 800, color: C.pink, animation: 'pulse 1.5s infinite' }}>HOLD TO PUFF & SCRATCH 🎫</div>
            )}
            {phase === 'result' && prize && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.gold }}>WINNER! +{prize.amount} coins!</div>
              </div>
            )}
            {phase === 'result' && !prize && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text3 }}>No match this time...</div>
              </div>
            )}
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎫</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 4 }}>ALL CARDS SCRATCHED!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.pink}15`, border: `1px solid ${C.pink}30`, fontSize: 13, fontWeight: 800, color: C.pink }}>Play Again</div>
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
