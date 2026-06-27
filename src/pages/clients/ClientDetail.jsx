import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { Table } from "components/ui/Table";
import { useClients } from "hooks/useClients";
import { formatCurrency } from "lib/utils";

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, loading, error } = useClients();
  const client = useMemo(() => (data || []).find((item) => item.id === id), [data, id]);

  if (loading) {
    return <LoadingSpinner label="Loading client..." />;
  }

  if (error || !client) {
    return <EmptyState title="Client not found" description={error || "Client record missing."} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">{client.company_name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {client.contact_name} • {client.contact_email} • {client.contact_phone || "No phone"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(`/clients/${id}/edit`)}>
            Edit client
          </Button>
          <Button onClick={() => navigate(`/contracts/new?client=${id}`)}>Create contract</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5">
          <DetailRow label="Industry" value={client.industry} />
          <DetailRow label="Address" value={client.address} />
          <DetailRow label="Notes" value={client.notes} />
          <DetailRow
            label="Total contract value"
            value={formatCurrency(
              (client.contracts || []).reduce(
                (sum, contract) => sum + Number(contract.total_value || 0),
                0
              )
            )}
          />
        </Card>
        <Card>
          <h4 className="mb-4 text-lg font-semibold">Contracts</h4>
          <Table
            columns={[
              { key: "status", header: "Status" },
              { key: "total_value", header: "Total value", render: (row) => formatCurrency(row.total_value) }
            ]}
            rows={client.contracts || []}
            onSort={() => {}}
          />
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-800">{value || "--"}</p>
    </div>
  );
}
