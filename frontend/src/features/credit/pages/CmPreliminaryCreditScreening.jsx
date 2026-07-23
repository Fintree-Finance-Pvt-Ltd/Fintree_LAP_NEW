import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCheck,
  FaChevronDown,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaHome,
  FaIdCard,
  FaMoneyBillWave,
  FaSave,
  FaSearch,
  FaTimes,
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
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.applications)) return payload.applications;
  return [];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

const formatText = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }

  return String(value);
};

const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const joinAddress = (...parts) =>
  parts
    .filter((part) => part !== null && part !== undefined && String(part).trim() !== "")
    .map((part) => String(part).trim())
    .join(", ");

const getApplicationObject = (payload) => {
  if (!payload) return null;
  if (payload.application) return payload.application;
  return payload;
};

const getAssessmentObject = (payload) => {
  if (!payload) return null;
  if (payload.creditAssessment) return payload.creditAssessment;
  if (payload.assessment) return payload.assessment;
  return payload;
};

const getCustomerName = (application) =>
  firstValue(
    application?.customerName,
    application?.customer_name,
    application?.applicantName,
    application?.borrowerName,
    application?.customerProfile?.customerName,
    application?.customerProfile?.name,
    application?.borrower?.customerName,
    application?.borrower?.name,
    application?.applicant?.name,
    application?.primaryApplicant?.name,
  );

const getMobile = (application) =>
  firstValue(
    application?.mobile,
    application?.mobileNumber,
    application?.customerMobile,
    application?.customerProfile?.mobile,
    application?.customerProfile?.mobileNumber,
    application?.borrower?.mobile,
    application?.applicant?.mobile,
    application?.primaryApplicant?.mobile,
  );

const getPan = (application) =>
  firstValue(
    application?.pan,
    application?.panNumber,
    application?.customerPan,
    application?.customerProfile?.pan,
    application?.customerProfile?.panNumber,
    application?.borrower?.pan,
    application?.borrower?.panNumber,
    application?.applicant?.pan,
    application?.primaryApplicant?.pan,
  );

const getCurrentAddress = (application) => {
  const profile = application?.customerProfile || {};
  const borrower = application?.borrower || {};
  const applicant = application?.applicant || {};
  const primary = application?.primaryApplicant || {};

  return firstValue(
    application?.currentAddress,
    application?.address,
    application?.fullAddress,
    profile.currentAddress,
    profile.address,
    profile.fullAddress,
    borrower.currentAddress,
    borrower.address,
    applicant.currentAddress,
    applicant.address,
    primary.currentAddress,
    primary.address,
    joinAddress(
      application?.addressLine1,
      application?.addressLine2,
      application?.city,
      application?.state,
      application?.pincode,
    ),
  );
};

const getPermanentAddress = (application) => {
  const profile = application?.customerProfile || {};
  const borrower = application?.borrower || {};
  const applicant = application?.applicant || {};
  const primary = application?.primaryApplicant || {};

  return firstValue(
    application?.permanentAddress,
    profile.permanentAddress,
    borrower.permanentAddress,
    applicant.permanentAddress,
    primary.permanentAddress,
  );
};

const getPropertyDetails = (application) => {
  const profile = application?.customerProfile || {};
  const property = application?.property || {};
  const collateral = application?.collateral || {};
  const propertyDetails = application?.propertyDetails || {};
  const collateralDetails = application?.collateralDetails || {};

  const propertyAddress = firstValue(
    application?.propertyAddress,
    application?.collateralAddress,
    application?.propertyFullAddress,
    application?.fullPropertyAddress,
    profile.propertyAddress,
    property.address,
    property.propertyAddress,
    collateral.address,
    collateral.collateralAddress,
    propertyDetails.address,
    collateralDetails.address,
  );

  const city = firstValue(
    application?.propertyCity,
    application?.city,
    profile.propertyCity,
    property.city,
    collateral.city,
    propertyDetails.city,
    collateralDetails.city,
  );

  const state = firstValue(
    application?.propertyState,
    application?.state,
    profile.propertyState,
    property.state,
    collateral.state,
    propertyDetails.state,
    collateralDetails.state,
  );

  const pincode = firstValue(
    application?.propertyPincode,
    application?.pincode,
    application?.pinCode,
    profile.propertyPincode,
    property.pincode,
    collateral.pincode,
    propertyDetails.pincode,
    collateralDetails.pincode,
  );

  return {
    propertyType: firstValue(
      application?.propertyType,
      profile.propertyType,
      property.propertyType,
      collateral.propertyType,
      propertyDetails.propertyType,
      collateralDetails.propertyType,
    ),
    propertyAddress,
    propertyCity: city,
    propertyState: state,
    propertyPincode: pincode,
    fullPropertyAddress: firstValue(
      application?.fullPropertyAddress,
      application?.propertyFullAddress,
      joinAddress(propertyAddress, city, state, pincode),
    ),
    marketValue: firstValue(
      application?.marketValue,
      application?.propertyValue,
      application?.valuationAmount,
      profile.marketValue,
      profile.propertyValue,
      property.marketValue,
      collateral.marketValue,
      propertyDetails.marketValue,
      collateralDetails.marketValue,
    ),
  };
};

