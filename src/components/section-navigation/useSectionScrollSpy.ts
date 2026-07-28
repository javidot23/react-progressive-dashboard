import { useEffect } from "react";

type UseSectionScrollSpyOptions<TId extends string> = {
  ids: readonly TId[];
  nodes: ReadonlyMap<TId, HTMLElement>;
  registrationVersion: number;
  disabled: boolean;
  topOffset: number;
  bottomMarginPercent: number;
  onActiveChange: (id: TId) => void;
};

const intersectionThresholds = [0, 0.01, 0.25, 0.5, 0.75];

export function useSectionScrollSpy<TId extends string>({
  ids,
  nodes,
  registrationVersion,
  disabled,
  topOffset,
  bottomMarginPercent,
  onActiveChange,
}: UseSectionScrollSpyOptions<TId>) {
  useEffect(() => {
    if (
      disabled ||
      nodes.size === 0 ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const idByNode = new Map<HTMLElement, TId>();
    const entriesById = new Map<TId, IntersectionObserverEntry>();

    for (const id of ids) {
      const node = nodes.get(id);
      if (node) idByNode.set(node, id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = idByNode.get(entry.target as HTMLElement);
          if (id) entriesById.set(id, entry);
        }

        const nextId = ids
          .map((id) => {
            const entry = entriesById.get(id);
            return entry?.isIntersecting ? { entry, id } : undefined;
          })
          .filter(
            (
              candidate,
            ): candidate is {
              entry: IntersectionObserverEntry;
              id: TId;
            } => Boolean(candidate),
          )
          .sort(
            (left, right) =>
              Math.abs(left.entry.boundingClientRect.top - topOffset) -
              Math.abs(right.entry.boundingClientRect.top - topOffset),
          )[0]?.id;

        if (nextId) onActiveChange(nextId);
      },
      {
        root: null,
        rootMargin: `-${topOffset}px 0px -${bottomMarginPercent}% 0px`,
        threshold: intersectionThresholds,
      },
    );

    for (const node of idByNode.keys()) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [
    bottomMarginPercent,
    disabled,
    ids,
    nodes,
    onActiveChange,
    registrationVersion,
    topOffset,
  ]);
}
