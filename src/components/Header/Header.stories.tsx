import type { Meta, StoryObj } from "@storybook/react";
import {
  expect,
  fn,
  userEvent,
  waitFor,
  within,
} from "@storybook/test";
import { Bell, CircleUserRound, Settings } from "lucide-react";
import { MemoryRouter } from "react-router";
import { lightStoryTheme } from "../../stories/lightStoryTheme";
import type { NavbarItem } from "../Navbar";
import { Header, type HeaderAction } from "./Header";

const primaryItems = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
  { id: "team", label: "Team", to: "/team" },
  { id: "projects", label: "Projects", to: "/projects" },
  { id: "calendar", label: "Calendar", to: "/calendar" },
] satisfies readonly NavbarItem[];

const sectionItems = [
  { id: "summary", label: "Summary", to: "#summary" },
  { id: "demand", label: "Demand", to: "#demand" },
  { id: "orders", label: "Orders", to: "#orders" },
  { id: "suppliers", label: "Suppliers", to: "#suppliers" },
  { id: "inventory", label: "Inventory", to: "#inventory" },
  { id: "sales", label: "Sales", to: "#sales" },
  {
    id: "perfect-order",
    label: "Perfect Order",
    to: "#perfect-order",
  },
] satisfies readonly NavbarItem[];

const actions = [
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    onSelect: fn(),
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    to: "/settings",
    onSelect: fn(),
  },
  {
    id: "profile",
    label: "Profile",
    icon: CircleUserRound,
    onSelect: fn(),
  },
] satisfies readonly HeaderAction[];

const viewports = {
  mobile320: {
    name: "Mobile 320",
    styles: {
      width: "320px",
      height: "720px",
    },
  },
  tablet768: {
    name: "Tablet 768",
    styles: {
      width: "768px",
      height: "900px",
    },
  },
  desktop1440: {
    name: "Desktop 1440",
    styles: {
      width: "1440px",
      height: "900px",
    },
  },
};

