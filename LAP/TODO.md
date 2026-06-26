# TODO - Save Draft / Submit Draft flow changes

- [x] Update backend: relax/remove strict validation in `ApplicationsService.submitDraft()` so partial payload doesn’t throw VALIDATION_ERROR.
- [x] Update backend logic: ensure workflow transition only happens when user clicks “Submit for Review” (final submission). Draft save should use `POST /applications/draft`.
- [x] Update frontend: adjust CreateLead/MyLeads UI/API calls:
  - [x] “Save Draft” should call `POST /applications/draft`.
  - [x] “Continue Journey” from MyLeads should call `POST /applications/draft` (not PATCH).
  - [x] “Submit for Review” should call `POST /applications/submit-draft` and perform full field validation client-side before calling.
- [x] Add/confirm client-side validation completeness on “Submit for Review”.
- [ ] Test flow end-to-end: create lead → save draft → continue draft → submit for review → status becomes `LEAD_CREATED` and workflow page reflects it.


