import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBalanceScale,
  FaCheck,
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

const BASE_WORKFLOW_STEPS = [
  { id: 1, key: "LEAD", label: "Lead" },
  { id: 2, key: "FIELD", label: "Field Verification" },
  { id: 3, key: "BM", label: "BM Review" },
  { id: 4, key: "CM", label: "CM Screening" },
  { id: 5, key: "CREDIT_MAKER", label: "Credit Maker" },
  { id: 6, key: "CREDIT_CHECKER", label: "Credit Checker" },
  { id: 7, key: "VALUATION", label: "Valuation" },
  { id: 8, key: "LEGAL", label: "Legal" },
  { id: 9, key: "SANCTION", label: "Sanction" },
  { id: 10, key: "AGREEMENT", label: "Agreement" },
  { id: 11, key: "DISBURSEMENT", label: "Disbursement" },
];

const CHECKER_VISIBLE_STATUSES = [
  "CREDIT_MAKER_RECOMMENDED",
  "SUBMITTED_TO_CREDIT_CHECKER",
  "CREDIT_CHECKER_PENDING",
  "CREDIT_CHECKER_QUERY",
  "CREDIT_CHECKER_APPROVED",
  "CREDIT_CHECKER_REJECTED",
];

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.applications)) return payload.data.applications;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const valueOrEmpty = (value) =>
  value === null || value === undefined ? "" : String(value);

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const joinAddress = (...parts) => {
  return parts
    .filter(
      (part) =>
        part !== null &&
        part !== undefined &&
        String(part).trim() !== "",
    )
    .map((part) => String(part).trim())
    .join(", ");
};

const parseJson = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getCurrentWorkflowIndex = (application) => {
  const stage = String(application?.stage || "").toUpperCase();
  const status = String(application?.status || "").toUpperCase();

  if (!application) return -1;

  if (stage === "DISBURSEMENT" || status.includes("DISBURSEMENT")) return 10;
  if (stage === "AGREEMENT" || status.includes("AGREEMENT")) return 9;
  if (stage === "SANCTION" || status.includes("SANCTION")) return 8;
  if (stage === "LEGAL" || status.includes("LEGAL")) return 7;
  if (stage === "VALUATION" || status.includes("VALUATION")) return 6;
  if (status.includes("CREDIT_CHECKER")) return 5;
  if (status.includes("CREDIT_MAKER")) return 4;
  if (stage === "CREDIT") return 4;
  if (stage === "CM" || status.includes("CM")) return 3;
  if (stage === "BM" || status.includes("BM")) return 2;
  if (stage === "RM") return 1;

  return 0;
};

const buildWorkflowSteps = (application) => {
  const currentIndex = getCurrentWorkflowIndex(application);

  return BASE_WORKFLOW_STEPS.map((step, index) => {
    if (currentIndex === -1) {
      return { ...step, status: "pending" };
    }

    if (index < currentIndex) {
      return { ...step, status: "completed" };
    }

    if (index === currentIndex) {
      return { ...step, status: "current" };
    }

    return { ...step, status: "pending" };
  });
};

const getApplicationObject = (payload) => {
  return (
    payload?.application ||
    payload?.data?.application ||
    payload?.data ||
    payload ||
    {}
  );
};

const getCreditAssessmentObject = (applicationPayload, assessmentPayload) => {
  return (
    applicationPayload?.creditAssessment ||
    applicationPayload?.data?.creditAssessment ||
    assessmentPayload?.creditAssessment ||
    assessmentPayload?.data?.creditAssessment ||
    assessmentPayload ||
    null
  );
};

const mergeApplication = (primary, fallback) => {
  return {
    ...fallback,
    ...primary,
    customerProfile: {
      ...(fallback?.customerProfile || {}),
      ...(primary?.customerProfile || {}),
    },
    borrower: {
      ...(fallback?.borrower || {}),
      ...(primary?.borrower || {}),
    },
    applicant: {
      ...(fallback?.applicant || {}),
      ...(primary?.applicant || {}),
    },
    primaryApplicant: {
      ...(fallback?.primaryApplicant || {}),
      ...(primary?.primaryApplicant || {}),
    },
    property: {
      ...(fallback?.property || {}),
      ...(primary?.property || {}),
    },
    collateral: {
      ...(fallback?.collateral || {}),
      ...(primary?.collateral || {}),
    },
  };
};

const getSourceObject = (application) => {
  return {
    profile: application?.customerProfile || {},
    borrower: application?.borrower || {},
    applicant: application?.applicant || {},
    primaryApplicant: application?.primaryApplicant || {},
    property: application?.property || {},
    collateral: application?.collateral || {},
  };
};

