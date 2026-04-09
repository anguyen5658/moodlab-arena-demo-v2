import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const DP_QUESTIONS = [
  { q: "Will the top trending TikTok today be about food?", cat: "morning", emoji: "🌅", type: "yn" },
  { q: "Will Gold price go up today?", cat: "morning", emoji: "🌅", type: "yn" },
  { q: "Morning mood: Coffee or Green Tea?", cat: "morning", emoji: "🌅", type: "ab", a: "Coffee", b: "Green Tea" },
  { q: "Will the most-streamed Spotify song today be hip-hop?", cat: "afternoon", emoji: "☀️", type: "yn" },
  { q: "Afternoon sesh: Indica or Sativa?", cat: "afternoon", emoji: "☀️", type: "ab", a: "Indica", b: "Sativa" },
  { q: "Will any crypto gain more than 5% today?", cat: "afternoon", emoji: "☀️", type: "yn" },
  { q: "Will tonight's biggest sports upset actually happen?", cat: "night", emoji: "🌙", type: "yn" },
  { q: "Night strain pick: Edibles or Flower?", cat: "night", emoji: "🌙", type: "ab", a: "Edibles", b: "Flower" },
  { q: "Will a viral meme break 1M shares tonight?", cat: "night", emoji: "🌙", type: "yn" },
  { q: "Will the late-night game go to overtime?", cat: "morning", emoji: "🌅", type: "yn" },
  { q: "Best wake-and-bake: Joint or Vape?", cat: "morning", emoji: "🌅", type: "ab", a: "Joint", b: "Vape" },
];

const CAT_COLORS = { morning: "#F97316", afternoon: "#3B82F6", night: "#9333EA" };
const CAT_EMOJIS = { morning: "🌅", afternoon: "☀️", night: "🌙" };

