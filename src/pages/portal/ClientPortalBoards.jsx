import { useMemo } from "react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { useAuth } from "context/AuthContext";
import { useContracts } from "hooks/useContracts";
import { formatDate } from "lib/utils";

export default function ClientPortalBoards() {
  const { profile } = useAuth();
  const { data } = useContracts();
  const myContracts = useMemo(
    () =>
      (data || []).filter(
        (contract) =>
          contract.clients?.contact_email?.toLowerCase() === profile?.email?.toLowerCase() ||
          contract.clients?.company_name === profile?.company_name
      ),
    [data, profile]
  );

  return myContracts.length ? (
    <div className="grid gap-4 lg:grid-cols-2">
      {myContracts.map((contract) => (
        <Card key={contract.id} className="space-y-3">
          <h3 className="text-xl font-semibold">{contract.billboards?.name || "--"}</h3>
          <p className="text-sm text-slate-500">{contract.billboards?.address || "--"}</p>
          <p className="text-sm text-slate-500">
            {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
          </p>
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState
      title="No boards linked yet"
      description="Boards will appear here once an active contract is tied to your client account."
    />
  );
}
