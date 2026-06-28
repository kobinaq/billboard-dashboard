import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { Input } from "components/ui/Input";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { Table } from "components/ui/Table";
import { PageHeader } from "components/shared/PageHeader";
import { SetupNotice } from "components/shared/SetupNotice";
import { usePayments } from "hooks/usePayments";
import { formatCurrency, formatDate } from "lib/utils";

export default function PaymentList() {
  const navigate = useNavigate();
  const { data, loading, error } = usePayments();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      (data || []).filter((payment) =>
        [
          payment.contracts?.contract_number,
          payment.contracts?.clients?.company_name,
          payment.payment_method,
          payment.reference
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
        title="Payments"
        description="Monitor receipts by contract, client, date, and payment method."
        action={{ label: "Record payment", onClick: () => navigate("/payments/new") }}
      />
      <Card className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search by contract, client, method, or reference"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {loading ? (
          <LoadingSpinner label="Loading payments..." />
        ) : error ? (
          <EmptyState title="Could not load payments" description={error} />
        ) : (
          <Table
            columns={[
              { key: "payment_date", header: "Date", render: (row) => formatDate(row.payment_date) },
              { key: "client", header: "Client", render: (row) => row.contracts?.clients?.company_name || "--" },
              { key: "billboard", header: "Billboard", render: (row) => row.contracts?.billboards?.name || "--" },
              { key: "face", header: "Face", render: (row) => row.contracts?.billboard_faces?.label || "--" },
              { key: "contract", header: "Contract #", render: (row) => row.contracts?.contract_number || "--" },
              { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
              { key: "payment_method", header: "Method" },
              { key: "reference", header: "Reference" }
            ]}
            rows={rows}
            onSort={() => {}}
          />
        )}
      </Card>
    </div>
  );
}
