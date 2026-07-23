import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaChevronDown,
  FaClipboardCheck,
  FaHome,
  FaPaperPlane,
  FaQuestionCircle,
  FaSave,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";

import { valuationApi } from "../valuationApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const unwrapList = (response) => {
  const data = unwrapPayload(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const valueOrEmpty = (value) =>
  value === null || value === undefined ? "" : String(value);

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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

const calculateLtv = (loanAmount, propertyValue) => {
  const loan = numberValue(loanAmount);
  const property = numberValue(propertyValue);

  if (loan <= 0 || property <= 0) return "";

  return ((loan / property) * 100).toFixed(2);
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const workflowSteps = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "BM Review", status: "completed" },
  { id: 3, label: "CM", status: "completed" },
  { id: 4, label: "Credit", status: "completed" },
  { id: 5, label: "Valuation", status: "current" },
  { id: 6, label: "Legal", status: "pending" },
  { id: 7, label: "Sanction", status: "pending" },
];

const defaultForm = {
  valuer: "",
  visitDate: "",
  propertyArea: "",
  occupancy: "Self-occupied",
  constructionQuality: "Good",
  residualLife: "",

  marketability: "Good",
  propertyRiskGrade: "PR2",

  marketValue: "",
  distressValue: "",
  realisableValue: "",
  recommendedValue: "",
  requestedLoan: "",

  indicativeLtv: "",
  ltvOnRecommendedValue: "",

  valuationStatus: "Positive",
  technicalRemarks:
    "Property valuation supports the proposed facility subject to legal clearance and standard conditions.",
  queryRemarks: "",
  negativeRemarks: "",
  legalInstructions:
    "Legal team to verify title chain, encumbrance, ownership, property tax and enforceability before sanction.",

  comparables: [
    {
      comparable: "Comparable A",
      distance: "",
      area: "",
      rate: "",
      adjustedValue: "",
    },
    {
      comparable: "Comparable B",
      distance: "",
      area: "",
      rate: "",
      adjustedValue: "",
    },
    {
      comparable: "Comparable C",
      distance: "",
      area: "",
      rate: "",
      adjustedValue: "",
    },
  ],
};

const buildInitialForm = (application, assessment) => {
  const requestedLoan =
    assessment?.requestedLoan ||
    application?.requestedAmount ||
    application?.loanAmount ||
    "";

  const marketValue =
    assessment?.marketValue ||
    application?.marketValue ||
    application?.propertyValue ||
    "";

  const recommendedValue =
    assessment?.recommendedValue ||
    marketValue ||
    "";

  return {
    ...defaultForm,

    valuer: assessment?.valuer || defaultForm.valuer,
    visitDate: assessment?.visitDate
      ? String(assessment.visitDate).slice(0, 10)
      : defaultForm.visitDate,

    propertyArea:
      assessment?.propertyArea ||
      application?.propertyArea ||
      application?.areaSqft ||
      "",

    occupancy: assessment?.occupancy || defaultForm.occupancy,
    constructionQuality:
      assessment?.constructionQuality || defaultForm.constructionQuality,
    residualLife: assessment?.residualLife || "",
    marketability: assessment?.marketability || defaultForm.marketability,
    propertyRiskGrade:
      assessment?.propertyRiskGrade || defaultForm.propertyRiskGrade,

    marketValue: valueOrEmpty(marketValue),
    distressValue:
      valueOrEmpty(
        assessment?.distressValue ||
          (marketValue ? Math.round(Number(marketValue) * 0.82) : ""),
      ),
    realisableValue:
      valueOrEmpty(
        assessment?.realisableValue ||
          (marketValue ? Math.round(Number(marketValue) * 0.88) : ""),
      ),
    recommendedValue:
      valueOrEmpty(
        assessment?.recommendedValue ||
          (marketValue ? Math.round(Number(marketValue) * 0.95) : ""),
      ),
    requestedLoan: valueOrEmpty(requestedLoan),

    indicativeLtv:
      valueOrEmpty(
        assessment?.indicativeLtv ||
          calculateLtv(requestedLoan, marketValue),
      ),

    ltvOnRecommendedValue:
      valueOrEmpty(
        assessment?.ltvOnRecommendedValue ||
          calculateLtv(requestedLoan, recommendedValue),
      ),

    valuationStatus: assessment?.valuationStatus || "Positive",
    technicalRemarks:
      assessment?.technicalRemarks || defaultForm.technicalRemarks,
    queryRemarks: assessment?.queryRemarks || "",
    negativeRemarks: assessment?.negativeRemarks || "",
    legalInstructions:
      assessment?.legalInstructions || defaultForm.legalInstructions,

    comparables: parseJson(
      assessment?.comparablesJson,
      defaultForm.comparables,
    ),
  };
};

