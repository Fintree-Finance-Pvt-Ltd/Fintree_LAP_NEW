import { useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiHelpCircle,
  FiInfo,
  FiLoader,
  FiMail,
  FiPrinter,
  FiTag,
  FiUser,
  FiX,
  FiXCircle,
  FiZap,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";

const CATEGORY_META = {
  TRAVEL: { icon: "🚕", label: "Travel & Commute", color: "bg-blue-50 text-blue-700 border-blue-200" },
  FUEL: { icon: "⛽", label: "Fuel / Petrol", color: "bg-amber-50 text-amber-700 border-amber-200" },
  FOOD: { icon: "🍔", label: "Food & Meals", color: "bg-orange-50 text-orange-700 border-orange-200" },
  HOTEL: { icon: "🏨", label: "Hotel & Stay", color: "bg-purple-50 text-purple-700 border-purple-200" },
  OFFICE_SUPPLIES: { icon: "📎", label: "Office Supplies", color: "bg-slate-100 text-slate-700 border-slate-200" },
  CLIENT_ENTERTAINMENT: { icon: "🤝", label: "Client Meeting", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  INTERNET_PHONE: { icon: "📱", label: "Telecom / Wifi", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  MEDICAL: { icon: "💊", label: "Medical & Health", color: "bg-rose-50 text-rose-700 border-rose-200" },
  OTHER: { icon: "📝", label: "Miscellaneous", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

function resolveReceiptUrl(rawUrl) {
  if (!rawUrl) return "";
  const str = String(rawUrl).trim();
  if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("blob:") || str.startsWith("data:")) {
    return str;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  let host = "http://localhost:9000";
  if (apiBase) {
    try {
      host = new URL(apiBase).origin;
    } catch {
      host = "http://localhost:9000";
    }
  }
  const cleanPath = str.replace(/^\/+/, "");
  return `${host}/${cleanPath}`;
}

export default function ClaimDetailsModal({
  isOpen,
  onClose,
  claim,
  onRefresh,
  isAdmin = true,
}) {
  const [activeSubTab, setActiveSubTab] = useState("overview"); // "overview" | "receipt" | "payment"
  const [adminAction, setAdminAction] = useState(null); // 'approve' | 'reject' | null
  const [actionRemarks, setActionRemarks] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Payment Status Edit state
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: claim?.paymentStatus || "UNPAID",
    paymentDate: claim?.paymentDate || new Date().toISOString().slice(0, 10),
    paymentReference: claim?.paymentReference || "",
  });

  if (!isOpen || !claim) return null;

  const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
  const fullReceiptUrl = resolveReceiptUrl(claim.receiptUrl);
  const isPdf =
    claim.receiptUrl?.toLowerCase().endsWith(".pdf") ||
    claim.receiptOriginalName?.toLowerCase().endsWith(".pdf");

  const handleApproveOrReject = async (type) => {
    if (type === "reject" && !actionRemarks.trim()) {
      toast.error("Please provide remarks/reason for rejection.");
      return;
    }

    setActionSubmitting(true);
    try {
      if (type === "approve") {
        await claimsApi.approveClaim(claim.id, {
          adminRemarks: actionRemarks.trim() || "Approved by Admin",
        });
        toast.success(`Claim ${claim.claimNumber} approved successfully!`);
      } else {
        await claimsApi.rejectClaim(claim.id, {
          adminRemarks: actionRemarks.trim(),
        });
        toast.success(`Claim ${claim.claimNumber} rejected.`);
      }

      setAdminAction(null);
      setActionRemarks("");
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${type} claim.`;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSavePaymentStatus = async (e) => {
    e.preventDefault();
    setIsUpdatingPayment(true);
    try {
      await claimsApi.updatePaymentStatus(claim.id, paymentForm);
      toast.success(
        `Payment status updated to ${paymentForm.paymentStatus} for ${claim.claimNumber}.`
      );
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update payment status.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-900 text-base font-mono">
                  {claim.claimNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${catMeta.color}`}
                >
                  <span>{catMeta.icon}</span>
                  <span>{catMeta.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on{" "}
                {claim.createdAt
                  ? new Date(claim.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              title="Print Expense Details"
            >
              <FiPrinter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/80 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Approval Status:</span>
              {claim.status === "APPROVED" ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Approved
                </span>
              ) : claim.status === "REJECTED" ? (
                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                  <FiXCircle className="h-3.5 w-3.5 text-rose-600" />
                  Rejected
                </span>
              ) : claim.status === "CANCELLED" ? (
                <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                  Cancelled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  <FiClock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  Pending Review
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Payment:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md uppercase text-[11px] ${
                  claim.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : claim.paymentStatus === "PROCESSING"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {claim.paymentStatus || "UNPAID"}
              </span>
            </div>
          </div>

          <div className="text-right font-mono font-black text-slate-900 text-sm">
            Total: ₹{Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveSubTab("overview")}
            className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Expense Overview & Particulars
          </button>
          {claim.receiptUrl && (
            <button
              type="button"
              onClick={() => setActiveSubTab("receipt")}
              className={`flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeSubTab === "receipt"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Bill Receipt & OCR</span>
              <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.2 text-[10px]">
                Attached
              </span>
            </button>
          )}
          {isAdmin && claim.status === "APPROVED" && (
            <button
              type="button"
              onClick={() => setActiveSubTab("payment")}
              className={`flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeSubTab === "payment"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiCreditCard className="h-3.5 w-3.5" />
              <span>Disbursement & Payment</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/40">
          {activeSubTab === "overview" && (
            <div className="space-y-5">
              {/* Row 1: Employee Information & Expense Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Employee Details
                  </span>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-black text-sm border border-blue-200">
                      {claim.user?.name ? claim.user.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {claim.user?.name || "Employee"}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5">
                        <FiMail className="h-3 w-3 text-slate-400" />
                        <span>{claim.user?.email || "—"}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Employee ID: #{claim.userId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount & Date Card */}
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Financial Summary
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                        ₹{Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-blue-700 font-medium mt-0.5 flex items-center gap-1">
                        <FiCalendar className="h-3 w-3" />
                        Expense Date: <strong>{claim.expenseDate}</strong>
                      </p>
                    </div>
                    {Number(claim.taxAmount) > 0 && (
                      <div className="text-right text-xs">
                        <span className="text-slate-500 block">GST / Tax:</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{Number(claim.taxAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Particular Expense Title & Description */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Expense Purpose / Title
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {claim.title}
                  </h3>
                </div>

                {claim.description && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Description & Context
                    </span>
                    <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                      {claim.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Row 3: Merchant & Bill Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Vendor & Tax Invoice Details
                </span>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Merchant / Vendor</span>
                    <strong className="text-slate-800 text-sm mt-0.5 block truncate">
                      {claim.merchantName || "—"}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Invoice / Bill Number</span>
                    <strong className="text-slate-800 font-mono text-sm mt-0.5 block truncate">
                      {claim.invoiceNumber || "—"}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Vendor GSTIN</span>
                    <strong className="text-slate-800 font-mono text-sm mt-0.5 block truncate">
                      {claim.gstNumber || "—"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Row 4: Admin Remarks & Workflow Trail */}
              {(claim.adminRemarks || claim.approvedAt || claim.rejectedAt) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Admin Approval Notes & History
                  </span>
                  {claim.adminRemarks && (
                    <p className="text-xs font-semibold text-amber-950 italic bg-white/80 p-3 rounded-xl border border-amber-200/60">
                      &quot;{claim.adminRemarks}&quot;
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-amber-800 mt-2">
                    {claim.approvedAt && (
                      <span>
                        Approved on: {new Date(claim.approvedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                    {claim.rejectedAt && (
                      <span>
                        Rejected on: {new Date(claim.rejectedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Receipt & OCR */}
          {activeSubTab === "receipt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Attached Invoice / Bill Document
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={fullReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-blue-600 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <FiExternalLink className="h-3.5 w-3.5" />
                    <span>Open in Tab</span>
                  </a>
                  <a
                    href={fullReceiptUrl}
                    download={claim.receiptOriginalName || "receipt"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <FiDownload className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3 flex items-center justify-center min-h-[350px]">
                {isPdf ? (
                  <iframe
                    src={`${fullReceiptUrl}#toolbar=0`}
                    title="Receipt PDF"
                    className="w-full h-[400px] rounded-xl bg-white"
                  />
                ) : (
                  <img
                    src={fullReceiptUrl}
                    alt="Expense Bill"
                    className="max-h-[420px] max-w-full object-contain rounded-xl shadow-md"
                  />
                )}
              </div>

              {claim.ocrRawText && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      OCR Extracted Raw Content
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      AI Extracted
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {claim.ocrRawText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: Payment Disbursement (Admin Only) */}
          {activeSubTab === "payment" && isAdmin && (
            <form onSubmit={handleSavePaymentStatus} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Update Payment Disbursement Status
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record reimbursement transaction reference (NEFT/UPI/Cheque) and payment date for employee accounts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disbursement Status
                  </label>
                  <select
                    value={paymentForm.paymentStatus}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="UNPAID">UNPAID (Pending Payout)</option>
                    <option value="PROCESSING">PROCESSING (Initiated)</option>
                    <option value="PAID">PAID (Completed Reimbursement)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Reference / UTR / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentForm.paymentReference}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentReference: e.target.value,
                    })
                  }
                  placeholder="e.g. UTR123456789, Bank Ref #, Cheque #004321"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPayment}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                >
                  {isUpdatingPayment ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    <FiCheck className="h-4 w-4" />
                  )}
                  <span>Save Payment Details</span>
                </button>
              </div>
            </form>
          )}

          {/* Action Approval Bar if Pending & Admin */}
          {isAdmin && claim.status === "PENDING" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Admin Decision on this Expense
                </span>
                <span className="text-[11px] font-semibold text-amber-600">
                  Awaiting your approval
                </span>
              </div>

              {adminAction === null ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdminAction("approve")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  >
                    <FiCheck className="h-4 w-4" />
                    <span>Approve Claim (₹{Number(claim.amount).toLocaleString("en-IN")})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminAction("reject")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition cursor-pointer"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Reject Claim</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {adminAction === "approve"
                        ? "Confirm Approval"
                        : "Reason for Rejection (Required)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdminAction(null)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder={
                      adminAction === "approve"
                        ? "Optional approval remarks (e.g. Verified with client travel schedule)"
                        : "State the reason for declining this reimbursement..."
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminAction(null)}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={actionSubmitting}
                      onClick={() => handleApproveOrReject(adminAction)}
                      className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                        adminAction === "approve"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {actionSubmitting && (
                        <FiLoader className="h-3.5 w-3.5 animate-spin" />
                      )}
                      <span>
                        {adminAction === "approve"
                          ? "Confirm & Approve"
                          : "Confirm & Reject"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
