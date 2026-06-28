import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useAuth } from "context/AuthContext";
import { useBillboards } from "hooks/useBillboards";
import { useInspections } from "hooks/useInspections";
import { CONDITIONS } from "lib/constants";
import { uploadPublicFile } from "lib/storage";
import { getErrorMessage } from "lib/utils";

const schema = z.object({
  billboard_id: z.string().uuid(),
  inspected_at: z.string().min(1),
  overall_condition: z.string().min(1),
  structure_ok: z.boolean().default(true),
  lighting_ok: z.boolean().default(true),
  artwork_ok: z.boolean().default(true),
  visibility_ok: z.boolean().default(true),
  notes: z.string().optional(),
  action_required: z.boolean().default(false),
  action_description: z.string().optional()
});

export default function InspectionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { data: billboards } = useBillboards();
  const { saveInspection, saveInspectionPhoto } = useInspections();
  const [submitting, setSubmitting] = useState(false);
  const [photoEntries, setPhotoEntries] = useState([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      billboard_id: searchParams.get("billboard") || "",
      inspected_at: new Date().toISOString().slice(0, 16),
      overall_condition: "good",
      structure_ok: true,
      lighting_ok: true,
      artwork_ok: true,
      visibility_ok: true,
      notes: "",
      action_required: false,
      action_description: ""
    }
  });

  function handlePhotosChange(event) {
    const files = Array.from(event.target.files || []);
    setPhotoEntries(
      files.map((file) => ({
        file,
        caption: ""
      }))
    );
  }

  function updateCaption(index, caption) {
    setPhotoEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, caption } : entry
      )
    );
  }

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const inspection = await saveInspection({ ...values, inspector_id: profile?.id });

      if (photoEntries.length) {
        await Promise.all(
          photoEntries.map(async (entry) => {
            const { publicUrl } = await uploadPublicFile(
              "billboard-media",
              `inspections/${inspection.id}`,
              entry.file
            );

            await saveInspectionPhoto({
              inspection_id: inspection.id,
              photo_url: publicUrl,
              caption: entry.caption || null
            });
          })
        );
      }

      toast.success("Inspection logged.");
      navigate("/inspections");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Log Inspection" />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card className="grid gap-4 md:grid-cols-2">
          <Select
            label="Billboard"
            options={(billboards || []).map((board) => ({
              value: board.id,
              label: `${board.code} - ${board.name}`
            }))}
            error={errors.billboard_id?.message}
            {...register("billboard_id")}
          />
          <Input
            label="Inspection date & time"
            type="datetime-local"
            error={errors.inspected_at?.message}
            {...register("inspected_at")}
          />
          <Select
            label="Overall condition"
            options={CONDITIONS}
            error={errors.overall_condition?.message}
            {...register("overall_condition")}
          />
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Checklist</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["structure_ok", "Structure OK"],
                ["lighting_ok", "Lighting OK"],
                ["artwork_ok", "Artwork OK"],
                ["visibility_ok", "Visibility OK"]
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={watch(field)}
                    onChange={(event) => setValue(field, event.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={watch("action_required")}
              onChange={(event) => setValue("action_required", event.target.checked)}
            />
            Action required
          </label>
          {watch("action_required") ? (
            <div className="md:col-span-2">
              <Textarea
                label="Action description"
                error={errors.action_description?.message}
                {...register("action_description")}
              />
            </div>
          ) : null}
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register("notes")} />
          </div>
        </Card>

        <Card className="space-y-4">
          <FileUpload
            label="Inspection photos"
            multiple
            accept="image/*"
            capture="environment"
            helperText="Use the rear camera on mobile devices or upload multiple existing images."
            onChange={handlePhotosChange}
          />
          {photoEntries.length ? (
            <div className="space-y-3">
              {photoEntries.map((entry, index) => (
                <div
                  key={`${entry.file.name}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{entry.file.name}</p>
                  <Input
                    label="Caption"
                    value={entry.caption}
                    onChange={(event) => updateCaption(index, event.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <FormActions submitting={submitting} onCancel={() => navigate("/inspections")} />
      </form>
    </div>
  );
}
