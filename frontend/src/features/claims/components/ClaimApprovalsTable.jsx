import { useState, useMemo } from "react";
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiInfo,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { claimsApi } from "../claimsApi.js";
import ClaimDetailsModal from "./ClaimDetailsModal.jsx";
import ReceiptViewerModal from "./ReceiptViewerModal.jsx";

export const CATEGORY_META = {
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
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [employeeFilter, setEmployeeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [dateRangePreset, setDateRangePreset] = useState("ALL"); // 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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
    return Array.from(map.values());
  }, [claims]);

  // Filter Claims
  const filteredClaims = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Compute start & end dates for presets
    let filterStart = "";
    let filterEnd = "";

    if (dateRangePreset === "TODAY") {
      filterStart = todayStr;
      filterEnd = todayStr;
    } else if (dateRangePreset === "THIS_WEEK") {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      filterStart = firstDay.toISOString().slice(0, 10);
      filterEnd = todayStr;
    } else if (dateRangePreset === "THIS_MONTH") {
      const now = new Date();
      filterStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      filterEnd = todayStr;
    } else if (dateRangePreset === "LAST_MONTH") {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      filterStart = prevMonth.toISOString().slice(0, 10);
      filterEnd = lastDayOfPrevMonth.toISOString().slice(0, 10);
    } else if (dateRangePreset === "CUSTOM") {
      filterStart = customStartDate;
      filterEnd = customEndDate;
    }

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
      if (categoryFilter !== "ALL" && claim.category !== categoryFilter) {
        return false;
      }
      // Employee filter
      if (employeeFilter !== "ALL") {
        const uid = String(claim.userId || claim.user?.id);
        if (uid !== String(employeeFilter)) return false;
      }
      // Date range filter
      if (filterStart && claim.expenseDate < filterStart) {
        return false;
      }
      if (filterEnd && claim.expenseDate > filterEnd) {
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
    categoryFilter,
    employeeFilter,
    dateRangePreset,
    customStartDate,
    customEndDate,
    search,
  ]);

  // Dynamic Totals computed on the filtered subset (without tax stats)
  const filteredSummary = useMemo(() => {
    let totalAmount = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let rejectedAmount = 0;

    filteredClaims.forEach((c) => {
      const amt = Number(c.amount) || 0;
      totalAmount += amt;

      if (c.status === "APPROVED") approvedAmount += amt;
      else if (c.status === "PENDING") pendingAmount += amt;
      else if (c.status === "REJECTED") rejectedAmount += amt;
    });

    const pendingClaimsList = filteredClaims.filter((c) => c.status === "PENDING");
    const avgAmount = filteredClaims.length > 0 ? totalAmount / filteredClaims.length : 0;

    return {
      count: filteredClaims.length,
      pendingCount: pendingClaimsList.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      approvedAmount: Math.round(approvedAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      rejectedAmount: Math.round(rejectedAmount * 100) / 100,
      avgAmount: Math.round(avgAmount * 100) / 100,
    };
  }, [filteredClaims]);

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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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

  // Bulk Action handlers
  const handleConfirmBulkAction = async (e) => {
    e.preventDefault();
    const { type, remarks } = bulkModal;
    if (!selectedIds.length) return;

    if (type === "reject" && !remarks.trim()) {
      toast.error("Please provide remarks for bulk rejection.");
      return;
    }

    setBulkModal((prev) => ({ ...prev, submitting: true }));
    try {
      if (type === "approve") {
        await claimsApi.bulkApproveClaims({
          claimIds: selectedIds,
          adminRemarks: remarks.trim() || "Bulk Approved by Admin",
        });
        toast.success(`Approved ${selectedIds.length} expense claims!`);
      } else {
        await claimsApi.bulkRejectClaims({
          claimIds: selectedIds,
          adminRemarks: remarks.trim(),
        });
        toast.success(`Rejected ${selectedIds.length} expense claims.`);
      }

      setBulkModal({
        isOpen: false,
        type: "approve",
        remarks: "",
        submitting: false,
      });
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        `Bulk ${type} failed.`;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
      setBulkModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredClaims.length) {
      toast.info("No claims to export.");
      return;
    }

    const headers = [
      "Claim Number",
      "Employee Name",
      "Employee Email",
      "Expense Date",
      "Category",
      "Title / Purpose",
      "Merchant Name",
      "Invoice Number",
      "GST Number",
      "Amount (INR)",
      "Status",
      "Payment Status",
      "Admin Remarks",
    ];

    const rows = filteredClaims.map((c) => [
      `"${c.claimNumber || ""}"`,
      `"${c.user?.name || ""}"`,
      `"${c.user?.email || ""}"`,
      `"${c.expenseDate || ""}"`,
      `"${c.category || ""}"`,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${(c.merchantName || "").replace(/"/g, '""')}"`,
      `"${c.invoiceNumber || ""}"`,
      `"${c.gstNumber || ""}"`,
      c.amount || 0,
      `"${c.status || ""}"`,
      `"${c.paymentStatus || ""}"`,
      `"${(c.adminRemarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `claims_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Claims report CSV exported successfully.");
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
      {/* 1. Search, Status, Category, Employee, Date Range & Action Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, claim#, merchant, invoice, title..."
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

          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shrink-0">
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
                  ? "Pending Review"
                  : st === "APPROVED"
                  ? "Approved"
                  : st === "REJECTED"
                  ? "Rejected"
                  : "All Status"}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer shrink-0"
            title="Export filtered claims to CSV"
          >
            <FiDownload className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Secondary Filters: Category, Employee, Date Range, Payment */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Category Dropdown Filter */}
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

          {/* Employee Filter */}
          <div className="flex items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Employees ({employeeList.length})</option>
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email || `#${emp.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div className="flex items-center gap-1.5">
            <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="CUSTOM">Custom Date Range...</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateRangePreset === "CUSTOM" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="From"
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="To"
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
              />
            </div>
          )}

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5">
            <FiCreditCard className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="UNPAID">Unpaid Payouts</option>
              <option value="PROCESSING">Processing Payouts</option>
              <option value="PAID">Paid / Disbursed</option>
            </select>
          </div>

          {/* Reset Filters button if any filter active */}
          {(search ||
            statusFilter !== "ALL" ||
            categoryFilter !== "ALL" ||
            employeeFilter !== "ALL" ||
            paymentFilter !== "ALL" ||
            dateRangePreset !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
                setEmployeeFilter("ALL");
                setPaymentFilter("ALL");
                setDateRangePreset("ALL");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. Dynamic Financial Totals & Summary Bar (Without Tax Stats) */}
      <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-blue-50/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              <FiDollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Total Filtered Expenses
                </span>
                <span className="rounded-full bg-blue-200/80 px-2 py-0.2 text-[10px] font-bold text-blue-900">
                  {filteredSummary.count} claims
                </span>
              </div>
              <div className="text-2xl font-black text-blue-950 font-mono tracking-tight mt-0.5">
                ₹{Number(filteredSummary.totalAmount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="bg-white/80 border border-emerald-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Approved Reimbursable
              </span>
              <span className="font-mono font-bold text-emerald-900 text-sm">
                ₹{Number(filteredSummary.approvedAmount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white/80 border border-amber-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Pending Approval
              </span>
              <span className="font-mono font-bold text-amber-900 text-sm">
                ₹{Number(filteredSummary.pendingAmount).toLocaleString("en-IN")} ({filteredSummary.pendingCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bulk Action Floating Bar (When items selected) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between rounded-2xl bg-slate-900 text-white p-3.5 shadow-xl border border-slate-800 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 font-black text-xs">
              {selectedIds.length}
            </span>
            <div>
              <span className="text-xs font-bold">
                {selectedIds.length} pending claims selected
              </span>
              <span className="text-xs text-slate-400 block font-mono">
                Total: ₹{Number(selectedClaimsTotalAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() =>
                setBulkModal({
                  isOpen: true,
                  type: "approve",
                  remarks: "Bulk approved by Admin",
                  submitting: false,
                })
              }
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
            >
              <FiCheck className="h-3.5 w-3.5" />
              <span>Approve All Selected</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setBulkModal({
                  isOpen: true,
                  type: "reject",
                  remarks: "",
                  submitting: false,
                })
              }
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition cursor-pointer"
            >
              <FiX className="h-3.5 w-3.5" />
              <span>Reject All Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Table / Cards View */}
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
              {search || statusFilter !== "ALL" || categoryFilter !== "ALL" || employeeFilter !== "ALL" || dateRangePreset !== "ALL"
                ? "Try clearing your search query or adjusting your filters."
                : "There are currently no employee expense claims in this queue."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleSelectAllPending}
                        disabled={pendingFilteredClaims.length === 0}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Select all pending claims"
                      />
                    </th>
                    <th className="py-3.5 px-4 w-40 whitespace-nowrap">Claim ID & Date</th>
                    <th className="py-3.5 px-4 w-48 whitespace-nowrap">Employee</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Expense & Purpose</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Merchant / Bill Details</th>
                    <th className="py-3.5 px-4 w-36 whitespace-nowrap text-right">Total Amount (₹)</th>
                    <th className="py-3.5 px-4 w-28 whitespace-nowrap text-center">Bill / Receipt</th>
                    <th className="py-3.5 px-4 w-36 whitespace-nowrap text-center">Status</th>
                    <th className="py-3.5 px-4 w-48 whitespace-nowrap text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredClaims.map((claim) => {
                    const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
                    const isSelected = selectedIds.includes(claim.id);

                    return (
                      <tr
                        key={claim.id}
                        className={`transition duration-150 ${
                          isSelected
                            ? "bg-blue-50/50 hover:bg-blue-50/80"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-3 text-center">
                          {claim.status === "PENDING" ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectClaim(claim.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">•</span>
                          )}
                        </td>

                        {/* Claim # & Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectingClaim(claim)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-[13px] tracking-tight text-left cursor-pointer"
                          >
                            {claim.claimNumber}
                          </button>
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
                                {claim.user?.email || `#${claim.userId}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Expense Title & Category */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${catMeta.color}`}
                            >
                              <span>{catMeta.icon}</span>
                              <span>{catMeta.label}</span>
                            </span>
                            <div
                              onClick={() => setInspectingClaim(claim)}
                              className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-2 leading-snug cursor-pointer"
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
                          {claim.paymentStatus && claim.status === "APPROVED" && (
                            <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                              Pay: {claim.paymentStatus}
                            </div>
                          )}
                          {claim.adminRemarks && (
                            <div
                              className="text-[10px] text-slate-500 mt-0.5 max-w-[140px] mx-auto truncate italic"
                              title={claim.adminRemarks}
                            >
                              &quot;{claim.adminRemarks}&quot;
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectingClaim(claim)}
                              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-2xs transition cursor-pointer"
                              title="Inspect Full Details"
                            >
                              <FiEye className="h-3.5 w-3.5" />
                            </button>

                            {claim.status === "PENDING" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAction(claim, "approve")}
                                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                                  title="Approve Claim"
                                >
                                  <FiCheck className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAction(claim, "reject")}
                                  className="flex items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition cursor-pointer"
                                  title="Reject Claim"
                                >
                                  <FiX className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setInspectingClaim(claim)}
                                className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1"
                              >
                                View Details
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

            {/* Mobile & Tablet Card View */}
            <div className="block xl:hidden divide-y divide-slate-100">
              {filteredClaims.map((claim) => {
                const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.OTHER;
                const isSelected = selectedIds.includes(claim.id);

                return (
                  <div
                    key={claim.id}
                    className={`p-4 sm:p-5 space-y-3.5 transition ${
                      isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {claim.status === "PENDING" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectClaim(claim.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setInspectingClaim(claim)}
                          className="text-xs font-bold font-mono text-blue-600 hover:underline"
                        >
                          {claim.claimNumber}
                        </button>
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
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-[10px]">
                            {claim.user?.name ? claim.user.name[0].toUpperCase() : "U"}
                          </div>
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {claim.user?.name || "Employee"}
                          </span>
                        </div>
                        <h4
                          onClick={() => setInspectingClaim(claim)}
                          className="text-xs font-semibold text-slate-800 pt-1 line-clamp-2 cursor-pointer hover:text-blue-600"
                        >
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

                    {/* Merchant & Bill Info */}
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

                    {/* Mobile Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
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
                        <button
                          type="button"
                          onClick={() => setInspectingClaim(claim)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Details
                        </button>
                      </div>

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

      {/* Bill Receipt Viewer Modal */}
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

      {/* Single Approve / Reject Dialog Modal */}
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
                  <span className="text-slate-500">Expense:</span>
                  <span className="font-bold text-slate-900">
                    {actionModal.claim?.category} • {actionModal.claim?.title}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200/80">
                  <span className="font-bold text-slate-700">Total Claim Amount:</span>
                  <span className="font-black text-sm text-blue-900 font-mono">
                    ₹{Number(actionModal.claim?.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {actionModal.type === "approve"
                    ? "Approval Remarks (Optional)"
                    : "Reason for Rejection (Mandatory)"}
                </label>
                <textarea
                  rows={3}
                  required={actionModal.type === "reject"}
                  value={actionModal.remarks}
                  onChange={(e) =>
                    setActionModal((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder={
                    actionModal.type === "approve"
                      ? "e.g. Approved as per travel policy"
                      : "Please specify why this claim is being declined..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
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
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionModal.submitting}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer ${
                    actionModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  }`}
                >
                  {actionModal.submitting && (
                    <FiLoader className="h-4 w-4 animate-spin" />
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

      {/* Bulk Approval / Rejection Modal */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                {bulkModal.type === "approve" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FiCheck className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <FiX className="h-4 w-4" />
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-900">
                  {bulkModal.type === "approve"
                    ? `Bulk Approve (${selectedIds.length} Claims)`
                    : `Bulk Reject (${selectedIds.length} Claims)`}
                </h3>
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
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBulkAction} className="p-5 space-y-4">
              <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                <div className="flex justify-between">
                  <span>Selected Claims Count:</span>
                  <strong>{selectedIds.length} claims</strong>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-blue-200">
                  <span>Combined Total:</span>
                  <span className="font-mono">
                    ₹{Number(selectedClaimsTotalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {bulkModal.type === "approve"
                    ? "Common Approval Remarks (Optional)"
                    : "Reason for Bulk Rejection (Mandatory)"}
                </label>
                <textarea
                  rows={3}
                  required={bulkModal.type === "reject"}
                  value={bulkModal.remarks}
                  onChange={(e) =>
                    setBulkModal((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder={
                    bulkModal.type === "approve"
                      ? "e.g. Bulk approved verified travel expenses"
                      : "State the reason for rejecting these claims..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
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
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkModal.submitting}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer ${
                    bulkModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  }`}
                >
                  {bulkModal.submitting && (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  )}
                  <span>
                    {bulkModal.type === "approve"
                      ? `Approve ${selectedIds.length} Claims`
                      : `Reject ${selectedIds.length} Claims`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
