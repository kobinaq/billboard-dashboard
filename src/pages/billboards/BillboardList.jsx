import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Plus, Search } from "lucide-react";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { Input } from "components/ui/Input";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { Table } from "components/ui/Table";
import { PageHeader } from "components/shared/PageHeader";
import { SetupNotice } from "components/shared/SetupNotice";
import { useAuth } from "context/AuthContext";
import { useBillboards } from "hooks/useBillboards";
import { formatDate } from "lib/utils";

export default function BillboardList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data, loading, error } = useBillboards();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", direction: "asc" });

  const rows = useMemo(() => {
    const filtered = (data || []).filter((item) =>
      [item.code, item.name, item.region, item.type, item.status]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const left = a[sort.key] || "";
      const right = b[sort.key] || "";
      return sort.direction === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
  }, [data, query, sort]);

  const columns = [
    { key: "code", header: "Code", sortable: true },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <Link to={`/billboards/${row.id}`} className="font-semibold text-brand-700 hover:underline">
          {row.name}
        </Link>
      )
    },
    { key: "type", header: "Type", sortable: true },
    { key: "region", header: "Region", sortable: true },
    {
      key: "size",
      header: "Size",
      render: (row) => `${row.width_ft || "--"} x ${row.height_ft || "--"} ft`
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge value={row.status} />
    },
    {
      key: "last_inspected",
      header: "Last inspected",
      render: (row) =>
        formatDate(
          row.inspection_logs?.slice().sort((a, b) => new Date(b.inspected_at) - new Date(a.inspected_at))[0]?.inspected_at
        )
    }
  ];

  return (
    <div className="space-y-6">
      <SetupNotice />
      <PageHeader title="All Billboards" />

      <Card className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Search by code, name, region, type, or status"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate("/billboards/map")}>
              <Map className="h-4 w-4" />
              View map
            </Button>
            {(role === "admin" || role === "sales") && (
              <Button onClick={() => navigate("/billboards/new")}>
                <Plus className="h-4 w-4" />
                Add new
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading billboard inventory..." />
        ) : error ? (
          <EmptyState title="Could not load billboards" description={error} />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            sort={sort}
            onSort={(key) =>
              setSort((current) => ({
                key,
                direction:
                  current.key === key && current.direction === "asc" ? "desc" : "asc"
              }))
            }
            emptyMessage="No billboards match the current filters."
          />
        )}
      </Card>
    </div>
  );
}
