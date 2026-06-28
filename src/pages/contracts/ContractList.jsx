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
import { useContracts } from "hooks/useContracts";
import { formatCurrency, formatDate } from "lib/utils";

export default function ContractList() {
  const navigate = useNavigate();
  const { data, loading, error } = useContracts();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "contract_number", direction: "desc" });

  const rows = useMemo(() => {
    const filtered = (data || []).filter((contract) =>
      [
        contract.contract_number,
        contract.clients?.company_name,
        contract.billboards?.name,
        contract.billboard_faces?.label,
        contract.status,
        contract.payment_status
      ]
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

  return (
    <div className="space-y-6">
      <SetupNotice />
      <PageHeader title="Contracts" />

      <Card className="space-y-5">
        <div className="flex w-full gap-2 rounded-lg bg-slate-100 p-1 md:w-fit">
          <Button className="flex-1 md:flex-none" onClick={() => navigate("/contracts")}>
            List
          </Button>
          <Button className="flex-1 md:flex-none" variant="secondary" onClick={() => navigate("/contracts/calendar")}>
            Timeline
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Search contract number, client, board, or status"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/contracts/new")}>
              <Plus className="h-4 w-4" />
              Add contract
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading contracts..." />
        ) : error ? (
          <EmptyState title="Could not load contracts" description={error} />
        ) : (
          <Table
            columns={[
              {
                key: "contract_number",
                header: "Contract #",
                sortable: true,
                render: (row) => (
                  <Link to={`/contracts/${row.id}`} className="font-semibold text-brand-700 hover:underline">
                    {row.contract_number}
                  </Link>
                )
              },
              { key: "client", header: "Client", render: (row) => row.clients?.company_name || "--" },
              { key: "billboard", header: "Billboard", render: (row) => row.billboards?.name || "--" },
              { key: "face", header: "Face", render: (row) => row.billboard_faces?.label || "--" },
              { key: "start_date", header: "Start", render: (row) => formatDate(row.start_date) },
              { key: "end_date", header: "End", render: (row) => formatDate(row.end_date) },
              { key: "monthly_rate", header: "Monthly rate", render: (row) => formatCurrency(row.monthly_rate) },
              { key: "total_value", header: "Total value", render: (row) => formatCurrency(row.total_value) },
              { key: "payment_status", header: "Payment", render: (row) => <StatusBadge value={row.payment_status} /> },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> }
            ]}
            rows={rows}
            sort={sort}
            onSort={(key) =>
              setSort((current) => ({
                key,
                direction:
                  current.key === key && current.direction === "asc" ? "desc" : "asc"
              }))
            }
          />
        )}
      </Card>
    </div>
  );
}
