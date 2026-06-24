import { useState } from 'react';

import { Button } from '../../../components/ui/button.jsx';
import { Separator } from '../../../components/ui/separator.jsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import AppCard from '../../../components/common/AppCard.jsx';
import AppLoader from '../../../components/common/AppLoader.jsx';
import FileUploader from '../../../components/forms/FileUploader.jsx';
import FormInput from '../../../components/forms/FormInput.jsx';
import PageHeader from '../../../components/common/PageHeader.jsx';
import WorkflowHistory from '../../../components/workflow/WorkflowHistory.jsx';
import WorkflowStepper from '../../../components/workflow/WorkflowStepper.jsx';

import ApplicationForm from '../components/ApplicationForm.jsx';
import ApplicationSummary from '../components/ApplicationSummary.jsx';
import { applicationsApi } from '../applicationsApi.js';

export default function ApplicationDetailsPage() {
  const { applicationId } = useParams();
  const [visit, setVisit] = useState({ visitType: 'CUSTOMER', remarks: '' });

  const queryClient = useQueryClient();
  const application = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.get(applicationId),
  });
  const history = useQuery({
    queryKey: ['workflow-history', applicationId],
    queryFn: () => applicationsApi.workflowHistory(applicationId),
  });

  const update = useMutation({
    mutationFn: (payload) => applicationsApi.update(applicationId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['application', applicationId] }),
  });

  const createVisit = useMutation({
    mutationFn: () => applicationsApi.createVisit(applicationId, visit),
  });

  const transition = useMutation({
    mutationFn: (action) =>
      applicationsApi.transition(applicationId, {
        action,
        remarks: action,
        expectedVersion: application.data?.data?.version,
      }),
  });

  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'KYC');
    applicationsApi.uploadDocument(applicationId, formData);
  };

 if (application.isLoading)
  return <AppLoader />;

if (!application.data?.data) {
  return (
    <div className="p-6">
      Application not found
    </div>
  );
}

const data = application.data.data;

  return (
    <>
      <PageHeader title={data.applicationNumber} subtitle={data.customerName} />

      <div className="grid gap-4">
        <AppCard>
          <WorkflowStepper activeStage={data.stage} />
          <Separator className="my-4" />
          <ApplicationSummary application={data} />
        </AppCard>

        <AppCard>
          <ApplicationForm
            value={data}
            onChange={(next) => update.mutate(next)}
            onSubmit={(event) => event.preventDefault()}
            submitLabel="Update application"
          />
        </AppCard>

        <AppCard>
          <div className="mb-3 font-bold">Customer visit</div>
          <div className="flex flex-wrap gap-3">
            <FormInput
              label="Remarks"
              value={visit.remarks}
              onChange={(event) => setVisit({ ...visit, remarks: event.target.value })}
            />
            <Button variant="contained" onClick={() => createVisit.mutate()}>
              Record visit
            </Button>
            <FileUploader onChange={upload} />
          </div>
        </AppCard>

        <AppCard>
          <div className="flex flex-wrap gap-3">
            <Button variant="contained" onClick={() => transition.mutate('SUBMIT_TO_BM')}>
              Submit to BM
            </Button>
            <Button variant="outline" onClick={() => transition.mutate('BM_APPROVE')}>
              BM approve
            </Button>
          </div>
        </AppCard>

        <AppCard>
          <WorkflowHistory items={history.data?.data ?? []} />
        </AppCard>
      </div>
    </>
  );
}

