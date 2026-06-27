import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { Input } from "components/ui/Input";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { Table } from "components/ui/Table";
import { PageHeader } from "components/shared/PageHeader";
import { SetupNotice } from "components/shared/SetupNotice";
import { useClients } from "hooks/useClients";
import { formatCurrency } from "lib/utils";

export default function ClientList() {
  const navigate = useNavigate();
  const { data, loading, error } = useClients();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "company_name", direction: "asc" });

  const rows = useMemo(() => {
    const filtered = (data || []).filter((client) =>
      [client.company_name, client.contact_name, client.contact_email]
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
    {
      key: "company_name",
      header: "Company",
      sortable: true,
      render: (row) => (
        <Link to={`/clients/${row.id}`} className="font-semibold text-brand-700 hover:underline">
          {row.company_name}
        </Link>
      )
    },
    { key: "contact_name", header: "Contact", sortable: true },
    { key: "contact_email", header: "Email", sortable: true },
    { key: "contact_phone", header: "Phone" },
    {
      key: "active_contracts",
      header: "Active contracts",
      render: (row) => row.contracts?.filter((contract) => contract.status === "active").length || 0
    },
    {
      key: "total_spend",
      header: "Total spend",
      render: (row) =>
        formatCurrency(
          (row.contracts || []).reduce(
            (sum, contract) => sum + Number(contract.total_value || 0),
            0
          )
        )
    }
  ];

  return (
    <div className="space-y-6">
      <SetupNotice />
      <PageHeader
        title="Clients"
        description="Search client records, monitor value, and launch new contracts."
        action={{ label: "Add client", onClick: () => navigate("/clients/new") }}
      />

      <Card className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search by company, contact name, or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading clients..." />
        ) : error ? (
          <EmptyState title="Could not load clients" description={error} />
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
          />
        )}
      </Card>
    </div>
  );
}
