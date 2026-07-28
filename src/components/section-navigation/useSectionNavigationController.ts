import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  createSectionNavigationState,
  sectionNavigationReducer,
} from "./sectionNavigationReducer";
import type {
  SectionNavigationController,
  SectionScrollCompletionOptions,
  SectionScrollSpyOptions,
  UseSectionNavigationOptions,
} from "./types";
import { useProgrammaticSectionScroll } from "./useProgrammaticSectionScroll";
import { useSectionScrollSpy } from "./useSectionScrollSpy";

const defaultScrollSpyOptions: SectionScrollSpyOptions = {
  topOffset: 72,
  bottomMarginPercent: 60,
};

const defaultScrollCompletionOptions: SectionScrollCompletionOptions = {
  alignmentTolerance: 4,
  idleDelay: 250,
  settleDelay: 80,
};

function describeId(id: string) {
  return JSON.stringify(id);
}

function validateIds<TId extends string>(
  ids: readonly TId[],
  initialId: TId,
  initialNavigationTarget?: TId,
) {
  if (ids.length === 0) {
    throw new Error(
      "useSectionNavigationController requires at least one section ID.",
    );
  }

  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error(
      "useSectionNavigationController requires unique section IDs.",
    );
  }

  if (!uniqueIds.has(initialId)) {
    throw new Error(
      `Initial section ID ${describeId(initialId)} is not present in ids.`,
    );
  }

  if (
    initialNavigationTarget !== undefined &&
    !uniqueIds.has(initialNavigationTarget)
  ) {
    throw new Error(
      `Initial navigation target ${describeId(initialNavigationTarget)} is not present in ids.`,
    );
  }
}

function validateStableIds<TId extends string>(
  initialIds: readonly TId[],
  currentIds: readonly TId[],
) {
  const changed =
    initialIds.length !== currentIds.length ||
    initialIds.some((id, index) => id !== currentIds[index]);

  if (changed) {
    throw new Error(
      "Section IDs and their order must remain stable for the lifetime of useSectionNavigationController.",
    );
  }
}

function validateNumericOption(
  name: string,
  value: number,
  maximum?: number,
) {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    (maximum !== undefined && value > maximum)
  ) {
    const range = maximum === undefined ? "a non-negative number" : `between 0 and ${maximum}`;
    throw new Error(`${name} must be ${range}.`);
  }
}

export function useSectionNavigationController<TId extends string>({
  ids,
  initialId,
  initialNavigation,
  scrollSpy,
  scrollCompletion,
}: UseSectionNavigationOptions<TId>): SectionNavigationController<TId> {
  const [stableIds] = useState<readonly TId[]>(() => {
    validateIds(ids, initialId, initialNavigation?.targetId);
    return Object.freeze([...ids]);
  });
  const [stableValidIds] = useState<ReadonlySet<TId>>(
    () => new Set(stableIds),
  );

  validateStableIds(stableIds, ids);
  validateIds(stableIds, initialId, initialNavigation?.targetId);
  const topOffset =
    scrollSpy?.topOffset ?? defaultScrollSpyOptions.topOffset;
  const bottomMarginPercent =
    scrollSpy?.bottomMarginPercent ??
    defaultScrollSpyOptions.bottomMarginPercent;
  const resolvedScrollSpy = useMemo<SectionScrollSpyOptions>(
    () => ({
      topOffset,
      bottomMarginPercent,
    }),
    [bottomMarginPercent, topOffset],
  );
  const alignmentTolerance =
    scrollCompletion?.alignmentTolerance ??
    defaultScrollCompletionOptions.alignmentTolerance;
  const idleDelay =
    scrollCompletion?.idleDelay ??
    defaultScrollCompletionOptions.idleDelay;
  const settleDelay =
    scrollCompletion?.settleDelay ??
    defaultScrollCompletionOptions.settleDelay;
  const resolvedScrollCompletion =
    useMemo<SectionScrollCompletionOptions>(
      () => ({
        alignmentTolerance,
        idleDelay,
        settleDelay,
      }),
      [alignmentTolerance, idleDelay, settleDelay],
    );

  validateNumericOption(
    "scrollSpy.topOffset",
    resolvedScrollSpy.topOffset,
  );
  validateNumericOption(
    "scrollSpy.bottomMarginPercent",
    resolvedScrollSpy.bottomMarginPercent,
    100,
  );
  validateNumericOption(
    "scrollCompletion.alignmentTolerance",
    resolvedScrollCompletion.alignmentTolerance,
  );
  validateNumericOption(
    "scrollCompletion.idleDelay",
    resolvedScrollCompletion.idleDelay,
  );
  validateNumericOption(
    "scrollCompletion.settleDelay",
    resolvedScrollCompletion.settleDelay,
  );

  const [state, dispatch] = useReducer(
    sectionNavigationReducer<TId>,
    { initialId, initialNavigation },
    createSectionNavigationState<TId>,
  );
  const nextTransactionId = useRef(initialNavigation ? 1 : 0);
  const [nodes] = useState(() => new Map<TId, HTMLElement>());
  const [refCallbacks] = useState(
    () => new Map<TId, (node: HTMLElement | null) => void>(),
  );
  const [registrationVersion, recordRegistration] = useReducer(
    (version: number) => version + 1,
    0,
  );

  const assertKnownId = useCallback(
    (id: TId) => {
      if (!stableValidIds.has(id)) {
        throw new Error(
          `Section ID ${describeId(id)} is not present in ids.`,
        );
      }
    },
    [stableValidIds],
  );

  const getSectionRef = useCallback(
    (id: TId) => {
      assertKnownId(id);

      let refCallback = refCallbacks.get(id);
      if (!refCallback) {
        refCallback = (node) => {
          const previousNode = nodes.get(id);

          if (node && previousNode !== node) {
            nodes.set(id, node);
            recordRegistration();
          } else if (!node && previousNode) {
            nodes.delete(id);
            recordRegistration();
          }
        };
        refCallbacks.set(id, refCallback);
      }

      return refCallback;
    },
    [assertKnownId, nodes, refCallbacks],
  );

  const navigateTo = useCallback<
    SectionNavigationController<TId>["navigateTo"]
  >(
    (id, options) => {
      assertKnownId(id);
      nextTransactionId.current += 1;
      dispatch({
        type: "navigationRequested",
        request: {
          targetId: id,
          ...options,
        },
        transactionId: nextTransactionId.current,
      });
    },
    [assertKnownId],
  );

  const handleScrollSpyChange = useCallback((id: TId) => {
    dispatch({ type: "scrollSpyObserved", id });
  }, []);
  const handleNavigationComplete = useCallback(
    (transactionId: number) => {
      dispatch({ type: "navigationCompleted", transactionId });
    },
    [],
  );
  const handleNavigationFailure = useCallback(
    (transactionId: number) => {
      dispatch({ type: "navigationFailed", transactionId });
    },
    [],
  );

  useSectionScrollSpy({
    ids: stableIds,
    nodes,
    registrationVersion,
    disabled: state.phase.kind === "programmatic",
    ...resolvedScrollSpy,
    onActiveChange: handleScrollSpyChange,
  });

  useProgrammaticSectionScroll({
    nodes,
    phase: state.phase,
    completion: resolvedScrollCompletion,
    onComplete: handleNavigationComplete,
    onFailure: handleNavigationFailure,
  });

  return useMemo(
    () => ({
      activeId: state.activeId,
      phase: state.phase,
      isProgrammaticScrolling: state.phase.kind === "programmatic",
      navigateTo,
      getSectionRef,
    }),
    [getSectionRef, navigateTo, state.activeId, state.phase],
  );
}
