import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { Input } from "components/ui/Input";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { Table } from "components/ui/Table";
import { PageHeader } from "components/shared/PageHeader";
import { SetupNotice } from "components/shared/SetupNotice";
import { useInspections } from "hooks/useInspections";
import { formatDate } from "lib/utils";

export default function InspectionList() {
  const navigate = useNavigate();
  const { data, loading, error } = useInspections();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      (data || []).filter((inspection) =>
        [
          inspection.billboards?.name,
          inspection.profiles?.full_name,
          inspection.overall_condition
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [data, query]
  );

  return (
    <div className="space-y-6">
      <SetupNotice />
      <PageHeader
        title="Inspection Logs"
        description="Field issues, conditions, and proof photos in one mobile-friendly workflow."
        action={{ label: "Log inspection", onClick: () => navigate("/inspections/new") }}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Search by board, inspector, or condition"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button onClick={() => navigate("/inspections/new")}>
            <Plus className="h-4 w-4" />
            New log
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading inspections..." />
        ) : error ? (
          <EmptyState title="Could not load inspections" description={error} />
        ) : (
          <Table
            columns={[
              {
                key: "billboard",
                header: "Billboard",
                render: (row) => (
                  <Link to={`/inspections/${row.id}`} className="font-semibold text-brand-700 hover:underline">
                    {row.billboards?.name || "--"}
                  </Link>
                )
              },
              { key: "inspector", header: "Inspector", render: (row) => row.profiles?.full_name || "--" },
              { key: "inspected_at", header: "Date", render: (row) => formatDate(row.inspected_at) },
              { key: "overall_condition", header: "Condition", render: (row) => <StatusBadge value={row.overall_condition} /> },
              {
                key: "action_required",
                header: "Action required",
                render: (row) => (row.action_required ? "Yes" : "No")
              },
              {
                key: "action_resolved",
                header: "Resolved",
                render: (row) => (row.action_resolved ? "Yes" : "No")
              }
            ]}
            rows={rows}
            onSort={() => {}}
          />
        )}
      </Card>
    </div>
  );
}
