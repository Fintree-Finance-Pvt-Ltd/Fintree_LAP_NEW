import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiUserCheck,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import ApplyLeaveModal from "../components/ApplyLeaveModal.jsx";
import LeaveApprovalsTable from "../components/LeaveApprovalsTable.jsx";
import MyLeavesList from "../components/MyLeavesList.jsx";
import { leavesApi } from "../leavesApi.js";

// Standard Corporate Quotas (Annual)
const ANNUAL_QUOTAS = {
  CASUAL: {
    label: "Casual Leave (CL)",
    total: 12,
  },
  SICK: {
    label: "Sick Leave (SL)",
    total: 10,
  },
  EARNED: {
    label: "Privilege Leave (EL)",
    total: 15,
  },
};

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my"); // "approvals" | "my"
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalApprovedDays: 0,
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

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        leavesApi.getMyLeaves({ limit: 100 }),
        leavesApi.getStats(),
      ];

      if (isAdmin) {
        promises.push(leavesApi.getAllLeaves({ limit: 300 }));
      }

      const results = await Promise.allSettled(promises);

      if (results[0].status === "fulfilled") {
        const raw =
          results[0].value?.data?.data ?? results[0].value?.data ?? [];
        setMyLeaves(Array.isArray(raw) ? raw : []);
      }

      if (results[1].status === "fulfilled") {
        const raw =
          results[1].value?.data?.data ?? results[1].value?.data ?? {};
        setStats(raw);
      }

      if (isAdmin && results[2] && results[2].status === "fulfilled") {
        const raw =
          results[2].value?.data?.data ?? results[2].value?.data ?? [];
        setAllLeaves(Array.isArray(raw) ? raw : []);
      }
    } catch (err) {
      console.error("Failed to load leave records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const pendingApprovalsCount = useMemo(() => {
    return allLeaves.filter((l) => l.status === "PENDING").length;
  }, [allLeaves]);

  // Compute dynamic stats based on tab
  const currentStats = useMemo(() => {
    if (isAdmin && activeTab === "approvals") {
      const pending = allLeaves.filter((l) => l.status === "PENDING").length;
      const approved = allLeaves.filter((l) => l.status === "APPROVED").length;
      const rejected = allLeaves.filter((l) => l.status === "REJECTED").length;
      const totalApprovedDays = allLeaves
        .filter((l) => l.status === "APPROVED")
        .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

      return {
        pending,
        approved,
        rejected,
        totalApprovedDays: Math.round(totalApprovedDays * 10) / 10,
        isOrgLevel: true,
      };
    }

    const pending = myLeaves.filter((l) => l.status === "PENDING").length;
    const approved = myLeaves.filter((l) => l.status === "APPROVED").length;
    const rejected = myLeaves.filter((l) => l.status === "REJECTED").length;
    const totalApprovedDays = myLeaves
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

    return {
      pending: stats.pending ?? pending,
      approved: stats.approved ?? approved,
      rejected: stats.rejected ?? rejected,
      totalApprovedDays:
        stats.totalApprovedDays ?? Math.round(totalApprovedDays * 10) / 10,
      isOrgLevel: false,
    };
  }, [isAdmin, activeTab, allLeaves, myLeaves, stats]);

  // Current calendar year (dynamically fetched)
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Compute leave quotas used by the current user for the current calendar year
  const quotaUsage = useMemo(() => {
    const currentYearStr = String(new Date().getFullYear());
    const usage = {
      CASUAL: 0,
      SICK: 0,
      EARNED: 0,
      UNPAID: 0,
      OTHER: 0,
    };

    myLeaves.forEach((l) => {
      if (l.status === "APPROVED") {
        const matchesYear =
          (l.startDate && l.startDate.startsWith(currentYearStr)) ||
          (l.endDate && l.endDate.startsWith(currentYearStr));

        if (matchesYear) {
          const type = l.leaveType || "CASUAL";
          const days = Number(l.totalDays) || 1;
          if (usage[type] !== undefined) {
            usage[type] += days;
          } else {
            usage.OTHER += days;
          }
        }
      }
    });

    return usage;
  }, [myLeaves]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Corporate Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hover:text-slate-700 transition">Human Resources</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                Leave Management
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white shadow-xs">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Leave Management & Time Off
                </h1>
                <p className="text-xs text-slate-500 font-normal">
                  Submit leave applications, track approval statuses, and monitor annual balances.
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition cursor-pointer"
              title="Reload leave records"
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
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Unified Clean White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {currentStats.isOrgLevel
                ? "Pending Approvals"
                : "Pending Requests"}
            </span>
            <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {currentStats.pending} in queue
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {currentStats.pending}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            {currentStats.isOrgLevel
              ? "Awaiting administrative review"
              : "Under review by manager"}
          </p>
        </div>

        {/* Approved Leaves */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {currentStats.isOrgLevel
                ? "Approved Leaves (Org)"
                : "Approved Leaves"}
            </span>
            <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {currentStats.approved} items
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {currentStats.approved}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <FiTrendingUp className="h-3 w-3" />
            <span>Active & attendance synced</span>
          </p>
        </div>

        {/* Total Days Taken */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <FiClock className="h-3.5 w-3.5 text-slate-400" />
              {currentStats.isOrgLevel
                ? "Total Days Approved"
                : "Total Days Taken"}
            </span>
            <span className="rounded-md bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              Days
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {currentStats.totalApprovedDays}{" "}
            <span className="text-sm font-semibold text-slate-500 font-sans">
              days
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            {currentStats.isOrgLevel
              ? "Cumulative employee time off"
              : "Approved duration this year"}
          </p>
        </div>

        {/* Rejected / Returned */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Declined Requests
            </span>
            <span className="rounded-md bg-rose-50 border border-rose-200/60 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              {currentStats.rejected} items
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {currentStats.rejected}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Unapproved or cancelled requests
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
              <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] font-bold text-white shadow-2xs">
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
            <span>My Personal Leaves</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-600">
              {myLeaves.length}
            </span>
          </button>
        </div>
      )}

      {/* Annual Leave Quotas & Balances (Shown for Personal Leaves) */}
      {(!isAdmin || activeTab === "my") && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <FiPieChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Annual Leave Quotas & Balances ({currentYear})
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Your paid leave entitlement and remaining available balance
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 self-start sm:self-auto">
              Period: Jan – Dec {currentYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            {/* Casual Leave (CL) */}
            {(() => {
              const used = quotaUsage.CASUAL || 0;
              const total = ANNUAL_QUOTAS.CASUAL.total;
              const remaining = Math.max(0, total - used);
              const percent = Math.min(100, Math.round((used / total) * 100));

              return (
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition hover:bg-slate-50 hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Casual Leave (CL)
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {remaining} / {total} left
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>
                      Used: <strong className="text-slate-800">{used} days</strong>
                    </span>
                    <span>{percent}% utilized</span>
                  </div>
                </div>
              );
            })()}

            {/* Sick Leave (SL) */}
            {(() => {
              const used = quotaUsage.SICK || 0;
              const total = ANNUAL_QUOTAS.SICK.total;
              const remaining = Math.max(0, total - used);
              const percent = Math.min(100, Math.round((used / total) * 100));

              return (
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition hover:bg-slate-50 hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Sick Leave (SL)
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {remaining} / {total} left
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>
                      Used: <strong className="text-slate-800">{used} days</strong>
                    </span>
                    <span>{percent}% utilized</span>
                  </div>
                </div>
              );
            })()}

            {/* Privilege Leave (EL) */}
            {(() => {
              const used = quotaUsage.EARNED || 0;
              const total = ANNUAL_QUOTAS.EARNED.total;
              const remaining = Math.max(0, total - used);
              const percent = Math.min(100, Math.round((used / total) * 100));

              return (
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition hover:bg-slate-50 hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Privilege Leave (EL)
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {remaining} / {total} left
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>
                      Used: <strong className="text-slate-800">{used} days</strong>
                    </span>
                    <span>{percent}% utilized</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === "approvals" && isAdmin ? (
        <LeaveApprovalsTable
          leaves={allLeaves}
          isLoading={loading}
          onRefresh={loadData}
        />
      ) : (
        <MyLeavesList
          leaves={myLeaves}
          isLoading={loading}
          onRefresh={loadData}
          onOpenApplyModal={() => setIsApplyModalOpen(true)}
        />
      )}

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
