import { escapeHtml } from "./utils";

describe("escapeHtml", () => {
  it("escapes markup in staff-entered strings", () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)> & "ok"`)).toBe(
      "&lt;img src=x onerror=alert(1)&gt; &amp; &quot;ok&quot;"
    );
  });
});
