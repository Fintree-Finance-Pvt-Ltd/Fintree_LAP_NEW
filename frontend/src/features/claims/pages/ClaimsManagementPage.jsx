import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiTrendingUp,
  FiUserCheck,
  FiX
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { claimsApi } from "../claimsApi.js";
import ApplyClaimModal from "../components/ApplyClaimModal.jsx";
import ClaimApprovalsTable from "../components/ClaimApprovalsTable.jsx";
import MyClaimsList from "../components/MyClaimsList.jsx";

// Helper to get current YYYY-MM
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Helper to format YYYY-MM into "MMMM YYYY"
const formatMonthName = (monthKey) => {
  if (!monthKey || monthKey === "ALL") return "All Time";
  const [year, month] = monthKey.split("-");
  if (!year || !month) return monthKey;
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export default function ClaimsManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my"); // "approvals" | "my"
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("ALL"); // "ALL" or "YYYY-MM"
  const [myClaims, setMyClaims] = useState([]);
  const [allClaims, setAllClaims] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalClaimedAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
  });

  // Check if Admin
  const userRoles = useMemo(() => {
    const roles = user?.roles ?? user?.role;
    if (!roles) return [];
    return (Array.isArray(roles) ? roles : [roles])
      .map((r) => {
        if (typeof r === "string") return r.toUpperCase();
        return String(r?.code || r?.name || r?.role || "").toUpperCase();
      })
      .filter(Boolean);
  }, [user]);

  const isAdmin = useMemo(() => {
    if (user?.email && user.email.toLowerCase().includes("admin")) return true;
    return userRoles.includes("ADMIN");
  }, [userRoles, user?.email]);

  useEffect(() => {
    if (isAdmin) {
      setActiveTab("approvals");
    } else {
      setActiveTab("my");
    }
  }, [isAdmin]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [
        claimsApi.getMyClaims({ limit: 200 }),
        claimsApi.getStats(
          selectedMonth !== "ALL" ? { month: selectedMonth } : {},
        ),
      ];

      if (isAdmin) {
        promises.push(claimsApi.getAllClaims({ limit: 300 }));
      }

      const results = await Promise.allSettled(promises);

      if (results[0].status === "fulfilled") {
        const raw =
          results[0].value?.data?.data ?? results[0].value?.data ?? [];
        setMyClaims(Array.isArray(raw) ? raw : []);
      }

      if (results[1].status === "fulfilled") {
        const raw =
          results[1].value?.data?.data ?? results[1].value?.data ?? {};
        setStats(raw);
      }

      if (isAdmin && results[2] && results[2].status === "fulfilled") {
        const raw =
          results[2].value?.data?.data ?? results[2].value?.data ?? [];
        setAllClaims(Array.isArray(raw) ? raw : []);
      }
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Month-filtered claim sets
  const monthFilteredAllClaims = useMemo(() => {
    if (selectedMonth === "ALL") return allClaims;
    return allClaims.filter(
      (c) => c.expenseDate && c.expenseDate.startsWith(selectedMonth),
    );
  }, [allClaims, selectedMonth]);

  const monthFilteredMyClaims = useMemo(() => {
    if (selectedMonth === "ALL") return myClaims;
    return myClaims.filter(
      (c) => c.expenseDate && c.expenseDate.startsWith(selectedMonth),
    );
  }, [myClaims, selectedMonth]);

  const pendingApprovalsCount = useMemo(() => {
    return monthFilteredAllClaims.filter((c) => c.status === "PENDING").length;
  }, [monthFilteredAllClaims]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const current =
      selectedMonth === "ALL" ? getCurrentMonthKey() : selectedMonth;
    const [y, m] = current.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const handleNextMonth = () => {
    const current =
      selectedMonth === "ALL" ? getCurrentMonthKey() : selectedMonth;
    const [y, m] = current.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const handleSetThisMonth = () => {
    setSelectedMonth(getCurrentMonthKey());
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  // Dynamically compute stats based on tab & role & selected month
  const currentStats = useMemo(() => {
    const targetClaims =
      isAdmin && activeTab === "approvals"
        ? monthFilteredAllClaims
        : monthFilteredMyClaims;
    const pending = targetClaims.filter((c) => c.status === "PENDING").length;
    const approved = targetClaims.filter((c) => c.status === "APPROVED").length;
    const rejected = targetClaims.filter((c) => c.status === "REJECTED").length;

    const approvedAmount = targetClaims
      .filter((c) => c.status === "APPROVED")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const pendingAmount = targetClaims
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const rejectedAmount = targetClaims
      .filter((c) => c.status === "REJECTED")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalClaimedAmount = approvedAmount + pendingAmount + rejectedAmount;
    const total = pending + approved + rejected;

    const approvedPct =
      totalClaimedAmount > 0
        ? Math.round((approvedAmount / totalClaimedAmount) * 100)
        : 0;
    const pendingPct =
      totalClaimedAmount > 0
        ? Math.round((pendingAmount / totalClaimedAmount) * 100)
        : 0;
    const rejectedPct =
      totalClaimedAmount > 0
        ? Math.round((rejectedAmount / totalClaimedAmount) * 100)
        : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      totalClaimedAmount: Math.round(totalClaimedAmount * 100) / 100,
      approvedAmount: Math.round(approvedAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      rejectedAmount: Math.round(rejectedAmount * 100) / 100,
      approvedPct,
      pendingPct,
      rejectedPct,
      isOrgLevel: isAdmin && activeTab === "approvals",
    };
  }, [isAdmin, activeTab, monthFilteredAllClaims, monthFilteredMyClaims]);

  // Export current claims view to CSV
  const handleExportCSV = () => {
    const targetClaims =
      isAdmin && activeTab === "approvals"
        ? monthFilteredAllClaims
        : monthFilteredMyClaims;
    if (targetClaims.length === 0) {
      alert("No claims to export.");
      return;
    }

    const headers = [
      "Claim Number",
      "Title",
      "Category",
      "Employee Name",
      "Employee Email",
      "Amount (INR)",
      "Tax Amount",
      "Expense Date",
      "Merchant",
      "Invoice Number",
      "Status",
      "Payment Status",
      "Admin Remarks",
    ];

    const rows = targetClaims.map((c) => [
      `"${c.claimNumber || ""}"`,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.category || ""}"`,
      `"${c.user?.name || ""}"`,
      `"${c.user?.email || ""}"`,
      c.amount || 0,
      c.taxAmount || 0,
      `"${c.expenseDate || ""}"`,
      `"${(c.merchantName || "").replace(/"/g, '""')}"`,
      `"${(c.invoiceNumber || "").replace(/"/g, '""')}"`,
      `"${c.status || ""}"`,
      `"${c.paymentStatus || "UNPAID"}"`,
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
      `Claims_Report_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Corporate Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hover:text-slate-700 transition">Finance & Accounts</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                Expense Claims
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white shadow-xs">
                <FiFileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Expense Claims & Reimbursements
                </h1>
                <p className="text-xs text-slate-500 font-normal">
                  Submit receipts, track approval statuses, and manage expense disbursements.
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition cursor-pointer"
              title="Export filtered records to CSV"
            >
              <FiDownload className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition cursor-pointer"
              title="Reload claim records"
            >
              <FiRefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition cursor-pointer"
            >
              <FiPlus className="h-4 w-4" />
              <span>Submit Claim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Period Filter & Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Current Active Filter Badge & Stepper */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
              <FiCalendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Period:</span>
              <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {formatMonthName(selectedMonth)}
              </span>
            </div>

            {/* Stepper buttons if specific month is active */}
            {selectedMonth !== "ALL" && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  className="p-1 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                >
                  <FiChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Next Month"
                  className="p-1 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                >
                  <FiChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Quick Month Pills & Month Picker Input */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setSelectedMonth("ALL")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedMonth === "ALL"
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={handleSetThisMonth}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedMonth === getCurrentMonthKey()
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSetLastMonth}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedMonth !== "ALL" &&
                  selectedMonth !== getCurrentMonthKey() &&
                  selectedMonth.startsWith(String(new Date().getFullYear()))
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Last Month
              </button>
            </div>

            {/* Native Month Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500">
                Month:
              </span>
              <input
                type="month"
                value={selectedMonth !== "ALL" ? selectedMonth : ""}
                onChange={(e) => setSelectedMonth(e.target.value || "ALL")}
                className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
              />
              {selectedMonth !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth("ALL")}
                  title="Clear month filter"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                >
                  <FiX className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Unified, Clean Corporate White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {currentStats.isOrgLevel ? "Total Claimed (Org)" : "My Total Claimed"}
            </span>
            <span className="rounded-md bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {currentStats.total} claims
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ₹{Number(currentStats.totalClaimedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Total expenses requested
          </p>
        </div>

        {/* Card 2: Approved */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {currentStats.isOrgLevel ? "Approved & Disbursed" : "Approved"}
            </span>
            <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {currentStats.approved} items
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ₹{Number(currentStats.approvedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <FiTrendingUp className="h-3 w-3" />
            <span>{currentStats.approvedPct}% approval rate</span>
          </p>
        </div>

        {/* Card 3: Pending */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {currentStats.isOrgLevel ? "Pending Approvals" : "Pending Review"}
            </span>
            <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {currentStats.pending} in queue
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ₹{Number(currentStats.pendingAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Awaiting verification & sign-off
          </p>
        </div>

        {/* Card 4: Rejected */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Rejected Claims
            </span>
            <span className="rounded-md bg-rose-50 border border-rose-200/60 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              {currentStats.rejected} items
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ₹{Number(currentStats.rejectedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Disallowed or returned claims
          </p>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer ${
              activeTab === "approvals"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiUserCheck className="h-4 w-4" />
            <span>Admin Approvals Queue</span>
            {pendingApprovalsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer ${
              activeTab === "my"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiFileText className="h-4 w-4" />
            <span>My Personal Claims</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {monthFilteredMyClaims.length}
            </span>
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === "approvals" && isAdmin ? (
        <ClaimApprovalsTable
          claims={monthFilteredAllClaims}
          allClaimsRaw={allClaims}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          isLoading={loading}
          onRefresh={loadData}
        />
      ) : (
        <MyClaimsList
          claims={monthFilteredMyClaims}
          allClaimsRaw={myClaims}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          isLoading={loading}
          onRefresh={loadData}
          onOpenApplyModal={() => setIsApplyModalOpen(true)}
        />
      )}

      {/* Apply Claim Modal */}
      <ApplyClaimModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
