import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Bell, CircleUserRound, Settings } from "lucide-react";
import { MemoryRouter } from "react-router";
import type { NavbarItem } from "../Navbar";
import { Header, type HeaderAction } from "./Header";

jest.mock("../../assets/icons/cencora-logo.svg", () => "cencora-logo.svg");

const primaryItems = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
  { id: "team", label: "Team", to: "/team" },
  { id: "projects", label: "Projects", to: "/projects" },
  { id: "calendar", label: "Calendar", to: "/calendar" },
] satisfies readonly NavbarItem[];

const sectionItems = [
  { id: "summary", label: "Summary", to: "#summary" },
  { id: "demand", label: "Demand", to: "#demand" },
] satisfies readonly NavbarItem[];

type MediaListener = (event: MediaQueryListEvent) => void;

describe("Header", () => {
  let desktopMatches = false;
  let desktopListeners: Set<MediaListener>;

  beforeAll(() => {
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });

    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    });
  });

  beforeEach(() => {
    desktopMatches = false;
    desktopListeners = new Set();
    document.body.style.overflow = "";

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === "(min-width: 768px)" ? desktopMatches : false,
        media: query,
        onchange: null,
        addEventListener: (
          eventName: string,
          listener: MediaListener,
        ) => {
          if (
            query === "(min-width: 768px)" &&
            eventName === "change"
          ) {
            desktopListeners.add(listener);
          }
        },
        removeEventListener: (
          eventName: string,
          listener: MediaListener,
        ) => {
          if (
            query === "(min-width: 768px)" &&
            eventName === "change"
          ) {
            desktopListeners.delete(listener);
          }
        },
      })),
    });
  });

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
            activeId: "dashboard",
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
          sectionParentId="dashboard"
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

  function openMobileMenu() {
    const opener = screen.getByRole("button", {
      name: "Open navigation menu",
    });
    fireEvent.click(opener);

    return {
      dialog: screen.getByRole("dialog", { name: "Navigation menu" }),
      opener,
    };
  }

  it("renders the logo, distinct desktop navigation landmarks, actions, and mobile trigger", () => {
    renderHeader();

    const logo = screen.getByRole("link", { name: "Cencora home" });
    const primaryNavigation = document.querySelector<HTMLElement>(
      'header > div nav[aria-label="Primary navigation"]',
    );
    const primaryList = within(primaryNavigation!).getByRole("list");
    const upperSection =
      document.querySelector<HTMLElement>("header > div");
    const sectionNavigation = screen.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const sectionList = within(sectionNavigation).getByRole("list");
    const activeSectionLink = within(sectionNavigation).getByRole("link", {
      name: "Summary",
    });
    const actionGroup = screen.getByRole("group", {
      name: "Header actions",
    });
    const menuButton = screen.getByRole("button", {
      name: "Open navigation menu",
    });

    expect(logo).toHaveAttribute("href", "/");
    expect(upperSection).toHaveClass("h-16", "px-4", "sm:gap-4");
    expect(upperSection).not.toHaveClass(
      "md:h-24",
      "sm:px-6",
      "lg:gap-8",
    );
    expect(primaryNavigation).not.toBeNull();
    expect(primaryNavigation).toHaveClass(
      "hidden",
      "self-stretch",
      "md:block",
    );
    expect(primaryNavigation?.firstElementChild).toHaveClass("h-full");
    expect(
      primaryNavigation?.querySelector('a[href="/dashboard"]'),
    ).toHaveClass("md:h-full", "md:min-h-16");
    expect(primaryList).toHaveClass(
      "[&>li>a]:!font-body-sm",
      "[&>li>a]:!text-body-sm",
      "[&>li>a]:!font-medium",
      "[&>li>a]:!leading-body-sm",
      "[&>li>a[aria-current]]:!font-bold",
      "[&>li>button[aria-pressed=true]]:!font-bold",
    );
    expect(menuButton).toHaveClass(
      "h-8",
      "w-8",
      "p-[3px]",
      "md:hidden",
    );
    expect(menuButton.querySelector("svg")).toHaveClass(
      "h-[18px]",
      "w-[18px]",
    );
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute(
      "aria-controls",
      document.querySelector("dialog")?.id,
    );
    expect(sectionNavigation).toHaveClass("h-10");
    expect(sectionNavigation.firstElementChild).toHaveClass(
      "h-full",
      "px-4",
      "md:px-10",
    );
    expect(sectionList).toHaveClass(
      "!h-10",
      "scrollbar-hide",
      "overflow-x-auto",
      "whitespace-nowrap",
      "[&>li>a]:!h-10",
      "[&>li>a]:!py-0",
      "[&>li>a]:!text-[13px]",
      "[&>li>a]:!font-medium",
      "[&>li>button]:!h-10",
      "[&>li>button]:!py-0",
      "[&>li>button]:!text-[13px]",
      "[&>li>button]:!font-medium",
      "[&>li>a[aria-current]]:!font-semibold",
      "[&>li>button[aria-pressed=true]]:!font-semibold",
    );
    expect(sectionNavigation).not.toHaveClass(
      "border-t",
      "border-border-secondary",
    );
    expect(activeSectionLink).toHaveAttribute("aria-current", "location");
    expect(
      within(sectionNavigation).queryByRole("button", {
        name: /^Sections:/,
      }),
    ).not.toBeInTheDocument();
    const notificationsButton = within(actionGroup).getByRole("button", {
      name: "Notifications",
    });

    expect(notificationsButton).toHaveClass(
      "h-8",
      "w-8",
      "p-[3px]",
      "focus-visible:ring-2",
    );
    expect(notificationsButton.querySelector("svg")).toHaveClass(
      "h-[18px]",
      "w-[18px]",
    );
  });

  it("opens a modal with focus on close and nests sections under the explicit parent", () => {
    renderHeader();
    const { dialog, opener } = openMobileMenu();
    const mobileNavigation = within(dialog).getByRole("navigation", {
      name: "Primary navigation",
    });
    const closeButton = within(dialog).getByRole("button", {
      name: "Close navigation menu",
    });
    const dashboard = within(mobileNavigation).getByRole("link", {
      name: "Dashboard",
    });
    const team = within(mobileNavigation).getByRole("link", {
      name: "Team",
    });
    const dashboardListItem = dashboard.closest("li");
    const summary = within(dashboardListItem!).getByRole("link", {
      name: "Summary",
    });
    const demand = within(dashboardListItem!).getByRole("link", {
      name: "Demand",
    });

    expect(dialog).toHaveAttribute("open");
    expect(opener).toHaveAttribute("aria-expanded", "true");
    expect(closeButton).toHaveFocus();
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(mobileNavigation).toHaveClass("py-4");
    expect(mobileNavigation).not.toHaveClass("px-3", "sm:px-6");
    expect(dashboard).toHaveAttribute("aria-current", "page");
    expect(dashboard).toHaveClass(
      "h-10",
      "rounded-none",
      "border-l-4",
      "px-4",
      "py-0",
      "bg-brand-primary-50",
      "font-body-sm",
      "text-body-sm",
      "leading-body-sm",
      "!font-bold",
    );
    expect(dashboard).not.toHaveClass("rounded-md");
    expect(team).toHaveClass("!font-medium");
    expect(dashboardListItem).not.toBeNull();
    expect(
      within(dashboardListItem!).getByRole("list", {
        name: "Dashboard sections",
      }),
    ).toContainElement(
      summary,
    );
    expect(summary).toHaveAttribute("aria-current", "location");
    expect(summary).toHaveClass(
      "h-10",
      "rounded-none",
      "border-l-4",
      "px-4",
      "py-0",
      "bg-brand-primary-50",
      "text-[13px]",
      "!font-semibold",
    );
    expect(summary).not.toHaveClass("rounded-md", "border-l-2");
    expect(demand).toHaveClass("text-[13px]", "!font-medium");
    expect(
      within(mobileNavigation)
        .getByRole("link", { name: "Team" })
        .closest("li"),
    ).not.toContainElement(
      within(dashboardListItem!).getByRole("link", { name: "Summary" }),
    );
  });

  it("restores focus to the hamburger after close or Escape", async () => {
    renderHeader();
    let mobileMenu = openMobileMenu();

    fireEvent.click(
      within(mobileMenu.dialog).getByRole("button", {
        name: "Close navigation menu",
      }),
    );

    expect(mobileMenu.opener).toHaveFocus();
    expect(mobileMenu.opener).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });

    mobileMenu = openMobileMenu();
    fireEvent(
      mobileMenu.dialog,
      new Event("cancel", { bubbles: false, cancelable: true }),
    );

    expect(mobileMenu.opener).toHaveFocus();
    expect(mobileMenu.dialog).not.toHaveAttribute("open");
  });

  it("contains forward and backward Tab navigation inside the dialog", () => {
    renderHeader();
    const { dialog } = openMobileMenu();
    const mobileLogo = within(dialog).getByRole("link", {
      name: "Cencora home",
    });
    const lastLink = within(dialog).getByRole("link", {
      name: "Calendar",
    });

    lastLink.focus();
    fireEvent.keyDown(lastLink, { key: "Tab" });
    expect(mobileLogo).toHaveFocus();

    mobileLogo.focus();
    fireEvent.keyDown(mobileLogo, { key: "Tab", shiftKey: true });
    expect(lastLink).toHaveFocus();
  });

  it("forwards handset intent and selection, then closes without forcing focus to the hamburger", async () => {
    const callbacks = renderHeader();
    const { dialog, opener } = openMobileMenu();
    const team = within(dialog).getByRole("link", { name: "Team" });
    Object.defineProperty(dialog, "close", {
      configurable: true,
      value: () => {
        dialog.removeAttribute("open");
        opener.focus();
      },
    });

    fireEvent.pointerEnter(team);
    fireEvent.click(team);

    expect(callbacks.onPrimaryIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team" }),
    );
    expect(callbacks.onPrimarySelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team" }),
      expect.anything(),
    );
    expect(dialog).not.toHaveAttribute("open");
    expect(opener).not.toHaveFocus();

    const reopened = openMobileMenu();
    const demand = within(reopened.dialog).getByRole("link", {
      name: "Demand",
    });

    fireEvent.focus(demand);
    fireEvent.click(demand);

    expect(callbacks.onSectionIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "demand" }),
    );
    expect(callbacks.onSectionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "demand" }),
      expect.anything(),
    );
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("keeps modified link activation open while forwarding the event", () => {
    const callbacks = renderHeader();
    const { dialog } = openMobileMenu();
    const team = within(dialog).getByRole("link", { name: "Team" });
    team.addEventListener("click", event => event.preventDefault());

    fireEvent.click(team, { ctrlKey: true });

    expect(callbacks.onPrimarySelect).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute("open");
  });

  it("closes without returning focus when the viewport reaches md", async () => {
    renderHeader();
    const { dialog, opener } = openMobileMenu();

    act(() => {
      desktopMatches = true;
      desktopListeners.forEach(listener =>
        listener({
          matches: true,
          media: "(min-width: 768px)",
        } as MediaQueryListEvent),
      );
    });

    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
    });
    expect(opener).toHaveAttribute("aria-expanded", "false");
    expect(opener).not.toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("forwards desktop navigation and action events", () => {
    const callbacks = renderHeader();
    const desktopPrimaryNavigation = document.querySelector<HTMLElement>(
      'header > div nav[aria-label="Primary navigation"]',
    );
    expect(desktopPrimaryNavigation).not.toBeNull();
    const team = within(desktopPrimaryNavigation!).getByRole("link", {
      name: "Team",
      hidden: true,
    });
    const demand = screen.getByRole("link", { name: "Demand" });
    const notifications = screen.getByRole("button", {
      name: "Notifications",
    });
    const settings = screen.getByRole("link", { name: "Settings" });
    const profile = screen.getByRole("button", { name: "Profile" });

    fireEvent.focus(team);
    fireEvent.click(team);
    fireEvent.pointerEnter(demand);
    fireEvent.click(demand);
    fireEvent.click(notifications);
    fireEvent.click(settings);
    fireEvent.click(profile);

    expect(callbacks.onPrimaryIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team" }),
    );
    expect(callbacks.onPrimarySelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team" }),
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

  it("renders disabled actions as inert native buttons", () => {
    const actions = [
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        disabled: true,
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        disabled: true,
      },
    ] satisfies readonly HeaderAction[];

    render(
      <MemoryRouter>
        <Header
          primaryNavigation={{
            items: primaryItems,
            activeId: "dashboard",
            ariaLabel: "Primary navigation",
            onSelect: jest.fn(),
          }}
          sectionNavigation={{
            items: sectionItems,
            activeId: "summary",
            ariaLabel: "Dashboard sections",
            onSelect: jest.fn(),
          }}
          sectionParentId="dashboard"
          actions={actions}
        />
      </MemoryRouter>,
    );

    for (const action of actions) {
      expect(
        screen.getByRole("button", { name: action.label }),
      ).toBeDisabled();
      expect(
        screen.queryByRole("link", { name: action.label }),
      ).not.toBeInTheDocument();
    }
  });

  it("uses custom mobile labels and preserves the logo destination in the handset", () => {
    render(
      <MemoryRouter>
        <Header
          primaryNavigation={{
            items: primaryItems,
            activeId: "dashboard",
            ariaLabel: "Global",
            onSelect: jest.fn(),
          }}
          sectionNavigation={{
            items: sectionItems,
            activeId: "summary",
            ariaLabel: "Sections",
            onSelect: jest.fn(),
          }}
          sectionParentId="dashboard"
          actions={[]}
          logoTo="/home"
          mobileMenuLabels={{
            close: "Close menu",
            dialog: "Site menu",
            open: "Open menu",
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    expect(
      within(dialog).getByRole("button", { name: "Close menu" }),
    ).toBeInTheDocument();
    const mobileLogo = within(dialog).getByRole("link", {
      name: "Cencora home",
    });
    expect(mobileLogo).toHaveAttribute("href", "/home");

    fireEvent.click(mobileLogo);

    expect(dialog).not.toHaveAttribute("open");
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).not.toHaveFocus();
  });
});
