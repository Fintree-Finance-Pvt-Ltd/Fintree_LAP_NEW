import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaUpload,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaLandmark,
  FaLock,
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaUndo,
  FaUniversity,
  FaUserTie,
} from "react-icons/fa";
import { useLocation, useParams, useSearchParams } from "react-router-dom";

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

const unwrapApiResponse = (response) =>
  response?.data?.data ?? response?.data ?? response ?? null;

const normalizeApiError = (error, fallbackMessage) => {
  const message =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    fallbackMessage;

  return Array.isArray(message)
    ? message.join(", ")
    : String(message);
};

const extractArrayPayload = (response, possibleKeys = []) => {
  const candidates = [
    response?.data?.data?.data,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === "object") {
      for (const key of possibleKeys) {
        if (Array.isArray(candidate[key])) {
          return candidate[key];
        }
      }
    }
  }

  return [];
};

const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true";

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
  if (!value) return "-";

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
  if (!value) return "-";

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

const normalizeStatus = (value) =>
  String(value || "Awaiting checker").replaceAll("_", " ");

function DetailCell({ label, value, valueClassName = "text-slate-800" }) {
  return (
    <div className="flex min-h-[70px] flex-col justify-center rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1.5 break-words text-[11px] font-extrabold ${valueClassName}`}>
        {value || "-"}
      </p>
    </div>
  );
}

function StatusBadge({ children, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}


const requiredDocumentSections = [
  {
    id: "login-application",
    title: "B. Login and Application Documents",
    documents: [
      {
        id: "loan-application-form",
        name: "Loan application form duly filled and signed",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
      },
      {
        id: "applicant-photograph",
        name: "Applicant photograph",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "PHOTO",
      },
      {
        id: "partner-login-sheet",
        name: "Partner login sheet / SFTP upload confirmation",
        applicableFor: "SFT Finance / Partner",
        documentType: "OTHER",
      },
      {
        id: "customer-consent",
        name: "Customer consent for bureau, KYC verification and data sharing",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
      },
    ],
  },
  {
    id: "kyc-documents",
    title: "C. KYC Documents",
    documents: [
      {
        id: "pan-card",
        name: "PAN Card",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "PAN",
      },
      {
        id: "aadhaar-card",
        name: "Aadhaar Card",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "AADHAAR",
      },
      {
        id: "address-proof",
        name: "Address Proof",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
      },
      {
        id: "ckyc-form",
        name: "CKYC Form",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
      },
    ],
  },
  {
    id: "income-banking",
    title: "D. Income and Banking Documents",
    documents: [
      {
        id: "bank-statement",
        name: "Latest 6 months bank statement",
        applicableFor: "Applicant / Business / Salary",
        documentType: "BANK_STATEMENT",
      },
      {
        id: "itr-financials",
        name: "ITR with computation / financials",
        applicableFor: "Applicant / Business Entity",
        documentType: "INCOME_PROOF",
      },
      {
        id: "salary-slips",
        name: "Salary slips / Form 16",
        applicableFor: "Salaried Applicant",
        documentType: "INCOME_PROOF",
      },
      {
        id: "gst-business-proof",
        name: "GST returns / business proof",
        applicableFor: "Self-employed Applicant / Entity",
        documentType: "INCOME_PROOF",
      },
    ],
  },
  {
    id: "property-documents",
    title: "E. Property Documents",
    documents: [
      {
        id: "title-deed",
        name: "Title deed / sale deed",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
      },
      {
        id: "property-tax",
        name: "Property tax receipt",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
      },
      {
        id: "approved-plan",
        name: "Approved building plan",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
      },
      {
        id: "occupancy-certificate",
        name: "Occupancy / completion certificate",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
      },
      {
        id: "encumbrance-certificate",
        name: "Encumbrance certificate",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
      },
    ],
  },
];

export default function OpsChecker() {
  
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const applicationId =
    params.applicationId ||
    location.state?.applicationId ||
    searchParams.get("applicationId");

  const [caseData, setCaseData] = useState(null);
  const [caseLoading, setCaseLoading] = useState(true);
  const [caseError, setCaseError] = useState("");

  const [verificationItems, setVerificationItems] = useState(
    initialVerificationItems,
  );
  const [expandedChecklistGroups, setExpandedChecklistGroups] = useState([
    "kyc",
    "bank",
  ]);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");

  const [selectedFiles, setSelectedFiles] = useState({});
const [uploadingDocuments, setUploadingDocuments] = useState({});
const [uploadedDocuments, setUploadedDocuments] = useState({});
const [uploadErrors, setUploadErrors] = useState({});

  const [checkerRemarks, setCheckerRemarks] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [pageStatus, setPageStatus] = useState("Awaiting checker");
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const verifiedCount = useMemo(
    () => verificationItems.filter((item) => item.checked).length,
    [verificationItems],
  );

  const requiredItemsVerified = useMemo(
    () =>
      verificationItems
        .filter((item) => item.required)
        .every((item) => item.checked),
    [verificationItems],
  );

  const pendingRequiredItems = useMemo(
    () =>
      verificationItems.filter(
        (item) => item.required && !item.checked,
      ),
    [verificationItems],
  );

  const approvalReady =
    requiredItemsVerified && declarationAccepted;

  const completionPercentage = Math.round(
    (verifiedCount / verificationItems.length) * 100,
  );

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
          caseData?.application?.applicationNumber ||
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
          caseData?.application?.requestedAmount ??
            caseData?.requestedAmount,
        ),
      },
      {
        label: "Sanctioned Amount",
        value: formatCurrency(
          caseData?.sanction?.sanctionedAmount ??
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
        label: "Monthly EMI",
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
          caseData?.disbursement?.beneficiaryName ||
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
          caseData?.disbursement?.accountNumber ||
          caseData?.accountNumber ||
          "-",
      },
      {
        label: "Disbursement Date",
        value: formatDate(
          caseData?.disbursement?.disbursementDate ??
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
          caseData?.disbursement?.paymentStatus ||
          caseData?.paymentStatus ||
          "Pending Checker Approval",
        tone: "warning",
      },
      {
        label: "Penny Drop Match",
        value:
          caseData?.disbursement?.pennyDropMatch !== null &&
          caseData?.disbursement?.pennyDropMatch !== undefined
            ? `${caseData.disbursement.pennyDropMatch}%`
            : caseData?.pennyDropMatch !== null &&
                caseData?.pennyDropMatch !== undefined
              ? `${caseData.pennyDropMatch}%`
              : "-",
        tone: "success",
      },
      {
        label: "UTR Number",
        value:
          caseData?.disbursement?.utrNumber ||
          caseData?.utrNumber ||
          "Generated after bank success",
      },
    ],
    [caseData],
  );

  const caseCharges = useMemo(() => {
    const rows =
      caseData?.charges ??
      caseData?.paymentCharges ??
      caseData?.chargeDetails ??
      caseData?.reconciliation?.charges ??
      [];

    return Array.isArray(rows) ? rows : [];
  }, [caseData]);

  const totalCharges = useMemo(
    () =>
      caseCharges.reduce(
        (total, charge) => total + Number(charge?.amount || 0),
        0,
      ),
    [caseCharges],
  );

  // const fetchApplicationDocuments = useCallback(async () => {
  //   const normalizedApplicationId = Number(applicationId);

  //   if (
  //     !Number.isInteger(normalizedApplicationId) ||
  //     normalizedApplicationId <= 0
  //   ) {
  //     setDocuments([]);
  //     setDocumentsError("Valid application ID is required.");
  //     return;
  //   }

  //   try {
  //     setDocumentsLoading(true);
  //     setDocumentsError("");

  //     const response =
  //       await operationApi.findAllByApplication(
  //         normalizedApplicationId,
  //       );

  //     const rows = extractArrayPayload(response, [
  //       "documents",
  //       "items",
  //       "rows",
  //       "results",
  //       "data",
  //     ]);

  //     setDocuments(rows);
  //   } catch (error) {
  //     console.error(
  //       "Failed to fetch application documents:",
  //       error,
  //     );

  //     setDocumentsError(
  //       normalizeApiError(
  //         error,
  //         "Unable to fetch application documents.",
  //       ),
  //     );
  //     setDocuments([]);
  //   } finally {
  //     setDocumentsLoading(false);
  //   }
  // }, [applicationId]);

