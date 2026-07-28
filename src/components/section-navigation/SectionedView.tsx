import { Fragment } from "react";
import type {
  NavigationRenderContext,
  SectionedViewProps,
  SectionRenderContext,
} from "./types";

export function SectionedView<
  TId extends string,
  TSection,
>({
  sections,
  activeId,
  isProgrammaticScrolling,
  getSectionId,
  getSectionRef,
  renderHeader,
  renderNavigation,
  renderSection,
  contentAs: Content = "div",
  contentProps,
  rootClassName,
  contentClassName,
}: SectionedViewProps<TId, TSection>) {
  const sectionEntries = sections.map((section, index) => ({
    id: getSectionId(section),
    index,
    section,
  }));
  const sectionIds = new Set<TId>();

  for (const { id } of sectionEntries) {
    if (sectionIds.has(id)) {
      throw new Error(
        `SectionedView requires unique section IDs. Duplicate ID: ${JSON.stringify(id)}.`,
      );
    }

    sectionIds.add(id);
  }

  if (sectionEntries.length > 0 && !sectionIds.has(activeId)) {
    throw new Error(
      `SectionedView activeId does not match a rendered section: ${JSON.stringify(activeId)}.`,
    );
  }

  const navigationContext: NavigationRenderContext<TId, TSection> = {
    activeId,
    isProgrammaticScrolling,
    sections,
  };

  return (
    <div className={rootClassName}>
      {renderHeader?.()}
      {renderNavigation(navigationContext)}

      <Content {...contentProps} className={contentClassName}>
        {sectionEntries.map(({ id, index, section }) => {
          const sectionContext: SectionRenderContext<TId> = {
            id,
            index,
            isActive: id === activeId,
            isProgrammaticScrolling,
            sectionRef: getSectionRef(id),
          };

          return (
            <Fragment key={id}>
              {renderSection(section, sectionContext)}
            </Fragment>
          );
        })}
      </Content>
    </div>
  );
}
