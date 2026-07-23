
import { useCallback ,useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBan,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaHistory,
  FaKey,
  FaLandmark,
  FaLock,
  FaMoneyCheckAlt,
  FaPaperPlane,
  FaPrint,
  FaRoute,
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaUndo,
  FaUniversity,
  FaUserTie,
} from "react-icons/fa";

import {
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { operationApi } from "../operationApi.js";
const workflowSteps = [
  { id: 1, label: "Lead", state: "completed" },
  { id: 2, label: "Verification", state: "completed" },
  { id: 3, label: "Credit", state: "completed" },
  { id: 4, label: "Legal", state: "completed" },
  { id: 5, label: "Sanction", state: "completed" },
  { id: 6, label: "Operations", state: "current" },
  { id: 7, label: "Disbursement", state: "pending" },
];


const initialVerificationItems = [
  {
    id: 1,
    title: "KYC verified",
    description: "PAN and Aadhaar verification completed",
    checked: true,
    required: true,
  },
  {
    id: 2,
    title: "Bureau and credit approval valid",
    description: "Credit approval remains within validity period",
    checked: true,
    required: true,
  },
  {
    id: 3,
    title: "Legal positive / conditions tracked",
    description: "Legal conditions reviewed against sanction terms",
    checked: true,
    required: true,
  },
  {
    id: 4,
    title: "Valuation positive and value accepted",
    description: "Property valuation accepted by credit",
    checked: true,
    required: true,
  },
  {
    id: 5,
    title: "KFS and sanction accepted",
    description: "Borrower acceptance is available",
    checked: true,
    required: true,
  },
  {
    id: 6,
    title: "Loan agreement signed and stamped",
    description: "Executed agreement copy verified",
    checked: true,
    required: true,
  },
  {
    id: 7,
    title: "Mortgage / MODT completed",
    description: "Registration evidence verified",
    checked: true,
    required: true,
  },
  {
    id: 8,
    title: "Original document inventory received",
    description: "Original property documents acknowledged",
    checked: true,
    required: true,
  },
  {
    id: 9,
    title: "NACH / mandate registered",
    description: "Mandate registration status confirmed",
    checked: true,
    required: true,
  },
  {
    id: 10,
    title: "Beneficiary bank account verified",
    description: "Penny drop and beneficiary name validated",
    checked: true,
    required: true,
  },
  {
    id: 11,
    title: "AML / sanctions checks valid",
    description: "Independent checker confirmation required",
    checked: false,
    required: true,
  },
  {
    id: 12,
    title: "Maker instruction independently verified",
    description: "Amounts and beneficiary details matched",
    checked: false,
    required: true,
  },
];


const checklistGroups = [
  {
    id: "kyc",
    title: "KYC & Compliance",
    description: "PAN, Aadhaar, KFS and AML checks",
    itemIds: [1, 5, 11],
    icon: FaShieldAlt,
  },
  {
    id: "credit",
    title: "Credit & Legal",
    description: "Bureau, legal and valuation controls",
    itemIds: [2, 3, 4],
    icon: FaLandmark,
  },
  {
    id: "documents",
    title: "Documents & Mandate",
    description: "Agreement, MODT, inventory and mandate",
    itemIds: [6, 7, 8, 9],
    icon: FaFileAlt,
  },
  {
    id: "bank",
    title: "Bank & Maker Instruction",
    description: "Bank verification and maker instruction",
    itemIds: [10, 12],
    icon: FaUniversity,
  },
];

const unwrapApiResponse = (response) => {
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    null
  );
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const charges = [
  {
    label: "Processing Fee",
    amount: "₹34,810",
    status: "Collected",
  },
  {
    label: "Documentation Fee",
    amount: "₹4,130",
    status: "Collected",
  },
  {
    label: "Stamp Duty / eStamp",
    amount: "₹8,000",
    status: "Collected",
  },
  {
    label: "MODT / Mortgage Registration",
    amount: "₹8,000",
    status: "Collected",
  },
  {
    label: "CERSAI Registration",
    amount: "₹590",
    status: "Collected",
  },
  {
    label: "NACH / eMandate Setup",
    amount: "₹354",
    status: "Collected",
  },
  {
    label: "Broken Period Interest",
    amount: "₹26,082",
    status: "Collected",
  },
];



const progressWidthClasses = {
  0: "w-0",
  1: "w-[8%]",
  2: "w-[17%]",
  3: "w-1/4",
  4: "w-1/3",
  5: "w-[42%]",
  6: "w-1/2",
  7: "w-[58%]",
  8: "w-2/3",
  9: "w-3/4",
  10: "w-[83%]",
  11: "w-[92%]",
  12: "w-full",
};

function SectionHeading({ eyebrow, title, rightContent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#1c365f] sm:text-xl">
          {title}
        </h2>

        <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
      </div>

      {rightContent}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
  valueClass = "text-[#31476d]",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold text-slate-600">
        {label}
      </span>

      <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
        {Icon && (
          <Icon className="shrink-0 text-slate-400" size={15} />
        )}

        <span
          className={`min-w-0 flex-1 truncate text-sm font-semibold ${valueClass}`}
        >
          {value}
        </span>

        <FaLock className="shrink-0 text-slate-300" size={11} />
      </div>
    </label>
  );
}

function InfoRow({ label, value, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,1fr)] items-start gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <span className="text-xs font-medium leading-5 text-slate-500">
        {label}
      </span>

      {children || (
        <strong className="text-right text-xs font-extrabold leading-5 text-[#243f6d]">
          {value}
        </strong>
      )}
    </div>
  );
}

