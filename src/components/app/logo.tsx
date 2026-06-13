import { cn } from "@/lib/utils";

const LogoIcon = () => (
  <svg
    width="1.4em"
    height="1.2em"
    viewBox="0 0 80 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-[1.2em] w-[1.4em] text-accent"
  >
    {/* Back coin */}
    <circle cx="30" cy="30" r="28" fill="currentColor" />
    <text
      x="30"
      y="31"
      textAnchor="middle"
      dominantBaseline="middle"
      fontWeight="700"
      fontSize="26"
      fill="white"
      fontFamily="'Inter', 'Segoe UI', sans-serif"
    >
      $
    </text>

    {/* Front coin */}
    <circle
      cx="52"
      cy="42"
      r="24"
      fill="white"
      stroke="currentColor"
      strokeWidth="3"
    />
    <text
      x="52"
      y="43"
      textAnchor="middle"
      dominantBaseline="middle"
      fontWeight="700"
      fontSize="24"
      fill="currentColor"
      fontFamily="'Inter', 'Segoe UI', sans-serif"
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
        <span className="whitespace-nowrap">Busmo<span className="text-primary">Pay</span></span>
      </div>
    );
  }

  if (variant === 'busmogo') {
     return (
      <div className={cn("flex items-center gap-2 text-3xl font-bold font-headline", className)}>
        <BusmoGoLogoIcon />
        <div>
            <span className="whitespace-nowrap">Busmo<span className="text-primary">Go</span></span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-4xl font-bold font-headline", className)}>
      <LogoIcon />
      <div>
        <span className="text-accent whitespace-nowrap">Busmo</span>
      </div>
    </div>
  );
}
