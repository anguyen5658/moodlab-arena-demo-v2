import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const CB_PREDICTIONS = [
  { q: "Will Bitcoin hit $100K this month?", cat: "crypto", emoji: "🪙" },
  { q: "Will a new cannabis strain go viral on TikTok this week?", cat: "cannabis", emoji: "🌿" },
  { q: "Will Brazil win their next World Cup match?", cat: "sports", emoji: "⚽" },
  { q: "Will Snoop Dogg drop a surprise album this year?", cat: "culture", emoji: "🎤" },
  { q: "Will THC prices drop below $5/g in Colorado?", cat: "cannabis", emoji: "💰" },
  { q: "Will the next FIFA game outsell the last one?", cat: "gaming", emoji: "🎮" },
  { q: "Will a meme coin 10x this month?", cat: "crypto", emoji: "🚀" },
  { q: "Will indica outsell sativa this quarter?", cat: "cannabis", emoji: "🌿" },
  { q: "Will Argentina make it to the WC final?", cat: "sports", emoji: "🇦🇷" },
  { q: "Will AI replace more than 10% of jobs this year?", cat: "culture", emoji: "🤖" },
  { q: "Will edibles become legal in 3 more states?", cat: "cannabis", emoji: "🍫" },
  { q: "Will the next Super Bowl break viewership records?", cat: "sports", emoji: "🏈" },
  { q: "Will Drake drop a collab with a cannabis brand?", cat: "culture", emoji: "🎵" },
  { q: "Will Ethereum flip Bitcoin in market cap?", cat: "crypto", emoji: "💎" },
  { q: "Will the MLS become a top 5 global league?", cat: "sports", emoji: "⚽" },
];

