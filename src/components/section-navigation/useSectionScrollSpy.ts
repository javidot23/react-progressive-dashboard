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
const documentEndTolerance = 2;

function isAtDocumentEnd() {
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
  );
  const maximumScrollY = Math.max(
    0,
    documentHeight - window.innerHeight,
  );

  return (
    maximumScrollY > 0 &&
    window.scrollY >= maximumScrollY - documentEndTolerance
  );
}

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

    let lastRegisteredId: TId | undefined;
    for (let index = ids.length - 1; index >= 0; index -= 1) {
      const id = ids[index]!;
      if (nodes.has(id)) {
        lastRegisteredId = id;
        break;
      }
    }
    const activateLastSectionAtDocumentEnd = () => {
      if (lastRegisteredId === undefined || !isAtDocumentEnd()) {
        return false;
      }

      onActiveChange(lastRegisteredId);
      return true;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = idByNode.get(entry.target as HTMLElement);
          if (id !== undefined) entriesById.set(id, entry);
        }

        if (activateLastSectionAtDocumentEnd()) return;

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

        if (nextId !== undefined) onActiveChange(nextId);
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

    document.addEventListener(
      "scroll",
      activateLastSectionAtDocumentEnd,
      { passive: true },
    );

    return () => {
      observer.disconnect();
      document.removeEventListener(
        "scroll",
        activateLastSectionAtDocumentEnd,
      );
    };
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
