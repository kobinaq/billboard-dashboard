import { ToneBadge } from "./Badge";

const statusMap = {
  available: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  occupied: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  maintenance: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  retired: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  partial: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  unpaid: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  active: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  draft: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  expired: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  excellent: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  good: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  fair: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  poor: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  critical: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
};

export function StatusBadge({ value }) {
  return <ToneBadge value={value} toneMap={statusMap} />;
}