export default function OpsChecker() {
  // const workflowRef = useRef(null);
  const [expandedChecklistGroups, setExpandedChecklistGroups] = useState([]);
  const [verificationItems, setVerificationItems] = useState(
    initialVerificationItems,
  );

  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [checkerRemarks, setCheckerRemarks] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [pageStatus, setPageStatus] = useState("Awaiting checker");
  const [toastMessage, setToastMessage] = useState("");

  const [decisionSubmitting, setDecisionSubmitting] =
  useState(false);

  const verifiedCount = useMemo(
    () => verificationItems.filter((item) => item.checked).length,
    [verificationItems],
  );

  const [documents, setDocuments] = useState([]);
const [documentsLoading, setDocumentsLoading] =
  useState(false);
const [documentsError, setDocumentsError] =
  useState("");


  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const applicationId =
    params.applicationId ||
    location.state?.applicationId ||
    searchParams.get("applicationId");

    const fetchApplicationDocuments =
      useCallback(async () => {
        const normalizedApplicationId =
          Number(applicationId);
    
        if (
          !Number.isInteger(
            normalizedApplicationId,
          ) ||
          normalizedApplicationId <= 0
        ) {
          setDocuments([]);
          setDocumentsError(
            "Valid application ID is required.",
          );
          return;
        }
    
        try {
          setDocumentsLoading(true);
          setDocumentsError("");
    
          const response =
            await  operationApi.getApplicationDocuments(
              normalizedApplicationId,
            );
    
          /*
            Possible response formats:
    
            1. Service:
            {
              data: [...],
              message: "Documents fetched successfully"
            }
    
            2. Global response wrapper:
            {
              success: true,
              data: {
                data: [...],
                message: "Documents fetched successfully"
              }
            }
          */
    
          const payload =
            response?.data?.data ??
            response?.data ??
            {};
    
          const documentRows = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
    
          setDocuments(documentRows);
        } catch (error) {
          console.error(
            "Failed to fetch application documents:",
            error,
          );
    
          const message =
            error?.response?.data?.message ??
            error?.message ??
            "Unable to fetch application documents.";
    
          setDocumentsError(
            Array.isArray(message)
              ? message.join(", ")
              : String(message),
          );
    
          setDocuments([]);
        } finally {
          setDocumentsLoading(false);
        }
      }, [applicationId]);
    
    
    useEffect(() => {
      fetchApplicationDocuments();
    }, [fetchApplicationDocuments]);
    

  const [caseData, setCaseData] = useState(null);
  const [caseLoading, setCaseLoading] = useState(true);
  const [caseError, setCaseError] = useState("");
  const requiredItemsVerified = useMemo(
    () =>
      verificationItems
        .filter((item) => item.required)
        .every((item) => item.checked),
    [verificationItems],
  );

  const approvalReady =
    requiredItemsVerified && declarationAccepted;

    const customerLoanDetails = useMemo(
  () => [
    {
      label: "Customer Name",
      value:
        caseData?.customer?.name ||
        caseData?.customerName ||
        "-",
    },
    {
      label: "Application No.",
      value:
        caseData?.application
          ?.applicationNumber ||
        caseData?.applicationNumber ||
        "-",
    },
    {
      label: "LAN",
      value:
        caseData?.disbursement?.lan ||
        caseData?.lan ||
        "Pending booking",
    },
    {
      label: "Product",
      value:
        caseData?.application?.product ||
        caseData?.product ||
        "Loan Against Property",
    },
    {
      label: "Property Type",
      value:
        caseData?.application?.propertyType ||
        caseData?.propertyType ||
        "-",
    },
    {
      label: "Branch",
      value:
        caseData?.application?.branch ||
        caseData?.branch ||
        "-",
    },
    {
      label: "Requested Amount",
      value: formatCurrency(
        caseData?.application
          ?.requestedAmount ??
          caseData?.requestedAmount,
      ),
    },
    {
      label: "Sanctioned Amount",
      value: formatCurrency(
        caseData?.sanction
          ?.sanctionedAmount ??
          caseData?.sanctionedAmount,
      ),
    },
    {
      label: "Loan Tenure",
      value:
        caseData?.sanction?.loanTenure ||
        caseData?.loanTenure
          ? `${
              caseData?.sanction?.loanTenure ||
              caseData?.loanTenure
            } Months`
          : "-",
    },
    {
      label: "Interest Rate",
      value:
        caseData?.sanction?.interestRate ||
        caseData?.interestRate
          ? `${
              caseData?.sanction?.interestRate ||
              caseData?.interestRate
            }% p.a.`
          : "-",
    },
    {
      label: "ROI / Monthly EMI",
      value: formatCurrency(
        caseData?.sanction?.monthlyEmi ??
          caseData?.monthlyEmi,
      ),
    },
    {
      label: "Loan Purpose",
      value:
        caseData?.application?.loanPurpose ||
        caseData?.loanPurpose ||
        "-",
    },
  ],
  [caseData],
);


const disbursementDetails = useMemo(
  () => [
    {
      label: "Beneficiary Name",
      value:
        caseData?.disbursement
          ?.beneficiaryName ||
        caseData?.customer?.name ||
        caseData?.customerName ||
        "-",
    },
    {
      label: "Disbursement Type",
      value:
        caseData?.disbursement?.type ||
        caseData?.disbursementType ||
        "-",
    },
    {
      label: "Bank Name",
      value:
        caseData?.disbursement?.bankName ||
        caseData?.bankName ||
        "-",
    },
    {
      label: "Disbursement Amount",
      value: formatCurrency(
        caseData?.disbursement?.amount ??
          caseData?.disbursementAmount,
      ),
    },
    {
      label: "Account Number",
      value:
        caseData?.disbursement
          ?.accountNumber ||
        caseData?.accountNumber ||
        "-",
    },
    {
      label: "Disbursement Date",
      value: formatDate(
        caseData?.disbursement
          ?.disbursementDate ??
          caseData?.disbursementDate,
      ),
    },
    {
      label: "IFSC Code",
      value:
        caseData?.disbursement?.ifsc ||
        caseData?.ifsc ||
        "-",
    },
    {
      label: "Payment Status",
      value:
        caseData?.disbursement
          ?.paymentStatus ||
        caseData?.paymentStatus ||
        "Pending Checker Approval",
      status: "pending",
    },
    {
      label: "Penny Drop Match",
      value:
        caseData?.disbursement
          ?.pennyDropMatch !== null &&
        caseData?.disbursement
          ?.pennyDropMatch !== undefined
          ? `${caseData.disbursement.pennyDropMatch}%`
          : caseData?.pennyDropMatch !==
                null &&
              caseData?.pennyDropMatch !==
                undefined
            ? `${caseData.pennyDropMatch}%`
            : "-",
      status: "success",
    },
    {
      label: "UTR Number",
      value:
        caseData?.disbursement
          ?.utrNumber ||
        caseData?.utrNumber ||
        "Generated after bank success",
    },
  ],
  [caseData],
);

  const toggleVerification = (itemId) => {
    setVerificationItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
            ...item,
            checked: !item.checked,
          }
          : item,
      ),
    );
  };

  const toBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};
