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

jest.mock("react-router", () => ({
  useLocation: () => ({
    hash: "#summary",
    key: "location-key",
    pathname: "/manage-v2",
    search: "",
  }),
  useNavigate: () => mockNavigate,
  useNavigationType: () => "PUSH",
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
});
