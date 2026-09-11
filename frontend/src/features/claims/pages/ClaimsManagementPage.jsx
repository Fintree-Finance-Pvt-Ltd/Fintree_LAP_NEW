import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiUserCheck,
  FiXCircle,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import ApplyClaimModal from "../components/ApplyClaimModal.jsx";
import ClaimApprovalsTable from "../components/ClaimApprovalsTable.jsx";
import MyClaimsList from "../components/MyClaimsList.jsx";
import { claimsApi } from "../claimsApi.js";

export default function ClaimsManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my"); // "approvals" | "my"
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        claimsApi.getMyClaims({ limit: 100 }),
        claimsApi.getStats(),
      ];

      if (isAdmin) {
        promises.push(claimsApi.getAllClaims({ limit: 200 }));
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
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const pendingApprovalsCount = useMemo(() => {
    return allClaims.filter((c) => c.status === "PENDING").length;
  }, [allClaims]);

  // Dynamically compute stats based on tab & role (excluding CANCELLED from total expenses)
  const currentStats = useMemo(() => {
    if (isAdmin && activeTab === "approvals") {
      const pending = allClaims.filter((c) => c.status === "PENDING").length;
      const approved = allClaims.filter((c) => c.status === "APPROVED").length;
      const rejected = allClaims.filter((c) => c.status === "REJECTED").length;

      const approvedAmount = allClaims
        .filter((c) => c.status === "APPROVED")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const pendingAmount = allClaims
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const rejectedAmount = allClaims
        .filter((c) => c.status === "REJECTED")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const totalClaimedAmount = approvedAmount + pendingAmount + rejectedAmount;
      const total = pending + approved + rejected;

      return {
        total,
        pending,
        approved,
        rejected,
        totalClaimedAmount: Math.round(totalClaimedAmount * 100) / 100,
        approvedAmount: Math.round(approvedAmount * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        rejectedAmount: Math.round(rejectedAmount * 100) / 100,
        isOrgLevel: true,
      };
    }

    const pending = myClaims.filter((c) => c.status === "PENDING").length;
    const approved = myClaims.filter((c) => c.status === "APPROVED").length;
    const rejected = myClaims.filter((c) => c.status === "REJECTED").length;

    const approvedAmount = myClaims
      .filter((c) => c.status === "APPROVED")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const pendingAmount = myClaims
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const rejectedAmount = myClaims
      .filter((c) => c.status === "REJECTED")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalClaimedAmount = approvedAmount + pendingAmount + rejectedAmount;
    const total = pending + approved + rejected;

    return {
      total: stats.total ?? total,
      pending: stats.pending ?? pending,
      approved: stats.approved ?? approved,
      rejected: stats.rejected ?? rejected,
      totalClaimedAmount: stats.totalClaimedAmount ?? Math.round(totalClaimedAmount * 100) / 100,
      approvedAmount: stats.approvedAmount ?? Math.round(approvedAmount * 100) / 100,
      pendingAmount: stats.pendingAmount ?? Math.round(pendingAmount * 100) / 100,
      rejectedAmount: stats.rejectedAmount ?? Math.round(rejectedAmount * 100) / 100,
      isOrgLevel: false,
    };
  }, [isAdmin, activeTab, allClaims, myClaims, stats]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <FiZap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Expense Claims & Reimbursements
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit expense bills with OCR auto-fill and track approval status
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
            <span>Apply for Claim</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pending Approvals */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              {currentStats.isOrgLevel ? "Pending Approvals" : "My Pending Claims"}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">
            {currentStats.pending}
          </div>
          <p className="text-[10px] font-semibold text-amber-700 mt-0.5">
            Pending: ₹{Number(currentStats.pendingAmount).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Approved Claims */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              {currentStats.isOrgLevel ? "Approved Claims" : "My Approved Claims"}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">
            {currentStats.approved}
          </div>
          <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
            Approved: ₹{Number(currentStats.approvedAmount).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Total Claimed */}
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              {currentStats.isOrgLevel ? "Total Claimed (Org)" : "My Total Claimed"}
            </span>
            <FiDollarSign className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-950 font-mono">
            ₹{Number(currentStats.totalClaimedAmount).toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] font-medium text-blue-700 mt-0.5">
            Across {currentStats.total} submitted claims
          </p>
        </div>

        {/* Rejected Claims */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              {currentStats.isOrgLevel ? "Rejected Claims" : "My Rejected Claims"}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-900">
            {currentStats.rejected}
          </div>
          <p className="text-[10px] font-semibold text-rose-700 mt-0.5">
            Rejected: ₹{Number(currentStats.rejectedAmount || 0).toLocaleString("en-IN")}
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
            <span>My Personal Claims</span>
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === "approvals" && isAdmin ? (
        <ClaimApprovalsTable
          claims={allClaims}
          isLoading={loading}
          onRefresh={loadData}
        />
      ) : (
        <MyClaimsList
          claims={myClaims}
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
