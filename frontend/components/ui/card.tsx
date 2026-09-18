import { cn } from "@/lib/utils";
export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm", className)}>
      {children}
    </section>
  );
}
