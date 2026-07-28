import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useCallback, useRef, useState, type RefCallback } from "react";
import { MemoryRouter } from "react-router";
import { isUnmodifiedPrimaryClick, Navbar } from "../Navbar";
import { SectionedView } from "./SectionedView";
import type { SectionedViewProps } from "./types";

type ReportSectionId = "section1" | "section2" | "section3";

type ReportSection = {
  slug: ReportSectionId;
  title: string;
};

type StoryDocumentation = {
  title: string;
  summary: string;
  expectedResult: string;
};

type StoryArgs = SectionedViewProps<ReportSectionId, ReportSection> & {
  storyDocumentation: StoryDocumentation;
};

const reportSections = [
  {
    slug: "section1",
    title: "Section 1",
  },
  {
    slug: "section2",
    title: "Section 2",
  },
  {
    slug: "section3",
    title: "Section 3",
  },
] satisfies readonly ReportSection[];

function getReportSectionId(section: ReportSection) {
  return section.slug;
}

function unusedSectionRef(): RefCallback<HTMLElement> {
  return () => undefined;
}

function SectionedViewHarness(args: StoryArgs) {
  const [activeId, setActiveId] = useState(args.activeId);
  const sectionNodes = useRef(new Map<ReportSectionId, HTMLElement>());
  const sectionRefCallbacks = useRef(
    new Map<ReportSectionId, RefCallback<HTMLElement>>(),
  );

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
        sections={args.sections}
        activeId={activeId}
        isProgrammaticScrolling={args.isProgrammaticScrolling}
        getSectionId={args.getSectionId}
        getSectionRef={getSectionRef}
        renderHeader={args.renderHeader}
        contentAs={args.contentAs}
        contentProps={args.contentProps}
        rootClassName={args.rootClassName}
        contentClassName={args.contentClassName}
        renderNavigation={({
          activeId: navigationActiveId,
          isProgrammaticScrolling,
          sections,
        }) => {
          const activeSection = sections.find(
            (section) => args.getSectionId(section) === navigationActiveId,
          );
          const navigationItems = sections.map((section) => {
            const id = args.getSectionId(section);

            return {
              id,
              label: section.title,
              to: `#${id}`,
            };
          });
          const contentLabel =
            typeof args.contentProps?.["aria-label"] === "string"
              ? args.contentProps["aria-label"]
              : "Unlabelled";

          return (
            <div
              data-testid="navigation-context"
              data-programmatic={String(isProgrammaticScrolling)}
              className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur"
            >
              <Navbar
                items={navigationItems}
                activeId={navigationActiveId}
                ariaLabel="Report sections"
                ariaCurrent="location"
                innerClassName="mx-auto max-w-4xl"
                mobileLabel="Report section"
                onSelect={(item, event) => {
                  if (!isUnmodifiedPrimaryClick(event)) return;

                  event.preventDefault();
                  setActiveId(item.id);
                }}
              />

              <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4 border-t border-slate-100 pt-3">
                <p className="max-w-md text-xs text-slate-600">
                  Select a Navbar item to update the consumer-owned active
                  state.
                </p>
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-lg bg-slate-900 px-4 py-3 text-white shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
                    Live state
                  </p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
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
        renderSection={(
          _section,
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
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
              Section {index + 1}
            </p>
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
  title: "Components/SectionedView",
  component: SectionedView,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/reports#section1"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: (args) => <SectionedViewHarness key={args.activeId} {...args} />,
  parameters: {
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
        "Ordered collection rendered by the view. The item type is generic, and every item must resolve to a unique string ID through `getSectionId`.",
      control: false,
      table: {
        category: "Data and state",
        type: { summary: "readonly TSection[]" },
      },
    },
    activeId: {
      description:
        "ID of the active section. It is forwarded to both render contexts and must match one rendered section whenever `sections` is not empty.",
      control: "select",
      options: reportSections.map((section) => section.slug),
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
        "Optional slot rendered before navigation. Use it for a page heading or introductory content; omit it when the surrounding page already owns the header.",
      control: false,
      table: {
        category: "Render slots",
        type: { summary: "() => ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    renderNavigation: {
      description:
        "Required render slot for navigation or section controls. It receives the active ID, scroll phase, and complete ordered section collection.",
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
        "Required render slot called once per section. Its context contains the ID, index, active state, scroll phase, and ref callback that must be attached to the section root.",
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
        "Semantic element used to wrap all rendered sections. Choose `main` for the page's primary content or a named `section` for a subordinate region.",
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
        "Additional HTML attributes for the content wrapper, excluding `children` and `className`. Use it for accessible names, IDs, data attributes, or event handlers.",
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
      description:
        "Classes applied to the outer `<div>` that contains the optional header, navigation, and content wrapper. The component supplies no classes by default.",
      control: "text",
      table: {
        category: "Semantics and styling",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    contentClassName: {
      description:
        "Classes applied only to the content wrapper. Use this instead of `contentProps.className`, which is intentionally excluded from the public type.",
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
      title: "Default composition",
      summary:
        "The consumer supplies the header, navigation, section markup, and styles while SectionedView keeps their order and shared render context consistent.",
      expectedResult:
        "All three sections remain rendered and Section 1 is the single active section.",
    },
    sections: reportSections,
    activeId: "section1",
    isProgrammaticScrolling: false,
    getSectionId: getReportSectionId,
    getSectionRef: unusedSectionRef,
    renderHeader: () => (
      <header className="bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
            Storybook composition
          </p>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            SectionedView supplies structure and render context while the
            consumer owns presentation and behavior.
          </p>
        </div>
      </header>
    ),
    renderNavigation: () => null,
    renderSection: () => null,
    contentAs: "main",
    contentProps: {
      "aria-label": "Dashboard sections",
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
          "The baseline controlled composition. It renders the complete ordered collection, passes `section1` to the shared `Navbar` as the active item, and uses a named `main` as the content wrapper. Compare the other stories against this unchanged starting point.",
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvas.getByRole("main", {
      name: "Dashboard sections",
    });
    const renderedSections = within(content).getAllByRole("article");
    const activeSection = reportSections.find(
      (section) => section.slug === args.activeId,
    )!;
    const activeLink = canvas.getByRole("link", {
      name: activeSection.title,
    });

    await expect(
      canvas.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("navigation", { name: "Sectioned view navigation" }),
    ).toBeInTheDocument();
    await expect(
      renderedSections.map((section) => section.dataset.sectionId),
    ).toEqual(["section1", "section2", "section3"]);
    await expect(activeLink).toHaveAttribute("aria-current", "location");
    await expect(
      canvas.getByRole("article", { name: activeSection.title }),
    ).toHaveAttribute("data-active", "true");
    await expect(
      canvas.getAllByRole("link", { current: "location" }),
    ).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      new RegExp(`Active section\\s*${activeSection.title}`),
    );
  },
};

export const InteractiveNavigation: Story = {
  args: {
    storyDocumentation: {
      title: "Controlled interactive navigation",
      summary:
        "The shared Navbar reports selections to the consumer, which updates its controlled activeId. SectionedView reflects that value in both render contexts.",
      expectedResult:
        "The play function selects Section 3 automatically. Its Navbar link, article, and the Live state panel all become active; you can then select another section manually.",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates consumer-owned interaction with `Navbar`. The story starts on `section1`; its play function clicks **Section 3**, after which the external state is passed back as `activeId`. The visible Live state panel makes the automated interaction observable without opening the Interactions addon.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section1Link = canvas.getByRole("link", {
      name: "Section 1",
    });
    const section3Link = canvas.getByRole("link", {
      name: "Section 3",
    });

    await userEvent.click(section3Link);

    await expect(section3Link).toHaveAttribute("aria-current", "location");
    await expect(section1Link).not.toHaveAttribute("aria-current");
    await expect(
      canvas.getByRole("article", { name: "Section 3" }),
    ).toHaveAttribute("data-active", "true");
    await expect(
      canvas.getByRole("article", { name: "Section 1" }),
    ).toHaveAttribute("data-active", "false");
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active section\s*Section 3/,
    );
  },
};

export const ProgrammaticScrolling: Story = {
  args: {
    storyDocumentation: {
      title: "Programmatic scroll propagation",
      summary:
        "This scenario keeps Section 2 active while a controlled scroll transaction is in progress. Both render contexts receive isProgrammaticScrolling=true.",
      expectedResult:
        "The Live state reports Section 2 and Programmatic, and every rendered article exposes the same programmatic state.",
    },
    activeId: "section2",
    isProgrammaticScrolling: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the same composition during a controller-driven scroll. `isProgrammaticScrolling` does not scroll by itself; SectionedView only forwards it to `renderNavigation` and every `renderSection` call so consumers can pause scroll-spy work or display progress.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigationContext = canvas.getByTestId("navigation-context");

    await expect(navigationContext).toHaveAttribute(
      "data-programmatic",
      "true",
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Active section\s*Section 2/,
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
        "Only the content container semantics change: the collection is a named section instead of the page's main landmark.",
      expectedResult:
        "The Live state reports <section> · Report collection, and the content is exposed as a named region.",
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
          'Demonstrates semantic polymorphism without changing section rendering. Use `contentAs="section"` when the collection is subordinate content, and give that region an accessible name through `contentProps`. Visual classes still belong in `contentClassName`.',
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
    await expect(within(content).getAllByRole("article")).toHaveLength(
      reportSections.length,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /Content wrapper\s*<section>\s*· Report collection/,
    );
  },
};
