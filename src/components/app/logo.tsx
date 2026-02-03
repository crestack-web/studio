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
      className="fill-background"
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

const BusmoGoLogoIcon = () => (
    <svg 
        width="1em" height="1em" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-[1em] w-[1em]"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" className="fill-primary opacity-30"/>
      <path d="M12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" className="fill-primary-foreground"/>
      <path d="M2 9H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary"/>
      <path d="M18 9H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary"/>
    </svg>
);


export function Logo({ className, variant }: { className?: string, variant?: 'default' | 'busmopay' | 'busmogo' }) {
  if (variant === 'busmopay') {
    return (
      <div className={cn('font-bold font-headline text-3xl', className)}>
        <span>Busmo<span className="text-primary">Pay</span></span>
      </div>
    );
  }

  if (variant === 'busmogo') {
     return (
      <div className={cn("flex items-center gap-2 text-3xl font-bold font-headline", className)}>
        <BusmoGoLogoIcon />
        <div>
            <span>Busmo<span className="text-primary">Go</span></span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-3xl font-bold font-headline", className)}>
      <LogoIcon />
      <div>
        <span className="text-accent">Bus</span>
        <span className="text-accent">mo</span>
      </div>
    </div>
  );
}