const buildInitialForm = (application, creditAssessment) => {
  const property = getPropertyDetails(application);

  const requestedAmount = toNumber(
    firstValue(
      application?.requestedAmount,
      application?.loanAmount,
      application?.customerProfile?.requestedAmount,
      creditAssessment?.requestedAmount,
      creditAssessment?.requestedLoan,
    ),
  );

  const verifiedIncome = toNumber(
    firstValue(
      creditAssessment?.verifiedIncome,
      application?.verifiedIncome,
      application?.monthlyIncome,
      application?.income,
      application?.customerProfile?.monthlyIncome,
      application?.customerProfile?.income,
    ),
  );

  const existingObligations = toNumber(
    firstValue(
      creditAssessment?.existingObligations,
      application?.existingObligations,
      application?.monthlyObligations,
      application?.customerProfile?.existingObligations,
    ),
  );

  const propertyValue = toNumber(
    firstValue(
      creditAssessment?.propertyValue,
      property.marketValue,
    ),
  );

  const foir =
    verifiedIncome > 0
      ? ((existingObligations / verifiedIncome) * 100).toFixed(2)
      : firstValue(creditAssessment?.foir, application?.foir);

  const ltv =
    propertyValue > 0 && requestedAmount > 0
      ? ((requestedAmount / propertyValue) * 100).toFixed(2)
      : firstValue(creditAssessment?.indicativeLtv, application?.ltv);

  return {
    recommendedAmount: firstValue(
      creditAssessment?.cmRecommendedAmount,
      creditAssessment?.recommendedAmount,
      requestedAmount,
    ),
    decision: firstValue(
      creditAssessment?.cmDecision,
      creditAssessment?.decision,
      "RECOMMEND",
    ),
    remarks: firstValue(
      creditAssessment?.cmRemarks,
      creditAssessment?.remarks,
      "",
    ),

    verifiedIncome,
    existingObligations,
    foir,
    propertyValue,
    requestedAmount,
    indicativeLtv: ltv,

    bureauScore: firstValue(
      creditAssessment?.bureauScore,
      application?.bureauScore,
      application?.cibilScore,
      application?.customerProfile?.bureauScore,
      "",
    ),
    currentDpd: firstValue(
      creditAssessment?.currentDpd,
      application?.currentDpd,
      "",
    ),
    dpd30In12m: firstValue(
      creditAssessment?.dpd30In12m,
      application?.dpd30In12m,
      "",
    ),
    writtenOffSettled: firstValue(
      creditAssessment?.writtenOffSettled,
      application?.writtenOffSettled,
      "",
    ),
    recentEnquiries: firstValue(
      creditAssessment?.recentEnquiries,
      application?.recentEnquiries,
      "",
    ),
    commercialBureau: firstValue(
      creditAssessment?.commercialBureau,
      application?.commercialBureau,
      "",
    ),
  };
};

const workflowSteps = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "Field Visit", status: "completed" },
  { id: 3, label: "BM Review", status: "completed" },
  { id: 4, label: "CM Screening", status: "current" },
  { id: 5, label: "Credit Maker", status: "pending" },
  { id: 6, label: "Credit Checker", status: "pending" },
  { id: 7, label: "Valuation", status: "pending" },
  { id: 8, label: "Legal", status: "pending" },
  { id: 9, label: "Ops", status: "pending" },
];

