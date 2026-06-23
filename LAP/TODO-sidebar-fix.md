- [x] Map issue: Sidebar RM links (/rmDashboard, /my-leads, ...) were not defined in router; wildcard redirect always sent users to /dashboard.
- [ ] Update frontend/src/app/router.jsx:
  - [ ] Import RM pages.
  - [ ] Add protected routes for all RM sidebar paths.
  - [ ] Verify wildcard behavior still works for unknown routes.
- [ ] Run eslint/build to confirm no route/import issues.
- [ ] Manual check: click each RM sidebar item; ensure it renders the correct RM page (no more /dashboard fallback).

