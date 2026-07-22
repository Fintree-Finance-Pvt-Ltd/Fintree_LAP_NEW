import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const roleDefaultRoutes = {
  ADMIN: "/adminDashboard",
  RM: "/rmDashboard",
  BM: "/bmDashboard",
  CM: "/cm-application-data",
  CREDIT_MAKER: "/credit-dashboard",
  CREDIT_CHECKER: "/credit-checker",
  VALUATION: "/valuation-dashboard",
  LEGAL: "/legal-dashboard",
  OPS_MAKER: "/operationsDashboard",
  OPS_CHECKER: "/operationsDashboard",
  LMS: "/lms-dashboard",
};

function normalizeRoles(user) {
  const roles = user?.roles ?? user?.role;
  if (!roles) return [];
  return (Array.isArray(roles) ? roles : [roles])
    .map((role) => role?.code || role?.name || role?.role || role)
    .filter(Boolean);
}

export default function RoleDashboardRedirect() {
  const { user } = useAuth();

  const roles = normalizeRoles(user).map((role) =>
    String(role).toUpperCase(),
  );

  const priority = [
    "ADMIN",
    "RM",
    "BM",
    "CM",
    "CREDIT_MAKER",
    "CREDIT_CHECKER",
    "VALUATION",
    "LEGAL",
    "OPS_MAKER",
    "OPS_CHECKER",
    "LMS",
  ];

  const matchedRole = priority.find((role) => roles.includes(role));

  const redirectTo = roleDefaultRoutes[matchedRole] || "/rmDashboard";

  return <Navigate to={redirectTo} replace />;
}
