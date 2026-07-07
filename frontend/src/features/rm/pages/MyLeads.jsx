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
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 antialiased md:p-8 text-slate-800">
      
      {/* HEADER HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Application Pipeline</h2>
            <p className="mt-1 text-sm font-medium text-blue-100/80">Search and open cases across the LAP lifecycle status workflows.</p>
          </div>
          <Link to="/create-lead" className="flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-md backdrop-blur-md transition-all hover:bg-white/30 sm:self-center">
            <FaPlus className="text-xs" /> Create New Lead
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="relative min-w-[280px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search case, applicant, mobile, PAN..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
          />
        </div>

        <div className="relative min-w-[180px]">
          <select
            value={selectedStage}
            onChange={(event) => setSelectedStage(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white"
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

      {/* RE-ENGINEERED DATA TABLE SYSTEM */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 pl-6">Lead Number</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Loan Amount</th>
                <th className="p-4">Status & Live Workflow Journey</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {query.isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm font-medium text-slate-400 animate-pulse">
                    Loading pipeline cases...
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
                    <tr key={lead.id} className="transition-colors hover:bg-slate-50/40">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900 tracking-tight">{lead.applicationNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{lead.customerName}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{lead.mobile}</td>
                      <td className="p-4 font-bold text-slate-900">{formatCurrency(lead.requestedAmount)}</td>
                      
                      {/* DYNAMIC PIPELINE STATUS AND SUB-STAGE RENDER SECTION */}
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Main Status Badge */}
                          <span className={`inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm ${statusClass(lead.status)}`}>
                            {lead.status}
                          </span>
                          
                          {/* Contextual Sub-Stage Label derived from workflowStepsConfig */}
                          <span className="inline-flex items-center whitespace-nowrap rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-extrabold tracking-wide text-indigo-700 shadow-sm">
                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            {getLiveJourneyLabel(statusFlags)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-4 font-medium text-slate-500">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/applications/${lead.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600">
                            View
                          </Link>
                          <Link
                            to={continueRoute}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
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
                  <td colSpan={7} className="p-8 text-center text-sm font-medium text-slate-400">
                    No matching pipeline leads discovered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}