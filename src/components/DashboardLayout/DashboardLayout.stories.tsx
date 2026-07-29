import type { Meta, StoryObj } from "@storybook/react";
import {
  expect,
  fn,
  userEvent,
  waitFor,
  within,
} from "@storybook/test";
import { useLayoutEffect } from "react";
import { MemoryRouter, useLocation } from "react-router";
import App from "../../App";
import { lightStoryTheme } from "../../stories/lightStoryTheme";
import type { NavbarItem } from "../Navbar";
import { DashboardLayout } from "./DashboardLayout";

const embeddedDashboardPreview =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("embed") === "true";

const previewSectionItems = [
  {
    id: "under-construction",
    label: "Under Construction",
    to: "/#under-construction",
  },
] satisfies readonly NavbarItem[];

const viewports = {
  mobile320: {
    name: "Mobile 320",
    styles: {
      width: "320px",
      height: "800px",
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

function LocationProbe() {
  const location = useLocation();

  return (
    <output
      data-testid="story-location"
      className="sr-only"
      aria-live="polite"
    >
      {location.pathname}
      {location.hash}
    </output>
  );
}

function RoutedDashboardStory({
  initialEntry,
}: {
  initialEntry: string;
}) {
  useLayoutEffect(() => {
    if (!embeddedDashboardPreview) {
      return;
    }

    const docsWindow = window.frameElement?.ownerDocument.defaultView;

    if (!docsWindow) {
      return;
    }

    let frameId: number | undefined;
    // Route focus can promote the iframe after Docs has already painted.
    let remainingFrames = 4;
    const resetDocsScroll = () => {
      docsWindow.scrollTo({ top: 0, left: 0, behavior: "auto" });
      remainingFrames -= 1;

      if (remainingFrames > 0) {
        frameId = docsWindow.requestAnimationFrame(resetDocsScroll);
      }
    };

    frameId = docsWindow.requestAnimationFrame(resetDocsScroll);

    return () => {
      if (frameId !== undefined) {
        docsWindow.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <App />
    </MemoryRouter>
  );
}

async function expectDisabledActions(canvas: ReturnType<typeof within>) {
  for (const label of ["Notifications", "Settings", "Profile"]) {
    await expect(
      canvas.getByRole("button", { name: label }),
    ).toBeDisabled();
    await expect(
      canvas.queryByRole("link", { name: label }),
    ).not.toBeInTheDocument();
  }
}

const meta = {
  title: "Templates/DashboardLayout",
  component: DashboardLayout,
  parameters: {
    a11y: {
      test: "error",
    },
    layout: "fullscreen",
    viewport: {
      viewports,
    },
  },
  decorators: [
    (Story) => (
      <div className="dashboard-layout-story" style={lightStoryTheme}>
        <style>
          {
            ".dashboard-layout-story header > nav svg { display: none; }"
          }
        </style>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    activePrimaryId: {
      control: "inline-radio",
      options: ["overview", "react", "plan", "manage"],
      description:
        "Controlled primary destination rendered as current in Header.",
    },
    sectionNavigation: {
      control: false,
      description:
        "Controlled secondary items, active ID, accessible label, and callbacks.",
    },
    onPrimarySelect: {
      control: false,
      description:
        "Optional consumer callback used by Manage to reset an active route to Summary.",
    },
    children: {
      control: false,
      description:
        "Page-owned content rendered immediately after the sticky Header.",
    },
  },
  args: {
    activePrimaryId: "overview",
    sectionNavigation: {
      items: previewSectionItems,
      activeId: "under-construction",
      ariaLabel: "Overview sections",
      ariaCurrent: "location",
      onSelect: fn(),
    },
    onPrimarySelect: fn(),
    children: (
      <main className="px-6 py-12">
        <h1>Dashboard layout preview</h1>
      </main>
    ),
  },
} satisfies Meta<typeof DashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveDashboard: Story = {
  render: () => (
    <RoutedDashboardStory initialEntry="/manage#summary" />
  ),
  parameters: {
    viewport: {
      defaultViewport: "desktop1440",
    },
  },
  play: embeddedDashboardPreview
    ? undefined
    : async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const header = canvas.getByRole("banner");
      const documentElement = canvasElement.ownerDocument.documentElement;

      await expect(header).toHaveClass("sticky", "top-0", "z-20");
      await expect(
        canvasElement.ownerDocument.defaultView?.getComputedStyle(header)
          .position,
      ).toBe("sticky");
      await expectDisabledActions(canvas);

      for (const [label, destination] of [
        ["Overview", "/#under-construction"],
        ["React", "/react#under-construction"],
        ["Plan", "/plan#under-construction"],
        ["Manage", "/manage#summary"],
      ] as const) {
        const primaryNavigation = canvas.getByRole("navigation", {
          name: "Primary navigation",
        });
        const link = within(primaryNavigation).getByRole("link", {
          name: label,
        });

        await userEvent.click(link);
        await waitFor(() => {
          expect(canvas.getByTestId("story-location")).toHaveTextContent(
            destination,
          );
        });
        await expect(
          canvas.getByRole("heading", { level: 1, name: label }),
        ).toHaveFocus();
        await expect(
          within(
            canvas.getByRole("navigation", {
              name: "Primary navigation",
            }),
          ).getAllByRole("link", { current: "page" }),
        ).toHaveLength(1);
      }

      const sectionNavigation = canvas.getByRole("navigation", {
        name: "Manage sections",
      });
      for (const icon of sectionNavigation.querySelectorAll("svg")) {
        await expect(icon).not.toBeVisible();
      }
      const sections = [
        ["summary", "Summary"],
        ["demand", "Demand"],
        ["orders", "Orders"],
        ["suppliers", "Suppliers"],
        ["inventory", "Inventory"],
        ["sales", "Sales"],
        ["perfect-order", "Perfect Order"],
      ] as const;

      await expect(
        within(sectionNavigation)
          .getAllByRole("link")
          .map((link) => link.textContent),
      ).toEqual(sections.map(([, label]) => label));

      for (const [id, label] of sections) {
        const link = within(sectionNavigation).getByRole("link", {
          name: label,
        });

        if (id !== "summary") {
          await userEvent.click(link);
        }

        await waitFor(() => {
          expect(canvas.getByTestId("story-location")).toHaveTextContent(
            `/manage#${id}`,
          );
        });
        await expect(link).toHaveAttribute(
          "aria-current",
          "location",
        );
        await expect(
          within(sectionNavigation).getAllByRole("link", {
            current: "location",
          }),
        ).toHaveLength(1);
      }

      await userEvent.click(
        within(
          canvas.getByRole("navigation", {
            name: "Primary navigation",
          }),
        ).getByRole("link", { name: "Manage" }),
      );
      await waitFor(() => {
        expect(canvas.getByTestId("story-location")).toHaveTextContent(
          "/manage#summary",
        );
      });
      await expect(
        within(sectionNavigation).getByRole("link", {
          name: "Summary",
        }),
      ).toHaveAttribute("aria-current", "location");
      await expect(documentElement.scrollWidth).toBeLessThanOrEqual(
        documentElement.clientWidth,
      );
    },
};
