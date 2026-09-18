import { cn } from "@/lib/utils";
export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </section>
  );
}
