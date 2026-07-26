export default function SellLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sell-bg, #F0F9FF)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
        alt="MO Sell"
        style={{
          height: 48,
          width: 'auto',
          objectFit: 'contain',
          animation: 'sellPulse 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
}
