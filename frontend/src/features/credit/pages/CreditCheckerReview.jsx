import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBalanceScale,
  FaBuilding,
  FaCheckCircle,
  FaChevronDown,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileSignature,
  FaHome,
  FaPaperPlane,
  FaSearch,
  FaShieldAlt,
  FaTimesCircle,
  FaUserCheck,
  FaUserTie,
} from "react-icons/fa";
import { useParams } from "react-router-dom";

import { creditApi } from "../creditApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
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

const formatPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toFixed(2)}%`;
};

const parseJson = (value) => {
  if (!value) return {};

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getNestedValue = (object, paths, fallback = "") => {
  for (const path of paths) {
    const value = path
      .split(".")
      .reduce((current, key) => current?.[key], object);

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return fallback;
};

const defaultReview = {
  checkerDecision: "APPROVE",
  checkerApprovedAmount: "",
  checkerApprovedTenure: "",
  checkerApprovedRoi: "",

  checkerRiskGrade: "A3",
  checkerPolicyDecision: "Acceptable",
  checkerCollateralView: "Proceed for technical valuation",
  checkerIncomeView: "Income assessment acceptable",
  checkerBureauView: "Bureau profile acceptable",
  checkerDeviationView: "Deviation acceptable within policy authority",

  checkerRemarks:
    "Credit Maker assessment reviewed. Case is acceptable for valuation initiation subject to policy, legal and collateral conditions.",
  checkerConditions:
    "Subject to satisfactory valuation, legal clearance, updated KYC, repayment track validation and final sanction terms.",
};

const buildReviewFromAssessment = (application, assessment) => {
  const makerPayload = parseJson(assessment?.makerPayload);
  const checkerPayload = parseJson(assessment?.checkerPayload);

  const makerAmount =
    assessment?.makerRecommendedAmount ||
    makerPayload?.makerRecommendedAmount ||
    makerPayload?.recommendedAmount ||
    "";

  const makerRoi =
    assessment?.makerRecommendedRoi ||
    makerPayload?.makerRecommendedRoi ||
    makerPayload?.recommendedRoi ||
    makerPayload?.roi ||
    "";

  const makerTenure =
    assessment?.makerRecommendedTenure ||
    makerPayload?.makerRecommendedTenure ||
    makerPayload?.recommendedTenure ||
    makerPayload?.tenure ||
    "";

  return {
    ...defaultReview,

    checkerDecision:
      assessment?.checkerDecision ||
      checkerPayload?.checkerDecision ||
      "APPROVE",

    checkerApprovedAmount: valueOrEmpty(
      assessment?.checkerApprovedAmount ||
        checkerPayload?.checkerApprovedAmount ||
        checkerPayload?.approvedAmount ||
        makerAmount ||
        application?.requestedAmount ||
        application?.loanAmount,
    ),

    checkerApprovedTenure: valueOrEmpty(
      assessment?.checkerApprovedTenure ||
        checkerPayload?.checkerApprovedTenure ||
        checkerPayload?.approvedTenure ||
        makerTenure ||
        application?.tenure ||
        application?.requestedTenure,
    ),

    checkerApprovedRoi: valueOrEmpty(
      assessment?.checkerApprovedRoi ||
        checkerPayload?.checkerApprovedRoi ||
        checkerPayload?.approvedRoi ||
        makerRoi ||
        application?.roi ||
        application?.interestRate,
    ),

    checkerRiskGrade:
      checkerPayload?.checkerRiskGrade ||
      assessment?.makerRiskGrade ||
      makerPayload?.makerRiskGrade ||
      defaultReview.checkerRiskGrade,

    checkerPolicyDecision:
      checkerPayload?.checkerPolicyDecision ||
      defaultReview.checkerPolicyDecision,

    checkerCollateralView:
      checkerPayload?.checkerCollateralView ||
      defaultReview.checkerCollateralView,

    checkerIncomeView:
      checkerPayload?.checkerIncomeView ||
      defaultReview.checkerIncomeView,

    checkerBureauView:
      checkerPayload?.checkerBureauView ||
      defaultReview.checkerBureauView,

    checkerDeviationView:
      checkerPayload?.checkerDeviationView ||
      defaultReview.checkerDeviationView,

    checkerRemarks:
      assessment?.checkerRemarks ||
      checkerPayload?.checkerRemarks ||
      checkerPayload?.remarks ||
      defaultReview.checkerRemarks,

    checkerConditions:
      checkerPayload?.checkerConditions ||
      checkerPayload?.conditions ||
      defaultReview.checkerConditions,
  };
};

export default function CreditCheckerReview() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [hydratedApplicationId, setHydratedApplicationId] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState(defaultReview);

  const queryClient = useQueryClient();

  const checkerCasesQuery = useQuery({
    queryKey: ["credit-checker-cases"],
    queryFn: () => creditApi.checkerCases(),
    retry: false,
  });

  const checkerCases = useMemo(() => {
    const payload = unwrapPayload(checkerCasesQuery.data);
    return normalizeRows(payload);
  }, [checkerCasesQuery.data]);

  const finalSelectedId =
    selectedId || routeApplicationId || checkerCases?.[0]?.id || "";

  const creditApplicationQuery = useQuery({
    queryKey: ["credit-checker-application", finalSelectedId],
    queryFn: () => creditApi.getCreditApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const assessmentQuery = useQuery({
    queryKey: ["credit-assessment", finalSelectedId],
    queryFn: () => creditApi.getCreditAssessment(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const creditApplicationPayload = unwrapPayload(creditApplicationQuery.data);
  const assessmentPayload = unwrapPayload(assessmentQuery.data);

  const application =
    creditApplicationPayload?.application ||
    creditApplicationPayload ||
    {};

  const creditAssessment =
    creditApplicationPayload?.creditAssessment ||
    assessmentPayload?.creditAssessment ||
    assessmentPayload ||
    null;

  const cmPayload = parseJson(creditAssessment?.cmPayload);
  const makerPayload = parseJson(creditAssessment?.makerPayload);

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;

    if (String(hydratedApplicationId) === String(finalSelectedId)) {
      return;
    }

    setReview(buildReviewFromAssessment(application, creditAssessment));
    setHydratedApplicationId(String(finalSelectedId));
    setMessage("");
  }, [
    finalSelectedId,
    hydratedApplicationId,
    application?.id,
    creditAssessment?.id,
  ]);

  const updateReview = (field, value) => {
    setMessage("");
    setReview((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectedCaseText = application?.id
    ? `${application?.customerName || ""} | ${application?.mobile || ""} | ${
        application?.pan || ""
      }`
    : "";

  const buildPayload = (actionType) => {
    const decision =
      actionType === "APPROVE"
        ? "APPROVE"
        : actionType === "RETURN"
          ? "RETURN_TO_MAKER"
          : "REJECT";

    return {
      actionType,
      decision,
      checkerDecision: decision,

      approvedAmount: numberValue(review.checkerApprovedAmount),
      checkerApprovedAmount: numberValue(review.checkerApprovedAmount),

      approvedRoi: numberValue(review.checkerApprovedRoi),
      checkerApprovedRoi: numberValue(review.checkerApprovedRoi),
      roi: numberValue(review.checkerApprovedRoi),

      approvedTenure: numberValue(review.checkerApprovedTenure),
      checkerApprovedTenure: numberValue(review.checkerApprovedTenure),
      tenure: numberValue(review.checkerApprovedTenure),

      checkerRiskGrade: review.checkerRiskGrade,
      checkerPolicyDecision: review.checkerPolicyDecision,
      checkerCollateralView: review.checkerCollateralView,
      checkerIncomeView: review.checkerIncomeView,
      checkerBureauView: review.checkerBureauView,
      checkerDeviationView: review.checkerDeviationView,

      checkerRemarks: review.checkerRemarks,
      remarks: review.checkerRemarks,

      checkerConditions: review.checkerConditions,
      conditions: review.checkerConditions,

      checkerSnapshot: {
        customer: {
          customerName: application?.customerName,
          mobile: application?.mobile,
          email: application?.email,
          pan: application?.pan,
          occupationType: application?.occupationType,
          businessName: application?.businessName,
        },
        application: {
          applicationNumber: application?.applicationNumber,
          requestedAmount: application?.requestedAmount,
          stage: application?.stage,
          status: application?.status,
        },
        property: {
          propertyCategory: application?.propertyCategory,
          propertyType: application?.propertyType,
          marketValue: application?.marketValue || application?.propertyValue,
          propertyAddress: application?.propertyAddress,
          propertyCity: application?.propertyCity,
          propertyState: application?.propertyState,
          propertyPincode: application?.propertyPincode,
        },
        cmAssessment: {
          cmDecision: creditAssessment?.cmDecision,
          cmRecommendedAmount: creditAssessment?.cmRecommendedAmount,
          cmRiskScore: creditAssessment?.cmRiskScore,
          cmRemarks: creditAssessment?.cmRemarks,
        },
        makerAssessment: {
          makerDecision: creditAssessment?.makerDecision,
          makerRecommendedAmount: creditAssessment?.makerRecommendedAmount,
          makerRecommendedRoi: creditAssessment?.makerRecommendedRoi,
          makerRecommendedTenure: creditAssessment?.makerRecommendedTenure,
          makerRiskGrade: creditAssessment?.makerRiskGrade,
          makerRemarks: creditAssessment?.makerRemarks,
        },
      },
    };
  };

  const validateBeforeAction = (actionType) => {
    if (!finalSelectedId) {
      setMessage("Please select Credit Checker case first.");
      return false;
    }

    if (actionType === "APPROVE") {
      const errors = [];

      if (!review.checkerApprovedAmount) errors.push("Approved Amount");
      if (!review.checkerApprovedTenure) errors.push("Approved Tenure");
      if (!review.checkerApprovedRoi) errors.push("Approved ROI");
      if (!review.checkerRemarks) errors.push("Checker Remarks");

      if (errors.length) {
        setMessage(`Please fill required fields: ${errors.join(", ")}.`);
        return false;
      }
    }

    if (
      (actionType === "RETURN" || actionType === "REJECT") &&
      !String(review.checkerRemarks || "").trim()
    ) {
      setMessage("Checker remarks are required.");
      return false;
    }

    return true;
  };

  const approveMutation = useMutation({
    mutationFn: () =>
      creditApi.creditCheckerApprove(
        finalSelectedId,
        buildPayload("APPROVE"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application approved and sent to Valuation successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["credit-checker-cases"] }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
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
          "Unable to approve and send case to Valuation.",
      );
    },
  });

  const returnMutation = useMutation({
    mutationFn: () =>
      creditApi.creditCheckerReturnToMaker(
        finalSelectedId,
        buildPayload("RETURN"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application returned to Credit Maker successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["credit-checker-cases"] }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to return case to Credit Maker.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      creditApi.creditCheckerReject(
        finalSelectedId,
        buildPayload("REJECT"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application rejected by Credit Checker.",
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["credit-checker-cases"] }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to reject case.",
      );
    },
  });

  const handleApprove = () => {
    if (!validateBeforeAction("APPROVE")) return;
    approveMutation.mutate();
  };

  const handleReturn = () => {
    if (!validateBeforeAction("RETURN")) return;
    returnMutation.mutate();
  };

  const handleReject = () => {
    if (!validateBeforeAction("REJECT")) return;
    rejectMutation.mutate();
  };

  const submitting =
    approveMutation.isPending ||
    returnMutation.isPending ||
    rejectMutation.isPending;

  const requestedAmount =
    application?.requestedAmount ||
    application?.loanAmount ||
    creditAssessment?.requestedLoan;

  const propertyValue =
    application?.marketValue ||
    application?.propertyValue ||
    creditAssessment?.propertyValue;

  const makerRecommendedAmount =
    creditAssessment?.makerRecommendedAmount ||
    makerPayload?.makerRecommendedAmount ||
    makerPayload?.recommendedAmount;

  const makerRecommendedRoi =
    creditAssessment?.makerRecommendedRoi ||
    makerPayload?.makerRecommendedRoi ||
    makerPayload?.recommendedRoi;

  const makerRecommendedTenure =
    creditAssessment?.makerRecommendedTenure ||
    makerPayload?.makerRecommendedTenure ||
    makerPayload?.recommendedTenure;

  const scoreCards = [
    {
      label: "Requested Loan",
      value: formatCurrency(requestedAmount),
      icon: FaClipboardCheck,
    },
    {
      label: "Maker Amount",
      value: formatCurrency(makerRecommendedAmount),
      icon: FaUserTie,
    },
    {
      label: "Checker Amount",
      value: formatCurrency(review.checkerApprovedAmount),
      icon: FaCheckCircle,
    },
    {
      label: "Next Stage",
      value: "Valuation",
      icon: FaHome,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#111827] via-[#1d4ed8] to-[#6d28d9] p-7 text-white">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-purple-300/20" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl shadow-inner backdrop-blur-md">
                  <FaUserCheck />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    Credit Checker Review
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-white/90">
                    {application?.applicationNumber || "Select Credit Case"} ·
                    Review complete maker proposal and approve case for Valuation.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge value={`Stage: ${application?.stage || "—"}`} />
                    <Badge value={`Status: ${application?.status || "—"}`} />
                    <Badge
                      value={`Assessment: ${
                        creditAssessment?.assessmentStatus || "Pending"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton
                  variant="white"
                  disabled={submitting}
                  icon={FaArrowLeft}
                  onClick={handleReturn}
                >
                  Return to Maker
                </ActionButton>

                <ActionButton
                  variant="danger"
                  disabled={submitting}
                  icon={FaTimesCircle}
                  onClick={handleReject}
                >
                  Reject
                </ActionButton>

                <ActionButton
                  variant="white"
                  disabled={submitting}
                  icon={FaPaperPlane}
                  onClick={handleApprove}
                >
                  {approveMutation.isPending
                    ? "Approving..."
                    : "Approve & Send to Valuation"}
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[420px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                disabled={checkerCasesQuery.isLoading || checkerCases.length === 0}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setHydratedApplicationId("");
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-extrabold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {checkerCasesQuery.isLoading ? (
                  <option value="">Loading Credit Checker cases...</option>
                ) : checkerCases.length === 0 ? (
                  <option value="">No Credit Checker cases available</option>
                ) : (
                  <>
                    <option value="">Select Credit Checker Case</option>
                    {checkerCases.map((item) => (
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
                placeholder="Selected case details"
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

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_430px]">
          <div className="space-y-6">
            <Panel
              title="Customer & Application Details"
              subtitle="Complete customer information for checker review."
              icon={FaUserTie}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <DisplayBox label="Customer Name" value={application?.customerName} />
                <DisplayBox label="Mobile" value={application?.mobile} />
                <DisplayBox label="Email" value={application?.email} />
                <DisplayBox label="PAN" value={application?.pan} />
                <DisplayBox label="Occupation" value={application?.occupationType} />
                <DisplayBox label="Business Name" value={application?.businessName} />
                <DisplayBox label="Application Number" value={application?.applicationNumber} />
                <DisplayBox label="Requested Amount" value={formatCurrency(requestedAmount)} />
                <DisplayBox label="Current Status" value={application?.status} />
              </div>
            </Panel>

            <Panel
              title="Property & Collateral"
              subtitle="Collateral details and valuation dependency."
              icon={FaHome}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <DisplayBox label="Property Category" value={application?.propertyCategory} />
                <DisplayBox label="Property Type" value={application?.propertyType} />
                <DisplayBox label="Property Value" value={formatCurrency(propertyValue)} />
                <DisplayBox label="City" value={application?.propertyCity || application?.city} />
                <DisplayBox label="State" value={application?.propertyState || application?.state} />
                <DisplayBox label="Pincode" value={application?.propertyPincode || application?.pinCode} />
              </div>

              <ReadOnlyText
                label="Property Address"
                value={application?.propertyAddress}
              />
            </Panel>

            <Panel
              title="CM Screening Summary"
              subtitle="Preliminary credit screening details saved by CM."
              icon={FaBalanceScale}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <DisplayBox label="CM Decision" value={creditAssessment?.cmDecision} />
                <DisplayBox label="CM Risk Score" value={creditAssessment?.cmRiskScore} />
                <DisplayBox label="CM Recommended Amount" value={formatCurrency(creditAssessment?.cmRecommendedAmount)} />
                <DisplayBox label="Bureau Score" value={creditAssessment?.bureauScore} />

                <DisplayBox label="Verified Income" value={formatCurrency(creditAssessment?.verifiedIncome)} />
                <DisplayBox label="Existing Obligations" value={formatCurrency(creditAssessment?.existingObligations)} />
                <DisplayBox label="FOIR" value={formatPercent(creditAssessment?.foir)} />
                <DisplayBox label="Indicative LTV" value={formatPercent(creditAssessment?.indicativeLtv)} />

                <DisplayBox label="Current DPD" value={creditAssessment?.currentDpd} />
                <DisplayBox label="30+ DPD in 12M" value={creditAssessment?.dpd30In12m} />
                <DisplayBox label="Written-off / Settled" value={creditAssessment?.writtenOffSettled} />
                <DisplayBox label="Commercial Bureau" value={creditAssessment?.commercialBureau} />
              </div>

              <ReadOnlyText
                label="CM Remarks"
                value={creditAssessment?.cmRemarks || cmPayload?.cmRemarks || cmPayload?.remarks}
              />
            </Panel>

            <Panel
              title="Credit Maker Proposal"
              subtitle="Maker recommendation to be checked before approval."
              icon={FaFileSignature}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <DisplayBox label="Maker Decision" value={creditAssessment?.makerDecision || makerPayload?.makerDecision} />
                <DisplayBox label="Maker Amount" value={formatCurrency(makerRecommendedAmount)} />
                <DisplayBox label="Maker ROI" value={formatPercent(makerRecommendedRoi)} />
                <DisplayBox label="Maker Tenure" value={makerRecommendedTenure ? `${makerRecommendedTenure} months` : "—"} />

                <DisplayBox label="Maker Risk Grade" value={creditAssessment?.makerRiskGrade || makerPayload?.makerRiskGrade} />
                <DisplayBox label="Income Method" value={makerPayload?.incomeMethod} />
                <DisplayBox label="Policy Result" value={makerPayload?.policyResult} />
                <DisplayBox label="Fraud Risk" value={makerPayload?.fraudRisk} />
              </div>

              <ReadOnlyText
                label="Borrower Assessment"
                value={makerPayload?.borrowerAssessment}
              />

              <ReadOnlyText
                label="Banking Assessment"
                value={makerPayload?.bankingAssessment}
              />

              <ReadOnlyText
                label="Property Assessment"
                value={makerPayload?.propertyAssessment}
              />

              <ReadOnlyText
                label="Risk / Mitigants"
                value={makerPayload?.riskMitigants}
              />

              <ReadOnlyText
                label="Maker Remarks"
                value={creditAssessment?.makerRemarks || makerPayload?.makerRemarks || makerPayload?.remarks}
              />
            </Panel>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 space-y-6">
              <Panel
                title="Checker Decision"
                subtitle="Final independent credit review before valuation."
                icon={FaClipboardCheck}
              >
                <div className="space-y-4">
                  <SelectField
                    label="Checker Decision"
                    value={review.checkerDecision}
                    options={[
                      { label: "Approve and Send to Valuation", value: "APPROVE" },
                      { label: "Return to Credit Maker", value: "RETURN_TO_MAKER" },
                      { label: "Reject", value: "REJECT" },
                    ]}
                    onChange={(value) => updateReview("checkerDecision", value)}
                  />

                  <Field
                    label="Approved Amount *"
                    type="number"
                    value={review.checkerApprovedAmount}
                    onChange={(value) => updateReview("checkerApprovedAmount", value)}
                  />

                  <Field
                    label="Approved Tenure Months *"
                    type="number"
                    value={review.checkerApprovedTenure}
                    onChange={(value) => updateReview("checkerApprovedTenure", value)}
                  />

                  <Field
                    label="Approved ROI % *"
                    type="number"
                    value={review.checkerApprovedRoi}
                    onChange={(value) => updateReview("checkerApprovedRoi", value)}
                  />

                  <SelectField
                    label="Checker Risk Grade"
                    value={review.checkerRiskGrade}
                    options={[
                      { label: "A1", value: "A1" },
                      { label: "A2", value: "A2" },
                      { label: "A3", value: "A3" },
                      { label: "B1", value: "B1" },
                      { label: "B2", value: "B2" },
                      { label: "C1", value: "C1" },
                      { label: "High Risk", value: "High Risk" },
                    ]}
                    onChange={(value) => updateReview("checkerRiskGrade", value)}
                  />

                  <SelectField
                    label="Policy Decision"
                    value={review.checkerPolicyDecision}
                    options={[
                      { label: "Acceptable", value: "Acceptable" },
                      { label: "Acceptable with Conditions", value: "Acceptable with Conditions" },
                      { label: "Return for Clarification", value: "Return for Clarification" },
                      { label: "Not Acceptable", value: "Not Acceptable" },
                    ]}
                    onChange={(value) => updateReview("checkerPolicyDecision", value)}
                  />
                </div>
              </Panel>

              <Panel
                title="Checker Review Notes"
                subtitle="Record independent checker observations."
                icon={FaShieldAlt}
              >
                <TextArea
                  label="Income View"
                  rows={3}
                  value={review.checkerIncomeView}
                  onChange={(value) => updateReview("checkerIncomeView", value)}
                />

                <TextArea
                  label="Bureau View"
                  rows={3}
                  value={review.checkerBureauView}
                  onChange={(value) => updateReview("checkerBureauView", value)}
                />

                <TextArea
                  label="Collateral View"
                  rows={3}
                  value={review.checkerCollateralView}
                  onChange={(value) => updateReview("checkerCollateralView", value)}
                />

                <TextArea
                  label="Deviation View"
                  rows={3}
                  value={review.checkerDeviationView}
                  onChange={(value) => updateReview("checkerDeviationView", value)}
                />

                <TextArea
                  label="Final Checker Remarks *"
                  rows={5}
                  value={review.checkerRemarks}
                  onChange={(value) => updateReview("checkerRemarks", value)}
                />

                <TextArea
                  label="Conditions"
                  rows={4}
                  value={review.checkerConditions}
                  onChange={(value) => updateReview("checkerConditions", value)}
                />
              </Panel>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
                <div className="mb-2 flex items-center gap-2 text-sm font-black">
                  <FaExclamationTriangle />
                  Checker Control
                </div>
                Credit Checker can approve and send case to Valuation, return case to Credit Maker, or reject the application.
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReturn}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                >
                  Return to Credit Maker
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReject}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-rose-700 shadow-sm transition-all hover:bg-rose-100 disabled:opacity-50"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApprove}
                  className="rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#183d62] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {approveMutation.isPending
                    ? "Approving..."
                    : "Approve & Send to Valuation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ value }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
      {value}
    </span>
  );
}

function ActionButton({ children, icon: Icon, variant, disabled, onClick }) {
  const classes =
    variant === "danger"
      ? "bg-white text-rose-600 hover:bg-rose-50"
      : "bg-white text-indigo-700 hover:bg-indigo-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon />
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-[#0f2942]">
            {title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
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

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="relative mt-2">
        <select
          value={valueOrEmpty(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {options.map((option) => {
            if (typeof option === "string") {
              return (
                <option key={option} value={option}>
                  {option}
                </option>
              );
            }

            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
          <FaChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <div className="mt-4">
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <textarea
        rows={rows}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}