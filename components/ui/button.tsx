import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "danger" }>(
  ({ className, variant = "default", ...props }, ref) => <button ref={ref} className={cn("inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", variant === "default" && "bg-church-600 text-white hover:bg-church-700", variant === "outline" && "border bg-white hover:bg-slate-50", variant === "danger" && "bg-red-600 text-white hover:bg-red-700", className)} {...props} />
);
Button.displayName = "Button";
