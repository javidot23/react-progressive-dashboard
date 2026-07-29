import type { CSSProperties } from "react";

export const lightStoryTheme = {
  colorScheme: "light",
  "--color-ui-background-primary": "var(--cds-color-background-primary)",
  "--color-ui-background-secondary":
    "var(--cds-color-background-secondary)",
  "--color-ui-text-primary": "var(--cds-color-text-primary)",
  "--color-ui-text-secondary": "var(--cds-color-text-secondary)",
} as CSSProperties & Record<`--${string}`, string>;
