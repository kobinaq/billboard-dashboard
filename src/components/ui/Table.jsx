import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "lib/utils";

export function Table({ columns, rows, sort, onSort, emptyMessage = "No results found." }) {
  if (!rows.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const direction = active ? sort.direction : null;
                const Icon = !column.sortable
                  ? null
                  : !active
                    ? ArrowUpDown
                    : direction === "asc"
                      ? ArrowUp
                      : ArrowDown;

                return (
                  <th key={column.key} className="px-4 py-3 text-left font-semibold text-slate-600">
                    {column.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => onSort(column.key)}
                      >
                        {column.header}
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-4 align-top text-slate-700", column.className)}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
