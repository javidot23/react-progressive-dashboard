import { render, screen } from "@testing-library/react";
import type { RefCallback } from "react";
import { SectionedView } from "./SectionedView";

type ReportSection = {
  slug: "overview" | "activity" | "forecast";
  title: string;
  metric: number;
};

const sections = [
  { slug: "overview", title: "Overview", metric: 12 },
  { slug: "activity", title: "Activity", metric: 8 },
  { slug: "forecast", title: "Forecast", metric: 21 },
] satisfies readonly ReportSection[];

function createSectionRefs() {
  const refs = new Map<ReportSection["slug"], RefCallback<HTMLElement>>();

  for (const section of sections) {
    refs.set(section.slug, jest.fn());
  }

  return refs;
}

describe("SectionedView", () => {
  it("renderiza tipos arbitrarios en orden y entrega el contexto correcto", () => {
    const refs = createSectionRefs();
    const getSectionRef = jest.fn(
      (id: ReportSection["slug"]) => refs.get(id)!,
    );
    const renderNavigation = jest.fn(
      ({
        activeId,
        isProgrammaticScrolling,
        sections: navigationSections,
      }) => (
        <nav
          data-active-id={activeId}
          data-programmatic={String(isProgrammaticScrolling)}
        >
          {navigationSections.length} sections
        </nav>
      ),
    );
    const renderSection = jest.fn(
      (
        section: ReportSection,
        {
          id,
          index,
          isActive,
          isProgrammaticScrolling,
          sectionRef,
        },
      ) => (
        <article
          ref={sectionRef}
          data-testid="report-section"
          data-id={id}
          data-index={index}
          data-active={String(isActive)}
          data-programmatic={String(isProgrammaticScrolling)}
        >
          {section.title}: {section.metric}
        </article>
      ),
    );

    render(
      <SectionedView
        sections={sections}
        activeId="activity"
        isProgrammaticScrolling
        getSectionId={(section) => section.slug}
        getSectionRef={getSectionRef}
        renderNavigation={renderNavigation}
        renderSection={renderSection}
      />,
    );

    const renderedSections = screen.getAllByTestId("report-section");
    expect(renderedSections.map((section) => section.dataset.id)).toEqual([
      "overview",
      "activity",
      "forecast",
    ]);
    expect(renderedSections.map((section) => section.textContent)).toEqual([
      "Overview: 12",
      "Activity: 8",
      "Forecast: 21",
    ]);
    expect(renderedSections[0]).toHaveAttribute("data-index", "0");
    expect(renderedSections[0]).toHaveAttribute("data-active", "false");
    expect(renderedSections[1]).toHaveAttribute("data-index", "1");
    expect(renderedSections[1]).toHaveAttribute("data-active", "true");
    expect(renderedSections[2]).toHaveAttribute("data-index", "2");
    for (const renderedSection of renderedSections) {
      expect(renderedSection).toHaveAttribute(
        "data-programmatic",
        "true",
      );
    }

    expect(renderNavigation).toHaveBeenCalledWith({
      activeId: "activity",
      isProgrammaticScrolling: true,
      sections,
    });
    expect(getSectionRef.mock.calls.map(([id]) => id)).toEqual([
      "overview",
      "activity",
      "forecast",
    ]);

    for (const section of sections) {
      expect(refs.get(section.slug)).toHaveBeenCalledWith(
        screen.getByText(
          `${section.title}: ${section.metric}`,
        ),
      );
    }
  });

  it.each([
    ["div", null],
    ["main", "main"],
    ["section", null],
  ] as const)(
    "usa %s como contenedor de contenido",
    (contentAs, expectedRole) => {
      const { container } = render(
        <SectionedView
          sections={sections}
          activeId="overview"
          isProgrammaticScrolling={false}
          getSectionId={(section) => section.slug}
          getSectionRef={() => jest.fn()}
          renderNavigation={() => <nav>Reports</nav>}
          renderSection={(section) => <article>{section.title}</article>}
          contentAs={contentAs}
          contentClassName="content-shell"
        />,
      );

      const content = container.querySelector(
        `${contentAs}.content-shell`,
      );
      expect(content).not.toBeNull();

      if (expectedRole !== null) {
        expect(screen.getByRole(expectedRole)).toBe(content);
      }
    },
  );

  it("renderiza los slots y aplica clases sin imponer estilos", () => {
    const { container } = render(
      <SectionedView
        sections={sections.slice(0, 1)}
        activeId="overview"
        isProgrammaticScrolling={false}
        getSectionId={(section) => section.slug}
        getSectionRef={() => jest.fn()}
        renderHeader={() => <header>Report header</header>}
        renderNavigation={() => <nav>Report navigation</nav>}
        renderSection={(section) => <article>{section.title}</article>}
        rootClassName="root-shell"
        contentClassName="content-shell"
      />,
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass("root-shell");
    expect(root?.children).toHaveLength(3);
    expect(root?.children[0]).toHaveTextContent("Report header");
    expect(root?.children[1]).toHaveTextContent("Report navigation");
    expect(root?.children[2]).toHaveClass("content-shell");
    expect(root?.children[2]).toHaveTextContent("Overview");
  });

  it("usa el ID lógico como key al reordenar las secciones", () => {
    const refs = createSectionRefs();
    const renderView = (orderedSections: readonly ReportSection[]) => (
      <SectionedView
        sections={orderedSections}
        activeId="overview"
        isProgrammaticScrolling={false}
        getSectionId={(section) => section.slug}
        getSectionRef={(id) => refs.get(id)!}
        renderNavigation={() => <nav>Reports</nav>}
        renderSection={(section) => (
          <article data-testid={section.slug}>{section.title}</article>
        )}
      />
    );
    const { rerender } = render(renderView(sections));
    const overviewElement = screen.getByTestId("overview");
    const forecastElement = screen.getByTestId("forecast");

    rerender(renderView([...sections].reverse()));

    expect(screen.getByTestId("overview")).toBe(overviewElement);
    expect(screen.getByTestId("forecast")).toBe(forecastElement);
    expect(
      screen
        .getAllByRole("article")
        .map((section) => section.textContent),
    ).toEqual(["Forecast", "Activity", "Overview"]);
  });

  it("admite una lista vacía y omite el header opcional", () => {
    const renderSection = jest.fn();
    const { container } = render(
      <SectionedView
        sections={[] as readonly ReportSection[]}
        activeId="overview"
        isProgrammaticScrolling={false}
        getSectionId={(section) => section.slug}
        getSectionRef={() => jest.fn()}
        renderNavigation={() => <nav>Empty report</nav>}
        renderSection={renderSection}
      />,
    );

    expect(screen.getByRole("navigation")).toHaveTextContent(
      "Empty report",
    );
    expect(renderSection).not.toHaveBeenCalled();
    expect(container.querySelector("header")).toBeNull();
  });
});
