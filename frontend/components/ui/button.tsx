import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "danger" }>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" && "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
        variant === "outline" && "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
        variant === "danger" && "bg-red-600 text-white shadow-sm hover:bg-red-500",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
