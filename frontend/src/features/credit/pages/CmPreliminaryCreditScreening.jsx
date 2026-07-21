import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { creditApi } from "../creditApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const workflowSteps = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "Field Verification", status: "completed" },
  { id: 3, label: "BM Review", status: "completed" },
  { id: 4, label: "CM Screening", status: "current" },
  { id: 5, label: "Credit", status: "Pending" },
  { id: 6, label: "Legal & Valuation", status: "pending" },
  { id: 7, label: "Sanction", status: "pending" },
  { id: 8, label: "Documentation", status: "pending" },
  { id: 9, label: "Disbursement", status: "pending" },
];

export default function CmPreliminaryCreditScreening() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [decision, setDecision] = useState("RECOMMENDED");
  const [recommendedAmount, setRecommendedAmount] = useState("");
  const [remarks, setRemarks] = useState(
    "Income, bureau and field quality are acceptable for detailed Hub underwriting.",
  );
  const [message, setMessage] = useState("");

  const queryClient = useQueryClient();
  

  const applicationsQuery = useQuery({
    queryKey: ["cm-screening-applications"],
    queryFn: () => creditApi.applications({ page: 1, limit: 100 }),
  });

  const cmCases = useMemo(() => {
    const rows = applicationsQuery.data?.data ?? [];

    return rows.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      const stage = String(item.stage || "").toUpperCase();

      return (
        stage === "CM" ||
        status === "CM_PENDING" ||
        status === "BM_APPROVED"
      );
    });
  }, [applicationsQuery.data]);

  const finalSelectedId = selectedId || cmCases?.[0]?.id || "";

  const applicationQuery = useQuery({
    queryKey: ["cm-screening-application", finalSelectedId],
    queryFn: () => creditApi.getApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
  });

  const application = unwrapPayload(applicationQuery.data);

const submitMutation = useMutation({
  mutationFn: (payload) => {
    if (!finalSelectedId) {
      throw new Error("Please select application first.");
    }

    return creditApi.cmRecommendToCreditMaker(finalSelectedId, payload);
  },

  onSuccess: async (response) => {
    setMessage(
      response?.data?.message ||
        "CM screening decision saved successfully.",
    );

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["cm-screening-applications"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["cm-screening-application", finalSelectedId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["credit-assessment", finalSelectedId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["credit-manager-dashboard"],
      }),
    ]);
  },

  onError: (error) => {
    setMessage(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to save CM screening decision.",
    );
  },
});

const handleDecisionSubmit = (nextDecision) => {
  setMessage("");

  if (!finalSelectedId) {
    setMessage("Please select CM case first.");
    return;
  }

  const finalRecommendedAmount = Number(
    recommendedAmount || application?.requestedAmount || 0,
  );

  submitMutation.mutate({
    decision: nextDecision,

    recommendedAmount: finalRecommendedAmount,
    cmRecommendedAmount: finalRecommendedAmount,

    riskScore: 72,
    cmRiskScore: 72,
    preliminaryRiskScore: 72,

    remarks,
    cmRemarks: remarks,

    verifiedIncome: Number(verifiedIncome || 0),
    existingObligations: 115000,
    foir: Number(foir || 0),
    propertyValue: Number(propertyValue || 0),
    requestedLoan: Number(requestedAmount || 0),
    requestedAmount: Number(requestedAmount || 0),
    indicativeLtv: Number(ltv || 0),

    bureauScore: 719,
    currentDpd: 0,
    dpd30In12m: 0,
    writtenOffSettled: "None",
    recentEnquiries: 2,
    commercialBureau: "Satisfactory",
  });
};

  const requestedAmount = application?.requestedAmount || 0;
  const verifiedIncome =
    application?.monthlyIncome ||
    application?.customerProfile?.monthlyIncome ||
    325000;

  const propertyValue =
    application?.marketValue ||
    application?.propertyValue ||
    application?.customerProfile?.marketValue ||
    22500000;

  const foir = application?.foir || application?.customerProfile?.foir || 35.38;
  const ltv =
    Number(propertyValue) > 0
      ? ((Number(requestedAmount) / Number(propertyValue)) * 100).toFixed(2)
      : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 antialiased md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#4857e8] via-[#2575fc] to-[#35c4c8] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-cyan-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                ✦
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  CM Preliminary Credit Screening
                </h1>
                <p className="mt-2 text-sm font-medium text-white/90">
                  {application?.applicationNumber || "Select Case"} ·
                  Spoke-level eligibility and file-quality assessment.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={submitMutation.isPending}
           onClick={() => handleDecisionSubmit("HOLD_QUERY")}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
              >
                Hold / Query
              </button>

              <button
                type="button"
                disabled={submitMutation.isPending}
               onClick={() => handleDecisionSubmit("REJECT")}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
              >
                Reject
              </button>

              <button
  type="button"
  disabled={submitMutation.isPending}
  onClick={() => handleDecisionSubmit(decision)}
  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200"
