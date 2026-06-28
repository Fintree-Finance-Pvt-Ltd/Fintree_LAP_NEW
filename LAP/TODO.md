# TODO - Applications LAP LOS Service Refactor

- [ ] Refactor `backend/src/modules/applications/applications.service.ts`
  - [ ] Add helpers: `mergeDefined`, `upsertCustomerProfile`, `upsertWorkflow`
  - [ ] Rewrite `findOne()` to return merged `Application + CustomerProfile + Workflow`
  - [x] Fix `update()` (PATCH) with a single transaction:
    - [x] Lock Application row
    - [x] Update only defined fields on Application
    - [x] Upsert CustomerProfile with partial updates (no erasing missing fields)
    - [x] Upsert Workflow for SAVE_DRAFT
    - [x] Create WorkflowHistory only for first draft
    - [x] Create AuditLog with before/after snapshots
    - [x] Return `{ success:true, message:"Draft saved successfully", data:{ id, applicationNumber, status, stage } }`

  - [ ] Fix `draft()` to use upsert helpers and avoid duplicate history/workflow/profile
  - [ ] Fix `submitDraft()` to upsert and create WorkflowHistory/WorkflowLog/AuditLog correctly (no duplicates)
- [ ] Build & test
  - [ ] `cd backend && npm run build`
  - [ ] `cd backend && npm test` (if available)

