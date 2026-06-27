import { useMemo } from "react";
import { AlertTriangle, BriefcaseBusiness, CreditCard, MapPinned, Wrench } from "lucide-react";
import { StatCard } from "components/dashboard/StatCard";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { Table } from "components/ui/Table";
import { SetupNotice } from "components/shared/SetupNotice";
import { useBillboards } from "hooks/useBillboards";
import { useContracts } from "hooks/useContracts";
import { useInspections } from "hooks/useInspections";
import { formatCurrency, formatDate, isWithinDays } from "lib/utils";

export default function ManagementDashboard() {
  const billboards = useBillboards();
  const contracts = useContracts();
  const inspections = useInspections();

  const loading = billboards.loading || contracts.loading || inspections.loading;
  const error = billboards.error || contracts.error || inspections.error;

  const metrics = useMemo(() => {
    const boards = billboards.data || [];
    const contractRows = contracts.data || [];
    const inspectionRows = inspections.data || [];
    const occupied = boards.filter((board) => board.status === "occupied").length;
    const available = boards.filter((board) => board.status === "available").length;
    const maintenance = boards.filter((board) => board.status === "maintenance").length;
    const monthlyRevenue = contractRows
      .filter((contract) => contract.status === "active")
      .reduce((sum, contract) => sum + Number(contract.monthly_rate || 0), 0);
    const outstanding = contractRows.filter((contract) => contract.payment_status !== "paid");
    const expiringSoon = contractRows.filter(
      (contract) => contract.status === "active" && isWithinDays(contract.end_date, 30)
    );
    const attentionBoards = inspectionRows.filter(
      (inspection) => inspection.action_required && !inspection.action_resolved
    );
    const recentActivity = [
      ...contractRows.slice(0, 5).map((contract) => ({
        id: `contract-${contract.id}`,
        type: "Contract",
        description: `${contract.contract_number} for ${contract.clients?.company_name}`,
        timestamp: contract.created_at
      })),
      ...inspectionRows.slice(0, 5).map((inspection) => ({
        id: `inspection-${inspection.id}`,
        type: "Inspection",
        description: `${inspection.billboards?.name} marked ${inspection.overall_condition}`,
        timestamp: inspection.created_at || inspection.inspected_at
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      boards,
      occupied,
      available,
      maintenance,
      monthlyRevenue,
      outstanding,
      expiringSoon,
      attentionBoards,
      recentActivity
    };
  }, [billboards.data, contracts.data, inspections.data]);

  return (
    <div className="space-y-6">
      <SetupNotice />
      {loading ? (
        <LoadingSpinner label="Loading dashboard metrics..." />
      ) : error ? (
        <EmptyState title="Could not load dashboard" description={error} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total billboards"
              value={metrics.boards.length}
              meta={`${metrics.occupied} occupied`}
              icon={MapPinned}
            />
            <StatCard
              title="Available boards"
              value={metrics.available}
              meta={`${Math.round((metrics.occupied / Math.max(metrics.boards.length, 1)) * 100)}% occupancy`}
              icon={BriefcaseBusiness}
            />
            <StatCard
              title="Boards in maintenance"
              value={metrics.maintenance}
              meta="Immediate operations watchlist"
              icon={Wrench}
            />
            <StatCard
              title="Monthly revenue"
              value={formatCurrency(metrics.monthlyRevenue)}
              meta="From active contracts"
              icon={CreditCard}
            />
            <StatCard
              title="Outstanding contracts"
              value={metrics.outstanding.length}
              meta="Payment status not marked paid"
              icon={AlertTriangle}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <h4 className="mb-4 text-lg font-semibold">Expiring Soon</h4>
              <Table
                columns={[
                  { key: "client", header: "Client", render: (row) => row.clients?.company_name || "--" },
                  { key: "board", header: "Board", render: (row) => row.billboards?.name || "--" },
                  { key: "end_date", header: "End date", render: (row) => formatDate(row.end_date) },
                  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.payment_status} /> }
                ]}
                rows={metrics.expiringSoon}
                onSort={() => {}}
              />
            </Card>

            <Card>
              <h4 className="mb-4 text-lg font-semibold">Boards Needing Attention</h4>
              <div className="space-y-3">
                {metrics.attentionBoards.length ? (
                  metrics.attentionBoards.map((inspection) => (
                    <div key={inspection.id} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-rose-900">
                            {inspection.billboards?.name || "Billboard"}
                          </p>
                          <p className="text-sm text-rose-700">
                            {inspection.profiles?.full_name || "--"} • {formatDate(inspection.inspected_at)}
                          </p>
                        </div>
                        <StatusBadge value={inspection.overall_condition} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No unresolved action items right now.</p>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <h4 className="mb-4 text-lg font-semibold">Recent Activity</h4>
            <div className="space-y-3">
              {metrics.recentActivity.length ? (
                metrics.recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{activity.type}</p>
                      <p className="text-sm text-slate-500">{activity.description}</p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(activity.timestamp)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Activity will appear here as contracts, inspections, and payments are created.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
