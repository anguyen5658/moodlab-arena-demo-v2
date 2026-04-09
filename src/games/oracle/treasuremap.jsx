import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { useApp } from '../../context/AppContext.jsx';

const TM_TILE_INFO = {
  treasure: { emoji: '💎', label: 'TREASURE', value: 200, color: C.gold },
  bomb: { emoji: '💣', label: 'BOMB!', value: 0, color: C.red },
  coin: { emoji: '🪙', label: '+25', value: 25, color: C.cyan },
  star: { emoji: '⭐', label: '+50', value: 50, color: C.gold },
  clover: { emoji: '🍀', label: '+75', value: 75, color: C.lime },
};

const genGrid = () => {
  const types = [];
  for (let i = 0; i < 3; i++) types.push('treasure');
  for (let i = 0; i < 3; i++) types.push('bomb');
  const smalls = ['coin', 'coin', 'coin', 'coin', 'star', 'star', 'star', 'clover', 'clover', 'clover'];
  types.push(...smalls);
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
};

export default function TreasureMap() {
  const navigate = useNavigate();
  const {
    playFx, confettiParticles, spawnConfetti, triggerFlash, awardGame,
    setCoins, setGameChatMsgs, setBLEHandlers, clearBLEHandlers,
  } = useApp();

  const [phase, setPhase] = useState(null);
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState(Array(16).fill(false));
  const [treasures, setTreasures] = useState(0);
  const [localCoins, setLocalCoins] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [commentary, setCommentary] = useState('');

  const phaseRef = useRef(phase);
  const selectedRef = useRef(selected);
  const gridRef = useRef(grid);
  const revealedRef = useRef(revealed);
  const treasuresRef = useRef(treasures);
  const localCoinsRef = useRef(localCoins);
  const gameOverRef = useRef(gameOver);
  const scoreRef = useRef(score);
  const puffStartRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { revealedRef.current = revealed; }, [revealed]);
  useEffect(() => { treasuresRef.current = treasures; }, [treasures]);
  useEffect(() => { localCoinsRef.current = localCoins; }, [localCoins]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const addChat = useCallback((msg) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text: msg, ts: Date.now() }]);
  }, [setGameChatMsgs]);

  const startGame = useCallback(() => {
    const newGrid = genGrid();
    setGrid(newGrid); gridRef.current = newGrid;
    const freshRevealed = Array(16).fill(false);
    setRevealed(freshRevealed); revealedRef.current = freshRevealed;
    setTreasures(0); setLocalCoins(0); setGameOver(false); setSelected(null); setScore(0);
    treasuresRef.current = 0; localCoinsRef.current = 0; gameOverRef.current = false;
    setPhase('intro');
    playFx('crowd');
    setCommentary('Treasure Map! Tap a tile, then PUFF to flip. Find 3 treasures!');
    timerRef.current = setTimeout(() => setPhase('playing'), 1500);
  }, [playFx]);

  const selectTile = useCallback((idx) => {
    if (phaseRef.current !== 'playing' || revealedRef.current[idx] || gameOverRef.current) return;
    setSelected(idx); selectedRef.current = idx;
    playFx('select');
  }, [playFx]);

  const cashOut = useCallback(() => {
    if (phaseRef.current !== 'playing' || gameOverRef.current) return;
    const winnings = localCoinsRef.current;
    setGameOver(true); gameOverRef.current = true;
    setPhase('result');
    if (winnings > 0) {
      setScore(s => { scoreRef.current = s + winnings; return s + winnings; });
      setCoins(c => c + winnings);
      playFx('win');
      awardGame('treasuremap', 'win');
      addChat(`💰 Cashed out: +${winnings} coins`);
    }
    setCommentary(`Cashed out with ${winnings} coins!`);
  }, [playFx, awardGame, setCoins, addChat]);

  const handleDown = useCallback(() => {
    if (phaseRef.current !== 'playing' || selectedRef.current === null || gameOverRef.current) return;
    puffStartRef.current = Date.now();
  }, []);

  const handleUp = useCallback(() => {
    if (phaseRef.current !== 'playing' || selectedRef.current === null || !puffStartRef.current || gameOverRef.current) return;
    const dur = (Date.now() - puffStartRef.current) / 1000;
    puffStartRef.current = 0;
    if (dur < 0.15) return;

    const idx = selectedRef.current;
    const newRevealed = [...revealedRef.current];
    newRevealed[idx] = true;
    setRevealed(newRevealed); revealedRef.current = newRevealed;
    setSelected(null); selectedRef.current = null;

    const tileType = gridRef.current[idx];
    const info = TM_TILE_INFO[tileType];

    if (tileType === 'treasure') {
      const newT = treasuresRef.current + 1;
      setTreasures(newT); treasuresRef.current = newT;
      setLocalCoins(c => { localCoinsRef.current = c + info.value; return c + info.value; });
      spawnConfetti(20); playFx('crowd');
      setCommentary(`TREASURE FOUND! ${info.emoji} +${info.value} coins!`);
      addChat(`💎 TREASURE FOUND! +${info.value} coins`);

      if (newT >= 3) {
        const bonus = 500;
        timerRef.current = setTimeout(() => {
          const totalWin = localCoinsRef.current + bonus;
          setLocalCoins(c => c + bonus); localCoinsRef.current += bonus;
          setScore(s => { scoreRef.current = s + totalWin; return s + totalWin; });
          setCoins(c => c + totalWin);
          setCommentary(`ALL 3 TREASURES! JACKPOT BONUS +${bonus}!`);
          spawnConfetti(50); triggerFlash('goal'); playFx('win');
          awardGame('treasuremap', 'win');
          addChat(`👑 ALL TREASURES! +${bonus} BONUS!`);
          setGameOver(true); setPhase('result');
        }, 500);
        return;
      }
    } else if (tileType === 'bomb') {
      playFx('bomb_hit'); triggerFlash('red');
      const lostCoins = Math.floor(localCoinsRef.current / 2);
      setCommentary(`BOOM! Lost ${lostCoins} coins!`);
      addChat(`💣 BOMB! Lost ${lostCoins} coins`);
      setGameOver(true); gameOverRef.current = true;
      timerRef.current = setTimeout(() => {
        const remaining = Math.max(0, localCoinsRef.current - lostCoins);
        setLocalCoins(remaining); localCoinsRef.current = remaining;
        if (remaining > 0) {
          setScore(s => { scoreRef.current = s + remaining; return s + remaining; });
          setCoins(c => c + remaining);
          awardGame('treasuremap', 'lose');
        }
        setPhase('result');
      }, 1500);
    } else {
      setLocalCoins(c => { localCoinsRef.current = c + info.value; return c + info.value; });
      playFx('select');
      setCommentary(`${info.emoji} ${info.label}!`);
      addChat(`${info.emoji} +${info.value} coins`);
    }
  }, [playFx, spawnConfetti, triggerFlash, addChat, awardGame, setCoins]);

  useEffect(() => {
    setBLEHandlers(0, () => handleDown(), () => handleUp());
    return () => clearBLEHandlers(0);
  }, []); // eslint-disable-line

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line

  const isPlaying = phase === 'playing';
  const isResult = phase === 'result';
  const isComp = phase === 'complete';

  const hitBomb = isResult && grid[revealed.findIndex((r, i) => r && grid[i] === 'bomb')] === 'bomb';

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', touchAction: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onMouseUp={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
      onTouchStart={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleDown(); }}
      onTouchEnd={(e) => { if (e.target.closest('[data-back],[data-btn]')) return; handleUp(); }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a1200 0%, #1a2800 40%, #0a1600 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.08), transparent 60%)', pointerEvents: 'none' }} />
      {confettiParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); navigate('/oracle'); }} style={{ position: 'absolute', top: 14, left: 14, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 700 }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 400, width: '100%', padding: '50px 12px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #FFD700, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TREASURE MAP</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{localCoins}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>{treasures}/3</div><div style={{ fontSize: 8, color: C.text3 }}>TREASURES</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold, letterSpacing: 3 }}>TREASURE MAP</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Tap a tile, puff to reveal. Find 3 treasures. Avoid bombs!</div>
          </div>
        )}

        {(isPlaying || isResult) && grid.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
              {grid.map((tileType, i) => {
                const isRev = revealed[i];
                const isSel = selected === i;
                const info = TM_TILE_INFO[tileType];
                return (
                  <div key={i} data-btn="true" onClick={(e) => { e.stopPropagation(); selectTile(i); }} style={{ height: 68, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isRev || gameOver ? 'default' : 'pointer', background: isRev ? (tileType === 'treasure' ? `${C.gold}15` : tileType === 'bomb' ? `${C.red}15` : 'rgba(255,255,255,0.05)') : isSel ? `${C.gold}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isRev ? (tileType === 'treasure' ? C.gold + '40' : tileType === 'bomb' ? C.red + '40' : 'rgba(255,255,255,0.08)') : isSel ? C.gold + '40' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s', transform: isSel ? 'scale(1.05)' : 'scale(1)' }}>
                    {isRev ? (
                      <>
                        <div style={{ fontSize: 24 }}>{info.emoji}</div>
                        {info.value > 0 && <div style={{ fontSize: 8, fontWeight: 700, color: info.color, marginTop: 2 }}>{info.label}</div>}
                      </>
                    ) : (
                      <div style={{ fontSize: 20 }}>❓</div>
                    )}
                  </div>
                );
              })}
            </div>

            {isPlaying && !gameOver && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: C.text3 }}>
                  {selected !== null ? <span style={{ color: C.gold, fontWeight: 800 }}>HOLD TO PUFF & REVEAL 🗺️</span> : 'TAP a tile to select'}
                </div>
                <div data-btn="true" onClick={(e) => { e.stopPropagation(); cashOut(); }} style={{ padding: '8px 16px', borderRadius: 10, cursor: 'pointer', background: `${C.green}12`, border: `1px solid ${C.green}25`, fontSize: 11, fontWeight: 700, color: C.green, flexShrink: 0 }}>
                  Cash Out ({localCoins} 🪙)
                </div>
              </div>
            )}

            {isResult && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: treasures >= 3 ? C.gold : C.red }}>
                  {treasures >= 3 ? '🏆 ALL TREASURES FOUND!' : gameOver && grid[revealed.lastIndexOf(true)] === 'bomb' ? '💣 BOMB HIT!' : '💰 CASHED OUT!'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginTop: 4 }}>Total: {localCoins} coins</div>
              </div>
            )}
          </div>
        )}

        {isResult && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 13, fontWeight: 800, color: C.gold }}>Play Again</div>
            <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/oracle'); }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 4 }}>{commentary}</div>
      </div>
    </div>
  );
}
