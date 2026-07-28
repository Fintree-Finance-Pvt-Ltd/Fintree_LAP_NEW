import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaChevronDown,
  FaCloudUploadAlt,
  FaEye,
  FaFileAlt,
  FaFolderOpen,
  FaInfoCircle,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaTimes,
  FaUpload,
  FaDownload,
  FaUserTag,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth.js";
import { rmApi } from "../rmApi.js";
import { requiredDocumentTypes } from "../rmUtils.js";

const documentLabels = {
  PAN: "PAN Card",
  AADHAAR: "Aadhaar / OVD",
  PHOTO: "Photograph",
  BANK_STATEMENT: "Last 6 Months Bank Statement",
  ITR: "ITR",
  PROPERTY_DOCUMENT: "Property Document",
  INCOME_PROOF: "Income Proof",
  CUSTOMER_CONSENT: "Customer Consent",
  VALUATION_REPORT: "Valuation Report",
  CREDIT_MEMO: "Credit Memo",
  LEGAL_OPINION: "Legal Opinion",
  SANCTION_NOTE: "Sanction Note",
  OTHER: "Other Document",

  CUSTOMER_RESIDENCE_FRONTAGE: "Customer Residence Frontage",
  CUSTOMER_RESIDENCE_INTERIOR: "Customer Residence Interior",
  CUSTOMER_WITH_RESIDENCE: "Customer with Residence",
  RESIDENCE_NEARBY_LANDMARK: "Residence Nearby Landmark",

  BUSINESS_FRONTAGE: "Business Frontage",
  BUSINESS_SIGNBOARD: "Business Signboard",
  BUSINESS_INTERIOR: "Business Interior",
  BUSINESS_STOCK: "Business Stock",
  BUSINESS_EMPLOYEE_SETUP: "Business Employee Setup",

  RESIDENTIAL_PROPERTY_FRONTAGE: "Residential Property Frontage",
  RESIDENTIAL_PROPERTY_ENTRANCE: "Residential Property Entrance",
  RESIDENTIAL_PROPERTY_INTERIOR: "Residential Property Interior",
  RESIDENTIAL_PROPERTY_LANDMARK: "Residential Property Landmark",

  COMMERCIAL_PROPERTY_FRONTAGE: "Commercial Property Frontage",
  COMMERCIAL_PROPERTY_SIGNBOARD: "Commercial Property Signboard",
  COMMERCIAL_PROPERTY_INTERIOR: "Commercial Property Interior",
  COMMERCIAL_PROPERTY_LANDMARK: "Commercial Property Landmark",

  INDUSTRIAL_PROPERTY_GATE: "Industrial Property Gate",
  INDUSTRIAL_PROPERTY_SHED: "Industrial Property Shed",
  INDUSTRIAL_PROPERTY_MACHINERY: "Industrial Property Machinery",
  INDUSTRIAL_PROPERTY_APPROACH_ROAD: "Industrial Property Approach Road",

  LAND_PLOT_FRONTAGE: "Land / Plot Frontage",
  LAND_PLOT_BOUNDARY: "Land / Plot Boundary",
  LAND_PLOT_CORNER: "Land / Plot Corner",
  LAND_PLOT_SURVEY_MARKER: "Land / Plot Survey Marker",
  LAND_PLOT_APPROACH_ROAD: "Land / Plot Approach Road",
};

const ROLE_PRIORITY = [
  "ADMIN",
  "RM",
  "BM",
  "CM",
  "CREDIT_MAKER",
  "CREDIT_CHECKER",
  "VALUATION",
  "LEGAL",
  "SANCTION",
  "OPS_MAKER",
  "OPS_CHECKER",
];

const DOCUMENT_PAGE_CONFIG = {
  ADMIN: {
    title: "All Application Documents",
    subtitle: "Admin can view and upload documents across all applications.",
    source: "ADMIN_PORTAL",
    emptyText: "No applications available",
  },

  RM: {
    title: "KYC, Consent & Document Checklist",
    subtitle: "Upload applicant KYC, banking, income and property documents.",
    source: "RM_PORTAL",
    emptyText: "No RM document cases available",
  },

  BM: {
    title: "BM Document Review",
    subtitle: "Review and upload documents for BM level cases.",
    source: "BM_PORTAL",
    emptyText: "No BM document cases available",
  },

  CM: {
    title: "CM Document Review",
    subtitle: "View and upload documents for BM-approved / moved-from-BM cases.",
    source: "CM_PORTAL",
    emptyText: "No BM-approved / moved-from-BM cases available",
  },

  CREDIT_MAKER: {
    title: "Credit Maker Documents",
    subtitle: "View and upload documents required for credit maker underwriting.",
    source: "CREDIT_MAKER_PORTAL",
    emptyText: "No BM-approved / moved-from-BM cases available",
  },

  CREDIT_CHECKER: {
    title: "Credit Checker Documents",
    subtitle: "Review and upload supporting documents before credit checker decision.",
    source: "CREDIT_CHECKER_PORTAL",
    emptyText: "No BM-approved / moved-from-BM cases available",
  },

  VALUATION: {
    title: "Valuation Document Checklist",
    subtitle: "Upload valuation report and collateral supporting documents.",
    source: "VALUATION_PORTAL",
    emptyText: "No BM-approved / moved-from-BM cases available",
  },

  LEGAL: {
    title: "Legal Document Review",
    subtitle: "View and upload legal / property documents for legal verification.",
    source: "LEGAL_PORTAL",
    emptyText: "No legal document cases available",
  },

  SANCTION: {
    title: "Sanction Document Review",
    subtitle: "View and upload documents before sanction processing.",
    source: "SANCTION_PORTAL",
    emptyText: "No sanction document cases available",
  },

  OPS_MAKER: {
    title: "Ops Maker Documents",
    subtitle: "View and upload operation documents.",
    source: "OPS_MAKER_PORTAL",
    emptyText: "No operation maker document cases available",
  },

  OPS_CHECKER: {
    title: "Ops Checker Documents",
    subtitle: "View and upload operation checker documents.",
    source: "OPS_CHECKER_PORTAL",
    emptyText: "No operation checker document cases available",
  },
};

