import { Draggable, gsap } from "../gsap";
import { qs } from "../dom";

const ERROR_TEXT =
  'ERROR: conflicting key value violates exclusion constraint "contracts_no_overlapping_bookings"';

function overlaps(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left;
}

export function initCollision(options: { motion: boolean }): void {
  const root = qs(document, "[data-collision]");
  if (!root) {
    return;
  }

  const track = qs(root, "[data-track]");
  const booked = qs(root, "[data-booked]");
  const draft = qs(root, "[data-draft]");
  const error = qs(root, "[data-error]");
  if (!track || !booked || !draft || !error) {
    return;
  }

  error.textContent = ERROR_TEXT;
  const homeX = 24;
  gsap.set(draft, { x: homeX });

  const reject = (): void => {
    error.classList.add("is-visible");
    gsap.to(draft, {
      x: homeX,
      duration: options.motion ? 0.6 : 0,
      ease: options.motion ? "elastic.out(1, 0.55)" : "none"
    });
  };

  const check = (): void => {
    if (overlaps(draft.getBoundingClientRect(), booked.getBoundingClientRect())) {
      reject();
      return;
    }
    error.classList.remove("is-visible");
  };

  Draggable.create(draft, {
    type: "x",
    bounds: track,
    inertia: options.motion,
    onDrag() {
      error.classList.remove("is-visible");
    },
    onDragEnd: check
  });

  draft.setAttribute("tabindex", "0");
  draft.setAttribute("role", "slider");
  draft.setAttribute("aria-label", "Proposed booking");
  draft.setAttribute("aria-valuemin", "0");
  draft.setAttribute("aria-valuemax", "100");

  draft.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const current = gsap.getProperty(draft, "x");
    const x = typeof current === "number" ? current : homeX;
    const next = event.key === "ArrowRight" ? x + 12 : x - 12;
    gsap.set(draft, { x: Math.max(0, next) });
    check();
  });

  if (!options.motion) {
    return;
  }

  const demo = gsap.timeline({
    repeat: 2,
    paused: true,
    defaults: { ease: "house" }
  });
  demo.to(draft, { x: 220, duration: 1.1 });
  demo.add(() => check());

  gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top 70%",
      once: true,
      onEnter: () => demo.play(0)
    }
  });
}
