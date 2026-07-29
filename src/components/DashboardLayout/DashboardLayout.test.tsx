import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type {
  NavbarItem,
  NavbarSelectEvent,
} from "../Navbar";
import { DashboardLayout } from "./DashboardLayout";
import type { DashboardPrimaryItem } from "./dashboardNavigation";

jest.mock("../../assets/icons/cencora-logo.svg", () => "cencora-logo.svg");

const sectionItems = [
  {
    id: "summary",
    label: "Summary",
    to: "/manage#summary",
  },
  {
    id: "sales",
    label: "Sales",
    to: "/manage#sales",
  },
] satisfies readonly NavbarItem[];

describe("DashboardLayout", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it("renders the fixed primary destinations and controlled section navigation", () => {
    render(
      <MemoryRouter initialEntries={["/manage#summary"]}>
        <DashboardLayout
          activePrimaryId="manage"
          sectionNavigation={{
            items: sectionItems,
            activeId: "summary",
            ariaLabel: "Manage sections",
            ariaCurrent: "location",
            onSelect: jest.fn(),
          }}
        >
          <main>Dashboard content</main>
        </DashboardLayout>
      </MemoryRouter>,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const sectionNavigation = screen.getByRole("navigation", {
      name: "Manage sections",
    });
    const header = screen.getByRole("banner");

    expect(header).toHaveClass("sticky", "top-0", "z-20");
    expect(
      within(primaryNavigation)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Overview", "/#under-construction"],
      ["React", "/react#under-construction"],
      ["Plan", "/plan#under-construction"],
      ["Manage", "/manage#summary"],
    ]);
    expect(
      within(primaryNavigation).getByRole("link", { name: "Manage" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(sectionNavigation).getByRole("link", { name: "Summary" }),
    ).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("main")).toHaveTextContent("Dashboard content");

    for (const label of ["Notifications", "Settings", "Profile"]) {
      const action = screen.getByRole("button", { name: label });
      expect(action).toBeDisabled();
      expect(action).toHaveClass("disabled:cursor-not-allowed");
      expect(
        screen.queryByRole("link", { name: label }),
      ).not.toBeInTheDocument();
    }
  });

  it("forwards primary selection so the active page can intercept reselection", () => {
    const onPrimarySelect = jest.fn(
      (_item: DashboardPrimaryItem, event: NavbarSelectEvent) => {
        event.preventDefault();
      },
    );

    render(
      <MemoryRouter initialEntries={["/manage#sales"]}>
        <DashboardLayout
          activePrimaryId="manage"
          onPrimarySelect={onPrimarySelect}
          sectionNavigation={{
            items: sectionItems,
            activeId: "sales",
            ariaLabel: "Manage sections",
            ariaCurrent: "location",
            onSelect: jest.fn(),
          }}
        >
          <main>Sales</main>
        </DashboardLayout>
      </MemoryRouter>,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    fireEvent.click(
      within(primaryNavigation).getByRole("link", {
        name: "Manage",
        hidden: true,
      }),
    );

    expect(onPrimarySelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "manage" }),
      expect.anything(),
    );
  });
});
