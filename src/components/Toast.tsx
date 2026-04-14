import { cn } from '../lib/utils';

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={cn(
      "fixed bottom-20 left-1/2 -translate-x-1/2 bg-bg-card border border-border-halloween rounded-full px-5 py-2 text-sm font-bold text-cream-halloween z-[2000] transition-all duration-300 shadow-2xl pointer-events-none",
      message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {message}
    </div>
  );
}
