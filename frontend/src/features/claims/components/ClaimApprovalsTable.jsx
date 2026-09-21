import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiImage,
  FiLoader,
  FiSearch,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";
import ClaimDetailsModal from "./ClaimDetailsModal.jsx";
import ReceiptViewerModal from "./ReceiptViewerModal.jsx";

export const CATEGORY_META = {
  TRAVEL: {
    icon: "🚕",
    label: "Travel & Commute",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  FUEL: {
    icon: "⛽",
    label: "Fuel / Petrol",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  FOOD: {
    icon: "🍔",
    label: "Food & Meals",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  HOTEL: {
    icon: "🏨",
    label: "Hotel & Stay",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  OFFICE_SUPPLIES: {
    icon: "📎",
    label: "Office Supplies",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  CLIENT_ENTERTAINMENT: {
    icon: "🤝",
    label: "Client Meeting",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  INTERNET_PHONE: {
    icon: "📱",
    label: "Telecom / Wifi",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  MEDICAL: {
    icon: "💊",
    label: "Medical & Health",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  OTHER: {
    icon: "📝",
    label: "Miscellaneous",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export default function ClaimApprovalsTable({
  claims = [],
  allClaimsRaw = [],
  selectedMonth = "ALL",
  selectedCategory = "ALL",
  onCategoryChange,
  onMonthChange,
  isLoading,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [employeeFilter, setEmployeeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  // Selected Claims for Inspection Modal or Receipt Viewer
  const [inspectingClaim, setInspectingClaim] = useState(null);
  const [selectedReceiptClaim, setSelectedReceiptClaim] = useState(null);

  // Multi-select bulk approval/rejection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkModal, setBulkModal] = useState({
    isOpen: false,
    type: "approve", // 'approve' | 'reject'
    remarks: "",
    submitting: false,
  });

  // Single Action Modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "approve",
    claim: null,
    remarks: "",
    submitting: false,
  });

  // Category sync
  const activeCategory =
    selectedCategory !== "ALL" ? selectedCategory : categoryFilter;

  const handleCategorySelect = (val) => {
    setCategoryFilter(val);
    if (onCategoryChange) onCategoryChange(val);
  };

  // Unique list of employees
  const employeeList = useMemo(() => {
    const map = new Map();
    claims.forEach((c) => {
      const uid = c.userId || c.user?.id;
      if (uid && !map.has(uid)) {
        map.set(uid, {
          id: uid,
          name: c.user?.name || `Employee #${uid}`,
          email: c.user?.email || "",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [claims]);

  // Filter Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Status filter
      if (statusFilter !== "ALL" && claim.status !== statusFilter) {
        return false;
      }
      // Payment filter
      if (paymentFilter !== "ALL" && claim.paymentStatus !== paymentFilter) {
        return false;
      }
      // Category filter
      if (activeCategory !== "ALL" && claim.category !== activeCategory) {
        return false;
      }
      // Employee filter
      if (employeeFilter !== "ALL") {
        const uid = String(claim.userId || claim.user?.id);
        if (uid !== String(employeeFilter)) return false;
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
        const desc = claim.description?.toLowerCase() || "";

        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          title.includes(q) ||
          claimNo.includes(q) ||
          merchant.includes(q) ||
          invoice.includes(q) ||
          desc.includes(q)
        );
      }
      return true;
    });
  }, [
    claims,
    statusFilter,
    paymentFilter,
    activeCategory,
    employeeFilter,
    search,
  ]);

  // Multi-select helpers
  const pendingFilteredClaims = useMemo(() => {
    return filteredClaims.filter((c) => c.status === "PENDING");
  }, [filteredClaims]);

  const allPendingSelected =
    pendingFilteredClaims.length > 0 &&
    pendingFilteredClaims.every((c) => selectedIds.includes(c.id));

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingFilteredClaims.map((c) => c.id));
    }
  };

  const toggleSelectClaim = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectedClaimsTotalAmount = useMemo(() => {
    return claims
      .filter((c) => selectedIds.includes(c.id))
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [claims, selectedIds]);

  // Single Action handlers
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

      // Remove from selected list if present
      setSelectedIds((prev) => prev.filter((id) => id !== claim.id));

      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${type} claim.`;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Bulk Action handlers
  const handleOpenBulkModal = (type) => {
    if (selectedIds.length === 0) {
      toast.info("Please select at least one pending claim.");
      return;
    }
    setBulkModal({
      isOpen: true,
      type,
      remarks: type === "approve" ? "Bulk approved by Admin" : "",
      submitting: false,
    });
  };

  const handleConfirmBulkAction = async (e) => {
    e.preventDefault();
    const { type, remarks } = bulkModal;

    if (type === "reject" && !remarks.trim()) {
      toast.error("Please provide a rejection reason for selected claims.");
      return;
    }

    setBulkModal((prev) => ({ ...prev, submitting: true }));
    try {
      if (type === "approve") {
        await claimsApi.bulkApproveClaims({
          claimIds: selectedIds,
          adminRemarks: remarks.trim() || "Bulk approved by Admin",
        });
        toast.success(
          `Successfully approved ${selectedIds.length} expense claims!`,
        );
      } else {
        await claimsApi.bulkRejectClaims({
          claimIds: selectedIds,
          adminRemarks: remarks.trim(),
        });
        toast.success(`Rejected ${selectedIds.length} claims.`);
      }

      setSelectedIds([]);
      setBulkModal({
        isOpen: false,
        type: "approve",
        remarks: "",
        submitting: false,
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Bulk operation failed. Please try again.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setBulkModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleCopyClaimNo = (claimNumber) => {
    if (!claimNumber) return;
    navigator.clipboard.writeText(claimNumber);
    toast.info(`Claim ID copied: ${claimNumber}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/90 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            ✓ Disbursed
          </span>
        );
      case "IN_PROCESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            Processing Payout
          </span>
        );
      case "UNPAID":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Unpaid
          </span>
        );
    }
  };

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters & Search */}
      <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, claim ID, purpose, merchant, bill#..."
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

          {/* Status Filter Buttons */}
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
                  ? "All Status"
                  : st === "PENDING"
                  ? "Pending Review"
                  : st === "APPROVED"
                  ? "Approved"
                  : "Rejected"}
              </button>
            ))}
          </div>
        </div>

        {/* Multi Dropdowns Row: Employee, Category, Payment & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Employee Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
              <FiUser className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer max-w-[150px] sm:max-w-xs truncate"
              >
                <option value="ALL">All Employees ({employeeList.length})</option>
                {employeeList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.email ? `(${emp.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
              <FiTag className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={activeCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {Object.keys(CATEGORY_META).map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {CATEGORY_META[catKey].icon} {CATEGORY_META[catKey].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
              <FiCreditCard className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="UNPAID">Unpaid / Pending Payout</option>
                <option value="IN_PROCESS">In Process</option>
                <option value="PAID">Disbursed / Paid</option>
              </select>
            </div>

            {/* Reset All Filters */}
            {(search ||
              statusFilter !== "ALL" ||
              activeCategory !== "ALL" ||
              employeeFilter !== "ALL" ||
              paymentFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  handleCategorySelect("ALL");
                  setEmployeeFilter("ALL");
                  setPaymentFilter("ALL");
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-1"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Showing <strong className="text-slate-900">{filteredClaims.length}</strong> claims
          </div>
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-blue-300 bg-slate-900 text-white p-3.5 sm:p-4 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-xs font-black">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold">
                {selectedIds.length} Pending {selectedIds.length === 1 ? "claim" : "claims"} selected
              </p>
              <p className="text-[11px] text-slate-300 font-mono">
                Total sum: ₹{Number(selectedClaimsTotalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Deselect All
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkModal("reject")}
              className="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 transition cursor-pointer"
            >
              <FiX className="h-3.5 w-3.5" />
              <span>Reject Selected</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkModal("approve")}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition cursor-pointer"
            >
              <FiCheck className="h-3.5 w-3.5" />
              <span>Approve Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Approvals Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <FiLoader className="h-9 w-9 animate-spin text-blue-600" />
            <p className="mt-3 text-xs font-bold text-slate-600">
              Loading approvals queue...
            </p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 border border-slate-200">
              <FiCheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-base font-black text-slate-900">
              Approvals Queue is Clear!
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              There are no pending claims matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAllPending}
                      disabled={pendingFilteredClaims.length === 0}
                      title="Select all pending claims in view"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                    />
                  </th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Claim ID & Category</th>
                  <th className="px-4 py-3.5">Purpose & Merchant</th>
                  <th className="px-4 py-3.5">Expense Date</th>
                  <th className="px-4 py-3.5">Amount (INR)</th>
                  <th className="px-4 py-3.5">Bill Receipt</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Disbursement</th>
                  <th className="px-4 py-3.5 text-right">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((claim) => {
                  const catMeta =
                    CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
                  const isSelected = selectedIds.includes(claim.id);
                  const isPending = claim.status === "PENDING";
                  const empName = claim.user?.name || "Employee";
                  const empEmail = claim.user?.email || "";

                  return (
                    <tr
                      key={claim.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectClaim(claim.id)}
                          disabled={!isPending}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4 disabled:opacity-30"
                        />
                      </td>

                      {/* Employee Profile */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-[11px] font-black text-white shadow-2xs">
                            {getInitials(empName)}
                          </div>
                          <div className="min-w-0 max-w-[140px]">
                            <div className="font-bold text-slate-900 truncate">
                              {empName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {empEmail || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Claim ID & Category */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{catMeta.icon}</span>
                          <div>
                            <button
                              type="button"
                              onClick={() => setInspectingClaim(claim)}
                              className="font-mono font-black text-blue-600 hover:underline block"
                            >
                              {claim.claimNumber}
                            </button>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {catMeta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Purpose & Merchant */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div
                          onClick={() => setInspectingClaim(claim)}
                          className="font-bold text-slate-900 hover:text-blue-600 truncate cursor-pointer"
                        >
                          {claim.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                          {claim.merchantName && (
                            <span className="truncate">
                              🏪 {claim.merchantName}
                            </span>
                          )}
                          {claim.invoiceNumber && (
                            <span className="font-mono text-slate-400">
                              #{claim.invoiceNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expense Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {claim.expenseDate}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₹{Number(claim.amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        {claim.taxAmount > 0 && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            incl. ₹{claim.taxAmount} GST
                          </div>
                        )}
                      </td>

                      {/* Receipt */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {claim.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptClaim(claim)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
                          >
                            <FiFileText className="h-3 w-3" />
                            <span>View Bill</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Receipt</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(claim.status)}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getPaymentBadge(claim.paymentStatus)}
                      </td>

                      {/* Audit Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(claim, "approve")}
                                className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                                title="Approve Claim"
                              >
                                <FiCheck className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAction(claim, "reject")}
                                className="flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                                title="Reject Claim"
                              >
                                <FiX className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setInspectingClaim(claim)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Inspect Detailed Voucher"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Action Modal (Approve / Reject) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                actionModal.type === "approve"
                  ? "bg-emerald-50/80 border-emerald-100"
                  : "bg-rose-50/80 border-rose-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${
                    actionModal.type === "approve"
                      ? "bg-emerald-600"
                      : "bg-rose-600"
                  }`}
                >
                  {actionModal.type === "approve" ? (
                    <FiCheck className="h-5 w-5" />
                  ) : (
                    <FiX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {actionModal.type === "approve"
                      ? "Approve Expense Claim"
                      : "Reject Expense Claim"}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {actionModal.claim?.claimNumber} • ₹
                    {Number(actionModal.claim?.amount).toLocaleString("en-IN")}
                  </p>
                </div>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {actionModal.type === "approve"
                    ? "Approval Remarks / Notes (Optional)"
                    : "Rejection Reason (Required)"}
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
                      ? "E.g. Approved as per company travel policy."
                      : "E.g. Bill receipt is unclear or exceeds daily allowance limit."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
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
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionModal.submitting}
                  className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                    actionModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  }`}
                >
                  {actionModal.submitting && (
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>
                    Confirm{" "}
                    {actionModal.type === "approve" ? "Approval" : "Rejection"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                bulkModal.type === "approve"
                  ? "bg-emerald-50/80 border-emerald-100"
                  : "bg-rose-50/80 border-rose-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${
                    bulkModal.type === "approve"
                      ? "bg-emerald-600"
                      : "bg-rose-600"
                  }`}
                >
                  {bulkModal.type === "approve" ? (
                    <FiCheck className="h-5 w-5" />
                  ) : (
                    <FiX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Bulk {bulkModal.type === "approve" ? "Approve" : "Reject"}{" "}
                    {selectedIds.length} Claims
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Total: ₹
                    {Number(selectedClaimsTotalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBulkModal({
                    isOpen: false,
                    type: "approve",
                    remarks: "",
                    submitting: false,
                  })
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBulkAction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {bulkModal.type === "approve"
                    ? "Bulk Approval Remarks (Optional)"
                    : "Bulk Rejection Reason (Required)"}
                </label>
                <textarea
                  rows={3}
                  value={bulkModal.remarks}
                  onChange={(e) =>
                    setBulkModal((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  required={bulkModal.type === "reject"}
                  placeholder={
                    bulkModal.type === "approve"
                      ? "E.g. Approved all selected items during monthly audit."
                      : "E.g. Duplicate entries or missing GST invoices."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setBulkModal({
                      isOpen: false,
                      type: "approve",
                      remarks: "",
                      submitting: false,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={bulkModal.submitting}
                  className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                    bulkModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  }`}
                >
                  {bulkModal.submitting && (
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>
                    Confirm{" "}
                    {bulkModal.type === "approve" ? "Approval" : "Rejection"} (
                    {selectedIds.length})
                  </span>
                </button>
              </div>
            </form>
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
          isAdmin={true}
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
