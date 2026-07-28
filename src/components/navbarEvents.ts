import type { MouseEvent } from "react";

export type NavbarSelectEvent =
  | MouseEvent<HTMLAnchorElement>
  | MouseEvent<HTMLButtonElement>;

export function isUnmodifiedPrimaryClick(event: NavbarSelectEvent) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}
