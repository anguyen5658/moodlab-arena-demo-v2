export function MePage() {
  return (
    <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <p style={{ color: '#FB923C', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Me</p>
      <h1 style={{ marginTop: 0, fontSize: '2.2rem' }}>Profile, progression, and wallet</h1>
      <p style={{ color: '#b7bfce', maxWidth: 720 }}>
        The migration scaffold keeps this tab routed separately so coins, XP, badges, and ownership state can move into
        typed global state without changing the user-facing flow.
      </p>
    </section>
  );
}