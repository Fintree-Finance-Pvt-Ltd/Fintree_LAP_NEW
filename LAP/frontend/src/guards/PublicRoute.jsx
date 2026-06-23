import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function PublicRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const destination = roles.includes("RM")
    ? "/rmDashboard"
    : "/dashboard";

  return <Navigate to={destination} replace />;
}