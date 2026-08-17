import { Flip } from "../gsap";
import { qs, qsa } from "../dom";

export function initLedger(options: { motion: boolean }): void {
  const root = qs(document, "[data-ledger]");
  if (!root) {
    return;
  }

  const rows = qsa(root, "[data-row]");

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const state = options.motion ? Flip.getState(rows) : null;
      const wasOpen = row.classList.contains("is-open");
      rows.forEach((item) => item.classList.remove("is-open"));
      if (!wasOpen) {
        row.classList.add("is-open");
      }
      if (state) {
        Flip.from(state, {
          duration: 0.4,
          ease: "house",
          absolute: true
        });
      }
    });
  });
}
