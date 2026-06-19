import { useSelector } from 'react-redux';

export function usePermissions() {
  const permissions = useSelector((state) => state.auth.permissions);
  return {
    permissions,
    can: (permission) => permissions.includes(permission)
  };
}
