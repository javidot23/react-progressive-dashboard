import type { NavbarItem } from "../Navbar";

export type DashboardPrimaryId =
  | "overview"
  | "react"
  | "plan"
  | "manage";

export type DashboardPrimaryItem = NavbarItem & {
  id: DashboardPrimaryId;
};

export const dashboardHeaderOffset = 104;

export const dashboardPrimaryItems = [
  {
    id: "overview",
    label: "Overview",
    to: "/#under-construction",
  },
  {
    id: "react",
    label: "React",
    to: "/react#under-construction",
  },
  {
    id: "plan",
    label: "Plan",
    to: "/plan#under-construction",
  },
  {
    id: "manage",
    label: "Manage",
    to: "/manage#summary",
  },
] satisfies readonly DashboardPrimaryItem[];
