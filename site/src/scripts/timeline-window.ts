export type TimelineSpan = "month" | "six" | "year";

const DAY_MS = 86_400_000;

export function isTimelineSpan(value: string): value is TimelineSpan {
  return value === "month" || value === "six" || value === "year";
}

export function spanDays(span: TimelineSpan): number {
  switch (span) {
    case "month":
      return 31;
    case "six":
      return 183;
    case "year":
      return 365;
    default: {
      const _exhaustive: never = span;
      return _exhaustive;
    }
  }
}

export function spanMs(span: TimelineSpan): number {
  return spanDays(span) * DAY_MS;
}

export function parseUtcDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

export function utcToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function startOfUtcMonth(ms: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function addUtcMonths(ms: number, months: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

export function formatUtcDay(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(ms));
}

export function layoutBar(args: {
  startMs: number;
  endInclusiveMs: number;
  windowStart: number;
  spanMs: number;
}): { leftPct: number; widthPct: number } | null {
  const windowEnd = args.windowStart + args.spanMs;
  const start = Math.max(args.startMs, args.windowStart);
  const end = Math.min(args.endInclusiveMs + DAY_MS, windowEnd);
  if (end <= args.windowStart || start >= windowEnd) {
    return null;
  }

  return {
    leftPct: ((start - args.windowStart) / args.spanMs) * 100,
    widthPct: Math.max(((end - start) / args.spanMs) * 100, 4)
  };
}

export function applyBarLayout(args: {
  bar: HTMLElement;
  windowStart: number;
  span: TimelineSpan;
}): void {
  const startRaw = args.bar.dataset.start;
  const endRaw = args.bar.dataset.end;
  if (!startRaw || !endRaw) {
    args.bar.style.display = "none";
    return;
  }

  const startMs = parseUtcDate(startRaw);
  const endMs = parseUtcDate(endRaw);
  if (startMs === null || endMs === null) {
    args.bar.style.display = "none";
    return;
  }

  const box = layoutBar({
    startMs,
    endInclusiveMs: endMs,
    windowStart: args.windowStart,
    spanMs: spanMs(args.span)
  });
  if (!box) {
    args.bar.style.display = "none";
    return;
  }

  args.bar.style.display = "block";
  args.bar.style.left = `${box.leftPct}%`;
  args.bar.style.width = `${box.widthPct}%`;
}

export function monthTicks(args: {
  windowStart: number;
  span: TimelineSpan;
}): { label: string; leftPct: number }[] {
  const length = spanMs(args.span);
  const windowEnd = args.windowStart + length;
  const ticks: { label: string; leftPct: number }[] = [];
  const start = new Date(args.windowStart);
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();

  while (ticks.length < 14) {
    const tick = Date.UTC(year, month, 1);
    if (tick >= windowEnd) {
      break;
    }
    if (tick >= args.windowStart) {
      ticks.push({
        label: new Intl.DateTimeFormat("en-GB", {
          month: "short",
          timeZone: "UTC"
        }).format(new Date(tick)),
        leftPct: ((tick - args.windowStart) / length) * 100
      });
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return ticks;
}
