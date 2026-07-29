import { Menu, type LucideIcon } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Link } from "react-router";
import cencoraLogo from "../../assets/icons/cencora-logo.svg";
import {
  Navbar,
  type NavbarItem,
  type NavbarProps,
} from "../Navbar";
import {
  MobileNavigationDialog,
  type MobileNavigationDialogLabels,
} from "./MobileNavigationDialog";

export type HeaderNavigationConfig<TItem extends NavbarItem> = Pick<
  NavbarProps<TItem>,
  | "activeId"
  | "ariaCurrent"
  | "ariaLabel"
  | "items"
  | "onIntent"
  | "onSelect"
>;

export type HeaderActionSelectEvent = MouseEvent<
  HTMLAnchorElement | HTMLButtonElement
>;

export type HeaderAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  onSelect: (
    action: HeaderAction,
    event: HeaderActionSelectEvent,
  ) => void;
};

export type MobileMenuLabels = MobileNavigationDialogLabels & {
  open: string;
};

export type HeaderProps<
  TPrimaryItem extends NavbarItem,
  TSectionItem extends NavbarItem,
> = {
  primaryNavigation: HeaderNavigationConfig<TPrimaryItem>;
  sectionNavigation: HeaderNavigationConfig<TSectionItem>;
  actions: readonly HeaderAction[];
  actionsAriaLabel?: string;
  className?: string;
  logoAriaLabel?: string;
  logoTo?: string;
  mobileMenuLabels?: Partial<MobileMenuLabels>;
  sectionParentId: TPrimaryItem["id"];
};

const defaultMobileMenuLabels: MobileMenuLabels = {
  close: "Close navigation menu",
  dialog: "Navigation menu",
  open: "Open navigation menu",
};

const actionClassName = [
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
  "text-brand-primary-main transition-colors hover:bg-brand-primary-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-primary-focus",
  "motion-reduce:transition-none",
].join(" ");

export function Header<
  TPrimaryItem extends NavbarItem,
  TSectionItem extends NavbarItem,
>({
  primaryNavigation,
  sectionNavigation,
  actions,
  actionsAriaLabel = "Header actions",
  className = "",
  logoAriaLabel = "Cencora home",
  logoTo = "/",
  mobileMenuLabels,
  sectionParentId,
}: HeaderProps<TPrimaryItem, TSectionItem>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuId = useId();
  const resolvedMobileMenuLabels: MobileMenuLabels = {
    close: mobileMenuLabels?.close ?? defaultMobileMenuLabels.close,
    dialog: mobileMenuLabels?.dialog ?? defaultMobileMenuLabels.dialog,
    open: mobileMenuLabels?.open ?? defaultMobileMenuLabels.open,
  };
  const headerClassName = [
    "w-full bg-ui-background-primary text-ui-text-primary shadow-hairline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    };

    desktopQuery.addEventListener("change", closeAtDesktop);

    return () => {
      desktopQuery.removeEventListener("change", closeAtDesktop);
    };
  }, []);

  return (
    <header className={headerClassName}>
      <div className="flex min-h-20 w-full min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-6 md:min-h-24 md:gap-8 md:px-10 lg:px-12">
        <button
          ref={mobileMenuButtonRef}
          type="button"
          aria-controls={mobileMenuId}
          aria-expanded={mobileMenuOpen}
          aria-haspopup="dialog"
          aria-label={resolvedMobileMenuLabels.open}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-brand-primary-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-primary-focus md:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
        </button>

        <Link
          to={logoTo}
          aria-label={logoAriaLabel}
          className="flex min-h-11 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary-focus focus-visible:ring-offset-2"
        >
          <img
            src={cencoraLogo}
            alt=""
            className="h-auto w-[5.75rem] sm:w-[8.5rem] md:w-[9.8125rem]"
          />
        </Link>

        <Navbar
          {...primaryNavigation}
          className="hidden min-w-0 flex-1 md:block"
          innerClassName="min-w-0"
          listClassName="scrollbar-hide min-w-0 overflow-x-auto whitespace-nowrap"
        />

        <div
          role="group"
          aria-label={actionsAriaLabel}
          className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2"
        >
          {actions.map(action => {
            const Icon = action.icon;
            const content = (
              <>
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6"
                  strokeWidth={2}
                />
                <span className="sr-only">{action.label}</span>
              </>
            );

            return action.to ? (
              <Link
                key={action.id}
                to={action.to}
                className={actionClassName}
                onClick={event => action.onSelect(action, event)}
              >
                {content}
              </Link>
            ) : (
              <button
                key={action.id}
                type="button"
                className={actionClassName}
                onClick={event => action.onSelect(action, event)}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      <Navbar
        {...sectionNavigation}
        mobileMode="horizontal-scroll"
        className="w-full min-w-0 border-t border-border-secondary"
        innerClassName="min-w-0 px-3 sm:px-6 md:px-10 lg:px-12"
      />

      <MobileNavigationDialog
        id={mobileMenuId}
        labels={resolvedMobileMenuLabels}
        logoAriaLabel={logoAriaLabel}
        logoTo={logoTo}
        onOpenChange={setMobileMenuOpen}
        open={mobileMenuOpen}
        openerRef={mobileMenuButtonRef}
        primaryNavigation={primaryNavigation}
        sectionNavigation={sectionNavigation}
        sectionParentId={sectionParentId}
      />
    </header>
  );
}
