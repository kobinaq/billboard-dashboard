import { UploadCloud } from "lucide-react";
export function FileUpload({
  label,
  multiple = false,
  accept,
  capture,
  onChange,
  helperText
}) {
  return (
    <label className="flex flex-col gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Drag files here or browse</p>
            <p className="text-xs text-slate-500">
              {helperText || "Uploads are sent directly to Supabase Storage."}
            </p>
          </div>
        </div>
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">
          Choose file
        </div>
      </div>
      <input
        className="hidden"
        type="file"
        multiple={multiple}
        accept={accept}
        capture={capture}
        onChange={onChange}
      />
    </label>
  );
}
