import { Flip, gsap } from "../gsap";
import { qs, qsa } from "../dom";

type TimelineView = "month" | "six";

const WINDOW_START = Date.UTC(2026, 7, 1);

function isTimelineView(value: string): value is TimelineView {
  return value === "month" || value === "six";
}

function daysInView(view: TimelineView): number {
  return view === "month" ? 31 : 183;
}

function parseDay(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

function layoutBars(root: HTMLElement, view: TimelineView): void {
  const span = daysInView(view) * 86400000;
  const windowEnd = WINDOW_START + span;

  qsa(root, "[data-bar]").forEach((bar) => {
    const startRaw = bar.dataset.start;
    const endRaw = bar.dataset.end;
    if (!startRaw || !endRaw) {
      bar.style.display = "none";
      return;
    }

    const start = Math.max(parseDay(startRaw), WINDOW_START);
    const end = Math.min(parseDay(endRaw) + 86400000, windowEnd);
    if (end <= WINDOW_START || start >= windowEnd) {
      bar.style.display = "none";
      return;
    }

    const left = ((start - WINDOW_START) / span) * 100;
    const width = Math.max(((end - start) / span) * 100, 4);
    bar.style.display = "block";
    bar.style.left = `${left}%`;
    bar.style.width = `${width}%`;
  });
}

export function initTimeline(options: { motion: boolean }): void {
  const root = qs(document, "[data-timeline]");
  if (!root) {
    return;
  }

  const buttons = qsa(root, "[data-view]");
  let view: TimelineView = "six";
  layoutBars(root, view);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.view;
      if (!next || !isTimelineView(next) || next === view) {
        return;
      }

      const state = options.motion ? Flip.getState(qsa(root, "[data-bar]")) : null;
      view = next;
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      layoutBars(root, view);

      if (state) {
        Flip.from(state, {
          duration: 0.5,
          ease: "house",
          absolute: true,
          scale: true
        });
      }
    });
  });

  if (!options.motion) {
    return;
  }

  gsap.from(qsa(root, "[data-bar]"), {
    opacity: 0,
    y: 12,
    duration: 0.45,
    stagger: 0.06,
    ease: "house",
    scrollTrigger: {
      trigger: root,
      start: "top 75%",
      once: true
    }
  });
}
