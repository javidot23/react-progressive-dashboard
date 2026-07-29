import { ComponentType, lazy, LazyExoticComponent } from "react";

export type ManageSectionId =
  | "summary"
  | "demand"
  | "orders"
  | "suppliers"
  | "inventory"
  | "sales"
  | "perfect-order";

type SectionModule = {
  default: ComponentType;
};

export type ManageSectionDefinition = {
  Component: LazyExoticComponent<ComponentType>;
  id: ManageSectionId;
  label: string;
  load: () => Promise<SectionModule>;
  placeholderMinHeight: number;
};

const loadSummary = () => import("./sections/SummarySection");
const loadDemand = () => import("./sections/DemandSection");
const loadOrders = () => import("./sections/OrdersSection");
const loadSuppliers = () => import("./sections/SuppliersSection");
const loadInventory = () => import("./sections/InventorySection");
const loadSales = () => import("./sections/SalesSection");
const loadPerfectOrder = () => import("./sections/PerfectOrderSection");

export const manageSections: ManageSectionDefinition[] = [
  {
    id: "summary",
    label: "Summary",
    placeholderMinHeight: 820,
    load: loadSummary,
    Component: lazy(loadSummary),
  },
  {
    id: "demand",
    label: "Demand",
    placeholderMinHeight: 900,
    load: loadDemand,
    Component: lazy(loadDemand),
  },
  {
    id: "orders",
    label: "Orders",
    placeholderMinHeight: 900,
    load: loadOrders,
    Component: lazy(loadOrders),
  },
  {
    id: "suppliers",
    label: "Suppliers",
    placeholderMinHeight: 900,
    load: loadSuppliers,
    Component: lazy(loadSuppliers),
  },
  {
    id: "inventory",
    label: "Inventory",
    placeholderMinHeight: 900,
    load: loadInventory,
    Component: lazy(loadInventory),
  },
  {
    id: "sales",
    label: "Sales",
    placeholderMinHeight: 900,
    load: loadSales,
    Component: lazy(loadSales),
  },
  {
    id: "perfect-order",
    label: "Perfect Order",
    placeholderMinHeight: 900,
    load: loadPerfectOrder,
    Component: lazy(loadPerfectOrder),
  },
];

const sectionIds = new Set(manageSections.map((section) => section.id));

export function isManageSectionId(value: string): value is ManageSectionId {
  return sectionIds.has(value as ManageSectionId);
}

export function getSectionIdFromHash(hash: string): ManageSectionId {
  const encodedValue = hash.replace(/^#/, "");

  try {
    const value = decodeURIComponent(encodedValue);
    return isManageSectionId(value) ? value : "summary";
  } catch {
    return "summary";
  }
}
