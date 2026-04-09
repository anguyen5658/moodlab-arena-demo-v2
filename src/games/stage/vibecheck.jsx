import React from 'react';
import { useNavigate } from 'react-router-dom';
export default function GameStub() {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#050510', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ color: '#FFD93D', fontSize: 24, fontFamily: 'monospace' }}>TODO</div>
      <button onClick={() => navigate('/stage')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', padding: '10px 20px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}
