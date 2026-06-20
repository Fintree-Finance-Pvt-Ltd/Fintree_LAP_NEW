# TODO - MUI Removal & Migration

## Step 1: Repo inventory (manual)
- [x] Read current MUI dependencies from `LAP/frontend/package.json`
- [x] Identify MUI usage in root providers/layout/components via targeted reads

## Step 2: Add required libraries
- [x] Update `LAP/frontend/package.json` (remove MUI deps, add react-toastify/react-select/react-icons)


## Step 3: Remove MUI theme/providers
- [x] Update `LAP/frontend/src/app/providers.jsx` to remove `ThemeProvider`/`CssBaseline` and MUI theme import
- [ ] Remove/stop using `LAP/frontend/src/theme/*` if only for MUI (or refactor if needed)


## Step 4: Toast migration
- [x] Add single `ToastContainer` at app root (likely `LAP/frontend/src/main.jsx`)
- [x] Replace `AppSnackbar` implementation with react-toastify `toast` + ensure no duplicate containers

## Step 5: Replace form/select
- [x] Migrate `FormSelect.jsx` from MUI `TextField select` to `react-select`


## Step 6: Replace icons/components
- [ ] Replace MUI icons/components in layout/components:
  - Header menu icon
  - Sidebar icons
  - DataTable using standard HTML table
  - Buttons/cards/chips/dialogs/loaders

## Step 7: Validation/verification
- [ ] Ensure no `@mui/` or `@material-ui/` imports remain in frontend src
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run lint`

## Step 8: Final report
- [ ] Provide file-by-file modified list + removed/new deps + migrated fields summary

