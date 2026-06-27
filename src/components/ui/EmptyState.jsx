import { Info } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Info
}) {
  return (
    <div className="panel flex flex-col items-start gap-4 p-8 text-left">
      <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-xl text-sm text-slate-500">{description}</p>
      </div>
      {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
