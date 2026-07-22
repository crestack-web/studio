export default function SellLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sell-bg, #F0F9FF)',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Animated logo mark */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'sellPulse 1.4s ease-in-out infinite',
          boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </div>
      <p
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#3D5A7A',
          letterSpacing: '0.02em',
        }}
      >
        Loading MO Sell…
      </p>
    </div>
  );
}
