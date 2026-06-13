// Bag SVG icon for business (replaces 👜)
export function BagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="7" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 7V5a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

// Farm SVG icon (replaces 🌾)
export function FarmIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 16c0-2.5 2-4.5 4-4.5s4 2 4 4.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12V8m0 0l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

// Phone SVG icon (replaces 📱)
export function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
    </svg>
  );
}
