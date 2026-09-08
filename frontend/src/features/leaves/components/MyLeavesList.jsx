import React, { useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiTrash2,
  FiMessageSquare,
  FiPlus,
  FiAlertCircle,
} from "react-icons/fi";
import { leavesApi } from "../leavesApi.js";

const LEAVE_TYPE_LABELS = {
  CASUAL: { label: "Casual Leave (CL)", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  SICK: { label: "Sick Leave (SL)", bg: "bg-rose-100 text-rose-800 border-rose-200" },
  EARNED: { label: "Privilege / Earned (EL)", bg: "bg-purple-100 text-purple-800 border-purple-200" },
  MATERNITY: { label: "Maternity Leave", bg: "bg-pink-100 text-pink-800 border-pink-200" },
  PATERNITY: { label: "Paternity Leave", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  UNPAID: { label: "Leave Without Pay", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  OTHER: { label: "Special Leave", bg: "bg-slate-100 text-slate-800 border-slate-200" },
};

export default function MyLeavesList({
  leaves = [],
  isLoading = false,
  onRefresh,
  onOpenApplyModal,
}) {
  const [cancellingId, setCancellingId] = useState(null);

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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-800">My Leave History</h3>
          <p className="text-xs text-slate-500">
            Track your leave requests and review approval statuses
          </p>
        </div>

        {onOpenApplyModal && (
          <button
            type="button"
            onClick={onOpenApplyModal}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
          >
            <FiPlus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Cards List / Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs font-semibold">Loading your leave records...</span>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FiCalendar className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No leave applications yet</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              You haven't submitted any leave requests so far.
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
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => {
              const typeConfig = LEAVE_TYPE_LABELS[leave.leaveType] || {
                label: leave.leaveType,
                bg: "bg-slate-100 text-slate-700 border-slate-200",
              };
              const isPending = leave.status === "PENDING";
              const isApproved = leave.status === "APPROVED";
              const isRejected = leave.status === "REJECTED";
              const isCancelled = leave.status === "CANCELLED";

              return (
                <div
                  key={leave.id}
                  className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold border ${typeConfig.bg}`}
                      >
                        {typeConfig.label}
                      </span>

                      {leave.isHalfDay && (
                        <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {leave.halfDayType === "FIRST_HALF" ? "🌅 First Half" : "🌇 Second Half"}
                        </span>
                      )}

                      {/* Status badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800 text-[10px] border border-amber-200">
                          <FiClock className="h-3 w-3" />
                          Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-[10px] border border-emerald-200">
                          <FiCheckCircle className="h-3 w-3" />
                          Approved (Reflected on Calendar)
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-800 text-[10px] border border-rose-200">
                          <FiXCircle className="h-3 w-3" />
                          Rejected
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-600 text-[10px] border border-slate-200">
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* Dates & duration */}
                    <div className="flex items-center gap-2 font-mono text-slate-800 font-bold text-sm">
                      <FiCalendar className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>
                        {leave.startDate === leave.endDate
                          ? leave.startDate
                          : `${leave.startDate} to ${leave.endDate}`}
                      </span>
                      <span className="font-sans text-xs font-semibold text-slate-500">
                        ({leave.totalDays} {leave.totalDays === 1 ? "day" : "days"})
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-slate-600 font-medium">{leave.reason}</p>

                    {/* Admin remarks / details */}
                    {leave.adminRemarks && (
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <FiMessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-700">Admin Remarks: </span>
                          <span className="italic">"{leave.adminRemarks}"</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions (Cancel button if pending) */}
                  <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleCancelLeave(leave.id)}
                        disabled={cancellingId === leave.id}
                        className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 transition cursor-pointer disabled:opacity-50"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        <span>{cancellingId === leave.id ? "Cancelling..." : "Cancel"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
