import { useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiHash,
  FiLoader,
  FiMail,
  FiPrinter,
  FiShoppingBag,
  FiTag,
  FiUser,
  FiX,
  FiXCircle,
  FiZap,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";
import { CATEGORY_META } from "./ClaimApprovalsTable.jsx";

function resolveReceiptUrl(rawUrl) {
  if (!rawUrl) return "";
  const str = String(rawUrl).trim();
  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("blob:") ||
    str.startsWith("data:")
  ) {
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
        `Payment status updated to ${paymentForm.paymentStatus} for ${claim.claimNumber}.`,
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

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info(`${label} copied to clipboard!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
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
                Submitted on {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Print Expense Voucher"
            >
              <FiPrinter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("overview")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiFileText className="h-3.5 w-3.5" />
            <span>Voucher Breakdown</span>
          </button>

          {claim.receiptUrl && (
            <button
              type="button"
              onClick={() => setActiveSubTab("receipt")}
              className={`border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "receipt"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiDownload className="h-3.5 w-3.5" />
              <span>Bill Attachment & OCR</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveSubTab("payment")}
              className={`border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "payment"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiCreditCard className="h-3.5 w-3.5" />
              <span>Disbursement & Settlement</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSubTab === "overview" && (
            <div className="space-y-6">
              {/* Employee & Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee Profile */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Claimant Details
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
                      {claim.user?.name ? claim.user.name.slice(0, 2).toUpperCase() : "EM"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {claim.user?.name || "Employee"}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <FiMail className="h-3 w-3" />
                        {claim.user?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Highlight */}
                <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      Reimbursement Amount
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                      INR
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-2">
                    ₹{Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  {claim.taxAmount > 0 && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Base: ₹{(Number(claim.amount) - Number(claim.taxAmount)).toFixed(2)} + GST: ₹{claim.taxAmount}
                    </p>
                  )}
                </div>
              </div>

              {/* Itemized Claim Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Expense Item</th>
                      <th className="px-4 py-3">Expense Date</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Bill / Invoice#</th>
                      <th className="px-4 py-3 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{claim.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Category: {catMeta.label}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {claim.expenseDate}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {claim.merchantName || "—"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        {claim.invoiceNumber || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Description & Business Justification */}
              {claim.description && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Business Justification / Description
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {claim.description}
                  </p>
                </div>
              )}

              {/* Audit Status & Remarks */}
              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Audit Trail & Status
                </span>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Approval Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        claim.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : claim.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Payment Settlement:
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {claim.paymentStatus || "UNPAID"}
                    </span>
                  </div>
                </div>

                {claim.adminRemarks && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-xs ${
                      claim.status === "REJECTED"
                        ? "bg-rose-50 border-rose-200 text-rose-800"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}
                  >
                    <strong>
                      {claim.status === "REJECTED"
                        ? "Rejection Reason:"
                        : "Admin Remarks:"}
                    </strong>{" "}
                    {claim.adminRemarks}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "receipt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Uploaded Document: {claim.receiptOriginalName || "Receipt"}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={fullReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <FiExternalLink className="h-3.5 w-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              </div>

              {/* Receipt Image / PDF Frame */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-2 overflow-hidden flex items-center justify-center min-h-[300px]">
                {isPdf ? (
                  <iframe
                    src={fullReceiptUrl}
                    title="Receipt PDF"
                    className="h-[450px] w-full rounded-xl bg-white"
                  />
                ) : (
                  <img
                    src={fullReceiptUrl}
                    alt="Receipt Attachment"
                    className="max-h-[450px] w-auto object-contain rounded-xl"
                  />
                )}
              </div>

              {/* OCR Text Drawer if available */}
              {claim.ocrRawText && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      AI OCR Raw Extracted Text
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(claim.ocrRawText, "OCR text")}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FiCopy className="h-3 w-3" />
                      <span>Copy Text</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {claim.ocrRawText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeSubTab === "payment" && isAdmin && (
            <form onSubmit={handleSavePaymentStatus} className="space-y-4 max-w-md mx-auto">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Update Payout & Settlement
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Disbursement Status
                  </label>
                  <select
                    value={paymentForm.paymentStatus}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        paymentStatus: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="UNPAID">UNPAID (Pending)</option>
                    <option value="IN_PROCESS">IN_PROCESS (Bank Transfer Queued)</option>
                    <option value="PAID">PAID (Disbursed to Employee)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        paymentDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank Reference / UTR / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={paymentForm.paymentReference}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        paymentReference: e.target.value,
                      }))
                    }
                    placeholder="E.g. UTR-9827104928"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPayment}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer"
                >
                  {isUpdatingPayment && (
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Save Disbursement Details</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer with Actions for Admin */}
        {isAdmin && claim.status === "PENDING" && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Admin Action Required for this claim
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAdminAction("reject")}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                <FiX className="h-3.5 w-3.5" />
                <span>Reject Claim</span>
              </button>

              <button
                type="button"
                onClick={() => handleApproveOrReject("approve")}
                disabled={actionSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition cursor-pointer"
              >
                {actionSubmitting ? (
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FiCheck className="h-3.5 w-3.5" />
                )}
                <span>Approve Claim</span>
              </button>
            </div>
          </div>
        )}

        {/* Reject Remarks Sub-Dialog */}
        {adminAction === "reject" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Provide Reason for Rejection
              </h3>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="E.g. Attached bill does not match the expense amount..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdminAction(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveOrReject("reject")}
                  disabled={actionSubmitting}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
