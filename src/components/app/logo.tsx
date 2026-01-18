import { cn } from "@/lib/utils";
import { Coins } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-3xl font-bold font-headline", className)}>
      <Coins className="h-[1em] w-[1em] text-accent" />
      <div>
        <span className="text-primary">Bus</span>
        <span className="text-accent">mo</span>
      </div>
    </div>
  );
}
