import { Card } from "components/ui/Card";

export function StatCard({ title, value, meta, icon: Icon }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand-100/70 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
          {meta ? <p className="mt-2 text-sm text-slate-500">{meta}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
