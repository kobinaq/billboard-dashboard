import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card } from "components/ui/Card";
import { FileUpload } from "components/ui/FileUpload";
import { FormActions } from "components/ui/FormActions";
import { Input } from "components/ui/Input";
import { Select } from "components/ui/Select";
import { Textarea } from "components/ui/Textarea";
import { PageHeader } from "components/shared/PageHeader";
import { useBillboards } from "hooks/useBillboards";
import {
  BILLBOARD_STATUSES,
  BILLBOARD_TYPES
} from "lib/constants";
import { getErrorMessage } from "lib/utils";

const schema = z.object({
  name: z.string().min(3),
  code: z.string().min(3),
  type: z.string().min(1),
  status: z.string().min(1),
  width_ft: z.coerce.number().optional().nullable(),
  height_ft: z.coerce.number().optional().nullable(),
  address: z.string().min(4),
  region: z.string().min(2),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  facing_direction: z.string().optional(),
  traffic_count: z.string().optional(),
  illuminated: z.boolean().default(false),
  notes: z.string().optional()
});

export default function BillboardForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const { data, saveBillboard } = useBillboards();
  const current = useMemo(() => (data || []).find((item) => item.id === id), [data, id]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      name: current?.name || "",
      code: current?.code || "",
      type: current?.type || "",
      status: current?.status || "available",
      width_ft: current?.width_ft || "",
      height_ft: current?.height_ft || "",
      address: current?.address || "",
      region: current?.region || "",
      latitude: current?.latitude || 5.6037,
      longitude: current?.longitude || -0.187,
      facing_direction: current?.facing_direction || "",
      traffic_count: current?.traffic_count || "",
      illuminated: Boolean(current?.illuminated),
      notes: current?.notes || ""
    }
  });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await saveBillboard(values, id);
      toast.success(id ? "Billboard updated." : "Billboard created.");
      navigate("/billboards");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? "Edit Billboard" : "Add Billboard"}
        description="Capture the physical details, positioning, and visibility metadata for a board."
      />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card className="grid gap-4 md:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Code" error={errors.code?.message} {...register("code")} />
          <Select
            label="Type"
            options={BILLBOARD_TYPES}
            error={errors.type?.message}
            {...register("type")}
          />
          <Select
            label="Status"
            options={BILLBOARD_STATUSES}
            error={errors.status?.message}
            {...register("status")}
          />
          <Input label="Width (ft)" type="number" error={errors.width_ft?.message} {...register("width_ft")} />
          <Input label="Height (ft)" type="number" error={errors.height_ft?.message} {...register("height_ft")} />
          <Input label="Region" error={errors.region?.message} {...register("region")} />
          <Input label="Facing direction" {...register("facing_direction")} />
          <div className="md:col-span-2">
            <Input label="Address" error={errors.address?.message} {...register("address")} />
          </div>
          <Input label="Latitude" type="number" step="0.000001" error={errors.latitude?.message} {...register("latitude")} />
          <Input label="Longitude" type="number" step="0.000001" error={errors.longitude?.message} {...register("longitude")} />
          <Input label="Traffic count" {...register("traffic_count")} />
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={watch("illuminated")}
              onChange={(event) => setValue("illuminated", event.target.checked)}
            />
            Illuminated board
          </label>
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register("notes")} />
          </div>
        </Card>

        <Card className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Media</h4>
            <FileUpload label="Cover image" accept="image/*" helperText="Store the board cover in the billboard-media bucket." />
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Coordinate picker</h4>
            <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Map click-to-place support should be enabled once Mapbox credentials are configured. The numeric latitude and longitude fields are already active for immediate use.
            </div>
          </div>
        </Card>

        <FormActions submitting={submitting} onCancel={() => navigate("/billboards")} />
      </form>
    </div>
  );
}
