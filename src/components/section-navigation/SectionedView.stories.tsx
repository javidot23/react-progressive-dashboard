import type { Meta, StoryObj } from "@storybook/react";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "@storybook/test";
import { Bell, CircleUserRound, Settings } from "lucide-react";
import { useCallback, useRef, useState, type RefCallback } from "react";
import { MemoryRouter } from "react-router";
import { lightStoryTheme } from "../../stories/lightStoryTheme";
import { Header, type HeaderAction } from "../Header";
import { isUnmodifiedPrimaryClick, type NavbarItem } from "../Navbar";
import { SectionedView } from "./SectionedView";
import type { SectionedViewProps } from "./types";

type ReportAreaId = "dashboard" | "operations" | "reports";

type ReportSectionId =
  | "summary"
  | "demand"
  | "orders"
  | "suppliers"
  | "inventory"
  | "sales"
  | "overview"
  | "performance"
  | "exceptions";

type ReportSection = {
  slug: ReportSectionId;
  title: string;
};

type ReportNavigationGroup = {
  id: ReportAreaId;
  label: string;
  sections: readonly ReportSection[];
};

type StoryDocumentation = {
  title: string;
  summary: string;
  expectedResult: string;
};

type StoryArgs = SectionedViewProps<ReportSectionId, ReportSection> & {
  storyDocumentation: StoryDocumentation;
};

const dashboardSections = [
  { slug: "summary", title: "Summary" },
  { slug: "demand", title: "Demand" },
  { slug: "orders", title: "Orders" },
] satisfies readonly ReportSection[];

const navigationGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    sections: dashboardSections,
  },
  {
    id: "operations",
    label: "Operations",
    sections: [
      { slug: "suppliers", title: "Suppliers" },
      { slug: "inventory", title: "Inventory" },
      { slug: "sales", title: "Sales" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    sections: [
      { slug: "overview", title: "Overview" },
      { slug: "performance", title: "Performance" },
      { slug: "exceptions", title: "Exceptions" },
    ],
  },
] satisfies readonly ReportNavigationGroup[];

const primaryNavigationItems = navigationGroups.map((group) => ({
  id: group.id,
  label: group.label,
  to: `/${group.id}#${group.sections[0].slug}`,
})) satisfies readonly NavbarItem[];

const headerActions = [
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

function getReportSectionId(section: ReportSection) {
  return section.slug;
}

function getNavigationGroup(id: ReportAreaId) {
  return navigationGroups.find((group) => group.id === id)!;
}

function unusedSectionRef(): RefCallback<HTMLElement> {
  return () => undefined;
}

function SectionedViewHarness(args: StoryArgs) {
  const [activePrimaryId, setActivePrimaryId] =
    useState<ReportAreaId>("dashboard");
  const [activeId, setActiveId] = useState<ReportSectionId>(args.activeId);
  const sectionNodes = useRef(new Map<ReportSectionId, HTMLElement>());
  const sectionRefCallbacks = useRef(
    new Map<ReportSectionId, RefCallback<HTMLElement>>(),
  );
  const activeGroup = getNavigationGroup(activePrimaryId);
  const currentSections =
    activePrimaryId === "dashboard" ? args.sections : activeGroup.sections;
  const activeSection = currentSections.find(
    (section) => section.slug === activeId,
  );
  const sectionNavigationItems = currentSections.map((section) => ({
    id: section.slug,
    label: section.title,
    to: `/${activePrimaryId}#${section.slug}`,
  }));

  const getSectionRef = useCallback((id: ReportSectionId) => {
    let callback = sectionRefCallbacks.current.get(id);

    if (!callback) {
      callback = (node) => {
        if (node) {
          sectionNodes.current.set(id, node);
        } else {
          sectionNodes.current.delete(id);
        }
      };
      sectionRefCallbacks.current.set(id, callback);
    }

    return callback;
  }, []);

  return (
    <>
      <aside
        aria-label="Story guide"
        className="border-b border-violet-200 bg-violet-50 px-6 py-5 text-slate-900"
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
            Story guide
          </p>
          <p className="mt-1 text-lg font-bold">
            {args.storyDocumentation.title}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-700">
            {args.storyDocumentation.summary}
          </p>
          <p className="mt-3 text-sm text-slate-800">
            <span className="font-semibold">Expected result:</span>{" "}
            {args.storyDocumentation.expectedResult}
          </p>
        </div>
      </aside>

      <SectionedView
        sections={currentSections}
        activeId={activeId}
        isProgrammaticScrolling={args.isProgrammaticScrolling}
        getSectionId={args.getSectionId}
        getSectionRef={getSectionRef}
        renderHeader={() => (
          <>
            <Header
              primaryNavigation={{
                items: primaryNavigationItems,
                activeId: activePrimaryId,
                ariaLabel: "Primary navigation",
                onSelect: (item, event) => {
                  if (!isUnmodifiedPrimaryClick(event)) return;

                  const nextGroup = getNavigationGroup(item.id);
                  const nextSections =
                    nextGroup.id === "dashboard"
                      ? args.sections
                      : nextGroup.sections;

                  setActivePrimaryId(nextGroup.id);
                  setActiveId(nextSections[0].slug);
                },
              }}
              sectionNavigation={{
                items: sectionNavigationItems,
                activeId,
                ariaLabel: `${activeGroup.label} sections`,
                ariaCurrent: "location",
                onSelect: (item, event) => {
                  if (!isUnmodifiedPrimaryClick(event)) return;

                  setActiveId(item.id);
                },
              }}
              sectionParentId={activePrimaryId}
              actions={headerActions}
              className="sticky top-0 z-20"
            />

            {args.renderHeader?.()}
          </>
        )}
        renderNavigation={({ isProgrammaticScrolling }) => {
          const contentLabel =
            typeof args.contentProps?.["aria-label"] === "string"
              ? args.contentProps["aria-label"]
              : "Unlabelled";

          return (
            <div
              data-testid="navigation-context"
              data-programmatic={String(isProgrammaticScrolling)}
              className="border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur"
            >
              <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4">
                <p className="max-w-md text-xs text-slate-600">
                  Select a Header destination to update the consumer-owned group
                  and section state.
                </p>
                <div
                  role="status"
                  aria-live="polite"
                  className="max-w-full rounded-lg bg-slate-900 px-4 py-3 text-white shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
                    Live state
                  </p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-300">Active group</dt>
                    <dd className="font-semibold">{activeGroup.label}</dd>
                    <dt className="text-slate-300">Active section</dt>
                    <dd className="font-semibold">{activeSection?.title}</dd>
                    <dt className="text-slate-300">Scroll mode</dt>
                    <dd className="font-semibold">
                      {isProgrammaticScrolling ? "Programmatic" : "Manual"}
                    </dd>
                    <dt className="text-slate-300">Content wrapper</dt>
                    <dd className="font-semibold">
                      <code>{`<${args.contentAs ?? "div"}>`}</code> ·{" "}
                      {contentLabel}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        }}
        contentAs={args.contentAs}
        contentProps={args.contentProps}
        rootClassName={args.rootClassName}
        contentClassName={args.contentClassName}
        renderSection={(
          section,
          { id, index, isActive, isProgrammaticScrolling, sectionRef },
        ) => (
          <article
            ref={sectionRef}
            aria-labelledby={`${id}-heading`}
            data-active={String(isActive)}
            data-index={index}
            data-programmatic={String(isProgrammaticScrolling)}
            data-section-id={id}
            className={[
              "rounded-xl border bg-white p-8 shadow-sm",
              isActive
                ? "border-violet-500 ring-2 ring-violet-100"
                : "border-slate-200",
            ].join(" ")}
          >
            <h2
              id={`${id}-heading`}
              className="text-sm font-semibold uppercase tracking-wide text-violet-700"
            >
              {section.title}
            </h2>
            <div className="w-full rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-24 w-full rounded-xl bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
                <div className="h-10 w-24 rounded-lg bg-gray-200" />
              </div>
            </div>
          </article>
        )}
      />
    </>
  );
}

const meta = {
  title: "Templates/SectionedView",
  component: SectionedView,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/dashboard#summary"]}>
        <div
          data-sectioned-view-story-theme="light"
          className="min-h-screen text-ui-text-primary"
          style={lightStoryTheme}
        >
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  render: (args) => <SectionedViewHarness key={args.activeId} {...args} />,
  parameters: {
    a11y: {
      test: "error",
    },
    layout: "fullscreen",
  },
  argTypes: {
    storyDocumentation: {
      control: false,
      table: {
        disable: true,
      },
    },
    sections: {
      description:
        "Current ordered section collection. The harness supplies the active group's three sections and replaces the collection when the primary Header destination changes.",
      control: false,
      table: {
        category: "Data and state",
        type: { summary: "readonly TSection[]" },
      },
    },
    activeId: {
      description:
        "Initial active section ID for the Dashboard group. The harness continues to control it after Header selections.",
      control: "select",
      options: dashboardSections.map((section) => section.slug),
      table: {
        category: "Data and state",
        type: { summary: "TId" },
      },
    },
    isProgrammaticScrolling: {
      description:
        "Indicates that a controlled scroll transaction is in progress. Renderers can use it to suspend viewport-driven behavior or expose a progress state.",
      control: "boolean",
      table: {
        category: "Data and state",
        type: { summary: "boolean" },
      },
    },
    getSectionId: {
      description:
        "Returns the stable string ID for a section. IDs are used for React keys, active-state comparison, render context, and ref registration.",
      control: false,
      table: {
        category: "Identity and refs",
        type: { summary: "(section: TSection) => TId" },
      },
    },
    getSectionRef: {
      description:
        "Returns the ref callback assigned to a section's root element. Navigation controllers use these nodes for observation and programmatic scrolling.",
      control: false,
      table: {
        category: "Identity and refs",
        type: {
          summary: "(id: TId) => RefCallback<HTMLElement>",
        },
      },
    },
    renderHeader: {
      description:
        "Optional page-level content composed after the shared Header. The harness uses it for the visually hidden page heading.",
      control: false,
      table: {
        category: "Render slots",
        type: { summary: "() => ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    renderNavigation: {
      description:
        "Required render slot that receives the active ID, scroll phase, and active ordered section collection. The harness uses it for controlled-state diagnostics because Header already presents navigation.",
      control: false,
      table: {
        category: "Render slots",
        type: {
          summary:
            "(context: NavigationRenderContext<TId, TSection>) => ReactNode",
        },
      },
    },
    renderSection: {
      description:
        "Required render slot called once for each section in the active group. Its context contains the ID, index, active state, scroll state, and section ref.",
      control: false,
      table: {
        category: "Render slots",
        type: {
          summary:
            "(section: TSection, context: SectionRenderContext<TId>) => ReactNode",
        },
      },
    },
    contentAs: {
      description:
        "Semantic element used to wrap the active group's three rendered sections.",
      control: "inline-radio",
      options: ["div", "main", "section"],
      table: {
        category: "Semantics and styling",
        type: { summary: '"div" | "main" | "section"' },
        defaultValue: { summary: '"div"' },
      },
    },
    contentProps: {
      description:
        "Additional HTML attributes for the content wrapper, excluding children and className.",
      control: "object",
      table: {
        category: "Semantics and styling",
        type: {
          summary:
            'Omit<HTMLAttributes<HTMLElement>, "children" | "className">',
        },
        defaultValue: { summary: "undefined" },
      },
    },
    rootClassName: {
      description: "Classes applied to the complete SectionedView composition.",
      control: "text",
      table: {
        category: "Semantics and styling",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    contentClassName: {
      description:
        "Classes applied only to the active group's section wrapper.",
      control: "text",
      table: {
        category: "Semantics and styling",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
  },
  args: {
    storyDocumentation: {
      title: "Header-controlled section groups",
      summary:
        "Header owns two navigation levels while this harness controls the active group, active section, and collection passed to SectionedView.",
      expectedResult:
        "Dashboard and Summary are active, and only Summary, Demand, and Orders are rendered.",
    },
    sections: dashboardSections,
    activeId: "summary",
    isProgrammaticScrolling: false,
    getSectionId: getReportSectionId,
    getSectionRef: unusedSectionRef,
    renderHeader: () => <h1 className="sr-only">Sectioned dashboard</h1>,
    renderNavigation: () => null,
    renderSection: () => null,
    contentAs: "main",
    contentProps: {
      "aria-label": "Current area sections",
    },
    rootClassName: "bg-slate-50",
    contentClassName: "mx-auto grid max-w-4xl gap-6 px-6 py-8",
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The baseline controlled composition. Header marks Dashboard and Summary as current while SectionedView renders only Summary, Demand, and Orders.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvas.getByRole("main", {
      name: "Current area sections",
    });
    const primaryNavigation = canvas.getByRole("navigation", {
      name: "Primary navigation",
    });
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const renderedSections = within(content).getAllByRole("article");
    const dashboardLink = within(primaryNavigation).getByRole("link", {
      name: "Dashboard",
    });
    const summaryLink = within(sectionNavigation).getByRole("link", {
      name: "Summary",
    });
    const demandLink = within(sectionNavigation).getByRole("link", {
      name: "Demand",
    });

    await expect(
      canvas.getByRole("heading", {
        level: 1,
        name: "Sectioned dashboard",
      }),
    ).toBeInTheDocument();
    await expect(within(primaryNavigation).getAllByRole("link")).toHaveLength(
      3,
    );
    await expect(within(sectionNavigation).getAllByRole("link")).toHaveLength(
      3,
    );
    await expect(
      renderedSections.map((section) => section.dataset.sectionId),
    ).toEqual(["summary", "demand", "orders"]);
    await expect(dashboardLink).toHaveAttribute("aria-current", "page");
    await expect(summaryLink).toHaveAttribute("aria-current", "location");
    await expect(
      canvas.getByRole("article", { name: "Summary" }),
    ).toHaveAttribute("data-active", "true");
    await expect(canvas.getAllByRole("link", { current: "page" })).toHaveLength(
      1,
    );
    await expect(
      canvas.getAllByRole("link", { current: "location" }),
    ).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active group\s*Dashboard/,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active section\s*Summary/,
    );

    await userEvent.hover(demandLink);

    const lightPreview = canvasElement.querySelector<HTMLElement>(
      '[data-sectioned-view-story-theme="light"]',
    );
    const view = canvasElement.ownerDocument.defaultView;

    await expect(lightPreview).not.toBeNull();
    await expect(demandLink).toHaveClass("hover:text-ui-text-primary");
    await expect(view?.getComputedStyle(lightPreview!).colorScheme).toBe(
      "light",
    );
  },
};

export const InteractiveNavigation: Story = {
  args: {
    storyDocumentation: {
      title: "Controlled group and section navigation",
      summary:
        "The primary Header destination replaces the controlled section collection; the secondary destination updates the active article.",
      expectedResult:
        "The play function opens Operations, resets to Suppliers, then selects Sales.",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Selects Operations through Header, verifies its three associated sections, and then selects Sales without changing the active primary destination.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvas.getByRole("main", {
      name: "Current area sections",
    });
    const operationsLink = canvas.getByRole("link", {
      name: "Operations",
    });

    await userEvent.click(operationsLink);

    const operationsNavigation = canvas.getByRole("navigation", {
      name: "Operations sections",
    });
    const suppliersLink = within(operationsNavigation).getByRole("link", {
      name: "Suppliers",
    });
    const salesLink = within(operationsNavigation).getByRole("link", {
      name: "Sales",
    });

    await expect(operationsLink).toHaveAttribute("aria-current", "page");
    await expect(suppliersLink).toHaveAttribute("aria-current", "location");
    await expect(
      within(operationsNavigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Suppliers", "Inventory", "Sales"]);
    await expect(
      within(content)
        .getAllByRole("article")
        .map((section) => section.dataset.sectionId),
    ).toEqual(["suppliers", "inventory", "sales"]);
    await expect(
      canvas.getByRole("article", { name: "Suppliers" }),
    ).toHaveAttribute("data-active", "true");
    await expect(
      canvas.queryByRole("article", { name: "Summary" }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active group\s*Operations/,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active section\s*Suppliers/,
    );

    await userEvent.click(salesLink);

    await expect(operationsLink).toHaveAttribute("aria-current", "page");
    await expect(salesLink).toHaveAttribute("aria-current", "location");
    await expect(suppliersLink).not.toHaveAttribute("aria-current");
    await expect(
      canvas.getByRole("article", { name: "Sales" }),
    ).toHaveAttribute("data-active", "true");
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active section\s*Sales/,
    );
  },
};

export const ProgrammaticScrolling: Story = {
  args: {
    storyDocumentation: {
      title: "Programmatic scroll propagation",
      summary:
        "Dashboard remains active with Demand selected while a controlled scroll transaction is in progress.",
      expectedResult:
        "Header and Live state report Demand, and all three Dashboard articles receive the programmatic state.",
    },
    activeId: "demand",
    isProgrammaticScrolling: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the Header-integrated composition during a controller-driven scroll. SectionedView forwards the phase without owning navigation or scrolling.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigationContext = canvas.getByTestId("navigation-context");
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Dashboard sections",
    });

    await expect(navigationContext).toHaveAttribute(
      "data-programmatic",
      "true",
    );
    await expect(
      within(sectionNavigation).getByRole("link", { name: "Demand" }),
    ).toHaveAttribute("aria-current", "location");
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active group\s*Dashboard/,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active section\s*Demand/,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Scroll mode\s*Programmatic/,
    );

    for (const section of canvas.getAllByRole("article")) {
      await expect(section).toHaveAttribute("data-programmatic", "true");
    }
  },
};

export const SemanticSectionContainer: Story = {
  args: {
    storyDocumentation: {
      title: "Semantic section wrapper",
      summary:
        "Only the content container semantics change; Header and the controlled Dashboard collection remain the same.",
      expectedResult:
        "The Live state reports <section> · Report collection and the named region contains exactly the three Dashboard articles.",
    },
    contentAs: "section",
    contentProps: {
      "aria-label": "Report collection",
      id: "semantic-content",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses contentAs="section" with a named region while retaining the same Header-controlled navigation and three active-group articles.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvas.getByRole("region", {
      name: "Report collection",
    });

    await expect(content.tagName).toBe("SECTION");
    await expect(content).toHaveAttribute("id", "semantic-content");
    await expect(
      within(content)
        .getAllByRole("article")
        .map((section) => section.dataset.sectionId),
    ).toEqual(["summary", "demand", "orders"]);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Content wrapper\s*<section>\s*· Report collection/,
    );
  },
};

export const MobileHeaderNavigation: Story = {
  args: {
    storyDocumentation: {
      title: "Handset group navigation",
      summary:
        "Header exposes all three primary destinations and nests only the active group's three sections inside its handset dialog.",
      expectedResult:
        "The play function changes to Operations, resets to Suppliers, verifies the horizontal row, then confirms the handset nesting and Escape focus return.",
    },
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const view = canvasElement.ownerDocument.defaultView;
    const mobileViewport =
      view?.matchMedia("(max-width: 767px)").matches ?? false;

    if (!mobileViewport) {
      return;
    }

    const opener = canvas.getByRole("button", {
      name: "Open navigation menu",
    });

    await userEvent.click(opener);

    let dialog = canvas.getByRole("dialog", {
      name: "Navigation menu",
    });
    let dialogCanvas = within(dialog);
    const closeButton = dialogCanvas.getByRole("button", {
      name: "Close navigation menu",
    });
    const primaryNavigation = dialogCanvas.getByRole("navigation", {
      name: "Primary navigation",
    });
    const dashboardItem = within(primaryNavigation)
      .getByRole("link", { name: "Dashboard" })
      .closest("li");

    await expect(closeButton).toHaveFocus();
    await expect(
      within(primaryNavigation).getAllByRole("link", {
        current: "page",
      }),
    ).toHaveLength(1);
    await expect(dashboardItem).not.toBeNull();
    await expect(
      within(dashboardItem!).getByRole("list", {
        name: "Dashboard sections",
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(primaryNavigation).getByRole("link", {
        name: "Operations",
      }),
    );

    await waitFor(() => {
      expect(
        canvas.queryByRole("dialog", { name: "Navigation menu" }),
      ).not.toBeInTheDocument();
    });

    const operationsNavigation = canvas.getByRole("navigation", {
      name: "Operations sections",
    });
    const operationsList = within(operationsNavigation).getByRole("list");

    await expect(
      within(operationsNavigation).getByRole("link", {
        name: "Suppliers",
      }),
    ).toHaveAttribute("aria-current", "location");
    await expect(operationsList).toHaveClass(
      "overflow-x-auto",
      "scrollbar-hide",
      "whitespace-nowrap",
    );
    await expect(
      canvas.getByRole("article", { name: "Suppliers" }),
    ).toHaveAttribute("data-active", "true");
    await expect(
      canvasElement.ownerDocument.documentElement.scrollWidth,
    ).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );

    await userEvent.click(opener);

    dialog = canvas.getByRole("dialog", {
      name: "Navigation menu",
    });
    dialogCanvas = within(dialog);
    const operationsItem = dialogCanvas
      .getByRole("link", { name: "Operations" })
      .closest("li");

    await expect(operationsItem).not.toBeNull();
    await expect(
      within(
        within(operationsItem!).getByRole("list", {
          name: "Operations sections",
        }),
      )
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Suppliers", "Inventory", "Sales"]);

    fireEvent(
      dialog,
      new Event("cancel", { bubbles: false, cancelable: true }),
    );

    await waitFor(() => {
      expect(opener).toHaveAttribute("aria-expanded", "false");
      expect(opener).toHaveFocus();
    });
  },
};