useEffect(() => {
  let active = true;

  const fetchCheckerCase = async () => {
    if (!applicationId) {
      if (active) {
        setCaseError(
          "Application ID is missing. Open this page from the Operations Dashboard.",
        );
        setCaseLoading(false);
      }

      return;
    }

    try {
      setCaseLoading(true);
      setCaseError("");

      const response =
        await operationApi.getCheckerCase(
          applicationId,
        );

      const result = unwrapApiResponse(response);

      if (!result) {
        throw new Error(
          "Checker case details were not returned.",
        );
      }

      if (!active) {
        return;
      }

      setCaseData(result);

      setPageStatus(
        result?.disbursement?.paymentStatus ||
          result?.pageStatus ||
          "Awaiting checker",
      );

      if (
        Array.isArray(result?.checklist) &&
        result.checklist.length > 0
      ) {
        setVerificationItems((currentItems) =>
          currentItems.map((item) => {
            const databaseItem =
              result.checklist.find(
                (savedItem) =>
                  Number(
                    savedItem.itemId ??
                      savedItem.item_id,
                  ) === Number(item.id),
              );

            if (!databaseItem) {
              return item;
            }

            return {
              ...item,
              checked: toBoolean(
                databaseItem.checked ??
                  databaseItem.isVerified ??
                  databaseItem.is_verified,
              ),
            };
          }),
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch operations checker case:",
        error,
      );

      if (active) {
        setCaseError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load operations checker case.",
        );
      }
    } finally {
      if (active) {
        setCaseLoading(false);
      }
    }
  };

  fetchCheckerCase();

  return () => {
    active = false;
  };
}, [applicationId]);
  const toggleChecklistGroup = (groupId) => {
    setExpandedChecklistGroups((currentGroups) =>
      currentGroups.includes(groupId)
        ? currentGroups.filter((id) => id !== groupId)
        : [...currentGroups, groupId],
    );
  };

  // const scrollWorkflow = (direction) => {
  //   workflowRef.current?.scrollBy({
  //     left: direction === "left" ? -360 : 360,
  //     behavior: "smooth",
  //   });
  // };

  const showToast = (message) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  const openDecisionModal = (type) => {
    setDecisionError("");
    setDecisionModal(type);
  };

  const closeDecisionModal = () => {
    setDecisionModal(null);
    setDecisionError("");
    setReturnReason("");
  };
  // const { applicationId } = useParams();

