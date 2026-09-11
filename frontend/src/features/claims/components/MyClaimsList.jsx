import { useState, useMemo } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiFilter,
  FiInfo,
  FiLoader,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";
import ClaimDetailsModal from "./ClaimDetailsModal.jsx";
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

export default function MyClaimsList({
  claims = [],
  isLoading,
  onRefresh,
  onOpenApplyModal,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [inspectingClaim, setInspectingClaim] = useState(null);
  const [selectedReceiptClaim, setSelectedReceiptClaim] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      if (statusFilter !== "ALL" && claim.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "ALL" && claim.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = claim.title?.toLowerCase() || "";
        const claimNo = claim.claimNumber?.toLowerCase() || "";
        const merchant = claim.merchantName?.toLowerCase() || "";
        const category = claim.category?.toLowerCase() || "";

        return (
          title.includes(q) ||
          claimNo.includes(q) ||
          merchant.includes(q) ||
          category.includes(q)
        );
      }
      return true;
    });
  }, [claims, statusFilter, categoryFilter, search]);

  const handleCancelClaim = async (id, claimNumber) => {
    if (!window.confirm(`Are you sure you want to cancel claim ${claimNumber}?`)) {
      return;
    }

    setCancellingId(id);
    try {
      await claimsApi.cancelClaim(id);
      toast.success(`Claim ${claimNumber} cancelled.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to cancel claim.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setCancellingId(null);
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
            Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my claims, title, merchant..."
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

          {/* Filter Pills */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 overflow-x-auto">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL"
                  ? "All Claims"
                  : st === "PENDING"
                  ? "Pending"
                  : st === "APPROVED"
                  ? "Approved"
                  : "Rejected"}
              </button>
            ))}
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <FiTag className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Expense Categories</option>
              {Object.keys(CATEGORY_META).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {CATEGORY_META[catKey].icon} {CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
          </div>

          {(search || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Claims Content */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-14 text-slate-400">
            <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Loading your claims...
            </p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <FiFileText className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              No claims submitted yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              You haven&apos;t submitted any expense claims matching your filter.
            </p>
            {onOpenApplyModal && (
              <button
                type="button"
                onClick={onOpenApplyModal}
                className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
              >
                <FiPlus className="h-4 w-4" />
                <span>Submit Your First Claim</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => {
              const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
              return (
                <div
                  key={claim.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  {/* Left details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg border border-slate-200">
                      {catMeta.icon}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectingClaim(claim)}
                          className="font-mono text-xs font-bold text-blue-600 hover:underline"
                        >
                          {claim.claimNumber}
                        </button>
                        {getStatusBadge(claim.status)}
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <FiCalendar className="h-3 w-3 text-slate-400" />
                          {claim.expenseDate}
                        </span>
                      </div>

                      <h4
                        onClick={() => setInspectingClaim(claim)}
                        className="text-sm font-bold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                      >
                        {claim.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-bold border ${catMeta.color}`}>
                          <span>{catMeta.icon}</span>
                          <span>{catMeta.label}</span>
                        </span>
                        {claim.merchantName && (
                          <span>
                            Merchant: <strong className="text-slate-700">{claim.merchantName}</strong>
                          </span>
                        )}
                        {claim.invoiceNumber && (
                          <span className="font-mono">
                            Bill#: <strong className="text-slate-700">{claim.invoiceNumber}</strong>
                          </span>
                        )}
                      </div>

                      {/* Admin remarks */}
                      {claim.adminRemarks && (
                        <div
                          className={`text-xs p-2.5 rounded-xl border mt-2 ${
                            claim.status === "REJECTED"
                              ? "bg-rose-50 border-rose-200/80 text-rose-800"
                              : "bg-emerald-50 border-emerald-200/80 text-emerald-800"
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

                  {/* Right Amount & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-2.5">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">
                        ₹{Number(claim.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingClaim(claim)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                      >
                        <FiEye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>

                      {claim.receiptUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptClaim(claim)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <FiFileText className="h-3.5 w-3.5" />
                          <span>Bill</span>
                        </button>
                      )}

                      {claim.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleCancelClaim(claim.id, claim.claimNumber)}
                          disabled={cancellingId === claim.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          title="Cancel Pending Claim"
                        >
                          {cancellingId === claim.id ? (
                            <FiLoader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FiTrash2 className="h-3.5 w-3.5" />
                          )}
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspect Single Claim Details Modal */}
      {inspectingClaim && (
        <ClaimDetailsModal
          isOpen={!!inspectingClaim}
          onClose={() => setInspectingClaim(null)}
          claim={inspectingClaim}
          onRefresh={onRefresh}
          isAdmin={false}
        />
      )}

      {/* Receipt Preview Modal */}
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
