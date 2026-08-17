import { qs, qsa } from "./dom";
import {
  addUtcMonths,
  applyBarLayout,
  formatUtcDay,
  isTimelineSpan,
  monthTicks,
  parseUtcDate,
  spanMs,
  startOfUtcMonth,
  utcToday,
  type TimelineSpan
} from "./timeline-window";

type OccupiedRange = {
  start: string;
  end: string;
};

type PublicFace = {
  id: string;
  name: string;
  faceLabel: string;
  code: string;
  type: string;
  status: string;
  region: string;
  address: string;
  facing: string | null;
  rate12: number | null;
  rate3: number | null;
  rate6: number | null;
  rate12plus: number | null;
  design: number | null;
  printing: number | null;
  flighting: number | null;
  occupied: OccupiedRange[];
  nextAvailable: string | null;
};

type AvailState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ready" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseOccupied(value: unknown): OccupiedRange[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ranges: OccupiedRange[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const start = typeof item.start_date === "string" ? item.start_date : null;
    const end = typeof item.end_date === "string" ? item.end_date : null;
    if (!start || !end || parseUtcDate(start) === null || parseUtcDate(end) === null) {
      continue;
    }
    ranges.push({ start, end });
  }
  return ranges;
}

function parseFace(value: unknown): PublicFace | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.billboard_face_id);
  const name = asString(value.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    faceLabel: asString(value.face_label) || "Face",
    code: asString(value.code),
    type: asString(value.type),
    status: asString(value.status),
    region: asString(value.region),
    address: asString(value.address),
    facing: asNullableString(value.face_facing_direction),
    rate12: asMoney(value.rate_1_2_months),
    rate3: asMoney(value.rate_3_months),
    rate6: asMoney(value.rate_6_months),
    rate12plus: asMoney(value.rate_12_plus_months),
    design: asMoney(value.design_price),
    printing: asMoney(value.printing_price),
    flighting: asMoney(value.flighting_price),
    occupied: parseOccupied(value.occupied_ranges),
    nextAvailable: asNullableString(value.next_available_date)
  };
}

function formatCedi(value: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0
  }).format(value);
}

function rateLine(face: PublicFace): string {
  const parts: string[] = [];
  if (face.rate12 !== null) {
    parts.push(`1-2 mo ${formatCedi(face.rate12)}`);
  }
  if (face.rate3 !== null) {
    parts.push(`3 mo ${formatCedi(face.rate3)}`);
  }
  if (face.rate6 !== null) {
    parts.push(`6 mo ${formatCedi(face.rate6)}`);
  }
  if (face.rate12plus !== null) {
    parts.push(`12+ mo ${formatCedi(face.rate12plus)}`);
  }
  return parts.join(" · ");
}

function extrasLine(face: PublicFace): string {
  if (face.type === "digital") {
    return "";
  }

  const parts: string[] = [];
  if (face.design !== null) {
    parts.push(`Design ${formatCedi(face.design)}`);
  }
  if (face.printing !== null) {
    parts.push(`Print ${formatCedi(face.printing)}`);
  }
  if (face.flighting !== null) {
    parts.push(`Flight ${formatCedi(face.flighting)}`);
  }
  return parts.join(" · ");
}

function placeLine(face: PublicFace): string {
  return [face.region, face.address, face.facing]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" · ");
}

function availabilityLabel(face: PublicFace, today: number): string {
  if (face.status === "maintenance") {
    return "In maintenance";
  }

  const occupiedNow = face.occupied.some((range) => {
    const start = parseUtcDate(range.start);
    const end = parseUtcDate(range.end);
    return start !== null && end !== null && start <= today && end >= today;
  });

  if (!occupiedNow) {
    return "Available now";
  }

  const next = face.nextAvailable ? parseUtcDate(face.nextAvailable) : null;
  if (next === null) {
    return "Occupied";
  }

  return `Available from ${formatUtcDay(next)}`;
}

