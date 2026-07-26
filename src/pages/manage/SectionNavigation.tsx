import type { MouseEvent } from "react";
import type {
  ManageSectionDefinition,
  ManageSectionId,
} from "./manageSections";

type Props = {
  activeId: ManageSectionId;
  onIntent: (id: ManageSectionId) => void;
  onSelect: (id: ManageSectionId, event: MouseEvent<HTMLAnchorElement>) => void;
  sections: readonly ManageSectionDefinition[];
};

export function SectionNavigation({
  activeId,
  onIntent,
  onSelect,
  sections,
}: Props) {
  return (
    <nav
      aria-label="Manage sections"
      className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 overflow-x-auto">
        {sections.map((section) => {
          const active = section.id === activeId;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? "location" : undefined}
              onClick={(event) => onSelect(section.id, event)}
              onFocus={() => onIntent(section.id)}
              onPointerEnter={() => onIntent(section.id)}
              className={[
                "flex h-full items-center border-b-2 text-sm font-medium transition-colors",
                active
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-950",
              ].join(" ")}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
