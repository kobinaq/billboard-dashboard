import { Flip, gsap } from "../gsap";
import { qs, qsa } from "../dom";
import { applyBarLayout, isTimelineSpan, type TimelineSpan } from "../timeline-window";

const WINDOW_START = Date.UTC(2026, 7, 1);

function isDemoView(value: string): value is Exclude<TimelineSpan, "year"> {
  return value === "month" || value === "six";
}

function layoutBars(root: HTMLElement, view: Exclude<TimelineSpan, "year">): void {
  qsa(root, "[data-bar]").forEach((bar) => {
    applyBarLayout({ bar, windowStart: WINDOW_START, span: view });
  });
}

export function initTimeline(options: { motion: boolean }): void {
  const root = qs(document, "[data-timeline]");
  if (!root) {
    return;
  }

  const buttons = qsa(root, "[data-view]");
  let view: Exclude<TimelineSpan, "year"> = "six";
  layoutBars(root, view);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.view;
      if (!next || !isTimelineSpan(next) || !isDemoView(next) || next === view) {
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
