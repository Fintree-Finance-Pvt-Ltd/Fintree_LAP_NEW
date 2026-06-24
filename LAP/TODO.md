# TODO — Lead/Workflow complete flow

## Step 1 — Wire correct workflow endpoint (RM submit)
- Update `frontend/src/features/applications/pages/ApplicationDetailsPage.jsx`
- Replace `applicationsApi.transition(... 'SUBMIT_TO_BM')` with call to backend `POST /workflow/submit-to-bm/:applicationId`
- Add api helper in `frontend/src/features/applications/applicationsApi.js` (or new file) for `workflowSubmitToBm`

## Step 2 — Extend Visit entity to support required module fields
- Update `backend/src/modules/visits/entities/visit.entity.ts`
  - add: visitDate, visitStatus(Positive/Negative/Revisit), revisitRemarks, distance, manualAddress, geoTaggedPhotoPath (or reference), photoPath (if needed)
- Update `backend/src/modules/visits/dto/create-visit.dto.ts`
  - add matching validation decorators

## Step 3 — Update BM submission validations
- Update `backend/src/modules/workflow/workflow.service.ts`
  - Enhance `validateRmSubmission` to check:
    - Customer visit completed
    - Business visit completed
    - Geo verification completed
    - Property visit completed
  - Completion logic: existence of `Visit` rows with required `visitType` and required columns not null.

## Step 4 — Add document upload validation (file type/size)
- Update `backend/src/modules/documents/documents.service.ts`
  - validate allowed mime/ext + max 10MB
  - reject invalid files before saving

## Step 5 — Update UI to capture modules (at least minimal)
- Update `ApplicationDetailsPage.jsx` to allow capturing multiple visit types:
  - Customer / Business / Geo / Property
  - Include visit status Positive/Negative/Revisit, date, remarks
  - Capture GPS fields + distance + manual address
  - Upload module photos and persist as document/paths depending on chosen approach

## Step 6 — DB migration
- Create migration for `visits` table schema changes.