export default function CrystalBall() {
  const navigate = useNavigate();
  const {
    playFx, triggerFlash, spawnConfetti, confettiParticles,
    screenShake, screenFlash,
    awardGame, notify,
    setGameChatMsgs,
    setBLEHandlers, clearBLEHandlers,
    setCoins,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [used, setUsed] = useState([]);
  const [puffing, setPuffing] = useState(false);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const streakRef = useRef(streak);
  const answerRef = useRef(answer);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { answerRef.current = answer; }, [answer]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= 5) {
      setPhase('complete');
      const sc = scoreRef.current;
      playFx(sc > 0 ? 'win' : 'lose');
      awardGame('crystalball', sc > 0 ? 'win' : 'lose');
      return;
    }
    let q;
    do {
      q = CB_PREDICTIONS[Math.floor(Math.random() * CB_PREDICTIONS.length)];
    } while (used.includes(q.q) && used.length < CB_PREDICTIONS.length);
    setUsed(u => [...u, q.q]);
    setQuestion(q);
    setAnswer(null);
    setResult(null);
    setRound(next);
    setPhase('question');
  }, [used, playFx, awardGame]);

  const startGame = useCallback(() => {
    const q = CB_PREDICTIONS[Math.floor(Math.random() * CB_PREDICTIONS.length)];
    setUsed([q.q]);
    setQuestion(q);
    setAnswer(null);
    setResult(null);
    setRound(0);
    setScore(0);
    setStreak(0);
    setPuffing(false);
    setPhase('intro');
    puffStartRef.current = 0;
    playFx('crowd');
    setCommentary('The Crystal Ball awaits your predictions...');
    timerRef.current = setTimeout(() => setPhase('question'), 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'question') return;
    setPuffing(true);
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (!puffStartRef.current) return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    setPuffing(false);

    let ans;
    if (dur >= 3.0) {
      ans = 'certain';
      setCommentary('BLINKER! ABSOLUTELY CERTAIN! 3x if right, -2x if wrong!');
      addChat('🔮 BLINKER — ABSOLUTELY CERTAIN!');
    } else if (dur >= 1.5) {
      ans = 'yes';
      setCommentary('You predict YES!');
      addChat('🔮 Predicts YES');
    } else {
      ans = 'no';
      setCommentary('You predict NO!');
      addChat('🔮 Predicts NO');
    }

    setAnswer(ans);
    answerRef.current = ans;
    setPhase('reveal');
    playFx('whistle');
    triggerFlash('goal');

    timerRef.current = setTimeout(() => {
      const correct = Math.random() > 0.45;
      setResult(correct ? 'correct' : 'wrong');

      if (correct) {
        const pts = ans === 'certain' ? 150 : 50;
        setScore(s => { scoreRef.current = s + pts; return s + pts; });
        setStreak(s => { streakRef.current = s + 1; return s + 1; });
        playFx('crowd');
        spawnConfetti(30);
        setCommentary(ans === 'certain'
          ? 'BLINKER BONUS! 3x COINS! The Fortune pays out big!'
          : 'Correct! The Crystal Ball confirms your vision!');
        addChat(ans === 'certain' ? '🔮 BLINKER BONUS! 3x coins!' : '✅ Correct!');
      } else {
        if (ans === 'certain') {
          setScore(s => { scoreRef.current = s - 100; return s - 100; });
          setCoins(c => Math.max(0, c - 100));
        }
        setStreak(0);
        streakRef.current = 0;
        setCommentary(ans === 'certain'
          ? 'The Blinker backfired! -2x penalty!'
          : 'The Crystal Ball says otherwise...');
        addChat(ans === 'certain' ? '💀 Blinker backfired! -100 coins!' : '❌ Wrong!');
      }

      setPhase('result');
      timerRef.current = setTimeout(() => nextRound(), 2500);
    }, 2000);
  }, [playFx, triggerFlash, spawnConfetti, addChat, nextRound, setCoins]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line

  const handleBack = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    navigate('/oracle');
  }, [navigate]);

  const isQ = phase === 'question';
  const isR = phase === 'reveal';
  const isRes = phase === 'result';
  const isComp = phase === 'complete';

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0520 0%, #1a0838 30%, #0d0625 60%, #06031a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(147,51,234,0.15), transparent 60%)', pointerEvents: 'none' }} />

      {/* Stars */}
      {[...Array(15)].map((_, i) => (
        <div key={'cbp' + i} style={{ position: 'absolute', left: `${(i * 19 + 7) % 100}%`, top: `${(i * 23 + 5) % 100}%`, width: 2 + i % 3, height: 2 + i % 3, borderRadius: '50%', background: i % 2 ? '#9333EA' : '#FFD700', opacity: 0.15, animation: `pulse ${2 + i % 3}s infinite ${i * 0.2}s`, pointerEvents: 'none' }} />
      ))}

      {/* Screen flash */}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: 'rgba(147,51,234,0.3)', animation: 'flashOverlay 0.4s ease forwards' }} />}

      {/* Confetti */}
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={handleBack} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #9333EA, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CRYSTAL BALL</div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>SCORE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: '#F97316' }}>{streak}🔥</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 12, animation: 'gentleFloat 2s infinite', filter: 'drop-shadow(0 0 20px rgba(147,51,234,0.6))' }}>🔮</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#9333EA', letterSpacing: 3 }}>THE ORACLE AWAITS</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Short puff = NO | Long puff = YES | Blinker = CERTAIN (3x/−2x)</div>
          </div>
        )}

        {/* Question phase */}
        {isQ && question && (
          <div style={{ textAlign: 'center', width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: puffing ? 'countPulse 0.5s infinite' : 'gentleFloat 2s infinite', filter: puffing ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8))' : 'drop-shadow(0 0 15px rgba(147,51,234,0.5))' }}>🔮</div>
            <div style={{ padding: '2px 10px', borderRadius: 6, background: 'rgba(147,51,234,0.12)', display: 'inline-block', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#9333EA' }}>{question.cat.toUpperCase()} {question.emoji}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.4, maxWidth: 300, margin: '0 auto', marginBottom: 16 }}>{question.q}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>NO</div><div style={{ fontSize: 8, color: C.text3 }}>Short (&lt;1.5s)</div></div>
              <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>YES</div><div style={{ fontSize: 8, color: C.text3 }}>Long (&gt;1.5s)</div></div>
              <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>CERTAIN</div><div style={{ fontSize: 8, color: C.text3 }}>Blinker (&gt;3s)</div></div>
            </div>
            {puffing
              ? <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, animation: 'pulse 0.5s infinite' }}>CHANNELING... hold for YES or Blinker! 🔮</div>
              : <div style={{ fontSize: 11, color: C.text3 }}>PUFF FOR PREDICTION 🔮</div>
            }
          </div>
        )}

        {/* Reveal phase */}
        {isR && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 56, marginBottom: 12, animation: 'countPulse 0.8s infinite', filter: 'drop-shadow(0 0 25px rgba(147,51,234,0.7))' }}>🔮</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: answer === 'certain' ? C.gold : answer === 'yes' ? C.green : C.red, marginBottom: 4 }}>
              {answer === 'certain' ? 'ABSOLUTELY CERTAIN!' : answer === 'yes' ? 'YES' : 'NO'}
            </div>
            <div style={{ fontSize: 12, color: C.text3 }}>The Crystal Ball is revealing...</div>
          </div>
        )}

        {/* Result phase */}
        {isRes && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{result === 'correct' ? '✅' : '❌'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: result === 'correct' ? C.green : C.red, marginBottom: 4 }}>
              {result === 'correct' ? 'CORRECT!' : 'WRONG!'}
            </div>
            {result === 'correct' && answer === 'certain' && <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, marginBottom: 4 }}>BLINKER BONUS! 3x coins! +150</div>}
            {result === 'correct' && answer !== 'certain' && <div style={{ fontSize: 14, fontWeight: 800, color: C.green, marginBottom: 4 }}>+50 coins!</div>}
            {result === 'wrong' && answer === 'certain' && <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 4 }}>Blinker penalty! -100 coins</div>}
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginBottom: 12 }}>{commentary}</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); nextRound(); }} style={{ padding: '10px 28px', borderRadius: 12, cursor: 'pointer', background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.30)', fontSize: 13, fontWeight: 800, color: '#9333EA', display: 'inline-block' }}>Next Prediction</div>
          </div>
        )}

        {/* Complete phase */}
        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔮</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 4 }}>ORACLE SESSION COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 13, color: '#F97316' }}>Best Streak: {streak} 🔥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.lime, marginTop: 8 }}>+{Math.max(0, score)} coins earned</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.30)', fontSize: 13, fontWeight: 800, color: '#9333EA' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}
      </div>
    </div>
  );
}
