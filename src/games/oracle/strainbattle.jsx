import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const SB_STRAINS = [
  { name: 'OG Kush', emoji: '🌿', thc: 23, type: 'Hybrid', effects: 'Relaxed, Euphoric, Happy', flavor: 'Earthy, Pine, Woody' },
  { name: 'Blue Dream', emoji: '💙', thc: 21, type: 'Sativa', effects: 'Creative, Euphoric, Uplifted', flavor: 'Berry, Sweet, Herbal' },
  { name: 'Gorilla Glue', emoji: '🦍', thc: 28, type: 'Hybrid', effects: 'Relaxed, Euphoric, Sleepy', flavor: 'Diesel, Earthy, Pine' },
  { name: 'Girl Scout Cookies', emoji: '🍪', thc: 25, type: 'Hybrid', effects: 'Happy, Euphoric, Relaxed', flavor: 'Sweet, Earthy, Pungent' },
  { name: 'Sour Diesel', emoji: '⛽', thc: 22, type: 'Sativa', effects: 'Energetic, Happy, Uplifted', flavor: 'Diesel, Pungent, Earthy' },
  { name: 'Purple Haze', emoji: '💜', thc: 20, type: 'Sativa', effects: 'Creative, Euphoric, Energetic', flavor: 'Berry, Earthy, Sweet' },
  { name: 'Wedding Cake', emoji: '🎂', thc: 27, type: 'Indica', effects: 'Relaxed, Happy, Euphoric', flavor: 'Sweet, Vanilla, Earthy' },
  { name: 'Gelato', emoji: '🍨', thc: 25, type: 'Hybrid', effects: 'Relaxed, Happy, Euphoric', flavor: 'Sweet, Citrus, Fruity' },
  { name: 'Jack Herer', emoji: '🌲', thc: 20, type: 'Sativa', effects: 'Creative, Energetic, Focused', flavor: 'Pine, Earthy, Woody' },
  { name: 'Northern Lights', emoji: '🌌', thc: 21, type: 'Indica', effects: 'Relaxed, Sleepy, Happy', flavor: 'Earthy, Pine, Sweet' },
  { name: 'Pineapple Express', emoji: '🍍', thc: 22, type: 'Hybrid', effects: 'Happy, Uplifted, Energetic', flavor: 'Tropical, Pineapple, Citrus' },
  { name: 'White Widow', emoji: '🕸️', thc: 20, type: 'Hybrid', effects: 'Euphoric, Energetic, Creative', flavor: 'Earthy, Woody, Pungent' },
  { name: 'AK-47', emoji: '💥', thc: 22, type: 'Hybrid', effects: 'Relaxed, Happy, Uplifted', flavor: 'Earthy, Pungent, Floral' },
  { name: 'Granddaddy Purple', emoji: '🍇', thc: 23, type: 'Indica', effects: 'Relaxed, Sleepy, Happy', flavor: 'Grape, Berry, Sweet' },
  { name: 'Skywalker OG', emoji: '🌠', thc: 26, type: 'Indica', effects: 'Relaxed, Sleepy, Happy', flavor: 'Earthy, Pine, Diesel' },
  { name: 'Durban Poison', emoji: '☀️', thc: 19, type: 'Sativa', effects: 'Energetic, Uplifted, Creative', flavor: 'Sweet, Earthy, Pine' },
];

