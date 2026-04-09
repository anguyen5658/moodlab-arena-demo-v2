import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const MP_MATCHES = [
  { id: 'mp1', home: '🇧🇷 Brazil', away: '🇩🇪 Germany', time: '3:00 PM', pool: [65, 20, 15], group: 'F' },
  { id: 'mp2', home: '🇫🇷 France', away: '🇦🇷 Argentina', time: '9:00 PM', pool: [40, 25, 35], group: 'C' },
  { id: 'mp3', home: '🇺🇸 USA', away: '🇲🇽 Mexico', time: '6:00 PM', pool: [45, 30, 25], group: 'A' },
  { id: 'mp4', home: '🇪🇸 Spain', away: '🇳🇱 Netherlands', time: '12:00 PM', pool: [50, 28, 22], group: 'B' },
  { id: 'mp5', home: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', away: '🇵🇹 Portugal', time: '3:00 AM', pool: [38, 32, 30], group: 'D' },
  { id: 'mp6', home: '🇮🇹 Italy', away: '🇧🇪 Belgium', time: '6:00 AM', pool: [42, 30, 28], group: 'E' },
  { id: 'mp7', home: '🇯🇵 Japan', away: '🇰🇷 South Korea', time: '9:00 AM', pool: [35, 30, 35], group: 'G' },
  { id: 'mp8', home: '🇳🇬 Nigeria', away: '🇨🇲 Cameroon', time: '12:00 AM', pool: [40, 35, 25], group: 'H' },
];

export default function MatchPredictor() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, awardGame,
    setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [match, setMatch] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [results, setResults] = useState([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [used, setUsed] = useState([]);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const usedRef = useRef(used);
  const matchRef = useRef(match);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { usedRef.current = used; }, [used]);
  useEffect(() => { matchRef.current = match; }, [match]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= 5) {
      setPhase('complete');
      const sc = scoreRef.current;
      playFx(sc > 0 ? 'win' : 'lose');
      awardGame('matchpredictor', sc > 0 ? 'win' : 'lose');
      return;
    }
    const shuffled = [...MP_MATCHES].sort(() => Math.random() - 0.5);
    const nextMatch = shuffled.find(m => !usedRef.current.includes(m.id)) || shuffled[0];
    setUsed(u => { const nu = [...u, nextMatch.id]; usedRef.current = nu; return nu; });
    setMatch(nextMatch);
    matchRef.current = nextMatch;
    setPrediction(null);
    setRound(next);
    setPhase('match');
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    const shuffled = [...MP_MATCHES].sort(() => Math.random() - 0.5);
    const first = shuffled[0];
    setUsed([first.id]);
    usedRef.current = [first.id];
    setMatch(first);
    matchRef.current = first;
    setPrediction(null);
    setResults([]);
    setRound(0);
    setScore(0);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Match Predictor! Call the winner!');
    timerRef.current = setTimeout(() => setPhase('match'), 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'match') return;
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'match') return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    let pred;
    if (dur < 1.0) { pred = 'home'; }
    else if (dur < 2.5) { pred = 'draw'; }
    else { pred = 'away'; }

    setPrediction(pred);
    setPhase('prediction');
    playFx('whistle');

    const label = pred === 'home' ? 'Home Win' : pred === 'draw' ? 'Draw' : 'Away Win';
    setCommentary(`You predict: ${label}!`);
    addChat(`📊 Predicts: ${label}`);

    timerRef.current = setTimeout(() => {
      const m = matchRef.current;
      const r = Math.random();
      const simResult = r < m.pool[0] / 100 ? 'home' : r < (m.pool[0] + m.pool[1]) / 100 ? 'draw' : 'away';
      const correct = simResult === pred;
      const pts = correct ? 100 : 0;

      setResults(prev => [...prev, { match: m, prediction: pred, result: simResult, correct }]);
      setScore(s => { scoreRef.current = s + pts; return s + pts; });

      if (correct) {
        spawnConfetti(30);
        playFx('crowd');
        setCommentary('Correct prediction! +100 coins!');
        addChat('✅ Correct prediction!');
      } else {
        const resultLabel = simResult === 'home' ? 'Home Win' : simResult === 'draw' ? 'Draw' : 'Away Win';
        setCommentary(`Not this time... the result was: ${resultLabel}`);
        addChat(`❌ Result: ${resultLabel}`);
      }

      setPhase('result');
      timerRef.current = setTimeout(() => nextRound(), 2500);
    }, 2000);
  }, [playFx, addChat, spawnConfetti, nextRound]);

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

  const isMt = phase === 'match';
  const isPr = phase === 'prediction';
  const isRes = phase === 'result';
  const isComp = phase === 'complete';
  const lastResult = results[results.length - 1];

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #061020 0%, #0c1a38 30%, #102240 60%, #081830 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.12), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.08))', pointerEvents: 'none' }} />

      {/* Confetti */}
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={handleBack} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #3B82F6, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MATCH PREDICTOR</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>SCORE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>MATCH</div></div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#3B82F6', letterSpacing: 3 }}>MATCH PREDICTOR</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Short = Home Win | Medium = Draw | Long = Away Win</div>
          </div>
        )}

        {/* Match phase */}
        {isMt && match && (
          <div style={{ width: '100%', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ padding: '2px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', display: 'inline-block', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6' }}>Group {match.group} | {match.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{match.home}</div></div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.text3 }}>VS</div>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{match.away}</div></div>
            </div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 8 }}>Prediction pool:</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['Home', 'Draw', 'Away'].map((o, j) => (
                <div key={j} style={{ flex: 1, padding: '6px', borderRadius: 8, textAlign: 'center', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.text2 }}>{o}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#3B82F6' }}>{match.pool[j]}%</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)' }}><div style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6' }}>Home Win</div><div style={{ fontSize: 8, color: C.text3 }}>Short (&lt;1s)</div></div>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.25)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>Draw</div><div style={{ fontSize: 8, color: C.text3 }}>Medium (1-2.5s)</div></div>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.red }}>Away Win</div><div style={{ fontSize: 8, color: C.text3 }}>Long (&gt;2.5s)</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.text3 }}>TAP TO PREDICT 📊</div>
          </div>
        )}

        {/* Prediction waiting */}
        {isPr && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: prediction === 'home' ? '#3B82F6' : prediction === 'draw' ? C.gold : C.red }}>
              {prediction === 'home' ? 'HOME WIN' : prediction === 'draw' ? 'DRAW' : 'AWAY WIN'}
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Waiting for result...</div>
          </div>
        )}

        {/* Result */}
        {isRes && lastResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{lastResult.correct ? '✅' : '❌'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: lastResult.correct ? C.green : C.red }}>
              {lastResult.correct ? 'CORRECT!' : 'WRONG!'}
            </div>
            {lastResult.correct && <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 4 }}>+100 coins!</div>}
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginBottom: 12 }}>{commentary}</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); nextRound(); }} style={{ padding: '10px 28px', borderRadius: 12, cursor: 'pointer', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)', fontSize: 13, fontWeight: 800, color: '#3B82F6', display: 'inline-block' }}>Next Match</div>
          </div>
        )}

        {/* Complete */}
        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 4 }}>ALL MATCHES PREDICTED</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 13, color: C.green }}>Correct: {results.filter(r => r.correct).length}/5</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.lime, marginTop: 4 }}>+{score} coins earned</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)', fontSize: 13, fontWeight: 800, color: '#3B82F6' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}
      </div>
    </div>
  );
}
