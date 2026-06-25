# TODO - Create Lead OTP-gated Application Creation

- [x] Add OTP endpoints (if not present) and a verification token mechanism
  - [x] `POST /auth/send-mobile-otp`
  - [x] `POST /auth/verify-mobile-otp`
- [x] Update backend Applications flow
  - [x] Ensure `applications` insert happens only after successful OTP verify
  - [x] Make `POST /applications/draft` accept a `verificationToken` and create application only once
  - [x] Ensure subsequent `POST /applications/draft` calls UPDATE existing draft (no new application)
- [x] Update Submit-for-Review behavior
  - [x] Validate mandatory fields and transition `DRAFT -> LEAD_CREATED`
  - [x] Update workflow current_status and insert workflow history `LEAD_CREATED`
- [x] Update MyLeads filtering
  - [x] Only show `DRAFT` applications
- [x] Update CreateLead frontend workflow
  - [x] Step 1: keep all lead fields in React state (no backend calls)
  - [x] Step 2: Verify Mobile -> OTP screen
  - [x] Step 3: After OTP success, call `POST /applications/draft` with full payload + `verificationToken`
  - [x] Step 4: Save Draft should UPDATE existing application by `applicationId`
  - [x] Step 5: Continue Journey loads `GET /applications/:applicationId`