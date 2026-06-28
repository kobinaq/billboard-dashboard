import { useMemo } from "react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { StatusBadge } from "components/ui/StatusBadge";
import { Table } from "components/ui/Table";
import { useAuth } from "context/AuthContext";
import { useContracts } from "hooks/useContracts";
import { getClientVisibleContracts } from "lib/contracts";
import { formatCurrency, formatDate } from "lib/utils";

export default function ClientPortalContracts() {
  const { profile } = useAuth();
  const { data } = useContracts();
  const rows = useMemo(
    () => getClientVisibleContracts(data || [], profile),
    [data, profile]
  );

  return rows.length ? (
    <Card>
      <Table
        columns={[
          { key: "contract_number", header: "Contract #" },
          { key: "billboard", header: "Billboard", render: (row) => row.billboards?.name || "--" },
          { key: "face", header: "Face", render: (row) => row.billboard_faces?.label || "--" },
          { key: "start_date", header: "Start", render: (row) => formatDate(row.start_date) },
          { key: "end_date", header: "End", render: (row) => formatDate(row.end_date) },
          { key: "total_value", header: "Total value", render: (row) => formatCurrency(row.total_value) },
          { key: "payment_status", header: "Payment", render: (row) => <StatusBadge value={row.payment_status} /> }
        ]}
        rows={rows}
        onSort={() => {}}
      />
    </Card>
  ) : (
    <EmptyState
      title="No contracts found"
      description="Contracts will appear here after an admin or sales user assigns a board to your company."
    />
  );
}
