import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  type RefCallback,
} from "react";
import type {
  ManageSectionDefinition,
  ManageSectionId,
} from "./manageSections";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { SectionSkeleton } from "./SectionSkeleton";

type Props = {
  activated: boolean;
  definition: ManageSectionDefinition;
  onActivate: (id: ManageSectionId) => void;
  registerNode: (id: ManageSectionId, node: HTMLElement | null) => void;
};

export function ProgressiveSection({
  activated,
  definition,
  onActivate,
  registerNode,
}: Props) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const { Component, id, label, load, placeholderMinHeight } = definition;

  const setNode: RefCallback<HTMLElement> = useCallback(
    (node) => {
      nodeRef.current = node;
      registerNode(id, node);
    },
    [id, registerNode],
  );

  useEffect(() => {
    const node = nodeRef.current;
    if (activated || !node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void load().catch(() => undefined);
          onActivate(id);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "800px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activated, id, load, onActivate]);

  return (
    <section
      ref={setNode}
      id={id}
      aria-label={activated ? undefined : label}
      aria-labelledby={activated ? `${id}-heading` : undefined}
      className="scroll-mt-20 px-6 py-12"
      style={activated ? undefined : { minHeight: placeholderMinHeight }}
    >
      {activated ? (
        <SectionErrorBoundary label={label}>
          <Suspense
            fallback={
              <SectionSkeleton label={label} minHeight={placeholderMinHeight} />
            }
          >
            <Component />
          </Suspense>
        </SectionErrorBoundary>
      ) : (
        <SectionSkeleton label={label} minHeight={placeholderMinHeight} />
      )}
    </section>
  );
}
