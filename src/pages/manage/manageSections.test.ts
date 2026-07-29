import {
  getSectionIdFromHash,
  manageSections,
} from "./manageSections";

describe("getSectionIdFromHash", () => {
  it.each([
    ["#summary", "summary"],
    ["#demand", "demand"],
    ["#orders", "orders"],
    ["#suppliers", "suppliers"],
    ["#inventory", "inventory"],
    ["#sales", "sales"],
    ["#perfect-order", "perfect-order"],
    ["#unknown", "summary"],
    ["", "summary"],
    ["#%", "summary"],
    ["#%E0%A4%A", "summary"],
  ])("convierte %s en %s", (hash, expected) => {
    expect(getSectionIdFromHash(hash)).toBe(expected);
  });

  it("preserves the requested Manage section order", () => {
    expect(
      manageSections.map(({ id, label, placeholderMinHeight }) => ({
        id,
        label,
        placeholderMinHeight,
      })),
    ).toEqual([
      { id: "summary", label: "Summary", placeholderMinHeight: 820 },
      { id: "demand", label: "Demand", placeholderMinHeight: 900 },
      { id: "orders", label: "Orders", placeholderMinHeight: 900 },
      { id: "suppliers", label: "Suppliers", placeholderMinHeight: 900 },
      { id: "inventory", label: "Inventory", placeholderMinHeight: 900 },
      { id: "sales", label: "Sales", placeholderMinHeight: 900 },
      {
        id: "perfect-order",
        label: "Perfect Order",
        placeholderMinHeight: 900,
      },
    ]);
  });
});
