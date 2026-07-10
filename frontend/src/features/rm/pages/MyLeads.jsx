import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaChevronDown, FaPlus, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import { formatCurrency, getNextWorkflowStep, statusClass } from "../rmUtils.js";

// Ordered sequence tracking structure definition
const workflowStepsConfig = [
  { key: "leadCreated", label: "Lead Created" },
  { key: "leadSubmitted", label: "Lead Submitted" },
  { key: "customerVisit", label: "Customer Visit" },
  { key: "businessVisit", label: "Business Visit" },
  { key: "propertyVisit", label: "Property Visit" },
  { key: "geoVerification", label: "Geo Verification" },
  { key: "documentsUploaded", label: "Documents Uploaded" },
  { key: "submittedToBm", label: "Submitted to BM" }
];

export default function MyLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("All Stages");

  const query = useQuery({
    queryKey: ["rm-applications", searchTerm],
    queryFn: () => (searchTerm.trim() ? rmApi.searchApplications(searchTerm.trim()) : rmApi.applications({ page: 1, limit: 50 })),
  });

  const rows = useMemo(() => {
    const data = query.data?.data ?? [];

    if (selectedStage === "All Stages") {
      return data;
    }

    return data.filter((item) => item.stage === selectedStage);
  }, [query.data, selectedStage]);

  const workflowQueries = useQuery({
    queryKey: ["rm-workflow-overview"],
    queryFn: async () => {
      const leads = query.data?.data ?? [];
      const results = await Promise.all(leads.map((lead) => rmApi.workflowStatus(lead.id).catch(() => ({ data: {} }))));
      return Object.fromEntries(leads.map((lead, idx) => [lead.id, results[idx]?.data ?? {}]));
    },
    enabled: Boolean(query.data?.data?.length),
  });

  // Helper utility function to parse out current internal sub-stage label
  const getLiveJourneyLabel = (workflowFlags) => {
    if (!workflowFlags || Object.keys(workflowFlags).length === 0) return "Awaiting Step";
    
    // Find the first milestone item configuration that is not marked true
    const currentStep = workflowStepsConfig.find(step => !workflowFlags[step.key]);
    
    // Fallback if all conditions inside config loop return completed true
    return currentStep ? currentStep.label : "Journey Completed";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 antialiased md:p-10 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER HERO SECTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Application Pipeline</h1>
            <p className="mt-1 text-sm text-slate-500">Track, manage, and accelerate cases across the active LAP lifecycle stages.</p>
          </div>
         <Link 
  to="/create-lead" 
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
>
  <FaPlus className="text-xs" /> Create New Lead
</Link>
        </div>

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative sm:col-span-2">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by case, applicant name, mobile, PAN..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="relative">
            <select
              value={selectedStage}
              onChange={(event) => setSelectedStage(event.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option>All Stages</option>
              <option>RM</option>
              <option>BM</option>
              <option>CM</option>
              <option>CREDIT</option>
              <option>LEGAL</option>
              <option>VALUATION</option>
              <option>SANCTION</option>
              <option>AGREEMENT</option>
              <option>DISBURSEMENT</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
              <FaChevronDown size={11} />
            </span>
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Lead ID</th>
                  <th className="py-4 px-4">Applicant</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4 text-right">Requested Amount</th>
                  <th className="py-4 px-4">Journey Progress</th>
                  <th className="py-4 px-4">Date Created</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {query.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center text-sm font-medium text-slate-400 animate-pulse">
                      Fetching pipeline accounts...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((lead) => {
                    const statusFlags = workflowQueries.data?.[lead.id] ?? {};
                    const nextStep = getNextWorkflowStep(statusFlags);
                    
                    const continueRoute =
                      nextStep === "create-lead"
                        ? `/create-lead/${lead.id}`
                        : nextStep === "customer-visit"
                        ? `/customer-visit/${lead.id}`
                        : nextStep === "geo-verification"
                        ? `/geo-verification/${lead.id}`
                        : nextStep === "kyc-documents"
                        ? `/kyc-documents/${lead.id}`
                        : `/submit-bm/${lead.id}`;
                        
                    return (
                      <tr key={lead.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {lead.applicationNumber}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-800">
                          {lead.customerName}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {lead.mobile}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900 text-right">
                          {formatCurrency(lead.requestedAmount)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-2">
                            {/* Main Status Badge */}
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(lead.status)}`}>
                              {lead.status}
                            </span>
                            
                            {/* Contextual Sub-Stage Label */}
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
                              {getLiveJourneyLabel(statusFlags)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Link 
                              to={`/applications/${lead.id}`} 
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
                            >
                              View
                            </Link>
                            <Link
                              to={continueRoute}
                              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
                            >
                              Continue Journey
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center text-sm font-medium text-slate-400">
                      No matching pipeline leads discovered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}