import { useState, useMemo } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiList,
  FiMessageSquare,
  FiSearch,
  FiX,
  FiXCircle,
  FiUser,
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

const APPROVE_REMARK_PRESETS = [
  "Approved as requested.",
  "Approved. Ensure handover on pending files.",
  "Approved. Enjoy your time off.",
];

const REJECT_REMARK_PRESETS = [
  "Declined due to critical client meetings / audit schedules.",
  "Declined due to insufficient staff coverage. Please reschedule.",
  "Declined. Please discuss with your reporting manager.",
];

export default function LeaveApprovalsTable({
  leaves = [],
  isLoading = false,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
  const [actionModal, setActionModal] = useState(null); // { type: 'APPROVE' | 'REJECT', leave: obj }
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (statusFilter !== "ALL" && leave.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      const empName = leave.user?.name?.toLowerCase() || "";
      const empEmail = leave.user?.email?.toLowerCase() || "";
      const reason = leave.reason?.toLowerCase() || "";
      const type = leave.leaveType?.toLowerCase() || "";
      return (
        empName.includes(query) ||
        empEmail.includes(query) ||
        reason.includes(query) ||
        type.includes(query)
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

  const handleOpenAction = (type, leave) => {
    setActionModal({ type, leave });
    setRemarks(type === "APPROVE" ? "Approved as requested." : "");
    setErrorMsg("");
  };

  const handleCloseAction = () => {
    setActionModal(null);
    setRemarks("");
    setErrorMsg("");
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    if (actionModal.type === "REJECT" && !remarks.trim()) {
      setErrorMsg("Please specify a reason for rejecting the leave application.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      if (actionModal.type === "APPROVE") {
        await leavesApi.approve(actionModal.leave.id, {
          adminRemarks: remarks.trim() || "Approved by Admin",
        });
      } else {
        await leavesApi.reject(actionModal.leave.id, {
          adminRemarks: remarks.trim(),
        });
      }
      handleCloseAction();
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Action failed. Please try again.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters & View Mode */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, leave type, reason..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: "PENDING", label: "Pending", count: counts.PENDING },
            { id: "APPROVED", label: "Approved", count: counts.APPROVED },
            { id: "REJECTED", label: "Rejected", count: counts.REJECTED },
            { id: "ALL", label: "All Requests", count: counts.ALL },
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

        {/* View Switcher */}
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

      {/* Main Table / Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs font-semibold text-slate-600">Loading leave requests...</span>
            </div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FiCalendar className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No leave requests found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {statusFilter === "PENDING"
                ? "No pending approvals at the moment."
                : "No matching records found for this filter."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-[200px]">Employee</th>
                  <th className="py-3 px-4 w-[160px]">Leave Type</th>
                  <th className="py-3 px-4 w-[190px]">Dates & Duration</th>
                  <th className="py-3 px-4 min-w-[200px]">Reason & Notes</th>
                  <th className="py-3 px-4 w-[130px]">Status</th>
                  <th className="py-3 px-4 w-[160px] text-right">Actions</th>
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

                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Employee Info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 font-bold text-white text-xs shadow-2xs">
                            {(leave.user?.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {leave.user?.name || `Employee #${leave.userId}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {leave.user?.email || `ID: #${leave.userId}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold border ${typeConfig.bg}`}
                        >
                          {typeConfig.label}
                        </span>
                        {leave.isHalfDay && (
                          <span className="block mt-1 text-[10px] font-bold text-amber-700">
                            {leave.halfDayType === "FIRST_HALF"
                              ? "🌅 First Half"
                              : "🌇 Second Half"}
                          </span>
                        )}
                      </td>

                      {/* Dates & Duration */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-slate-800">
                          {leave.startDate === leave.endDate
                            ? leave.startDate
                            : `${leave.startDate} to ${leave.endDate}`}
                        </div>
                        <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                          {leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"}
                        </div>
                      </td>

                      {/* Reason & Remarks */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          "{leave.reason}"
                        </p>
                        {leave.adminRemarks && (
                          <div className="mt-1.5 flex items-start gap-1 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                            <FiMessageSquare className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="italic">"{leave.adminRemarks}"</span>
                          </div>
                        )}
                        {leave.contactNumber && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            📞 {leave.contactNumber}
                          </div>
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
                        {leave.status === "CANCELLED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 font-bold text-slate-600 text-[11px] border border-slate-200">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAction("APPROVE", leave)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                              title="Approve Leave Request"
                            >
                              <FiCheck className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAction("REJECT", leave)}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 transition cursor-pointer"
                              title="Reject Leave Request"
                            >
                              <FiX className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {leave.approvedByUser?.name
                              ? `By ${leave.approvedByUser.name.split(" ")[0]}`
                              : "Processed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Multi-column Cards Mode */
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
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 font-bold text-white text-xs">
                        {(leave.user?.name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">
                          {leave.user?.name || `Employee #${leave.userId}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {leave.user?.email || `#${leave.userId}`}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold border ${typeConfig.bg}`}
                    >
                      {typeConfig.label}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="font-mono font-bold text-slate-800">
                      {leave.startDate === leave.endDate
                        ? leave.startDate
                        : `${leave.startDate} to ${leave.endDate}`}
                    </div>
                    <span className="font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md text-[10px]">
                      {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs font-medium line-clamp-2">
                    "{leave.reason}"
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          Pending
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                          Rejected
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAction("APPROVE", leave)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAction("REJECT", leave)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approve / Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
            <div
              className={`p-4.5 border-b flex items-center justify-between ${
                actionModal.type === "APPROVE"
                  ? "bg-emerald-50/80 border-emerald-100"
                  : "bg-rose-50/80 border-rose-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {actionModal.type === "APPROVE" ? (
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <FiAlertCircle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {actionModal.type === "APPROVE"
                      ? "Approve Leave Application"
                      : "Reject Leave Application"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {actionModal.leave.user?.name || "Employee"} •{" "}
                    {actionModal.leave.totalDays} Days ({actionModal.leave.leaveType})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAction}
                className="text-slate-400 hover:text-slate-700"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-4.5 space-y-3.5">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Period:</span>
                  <span className="font-bold text-slate-800">
                    {actionModal.leave.startDate} to {actionModal.leave.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reason:</span>
                  <span className="font-semibold text-slate-700 italic">
                    "{actionModal.leave.reason}"
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Admin Remarks{" "}
                    {actionModal.type === "REJECT" && (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {(actionModal.type === "APPROVE"
                    ? APPROVE_REMARK_PRESETS
                    : REJECT_REMARK_PRESETS
                  ).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRemarks(preset)}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    actionModal.type === "APPROVE"
                      ? "e.g. Approved. Ensure coverage on critical tasks."
                      : "e.g. Rejected due to critical project deadline. Please reschedule."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required={actionModal.type === "REJECT"}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAction}
                  disabled={isProcessing}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer ${
                    actionModal.type === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isProcessing ? (
                    <span>Processing...</span>
                  ) : actionModal.type === "APPROVE" ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5" />
                      <span>Confirm Approval</span>
                    </>
                  ) : (
                    <>
                      <FiX className="h-3.5 w-3.5" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
