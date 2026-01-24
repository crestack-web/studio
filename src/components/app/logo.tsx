import { cn } from "@/lib/utils";

const LogoIcon = () => (
  <svg
    width="1.2em"
    height="1em"
    viewBox="0 0 50 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-[1em] w-[1.2em]"
  >
    {/* Back Coin */}
    <circle cx="18" cy="18" r="16" className="fill-accent" />
    <text
      x="18"
      y="19"
      textAnchor="middle"
      dominantBaseline="middle"
      fontWeight="600"
      fontSize="16"
      className="fill-accent-foreground"
      fontFamily="sans-serif"
    >
      $
    </text>
    
    {/* Front Coin */}
    <circle
      cx="32"
      cy="24"
      r="13"
      className="fill-card stroke-accent"
      strokeWidth="2.5"
    />
    <text
      x="32"
      y="25"
      textAnchor="middle"
      dominantBaseline="middle"
      fontWeight="600"
      fontSize="14"
      className="fill-accent"
      fontFamily="sans-serif"
    >
      $
    </text>
  </svg>
);


export function Logo({ className, variant }: { className?: string, variant?: 'default' | 'busmopay' }) {
  if (variant === 'busmopay') {
      return (
        <div className={cn("flex items-center gap-2 text-3xl font-bold font-headline", className)}>
          <LogoIcon />
          <div>
            <span className="text-primary">Busmo</span>
            <span className="text-busmopay-primary">Pay</span>
          </div>
        </div>
      );
  }

  return (
    <div className={cn("flex items-center gap-2 text-3xl font-bold font-headline", className)}>
      <LogoIcon />
      <div>
        <span className="text-primary">Bus</span>
        <span className="text-accent">mo</span>
      </div>
    </div>
  );
}

