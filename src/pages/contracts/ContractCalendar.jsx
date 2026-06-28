import { useMemo } from "react";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { useContracts } from "hooks/useContracts";
import { buildContractTimeline } from "lib/contracts";
import { diffInDays, formatDate } from "lib/utils";

const DAY_WIDTH = 14;
const MIN_BAR_WIDTH = 42;

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric"
  }).format(date);
}

export default function ContractCalendar() {
  const { data, loading, error } = useContracts();

  const timeline = useMemo(() => {
    const baseTimeline = buildContractTimeline(data || []);
    if (!baseTimeline) {
      return null;
    }

    return {
      ...baseTimeline,
      totalWidth: baseTimeline.totalDays * DAY_WIDTH,
      months: baseTimeline.months.map((month) => ({
        ...month,
        label: monthLabel(month.date),
        width: month.days * DAY_WIDTH
      }))
    };
  }, [data]);

  const monthMarkers = useMemo(() => {
    if (!timeline) {
      return [];
    }

    let offset = 0;

    return timeline.months.map((month, index) => {
      const markerOffset = offset;
      offset += month.width;

      if (index === 0) {
        return null;
      }

      return (
        <div
          key={`marker-${month.key}`}
          className="pointer-events-none absolute bottom-0 top-0 border-r border-dashed border-slate-200"
          style={{ left: markerOffset }}
        />
      );
    });
  }, [timeline]);

  if (loading) {
    return <LoadingSpinner label="Loading contract timeline..." />;
  }

  if (error) {
    return <EmptyState title="Could not load timeline" description={error} />;
  }

  if (!timeline) {
    return (
      <EmptyState
        title="No contracts yet"
        description="Add contracts to see occupied periods by billboard."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div className="sticky top-0 z-10 grid grid-cols-[240px_1fr] border-b border-slate-200 bg-white">
              <div className="border-r border-slate-200 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Billboards</p>
              </div>
              <div className="flex bg-slate-50">
                {timeline.months.map((month) => (
                  <div
                    key={month.key}
                    className="border-r border-slate-200 px-3 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    style={{ width: month.width }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>

            {Object.entries(timeline.grouped).map(([boardName, contracts]) => (
              <div
                key={boardName}
                className="grid grid-cols-[240px_1fr] border-b border-slate-200 last:border-b-0"
              >
                <div className="border-r border-slate-200 px-5 py-5">
                  <p className="text-sm font-semibold text-slate-900">{boardName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {contracts.length} contract{contracts.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="relative px-4 py-5">
                  <div
                    className="relative rounded-3xl bg-slate-50"
                    style={{ width: timeline.totalWidth, minHeight: contracts.length * 78 }}
                  >
                    {monthMarkers}

                    {contracts.map((contract, index) => {
                      const offsetDays = diffInDays(timeline.start, contract.start_date);
                      const spanDays = diffInDays(contract.start_date, contract.end_date) + 1;
                      const left = offsetDays * DAY_WIDTH;
                      const width = Math.max(spanDays * DAY_WIDTH, MIN_BAR_WIDTH);

                      return (
                        <div
                          key={contract.id}
                          className="absolute"
                          style={{
                            left,
                            top: 16 + index * 62,
                            width
                          }}
                        >
                          <div className="rounded-2xl bg-brand-700 px-4 py-3 text-white shadow-lg shadow-brand-900/15">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {contract.clients?.company_name || "Unknown client"}
                                </p>
                                <p className="truncate text-xs text-brand-100">
                                  {contract.contract_number}
                                </p>
                              </div>
                              <StatusBadge value={contract.status} />
                            </div>
                            <p className="mt-2 text-xs text-brand-100">
                              {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
