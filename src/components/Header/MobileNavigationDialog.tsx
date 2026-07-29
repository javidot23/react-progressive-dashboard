import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { Link } from "react-router";
import cencoraLogo from "../../assets/icons/cencora-logo.svg";
import type {
  NavbarItem,
  NavbarProps,
} from "../Navbar";
import { NavbarItemControl } from "../Navbar/NavbarItemControl";
import {
  isUnmodifiedPrimaryClick,
  type NavbarSelectEvent,
} from "../Navbar/navbarEvents";

type MobileNavigationConfig<TItem extends NavbarItem> = Pick<
  NavbarProps<TItem>,
  | "activeId"
  | "ariaCurrent"
  | "ariaLabel"
  | "items"
  | "onIntent"
  | "onSelect"
>;

export type MobileNavigationDialogLabels = {
  close: string;
  dialog: string;
};

type MobileNavigationDialogProps<
  TPrimaryItem extends NavbarItem,
  TSectionItem extends NavbarItem,
> = {
  id: string;
  labels: MobileNavigationDialogLabels;
  logoAriaLabel: string;
  logoTo: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  openerRef: RefObject<HTMLButtonElement | null>;
  primaryNavigation: MobileNavigationConfig<TPrimaryItem>;
  sectionNavigation: MobileNavigationConfig<TSectionItem>;
  sectionParentId: TPrimaryItem["id"];
};

const itemBaseClassName = [
  "relative flex w-full items-center justify-start gap-2.5 rounded-md border-l-2 px-4 py-3 text-left text-sm font-medium",
  "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-primary-focus",
].join(" ");

const primaryItemClassName = `${itemBaseClassName} min-h-12`;
const sectionItemClassName = `${itemBaseClassName} min-h-11`;

export function MobileNavigationDialog<
  TPrimaryItem extends NavbarItem,
  TSectionItem extends NavbarItem,
>({
  id,
  labels,
  logoAriaLabel,
  logoTo,
  onOpenChange,
  open,
  openerRef,
  primaryNavigation,
  sectionNavigation,
  sectionParentId,
}: MobileNavigationDialogProps<TPrimaryItem, TSectionItem>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasSectionParent = primaryNavigation.items.some(
    item => item.id === sectionParentId,
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }

      closeButtonRef.current?.focus({ preventScroll: true });
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeDialog = (restoreFocus: boolean) => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }

    onOpenChange(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        openerRef.current?.focus({ preventScroll: true });
      });
      return;
    }

    window.requestAnimationFrame(() => {
      if (document.activeElement === openerRef.current) {
        openerRef.current?.blur();
      }
    });
  };

  const handleSelect = <TItem extends NavbarItem>(
    navigation: MobileNavigationConfig<TItem>,
    item: TItem,
    event: NavbarSelectEvent,
  ) => {
    navigation.onSelect(item, event);

    if (isUnmodifiedPrimaryClick(event)) {
      closeDialog(false);
    }
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isUnmodifiedPrimaryClick(event)) {
      closeDialog(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableControls = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const firstControl = focusableControls[0];
    const lastControl = focusableControls.at(-1);

    if (!firstControl || !lastControl) {
      event.preventDefault();
      return;
    }

    if (
      (event.shiftKey && document.activeElement === firstControl) ||
      (!event.shiftKey && document.activeElement === lastControl)
    ) {
      event.preventDefault();
      (event.shiftKey ? lastControl : firstControl).focus({
        preventScroll: true,
      });
    }
  };

  const renderSectionList = () => (
    <ul
      aria-label={sectionNavigation.ariaLabel}
      className="ml-4 min-w-0 border-l border-border-secondary py-1 pl-3"
    >
      {sectionNavigation.items.map(item => {
        const active = item.id === sectionNavigation.activeId;
        const stateClassName = active
          ? "border-brand-primary-main bg-brand-primary-50 text-brand-primary-main"
          : "border-transparent text-ui-text-secondary hover:text-ui-text-primary";

        return (
          <li key={item.id} className="min-w-0">
            <NavbarItemControl
              active={active}
              ariaCurrent={sectionNavigation.ariaCurrent ?? "page"}
              className={`${sectionItemClassName} ${stateClassName}`}
              iconPosition="left"
              item={item}
              onIntent={sectionNavigation.onIntent}
              onSelect={(selectedItem, event) =>
                handleSelect(sectionNavigation, selectedItem, event)
              }
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label={labels.dialog}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-x-hidden overflow-y-auto border-0 bg-ui-background-primary p-0 text-ui-text-primary md:hidden"
      onCancel={event => {
        event.preventDefault();
        closeDialog(true);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="flex min-h-20 w-full items-center justify-between gap-4 border-b border-border-secondary px-3 sm:px-6">
        <Link
          to={logoTo}
          aria-label={logoAriaLabel}
          className="flex min-h-11 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary-focus focus-visible:ring-offset-2"
          onClick={handleLogoClick}
        >
          <img
            src={cencoraLogo}
            alt=""
            className="h-auto w-[9.8125rem]"
          />
        </Link>

        <button
          ref={closeButtonRef}
          type="button"
          aria-label={labels.close}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-brand-primary-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-primary-focus"
          onClick={() => closeDialog(true)}
        >
          <X aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <nav aria-label={primaryNavigation.ariaLabel} className="px-3 py-4 sm:px-6">
        <ul className="min-w-0 space-y-1">
          {primaryNavigation.items.map(item => {
            const active = item.id === primaryNavigation.activeId;
            const stateClassName = active
              ? "border-brand-primary-main bg-brand-primary-50 text-brand-primary-main"
              : "border-transparent text-ui-text-secondary hover:text-ui-text-primary";

            return (
              <li key={item.id} className="min-w-0">
                <NavbarItemControl
                  active={active}
                  ariaCurrent={primaryNavigation.ariaCurrent ?? "page"}
                  className={`${primaryItemClassName} ${stateClassName}`}
                  iconPosition="left"
                  item={item}
                  onIntent={primaryNavigation.onIntent}
                  onSelect={(selectedItem, event) =>
                    handleSelect(primaryNavigation, selectedItem, event)
                  }
                />

                {item.id === sectionParentId ? renderSectionList() : null}
              </li>
            );
          })}

          {!hasSectionParent ? (
            <li className="min-w-0">{renderSectionList()}</li>
          ) : null}
        </ul>
      </nav>
    </dialog>
  );
}
