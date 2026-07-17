import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { useParams } from "react-router-dom";

import { rmApi } from "../rmApi.js";

function getLoginDetails() {
  try {
    const raw = localStorage.getItem("loginDetails");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getUserRole() {
  const loginDetails = getLoginDetails();
  const roles =
    loginDetails?.user?.roles ||
    loginDetails?.roles ||
    loginDetails?.user?.role ||
    [];

  if (Array.isArray(roles)) {
    return String(roles[0] || "").toUpperCase();
  }

  return String(roles || "").toUpperCase();
}

// 9-step timeline configuration matching screenshot
const WORKFLOW_STEPS = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "Field Verification", status: "completed" },
  { id: 3, label: "BM Review", status: "completed" },
  { id: 4, label: "CM Screening", status: "current" },
  { id: 5, label: "Credit", status: "pending" },
  { id: 6, label: "Legal & Valuation", status: "pending" },
  { id: 7, label: "Sanction", status: "pending" },
  { id: 8, label: "Documentation", status: "pending" },
  { id: 9, label: "Disbursement", status: "pending" },
];

export default function SubmitToBM() {
  const { applicationId: routeApplicationId } = useParams();

  const [applicationId, setApplicationId] = useState(routeApplicationId || "");
  const [message, setMessage] = useState("");

  // BM Review Form States
  const [sourcingQuality, setSourcingQuality] = useState("Good");
  const [geoDecision, setGeoDecision] = useState("Within Policy");
  const [preliminaryEligibility, setPreliminaryEligibility] = useState("Eligible");
  const [remarks, setRemarks] = useState("");

  const queryClient = useQueryClient();

  const role = getUserRole();
  const isBM = role === "BM";
  const isRM = role === "RM";

  const pageConfig = useMemo(() => {
    if (isBM) {
      return {
        title: "Branch Manager Review",
        subtitle: "Validate sourcing quality, geography, visits and basic eligibility.",
        buttonText: "Approve to CM",
        loadingText: "Submitting to CM...",
        successText: "Application submitted to CM successfully.",
        actionName: "SUBMITTED_TO_CM",
        allowedStatuses: ["BM_PENDING", "SUBMITTED_TO_BM", "BM_REVIEW"],
        mutationFn: (id) => rmApi.submitToCm(id),
      };
    }

    return {
      title: "Submit Case to Branch Manager",
      subtitle: "Select an application for final RM quality check.",
      buttonText: "Submit to BM",
      loadingText: "Submitting to BM...",
      successText: "Application submitted to BM successfully.",
      actionName: "SUBMITTED_TO_BM",
      allowedStatuses: ["IMD_COLLECTED"],
      mutationFn: (id) => rmApi.submitToBm(id),
    };
  }, [isBM]);

  const applications = useQuery({
    queryKey: ["submit-applications", role],
    queryFn: () => rmApi.applications({ page: 1, limit: 100 }),
  });

  const selectedId = applicationId || routeApplicationId || "";
  const applicationList = applications.data?.data ?? [];

  const filteredApplications = useMemo(() => {
    return applicationList.filter((item) =>
      pageConfig.allowedStatuses.includes(String(item.status || "").toUpperCase())
    );
  }, [applicationList, pageConfig.allowedStatuses]);

  const selectedApplication = applicationList.find(
    (item) => String(item.id) === String(selectedId)
  );

  const profile = useQuery({
    queryKey: ["customer-profile", selectedId],
    queryFn: () => rmApi.getCustomerProfile(selectedId),
    enabled: Boolean(selectedId),
    retry: false,
  });

  const documents = useQuery({
    queryKey: ["documents", selectedId],
    queryFn: () => rmApi.documents(selectedId),
    enabled: Boolean(selectedId),
  });

  const profileData = profile.data?.data;
  const docsData = documents.data?.data ?? [];

  // Checklist items based on UI screenshot
  const checklistItems = [
    { id: 1, label: "Source and partner attribution verified" },
    { id: 2, label: "Duplicate PAN/mobile reviewed" },
    { id: 3, label: "Geo within 50 KM or exception attached" },
    { id: 4, label: "Loan purpose acceptable" },
    { id: 5, label: "Applicant contacted by BM/team" },
    { id: 6, label: "Customer/business/property visits acceptable" },
    { id: 7, label: "Minimum document set complete" },
    { id: 8, label: "No material negative field finding" },
  ];

  const submit = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Please select application first.");
      return pageConfig.mutationFn(id);
    },
    onSuccess: async (response) => {
      setMessage(response?.data?.message || pageConfig.successText);

      await rmApi
        .recordWorkflowStep(selectedId, {
          action: pageConfig.actionName,
          remarks: remarks || pageConfig.successText,
        })
        .catch(() => undefined);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["submit-applications", role] }),
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-application", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["customer-profile", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["rm-workflow", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["rm-workflow-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          `Unable to perform action.`
      );
    },
  });

  if (!isRM && !isBM) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-8 text-slate-800">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
          This page is only available for RM and BM users. Current role:{" "}
          {role || "Not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#f1f5f9] p-6 text-slate-800 antialiased">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2176ff] via-[#3b82f6] to-[#06b6d4] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <HiSparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {pageConfig.title}
              </h2>
              <p className="mt-1 text-xs font-medium text-blue-100">
                {selectedApplication
                  ? `${selectedApplication.applicationNumber} · ${pageConfig.subtitle}`
                  : pageConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => {
                setApplicationId(e.target.value);
                setMessage("");
              }}
              className="w-56 truncate rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium text-white outline-none backdrop-blur-md"
            >
              <option value="" className="text-slate-900">
                Select Application
              </option>
              {filteredApplications.map((item) => (
                <option key={item.id} value={item.id} className="text-slate-900">
                  {item.applicationNumber} - {item.customerName}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/30"
            >
              Raise Query
            </button>

            <button
              type="button"
              className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/30"
            >
              Reject
            </button>

            <button
              type="button"
              disabled={!selectedId || submit.isPending}
              onClick={() => submit.mutate(Number(selectedId))}
              className="rounded-xl bg-white px-5 py-2 text-xs font-bold text-blue-600 shadow-md transition-all hover:bg-blue-50 disabled:opacity-50"
            >
              {submit.isPending ? pageConfig.loadingText : pageConfig.buttonText}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
          {message}
        </div>
      )}

      {/* Workflow Step Indicator */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {WORKFLOW_STEPS.map((step) => {
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";

            return (
              <div
                key={step.id}
                className="flex flex-1 min-w-[90px] flex-col items-center text-center"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "border-2 border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? <FaCheck className="h-3 w-3" /> : step.id}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold leading-tight ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 text-[9px] font-medium text-slate-400 capitalize">
                  {step.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Checklist & Applicant Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: BM Review Checklist & Controls */}
        <div className="space-y-6 lg:col-span-2">
          {/* BM Review Checklist */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
              BM review checklist
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-600 text-white">
                    <FaCheck className="h-2.5 w-2.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Checker evidence retained
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation Form Dropdowns */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Sourcing Quality
                </label>
                <select
                  value={sourcingQuality}
                  onChange={(e) => setSourcingQuality(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Geo Decision
                </label>
                <select
                  value={geoDecision}
                  onChange={(e) => setGeoDecision(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Within Policy">Within Policy</option>
                  <option value="Exception Required">Exception Required</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Preliminary Eligibility
                </label>
                <select
                  value={preliminaryEligibility}
                  onChange={(e) => setPreliminaryEligibility(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Eligible">Eligible</option>
                  <option value="Ineligible">Ineligible</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700">
                BM Review Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add review remarks..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Applicant Summary Sidebar & Note */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
              Applicant summary
            </h3>

            <div className="mt-4 divide-y divide-slate-100 text-xs font-semibold">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-400">Requested</span>
                <span className="text-slate-800">
                  {profileData?.eligibleAmount
                    ? `₹${Number(profileData.eligibleAmount).toLocaleString("en-IN")}`
                    : "₹65,00,000"}
                </span>
              </div>

              <div className="flex justify-between py-2.5">
                <span className="text-slate-400">Income</span>
                <span className="text-slate-800">₹1,85,000</span>
              </div>

              <div className="flex justify-between py-2.5">
                <span className="text-slate-400">FOIR</span>
                <span className="text-slate-800">
                  {profileData?.foir ? `${profileData.foir}%` : "22.70%"}
                </span>
              </div>

              <div className="flex justify-between py-2.5">
                <span className="text-slate-400">Indicative LTV</span>
                <span className="text-slate-800">61.90%</span>
              </div>

              <div className="flex justify-between py-2.5">
                <span className="text-slate-400">Distance</span>
                <span className="text-slate-800">18 KM</span>
              </div>

              <div className="flex justify-between py-2.5">
                <span className="text-slate-400">Documents</span>
                <span className="text-slate-800">
                  {docsData.length ? `${docsData.length}/16` : "5/16"}
                </span>
              </div>
            </div>
          </div>

          {/* Responsibility Banner Note */}
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm">
            <p className="font-medium leading-relaxed">
              <span className="font-bold">BM</span> is responsible for source quality and exceptions, not final underwriting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}