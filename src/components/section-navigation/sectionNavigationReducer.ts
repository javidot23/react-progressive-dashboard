import type {
  SectionNavigationPhase,
  SectionNavigationRequest,
} from "./types";

export type SectionNavigationState<TId extends string> = {
  activeId: TId;
  phase: SectionNavigationPhase<TId>;
};

export type SectionNavigationAction<TId extends string> =
  | {
      type: "navigationRequested";
      request: SectionNavigationRequest<TId>;
      transactionId: number;
    }
  | { type: "scrollSpyObserved"; id: TId }
  | { type: "navigationCompleted"; transactionId: number }
  | { type: "navigationFailed"; transactionId: number };

type CreateSectionNavigationStateOptions<TId extends string> = {
  initialId: TId;
  initialNavigation?: SectionNavigationRequest<TId>;
};

export function createSectionNavigationState<TId extends string>({
  initialId,
  initialNavigation,
}: CreateSectionNavigationStateOptions<TId>): SectionNavigationState<TId> {
  if (!initialNavigation) {
    return {
      activeId: initialId,
      phase: { kind: "idle" },
    };
  }

  return {
    activeId: initialNavigation.targetId,
    phase: {
      kind: "programmatic",
      ...initialNavigation,
      transactionId: 1,
    },
  };
}

export function sectionNavigationReducer<TId extends string>(
  state: SectionNavigationState<TId>,
  action: SectionNavigationAction<TId>,
): SectionNavigationState<TId> {
  switch (action.type) {
    case "navigationRequested":
      return {
        activeId: action.request.targetId,
        phase: {
          kind: "programmatic",
          ...action.request,
          transactionId: action.transactionId,
        },
      };

    case "scrollSpyObserved":
      if (
        state.phase.kind === "programmatic" ||
        state.activeId === action.id
      ) {
        return state;
      }

      return {
        ...state,
        activeId: action.id,
      };

    case "navigationCompleted":
    case "navigationFailed":
      if (
        state.phase.kind !== "programmatic" ||
        state.phase.transactionId !== action.transactionId
      ) {
        return state;
      }

      return {
        ...state,
        phase: { kind: "idle" },
      };
  }
}
