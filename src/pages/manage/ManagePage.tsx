import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";
import {
  defaultInventoryFilters,
  inventoryRiskQueryOptions,
} from "../../features/inventory/inventoryQueryOptions";
import { useRouteView } from "../../hooks/useRouteView";
import {
  getSectionIdFromHash,
  manageSections,
  type ManageSectionId,
} from "./manageSections";
import { ManageScrollProvider } from "./ManageScrollContext";
import { ProgressiveSection } from "./ProgressiveSection";
import { useScrollSpy } from "./useScrollSpy";
import {
  Navbar,
  NavbarItem,
  NavbarSelectEvent,
} from "../../components/Navbar";
import { isUnmodifiedPrimaryClick } from "../../components/navbarEvents";
import {
  DollarSign,
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";

const manageSectionIds = manageSections.map((section) => section.id);
const manageSectionIcons = {
  summary: LayoutDashboard,
  inventory: Package,
  demand: TrendingUp,
  supply: Truck,
  sales: DollarSign,
} satisfies Record<ManageSectionId, LucideIcon>;
const manageNavbarItems = manageSections.map(({ id, label }) => ({
  id,
  label,
  to: `#${id}`,
  icon: manageSectionIcons[id],
})) satisfies readonly NavbarItem[];
const scrollAlignmentTolerance = 4;
const scrollIdleDelay = 250;
const scrollEndSettleDelay = 80;

function getExpectedScrollY(node: HTMLElement) {
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

function isSectionAligned(node: HTMLElement) {
  return (
    Math.abs(window.scrollY - getExpectedScrollY(node)) <=
    scrollAlignmentTolerance
  );
}

export default function ManagePage() {
  const routeHeadingRef = useRouteView("Manage");
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const queryClient = useQueryClient();
  const initialId = useMemo(
    () => getSectionIdFromHash(location.hash),
    [location.hash],
  );
  const [activatedIds, setActivatedIds] = useState<Set<ManageSectionId>>(
    () => new Set<ManageSectionId>(["summary", initialId]),
  );
  const sectionNodes = useRef(new Map<ManageSectionId, HTMLElement>());
  const [registrationVersion, setRegistrationVersion] = useState(0);
  const programmaticTarget = useRef<ManageSectionId | null>(
    navigationType === "POP" ? initialId : null,
  );
  const programmaticScrollFrame = useRef<number | null>(null);
  const programmaticScrollCleanup = useRef<(() => void) | null>(null);
  const [isProgrammaticScrolling, setIsProgrammaticScrolling] = useState(
    () => navigationType === "POP",
  );
  const registerNode = useCallback(
    (id: ManageSectionId, node: HTMLElement | null) => {
      const previous = sectionNodes.current.get(id);

      if (node && previous !== node) {
        sectionNodes.current.set(id, node);
        setRegistrationVersion((version) => version + 1);
      } else if (!node && previous) {
        sectionNodes.current.delete(id);
        setRegistrationVersion((version) => version + 1);
      }
    },
    [],
  );

  const activateSection = useCallback((id: ManageSectionId) => {
    setActivatedIds((current) => {
      if (current.has(id)) return current;

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const preloadSectionChunk = useCallback((id: ManageSectionId) => {
    const definition = manageSections.find((section) => section.id === id);
    void definition?.load().catch(() => undefined);
  }, []);

  const prefetchSectionData = useCallback(
    (id: ManageSectionId) => {
      if (id === "inventory") {
        void queryClient.prefetchInfiniteQuery(
          inventoryRiskQueryOptions(defaultInventoryFilters),
        );
      }
    },
    [queryClient],
  );

  const prepareSection = useCallback(
    (id: ManageSectionId) => {
      preloadSectionChunk(id);
      prefetchSectionData(id);
    },
    [prefetchSectionData, preloadSectionChunk],
  );

  const [activeId, setActiveId] = useScrollSpy(
    manageSectionIds,
    sectionNodes.current,
    registrationVersion,
    initialId,
    isProgrammaticScrolling,
  );
  const scrollToSection = useCallback(
    (id: ManageSectionId, behavior: ScrollBehavior) => {
      if (programmaticScrollFrame.current !== null) {
        window.cancelAnimationFrame(programmaticScrollFrame.current);
        programmaticScrollFrame.current = null;
      }

      programmaticScrollCleanup.current?.();
      programmaticScrollCleanup.current = null;

      programmaticTarget.current = id;
      setIsProgrammaticScrolling(true);

      programmaticScrollFrame.current = window.requestAnimationFrame(() => {
        programmaticScrollFrame.current = null;

        const targetNode = sectionNodes.current.get(id);

        if (!targetNode) {
          programmaticTarget.current = null;
          setIsProgrammaticScrolling(false);
          return;
        }

        const scrollTarget: HTMLElement = targetNode;
        let idleTimer: number | null = null;
        let layoutFrame: number | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let lastTargetTop =
          scrollTarget.getBoundingClientRect().top + window.scrollY;

        function cleanup() {
          document.removeEventListener("scroll", handleScroll);
          document.removeEventListener("scrollend", handleScrollEnd);
          resizeObserver?.disconnect();

          if (idleTimer !== null) {
            window.clearTimeout(idleTimer);
            idleTimer = null;
          }

          if (layoutFrame !== null) {
            window.cancelAnimationFrame(layoutFrame);
            layoutFrame = null;
          }
        }

        function completeScroll() {
          if (programmaticTarget.current !== id) {
            return;
          }

          cleanup();
          programmaticScrollCleanup.current = null;
          programmaticTarget.current = null;
          setActiveId(id);
          setIsProgrammaticScrolling(false);
        }

        function alignOrComplete() {
          idleTimer = null;

          if (programmaticTarget.current !== id) {
            return;
          }

          if (isSectionAligned(scrollTarget)) {
            completeScroll();
            return;
          }

          // El scroll suave ya terminó o dejó de avanzar. La realineación es
          // instantánea para no reiniciar la animación.
          scrollTarget.scrollIntoView({
            behavior: "auto",
            block: "start",
          });
          scheduleAlignmentCheck(scrollEndSettleDelay);
        }

        function scheduleAlignmentCheck(delay = scrollIdleDelay) {
          if (idleTimer !== null) {
            window.clearTimeout(idleTimer);
          }

          idleTimer = window.setTimeout(alignOrComplete, delay);
        }

        function handleScroll() {
          scheduleAlignmentCheck();
        }

        function handleScrollEnd() {
          scheduleAlignmentCheck(scrollEndSettleDelay);
        }

        resizeObserver = new ResizeObserver(() => {
          if (programmaticTarget.current !== id) {
            return;
          }

          if (layoutFrame !== null) {
            window.cancelAnimationFrame(layoutFrame);
          }

          layoutFrame = window.requestAnimationFrame(() => {
            layoutFrame = null;

            const nextTargetTop =
              scrollTarget.getBoundingClientRect().top + window.scrollY;

            if (
              Math.abs(nextTargetTop - lastTargetTop) <=
              scrollAlignmentTolerance
            ) {
              return;
            }

            lastTargetTop = nextTargetTop;
            scheduleAlignmentCheck();
          });
        });

        programmaticScrollCleanup.current = cleanup;

        document.addEventListener("scroll", handleScroll, {
          passive: true,
        });
        document.addEventListener("scrollend", handleScrollEnd);
        resizeObserver.observe(document.body);

        scrollTarget.scrollIntoView({
          behavior,
          block: "start",
        });

        // También termina correctamente si el elemento ya estaba visible
        // y scrollIntoView no produce ningún evento.
        scheduleAlignmentCheck();
      });
    },
    [setActiveId],
  );

  const handleSelect = useCallback(
    (id: ManageSectionId, event: NavbarSelectEvent) => {
      if (!isUnmodifiedPrimaryClick(event)) {
        return;
      }

      event.preventDefault();
      activateSection(id);
      prepareSection(id);
      setActiveId(id);

      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: `#${id}`,
        },
        { preventScrollReset: true },
      );

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      scrollToSection(id, reducedMotion ? "auto" : "smooth");
    },
    [
      activateSection,
      location.pathname,
      location.search,
      navigate,
      prepareSection,
      scrollToSection,
      setActiveId,
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
    if (
      navigationType !== "POP" ||
      sectionNodes.current.size !== manageSections.length
    ) {
      return;
    }

    const id = getSectionIdFromHash(location.hash);
    activateSection(id);
    prepareSection(id);
    setActiveId(id);
    scrollToSection(id, "auto");
  }, [
    activateSection,
    location.hash,
    location.key,
    navigationType,
    prepareSection,
    registrationVersion,
    scrollToSection,
    setActiveId,
  ]);

  useEffect(() => {
    activateSection(activeId);

    const activeIndex = manageSectionIds.indexOf(activeId);
    const nextId = manageSectionIds[activeIndex + 1];
    if (nextId) preloadSectionChunk(nextId);

    if (
      !isProgrammaticScrolling &&
      programmaticTarget.current === null &&
      location.hash !== `#${activeId}`
    ) {
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
    }
  }, [
    activateSection,
    activeId,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    isProgrammaticScrolling,
    preloadSectionChunk,
  ]);

  useEffect(
    () => () => {
      if (programmaticScrollFrame.current !== null) {
        window.cancelAnimationFrame(programmaticScrollFrame.current);
      }

      programmaticScrollCleanup.current?.();
    },
    [],
  );

  return (
    <ManageScrollProvider value={{ activeId, isProgrammaticScrolling }}>
      <div className="min-h-screen bg-slate-50">
        <h1
          ref={routeHeadingRef}
          tabIndex={-1}
          className="sr-only"
        >
          Manage
        </h1>

        <Navbar
          items={manageNavbarItems}
          activeId={activeId}
          ariaLabel="Manage sections"
          ariaCurrent="location"
          className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 backdrop-blur"
          innerClassName="mx-auto max-w-6xl"
          onIntent={(item) => prepareSection(item.id)}
          onSelect={(item, event) => handleSelect(item.id, event)}
        />

        <main className="mx-auto max-w-6xl">
          {manageSections.map((definition) => (
            <ProgressiveSection
              key={definition.id}
              definition={definition}
              activated={activatedIds.has(definition.id)}
              activationDisabled={isProgrammaticScrolling}
              onActivate={activateSection}
              registerNode={registerNode}
            />
          ))}
        </main>
      </div>
    </ManageScrollProvider>
  );
}
