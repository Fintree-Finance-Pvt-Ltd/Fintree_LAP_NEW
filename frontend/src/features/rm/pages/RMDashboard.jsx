import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  FaArrowRight,
  FaBriefcase,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaFileInvoiceDollar,
  FaPlus,
  FaSearch,
  FaUser
} from "react-icons/fa";
import { Link } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth.js";
import { rmApi } from "../rmApi.js";
import { displayStage, formatCurrency, statusClass, workflowSteps } from "../rmUtils.js";

// Mapping layout positions perfectly to database JSON keys
const WORKFLOW_KEY_MAP = [
  "leadCreated",
  "leadSubmitted",
  "customerVisit",
  "businessVisit",
  "propertyVisit",
  "geoVerification",
  "documentsUploaded",
  "submittedToBm"
];

export default function RMDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [activeCaseId, setActiveCaseId] = useState(null);

  // Core Dashboard Metrics Analytics
  const dashboard = useQuery({ 
    queryKey: ["rm-dashboard"], 
    queryFn: rmApi.dashboard 
  });

  // Table Data Applications Fetching
  const applications = useQuery({
    queryKey: ["rm-dashboard-applications", page, searchTerm],
    queryFn: () => searchTerm 
      ? rmApi.searchApplications(searchTerm)
      : rmApi.applications({ page, limit: 5 }),
  });

  const stats = dashboard.data?.data ?? {};
  const cases = applications.data?.data ?? [];
  
  // Selected Context Case Calculation
  const selectedCase = cases.find(c => c.id === activeCaseId) || cases[0];

  // Live Workflow Endpoint Tracker Hook
  const workflowData = useQuery({
    queryKey: ["rm-workflow-status", selectedCase?.id],
    queryFn: () => rmApi.workflowStatus(selectedCase.id),
    enabled: !!selectedCase?.id,
  });

  const apiWorkflowFlags = workflowData.data?.data ?? {};

  const metrics = [
    { 
      title: "Total Cases", 
      value: stats.totalCases ?? 0, 
      icon: FaBriefcase,
      color: "from-blue-500 to-indigo-600", 
      bgLight: "bg-blue-50" 
    },
    { 
      title: "Draft Cases", 
      value: stats.draftCases ?? 0, 
      icon: FaClock,
      color: "from-emerald-500 to-teal-600", 
      bgLight: "bg-emerald-50" 
    },
    { 
      title: "Submitted to BM", 
      value: stats.pendingCases ?? 0, 
      icon: FaFileInvoiceDollar,
      color: "from-rose-500 to-pink-600", 
      bgLight: "bg-rose-50" 
    },
    { 
      title: "This Month", 
      value: stats.monthlyCases ?? 0, 
      icon: FaCalendarAlt,
      color: "from-amber-500 to-orange-600", 
      bgLight: "bg-amber-50" 
    },
  ];

  return (
    <div className="min-h-screen space-y-8 bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800">
      
{/* Premium Hero Banner - Vibrant Light */}
<div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 p-6 sm:p-8 text-slate-900 shadow-sm">
  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-3">
      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-600 shadow-2xl border border-blue-200/60">
        Operational View • {user?.spoke || "Central Spoke"}
      </span>

      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Welcome back, <span className="text-blue-600">{user?.name || "Relationship Manager"}</span>
      </h2>

      <p className="max-w-xl text-sm font-medium text-slate-600">
        Monitor your pipeline performance, track live corporate application cycles, and clear processing hurdles instantly.
      </p>
    </div>

    <Link 
      to="/create-lead" 
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-slate-800 active:scale-95 shrink-0"
    >
      <FaPlus className="text-xs" />
      Create New Lead
    </Link>
  </div>
</div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
                <div className={`rounded-xl p-2.5 text-white bg-gradient-to-br ${card.color} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {dashboard.isLoading ? (
                    <div className="h-9 w-16 animate-pulse rounded bg-slate-200" />
                  ) : (
                    card.value
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Progress Tracker */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Live Application Journey: <span className="text-indigo-600 font-extrabold">{selectedCase?.applicationNumber || "No Selection"}</span>
          </h3>
          {workflowData.isFetching && (
            <span className="text-xs text-blue-500 animate-pulse font-medium">Syncing pipeline...</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4 pt-2 scrollbar-none">
          {workflowSteps.map((label, idx) => {
            const currentFlagKey = WORKFLOW_KEY_MAP[idx];
            const isCompleted = !!apiWorkflowFlags[currentFlagKey];
            
            const previousFlagKey = WORKFLOW_KEY_MAP[idx - 1];
            const isPreviousCompleted = idx === 0 || !!apiWorkflowFlags[previousFlagKey];
            const isActive = !isCompleted && isPreviousCompleted;
            
            return (
              <div key={label} className="flex min-w-[140px] flex-1 items-center">
                <div className="flex flex-1 flex-col items-center text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    isCompleted 
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                      : isActive 
                        ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                        : "bg-slate-100 text-slate-400"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`mt-3 whitespace-nowrap text-xs font-bold transition-colors ${
                    isCompleted ? "text-emerald-600" : isActive ? "text-blue-600 font-extrabold" : "text-slate-500"
                  }`}>
                    {displayStage(label)}
                  </span>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div className="mx-2 mt-[-24px] h-[3px] w-full rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                      isCompleted ? "w-full from-emerald-500 to-emerald-500" : isActive ? "w-1/2 from-blue-600 to-slate-100" : "w-0"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout splits here */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        
        {/* Cases Table Section */}
        <div className="flex flex-col rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cases requiring attention</h3>
              <p className="text-xs text-slate-400 mt-0.5">Click any case row to update context pipeline analytics.</p>
            </div>
            
            {/* Real Search Integration Input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <FaSearch size={13} />
              </span>
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="rounded-l-xl p-4">Case Details</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Stage</th>
                  <th className="rounded-r-xl p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {applications.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-4"><div className="h-5 bg-slate-100 rounded" /></td>
                    </tr>
                  ))
                ) : cases.length ? cases.map((item) => {
                  const isSelected = selectedCase?.id === item.id;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setActiveCaseId(item.id)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="p-4">
                        <span className={`font-bold ${isSelected ? "text-blue-600" : "text-slate-900"}`}>
                          {item.applicationNumber}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-normal">{item.customerName}</td>
                      <td className="p-4 font-semibold text-slate-900">{formatCurrency(item.requestedAmount)}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {displayStage(item.stage)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className="p-8 text-center text-sm text-slate-400" colSpan={5}>
                      No operational cases found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-medium text-slate-400">Page {page} of pipeline</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <FaChevronLeft size={10} />
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={cases.length < 5}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Case Preview Sidebar Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Context File Summary</h3>
              {selectedCase && (
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Live
                </span>
              )}
            </div>
            
            {selectedCase ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <FaUser size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Applicant</p>
                    <p className="text-sm font-bold text-slate-900">{selectedCase.customerName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Requested</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">{formatCurrency(selectedCase.requestedAmount)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</p>
                    <span className={`inline-block mt-1 text-xs font-bold ${statusClass(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">File ID:</span>
                    <span className="text-slate-900 font-bold">{selectedCase.applicationNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Workflow Stage:</span>
                    <span className="text-indigo-600 font-bold">{displayStage(selectedCase.stage)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                Create or click on an operational lead to populate context actions.
              </div>
            )}
          </div>

          {selectedCase && (
            <Link
              to={`/applications/${selectedCase.id}`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              Examine Full Workcase File
              <FaArrowRight size={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}