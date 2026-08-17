import fs from "fs";
import path from "path";

const schema = fs.readFileSync(
  path.join(__dirname, "../../supabase/schema.sql"),
  "utf8"
);

describe("schema invariants", () => {
  it("does not copy signup metadata into profiles.role", () => {
    expect(schema).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/);
    expect(schema).toMatch(/new\.email,\s*'client',/s);
  });

  it("adds the overlap constraint before dropping the old trigger", () => {
    expect(schema).toMatch(/exclude using gist/i);
    const constraintAt = schema.indexOf("contracts_no_overlapping_bookings");
    const dropAt = schema.indexOf("drop trigger if exists contracts_prevent_overlap");
    expect(constraintAt).toBeGreaterThan(-1);
    expect(dropAt).toBeGreaterThan(constraintAt);
  });

  it("keeps drafts from self-activating", () => {
    expect(schema).toMatch(/when status in \('cancelled', 'draft'\) then status/);
  });

  it("stores inspection photos in a private bucket", () => {
    expect(schema).toMatch(/\('inspection-photos', 'inspection-photos', false\)/);
  });
});
