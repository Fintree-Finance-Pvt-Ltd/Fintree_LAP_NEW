import { createContext, useContext } from "react";

import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../features/auth/authSelectors";

const AuthContext = createContext({ user: null, isAuthenticated: false });

export function AuthProvider({ children }) {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const value = { user, isAuthenticated };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

