import { ChevronDown, type LucideIcon } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router";
import {
  isUnmodifiedPrimaryClick,
  type NavbarSelectEvent,
} from "./navbarEvents";

export type { NavbarSelectEvent } from "./navbarEvents";

export type NavbarItem = {
  id: string;
  label: string;
  to?: string;
  icon?: LucideIcon;
  iconPosition?: NavbarIconPosition;
};

export type NavbarIconPosition = "top" | "right" | "bottom" | "left";

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
  iconPosition = "left",
  onSelect,
  onIntent,
}: NavbarProps<TItem>) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const activeItem = items.find((item) => item.id === activeId);
  const mobileButtonText = activeItem
    ? `${mobileLabel}: ${activeItem.label}`
    : mobileLabel;
  const listClasses = [
    mobileExpanded ? "flex" : "hidden",
    "flex-col gap-1 pb-3",
    "md:flex md:h-16 md:flex-row md:items-center md:gap-6 md:pb-0",
    listClassName,
  ]
    .filter(Boolean)
    .join(" ");

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
    const shouldClose = mobileExpanded && isUnmodifiedPrimaryClick(event);

    onSelect(item, event);

    if (shouldClose) {
      const mobileButtonVisible = window.matchMedia(
        "(max-width: 767px)",
      ).matches;
      closeMobileDisclosure(mobileButtonVisible);
    }
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={className}
      onKeyDown={handleKeyDown}
    >
      <div className={innerClassName}>
        <button
          ref={mobileButtonRef}
          type="button"
          aria-controls={listId}
          aria-expanded={mobileExpanded}
          className="flex min-h-16 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-950 md:hidden"
          onClick={() => setMobileExpanded((expanded) => !expanded)}
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

        <ul id={listId} className={listClasses}>
          {items.map((item) => {
            const Icon = item.icon;
            const resolvedIconPosition = item.iconPosition ?? iconPosition;
            const content = (
              <>
                {Icon ? (
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                  />
                ) : null}

                <span>{item.label}</span>
              </>
            );
            const active = item.id === activeId;
            const itemClassName = [
              "flex min-h-11 w-full items-center rounded-md border-l-2 px-3 py-2 text-sm font-medium",
              "md:h-16 md:w-auto md:rounded-none md:border-b-2 md:border-l-0 md:px-0 md:py-0",
              iconPositionClasses[resolvedIconPosition],
              active
                ? "border-violet-600 bg-violet-50 text-violet-700 md:bg-transparent"
                : "border-transparent text-slate-500 hover:text-slate-950",
            ].join(" ");

            return (
              <li key={item.id} className="w-full md:w-auto">
                {item.to ? (
                  <Link
                    to={item.to}
                    aria-current={active ? ariaCurrent : undefined}
                    className={itemClassName}
                    onClick={(e) => handleSelect(item, e)}
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
                    onClick={(e) => handleSelect(item, e)}
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
