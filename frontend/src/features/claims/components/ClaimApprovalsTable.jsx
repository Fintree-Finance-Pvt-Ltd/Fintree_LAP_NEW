import { useState, useMemo } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiFilter,
  FiInfo,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";
import ReceiptViewerModal from "./ReceiptViewerModal.jsx";

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

export default function ClaimApprovalsTable({ claims = [], isLoading, onRefresh }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING"); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Selected Claim for Action modals
  const [selectedReceiptClaim, setSelectedReceiptClaim] = useState(null);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "approve", // 'approve' | 'reject'
    claim: null,
    remarks: "",
    submitting: false,
  });

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Status filter
      if (statusFilter !== "ALL" && claim.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "ALL" && claim.category !== categoryFilter) {
        return false;
      }
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const userName = claim.user?.name?.toLowerCase() || "";
        const userEmail = claim.user?.email?.toLowerCase() || "";
        const title = claim.title?.toLowerCase() || "";
        const claimNo = claim.claimNumber?.toLowerCase() || "";
        const merchant = claim.merchantName?.toLowerCase() || "";
        const invoice = claim.invoiceNumber?.toLowerCase() || "";

        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          title.includes(q) ||
          claimNo.includes(q) ||
          merchant.includes(q) ||
          invoice.includes(q)
        );
      }
      return true;
    });
  }, [claims, statusFilter, categoryFilter, search]);

  const handleOpenAction = (claim, type) => {
    setActionModal({
      isOpen: true,
      type,
      claim,
      remarks: type === "approve" ? "Approved by Admin" : "",
      submitting: false,
    });
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    const { type, claim, remarks } = actionModal;
    if (!claim) return;

    if (type === "reject" && !remarks.trim()) {
      toast.error("Please provide a reason for rejecting this claim.");
      return;
    }

    setActionModal((prev) => ({ ...prev, submitting: true }));
    try {
      if (type === "approve") {
        await claimsApi.approveClaim(claim.id, { adminRemarks: remarks });
        toast.success(`Claim ${claim.claimNumber} approved successfully!`);
      } else {
        await claimsApi.rejectClaim(claim.id, { adminRemarks: remarks });
        toast.success(`Claim ${claim.claimNumber} rejected.`);
      }

      setActionModal({
        isOpen: false,
        type: "approve",
        claim: null,
        remarks: "",
        submitting: false,
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${type} claim.`;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-[11px] font-bold text-rose-700 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, claim#, merchant..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "PENDING"
                  ? "Pending"
                  : st === "APPROVED"
                  ? "Approved"
                  : st === "REJECTED"
                  ? "Rejected"
                  : "All"}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {Object.keys(CATEGORY_META).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / Cards View */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-14 text-slate-400">
            <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Loading claims approvals queue...
            </p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 border border-slate-200">
              <FiFileText className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              No expense claims found
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {search || statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "Try clearing your search query or adjusting your filters."
                : "There are currently no employee expense claims in this queue."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (Optimized with explicit column widths and no awkward line wraps) */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-40 whitespace-nowrap">Claim ID & Date</th>
                    <th className="py-3.5 px-4 w-48 whitespace-nowrap">Employee</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Category & Purpose</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Merchant / Bill Details</th>
                    <th className="py-3.5 px-4 w-36 whitespace-nowrap text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 w-28 whitespace-nowrap text-center">Receipt</th>
                    <th className="py-3.5 px-4 w-36 whitespace-nowrap text-center">Status</th>
                    <th className="py-3.5 px-4 w-44 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredClaims.map((claim) => {
                    const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
                    return (
                      <tr
                        key={claim.id}
                        className="hover:bg-slate-50/80 transition duration-150"
                      >
                        {/* Claim # & Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-blue-600 text-[13px] tracking-tight">
                            {claim.claimNumber}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <FiClock className="h-3 w-3 text-slate-400" />
                            <span>{claim.expenseDate}</span>
                          </div>
                        </td>

                        {/* Employee */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700 font-black text-xs border border-blue-200">
                              {claim.user?.name
                                ? claim.user.name[0].toUpperCase()
                                : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {claim.user?.name || "Employee"}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {claim.user?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Title */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${catMeta.color}`}
                            >
                              <span>{catMeta.icon}</span>
                              <span>{catMeta.label}</span>
                            </span>
                            <div
                              className="font-semibold text-slate-900 line-clamp-2 leading-snug"
                              title={claim.title}
                            >
                              {claim.title}
                            </div>
                            {claim.description && (
                              <div
                                className="text-[11px] text-slate-500 line-clamp-1"
                                title={claim.description}
                              >
                                {claim.description}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Merchant / Bill Details */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 line-clamp-1" title={claim.merchantName || "—"}>
                              {claim.merchantName || "—"}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                              {claim.invoiceNumber && (
                                <span className="font-mono text-slate-600">
                                  Bill#: <strong>{claim.invoiceNumber}</strong>
                                </span>
                              )}
                              {claim.gstNumber && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  GST: {claim.gstNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-black text-slate-900 font-mono tracking-tight">
                            ₹{Number(claim.amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          {Number(claim.taxAmount) > 0 && (
                            <div className="text-[10px] font-medium text-slate-400">
                              Incl. Tax: ₹{Number(claim.taxAmount).toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Receipt */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          {claim.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptClaim(claim)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer"
                            >
                              <FiEye className="h-3.5 w-3.5" />
                              <span>View Bill</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No Bill
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          {getStatusBadge(claim.status)}
                          {claim.adminRemarks && (
                            <div
                              className="text-[10px] text-slate-500 mt-1 max-w-[140px] mx-auto truncate italic"
                              title={claim.adminRemarks}
                            >
                              &quot;{claim.adminRemarks}&quot;
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          {claim.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenAction(claim, "approve")}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                              >
                                <FiCheck className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(claim, "reject")}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition cursor-pointer"
                              >
                                <FiX className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tablet & Mobile Clean Card View */}
            <div className="block xl:hidden divide-y divide-slate-100">
              {filteredClaims.map((claim) => {
                const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
                return (
                  <div key={claim.id} className="p-4 sm:p-5 space-y-3.5 hover:bg-slate-50/60 transition">
                    {/* Top Row: Claim# & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-blue-600">
                          {claim.claimNumber}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <FiClock className="h-3 w-3 text-slate-400" />
                          {claim.expenseDate}
                        </span>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    {/* Employee & Amount Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-[10px]">
                            {claim.user?.name ? claim.user.name[0].toUpperCase() : "U"}
                          </div>
                          <span className="font-bold text-slate-900 text-sm">
                            {claim.user?.name || "Employee"}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 pt-1">
                          {claim.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-slate-900 font-mono tracking-tight">
                          ₹{Number(claim.amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-bold border mt-0.5 ${catMeta.color}`}>
                          <span>{catMeta.icon}</span>
                          <span>{catMeta.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Merchant / Bill# */}
                    {(claim.merchantName || claim.invoiceNumber) && (
                      <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <strong className="text-slate-500">Merchant:</strong> {claim.merchantName || "—"}
                        </span>
                        {claim.invoiceNumber && (
                          <span className="font-mono">
                            <strong className="text-slate-500">Bill#:</strong> {claim.invoiceNumber}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Admin remarks */}
                    {claim.adminRemarks && (
                      <p className="text-xs text-slate-700 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70">
                        <strong>Admin Remarks:</strong> {claim.adminRemarks}
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      {claim.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptClaim(claim)}
                          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          <span>View Bill</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Bill</span>
                      )}

                      {claim.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAction(claim, "approve")}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                          >
                            <FiCheck className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(claim, "reject")}
                            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition cursor-pointer"
                          >
                            <FiX className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Approve / Reject Dialog Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                {actionModal.type === "approve" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FiCheck className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <FiX className="h-4 w-4" />
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-900">
                  {actionModal.type === "approve"
                    ? "Approve Expense Claim"
                    : "Reject Expense Claim"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActionModal({
                    isOpen: false,
                    type: "approve",
                    claim: null,
                    remarks: "",
                    submitting: false,
                  })
                }
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1.5 border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-500">Claim Number:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {actionModal.claim?.claimNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-bold text-slate-900">
                    {actionModal.claim?.user?.name || "Employee"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Claim Amount:</span>
                  <span className="font-black text-blue-700 font-mono text-sm">
                    ₹{Number(actionModal.claim?.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {actionModal.type === "approve"
                    ? "Approval Remarks (Optional)"
                    : "Reason for Rejection *"}
                </label>
                <textarea
                  rows={3}
                  value={actionModal.remarks}
                  onChange={(e) =>
                    setActionModal((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  required={actionModal.type === "reject"}
                  placeholder={
                    actionModal.type === "approve"
                      ? "e.g. Verified with attached travel receipt."
                      : "e.g. Receipt is blurry / Expense not authorized."
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      isOpen: false,
                      type: "approve",
                      claim: null,
                      remarks: "",
                      submitting: false,
                    })
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionModal.submitting}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                    actionModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  }`}
                >
                  {actionModal.submitting ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : actionModal.type === "approve" ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    <FiX className="h-4 w-4" />
                  )}
                  <span>
                    {actionModal.type === "approve"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Full Preview Modal */}
      {selectedReceiptClaim && (
        <ReceiptViewerModal
          isOpen={!!selectedReceiptClaim}
          onClose={() => setSelectedReceiptClaim(null)}
          receiptUrl={selectedReceiptClaim.receiptUrl}
          originalName={selectedReceiptClaim.receiptOriginalName}
          claimNumber={selectedReceiptClaim.claimNumber}
          ocrRawText={selectedReceiptClaim.ocrRawText}
          amount={selectedReceiptClaim.amount}
          merchantName={selectedReceiptClaim.merchantName}
        />
      )}
    </div>
  );
}
