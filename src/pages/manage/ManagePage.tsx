import {
  BadgeCheck,
  DollarSign,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  DashboardLayout,
  type DashboardPrimaryItem,
} from "../../components/DashboardLayout";
import type {
  NavbarItem,
  NavbarSelectEvent,
} from "../../components/Navbar";
import { SectionedView } from "../../components/section-navigation";
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
  demand: TrendingUp,
  orders: ShoppingCart,
  suppliers: Truck,
  inventory: Package,
  sales: DollarSign,
  "perfect-order": BadgeCheck,
} satisfies Record<ManageSectionId, LucideIcon>;

const manageNavbarItems = manageSections.map(({ id, label }) => ({
  id,
  label,
  to: `/manage#${id}`,
  icon: manageSectionIcons[id],
})) satisfies readonly NavbarItem[];

export default function ManagePage() {
  const routeHeadingRef = useRouteView("Manage");
  const controller = useManagePageController();
  const handlePrimarySelect = (
    item: DashboardPrimaryItem,
    event: NavbarSelectEvent,
  ) => {
    if (item.id === "manage") {
      controller.handleSectionSelect("summary", event);
    }
  };

  return (
    <ManageScrollProvider
      value={{
        activeId: controller.activeId,
        isProgrammaticScrolling:
          controller.isProgrammaticScrolling,
      }}
    >
      <DashboardLayout
        activePrimaryId="manage"
        onPrimarySelect={handlePrimarySelect}
        sectionNavigation={{
          items: manageNavbarItems,
          activeId: controller.activeId,
          ariaLabel: "Manage sections",
          ariaCurrent: "location",
          onIntent: (item) =>
            controller.handleSectionIntent(item.id),
          onSelect: (item, event) =>
            controller.handleSectionSelect(item.id, event),
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
          renderNavigation={() => null}
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
      </DashboardLayout>
    </ManageScrollProvider>
  );
}
