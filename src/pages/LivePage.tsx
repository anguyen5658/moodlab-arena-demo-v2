export function LivePage() {
  return (
    <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <p style={{ color: '#00E5FF', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</p>
      <h1 style={{ marginTop: 0, fontSize: '2.2rem' }}>Social feed and spectator surfaces</h1>
      <p style={{ color: '#b7bfce', maxWidth: 720 }}>
        This tab is now routed separately and will receive the spectator ticker, crowd energy, and floating reaction
        systems during the next migration pass.
      </p>
    </section>
  );
}