import { act, renderHook } from "@testing-library/react";
import type { SectionNavigationPhase } from "./types";
import {
  getExpectedSectionScrollY,
  useProgrammaticSectionScroll,
} from "./useProgrammaticSectionScroll";

type SectionId = "alpha" | "beta";

const completion = {
  alignmentTolerance: 4,
  idleDelay: 250,
  settleDelay: 80,
};

describe("useProgrammaticSectionScroll", () => {
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  const originalScrollTo = window.scrollTo;
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
  const originalScrollYDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "scrollY",
  );
  const originalInnerHeightDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "innerHeight",
  );
  const originalBodyScrollHeightDescriptor = Object.getOwnPropertyDescriptor(
    document.body,
    "scrollHeight",
  );
  const originalRootScrollHeightDescriptor = Object.getOwnPropertyDescriptor(
    document.documentElement,
    "scrollHeight",
  );
  let animationFrames: FrameRequestCallback[];

  beforeEach(() => {
    jest.useFakeTimers();
    animationFrames = [];
    window.requestAnimationFrame = jest.fn((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    window.cancelAnimationFrame = jest.fn();
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    window.scrollTo = originalScrollTo;
    globalThis.ResizeObserver = originalResizeObserver;
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    if (originalScrollYDescriptor) {
      Object.defineProperty(window, "scrollY", originalScrollYDescriptor);
    }
    if (originalInnerHeightDescriptor) {
      Object.defineProperty(
        window,
        "innerHeight",
        originalInnerHeightDescriptor,
      );
    }
    if (originalBodyScrollHeightDescriptor) {
      Object.defineProperty(
        document.body,
        "scrollHeight",
        originalBodyScrollHeightDescriptor,
      );
    } else {
      Reflect.deleteProperty(document.body, "scrollHeight");
    }
    if (originalRootScrollHeightDescriptor) {
      Object.defineProperty(
        document.documentElement,
        "scrollHeight",
        originalRootScrollHeightDescriptor,
      );
    } else {
      Reflect.deleteProperty(document.documentElement, "scrollHeight");
    }
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  function flushAnimationFrames() {
    const callbacks = animationFrames;
    animationFrames = [];
    callbacks.forEach((callback) => callback(0));
  }

  function createTarget(top = 0) {
    const target = document.createElement("section");
    target.getBoundingClientRect = jest.fn(
      () => ({ top }) as DOMRect,
    );
    document.body.append(target);
    return target;
  }

  it("espera a que el destino se registre antes de iniciar", () => {
    const nodes = new Map<SectionId, HTMLElement>();
    const onComplete = jest.fn();
    const onFailure = jest.fn();
    const phase: SectionNavigationPhase<SectionId> = {
      kind: "programmatic",
      targetId: "beta",
      origin: "history",
      behavior: "auto",
      transactionId: 1,
    };

    const { rerender } = renderHook(
      ({ registrationVersion }) => {
        void registrationVersion;
        return useProgrammaticSectionScroll({
          nodes,
          phase,
          completion,
          onComplete,
          onFailure,
        });
      },
      { initialProps: { registrationVersion: 0 } },
    );

    expect(onFailure).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    const target = createTarget();
    nodes.set("beta", target);
    rerender({ registrationVersion: 1 });
    act(flushAnimationFrames);

    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });

    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });

    expect(onComplete).toHaveBeenCalledWith(1);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("realinea instantáneamente antes de completar", () => {
    const target = createTarget(500);
    const nodes = new Map<SectionId, HTMLElement>([["beta", target]]);
    const onComplete = jest.fn();
    let currentScrollY = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => currentScrollY,
    });
    target.getBoundingClientRect = jest.fn(
      () => ({ top: 500 - currentScrollY }) as DOMRect,
    );
    Object.defineProperty(document.body, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    target.scrollIntoView = jest.fn((options) => {
      if (
        typeof options === "object" &&
        options?.behavior === "smooth"
      ) {
        currentScrollY = 484;
      }
    });
    const scrollTo = jest.fn((options?: ScrollToOptions | number) => {
      if (typeof options === "object" && options.top !== undefined) {
        currentScrollY = options.top;
      }
    });
    window.scrollTo = scrollTo as typeof window.scrollTo;

    renderHook(() =>
      useProgrammaticSectionScroll({
        nodes,
        phase: {
          kind: "programmatic",
          targetId: "beta",
          origin: "selection",
          behavior: "smooth",
          transactionId: 5,
        },
        completion,
        onComplete,
        onFailure: jest.fn(),
      }),
    );

    act(flushAnimationFrames);
    expect(target.scrollIntoView).toHaveBeenNthCalledWith(1, {
      behavior: "smooth",
      block: "start",
    });

    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });
    expect(window.scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      top: 500,
    });

    act(() => {
      jest.advanceTimersByTime(completion.settleDelay);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });
    expect(onComplete).toHaveBeenCalledWith(5);
  });

  it("reinicia la confirmación si la geometría cambia después de alinearse", () => {
    let documentTop = 500;
    let currentScrollY = 500;
    const target = createTarget();
    target.getBoundingClientRect = jest.fn(
      () => ({ top: documentTop - currentScrollY }) as DOMRect,
    );
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => currentScrollY,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(document.body, "scrollHeight", {
      configurable: true,
      value: 2_000,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2_000,
    });
    window.scrollTo = jest.fn((options?: ScrollToOptions | number) => {
      if (typeof options === "object" && options.top !== undefined) {
        currentScrollY = options.top;
      }
    }) as typeof window.scrollTo;
    let resizeCallback: ResizeObserverCallback | undefined;
    globalThis.ResizeObserver = jest.fn(
      (callback: ResizeObserverCallback) => {
        resizeCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
        } as unknown as ResizeObserver;
      },
    ) as unknown as typeof ResizeObserver;
    const onComplete = jest.fn();

    renderHook(() =>
      useProgrammaticSectionScroll({
        nodes: new Map<SectionId, HTMLElement>([["beta", target]]),
        phase: {
          kind: "programmatic",
          targetId: "beta",
          origin: "selection",
          behavior: "smooth",
          transactionId: 6,
        },
        completion,
        onComplete,
        onFailure: jest.fn(),
      }),
    );

    act(flushAnimationFrames);
    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });
    expect(onComplete).not.toHaveBeenCalled();

    documentTop = 516;
    act(() => {
      resizeCallback?.([], {} as ResizeObserver);
    });
    act(flushAnimationFrames);
    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });

    expect(window.scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      top: 516,
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(completion.settleDelay);
      jest.advanceTimersByTime(completion.idleDelay);
    });
    expect(onComplete).toHaveBeenCalledWith(6);
  });

  it("falla si un destino que ya había iniciado desaparece", () => {
    const target = createTarget();
    const nodes = new Map<SectionId, HTMLElement>([["beta", target]]);
    const onFailure = jest.fn();
    const phase: SectionNavigationPhase<SectionId> = {
      kind: "programmatic",
      targetId: "beta",
      origin: "selection",
      behavior: "smooth",
      transactionId: 7,
    };
    const { rerender } = renderHook(
      ({ registrationVersion }) => {
        void registrationVersion;
        return useProgrammaticSectionScroll({
          nodes,
          phase,
          completion,
          onComplete: jest.fn(),
          onFailure,
        });
      },
      { initialProps: { registrationVersion: 1 } },
    );

    act(flushAnimationFrames);
    nodes.delete("beta");
    target.remove();
    rerender({ registrationVersion: 2 });

    expect(onFailure).toHaveBeenCalledWith(7);
  });

  it("no reinicia la transacción si cambia un registro no relacionado", () => {
    const target = createTarget();
    const nodes = new Map<SectionId, HTMLElement>([["beta", target]]);
    const phase: SectionNavigationPhase<SectionId> = {
      kind: "programmatic",
      targetId: "beta",
      origin: "selection",
      behavior: "smooth",
      transactionId: 8,
    };
    const onComplete = jest.fn();
    const onFailure = jest.fn();
    const { rerender } = renderHook(
      ({ registrationVersion }) => {
        void registrationVersion;
        return useProgrammaticSectionScroll({
          nodes,
          phase,
          completion,
          onComplete,
          onFailure,
        });
      },
      { initialProps: { registrationVersion: 1 } },
    );

    act(flushAnimationFrames);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);

    nodes.set("alpha", createTarget());
    rerender({ registrationVersion: 2 });
    act(flushAnimationFrames);

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
  });

  it("usa scrollend y desconecta ResizeObserver al desmontarse", () => {
    const target = createTarget();
    const nodes = new Map<SectionId, HTMLElement>([["beta", target]]);
    const observe = jest.fn();
    const disconnect = jest.fn();
    globalThis.ResizeObserver = jest.fn(
      () =>
        ({
          observe,
          disconnect,
        }) as unknown as ResizeObserver,
    ) as unknown as typeof ResizeObserver;
    const onComplete = jest.fn();
    const { unmount } = renderHook(() =>
      useProgrammaticSectionScroll({
        nodes,
        phase: {
          kind: "programmatic",
          targetId: "beta",
          origin: "selection",
          behavior: "smooth",
          transactionId: 9,
        },
        completion,
        onComplete,
        onFailure: jest.fn(),
      }),
    );

    act(flushAnimationFrames);
    expect(observe).toHaveBeenCalledWith(document.body);

    act(() => {
      document.dispatchEvent(new Event("scrollend"));
      jest.advanceTimersByTime(completion.settleDelay - 1);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(completion.idleDelay);
    });
    expect(onComplete).toHaveBeenCalledWith(9);
    expect(disconnect).toHaveBeenCalledTimes(1);

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("cancela timers y listeners de una transacción reemplazada", () => {
    const alpha = createTarget();
    const beta = createTarget();
    const nodes = new Map<SectionId, HTMLElement>([
      ["alpha", alpha],
      ["beta", beta],
    ]);
    const onComplete = jest.fn();
    const removeEventListener = jest.spyOn(
      document,
      "removeEventListener",
    );
    const { rerender } = renderHook(
      ({ phase }: { phase: SectionNavigationPhase<SectionId> }) =>
        useProgrammaticSectionScroll({
          nodes,
          phase,
          completion,
          onComplete,
          onFailure: jest.fn(),
        }),
      {
        initialProps: {
          phase: {
            kind: "programmatic",
            targetId: "alpha",
            origin: "selection",
            behavior: "smooth",
            transactionId: 9,
          } as SectionNavigationPhase<SectionId>,
        },
      },
    );

    act(flushAnimationFrames);
    rerender({
      phase: {
        kind: "programmatic",
        targetId: "beta",
        origin: "selection",
        behavior: "smooth",
        transactionId: 10,
      },
    });
    act(flushAnimationFrames);
    act(() => {
      jest.runAllTimers();
    });

    expect(onComplete).not.toHaveBeenCalledWith(9);
    expect(onComplete).toHaveBeenCalledWith(10);
    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
    expect(removeEventListener).toHaveBeenCalledWith(
      "scrollend",
      expect.any(Function),
    );
  });

  it("considera scroll-margin-top y el límite inferior del documento", () => {
    const target = createTarget(1_900);
    target.style.scrollMarginTop = "72px";
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(document.body, "scrollHeight", {
      configurable: true,
      value: 2_000,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2_000,
    });

    expect(getExpectedSectionScrollY(target)).toBe(1_200);
  });
});
