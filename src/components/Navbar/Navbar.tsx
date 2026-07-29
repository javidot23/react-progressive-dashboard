import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router";
import {
  isUnmodifiedPrimaryClick,
  type NavbarSelectEvent,
} from "./navbarEvents";

export type NavbarItem = {
  id: string;
  label: string;
  to?: string;
  icon?: LucideIcon;
  iconPosition?: NavbarIconPosition;
};

export type NavbarIconPosition = "top" | "right" | "bottom" | "left";
export type NavbarMobileMode = "disclosure" | "horizontal-scroll";

const iconPositionClasses: Record<NavbarIconPosition, string> = {
  top: "flex-col justify-center gap-1",
  right: "flex-row-reverse gap-2",
  bottom: "flex-col-reverse justify-center gap-1",
  left: "flex-row gap-2",
};

export type NavbarProps<TItem extends NavbarItem> = {
  items: readonly TItem[];
  activeId: TItem["id"] | null;
  ariaLabel: string;
  ariaCurrent?: "page" | "location";
  className?: string;
  innerClassName?: string;
  listClassName?: string;
  mobileLabel?: string;
  mobileMode?: NavbarMobileMode;
  iconPosition?: NavbarIconPosition;
  onSelect: (item: TItem, event: NavbarSelectEvent) => void;
  onIntent?: (item: TItem) => void;
};

export function Navbar<TItem extends NavbarItem>({
  items,
  activeId,
  ariaLabel,
  ariaCurrent = "page",
  className = "",
  innerClassName = "",
  listClassName = "",
  mobileLabel = "Sections",
  mobileMode = "disclosure",
  iconPosition = "left",
  onSelect,
  onIntent,
}: NavbarProps<TItem>) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const listId = useId();
  const activeItem = items.find(item => item.id === activeId);
  const mobileButtonText = activeItem ? `${mobileLabel}: ${activeItem.label}` : mobileLabel;
  const horizontalScroll = mobileMode === "horizontal-scroll";
  const itemIdSignature = JSON.stringify(items.map(item => item.id));
  const listClasses = horizontalScroll
    ? [
        "scrollbar-hide flex h-16 w-full max-w-full flex-row items-center overflow-x-auto overflow-y-hidden overscroll-x-contain whitespace-nowrap",
        listClassName,
      ]
        .filter(Boolean)
        .join(" ")
    : [
        mobileExpanded ? "flex" : "hidden",
        "flex-col gap-1 pb-3",
        "md:flex md:h-16 md:flex-row md:items-center md:gap-0 md:pb-0",
        listClassName,
      ]
        .filter(Boolean)
        .join(" ");

  useEffect(() => {
    if (!horizontalScroll || activeId === null) {
      return;
    }

    const list = listRef.current;
    const activeListItem = itemRefs.current.get(activeId);

    if (!list || !activeListItem) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const itemRect = activeListItem.getBoundingClientRect();
    const leadingOverflow = itemRect.left - listRect.left;
    const trailingOverflow = itemRect.right - listRect.right;

    if (leadingOverflow >= 0 && trailingOverflow <= 0) {
      return;
    }

    const scrollDelta =
      leadingOverflow < 0 ? leadingOverflow : trailingOverflow;
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    list.scrollTo({
      behavior: reducedMotion ? "auto" : "smooth",
      left: Math.max(0, list.scrollLeft + scrollDelta),
    });
  }, [activeId, horizontalScroll, itemIdSignature]);

  const closeMobileDisclosure = (returnFocus: boolean) => {
    setMobileExpanded(false);

    if (returnFocus) {
      window.requestAnimationFrame(() => {
        mobileButtonRef.current?.focus({ preventScroll: true });
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && mobileExpanded) {
      event.preventDefault();
      closeMobileDisclosure(true);
    }
  };

  const handleSelect = (item: TItem, event: NavbarSelectEvent) => {
    const shouldClose =
      !horizontalScroll &&
      mobileExpanded &&
      isUnmodifiedPrimaryClick(event);

    onSelect(item, event);

    if (shouldClose) {
      const mobileButtonVisible = window.matchMedia("(max-width: 767px)").matches;
      closeMobileDisclosure(mobileButtonVisible);
    }
  };

  return (
    <nav aria-label={ariaLabel} className={className} onKeyDown={handleKeyDown}>
      <div className={innerClassName}>
        {!horizontalScroll ? (
          <button
            ref={mobileButtonRef}
            type="button"
            aria-controls={listId}
            aria-expanded={mobileExpanded}
            className="flex min-h-16 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-primary-focus md:hidden"
            onClick={() => setMobileExpanded(expanded => !expanded)}
          >
            <span>{mobileButtonText}</span>
            <ChevronDown
              aria-hidden="true"
              className={[
                "h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none",
                mobileExpanded ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        ) : null}

        <ul ref={listRef} id={listId} className={listClasses}>
          {items.map(item => {
            const Icon = item.icon;
            const resolvedIconPosition = item.iconPosition ?? iconPosition;
            const content = (
              <>
                {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} /> : null}

                <span>{item.label}</span>
              </>
            );
            const active = item.id === activeId;
            const itemClassName = [
              "relative flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium",
              "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-primary-focus",
              "before:content-[''] before:absolute before:-left-px before:-right-px before:bottom-0 before:h-px before:bg-transparent",
              "after:content-[''] after:absolute after:-left-px after:-right-px after:bottom-0 after:h-[2px] after:bg-transparent",
              horizontalScroll
                ? "h-16 w-auto rounded-none border-l-0"
                : "min-h-11 w-full rounded-md border-l-2 md:h-16 md:w-auto md:rounded-none md:border-l-0",
              iconPositionClasses[resolvedIconPosition],
              horizontalScroll
                ? active
                  ? "border-transparent bg-transparent text-brand-primary-main after:bg-brand-primary-main"
                  : "border-transparent text-ui-text-secondary hover:text-ui-text-primary hover:before:bg-interactive-primary-hover"
                : active
                  ? "border-brand-primary-main bg-brand-primary-50 text-brand-primary-main md:bg-transparent md:after:bg-brand-primary-main"
                  : "border-transparent text-ui-text-secondary hover:text-ui-text-primary md:hover:before:bg-interactive-primary-hover",
            ].join(" ");

            return (
              <li
                key={item.id}
                ref={element => {
                  if (element) {
                    itemRefs.current.set(item.id, element);
                  } else {
                    itemRefs.current.delete(item.id);
                  }
                }}
                className={
                  horizontalScroll
                    ? "w-auto shrink-0"
                    : "w-full md:-ml-px md:w-auto first:md:ml-0"
                }
              >
                {item.to ? (
                  <Link
                    to={item.to}
                    aria-current={active ? ariaCurrent : undefined}
                    className={itemClassName}
                    onClick={e => handleSelect(item, e)}
                    onFocus={() => onIntent?.(item)}
                    onPointerEnter={() => onIntent?.(item)}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-pressed={active}
                    className={itemClassName}
                    onClick={e => handleSelect(item, e)}
                    onFocus={() => onIntent?.(item)}
                    onPointerEnter={() => onIntent?.(item)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
