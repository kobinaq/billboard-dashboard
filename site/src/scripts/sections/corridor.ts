import { gsap } from "../gsap";
import { qs, qsa } from "../dom";

export function initCorridor(): void {
  const root = qs(document, "[data-corridor]");
  if (!root) {
    return;
  }

  const strokes = qsa(root, "[data-draw]");
  const pins = qsa(root, "[data-pin]");
  gsap.set(pins, { scale: 0, transformOrigin: "50% 50%" });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top 70%",
      once: true
    }
  });

  tl.from(strokes, {
    drawSVG: "0% 0%",
    duration: 1.1,
    stagger: 0.15,
    ease: "house"
  });
  tl.to(pins, {
    scale: 1,
    duration: 0.35,
    stagger: 0.08,
    ease: "house"
  }, "-=0.2");
}
