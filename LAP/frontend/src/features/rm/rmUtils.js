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
  "Lead",
  "KYC",
  "Documents",
  "Submission",
  "Review",
  "Sanction",
  "Agreement",
  "Disbursement",
];

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