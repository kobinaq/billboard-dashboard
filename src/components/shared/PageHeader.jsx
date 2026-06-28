import { Button } from "components/ui/Button";

export function PageHeader({ title, description, action, secondaryAction }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {secondaryAction ? (
          <Button variant="secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        ) : null}
        {action ? <Button onClick={action.onClick}>{action.label}</Button> : null}
      </div>
    </div>
  );
}
