import { useState, useMemo } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiList,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { leavesApi } from "../leavesApi.js";

const LEAVE_TYPE_LABELS = {
  CASUAL: { label: "Casual Leave (CL)", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  SICK: { label: "Sick Leave (SL)", bg: "bg-rose-50 text-rose-700 border-rose-200" },
  EARNED: { label: "Privilege Leave (EL)", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  MATERNITY: { label: "Maternity Leave", bg: "bg-pink-50 text-pink-700 border-pink-200" },
  PATERNITY: { label: "Paternity Leave", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  UNPAID: { label: "Leave Without Pay", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  OTHER: { label: "Special Leave", bg: "bg-slate-50 text-slate-700 border-slate-200" },
};

export default function MyLeavesList({
  leaves = [],
  isLoading = false,
  onRefresh,
  onOpenApplyModal,
}) {
  const [cancellingId, setCancellingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (statusFilter !== "ALL" && leave.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      const reason = leave.reason?.toLowerCase() || "";
      const type = leave.leaveType?.toLowerCase() || "";
      const start = leave.startDate?.toLowerCase() || "";
      const end = leave.endDate?.toLowerCase() || "";
      const remarks = leave.adminRemarks?.toLowerCase() || "";
      return (
        reason.includes(query) ||
        type.includes(query) ||
        start.includes(query) ||
        end.includes(query) ||
        remarks.includes(query)
      );
    });
  }, [leaves, statusFilter, search]);

  const counts = useMemo(() => {
    const res = { PENDING: 0, APPROVED: 0, REJECTED: 0, ALL: leaves.length };
    leaves.forEach((l) => {
      if (res[l.status] !== undefined) res[l.status]++;
    });
    return res;
  }, [leaves]);

  const handleCancelLeave = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave application?")) {
      return;
    }

    setCancellingId(id);
    try {
      await leavesApi.cancel(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to cancel leave request");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Search + Status Filters + View Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reason, category, dates..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: "ALL", label: "All Leaves", count: counts.ALL },
            { id: "PENDING", label: "Pending", count: counts.PENDING },
            { id: "APPROVED", label: "Approved", count: counts.APPROVED },
            { id: "REJECTED", label: "Rejected", count: counts.REJECTED },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Table View"
          >
            <FiList className="h-3.5 w-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              viewMode === "cards"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Cards View"
          >
            <FiGrid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs font-semibold text-slate-600">Loading your leave records...</span>
            </div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FiCalendar className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No leave applications found</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              {statusFilter === "ALL"
                ? "You haven't submitted any leave requests so far."
                : `No records found with status: ${statusFilter}`}
            </p>
            {onOpenApplyModal && (
              <button
                type="button"
                onClick={onOpenApplyModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                <FiPlus className="h-4 w-4" />
                <span>Apply for Leave</span>
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* Full-Width Professional Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-[200px]">Leave Category</th>
                  <th className="py-3 px-4 w-[220px]">Dates & Duration</th>
                  <th className="py-3 px-4 min-w-[200px]">Reason for Leave</th>
                  <th className="py-3 px-4 min-w-[180px]">Admin Remarks</th>
                  <th className="py-3 px-4 w-[140px]">Status</th>
                  <th className="py-3 px-4 w-[90px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((leave) => {
                  const typeConfig = LEAVE_TYPE_LABELS[leave.leaveType] || {
                    label: leave.leaveType,
                    bg: "bg-slate-100 text-slate-700 border-slate-200",
                  };
                  const isPending = leave.status === "PENDING";
                  const isApproved = leave.status === "APPROVED";
                  const isRejected = leave.status === "REJECTED";
                  const isCancelled = leave.status === "CANCELLED";

                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Leave Type */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold border ${typeConfig.bg}`}
                        >
                          {typeConfig.label}
                        </span>
                        {leave.isHalfDay && (
                          <span className="block mt-1 text-[10px] font-bold text-amber-700">
                            {leave.halfDayType === "FIRST_HALF" ? "🌅 First Half" : "🌇 Second Half"}
                          </span>
                        )}
                      </td>

                      {/* Dates & Duration */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                          <FiCalendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>
                            {leave.startDate === leave.endDate
                              ? leave.startDate
                              : `${leave.startDate} to ${leave.endDate}`}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                          {leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"} duration
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          "{leave.reason}"
                        </p>
                      </td>

                      {/* Admin Remarks */}
                      <td className="py-3.5 px-4 align-top">
                        {leave.adminRemarks ? (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <FiMessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="italic">"{leave.adminRemarks}"</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No remarks yet</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800 text-[11px] border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 text-[11px] border border-emerald-200">
                            <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 font-bold text-rose-800 text-[11px] border border-rose-200">
                            <FiXCircle className="h-3.5 w-3.5 text-rose-600" />
                            Rejected
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 font-bold text-slate-600 text-[11px] border border-slate-200">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleCancelLeave(leave.id)}
                            disabled={cancellingId === leave.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 transition cursor-pointer disabled:opacity-50"
                            title="Cancel Application"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                            <span>{cancellingId === leave.id ? "Cancelling..." : "Cancel"}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Multi-Column Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {filteredLeaves.map((leave) => {
              const typeConfig = LEAVE_TYPE_LABELS[leave.leaveType] || {
                label: leave.leaveType,
                bg: "bg-slate-100 text-slate-700 border-slate-200",
              };
              const isPending = leave.status === "PENDING";
              const isApproved = leave.status === "APPROVED";
              const isRejected = leave.status === "REJECTED";

              return (
                <div
                  key={leave.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-sm transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold border ${typeConfig.bg}`}
                    >
                      {typeConfig.label}
                    </span>

                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          <FiCheckCircle className="h-3 w-3 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                          <FiXCircle className="h-3 w-3 text-rose-600" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                      <FiCalendar className="h-3.5 w-3.5 text-blue-600" />
                      <span>
                        {leave.startDate === leave.endDate
                          ? leave.startDate
                          : `${leave.startDate} to ${leave.endDate}`}
                      </span>
                    </div>
                    <span className="font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md text-[10px]">
                      {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs font-medium line-clamp-2">
                    "{leave.reason}"
                  </p>

                  {leave.adminRemarks && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong className="text-slate-700">Remarks: </strong>
                      <span className="italic">"{leave.adminRemarks}"</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCancelLeave(leave.id)}
                        disabled={cancellingId === leave.id}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
