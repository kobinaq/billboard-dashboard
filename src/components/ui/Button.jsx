import { forwardRef } from "react";
import { cn } from "lib/utils";

const variants = {
  primary:
    "bg-brand-700 text-white shadow-lg shadow-brand-900/15 hover:bg-brand-800",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700"
};

export const Button = forwardRef(function Button(
  { className, variant = "primary", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
