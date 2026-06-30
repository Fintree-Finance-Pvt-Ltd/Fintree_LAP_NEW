export interface AuthenticatedRequest {
  user?: {
    id?: number | string;
    userId?: number | string;
    sub?: number | string;
    roles?: string[];
    permissions?: string[];
  };
}
