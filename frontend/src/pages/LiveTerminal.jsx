export default function LiveTerminal() {
  const ttydUrl = import.meta.env.VITE_TTYD_URL || 'https://54.245.54.69:7681'

  return (
    <div className="page" style={{ padding: 0, maxWidth: '100%', height: 'calc(100vh - 0px)' }}>
      <div style={{ padding: '1rem 2rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title" style={{ marginBottom: '0.25rem', fontSize: '1.3rem' }}>🖥️ Live Terminal</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>
          Connected to your Linux practice server. Run the lab commands here.
        </p>
      </div>
      <iframe
        src={ttydUrl}
        title="Live Terminal"
        style={{
          width: '100%',
          height: 'calc(100% - 70px)',
          border: 'none',
          background: '#0a0e14',
        }}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
