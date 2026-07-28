import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  defaultInventoryFilters,
  inventoryRiskQueryOptions,
} from "../../features/inventory/inventoryQueryOptions";
import {
  manageSections,
  type ManageSectionId,
} from "./manageSections";

const manageSectionById = new Map(
  manageSections.map((section) => [section.id, section]),
);
const manageSectionIds = manageSections.map((section) => section.id);

export function useManageSectionPreparation() {
  const queryClient = useQueryClient();

  const preloadSectionChunk = useCallback((id: ManageSectionId) => {
    void manageSectionById
      .get(id)
      ?.load()
      .catch(() => undefined);
  }, []);

  const prefetchSectionData = useCallback(
    (id: ManageSectionId) => {
      if (id !== "inventory") return;

      void queryClient.prefetchInfiniteQuery(
        inventoryRiskQueryOptions(defaultInventoryFilters),
      );
    },
    [queryClient],
  );

  const prepareSection = useCallback(
    (id: ManageSectionId) => {
      preloadSectionChunk(id);
      prefetchSectionData(id);
    },
    [prefetchSectionData, preloadSectionChunk],
  );

  const preloadNextSection = useCallback(
    (id: ManageSectionId) => {
      const activeIndex = manageSectionIds.indexOf(id);
      const nextId = manageSectionIds[activeIndex + 1];

      if (nextId) {
        preloadSectionChunk(nextId);
      }
    },
    [preloadSectionChunk],
  );

  return {
    prepareSection,
    preloadNextSection,
  };
}
