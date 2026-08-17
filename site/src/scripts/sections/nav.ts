import { qs, qsa } from "../dom";
import { gsap, ScrollTrigger } from "../gsap";

export function initNav(): void {
  const nav = qs(document, "[data-nav]");
  if (!nav) {
    return;
  }

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        nav.classList.toggle("is-scrolled", self.scroll() > 100);
      }
    });

    return () => {
      trigger.kill();
    };
  });

  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
    nav.classList.add("is-scrolled");
    return () => undefined;
  });

  qsa(nav, "[data-scroll]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return;
      }
      const target = qs(document, href);
      if (!target) {
        return;
      }
      event.preventDefault();
      gsap.to(window, {
        duration: 0.7,
        ease: "house",
        scrollTo: { y: target, offsetY: 72 }
      });
    });
  });
}
