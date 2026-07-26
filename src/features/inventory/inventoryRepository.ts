export type InventoryRisk = "low" | "medium" | "high";

export type InventoryFilters = {
  risk: "all" | InventoryRisk;
  simulateError?: boolean;
};

export type InventoryRiskItem = {
  id: string;
  name: string;
  onHand: number;
  risk: InventoryRisk;
  sku: string;
};

export type PageRequest<TPageParam, TFilters> = {
  filters: TFilters;
  pageParam: TPageParam;
  pageSize: number;
  signal: AbortSignal;
};

export type PageResult<TItem, TPageParam> = {
  items: TItem[];
  nextPageParam: TPageParam | null;
  total: number;
};

export type InventoryCursor = string;

const riskLevels: InventoryRisk[] = ["low", "medium", "high"];

const inventoryItems: InventoryRiskItem[] = Array.from(
  { length: 1_000 },
  (_, index) => ({
    id: `inventory-${index + 1}`,
    name: `Product ${String(index + 1).padStart(4, "0")}`,
    onHand: (index * 37) % 500,
    risk: riskLevels[index % riskLevels.length]!,
    sku: `SKU-${String(index + 1).padStart(6, "0")}`,
  }),
);

function abortableDelay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("The request was aborted.", "AbortError"));
      return;
    }

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export const inventoryRepository = {
  async list({
    filters,
    pageParam,
    pageSize,
    signal,
  }: PageRequest<InventoryCursor, InventoryFilters>): Promise<
    PageResult<InventoryRiskItem, InventoryCursor>
  > {
    await abortableDelay(350, signal);

    if (filters.simulateError) {
      throw new Error("The mock inventory service failed.");
    }

    const filteredItems =
      filters.risk === "all"
        ? inventoryItems
        : inventoryItems.filter((item) => item.risk === filters.risk);
    const start = Number.parseInt(pageParam, 10);
    const safeStart = Number.isNaN(start) ? 0 : start;
    const end = Math.min(safeStart + pageSize, filteredItems.length);

    return {
      items: filteredItems.slice(safeStart, end),
      nextPageParam: end < filteredItems.length ? String(end) : null,
      total: filteredItems.length,
    };
  },
};