const handleDocumentFileChange = (documentId, file) => {
  if (!file) {
    setSelectedFiles((current) => {
      const updated = { ...current };
      delete updated[documentId];
      return updated;
    });

    return;
  }

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    setUploadErrors((current) => ({
      ...current,
      [documentId]: "Only PDF, JPG, JPEG and PNG files are allowed.",
    }));

    return;
  }

  const maximumSize = 15 * 1024 * 1024;

  if (file.size > maximumSize) {
    setUploadErrors((current) => ({
      ...current,
      [documentId]: "File size must not exceed 15 MB.",
    }));

    return;
  }

  setSelectedFiles((current) => ({
    ...current,
    [documentId]: file,
  }));

  setUploadErrors((current) => ({
    ...current,
    [documentId]: "",
  }));
};

const handleUploadDocument = async (documentItem) => {
  const file = selectedFiles[documentItem.id];

  if (!file) {
    setUploadErrors((current) => ({
      ...current,
      [documentItem.id]: "Please select a file.",
    }));

    return;
  }

  const normalizedApplicationId = Number(applicationId);

  if (
    !Number.isInteger(normalizedApplicationId) ||
    normalizedApplicationId <= 0
  ) {
    setUploadErrors((current) => ({
      ...current,
      [documentItem.id]: "Valid application ID is required.",
    }));

    return;
  }

  try {
    setUploadingDocuments((current) => ({
      ...current,
      [documentItem.id]: true,
    }));

    setUploadErrors((current) => ({
      ...current,
      [documentItem.id]: "",
    }));

    const formData = new FormData();

    formData.append(
      "applicationId",
      String(normalizedApplicationId),
    );

    formData.append(
      "documentType",
      documentItem.documentType,
    );

    formData.append(
      "documentName",
      documentItem.name,
    );

    formData.append(
      "documentSource",
      "OPS_HEAD",
    );

    formData.append("file", file);

    const response =
      await operationApi.uploadDocument(formData);

    const uploadedDocument =
      response?.data?.data?.data ??
      response?.data?.data ??
      response?.data ??
      null;

    setUploadedDocuments((current) => ({
      ...current,
      [documentItem.id]: uploadedDocument || {
        documentName: documentItem.name,
        fileName: file.name,
      },
    }));

    setSelectedFiles((current) => {
      const updated = { ...current };
      delete updated[documentItem.id];
      return updated;
    });

    await fetchApplicationDocuments();
  } catch (error) {
    const message =
      error?.response?.data?.message ??
      error?.message ??
      "Unable to upload document.";

    setUploadErrors((current) => ({
      ...current,
      [documentItem.id]: Array.isArray(message)
        ? message.join(", ")
        : String(message),
    }));
  } finally {
    setUploadingDocuments((current) => ({
      ...current,
      [documentItem.id]: false,
    }));
  }
};


  const fetchApplicationDocuments = useCallback(async () => {
  const normalizedApplicationId = Number(applicationId);

  if (
    !Number.isInteger(normalizedApplicationId) ||
    normalizedApplicationId <= 0
  ) {
    setDocuments([]);
    setDocumentsError("Valid application ID is required.");
    return;
  }

  try {
    setDocumentsLoading(true);
    setDocumentsError("");

    const response =
      await operationApi.getApplicationDocuments(
        normalizedApplicationId,
      );

    const rows = extractArrayPayload(response, [
      "documents",
      "items",
      "rows",
      "results",
      "data",
    ]);

    setDocuments(rows);
  } catch (error) {
    console.error(
      "Failed to fetch application documents:",
      error,
    );

    setDocumentsError(
      normalizeApiError(
        error,
        "Unable to fetch application documents.",
      ),
    );

    setDocuments([]);
  } finally {
    setDocumentsLoading(false);
  }
}, [applicationId]);

