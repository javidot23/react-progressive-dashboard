import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type { ManageSectionId } from "./manageSections";

export function useScrollSpy(
  ids: readonly ManageSectionId[],
  nodes: Map<ManageSectionId, HTMLElement>,
  registrationVersion: number,
  initialId: ManageSectionId,
  disabled = false,
): [ManageSectionId, Dispatch<SetStateAction<ManageSectionId>>] {
  const [activeId, setActiveId] = useState<ManageSectionId>(initialId);

  useEffect(() => {
    if (disabled || nodes.size === 0) return;

    const entriesById = new Map<ManageSectionId, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entriesById.set(entry.target.id as ManageSectionId, entry);
        }

        const visibleEntries = ids
          .map((id) => entriesById.get(id))
          .filter((entry): entry is IntersectionObserverEntry =>
            Boolean(entry?.isIntersecting),
          )
          .sort(
            (left, right) =>
              Math.abs(left.boundingClientRect.top - 72) -
              Math.abs(right.boundingClientRect.top - 72),
          );

        const nextId = visibleEntries[0]?.target.id;
        if (nextId) {
          setActiveId(nextId as ManageSectionId);
        }
      },
      {
        root: null,
        rootMargin: "-72px 0px -60% 0px",
        threshold: [0, 0.01, 0.25, 0.5, 0.75],
      },
    );

    for (const node of nodes.values()) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [ids, nodes, registrationVersion]);

  return [activeId, setActiveId];
}
