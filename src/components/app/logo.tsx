import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("text-3xl font-bold font-headline", className)}>
      <span className="text-primary">Biz</span>
      <span className="text-accent">Assistant</span>
    </div>
  );
}
