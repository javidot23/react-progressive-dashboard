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
  const [initialSetup] = useState(() => {
    const initialId = getSectionIdFromHash(location.hash);
    const isHistoryNavigation = navigationType === "POP";
    const shouldAlignInitialSection =
      isHistoryNavigation || initialId !== "summary";

    return {
      initialId,
      initialNavigation: shouldAlignInitialSection
        ? {
            targetId: initialId,
            origin: "history" as const,
            behavior: "auto" as const,
          }
        : undefined,
      handledHistoryLocation: isHistoryNavigation
        ? { hash: location.hash, key: location.key }
        : null,
      pendingHistoryTarget: isHistoryNavigation ? initialId : null,
    };
  });
  const handledHistoryLocation = useRef<{
    hash: string;
    key: string;
  } | null>(initialSetup.handledHistoryLocation);
  const pendingHistoryTarget = useRef<ManageSectionId | null>(
    initialSetup.pendingHistoryTarget,
  );
  const [activatedIds, setActivatedIds] = useState<Set<ManageSectionId>>(
    () => new Set(["summary", initialSetup.initialId]),
  );

  const activateSection = useCallback((id: ManageSectionId) => {
    setActivatedIds((current) => {
      if (current.has(id)) return current;

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);
  const { prepareSection, preloadNextSection } =
    useManageSectionPreparation();
  const {
    activeId,
    isProgrammaticScrolling,
    navigateTo,
    getSectionRef,
  } = useSectionNavigationController({
    ids: manageSectionIds,
    initialId: initialSetup.initialId,
    initialNavigation: initialSetup.initialNavigation,
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
    prepareSection(initialSetup.initialId);
  }, [initialSetup.initialId, prepareSection]);

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
