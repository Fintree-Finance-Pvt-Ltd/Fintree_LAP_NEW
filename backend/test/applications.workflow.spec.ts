import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const WorkflowLogAction = {
  LEAD_CREATED:
    'LEAD_CREATED',

  LEAD_SUBMITTED:
    'LEAD_SUBMITTED',

  CUSTOMER_VISIT_DONE:
    'CUSTOMER_VISIT_DONE',

  GEO_VERIFICATION_DONE:
    'GEO_VERIFICATION_DONE',

  PROPERTY_VISIT_DONE:
    'PROPERTY_VISIT_DONE',

  DOCUMENTS_UPLOADED:
    'DOCUMENTS_UPLOADED',

  SUBMITTED_TO_BM:
    'SUBMITTED_TO_BM',
};

describe(
  'workflow status mapping',
  () => {
    it(
      'marks customerVisit true after field visits are completed',
      () => {
        const actions = [
          WorkflowLogAction.LEAD_CREATED,
          WorkflowLogAction.LEAD_SUBMITTED,
          WorkflowLogAction.CUSTOMER_VISIT_DONE,
        ];

        const status = {
          leadCreated:
            actions.includes(
              WorkflowLogAction.LEAD_CREATED,
            ) ||
            actions.includes(
              WorkflowLogAction.LEAD_SUBMITTED,
            ),

          leadSubmitted:
            actions.includes(
              WorkflowLogAction.LEAD_SUBMITTED,
            ),

          customerVisit:
            actions.includes(
              WorkflowLogAction.CUSTOMER_VISIT_DONE,
            ),

          geoVerification:
            actions.includes(
              WorkflowLogAction.GEO_VERIFICATION_DONE,
            ),

          propertyVisit:
            actions.includes(
              WorkflowLogAction.PROPERTY_VISIT_DONE,
            ),

          documentsUploaded:
            actions.includes(
              WorkflowLogAction.DOCUMENTS_UPLOADED,
            ),

          submittedToBm:
            actions.includes(
              WorkflowLogAction.SUBMITTED_TO_BM,
            ),
        };

        assert.deepStrictEqual(
          status,
          {
            leadCreated: true,
            leadSubmitted: true,
            customerVisit: true,
            geoVerification: false,
            propertyVisit: false,
            documentsUploaded: false,
            submittedToBm: false,
          },
        );
      },
    );
  },
);