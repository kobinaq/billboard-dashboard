import { gsap, SplitText } from "../gsap";
import { qs } from "../dom";

export function initHero(): void {
  const title = qs(document, "[data-hero-title]");
  if (!title) {
    return;
  }

  SplitText.create(title, {
    type: "lines, words",
    mask: "lines",
    autoSplit: true,
    onSplit(self) {
      const splitWord = self.words.find((word) =>
        word.textContent?.toLowerCase().includes("collisions")
      );
      const wdth =
        qs(title, "[data-wdth]") ??
        (splitWord instanceof HTMLElement ? splitWord : null);

      const reveal = gsap.from(self.lines, {
        yPercent: 110,
        duration: 0.55,
        stagger: 0.06,
        ease: "house"
      });

      if (wdth) {
        reveal.eventCallback("onComplete", () => {
          gsap.to(wdth, {
            duration: 0.7,
            ease: "house",
            fontVariationSettings: '"wdth" 125, "wght" 700'
          });
        });
      }

      return reveal;
    }
  });
}
