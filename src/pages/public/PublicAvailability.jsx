import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { usePublicAvailability } from "hooks/usePublicAvailability";
import { addMonths, diffInDays, formatCurrency, formatDate, startOfMonth } from "lib/utils";

const VIEW_OPTIONS = {
  month: { label: "Month", months: 1, dayWidth: 24 },
  sixMonths: { label: "6 months", months: 6, dayWidth: 8 },
  annual: { label: "Annual", months: 12, dayWidth: 4 }
};

const MIN_BAR_WIDTH = 44;

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

function endOfWindow(start, months) {
  const date = addMonths(start, months);
  return new Date(date.getFullYear(), date.getMonth(), 0);
}

function buildMonths(start, end) {
  const months = [];
  let cursor = startOfMonth(start);

  while (cursor <= end) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const visibleEnd = monthEnd > end ? end : monthEnd;
    months.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      date: monthStart,
      days: diffInDays(monthStart, visibleEnd) + 1
    });
    cursor = addMonths(cursor, 1);
  }

  return months;
}

function formatPrice(value) {
  return value === null || value === undefined ? "--" : formatCurrency(value);
}

function availabilityLabel(board) {
  const today = new Date();
  const isCurrentlyOccupied = (board.occupied_ranges || []).some(
    (range) => new Date(range.start_date) <= today && new Date(range.end_date) >= today
  );

  if (!isCurrentlyOccupied) {
    return "Available now";
  }

  return `Available from ${formatDate(board.next_available_date)}`;
}

export default function PublicAvailability() {
  const { data, loading, error } = usePublicAvailability();
  const [view, setView] = useState("sixMonths");
  const [windowStart, setWindowStart] = useState(() => startOfMonth(new Date()));
  const [hasAutoPositioned, setHasAutoPositioned] = useState(false);
  const selectedView = VIEW_OPTIONS[view];

  useEffect(() => {
    if (hasAutoPositioned || !data?.length) {
      return;
    }

    const firstOccupiedDate = data
      .flatMap((board) => board.occupied_ranges || [])
      .map((range) => new Date(range.start_date).getTime())
      .filter(Boolean)
      .sort((a, b) => a - b)[0];

    if (firstOccupiedDate) {
      setWindowStart(startOfMonth(new Date(firstOccupiedDate)));
    }

    setHasAutoPositioned(true);
  }, [data, hasAutoPositioned]);

  const timeline = useMemo(() => {
    const end = endOfWindow(windowStart, selectedView.months);
    const months = buildMonths(windowStart, end).map((month) => ({
      ...month,
      label: monthLabel(month.date),
      width: month.days * selectedView.dayWidth
    }));

    return {
      start: windowStart,
      end,
      months,
      totalWidth: (diffInDays(windowStart, end) + 1) * selectedView.dayWidth
    };
  }, [selectedView, windowStart]);

  const monthMarkers = useMemo(() => {
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

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-brand-700">ThinkAloud Outdoor Media</p>
            <h1 className="mt-2 text-3xl font-semibold">Billboard Availability</h1>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            <LockKeyhole className="h-4 w-4" />
            Staff login
          </Link>
        </header>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
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
                {periodLabel(timeline.start)} - {periodLabel(timeline.end)}
              </div>
              <Button variant="secondary" onClick={() => moveWindow(1)} aria-label="Next period">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={resetToToday}>
                Today
              </Button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading availability..." />
          ) : error ? (
            <EmptyState title="Could not load availability" description={error} />
          ) : !data?.length ? (
            <EmptyState title="No billboards available" description="Check back soon for available billboard inventory." />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                <div className="sticky top-0 z-10 grid grid-cols-[360px_1fr] border-b border-slate-200 bg-white">
                  <div className="border-r border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">Billboard</p>
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

                {data.map((board) => {
                  const visibleRanges = (board.occupied_ranges || []).filter((range) => {
                    const startsBeforeWindowEnds = new Date(range.start_date) <= timeline.end;
                    const endsAfterWindowStarts = new Date(range.end_date) >= timeline.start;
                    return startsBeforeWindowEnds && endsAfterWindowStarts;
                  });

                  return (
                    <div
                      key={board.billboard_face_id}
                      className="grid grid-cols-[360px_1fr] border-b border-slate-200 last:border-b-0"
                    >
                      <div className="space-y-4 border-r border-slate-200 px-5 py-5">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {board.name} - {board.face_label}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              {board.code}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {board.region} - {board.address}
                            {board.face_facing_direction ? ` - ${board.face_facing_direction}` : ""}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-brand-700">{availabilityLabel(board)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <Price label="1-2 mo" value={board.rate_1_2_months} />
                          <Price label="3 mo" value={board.rate_3_months} />
                          <Price label="6 mo" value={board.rate_6_months} />
                          <Price label="12+ mo" value={board.rate_12_plus_months} />
                        </div>

                        {board.type !== "digital" ? (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <Price label="Design" value={board.design_price} />
                            <Price label="Print" value={board.printing_price} />
                            <Price label="Flight" value={board.flighting_price} />
                          </div>
                        ) : null}
                      </div>

                      <div className="relative px-4 py-5">
                        <div
                          className="relative rounded-3xl bg-slate-50"
                          style={{
                            width: timeline.totalWidth,
                            minHeight: Math.max(visibleRanges.length, 1) * 64
                          }}
                        >
                          {monthMarkers}
                          {visibleRanges.length === 0 ? (
                            <div className="absolute left-4 top-6 text-sm font-medium text-emerald-700">
                              Open in this period
                            </div>
                          ) : null}

                          {visibleRanges.map((range, index) => {
                            const visibleStart = new Date(Math.max(new Date(range.start_date), timeline.start));
                            const visibleEnd = new Date(Math.min(new Date(range.end_date), timeline.end));
                            const offsetDays = diffInDays(timeline.start, visibleStart);
                            const spanDays = diffInDays(visibleStart, visibleEnd) + 1;
                            const left = offsetDays * selectedView.dayWidth;
                            const width = Math.max(spanDays * selectedView.dayWidth, MIN_BAR_WIDTH);

                            return (
                              <div
                                key={`${board.billboard_face_id}-${range.start_date}-${range.end_date}`}
                                className="absolute"
                                style={{ left, top: 16 + index * 52, width }}
                              >
                                <div className="rounded-2xl bg-brand-700 px-4 py-3 text-white shadow-lg shadow-brand-900/15">
                                  <p className="truncate text-sm font-semibold">Occupied</p>
                                  <p className="mt-1 truncate text-xs text-brand-100">
                                    {formatDate(range.start_date)} - {formatDate(range.end_date)}
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
    </div>
  );
}

function Price({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{formatPrice(value)}</p>
    </div>
  );
}
