import { gsap } from "../gsap";
import { qsa } from "../dom";

export function initPhotos(): void {
  qsa(document, "[data-photo]").forEach((band) => {
    const media = band.querySelector("img, .photo-fallback");
    if (!(media instanceof HTMLElement)) {
      return;
    }

    gsap.to(media, {
      yPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: band,
        scrub: true
      }
    });
  });
}
