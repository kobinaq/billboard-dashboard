import { forwardRef } from "react";
import { cn } from "lib/utils";

export const Textarea = forwardRef(function Textarea(
  { label, error, className, ...props },
  ref
) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100",
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
});
