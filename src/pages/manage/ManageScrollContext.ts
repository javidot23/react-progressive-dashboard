import { createContext, useContext } from "react";
import type { ManageSectionId } from "./manageSections";

type ManageScrollState = {
  activeId: ManageSectionId;
  isProgrammaticScrolling: boolean;
};

const ManageScrollContext = createContext<ManageScrollState | null>(null);

export const ManageScrollProvider = ManageScrollContext.Provider;

export function useManageScrollState() {
  const state = useContext(ManageScrollContext);

  if (!state) {
    throw new Error(
      "useManageScrollState must be used within ManageScrollProvider.",
    );
  }

  return state;
}
