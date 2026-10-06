import React, { useState, useMemo } from "react";
import {
  FiCalendar,
  FiX,
  FiClock,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiSun,
  FiSunset,
} from "react-icons/fi";
import { leavesApi } from "../leavesApi.js";

const LEAVE_TYPES = [
  { id: "CASUAL", label: "Casual Leave (CL)", description: "For personal appointments or short planned leaves" },
  { id: "SICK", label: "Sick Leave (SL)", description: "For medical checkups, illness or recovery" },
  { id: "EARNED", label: "Privilege / Earned Leave (EL)", description: "Planned annual vacation or extended breaks" },
  { id: "MATERNITY", label: "Maternity Leave", description: "Maternity benefit leave" },
  { id: "PATERNITY", label: "Paternity Leave", description: "Paternity benefit leave" },
  { id: "UNPAID", label: "Leave Without Pay (LWP)", description: "Unpaid leave when quotas are exhausted" },
  { id: "OTHER", label: "Special Leave", description: "Bereavement or special circumstances" },
];

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess }) {
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState("FIRST_HALF");
  const [reason, setReason] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Calculate day count
  const calculatedDays = useMemo(() => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [startDate, endDate, isHalfDay]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!startDate || !endDate) {
      setErrorMsg("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setErrorMsg("Start date cannot be after end date.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Please provide a reason for the leave request.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        leaveType,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : "FULL_DAY",
        totalDays: calculatedDays,
        reason: reason.trim(),
        contactNumber: contactNumber.trim() || undefined,
      };

      await leavesApi.apply(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit leave request. Please try again.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-xs">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Apply for Leave
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Submit a leave request for administrative review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-800">Half Day Leave</div>
              <div className="text-[11px] text-slate-500 font-normal">
                Apply for half of the working shift
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => {
                  setIsHalfDay(e.target.checked);
                  if (e.target.checked) {
                    setEndDate(startDate);
                  }
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none" />
            </label>
          </div>

          {isHalfDay && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setHalfDayType("FIRST_HALF")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                  halfDayType === "FIRST_HALF"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FiSun className="h-4 w-4 text-amber-500" />
                <span>First Half (Morning)</span>
              </button>
              <button
                type="button"
                onClick={() => setHalfDayType("SECOND_HALF")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                  halfDayType === "SECOND_HALF"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FiSunset className="h-4 w-4 text-orange-500" />
                <span>Second Half (Afternoon)</span>
              </button>
            </div>
          )}

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (isHalfDay || e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer"
                required
              />
            </div>

            {!isHalfDay && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  To Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  required
                />
              </div>
            )}
          </div>

          {/* Summary Banner of Duration */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <FiClock className="h-4 w-4 text-slate-500 shrink-0" />
              <span>
                Total Duration:{" "}
                <strong className="text-slate-900 font-bold font-mono text-sm">
                  {calculatedDays} {calculatedDays === 1 ? "Day" : "Days"}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
              {isHalfDay ? "Half Day" : calculatedDays > 1 ? "Multi-Day" : "Single Day"}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain the reason for your leave..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Emergency Contact Number (Optional)
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedDays <= 0}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  <span>Submit Leave Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
