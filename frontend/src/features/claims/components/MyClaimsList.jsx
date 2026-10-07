import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiCopy,
  FiEye,
  FiFileText,
  FiGrid,
  FiHash,
  FiImage,
  FiList,
  FiLoader,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiX,
  FiXCircle
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";
import { CATEGORY_META } from "./ClaimApprovalsTable.jsx";
import ClaimDetailsModal from "./ClaimDetailsModal.jsx";
import ReceiptViewerModal from "./ReceiptViewerModal.jsx";

export default function MyClaimsList({
  claims = [],
  // allClaimsRaw = [],
  // selectedMonth = "ALL",
  selectedCategory = "ALL",
  onCategoryChange,
  // onMonthChange,
  isLoading,
  onRefresh,
  onOpenApplyModal,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST"); // NEWEST | OLDEST | AMOUNT_HIGH | AMOUNT_LOW | DATE
  const [viewMode, setViewMode] = useState("table"); // "cards" | "table"
  const [inspectingClaim, setInspectingClaim] = useState(null);
  const [selectedReceiptClaim, setSelectedReceiptClaim] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Sync category filter if changed from parent quick chips
  const activeCategory =
    selectedCategory !== "ALL" ? selectedCategory : categoryFilter;

  const handleCategorySelect = (val) => {
    setCategoryFilter(val);
    if (onCategoryChange) {
      onCategoryChange(val);
    }
  };

  const filteredAndSortedClaims = useMemo(() => {
    let result = claims.filter((claim) => {
      if (statusFilter !== "ALL" && claim.status !== statusFilter) {
        return false;
      }
      if (activeCategory !== "ALL" && claim.category !== activeCategory) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = claim.title?.toLowerCase() || "";
        const claimNo = claim.claimNumber?.toLowerCase() || "";
        const merchant = claim.merchantName?.toLowerCase() || "";
        const invoice = claim.invoiceNumber?.toLowerCase() || "";
        const category = claim.category?.toLowerCase() || "";

        return (
          title.includes(q) ||
          claimNo.includes(q) ||
          merchant.includes(q) ||
          invoice.includes(q) ||
          category.includes(q)
        );
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.createdAt || b.expenseDate) - new Date(a.createdAt || a.expenseDate);
      }
      if (sortBy === "OLDEST") {
        return new Date(a.createdAt || a.expenseDate) - new Date(b.createdAt || b.expenseDate);
      }
      if (sortBy === "AMOUNT_HIGH") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (sortBy === "AMOUNT_LOW") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }
      if (sortBy === "DATE") {
        return new Date(b.expenseDate || 0) - new Date(a.expenseDate || 0);
      }
      return 0;
    });

    return result;
  }, [claims, statusFilter, activeCategory, search, sortBy]);

  const handleCopyClaimNo = (claimNumber) => {
    if (!claimNumber) return;
    navigator.clipboard.writeText(claimNumber);
    toast.info(`Claim ID copied: ${claimNumber}`);
  };

  const handleCancelClaim = async (id, claimNumber) => {
    if (!window.confirm(`Are you sure you want to cancel claim ${claimNumber}?`)) {
      return;
    }

    setCancellingId(id);
    try {
      await claimsApi.cancelClaim(id);
      toast.success(`Claim ${claimNumber} cancelled successfully.`);
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

  const handleDeleteClaim = async (id, claimNumber) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete claim ${claimNumber}?`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await claimsApi.deleteClaim(id);
      toast.success(`Claim ${claimNumber} deleted successfully.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete claim.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending Review
          </span>
        );
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            Disbursed
          </span>
        );
      case "IN_PROCESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
            Processing Payout
          </span>
        );
      case "UNPAID":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/60 px-2 py-0.5 text-[10px] font-normal text-slate-500">
            Unpaid
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Toolbar */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims by ID, title, merchant, bill#..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
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

          {/* Status Pills */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 overflow-x-auto">
            {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL"
                  ? "All Status"
                  : st === "PENDING"
                  ? "Pending"
                  : st === "APPROVED"
                  ? "Approved"
                  : st === "REJECTED"
                  ? "Rejected"
                  : "Cancelled"}
              </button>
            ))}
          </div>

          {/* View Toggle (Cards vs Table) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Card Grid View"
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Compact Table View"
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70">
              <FiTag className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={activeCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {Object.keys(CATEGORY_META).map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {CATEGORY_META[catKey].icon} {CATEGORY_META[catKey].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="NEWEST">Newest Submitted</option>
                <option value="DATE">Expense Date</option>
                <option value="AMOUNT_HIGH">Amount: High to Low</option>
                <option value="AMOUNT_LOW">Amount: Low to High</option>
                <option value="OLDEST">Oldest Submitted</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(search || statusFilter !== "ALL" || activeCategory !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  handleCategorySelect("ALL");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-800 font-bold">{filteredAndSortedClaims.length}</strong> claims
          </div>
        </div>
      </div>

      {/* Claims Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-200/80 bg-white shadow-xs text-slate-400">
          <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-xs font-semibold text-slate-600">
            Loading expense claims...
          </p>
        </div>
      ) : filteredAndSortedClaims.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-200/80 bg-white shadow-xs text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 shadow-xs">
            <FiFileText className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            No Claims Found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {search || statusFilter !== "ALL" || activeCategory !== "ALL"
              ? "No expense claims match your search filters. Try resetting filters."
              : "You haven't submitted any expense claims for this billing period."}
          </p>
          {onOpenApplyModal && (
            <button
              type="button"
              onClick={onOpenApplyModal}
              className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition cursor-pointer"
            >
              <FiPlus className="h-4 w-4" />
              <span>Submit Claim</span>
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedClaims.map((claim) => {
            const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
            const hasReceipt = Boolean(claim.receiptUrl);

            return (
              <div
                key={claim.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition"
              >
                {/* Top Row: Category Icon & Title & Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg border border-slate-200/80 shadow-2xs">
                        {catMeta.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyClaimNo(claim.claimNumber)}
                            className="font-mono text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                            title="Click to copy Claim ID"
                          >
                            <span>{claim.claimNumber}</span>
                            <FiCopy className="h-3 w-3 text-slate-400" />
                          </button>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/60">
                            {catMeta.label}
                          </span>
                        </div>
                        <h4
                          onClick={() => setInspectingClaim(claim)}
                          className="mt-0.5 text-sm font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer line-clamp-1"
                        >
                          {claim.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getStatusBadge(claim.status)}
                      {getPaymentBadge(claim.paymentStatus)}
                    </div>
                  </div>

                  {/* Metadata Chips: Merchant, Bill#, Date */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 font-medium">
                      <FiCalendar className="h-3 w-3 text-slate-400" />
                      {claim.expenseDate}
                    </span>

                    {claim.merchantName && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 font-medium text-slate-700">
                        <FiShoppingBag className="h-3 w-3 text-slate-400" />
                        {claim.merchantName}
                      </span>
                    )}

                    {claim.invoiceNumber && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 font-mono text-slate-600">
                        <FiHash className="h-3 w-3 text-slate-400" />
                        {claim.invoiceNumber}
                      </span>
                    )}
                  </div>

                  {/* Rejection / Approval Remarks */}
                  {claim.adminRemarks && (
                    <div
                      className={`text-xs p-3 rounded-xl border ${
                        claim.status === "REJECTED"
                          ? "bg-rose-50/70 border-rose-200/80 text-rose-800"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <strong>
                        {claim.status === "REJECTED"
                          ? "Rejection Note:"
                          : "Admin Note:"}
                      </strong>{" "}
                      {claim.adminRemarks}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Amount & Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Total Amount
                    </span>
                    <div className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                      ₹{Number(claim.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectingClaim(claim)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                      title="Inspect voucher details"
                    >
                      <FiEye className="h-3.5 w-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>

                    {hasReceipt && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptClaim(claim)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Preview uploaded bill / receipt"
                      >
                        <FiImage className="h-3.5 w-3.5 text-slate-400" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {claim.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelClaim(claim.id, claim.claimNumber)
                        }
                        disabled={cancellingId === claim.id}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                        title="Cancel Pending Claim"
                      >
                        {cancellingId === claim.id ? (
                          <FiLoader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FiXCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>Cancel</span>
                      </button>
                    )}

                    {(claim.status === "CANCELLED" || claim.status === "PENDING") && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteClaim(claim.id, claim.claimNumber)
                        }
                        disabled={deletingId === claim.id}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                        title="Delete Claim"
                      >
                        {deletingId === claim.id ? (
                          <FiLoader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FiTrash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Claim ID & Category</th>
                  <th className="px-4 py-3.5">Purpose & Merchant</th>
                  <th className="px-4 py-3.5">Expense Date</th>
                  <th className="px-4 py-3.5">Amount (INR)</th>
                  <th className="px-4 py-3.5">Receipt</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedClaims.map((claim) => {
                  const catMeta =
                    CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{catMeta.icon}</span>
                          <div>
                            <button
                              type="button"
                              onClick={() => setInspectingClaim(claim)}
                              className="font-mono font-bold text-slate-900 hover:text-blue-600 hover:underline block"
                            >
                              {claim.claimNumber}
                            </button>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {catMeta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div
                          onClick={() => setInspectingClaim(claim)}
                          className="font-semibold text-slate-900 hover:text-blue-600 truncate cursor-pointer"
                        >
                          {claim.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {claim.merchantName ? `Merchant: ${claim.merchantName}` : "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {claim.expenseDate}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ₹{Number(claim.amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {claim.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptClaim(claim)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 cursor-pointer"
                          >
                            <FiFileText className="h-3 w-3 text-slate-500" />
                            <span>Bill</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(claim.status)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getPaymentBadge(claim.paymentStatus)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectingClaim(claim)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                            title="View Voucher"
                          >
                            <FiEye className="h-3.5 w-3.5" />
                          </button>

                          {claim.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelClaim(claim.id, claim.claimNumber)
                              }
                              disabled={cancellingId === claim.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer"
                              title="Cancel Claim"
                            >
                              <FiXCircle className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {(claim.status === "CANCELLED" || claim.status === "PENDING") && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteClaim(claim.id, claim.claimNumber)
                              }
                              disabled={deletingId === claim.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Claim"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
