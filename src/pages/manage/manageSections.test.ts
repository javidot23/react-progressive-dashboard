import { getSectionIdFromHash } from "./manageSections";

describe("getSectionIdFromHash", () => {
  it.each([
    ["#inventory", "inventory"],
    ["#sales", "sales"],
    ["#unknown", "summary"],
    ["", "summary"],
    ["#%", "summary"],
    ["#%E0%A4%A", "summary"],
  ])("convierte %s en %s", (hash, expected) => {
    expect(getSectionIdFromHash(hash)).toBe(expected);
  });
});