const getCustomerName = (application, customerSnapshot = {}) => {
  const { profile, borrower, applicant, primaryApplicant } =
    getSourceObject(application);

  const joinedProfileName = `${profile?.firstName || ""} ${
    profile?.middleName || ""
  } ${profile?.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();

  return firstValue(
    customerSnapshot?.customerName,
    application?.customerName,
    application?.name,
    application?.applicantName,
    application?.borrowerName,
    profile?.customerName,
    profile?.name,
    joinedProfileName,
    borrower?.customerName,
    borrower?.name,
    applicant?.customerName,
    applicant?.name,
    primaryApplicant?.customerName,
    primaryApplicant?.name,
  );
};

const getAddressDetails = (application, propertySnapshot = {}) => {
  const { profile, borrower, applicant, primaryApplicant, property, collateral } =
    getSourceObject(application);

  const propertyAddress = firstValue(
    propertySnapshot?.propertyAddress,
    propertySnapshot?.address,
    application?.propertyAddress,
    application?.address,
    application?.collateralAddress,
    application?.property_address,
    property?.propertyAddress,
    property?.address,
    collateral?.propertyAddress,
    collateral?.address,
    profile?.propertyAddress,
    profile?.address,
    profile?.property_address,
    borrower?.propertyAddress,
    borrower?.address,
    applicant?.propertyAddress,
    applicant?.address,
    primaryApplicant?.propertyAddress,
    primaryApplicant?.address,
  );

  const propertyCity = firstValue(
    propertySnapshot?.propertyCity,
    propertySnapshot?.city,
    application?.propertyCity,
    application?.city,
    property?.propertyCity,
    property?.city,
    collateral?.propertyCity,
    collateral?.city,
    profile?.propertyCity,
    profile?.city,
    borrower?.propertyCity,
    borrower?.city,
    applicant?.propertyCity,
    applicant?.city,
    primaryApplicant?.propertyCity,
    primaryApplicant?.city,
  );

  const propertyState = firstValue(
    propertySnapshot?.propertyState,
    propertySnapshot?.state,
    application?.propertyState,
    application?.state,
    property?.propertyState,
    property?.state,
    collateral?.propertyState,
    collateral?.state,
    profile?.propertyState,
    profile?.state,
    borrower?.propertyState,
    borrower?.state,
    applicant?.propertyState,
    applicant?.state,
    primaryApplicant?.propertyState,
    primaryApplicant?.state,
  );

  const propertyPincode = firstValue(
    propertySnapshot?.propertyPincode,
    propertySnapshot?.pincode,
    propertySnapshot?.pinCode,
    application?.propertyPincode,
    application?.pinCode,
    application?.pincode,
    application?.pin_code,
    property?.propertyPincode,
    property?.pincode,
    property?.pinCode,
    collateral?.propertyPincode,
    collateral?.pincode,
    collateral?.pinCode,
    profile?.propertyPincode,
    profile?.pincode,
    profile?.pinCode,
    borrower?.propertyPincode,
    borrower?.pincode,
    borrower?.pinCode,
    applicant?.propertyPincode,
    applicant?.pincode,
    applicant?.pinCode,
    primaryApplicant?.propertyPincode,
    primaryApplicant?.pincode,
    primaryApplicant?.pinCode,
  );

  const currentAddress = firstValue(
    application?.currentAddress,
    application?.current_address,
    application?.residenceAddress,
    application?.residentialAddress,
    application?.communicationAddress,
    profile?.currentAddress,
    profile?.current_address,
    profile?.residenceAddress,
    profile?.residentialAddress,
    profile?.communicationAddress,
    borrower?.currentAddress,
    borrower?.residenceAddress,
    applicant?.currentAddress,
    applicant?.residenceAddress,
    primaryApplicant?.currentAddress,
    primaryApplicant?.residenceAddress,
  );

  const permanentAddress = firstValue(
    application?.permanentAddress,
    application?.permanent_address,
    profile?.permanentAddress,
    profile?.permanent_address,
    borrower?.permanentAddress,
    applicant?.permanentAddress,
    primaryApplicant?.permanentAddress,
  );

  const fullPropertyAddress = firstValue(
    propertySnapshot?.fullPropertyAddress,
    joinAddress(propertyAddress, propertyCity, propertyState, propertyPincode),
  );

  return {
    propertyAddress,
    propertyCity,
    propertyState,
    propertyPincode,
    fullPropertyAddress,
    currentAddress,
    permanentAddress,
  };
};

const buildCaseDetails = (application, creditAssessment) => {
  const { profile } = getSourceObject(application);

  const cmPayload = parseJson(creditAssessment?.cmPayload, {});
  const makerPayload = parseJson(creditAssessment?.makerPayload, {});
  const checkerPayload = parseJson(creditAssessment?.checkerPayload, {});

  const customerSnapshot = firstValue(
    makerPayload?.customerEditableSnapshot,
    checkerPayload?.checkerSnapshot?.customer,
    {},
  );

  const propertySnapshot = firstValue(
    makerPayload?.propertyEditableSnapshot,
    checkerPayload?.checkerSnapshot?.property,
    {},
  );

  const eligibilitySnapshot = makerPayload?.eligibilitySnapshot || {};
  const bureauSnapshot = makerPayload?.bureauSnapshot || {};

  const address = getAddressDetails(application, propertySnapshot);

  const requestedAmount = firstValue(
    eligibilitySnapshot?.requestedAmount,
    application?.requestedAmount,
    application?.loanAmount,
    application?.loan_amount,
    creditAssessment?.requestedLoan,
  );

  const propertyValue = firstValue(
    propertySnapshot?.assessedPropertyValue,
    application?.marketValue,
    application?.propertyValue,
    application?.property_value,
    profile?.marketValue,
    profile?.propertyValue,
    creditAssessment?.propertyValue,
  );

  const verifiedIncome = firstValue(
    eligibilitySnapshot?.verifiedIncome,
    creditAssessment?.verifiedIncome,
    application?.verifiedIncome,
    application?.monthlyIncome,
    application?.verifiedMonthlyIncome,
    profile?.monthlyIncome,
  );

  const existingObligations = firstValue(
    eligibilitySnapshot?.existingObligations,
    creditAssessment?.existingObligations,
    application?.existingMonthlyObligations,
    application?.monthlyObligations,
    profile?.monthlyObligations,
  );

  const makerRecommendedAmount = firstValue(
    creditAssessment?.makerRecommendedAmount,
    makerPayload?.makerRecommendedAmount,
    makerPayload?.recommendedAmount,
  );

  const makerRecommendedRoi = firstValue(
    creditAssessment?.makerRecommendedRoi,
    makerPayload?.makerRecommendedRoi,
    makerPayload?.recommendedRoi,
    makerPayload?.roi,
  );

  const makerRecommendedTenure = firstValue(
    creditAssessment?.makerRecommendedTenure,
    makerPayload?.makerRecommendedTenure,
    makerPayload?.recommendedTenure,
    makerPayload?.tenure,
  );

  const foir = firstValue(
    eligibilitySnapshot?.foir,
    creditAssessment?.foir,
    application?.foir,
  );

  const indicativeLtv = firstValue(
    eligibilitySnapshot?.indicativeLtv,
    creditAssessment?.indicativeLtv,
    application?.ltv,
    application?.indicativeLtv,
  );

  return {
    cmPayload,
    makerPayload,
    checkerPayload,

    sourceType: firstValue(application?.sourceType, application?.source, "Direct"),
    hub: firstValue(application?.hub, application?.branch),
    spoke: firstValue(application?.spoke),

    customerName: getCustomerName(application, customerSnapshot),
    mobile: firstValue(
      customerSnapshot?.mobile,
      application?.mobile,
      application?.mobileNumber,
      profile?.mobile,
    ),
    email: firstValue(
      customerSnapshot?.email,
      application?.email,
      application?.emailId,
      profile?.email,
    ),
    pan: firstValue(
      customerSnapshot?.pan,
      application?.pan,
      application?.panNumber,
      profile?.panNumber,
    ),
    aadhaar: firstValue(
      application?.aadhaarNumber,
      application?.aadharNumber,
      application?.ovdNumber,
      profile?.aadhaarNumber,
      profile?.aadharNumber,
      profile?.ovdNumber,
    ),
    occupation: firstValue(
      customerSnapshot?.occupationType,
      application?.occupationType,
      application?.occupation,
      application?.constitution,
      profile?.occupationType,
    ),
    businessName: firstValue(
      customerSnapshot?.businessName,
      application?.businessName,
      profile?.businessName,
    ),
    businessVintage: firstValue(
      makerPayload?.businessVintage,
      application?.businessVintage,
      application?.employmentVintage,
      application?.vintage,
      profile?.businessVintage,
    ),

    currentAddress: firstValue(
      customerSnapshot?.currentAddress,
      address.currentAddress,
    ),
    permanentAddress: firstValue(
      customerSnapshot?.permanentAddress,
      address.permanentAddress,
    ),
    fullPropertyAddress: firstValue(
      propertySnapshot?.fullPropertyAddress,
      address.fullPropertyAddress,
    ),

    applicationNumber: application?.applicationNumber,
    requestedAmount,
    loanPurpose: firstValue(application?.loanPurpose, application?.purpose),
    requestedTenure: firstValue(application?.tenure, application?.requestedTenure),
    stage: application?.stage,
    status: application?.status,

    propertyCategory: firstValue(
      propertySnapshot?.propertyCategory,
      application?.propertyCategory,
      profile?.propertyCategory,
    ),
    propertyType: firstValue(
      propertySnapshot?.propertyType,
      application?.propertyType,
      application?.propertyCategory,
      profile?.propertyType,
      profile?.propertyCategory,
    ),
    propertyAddress: firstValue(propertySnapshot?.propertyAddress, address.propertyAddress),
    propertyCity: firstValue(propertySnapshot?.propertyCity, address.propertyCity),
    propertyState: firstValue(propertySnapshot?.propertyState, address.propertyState),
    propertyPincode: firstValue(propertySnapshot?.propertyPincode, address.propertyPincode),
    propertyValue,

    verifiedIncome,
    existingObligations,
    foir,
    indicativeLtv,
    ruleVersion: firstValue(application?.ruleVersion, "LIP-POLICY-2026.06-v1"),

    bureauScore: firstValue(
      bureauSnapshot?.bureauScore,
      creditAssessment?.bureauScore,
      application?.bureauScore,
      application?.cibilScore,
    ),
    currentDpd: firstValue(
      bureauSnapshot?.currentDpd,
      creditAssessment?.currentDpd,
      application?.currentDpd,
      0,
    ),
    dpd30In12m: firstValue(
      bureauSnapshot?.dpd30In12m,
      creditAssessment?.dpd30In12m,
      application?.dpd30In12m,
      0,
    ),
    writtenOffSettled: firstValue(
      bureauSnapshot?.writtenOffSettled,
      creditAssessment?.writtenOffSettled,
      application?.writtenOffSettled,
    ),
    recentEnquiries: firstValue(
      bureauSnapshot?.recentEnquiries,
      creditAssessment?.recentEnquiries,
      application?.recentEnquiries,
      0,
    ),
    commercialBureau: firstValue(
      bureauSnapshot?.commercialBureau,
      creditAssessment?.commercialBureau,
      application?.commercialBureau,
    ),

    cmDecision: firstValue(creditAssessment?.cmDecision, cmPayload?.cmDecision),
    cmRecommendedAmount: firstValue(
      creditAssessment?.cmRecommendedAmount,
      cmPayload?.cmRecommendedAmount,
    ),
    cmRiskScore: firstValue(creditAssessment?.cmRiskScore, cmPayload?.cmRiskScore),
    cmRemarks: firstValue(
      creditAssessment?.cmRemarks,
      cmPayload?.cmRemarks,
      cmPayload?.remarks,
    ),

    makerDecision: firstValue(
      creditAssessment?.makerDecision,
      makerPayload?.makerDecision,
      makerPayload?.decision,
    ),
    makerRecommendedAmount,
    makerRecommendedRoi,
    makerRecommendedTenure,
    makerRiskGrade: firstValue(
      creditAssessment?.makerRiskGrade,
      makerPayload?.makerRiskGrade,
      makerPayload?.riskGrade,
    ),
    makerRemarks: firstValue(
      creditAssessment?.makerRemarks,
      makerPayload?.makerRemarks,
      makerPayload?.remarks,
    ),
  };
};

const defaultReview = {
  checkerDecision: "APPROVE",
  checkerApprovedAmount: "",
  checkerApprovedTenure: "",
  checkerApprovedRoi: "",

  checkerRiskGrade: "",
  checkerPolicyDecision: "",
  checkerCollateralView: "",
  checkerIncomeView: "",
  checkerBureauView: "",
  checkerDeviationView: "",

  checkerRemarks: "",
  checkerConditions: "",
};

const buildReviewFromAssessment = (application, assessment, caseDetails) => {
  const makerPayload = parseJson(assessment?.makerPayload, {});
  const checkerPayload = parseJson(assessment?.checkerPayload, {});

  const makerAmount = firstValue(
    assessment?.makerRecommendedAmount,
    makerPayload?.makerRecommendedAmount,
    makerPayload?.recommendedAmount,
    caseDetails?.makerRecommendedAmount,
  );

  const makerRoi = firstValue(
    assessment?.makerRecommendedRoi,
    makerPayload?.makerRecommendedRoi,
    makerPayload?.recommendedRoi,
    makerPayload?.roi,
    caseDetails?.makerRecommendedRoi,
  );

  const makerTenure = firstValue(
    assessment?.makerRecommendedTenure,
    makerPayload?.makerRecommendedTenure,
    makerPayload?.recommendedTenure,
    makerPayload?.tenure,
    caseDetails?.makerRecommendedTenure,
  );

  return {
    ...defaultReview,

    checkerDecision: firstValue(
      assessment?.checkerDecision,
      checkerPayload?.checkerDecision,
      "APPROVE",
    ),

    checkerApprovedAmount: valueOrEmpty(
      firstValue(
        assessment?.checkerApprovedAmount,
        checkerPayload?.checkerApprovedAmount,
        checkerPayload?.approvedAmount,
        makerAmount,
        application?.requestedAmount,
        application?.loanAmount,
      ),
    ),

    checkerApprovedTenure: valueOrEmpty(
      firstValue(
        assessment?.checkerApprovedTenure,
        checkerPayload?.checkerApprovedTenure,
        checkerPayload?.approvedTenure,
        makerTenure,
        application?.tenure,
        application?.requestedTenure,
      ),
    ),

    checkerApprovedRoi: valueOrEmpty(
      firstValue(
        assessment?.checkerApprovedRoi,
        checkerPayload?.checkerApprovedRoi,
        checkerPayload?.approvedRoi,
        makerRoi,
        application?.roi,
        application?.interestRate,
      ),
    ),

    checkerRiskGrade: valueOrEmpty(
      firstValue(
        checkerPayload?.checkerRiskGrade,
        assessment?.checkerRiskGrade,
        assessment?.makerRiskGrade,
        makerPayload?.makerRiskGrade,
      ),
    ),

    checkerPolicyDecision: valueOrEmpty(
      firstValue(checkerPayload?.checkerPolicyDecision, ""),
    ),

    checkerCollateralView: valueOrEmpty(
      firstValue(checkerPayload?.checkerCollateralView, ""),
    ),

    checkerIncomeView: valueOrEmpty(
      firstValue(checkerPayload?.checkerIncomeView, ""),
    ),

    checkerBureauView: valueOrEmpty(
      firstValue(checkerPayload?.checkerBureauView, ""),
    ),

    checkerDeviationView: valueOrEmpty(
      firstValue(checkerPayload?.checkerDeviationView, ""),
    ),

    checkerRemarks: valueOrEmpty(
      firstValue(
        assessment?.checkerRemarks,
        checkerPayload?.checkerRemarks,
        checkerPayload?.remarks,
      ),
    ),

    checkerConditions: valueOrEmpty(
      firstValue(checkerPayload?.checkerConditions, checkerPayload?.conditions),
    ),
  };
};

const fetchCheckerCaseList = () => {
  if (typeof creditApi.checkerCases === "function") {
    return creditApi.checkerCases();
  }

  return creditApi.applications({
    page: 1,
    limit: 500,
  });
};

const fetchFullApplication = (applicationId) => {
  if (typeof creditApi.getApplication === "function") {
    return creditApi.getApplication(applicationId);
  }

  return creditApi.getCreditApplication(applicationId);
};

const isCheckerVisibleCase = (application) => {
  const stage = String(application?.stage || "").toUpperCase();
  const status = String(application?.status || "").toUpperCase();

  return (
    stage === "CREDIT" ||
    CHECKER_VISIBLE_STATUSES.includes(status)
  );
};

export default function CreditCheckerReview() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [hydratedKey, setHydratedKey] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState(defaultReview);

  const queryClient = useQueryClient();

  const checkerCasesQuery = useQuery({
    queryKey: ["credit-checker-cases"],
    queryFn: fetchCheckerCaseList,
    retry: false,
  });

  const checkerCases = useMemo(() => {
    const payload = unwrapPayload(checkerCasesQuery.data);
    return normalizeRows(payload).filter(isCheckerVisibleCase);
  }, [checkerCasesQuery.data]);

  const finalSelectedId =
    selectedId || routeApplicationId || checkerCases?.[0]?.id || "";

  const applicationQuery = useQuery({
    queryKey: ["credit-checker-full-application", finalSelectedId],
    queryFn: () => fetchFullApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const creditApplicationQuery = useQuery({
    queryKey: ["credit-checker-application-extra", finalSelectedId],
    queryFn: () => creditApi.getCreditApplication(finalSelectedId),
    enabled:
      Boolean(finalSelectedId) &&
      typeof creditApi.getCreditApplication === "function",
    retry: false,
  });

  const assessmentQuery = useQuery({
    queryKey: ["credit-assessment", finalSelectedId],
    queryFn: () => creditApi.getCreditAssessment(finalSelectedId),
    enabled:
      Boolean(finalSelectedId) &&
      typeof creditApi.getCreditAssessment === "function",
    retry: false,
  });

  const applicationPayload = unwrapPayload(applicationQuery.data);
  const creditApplicationPayload = unwrapPayload(creditApplicationQuery.data);
  const assessmentPayload = unwrapPayload(assessmentQuery.data);

  const applicationFromCommonApi = getApplicationObject(applicationPayload);
  const applicationFromCreditApi = getApplicationObject(creditApplicationPayload);

  const application = mergeApplication(
    applicationFromCommonApi,
    applicationFromCreditApi,
  );

  const creditAssessment = getCreditAssessmentObject(
    creditApplicationPayload,
    assessmentPayload,
  );

  const caseDetails = useMemo(() => {
    return buildCaseDetails(application, creditAssessment);
  }, [application, creditAssessment]);

  const hydrationKey = [
    finalSelectedId,
    applicationQuery.dataUpdatedAt,
    creditApplicationQuery.dataUpdatedAt,
    assessmentQuery.dataUpdatedAt,
  ].join("|");

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;
    if (hydratedKey === hydrationKey) return;

    setReview(buildReviewFromAssessment(application, creditAssessment, caseDetails));
    setHydratedKey(hydrationKey);
    setMessage("");
  }, [
    finalSelectedId,
    application?.id,
    creditAssessment?.id,
    caseDetails,
    hydratedKey,
    hydrationKey,
  ]);

  const updateReview = (field, value) => {
    setMessage("");
    setReview((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectedCaseText = application?.id
    ? `${caseDetails.customerName || ""} | ${caseDetails.mobile || ""} | ${
        caseDetails.pan || ""
      }`
    : "";

  const workflowSteps = useMemo(() => {
    return buildWorkflowSteps(application);
  }, [application]);

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
          customerName: caseDetails.customerName,
          mobile: caseDetails.mobile,
          email: caseDetails.email,
          pan: caseDetails.pan,
          aadhaar: caseDetails.aadhaar,
          occupationType: caseDetails.occupation,
          businessName: caseDetails.businessName,
          currentAddress: caseDetails.currentAddress,
          permanentAddress: caseDetails.permanentAddress,
        },
        application: {
          applicationNumber: caseDetails.applicationNumber,
          requestedAmount: caseDetails.requestedAmount,
          loanPurpose: caseDetails.loanPurpose,
          requestedTenure: caseDetails.requestedTenure,
          stage: caseDetails.stage,
          status: caseDetails.status,
        },
        property: {
          propertyCategory: caseDetails.propertyCategory,
          propertyType: caseDetails.propertyType,
          propertyValue: caseDetails.propertyValue,
          propertyAddress: caseDetails.propertyAddress,
          propertyCity: caseDetails.propertyCity,
          propertyState: caseDetails.propertyState,
          propertyPincode: caseDetails.propertyPincode,
          fullPropertyAddress: caseDetails.fullPropertyAddress,
        },
        cmAssessment: {
          cmDecision: caseDetails.cmDecision,
          cmRecommendedAmount: caseDetails.cmRecommendedAmount,
          cmRiskScore: caseDetails.cmRiskScore,
          cmRemarks: caseDetails.cmRemarks,
        },
        makerAssessment: {
          makerDecision: caseDetails.makerDecision,
          makerRecommendedAmount: caseDetails.makerRecommendedAmount,
          makerRecommendedRoi: caseDetails.makerRecommendedRoi,
          makerRecommendedTenure: caseDetails.makerRecommendedTenure,
          makerRiskGrade: caseDetails.makerRiskGrade,
          makerRemarks: caseDetails.makerRemarks,
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
          queryKey: ["credit-checker-full-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application-extra", finalSelectedId],
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
          queryKey: ["credit-checker-full-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application-extra", finalSelectedId],
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
          queryKey: ["credit-checker-full-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application-extra", finalSelectedId],
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

  const isLoadingSelected =
    Boolean(finalSelectedId) &&
    (applicationQuery.isLoading || creditApplicationQuery.isLoading);

  const scoreCards = [
    {
      label: "Requested Loan",
      value: formatCurrency(caseDetails.requestedAmount),
      icon: FaClipboardCheck,
    },
    {
      label: "Maker Amount",
      value: formatCurrency(caseDetails.makerRecommendedAmount),
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
                    {caseDetails.applicationNumber || "Select Credit Case"} ·
                    Review full customer, loan, property and maker proposal.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge value={`Stage: ${formatStatus(caseDetails.stage)}`} />
                    <Badge value={`Status: ${formatStatus(caseDetails.status)}`} />
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

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[520px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                disabled={checkerCasesQuery.isLoading || checkerCases.length === 0}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setHydratedKey("");
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
                        ID: {item.id} |{" "}
                        {item.applicationNumber || `APP-${item.id}`} -{" "}
                        {item.customerName || "No Name"} -{" "}
                        {formatStatus(item.status)}
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

        {isLoadingSelected && (
          <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm font-black text-slate-500 shadow-sm">
            Loading full application details...
          </div>
        )}

        {!finalSelectedId && (
          <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-slate-800">
              Select Credit Checker case
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Customer, address, loan, property and maker proposal details will load here.
            </p>
          </div>
        )}

        {finalSelectedId && !isLoadingSelected && (
          <>
            <WorkflowCard workflowSteps={workflowSteps} />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {scoreCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_430px]">
              <div className="space-y-6">
                <Panel
                  title="Lead Sourcing"
                  subtitle="Loaded from application data."
                  icon={FaClipboardCheck}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <DisplayBox label="Source Type" value={caseDetails.sourceType} />
                    <DisplayBox label="Hub" value={caseDetails.hub} />
                    <DisplayBox label="Spoke" value={caseDetails.spoke} />
                  </div>
                </Panel>

                <Panel
                  title="Primary Applicant"
                  subtitle="Customer details loaded like Application Data page."
                  icon={FaUserTie}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <DisplayBox label="Customer / Entity Name" value={caseDetails.customerName} />
                    <DisplayBox label="Mobile Number" value={caseDetails.mobile} />
                    <DisplayBox label="Email ID" value={caseDetails.email} />
                    <DisplayBox label="PAN Number" value={caseDetails.pan} />
                    <DisplayBox label="Aadhaar / OVD Masked" value={caseDetails.aadhaar} />
                    <DisplayBox label="Occupation / Constitution" value={caseDetails.occupation} />
                    <DisplayBox label="Employer / Business Name" value={caseDetails.businessName} />
                    <DisplayBox label="Employment / Business Vintage Years" value={caseDetails.businessVintage} />
                    <DisplayBox label="Verified Monthly Income" value={formatCurrency(caseDetails.verifiedIncome)} />
                    <DisplayBox label="Existing Monthly Obligations" value={formatCurrency(caseDetails.existingObligations)} />
                  </div>
                </Panel>

                <Panel
                  title="Address Details"
                  subtitle="Current, permanent and collateral address."
                  icon={FaHome}
                >
                  <ReadOnlyText
                    label="Current / Residence Address"
                    value={caseDetails.currentAddress}
                  />

                  <ReadOnlyText
                    label="Permanent Address"
                    value={caseDetails.permanentAddress}
                  />

                  <ReadOnlyText
                    label="Full Property Address"
                    value={caseDetails.fullPropertyAddress}
                  />
                </Panel>

                <Panel
                  title="Loan Requirement"
                  subtitle="Requested loan data from application."
                  icon={FaClipboardCheck}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <DisplayBox label="Application Number" value={caseDetails.applicationNumber} />
                    <DisplayBox label="Requested Loan Amount" value={formatCurrency(caseDetails.requestedAmount)} />
                    <DisplayBox label="Loan Purpose" value={caseDetails.loanPurpose} />
                    <DisplayBox label="Requested Tenure Months" value={caseDetails.requestedTenure} />
                    <DisplayBox label="Current Stage" value={formatStatus(caseDetails.stage)} />
                    <DisplayBox label="Current Status" value={formatStatus(caseDetails.status)} />
                  </div>
                </Panel>

                <Panel
                  title="Collateral Property"
                  subtitle="Property details used for credit and valuation."
                  icon={FaHome}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <DisplayBox label="Property Category" value={caseDetails.propertyCategory} />
                    <DisplayBox label="Property Type" value={caseDetails.propertyType} />
                    <DisplayBox label="Approximate Property Value" value={formatCurrency(caseDetails.propertyValue)} />
                    <DisplayBox label="City" value={caseDetails.propertyCity} />
                    <DisplayBox label="State" value={caseDetails.propertyState} />
                    <DisplayBox label="PIN Code" value={caseDetails.propertyPincode} />
                  </div>

                  <ReadOnlyText
                    label="Property Address"
                    value={caseDetails.propertyAddress}
                  />
                </Panel>

                <Panel
                  title="Indicative Eligibility & Bureau"
                  subtitle="Credit eligibility and bureau indicators."
                  icon={FaBalanceScale}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <DisplayBox label="FOIR" value={formatPercent(caseDetails.foir)} />
                    <DisplayBox label="Indicative LTV" value={formatPercent(caseDetails.indicativeLtv)} />
                    <DisplayBox label="Rule Version" value={caseDetails.ruleVersion} />
                    <DisplayBox label="Bureau Score" value={caseDetails.bureauScore} />
                    <DisplayBox label="Current DPD" value={caseDetails.currentDpd} />
                    <DisplayBox label="30+ DPD in 12M" value={caseDetails.dpd30In12m} />
                    <DisplayBox label="Recent Enquiries" value={caseDetails.recentEnquiries} />
                    <DisplayBox label="Written-off / Settled" value={caseDetails.writtenOffSettled} />
                    <DisplayBox label="Commercial Bureau" value={caseDetails.commercialBureau} />
                  </div>
                </Panel>

                <Panel
                  title="CM Screening Summary"
                  subtitle="Preliminary credit screening details saved by CM."
                  icon={FaBalanceScale}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <DisplayBox label="CM Decision" value={caseDetails.cmDecision} />
                    <DisplayBox label="CM Risk Score" value={caseDetails.cmRiskScore} />
                    <DisplayBox
                      label="CM Recommended Amount"
                      value={formatCurrency(caseDetails.cmRecommendedAmount)}
                    />
                    <DisplayBox label="CM Remarks Available" value={caseDetails.cmRemarks ? "Yes" : "No"} />
                  </div>

                  <ReadOnlyText label="CM Remarks" value={caseDetails.cmRemarks} />
                </Panel>

                <Panel
                  title="Credit Maker Proposal"
                  subtitle="Maker recommendation to be checked before approval."
                  icon={FaFileSignature}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <DisplayBox label="Maker Decision" value={caseDetails.makerDecision} />
                    <DisplayBox label="Maker Amount" value={formatCurrency(caseDetails.makerRecommendedAmount)} />
                    <DisplayBox label="Maker ROI" value={formatPercent(caseDetails.makerRecommendedRoi)} />
                    <DisplayBox
                      label="Maker Tenure"
                      value={
                        caseDetails.makerRecommendedTenure
                          ? `${caseDetails.makerRecommendedTenure} months`
                          : "—"
                      }
                    />
                    <DisplayBox label="Maker Risk Grade" value={caseDetails.makerRiskGrade} />
                    <DisplayBox label="Income Method" value={caseDetails.makerPayload?.incomeMethod} />
                    <DisplayBox label="Policy Result" value={caseDetails.makerPayload?.policyResult} />
                    <DisplayBox label="Fraud Risk" value={caseDetails.makerPayload?.fraudRisk} />
                  </div>

                  <ReadOnlyText
                    label="Borrower Assessment"
                    value={caseDetails.makerPayload?.borrowerAssessment}
                  />

                  <ReadOnlyText
                    label="Banking Assessment"
                    value={caseDetails.makerPayload?.bankingAssessment}
                  />

                  <ReadOnlyText
                    label="Property Assessment"
                    value={caseDetails.makerPayload?.propertyAssessment}
                  />

                  <ReadOnlyText
                    label="Risk / Mitigants"
                    value={caseDetails.makerPayload?.riskMitigants}
                  />

                  <ReadOnlyText
                    label="Maker Remarks"
                    value={caseDetails.makerRemarks}
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
                          { label: "Select", value: "" },
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
                          { label: "Select", value: "" },
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
                    Credit Checker can approve and send case to Valuation,
                    return case to Credit Maker, or reject the application.
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
          </>
        )}
      </div>
    </div>
  );
}

function WorkflowCard({ workflowSteps }) {
  return (
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
                <option key={option || "blank"} value={option}>
                  {option || "Select"}
                </option>
              );
            }

            return (
              <option key={option.value || "blank"} value={option.value}>
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