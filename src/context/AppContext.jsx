import { createContext, useContext, useMemo, useReducer } from "react";

const AppContext = createContext(null);

const initialState = {
  sidebarOpen: false
};

function reducer(state, action) {
  switch (action.type) {
    case "toggleSidebar":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "closeSidebar":
      return { ...state, sidebarOpen: false };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(
    () => ({
      ...state,
      toggleSidebar: () => dispatch({ type: "toggleSidebar" }),
      closeSidebar: () => dispatch({ type: "closeSidebar" })
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
