import { cn } from "@/lib/utils";
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800",
    REQUESTED: "bg-amber-100 text-amber-800",
    CHECKED_OUT: "bg-sky-100 text-sky-800",
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-sky-100 text-sky-800",
    REJECTED: "bg-red-100 text-red-800",
    COMPLETED: "bg-emerald-100 text-emerald-800"
  };

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", styles[status] || "bg-slate-100 text-slate-700")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
