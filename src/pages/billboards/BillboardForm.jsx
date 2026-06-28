import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { useForm } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { FileUpload } from "components/ui/FileUpload";
import { FormActions } from "components/ui/FormActions";
import { Input } from "components/ui/Input";
import { Select } from "components/ui/Select";
import { Textarea } from "components/ui/Textarea";
import { PageHeader } from "components/shared/PageHeader";
import { useBillboards } from "hooks/useBillboards";
import { BILLBOARD_STATUSES, BILLBOARD_TYPES } from "lib/constants";
import { uploadPublicFile } from "lib/storage";
import { getErrorMessage } from "lib/utils";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.coerce.number().nonnegative().nullable()
);

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
  rate_1_2_months: optionalMoney,
  rate_3_months: optionalMoney,
  rate_6_months: optionalMoney,
  rate_12_plus_months: optionalMoney,
  design_price: optionalMoney,
  printing_price: optionalMoney,
  flighting_price: optionalMoney,
  faces: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, "Face label is required."),
      facing_direction: z.string().optional(),
      is_active: z.boolean().default(true)
    })
  ).min(1, "Add at least one bookable face."),
  notes: z.string().optional()
});

function defaultFaces(type = "traditional") {
  return type === "digital"
    ? [{ label: "Digital Screen", facing_direction: "", is_active: true }]
    : [
        { label: "Face A", facing_direction: "", is_active: true },
        { label: "Face B", facing_direction: "", is_active: true }
      ];
}

export default function BillboardForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const { data, saveBillboard, updateCoverImage, saveBillboardFaces } = useBillboards();
  const current = useMemo(() => (data || []).find((item) => item.id === id), [data, id]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
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
      rate_1_2_months: current?.rate_1_2_months ?? "",
      rate_3_months: current?.rate_3_months ?? "",
      rate_6_months: current?.rate_6_months ?? "",
      rate_12_plus_months: current?.rate_12_plus_months ?? "",
      design_price: current?.design_price ?? "",
      printing_price: current?.printing_price ?? "",
      flighting_price: current?.flighting_price ?? "",
      faces: current?.billboard_faces?.length
        ? current.billboard_faces
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((face) => ({
              id: face.id,
              label: face.label,
              facing_direction: face.facing_direction || "",
              is_active: face.is_active !== false
            }))
        : defaultFaces(current?.type || "traditional"),
      notes: current?.notes || ""
    }
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const boardType = watch("type");
  const { fields, append, remove, replace } = useFieldArray({ control, name: "faces" });

  useEffect(() => {
    if (current?.cover_image_url) {
      setCoverPreview(current.cover_image_url);
    }
  }, [current]);

  useEffect(() => {
    if (id || fields.length) {
      return;
    }

    replace(defaultFaces(boardType || "traditional"));
  }, [boardType, fields.length, id, replace]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !process.env.REACT_APP_MAPBOX_TOKEN) {
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [Number(longitude), Number(latitude)],
      zoom: 11
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    markerRef.current = new mapboxgl.Marker({ color: "#1b4332" })
      .setLngLat([Number(longitude), Number(latitude)])
      .addTo(mapRef.current);

    mapRef.current.on("click", (event) => {
      const nextLatitude = Number(event.lngLat.lat.toFixed(6));
      const nextLongitude = Number(event.lngLat.lng.toFixed(6));
      setValue("latitude", nextLatitude, { shouldDirty: true });
      setValue("longitude", nextLongitude, { shouldDirty: true });
      markerRef.current?.setLngLat([nextLongitude, nextLatitude]);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, setValue]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    const nextLngLat = [Number(longitude), Number(latitude)];
    markerRef.current.setLngLat(nextLngLat);
    mapRef.current.flyTo({ center: nextLngLat, essential: false, zoom: mapRef.current.getZoom() });
  }, [latitude, longitude]);

  function handleCoverChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const { faces, ...billboardValues } = values;
      const billboard = await saveBillboard(billboardValues, id);
      await saveBillboardFaces(billboard.id, faces);

      if (coverFile) {
        const { publicUrl } = await uploadPublicFile(
          "billboard-media",
          `billboards/${billboard.id}/cover`,
          coverFile
        );
        await updateCoverImage(billboard.id, publicUrl);
      }

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
      <PageHeader title={id ? "Edit Billboard" : "Add Billboard"} />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card className="grid gap-4 md:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Code" error={errors.code?.message} {...register("code")} />
          <Select label="Type" options={BILLBOARD_TYPES} error={errors.type?.message} {...register("type")} />
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

        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">Bookable faces</h4>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ label: "", facing_direction: "", is_active: true })}
            >
              Add face
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  label="Face label"
                  error={errors.faces?.[index]?.label?.message}
                  {...register(`faces.${index}.label`)}
                />
                <Input
                  label="Face direction"
                  error={errors.faces?.[index]?.facing_direction?.message}
                  {...register(`faces.${index}.facing_direction`)}
                />
                <div className="flex items-end gap-3">
                  <label className="flex h-[46px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      {...register(`faces.${index}.is_active`)}
                    />
                    Active
                  </label>
                  {fields.length > 1 ? (
                    <Button type="button" variant="danger" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {errors.faces?.message ? <p className="text-sm text-rose-600">{errors.faces.message}</p> : null}
        </Card>

        <Card className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold">Public pricing</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Input label="1-2 months monthly" type="number" min="0" error={errors.rate_1_2_months?.message} {...register("rate_1_2_months")} />
            <Input label="3 months monthly" type="number" min="0" error={errors.rate_3_months?.message} {...register("rate_3_months")} />
            <Input label="6 months monthly" type="number" min="0" error={errors.rate_6_months?.message} {...register("rate_6_months")} />
            <Input label="12+ months monthly" type="number" min="0" error={errors.rate_12_plus_months?.message} {...register("rate_12_plus_months")} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Design price" type="number" min="0" error={errors.design_price?.message} {...register("design_price")} />
            <Input label="Printing price" type="number" min="0" error={errors.printing_price?.message} {...register("printing_price")} />
            <Input label="Flighting price" type="number" min="0" error={errors.flighting_price?.message} {...register("flighting_price")} />
          </div>
        </Card>

        <Card className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Media</h4>
            <FileUpload
              label="Cover image"
              accept="image/*"
              helperText="Uploads directly to the billboard-media bucket."
              onChange={handleCoverChange}
            />
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Billboard cover preview"
                className="h-56 w-full rounded-[1.75rem] object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Coordinate picker</h4>
            {process.env.REACT_APP_MAPBOX_TOKEN ? (
              <div ref={mapContainerRef} className="min-h-72 rounded-[1.75rem]" />
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Add REACT_APP_MAPBOX_TOKEN to enable click-to-place board coordinates.
              </div>
            )}
          </div>
        </Card>

        <FormActions submitting={submitting} onCancel={() => navigate("/billboards")} />
      </form>
    </div>
  );
}
