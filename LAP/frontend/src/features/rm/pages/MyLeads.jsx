import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaChevronDown, FaPlus, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import { formatCurrency, getNextWorkflowStep, statusClass } from "../rmUtils.js";

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

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Application Pipeline</h2>
            <p className="mt-1 text-sm font-medium text-blue-100/80">Search and open cases across the LAP lifecycle.</p>
          </div>
          <Link to="/create-lead" className="flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-md backdrop-blur-md transition-all hover:bg-white/30 sm:self-center">
            <FaPlus className="text-xs" /> Create New Lead
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative min-w-[280px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search case, applicant, mobile, PAN..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="relative min-w-[160px]">
          <select
            value={selectedStage}
            onChange={(event) => setSelectedStage(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
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

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 pl-6">Lead Number</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Loan Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {query.isLoading ? (
                <tr><td colSpan={7} className="p-6 text-slate-400">Loading leads...</td></tr>
              ) : rows.length ? rows.map((lead) => {
                const status = workflowQueries.data?.[lead.id] ?? {};
                const nextStep = getNextWorkflowStep(status);
                const continueRoute = nextStep === "create-lead" ? `/create-lead/${lead.id}` : nextStep === "customer-visit" ? `/customer-visit/${lead.id}` : nextStep === "geo-verification" ? `/geo-verification/${lead.id}` : nextStep === "kyc-documents" ? `/kyc-documents/${lead.id}` : `/submit-bm/${lead.id}`;
                return (
                  <tr key={lead.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900">{lead.applicationNumber}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{lead.customerName}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{lead.mobile}</td>
                    <td className="p-4 font-bold text-slate-900">{formatCurrency(lead.requestedAmount)}</td>
                    <td className="p-4">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/applications/${lead.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#0f2942] shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600">
                          View
                        </Link>
                        <Link to={continueRoute} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700">
                          Continue Journey
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="p-6 text-slate-400">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
