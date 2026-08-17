import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card } from "components/ui/Card";
import { FormActions } from "components/ui/FormActions";
import { Input } from "components/ui/Input";
import { Select } from "components/ui/Select";
import { StatusBadge } from "components/ui/StatusBadge";
import { Textarea } from "components/ui/Textarea";
import { PageHeader } from "components/shared/PageHeader";
import { useBillboards } from "hooks/useBillboards";
import { useClients } from "hooks/useClients";
import { useContracts } from "hooks/useContracts";
import { CONTRACT_FORM_STATUSES } from "lib/constants";
import { formatCurrency, getErrorMessage } from "lib/utils";

const schema = z
  .object({
    client_id: z.string().uuid(),
    billboard_id: z.string().uuid(),
    billboard_face_id: z.string().uuid(),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    monthly_rate: z.coerce.number().positive(),
    currency: z.string().default("GHS"),
    status: z.enum(["draft", "active", "cancelled", "expired"]),
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
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      client_id: current?.client_id || searchParams.get("client") || "",
      billboard_id: current?.billboard_id || "",
      billboard_face_id: current?.billboard_face_id || "",
      start_date: current?.start_date || "",
      end_date: current?.end_date || "",
      monthly_rate: current?.monthly_rate || "",
      currency: current?.currency || "GHS",
      status: current?.status || "draft",
      notes: current?.notes || ""
    }
  });

  const selectedStart = watch("start_date");
  const selectedEnd = watch("end_date");
  const selectedFaceId = watch("billboard_face_id");
  const selectedBillboardId = watch("billboard_id");
  const selectedBillboard = useMemo(
    () => (billboards || []).find((billboard) => billboard.id === selectedBillboardId),
    [billboards, selectedBillboardId]
  );

  const availableFaces = useMemo(() => {
    return (selectedBillboard?.billboard_faces || []).filter((face) => {
      if (face.is_active === false && face.id !== current?.billboard_face_id) {
        return false;
      }

      const overlapping = (contracts || []).some((contract) => {
        if (contract.id === id || contract.billboard_face_id !== face.id) {
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
  }, [contracts, current?.billboard_face_id, id, selectedBillboard?.billboard_faces, selectedEnd, selectedStart]);

  useEffect(() => {
    if (!selectedFaceId) {
      return;
    }

    if (!availableFaces.some((face) => face.id === selectedFaceId)) {
      setValue("billboard_face_id", "");
    }
  }, [availableFaces, selectedFaceId, setValue]);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const payload = { ...values };
      if (payload.status === "expired") {
        delete payload.status;
      }
      await saveContract(payload, id);
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
            options={(billboards || []).map((billboard) => ({
              value: billboard.id,
              label: `${billboard.code} • ${billboard.name}`
            }))}
            error={errors.billboard_id?.message}
            {...register("billboard_id")}
          />
          <Select
            label="Face"
            options={availableFaces.map((face) => ({
              value: face.id,
              label: `${face.label}${face.facing_direction ? ` - ${face.facing_direction}` : ""}`
            }))}
            error={errors.billboard_face_id?.message}
            {...register("billboard_face_id")}
          />
          <Input label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
          <Input label="End date" type="date" error={errors.end_date?.message} {...register("end_date")} />
          <Input label="Monthly rate" type="number" error={errors.monthly_rate?.message} {...register("monthly_rate")} />
          <Input label="Currency" error={errors.currency?.message} {...register("currency")} />
          <Select
            label="Status"
            options={
              current?.status === "expired"
                ? ["expired", ...CONTRACT_FORM_STATUSES]
                : CONTRACT_FORM_STATUSES
            }
            error={errors.status?.message}
            {...register("status")}
          />
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment status</p>
            <div className="mt-2">
              <StatusBadge value={current?.payment_status || "unpaid"} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Updates from recorded payments, not from this form.
            </p>
          </div>
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register("notes")} />
          </div>
        </Card>
        {selectedBillboard ? (
          <Card>
            <h4 className="text-lg font-semibold">Board rate guidance</h4>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
              <Rate label="1-2 months" value={selectedBillboard.rate_1_2_months} />
              <Rate label="3 months" value={selectedBillboard.rate_3_months} />
              <Rate label="6 months" value={selectedBillboard.rate_6_months} />
              <Rate label="12+ months" value={selectedBillboard.rate_12_plus_months} />
            </div>
          </Card>
        ) : null}
        <Card>
          <h4 className="text-lg font-semibold">Availability guidance</h4>
          <p className="mt-3 text-sm text-slate-500">
            Face options update based on the selected date range to avoid overlapping active or draft contracts on the same face. Postgres still rejects overlapping bookings with the `contracts_no_overlapping_bookings` exclusion constraint.
          </p>
        </Card>
        <FormActions submitting={submitting} onCancel={() => navigate("/contracts")} />
      </form>
    </div>
  );
}

function Rate({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-900">
        {value === null || value === undefined ? "--" : formatCurrency(value)}
      </p>
    </div>
  );
}
