import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaPlus, FaSearch } from "react-icons/fa";
import { FiNavigation, FiCompass, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import { formatCurrency, getNextWorkflowStep, statusClass } from "../rmUtils.js";
import { bmApi } from "../../BM/bmApi.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import TodayFollowUpsRouteModal from "../components/TodayFollowUpsRouteModal.jsx";

const workflowStepsConfig = [
  { key: "leadCreated", label: "Lead Created" },
  { key: "leadSubmitted", label: "Lead Submitted" },
  { key: "customerVisit", label: "Customer Visit" },
  { key: "businessVisit", label: "Business Visit" },
  { key: "propertyVisit", label: "Property Visit" },
  { key: "geoVerification", label: "Geo Verification" },
  { key: "documentsUploaded", label: "Documents Uploaded" },
  { key: "submittedToBm", label: "Submitted to BM" },
];

const beforeSubmittedToBmStatuses = [
  "DRAFT",
  "LEAD_CREATED",
  "IN_PROGRESS",
];

const approvalFlowStages = [
  "All Stages",
  "BM",
  "CM",
  "CREDIT",
  "LEGAL",
  "VALUATION",
  "SANCTION",
  "AGREEMENT",
  "DISBURSEMENT",
  "COLLECTIONS",
  "CLOSURE",
];

const getLoginRole = () => {
  try {
    const raw = localStorage.getItem("loginDetails");
    if (!raw) return "";

    const loginDetails = JSON.parse(raw);

    const roles =
      loginDetails?.user?.roles ||
      loginDetails?.roles ||
      loginDetails?.user?.role ||
      [];

    if (Array.isArray(roles)) {
      return String(roles[0] || "").toUpperCase();
    }

    return String(roles || "").toUpperCase();
  } catch {
    return "";
  }
};

const formatStatusLabel = (status) => {
  return String(status || "-")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getApprovalStatusBadge = (status) => {
  const value = String(status || "").toUpperCase();

  if (
    value.includes("APPROVED") ||
    value === "DISBURSED" ||
    value === "ACTIVE"
  ) {
    return "bg-emerald-100 text-emerald-700 ring-emerald-600/20";
  }

  if (
    value.includes("PENDING") ||
    value === "SUBMITTED_TO_BM" ||
    value === "IN_PROGRESS"
  ) {
    return "bg-amber-100 text-amber-700 ring-amber-600/20";
  }

  if (value === "REJECTED" || value === "CLOSED") {
    return "bg-rose-100 text-rose-700 ring-rose-600/20";
  }

  return "bg-blue-100 text-blue-700 ring-blue-600/20";
};

const getApprovalStageLabel = (lead) => {
  const stage = String(lead.stage || "").toUpperCase();
  const status = String(lead.status || "").toUpperCase();

  if (status.includes("CM")) return "CM Screening";
  if (status.includes("CREDIT")) return "Credit";
  if (status.includes("LEGAL") || status.includes("VALUATION")) {
    return "Legal & Valuation";
  }
  if (status.includes("SANCTION")) return "Sanction";
  if (status.includes("AGREEMENT") || status.includes("DOCUMENTATION")) {
    return "Documentation";
  }
  if (status.includes("DISBURSEMENT") || status === "DISBURSED") {
    return "Disbursement";
  }
  if (status === "ACTIVE") return "Active Loan";
  if (status.includes("COLLECTION")) return "Collections";
  if (status.includes("CLOSURE") || status === "CLOSED") return "Closure";
  if (status.includes("BM")) return "BM Review";

  return formatStatusLabel(stage || status);
};

const getPropertyLabel = (lead) => {
  return (
    lead.propertyType ||
    lead.propertyCategory ||
    lead.customerProfile?.propertyType ||
    lead.customerProfile?.propertyCategory ||
    "-"
  );
};

const getLocationLabel = (lead) => {
  return (
    lead.propertyCity ||
    lead.city ||
    lead.customerProfile?.propertyCity ||
    lead.customerProfile?.city ||
    "-"
  );
};

const isDateToday = (dateValue) => {
  if (!dateValue) return false;
  const str = String(dateValue).trim();
  if (!str) return false;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayIso = `${y}-${m}-${d}`;

  if (str.startsWith(todayIso)) return true;

  // Try parsing ISO / standard date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return (
      parsed.getFullYear() === now.getFullYear() &&
      parsed.getMonth() === now.getMonth() &&
      parsed.getDate() === now.getDate()
    );
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (
      (parts[0] === d || Number(parts[0]) === now.getDate()) &&
      (parts[1] === m || Number(parts[1]) === now.getMonth() + 1) &&
      Number(parts[2]) === y
    ) {
      return true;
    }
  }

  return false;
};

