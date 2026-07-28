import {
  isUnmodifiedPrimaryClick,
  type NavbarSelectEvent,
} from "./navbarEvents";

function createClickEvent(
  overrides: Partial<
    Pick<
      NavbarSelectEvent,
      "altKey" | "button" | "ctrlKey" | "metaKey" | "shiftKey"
    >
  > = {},
) {
  return {
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  } as NavbarSelectEvent;
}

describe("isUnmodifiedPrimaryClick", () => {
  it("acepta solamente el clic primario sin modificadores", () => {
    expect(isUnmodifiedPrimaryClick(createClickEvent())).toBe(true);
  });

  it.each([
    ["Alt", { altKey: true }],
    ["Ctrl", { ctrlKey: true }],
    ["Cmd", { metaKey: true }],
    ["Shift", { shiftKey: true }],
    ["botón central", { button: 1 }],
    ["botón secundario", { button: 2 }],
  ])("conserva el comportamiento nativo para %s", (_label, overrides) => {
    expect(
      isUnmodifiedPrimaryClick(createClickEvent(overrides)),
    ).toBe(false);
  });
});
