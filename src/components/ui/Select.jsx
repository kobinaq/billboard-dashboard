import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "lib/utils";

export const Select = forwardRef(function Select(
  { label, error, options = [], className, placeholder = "Select...", ...props },
  ref
) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100",
            error && "border-rose-300 focus:border-rose-500 focus:ring-rose-100",
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
});