export default function CmPreliminaryCreditScreening() {
  const { applicationId: routeApplicationId } = useParams();

  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [form, setForm] = useState(() => buildInitialForm(null, null));
  const [message, setMessage] = useState("");
  const [hydratedKey, setHydratedKey] = useState("");

  const applicationsQuery = useQuery({
    queryKey: ["cm-screening-applications"],
    queryFn: () => creditApi.applications({ page: 1, limit: 500 }),
    retry: false,
  });

  const applicationRows = normalizeRows(unwrapPayload(applicationsQuery.data));

  const cmCases = useMemo(() => {
    return applicationRows.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      const stage = String(item.stage || "").toUpperCase();

      return (
        stage === "CM" ||
        status === "CM_PENDING" ||
        status === "CM_QUERY" ||
        status === "BM_APPROVED" ||
        status === "BM_PENDING"
      );
    });
  }, [applicationRows]);

  const finalSelectedId = selectedId || cmCases?.[0]?.id || "";

  const applicationQuery = useQuery({
    queryKey: ["cm-screening-application", finalSelectedId],
    queryFn: () => creditApi.getApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const creditApplicationQuery = useQuery({
    queryKey: ["cm-credit-application", finalSelectedId],
    queryFn: () => creditApi.getCreditApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const creditAssessmentQuery = useQuery({
    queryKey: ["credit-assessment", finalSelectedId],
    queryFn: () => creditApi.getCreditAssessment(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const kycStatusQuery = useQuery({
    queryKey: ["cm-kyc-verification-status", finalSelectedId],
    queryFn: () => creditApi.getKycVerificationStatus(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const applicationPayload = unwrapPayload(applicationQuery.data);
  const creditApplicationPayload = unwrapPayload(creditApplicationQuery.data);
  const assessmentPayload = unwrapPayload(creditAssessmentQuery.data);

  const application = {
    ...(getApplicationObject(creditApplicationPayload) || {}),
    ...(getApplicationObject(applicationPayload) || {}),
  };

  const creditAssessment = getAssessmentObject(assessmentPayload);
  const kycStatus = unwrapPayload(kycStatusQuery.data);

  const property = getPropertyDetails(application);
  const customerName = getCustomerName(application);
  const mobile = getMobile(application);
  const pan = getPan(application);
  const currentAddress = getCurrentAddress(application);
  const permanentAddress = getPermanentAddress(application);

  const hydrateKey = [
    finalSelectedId,
    application?.id,
    creditAssessment?.id,
    creditAssessment?.updatedAt,
    applicationQuery.dataUpdatedAt,
    creditAssessmentQuery.dataUpdatedAt,
  ].join(":");

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;
    if (hydratedKey === hydrateKey) return;

    setForm(buildInitialForm(application, creditAssessment));
    setHydratedKey(hydrateKey);
    setMessage("");
  }, [
    finalSelectedId,
    application?.id,
    creditAssessment,
    hydratedKey,
    hydrateKey,
  ]);

  const updateForm = (field, value) => {
    setMessage("");
    setForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      if (
        field === "verifiedIncome" ||
        field === "existingObligations" ||
        field === "propertyValue" ||
        field === "requestedAmount"
      ) {
        const verifiedIncome = toNumber(
          field === "verifiedIncome" ? value : next.verifiedIncome,
        );

        const existingObligations = toNumber(
          field === "existingObligations" ? value : next.existingObligations,
        );

        const propertyValue = toNumber(
          field === "propertyValue" ? value : next.propertyValue,
        );

        const requestedAmount = toNumber(
          field === "requestedAmount" ? value : next.requestedAmount,
        );

        next.foir =
          verifiedIncome > 0
            ? ((existingObligations / verifiedIncome) * 100).toFixed(2)
            : "";

        next.indicativeLtv =
          propertyValue > 0 && requestedAmount > 0
            ? ((requestedAmount / propertyValue) * 100).toFixed(2)
            : "";
      }

      return next;
    });
  };

  const buildPayload = (decisionType) => {
    const finalRecommendedAmount = toNumber(
      firstValue(form.recommendedAmount, form.requestedAmount),
    );

    return {
      decision: decisionType,
      cmDecision: decisionType,

      recommendedAmount: finalRecommendedAmount,
      cmRecommendedAmount: finalRecommendedAmount,

      riskScore: toNumber(calculateRiskScore(form)),
      cmRiskScore: toNumber(calculateRiskScore(form)),
      preliminaryRiskScore: toNumber(calculateRiskScore(form)),

      remarks: form.remarks,
      cmRemarks: form.remarks,

      verifiedIncome: toNumber(form.verifiedIncome),
      existingObligations: toNumber(form.existingObligations),
      foir: toNumber(form.foir),
      propertyValue: toNumber(form.propertyValue),
      requestedLoan: toNumber(form.requestedAmount),
      requestedAmount: toNumber(form.requestedAmount),
      indicativeLtv: toNumber(form.indicativeLtv),

      bureauScore: toNumber(form.bureauScore),
      currentDpd: toNumber(form.currentDpd),
      dpd30In12m: toNumber(form.dpd30In12m),
      writtenOffSettled: form.writtenOffSettled,
      recentEnquiries: toNumber(form.recentEnquiries),
      commercialBureau: form.commercialBureau,

      customerSnapshot: {
        applicationNumber: application?.applicationNumber,
        customerName,
        mobile,
        pan,
        currentAddress,
        permanentAddress,
      },

      propertySnapshot: property,

      applicationSnapshot: {
        id: application?.id,
        applicationNumber: application?.applicationNumber,
        stage: application?.stage,
        status: application?.status,
        requestedAmount: application?.requestedAmount,
      },
    };
  };

  const saveDraftMutation = useMutation({
    mutationFn: () => {
      if (!finalSelectedId) {
        throw new Error("Please select CM case first.");
      }

      return creditApi.cmSaveDraft(finalSelectedId, buildPayload(form.decision || "RECOMMEND"));
    },

    onSuccess: async (response) => {
      setMessage(response?.data?.message || "CM screening draft saved successfully.");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["credit-assessment", finalSelectedId] }),
        queryClient.invalidateQueries({ queryKey: ["cm-screening-application", finalSelectedId] }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save CM draft.",
      );
    },
  });

  const decisionMutation = useMutation({
    mutationFn: (decisionType) => {
      if (!finalSelectedId) {
        throw new Error("Please select CM case first.");
      }

      return creditApi.cmRecommendToCreditMaker(finalSelectedId, buildPayload(decisionType));
    },

    onSuccess: async (response) => {
      setMessage(response?.data?.message || "CM decision completed successfully.");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cm-screening-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["cm-screening-application", finalSelectedId] }),
        queryClient.invalidateQueries({ queryKey: ["cm-credit-application", finalSelectedId] }),
        queryClient.invalidateQueries({ queryKey: ["credit-assessment", finalSelectedId] }),
        queryClient.invalidateQueries({ queryKey: ["credit-manager-dashboard"] }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to complete CM decision.",
      );
    },
  });

  const validateBeforeSubmit = (decisionType) => {
    if (!finalSelectedId) {
      setMessage("Please select CM case first.");
      return false;
    }

    if (!form.remarks || String(form.remarks).trim().length < 5) {
      setMessage("Please enter clear CM remarks before action.");
      return false;
    }

    if (decisionType === "RECOMMEND" && !toNumber(form.recommendedAmount)) {
      setMessage("Please enter recommended amount before approving to Credit Maker.");
      return false;
    }

    return true;
  };

  const handleDecision = (decisionType) => {
    setMessage("");

    if (!validateBeforeSubmit(decisionType)) return;

    decisionMutation.mutate(decisionType);
  };

  const riskScore = calculateRiskScore(form);
  const isLoading =
    applicationsQuery.isLoading ||
    applicationQuery.isLoading ||
    creditApplicationQuery.isLoading ||
    creditAssessmentQuery.isLoading;

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#0f2942] via-[#2563eb] to-[#22c7c7] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/30" />
          <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                CM
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  CM Preliminary Credit Screening
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-white/90">
                  Review customer, KYC, property, eligibility and bureau details before sending the case to Credit Maker.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <HeaderBadge label="Application" value={application?.applicationNumber || "Select Case"} />
                  <HeaderBadge label="Stage" value={formatStatus(application?.stage)} />
                  <HeaderBadge label="Status" value={formatStatus(application?.status)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[520px]">
              <ActionButton
                label="Save Draft"
                icon={FaSave}
                disabled={saveDraftMutation.isPending || decisionMutation.isPending}
                onClick={() => saveDraftMutation.mutate()}
                tone="white"
              />

              <ActionButton
                label="Hold / Query"
                icon={FaExclamationTriangle}
                disabled={decisionMutation.isPending}
                onClick={() => handleDecision("HOLD_QUERY")}
                tone="white"
              />

              <ActionButton
                label="Reject"
                icon={FaTimes}
                disabled={decisionMutation.isPending}
                onClick={() => handleDecision("REJECT")}
                tone="red"
              />

              <ActionButton
                label={decisionMutation.isPending ? "Sending..." : "Approve & Send to Credit Maker"}
                icon={FaArrowRight}
                disabled={decisionMutation.isPending}
                onClick={() => handleDecision("RECOMMEND")}
                tone="green"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setMessage("");
                  setHydratedKey("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select CM Case</option>
                {cmCases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.applicationNumber || item.id} - {item.customerName || item.customer_name || "Customer"}
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
                value={
                  finalSelectedId
                    ? `${formatText(customerName)} | ${formatText(mobile)} | ${formatText(pan)}`
                    : ""
                }
                readOnly
                placeholder="Selected case details"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-bold text-slate-700 outline-none"
              />
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-black text-blue-700">
              {message}
            </div>
          )}

          {applicationsQuery.isError && (
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-black text-rose-700">
              Unable to load CM case list.
            </div>
          )}
        </div>

        <WorkflowStepper />

        {isLoading && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm font-black text-slate-500 shadow-sm">
            Loading CM case details...
          </div>
        )}

        {!isLoading && !finalSelectedId && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-8 text-center text-sm font-black text-amber-700 shadow-sm">
            Please select a CM case to start screening.
          </div>
        )}

        {!isLoading && finalSelectedId && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <MetricCard
                title="Requested Loan"
                value={formatCurrency(form.requestedAmount)}
                subtitle="Customer requested amount"
                tone="blue"
              />
              <MetricCard
                title="Property Value"
                value={formatCurrency(form.propertyValue)}
                subtitle="Market / valuation value"
                tone="green"
              />
              <MetricCard
                title="FOIR"
                value={formatPercent(form.foir)}
                subtitle="Obligation against income"
                tone={toNumber(form.foir) <= 50 ? "green" : "orange"}
              />
              <MetricCard
                title="Indicative LTV"
                value={formatPercent(form.indicativeLtv)}
                subtitle="Loan against property value"
                tone={toNumber(form.indicativeLtv) <= 70 ? "green" : "orange"}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <SectionCard title="Application & Customer Details" icon={FaUserTie}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <ReadField label="Application No." value={application?.applicationNumber} />
                    <ReadField label="Customer Name" value={customerName} />
                    <ReadField label="Mobile" value={mobile} />
                    <ReadField label="PAN" value={pan} />
                    <ReadField label="Stage" value={formatStatus(application?.stage)} />
                    <ReadField label="Status" value={formatStatus(application?.status)} />
                  </div>
                </SectionCard>

                <SectionCard title="Address Details" icon={FaHome}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReadField label="Current Address" value={currentAddress} large />
                    <ReadField label="Permanent Address" value={permanentAddress} large />
                  </div>
                </SectionCard>

                <SectionCard title="Loan & Property Details" icon={FaMoneyBillWave}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <EditableField
                      label="Requested Amount"
                      value={form.requestedAmount}
                      onChange={(value) => updateForm("requestedAmount", value)}
                      type="number"
                    />
                    <EditableField
                      label="Property Value"
                      value={form.propertyValue}
                      onChange={(value) => updateForm("propertyValue", value)}
                      type="number"
                    />
                    <ReadField label="Property Type" value={property.propertyType} />
                    <ReadField label="Property Address" value={property.fullPropertyAddress} large />
                    <ReadField label="Property City" value={property.propertyCity} />
                    <ReadField label="Property State" value={property.propertyState} />
                    <ReadField label="Property Pincode" value={property.propertyPincode} />
                  </div>
                </SectionCard>

                <SectionCard title="KYC / Verification Snapshot" icon={FaIdCard}>
                  {kycStatusQuery.isLoading ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm font-bold text-blue-700">
                      Loading KYC verification status...
                    </div>
                  ) : kycStatusQuery.isError ? (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm font-bold text-rose-700">
                      Unable to load KYC verification status. Please refresh and try again.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <StatusBox label="PAN" value={kycStatus?.panStatus} />
                        <StatusBox label="Aadhaar" value={kycStatus?.aadhaarStatus} />
                        <StatusBox label="GST" value={kycStatus?.gstStatus} />
                        <StatusBox label="Bureau" value={kycStatus?.bureauStatus} />
                        <StatusBox label="Mobile OTP" value={kycStatus?.mobileStatus} />
                        <StatusBox label="Email OTP" value={kycStatus?.emailStatus} />
                      </div>
                      <p className="mt-4 text-right text-[11px] font-semibold text-slate-400">
                        {kycStatus?.updatedAt
                          ? `Last updated: ${new Date(kycStatus.updatedAt).toLocaleString("en-IN")}`
                          : "KYC verification not yet initiated"}
                      </p>
                    </>
                  )}
                </SectionCard>

                <SectionCard title="Eligibility Calculation" icon={FaClipboardCheck}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <EditableField
                      label="Verified Monthly Income"
                      value={form.verifiedIncome}
                      onChange={(value) => updateForm("verifiedIncome", value)}
                      type="number"
                    />
                    <EditableField
                      label="Existing Obligations"
                      value={form.existingObligations}
                      onChange={(value) => updateForm("existingObligations", value)}
                      type="number"
                    />
                    <ReadField label="FOIR" value={formatPercent(form.foir)} />
                    <ReadField label="Requested Loan" value={formatCurrency(form.requestedAmount)} />
                    <ReadField label="Property Value" value={formatCurrency(form.propertyValue)} />
                    <ReadField label="Indicative LTV" value={formatPercent(form.indicativeLtv)} />
                  </div>
                </SectionCard>

                <SectionCard title="Bureau Snapshot" icon={FaFileAlt}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <EditableField
                      label="Bureau Score"
                      value={form.bureauScore}
                      onChange={(value) => updateForm("bureauScore", value)}
                      type="number"
                    />
                    <EditableField
                      label="Current DPD"
                      value={form.currentDpd}
                      onChange={(value) => updateForm("currentDpd", value)}
                      type="number"
                    />
                    <EditableField
                      label="30+ DPD in 12M"
                      value={form.dpd30In12m}
                      onChange={(value) => updateForm("dpd30In12m", value)}
                      type="number"
                    />
                    <EditableField
                      label="Written-off / Settled"
                      value={form.writtenOffSettled}
                      onChange={(value) => updateForm("writtenOffSettled", value)}
                    />
                    <EditableField
                      label="Recent Enquiries"
                      value={form.recentEnquiries}
                      onChange={(value) => updateForm("recentEnquiries", value)}
                      type="number"
                    />
                    <EditableField
                      label="Commercial Bureau"
                      value={form.commercialBureau}
                      onChange={(value) => updateForm("commercialBureau", value)}
                    />
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <div className="sticky top-6 space-y-6">
                  <SectionCard title="CM Decision" icon={FaClipboardCheck}>
                    <div className="mb-5">
                      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-500">
                        <span>Preliminary Risk Score</span>
                        <span>{riskScore} / 100</span>
                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${riskScore >= 70 ? "bg-emerald-500" : riskScore >= 45 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${Math.max(5, Math.min(100, riskScore))}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Decision
                        </label>
                        <select
                          value={form.decision}
                          onChange={(event) => updateForm("decision", event.target.value)}
                          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="RECOMMEND">Approve & Send to Credit Maker</option>
                          <option value="HOLD_QUERY">Hold / Query</option>
                          <option value="REJECT">Reject</option>
                        </select>
                      </div>

                      <EditableField
                        label="Recommended Amount"
                        value={form.recommendedAmount}
                        onChange={(value) => updateForm("recommendedAmount", value)}
                        type="number"
                      />

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          CM Remarks *
                        </label>
                        <textarea
                          rows={7}
                          value={form.remarks}
                          onChange={(event) => updateForm("remarks", event.target.value)}
                          placeholder="Enter CM screening remarks, file observations, deviation notes or query reason."
                          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-relaxed text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <button
                          type="button"
                          onClick={() => saveDraftMutation.mutate()}
                          disabled={saveDraftMutation.isPending || decisionMutation.isPending}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <FaSave />
                          {saveDraftMutation.isPending ? "Saving Draft..." : "Save Draft"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecision("RECOMMEND")}
                          disabled={decisionMutation.isPending}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <FaArrowRight />
                          Approve & Send to Credit Maker
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleDecision("HOLD_QUERY")}
                            disabled={decisionMutation.isPending}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-400 px-5 text-sm font-black text-white shadow-md transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <FaExclamationTriangle />
                            Query
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDecision("REJECT")}
                            disabled={decisionMutation.isPending}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-black text-white shadow-md transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <FaTimes />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Approve Flow" icon={FaArrowRight}>
                    <FlowRow
                      title="Approve"
                      value="CM_APPROVED / CREDIT_MAKER_PENDING"
                      description="Case moves to Credit Maker for detailed underwriting."
                      tone="green"
                    />
                    <FlowRow
                      title="Hold / Query"
                      value="CM_QUERY"
                      description="Case remains in CM queue with query remarks."
                      tone="orange"
                    />
                    <FlowRow
                      title="Reject"
                      value="CM_REJECTED"
                      description="Case is rejected at CM screening level."
                      tone="red"
                    />
                  </SectionCard>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function calculateRiskScore(form) {
  let score = 70;

  const bureauScore = toNumber(form.bureauScore);
  const foir = toNumber(form.foir);
  const ltv = toNumber(form.indicativeLtv);
  const dpd = toNumber(form.currentDpd);
  const dpd30 = toNumber(form.dpd30In12m);
  const enquiries = toNumber(form.recentEnquiries);

  if (bureauScore >= 750) score += 10;
  else if (bureauScore >= 700) score += 5;
  else if (bureauScore > 0 && bureauScore < 650) score -= 15;

  if (foir > 60) score -= 15;
  else if (foir > 50) score -= 8;
  else if (foir > 0 && foir <= 45) score += 5;

  if (ltv > 75) score -= 12;
  else if (ltv > 65) score -= 6;
  else if (ltv > 0 && ltv <= 60) score += 5;

  if (dpd > 0) score -= 10;
  if (dpd30 > 0) score -= 10;
  if (enquiries > 5) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function HeaderBadge({ label, value }) {
  return (
    <span className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">
      {label}: {value || "—"}
    </span>
  );
}

function ActionButton({ label, icon: Icon, onClick, disabled, tone }) {
  const toneClass = {
    white: "bg-white text-[#0f2942] hover:bg-blue-50",
    green: "bg-emerald-500 text-white hover:bg-emerald-600",
    amber: "bg-amber-400 text-white hover:bg-amber-500",
    red: "bg-rose-500 text-white hover:bg-rose-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wide shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white ${
        toneClass[tone] || toneClass.white
      }`}
    >
      <Icon />
      {label}
    </button>
  );
}

function WorkflowStepper() {
  return (
    <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5 overflow-x-auto pb-2">
        {workflowSteps.map((step, index) => {
          const completed = step.status === "completed";
          const current = step.status === "current";

          return (
            <div key={step.id} className="flex min-w-[130px] flex-1 items-center gap-4">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : current
                        ? "bg-blue-600 text-white ring-8 ring-blue-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? <FaCheck /> : step.id}
                </div>

                <p className={`mt-3 text-xs font-black ${current ? "text-blue-700" : "text-slate-700"}`}>
                  {step.label}
                </p>

                <p className="mt-1 text-[11px] font-bold capitalize text-slate-400">
                  {step.status}
                </p>
              </div>

              {index < workflowSteps.length - 1 && (
                <div className="hidden h-0.5 flex-1 bg-slate-200 xl:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, tone = "blue" }) {
  const toneClass = {
    green: "text-emerald-700 bg-emerald-50 border-emerald-100",
    orange: "text-amber-700 bg-amber-50 border-amber-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    red: "text-rose-700 bg-rose-50 border-rose-100",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
          toneClass[tone] || toneClass.blue
        }`}
      >
        {title}
      </div>

      <div className="mt-4 text-2xl font-black text-slate-900">{value}</div>

      <p className="mt-2 text-xs font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon />
        </div>

        <div>
          <h2 className="text-base font-black text-[#0f2942]">{title}</h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
        </div>
      </div>

      {children}
    </div>
  );
}

function ReadField({ label, value, large = false }) {
  return (
    <div className={large ? "md:col-span-2" : ""}>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 min-h-[44px] rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold leading-relaxed text-slate-800">
        {formatText(value)}
      </div>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function StatusBox({ label, value }) {
  const status = String(value || "PENDING").toUpperCase();

  const tone =
    status.includes("VERIFIED") || status.includes("SUCCESS")
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status.includes("FAILED") || status.includes("REJECTED")
        ? "bg-rose-50 text-rose-700 border-rose-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <p className="text-[11px] font-black uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-2 text-sm font-black">{formatStatus(status)}</p>
    </div>
  );
}

function FlowRow({ title, value, description, tone }) {
  const toneClass = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    orange: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-rose-100 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`mb-3 rounded-xl border p-4 ${toneClass[tone]}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-black">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-relaxed opacity-80">
        {description}
      </p>
    </div>
  );
}