export default function StrainBattle() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, awardGame,
    setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [matchups, setMatchups] = useState([]);
  const [matchup, setMatchup] = useState(null);
  const [vote, setVote] = useState(null);
  const [results, setResults] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const roundRef = useRef(round);
  const scoreRef = useRef(score);
  const matchupsRef = useRef(matchups);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { matchupsRef.current = matchups; }, [matchups]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const nextRound = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= 5) {
      setPhase('complete');
      const sc = scoreRef.current;
      playFx(sc > 0 ? 'win' : 'lose');
      awardGame('strainbattle', sc > 0 ? 'win' : 'lose');
      return;
    }
    const mups = matchupsRef.current;
    setMatchup([mups[next][0], mups[next][1]]);
    setVote(null);
    setResults(null);
    setRound(next);
    setPhase('matchup');
  }, [playFx, awardGame]);

  const startGame = useCallback(() => {
    const shuffled = [...SB_STRAINS].sort(() => Math.random() - 0.5);
    const mups = [];
    for (let i = 0; i < 10; i += 2) mups.push([shuffled[i], shuffled[i + 1]]);
    setMatchups(mups);
    matchupsRef.current = mups;
    setRound(0);
    setScore(0);
    setVote(null);
    setResults(null);
    setMatchup([mups[0][0], mups[0][1]]);
    setPhase('intro');
    playFx('crowd');
    setCommentary('Strain Battle! Vote for the best strain!');
    timerRef.current = setTimeout(() => setPhase('matchup'), 1500);
  }, [playFx]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'matchup') return;
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'matchup') return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    const v = dur < 1.5 ? 'left' : 'right';
    setVote(v);

    const leftPct = 30 + Math.floor(Math.random() * 40);
    const rightPct = 100 - leftPct;
    setResults({ left: leftPct, right: rightPct });
    setPhase('results');

    playFx('tap');
    const mup = matchupsRef.current[roundRef.current];
    const winner = v === 'left' ? mup[0].name : mup[1].name;
    setCommentary(`You voted for ${winner}! Let's see the results...`);
    addChat(`🌿 Voted for ${winner}`);

    const pts = (v === 'left' && leftPct > 50) || (v === 'right' && rightPct > 50) ? 30 : 10;
    setScore(s => { scoreRef.current = s + pts; return s + pts; });

    timerRef.current = setTimeout(() => nextRound(), 2500);
  }, [playFx, addChat, nextRound]);

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

  const isM = phase === 'matchup';
  const isR = phase === 'results';
  const isComp = phase === 'complete';

  const typeColor = (type) => type === 'Sativa' ? C.green : type === 'Indica' ? '#9333EA' : C.gold;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #061a0d 0%, #0a2818 30%, #0d3318 60%, #061a0d 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.12), transparent 60%)', pointerEvents: 'none' }} />

      {/* Confetti */}
      {confettiParticles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={handleBack} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto', overflowY: 'auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #22C55E, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STRAIN BATTLE</div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>SCORE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#22C55E', letterSpacing: 3 }}>STRAIN BATTLE</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Short puff = Left strain | Long puff = Right strain</div>
          </div>
        )}

        {/* Matchup phase */}
        {isM && matchup && (
          <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              {matchup.map((strain, si) => (
                <div key={si} style={{ flex: 1, padding: '14px 8px', borderRadius: 16, textAlign: 'center', background: si === 0 ? 'rgba(34,197,94,0.06)' : 'rgba(255,215,0,0.06)', border: `1px solid ${si === 0 ? 'rgba(34,197,94,0.20)' : 'rgba(255,215,0,0.20)'}` }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{strain.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>{strain.name}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: typeColor(strain.type), marginBottom: 4, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', display: 'inline-block' }}>{strain.type}</div>
                  <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(strain.thc / 30) * 100}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #22C55E, #FFD700)' }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>THC: {strain.thc}%</div>
                  <div style={{ fontSize: 8, color: C.text3, marginTop: 4 }}>{strain.effects}</div>
                  <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Flavor: {strain.flavor}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: C.text3 }}>
                TAP TO VOTE 🌿 · Short puff = <span style={{ color: '#22C55E', fontWeight: 700 }}>{matchup[0].name}</span> | Long puff = <span style={{ color: C.gold, fontWeight: 700 }}>{matchup[1].name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results phase */}
        {isR && matchup && results && (
          <div style={{ width: '100%', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              You voted: <span style={{ color: vote === 'left' ? '#22C55E' : C.gold }}>{vote === 'left' ? matchup[0].name : matchup[1].name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 900, color: '#22C55E' }}>{results.left}%</div><div style={{ fontSize: 10, color: C.text3 }}>{matchup[0].name}</div></div>
              <div style={{ flex: 2 }}>
                <div style={{ width: '100%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${results.left}%`, height: '100%', background: 'linear-gradient(90deg, #22C55E, #22C55EAA)', transition: 'width 1s' }} />
                  <div style={{ width: `${results.right}%`, height: '100%', background: 'linear-gradient(90deg, #FFD700AA, #FFD700)', transition: 'width 1s' }} />
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 900, color: C.gold }}>{results.right}%</div><div style={{ fontSize: 10, color: C.text3 }}>{matchup[1].name}</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginBottom: 12 }}>{commentary}</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); nextRound(); }} style={{ padding: '10px 28px', borderRadius: 12, cursor: 'pointer', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)', fontSize: 13, fontWeight: 800, color: '#22C55E', display: 'inline-block' }}>Next Matchup</div>
          </div>
        )}

        {/* Complete phase */}
        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#22C55E', marginBottom: 4 }}>BATTLE COMPLETE!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.lime, marginTop: 4 }}>+{score} coins earned</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)', fontSize: 13, fontWeight: 800, color: '#22C55E' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/me'); }} style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${C.purple}10`, border: `1px solid ${C.purple}20`, fontSize: 11, fontWeight: 700, color: C.purple, marginTop: 8 }}>👤 My Progress</div>
          </div>
        )}
      </div>
    </div>
  );
}
