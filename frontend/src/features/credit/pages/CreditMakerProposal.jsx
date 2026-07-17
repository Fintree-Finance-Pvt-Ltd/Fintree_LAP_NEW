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

const valueOrEmpty = (value) => {
  return value === null || value === undefined ? "" : String(value);
};

// const makerSteps = [
//   { id: 1, label: "Credit Maker", status: "current" },
//   { id: 2, label: "Credit Checker", status: "pending" },
//   { id: 3, label: "Ops Maker", status: "pending" },
//   { id: 4, label: "Ops Checker", status: "pending" },
// ];

const systemRows = [
  { label: "FOIR", value: "22.70%" },
  { label: "LTV", value: "61.90%" },
  { label: "DSCR", value: "1.62" },
  { label: "Internal Grade", value: "A3" },
  {
    label: "Fraud Risk",
    value: (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        Low
      </span>
    ),
  },
  {
    label: "Deviations",
    value: (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
        1 Minor
      </span>
    ),
  },
];

export default function CreditMakerProposal() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [message, setMessage] = useState("");

  const [memo, setMemo] = useState({
    assessedMonthlyIncome: "",
    existingEmiObligations: "",
    bureauScore: "",
    dpdProfile: "Clean",
    vintage: "",

    requestedAmount: "",
    assessedPropertyValue: "",
    recommendedAmount: "",
    recommendedTenure: "",
    recommendedRoi: "",

    incomeMethod: "Banking + ITR",
    makerRecommendation: "Approve Subject to Legal & Valuation",
    policyResult: "Conditional Pass",

    borrowerAssessment:
      "Profile, vintage and repayment capacity assessed as acceptable.",
    bankingAssessment:
      "Bank credits and average balance support assessed income.",
    riskMitigants:
      "Property security, co-applicant and pre-disbursement conditions mitigate identified risks.",
    deviationJustification:
      "Minor deviation recommended within delegated policy.",
  });

  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ["credit-maker-cases"],
    queryFn: () => creditApi.applications({ page: 1, limit: 100 }),
  });

  const creditMakerCases = useMemo(() => {
    const rows = applicationsQuery.data?.data ?? [];

    return rows.filter((item) => {
      const stage = String(item.stage || "").toUpperCase();
      const status = String(item.status || "").toUpperCase();

      return (
        stage === "CREDIT" &&
        [
          "CREDIT_MAKER_PENDING",
          "CREDIT_MAKER_QUERY",
        ].includes(status)
      );
    });
  }, [applicationsQuery.data]);

  const applicationQuery = useQuery({
    queryKey: ["credit-maker-application", selectedId],
    queryFn: () => creditApi.getApplication(selectedId),
    enabled: Boolean(selectedId),
  });

  const application = unwrapPayload(applicationQuery.data);

  const selectedCaseText = application
    ? `${application.customerName || ""} | ${application.mobile || ""} | ${
        application.pan || ""
      }`
    : "";

  const fillFromApplication = () => {
    if (!application) return;

    setMemo((previous) => ({
      ...previous,
      assessedMonthlyIncome:
        previous.assessedMonthlyIncome ||
        valueOrEmpty(
          application?.monthlyIncome ||
            application?.verifiedMonthlyIncome ||
            application?.customerProfile?.monthlyIncome,
        ),
      existingEmiObligations:
        previous.existingEmiObligations ||
        valueOrEmpty(
          application?.existingMonthlyObligations ||
            application?.monthlyObligations,
        ),
      bureauScore:
        previous.bureauScore ||
        valueOrEmpty(application?.bureauScore || application?.cibilScore),
      vintage:
        previous.vintage ||
        valueOrEmpty(
          application?.businessVintage ||
            application?.employmentVintage ||
            application?.vintage,
        ),
      requestedAmount:
        previous.requestedAmount ||
        valueOrEmpty(application?.requestedAmount || application?.loanAmount),
      assessedPropertyValue:
        previous.assessedPropertyValue ||
        valueOrEmpty(application?.propertyValue || application?.marketValue),
      recommendedAmount:
        previous.recommendedAmount ||
        valueOrEmpty(application?.requestedAmount || application?.loanAmount),
      recommendedTenure:
        previous.recommendedTenure ||
        valueOrEmpty(application?.tenure || application?.requestedTenure),
    }));
  };

  const updateMemo = (field, value) => {
    setMessage("");
    setMemo((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerSaveDraft(selectedId, {
        ...memo,
        remarks: memo.makerRecommendation,
      }),
    onSuccess: (response) => {
      setMessage(
        response?.data?.message ||
          "Credit Maker draft saved successfully.",
      );
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save draft.",
      );
    },
  });

  const raiseQueryMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerRaiseQuery(selectedId, {
        ...memo,
        remarks: memo.deviationJustification,
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Credit Maker query raised successfully.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["credit-maker-cases"],
      });
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to raise query.",
      );
    },
  });

  const submitToCheckerMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerSubmitToChecker(selectedId, {
        ...memo,
        remarks: memo.makerRecommendation,
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application submitted to Credit Checker successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application", selectedId],
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
          "Unable to submit to Credit Checker.",
      );
    },
  });

  const validateSelection = () => {
    if (!selectedId) {
      setMessage("Please select application first.");
      return false;
    }

    return true;
  };

  const handleSaveDraft = () => {
    if (!validateSelection()) return;
    saveDraftMutation.mutate();
  };

  const handleRaiseQuery = () => {
    if (!validateSelection()) return;
    raiseQueryMutation.mutate();
  };

  const handleSubmitToChecker = () => {
    if (!validateSelection()) return;
    submitToCheckerMutation.mutate();
  };

  const submitting =
    saveDraftMutation.isPending ||
    raiseQueryMutation.isPending ||
    submitToCheckerMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 antialiased md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#2463d4] via-[#3b55d9] to-[#7b61e8] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-cyan-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                ◆
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Credit Maker – Underwriting Proposal
                </h1>
                <p className="mt-2 text-sm font-medium text-white/90">
                  {application?.applicationNumber || "Select Application"} ·
                  Prepare complete credit memo; maker cannot approve the case.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveDraft}
                className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-white/20 disabled:opacity-50"
              >
                Save Draft
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleRaiseQuery}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
              >
                Raise Query
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitToChecker}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
              >
                {submitToCheckerMutation.isPending
                  ? "Submitting..."
                  : "Submit to Credit Checker"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[420px_1fr_180px]">
            <div className="relative">
              <select
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select Credit Maker Case</option>

                {creditMakerCases.map((item) => (
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
                readOnly
                value={selectedCaseText}
                placeholder="Selected case details"
                className="h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 pl-11 text-sm font-medium text-slate-700 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={!application}
              onClick={fillFromApplication}
              className="h-12 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Auto Fill
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}
        </div>

        {/* <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          {makerSteps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${
                    step.status === "current"
                      ? "bg-indigo-600 text-amber-300"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.id}
                </div>

                <div>
                  <p className="text-sm font-black text-slate-800">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                    {step.status === "current" ? "Draft" : "Pending"}
                  </p>
                </div>

                {index < makerSteps.length - 1 && (
                  <span className="ml-auto text-blue-600">→</span>
                )}
              </div>
            </div>
          ))}
        </div> */}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          <b>Segregation:</b> The maker performs analysis and recommendation.
          Only an independent checker with sufficient authority may approve,
          return or reject.
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <InfoCard title="Applicant & bureau">
            <Field
              label="Assessed Monthly Income"
              value={memo.assessedMonthlyIncome}
              onChange={(value) =>
                updateMemo("assessedMonthlyIncome", value)
              }
            />

            <Field
              label="Existing EMI Obligations"
              value={memo.existingEmiObligations}
              onChange={(value) =>
                updateMemo("existingEmiObligations", value)
              }
            />

            <Field
              label="Bureau Score"
              value={memo.bureauScore}
              onChange={(value) => updateMemo("bureauScore", value)}
            />

            <SelectField
              label="DPD / Negative Profile"
              value={memo.dpdProfile}
              options={["Clean", "Minor Delay", "High Risk"]}
              onChange={(value) => updateMemo("dpdProfile", value)}
            />

            <Field
              label="Business / Employment Vintage"
              value={memo.vintage}
              onChange={(value) => updateMemo("vintage", value)}
            />
          </InfoCard>

          <InfoCard title="Eligibility & collateral">
            <Field
              label="Requested Amount"
              value={memo.requestedAmount}
              onChange={(value) => updateMemo("requestedAmount", value)}
            />

            <Field
              label="Assessed Property Value"
              value={memo.assessedPropertyValue}
              onChange={(value) =>
                updateMemo("assessedPropertyValue", value)
              }
            />

            <Field
              label="Recommended Amount"
              value={memo.recommendedAmount}
              onChange={(value) =>
                updateMemo("recommendedAmount", value)
              }
            />

            <Field
              label="Recommended Tenure Months"
              value={memo.recommendedTenure}
              onChange={(value) =>
                updateMemo("recommendedTenure", value)
              }
            />

            <Field
              label="Recommended ROI %"
              value={memo.recommendedRoi}
              onChange={(value) =>
                updateMemo("recommendedRoi", value)
              }
            />
          </InfoCard>

          <InfoCard title="System calculations">
            <div className="space-y-0">
              {systemRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-slate-100 py-4"
                >
                  <span className="text-sm font-medium text-slate-500">
                    {row.label}
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
          <h3 className="text-xl font-black text-slate-800">
            Maker credit memo
          </h3>
          <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <SelectField
              label="Income Assessment Method"
              value={memo.incomeMethod}
              options={[
                "Banking + ITR",
                "Banking",
                "ITR",
                "GST",
                "Manual Assessment",
              ]}
              onChange={(value) => updateMemo("incomeMethod", value)}
            />

            <SelectField
              label="Maker Recommendation"
              value={memo.makerRecommendation}
              options={[
                "Approve Subject to Legal & Valuation",
                "Recommend with Conditions",
                "Raise Query",
                "Not Recommended",
              ]}
              onChange={(value) =>
                updateMemo("makerRecommendation", value)
              }
            />

            <SelectField
              label="Policy Result"
              value={memo.policyResult}
              options={[
                "Pass",
                "Conditional Pass",
                "Deviation",
                "Fail",
              ]}
              onChange={(value) => updateMemo("policyResult", value)}
            />
          </div>

          <TextArea
            label="Borrower & Business Assessment"
            value={memo.borrowerAssessment}
            onChange={(value) =>
              updateMemo("borrowerAssessment", value)
            }
          />

          <TextArea
            label="Banking / Cash Flow Assessment"
            value={memo.bankingAssessment}
            onChange={(value) =>
              updateMemo("bankingAssessment", value)
            }
          />

          <TextArea
            label="Risk, Mitigants & Conditions"
            value={memo.riskMitigants}
            onChange={(value) => updateMemo("riskMitigants", value)}
          />

          <TextArea
            label="Deviation Justification"
            value={memo.deviationJustification}
            onChange={(value) =>
              updateMemo("deviationJustification", value)
            }
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">
        {label}
      </label>

      <input
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">
        {label}
      </label>

      <div className="relative mt-2">
        <select
          value={valueOrEmpty(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
          <FaChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="mt-5">
      <label className="text-xs font-black text-slate-600">
        {label}
      </label>

      <textarea
        rows={4}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}