import { cn } from "@/lib/utils";
export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) { return <section className={cn("rounded-xl border bg-white p-4 shadow-sm", className)}>{children}</section>; }
