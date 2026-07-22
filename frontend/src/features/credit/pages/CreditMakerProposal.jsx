import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileSignature,
  FaHome,
  FaPaperPlane,
  FaPlus,
  FaQuestionCircle,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaTimes,
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

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.data)) return payload.data;
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

const calculateFoir = (income, obligations) => {
  const incomeNumber = numberValue(income);
  const obligationNumber = numberValue(obligations);

  if (incomeNumber <= 0) return "";

  return ((obligationNumber / incomeNumber) * 100).toFixed(2);
};

const calculateLtv = (loanAmount, propertyValue) => {
  const loan = numberValue(loanAmount);
  const property = numberValue(propertyValue);

  if (property <= 0) return "";

  return ((loan / property) * 100).toFixed(2);
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

const hasMemoData = (form) => {
  const memoFields = [
    "incomeMethod",
    "makerRecommendation",
    "policyResult",
    "dpdProfile",
    "businessVintage",
    "internalRiskGrade",
    "fraudRisk",
    "borrowerAssessment",
    "bankingAssessment",
    "propertyAssessment",
    "riskMitigants",
    "deviationJustification",
  ];

  return memoFields.some((field) => String(form?.[field] || "").trim() !== "");
};

const defaultMakerForm = {
  sourceType: "",
  hub: "",
  spoke: "",

  customerName: "",
  mobile: "",
  email: "",
  pan: "",
  aadhaar: "",
  occupationType: "",
  businessName: "",
  businessVintage: "",
  monthlyIncome: "",
  monthlyObligations: "",

  currentAddress: "",
  permanentAddress: "",
  fullPropertyAddress: "",

  applicationNumber: "",
  requestedAmount: "",
  loanPurpose: "",
  requestedTenure: "",
  stage: "",
  status: "",

  propertyCategory: "",
  propertyType: "",
  propertyAddress: "",
  propertyCity: "",
  propertyState: "",
  propertyPincode: "",
  assessedPropertyValue: "",

  verifiedIncome: "",
  existingObligations: "",
  foir: "",
  indicativeLtv: "",
  ruleVersion: "",

  bureauScore: "",
  currentDpd: "",
  dpd30In12m: "",
  writtenOffSettled: "",
  recentEnquiries: "",
  commercialBureau: "",

  incomeMethod: "",
  dpdProfile: "",
  internalRiskGrade: "",
  fraudRisk: "",
  policyResult: "",

  recommendedAmount: "",
  recommendedTenure: "",
  recommendedRoi: "",
  makerRiskGrade: "",
  makerRecommendation: "",

  borrowerAssessment: "",
  bankingAssessment: "",
  propertyAssessment: "",
  riskMitigants: "",
  deviationJustification: "",
  preDisbursementConditions: "",
  postDisbursementConditions: "",
  makerRemarks: "",
};

const buildInitialForm = (application, creditAssessment) => {
  const { profile } = getSourceObject(application);

  const makerPayload = parseJson(creditAssessment?.makerPayload, {});
  const customerSnapshot = makerPayload?.customerEditableSnapshot || {};
  const propertySnapshot = makerPayload?.propertyEditableSnapshot || {};
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

  const recommendedAmount = firstValue(
    makerPayload?.makerRecommendedAmount,
    makerPayload?.recommendedAmount,
    creditAssessment?.makerRecommendedAmount,
    creditAssessment?.cmRecommendedAmount,
  );

  const recommendationBaseAmount = firstValue(recommendedAmount, requestedAmount);

  const foir = firstValue(
    eligibilitySnapshot?.foir,
    creditAssessment?.foir,
    application?.foir,
    calculateFoir(verifiedIncome, existingObligations),
  );

  const indicativeLtv = firstValue(
    eligibilitySnapshot?.indicativeLtv,
    creditAssessment?.indicativeLtv,
    application?.ltv,
    application?.indicativeLtv,
    calculateLtv(recommendationBaseAmount, propertyValue),
  );

  return {
    ...defaultMakerForm,

    sourceType: valueOrEmpty(
      firstValue(application?.sourceType, application?.source, "Direct"),
    ),
    hub: valueOrEmpty(firstValue(application?.hub, application?.branch)),
    spoke: valueOrEmpty(application?.spoke),

    customerName: valueOrEmpty(getCustomerName(application, customerSnapshot)),

    mobile: valueOrEmpty(
      firstValue(
        customerSnapshot?.mobile,
        application?.mobile,
        application?.mobileNumber,
        profile?.mobile,
      ),
    ),

    email: valueOrEmpty(
      firstValue(
        customerSnapshot?.email,
        application?.email,
        application?.emailId,
        profile?.email,
      ),
    ),

    pan: valueOrEmpty(
      firstValue(
        customerSnapshot?.pan,
        application?.pan,
        application?.panNumber,
        profile?.panNumber,
      ),
    ),

    aadhaar: valueOrEmpty(
      firstValue(
        application?.aadhaarNumber,
        application?.aadharNumber,
        application?.ovdNumber,
        profile?.aadhaarNumber,
        profile?.aadharNumber,
        profile?.ovdNumber,
      ),
    ),

    occupationType: valueOrEmpty(
      firstValue(
        customerSnapshot?.occupationType,
        application?.occupationType,
        application?.occupation,
        application?.constitution,
        profile?.occupationType,
      ),
    ),

    businessName: valueOrEmpty(
      firstValue(
        customerSnapshot?.businessName,
        application?.businessName,
        profile?.businessName,
      ),
    ),

    businessVintage: valueOrEmpty(
      firstValue(
        makerPayload?.businessVintage,
        application?.businessVintage,
        application?.employmentVintage,
        application?.vintage,
        profile?.businessVintage,
      ),
    ),

    monthlyIncome: valueOrEmpty(
      firstValue(application?.monthlyIncome, application?.verifiedMonthlyIncome),
    ),

    monthlyObligations: valueOrEmpty(
      firstValue(
        application?.existingMonthlyObligations,
        application?.monthlyObligations,
      ),
    ),

    currentAddress: valueOrEmpty(
      firstValue(customerSnapshot?.currentAddress, address.currentAddress),
    ),

    permanentAddress: valueOrEmpty(
      firstValue(customerSnapshot?.permanentAddress, address.permanentAddress),
    ),

    fullPropertyAddress: valueOrEmpty(
      firstValue(propertySnapshot?.fullPropertyAddress, address.fullPropertyAddress),
    ),

    applicationNumber: valueOrEmpty(application?.applicationNumber),
    requestedAmount: valueOrEmpty(requestedAmount),
    loanPurpose: valueOrEmpty(firstValue(application?.loanPurpose, application?.purpose)),
    requestedTenure: valueOrEmpty(
      firstValue(application?.tenure, application?.requestedTenure),
    ),
    stage: valueOrEmpty(application?.stage),
    status: valueOrEmpty(application?.status),

    propertyCategory: valueOrEmpty(
      firstValue(
        propertySnapshot?.propertyCategory,
        application?.propertyCategory,
        profile?.propertyCategory,
      ),
    ),

    propertyType: valueOrEmpty(
      firstValue(
        propertySnapshot?.propertyType,
        application?.propertyType,
        application?.propertyCategory,
        profile?.propertyType,
        profile?.propertyCategory,
      ),
    ),

    propertyAddress: valueOrEmpty(
      firstValue(propertySnapshot?.propertyAddress, address.propertyAddress),
    ),

    propertyCity: valueOrEmpty(
      firstValue(propertySnapshot?.propertyCity, address.propertyCity),
    ),

    propertyState: valueOrEmpty(
      firstValue(propertySnapshot?.propertyState, address.propertyState),
    ),

    propertyPincode: valueOrEmpty(
      firstValue(propertySnapshot?.propertyPincode, address.propertyPincode),
    ),

    assessedPropertyValue: valueOrEmpty(propertyValue),

    verifiedIncome: valueOrEmpty(verifiedIncome),
    existingObligations: valueOrEmpty(existingObligations),
    foir: valueOrEmpty(foir),
    indicativeLtv: valueOrEmpty(indicativeLtv),
    ruleVersion: valueOrEmpty(
      firstValue(application?.ruleVersion, "LIP-POLICY-2026.06-v1"),
    ),

    bureauScore: valueOrEmpty(
      firstValue(
        bureauSnapshot?.bureauScore,
        creditAssessment?.bureauScore,
        application?.bureauScore,
        application?.cibilScore,
      ),
    ),

    currentDpd: valueOrEmpty(
      firstValue(
        bureauSnapshot?.currentDpd,
        creditAssessment?.currentDpd,
        application?.currentDpd,
        0,
      ),
    ),

    dpd30In12m: valueOrEmpty(
      firstValue(
        bureauSnapshot?.dpd30In12m,
        creditAssessment?.dpd30In12m,
        application?.dpd30In12m,
        0,
      ),
    ),

    writtenOffSettled: valueOrEmpty(
      firstValue(
        bureauSnapshot?.writtenOffSettled,
        creditAssessment?.writtenOffSettled,
        application?.writtenOffSettled,
      ),
    ),

    recentEnquiries: valueOrEmpty(
      firstValue(
        bureauSnapshot?.recentEnquiries,
        creditAssessment?.recentEnquiries,
        application?.recentEnquiries,
        0,
      ),
    ),

    commercialBureau: valueOrEmpty(
      firstValue(
        bureauSnapshot?.commercialBureau,
        creditAssessment?.commercialBureau,
        application?.commercialBureau,
      ),
    ),

    dpdProfile: valueOrEmpty(
      firstValue(bureauSnapshot?.dpdProfile, makerPayload?.dpdProfile),
    ),

    incomeMethod: valueOrEmpty(makerPayload?.incomeMethod),
    internalRiskGrade: valueOrEmpty(makerPayload?.internalRiskGrade),
    fraudRisk: valueOrEmpty(makerPayload?.fraudRisk),
    policyResult: valueOrEmpty(makerPayload?.policyResult),

    recommendedAmount: valueOrEmpty(recommendedAmount),

    recommendedTenure: valueOrEmpty(
      firstValue(
        makerPayload?.makerRecommendedTenure,
        makerPayload?.recommendedTenure,
        creditAssessment?.makerRecommendedTenure,
      ),
    ),

    recommendedRoi: valueOrEmpty(
      firstValue(
        makerPayload?.makerRecommendedRoi,
        makerPayload?.recommendedRoi,
        makerPayload?.roi,
        creditAssessment?.makerRecommendedRoi,
      ),
    ),

    makerRiskGrade: valueOrEmpty(
      firstValue(
        makerPayload?.makerRiskGrade,
        makerPayload?.riskGrade,
        creditAssessment?.makerRiskGrade,
      ),
    ),

    makerRecommendation: valueOrEmpty(makerPayload?.makerRecommendation),

    borrowerAssessment: valueOrEmpty(makerPayload?.borrowerAssessment),
    bankingAssessment: valueOrEmpty(makerPayload?.bankingAssessment),
    propertyAssessment: valueOrEmpty(makerPayload?.propertyAssessment),
    riskMitigants: valueOrEmpty(makerPayload?.riskMitigants),
    deviationJustification: valueOrEmpty(makerPayload?.deviationJustification),
    preDisbursementConditions: valueOrEmpty(
      makerPayload?.preDisbursementConditions,
    ),
    postDisbursementConditions: valueOrEmpty(
      makerPayload?.postDisbursementConditions,
    ),

    makerRemarks: valueOrEmpty(
      firstValue(
        makerPayload?.makerRemarks,
        makerPayload?.remarks,
        creditAssessment?.makerRemarks,
      ),
    ),
  };
};

const fetchMakerCaseList = () => {
  if (typeof creditApi.makerCases === "function") {
    return creditApi.makerCases();
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

export default function CreditMakerProposal() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [hydratedApplicationId, setHydratedApplicationId] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(defaultMakerForm);
  const [showCreditMemo, setShowCreditMemo] = useState(false);

  const queryClient = useQueryClient();

  const makerCasesQuery = useQuery({
    queryKey: ["credit-maker-cases"],
    queryFn: fetchMakerCaseList,
    retry: false,
  });

  const creditMakerCases = useMemo(() => {
    const payload = unwrapPayload(makerCasesQuery.data);
    return normalizeRows(payload);
  }, [makerCasesQuery.data]);

  const finalSelectedId =
    selectedId || routeApplicationId || creditMakerCases?.[0]?.id || "";

  const applicationQuery = useQuery({
    queryKey: ["credit-maker-full-application", finalSelectedId],
    queryFn: () => fetchFullApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const creditApplicationQuery = useQuery({
    queryKey: ["credit-maker-application-extra", finalSelectedId],
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

  const application = {
    ...applicationFromCreditApi,
    ...applicationFromCommonApi,
  };

  const creditAssessment = getCreditAssessmentObject(
    creditApplicationPayload,
    assessmentPayload,
  );

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;

    if (String(hydratedApplicationId) === String(finalSelectedId)) {
      return;
    }

    const nextForm = buildInitialForm(application, creditAssessment);

    setForm(nextForm);
    setShowCreditMemo(hasMemoData(nextForm));
    setHydratedApplicationId(String(finalSelectedId));
    setMessage("");
  }, [
    finalSelectedId,
    hydratedApplicationId,
    application?.id,
    creditAssessment?.id,
  ]);

  const updateForm = (field, value) => {
    setMessage("");

    setForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (field === "verifiedIncome" || field === "existingObligations") {
        updated.foir = calculateFoir(
          field === "verifiedIncome" ? value : updated.verifiedIncome,
          field === "existingObligations" ? value : updated.existingObligations,
        );
      }

      if (
        field === "recommendedAmount" ||
        field === "assessedPropertyValue" ||
        field === "requestedAmount"
      ) {
        updated.indicativeLtv = calculateLtv(
          field === "recommendedAmount"
            ? value
            : updated.recommendedAmount || updated.requestedAmount,
          field === "assessedPropertyValue"
            ? value
            : updated.assessedPropertyValue,
        );
      }

      return updated;
    });
  };

  const updateAddressField = (field, value) => {
    setMessage("");

    setForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (
        field === "propertyAddress" ||
        field === "propertyCity" ||
        field === "propertyState" ||
        field === "propertyPincode"
      ) {
        updated.fullPropertyAddress = joinAddress(
          field === "propertyAddress" ? value : updated.propertyAddress,
          field === "propertyCity" ? value : updated.propertyCity,
          field === "propertyState" ? value : updated.propertyState,
          field === "propertyPincode" ? value : updated.propertyPincode,
        );
      }

      return updated;
    });
  };

  const resetCreditMemo = () => {
    setForm((previous) => ({
      ...previous,
      incomeMethod: "",
      makerRecommendation: "",
      policyResult: "",
      dpdProfile: "",
      businessVintage: "",
      internalRiskGrade: "",
      fraudRisk: "",
      borrowerAssessment: "",
      bankingAssessment: "",
      propertyAssessment: "",
      riskMitigants: "",
      deviationJustification: "",
    }));

    setShowCreditMemo(false);
  };

  const selectedCaseText = application?.id
    ? `${application?.customerName || form.customerName || ""} | ${
        application?.mobile || form.mobile || ""
      } | ${application?.pan || form.pan || ""}`
    : "";

  const workflowSteps = useMemo(() => {
    return buildWorkflowSteps(application);
  }, [application]);

  const buildPayload = (actionType) => {
    const decision =
      actionType === "QUERY"
        ? "HOLD_QUERY"
        : form.makerRecommendation === "Not Recommended"
          ? "REJECT"
          : "RECOMMEND";

    return {
      actionType,
      decision,
      makerDecision: decision,

      customerEditableSnapshot: {
        customerName: form.customerName,
        mobile: form.mobile,
        email: form.email,
        pan: form.pan,
        occupationType: form.occupationType,
        businessName: form.businessName,
        currentAddress: form.currentAddress,
        permanentAddress: form.permanentAddress,
      },

      propertyEditableSnapshot: {
        propertyCategory: form.propertyCategory,
        propertyType: form.propertyType,
        propertyAddress: form.propertyAddress,
        propertyCity: form.propertyCity,
        propertyState: form.propertyState,
        propertyPincode: form.propertyPincode,
        fullPropertyAddress: form.fullPropertyAddress,
        assessedPropertyValue: numberValue(form.assessedPropertyValue),
      },

      eligibilitySnapshot: {
        verifiedIncome: numberValue(form.verifiedIncome),
        existingObligations: numberValue(form.existingObligations),
        foir: numberValue(form.foir),
        indicativeLtv: numberValue(form.indicativeLtv),
        requestedAmount: numberValue(form.requestedAmount),
      },

      bureauSnapshot: {
        bureauScore: numberValue(form.bureauScore),
        currentDpd: numberValue(form.currentDpd),
        dpd30In12m: numberValue(form.dpd30In12m),
        writtenOffSettled: form.writtenOffSettled,
        recentEnquiries: numberValue(form.recentEnquiries),
        commercialBureau: form.commercialBureau,
        dpdProfile: form.dpdProfile,
      },

      requestedLoan: numberValue(form.requestedAmount),
      recommendedAmount: numberValue(form.recommendedAmount),
      makerRecommendedAmount: numberValue(form.recommendedAmount),

      recommendedRoi: numberValue(form.recommendedRoi),
      makerRecommendedRoi: numberValue(form.recommendedRoi),
      roi: numberValue(form.recommendedRoi),

      recommendedTenure: numberValue(form.recommendedTenure),
      makerRecommendedTenure: numberValue(form.recommendedTenure),
      tenure: numberValue(form.recommendedTenure),

      riskGrade: form.makerRiskGrade,
      makerRiskGrade: form.makerRiskGrade,

      creditMemoEnabled: showCreditMemo,

      incomeMethod: showCreditMemo ? form.incomeMethod : "",
      policyResult: showCreditMemo ? form.policyResult : "",
      fraudRisk: showCreditMemo ? form.fraudRisk : "",
      internalRiskGrade: showCreditMemo ? form.internalRiskGrade : "",
      businessVintage: showCreditMemo ? form.businessVintage : "",
      borrowerAssessment: showCreditMemo ? form.borrowerAssessment : "",
      bankingAssessment: showCreditMemo ? form.bankingAssessment : "",
      propertyAssessment: showCreditMemo ? form.propertyAssessment : "",
      riskMitigants: showCreditMemo ? form.riskMitigants : "",
      deviationJustification: showCreditMemo
        ? form.deviationJustification
        : "",

      preDisbursementConditions: form.preDisbursementConditions,
      postDisbursementConditions: form.postDisbursementConditions,

      makerRecommendation: form.makerRecommendation,
      makerRemarks: form.makerRemarks,
      remarks:
        actionType === "QUERY"
          ? form.deviationJustification || form.makerRemarks
          : form.makerRemarks,
    };
  };

  const validateBeforeAction = (actionType) => {
    if (!finalSelectedId) {
      setMessage("Please select Credit Maker case first.");
      return false;
    }

    if (actionType === "SUBMIT") {
      const errors = [];

      if (!form.recommendedAmount) errors.push("Recommended Amount");
      if (!form.recommendedTenure) errors.push("Recommended Tenure");
      if (!form.recommendedRoi) errors.push("Recommended ROI");
      if (!form.makerRiskGrade) errors.push("Risk Grade");
      if (!form.makerRemarks) errors.push("Maker Remarks");

      if (errors.length) {
        setMessage(`Please fill required fields: ${errors.join(", ")}.`);
        return false;
      }
    }

    return true;
  };

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerSaveDraft(
        finalSelectedId,
        buildPayload("DRAFT"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Credit Maker draft saved successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-full-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application-extra", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save Credit Maker draft.",
      );
    },
  });

  const raiseQueryMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerRaiseQuery(
        finalSelectedId,
        buildPayload("QUERY"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Credit Maker query raised successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-full-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application-extra", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to raise Credit Maker query.",
      );
    },
  });

  const submitToCheckerMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerSubmitToChecker(
        finalSelectedId,
        buildPayload("SUBMIT"),
      ),

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
          queryKey: ["credit-assessment", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-full-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application-extra", finalSelectedId],
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
          "Unable to submit case to Credit Checker.",
      );
    },
  });

  const handleSaveDraft = () => {
    if (!validateBeforeAction("DRAFT")) return;
    saveDraftMutation.mutate();
  };

  const handleRaiseQuery = () => {
    if (!validateBeforeAction("QUERY")) return;
    raiseQueryMutation.mutate();
  };

  const handleSubmitToChecker = () => {
    if (!validateBeforeAction("SUBMIT")) return;
    submitToCheckerMutation.mutate();
  };

  const submitting =
    saveDraftMutation.isPending ||
    raiseQueryMutation.isPending ||
    submitToCheckerMutation.isPending;

  const isLoadingSelected =
    Boolean(finalSelectedId) &&
    (applicationQuery.isLoading || creditApplicationQuery.isLoading);

  const scoreCards = [
    {
      label: "Requested Loan",
      value: formatCurrency(form.requestedAmount),
      icon: FaClipboardCheck,
    },
    {
      label: "Recommended",
      value: formatCurrency(form.recommendedAmount),
      icon: FaCheckCircle,
    },
    {
      label: "FOIR",
      value: formatPercent(form.foir),
      icon: FaChartLine,
    },
    {
      label: "LTV",
      value: formatPercent(form.indicativeLtv),
      icon: FaShieldAlt,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#0f2942] via-[#2563eb] to-[#22c7c7] p-7 text-white">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-300/20" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl shadow-inner backdrop-blur-md">
                  <FaUserTie />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    Credit Maker Workspace
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-white/90">
                    {form.applicationNumber || "Select Credit Case"} · View
                    application data, edit credit fields and submit maker
                    recommendation.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge value={`Stage: ${formatStatus(form.stage)}`} />
                    <Badge value={`Status: ${formatStatus(form.status)}`} />
                    <Badge
                      value={`Assessment: ${
                        creditAssessment?.assessmentStatus || "New Draft"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton
                  variant="ghost"
                  disabled={submitting}
                  icon={FaSave}
                  onClick={handleSaveDraft}
                >
                  {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                </ActionButton>

                <ActionButton
                  variant="white"
                  disabled={submitting}
                  icon={FaQuestionCircle}
                  onClick={handleRaiseQuery}
                >
                  Raise Query
                </ActionButton>

                <ActionButton
                  variant="white"
                  disabled={submitting}
                  icon={FaPaperPlane}
                  onClick={handleSubmitToChecker}
                >
                  {submitToCheckerMutation.isPending
                    ? "Submitting..."
                    : "Submit to Checker"}
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[520px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                disabled={
                  makerCasesQuery.isLoading || creditMakerCases.length === 0
                }
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setHydratedApplicationId("");
                  setShowCreditMemo(false);
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-extrabold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {makerCasesQuery.isLoading ? (
                  <option value="">Loading Credit Maker cases...</option>
                ) : creditMakerCases.length === 0 ? (
                  <option value="">No Credit Maker cases available</option>
                ) : (
                  <>
                    <option value="">Select Credit Maker Case</option>
                    {creditMakerCases.map((item) => (
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
            Loading full application data...
          </div>
        )}

        {!finalSelectedId && (
          <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-slate-800">
              Select Credit Maker case
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Customer, loan, address and collateral data will load like
              Application Data page.
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <Panel
                  title="Lead Sourcing"
                  subtitle="Loaded from application data."
                  icon={FaClipboardCheck}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field
                      label="Source Type"
                      value={form.sourceType}
                      onChange={(value) => updateForm("sourceType", value)}
                    />

                    <Field
                      label="Hub"
                      value={form.hub}
                      onChange={(value) => updateForm("hub", value)}
                    />

                    <Field
                      label="Spoke"
                      value={form.spoke}
                      onChange={(value) => updateForm("spoke", value)}
                    />
                  </div>
                </Panel>

                <Panel
                  title="Primary Applicant"
                  subtitle="Loaded from application, applicant, borrower and customer profile."
                  icon={FaUserTie}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field
                      label="Customer / Entity Name"
                      value={form.customerName}
                      onChange={(value) => updateForm("customerName", value)}
                    />

                    <Field
                      label="Mobile Number"
                      value={form.mobile}
                      onChange={(value) => updateForm("mobile", value)}
                    />

                    <Field
                      label="Email ID"
                      value={form.email}
                      onChange={(value) => updateForm("email", value)}
                    />

                    <Field
                      label="PAN Number"
                      value={form.pan}
                      onChange={(value) =>
                        updateForm("pan", value.toUpperCase())
                      }
                    />

                    <Field
                      label="Aadhaar / OVD Masked"
                      value={form.aadhaar}
                      onChange={(value) => updateForm("aadhaar", value)}
                    />

                    <Field
                      label="Occupation / Constitution"
                      value={form.occupationType}
                      onChange={(value) =>
                        updateForm("occupationType", value)
                      }
                    />

                    <Field
                      label="Employer / Business Name"
                      value={form.businessName}
                      onChange={(value) => updateForm("businessName", value)}
                    />

                    <Field
                      label="Employment / Business Vintage Years"
                      value={form.businessVintage}
                      onChange={(value) =>
                        updateForm("businessVintage", value)
                      }
                    />

                    <Field
                      label="Verified Monthly Income"
                      type="number"
                      value={form.verifiedIncome || form.monthlyIncome}
                      onChange={(value) => updateForm("verifiedIncome", value)}
                    />

                    <Field
                      label="Existing Monthly Obligations"
                      type="number"
                      value={form.existingObligations || form.monthlyObligations}
                      onChange={(value) =>
                        updateForm("existingObligations", value)
                      }
                    />
                  </div>
                </Panel>

                {/* <Panel
                  title="Address Details"
                  subtitle="Same address fallback logic as Application Data page with additional profile/applicant fallback."
                  icon={FaHome}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextArea
                      label="Current / Residence Address"
                      rows={3}
                      value={form.currentAddress}
                      onChange={(value) =>
                        updateForm("currentAddress", value)
                      }
                    />

                    <TextArea
                      label="Permanent Address"
                      rows={3}
                      value={form.permanentAddress}
                      onChange={(value) =>
                        updateForm("permanentAddress", value)
                      }
                    />
                  </div>

                  <TextArea
                    label="Full Property Address"
                    rows={3}
                    value={form.fullPropertyAddress}
                    onChange={(value) =>
                      updateForm("fullPropertyAddress", value)
                    }
                  />
                </Panel> */}

                <Panel
                  title="Loan Requirement"
                  subtitle="Requested loan details loaded from application data."
                  icon={FaClipboardCheck}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field
                      label="Requested Loan Amount"
                      type="number"
                      value={form.requestedAmount}
                      onChange={(value) =>
                        updateForm("requestedAmount", value)
                      }
                    />

                    <Field
                      label="Loan Purpose"
                      value={form.loanPurpose}
                      onChange={(value) => updateForm("loanPurpose", value)}
                    />

                    <Field
                      label="Requested Tenure Months"
                      type="number"
                      value={form.requestedTenure}
                      onChange={(value) =>
                        updateForm("requestedTenure", value)
                      }
                    />
                  </div>
                </Panel>

                <Panel
                  title="Collateral Property"
                  subtitle="Property details and valuation amount used for LTV."
                  icon={FaHome}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field
                      label="Property Category"
                      value={form.propertyCategory}
                      onChange={(value) =>
                        updateForm("propertyCategory", value)
                      }
                    />

                    <Field
                      label="Property Type"
                      value={form.propertyType}
                      onChange={(value) => updateForm("propertyType", value)}
                    />

                    <Field
                      label="Approximate Property Value"
                      type="number"
                      value={form.assessedPropertyValue}
                      onChange={(value) =>
                        updateForm("assessedPropertyValue", value)
                      }
                    />

                    <Field
                      label="City"
                      value={form.propertyCity}
                      onChange={(value) =>
                        updateAddressField("propertyCity", value)
                      }
                    />

                    <Field
                      label="State"
                      value={form.propertyState}
                      onChange={(value) =>
                        updateAddressField("propertyState", value)
                      }
                    />

                    <Field
                      label="PIN Code"
                      value={form.propertyPincode}
                      onChange={(value) =>
                        updateAddressField("propertyPincode", value)
                      }
                    />
                  </div>

                  <TextArea
                    label="Property Address"
                    rows={3}
                    value={form.propertyAddress}
                    onChange={(value) =>
                      updateAddressField("propertyAddress", value)
                    }
                  />
                </Panel>

                <Panel
                  title="Indicative Eligibility & Bureau"
                  subtitle="Credit Maker can edit underwriting numbers before submitting to checker."
                  icon={FaChartLine}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Field
                      label="FOIR %"
                      type="number"
                      value={form.foir}
                      onChange={(value) => updateForm("foir", value)}
                    />

                    <Field
                      label="Indicative LTV %"
                      type="number"
                      value={form.indicativeLtv}
                      onChange={(value) =>
                        updateForm("indicativeLtv", value)
                      }
                    />

                    <Field
                      label="Rule Version"
                      value={form.ruleVersion}
                      onChange={(value) => updateForm("ruleVersion", value)}
                    />

                    <Field
                      label="Bureau Score"
                      type="number"
                      value={form.bureauScore}
                      onChange={(value) => updateForm("bureauScore", value)}
                    />

                    <Field
                      label="Current DPD"
                      type="number"
                      value={form.currentDpd}
                      onChange={(value) => updateForm("currentDpd", value)}
                    />

                    <Field
                      label="30+ DPD in 12M"
                      type="number"
                      value={form.dpd30In12m}
                      onChange={(value) => updateForm("dpd30In12m", value)}
                    />

                    <Field
                      label="Recent Enquiries"
                      type="number"
                      value={form.recentEnquiries}
                      onChange={(value) =>
                        updateForm("recentEnquiries", value)
                      }
                    />

                    <SelectField
                      label="Written-off / Settled"
                      value={form.writtenOffSettled}
                      options={[
                        "",
                        "None",
                        "Settled",
                        "Written-off",
                        "Suit Filed",
                      ]}
                      onChange={(value) =>
                        updateForm("writtenOffSettled", value)
                      }
                    />

                    <SelectField
                      label="Commercial Bureau"
                      value={form.commercialBureau}
                      options={[
                        "",
                        "Satisfactory",
                        "Average",
                        "Negative",
                        "Not Available",
                      ]}
                      onChange={(value) =>
                        updateForm("commercialBureau", value)
                      }
                    />
                  </div>
                </Panel>

                {!showCreditMemo ? (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FaFileSignature />
                    </div>

                    <h3 className="mt-3 text-sm font-black uppercase tracking-wide text-[#0f2942]">
                      Credit Memo Hidden
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-relaxed text-slate-500">
                      Memo fields are not auto-filled. Click Add Credit Memo
                      only when Credit Maker wants to write the detailed
                      assessment.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowCreditMemo(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition-all hover:bg-blue-700"
                    >
                      <FaPlus size={12} />
                      Add Credit Memo
                    </button>
                  </div>
                ) : (
                  <Panel
                    title="Maker Credit Memo"
                    subtitle="Detailed memo opened manually. No default memo text is inserted."
                    icon={FaFileSignature}
                  >
                    <div className="mb-4 flex justify-end">
                      <button
                        type="button"
                        onClick={resetCreditMemo}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 transition-all hover:bg-slate-100"
                      >
                        <FaTimes size={11} />
                        Hide Memo
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <SelectField
                        label="Income Assessment Method"
                        value={form.incomeMethod}
                        options={[
                          "",
                          "Banking + ITR",
                          "Banking",
                          "ITR",
                          "GST",
                          "Manual Assessment",
                        ]}
                        onChange={(value) =>
                          updateForm("incomeMethod", value)
                        }
                      />

                      <SelectField
                        label="Maker Recommendation"
                        value={form.makerRecommendation}
                        options={[
                          "",
                          "Approve Subject to Legal & Valuation",
                          "Recommend with Conditions",
                          "Raise Query",
                          "Not Recommended",
                        ]}
                        onChange={(value) =>
                          updateForm("makerRecommendation", value)
                        }
                      />

                      <SelectField
                        label="Policy Result"
                        value={form.policyResult}
                        options={[
                          "",
                          "Pass",
                          "Conditional Pass",
                          "Deviation",
                          "Fail",
                        ]}
                        onChange={(value) =>
                          updateForm("policyResult", value)
                        }
                      />

                      <SelectField
                        label="DPD Profile"
                        value={form.dpdProfile}
                        options={[
                          "",
                          "Clean",
                          "Minor Delay",
                          "Moderate Risk",
                          "High Risk",
                        ]}
                        onChange={(value) =>
                          updateForm("dpdProfile", value)
                        }
                      />

                      <SelectField
                        label="Internal Risk Grade"
                        value={form.internalRiskGrade}
                        options={[
                          "",
                          "A1",
                          "A2",
                          "A3",
                          "B1",
                          "B2",
                          "C1",
                          "C2",
                          "High Risk",
                        ]}
                        onChange={(value) =>
                          updateForm("internalRiskGrade", value)
                        }
                      />

                      <SelectField
                        label="Fraud Risk"
                        value={form.fraudRisk}
                        options={["", "Low", "Medium", "High"]}
                        onChange={(value) => updateForm("fraudRisk", value)}
                      />
                    </div>

                    <TextArea
                      label="Borrower & Business Assessment"
                      value={form.borrowerAssessment}
                      onChange={(value) =>
                        updateForm("borrowerAssessment", value)
                      }
                    />

                    <TextArea
                      label="Banking / Cash Flow Assessment"
                      value={form.bankingAssessment}
                      onChange={(value) =>
                        updateForm("bankingAssessment", value)
                      }
                    />

                    <TextArea
                      label="Property / Collateral Assessment"
                      value={form.propertyAssessment}
                      onChange={(value) =>
                        updateForm("propertyAssessment", value)
                      }
                    />

                    <TextArea
                      label="Risk, Mitigants & Conditions"
                      value={form.riskMitigants}
                      onChange={(value) =>
                        updateForm("riskMitigants", value)
                      }
                    />

                    <TextArea
                      label="Deviation Justification / Query Remarks"
                      value={form.deviationJustification}
                      onChange={(value) =>
                        updateForm("deviationJustification", value)
                      }
                    />
                  </Panel>
                )}
              </div>

              <div className="space-y-6">
                <div className="sticky top-6 space-y-6">
                  <Panel
                    title="Recommendation"
                    subtitle="Required before submit to checker."
                    icon={FaClipboardCheck}
                  >
                    <div className="space-y-4">
                      <Field
                        label="Requested Amount"
                        type="number"
                        value={form.requestedAmount}
                        onChange={(value) =>
                          updateForm("requestedAmount", value)
                        }
                      />

                      <Field
                        label="Recommended Amount *"
                        type="number"
                        value={form.recommendedAmount}
                        onChange={(value) =>
                          updateForm("recommendedAmount", value)
                        }
                      />

                      <Field
                        label="Recommended Tenure Months *"
                        type="number"
                        value={form.recommendedTenure}
                        onChange={(value) =>
                          updateForm("recommendedTenure", value)
                        }
                      />

                      <Field
                        label="Recommended ROI % *"
                        type="number"
                        value={form.recommendedRoi}
                        onChange={(value) =>
                          updateForm("recommendedRoi", value)
                        }
                      />

                      <SelectField
                        label="Maker Risk Grade *"
                        value={form.makerRiskGrade}
                        options={[
                          "",
                          "A1",
                          "A2",
                          "A3",
                          "B1",
                          "B2",
                          "C1",
                          "C2",
                          "High Risk",
                        ]}
                        onChange={(value) =>
                          updateForm("makerRiskGrade", value)
                        }
                      />

                      <TextArea
                        label="Final Maker Remarks *"
                        rows={5}
                        value={form.makerRemarks}
                        onChange={(value) =>
                          updateForm("makerRemarks", value)
                        }
                      />
                    </div>
                  </Panel>

                  <Panel
                    title="Conditions"
                    subtitle="Capture disbursement and monitoring conditions."
                    icon={FaShieldAlt}
                  >
                    <TextArea
                      label="Pre-disbursement Conditions"
                      rows={4}
                      value={form.preDisbursementConditions}
                      onChange={(value) =>
                        updateForm("preDisbursementConditions", value)
                      }
                    />

                    <TextArea
                      label="Post-disbursement Conditions"
                      rows={4}
                      value={form.postDisbursementConditions}
                      onChange={(value) =>
                        updateForm("postDisbursementConditions", value)
                      }
                    />
                  </Panel>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
                    <div className="mb-2 flex items-center gap-2 text-sm font-black">
                      <FaExclamationTriangle />
                      Maker Control
                    </div>
                    Credit Maker can prepare assessment, raise query and submit
                    to checker. Final approval must be done by Credit Checker.
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSaveDraft}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                    >
                      Save Draft
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleRaiseQuery}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                    >
                      Raise Query
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitToChecker}
                      className="rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#183d62] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {submitToCheckerMutation.isPending
                        ? "Submitting..."
                        : "Submit to Credit Checker"}
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
    variant === "ghost"
      ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
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
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
          {options.map((option) => (
            <option key={option || "blank"} value={option}>
              {option || "Select"}
            </option>
          ))}
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