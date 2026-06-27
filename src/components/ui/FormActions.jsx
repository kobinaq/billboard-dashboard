import { Button } from "./Button";

export function FormActions({ submitting, onCancel }) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      {onCancel ? (
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
