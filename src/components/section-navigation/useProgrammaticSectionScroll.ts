import { useEffect, useRef } from "react";
import type {
  SectionNavigationPhase,
  SectionScrollCompletionOptions,
} from "./types";

type UseProgrammaticSectionScrollOptions<TId extends string> = {
  nodes: ReadonlyMap<TId, HTMLElement>;
  phase: SectionNavigationPhase<TId>;
  completion: SectionScrollCompletionOptions;
  onComplete: (transactionId: number) => void;
  onFailure: (transactionId: number) => void;
};

const scrollIntentKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
]);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
    ),
  );
}

function isButtonActivation(event: KeyboardEvent) {
  if (
    event.key !== " " &&
    event.code !== "Space"
  ) {
    return false;
  }

  return (
    event.target instanceof Element &&
    event.target.closest('button, [role="button"]') !== null
  );
}

function isKeyboardScrollIntent(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isEditableTarget(event.target) ||
    isButtonActivation(event)
  ) {
    return false;
  }

  return (
    scrollIntentKeys.has(event.key) ||
    event.key === " " ||
    event.code === "Space"
  );
}

export function getExpectedSectionScrollY(node: HTMLElement) {
  const targetTop = node.getBoundingClientRect().top + window.scrollY;
  const scrollMarginTop =
    Number.parseFloat(window.getComputedStyle(node).scrollMarginTop) || 0;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
  );
  const maximumScrollY = Math.max(0, documentHeight - window.innerHeight);

  return Math.min(
    Math.max(0, targetTop - scrollMarginTop),
    maximumScrollY,
  );
}

function isSectionAligned(node: HTMLElement, tolerance: number) {
  return (
    Math.abs(window.scrollY - getExpectedSectionScrollY(node)) <= tolerance
  );
}

export function useProgrammaticSectionScroll<TId extends string>({
  nodes,
  phase,
  completion,
  onComplete,
  onFailure,
}: UseProgrammaticSectionScrollOptions<TId>) {
  const startedTransaction = useRef<number | null>(null);
  const targetNode =
    phase.kind === "programmatic" ? nodes.get(phase.targetId) : undefined;

  useEffect(() => {
    if (phase.kind !== "programmatic") return;

    const {
      behavior,
      targetId,
      transactionId,
    } = phase;
    const initialTarget = targetNode;

    if (!initialTarget) {
      if (startedTransaction.current === transactionId) {
        startedTransaction.current = null;
        onFailure(transactionId);
      }
      return;
    }

    startedTransaction.current = transactionId;

    let cancelled = false;
    let initialFrame: number | null = null;
    let idleTimer: number | null = null;
    let layoutFrame: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let listening = false;
    let listeningForManualIntent = false;
    let alignmentConfirmationPending = false;

    const clearResources = () => {
      if (listening) {
        document.removeEventListener("scroll", handleScroll);
        document.removeEventListener("scrollend", handleScrollEnd);
        listening = false;
      }

      if (listeningForManualIntent) {
        document.removeEventListener("wheel", handleManualScrollIntent);
        document.removeEventListener(
          "touchstart",
          handleManualScrollIntent,
        );
        document.removeEventListener("keydown", handleKeyDown);
        listeningForManualIntent = false;
      }

      resizeObserver?.disconnect();
      resizeObserver = null;

      if (initialFrame !== null) {
        window.cancelAnimationFrame(initialFrame);
        initialFrame = null;
      }

      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }

      if (layoutFrame !== null) {
        window.cancelAnimationFrame(layoutFrame);
        layoutFrame = null;
      }
    };

    const fail = () => {
      if (cancelled) return;

      cancelled = true;
      clearResources();
      if (startedTransaction.current === transactionId) {
        startedTransaction.current = null;
      }
      onFailure(transactionId);
    };

    const complete = () => {
      if (cancelled) return;

      cancelled = true;
      clearResources();
      if (startedTransaction.current === transactionId) {
        startedTransaction.current = null;
      }
      onComplete(transactionId);
    };

    const getCurrentTarget = () => {
      const target = nodes.get(targetId);
      return target === initialTarget && target.isConnected ? target : null;
    };

    const alignOrComplete = () => {
      idleTimer = null;
      const target = getCurrentTarget();

      if (!target) {
        fail();
        return;
      }

      if (isSectionAligned(target, completion.alignmentTolerance)) {
        if (alignmentConfirmationPending) {
          complete();
          return;
        }

        alignmentConfirmationPending = true;
        scheduleAlignmentCheck(completion.idleDelay, true);
        return;
      }

      try {
        window.scrollTo({
          behavior: "auto",
          top: getExpectedSectionScrollY(target),
        });
        scheduleAlignmentCheck(completion.settleDelay);
      } catch {
        fail();
      }
    };

    const scheduleAlignmentCheck = (
      delay = completion.idleDelay,
      preserveAlignmentConfirmation = false,
    ) => {
      if (cancelled) return;
      if (!preserveAlignmentConfirmation) {
        alignmentConfirmationPending = false;
      }
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(alignOrComplete, delay);
    };

    function handleScroll() {
      scheduleAlignmentCheck();
    }

    function handleScrollEnd() {
      scheduleAlignmentCheck(completion.settleDelay);
    }

    function handleManualScrollIntent() {
      try {
        window.scrollTo({
          behavior: "auto",
          top: window.scrollY,
        });
      } catch {
        fail();
        return;
      }

      fail();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isKeyboardScrollIntent(event)) {
        handleManualScrollIntent();
      }
    }

    document.addEventListener("wheel", handleManualScrollIntent, {
      passive: true,
    });
    document.addEventListener("touchstart", handleManualScrollIntent, {
      passive: true,
    });
    document.addEventListener("keydown", handleKeyDown);
    listeningForManualIntent = true;

    initialFrame = window.requestAnimationFrame(() => {
      initialFrame = null;
      const target = getCurrentTarget();

      if (!target) {
        fail();
        return;
      }

      let lastTargetTop =
        target.getBoundingClientRect().top + window.scrollY;

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          if (cancelled) return;

          if (layoutFrame !== null) {
            window.cancelAnimationFrame(layoutFrame);
          }

          layoutFrame = window.requestAnimationFrame(() => {
            layoutFrame = null;
            const currentTarget = getCurrentTarget();

            if (!currentTarget) {
              fail();
              return;
            }

            const nextTargetTop =
              currentTarget.getBoundingClientRect().top + window.scrollY;

            if (
              Math.abs(nextTargetTop - lastTargetTop) <=
              completion.alignmentTolerance
            ) {
              return;
            }

            lastTargetTop = nextTargetTop;
            scheduleAlignmentCheck();
          });
        });
        resizeObserver.observe(document.body);
      }

      document.addEventListener("scroll", handleScroll, { passive: true });
      document.addEventListener("scrollend", handleScrollEnd);
      listening = true;

      try {
        target.scrollIntoView({
          behavior,
          block: "start",
        });
        scheduleAlignmentCheck();
      } catch {
        fail();
      }
    });

    return () => {
      cancelled = true;
      clearResources();
    };
  }, [
    completion,
    nodes,
    onComplete,
    onFailure,
    phase,
    targetNode,
  ]);
}
