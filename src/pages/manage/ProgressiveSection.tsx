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
  activationDisabled?: boolean;
  activated: boolean;
  definition: ManageSectionDefinition;
  onActivate: (id: ManageSectionId) => void;
  sectionRef: RefCallback<HTMLElement>;
};

export function ProgressiveSection({
  activationDisabled = false,
  activated,
  definition,
  onActivate,
  sectionRef,
}: Props) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const { Component, id, label, load, placeholderMinHeight } = definition;

  const setNode: RefCallback<HTMLElement> = useCallback(
    (node) => {
      nodeRef.current = node;
      sectionRef(node);
    },
    [sectionRef],
  );

  useEffect(() => {
    const node = nodeRef.current;
    if (activationDisabled || activated || !node) return;

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
  }, [activated, activationDisabled, id, load, onActivate]);

  return (
    <section
      ref={setNode}
      id={id}
      aria-label={label}
      className="scroll-mt-20 px-6 py-12"
      style={{ minHeight: `calc(${placeholderMinHeight}px + 6rem)` }}
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