function node(tag: string, className: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

function monthsForSpan(span: TimelineSpan): number {
  switch (span) {
    case "month":
      return 1;
    case "six":
      return 6;
    case "year":
      return 12;
    default: {
      const _exhaustive: never = span;
      return _exhaustive;
    }
  }
}

function availabilityEndpoint(base: string): string {
  const origin = new URL(base).origin;
  return new URL("/rest/v1/rpc/public_billboard_availability", `${origin}/`).toString();
}

async function fetchFaces(): Promise<PublicFace[]> {
  const url =
    import.meta.env.REACT_APP_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || "";
  const key =
    import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    throw new Error("This page needs the project URL and anon key in the environment.");
  }

  let endpoint: string;
  try {
    endpoint = availabilityEndpoint(url);
  } catch {
    throw new Error("The Supabase URL in the environment is not a valid URL.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: "{}"
  });

  if (!response.ok) {
    throw new Error(`Availability request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Availability response was not a list.");
  }

  return payload.flatMap((item) => {
    const face = parseFace(item);
    return face ? [face] : [];
  });
}

function renderFaces(list: HTMLElement, faces: PublicFace[], today: number): void {
  list.replaceChildren();

  for (const face of faces) {
    const row = node("div", "grid gap-4 border-t border-[var(--color-rule)] py-5 md:grid-cols-[280px_1fr]");

    const meta = node("div", "");
    const title = node("p", "m-0 font-semibold");
    title.append(document.createTextNode(`${face.name} · ${face.faceLabel}`));
    if (face.code) {
      const code = node("span", "mono ml-2 text-xs");
      code.textContent = face.code;
      title.append(code);
    }

    const place = node("p", "mt-1 mb-0 text-sm");
    place.textContent = placeLine(face);

    const status = node("p", "mt-2 mb-0 font-semibold");
    status.textContent = availabilityLabel(face, today);

    const rates = node("p", "mono mt-1 mb-0 text-sm");
    rates.textContent = rateLine(face);

    meta.append(title, place, status);
    if (rates.textContent) {
      meta.append(rates);
    }
    const extras = extrasLine(face);
    if (extras) {
      const extra = node("p", "mono mt-1 mb-0 text-sm");
      extra.textContent = extras;
      meta.append(extra);
    }

    const track = node("div", "track");
    track.dataset.track = "";
    const open = node("p", "absolute left-3 top-2.5 m-0 text-sm");
    open.dataset.open = "";
    open.textContent = "Open in this period";
    track.append(open);

    for (const range of face.occupied) {
      const bar = node(
        "div",
        "bar-occupied absolute top-1.5 h-8 overflow-hidden px-2 py-1.5 text-xs"
      );
      bar.dataset.bar = "";
      bar.dataset.start = range.start;
      bar.dataset.end = range.end;
      const startMs = parseUtcDate(range.start);
      const endMs = parseUtcDate(range.end);
      bar.textContent =
        startMs !== null && endMs !== null
          ? `${formatUtcDay(startMs)} to ${formatUtcDay(endMs)}`
          : "Occupied";
      track.append(bar);
    }

    row.append(meta, track);
    list.append(row);
  }
}

function layoutBoard(root: HTMLElement, windowStart: number, span: TimelineSpan): void {
  qsa(root, "[data-track]").forEach((track) => {
    const bars = qsa(track, "[data-bar]");
    let visible = 0;
    bars.forEach((bar) => {
      applyBarLayout({ bar, windowStart, span });
      if (bar.style.display !== "none") {
        visible += 1;
      }
    });
    const open = qs(track, "[data-open]");
    if (open) {
      open.hidden = visible > 0;
    }
  });

  const ticks = qs(root, "[data-ticks]");
  if (ticks) {
    ticks.replaceChildren();
    for (const tick of monthTicks({ windowStart, span })) {
      const label = node("span", "avail-tick mono");
      label.style.left = `${tick.leftPct}%`;
      label.textContent = tick.label;
      ticks.append(label);
    }
  }

  const label = qs(root, "[data-window-label]");
  if (label) {
    const end = windowStart + spanMs(span) - 86_400_000;
    label.textContent = `${formatUtcDay(windowStart)} to ${formatUtcDay(end)}`;
  }
}

function showState(root: HTMLElement, state: AvailState): void {
  const status = qs(root, "[data-avail-status]");
  const board = qs(root, "[data-avail-board]");
  if (!status || !board) {
    return;
  }

  switch (state.kind) {
    case "loading":
      status.hidden = false;
      board.hidden = true;
      status.textContent = "Loading faces.";
      return;
    case "error":
      status.hidden = false;
      board.hidden = true;
      status.textContent = state.message;
      return;
    case "empty":
      status.hidden = false;
      board.hidden = true;
      status.textContent = "No faces to show.";
      return;
    case "ready":
      status.hidden = true;
      board.hidden = false;
      return;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function initAvailability(): void {
  const root = qs(document, "[data-availability]");
  if (!root) {
    return;
  }

  const list = qs(root, "[data-avail-list]");
  if (!list) {
    return;
  }

  const buttons = qsa(root, "[data-view]");
  let span: TimelineSpan = "six";
  let windowStart = startOfUtcMonth(utcToday());
  const today = utcToday();

  const paint = (): void => {
    layoutBoard(root, windowStart, span);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.view;
      if (!next || !isTimelineSpan(next) || next === span) {
        return;
      }
      span = next;
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      paint();
    });
  });

  qs(root, "[data-prev]")?.addEventListener("click", () => {
    windowStart = addUtcMonths(windowStart, -monthsForSpan(span));
    paint();
  });
  qs(root, "[data-next]")?.addEventListener("click", () => {
    windowStart = addUtcMonths(windowStart, monthsForSpan(span));
    paint();
  });
  qs(root, "[data-today]")?.addEventListener("click", () => {
    windowStart = startOfUtcMonth(today);
    paint();
  });

  showState(root, { kind: "loading" });
  paint();

  void fetchFaces()
    .then((faces) => {
      if (faces.length === 0) {
        showState(root, { kind: "empty" });
        return;
      }
      renderFaces(list, faces, today);
      showState(root, { kind: "ready" });
      paint();
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not load availability.";
      showState(root, { kind: "error", message });
    });
}
