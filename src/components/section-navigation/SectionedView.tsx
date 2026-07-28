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
  rootClassName,
  contentClassName,
}: SectionedViewProps<TId, TSection>) {
  const navigationContext: NavigationRenderContext<TId, TSection> = {
    activeId,
    isProgrammaticScrolling,
    sections,
  };

  return (
    <div className={rootClassName}>
      {renderHeader?.()}
      {renderNavigation(navigationContext)}

      <Content className={contentClassName}>
        {sections.map((section, index) => {
          const id = getSectionId(section);
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
