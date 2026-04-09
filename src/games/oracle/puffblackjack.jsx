import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const BJ_SUITS = ['♠️', '♥️', '♦️', '♣️'];
const BJ_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const drawCard = () => {
  const suit = BJ_SUITS[Math.floor(Math.random() * BJ_SUITS.length)];
  const val = BJ_VALUES[Math.floor(Math.random() * BJ_VALUES.length)];
  return { suit, val, display: val + suit };
};

const handTotal = (hand) => {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.val === 'A') { aces++; total += 11; }
    else if (['K', 'Q', 'J'].includes(c.val)) total += 10;
    else total += parseInt(c.val);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

const renderCard = (c, hidden) => (
  <div style={{ width: 48, height: 68, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hidden ? 'linear-gradient(135deg, #1a3a5c, #0a1a30)' : 'linear-gradient(180deg, #fafafa, #e0e0e0)', border: hidden ? '2px solid #2a5a8c' : '2px solid #ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', fontSize: hidden ? 20 : 12, fontWeight: 800, color: hidden ? '#4a8abf' : (c.suit === '♥️' || c.suit === '♦️') ? '#dc2626' : '#1a1a1a' }}>
    {hidden ? '🂠' : c.display}
  </div>
);

export default function PuffBlackjack() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [bet, setBet] = useState(50);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [puffing, setPuffing] = useState(false);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const playerHandRef = useRef(playerHand);
  const dealerHandRef = useRef(dealerHand);
  const playerTotalRef = useRef(playerTotal);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const betRef = useRef(50);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { playerHandRef.current = playerHand; }, [playerHand]);
  useEffect(() => { dealerHandRef.current = dealerHand; }, [dealerHand]);
  useEffect(() => { playerTotalRef.current = playerTotal; }, [playerTotal]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const resolve = useCallback((pHand, dHand, isNatural) => {
    const pTotal = handTotal(pHand), dTotal = handTotal(dHand);
    const curBet = betRef.current;
    setPlayerTotal(pTotal); playerTotalRef.current = pTotal;
    setDealerTotal(dTotal);
    let res, winAmt = 0;
    if (isNatural && pTotal === 21) {
      if (dTotal === 21) { res = 'push'; setCommentary('Both Blackjack! Push!'); }
      else { res = 'blackjack'; winAmt = Math.floor(curBet * 2.5); setCommentary('BLACKJACK! 2.5x payout!'); playFx('goal'); spawnConfetti(40); triggerFlash('goal'); }
    } else if (pTotal > 21) {
      res = 'bust'; setCommentary(`BUST! You lose ${curBet}`);
    } else if (dTotal > 21) {
      res = 'win'; winAmt = curBet * 2; setCommentary(`Dealer busts! You WIN ${winAmt}!`); spawnConfetti(25);
    } else if (pTotal > dTotal) {
      res = 'win'; winAmt = curBet * 2; setCommentary(`You win! ${pTotal} beats ${dTotal}`); spawnConfetti(20);
    } else if (pTotal < dTotal) {
      res = 'lose'; setCommentary(`Dealer wins. ${dTotal} beats ${pTotal}`);
    } else {
      res = 'push'; setCommentary(`Push! Both have ${pTotal}`);
    }
    if (winAmt > 0) { setCoins(c => c + winAmt); setScore(s => { scoreRef.current = s + winAmt; return s + winAmt; }); playFx('crowd'); addChat(`🃏 WIN! +${winAmt} coins`); }
    else if (res === 'bust' || res === 'lose') { setCoins(c => Math.max(0, c - curBet)); addChat('🃏 Dealer wins...'); }
    else { addChat('🃏 Push — bet returned'); }
    setResult(res);
    setPhase('result'); phaseRef.current = 'result';
    timerRef.current = setTimeout(() => {
      const next = roundRef.current + 1;
      if (next >= 7) {
        setPhase('complete'); phaseRef.current = 'complete';
        playFx(scoreRef.current > 0 ? 'win' : 'lose');
        awardGame('puffblackjack', scoreRef.current > 0 ? 'win' : 'lose');
        return;
      }
      setRound(next); roundRef.current = next;
      setBet(50); betRef.current = 50;
      setResult(null);
      deal();
    }, 2500);
  }, [playFx, spawnConfetti, triggerFlash, addChat, awardGame, setCoins]);

  const dealerPlay = useCallback((playerH) => {
    setPhase('dealer_turn'); phaseRef.current = 'dealer_turn';
    setCommentary('Dealer reveals...');
    let dHand = [...dealerHandRef.current];
    const playDealer = (hand) => {
      const total = handTotal(hand);
      setDealerHand([...hand]); setDealerTotal(total);
      if (total < 17) {
        timerRef.current = setTimeout(() => {
          const card = drawCard();
          hand.push(card);
          playFx('select');
          setCommentary(`Dealer hits... ${handTotal(hand)}`);
          playDealer(hand);
        }, 700);
      } else {
        timerRef.current = setTimeout(() => resolve(playerH, hand, false), 600);
      }
    };
    timerRef.current = setTimeout(() => playDealer(dHand), 600);
  }, [playFx, resolve]);

  const deal = useCallback(() => {
    const p1 = drawCard(), p2 = drawCard(), d1 = drawCard(), d2 = drawCard();
    const pHand = [p1, p2], dHand = [d1, d2];
    const pTotal = handTotal(pHand), dTotal = handTotal(dHand);
    setPlayerHand(pHand); playerHandRef.current = pHand;
    setDealerHand(dHand); dealerHandRef.current = dHand;
    setPlayerTotal(pTotal); playerTotalRef.current = pTotal;
    setDealerTotal(dTotal);
    setResult(null);
    setPhase('dealing'); phaseRef.current = 'dealing';
    playFx('card_deal');
    setCommentary('Cards dealt...');
    timerRef.current = setTimeout(() => {
      if (pTotal === 21) {
        setCommentary('BLACKJACK! Natural 21!');
        resolve(pHand, dHand, true);
      } else {
        setPhase('player_turn'); phaseRef.current = 'player_turn';
        setCommentary('Your turn! Short puff = HIT, Long puff = STAND, Blinker = DOUBLE DOWN');
      }
    }, 1200);
  }, [playFx, resolve]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return;
    setPuffing(true);
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (!puffStartRef.current || phaseRef.current !== 'player_turn') return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    setPuffing(false);

    const curPlayerHand = playerHandRef.current;

    if (dur >= 4.5) {
      // DOUBLE DOWN
      setBet(b => { betRef.current = b * 2; return b * 2; });
      const newCard = drawCard();
      const newHand = [...curPlayerHand, newCard];
      const newTotal = handTotal(newHand);
      setPlayerHand(newHand); playerHandRef.current = newHand;
      setPlayerTotal(newTotal); playerTotalRef.current = newTotal;
      playFx('whistle');
      setCommentary('DOUBLE DOWN! Bet doubled! One more card...');
      triggerFlash('goal');
      if (newTotal > 21) {
        timerRef.current = setTimeout(() => { setCommentary('BUST! Over 21!'); resolve(newHand, dealerHandRef.current, false); }, 800);
      } else {
        timerRef.current = setTimeout(() => dealerPlay(newHand), 800);
      }
    } else if (dur >= 1.5) {
      // STAND
      playFx('select');
      setCommentary(`You STAND at ${playerTotalRef.current}!`);
      dealerPlay(curPlayerHand);
    } else {
      // HIT
      const newCard = drawCard();
      const newHand = [...curPlayerHand, newCard];
      const newTotal = handTotal(newHand);
      setPlayerHand(newHand); playerHandRef.current = newHand;
      setPlayerTotal(newTotal); playerTotalRef.current = newTotal;
      playFx('select');
      if (newTotal > 21) {
        setCommentary(`BUST! ${newTotal} — over 21!`);
        timerRef.current = setTimeout(() => resolve(newHand, dealerHandRef.current, false), 800);
      } else if (newTotal === 21) {
        setCommentary('21! Perfect! Standing...');
        timerRef.current = setTimeout(() => dealerPlay(newHand), 800);
      } else {
        setCommentary(`HIT! You have ${newTotal}. Hit or Stand?`);
      }
    }
  }, [playFx, triggerFlash, resolve, dealerPlay]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  const startGame = useCallback(() => {
    setPlayerHand([]); playerHandRef.current = [];
    setDealerHand([]); dealerHandRef.current = [];
    setPlayerTotal(0); playerTotalRef.current = 0;
    setDealerTotal(0);
    setBet(50); betRef.current = 50;
    setResult(null);
    setRound(0); roundRef.current = 0;
    setScore(0); scoreRef.current = 0;
    setPuffing(false);
    setPhase('intro'); phaseRef.current = 'intro';
    playFx('crowd');
    setCommentary('Welcome to Puff Blackjack! Get closer to 21!');
    timerRef.current = setTimeout(() => deal(), 1500);
  }, [playFx, deal]);

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line

  const isPlayerTurn = phase === 'player_turn';
  const isDealerTurn = phase === 'dealer_turn';
  const isResult = phase === 'result';
  const isComp = phase === 'complete';

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a1e0a 0%, #0d3d0d 40%, #0a2a0a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.06), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #22C55E, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PUFF BLACKJACK</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/7</div><div style={{ fontSize: 8, color: C.text3 }}>HAND</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>Bet:{bet}</div><div style={{ fontSize: 8, color: C.text3 }}>WAGER</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#22C55E', letterSpacing: 3 }}>BLACKJACK</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Short puff = HIT | Long puff = STAND | Blinker = DOUBLE DOWN</div>
          </div>
        )}

        {(phase === 'dealing' || isPlayerTurn || isDealerTurn || isResult) && (
          <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 4 }}>DEALER {(isDealerTurn || isResult) ? `(${dealerTotal})` : ''}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {dealerHand.map((c, i) => <div key={i}>{renderCard(c, i === 1 && (phase === 'dealing' || isPlayerTurn))}</div>)}
              </div>
            </div>
            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 12, fontWeight: 800, color: C.gold }}>
              {isResult && result === 'win' ? 'YOU WIN!' : isResult && result === 'blackjack' ? 'BLACKJACK!' : isResult && result === 'lose' ? 'DEALER WINS' : isResult && result === 'bust' ? 'BUST!' : isResult && result === 'push' ? 'PUSH' : 'VS'}
            </div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, marginBottom: 4 }}>YOU ({playerTotal})</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {playerHand.map((c, i) => <div key={i}>{renderCard(c, false)}</div>)}
              </div>
            </div>
            {isPlayerTurn && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>HIT</div><div style={{ fontSize: 7, color: C.text3 }}>&lt;1.5s</div></div>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.red }}>STAND</div><div style={{ fontSize: 7, color: C.text3 }}>&gt;1.5s</div></div>
                  <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(147,51,234,0.10)', border: '1px solid rgba(147,51,234,0.20)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.purple }}>DOUBLE</div><div style={{ fontSize: 7, color: C.text3 }}>4.5s+</div></div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: puffing ? C.purple : C.gold, marginTop: 10, animation: 'pulse 1.5s infinite' }}>
                  {puffing ? 'HOLDING — release to Stand/Double' : 'TAP: Hit/Stand · PUFF: Double Down 🃏'}
                </div>
              </div>
            )}
            {isResult && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: (result === 'win' || result === 'blackjack') ? C.gold : result === 'push' ? C.cyan : C.red }}>
                  {(result === 'win' || result === 'blackjack') ? `+${bet * (result === 'blackjack' ? 2.5 : 2)} coins` : result === 'push' ? 'Bet returned' : `-${bet} coins`}
                </div>
              </div>
            )}
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>SESSION COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)', fontSize: 13, fontWeight: 800, color: '#22C55E' }}>Play Again</div>
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