useEffect(() => {
  fetchApplicationDocuments();
}, [fetchApplicationDocuments]);
  // useEffect(() => {
  //   fetchApplicationDocuments();
  // }, [fetchApplicationDocuments]);

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
          await operationApi.getCheckerCase(applicationId);

        const rawResult = unwrapApiResponse(response);
        const result =
          rawResult?.case ??
          rawResult?.review ??
          rawResult?.applicationReview ??
          rawResult;

        if (!result || typeof result !== "object") {
          throw new Error(
            "Checker case details were not returned.",
          );
        }

        if (!active) return;

        setCaseData(result);

        setPageStatus(
          result?.disbursement?.paymentStatus ||
            result?.paymentStatus ||
            result?.pageStatus ||
            result?.status ||
            "Awaiting checker",
        );

        const savedChecklist =
          result?.checklist ??
          result?.verificationChecklist ??
          result?.checkerChecklist ??
          [];

        if (
          Array.isArray(savedChecklist) &&
          savedChecklist.length > 0
        ) {
          setVerificationItems((currentItems) =>
            currentItems.map((item) => {
              const savedItem = savedChecklist.find(
                (entry) =>
                  Number(
                    entry.itemId ??
                      entry.item_id ??
                      entry.id,
                  ) === Number(item.id),
              );

              if (!savedItem) return item;

              return {
                ...item,
                checked: toBoolean(
                  savedItem.checked ??
                    savedItem.isVerified ??
                    savedItem.is_verified ??
                    savedItem.value,
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
            normalizeApiError(
              error,
              "Failed to load operations checker case.",
            ),
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

  const displayedDocuments = useMemo(
    () =>
      documents.map((document, index) => ({
        id:
          document?.id ??
          document?.documentId ??
          document?.document_id ??
          `document-${index}`,
        name:
          document?.name ??
          document?.documentName ??
          document?.document_name ??
          document?.fileName ??
          document?.file_name ??
          "Application Document",
        type:
          document?.type ??
          document?.documentType ??
          document?.document_type ??
          document?.mimeType ??
          document?.mime_type ??
          "Document",
        uploadedBy:
          document?.uploadedByName ??
          document?.uploaded_by_name ??
          document?.uploadedBy ??
          document?.uploaded_by ??
          document?.createdByName ??
          document?.created_by_name ??
          document?.createdBy ??
          document?.created_by ??
          "-",
        status:
          document?.status ??
          document?.documentStatus ??
          document?.document_status ??
          "UPLOADED",
        fileUrl:
          document?.fileUrl ??
          document?.file_url ??
          document?.downloadUrl ??
          document?.download_url ??
          document?.url ??
          document?.filePath ??
          document?.file_path ??
          document?.file?.url ??
          "",
        fileName:
          document?.fileName ??
          document?.file_name ??
          document?.documentName ??
          document?.document_name ??
          document?.name ??
          "document",
      })),
    [documents],
  );

  const toggleVerification = (itemId) => {
    setVerificationItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? { ...item, checked: !item.checked }
          : item,
      ),
    );
  };

  const toggleChecklistGroup = (groupId) => {
    setExpandedChecklistGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };

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
          result?.status || "OPS_CHECKER_APPROVED",
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

    if (!returnReason.trim()) {
      setDecisionError(
        "Please enter the reason for returning the case.",
      );
      return;
    }

    setPageStatus("Returned to maker");
    closeDecisionModal();
    showToast("Case returned successfully.");
  };

  // const getDocumentUrl = (document) => {
  //   const path = String(document?.fileUrl ?? "").trim();

  //   if (!path) return "";

  //   if (
  //     path.startsWith("http://") ||
  //     path.startsWith("https://") ||
  //     path.startsWith("blob:")
  //   ) {
  //     return path;
  //   }

  //   const backendUrl =
  //     import.meta.env.VITE_BACKEND_URL ?? "";

  //   return `${backendUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  // };

  const getDocumentUrl = (document) => {
  const path = String(
    document?.fileUrl ??
      document?.file_url ??
      document?.downloadUrl ??
      document?.download_url ??
      document?.filePath ??
      document?.file_path ??
      document?.url ??
      "",
  ).trim();

  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const backendUrl = String(
    import.meta.env.VITE_BACKEND_URL ?? "",
  )
    .trim()
    .replace(/\/$/, "");

  const cleanPath =
    path.startsWith("/") ? path : `/${path}`;

  return `${backendUrl}${cleanPath}`;
};
  const previewDocument = (document) => {
    const url = getDocumentUrl(document);

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const downloadDocument = (document) => {
    const url = getDocumentUrl(document);

    if (!url) return;

    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.fileName || "document";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
  };

  if (caseLoading) {
    return (
      <div className="grid min-h-[500px] place-items-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading checker case...
          </p>
        </div>
      </div>
    );
  }

  if (caseError) {
    return (
      <div className="grid min-h-[500px] place-items-center bg-slate-100 p-5">
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
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const applicationNumber =
    caseData?.application?.applicationNumber ||
    caseData?.applicationNumber ||
    "-";

  const customerName =
    caseData?.customer?.name ||
    caseData?.customerName ||
    "-";

  const branch =
    caseData?.application?.branch ||
    caseData?.branch ||
    "-";

  const sanctionedAmount =
    caseData?.sanction?.sanctionedAmount ??
    caseData?.sanctionedAmount;

  const disbursementAmount =
    caseData?.disbursement?.amount ??
    caseData?.disbursementAmount;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "checklist", label: "Checklist" },
    { id: "charges", label: "Charges" },
    { id: "documents", label: "Documents" },
    { id: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Command banner */}
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#102a56] via-[#173f7a] to-[#0f766e] p-5 text-white shadow-[0_20px_50px_rgba(23,63,122,0.18)] sm:p-6">
          <div className="pointer-events-none absolute -right-40 -top-44 h-[360px] w-[360px] rounded-full border-[55px] border-white/5" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_450px] xl:items-center">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">
                Independent Checker Review
              </p>

              <h1 className="mt-2 text-[30px] font-black leading-none tracking-tight">
                {applicationNumber}
              </h1>

              <p className="mt-3 max-w-3xl text-[12px] font-medium leading-5 text-blue-100">
                Verify disbursement instruction, beneficiary details, charges
                and all mandatory controls.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-100">
                  <FaBuilding size={11} />
                  {branch}
                </span>

                <span className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-100">
                  <FaUserTie size={11} />
                  {customerName}
                </span>

                <span className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-100">
                  Maker: {caseData?.maker?.name || "-"}
                </span>

                <span className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-100">
                  <FaClock size={10} />
                  {formatDateTime(caseData?.maker?.submittedAt)}
                </span>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-[14px] border border-white/15 bg-white/10 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-200">
                  Sanctioned
                </p>
                <p className="mt-2 text-[17px] font-black">
                  {formatCurrency(sanctionedAmount)}
                </p>
                <span className="mt-1 block text-[9px] text-slate-300">
                  Approved by credit
                </span>
              </div>

              <div className="rounded-[14px] border border-white/15 bg-white/10 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-200">
                  Disbursement
                </p>
                <p className="mt-2 text-[17px] font-black">
                  {formatCurrency(disbursementAmount)}
                </p>
                <span className="mt-1 block text-[9px] text-slate-300">
                  {caseData?.disbursement?.type ||
                    caseData?.disbursementType ||
                    "Single disbursement"}
                </span>
              </div>

              <div className="rounded-[14px] border border-white/15 bg-white/10 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-200">
                  Current Status
                </p>
                <p className="mt-2 break-words text-[13px] font-black">
                  {normalizeStatus(pageStatus)}
                </p>
                <span className="mt-1 block text-[9px] text-slate-300">
                  {pendingRequiredItems.length} controls pending
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Status strip */}
        <section className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-50 text-emerald-700">
              <FaCheck size={11} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">Charges</p>
              <p className="mt-0.5 text-[12px] font-black text-slate-800">
                {caseCharges.length > 0 ? "Fully reconciled" : "No records"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-50 text-emerald-700">
              <FaFileAlt size={12} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">Documents</p>
              <p className="mt-0.5 text-[12px] font-black text-slate-800">
                {displayedDocuments.length} available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-4">
            <span
              className={`grid h-9 w-9 place-items-center rounded-[10px] ${
                requiredItemsVerified
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {requiredItemsVerified ? (
                <FaCheck size={11} />
              ) : (
                <FaExclamationTriangle size={11} />
              )}
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">Checklist</p>
              <p className="mt-0.5 text-[12px] font-black text-slate-800">
                {verifiedCount} of {verificationItems.length} complete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-blue-50 text-blue-700">
              <FaCheckCircle size={12} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">Next Stage</p>
              <p className="mt-0.5 text-[12px] font-black text-slate-800">
                Operations Head
              </p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className="mt-5 flex w-full gap-1 overflow-x-auto rounded-[14px] bg-[#eaf0f7] p-1.5 sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[11px] font-black transition ${
                activeTab === tab.id
                  ? "bg-white text-[#173f7a] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                  : "text-slate-500 hover:text-[#173f7a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-5 space-y-5">
          <main className="min-w-0">
            {activeTab === "overview" && (
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-[18px]">
                  <div>
                    <h2 className="text-[14px] font-black text-[#173f7a]">
                      Case Overview
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Customer, sanction and bank instruction details
                    </p>
                  </div>
                  <StatusBadge tone="blue">Read only</StatusBadge>
                </div>

                <div className="grid gap-0 xl:grid-cols-2">
                  {/* Customer and loan panel */}
                  <div className="p-5">
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-blue-100 text-blue-700">
                        <FaUserTie size={13} />
                      </span>

                      <div>
                        <h3 className="text-[11px] font-black text-[#173f7a]">
                          Customer & Loan
                        </h3>
                        <p className="mt-0.5 text-[8px] text-slate-500">
                          Borrower, product and sanction information
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {customerLoanDetails.map((detail) => (
                        <DetailCell
                          key={detail.label}
                          label={detail.label}
                          value={detail.value}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Disbursement panel */}
                  <div className="border-t border-slate-100 p-5 xl:border-l xl:border-t-0">
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-emerald-100 text-emerald-700">
                          <FaUniversity size={13} />
                        </span>

                        <div className="min-w-0">
                          <h3 className="text-[11px] font-black text-[#173f7a]">
                            Disbursement Instruction
                          </h3>
                          <p className="mt-0.5 truncate text-[8px] text-slate-500">
                            Beneficiary bank and payment instruction
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-slate-500 ring-1 ring-slate-200">
                        <FaLock size={7} />
                        Read only
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {disbursementDetails.map((detail) => (
                        <DetailCell
                          key={detail.label}
                          label={detail.label}
                          value={detail.value}
                          valueClassName={
                            detail.tone === "success"
                              ? "text-emerald-700"
                              : detail.tone === "warning"
                                ? "text-amber-700"
                                : "text-slate-800"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "checklist" && (
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-[18px]">
                  <div>
                    <h2 className="text-[14px] font-black text-[#173f7a]">
                      Independent Verification Checklist
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Checker confirmation required before approval
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      verifiedCount === verificationItems.length
                        ? "success"
                        : "warning"
                    }
                  >
                    {verifiedCount} / {verificationItems.length} complete
                  </StatusBadge>
                </div>

                <div className="px-5 pt-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Mandatory control completion</span>
                    <strong>{completionPercentage}%</strong>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        requiredItemsVerified
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-amber-500 to-amber-400"
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {checklistGroups.map((group) => {
                    const GroupIcon = group.icon;
                    const groupItems = verificationItems.filter((item) =>
                      group.itemIds.includes(item.id),
                    );
                    const completedCount = groupItems.filter(
                      (item) => item.checked,
                    ).length;
                    const complete = completedCount === groupItems.length;
                    const expanded =
                      expandedChecklistGroups.includes(group.id);

                    return (
                      <div
                        key={group.id}
                        className={`overflow-hidden rounded-[14px] border ${
                          complete
                            ? "border-emerald-200"
                            : "border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistGroup(group.id)}
                          className={`flex w-full items-center gap-3 p-3 text-left ${
                            complete ? "bg-emerald-50" : "bg-slate-50"
                          }`}
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${
                              complete
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            <GroupIcon size={14} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <strong className="block text-[11px] font-black text-[#263f68]">
                              {group.title}
                            </strong>
                            <span className="mt-0.5 block truncate text-[8px] text-slate-500">
                              {group.description}
                            </span>
                          </span>

                          <strong className="text-[10px] font-black text-slate-700">
                            {completedCount}/{groupItems.length}
                          </strong>

                          <span
                            className={`grid h-7 w-7 place-items-center rounded-full ${
                              complete
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {complete ? (
                              <FaCheck size={9} />
                            ) : (
                              <FaExclamationTriangle size={9} />
                            )}
                          </span>

                          <FaChevronDown
                            size={9}
                            className={`text-slate-400 transition-transform ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expanded && (
                          <div className="bg-white px-3 py-2">
                            {groupItems.map((item) => (
                              <label
                                key={item.id}
                                className="flex cursor-pointer items-start gap-2.5 border-b border-slate-100 py-2.5 last:border-b-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() =>
                                    toggleVerification(item.id)
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 accent-emerald-600"
                                />
                                <span>
                                  <strong className="block text-[10px] font-black text-slate-700">
                                    {item.title}
                                  </strong>
                                  <span className="mt-0.5 block text-[8px] leading-4 text-slate-500">
                                    {item.description}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "charges" && (
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-[18px]">
                  <div>
                    <h2 className="text-[14px] font-black text-[#173f7a]">
                      Charges Reconciliation
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Pre-disbursement payment controls
                    </p>
                  </div>
                  <StatusBadge tone="success">Fully collected</StatusBadge>
                </div>

                <div className="overflow-x-auto p-5">
                  {caseCharges.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                      <p className="text-[11px] font-bold text-slate-600">
                        No charge records available
                      </p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[650px] border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-3 text-[8px] font-black uppercase tracking-wider text-slate-400">
                            Charge
                          </th>
                          <th className="px-4 py-3 text-[8px] font-black uppercase tracking-wider text-slate-400">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-[8px] font-black uppercase tracking-wider text-slate-400">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseCharges.map((charge) => (
                          <tr
                            key={charge.id ?? charge.label}
                            className="border-b border-slate-100"
                          >
                            <td className="px-4 py-3 text-[10px] font-bold text-slate-700">
                              {charge.label}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-black text-slate-800">
                              {formatCurrency(charge.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge tone="success">
                                {charge.status || "Collected"}
                              </StatusBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td className="px-4 py-3 text-[10px] font-black text-slate-700">
                            Total Charges Collected
                          </td>
                          <td className="px-4 py-3 text-[11px] font-black text-emerald-700">
                            {formatCurrency(totalCharges)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </section>
            )}

            {activeTab === "documents" && (
              
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#173f7a]">
        <FaFileAlt size={15} />
      </span>

      <div>
        <h2 className="text-[15px] font-black text-[#173f7a]">
          Application Documents
        </h2>
        <p className="mt-1 text-[10px] text-slate-400">
          Upload and track all required documents for this application
        </p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">
        {displayedDocuments.length} uploaded
      </span>
      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black text-slate-500">
        PDF, JPG, PNG · Max 15 MB
      </span>
    </div>
  </div>

  <div className="space-y-4 p-4 sm:p-5">
    
    {documentsLoading && (
  <div className="rounded-xl bg-blue-50 px-4 py-3 text-[10px] font-bold text-blue-700">
    Loading uploaded documents...
  </div>
)}

{documentsError && (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
    <p className="text-[10px] font-bold text-rose-700">
      {documentsError}
    </p>

    <button
      type="button"
      onClick={fetchApplicationDocuments}
      className="rounded-lg bg-rose-700 px-3 py-2 text-[9px] font-black text-white"
    >
      Retry
    </button>
  </div>
)}


{/* Already uploaded documents */}
{!documentsLoading &&
  !documentsError &&
  displayedDocuments.length > 0 && (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-emerald-100 bg-emerald-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <FaCheckCircle size={13} />
          </span>

          <div>
            <h3 className="text-[12px] font-black text-slate-800">
              Already Uploaded Documents
            </h3>

            <p className="mt-1 text-[9px] text-slate-500">
              Documents already available for this application
            </p>
          </div>
        </div>

        <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-emerald-700 ring-1 ring-emerald-200">
          {displayedDocuments.length} documents
        </span>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {displayedDocuments.map((document) => {
          const documentUrl =
            getDocumentUrl(document);

          return (
            <div
              key={document.id}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <FaFileAlt size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[10px] font-black text-slate-800">
                  {document.name}
                </strong>

                <p className="mt-1 truncate text-[8px] text-slate-500">
                  {String(document.type)
                    .replaceAll("_", " ")}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[7px] font-black text-emerald-700">
                    {String(document.status)
                      .replaceAll("_", " ")}
                  </span>

                  <span className="truncate text-[7px] text-slate-400">
                    Uploaded by {document.uploadedBy}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={!documentUrl}
                  onClick={() =>
                    previewDocument(document)
                  }
                  title={`Preview ${document.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaEye size={10} />
                </button>

                <button
                  type="button"
                  disabled={!documentUrl}
                  onClick={() =>
                    downloadDocument(document)
                  }
                  title={`Download ${document.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaDownload size={9} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

    {requiredDocumentSections.map((section) => {

      
      const completedCount = section.documents.filter(
        (item) => uploadedDocuments[item.id],
      ).length;

      const totalCount = section.documents.length;

      return (
        <div
          key={section.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[12px] font-black text-slate-800">
                {section.title}
              </h3>
              <p className="mt-1 text-[9px] text-slate-400">
                {completedCount} of {totalCount} documents uploaded
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${
                      totalCount === 0
                        ? 0
                        : Math.round(
                            (completedCount / totalCount) * 100,
                          )
                    }%`,
                  }}
                />
              </div>
              <span className="text-[9px] font-black text-slate-500">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {section.documents.map((documentItem, index) => {
              const selectedFile = selectedFiles[documentItem.id];
              const uploading = uploadingDocuments[documentItem.id];
              const uploaded = uploadedDocuments[documentItem.id];
              const uploadedFileName =
  uploaded?.fileName ??
  uploaded?.file_name ??
  uploaded?.documentName ??
  uploaded?.document_name ??
  documentItem.name;

const uploadedFileMeta =
  uploaded?.mimeType ??
  uploaded?.mime_type ??
  uploaded?.documentType ??
  uploaded?.document_type ??
  "Uploaded document";
              const error = uploadErrors[documentItem.id];

              return (
                <div
                  key={documentItem.id}
                  className="grid gap-4 px-4 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[40px_minmax(0,1.35fr)_minmax(0,1fr)_minmax(280px,0.95fr)_120px]"
                >
                  <div className="hidden lg:flex lg:items-center">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">
                      {index + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <FaFileAlt size={13} />
                      </span>

                      <div className="min-w-0">
                        <strong className="block text-[10px] font-black text-slate-800">
                          {documentItem.name}
                        </strong>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[7px] font-black text-slate-500">
                            {documentItem.documentType}
                          </span>

                          {uploaded && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[7px] font-black text-emerald-700">
                              Uploaded
                            </span>
                          )}
                        </div>

                        {error && (
                          <p className="mt-1.5 text-[8px] font-bold text-rose-600">
                            {error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                        Applicable for
                      </p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-600">
                        {documentItem.applicableFor}
                      </p>
                    </div>
                  </div>

                  {/* <div className="flex items-center">
                    <label
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                        selectedFile
                          ? "border-blue-200 bg-blue-50/50"
                          : "border-dashed border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                          selectedFile
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <FaUpload size={11} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[9px] font-black text-slate-700">
                          {selectedFile ? selectedFile.name : "Choose file"}
                        </strong>
                        <span className="mt-0.5 block text-[8px] text-slate-400">
                          PDF, JPG or PNG · Max 15 MB
                        </span>
                      </span>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(event) =>
                          handleDocumentFileChange(
                            documentItem.id,
                            event.target.files?.[0],
                          )
                        }
                      />
                    </label>
                  </div> */}


<div className="flex items-center">
  {uploaded ? (
    <div className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
        <FaCheckCircle size={12} />
      </span>

      <div className="min-w-0 flex-1">
        <strong className="block truncate text-[9px] font-black text-slate-800">
          {uploadedFileName}
        </strong>

        <span className="mt-0.5 block truncate text-[8px] text-slate-500">
          {uploadedFileMeta}
        </span>

        <span className="mt-1 block text-[8px] font-black text-emerald-700">
          Uploaded successfully
        </span>
      </div>
    </div>
  ) : (
    <label
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
        selectedFile
          ? "border-blue-200 bg-blue-50/50"
          : "border-dashed border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          selectedFile
            ? "bg-blue-600 text-white"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        <FaUpload size={11} />
      </span>

      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[9px] font-black text-slate-700">
          {selectedFile
            ? selectedFile.name
            : "Choose file"}
        </strong>

        <span className="mt-0.5 block text-[8px] text-slate-400">
          PDF, JPG or PNG · Max 15 MB
        </span>
      </span>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) =>
          handleDocumentFileChange(
            documentItem.id,
            event.target.files?.[0],
          )
        }
      />
    </label>
  )}
</div>


<div className="flex items-center justify-start gap-2 lg:justify-end">
  {uploaded ? (
    <>
      <button
        type="button"
        disabled={!getDocumentUrl(uploaded)}
        onClick={() =>
          previewDocument(uploaded)
        }
        title="Preview document"
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaEye size={11} />
      </button>

      <button
        type="button"
        disabled={!getDocumentUrl(uploaded)}
        onClick={() =>
          downloadDocument(uploaded)
        }
        title="Download document"
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaDownload size={10} />
      </button>
    </>
  ) : (
    <button
      type="button"
      disabled={!selectedFile || uploading}
      onClick={() =>
        handleUploadDocument(documentItem)
      }
      className="inline-flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-[#173f7a] px-3 text-[9px] font-black text-white transition hover:bg-[#102f5e] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
    >
      <FaUpload size={10} />

      {uploading
        ? "Uploading..."
        : "Upload"}
    </button>
  )}
</div>


                  {/* <div className="flex items-center justify-start lg:justify-end">
                    {uploaded ? (
                      <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-[9px] font-black text-emerald-700">
                        <FaCheckCircle size={10} />
                        Uploaded
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!selectedFile || uploading}
                        onClick={() => handleUploadDocument(documentItem)}
                        className="inline-flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-[#173f7a] px-3 text-[9px] font-black text-white transition hover:bg-[#102f5e] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <FaUpload size={10} />
                        {uploading ? "Uploading..." : "Upload"}
                      </button>
                    )}
                  </div> */}
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
</section>
        
              // <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              //   <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-[18px]">
              //     <div>
              //       <h2 className="text-[14px] font-black text-[#173f7a]">
              //         Documents Submitted by Maker
              //       </h2>
              //       <p className="mt-1 text-[10px] text-slate-400">
              //         Supporting documents for checker review
              //       </p>
              //     </div>
              //     <StatusBadge tone="blue">
              //       {displayedDocuments.length} documents
              //     </StatusBadge>
              //   </div>

              //   <div className="p-5">
              //     {documentsLoading ? (
              //       <div className="grid gap-3 md:grid-cols-2">
              //         {[1, 2, 3, 4].map((item) => (
              //           <div
              //             key={item}
              //             className="h-16 animate-pulse rounded-[14px] bg-slate-100"
              //           />
              //         ))}
              //       </div>
              //     ) : documentsError ? (
              //       <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              //         <p className="text-[10px] font-bold text-rose-700">
              //           {documentsError}
              //         </p>
              //         <button
              //           type="button"
              //           onClick={fetchApplicationDocuments}
              //           className="mt-3 rounded-lg bg-rose-700 px-3 py-2 text-[9px] font-black text-white"
              //         >
              //           Retry
              //         </button>
              //       </div>
              //     ) : displayedDocuments.length === 0 ? (
              //       <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              //         <FaFileAlt
              //           size={20}
              //           className="mx-auto text-slate-300"
              //         />
              //         <p className="mt-3 text-[11px] font-bold text-slate-600">
              //           No documents found
              //         </p>
              //       </div>
              //     ) : (
              //       <div className="grid gap-3 md:grid-cols-2">
              //         {displayedDocuments.map((document) => (
              //           <div
              //             key={document.id}
              //             className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-3"
              //           >
              //             <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-blue-100 text-blue-700">
              //               <FaFileAlt size={14} />
              //             </span>

              //             <div className="min-w-0 flex-1">
              //               <strong className="block truncate text-[10px] font-black text-slate-800">
              //                 {document.name}
              //               </strong>
              //               <span className="mt-1 block truncate text-[8px] text-slate-500">
              //                 {document.type} · Uploaded by{" "}
              //                 {document.uploadedBy}
              //               </span>
              //             </div>

              //             <button
              //               type="button"
              //               disabled={!document.fileUrl}
              //               onClick={() => previewDocument(document)}
              //               className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-700 disabled:opacity-40"
              //             >
              //               <FaEye size={11} />
              //             </button>

              //             <button
              //               type="button"
              //               disabled={!document.fileUrl}
              //               onClick={() => downloadDocument(document)}
              //               className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-700 disabled:opacity-40"
              //             >
              //               <FaDownload size={10} />
              //             </button>
              //           </div>
              //         ))}
              //       </div>
              //     )}
              //   </div>
              // </section>


            )}

            {activeTab === "audit" && (
              <section className="rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <FaClock className="mx-auto text-slate-300" size={24} />
                <h2 className="mt-3 text-[14px] font-black text-[#173f7a]">
                  Audit Trail
                </h2>
                <p className="mt-1 text-[10px] text-slate-400">
                  Workflow history will appear here when provided by the API.
                </p>
              </section>
            )}
          </main>

          {/* Sticky review decision */}
          <aside className="w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#173f7a]">
                  <FaShieldAlt size={14} />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-black text-[#173f7a]">
                      Review Decision
                    </h2>

                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black text-blue-700">
                      Final Checker Control
                    </span>
                  </div>

                  <p className="mt-1 text-[9px] text-slate-500">
                    Complete pending controls and submit to Operations Head.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <div className="min-w-[150px]">
                  <div className="flex items-center justify-between text-[8px] font-black text-slate-500">
                    <span>Review progress</span>
                    <span>{verifiedCount}/{verificationItems.length}</span>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        requiredItemsVerified
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl text-[9px] font-black ${
                    requiredItemsVerified
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {completionPercentage}%
                </span>
              </div>
            </div>

            <div className="p-5">
              <div>
                <div className="flex items-center justify-between rounded-[13px] border border-slate-100 bg-slate-50 p-3">
                <strong className="text-[11px] text-slate-800">
                  Review completion
                </strong>
                <span
                  className={`text-[11px] font-black ${
                    requiredItemsVerified
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {verifiedCount} / {verificationItems.length}
                </span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    requiredItemsVerified
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {!requiredItemsVerified && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <strong className="text-[9px] font-black text-amber-800">
                    Pending mandatory controls
                  </strong>
                  <ul className="mt-1.5 space-y-1 pl-4 text-[8px] leading-4 text-amber-800">
                    {pendingRequiredItems.map((item) => (
                      <li key={item.id}>{item.title}</li>
                    ))}
                  </ul>
                </div>
              )}

              </div>

              <div>
                <label className="block">
                <span className="mb-1.5 block text-[10px] font-black text-slate-600">
                  Checker Remarks
                </span>
                <textarea
                  rows={4}
                  value={checkerRemarks}
                  onChange={(event) =>
                    setCheckerRemarks(event.target.value)
                  }
                  placeholder="Enter observations, validations or conditions..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label
                className={`mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 ${
                  declarationAccepted
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(event) =>
                    setDeclarationAccepted(event.target.checked)
                  }
                  className="mt-0.5 h-3.5 w-3.5 accent-emerald-600"
                />

                <span>
                  <strong className="block text-[10px] font-black text-slate-800">
                    Independent Checker Declaration
                  </strong>
                  <span className="mt-1 block text-[8px] leading-4 text-slate-500">
                    I independently reviewed the maker instruction,
                    beneficiary details, charges, compliance controls and
                    supporting documents.
                  </span>
                </span>
              </label>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  disabled={!approvalReady || decisionSubmitting}
                  onClick={() => openDecisionModal("approve")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173f7a] px-4 text-[10px] font-black text-white hover:bg-[#102f5e] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <FaCheckCircle size={11} />
                  Approve & Send to Ops Head
                </button>

                <button
                  type="button"
                  onClick={() => openDecisionModal("return")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-[10px] font-black text-rose-700 hover:bg-rose-50"
                >
                  <FaUndo size={10} />
                  Return to Maker
                </button>

                <button
                  type="button"
                  onClick={() =>
                    showToast("Checker review saved as draft.")
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-[10px] font-black text-slate-600 hover:bg-slate-200"
                >
                  <FaSave size={10} />
                  Save Review
                </button>
              </div>

                <p className="mt-3 text-center text-[8px] text-slate-400">
                  Every action will be recorded in the workflow audit trail.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {decisionModal && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div
              className={`px-5 py-5 text-white ${
                decisionModal === "approve"
                  ? "bg-gradient-to-r from-[#173f7a] to-[#0f766e]"
                  : "bg-gradient-to-r from-rose-800 to-rose-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/60">
                    Checker Decision
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    {decisionModal === "approve"
                      ? "Approve Application"
                      : "Return Case to Maker"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDecisionModal}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <FaTimes size={11} />
                </button>
              </div>
            </div>

            <div className="p-5">
              {decisionModal === "approve" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[10px] leading-5 text-emerald-900">
                    This will lock the checker review and send the application
                    to Operations Head.
                  </p>
                </div>
              ) : (
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black text-slate-600">
                    Reason for Return
                  </span>
                  <textarea
                    rows={4}
                    value={returnReason}
                    onChange={(event) =>
                      setReturnReason(event.target.value)
                    }
                    placeholder="Clearly mention the discrepancy or correction required..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] outline-none focus:border-rose-300 focus:bg-white"
                  />
                </label>
              )}

              {decisionError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <FaExclamationTriangle
                    className="mt-0.5 shrink-0 text-rose-600"
                    size={12}
                  />
                  <p className="text-[9px] leading-4 text-rose-700">
                    {decisionError}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDecisionModal}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={decisionSubmitting}
                  onClick={confirmDecision}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                    decisionModal === "approve"
                      ? "bg-[#173f7a] hover:bg-[#102f5e]"
                      : "bg-rose-700 hover:bg-rose-800"
                  }`}
                >
                  {decisionModal === "approve" ? (
                    <>
                      <FaCheckCircle size={11} />
                      {decisionSubmitting
                        ? "Approving..."
                        : "Confirm Approval"}
                    </>
                  ) : (
                    <>
                      <FaUndo size={10} />
                      Return to Maker
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
            <FaCheck size={9} />
          </span>
          <p className="text-[10px] font-bold text-slate-700">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}

