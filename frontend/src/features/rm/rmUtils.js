export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value ?? 0);

export const requiredDocumentTypes = [
  "PAN",
  "AADHAAR",
  "PHOTO",
  "BANK_STATEMENT",
  "PROPERTY_DOCUMENT",
  "INCOME_PROOF",
];

export const workflowSteps = [
  "Lead Created",
  "Lead Submitted",
  "Customer Visit",
  "Business Visit",
  "Geo Verification",
  "Property Visit",
  "Docs Uploaded",
  "Submitted To BM",
];

export const buildWorkflowTimeline = (status = {}) => [
  { key: "leadCreated", label: "Lead Created", completed: Boolean(status.leadCreated) },
  { key: "leadSubmitted", label: "Lead Submitted", completed: Boolean(status.leadSubmitted) },
  { key: "customerVisit", label: "Customer Visit", completed: Boolean(status.customerVisit) },
  { key: "geoVerification", label: "Geo Verification", completed: Boolean(status.geoVerification) },
  { key: "propertyVisit", label: "Property Visit", completed: Boolean(status.propertyVisit) },
  { key: "documentsUploaded", label: "Docs Uploaded", completed: Boolean(status.documentsUploaded) },
  { key: "submittedToBm", label: "Submitted To BM", completed: Boolean(status.submittedToBm) },
];

export const getNextWorkflowStep = (status = {}) => {
  if (!status.leadSubmitted) return "create-lead";
  if (!status.customerVisit) return "customer-visit";
  if (!status.geoVerification) return "geo-verification";
  if (!status.documentsUploaded) return "kyc-documents";
  if (!status.submittedToBm) return "submit-bm";
  return "submit-bm";
};

export const displayStage = (stage) => {
  const stages = {
    RM: "RM Review",
    BM: "BM Review",
    CM: "Credit Manager",
    CREDIT: "Credit",
    LEGAL: "Legal",
    VALUATION: "Valuation",
    SANCTION: "Sanction",
    AGREEMENT: "Agreement",
    DISBURSEMENT: "Disbursement",
    Lead: "Lead",
    KYC: "KYC",
    Documents: "Documents",
    Submission: "Submission",
    Review: "Review",
  };

  return stages[stage] || stage || "-";
};

export const statusClass = (status) => {
  const statuses = {
    ACTIVE: "bg-emerald-50 text-emerald-600",
    DRAFT: "bg-slate-100 text-slate-600",
    PENDING: "bg-amber-50 text-amber-600",
    APPROVED: "bg-emerald-50 text-emerald-600",
    REJECTED: "bg-rose-50 text-rose-600",
  };

  return statuses[status] || "bg-slate-100 text-slate-600";
};



export const PROPERTY_CATEGORY = [
  "Residential",
  "Commercial",
  "Industrial",
  "Land / Plot",
];

export const PROPERTY_TYPE = {
  Residential: [
    "Independent House",
    "Flat / Apartment",
    "Villa",
    "Bungalow",
    "Row House",
    "Duplex",
    "Penthouse",
    "Residential Building",
  ],
  Commercial: [
    "Office",
    "Shop",
    "Showroom",
    "Commercial Building",
    "Warehouse",
    "Godown",
    "Hotel",
    "Restaurant",
    "Hospital",
    "School / College",
    "Mall / Shopping Complex",
  ],
  Industrial: [
    "Factory",
    "Industrial Shed",
    "Industrial Unit",
    "Warehouse",
    "Godown",
    "Manufacturing Unit",
    "Workshop",
  ],
  "Land / Plot": [
    "Residential Plot",
    "Commercial Plot",
    "Industrial Plot",
    "Agricultural Land",
    "NA Land (Non-Agricultural)",
  ],
};