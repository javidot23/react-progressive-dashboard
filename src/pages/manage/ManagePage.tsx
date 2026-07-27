import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";
import {
  defaultInventoryFilters,
  inventoryRiskQueryOptions,
} from "../../features/inventory/inventoryQueryOptions";
import {
  getSectionIdFromHash,
  manageSections,
  type ManageSectionId,
} from "./manageSections";
import { ManageScrollProvider } from "./ManageScrollContext";
import { ProgressiveSection } from "./ProgressiveSection";
import { useScrollSpy } from "./useScrollSpy";
import { Navbar, NavbarItem, NavbarSelectEvent } from "../../components/Navbar";
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

export default function ManagePage() {
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
  const programmaticTarget = useRef<ManageSectionId | null>(null);
  const programmaticScrollFrame = useRef<number | null>(null);
  const programmaticScrollCleanup = useRef<(() => void) | null>(null);
  const [isProgrammaticScrolling, setIsProgrammaticScrolling] = useState(false);
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

  const preloadSection = useCallback(
    (id: ManageSectionId) => {
      const definition = manageSections.find((section) => section.id === id);
      void definition?.load().catch(() => undefined);

      if (id === "inventory") {
        void queryClient.prefetchInfiniteQuery(
          inventoryRiskQueryOptions(defaultInventoryFilters),
        );
      }
    },
    [queryClient],
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

        const node = sectionNodes.current.get(id);

        if (!node) {
          programmaticTarget.current = null;
          setIsProgrammaticScrolling(false);
          return;
        }

        let idleTimer: number | null = null;

        const cleanup = () => {
          document.removeEventListener("scroll", scheduleCompletion);
          document.removeEventListener("scrollend", completeScroll);

          if (idleTimer !== null) {
            window.clearTimeout(idleTimer);
            idleTimer = null;
          }
        };

        const completeScroll = () => {
          if (programmaticTarget.current !== id) {
            return;
          }

          cleanup();
          programmaticScrollCleanup.current = null;
          programmaticTarget.current = null;
          setActiveId(id);
          setIsProgrammaticScrolling(false);
        };

        const scheduleCompletion = () => {
          if (idleTimer !== null) {
            window.clearTimeout(idleTimer);
          }

          idleTimer = window.setTimeout(completeScroll, 150);
        };

        programmaticScrollCleanup.current = cleanup;

        document.addEventListener("scroll", scheduleCompletion, {
          passive: true,
        });
        document.addEventListener("scrollend", completeScroll, {
          once: true,
        });

        node.scrollIntoView({
          behavior,
          block: "start",
        });

        // También termina correctamente si el elemento ya estaba visible
        // y scrollIntoView no produce ningún evento.
        scheduleCompletion();
      });
    },
    [setActiveId],
  );

  const handleSelect = useCallback(
    (id: ManageSectionId, event: NavbarSelectEvent) => {
      event.preventDefault();
      activateSection(id);
      preloadSection(id);

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
      preloadSection,
      scrollToSection,
    ],
  );

  useEffect(() => {
    if (
      navigationType !== "POP" ||
      sectionNodes.current.size !== manageSections.length
    ) {
      return;
    }

    const id = getSectionIdFromHash(location.hash);
    activateSection(id);
    preloadSection(id);
    scrollToSection(id, "auto");
  }, [
    activateSection,
    location.hash,
    location.key,
    navigationType,
    preloadSection,
    registrationVersion,
    scrollToSection,
  ]);

  useEffect(() => {
    activateSection(activeId);

    const activeIndex = manageSectionIds.indexOf(activeId);
    const nextId = manageSectionIds[activeIndex + 1];
    if (nextId) preloadSection(nextId);

    if (
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
    preloadSection,
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
        <Navbar
          items={manageNavbarItems}
          activeId={activeId}
          ariaLabel="Manage sections"
          ariaCurrent="location"
          className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 backdrop-blur"
          listClassName="mx-auto max-w-6xl"
          onIntent={(item) => preloadSection(item.id)}
          onSelect={(item, event) => handleSelect(item.id, event)}
        />

        <main className="mx-auto max-w-6xl">
          {manageSections.map((definition) => (
            <ProgressiveSection
              key={definition.id}
              definition={definition}
              activated={activatedIds.has(definition.id)}
              onActivate={activateSection}
              registerNode={registerNode}
            />
          ))}
        </main>
      </div>
    </ManageScrollProvider>
  );
}
