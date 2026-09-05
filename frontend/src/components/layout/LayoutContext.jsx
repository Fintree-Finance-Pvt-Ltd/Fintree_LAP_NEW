import { createContext, useContext } from "react";

export const LayoutContext = createContext({
  mobileNavOpen: false,
  setMobileNavOpen: () => {},
});

export function useLayout() {
  return useContext(LayoutContext);
}
