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
  const homeX = 16;

  const markConflict = (on: boolean): void => {
    booked.classList.toggle("is-conflict", on);
    draft.classList.toggle("is-conflict", on);
  };

  const hideError = (): void => {
    error.classList.remove("is-visible");
  };

  const showError = (): void => {
    error.classList.add("is-visible");
  };

  gsap.set(draft, { x: homeX });
  hideError();

  const reject = (): void => {
    gsap.killTweensOf(draft);
    gsap.to(draft, {
      x: homeX,
      duration: options.motion ? 0.55 : 0,
      ease: options.motion ? "elastic.out(1, 0.6)" : "none",
      onStart: showError,
      onComplete() {
        markConflict(false);
      }
    });
  };

  const colliding = (): boolean =>
    overlaps(draft.getBoundingClientRect(), booked.getBoundingClientRect());

  const created = Draggable.create(draft, {
    type: "x",
    bounds: track,
    inertia: false,
    onDrag() {
      hideError();
      markConflict(colliding());
    },
    onDragEnd() {
      if (colliding()) {
        reject();
        return;
      }
      markConflict(false);
    }
  });
  const draggable = created[0];
  if (!draggable) {
    return;
  }

  draft.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    hideError();
    const current = gsap.getProperty(draft, "x");
    const x = typeof current === "number" ? current : homeX;
    const step = event.key === "ArrowRight" ? 16 : -16;
    const max = Math.max(0, track.clientWidth - draft.offsetWidth);
    gsap.set(draft, { x: Math.min(max, Math.max(0, x + step)) });
    if (colliding()) {
      reject();
      return;
    }
    markConflict(false);
  });

  if (!options.motion) {
    return;
  }

  const collideX = (): number => {
    const heldLeft = booked.offsetLeft;
    const draftWidth = draft.offsetWidth;
    return Math.max(homeX, heldLeft - draftWidth * 0.45);
  };

  const demo = gsap.timeline({ paused: true });
  demo.to(draft, {
    x: () => collideX(),
    duration: 0.9,
    ease: "house",
    onUpdate() {
      markConflict(colliding());
    }
  });
  demo.add(() => {
    draggable.update();
    reject();
  });

  gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top 70%",
      once: true,
      onEnter: () => demo.play(0)
    }
  });
}
