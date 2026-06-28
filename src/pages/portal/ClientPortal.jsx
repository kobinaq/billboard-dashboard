import { useMemo } from "react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { useAuth } from "context/AuthContext";
import { useContracts } from "hooks/useContracts";
import { useInspections } from "hooks/useInspections";
import { getClientVisibleContracts } from "lib/contracts";
import { formatDate } from "lib/utils";

export default function ClientPortal() {
  const { profile } = useAuth();
  const contracts = useContracts();
  const inspections = useInspections();
  const loading = contracts.loading || inspections.loading;
  const error = contracts.error || inspections.error;

  const myContracts = useMemo(
    () => getClientVisibleContracts(contracts.data || [], profile),
    [contracts.data, profile]
  );

  const myBoards = myContracts.map((contract) => contract.billboards).filter(Boolean);

  if (loading) {
    return <LoadingSpinner label="Loading portal overview..." />;
  }

  if (error) {
    return <EmptyState title="Could not load portal data" description={error} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <p className="text-sm font-medium text-slate-500">Active boards</p>
        <p className="mt-3 text-3xl font-semibold">{myBoards.length}</p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-500">Contracts</p>
        <p className="mt-3 text-3xl font-semibold">{myContracts.length}</p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-500">Latest end date</p>
        <p className="mt-3 text-3xl font-semibold">
          {myContracts[0]?.end_date ? formatDate(myContracts[0].end_date) : "--"}
        </p>
      </Card>

      <Card className="lg:col-span-2">
        <h4 className="mb-4 text-lg font-semibold">My boards</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {myContracts.length ? (
            myContracts.map((contract) => (
              <div key={contract.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{contract.billboards?.name || "--"}</p>
                    <p className="text-sm text-slate-500">{contract.billboards?.address || "--"}</p>
                  </div>
                  <StatusBadge value={contract.payment_status} />
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Contract period: {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No boards are linked to this client profile yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <h4 className="mb-4 text-lg font-semibold">Latest inspections</h4>
        <div className="space-y-3">
          {(inspections.data || [])
            .filter((inspection) =>
              myBoards.some((board) => board?.id === inspection.billboard_id)
            )
            .slice(0, 5)
            .map((inspection) => (
              <div key={inspection.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">{inspection.billboards?.name || "--"}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(inspection.inspected_at)}</p>
                <div className="mt-3">
                  <StatusBadge value={inspection.overall_condition} />
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
