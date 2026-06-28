import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card } from "components/ui/Card";
import { Button } from "components/ui/Button";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { StatusBadge } from "components/ui/StatusBadge";
import { PageHeader } from "components/shared/PageHeader";
import { useContracts } from "hooks/useContracts";
import { buildContractTimeline } from "lib/contracts";
import { addMonths, diffInDays, formatDate, startOfMonth } from "lib/utils";

const VIEW_OPTIONS = {
  month: { label: "Month", months: 1, dayWidth: 24 },
  sixMonths: { label: "6 months", months: 6, dayWidth: 8 },
  annual: { label: "Annual", months: 12, dayWidth: 4 }
};

const MIN_BAR_WIDTH = 42;

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function periodLabel(date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric"
  }).format(date);
}

export default function ContractCalendar() {
  const navigate = useNavigate();
  const { data, loading, error } = useContracts();
  const [view, setView] = useState("sixMonths");
  const [windowStart, setWindowStart] = useState(() => startOfMonth(new Date()));
  const [hasAutoPositioned, setHasAutoPositioned] = useState(false);
  const selectedView = VIEW_OPTIONS[view];

  useEffect(() => {
    if (hasAutoPositioned || !data?.length) {
      return;
    }

    const earliestStart = new Date(
      Math.min(...data.map((contract) => new Date(contract.start_date).getTime()))
    );
    setWindowStart(startOfMonth(earliestStart));
    setHasAutoPositioned(true);
  }, [data, hasAutoPositioned]);

  const timeline = useMemo(() => {
    const baseTimeline = buildContractTimeline(data || [], {
      windowStart,
      windowMonths: selectedView.months
    });
    if (!baseTimeline) {
      return null;
    }

    return {
      ...baseTimeline,
      totalWidth: baseTimeline.totalDays * selectedView.dayWidth,
      months: baseTimeline.months.map((month) => ({
        ...month,
        label: monthLabel(month.date),
        width: month.days * selectedView.dayWidth
      }))
    };
  }, [data, selectedView, windowStart]);

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

  const moveWindow = (direction) => {
    setHasAutoPositioned(true);
    setWindowStart((current) => addMonths(current, direction * selectedView.months));
  };

  const resetToToday = () => {
    setHasAutoPositioned(true);
    setWindowStart(startOfMonth(new Date()));
  };

  const visibleRangeLabel = timeline ? `${periodLabel(timeline.start)} - ${periodLabel(timeline.end)}` : "";

  return (
    <div className="space-y-6">
      <PageHeader title="Contract Timeline" />

      <Card className="overflow-hidden p-0">
        <div className="space-y-4 border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full gap-2 rounded-lg bg-slate-100 p-1 md:w-fit">
              <Button className="flex-1 md:flex-none" variant="secondary" onClick={() => navigate("/contracts")}>
                List
              </Button>
              <Button className="flex-1 md:flex-none" onClick={() => navigate("/contracts/calendar")}>
                Timeline
              </Button>
            </div>

            <Button onClick={() => navigate("/contracts/new")}>
              <Plus className="h-4 w-4" />
              Add contract
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
              {Object.entries(VIEW_OPTIONS).map(([key, option]) => (
                <Button
                  key={key}
                  variant={view === key ? "primary" : "secondary"}
                  onClick={() => setView(key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => moveWindow(-1)} aria-label="Previous period">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-52 text-center text-sm font-semibold text-slate-700">
                {visibleRangeLabel}
              </div>
              <Button variant="secondary" onClick={() => moveWindow(1)} aria-label="Next period">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={resetToToday}>
                Today
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading contract timeline..." />
        ) : error ? (
          <EmptyState title="Could not load timeline" description={error} />
        ) : !timeline ? (
          <EmptyState title="No contracts yet" description="Add contracts to see occupied periods by billboard." />
        ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div className="sticky top-0 z-10 grid grid-cols-[240px_1fr] border-b border-slate-200 bg-white">
              <div className="border-r border-slate-200 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Billboard faces</p>
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

            {Object.entries(timeline.grouped).map(([boardName, contracts]) => {
              const visibleContracts = contracts.filter((contract) => {
                const startsBeforeWindowEnds = new Date(contract.start_date) <= timeline.end;
                const endsAfterWindowStarts = new Date(contract.end_date) >= timeline.start;
                return startsBeforeWindowEnds && endsAfterWindowStarts;
              });

              return (
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
                    style={{
                      width: timeline.totalWidth,
                      minHeight: Math.max(visibleContracts.length, 1) * 78
                    }}
                  >
                    {monthMarkers}

                    {visibleContracts.length === 0 ? (
                      <div className="absolute left-4 top-6 text-sm font-medium text-slate-400">
                        No occupied period in this window
                      </div>
                    ) : null}

                    {visibleContracts.map((contract, index) => {
                      const visibleStart = new Date(Math.max(new Date(contract.start_date), timeline.start));
                      const visibleEnd = new Date(Math.min(new Date(contract.end_date), timeline.end));
                      const offsetDays = diffInDays(timeline.start, visibleStart);
                      const spanDays = diffInDays(visibleStart, visibleEnd) + 1;
                      const left = offsetDays * selectedView.dayWidth;
                      const width = Math.max(spanDays * selectedView.dayWidth, MIN_BAR_WIDTH);

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
              );
            })}
          </div>
        </div>
        )}
      </Card>
    </div>
  );
}