const meta = {
  title: "Organisms/Header",
  component: Header,
  decorators: [
    Story => (
      <MemoryRouter initialEntries={["/dashboard#summary"]}>
        <div
          className="min-h-screen bg-ui-background-secondary"
          style={lightStoryTheme}
        >
          <Story />
          <main>
            <h1 className="sr-only">Header preview</h1>
          </main>
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    a11y: {
      test: "error",
    },
    layout: "fullscreen",
    viewport: {
      viewports,
    },
  },
  argTypes: {
    primaryNavigation: {
      control: false,
      description:
        "Controlled configuration for the desktop primary navigation.",
    },
    sectionNavigation: {
      control: false,
      description:
        "Controlled configuration for the persistent section navigation.",
    },
    actions: {
      control: false,
      description:
        "Ordered icon actions rendered at the end of the header.",
    },
  },
  args: {
    primaryNavigation: {
      items: primaryItems,
      activeId: "dashboard",
      ariaLabel: "Primary navigation",
      onIntent: fn(),
      onSelect: fn(),
    },
    sectionNavigation: {
      items: sectionItems,
      activeId: "summary",
      ariaLabel: "Dashboard sections",
      ariaCurrent: "location",
      onIntent: fn(),
      onSelect: fn(),
    },
    actions,
    actionsAriaLabel: "Header actions",
    logoAriaLabel: "Cencora home",
    logoTo: "/",
    sectionParentId: "dashboard",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop1440: Story = {
  parameters: {
    viewport: {
      defaultViewport: "desktop1440",
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("navigation", { name: "Dashboard sections" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Summary" }),
    ).toHaveAttribute("aria-current", "location");

    const header = canvasElement.querySelector("header");
    const upperSection = header?.firstElementChild as HTMLElement | null;
    const logo = canvas.getByRole("link", {
      name: "Cencora home",
    });
    const primaryNavigation = canvas.getByRole("navigation", {
      name: "Primary navigation",
    });
    const activePrimaryLink = within(primaryNavigation).getByRole("link", {
      name: "Dashboard",
    });
    const inactivePrimaryLink = within(primaryNavigation).getByRole("link", {
      name: "Team",
    });
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const activeSectionLink = within(sectionNavigation).getByRole("link", {
      name: "Summary",
    });
    const inactiveSectionLink = within(sectionNavigation).getByRole("link", {
      name: "Demand",
    });

    await waitFor(() => {
      expect(upperSection).not.toBeNull();

      const upperRect = upperSection!.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const activeRect = activePrimaryLink.getBoundingClientRect();
      const sectionRect = sectionNavigation.getBoundingClientRect();
      const activeSectionRect = activeSectionLink.getBoundingClientRect();
      const view = canvasElement.ownerDocument.defaultView;
      const upperStyles = view?.getComputedStyle(upperSection!);
      const sectionInner = sectionNavigation.firstElementChild as HTMLElement;
      const sectionInnerStyles = view?.getComputedStyle(sectionInner);
      const activePrimaryStyles = view?.getComputedStyle(activePrimaryLink);
      const inactivePrimaryStyles = view?.getComputedStyle(
        inactivePrimaryLink,
      );
      const activeSectionStyles = view?.getComputedStyle(activeSectionLink);
      const inactiveSectionStyles = view?.getComputedStyle(
        inactiveSectionLink,
      );
      const sectionUnderline = view?.getComputedStyle(
        activeSectionLink,
        "::after",
      );

      expect(upperRect.height).toBeCloseTo(64, 0);
      expect(sectionRect.height).toBeCloseTo(40, 0);
      expect(activeSectionRect.height).toBeCloseTo(40, 0);
      expect(upperStyles?.paddingLeft).toBe("16px");
      expect(upperStyles?.paddingRight).toBe("16px");
      expect(sectionInnerStyles?.paddingLeft).toBe("40px");
      expect(sectionInnerStyles?.paddingRight).toBe("40px");
      expect(activePrimaryStyles?.fontSize).toBe("14px");
      expect(activePrimaryStyles?.fontFamily).toContain("Cencora-Gilroy");
      expect(activePrimaryStyles?.fontWeight).toBe("700");
      expect(activePrimaryStyles?.lineHeight).toBe("20px");
      expect(inactivePrimaryStyles?.fontWeight).toBe("500");
      expect(activeSectionStyles?.fontSize).toBe("13px");
      expect(activeSectionStyles?.fontWeight).toBe("600");
      expect(inactiveSectionStyles?.fontSize).toBe("13px");
      expect(inactiveSectionStyles?.fontWeight).toBe("500");
      expect(activeRect.left - logoRect.right).toBeCloseTo(16, 0);
      expect(Math.abs(activeRect.height - upperRect.height)).toBeLessThanOrEqual(
        1,
      );
      expect(Math.abs(activeRect.bottom - sectionRect.top)).toBeLessThanOrEqual(
        1,
      );
      expect(
        Math.abs(activeSectionRect.bottom - sectionRect.bottom),
      ).toBeLessThanOrEqual(1);
      expect(
        canvasElement.ownerDocument.defaultView?.getComputedStyle(
          sectionNavigation,
        ).borderTopWidth,
      ).toBe("0px");
      expect(sectionUnderline?.height).toBe("2px");
      expect(sectionUnderline?.backgroundColor).not.toBe(
        "rgba(0, 0, 0, 0)",
      );
    });

    await userEvent.click(
      canvas.getByRole("button", { name: "Notifications" }),
    );
    await expect(args.actions[0].onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notifications" }),
      expect.anything(),
    );
  },
};

export const Tablet768: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet768",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const logo = canvas.getByRole("link", {
      name: "Cencora home",
    });
    const primaryNavigation = canvas.getByRole("navigation", {
      name: "Primary navigation",
    });
    const firstPrimaryLink = within(primaryNavigation).getByRole("link", {
      name: "Dashboard",
    });
    const sectionInner = sectionNavigation.firstElementChild as HTMLElement;
    const sectionInnerStyles =
      canvasElement.ownerDocument.defaultView?.getComputedStyle(sectionInner);

    await expect(primaryNavigation).toBeVisible();
    await expect(sectionNavigation).toBeVisible();
    await expect(sectionInnerStyles?.paddingLeft).toBe("40px");
    await expect(sectionInnerStyles?.paddingRight).toBe("40px");
    await expect(
      firstPrimaryLink.getBoundingClientRect().left -
        logo.getBoundingClientRect().right,
    ).toBeCloseTo(16, 0);
  },
};

export const Mobile320: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile320",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentElement = canvasElement.ownerDocument.documentElement;
    const mobileViewport =
      canvasElement.ownerDocument.defaultView?.matchMedia(
        "(max-width: 767px)",
      ).matches ?? false;
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const sectionInner = sectionNavigation.firstElementChild as HTMLElement;
    const sectionInnerStyles =
      canvasElement.ownerDocument.defaultView?.getComputedStyle(sectionInner);
    const upperSection = canvasElement.querySelector<HTMLElement>(
      "header > div",
    );
    const menuButton = canvasElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Open navigation menu"]',
    );

    await expect(menuButton).not.toBeNull();
    await expect(upperSection).not.toBeNull();

    if (mobileViewport) {
      await expect(menuButton).toBeVisible();
      await expect(menuButton).toHaveAttribute("aria-expanded", "false");
      await expect(
        canvas.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument();
    }

    await expect(sectionNavigation).toBeVisible();
    await expect(
      within(sectionNavigation).queryByRole("button", {
        name: /^Sections:/,
      }),
    ).not.toBeInTheDocument();
    await expect(
      within(sectionNavigation).getByRole("list"),
    ).toHaveClass("overflow-x-auto", "whitespace-nowrap");
    await expect(upperSection!.getBoundingClientRect().height).toBeCloseTo(
      64,
      0,
    );
    await expect(
      sectionNavigation.getBoundingClientRect().height,
    ).toBeCloseTo(40, 0);
    await expect(sectionInnerStyles?.paddingLeft).toBe("16px");
    await expect(sectionInnerStyles?.paddingRight).toBe("16px");
    await expect(documentElement.scrollWidth).toBeLessThanOrEqual(
      documentElement.clientWidth,
    );
  },
};

