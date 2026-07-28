import {
  infiniteQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { inventoryPageSize } from "./inventoryConfig";
import { InventoryFilters, inventoryRepository } from "./inventoryRepository";

export const defaultInventoryFilters: InventoryFilters = {
  risk: "all",
};

export function inventoryRiskQueryOptions(filters: InventoryFilters) {
  const normalizedFilters: InventoryFilters = {
    risk: filters.risk,
    simulateError: Boolean(filters.simulateError),
  };

  return infiniteQueryOptions({
    queryKey: ["manage", "inventory", "risk", normalizedFilters] as const,
    queryFn: ({ pageParam, signal }) =>
      inventoryRepository.list({
        filters: normalizedFilters,
        pageParam,
        pageSize: inventoryPageSize,
        signal,
      }),
    initialPageParam: "0",
    getNextPageParam: (lastPage) => lastPage.nextPageParam ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
