import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { useInspections } from "hooks/useInspections";
import { resolveStoredFileUrl } from "lib/storage";
import { formatDate } from "lib/utils";

export default function InspectionDetail() {
  const { id } = useParams();
  const { data, loading, error } = useInspections();
  const inspection = useMemo(() => (data || []).find((item) => item.id === id), [data, id]);

  if (loading) {
    return <LoadingSpinner label="Loading inspection..." />;
  }

  if (error || !inspection) {
    return <EmptyState title="Inspection not found" description={error || "Missing inspection log."} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold">{inspection.billboards?.name || "Inspection detail"}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {inspection.profiles?.full_name || "--"} • {formatDate(inspection.inspected_at)}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <Detail label="Condition" value={<StatusBadge value={inspection.overall_condition} />} />
          <Detail label="Action required" value={inspection.action_required ? "Yes" : "No"} />
          <Detail label="Resolved" value={inspection.action_resolved ? "Yes" : "No"} />
          <Detail label="Action description" value={inspection.action_description} />
          <Detail label="Notes" value={inspection.notes} />
        </Card>
        <Card className="space-y-4">
          <h4 className="text-lg font-semibold">Photo gallery</h4>
          {inspection.inspection_photos?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {inspection.inspection_photos.map((photo) => (
                <InspectionPhoto key={photo.id} photo={photo} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No photos attached to this inspection yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function InspectionPhoto({ photo }) {
  const [src, setSrc] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const url = await resolveStoredFileUrl("inspection-photos", photo.photo_url);
        if (active) {
          setSrc(url);
        }
      } catch {
        if (active) {
          setSrc("");
        }
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [photo.photo_url]);

  if (!loaded) {
    return (
      <figure className="space-y-2">
        <div className="h-48 rounded-[1.5rem] bg-slate-100" />
        <figcaption className="text-sm text-slate-500">{photo.caption || "No caption"}</figcaption>
      </figure>
    );
  }

  if (!src) {
    return (
      <figure className="space-y-2">
        <div className="flex h-48 items-center justify-center rounded-[1.5rem] bg-slate-100 text-sm text-slate-500">
          Photo unavailable
        </div>
        <figcaption className="text-sm text-slate-500">{photo.caption || "No caption"}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="space-y-2">
      <img
        src={src}
        alt={photo.caption || "Inspection"}
        className="h-48 w-full rounded-[1.5rem] object-cover"
      />
      <figcaption className="text-sm text-slate-500">{photo.caption || "No caption"}</figcaption>
    </figure>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 text-sm text-slate-900">{value || "--"}</div>
    </div>
  );
}
