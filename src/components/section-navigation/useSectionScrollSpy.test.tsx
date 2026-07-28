import { act, renderHook } from "@testing-library/react";
import { useSectionScrollSpy } from "./useSectionScrollSpy";

type SectionId = "alpha" | "beta";

function createEntry(
  target: HTMLElement,
  top: number,
  isIntersecting = true,
) {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top },
  } as unknown as IntersectionObserverEntry;
}

describe("useSectionScrollSpy", () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("resuelve IDs por el registro y no por HTMLElement.id", () => {
    const alpha = document.createElement("section");
    const beta = document.createElement("section");
    alpha.id = "unrelated-alpha";
    beta.id = "unrelated-beta";
    const nodes = new Map<SectionId, HTMLElement>([
      ["alpha", alpha],
      ["beta", beta],
    ]);
    const observe = jest.fn();
    const disconnect = jest.fn();
    const onActiveChange = jest.fn();
    let observerCallback: IntersectionObserverCallback | undefined;
    let observerOptions: IntersectionObserverInit | undefined;

    globalThis.IntersectionObserver = jest.fn(
      (
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) => {
        observerCallback = callback;
        observerOptions = options;
        return {
          observe,
          disconnect,
        } as unknown as IntersectionObserver;
      },
    ) as unknown as typeof IntersectionObserver;

    renderHook(() =>
      useSectionScrollSpy({
        ids: ["alpha", "beta"],
        nodes,
        registrationVersion: 2,
        disabled: false,
        topOffset: 72,
        bottomMarginPercent: 60,
        onActiveChange,
      }),
    );

    expect(observe).toHaveBeenCalledWith(alpha);
    expect(observe).toHaveBeenCalledWith(beta);
    expect(observerOptions).toMatchObject({
      root: null,
      rootMargin: "-72px 0px -60% 0px",
    });

    act(() => {
      observerCallback?.(
        [createEntry(alpha, 130), createEntry(beta, 78)],
        {} as IntersectionObserver,
      );
    });

    expect(onActiveChange).toHaveBeenLastCalledWith("beta");
  });

  it("admite el string vacío como ID según el contrato genérico", () => {
    type EmptySectionId = "" | "beta";
    const emptyIdNode = document.createElement("section");
    const nodes = new Map<EmptySectionId, HTMLElement>([
      ["", emptyIdNode],
    ]);
    const onActiveChange = jest.fn();
    let observerCallback: IntersectionObserverCallback | undefined;

    globalThis.IntersectionObserver = jest.fn(
      (callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
        } as unknown as IntersectionObserver;
      },
    ) as unknown as typeof IntersectionObserver;

    renderHook(() =>
      useSectionScrollSpy({
        ids: ["", "beta"],
        nodes,
        registrationVersion: 1,
        disabled: false,
        topOffset: 72,
        bottomMarginPercent: 60,
        onActiveChange,
      }),
    );

    act(() => {
      observerCallback?.(
        [createEntry(emptyIdNode, 72)],
        {} as IntersectionObserver,
      );
    });

    expect(onActiveChange).toHaveBeenCalledWith("");
  });

  it("desconecta el observer al deshabilitarse", () => {
    const node = document.createElement("section");
    const nodes = new Map<SectionId, HTMLElement>([["alpha", node]]);
    const disconnect = jest.fn();

    globalThis.IntersectionObserver = jest.fn(
      () =>
        ({
          observe: jest.fn(),
          disconnect,
        }) as unknown as IntersectionObserver,
    ) as unknown as typeof IntersectionObserver;

    const { rerender } = renderHook(
      ({ disabled }) =>
        useSectionScrollSpy({
          ids: ["alpha", "beta"],
          nodes,
          registrationVersion: 1,
          disabled,
          topOffset: 72,
          bottomMarginPercent: 60,
          onActiveChange: jest.fn(),
        }),
      { initialProps: { disabled: false } },
    );

    rerender({ disabled: true });

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("ignora targets no registrados y entradas que dejaron de intersectar", () => {
    const alpha = document.createElement("section");
    const unknown = document.createElement("section");
    const nodes = new Map<SectionId, HTMLElement>([["alpha", alpha]]);
    const onActiveChange = jest.fn();
    let observerCallback: IntersectionObserverCallback | undefined;

    globalThis.IntersectionObserver = jest.fn(
      (callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
        } as unknown as IntersectionObserver;
      },
    ) as unknown as typeof IntersectionObserver;

    renderHook(() =>
      useSectionScrollSpy({
        ids: ["alpha", "beta"],
        nodes,
        registrationVersion: 1,
        disabled: false,
        topOffset: 72,
        bottomMarginPercent: 60,
        onActiveChange,
      }),
    );

    act(() => {
      observerCallback?.(
        [
          createEntry(unknown, 72),
          createEntry(alpha, 72, false),
        ],
        {} as IntersectionObserver,
      );
    });

    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it("activa la última sección al alcanzar el final del documento", () => {
    const alpha = document.createElement("section");
    const beta = document.createElement("section");
    const nodes = new Map<SectionId, HTMLElement>([
      ["alpha", alpha],
      ["beta", beta],
    ]);
    const onActiveChange = jest.fn();
    const originalScrollY = Object.getOwnPropertyDescriptor(
      window,
      "scrollY",
    );
    const originalInnerHeight = Object.getOwnPropertyDescriptor(
      window,
      "innerHeight",
    );
    const originalBodyScrollHeight = Object.getOwnPropertyDescriptor(
      document.body,
      "scrollHeight",
    );
    const originalDocumentScrollHeight = Object.getOwnPropertyDescriptor(
      document.documentElement,
      "scrollHeight",
    );

    globalThis.IntersectionObserver = jest.fn(
      () =>
        ({
          observe: jest.fn(),
          disconnect: jest.fn(),
        }) as unknown as IntersectionObserver,
    ) as unknown as typeof IntersectionObserver;

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 1_198,
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

    try {
      renderHook(() =>
        useSectionScrollSpy({
          ids: ["alpha", "beta"],
          nodes,
          registrationVersion: 2,
          disabled: false,
          topOffset: 72,
          bottomMarginPercent: 60,
          onActiveChange,
        }),
      );

      act(() => {
        document.dispatchEvent(new Event("scroll"));
      });

      expect(onActiveChange).toHaveBeenLastCalledWith("beta");
    } finally {
      if (originalScrollY) {
        Object.defineProperty(window, "scrollY", originalScrollY);
      }
      if (originalInnerHeight) {
        Object.defineProperty(window, "innerHeight", originalInnerHeight);
      }
      if (originalBodyScrollHeight) {
        Object.defineProperty(
          document.body,
          "scrollHeight",
          originalBodyScrollHeight,
        );
      } else {
        Reflect.deleteProperty(document.body, "scrollHeight");
      }
      if (originalDocumentScrollHeight) {
        Object.defineProperty(
          document.documentElement,
          "scrollHeight",
          originalDocumentScrollHeight,
        );
      } else {
        Reflect.deleteProperty(
          document.documentElement,
          "scrollHeight",
        );
      }
    }
  });
});