export default function DailyPicks() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, awardGame,
    setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [picks, setPicks] = useState([]);
  const [answered, setAnswered] = useState([]);
  const [results, setResults] = useState([]);
  const [currentPick, setCurrentPick] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [streak, setStreak] = useState(0);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const currentPickRef = useRef(currentPick);
  const picksRef = useRef(picks);
  const resultsRef = useRef(results);
  const streakRef = useRef(streak);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentPickRef.current = currentPick; }, [currentPick]);
  useEffect(() => { picksRef.current = picks; }, [picks]);
  useEffect(() => { resultsRef.current = results; }, [results]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const startGame = useCallback(() => {
    const shuffled = [...DP_QUESTIONS].sort(() => Math.random() - 0.5);
    const newPicks = [
      shuffled.find(q => q.cat === 'morning') || shuffled[0],
      shuffled.find(q => q.cat === 'afternoon') || shuffled[1],
      shuffled.find(q => q.cat === 'night') || shuffled[2],
    ];
    setPicks(newPicks);
    picksRef.current = newPicks;
    setAnswered([]);
    setResults([]);
    resultsRef.current = [];
    setCurrentPick(0);
    setAnswer(null);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Daily Picks! 3 predictions, build your streak!');
    timerRef.current = setTimeout(() => setPhase('pick'), 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'pick') return;
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'pick') return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    const cp = currentPickRef.current;
    const pick = picksRef.current[cp];
    if (!pick) return;

    let ans;
    if (pick.type === 'yn') { ans = dur < 1.5 ? 'no' : 'yes'; }
    else { ans = dur < 1.5 ? pick.a : pick.b; }

    setAnswer(ans);
    setPhase('reveal');
    playFx('tap');
    addChat(`📅 ${ans.toUpperCase()}`);

    const correct = Math.random() > 0.4;
    const mult = streakRef.current >= 30 ? 10 : streakRef.current >= 14 ? 5 : streakRef.current >= 7 ? 3 : 1;
    const pts = correct ? 50 * mult : 0;

    timerRef.current = setTimeout(() => {
      const newResult = { question: pick, answer: ans, correct, pts };
      setResults(prev => { const nr = [...prev, newResult]; resultsRef.current = nr; return nr; });
      setAnswered(prev => [...prev, ans]);

      if (correct) {
        setStreak(s => { streakRef.current = s + 1; return s + 1; });
        spawnConfetti(30);
        setCommentary(mult > 1 ? `Streak bonus! ${mult}x multiplier! +${pts} coins!` : `Correct! +${pts} coins!`);
        addChat(mult > 1 ? `✅ +${pts} coins (${mult}x streak!)` : `✅ +${pts} coins`);
      } else {
        setStreak(0);
        streakRef.current = 0;
        setCommentary('Not this time... streak reset!');
        addChat('❌ Wrong — streak reset');
      }

      if (cp < 2) {
        timerRef.current = setTimeout(() => {
          setCurrentPick(cp + 1);
          setAnswer(null);
          setPhase('pick');
        }, 1500);
      } else {
        timerRef.current = setTimeout(() => {
          const allResults = [...resultsRef.current];
          const wins = allResults.filter(r => r.correct).length;
          setPhase('summary');
          playFx(wins > 0 ? 'win' : 'lose');
          awardGame('dailypicks', wins > 0 ? 'win' : 'lose');
        }, 1500);
      }
    }, 1500);
  }, [playFx, addChat, spawnConfetti, awardGame]);

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

  const isP = phase === 'pick';
  const isRev = phase === 'reveal';
  const isSum = phase === 'summary';
  const currentQ = picks[currentPick];
  const mult = streak >= 30 ? 10 : streak >= 14 ? 5 : streak >= 7 ? 3 : 1;
  const catColor = CAT_COLORS[currentQ?.cat || 'morning'];

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, #1a0a04 0%, ${currentPick === 0 ? '#2a1005' : currentPick === 1 ? '#0a1830' : '#1a0830'} 50%, #0a0618 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${catColor}15, transparent 60%)`, pointerEvents: 'none' }} />

      {/* Confetti */}
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={handleBack} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto', overflowY: 'auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #F97316, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DAILY PICKS</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: '#F97316' }}>{streak}🔥</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{mult}x</div><div style={{ fontSize: 8, color: C.text3 }}>MULTIPLIER</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{currentPick + 1}/3</div><div style={{ fontSize: 8, color: C.text3 }}>PICK</div></div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < currentPick ? C.green : i === currentPick ? CAT_COLORS[picks[i]?.cat || 'morning'] : C.text3 + '30', boxShadow: i === currentPick ? `0 0 8px ${CAT_COLORS[picks[i]?.cat || 'morning']}60` : 'none', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F97316', letterSpacing: 3 }}>DAILY PICKS</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>3 predictions | Build your streak | Earn multipliers</div>
            <div style={{ fontSize: 9, color: C.gold, marginTop: 4 }}>7-day = 3x | 14-day = 5x | 30-day = 10x</div>
          </div>
        )}

        {/* Pick phase */}
        {isP && currentQ && (
          <div style={{ width: '100%', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{CAT_EMOJIS[currentQ.cat]}</div>
            <div style={{ padding: '2px 10px', borderRadius: 6, background: `${catColor}15`, display: 'inline-block', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: catColor }}>{currentQ.cat.toUpperCase()} PICK</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.4, maxWidth: 300, margin: '0 auto', marginBottom: 16 }}>{currentQ.q}</div>
            {currentQ.type === 'yn' ? (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>NO</div><div style={{ fontSize: 8, color: C.text3 }}>Short puff</div></div>
                <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>YES</div><div style={{ fontSize: 8, color: C.text3 }}>Long puff</div></div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div style={{ padding: '10px 24px', borderRadius: 12, background: `${catColor}10`, border: `1px solid ${catColor}25` }}><div style={{ fontSize: 14, fontWeight: 800, color: catColor }}>{currentQ.a}</div><div style={{ fontSize: 8, color: C.text3 }}>Short puff</div></div>
                <div style={{ padding: '10px 24px', borderRadius: 12, background: `${catColor}10`, border: `1px solid ${catColor}25` }}><div style={{ fontSize: 14, fontWeight: 800, color: catColor }}>{currentQ.b}</div><div style={{ fontSize: 8, color: C.text3 }}>Long puff</div></div>
              </div>
            )}
            <div style={{ fontSize: 11, color: C.text3, marginTop: 12 }}>TAP TO PICK 📅</div>
          </div>
        )}

        {/* Reveal phase */}
        {isRev && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {results.length > 0 && results[results.length - 1].correct ? '✅' : '❌'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: results.length > 0 && results[results.length - 1].correct ? C.green : C.red }}>
              {results.length > 0 && results[results.length - 1].correct ? 'CORRECT!' : 'WRONG!'}
            </div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>You picked: <span style={{ fontWeight: 700, color: C.text }}>{answer}</span></div>
            {results.length > 0 && results[results.length - 1].correct && results[results.length - 1].pts > 0 && (
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginTop: 4 }}>
                +{results[results.length - 1].pts} coins{mult > 1 ? ` (${mult}x multiplier!)` : ''}
              </div>
            )}
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
          </div>
        )}

        {/* Summary */}
        {isSum && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>DAILY PICKS COMPLETE</div>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, marginBottom: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 16 }}>{CAT_EMOJIS[r.question.cat]}</span>
                <span style={{ fontSize: 11, color: C.text, flex: 1, textAlign: 'left' }}>{r.question.q.substring(0, 35)}...</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.correct ? C.green : C.red }}>{r.correct ? '✅' : '❌'}</span>
                {r.pts > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>+{r.pts}</span>}
              </div>
            ))}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316', marginTop: 8 }}>Current Streak: {streak} 🔥</div>
            <div style={{ fontSize: 12, color: C.gold, marginTop: 4 }}>Total earned: +{results.reduce((a, r) => a + r.pts, 0)} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)', fontSize: 13, fontWeight: 800, color: '#F97316' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}
      </div>
    </div>
  );
}
