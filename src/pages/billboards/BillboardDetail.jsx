import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { Table } from "components/ui/Table";
import { useAuth } from "context/AuthContext";
import { useBillboards } from "hooks/useBillboards";
import { formatDate } from "lib/utils";

export default function BillboardDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const { data, loading, error } = useBillboards();

  const billboard = useMemo(
    () => (data || []).find((item) => item.id === id),
    [data, id]
  );

  if (loading) {
    return <LoadingSpinner label="Loading billboard details..." />;
  }

  if (error || !billboard) {
    return (
      <EmptyState
        title="Billboard not found"
        description={error || "This billboard could not be loaded with the current session."}
      />
    );
  }

  const contractColumns = [
    {
      key: "company",
      header: "Client",
      render: (row) => row.clients?.company_name || "--"
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "start_date", header: "Start", render: (row) => formatDate(row.start_date) },
    { key: "end_date", header: "End", render: (row) => formatDate(row.end_date) }
  ];

  const inspectionColumns = [
    { key: "inspected_at", header: "Inspected", render: (row) => formatDate(row.inspected_at) },
    {
      key: "overall_condition",
      header: "Condition",
      render: (row) => <StatusBadge value={row.overall_condition} />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold">{billboard.name}</h3>
            <StatusBadge value={billboard.status} />
          </div>
          <p className="text-sm text-slate-500">
            {billboard.code} • {billboard.region} • {billboard.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(role === "admin" || role === "sales") && (
            <Button variant="secondary" onClick={() => (window.location.href = `/billboards/${id}/edit`)}>
              Edit board
            </Button>
          )}
          <Button onClick={() => (window.location.href = `/inspections/new?billboard=${id}`)}>
            Log inspection
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          {billboard.cover_image_url ? (
            <img
              src={billboard.cover_image_url}
              alt={billboard.name}
              className="h-72 w-full rounded-[1.75rem] object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No cover image uploaded yet.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Metric label="Type" value={billboard.type} />
            <Metric label="Facing direction" value={billboard.facing_direction} />
            <Metric label="Traffic count" value={billboard.traffic_count} />
            <Metric
              label="Size"
              value={`${billboard.width_ft || "--"} x ${billboard.height_ft || "--"} ft`}
            />
            <Metric label="Illuminated" value={billboard.illuminated ? "Yes" : "No"} />
            <Metric label="Coordinates" value={`${billboard.latitude}, ${billboard.longitude}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Notes</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {billboard.notes || "No notes recorded for this board yet."}
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h4 className="text-lg font-semibold">Current contract snapshot</h4>
            {billboard.contracts?.length ? (
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <span>Client</span>
                  <span className="font-semibold text-slate-900">
                    {billboard.contracts[0].clients?.company_name}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Duration</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(billboard.contracts[0].start_date)} -{" "}
                    {formatDate(billboard.contracts[0].end_date)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No current contract assigned.</p>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Contract history</h4>
              <Link to="/contracts" className="text-sm font-semibold text-brand-700">
                View all
              </Link>
            </div>
            <Table columns={contractColumns} rows={billboard.contracts || []} onSort={() => {}} />
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Inspection history</h4>
              <Link to="/inspections" className="text-sm font-semibold text-brand-700">
                View all
              </Link>
            </div>
            <Table
              columns={inspectionColumns}
              rows={billboard.inspection_logs || []}
              onSort={() => {}}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value || "--"}</p>
    </div>
  );
}