export default function ValuationPage() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [hydratedApplicationId, setHydratedApplicationId] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(defaultForm);

  const queryClient = useQueryClient();

  const casesQuery = useQuery({
    queryKey: ["valuation-cases"],
    queryFn: () => valuationApi.cases(),
    retry: false,
  });

  const valuationCases = useMemo(() => {
    return unwrapList(casesQuery.data);
  }, [casesQuery.data]);

  const finalSelectedId =
    selectedId || routeApplicationId || valuationCases?.[0]?.id || "";

  const applicationQuery = useQuery({
    queryKey: ["valuation-application", finalSelectedId],
    queryFn: () => valuationApi.getApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const applicationPayload = unwrapPayload(applicationQuery.data);

  const application =
    applicationPayload?.application ||
    applicationPayload ||
    {};

  const valuationAssessment =
    applicationPayload?.valuationAssessment || null;

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;

    if (String(hydratedApplicationId) === String(finalSelectedId)) {
      return;
    }

    setForm(buildInitialForm(application, valuationAssessment));
    setHydratedApplicationId(String(finalSelectedId));
    setMessage("");
  }, [
    finalSelectedId,
    hydratedApplicationId,
    application?.id,
    valuationAssessment?.id,
  ]);

  const updateForm = (field, value) => {
    setMessage("");

    setForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (
        field === "requestedLoan" ||
        field === "marketValue" ||
        field === "recommendedValue"
      ) {
        updated.indicativeLtv = calculateLtv(
          field === "requestedLoan" ? value : updated.requestedLoan,
          field === "marketValue" ? value : updated.marketValue,
        );

        updated.ltvOnRecommendedValue = calculateLtv(
          field === "requestedLoan" ? value : updated.requestedLoan,
          field === "recommendedValue" ? value : updated.recommendedValue,
        );
      }

      if (field === "marketValue") {
        const marketValue = Number(value || 0);

        if (marketValue > 0) {
          updated.distressValue = String(Math.round(marketValue * 0.82));
          updated.realisableValue = String(Math.round(marketValue * 0.88));
          updated.recommendedValue =
            updated.recommendedValue || String(Math.round(marketValue * 0.95));
        }
      }

      return updated;
    });
  };

  const updateComparable = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      comparables: previous.comparables.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    }));
  };

  const buildPayload = () => ({
    ...form,
    applicationId: Number(finalSelectedId),
    remarks: form.technicalRemarks,
    requestedAmount: Number(form.requestedLoan || 0),
    marketValue: Number(form.marketValue || 0),
    distressValue: Number(form.distressValue || 0),
    realisableValue: Number(form.realisableValue || 0),
    recommendedValue: Number(form.recommendedValue || 0),
    indicativeLtv: Number(form.indicativeLtv || 0),
    ltvOnRecommendedValue: Number(form.ltvOnRecommendedValue || 0),
    comparables: form.comparables,
  });

  const validateSelection = () => {
    if (!finalSelectedId) {
      setMessage("Please select valuation application first.");
      return false;
    }

    return true;
  };


  const validateBeforeApprove = () => {
    const errors = [];

    if (!form.valuer) errors.push("Valuer");
    if (!form.visitDate) errors.push("Visit Date");
    if (!form.marketValue) errors.push("Market Value");
    if (!form.recommendedValue) errors.push("Recommended Value");
    if (!form.technicalRemarks) errors.push("Technical Remarks");
    if (!form.legalInstructions) errors.push("Legal Instructions");

    if (errors.length) {
      setMessage(`Please fill required fields: ${errors.join(", ")}.`);
      return false;
    }

    return true;
  };

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      valuationApi.saveDraft(finalSelectedId, buildPayload()),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Valuation draft saved successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["valuation-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["valuation-cases"],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save valuation draft.",
      );
    },
  });

  const raiseQueryMutation = useMutation({
    mutationFn: () =>
      valuationApi.raiseQuery(finalSelectedId, {
        ...buildPayload(),
        remarks:
          form.queryRemarks ||
          form.technicalRemarks ||
          "Technical valuation query raised.",
      }),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Technical query raised successfully.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["valuation-cases"],
      });
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to raise technical query.",
      );
    },
  });

  const markNegativeMutation = useMutation({
    mutationFn: () =>
      valuationApi.markNegative(finalSelectedId, {
        ...buildPayload(),
        remarks:
          form.negativeRemarks ||
          form.technicalRemarks ||
          "Valuation marked negative.",
      }),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application marked negative by Valuation.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["valuation-cases"],
      });
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to mark negative.",
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      valuationApi.approveToLegal(finalSelectedId, {
        ...buildPayload(),
        remarks:
          form.technicalRemarks ||
          "Valuation accepted and sent to Legal.",
      }),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Valuation accepted and case sent to Legal successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["valuation-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["valuation-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["legal-cases"],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to approve valuation.",
      );
    },
  });

  const handleSaveDraft = () => {
    if (!validateSelection()) return;
    saveDraftMutation.mutate();
  };

  const handleRaiseQuery = () => {
    if (!validateSelection()) return;
    raiseQueryMutation.mutate();
  };

  const handleMarkNegative = () => {
    if (!validateSelection()) return;
    markNegativeMutation.mutate();
  };

  const handleApprove = () => {
    if (!validateSelection()) return;
    if (!validateBeforeApprove()) return;
    approveMutation.mutate();
  };

  const isSubmitting =
    saveDraftMutation.isPending ||
    raiseQueryMutation.isPending ||
    markNegativeMutation.isPending ||
    approveMutation.isPending;

  const selectedCaseText = application?.id
    ? `${application?.customerName || ""} | ${application?.mobile || ""} | ${
        application?.pan || ""
      }`
    : "";

  const scoreCards = [
    {
      label: "Requested Loan",
      value: formatCurrency(form.requestedLoan),
    },
    {
      label: "Market Value",
      value: formatCurrency(form.marketValue),
    },
    {
      label: "Recommended Value",
      value: formatCurrency(form.recommendedValue),
    },
    {
      label: "LTV",
      value: form.ltvOnRecommendedValue
        ? `${form.ltvOnRecommendedValue}%`
        : "—",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <b>Valuation initiation payment gate:</b> Technical / Valuation Fee ₹6,490
              <p className="mt-1 text-xs">
                Create and send an approved payment link before the valuation stage is completed.
              </p>
            </div>

            <Link
              to={
                finalSelectedId
                  ? `/payment-management/${finalSelectedId}`
                  : "/payment-management"
              }
              className="w-fit rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-2.5 text-xs font-black text-cyan-700 shadow-sm transition-all hover:bg-cyan-100"
            >
              Create payment link
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-teal-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#064e4a] via-[#0f766e] to-[#14b8a6] p-7 text-white">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-300/20" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl shadow-inner backdrop-blur-md">
                  <FaHome />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    Technical Valuation
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-white/90">
                    {application?.applicationNumber || "Select Application"} ·
                    Save valuation details and send required data to Legal.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{`Stage: ${application?.stage || "—"}`}</Badge>
                    <Badge>{`Status: ${application?.status || "—"}`}</Badge>
                    <Badge>{`Assessment: ${
                      valuationAssessment?.assessmentStatus || "New Draft"
                    }`}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleSaveDraft}
                  icon={FaSave}
                >
                  {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                </HeaderButton>

                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleRaiseQuery}
                  icon={FaQuestionCircle}
                >
                  Raise Query
                </HeaderButton>

                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleMarkNegative}
                  icon={FaTimesCircle}
                >
                  Mark Negative
                </HeaderButton>

                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  icon={FaPaperPlane}
                >
                  {approveMutation.isPending
                    ? "Sending..."
                    : "Accept & Send to Legal"}
                </HeaderButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[420px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                disabled={casesQuery.isLoading || valuationCases.length === 0}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setHydratedApplicationId("");
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-extrabold text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {casesQuery.isLoading ? (
                  <option value="">Loading valuation cases...</option>
                ) : valuationCases.length === 0 ? (
                  <option value="">No valuation cases available</option>
                ) : (
                  <>
                    <option value="">Select Valuation Case</option>
                    {valuationCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.applicationNumber} - {item.customerName}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
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
                placeholder="Selected valuation case details"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-bold text-slate-600 outline-none"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <WorkflowCard />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <InfoCard title="Customer & Property Details">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <DisplayBox label="Customer" value={application?.customerName} />
                <DisplayBox label="Mobile" value={application?.mobile} />
                <DisplayBox label="PAN" value={application?.pan} />
                <DisplayBox label="Requested Amount" value={formatCurrency(application?.requestedAmount)} />
                <DisplayBox label="Property Type" value={application?.propertyType} />
                <DisplayBox label="Property Value" value={formatCurrency(application?.marketValue || application?.propertyValue)} />
              </div>

              <ReadOnlyText label="Property Address" value={application?.propertyAddress} />
            </InfoCard>

            <InfoCard title="Assignment & Inspection">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Valuer *" value={form.valuer} onChange={(value) => updateForm("valuer", value)} />
                <Field label="Visit Date *" type="date" value={form.visitDate} onChange={(value) => updateForm("visitDate", value)} />
                <Field label="Property Area Sq.Ft." value={form.propertyArea} onChange={(value) => updateForm("propertyArea", value)} />

                <SelectField label="Occupancy" value={form.occupancy} options={["Self-occupied", "Tenant occupied", "Vacant"]} onChange={(value) => updateForm("occupancy", value)} />
                <SelectField label="Construction Quality" value={form.constructionQuality} options={["Excellent", "Good", "Average", "Poor"]} onChange={(value) => updateForm("constructionQuality", value)} />
                <Field label="Residual Life Years" value={form.residualLife} onChange={(value) => updateForm("residualLife", value)} />
              </div>
            </InfoCard>

            <InfoCard title="Comparable Properties">
              <div className="overflow-hidden rounded-2xl border border-teal-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-teal-50 text-xs font-black uppercase tracking-wide text-teal-700">
                    <tr>
                      <th className="px-4 py-3">Comparable</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Area</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Adjusted Value</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {form.comparables.map((row, index) => (
                      <tr key={index}>
                        {["comparable", "distance", "area", "rate", "adjustedValue"].map((field) => (
                          <td key={field} className="px-4 py-3">
                            <input
                              value={row[field] || ""}
                              onChange={(event) =>
                                updateComparable(index, field, event.target.value)
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-teal-500"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 space-y-6">
              <InfoCard title="Valuation Values">
                <Field label="Market Value *" type="number" value={form.marketValue} onChange={(value) => updateForm("marketValue", value)} />
                <Field label="Distress Value" type="number" value={form.distressValue} onChange={(value) => updateForm("distressValue", value)} />
                <Field label="Realisable Value" type="number" value={form.realisableValue} onChange={(value) => updateForm("realisableValue", value)} />
                <Field label="Recommended Value *" type="number" value={form.recommendedValue} onChange={(value) => updateForm("recommendedValue", value)} />
                <Field label="Requested Loan" type="number" value={form.requestedLoan} onChange={(value) => updateForm("requestedLoan", value)} />

                <DisplayRow label="Indicative LTV" value={form.indicativeLtv ? `${form.indicativeLtv}%` : "—"} />
                <DisplayRow label="LTV on Recommended" value={form.ltvOnRecommendedValue ? `${form.ltvOnRecommendedValue}%` : "—"} />

                <SelectField label="Valuation Status" value={form.valuationStatus} options={["Positive", "Query", "Negative"]} onChange={(value) => updateForm("valuationStatus", value)} />
                <SelectField label="Marketability" value={form.marketability} options={["Excellent", "Good", "Average", "Poor"]} onChange={(value) => updateForm("marketability", value)} />
                <SelectField label="Property Risk Grade" value={form.propertyRiskGrade} options={["PR1", "PR2", "PR3", "PR4", "High Risk"]} onChange={(value) => updateForm("propertyRiskGrade", value)} />
              </InfoCard>

              <InfoCard title="Remarks for Legal">
                <TextArea label="Technical Remarks *" value={form.technicalRemarks} onChange={(value) => updateForm("technicalRemarks", value)} />
                <TextArea label="Query Remarks" value={form.queryRemarks} onChange={(value) => updateForm("queryRemarks", value)} />
                <TextArea label="Negative Remarks" value={form.negativeRemarks} onChange={(value) => updateForm("negativeRemarks", value)} />
                <TextArea label="Legal Instructions *" value={form.legalInstructions} onChange={(value) => updateForm("legalInstructions", value)} />
              </InfoCard>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveDraft}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleRaiseQuery}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                >
                  Raise Technical Query
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleMarkNegative}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-rose-700 shadow-sm transition-all hover:bg-rose-100 disabled:opacity-50"
                >
                  Mark Negative
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#183d62] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {approveMutation.isPending
                    ? "Sending..."
                    : "Accept & Send to Legal"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-500">
          Final submit from this page saves valuation data in <b>valuation_assessments</b> and moves the application to <b>LEGAL_PENDING</b>.
        </div>
      </div>
    </div>
  );
}

function WorkflowCard() {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-6 overflow-x-auto">
        {workflowSteps.map((step, index) => {
          const completed = step.status === "completed";
          const current = step.status === "current";

          return (
            <div key={step.id} className="flex min-w-[120px] flex-1 flex-col items-center text-center">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                  completed
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-teal-600 text-white ring-8 ring-teal-100"
                      : "bg-slate-100 text-slate-400"
                }`}>
                  {completed ? <FaCheck /> : step.id}
                </div>

                {index < workflowSteps.length - 1 && (
                  <div className="hidden h-0.5 w-14 bg-teal-200 xl:block" />
                )}
              </div>

              <p className={`mt-3 text-xs font-black ${current ? "text-teal-700" : "text-slate-700"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeaderButton({ children, icon: Icon, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-teal-700 shadow-sm transition-all hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={13} />
      {children}
    </button>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" />
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">{label}</label>
      <input
        type={type}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">{label}</label>

      <div className="relative mt-2">
        <select
          value={valueOrEmpty(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
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

function DisplayBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {valueOrEmpty(value) || "—"}
      </p>
    </div>
  );
}

function DisplayRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-800">
        {valueOrEmpty(value) || "—"}
      </span>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">{label}</label>

      <textarea
        rows={4}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function ReadOnlyText({ label, value }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
        {valueOrEmpty(value) || "—"}
      </p>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
      {children}
    </span>
  );
}
