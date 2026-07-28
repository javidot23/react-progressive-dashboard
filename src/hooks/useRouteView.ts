import { useEffect, useRef } from "react";

const applicationName = "React Progressive Dashboard";

export function getRouteTitle(viewName: string) {
  return `${viewName} – ${applicationName}`;
}

export function useRouteView(viewName: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = getRouteTitle(viewName);
    headingRef.current?.focus({ preventScroll: true });
  }, [viewName]);

  return headingRef;
}
