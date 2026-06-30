import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../features/auth/authSelectors.js';

export function useAuth() {
  return {
    user: useSelector(selectUser),
    isAuthenticated: useSelector(selectIsAuthenticated)
  };
}
