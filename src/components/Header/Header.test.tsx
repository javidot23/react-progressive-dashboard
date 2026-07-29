import { fireEvent, render, screen, within } from "@testing-library/react";
import { Bell, CircleUserRound, Settings } from "lucide-react";
import { MemoryRouter } from "react-router";
import type { NavbarItem } from "../Navbar";
import { Header, type HeaderAction } from "./Header";

jest.mock("../../assets/icons/cencora-logo.svg", () => "cencora-logo.svg");

const primaryItems = [
  { id: "reports", label: "Reports", to: "/reports" },
] satisfies readonly NavbarItem[];

const sectionItems = [
  { id: "summary", label: "Summary", to: "#summary" },
  { id: "demand", label: "Demand", to: "#demand" },
] satisfies readonly NavbarItem[];

describe("Header", () => {
  function renderHeader() {
    const onPrimaryIntent = jest.fn();
    const onPrimarySelect = jest.fn();
    const onSectionIntent = jest.fn();
    const onSectionSelect = jest.fn();
    const onNotifications = jest.fn();
    const onSettings = jest.fn();
    const onProfile = jest.fn();
    const actions = [
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        onSelect: onNotifications,
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        to: "/settings",
        onSelect: onSettings,
      },
      {
        id: "profile",
        label: "Profile",
        icon: CircleUserRound,
        onSelect: onProfile,
      },
    ] satisfies readonly HeaderAction[];

    render(
      <MemoryRouter initialEntries={["/dashboard#summary"]}>
        <Header
          primaryNavigation={{
            items: primaryItems,
            activeId: null,
            ariaLabel: "Primary navigation",
            onIntent: onPrimaryIntent,
            onSelect: onPrimarySelect,
          }}
          sectionNavigation={{
            items: sectionItems,
            activeId: "summary",
            ariaLabel: "Dashboard sections",
            ariaCurrent: "location",
            onIntent: onSectionIntent,
            onSelect: onSectionSelect,
          }}
          actions={actions}
        />
      </MemoryRouter>,
    );

    return {
      onNotifications,
      onPrimaryIntent,
      onPrimarySelect,
      onProfile,
      onSectionIntent,
      onSectionSelect,
      onSettings,
    };
  }

  it("renders the logo, two distinct navigation landmarks, and actions", () => {
    renderHeader();

    const logo = screen.getByRole("link", { name: "Cencora home" });
    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
      hidden: true,
    });
    const sectionNavigation = screen.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const actionGroup = screen.getByRole("group", {
      name: "Header actions",
    });

    expect(logo).toHaveAttribute("href", "/");
    expect(primaryNavigation).toHaveClass("hidden", "md:block");
    expect(
      within(sectionNavigation).getByRole("list"),
    ).toHaveClass("overflow-x-auto", "whitespace-nowrap");
    expect(
      within(sectionNavigation).getByRole("link", { name: "Summary" }),
    ).toHaveAttribute("aria-current", "location");
    expect(
      within(sectionNavigation).queryByRole("button", {
        name: /^Sections:/,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(actionGroup).getByRole("button", { name: "Notifications" }),
    ).toHaveClass("h-11", "w-11", "focus-visible:ring-2");
  });

  it("forwards navigation intent, selection, and action events", () => {
    const callbacks = renderHeader();
    const reports = screen.getByRole("link", {
      name: "Reports",
      hidden: true,
    });
    const demand = screen.getByRole("link", { name: "Demand" });
    const notifications = screen.getByRole("button", {
      name: "Notifications",
    });
    const settings = screen.getByRole("link", { name: "Settings" });
    const profile = screen.getByRole("button", { name: "Profile" });

    fireEvent.focus(reports);
    fireEvent.click(reports);
    fireEvent.pointerEnter(demand);
    fireEvent.click(demand);
    fireEvent.click(notifications);
    fireEvent.click(settings);
    fireEvent.click(profile);

    expect(callbacks.onPrimaryIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "reports" }),
    );
    expect(callbacks.onPrimarySelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "reports" }),
      expect.anything(),
    );
    expect(callbacks.onSectionIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "demand" }),
    );
    expect(callbacks.onSectionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "demand" }),
      expect.anything(),
    );
    expect(callbacks.onNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notifications" }),
      expect.anything(),
    );
    expect(callbacks.onSettings).toHaveBeenCalledWith(
      expect.objectContaining({ id: "settings" }),
      expect.anything(),
    );
    expect(callbacks.onProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "profile" }),
      expect.anything(),
    );
  });
});