export const MobileMenuOpen: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile320",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mobileViewport =
      canvasElement.ownerDocument.defaultView?.matchMedia(
        "(max-width: 767px)",
      ).matches ?? false;

    if (!mobileViewport) {
      return;
    }

    const menuButton = canvas.getByRole("button", {
      name: "Open navigation menu",
    });

    await userEvent.click(menuButton);

    const dialog = canvas.getByRole("dialog", {
      name: "Navigation menu",
    });
    const dialogCanvas = within(dialog);
    const closeButton = dialogCanvas.getByRole("button", {
      name: "Close navigation menu",
    });
    const primaryNavigation = dialogCanvas.getByRole("navigation", {
      name: "Primary navigation",
    });
    const dashboardLink = within(primaryNavigation).getByRole("link", {
      name: "Dashboard",
    });
    const dashboardItem = dashboardLink.closest("li");
    const summaryLink = within(dashboardItem!).getByRole("link", {
      name: "Summary",
    });

    await expect(dialog).toBeVisible();
    await expect(closeButton).toHaveFocus();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(dashboardItem).not.toBeNull();
    await expect(summaryLink).toHaveAttribute("aria-current", "location");

    const dashboardStyles =
      canvasElement.ownerDocument.defaultView?.getComputedStyle(
        dashboardLink,
      );
    const summaryStyles =
      canvasElement.ownerDocument.defaultView?.getComputedStyle(
        summaryLink,
      );
    const navigationRect = primaryNavigation.getBoundingClientRect();
    const dashboardRect = dashboardLink.getBoundingClientRect();
    const summaryRect = summaryLink.getBoundingClientRect();

    await expect(dashboardRect.height).toBeCloseTo(40, 0);
    await expect(dashboardRect.left).toBeCloseTo(navigationRect.left, 0);
    await expect(dashboardRect.right).toBeCloseTo(navigationRect.right, 0);
    await expect(dashboardStyles?.borderLeftWidth).toBe("4px");
    await expect(dashboardStyles?.borderRadius).toBe("0px");
    await expect(dashboardStyles?.backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    await expect(summaryRect.height).toBeCloseTo(40, 0);
    await expect(summaryStyles?.borderLeftWidth).toBe("4px");
    await expect(summaryStyles?.borderRadius).toBe("0px");
    await expect(summaryStyles?.backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
  },
};

export const MobileLastActive: Story = {
  args: {
    sectionNavigation: {
      items: sectionItems,
      activeId: "perfect-order",
      ariaLabel: "Dashboard sections",
      ariaCurrent: "location",
      onIntent: fn(),
      onSelect: fn(),
    },
    sectionParentId: "dashboard",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile320",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const sectionCanvas = within(sectionNavigation);
    const list = sectionCanvas.getByRole("list");
    const activeLink = sectionCanvas.getByRole("link", {
      name: "Perfect Order",
    });
    const mobileViewport =
      canvasElement.ownerDocument.defaultView?.matchMedia(
        "(max-width: 767px)",
      ).matches ?? false;

    await waitFor(() => {
      const listRect = list.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();

      expect(activeRect.left).toBeGreaterThanOrEqual(listRect.left - 1);
      expect(activeRect.right).toBeLessThanOrEqual(listRect.right + 1);
    });

    if (mobileViewport) {
      await expect(list.scrollLeft).toBeGreaterThan(0);
    }

    await expect(activeLink).toHaveAttribute(
      "aria-current",
      "location",
    );
  },
};
