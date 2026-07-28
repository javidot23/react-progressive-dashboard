import { act, renderHook } from "@testing-library/react";
import type { UseSectionNavigationOptions } from "./types";
import { useSectionNavigationController } from "./useSectionNavigationController";

type SectionId = "alpha" | "beta";

const ids = ["alpha", "beta"] as const;

describe("useSectionNavigationController", () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
  let animationFrames: FrameRequestCallback[];

  beforeEach(() => {
    jest.useFakeTimers();
    animationFrames = [];
    globalThis.IntersectionObserver = jest.fn(
      () =>
        ({
          observe: jest.fn(),
          disconnect: jest.fn(),
        }) as unknown as IntersectionObserver,
    ) as unknown as typeof IntersectionObserver;
    window.requestAnimationFrame = jest.fn((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    window.cancelAnimationFrame = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.IntersectionObserver = originalIntersectionObserver;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    document.body.replaceChildren();
  });

  function flushAnimationFrames() {
    const callbacks = animationFrames;
    animationFrames = [];
    callbacks.forEach((callback) => callback(0));
  }

  function renderController(
    options: UseSectionNavigationOptions<SectionId> = {
      ids,
      initialId: "alpha",
    },
  ) {
    return renderHook(() => useSectionNavigationController(options));
  }

  it("devuelve refs estables por ID", () => {
    const { result, rerender } = renderController();
    const firstAlphaRef = result.current.getSectionRef("alpha");
    const firstBetaRef = result.current.getSectionRef("beta");

    rerender();

    expect(result.current.getSectionRef("alpha")).toBe(firstAlphaRef);
    expect(result.current.getSectionRef("beta")).toBe(firstBetaRef);
    expect(firstAlphaRef).not.toBe(firstBetaRef);
  });

  it("activa el destino inmediatamente y completa la transacción", () => {
    const { result } = renderController();
    const target = document.createElement("section");
    target.getBoundingClientRect = jest.fn(
      () => ({ top: 0 }) as DOMRect,
    );
    document.body.append(target);

    act(() => {
      result.current.getSectionRef("beta")(target);
    });
    act(() => {
      result.current.navigateTo("beta", {
        origin: "selection",
        behavior: "smooth",
      });
    });

    expect(result.current.activeId).toBe("beta");
    expect(result.current.isProgrammaticScrolling).toBe(true);
    expect(result.current.phase).toMatchObject({
      kind: "programmatic",
      targetId: "beta",
      transactionId: 1,
    });

    act(flushAnimationFrames);
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.phase).toEqual({ kind: "idle" });
    expect(result.current.activeId).toBe("beta");
  });

  it("la navegación inicial espera el registro del destino", () => {
    const { result } = renderController({
      ids,
      initialId: "alpha",
      initialNavigation: {
        targetId: "beta",
        origin: "history",
        behavior: "auto",
      },
    });

    expect(result.current.activeId).toBe("beta");
    expect(result.current.isProgrammaticScrolling).toBe(true);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    const target = document.createElement("section");
    target.getBoundingClientRect = jest.fn(
      () => ({ top: 0 }) as DOMRect,
    );
    document.body.append(target);

    act(() => {
      result.current.getSectionRef("beta")(target);
    });
    act(flushAnimationFrames);
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.phase).toEqual({ kind: "idle" });
  });

  it("asigna transactionId monotónicos al reemplazar navegaciones", () => {
    const { result } = renderController();

    act(() => {
      result.current.navigateTo("beta", {
        origin: "selection",
        behavior: "smooth",
      });
      result.current.navigateTo("alpha", {
        origin: "history",
        behavior: "auto",
      });
    });

    expect(result.current.phase).toMatchObject({
      kind: "programmatic",
      targetId: "alpha",
      transactionId: 2,
    });
    expect(result.current.activeId).toBe("alpha");
  });

  it.each([
    {
      label: "lista vacía",
      options: { ids: [], initialId: "alpha" },
      message: "at least one",
    },
    {
      label: "IDs duplicados",
      options: {
        ids: ["alpha", "alpha"],
        initialId: "alpha",
      },
      message: "unique",
    },
    {
      label: "initialId desconocido",
      options: { ids, initialId: "unknown" },
      message: "Initial section ID",
    },
    {
      label: "destino inicial desconocido",
      options: {
        ids,
        initialId: "alpha",
        initialNavigation: {
          targetId: "unknown",
          origin: "history",
          behavior: "auto",
        },
      },
      message: "Initial navigation target",
    },
  ])("rechaza $label", ({ options, message }) => {
    expect(() =>
      renderHook(() =>
        useSectionNavigationController(
          options as UseSectionNavigationOptions<SectionId>,
        ),
      ),
    ).toThrow(message);
  });

  it("rechaza cambios en IDs u orden durante el montaje", () => {
    const { rerender } = renderHook(
      ({ currentIds }: { currentIds: readonly SectionId[] }) =>
        useSectionNavigationController({
          ids: currentIds,
          initialId: "alpha",
        }),
      { initialProps: { currentIds: ids as readonly SectionId[] } },
    );

    expect(() =>
      rerender({ currentIds: ["beta", "alpha"] }),
    ).toThrow("must remain stable");
  });

  it("rechaza refs y destinos desconocidos", () => {
    const { result } = renderController();

    expect(() =>
      result.current.getSectionRef("unknown" as SectionId),
    ).toThrow("not present in ids");
    expect(() =>
      act(() => {
        result.current.navigateTo("unknown" as SectionId, {
          origin: "selection",
          behavior: "smooth",
        });
      }),
    ).toThrow("not present in ids");
  });

  it("valida las opciones numéricas", () => {
    expect(() =>
      renderController({
        ids,
        initialId: "alpha",
        scrollSpy: { bottomMarginPercent: 101 },
      }),
    ).toThrow("between 0 and 100");
  });
});
