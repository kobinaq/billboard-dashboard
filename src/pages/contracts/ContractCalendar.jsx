import { useMemo } from "react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { useContracts } from "hooks/useContracts";
import { formatDate } from "lib/utils";

export default function ContractCalendar() {
  const { data, loading, error } = useContracts();
  const grouped = useMemo(() => {
    return (data || []).reduce((accumulator, contract) => {
      const key = contract.billboards?.name || "Unassigned board";
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(contract);
      return accumulator;
    }, {});
  }, [data]);

  if (loading) {
    return <LoadingSpinner label="Loading contract timeline..." />;
  }

  if (error) {
    return <EmptyState title="Could not load timeline" description={error} />;
  }

  return (
    <div className="space-y-6">
      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="Timeline bars will appear here once contracts are recorded."
        />
      ) : (
        <Card className="space-y-6 overflow-x-auto">
          {Object.entries(grouped).map(([boardName, contracts]) => (
            <div key={boardName} className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div>
                <p className="text-sm font-semibold text-slate-900">{boardName}</p>
                <p className="text-xs text-slate-500">
                  {contracts.length} contract{contracts.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div key={contract.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {contract.clients?.company_name} • {contract.contract_number}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                        </p>
                      </div>
                      <StatusBadge value={contract.status} />
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-200">
                      <div className="h-3 w-full rounded-full bg-brand-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
