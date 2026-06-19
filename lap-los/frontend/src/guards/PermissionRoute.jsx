import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions.js';

export default function PermissionRoute({ permission }) {
  const { can } = usePermissions();
  return can(permission) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
