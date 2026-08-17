import { gsap } from "../gsap";
import { qs, qsa } from "../dom";

export function initWalkthrough(): void {
  const root = qs(document, "[data-walkthrough]");
  if (!root) {
    return;
  }

  const frames = qsa(root, "[data-frame]");
  const steps = qsa(root, "[data-step]");
  if (frames.length === 0) {
    return;
  }

  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    gsap.set(frames.slice(1), { autoAlpha: 0, y: 20 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: true
      }
    });

    frames.forEach((frame, index) => {
      if (index === 0) {
        return;
      }
      const prev = frames[index - 1];
      if (!prev) {
        return;
      }
      tl.to(prev, { autoAlpha: 0, y: -20, duration: 0.5, ease: "house" }, index);
      tl.fromTo(
        frame,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "house" },
        index
      );
      tl.to(
        steps,
        {
          duration: 0.01,
          onStart() {
            steps.forEach((step, stepIndex) => {
              step.classList.toggle("is-current", stepIndex === index);
            });
          }
        },
        index
      );
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  });
}