const confirmDecision = async () => {
  if (decisionModal === "approve") {
    if (!approvalReady) {
      setDecisionError(
        "Complete all mandatory verification points and accept the declaration before approval.",
      );
      return;
    }

    try {
      setDecisionSubmitting(true);
      setDecisionError("");

      const response =
        await operationApi.approveByOpsChecker(
          applicationId,
        );

      const result =
        response?.data?.data ??
        response?.data ??
        {};

      setPageStatus(
        result?.status ||
          "OPS_CHECKER_APPROVED",
      );

      closeDecisionModal();

      showToast(
        "Case approved and submitted to Operations Head.",
      );
    } catch (error) {
      console.error(
        "Unable to approve by Operations Checker:",
        error,
      );

      const message =
        error?.response?.data?.message ??
        error?.message ??
        "Unable to approve the application.";

      setDecisionError(
        Array.isArray(message)
          ? message.join(", ")
          : String(message),
      );
    } finally {
      setDecisionSubmitting(false);
    }

    return;
  }

  if (decisionModal === "return") {
    if (!returnReason.trim()) {
      setDecisionError(
        "Please enter the reason for returning the case.",
      );
      return;
    }

    setPageStatus("Returned");
    closeDecisionModal();
    showToast("Case returned successfully.");
  }
};

 const fetchDocuments = useCallback(async () => {
  const normalizedApplicationId =
    Number(applicationId);

  if (
    !Number.isInteger(normalizedApplicationId) ||
    normalizedApplicationId <= 0
  ) {
    setDocuments([]);
    setDocumentsError(
      "Valid application ID is required.",
    );
    return;
  }

  try {
    setDocumentsLoading(true);
    setDocumentsError("");

    const response =
      await documentApi.findAllByApplication(
        normalizedApplicationId,
      );

    /*
      Direct service response:
      response.data.data

      With global response wrapper:
      response.data.data.data
    */
    const responsePayload =
      response?.data?.data ?? response?.data ?? {};

    const documentRows = Array.isArray(
      responsePayload,
    )
      ? responsePayload
      : Array.isArray(responsePayload?.data)
        ? responsePayload.data
        : [];

    setDocuments(documentRows);
  } catch (error) {
    console.error(
      "Unable to fetch application documents:",
      error,
    );

    const message =
      error?.response?.data?.message ??
      error?.message ??
      "Unable to fetch application documents.";

    setDocumentsError(
      Array.isArray(message)
        ? message.join(", ")
        : String(message),
    );

    setDocuments([]);
  } finally {
    setDocumentsLoading(false);
  }
}, [applicationId]);


  const getDocumentUrl = (document) => {
  const path = String(
    document?.fileUrl ?? "",
  ).trim();

  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL ??
    "";

  return `${backendUrl}${
    path.startsWith("/") ? "" : "/"
  }${path}`;
};

const previewDocument = (document) => {
  const url = getDocumentUrl(document);

  if (!url) {
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );
};

const downloadDocument = (document) => {
  const url = getDocumentUrl(document);

  if (!url) {
    return;
  }

  const anchor =
    window.document.createElement("a");

  anchor.href = url;
  anchor.download =
    document.fileName || "document";
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
};

const displayedDocuments = useMemo(
  () =>
    documents.map((document, index) => ({
      id:
        document?.id ??
        document?.documentId ??
        `document-${index}`,

      name:
        document?.name ??
        document?.documentName ??
        document?.fileName ??
        "Application Document",

      type:
        document?.type ??
        document?.documentType ??
        document?.mimeType ??
        "Document",

      uploadedBy:
        document?.uploadedByName ??
        document?.uploadedBy ??
        document?.createdByName ??
        document?.createdBy ??
        "-",

      status:
        document?.status ??
        "UPLOADED",

      fileUrl:
        document?.fileUrl ??
        document?.downloadUrl ??
        document?.url ??
        document?.filePath ??
        "",

      fileName:
        document?.fileName ??
        document?.documentName ??
        document?.name ??
        "document",
    })),
  [documents],
);

if (caseLoading) {
  return (
    <div className="grid min-h-[500px] place-items-center bg-[#f3f7fb]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

        <p className="mt-4 text-sm font-bold text-slate-600">
          Loading checker case...
        </p>
      </div>
    </div>
  );
}

