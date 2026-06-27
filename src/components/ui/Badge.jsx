import { cn, titleCase } from "lib/utils";

export function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ToneBadge({ value, toneMap = {} }) {
  const className =
    toneMap[value] || "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  return <Badge className={className}>{titleCase(value)}</Badge>;
}
