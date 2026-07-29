import { DashboardLayout } from "../components/DashboardLayout";
import type { NavbarItem } from "../components/Navbar";
import { useRouteView } from "../hooks/useRouteView";

type UnderConstructionPrimaryId =
  | "overview"
  | "react"
  | "plan";

type UnderConstructionPageProps = {
  activePrimaryId: UnderConstructionPrimaryId;
  path: "/" | "/react" | "/plan";
  title: "Overview" | "React" | "Plan";
};

const underConstructionId = "under-construction";

export function UnderConstructionSection() {
  return (
    <section
      id={underConstructionId}
      aria-labelledby="under-construction-heading"
      className="scroll-mt-[104px] px-6 py-12"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="under-construction-heading"
          className="text-3xl font-bold text-slate-950"
        >
          Under Construction
        </h2>
        <p className="mt-2 text-slate-600">
          This area is being prepared.
        </p>
        <div className="mt-6 h-[760px] rounded-xl border bg-white shadow-sm" />
      </div>
    </section>
  );
}

export function UnderConstructionPage({
  activePrimaryId,
  path,
  title,
}: UnderConstructionPageProps) {
  const routeHeadingRef = useRouteView(title);
  const sectionItems = [
    {
      id: underConstructionId,
      label: "Under Construction",
      to: `${path}#${underConstructionId}`,
    },
  ] satisfies readonly NavbarItem[];

  return (
    <DashboardLayout
      activePrimaryId={activePrimaryId}
      sectionNavigation={{
        items: sectionItems,
        activeId: underConstructionId,
        ariaLabel: `${title} sections`,
        ariaCurrent: "location",
        onSelect: () => undefined,
      }}
    >
      <main>
        <h1
          ref={routeHeadingRef}
          tabIndex={-1}
          className="sr-only"
        >
          {title}
        </h1>
        <UnderConstructionSection />
      </main>
    </DashboardLayout>
  );
}