if (caseError) {
  return (
    <div className="grid min-h-[500px] place-items-center bg-[#f3f7fb] p-5">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <FaExclamationTriangle
          className="mx-auto text-rose-600"
          size={28}
        />

        <h2 className="mt-4 text-lg font-black text-slate-800">
          Unable to load checker case
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {caseError}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="mt-5 rounded-xl bg-[#234a82] px-5 py-2.5 text-xs font-black text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#f3f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Payment Gate */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-[#fffaf0] to-[#fffdf8] px-5 py-5 shadow-sm sm:px-7">
          <div className="absolute bottom-0 right-0 h-full w-24 rounded-l-full bg-emerald-400/15" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-6xl">
              <p className="text-sm leading-7 text-[#8b641f] sm:text-base">
                <strong className="font-black">
                  Pre-disbursement charges payment gate:
                </strong>{" "}
                Processing Fee ₹34,810 · Documentation Fee ₹4,130 · Stamp
                Duty / eStamp ₹8,000 · MODT / Mortgage Registration ₹8,000 ·
                CERSAI Registration Charge ₹590 · NACH / eMandate Setup Fee
                ₹354 · Broken Period Interest / Advance EMI ₹26,082
              </p>

              <p className="mt-1 text-xs font-medium text-[#9a6e29]">
                All mandatory charges must be collected and reconciled before
                checker approval.
              </p>
            </div>

            <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700">
              Payment verified
            </span>
          </div>
        </section>

        {/* Checker Hero */}
        <section className="relative isolate overflow-hidden rounded-[30px] bg-gradient-to-r from-[#0c8066] via-[#178f72] to-[#56bf7b] px-6 py-8 text-white shadow-[0_24px_60px_rgba(17,130,102,0.25)] sm:px-8 sm:py-10 xl:flex xl:min-h-[230px] xl:items-center xl:justify-between xl:gap-10">
          <div className="absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full bg-cyan-400/25" />
          <div className="absolute left-[25%] top-0 -z-10 h-full w-56 skew-x-[-14deg] bg-indigo-500/40" />
          <div className="absolute -bottom-40 -right-20 -z-10 h-96 w-96 rounded-full border-[70px] border-white/5" />

          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] backdrop-blur">
              <FaShieldAlt size={14} />
              Independent Checker Control
            </span>

            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-[44px]">
              Operations CHECKER Review
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-emerald-50/90 sm:text-base">
  {caseData?.application?.applicationNumber || "-"} · Independently verify
  maker instructions, beneficiary details, compliance checks and final
  disbursement amount.
</p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold">
  <FaBuilding size={13} />
  {caseData?.application?.branch || "-"}
</span>

              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold">
  <FaUserTie size={13} />
  Maker: {caseData?.maker?.name || "-"}
</span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold">
  <FaClock size={13} />
  Submitted {formatDateTime(caseData?.maker?.submittedAt)}
</span>

              <span
                className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-black ${pageStatus === "Approved"
                  ? "bg-white text-emerald-700"
                  : pageStatus === "Returned to maker"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                  }`}
              >
                {pageStatus}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 xl:mt-0 xl:max-w-[390px] xl:justify-end">
            <button
              type="button"
              onClick={() => {
                showToast("Checker review saved as draft.");
              }}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 xl:flex-none"
            >
              <FaSave size={14} />
              Save Review
            </button>

            <button
              type="button"
              onClick={() => openDecisionModal("return")}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-rose-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-rose-50 xl:flex-none"
            >
              <FaUndo size={13} />
              Return to Maker
            </button>

            {/* <button
              type="button"
              onClick={() => openDecisionModal("approve")}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-black shadow-lg transition xl:w-auto ${approvalReady
                ? "bg-[#173c70] text-white hover:-translate-y-0.5 hover:bg-[#102e58]"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
            >
              <FaCheckCircle size={15} />
              Approve Disbursement
            </button> */}
            <button
  type="button"
  disabled={decisionSubmitting}
  onClick={() => openDecisionModal("approve")}
  className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-black shadow-lg transition xl:w-auto ${
    decisionSubmitting
      ? "cursor-not-allowed bg-slate-200 text-slate-500"
      : "bg-[#173c70] text-white hover:-translate-y-0.5 hover:bg-[#102e58]"
  }`}
>
  <FaCheckCircle size={15} />

  {decisionSubmitting
    ? "Approving..."
    : "Approve & Send to Ops Head"}
