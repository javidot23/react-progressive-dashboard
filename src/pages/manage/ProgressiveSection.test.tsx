import { lazy } from "react";
import { act, render } from "@testing-library/react";
import { inventoryInitialPlaceholderMinHeight } from "../../features/inventory/inventoryConfig";
import type { ManageSectionDefinition } from "./manageSections";
import { ProgressiveSection } from "./ProgressiveSection";

describe("ProgressiveSection", () => {
  it("registra y desregistra el nodo externo de la sección", () => {
    const sectionRef = jest.fn();
    const load = jest.fn(async () => ({ default: () => null }));
    const definition: ManageSectionDefinition = {
      id: "inventory",
      label: "Inventory",
      placeholderMinHeight: inventoryInitialPlaceholderMinHeight,
      load,
      Component: lazy(load),
    };

    const { container, unmount } = render(
      <ProgressiveSection
        activationDisabled
        activated={false}
        definition={definition}
        onActivate={jest.fn()}
        sectionRef={sectionRef}
      />,
    );
    const section = container.querySelector("#inventory");

    expect(sectionRef).toHaveBeenCalledWith(section);

    unmount();

    expect(sectionRef).toHaveBeenLastCalledWith(null);
  });

  it("conserva la altura mínima mientras una sección activada sigue cargando", () => {
    const load = jest.fn(
      () =>
        new Promise<{ default: () => null }>(() => {
          // Mantiene el componente lazy pendiente para verificar el fallback.
        }),
    );
    const definition: ManageSectionDefinition = {
      id: "inventory",
      label: "Inventory",
      placeholderMinHeight: inventoryInitialPlaceholderMinHeight,
      load,
      Component: lazy(load),
    };
    const { container, getByRole } = render(
      <ProgressiveSection
        activated
        definition={definition}
        onActivate={jest.fn()}
        sectionRef={jest.fn()}
      />,
    );

    expect(container.querySelector("#inventory")).toHaveStyle({
      minHeight: `calc(${inventoryInitialPlaceholderMinHeight}px + 6rem)`,
    });
    expect(
      getByRole("region", { name: "Inventory" }),
    ).toBeInTheDocument();
  });

  it("pospone la activación por viewport durante un scroll programático", () => {
    const observe = jest.fn();
    const disconnect = jest.fn();
    let observerCallback: IntersectionObserverCallback | undefined;
    const intersectionObserver = jest.fn(
      (callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return { disconnect, observe } as unknown as IntersectionObserver;
      },
    );
    const previousIntersectionObserver = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver =
      intersectionObserver as unknown as typeof IntersectionObserver;
    const load = jest.fn(async () => ({ default: () => null }));
    const onActivate = jest.fn();
    const definition: ManageSectionDefinition = {
      id: "inventory",
      label: "Inventory",
      placeholderMinHeight: inventoryInitialPlaceholderMinHeight,
      load,
      Component: lazy(load),
    };
    const renderSection = (activationDisabled: boolean) => (
      <ProgressiveSection
        activationDisabled={activationDisabled}
        activated={false}
        definition={definition}
        onActivate={onActivate}
        sectionRef={jest.fn()}
      />
    );

    try {
      const { container, rerender } = render(renderSection(true));

      expect(intersectionObserver).not.toHaveBeenCalled();

      rerender(renderSection(false));

      const section = container.querySelector("#inventory");
      expect(observe).toHaveBeenCalledWith(section);

      act(() => {
        observerCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });

      expect(load).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith("inventory");
      expect(disconnect).toHaveBeenCalled();
    } finally {
      globalThis.IntersectionObserver = previousIntersectionObserver;
    }
  });
});
