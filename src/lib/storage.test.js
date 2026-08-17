import { isRemoteFileUrl } from "./storage";

describe("isRemoteFileUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isRemoteFileUrl("https://example.com/photo.jpg")).toBe(true);
    expect(isRemoteFileUrl("http://example.com/photo.jpg")).toBe(true);
  });

  it("rejects storage paths", () => {
    expect(isRemoteFileUrl("inspections/abc/photo.jpg")).toBe(false);
    expect(isRemoteFileUrl("")).toBe(false);
  });
});