export default function MyLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWorkStarted, setShowStartModal, currentCoords } = useAttendance();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showWorkRequiredModal, setShowWorkRequiredModal] = useState(false);
  const autoOpenedRef = useRef(false);

  const role = getLoginRole();
  const isBM = role === "BM";

  const query = useQuery({
  queryKey: [
    isBM ? "bm-location-applications" : "rm-applications",
    searchTerm,
  ],

  queryFn: async () => {
    if (isBM) {
      return bmApi.getQueue();
    }

    if (searchTerm.trim()) {
      return rmApi.searchApplications(
        searchTerm.trim(),
      );
    }

    return rmApi.applications({
      page: 1,
      limit: 100,
    });
  },

  retry: false,
});

  const allApplicationRows = useMemo(() => {
  const responseData =
    query.data?.data ?? query.data ?? {};

  const payload = isBM
    ? responseData?.applications ??
      responseData?.data?.applications ??
      responseData?.data ??
      []
    : responseData?.data ??
      responseData?.applications ??
      responseData ??
      [];

  return Array.isArray(payload)
    ? payload
    : [];
}, [query.data, isBM]);

  const todayFollowUpLeads = useMemo(() => {
    return allApplicationRows.filter((lead) => {
      const followUp =
        lead.nextFollowUpDate ||
        lead.next_follow_up_date ||
        lead.customerProfile?.nextFollowUpDate ||
        lead.customerProfile?.next_follow_up_date ||
        lead.customerProfile?.nextFollowUp ||
        lead.followUpDate ||
        lead.follow_up_date;
      return isDateToday(followUp);
    });
  }, [allApplicationRows]);

  // Automatically open route planner modal when today's follow-up leads are detected
  useEffect(() => {
    if (todayFollowUpLeads.length > 0 && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setShowRouteModal(true);
    }
  }, [todayFollowUpLeads.length]);

  const handleCreateLeadClick = (e) => {
    if (e) e.preventDefault();
    if (!isWorkStarted) {
      setShowWorkRequiredModal(true);
      return;
    }
    navigate("/create-lead");
  };


  const rmRows = useMemo(() => {
    const beforeSubmittedToBmRows = allApplicationRows.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return beforeSubmittedToBmStatuses.includes(status);
    });

    if (selectedStage === "All Stages") {
      return beforeSubmittedToBmRows;
    }

    return beforeSubmittedToBmRows.filter(
      (item) =>
        String(item.stage || "").toUpperCase() ===
        String(selectedStage || "").toUpperCase(),
    );
  }, [allApplicationRows, selectedStage]);

  const approvalRows = useMemo(() => {
    const approvalOnlyRows = allApplicationRows.filter((item) => {
      const status = String(item.status || "").toUpperCase();

      return !beforeSubmittedToBmStatuses.includes(status);
    });

    if (selectedStage === "All Stages") {
      return approvalOnlyRows;
    }

    return approvalOnlyRows.filter((item) => {
      const stage = String(item.stage || "").toUpperCase();
      const status = String(item.status || "").toUpperCase();
      const selected = String(selectedStage || "").toUpperCase();

      return stage === selected || status.includes(selected);
    });
  }, [allApplicationRows, selectedStage]);

  const workflowQueries = useQuery({
    queryKey: ["rm-workflow-overview"],
    queryFn: async () => {
      const results = await Promise.all(
        rmRows.map((lead) =>
          rmApi.workflowStatus(lead.id).catch(() => ({ data: {} })),
        ),
      );

      return Object.fromEntries(
        rmRows.map((lead, idx) => [lead.id, results[idx]?.data ?? {}]),
      );
    },
    enabled: !isBM && Boolean(rmRows.length),
  });

  const getLiveJourneyLabel = (workflowFlags) => {
    if (!workflowFlags || Object.keys(workflowFlags).length === 0) {
      return "Awaiting Step";
    }

    const currentStep = workflowStepsConfig.find(
      (step) => !workflowFlags[step.key],
    );

    return currentStep ? currentStep.label : "Journey Completed";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 antialiased md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#4857e8] via-[#2575fc] to-[#35c4c8] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-cyan-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                ✦
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Application Pipeline
                </h1>
                <p className="mt-2 text-sm font-medium text-white/90">
                  {isBM
                    ? "Review and move cases across the LAP approval lifecycle."
                    : "Search and open cases across the LAP lifecycle."}
                </p>
              </div>
            </div>

            {!isBM ? (
              <div className="flex flex-wrap items-center gap-3">
                {todayFollowUpLeads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowRouteModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-3 text-sm font-black shadow-lg shadow-amber-500/25 transition-all active:scale-95 animate-bounce-subtle"
                  >
                    <FiCompass className="h-4 w-4 text-slate-900" />
                    <span>Today's Route Plan ({todayFollowUpLeads.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCreateLeadClick}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/20 px-6 py-3 text-sm font-extrabold text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95"
                >
                  <FaPlus className="text-xs" /> Create New Lead
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/20 px-6 py-3 text-sm font-extrabold text-white backdrop-blur-md">
                BM Review Queue
              </div>
            )}
          </div>
        </div>

        {/* Work Status Notification Bar for RMs */}
        {!isBM && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 text-xs font-semibold shadow-2xs transition-all ${
            isWorkStarted
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }">
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm ${
                isWorkStarted ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                {isWorkStarted ? '✓' : '⚠️'}
              </span>
              <div>
                <span className="font-extrabold text-sm block text-slate-900">
                  {isWorkStarted ? 'Work Session Active (Punched In)' : 'Work Session Not Started'}
                </span>
                <span className="text-slate-600 text-xs">
                  {isWorkStarted
                    ? 'Attendance recorded for today. You can create leads and manage visits.'
                    : 'Please punch in your attendance before creating or creating new leads.'}
                </span>
              </div>
            </div>

            {!isWorkStarted ? (
              <button
                type="button"
                onClick={() => setShowStartModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
              >
                Punch In / Start Work ➔
              </button>
            ) : todayFollowUpLeads.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowRouteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
              >
                <FiNavigation className="h-3.5 w-3.5" />
                View {todayFollowUpLeads.length} Scheduled Follow-Ups
              </button>
            ) : null}
          </div>
        )}

        <div className="rounded-[26px] border border-blue-100 bg-white/90 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_240px_140px]">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                type="text"
                placeholder="Search case, applicant, PAN"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-xl border border-blue-100 bg-white px-4 pl-11 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <select
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {(isBM ? approvalFlowStages : ["All Stages", "RM", "BM"]).map(
                  (stage) => (
                    <option key={stage}>{stage}</option>
                  ),
                )}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <FaChevronDown size={12} />
              </span>
            </div>

            <button
              type="button"
              className="h-12 rounded-xl border border-blue-100 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {isBM ? (
          <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
            <div className="overflow-hidden rounded-2xl border border-blue-100">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#eef2ff] text-xs font-black uppercase tracking-wider text-[#3c4599]">
                      <th className="px-6 py-5">Lead ID</th>
                      <th className="px-5 py-5">Applicant</th>
                      <th className="px-5 py-5">Mobile / PAN</th>
                      <th className="px-5 py-5">Amount</th>
                      <th className="px-5 py-5">Property</th>
                      <th className="px-5 py-5">Stage</th>
                      <th className="px-5 py-5">Status</th>
                      <th className="px-6 py-5 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100 text-sm">
                    {query.isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-14 text-center text-sm font-bold text-slate-400"
                        >
                          Loading approval pipeline cases...
                        </td>
                      </tr>
                    ) : approvalRows.length ? (
                      approvalRows.map((lead) => (
                        <tr
                          key={`bm-pipeline-${lead.id}`}
                          className="transition-colors hover:bg-blue-50/40"
                        >
                          <td className="px-6 py-5">
                            <div className="font-black text-slate-800">
                              {lead.applicationNumber || `LAP-${lead.id}`}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              {lead.source || lead.channel || "Direct"}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-bold text-slate-700">
                              {lead.customerName || "-"}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {lead.occupationType ||
                                lead.occupation ||
                                lead.customerProfile?.occupationType ||
                                "-"}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-semibold text-slate-700">
                              {lead.mobile || lead.mobileNumber || "-"}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {lead.pan || lead.panNumber || "-"}
                            </div>
                          </td>

                          <td className="px-5 py-5 font-bold text-slate-700">
                            {formatCurrency(lead.requestedAmount)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-semibold text-slate-700">
                              {getPropertyLabel(lead)}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {getLocationLabel(lead)}
                            </div>
                          </td>

                          <td className="px-5 py-5 font-semibold text-slate-700">
                            {getApprovalStageLabel(lead)}
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex rounded-full px-4 py-2 text-xs font-black ring-1 ring-inset ${getApprovalStatusBadge(
                                lead.status,
                              )}`}
                            >
                              {formatStatusLabel(lead.status)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <Link
                                to={`/applications/${lead.id}`}
                                className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:bg-blue-50"
                              >
                                Open
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-14 text-center text-sm font-bold text-slate-400"
                        >
                          No BM approval cases found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Lead ID</th>
                    <th className="px-4 py-4">Applicant</th>
                    <th className="px-4 py-4">Contact</th>
                    <th className="px-4 py-4 text-right">Requested Amount</th>
                    <th className="px-4 py-4">Journey Progress</th>
                    <th className="px-4 py-4">Date Created</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {query.isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="animate-pulse px-6 py-12 text-center text-sm font-medium text-slate-400"
                      >
                        Fetching pipeline accounts...
                      </td>
                    </tr>
                  ) : rmRows.length ? (
                    rmRows.map((lead) => {
                      const statusFlags = workflowQueries.data?.[lead.id] ?? {};
                      const nextStep = getNextWorkflowStep(statusFlags);

                      const continueRoute =
                        nextStep === "create-lead"
                          ? `/create-lead/${lead.id}`
                          // : nextStep === "customer-visit"
                          //   ? `/customer-visit/${lead.id}`
                          //   : nextStep === "geo-verification"
                          //     ? `/geo-verification/${lead.id}`
                              : nextStep === "kyc-documents"
                                ? `/kyc-documents/${lead.id}`
                                : `/submit-bm/${lead.id}`;

                      return (
                        <tr
                          key={lead.id}
                          className="transition-colors hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {lead.applicationNumber}
                          </td>

                          <td className="px-4 py-4 font-medium text-slate-800">
                            {lead.customerName}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {lead.mobile}
                          </td>

                          <td className="px-4 py-4 text-right font-semibold text-slate-900">
                            {formatCurrency(lead.requestedAmount)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="inline-flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(
                                  lead.status,
                                )}`}
                              >
                                {lead.status}
                              </span>

                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10">
                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
                                {getLiveJourneyLabel(statusFlags)}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-500">
                            {lead.createdAt
                              ? new Date(lead.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "-"}
                          </td>

                          <td className="px-6 py-4">
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
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                      >
                        No active RM pipeline cases before BM submission.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Today's Follow-Ups & Smart Route Planner Modal */}
      <TodayFollowUpsRouteModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        todayLeads={todayFollowUpLeads}
        currentCoords={currentCoords}
        userName={user?.name || "Relationship Manager"}
        spokeLocation={typeof user?.spoke === "object" ? user?.spoke?.name : user?.spoke || ""}
      />

      {/* Work Not Started Prompt Modal */}
      {showWorkRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-3xl font-black mb-4">
              ⚠️
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Work Session Not Started
            </h3>

            <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
              Company policy requires punch-in attendance before you can create new leads or register customer applications.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowWorkRequiredModal(false);
                  setShowStartModal(true);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-black text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95"
              >
                Punch In & Start Work Now ➔
              </button>

              <button
                type="button"
                onClick={() => setShowWorkRequiredModal(false)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}