</button>
          </div>
        </section>

        {/* Workflow */}
        {/* <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:items-center sm:px-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Application journey
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-[#1c365f] sm:text-xl">
                LAP Workflow
              </h2>
            </div>

            <span className="hidden rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 sm:inline-flex">
              Operations Checker Review
            </span>
          </div>

          <div
            ref={workflowRef}
            className="overflow-x-auto scroll-smooth px-5 py-7 sm:px-7"
          >
            <div className="flex min-w-[1180px]">
              {workflowSteps.map((step, index) => {
                const completed = step.state === "completed";
                const current = step.state === "current";
                const lastStep = index === workflowSteps.length - 1;

                return (
                  <div key={step.id} className="flex flex-1 items-start">
                    <div className="w-[112px] shrink-0 text-center">
                      <span
                        className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-[7px] text-sm font-black shadow-sm ${
                          completed
                            ? "border-emerald-100 bg-emerald-500 text-white"
                            : current
                              ? "border-emerald-100 bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "border-slate-50 bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? <FaCheck size={14} /> : step.id}
                      </span>

                      <strong
                        className={`mt-3 block whitespace-nowrap text-xs font-extrabold ${
                          current
                            ? "text-emerald-700"
                            : completed
                              ? "text-slate-700"
                              : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </strong>

                      <span
                        className={`mt-1 block text-[10px] font-medium ${
                          current
                            ? "text-emerald-600"
                            : completed
                              ? "text-emerald-600"
                              : "text-slate-400"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {!lastStep && (
                      <span
                        className={`mt-6 h-[3px] flex-1 rounded-full ${
                          completed ? "bg-emerald-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-7">
            <button
              type="button"
              aria-label="Scroll workflow left"
              onClick={() => scrollWorkflow("left")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <FaChevronLeft size={12} />
            </button>

            <span className="text-[10px] font-medium text-slate-400">
              Review the completed journey before checker approval
            </span>

            <button
              type="button"
              aria-label="Scroll workflow right"
              onClick={() => scrollWorkflow("right")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </section> */}


        {/* Compact Workflow */}
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
          <div className="overflow-x-auto">
            <div className="flex min-w-[720px] items-start">
              {workflowSteps.map((step, index) => {
                const completed = step.state === "completed";
                const current = step.state === "current";
                const lastStep = index === workflowSteps.length - 1;

                return (
                  <div key={step.id} className="flex flex-1 items-start">
                    <div className="w-[92px] shrink-0 text-center">
                      <span
                        className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-xs font-black ${completed
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.10)]"
                          : current
                            ? "border-blue-600 bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.10)]"
                            : "border-slate-200 bg-slate-100 text-slate-400"
                          }`}
                      >
                        {completed ? (
                          <FaCheck size={11} />
                        ) : current ? (
                          <FaUserTie size={11} />
                        ) : (
                          <FaClock size={10} />
                        )}
                      </span>

                      <strong
                        className={`mt-2 block whitespace-nowrap text-[10px] font-extrabold ${current
                          ? "text-blue-700"
                          : completed
                            ? "text-[#1c365f]"
                            : "text-slate-500"
                          }`}
                      >
                        {step.label}
                      </strong>
                    </div>

                    {!lastStep && (
                      <span
                        className={`mt-4 h-px flex-1 ${completed ? "bg-emerald-400" : "bg-slate-200"
                          }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(330px,1fr)]">

          {/* Main Content */}
          <div className="space-y-6">
            {/* Maker Submission Summary */}
            {/* <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="Maker submission"
                title="Instruction Submitted for Approval"
                rightContent={
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 ring-1 ring-inset ring-blue-200">
                    <FaPaperPlane size={11} />
                    Submitted
                  </span>
                }
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Maker
                  </p>

                  <strong className="mt-2 block text-sm font-extrabold text-[#263f68]">
                    Operations User
                  </strong>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Neha Sharma
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Submitted At
                  </p>

                  <strong className="mt-2 block text-sm font-extrabold text-[#263f68]">
                    20 Jul 2026
                  </strong>

                  <p className="mt-1 text-[10px] text-slate-500">
                    04:38 PM
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Instruction Amount
                  </p>

                  <strong className="mt-2 block text-sm font-extrabold text-emerald-700">
                    ₹80,00,000
                  </strong>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Single disbursement
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Idempotency Key
                  </p>

                  <strong className="mt-2 block break-all text-xs font-extrabold text-[#263f68]">
                    DISB-FTLIP-2026-0002-01
                  </strong>
                </div>
              </div>
            </section>

            {/* Verification Checklist */}
            {/* <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="Independent verification"
                title="Operations Checker Checklist"
                rightContent={
                  <div className="text-right">
                    <strong className="block text-sm font-black text-emerald-700">
                      {verifiedCount}/{verificationItems.length}
                    </strong>

                    <span className="text-[10px] font-medium text-slate-400">
                      Verified
                    </span>
                  </div>
                }
              />

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 ${
                    progressWidthClasses[verifiedCount]
                  }`}
                />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {verificationItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                      item.checked
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleVerification(item.id)}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-extrabold text-slate-800">
                          {item.title}
                        </strong>

                        {item.required && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-rose-600">
                            Required
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>

                      <span
                        className={`mt-2 inline-flex text-[10px] font-black ${
                          item.checked
                            ? "text-emerald-700"
                            : "text-amber-600"
                        }`}
                      >
                        {item.checked
                          ? "Checker verified"
                          : "Verification pending"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </section> */}

            {/* Disbursement Instruction */}
            {/* <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="Locked maker instruction"
                title="Disbursement Instruction"
                rightContent={
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">
                    <FaLock size={10} />
                    Read only
                  </span>
                }
              />

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <ReadOnlyField
                  label="LAN"
                  value="Auto on booking"
                  icon={FaKey}
                />

                <ReadOnlyField
                  label="Sanction Amount"
                  value="₹80,00,000"
                  icon={FaMoneyCheckAlt}
                />

                <ReadOnlyField
                  label="Disbursement Amount"
                  value="₹80,00,000"
                  icon={FaMoneyCheckAlt}
                  valueClass="text-emerald-700"
                />

                <ReadOnlyField
                  label="Disbursement Type"
                  value="Single Disbursement"
                  icon={FaRoute}
                />

                <ReadOnlyField
                  label="Beneficiary Name"
                  value="Meera Iyer"
                  icon={FaUserTie}
                />

                <ReadOnlyField
                  label="Bank Name"
                  value="HDFC Bank"
                  icon={FaUniversity}
                />

                <ReadOnlyField
                  label="Account Number (Masked)"
                  value="XXXXXX2048"
                  icon={FaLandmark}
                />

                <ReadOnlyField
                  label="IFSC"
                  value="HDFC0000123"
                  icon={FaLandmark}
                />

                <ReadOnlyField
                  label="Penny Drop Name Match"
                  value="98%"
                  icon={FaCheckCircle}
                  valueClass="text-emerald-700"
                />

                <ReadOnlyField
                  label="UTR Number"
                  value="Generated after bank success"
                  icon={FaHistory}
                />

                <ReadOnlyField
                  label="Disbursement Date"
                  value="19-06-2026"
                  icon={FaCalendarAlt}
                />

                <ReadOnlyField
                  label="Payment Status"
                  value="Pending Checker Approval"
                  icon={FaClock}
                  valueClass="text-amber-700"
                />
              </div>
            </section> */}

            {/* Customer and Disbursement Summary */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Customer & Loan Summary */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FaFileAlt className="text-[#234a82]" size={14} />

                  <h2 className="text-sm font-black text-[#1c365f]">
                    Customer & Loan Summary
                  </h2>
                </div>

                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {customerLoanDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="border-b border-slate-100 px-2 py-3"
                    >
                      <p className="text-[9px] font-semibold text-slate-400">
                        {detail.label}
                      </p>

                      <p className="mt-1 break-words text-[11px] font-bold text-[#243f6d]">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Disbursement Instruction */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FaFileAlt className="text-[#234a82]" size={14} />

                    <h2 className="text-sm font-black text-[#1c365f]">
                      Disbursement Instruction
                    </h2>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-700">
                    <FaLock size={8} />
                    Maker Instruction · Read Only
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2">
                  {disbursementDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="grid grid-cols-[minmax(100px,0.85fr)_minmax(0,1fr)] items-center gap-3 border-b border-slate-100 px-2 py-3"
                    >
                      <span className="text-[9px] font-semibold text-slate-500">
                        {detail.label}
                      </span>

                      {detail.status === "pending" ? (
                        <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-700">
                          {detail.value}
                        </span>
                      ) : (
                        <strong
                          className={`break-words text-[10px] font-extrabold ${detail.status === "success"
                            ? "text-emerald-700"
                            : "text-[#243f6d]"
                            }`}
                        >
                          {detail.value}
                        </strong>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Grouped Verification Checklist */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-black text-[#1c365f]">
                  Independent Verification Checklist
                </h2>

                <strong
                  className={`text-xs font-black ${verifiedCount === verificationItems.length
                    ? "text-emerald-700"
                    : "text-amber-700"
                    }`}
                >
                  {verifiedCount} / {verificationItems.length} Completed
                </strong>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {checklistGroups.map((group) => {
                  const GroupIcon = group.icon;

                  const groupItems = verificationItems.filter((item) =>
                    group.itemIds.includes(item.id),
                  );

                  const completedCount = groupItems.filter(
                    (item) => item.checked,
                  ).length;

                  const complete = completedCount === groupItems.length;

                  const expanded = expandedChecklistGroups.includes(group.id);

                  return (
                    <div
                      key={group.id}
                      className={`overflow-hidden rounded-xl border transition ${complete
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-slate-200 bg-slate-50/60"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleChecklistGroup(group.id)}
                        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/60"
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${complete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                            }`}
                        >
                          <GroupIcon size={15} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs font-black text-[#203b68]">
                            {group.title}
                          </strong>

                          <span className="mt-1 block truncate text-[9px] text-slate-500">
                            {group.description}
                          </span>
                        </div>

                        <strong
                          className={`shrink-0 text-xs font-black ${complete ? "text-emerald-700" : "text-slate-500"
                            }`}
                        >
                          {completedCount} / {groupItems.length}
                        </strong>

                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${complete
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {complete ? (
                            <FaCheck size={10} />
                          ) : (
                            <FaExclamationTriangle size={9} />
                          )}
                        </span>

                        <FaChevronDown
                          size={10}
                          className={`shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {expanded && (
                        <div className="space-y-2 border-t border-slate-200 bg-white p-3">
                          {groupItems.map((item) => (
                            <label
                              key={item.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${item.checked
                                ? "border-emerald-100 bg-emerald-50/40"
                                : "border-amber-100 bg-amber-50/40"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleVerification(item.id)}
                                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <strong className="block text-[11px] font-extrabold text-slate-700">
                                    {item.title}
                                  </strong>

                                  {item.required && (
                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[7px] font-black uppercase tracking-wide text-rose-600">
                                      Required
                                    </span>
                                  )}
                                </div>

                                <span className="mt-1 block text-[9px] leading-4 text-slate-500">
                                  {item.description}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            {/* Charges */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="Payment control"
                title="Charges Reconciliation"
                rightContent={
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
                    <FaCheckCircle size={11} />
                    Fully collected
                  </span>
                }
              />

              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[650px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Charge
                      </th>

                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                {(caseData?.charges ?? []).map((charge) => (
  <tr key={charge.id ?? charge.label}>
    <td className="px-5 py-4 text-xs font-bold text-slate-700">
      {charge.label}
    </td>

    <td className="px-5 py-4 text-xs font-extrabold text-[#263f68]">
      {formatCurrency(charge.amount)}
    </td>

    <td className="px-5 py-4">
      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
        {charge.status}
      </span>
    </td>
  </tr>
))}
                  </tbody>

                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-5 py-4 text-xs font-black text-slate-700">
                        Total Charges Collected
                      </td>

                      <td className="px-5 py-4 text-sm font-black text-emerald-700">
                        ₹81,966
                      </td>

                      <td className="px-5 py-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Documents */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Document control"
              title="Documents Submitted by Maker"
            />
          
            {documentsLoading ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : documentsError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold text-red-700">
                  {documentsError}
                </p>
          
                <button
                  type="button"
                  onClick={fetchApplicationDocuments}
                  className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white"
                >
                  Retry
                </button>
              </div>
            ) : displayedDocuments.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <FaFileAlt
                  size={24}
                  className="mx-auto text-slate-300"
                />
          
                <p className="mt-3 text-sm font-bold text-slate-600">
                  No documents found
                </p>
          
                <p className="mt-1 text-xs text-slate-400">
                  Documents uploaded for this application
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {displayedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
                      <FaFileAlt size={17} />
                    </span>
          
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-xs font-extrabold text-slate-800">
                        {document.name}
                      </strong>
          
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {document.type} · Uploaded by{" "}
                        {document.uploadedBy}
                      </span>
          
                      <span className="mt-2 inline-flex text-[9px] font-black text-emerald-700">
                        {String(document.status)
                          .replaceAll("_", " ")}
                      </span>
                    </div>
          
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={!document.fileUrl}
                        onClick={() =>
                          previewDocument(document)
                        }
                        title={`Preview ${document.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FaEye size={13} />
                      </button>
          
                      <button
                        type="button"
                        disabled={!document.fileUrl}
                        onClick={() =>
                          downloadDocument(document)
                        }
                        title={`Download ${document.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FaDownload size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

            {/* Remarks and Declaration */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="Final checker control"
                title="Checker Remarks & Declaration"
              />

              <label className="mt-6 block">
                <span className="mb-2 block text-xs font-extrabold text-slate-600">
                  Checker Remarks
                </span>

                <textarea
                  rows={4}
                  value={checkerRemarks}
                  onChange={(event) =>
                    setCheckerRemarks(event.target.value)
                  }
                  placeholder="Enter independent checker observations, validations or conditions..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(event) =>
                    setDeclarationAccepted(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
                />

                <div>
                  <strong className="text-sm font-extrabold text-slate-800">
                    Independent Checker Declaration
                  </strong>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    I confirm that I have independently reviewed the maker
                    instruction, beneficiary bank details, sanctioned amount,
                    compliance controls, payment reconciliation and supporting
                    documents. No prohibited LSP pool or pass-through account
                    is involved.
                  </p>
                </div>
              </label>

              {!approvalReady && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <FaExclamationTriangle
                    className="mt-0.5 shrink-0 text-amber-600"
                    size={15}
                  />

                  <p className="text-xs leading-5 text-amber-800">
                    Complete every mandatory checker verification and accept
                    the declaration to enable approval.
                  </p>
                </div>
              )}
            </section>
          </div>


        </div>
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div
              className={`px-6 py-6 text-white ${decisionModal === "approve"
                ? "bg-gradient-to-r from-emerald-700 to-emerald-500"
                : "bg-gradient-to-r from-rose-700 to-rose-500"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
                    Checker Decision
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {decisionModal === "approve"
                      ? "Approve Disbursement"
                      : "Return Case to Maker"}
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close decision modal"
                  onClick={closeDecisionModal}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25"
                >
                  <FaTimes size={13} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {decisionModal === "approve" ? (
                <div>
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <FaCheckCircle
                      className="mt-0.5 shrink-0 text-emerald-700"
                      size={17}
                    />

                    <p className="text-xs leading-6 text-emerald-900">
                      Approval will lock
                       {/* the instruction and initiate the bank
                      payment process for ₹80,00,000 to Meera Iyer, HDFC Bank,
                      account ending 2048. */}
                    </p>
                  </div>

                  {checkerRemarks && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Checker Remarks
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {checkerRemarks}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-600">
                    Reason for Return
                  </span>

                  <textarea
                    rows={4}
                    value={returnReason}
                    onChange={(event) =>
                      setReturnReason(event.target.value)
                    }
                    placeholder="Clearly mention the discrepancy or correction required from the maker..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-50"
                  />
                </label>
              )}

              {decisionError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <FaExclamationTriangle
                    className="mt-0.5 shrink-0 text-rose-600"
                    size={14}
                  />

                  <p className="text-xs leading-5 text-rose-700">
                    {decisionError}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDecisionModal}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              <button
  type="button"
  disabled={decisionSubmitting}
  onClick={confirmDecision}
  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
>
  <FaCheckCircle size={13} />

  {decisionSubmitting
    ? "Approving..."
    : "Confirm Approval"}
</button>
                {/* <button
                  type="button"
                  onClick={confirmDecision}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black text-white transition ${decisionModal === "approve"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-rose-700 hover:bg-rose-800"
                    }`}
                >
                  {decisionModal === "approve" ? (
                    <>
                      <FaCheckCircle size={13} />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <FaUndo size={12} />
                      Return to Maker
                    </>
                  )}
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <FaCheck size={11} />
          </span>

          <p className="text-xs font-bold text-slate-700">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}

