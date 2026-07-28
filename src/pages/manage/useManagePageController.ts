import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router";
import { useSectionNavigationController } from "../../components/section-navigation";
import {
  isUnmodifiedPrimaryClick,
  type NavbarSelectEvent,
} from "../../components/navbarEvents";
import {
  getSectionIdFromHash,
  manageSections,
  type ManageSectionId,
} from "./manageSections";
import { useManageSectionPreparation } from "./useManageSectionPreparation";

const manageSectionIds = manageSections.map((section) => section.id);

export function useManagePageController() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const initialIdRef = useRef<ManageSectionId>(
    getSectionIdFromHash(location.hash),
  );
  const shouldAlignInitialSection =
    navigationType === "POP" || initialIdRef.current !== "summary";
  const initialNavigationRef = useRef(
    shouldAlignInitialSection
      ? {
          targetId: initialIdRef.current,
          origin: "history" as const,
          behavior: "auto" as const,
        }
      : undefined,
  );
  const handledHistoryLocation = useRef<{
    hash: string;
    key: string;
  } | null>(
    navigationType === "POP"
      ? { hash: location.hash, key: location.key }
      : null,
  );
  const pendingHistoryTarget = useRef<ManageSectionId | null>(
    navigationType === "POP" ? initialIdRef.current : null,
  );
  const [activatedIds, setActivatedIds] = useState<Set<ManageSectionId>>(
    () => new Set(["summary", initialIdRef.current]),
  );
  const { prepareSection, preloadNextSection } =
    useManageSectionPreparation();
  const {
    activeId,
    isProgrammaticScrolling,
    navigateTo,
    getSectionRef,
  } = useSectionNavigationController({
    ids: manageSectionIds,
    initialId: initialIdRef.current,
    initialNavigation: initialNavigationRef.current,
    scrollSpy: {
      topOffset: 72,
      bottomMarginPercent: 60,
    },
    scrollCompletion: {
      alignmentTolerance: 4,
      idleDelay: 250,
      settleDelay: 80,
    },
  });

  const activateSection = useCallback((id: ManageSectionId) => {
    setActivatedIds((current) => {
      if (current.has(id)) return current;

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const handleSectionIntent = useCallback(
    (id: ManageSectionId) => {
      prepareSection(id);
    },
    [prepareSection],
  );

  const handleSectionSelect = useCallback(
    (id: ManageSectionId, event: NavbarSelectEvent) => {
      if (!isUnmodifiedPrimaryClick(event)) return;

      event.preventDefault();
      activateSection(id);
      prepareSection(id);

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      navigateTo(id, {
        origin: "selection",
        behavior: reducedMotion ? "auto" : "smooth",
      });

      if (location.hash !== `#${id}`) {
        navigate(
          {
            pathname: location.pathname,
            search: location.search,
            hash: `#${id}`,
          },
          { preventScrollReset: true },
        );
      }
    },
    [
      activateSection,
      location.hash,
      location.pathname,
      location.search,
      navigate,
      navigateTo,
      prepareSection,
    ],
  );

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    prepareSection(initialIdRef.current);
  }, [prepareSection]);

  useEffect(() => {
    if (navigationType !== "POP") {
      handledHistoryLocation.current = null;
      return;
    }

    if (
      handledHistoryLocation.current?.key === location.key &&
      handledHistoryLocation.current.hash === location.hash
    ) {
      return;
    }

    handledHistoryLocation.current = {
      hash: location.hash,
      key: location.key,
    };
    const id = getSectionIdFromHash(location.hash);

    pendingHistoryTarget.current = id;
    activateSection(id);
    prepareSection(id);
    navigateTo(id, {
      origin: "history",
      behavior: "auto",
    });
  }, [
    activateSection,
    location.hash,
    location.key,
    navigationType,
    navigateTo,
    prepareSection,
  ]);

  useEffect(() => {
    activateSection(activeId);
    preloadNextSection(activeId);

    if (pendingHistoryTarget.current !== null) {
      if (
        activeId !== pendingHistoryTarget.current ||
        isProgrammaticScrolling
      ) {
        return;
      }

      pendingHistoryTarget.current = null;
    }

    if (
      isProgrammaticScrolling ||
      location.hash === `#${activeId}`
    ) {
      return;
    }

    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${activeId}`,
      },
      {
        preventScrollReset: true,
        replace: true,
      },
    );
  }, [
    activateSection,
    activeId,
    isProgrammaticScrolling,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    preloadNextSection,
  ]);

  return {
    activeId,
    activatedIds,
    isProgrammaticScrolling,
    getSectionRef,
    activateSection,
    handleSectionIntent,
    handleSectionSelect,
  };
}
