import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Navbar, type NavbarItem } from "./Navbar";
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

const items = [
  { id: "summary", label: "Summary", to: "#summary" },
  { id: "inventory", label: "Inventory", to: "#inventory" },
] satisfies readonly NavbarItem[];

function renderNavbar(onSelect = jest.fn()) {
  render(
    <MemoryRouter>
      <Navbar
        items={items}
        activeId="summary"
        ariaLabel="Manage sections"
        innerClassName="mx-auto max-w-6xl"
        onSelect={onSelect}
      />
    </MemoryRouter>,
  );

  return {
    list: screen.getByRole("list"),
    toggle: screen.getByRole("button", {
      name: "Sections: Summary",
    }),
  };
}

describe("Navbar mobile disclosure", () => {
  const originalMatchMedia = window.matchMedia;
  const originalRequestAnimationFrame = window.requestAnimationFrame;

  beforeEach(() => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
    });
    window.requestAnimationFrame = jest.fn((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  it("usa un disclosure vertical sin scroll horizontal", () => {
    const { list, toggle } = renderNavbar();

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", list.id);
    expect(list).toHaveClass("hidden", "flex-col", "md:flex");
    expect(list).not.toHaveClass("overflow-x-auto");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(list).toHaveClass("flex");
    expect(list).not.toHaveClass("hidden");
  });

  it("cierra con Escape y devuelve el foco al botón", () => {
    const { toggle } = renderNavbar();
    fireEvent.click(toggle);

    fireEvent.keyDown(toggle, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("cierra después de una selección primaria", () => {
    const onSelect = jest.fn();
    const { toggle } = renderNavbar(onSelect);
    fireEvent.click(toggle);

    fireEvent.click(screen.getByRole("link", { name: "Inventory" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("permanece abierto para clics modificados", () => {
    const onSelect = jest.fn();
    const { toggle } = renderNavbar(onSelect);
    fireEvent.click(toggle);

    fireEvent.click(screen.getByRole("link", { name: "Inventory" }), {
      metaKey: true,
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
