import { act, renderHook } from "@testing-library/react";
import type { NavbarSelectEvent } from "../../components/navbarEvents";
import { useSectionNavigationController } from "../../components/section-navigation/useSectionNavigationController";
import { useManagePageController } from "./useManagePageController";
import { useManageSectionPreparation } from "./useManageSectionPreparation";

const mockNavigate = jest.fn();
const mockNavigateTo = jest.fn();
const mockGetSectionRef = jest.fn(() => jest.fn());
const mockPrepareSection = jest.fn();
const mockPreloadNextSection = jest.fn();
let mockLocation = {
  hash: "#summary",
  key: "location-key",
  pathname: "/manage-v2",
  search: "",
};
let mockNavigationType = "PUSH";

jest.mock("react-router", () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
  useNavigationType: () => mockNavigationType,
}));

jest.mock(
  "../../components/section-navigation/useSectionNavigationController",
  () => ({
    useSectionNavigationController: jest.fn(),
  }),
);

jest.mock("./useManageSectionPreparation", () => ({
  useManageSectionPreparation: jest.fn(),
}));

const mockedUseSectionNavigationController = jest.mocked(
  useSectionNavigationController,
);
const mockedUseManageSectionPreparation = jest.mocked(
  useManageSectionPreparation,
);

function createSelectEvent(
  overrides: Partial<
    Pick<
      NavbarSelectEvent,
      "altKey" | "button" | "ctrlKey" | "metaKey" | "shiftKey"
    >
  > = {},
) {
  return {
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    preventDefault: jest.fn(),
    shiftKey: false,
    ...overrides,
  } as unknown as NavbarSelectEvent;
}

describe("useManagePageController", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation = {
      hash: "#summary",
      key: "location-key",
      pathname: "/manage-v2",
      search: "",
    };
    mockNavigationType = "PUSH";
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    mockedUseSectionNavigationController.mockReturnValue({
      activeId: "summary",
      phase: { kind: "idle" },
      isProgrammaticScrolling: false,
      navigateTo: mockNavigateTo,
      getSectionRef: mockGetSectionRef,
    });
    mockedUseManageSectionPreparation.mockReturnValue({
      prepareSection: mockPrepareSection,
      preloadNextSection: mockPreloadNextSection,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("intercepta una selección primaria y activa el destino de inmediato", () => {
    const { result } = renderHook(() => useManagePageController());
    const event = createSelectEvent();

    act(() => {
      result.current.handleSectionSelect("inventory", event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockPrepareSection).toHaveBeenCalledWith("inventory");
    expect(mockNavigateTo).toHaveBeenCalledWith("inventory", {
      origin: "selection",
      behavior: "smooth",
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      {
        pathname: "/manage-v2",
        search: "",
        hash: "#inventory",
      },
      { preventScrollReset: true },
    );
    expect(result.current.activatedIds).toContain("inventory");
  });

  it("conserva el comportamiento nativo de clicks modificados", () => {
    const { result } = renderHook(() => useManagePageController());
    const event = createSelectEvent({ metaKey: true });

    mockNavigate.mockClear();
    mockNavigateTo.mockClear();
    mockPrepareSection.mockClear();

    act(() => {
      result.current.handleSectionSelect("inventory", event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mockPrepareSection).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("respeta reduced motion al seleccionar una sección", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => useManagePageController());

    act(() => {
      result.current.handleSectionSelect(
        "sales",
        createSelectEvent(),
      );
    });

    expect(mockNavigateTo).toHaveBeenCalledWith("sales", {
      origin: "selection",
      behavior: "auto",
    });
  });

  it("inicia una navegación POP cuando cambia la entrada del historial", () => {
    const { rerender } = renderHook(() => useManagePageController());

    mockNavigate.mockClear();
    mockNavigateTo.mockClear();
    mockPrepareSection.mockClear();
    mockLocation = {
      ...mockLocation,
      hash: "#sales",
      key: "history-sales",
    };
    mockNavigationType = "POP";

    rerender();

    expect(mockPrepareSection).toHaveBeenCalledWith("sales");
    expect(mockNavigateTo).toHaveBeenCalledWith("sales", {
      origin: "history",
      behavior: "auto",
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("reemplaza el hash cuando el scroll spy cambia la sección activa", () => {
    mockedUseSectionNavigationController.mockReturnValue({
      activeId: "inventory",
      phase: { kind: "idle" },
      isProgrammaticScrolling: false,
      navigateTo: mockNavigateTo,
      getSectionRef: mockGetSectionRef,
    });

    renderHook(() => useManagePageController());

    expect(mockNavigate).toHaveBeenCalledWith(
      {
        pathname: "/manage-v2",
        search: "",
        hash: "#inventory",
      },
      {
        preventScrollReset: true,
        replace: true,
      },
    );
  });

  it("normaliza un hash inicial malformado sin lanzar excepciones", () => {
    mockLocation = {
      ...mockLocation,
      hash: "#%",
    };
    mockNavigationType = "POP";

    renderHook(() => useManagePageController());

    expect(mockedUseSectionNavigationController).toHaveBeenCalledWith(
      expect.objectContaining({
        initialId: "summary",
        initialNavigation: {
          targetId: "summary",
          origin: "history",
          behavior: "auto",
        },
      }),
    );
  });

  it("restaura la política previa de scroll del historial al desmontar", () => {
    const previousDescriptor = Object.getOwnPropertyDescriptor(
      window.history,
      "scrollRestoration",
    );
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      writable: true,
      value: "auto",
    });

    try {
      const { unmount } = renderHook(() => useManagePageController());

      expect(window.history.scrollRestoration).toBe("manual");

      unmount();

      expect(window.history.scrollRestoration).toBe("auto");
    } finally {
      if (previousDescriptor) {
        Object.defineProperty(
          window.history,
          "scrollRestoration",
          previousDescriptor,
        );
      } else {
        Reflect.deleteProperty(window.history, "scrollRestoration");
      }
    }
  });
});
