import { buildContractTimeline, getClientVisibleContracts } from "./contracts";

describe("getClientVisibleContracts", () => {
  const contracts = [
    {
      id: "1",
      clients: {
        profile_id: "profile-1",
        contact_email: "client@example.com",
        company_name: "BlueWave"
      }
    },
    {
      id: "2",
      clients: {
        profile_id: "profile-2",
        contact_email: "other@example.com",
        company_name: "Sunrise"
      }
    }
  ];

  it("keeps contracts whose client is linked to the signed-in profile", () => {
    const visible = getClientVisibleContracts(contracts, {
      id: "profile-1",
      email: "mismatch@example.com",
      company_name: "Mismatch"
    });

    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("1");
  });

  it("does not treat matching email or company as portal access", () => {
    const visible = getClientVisibleContracts(
      [
        {
          id: "3",
          clients: {
            contact_email: "portal@example.com",
            company_name: "Fallback Co"
          }
        }
      ],
      {
        id: "profile-1",
        email: "portal@example.com",
        company_name: "Fallback Co"
      }
    );

    expect(visible).toHaveLength(0);
  });

  it("hides every contract when the profile has no id", () => {
    expect(
      getClientVisibleContracts(contracts, {
        email: "client@example.com",
        company_name: "BlueWave"
      })
    ).toEqual([]);
  });
});

describe("buildContractTimeline", () => {
  it("builds a grouped month-based timeline window", () => {
    const timeline = buildContractTimeline([
      {
        id: "contract-1",
        start_date: "2026-01-15",
        end_date: "2026-03-10",
        billboards: { name: "Board A" }
      },
      {
        id: "contract-2",
        start_date: "2026-02-01",
        end_date: "2026-04-30",
        billboards: { name: "Board B" }
      }
    ]);

    expect(timeline.totalDays).toBeGreaterThan(100);
    expect(timeline.months).toHaveLength(4);
    expect(Object.keys(timeline.grouped)).toEqual(["Board A", "Board B"]);
  });

  it("groups contracts by billboard face when a face label is present", () => {
    const timeline = buildContractTimeline([
      {
        id: "contract-1",
        start_date: "2026-01-01",
        end_date: "2026-03-31",
        billboards: { name: "Board A" },
        billboard_faces: { label: "Face A" }
      },
      {
        id: "contract-2",
        start_date: "2026-01-01",
        end_date: "2026-03-31",
        billboards: { name: "Board A" },
        billboard_faces: { label: "Face B" }
      }
    ]);

    expect(Object.keys(timeline.grouped)).toEqual(["Board A - Face A", "Board A - Face B"]);
  });
});
