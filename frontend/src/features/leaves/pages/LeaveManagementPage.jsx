import React, { useState, useEffect, useMemo } from "react";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiRefreshCw,
  FiUsers,
  FiUserCheck,
  FiActivity,
  FiFileText,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { leavesApi } from "../leavesApi.js";
import ApplyLeaveModal from "../components/ApplyLeaveModal.jsx";
import LeaveApprovalsTable from "../components/LeaveApprovalsTable.jsx";
import MyLeavesList from "../components/MyLeavesList.jsx";

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
        promises.push(leavesApi.getAllLeaves({ limit: 200 }));
      }

      const results = await Promise.allSettled(promises);

      if (results[0].status === "fulfilled") {
        const raw = results[0].value?.data?.data ?? results[0].value?.data ?? [];
        setMyLeaves(Array.isArray(raw) ? raw : []);
      }

      if (results[1].status === "fulfilled") {
        const raw = results[1].value?.data?.data ?? results[1].value?.data ?? {};
        setStats(raw);
      }

      if (isAdmin && results[2] && results[2].status === "fulfilled") {
        const raw = results[2].value?.data?.data ?? results[2].value?.data ?? [];
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

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <FiCalendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Leave Management System
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Apply for leaves, track approval status, and manage employee leave requests
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
            <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pending Approvals */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending Approvals
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">
            {isAdmin ? pendingApprovalsCount : stats.pending || 0}
          </div>
          <p className="text-[10px] font-medium text-amber-700 mt-0.5">
            {isAdmin ? "Awaiting your review" : "Awaiting Admin action"}
          </p>
        </div>

        {/* Approved Leaves */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Approved Leaves
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">
            {stats.approved || 0}
          </div>
          <p className="text-[10px] font-medium text-emerald-700 mt-0.5">
            Active on Attendance Calendar
          </p>
        </div>

        {/* Total Days Taken */}
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Approved Days
            </span>
            <FiClock className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-950 font-mono">
            {stats.totalApprovedDays || 0} <span className="text-xs font-bold text-blue-700">days</span>
          </div>
          <p className="text-[10px] font-medium text-blue-700 mt-0.5">
            Total days approved
          </p>
        </div>

        {/* Rejected / Other */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Rejected Requests
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-900">
            {stats.rejected || 0}
          </div>
          <p className="text-[10px] font-medium text-rose-700 mt-0.5">
            Declined requests
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
          </button>
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
