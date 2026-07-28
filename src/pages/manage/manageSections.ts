import { ComponentType, lazy, LazyExoticComponent } from "react";
import { inventoryInitialPlaceholderMinHeight } from "../../features/inventory/inventoryConfig";

export type ManageSectionId =
  | "summary"
  | "inventory"
  | "demand"
  | "supply"
  | "sales";

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
const loadInventory = () => import("./sections/InventorySection");
const loadDemand = () => import("./sections/DemandSection");
const loadSupply = () => import("./sections/SupplySection");
const loadSales = () => import("./sections/SalesSection");

export const manageSections: ManageSectionDefinition[] = [
  {
    id: "summary",
    label: "Summary",
    placeholderMinHeight: 820,
    load: loadSummary,
    Component: lazy(loadSummary),
  },
  {
    id: "inventory",
    label: "Inventory",
    placeholderMinHeight: inventoryInitialPlaceholderMinHeight,
    load: loadInventory,
    Component: lazy(loadInventory),
  },
  {
    id: "demand",
    label: "Demand",
    placeholderMinHeight: 900,
    load: loadDemand,
    Component: lazy(loadDemand),
  },
  {
    id: "supply",
    label: "Supply",
    placeholderMinHeight: 860,
    load: loadSupply,
    Component: lazy(loadSupply),
  },
  {
    id: "sales",
    label: "Sales",
    placeholderMinHeight: 920,
    load: loadSales,
    Component: lazy(loadSales),
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
