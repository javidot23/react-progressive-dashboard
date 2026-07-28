import type {
  HTMLAttributes,
  ReactNode,
  RefCallback,
} from "react";

export type SectionNavigationOrigin = "selection" | "history";
export type SectionScrollBehavior = "auto" | "smooth";

export type SectionNavigationPhase<TId extends string> =
  | { kind: "idle" }
  | {
      kind: "programmatic";
      targetId: TId;
      origin: SectionNavigationOrigin;
      behavior: SectionScrollBehavior;
      transactionId: number;
    };

export type SectionNavigationRequest<TId extends string> = {
  targetId: TId;
  origin: SectionNavigationOrigin;
  behavior: SectionScrollBehavior;
};

export type SectionScrollSpyOptions = {
  topOffset: number;
  bottomMarginPercent: number;
};

export type SectionScrollCompletionOptions = {
  alignmentTolerance: number;
  idleDelay: number;
  settleDelay: number;
};

export type UseSectionNavigationOptions<TId extends string> = {
  ids: readonly TId[];
  initialId: TId;
  initialNavigation?: SectionNavigationRequest<TId>;
  scrollSpy?: Partial<SectionScrollSpyOptions>;
  scrollCompletion?: Partial<SectionScrollCompletionOptions>;
};

export type SectionNavigationController<TId extends string> = {
  activeId: TId;
  phase: SectionNavigationPhase<TId>;
  isProgrammaticScrolling: boolean;
  navigateTo: (
    id: TId,
    options: Omit<SectionNavigationRequest<TId>, "targetId">,
  ) => void;
  getSectionRef: (id: TId) => RefCallback<HTMLElement>;
};

export type NavigationRenderContext<
  TId extends string,
  TSection,
> = {
  activeId: TId;
  isProgrammaticScrolling: boolean;
  sections: readonly TSection[];
};

export type SectionRenderContext<TId extends string> = {
  id: TId;
  index: number;
  isActive: boolean;
  isProgrammaticScrolling: boolean;
  sectionRef: RefCallback<HTMLElement>;
};

export type SectionedViewProps<TId extends string, TSection> = {
  sections: readonly TSection[];
  activeId: TId;
  isProgrammaticScrolling: boolean;
  getSectionId: (section: TSection) => TId;
  getSectionRef: (id: TId) => RefCallback<HTMLElement>;
  renderHeader?: () => ReactNode;
  renderNavigation: (
    context: NavigationRenderContext<TId, TSection>,
  ) => ReactNode;
  renderSection: (
    section: TSection,
    context: SectionRenderContext<TId>,
  ) => ReactNode;
  contentAs?: "div" | "main" | "section";
  contentProps?: Omit<
    HTMLAttributes<HTMLElement>,
    "children" | "className"
  >;
  rootClassName?: string;
  contentClassName?: string;
};
