import { useCallback } from "react";
import {
  manageSections,
  type ManageSectionId,
} from "./manageSections";

const manageSectionById = new Map(
  manageSections.map((section) => [section.id, section]),
);
const manageSectionIds = manageSections.map((section) => section.id);

export function useManageSectionPreparation() {
  const preloadSectionChunk = useCallback((id: ManageSectionId) => {
    void manageSectionById
      .get(id)
      ?.load()
      .catch(() => undefined);
  }, []);

  const prepareSection = useCallback(
    (id: ManageSectionId) => {
      preloadSectionChunk(id);
    },
    [preloadSectionChunk],
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
