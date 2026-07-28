
import { useCallback, useEffect, useMemo, useState } from "react";
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
  FaUpload,
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

// const documents = [
//   {
//     id: 1,
//     name: "Sanction Letter",
//     type: "PDF",
//     uploadedBy: "Credit Team",
//     status: "Verified",
//   },
//   {
//     id: 2,
//     name: "Executed Loan Agreement",
//     type: "PDF",
//     uploadedBy: "Operations Maker",
//     status: "Verified",
//   },
//   {
//     id: 3,
//     name: "Property Original Inventory",
//     type: "PDF",
//     uploadedBy: "Operations Maker",
//     status: "Verified",
//   },
//   {
//     id: 4,
//     name: "Beneficiary Bank Proof",
//     type: "PDF",
//     uploadedBy: "Operations Maker",
//     status: "Verified",
//   },
// ];

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



const requiredDocumentSections = [
  {
    id: "login-application",
    title: "B. Login and Application Documents",
    documents: [
      { id: "loan-application-form", name: "Loan application form duly filled and signed", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
      { id: "applicant-photograph", name: "Applicant photograph", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "PHOTO" },
      { id: "partner-login-sheet", name: "Partner login sheet / SFTP upload confirmation", applicableFor: "SFT Finance / Partner", documentType: "OTHER" },
      { id: "customer-consent", name: "Customer consent for bureau, KYC verification and data sharing", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
    ],
  },
  {
    id: "kyc-documents",
    title: "C. KYC Documents",
    documents: [
      { id: "pan-card", name: "PAN card", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "PAN" },
      { id: "aadhaar-card", name: "Aadhaar card", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "AADHAAR" },
      { id: "address-proof", name: "Address proof - any one: Aadhaar, passport, voter ID, driving licence, utility bill, rent agreement or bank statement", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
      { id: "ckyc-form", name: "CKYC Form", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
    ],
  },
  {
    id: "income-banking",
    title: "D. Income and Banking Documents",
    documents: [
      { id: "bank-statement", name: "Latest 6 months bank statement", applicableFor: "Applicant / Business / Salary Account", documentType: "BANK_STATEMENT" },
      { id: "itr-financials", name: "ITR with computation / financials, if applicable", applicableFor: "Applicant / Business Entity", documentType: "INCOME_PROOF" },
      { id: "salary-slips", name: "Salary slips / Form 16, if salaried", applicableFor: "Salaried Applicant", documentType: "INCOME_PROOF" },
      { id: "gst-business-proof", name: "GST returns / business proof, if self-employed", applicableFor: "Self-employed Applicant / Entity", documentType: "INCOME_PROOF" },
    ],
  },
  {
    id: "bureau-credit-verification",
    title: "E. Bureau, Credit and Verification",
    documents: [
      { id: "bureau-report", name: "Bureau report", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
      { id: "pd-sheet", name: "PD sheet / customer discussion note", applicableFor: "Credit / Partner", documentType: "OTHER" },
      { id: "cam-credit-appraisal", name: "CAM / credit appraisal note", applicableFor: "Credit Team", documentType: "OTHER" },
      { id: "fi-fcu-verification", name: "FI / residence / office verification, if applicable & FCU", applicableFor: "Verification Agency / Credit", documentType: "OTHER" },
      { id: "approval-sanction-conditions", name: "Approval note and sanction Conditions", applicableFor: "Credit Approver", documentType: "OTHER" },
    ],
  },
  {
    id: "property-documents",
    title: "F. Property Documents",
    documents: [
      { id: "property-title-documents", name: "Property title documents / chain documents", applicableFor: "Property Owner", documentType: "PROPERTY_DOCUMENT" },
      { id: "property-tax-utility", name: "Latest property tax receipt / electricity bill / maintenance bill", applicableFor: "Property Owner", documentType: "PROPERTY_DOCUMENT" },
      { id: "approved-plan-oc-cc", name: "Approved plan / OC / CC / society NOC, wherever applicable", applicableFor: "Property Owner / Builder / Society", documentType: "PROPERTY_DOCUMENT" },
      { id: "legal-search-report", name: "Legal search report / title clearance report", applicableFor: "Empanelled Advocate", documentType: "PROPERTY_DOCUMENT" },
      { id: "technical-valuation-report", name: "Technical valuation report", applicableFor: "Empanelled Valuer", documentType: "PROPERTY_DOCUMENT" },
      { id: "cersai-report", name: "CERSAI search / report, if applicable", applicableFor: "Credit / Legal", documentType: "PROPERTY_DOCUMENT" },
    ],
  },
  {
    id: "sanction-documentation-disbursement",
    title: "G. Sanction, Documentation and Disbursement",
    documents: [
      { id: "accepted-sanction-letter", name: "Sanction letter accepted by borrower", applicableFor: "Applicant / Co-applicant", documentType: "OTHER" },
      { id: "executed-loan-agreement", name: "Loan agreement and all standard loan documents executed", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
      { id: "nach-cancelled-cheque", name: "NACH / repayment mandate and cancelled cheque", applicableFor: "Applicant / Borrower Bank Account", documentType: "OTHER" },
      { id: "mortgage-documents", name: "Mortgage creation documents executed", applicableFor: "Borrower / Property Owner", documentType: "PROPERTY_DOCUMENT" },
      { id: "original-title-deeds", name: "Original title deeds received for custody", applicableFor: "Fintree Custody / Branch Hub", documentType: "PROPERTY_DOCUMENT" },
      { id: "security-cheques", name: "Security cheques, if applicable", applicableFor: "Applicant / Co-applicant / Guarantor", documentType: "OTHER" },
      { id: "final-disbursement-memo", name: "Final disbursement memo / checklist approved", applicableFor: "Credit / Operations / Authorised Signatory", documentType: "OTHER" },
      { id: "beneficiary-bank-verification", name: "Beneficiary bank details verified", applicableFor: "Operations", documentType: "OTHER" },
      { id: "disbursement-utr", name: "Disbursement UTR / payment confirmation", applicableFor: "Accounts / Operations", documentType: "OTHER" },
    ],
  },
  {
    id: "post-disbursement",
    title: "H. Post Disbursement",
    documents: [
      { id: "custody-acknowledgement", name: "Document custody acknowledgement", applicableFor: "Fintree Custody / Branch Hub", documentType: "PROPERTY_DOCUMENT" },
      { id: "pdd-otc-tracker", name: "PDD / OTC tracker updated, if any", applicableFor: "Operations", documentType: "OTHER" },
      { id: "post-disbursement-mis", name: "Post-disbursement MIS shared with partner", applicableFor: "MIS Team", documentType: "OTHER" },
    ],
  },
];

export default function OpsMaker() {
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
  const [activeTab, setActiveTab] = useState("overview");

  const [decisionSubmitting, setDecisionSubmitting] =
    useState(false);

  const verifiedCount = useMemo(
    () => verificationItems.filter((item) => item.checked).length,
    [verificationItems],
  );
const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingDocuments, setUploadingDocuments] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});


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
            ? `${caseData?.sanction?.loanTenure ||
            caseData?.loanTenure
            } Months`
            : "-",
      },
      {
        label: "Interest Rate",
        value:
          caseData?.sanction?.interestRate ||
            caseData?.interestRate
            ? `${caseData?.sanction?.interestRate ||
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
          await operationApi.getMakerCase(
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
          await operationApi.approveByOpsMaker(
            applicationId,
          );

        const result =
          response?.data?.data ??
          response?.data ??
          {};

        setPageStatus(
          result?.status ||
          "OPS_MAKER_APPROVED",
        );

        closeDecisionModal();

        showToast(
          "Case approved and submitted to Operations Head.",
        );
      } catch (error) {
        console.error(
          "Unable to approve by Operations Maker:",
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

  const handleDocumentFileChange = (documentId, file) => {
    if (!file) {
      setSelectedFiles((current) => {
        const updated = { ...current };
        delete updated[documentId];
        return updated;
      });
      return;
    }

    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedMimeTypes.includes(file.type)) {
      setUploadErrors((current) => ({
        ...current,
        [documentId]: "Only PDF, JPG, JPEG and PNG files are allowed.",
      }));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
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

    if (!Number.isInteger(normalizedApplicationId) || normalizedApplicationId <= 0) {
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
      formData.append("applicationId", String(normalizedApplicationId));
      formData.append("documentType", documentItem.documentType);
      formData.append("documentName", documentItem.name);
      formData.append("documentSource", "OPS_MAKER");
      formData.append("file", file);

      const response = await operationApi.uploadDocument(formData);

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
      showToast(`${documentItem.name} uploaded successfully.`);
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

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
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

//   const applicationDocuments = useMemo(
//   () => documents.map(getDocumentViewModel),
//   [documents], 
// );

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

  const pendingRequiredItems = verificationItems.filter(
    (item) => item.required && !item.checked,
  );

  const completionPercentage = Math.round(
    (verifiedCount / verificationItems.length) * 100,
  );

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
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#102a56] via-[#173f7a] to-[#0f766e] p-5 text-white shadow-[0_20px_50px_rgba(23,63,122,0.18)] sm:p-6">
          <div className="pointer-events-none absolute -right-40 -top-44 h-[360px] w-[360px] rounded-full border-[55px] border-white/5" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_450px] xl:items-center">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">
                Operations Maker Review
              </p>
              <h1 className="mt-2 text-[30px] font-black leading-none tracking-tight">
                {applicationNumber}
              </h1>
              <p className="mt-3 max-w-3xl text-[12px] font-medium leading-5 text-blue-100">
                Review the customer, sanction, beneficiary instruction, charges,
                documents and mandatory operational controls before sending the
                case to Operations Checker.
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
                <p className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-200">Sanctioned</p>
                <p className="mt-2 text-[17px] font-black">{formatCurrency(sanctionedAmount)}</p>
                <span className="mt-1 block text-[9px] text-slate-300">Approved by credit</span>
              </div>
              <div className="rounded-[14px] border border-white/15 bg-white/10 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-200">Disbursement</p>
                <p className="mt-2 text-[17px] font-black">{formatCurrency(disbursementAmount)}</p>
                <span className="mt-1 block text-[9px] text-slate-300">
                  {caseData?.disbursement?.type || caseData?.disbursementType || "Single disbursement"}
                </span>
              </div>
              <div className="rounded-[14px] border border-white/15 bg-white/10 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-200">Current Status</p>
                <p className="mt-2 break-words text-[13px] font-black">{String(pageStatus || "Awaiting checker").replaceAll("_", " ")}</p>
                <span className="mt-1 block text-[9px] text-slate-300">{pendingRequiredItems.length} controls pending</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-50 text-emerald-700"><FaCheck size={11} /></span>
            <div><p className="text-[10px] font-bold text-slate-400">Charges</p><p className="mt-0.5 text-[12px] font-black text-slate-800">Payment verified</p></div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-50 text-emerald-700"><FaFileAlt size={12} /></span>
            <div><p className="text-[10px] font-bold text-slate-400">Documents</p><p className="mt-0.5 text-[12px] font-black text-slate-800">{displayedDocuments.length} available</p></div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4">
            <span className={`grid h-9 w-9 place-items-center rounded-[10px] ${requiredItemsVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {requiredItemsVerified ? <FaCheck size={11} /> : <FaExclamationTriangle size={11} />}
            </span>
            <div><p className="text-[10px] font-bold text-slate-400">Checklist</p><p className="mt-0.5 text-[12px] font-black text-slate-800">{verifiedCount} of {verificationItems.length} complete</p></div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-blue-50 text-blue-700"><FaCheckCircle size={12} /></span>
            <div><p className="text-[10px] font-bold text-slate-400">Next Stage</p><p className="mt-0.5 text-[12px] font-black text-slate-800">Operations Checker</p></div>
          </div>
        </section>

        <nav className="mt-5 flex w-full gap-1 overflow-x-auto rounded-[14px] bg-[#eaf0f7] p-1.5 sm:w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[11px] font-black transition ${activeTab === tab.id ? "bg-white text-[#173f7a] shadow-[0_3px_10px_rgba(15,23,42,0.08)]" : "text-slate-500 hover:text-[#173f7a]"}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-5 space-y-5">
          <main className="min-w-0">
            {activeTab === "overview" && (
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-[18px]">
                  <div><h2 className="text-[14px] font-black text-[#173f7a]">Case Overview</h2><p className="mt-1 text-[10px] text-slate-400">Customer, sanction and bank instruction details</p></div>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-700">Live data</span>
                </div>
                <div className="grid gap-0 xl:grid-cols-2">
                  <div className="p-5">
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-blue-100 text-blue-700"><FaUserTie size={13} /></span>
                      <div><h3 className="text-[11px] font-black text-[#173f7a]">Customer & Loan</h3><p className="mt-0.5 text-[8px] text-slate-500">Borrower, product and sanction information</p></div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {customerLoanDetails.map((detail) => (
                        <div key={detail.label} className="flex min-h-[70px] flex-col justify-center rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm">
                          <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">{detail.label}</p>
                          <p className="mt-1.5 break-words text-[11px] font-extrabold text-slate-800">{detail.value || "-"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 p-5 xl:border-l xl:border-t-0">
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-100 text-emerald-700"><FaUniversity size={13} /></span><div><h3 className="text-[11px] font-black text-[#173f7a]">Disbursement Instruction</h3><p className="mt-0.5 text-[8px] text-slate-500">Beneficiary bank and payment instruction</p></div></div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-slate-500 ring-1 ring-slate-200"><FaLock size={7} /> Read only</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {disbursementDetails.map((detail) => (
                        <div key={detail.label} className="flex min-h-[70px] flex-col justify-center rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm">
                          <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">{detail.label}</p>
                          <p className={`mt-1.5 break-words text-[11px] font-extrabold ${detail.status === "success" ? "text-emerald-700" : detail.status === "pending" ? "text-amber-700" : "text-slate-800"}`}>{detail.value || "-"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "checklist" && (
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-[18px]">
                  <div><h2 className="text-[14px] font-black text-[#173f7a]">Operations Maker Checklist</h2><p className="mt-1 text-[10px] text-slate-400">Complete mandatory controls before sending to checker</p></div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black ${requiredItemsVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{verifiedCount} / {verificationItems.length} complete</span>
                </div>
                <div className="px-5 pt-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Mandatory control completion</span><strong>{completionPercentage}%</strong></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${requiredItemsVerified ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-amber-400"}`} style={{ width: `${completionPercentage}%` }} /></div>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {checklistGroups.map((group) => {
                    const GroupIcon = group.icon;
                    const groupItems = verificationItems.filter((item) => group.itemIds.includes(item.id));
                    const completedCount = groupItems.filter((item) => item.checked).length;
                    const complete = completedCount === groupItems.length;
                    const expanded = expandedChecklistGroups.includes(group.id);
                    return (
                      <div key={group.id} className={`overflow-hidden rounded-[14px] border ${complete ? "border-emerald-200" : "border-slate-200"}`}>
                        <button type="button" onClick={() => toggleChecklistGroup(group.id)} className={`flex w-full items-center gap-3 p-3 text-left ${complete ? "bg-emerald-50" : "bg-slate-50"}`}>
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}><GroupIcon size={14} /></span>
                          <span className="min-w-0 flex-1"><strong className="block text-[11px] font-black text-[#263f68]">{group.title}</strong><span className="mt-0.5 block truncate text-[8px] text-slate-500">{group.description}</span></span>
                          <strong className="text-[10px] font-black text-slate-700">{completedCount}/{groupItems.length}</strong>
                          <span className={`grid h-7 w-7 place-items-center rounded-full ${complete ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"}`}>{complete ? <FaCheck size={9} /> : <FaExclamationTriangle size={9} />}</span>
                          <FaChevronDown size={9} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                        {expanded && <div className="bg-white px-3 py-2">{groupItems.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-2.5 border-b border-slate-100 py-2.5 last:border-b-0"><input type="checkbox" checked={item.checked} onChange={() => toggleVerification(item.id)} className="mt-0.5 h-3.5 w-3.5 accent-emerald-600" /><span><strong className="block text-[10px] font-black text-slate-700">{item.title}</strong><span className="mt-0.5 block text-[8px] leading-4 text-slate-500">{item.description}</span></span></label>)}</div>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "charges" && (
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-[18px]"><div><h2 className="text-[14px] font-black text-[#173f7a]">Charges Reconciliation</h2><p className="mt-1 text-[10px] text-slate-400">Pre-disbursement payment controls</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">Fully collected</span></div>
                <div className="overflow-x-auto p-5"><table className="w-full min-w-[650px] border-collapse text-left"><thead><tr className="bg-slate-50"><th className="px-4 py-3 text-[8px] font-black uppercase tracking-wider text-slate-400">Charge</th><th className="px-4 py-3 text-[8px] font-black uppercase tracking-wider text-slate-400">Amount</th><th className="px-4 py-3 text-[8px] font-black uppercase tracking-wider text-slate-400">Status</th></tr></thead><tbody>{charges.map((charge) => <tr key={charge.label} className="border-b border-slate-100"><td className="px-4 py-3 text-[10px] font-bold text-slate-700">{charge.label}</td><td className="px-4 py-3 text-[10px] font-black text-slate-800">{charge.amount}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">{charge.status}</span></td></tr>)}</tbody></table></div>
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

            {activeTab === "audit" && <section className="rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)]"><FaClock className="mx-auto text-slate-300" size={24} /><h2 className="mt-3 text-[14px] font-black text-[#173f7a]">Audit Trail</h2><p className="mt-1 text-[10px] text-slate-400">Workflow history will appear here when provided by the API.</p></section>}
          </main>

          <aside className="w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#173f7a]"><FaShieldAlt size={14} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[15px] font-black text-[#173f7a]">Maker Decision</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black text-blue-700">Send to Checker</span></div><p className="mt-1 text-[9px] text-slate-500">Complete pending controls and submit the live case to Operations Checker.</p></div></div>
              <div className="flex items-center gap-3"><div className="min-w-[150px]"><div className="flex items-center justify-between text-[8px] font-black text-slate-500"><span>Review progress</span><span>{verifiedCount}/{verificationItems.length}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${requiredItemsVerified ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${completionPercentage}%` }} /></div></div><span className={`grid h-9 w-9 place-items-center rounded-xl text-[9px] font-black ${requiredItemsVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{completionPercentage}%</span></div>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
              <div>
                <label className="block"><span className="mb-2 block text-[10px] font-black text-slate-600">Maker Remarks</span><textarea rows={4} value={checkerRemarks} onChange={(event) => setCheckerRemarks(event.target.value)} placeholder="Enter maker observations, validations or conditions..." className="block w-full resize-none rounded-[13px] border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-medium text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50" /></label>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[13px] border border-emerald-200 bg-emerald-50/50 p-4"><input type="checkbox" checked={declarationAccepted} onChange={(event) => setDeclarationAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" /><div><strong className="text-[11px] font-black text-slate-800">Operations Maker Declaration</strong><p className="mt-1 text-[9px] leading-4 text-slate-600">I confirm that the customer, sanction, beneficiary bank details, charges, supporting documents and all mandatory operational controls have been reviewed.</p></div></label>
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                {!approvalReady && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><FaExclamationTriangle className="mt-0.5 text-amber-600" size={13} /><p className="text-[9px] leading-4 text-amber-800">Complete every mandatory verification and accept the declaration before approval.</p></div>}
                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <button type="button" onClick={() => showToast("Maker review saved as draft.")} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-600"><FaSave size={11} /> Save Review</button>
                  <button type="button" onClick={() => openDecisionModal("return")} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-4 text-[10px] font-black text-rose-700"><FaUndo size={10} /> Return Case</button>
                  <button type="button" disabled={decisionSubmitting} onClick={() => openDecisionModal("approve")} className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[10px] font-black text-white ${decisionSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-[#173f7a] hover:bg-[#102a56]"}`}><FaCheckCircle size={11} />{decisionSubmitting ? "Approving..." : "Approve & Send to Ops Checker"}</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {decisionModal && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[20px] bg-white shadow-2xl">
            <div className={`px-6 py-5 text-white ${decisionModal === "approve" ? "bg-gradient-to-r from-[#173f7a] to-[#0f766e]" : "bg-gradient-to-r from-rose-700 to-rose-500"}`}>
              <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/70">Maker Decision</p><h2 className="mt-1 text-[18px] font-black">{decisionModal === "approve" ? "Send to Operations Checker" : "Return Case"}</h2></div><button type="button" aria-label="Close decision modal" onClick={closeDecisionModal} className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 hover:bg-white/25"><FaTimes size={13} /></button></div>
            </div>
            <div className="p-6">
              {decisionModal === "approve" ? <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><FaCheckCircle className="mt-0.5 text-emerald-700" size={17} /><p className="text-[10px] leading-5 text-emerald-900">Approval will submit this case using the existing Operations Maker workflow.</p></div> : <label className="block"><span className="mb-2 block text-[10px] font-black text-slate-600">Reason for Return</span><textarea rows={4} value={returnReason} onChange={(event) => setReturnReason(event.target.value)} placeholder="Clearly mention the discrepancy or correction required..." className="block w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-700 outline-none focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-50" /></label>}
              {decisionError && <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"><FaExclamationTriangle className="mt-0.5 text-rose-600" size={14} /><p className="text-[10px] leading-5 text-rose-700">{decisionError}</p></div>}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeDecisionModal} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[10px] font-black text-slate-600">Cancel</button><button type="button" disabled={decisionSubmitting} onClick={confirmDecision} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-60 ${decisionModal === "approve" ? "bg-[#173f7a] hover:bg-[#102a56]" : "bg-rose-700 hover:bg-rose-800"}`}>{decisionModal === "approve" ? <FaCheckCircle size={13} /> : <FaUndo size={12} />}{decisionSubmitting ? "Approving..." : decisionModal === "approve" ? "Confirm Approval" : "Return Case"}</button></div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white"><FaCheck size={11} /></span><p className="text-xs font-bold text-slate-700">{toastMessage}</p></div>}
    </div>
  );
}
