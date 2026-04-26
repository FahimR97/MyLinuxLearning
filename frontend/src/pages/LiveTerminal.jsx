export default function LiveTerminal() {
  return (
    <div className="page" style={{ padding: 0, maxWidth: '100%', height: 'calc(100vh - 0px)' }}>
      <div style={{ padding: '1rem 2rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title" style={{ marginBottom: '0.25rem', fontSize: '1.3rem' }}>🖥️ Live Terminal</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>
          Connected to your Linux practice server. Run the lab commands here.
        </p>
      </div>
      <iframe
        src="/term/"
        title="Live Terminal"
        style={{
          width: '100%',
          height: 'calc(100% - 70px)',
          border: 'none',
          background: '#192030',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
