import {
  DollarSign,
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Navbar, type NavbarItem } from "../../components/Navbar";
import { SectionedView } from "../../components/section-navigation/SectionedView";
import { useRouteView } from "../../hooks/useRouteView";
import { ManageScrollProvider } from "./ManageScrollContext";
import {
  manageSections,
  type ManageSectionId,
} from "./manageSections";
import { ProgressiveSection } from "./ProgressiveSection";
import { useManagePageController } from "./useManagePageController";

const manageSectionIcons = {
  summary: LayoutDashboard,
  inventory: Package,
  demand: TrendingUp,
  supply: Truck,
  sales: DollarSign,
} satisfies Record<ManageSectionId, LucideIcon>;

const manageNavbarItems = manageSections.map(({ id, label }) => ({
  id,
  label,
  to: `#${id}`,
  icon: manageSectionIcons[id],
})) satisfies readonly NavbarItem[];

export default function ManagePage() {
  const routeHeadingRef = useRouteView("Manage");
  const controller = useManagePageController();

  return (
    <ManageScrollProvider
      value={{
        activeId: controller.activeId,
        isProgrammaticScrolling:
          controller.isProgrammaticScrolling,
      }}
    >
      <SectionedView
        sections={manageSections}
        activeId={controller.activeId}
        isProgrammaticScrolling={
          controller.isProgrammaticScrolling
        }
        getSectionId={(section) => section.id}
        getSectionRef={controller.getSectionRef}
        contentAs="main"
        rootClassName="min-h-screen bg-slate-50"
        contentClassName="mx-auto max-w-6xl"
        renderHeader={() => (
          <h1
            ref={routeHeadingRef}
            tabIndex={-1}
            className="sr-only"
          >
            Manage
          </h1>
        )}
        renderNavigation={({ activeId }) => (
          <Navbar
            items={manageNavbarItems}
            activeId={activeId}
            ariaLabel="Manage sections"
            ariaCurrent="location"
            className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 backdrop-blur"
            innerClassName="mx-auto max-w-6xl"
            onIntent={(item) =>
              controller.handleSectionIntent(item.id)
            }
            onSelect={(item, event) =>
              controller.handleSectionSelect(item.id, event)
            }
          />
        )}
        renderSection={(
          definition,
          {
            isProgrammaticScrolling,
            sectionRef,
          },
        ) => (
          <ProgressiveSection
            definition={definition}
            activated={controller.activatedIds.has(definition.id)}
            activationDisabled={isProgrammaticScrolling}
            onActivate={controller.activateSection}
            sectionRef={sectionRef}
          />
        )}
      />
    </ManageScrollProvider>
  );
}
