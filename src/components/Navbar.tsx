import { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import type { NavbarSelectEvent } from "./navbarEvents";

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
  listClassName?: string;
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
  listClassName = "",
  iconPosition = "left",
  onSelect,
  onIntent,
}: NavbarProps<TItem>) {
  const listClasses = [
    "flex h-16 items-center gap-6 overflow-x-auto",
    listClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ul className={listClasses}>
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
            "flex h-16 items-center border-b-2 text-sm font-medium",
            iconPositionClasses[resolvedIconPosition],
            active
              ? "border-violet-600 text-violet-700"
              : "border-transparent text-slate-500 hover:text-slate-950",
          ].join(" ");

          return (
            <li key={item.id}>
              {item.to ? (
                <Link
                  to={item.to}
                  aria-current={active ? ariaCurrent : undefined}
                  className={itemClassName}
                  onClick={(e) => onSelect(item, e)}
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
                  onClick={(e) => onSelect(item, e)}
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
    </nav>
  );
}
