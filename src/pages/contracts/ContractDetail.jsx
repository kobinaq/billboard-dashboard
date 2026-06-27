import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { FileUpload } from "components/ui/FileUpload";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { Modal } from "components/ui/Modal";
import { StatusBadge } from "components/ui/StatusBadge";
import { Table } from "components/ui/Table";
import { useAuth } from "context/AuthContext";
import { useContracts } from "hooks/useContracts";
import { formatCurrency, formatDate } from "lib/utils";

export default function ContractDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const { data, loading, error, savePayment, refresh } = useContracts();
  const [recordOpen, setRecordOpen] = useState(false);
  const contract = useMemo(() => (data || []).find((item) => item.id === id), [data, id]);

  async function handleQuickPayment() {
    if (!contract) {
      return;
    }

    try {
      await savePayment({
        contract_id: contract.id,
        amount: contract.monthly_rate,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "bank_transfer",
        recorded_by: profile?.id
      });
      toast.success("Payment recorded.");
      setRecordOpen(false);
      refresh();
    } catch (paymentError) {
      toast.error(paymentError.message);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading contract..." />;
  }

  if (error || !contract) {
    return <EmptyState title="Contract not found" description={error || "Missing contract."} />;
  }

  const balance = Number(contract.total_value || 0) - Number(contract.amount_paid || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold">{contract.contract_number}</h3>
            <StatusBadge value={contract.status} />
            <StatusBadge value={contract.payment_status} />
          </div>
          <p className="text-sm text-slate-500">
            {contract.clients?.company_name} • {contract.billboards?.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate(`/contracts/${id}/edit`)}>
            Edit contract
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Download PDF summary
          </Button>
          <Button onClick={() => setRecordOpen(true)}>Record payment</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <SummaryRow label="Client" value={contract.clients?.company_name} />
          <SummaryRow label="Billboard" value={contract.billboards?.name} />
          <SummaryRow label="Period" value={`${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`} />
          <SummaryRow label="Monthly rate" value={formatCurrency(contract.monthly_rate)} />
          <SummaryRow label="Total value" value={formatCurrency(contract.total_value)} />
          <SummaryRow label="Amount paid" value={formatCurrency(contract.amount_paid)} />
          <SummaryRow label="Balance outstanding" value={formatCurrency(balance)} />
          <SummaryRow label="Notes" value={contract.notes} />
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">Artwork upload</h4>
                <p className="text-sm text-slate-500">
                  Store artwork in the private contract-artwork bucket.
                </p>
              </div>
            </div>
            <FileUpload label="Client artwork" accept="image/*,.pdf" />
          </Card>

          <Card>
            <h4 className="mb-4 text-lg font-semibold">Payments</h4>
            <Table
              columns={[
                { key: "payment_date", header: "Date", render: (row) => formatDate(row.payment_date) },
                { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) }
              ]}
              rows={contract.payments || []}
              onSort={() => {}}
            />
          </Card>
        </div>
      </div>

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Quick payment">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            This shortcut records one monthly-rate payment against the contract. Use the dedicated payment form for a custom amount or method.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickPayment}>Record {formatCurrency(contract.monthly_rate)}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-900">{value || "--"}</p>
    </div>
  );
}
