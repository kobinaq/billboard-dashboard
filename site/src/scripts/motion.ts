import { gsap, ScrollTrigger } from "./gsap";
import { initCollision } from "./sections/collision";
import { initCorridor } from "./sections/corridor";
import { initHero } from "./sections/hero";
import { initLedger } from "./sections/ledger";
import { initNav } from "./sections/nav";
import { initPhotos } from "./sections/photos";
import { initTimeline } from "./sections/timeline";
import { initWalkthrough } from "./sections/walkthrough";

export function initMotion(): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initNav();
  initTimeline({ motion: !reduce });
  initCollision({ motion: !reduce });
  initLedger({ motion: !reduce });

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    initHero();
    initWalkthrough();
    initPhotos();
    initCorridor();
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  });

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("dev")) {
    void import("gsap/GSDevTools").then((mod) => {
      gsap.registerPlugin(mod.GSDevTools);
      mod.GSDevTools.create();
    });
  }
}
