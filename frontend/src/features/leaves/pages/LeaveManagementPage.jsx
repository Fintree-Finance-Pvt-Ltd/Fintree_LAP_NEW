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
  FiInfo,
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
    color: "blue",
    bg: "bg-blue-600",
    light: "bg-blue-50 text-blue-800 border-blue-100",
  },
  SICK: {
    label: "Sick Leave (SL)",
    total: 10,
    color: "rose",
    bg: "bg-rose-600",
    light: "bg-rose-50 text-rose-800 border-rose-100",
  },
  EARNED: {
    label: "Privilege Leave (EL)",
    total: 15,
    color: "purple",
    bg: "bg-purple-600",
    light: "bg-purple-50 text-purple-800 border-purple-100",
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
    <div className="space-y-5 antialiased text-slate-800 animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <FiCalendar className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Leave Management
              </h1>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                {isAdmin ? "Admin Portal" : "Employee Portal"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit leave applications, track approval status, and manage team
              coverage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            <FiRefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
          >
            <FiPlus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pending Requests */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              {currentStats.isOrgLevel
                ? "Pending Approvals"
                : "My Pending Requests"}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-950 font-mono">
            {currentStats.pending}
          </div>
          <p className="text-[11px] font-medium text-amber-700 mt-1">
            {currentStats.isOrgLevel
              ? "Awaiting your review"
              : "Under review by management"}
          </p>
        </div>

        {/* Approved Leaves */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-4 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              {currentStats.isOrgLevel
                ? "Approved Leaves (Org)"
                : "My Approved Leaves"}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
            {currentStats.approved}
          </div>
          <p className="text-[11px] font-medium text-emerald-700 mt-1">
            {currentStats.isOrgLevel
              ? "Active across organization"
              : "Reflected on Attendance Calendar"}
          </p>
        </div>

        {/* Total Days Taken */}
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/60 p-4 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              {currentStats.isOrgLevel
                ? "Total Days (Org)"
                : "My Approved Days"}
            </span>
            <FiClock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-950 font-mono">
            {currentStats.totalApprovedDays}{" "}
            <span className="text-xs font-bold text-blue-700 font-sans">
              days
            </span>
          </div>
          <p className="text-[11px] font-medium text-blue-700 mt-1">
            {currentStats.isOrgLevel
              ? "Total employee days approved"
              : "Approved duration this year"}
          </p>
        </div>

        {/* Rejected / Other */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-4 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              {currentStats.isOrgLevel
                ? "Rejected Requests"
                : "My Declined Requests"}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-950 font-mono">
            {currentStats.rejected}
          </div>
          <p className="text-[11px] font-medium text-rose-700 mt-1">
            {currentStats.isOrgLevel
              ? "Declined across organization"
              : "Unapproved leave requests"}
          </p>
        </div>
      </div>

      {/* Tabs (if Admin) */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "approvals"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiUserCheck className="h-4 w-4" />
            <span>Admin Approvals Queue</span>
            {pendingApprovalsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] font-black text-white">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "my"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiFileText className="h-4 w-4" />
            <span>My Personal Leaves</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-600">
              {myLeaves.length}
            </span>
          </button>
        </div>
      )}

      {/* Annual Leave Quotas & Balances (Shown only for Personal Leaves) */}
      {(!isAdmin || activeTab === "my") && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FiPieChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  Annual Leave Quotas & Balances ({currentYear})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Your annual paid leave entitlement and remaining available balance
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 self-start sm:self-auto">
              Year: {currentYear} (Jan – Dec)
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
                <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 transition hover:bg-blue-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950">
                      Casual Leave (CL)
                    </span>
                    <span className="text-xs font-black text-blue-700 font-mono">
                      {remaining} / {total} left
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-blue-200/60">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>
                      Used:{" "}
                      <strong className="text-slate-700">{used} days</strong>
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
                <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-3.5 transition hover:bg-rose-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-950">
                      Sick Leave (SL)
                    </span>
                    <span className="text-xs font-black text-rose-700 font-mono">
                      {remaining} / {total} left
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-rose-200/60">
                    <div
                      className="h-full rounded-full bg-rose-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>
                      Used:{" "}
                      <strong className="text-slate-700">{used} days</strong>
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
                <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-3.5 transition hover:bg-purple-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950">
                      Privilege Leave (EL)
                    </span>
                    <span className="text-xs font-black text-purple-700 font-mono">
                      {remaining} / {total} left
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-purple-200/60">
                    <div
                      className="h-full rounded-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>
                      Used:{" "}
                      <strong className="text-slate-700">{used} days</strong>
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
