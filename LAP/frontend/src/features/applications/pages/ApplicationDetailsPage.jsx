import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../components/ui/button.jsx';
import { Separator } from '../../../components/ui/separator.jsx';

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

// Import your timeline building utility
import { buildWorkflowTimeline } from '../../rm/rmUtils.js';

export default function ApplicationDetailsPage() {
  const { applicationId } = useParams();
  const [visit, setVisit] = useState({ visitType: 'CUSTOMER', remarks: '' });

  const queryClient = useQueryClient();

  // 1. Fetch main application payload
  const application = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.get(applicationId),
  });

  // 2. Fetch history logs
  const history = useQuery({
    queryKey: ['workflow-history', applicationId],
    queryFn: () => applicationsApi.workflowHistory(applicationId),
  });

  // 3. Fetch live authenticated workflow tracker flags
  const { data: workflowResponse, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ["rm-workflow", applicationId],
    queryFn: async () => {
      let token = null;
      
      try {
        const loginDetailsStr = localStorage.getItem("loginDetails");
        if (loginDetailsStr) {
          const loginDetails = JSON.parse(loginDetailsStr);
          token = loginDetails.accessToken;
        }
      } catch (err) {
        console.error("Error parsing loginDetails from localStorage:", err);
      }

      const res = await fetch(`http://localhost:9000/api/applications/${applicationId}/workflow`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }), 
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw new Error("Network response was not ok");
      }
      return res.json();
    },
    enabled: !!applicationId,
  });

  // Change this variable dynamically depending on your user authentication logic
  const userRole = 'RM'; 

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

  // Safe layout guards for multi-query state synchronization
  if (application.isLoading || isLoadingWorkflow) {
    return <AppLoader />;
  }

  if (!application.data?.data) {
    return <div className="p-6">Application not found</div>;
  }

  const data = application.data.data;
  
  // Safely fallback handling wrapper payloads: standard fetch data target or .data container parsing
  const workflowFlags = workflowResponse?.data ?? workflowResponse ?? {};
  
  // Generates timeline mapping using your dynamic API boolean properties
  const leadJourney = buildWorkflowTimeline(workflowFlags);

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
      
      {/* 1. Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Premium Deal Profile
          </span>
          <PageHeader title={data.applicationNumber} subtitle={data.customerName} className="mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => transition.mutate('BM_APPROVE')}>
            BM Approve
          </Button>
          <Button variant="contained" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => transition.mutate('SUBMIT_TO_BM')}>
            Submit to BM
          </Button>
        </div>
      </div>

      {/* 2. Customer Summary Cards & Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard className="p-4 border-l-4 border-l-indigo-500">
          <p className="text-xs font-medium text-slate-500 uppercase">Customer Summary</p>
          <h4 className="text-lg font-bold text-slate-800 mt-1">{data.customerName || 'N/A'}</h4>
          <p className="text-xs text-slate-400 mt-0.5">Primary Applicant</p>
        </AppCard>

        <AppCard className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-slate-500 uppercase">Current Stage</p>
          <h4 className="text-lg font-bold text-slate-800 mt-1 capitalize">{data.stage?.toLowerCase().replace('_', ' ') || 'Initiated'}</h4>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">● Active Status</p>
        </AppCard>

        <AppCard className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-slate-500 uppercase">RM Workflow Tracker</p>
          <h4 className="text-lg font-bold text-slate-800 mt-1">Relationship Desk</h4>
          <p className="text-xs text-slate-400 mt-0.5">Assigned to: {data.rmName || 'Regional Manager'}</p>
        </AppCard>

        <AppCard className="p-4 border-l-4 border-l-sky-500">
          <p className="text-xs font-medium text-slate-500 uppercase">Application Progress</p>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3">
            <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-xs text-slate-500 text-right mt-1.5 font-semibold">65% Complete</p>
        </AppCard>
      </div>

      {/* 3. Full Workflow Timeline (Hidden if role is RM) */}
      {userRole !== 'RM' && (
        <AppCard className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Full Workflow Timeline</h3>
          <WorkflowStepper activeStage={data.stage} />
        </AppCard>
      )}

      {/* Main 2-Column Split Dashboard Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 2/3 - Details Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Conditional Layout Panel */}
          {userRole === 'RM' ? (
            /* Horizontal Workflow Stepper populated with dynamic workflow data */
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">RM Workflow Journey</h3>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"> Active Track </span>
              </div>
              
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-[800px] items-center justify-between">
                  {leadJourney.map((item, index) => {
                    const isCurrent = !item.completed && index === leadJourney.findIndex((step) => !step.completed);
                    return (
                      <div key={item.label} className="relative flex flex-1 flex-col items-center text-center">
                        {index !== leadJourney.length - 1 && (
                          <div className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${leadJourney[index + 1].completed ? "bg-emerald-500" : "bg-slate-200"}`} />
                        )}
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                          item.completed ? "bg-emerald-500 text-white ring-4 ring-emerald-100" : isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-white text-slate-400 ring-2 ring-slate-200"
                        }`}>
                          {item.completed ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isCurrent ? "●" : index + 1}
                        </div>
                        <div className="mt-2.5 px-2">
                          <p className={`text-xs font-semibold ${item.completed || isCurrent ? "text-slate-900" : "text-slate-500"}`}>{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 border-t pt-4">
                <ApplicationSummary application={data} />
              </div>
            </div>
          ) : (
            /* Fallback Card Layer */
            <AppCard className="p-6">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">Application Core Details</h3>
                <p className="text-xs text-slate-400">Overview of basic terms and conditions</p>
              </div>
              <ApplicationSummary application={data} />
            </AppCard>
          )}

          {/* Core Structured Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppCard className="p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">👤 Applicant Details</h4>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium">Full Name:</span> {data.customerName}</p>
                <p><span className="font-medium">Email:</span> {data.email || 'N/A'}</p>
                <p><span className="font-medium">Contact:</span> {data.phoneNumber || 'N/A'}</p>
              </div>
            </AppCard>

            <AppCard className="p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">👥 Co-applicant Details</h4>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium">Name:</span> {data.coApplicantName || 'None Added'}</p>
                <p><span className="font-medium">Relation:</span> {data.coApplicantRelation || 'N/A'}</p>
                <p><span className="font-medium">Income Source:</span> {data.coApplicantIncome || 'N/A'}</p>
              </div>
            </AppCard>

            <AppCard className="p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">🏠 Property Details</h4>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium">Type:</span> {data.propertyType || 'Residential'}</p>
                <p><span className="font-medium">Estimated Value:</span> {data.propertyValue || 'Under Evaluation'}</p>
                <p><span className="font-medium">Location:</span> {data.propertyAddress || 'N/A'}</p>
              </div>
            </AppCard>

            <AppCard className="p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">🏦 Bank Details</h4>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium">Bank Name:</span> {data.bankName || 'N/A'}</p>
                <p><span className="font-medium">Account No:</span> {data.accountNumber || '•••• •••• ••••'}</p>
                <p><span className="font-medium">IFSC:</span> {data.ifscCode || 'N/A'}</p>
              </div>
            </AppCard>

            <AppCard className="p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">📊 Eligibility Metrics</h4>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium">Credit Score:</span> <span className="text-emerald-600 font-bold">{data.creditScore || '750+ Verified'}</span></p>
                <p><span className="font-medium">Max Eligible Limit:</span> {data.eligibleAmount || 'Calculated on verification'}</p>
                <p><span className="font-medium">DTI Ratio:</span> {data.dtiRatio || 'Optimal'}</p>
              </div>
            </AppCard>

            <AppCard className="p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">🆔 KYC Checklist</h4>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium">Identity Proof:</span> <span className="text-emerald-600 font-semibold">✓ Verified</span></p>
                <p><span className="font-medium">Address Verification:</span> <span className="text-emerald-600 font-semibold">✓ Verified</span></p>
                <p><span className="font-medium">Video KYC Status:</span> <span className="text-amber-500 font-semibold">Pending Approval</span></p>
              </div>
            </AppCard>
          </div>

          <AppCard className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Modify Fields</h3>
            <ApplicationForm
              value={data}
              onChange={(next) => update.mutate(next)}
              onSubmit={(event) => event.preventDefault()}
              submitLabel="Update application data"
            />
          </AppCard>
        </div>

        {/* Right Column: 1/3 - Actions & Logs */}
        <div className="space-y-6">
          <AppCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Documents & Visits</h3>
              <p className="text-xs text-slate-400">Upload mandatory files and record dynamic verification runs</p>
            </div>
            
            <div className="space-y-4">
              <FormInput
                label="Verification Remarks"
                value={visit.remarks}
                onChange={(event) => setVisit({ ...visit, remarks: event.target.value })}
              />
              
              <div className="flex flex-col gap-2">
                <Button variant="contained" className="w-full bg-slate-800 text-white" onClick={() => createVisit.mutate()}>
                  Record Verification Visit
                </Button>
                <Separator className="my-2" />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Upload Mandatory KYC/Asset File</label>
                  <FileUploader onChange={upload} />
                </div>
              </div>
            </div>
          </AppCard>

          <AppCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Audit Logs & History</h3>
              <p className="text-xs text-slate-400">Complete regulatory tracking and trace reports</p>
            </div>
            <Separator className="mb-4" />
            <WorkflowHistory items={history.data?.data ?? []} />
          </AppCard>

          <AppCard className="p-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Live Activity Timeline</h3>
            <div className="relative pl-4 border-l-2 border-slate-200 text-xs space-y-4">
              <div>
                <span className="absolute -left-1.5 top-1 bg-indigo-500 w-3 h-3 rounded-full border-2 border-white"></span>
                <p className="font-semibold text-slate-700">File Accessed</p>
                <p className="text-slate-400">Just now by RM Agent</p>
              </div>
              <div>
                <span className="absolute -left-1.5 top-1 bg-slate-300 w-3 h-3 rounded-full border-2 border-white"></span>
                <p className="font-semibold text-slate-600">Verification Triggered</p>
                <p className="text-slate-400">2 hours ago</p>
              </div>
            </div>
          </AppCard>
        </div>

      </div>
    </div>
  );
}