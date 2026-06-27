import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { useBillboards } from "hooks/useBillboards";
import { useClients } from "hooks/useClients";
import { useContracts } from "hooks/useContracts";
import { CONTRACT_STATUSES, PAYMENT_STATUSES } from "lib/constants";
import { getErrorMessage } from "lib/utils";

const schema = z
  .object({
    client_id: z.string().uuid(),
    billboard_id: z.string().uuid(),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    monthly_rate: z.coerce.number().positive(),
    currency: z.string().default("GHS"),
    status: z.string().min(1),
    payment_status: z.string().min(1),
    notes: z.string().optional()
  })
  .refine((values) => new Date(values.end_date) >= new Date(values.start_date), {
    message: "End date must be on or after the start date.",
    path: ["end_date"]
  });

export default function ContractForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const { data: contracts, saveContract } = useContracts();
  const { data: clients } = useClients();
  const { data: billboards } = useBillboards();
  const current = useMemo(() => (contracts || []).find((item) => item.id === id), [contracts, id]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      client_id: current?.client_id || searchParams.get("client") || "",
      billboard_id: current?.billboard_id || "",
      start_date: current?.start_date || "",
      end_date: current?.end_date || "",
      monthly_rate: current?.monthly_rate || "",
      currency: current?.currency || "GHS",
      status: current?.status || "draft",
      payment_status: current?.payment_status || "unpaid",
      notes: current?.notes || ""
    }
  });

  const selectedStart = watch("start_date");
  const selectedEnd = watch("end_date");

  const availableBillboards = useMemo(() => {
    return (billboards || []).filter((billboard) => {
      const overlapping = (contracts || []).some((contract) => {
        if (contract.id === id || contract.billboard_id !== billboard.id) {
          return false;
        }
        if (!["draft", "active"].includes(contract.status)) {
          return false;
        }

        return !(
          new Date(contract.end_date) < new Date(selectedStart || "1900-01-01") ||
          new Date(contract.start_date) > new Date(selectedEnd || "2999-01-01")
        );
      });

      return !overlapping;
    });
  }, [billboards, contracts, id, selectedEnd, selectedStart]);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await saveContract(values, id);
      toast.success(id ? "Contract updated." : "Contract created.");
      navigate("/contracts");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? "Edit Contract" : "Create Contract"}
        description="Prevent double booking, keep payment state aligned, and capture supporting notes."
      />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card className="grid gap-4 md:grid-cols-2">
          <Select
            label="Client"
            options={(clients || []).map((client) => ({
              value: client.id,
              label: client.company_name
            }))}
            error={errors.client_id?.message}
            {...register("client_id")}
          />
          <Select
            label="Billboard"
            options={availableBillboards.map((billboard) => ({
              value: billboard.id,
              label: `${billboard.code} • ${billboard.name}`
            }))}
            error={errors.billboard_id?.message}
            {...register("billboard_id")}
          />
          <Input label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
          <Input label="End date" type="date" error={errors.end_date?.message} {...register("end_date")} />
          <Input label="Monthly rate" type="number" error={errors.monthly_rate?.message} {...register("monthly_rate")} />
          <Input label="Currency" error={errors.currency?.message} {...register("currency")} />
          <Select label="Status" options={CONTRACT_STATUSES} error={errors.status?.message} {...register("status")} />
          <Select
            label="Payment status"
            options={PAYMENT_STATUSES}
            error={errors.payment_status?.message}
            {...register("payment_status")}
          />
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register("notes")} />
          </div>
        </Card>
        <Card>
          <h4 className="text-lg font-semibold">Availability guidance</h4>
          <p className="mt-3 text-sm text-slate-500">
            Billboard options update based on the selected date range to avoid overlapping active or draft contracts. The database trigger in `supabase/schema.sql` still performs the final server-side booking check.
          </p>
        </Card>
        <FormActions submitting={submitting} onCancel={() => navigate("/contracts")} />
      </form>
    </div>
  );
}
