const WorkflowLogAction = {
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_SUBMITTED: 'LEAD_SUBMITTED',
  CUSTOMER_VISIT_DONE: 'CUSTOMER_VISIT_DONE',
  BUSINESS_VISIT_DONE: 'BUSINESS_VISIT_DONE',
  GEO_VERIFICATION_DONE: 'GEO_VERIFICATION_DONE',
  PROPERTY_VISIT_DONE: 'PROPERTY_VISIT_DONE',
  DOCUMENTS_UPLOADED: 'DOCUMENTS_UPLOADED',
  SUBMITTED_TO_BM: 'SUBMITTED_TO_BM',
};

describe('workflow status mapping', () => {
  it('maps persisted workflow actions into the expected UI flags', () => {
    const actions = [
      WorkflowLogAction.LEAD_CREATED,
      WorkflowLogAction.LEAD_SUBMITTED,
      WorkflowLogAction.CUSTOMER_VISIT_DONE,
      WorkflowLogAction.GEO_VERIFICATION_DONE,
      WorkflowLogAction.DOCUMENTS_UPLOADED,
    ];

    const status = {
      leadCreated: actions.includes(WorkflowLogAction.LEAD_CREATED),
      leadSubmitted: actions.includes(WorkflowLogAction.LEAD_SUBMITTED),
      customerVisit: actions.includes(WorkflowLogAction.CUSTOMER_VISIT_DONE),
      businessVisit: actions.includes(WorkflowLogAction.BUSINESS_VISIT_DONE),
      geoVerification: actions.includes(WorkflowLogAction.GEO_VERIFICATION_DONE),
      propertyVisit: actions.includes(WorkflowLogAction.PROPERTY_VISIT_DONE),
      documentsUploaded: actions.includes(WorkflowLogAction.DOCUMENTS_UPLOADED),
      submittedToBm: actions.includes(WorkflowLogAction.SUBMITTED_TO_BM),
    };

    expect(status).toEqual({
      leadCreated: true,
      leadSubmitted: true,
      customerVisit: true,
      businessVisit: false,
      geoVerification: true,
      propertyVisit: false,
      documentsUploaded: true,
      submittedToBm: false,
    });
  });
});
