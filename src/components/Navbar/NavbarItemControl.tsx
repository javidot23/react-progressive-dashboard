import { Link } from "react-router";
import type {
  NavbarIconPosition,
  NavbarItem,
} from "./Navbar";
import type { NavbarSelectEvent } from "./navbarEvents";

const iconPositionClasses: Record<NavbarIconPosition, string> = {
  top: "flex-col justify-center gap-1",
  right: "flex-row-reverse gap-2",
  bottom: "flex-col-reverse justify-center gap-1",
  left: "flex-row gap-2",
};

type NavbarItemControlProps<TItem extends NavbarItem> = {
  active: boolean;
  ariaCurrent: "page" | "location";
  className: string;
  iconPosition: NavbarIconPosition;
  item: TItem;
  onIntent?: (item: TItem) => void;
  onSelect: (item: TItem, event: NavbarSelectEvent) => void;
};

export function NavbarItemControl<TItem extends NavbarItem>({
  active,
  ariaCurrent,
  className,
  iconPosition,
  item,
  onIntent,
  onSelect,
}: NavbarItemControlProps<TItem>) {
  const Icon = item.icon;
  const resolvedIconPosition = item.iconPosition ?? iconPosition;
  const controlClassName = [
    className,
    iconPositionClasses[resolvedIconPosition],
  ].join(" ");
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

  return item.to ? (
    <Link
      to={item.to}
      aria-current={active ? ariaCurrent : undefined}
      className={controlClassName}
      onClick={event => onSelect(item, event)}
      onFocus={() => onIntent?.(item)}
      onPointerEnter={() => onIntent?.(item)}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      aria-pressed={active}
      className={controlClassName}
      onClick={event => onSelect(item, event)}
      onFocus={() => onIntent?.(item)}
      onPointerEnter={() => onIntent?.(item)}
    >
      {content}
    </button>
  );
}