const POST_BM_STAGES = [
  "CM",
  "CREDIT",
  "VALUATION",
  "LEGAL",
  "SANCTION",
  "AGREEMENT",
  "DISBURSEMENT",
  "ACTIVE",
  "COLLECTION",
  "CLOSED",
];

const APPLICATION_DOCUMENT_SECTIONS = [
  {
    id: "login-application",
    title: "B. Login and Application Documents",
    documents: [
      {
        srNo: 1,
        id: "loan-application-form",
        name: "Loan application form duly filled and signed",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 2,
        id: "applicant-photograph",
        name: "Applicant photograph",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "PHOTO",
        defaultRemark: "Received",
      },
      {
        srNo: 3,
        id: "partner-login-sheet",
        name: "Partner login sheet / SFTP upload confirmation",
        applicableFor: "SFT Finance / Partner",
        documentType: "OTHER",
        defaultRemark: "NA",
      },
      {
        srNo: 4,
        id: "customer-consent",
        name: "Customer consent for bureau, KYC verification and data sharing",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "NA",
      },
    ],
  },
  {
    id: "kyc-documents",
    title: "C. KYC Documents",
    documents: [
      {
        srNo: 5,
        id: "pan-card",
        name: "PAN card",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "PAN",
        defaultRemark: "Received",
      },
      {
        srNo: 6,
        id: "aadhaar-card",
        name: "Aadhaar card",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "AADHAAR",
        defaultRemark: "Received",
      },
      {
        srNo: 7,
        id: "address-proof",
        name: "Address proof - any one: Aadhaar, passport, voter ID, driving licence, utility bill, rent agreement or bank statement",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 8,
        id: "ckyc-form",
        name: "CKYC Form",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "Pending",
      },
    ],
  },
  {
    id: "income-banking",
    title: "D. Income and Banking Documents",
    documents: [
      {
        srNo: 9,
        id: "bank-statement",
        name: "Latest 6 months bank statement",
        applicableFor: "Applicant / Business / Salary Account",
        documentType: "BANK_STATEMENT",
        defaultRemark: "Received",
      },
      {
        srNo: 10,
        id: "itr-financials",
        name: "ITR with computation / financials, if applicable",
        applicableFor: "Applicant / Business Entity",
        documentType: "INCOME_PROOF",
        defaultRemark: "NA",
      },
      {
        srNo: 11,
        id: "salary-slips",
        name: "Salary slips / Form 16, if salaried",
        applicableFor: "Salaried Applicant",
        documentType: "INCOME_PROOF",
        defaultRemark: "NA",
      },
      {
        srNo: 12,
        id: "gst-business-proof",
        name: "GST returns / business proof, if self-employed",
        applicableFor: "Self-employed Applicant / Entity",
        documentType: "INCOME_PROOF",
        defaultRemark: "NA",
      },
    ],
  },
  {
    id: "bureau-credit-verification",
    title: "E. Bureau, Credit and Verification",
    documents: [
      {
        srNo: 13,
        id: "bureau-report",
        name: "Bureau report",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 14,
        id: "pd-sheet",
        name: "PD sheet / customer discussion note",
        applicableFor: "Credit / Partner",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 15,
        id: "cam-credit-note",
        name: "CAM / credit appraisal note",
        applicableFor: "Credit Team",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 16,
        id: "fi-fcu-verification",
        name: "FI / residence / office verification, if applicable & FCU",
        applicableFor: "Verification Agency / Credit",
        documentType: "OTHER",
        defaultRemark: "FCU pending",
      },
      {
        srNo: 17,
        id: "approval-sanction-conditions",
        name: "Approval note and sanction Conditions",
        applicableFor: "Credit Approver",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
    ],
  },
  {
    id: "property-documents",
    title: "F. Property Documents",
    documents: [
      {
        srNo: 18,
        id: "property-title-documents",
        name: "Property title documents / chain documents",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Copy Received",
      },
      {
        srNo: 19,
        id: "property-tax-utility-bill",
        name: "Latest property tax receipt / electricity bill / maintenance bill",
        applicableFor: "Property Owner",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Received",
      },
      {
        srNo: 20,
        id: "approved-plan-oc-cc",
        name: "Approved plan / OC / CC / society NOC, wherever applicable",
        applicableFor: "Property Owner / Builder / Society",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "NA",
      },
      {
        srNo: 21,
        id: "legal-search-report",
        name: "Legal search report / title clearance report",
        applicableFor: "Empanelled Advocate",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Received",
      },
      {
        srNo: 22,
        id: "technical-valuation-report",
        name: "Technical valuation report",
        applicableFor: "Empanelled Valuer",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Received",
      },
      {
        srNo: 23,
        id: "cersai-report",
        name: "CERSAI search / report, if applicable",
        applicableFor: "Credit / Legal",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Received",
      },
    ],
  },
  {
    id: "sanction-documentation-disbursement",
    title: "G. Sanction, Documentation and Disbursement",
    documents: [
      {
        srNo: 24,
        id: "sanction-letter",
        name: "Sanction letter accepted by borrower",
        applicableFor: "Applicant / Co-applicant",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 25,
        id: "loan-agreement",
        name: "Loan agreement and all standard loan documents executed",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 26,
        id: "nach-cancelled-cheque",
        name: "NACH / repayment mandate and cancelled cheque",
        applicableFor: "Applicant / Borrower Bank Account",
        documentType: "OTHER",
        defaultRemark: "Registered",
      },
      {
        srNo: 27,
        id: "mortgage-documents",
        name: "Mortgage creation documents executed",
        applicableFor: "Borrower / Property Owner",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Received",
      },
      {
        srNo: 28,
        id: "original-title-deeds",
        name: "Original title deeds received for custody",
        applicableFor: "Fintree Custody / Branch Hub",
        documentType: "PROPERTY_DOCUMENT",
        defaultRemark: "Received",
      },
      {
        srNo: 29,
        id: "security-cheques",
        name: "Security cheques, if applicable",
        applicableFor: "Applicant / Co-applicant / Guarantor",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 30,
        id: "final-disbursement-memo",
        name: "Final disbursement memo / checklist approved",
        applicableFor: "Credit / Operations / Authorised Signatory",
        documentType: "OTHER",
        defaultRemark: "Fintree will share",
      },
      {
        srNo: 31,
        id: "beneficiary-bank-details",
        name: "Beneficiary bank details verified",
        applicableFor: "Operations",
        documentType: "OTHER",
        defaultRemark: "Verify",
      },
      {
        srNo: 32,
        id: "disbursement-utr",
        name: "Disbursement UTR / payment confirmation",
        applicableFor: "Accounts / Operations",
        documentType: "OTHER",
        defaultRemark: "NA",
      },
    ],
  },
  {
    id: "post-disbursement",
    title: "H. Post Disbursement",
    documents: [
      {
        srNo: 33,
        id: "custody-acknowledgement",
        name: "Document custody acknowledgement",
        applicableFor: "Fintree Custody / Branch Hub",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 34,
        id: "pdd-otc-tracker",
        name: "PDD / OTC tracker updated, if any",
        applicableFor: "Operations",
        documentType: "OTHER",
        defaultRemark: "Received",
      },
      {
        srNo: 35,
        id: "post-disbursement-mis",
        name: "Post-disbursement MIS shared with partner",
        applicableFor: "MIS Team",
        documentType: "OTHER",
        defaultRemark: "Pending",
      },
    ],
  },
];

const POST_BM_STATUSES = [
  "BM_APPROVED",

  "SUBMITTED_TO_CM",
  "CM_PENDING",
  "CM_QUERY",
  "CM_APPROVED",
  "CM_REJECTED",

  "CREDIT_PENDING",
  "CREDIT_MAKER_PENDING",
  "CREDIT_MAKER_QUERY",
  "CREDIT_MAKER_RECOMMENDED",
  "CREDIT_MAKER_REJECTED",
  "CREDIT_CHECKER_PENDING",
  "CREDIT_CHECKER_QUERY",
  "CREDIT_CHECKER_APPROVED",
  "CREDIT_CHECKER_REJECTED",

  "VALUATION_PENDING",
  "VALUATION_QUERY",
  "VALUATION_APPROVED",
  "VALUATION_REJECTED",

  "LEGAL_PENDING",
  "LEGAL_QUERY",
  "LEGAL_APPROVED",
  "LEGAL_REJECTED",

  "SANCTION_PENDING",
  "SANCTION_APPROVED",
  "SANCTION_REJECTED",

  "AGREEMENT_PENDING",
  "AGREEMENT_COMPLETED",
  "DISBURSEMENT_PENDING",
  "DISBURSED",
  "ACTIVE",
  "CLOSED",
];

const CREDIT_AND_VALUATION_ROLES = [
  "CM",
  "CREDIT_MAKER",
  "CREDIT_CHECKER",
  "VALUATION",
];

const normalizeRoles = (user) => {
  const roles = user?.roles || user?.role || [];

  if (Array.isArray(roles)) {
    return roles.map((role) => String(role).toUpperCase());
  }

  return [String(roles).toUpperCase()].filter(Boolean);
};

const unwrapResponse = (response) => {
  if (response?.data !== undefined) return response.data;
  return response ?? {};
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeDocumentValue = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const getApplicationStage = (application) =>
  normalizeText(
    application?.stage ||
      application?.workflow?.currentStage ||
      application?.workflow?.stage,
  );

const getApplicationStatus = (application) =>
  normalizeText(
    application?.status ||
      application?.workflow?.currentStatus ||
      application?.workflow?.status,
  );

const isBmApprovedOrMovedFromBm = (application) => {
  const stage = getApplicationStage(application);
  const status = getApplicationStatus(application);

  return (
    status === "BM_APPROVED" ||
    POST_BM_STAGES.includes(stage) ||
    POST_BM_STATUSES.includes(status)
  );
};

const isApplicationVisibleForRole = (application, role) => {
  const stage = getApplicationStage(application);
  const status = getApplicationStatus(application);

  if (role === "ADMIN") return true;

  if (role === "RM") {
    return (
      application?.workflow?.documentsUploaded === false ||
      stage === "RM" ||
      [
        "DRAFT",
        "LEAD_CREATED",
        "IMD_COLLECTED",
        "IN_PROGRESS",
        "SUBMITTED",
      ].includes(status)
    );
  }

  if (role === "BM") {
    return (
      stage === "BM" ||
      [
        "SUBMITTED_TO_BM",
        "BM_PENDING",
        "BM_QUERY",
        "BM_APPROVED",
        "BM_REJECTED",
      ].includes(status)
    );
  }

  if (CREDIT_AND_VALUATION_ROLES.includes(role)) {
    return isBmApprovedOrMovedFromBm(application);
  }

  if (role === "LEGAL") {
    return (
      stage === "LEGAL" ||
      [
        "VALUATION_APPROVED",
        "LEGAL_PENDING",
        "LEGAL_QUERY",
        "LEGAL_APPROVED",
        "LEGAL_REJECTED",
      ].includes(status)
    );
  }

  if (role === "SANCTION") {
    return (
      stage === "SANCTION" ||
      [
        "LEGAL_APPROVED",
        "SANCTION_PENDING",
        "SANCTION_APPROVED",
        "SANCTION_REJECTED",
      ].includes(status)
    );
  }

  if (role === "OPS_MAKER" || role === "OPS_CHECKER") {
    return (
      stage === "AGREEMENT" ||
      stage === "DISBURSEMENT" ||
      [
        "AGREEMENT_COMPLETED",
        "DISBURSEMENT_PENDING",
        "DISBURSED",
      ].includes(status)
    );
  }

  return false;
};

const getDocumentType = (document) =>
  normalizeText(document?.documentType || document?.document_type);

const getDocumentName = (document) =>
  String(document?.documentName || document?.document_name || "").trim();

const getFileName = (document) =>
  String(document?.fileName || document?.file_name || "").trim();

const getDocumentSource = (document) =>
  normalizeText(
    document?.documentSource ||
      document?.document_source ||
      "UNKNOWN",
  );

const isAllowedUploadFile = (file) => {
  if (!file) return false;

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  return allowedTypes.includes(file.type);
};

const getRoleSpecificChecklist = (role) => {
  const baseTypes = requiredDocumentTypes.filter(
    (type) => type !== "OTHER",
  );

  const extraTypes = [];

  if (role === "VALUATION") {
    extraTypes.push("VALUATION_REPORT");
  }

  if (
    role === "CREDIT_MAKER" ||
    role === "CREDIT_CHECKER"
  ) {
    extraTypes.push("CREDIT_MEMO");
  }

  if (role === "LEGAL") {
    extraTypes.push("LEGAL_OPINION");
  }

  if (role === "SANCTION") {
    extraTypes.push("SANCTION_NOTE");
  }

  return Array.from(
    new Set([...baseTypes, ...extraTypes]),
  );
};

export default function KycDocuments() {
  const { applicationId: routeApplicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useAuth();

  const roles = useMemo(() => normalizeRoles(user), [user]);

  const activeRole =
    ROLE_PRIORITY.find((role) => roles.includes(role)) || "RM";

  const pageConfig =
    DOCUMENT_PAGE_CONFIG[activeRole] || DOCUMENT_PAGE_CONFIG.RM;

  const isRM = activeRole === "RM";
  const isCreditOrValuation = CREDIT_AND_VALUATION_ROLES.includes(activeRole);

  const [applicationId, setApplicationId] = useState(
    routeApplicationId || "",
  );
  const [searchText, setSearchText] = useState("");
  const [uploadingType, setUploadingType] = useState("");
  const [message, setMessage] = useState("");

  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newDocumentType, setNewDocumentType] = useState("OTHER");
  const [newDocumentFile, setNewDocumentFile] = useState(null);
  const [addDocumentError, setAddDocumentError] = useState("");

  const applicationsQuery = useQuery({
    queryKey: ["role-based-document-applications", activeRole],
    queryFn: async () => {
      const applicationsResponse = await rmApi.applications({
        page: 1,
        limit: 500,
      });

      const applicationsResult = unwrapResponse(applicationsResponse);

      const rows =
        applicationsResult?.data?.data ??
        applicationsResult?.data ??
        applicationsResult ??
        [];

      const applications = Array.isArray(rows) ? rows : [];

      const withWorkflow = await Promise.all(
        applications.map(async (application) => {
          try {
            const workflowResponse = await rmApi.workflowStatus(
              application.id,
            );

            const workflowResult = unwrapResponse(workflowResponse);

            return {
              ...application,
              workflow: workflowResult?.data ?? workflowResult ?? {},
            };
          } catch {
            return {
              ...application,
              workflow: {},
            };
          }
        }),
      );

      return withWorkflow.filter((application) =>
        isApplicationVisibleForRole(application, activeRole),
      );
    },
    enabled: Boolean(activeRole),
    retry: false,
  });

  const applicationList = applicationsQuery.data ?? [];

  const filteredApplicationList = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return applicationList;

    return applicationList.filter((application) => {
      const haystack = [
        application?.applicationNumber,
        application?.customerName,
        application?.mobile,
        application?.pan,
        application?.status,
        application?.stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [applicationList, searchText]);

  const rawSelectedId = applicationId || routeApplicationId || "";

  const selectedId = applicationList.some(
    (item) => String(item.id) === String(rawSelectedId),
  )
    ? String(rawSelectedId)
    : applicationList?.[0]?.id
      ? String(applicationList[0].id)
      : "";

  const selectedApplication = applicationList.find(
    (item) => String(item.id) === String(selectedId),
  );

  useEffect(() => {
    if (applicationsQuery.isLoading) return;

    if (!selectedId) {
      setApplicationId("");
      return;
    }

    if (String(applicationId || "") !== String(selectedId)) {
      setApplicationId(String(selectedId));
    }
  }, [applicationsQuery.isLoading, selectedId, applicationId]);

  const documentsQuery = useQuery({
    queryKey: ["rm-documents", selectedId],
    queryFn: () => rmApi.documents(selectedId),
    enabled: Boolean(selectedId),
    retry: false,
  });


      const normalizeChecklistDocumentName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-");

  const uploadedDocuments = useMemo(() => {
  const payload =
    documentsQuery.data?.data?.data ??
    documentsQuery.data?.data ??
    documentsQuery.data ??
    [];

  const documents = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.documents)
      ? payload.documents
      : [];

  return documents.filter(Boolean);
}, [documentsQuery.data]);


const getUploadedChecklistDocument = (
  checklistDocument,
) => {
  const requiredName =
    normalizeChecklistDocumentName(
      checklistDocument.name,
    );

  return uploadedDocuments.find((document) => {
    const uploadedName =
      normalizeChecklistDocumentName(
        getDocumentName(document),
      );

    return uploadedName === requiredName;
  });
};


  const mandatoryDocumentTypes = useMemo(
    () => getRoleSpecificChecklist(activeRole),
    [activeRole],
  );

  const getUploadUrl = (document) => {
    if (!document) return "";

    const directUrl =
      document.fileUrl ||
      document.file_url ||
      document.documentUrl ||
      document.document_url ||
      document.url;

    if (directUrl) return directUrl;

    const filePath =
      document.filePath ||
      document.file_path ||
      document.path ||
      "";

    if (!filePath) return "";

    if (String(filePath).startsWith("http")) {
      return filePath;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    let uploadBaseUrl = "";

    try {
      uploadBaseUrl = apiBaseUrl ? new URL(apiBaseUrl).origin : "";
    } catch {
      uploadBaseUrl = "";
    }

    if (!uploadBaseUrl) {
      uploadBaseUrl = "http://localhost:9000";
    }

    return `${uploadBaseUrl}/${String(filePath).replace(/^\/+/, "")}`;
  };

  const getDocumentMatchKeys = (document) => {
    const documentType = getDocumentType(document);
    const documentName = normalizeDocumentValue(getDocumentName(document));

    const keys = new Set();

    if (documentType) keys.add(documentType);
    if (documentName) keys.add(documentName);

    if (documentName.includes("PAN")) keys.add("PAN");

    if (
      documentName.includes("AADHAAR") ||
      documentName.includes("ADHAR") ||
      documentName.includes("OVD")
    ) {
      keys.add("AADHAAR");
    }

    if (
      documentName.includes("BANK_STATEMENT") ||
      documentName.includes("6_MONTHS_BANK") ||
      documentName.includes("BANKING")
    ) {
      keys.add("BANK_STATEMENT");
    }

    if (documentName.includes("ITR")) keys.add("ITR");

    if (
      documentName.includes("PROPERTY_DOCUMENT") ||
      documentName.includes("TITLE_DOCUMENT") ||
      documentName.includes("PROPERTY_PAPER")
    ) {
      keys.add("PROPERTY_DOCUMENT");
    }

    if (
      documentName.includes("INCOME_PROOF") ||
      documentName.includes("SALARY") ||
      documentName.includes("INCOME")
    ) {
      keys.add("INCOME_PROOF");
    }

    if (
      documentName === "CUSTOMER_PHOTO" ||
      documentName === "APPLICANT_PHOTO" ||
      documentName === "PHOTOGRAPH" ||
      documentName.includes("PHOTO")
    ) {
      keys.add("PHOTO");
    }

    if (
      documentName.includes("CUSTOMER_CONSENT") ||
      documentName.includes("CONSENT")
    ) {
      keys.add("CUSTOMER_CONSENT");
    }

    if (
      documentName.includes("VALUATION_REPORT") ||
      documentName.includes("VALUATION")
    ) {
      keys.add("VALUATION_REPORT");
    }

    if (
      documentName.includes("CREDIT_MEMO") ||
      documentName.includes("CREDIT_NOTE") ||
      documentName.includes("CREDIT")
    ) {
      keys.add("CREDIT_MEMO");
    }

    if (
      documentName.includes("LEGAL_OPINION") ||
      documentName.includes("LEGAL")
    ) {
      keys.add("LEGAL_OPINION");
    }

    if (
      documentName.includes("SANCTION_NOTE") ||
      documentName.includes("SANCTION")
    ) {
      keys.add("SANCTION_NOTE");
    }

    if (documentType === "OTHER" || documentName === "OTHER") {
      keys.add("OTHER");
    }

    return keys;
  };

  const isImageDocument = (document) => {
    const mimeType = String(
      document?.mimeType ||
        document?.mime_type ||
        "",
    ).toLowerCase();

    const fileName = getFileName(document).toLowerCase();

    return (
      mimeType.startsWith("image/") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png")
    );
  };

  const uploadedTypes = useMemo(() => {
    const types = new Set();

    uploadedDocuments.forEach((doc) => {
      const keys = getDocumentMatchKeys(doc);
      const source = getDocumentSource(doc);
      const documentName = normalizeDocumentValue(getDocumentName(doc));

      keys.forEach((key) => {
        if (key === "PHOTO") {
          const isApplicantPhoto =
            source !== "FIELD_VISIT" &&
            [
              "CUSTOMER_PHOTO",
              "APPLICANT_PHOTO",
              "PHOTOGRAPH",
            ].includes(documentName);

          if (isApplicantPhoto) {
            types.add("PHOTO");
          }

          return;
        }

        types.add(key);
      });
    });

    return types;
  }, [uploadedDocuments]);

  const getLatestDocumentByType = (type) => {
    return uploadedDocuments.find((doc) => {
      const keys = getDocumentMatchKeys(doc);
      const source = getDocumentSource(doc);
      const documentName = normalizeDocumentValue(getDocumentName(doc));

      if (type === "PHOTO") {
        return (
          source !== "FIELD_VISIT" &&
          keys.has("PHOTO") &&
          [
            "CUSTOMER_PHOTO",
            "APPLICANT_PHOTO",
            "PHOTOGRAPH",
          ].includes(documentName)
        );
      }

      return keys.has(type);
    });
  };

  const verified = mandatoryDocumentTypes.filter((type) =>
    uploadedTypes.has(type),
  ).length;

  const completion = mandatoryDocumentTypes.length
    ? Math.round((verified / mandatoryDocumentTypes.length) * 100)
    : 0;

  const allRequiredDocumentsUploaded = mandatoryDocumentTypes.every((type) =>
    uploadedTypes.has(type),
  );

  const additionalDocuments = uploadedDocuments.filter(
    (document) => getDocumentType(document) === "OTHER",
  );

  const metrics = [
    {
      title: "Uploaded",
      value: documentsQuery.isLoading ? "--" : uploadedDocuments.length,
      helper: "Total files",
      color: "bg-blue-50 text-blue-700",
      icon: FaFolderOpen,
    },
    {
      title: "Checklist",
      value: documentsQuery.isLoading
        ? "--"
        : `${verified}/${mandatoryDocumentTypes.length}`,
      helper: "Matched required docs",
      color: "bg-emerald-50 text-emerald-700",
      icon: FaCheckCircle,
    },
    {
      title: "Completion",
      value: documentsQuery.isLoading ? "--" : `${completion}%`,
      helper: "Document progress",
      color: "bg-indigo-50 text-indigo-700",
      icon: FaShieldAlt,
    },
    {
      title: "Applications",
      value: applicationsQuery.isLoading ? "--" : applicationList.length,
      helper: isCreditOrValuation
        ? "BM approved / moved from BM"
        : "Role-based cases",
      color: "bg-amber-50 text-amber-700",
      icon: FaUserTag,
    },
  ];

  const handleViewUploadedDocument = (document) => {
    const url = getUploadUrl(document);

    if (!url) {
      setMessage("Document file is not available.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadUploadedDocument = (document) => {
  const url = getUploadUrl(document);

  if (!url) {
    setMessage("Document file is not available.");
    return;
  }

  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download =
    getFileName(document) ||
    getDocumentName(document) ||
    "document";

  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
};

  const upload = useMutation({
    mutationFn: ({ applicationId, documentType, documentName, file }) => {
      const normalizedDocumentType = normalizeText(documentType || "OTHER");

      if (!selectedId) {
        throw new Error("Please select an application first.");
      }

      if (!file) {
        throw new Error("Please select a file.");
      }

      if (!isAllowedUploadFile(file)) {
        throw new Error("Only PDF, JPG and PNG files are allowed.");
      }

      const maximumFileSize = 15 * 1024 * 1024;

      if (file.size > maximumFileSize) {
        throw new Error("File size must not exceed 15 MB.");
      }

      const formData = new FormData();

      formData.append("applicationId", String(Number(applicationId)));
      formData.append("documentType", normalizedDocumentType);
      formData.append(
        "documentName",
        String(documentName || documentLabels[normalizedDocumentType] || documentType).trim(),
      );
      formData.append("documentSource", pageConfig.source);
      formData.append("file", file);

      return rmApi.uploadDocument(formData);
    },

    onSuccess: async (response, variables) => {
      setMessage(
        response?.data?.message ||
          response?.data?.data?.message ||
          response?.message ||
          "Document uploaded successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents", selectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow", selectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["role-based-document-applications", activeRole],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow-overview"],
        }),
      ]);

      if (variables.documentType === "OTHER" || uploadingType === "ADDITIONAL_DOCUMENT") {
        setShowAddDocumentModal(false);
        setNewDocumentName("");
        setNewDocumentType("OTHER");
        setNewDocumentFile(null);
        setAddDocumentError("");
      }
    },

    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Document upload failed.";

      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      setMessage(finalMessage);

      if (uploadingType === "ADDITIONAL_DOCUMENT") {
        setAddDocumentError(finalMessage);
      }
    },

    onSettled: () => {
      setUploadingType("");
    },
  });

  const markDocumentsUploadedMutation = useMutation({
    mutationFn: () =>
      rmApi.recordWorkflowStep(selectedId, {
        action: "DOCUMENTS_UPLOADED",
        remarks: "All required KYC documents uploaded and verified by RM.",
      }),

    onSuccess: async () => {
      setMessage(
        "Documents uploaded workflow completed. Redirecting to charges and receipts...",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow", selectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow-overview"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-documents", selectedId],
        }),
      ]);

      navigate(`/charges-receipts/${selectedId}`, {
        replace: true,
      });
    },

    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to mark documents as uploaded.";

      setMessage(
        Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      );
    },
  });

  const handleInlineUpload = (type, file) => {
    if (!file) return;

    setUploadingType(type);

    upload.mutate({
      applicationId: Number(selectedId),
      documentType: type,
      documentName: documentLabels[type] || type,
      file,
    });
  };

  const handleChecklistDocumentUpload = (
  checklistDocument,
  file,
) => {
  if (!file) return;

  if (!selectedId) {
    setMessage("Please select an application first.");
    return;
  }

  setUploadingType(checklistDocument.id);

  upload.mutate({
    applicationId: Number(selectedId),
    documentType: checklistDocument.documentType,
    documentName: checklistDocument.name,
    file,
  });
};

  const handleAddDocument = () => {
    setAddDocumentError("");

    if (!selectedId) {
      setAddDocumentError("Please select an application first.");
      return;
    }

    const documentName = newDocumentName.trim();

    if (!documentName) {
      setAddDocumentError("Document name is required.");
      return;
    }

    if (!newDocumentFile) {
      setAddDocumentError("Please select a document file.");
      return;
    }

    setUploadingType("ADDITIONAL_DOCUMENT");

    upload.mutate({
      applicationId: Number(selectedId),
      documentType: newDocumentType || "OTHER",
      documentName,
      file: newDocumentFile,
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-800 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#0f2942] via-[#2563eb] to-[#22c7c7] p-7 text-white">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-300/20" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  {pageConfig.title}
                </h2>

                <p className="mt-2 text-sm font-semibold text-white/90">
                  {pageConfig.subtitle}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <HeaderBadge label={`Role: ${activeRole.replace(/_/g, " ")}`} />
                  <HeaderBadge label={`Source: ${pageConfig.source}`} />
                  {isCreditOrValuation && (
                    <HeaderBadge label="Cases: BM approved / moved from BM" />
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedId || upload.isPending}
                onClick={() => {
                  setNewDocumentName("");
                  setNewDocumentType("OTHER");
                  setNewDocumentFile(null);
                  setAddDocumentError("");
                  setShowAddDocumentModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlus size={13} />
                Add Document
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[420px_1fr_360px]">
            <div className="relative">
              <select
                value={selectedId}
                disabled={applicationsQuery.isLoading || applicationList.length === 0}
                onChange={(event) => {
                  setApplicationId(event.target.value);
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-extrabold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {applicationsQuery.isLoading ? (
                  <option value="">
                    {isCreditOrValuation
                      ? "Loading BM approved / moved from BM cases..."
                      : "Loading role-based document cases..."}
                  </option>
                ) : applicationList.length === 0 ? (
                  <option value="">{pageConfig.emptyText}</option>
                ) : (
                  <>
                    <option value="">Select Application</option>
                    {applicationList.map((item) => (
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
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search loaded cases by LAN, customer, mobile, PAN, status..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-bold text-slate-600 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Selected Case
              </p>

              <p className="mt-1 truncate text-sm font-black text-slate-800">
                {selectedApplication
                  ? `${selectedApplication.applicationNumber || "—"} - ${
                      selectedApplication.customerName || "—"
                    }`
                  : "No case selected"}
              </p>
            </div>
          </div>

          {searchText.trim() && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">
                Search Results: {filteredApplicationList.length}
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {filteredApplicationList.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setApplicationId(String(item.id));
                      setSearchText("");
                      setMessage("");
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
                  >
                    <p className="text-xs font-black text-slate-800">
                      {item.applicationNumber || `#${item.id}`}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {item.customerName || "—"}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase text-blue-600">
                      {item.stage || "—"} / {item.status || "—"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((card) => (
            <MetricCard key={card.title} {...card} />
          ))}
        </div>

        {/* <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0f2942]">
                Document Checklist
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                All roles can upload. Files are tagged with the current role source.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
              {verified}/{mandatoryDocumentTypes.length} Completed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="w-[30%] p-4 pl-6">Document</th>
                  <th className="w-[25%] p-4">Latest File</th>
                  <th className="w-[15%] p-4">Status</th>
                  <th className="w-[15%] p-4">Source</th>
                  <th className="w-[15%] p-4 pr-6 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {mandatoryDocumentTypes.map((type) => {
                  const latest = getLatestDocumentByType(type);
                  const uploaded = Boolean(latest);
                  const source = latest ? getDocumentSource(latest) : "-";

                  return (
                    <tr key={type} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              uploaded
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-50 text-slate-400"
                            }`}
                          >
                            <FaFileAlt />
                          </div>

                          <div>
                            <div className="font-black text-slate-900">
                              {documentLabels[type] || type}
                            </div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                              PDF/JPG/PNG, maximum 15 MB
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p
                          className="max-w-[260px] truncate font-semibold text-slate-500"
                          title={getFileName(latest)}
                        >
                          {getFileName(latest) || "-"}
                        </p>
                      </td>

                      <td className="p-4">
                        <StatusPill uploaded={uploaded} />
                      </td>

                      <td className="p-4">
                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                          {source}
                        </span>
                      </td>

                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-center gap-2">
                          {uploaded && getUploadUrl(latest) && (
                            <button
                              type="button"
                              onClick={() => handleViewUploadedDocument(latest)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100"
                            >
                              <FaEye size={11} />
                              View
                            </button>
                          )}

                          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                            <FaUpload size={11} />
                            {upload.isPending && uploadingType === type
                              ? "Uploading..."
                              : uploaded
                                ? "Replace"
                                : "Upload"}

                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={!selectedId || upload.isPending}
                              onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                  handleInlineUpload(type, file);
                                }

                                event.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {additionalDocuments.map((document) => (
                  <tr key={document.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="p-4 pl-6">
                      <div className="font-black text-slate-900">
                        {getDocumentName(document) || "Additional Document"}
                      </div>
                      <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        Additional uploaded document
                      </div>
                    </td>

                    <td className="p-4">
                      <p
                        className="max-w-[260px] truncate font-semibold text-slate-500"
                        title={getFileName(document)}
                      >
                        {getFileName(document) || "-"}
                      </p>
                    </td>

                    <td className="p-4">
                      <StatusPill uploaded />
                    </td>

                    <td className="p-4">
                      <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                        {getDocumentSource(document)}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-center">
                      {getUploadUrl(document) ? (
                        <button
                          type="button"
                          onClick={() => handleViewUploadedDocument(document)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100"
                        >
                          <FaEye size={11} />
                          View
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!documentsQuery.isLoading &&
                  mandatoryDocumentTypes.length === 0 &&
                  additionalDocuments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm font-semibold text-slate-400">
                        No document checklist available.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div> */}


<div className="space-y-4">
  {APPLICATION_DOCUMENT_SECTIONS.map((section) => {
    const uploadedCount = section.documents.filter((item) =>
      Boolean(getUploadedChecklistDocument(item)),
    ).length;

    return (
      <section
        key={section.id}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        {/* Simple section header */}
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[13px] font-black text-[#0f2942]">
              {section.title}
            </h3>

            <p className="mt-1 text-[10px] font-medium text-slate-400">
              Upload and review supporting documents
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-[9px] font-black ${
              uploadedCount === section.documents.length
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {uploadedCount}/{section.documents.length} received
          </span>
        </div>

        {/* Clean document list */}
        <div className="divide-y divide-slate-100">
          {section.documents.map((item) => {
            const uploadedDocument =
              getUploadedChecklistDocument(item);

            const uploaded = Boolean(uploadedDocument);

            const uploading =
              upload.isPending &&
              uploadingType === item.id;

            return (
              <div
                key={item.id}
                className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/60 lg:grid-cols-[45px_minmax(240px,1.5fr)_minmax(180px,1fr)_110px_minmax(180px,1fr)_170px] lg:items-center"
              >
                {/* Serial number */}
                <div>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">
                    {item.srNo}
                  </span>
                </div>

                {/* Document details */}
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                        uploaded
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <FaFileAlt size={12} />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[11px] font-black leading-5 text-slate-800">
                        {item.name}
                      </p>

                      <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[8px] font-black text-slate-500">
                        {item.documentType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applicable for */}
                <div>
                  <p className="mb-1 text-[8px] font-black uppercase tracking-wide text-slate-400 lg:hidden">
                    Applicable For
                  </p>

                  <p className="text-[10px] font-medium leading-5 text-slate-600">
                    {item.applicableFor}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="mb-1 text-[8px] font-black uppercase tracking-wide text-slate-400 lg:hidden">
                    Status
                  </p>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black ${
                      uploaded
                        ? "bg-emerald-50 text-emerald-700"
                        : item.defaultRemark
                            .toLowerCase()
                            .includes("pending")
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {uploaded && (
                      <FaCheckCircle size={8} />
                    )}

                    {uploaded
                      ? "Received"
                      : item.defaultRemark}
                  </span>
                </div>

                {/* File information */}
                <div className="min-w-0">
                  <p className="mb-1 text-[8px] font-black uppercase tracking-wide text-slate-400 lg:hidden">
                    File
                  </p>

                  {uploaded ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FaCheckCircle size={11} />
                      </span>

                      <div className="min-w-0">
                        <p
                          className="truncate text-[9px] font-black text-slate-700"
                          title={getFileName(uploadedDocument)}
                        >
                          {getFileName(uploadedDocument) ||
                            item.name}
                        </p>

                        <p className="mt-0.5 truncate text-[8px] text-slate-400">
                          {getDocumentSource(
                            uploadedDocument,
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] font-medium text-slate-400">
                      No file uploaded
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {uploaded &&
                    getUploadUrl(uploadedDocument) && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleViewUploadedDocument(
                              uploadedDocument,
                            )
                          }
                          title="Preview document"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <FaEye size={10} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadUploadedDocument(
                              uploadedDocument,
                            )
                          }
                          title="Download document"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <FaDownload size={10} />
                        </button>
                      </>
                    )}

                  <label
                    className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[9px] font-black transition ${
                      uploaded
                        ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        : "bg-[#0f2942] text-white hover:bg-[#173b5f]"
                    }`}
                  >
                    <FaUpload size={9} />

                    {uploading
                      ? "Uploading..."
                      : uploaded
                        ? "Replace"
                        : "Upload"}

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={
                        !selectedId ||
                        upload.isPending
                      }
                      onChange={(event) => {
                        const file =
                          event.target.files?.[0];

                        if (file) {
                          handleChecklistDocumentUpload(
                            item,
                            file,
                          );
                        }

                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  })}
</div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0f2942]">
                All Uploaded Documents
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Complete document history for selected application.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
              {uploadedDocuments.length} Files
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Preview</th>
                  <th className="p-4">Document Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">File</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {documentsQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading documents...
                    </td>
                  </tr>
                ) : uploadedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  uploadedDocuments.map((document) => {
                    const documentUrl = getUploadUrl(document);
                    const documentName = getDocumentName(document);
                    const documentType = getDocumentType(document);
                    const fileName = getFileName(document);
                    const documentSource = getDocumentSource(document);

                    return (
                      <tr key={document.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="p-4 pl-6">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {documentUrl && isImageDocument(document) ? (
                              <img
                                src={documentUrl}
                                alt={documentName || "Document"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-extrabold text-slate-400">
                                PDF
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-black text-slate-900">
                            {documentName ||
                              documentLabels[documentType] ||
                              "-"}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            ID: {document.id}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {documentType || "-"}
                          </span>
                        </td>

                        <td className="p-4">
                          <p
                            className="max-w-[260px] truncate font-semibold text-slate-500"
                            title={fileName}
                          >
                            {fileName || "-"}
                          </p>
                        </td>

                        <td className="p-4">
                          <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                            {documentSource}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            {document.status || "UPLOADED"}
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-center">
                          {documentUrl ? (
                            <button
                              type="button"
                              onClick={() => handleViewUploadedDocument(document)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100"
                            >
                              <FaEye size={11} />
                              View
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isRM && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#0f2942]">
                <FaCheckCircle className="text-emerald-500" />
                KYC Results
              </h3>

              <div className="divide-y divide-slate-100 pt-1">
                <Result
                  label="PAN validation"
                  value={uploadedTypes.has("PAN") ? "Document uploaded" : "Pending"}
                />
                <Result
                  label="Aadhaar validation"
                  value={uploadedTypes.has("AADHAAR") ? "Document uploaded" : "Pending"}
                />
                <Result
                  label="Photo"
                  value={uploadedTypes.has("PHOTO") ? "Available" : "Pending"}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#0f2942]">
                  <FaShieldAlt className="text-blue-600" />
                  Document Security
                </h3>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                    allRequiredDocumentsUploaded
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {allRequiredDocumentsUploaded ? "Ready" : "Pending"}
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-xs font-medium text-blue-800">
                <FaInfoCircle className="mt-0.5 shrink-0" />
                Uploaded files are stored through the backend document service with metadata, uploader and workflow linkage.
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Required documents</span>
                  <span className="text-slate-900">
                    {verified}/{mandatoryDocumentTypes.length}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      allRequiredDocumentsUploaded
                        ? "bg-emerald-500"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={
                  !selectedId ||
                  !allRequiredDocumentsUploaded ||
                  markDocumentsUploadedMutation.isPending
                }
                onClick={() => markDocumentsUploadedMutation.mutate()}
                className="w-full rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#173b5f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {markDocumentsUploadedMutation.isPending
                  ? "Updating Workflow..."
                  : allRequiredDocumentsUploaded
                    ? "Proceed to Charges & Receipts"
                    : "Upload All Documents First"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddDocumentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#0f2942]">
                  Add Document
                </h3>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Upload document as {activeRole.replace(/_/g, " ")}
                </p>
              </div>

              <button
                type="button"
                disabled={upload.isPending}
                onClick={() => {
                  setShowAddDocumentModal(false);
                  setNewDocumentName("");
                  setNewDocumentType("OTHER");
                  setNewDocumentFile(null);
                  setAddDocumentError("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                <FaTimes size={12} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Document Type
                </label>

                <select
                  value={newDocumentType}
                  disabled={upload.isPending}
                  onChange={(event) => setNewDocumentType(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-blue-400"
                >
                  <option value="OTHER">Other Document</option>
                  <option value="PAN">PAN Card</option>
                  <option value="AADHAAR">Aadhaar / OVD</option>
                  <option value="PHOTO">Photograph</option>
                  <option value="BANK_STATEMENT">Bank Statement</option>
                  <option value="ITR">ITR</option>
                  <option value="PROPERTY_DOCUMENT">Property Document</option>
                  <option value="INCOME_PROOF">Income Proof</option>
                  <option value="CUSTOMER_CONSENT">Customer Consent</option>
                  <option value="CREDIT_MEMO">Credit Memo</option>
                  <option value="VALUATION_REPORT">Valuation Report</option>
                  <option value="LEGAL_OPINION">Legal Opinion</option>
                  <option value="SANCTION_NOTE">Sanction Note</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Document Name <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  value={newDocumentName}
                  disabled={upload.isPending}
                  onChange={(event) => {
                    setNewDocumentName(event.target.value);
                    setAddDocumentError("");
                  }}
                  placeholder="Example: Electricity Bill"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Select File <span className="text-rose-500">*</span>
                </label>

                <label
                  className={`block rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                    upload.isPending
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                      : "cursor-pointer border-blue-200 bg-blue-50/30 hover:border-blue-400"
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={upload.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setNewDocumentFile(file);
                      setAddDocumentError("");
                    }}
                  />

                  <FaCloudUploadAlt className="mx-auto mb-3 text-3xl text-blue-500" />

                  {newDocumentFile ? (
                    <>
                      <p className="truncate text-xs font-bold text-blue-700">
                        {newDocumentFile.name}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {(newDocumentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-700">
                        Click to select a file
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        PDF, JPG or PNG, maximum 15 MB
                      </p>
                    </>
                  )}
                </label>
              </div>

              {addDocumentError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {addDocumentError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                disabled={upload.isPending}
                onClick={() => {
                  setShowAddDocumentModal(false);
                  setNewDocumentName("");
                  setNewDocumentType("OTHER");
                  setNewDocumentFile(null);
                  setAddDocumentError("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  upload.isPending ||
                  !newDocumentName.trim() ||
                  !newDocumentFile
                }
                onClick={handleAddDocument}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaUpload size={11} />
                {upload.isPending && uploadingType === "ADDITIONAL_DOCUMENT"
                  ? "Uploading..."
                  : "Upload Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderBadge({ label }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

function MetricCard({ title, value, helper, color, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {helper}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ uploaded }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${
        uploaded
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-rose-200 bg-rose-50 text-rose-600"
      }`}
    >
      {uploaded ? "Uploaded" : "Pending"}
    </span>
  );
}

function Result({ label, value }) {
  const ready = value !== "Pending";

  return (
    <div className="flex items-center justify-between py-2.5 text-xs">
      <span className="font-semibold text-slate-400">{label}</span>

      <span
        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
          ready
            ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
            : "border border-rose-100 bg-rose-50 text-rose-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}