>
  {submitMutation.isPending ? "Saving..." : "Save CM Decision"}
</button>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select CM Case</option>
                {cmCases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.applicationNumber} - {item.customerName}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <FaChevronDown size={12} />
              </span>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                type="text"
                value={
                  application
                    ? `${application.customerName || ""} ${application.mobile || ""} ${application.pan || ""}`
                    : ""
                }
                readOnly
                placeholder="Selected case details"
                className="h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 pl-11 text-sm font-medium text-slate-700 outline-none"
              />
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-6 overflow-x-auto">
            {workflowSteps.map((step, index) => {
              const completed = step.status === "completed";
              const current = step.status === "current";

              return (
                <div
                  key={step.id}
                  className="flex min-w-[135px] flex-1 flex-col items-center text-center"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${
                        completed
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : current
                            ? "bg-blue-600 text-white ring-8 ring-blue-100"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {completed ? <FaCheck /> : step.id}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className="hidden h-0.5 w-20 bg-blue-200 xl:block" />
                    )}
                  </div>

                  <p
                    className={`mt-3 text-xs font-black ${
                      current ? "text-blue-700" : "text-slate-700"
                    }`}
                  >
                    {step.label}
                  </p>

                  <p className="mt-1 text-[11px] font-medium capitalize text-slate-500">
                    {step.status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <InfoCard title="Eligibility calculations">
            <Row label="Verified Income" value={formatCurrency(verifiedIncome)} />
            <Row label="Existing Obligations" value={formatCurrency(115000)} />
            <Row label="FOIR" value={`${foir}%`} />
            <Row label="Property Value" value={formatCurrency(propertyValue)} />
            <Row label="Requested Loan" value={formatCurrency(requestedAmount)} />
            <Row label="Indicative LTV" value={`${ltv}%`} />
          </InfoCard>

          <InfoCard title="Bureau snapshot">
            <Row label="Bureau Score" value="719" />
            <Row label="Current DPD" value="0" />
            <Row label="30+ DPD in 12M" value="0" />
            <Row
              label="Written-off / Settled"
              value={
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  None
                </span>
              }
            />
            <Row label="Recent Enquiries" value="2" />
            <Row
              label="Commercial Bureau"
              value={
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  Satisfactory
                </span>
              }
            />
          </InfoCard>

          <InfoCard title="Screening outcome">
            <div className="mb-5 h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[68%] bg-emerald-500" />
            </div>

            <p className="mb-5 text-base font-medium text-slate-500">
              Preliminary risk score:{" "}
              <span className="font-black text-slate-700">72 / 100</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700">
                  Decision
                </label>
                <select
                  value={decision}
                  onChange={(event) => setDecision(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                >
<option value="RECOMMEND">Recommended</option>
<option value="HOLD_QUERY">Hold / Query</option>
<option value="REJECT">Reject</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">
                  Recommended Amount
                </label>
                <input
                  value={recommendedAmount}
                  onChange={(event) => setRecommendedAmount(event.target.value)}
                  placeholder={String(requestedAmount || 0)}
                  className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">
                  CM Remarks
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-blue-100 bg-white p-4 text-sm font-medium leading-relaxed text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
      <h3 className="text-base font-black text-slate-800">{title}</h3>
      <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
      <div className="mt-6 space-y-0">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
  );
}