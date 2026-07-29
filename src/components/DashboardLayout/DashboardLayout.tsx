import { Bell, CircleUserRound, Settings } from "lucide-react";
import type { ReactNode } from "react";
import {
  Header,
  type HeaderAction,
  type HeaderNavigationConfig,
} from "../Header";
import type { NavbarItem, NavbarSelectEvent } from "../Navbar";
import {
  dashboardPrimaryItems,
  type DashboardPrimaryId,
  type DashboardPrimaryItem,
} from "./dashboardNavigation";

export type DashboardLayoutProps<TSectionItem extends NavbarItem> = {
  activePrimaryId: DashboardPrimaryId;
  children: ReactNode;
  onPrimarySelect?: (
    item: DashboardPrimaryItem,
    event: NavbarSelectEvent,
  ) => void;
  sectionNavigation: HeaderNavigationConfig<TSectionItem>;
};

const headerActions = [
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
  {
    id: "profile",
    label: "Profile",
    icon: CircleUserRound,
    disabled: true,
  },
] satisfies readonly HeaderAction[];

export function DashboardLayout<TSectionItem extends NavbarItem>({
  activePrimaryId,
  children,
  onPrimarySelect,
  sectionNavigation,
}: DashboardLayoutProps<TSectionItem>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        primaryNavigation={{
          items: dashboardPrimaryItems,
          activeId: activePrimaryId,
          ariaLabel: "Primary navigation",
          ariaCurrent: "page",
          onSelect: (item, event) => {
            onPrimarySelect?.(item, event);
          },
        }}
        sectionNavigation={sectionNavigation}
        sectionParentId={activePrimaryId}
        actions={headerActions}
        className="sticky top-0 z-20"
      />

      {children}
    </div>
  );
}
