import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card } from "components/ui/Card";
import { FormActions } from "components/ui/FormActions";
import { Input } from "components/ui/Input";
import { Select } from "components/ui/Select";
import { Textarea } from "components/ui/Textarea";
import { PageHeader } from "components/shared/PageHeader";
import { useAuth } from "context/AuthContext";
import { useContracts } from "hooks/useContracts";
import { PAYMENT_METHODS } from "lib/constants";
import { getErrorMessage } from "lib/utils";

const schema = z.object({
  contract_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  payment_date: z.string().min(1),
  payment_method: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export default function PaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { data: contracts, savePayment } = useContracts();
  const [submitting, setSubmitting] = useState(false);
  const selectedContract = useMemo(
    () => (contracts || []).find((item) => item.id === searchParams.get("contract")),
    [contracts, searchParams]
  );
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      contract_id: selectedContract?.id || "",
      amount: selectedContract?.monthly_rate || "",
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "bank_transfer",
      reference: "",
      notes: ""
    }
  });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await savePayment({ ...values, recorded_by: profile?.id });
      toast.success("Payment recorded.");
      navigate("/payments");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payment"
        description="Saving a payment triggers contract amount rollups and payment status recalculation."
      />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card className="grid gap-4 md:grid-cols-2">
          <Select
            label="Contract"
            options={(contracts || []).map((contract) => ({
              value: contract.id,
              label: `${contract.contract_number} • ${contract.clients?.company_name || "Unknown client"}`
            }))}
            error={errors.contract_id?.message}
            {...register("contract_id")}
          />
          <Input label="Amount" type="number" error={errors.amount?.message} {...register("amount")} />
          <Input label="Payment date" type="date" error={errors.payment_date?.message} {...register("payment_date")} />
          <Select
            label="Payment method"
            options={PAYMENT_METHODS}
            error={errors.payment_method?.message}
            {...register("payment_method")}
          />
          <Input label="Reference number" {...register("reference")} />
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register("notes")} />
          </div>
        </Card>
        <FormActions submitting={submitting} onCancel={() => navigate("/payments")} />
      </form>
    </div>
  );
}
