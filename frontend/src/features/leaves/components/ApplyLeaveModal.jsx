import React, { useState, useMemo } from "react";
import {
  FiCalendar,
  FiX,
  FiClock,
  FiFileText,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import { leavesApi } from "../leavesApi.js";

const LEAVE_TYPES = [
  {
    id: "CASUAL",
    label: "Casual Leave (CL)",
    description: "For personal matters, events or short planned leaves",
    color: "blue",
  },
  {
    id: "SICK",
    label: "Sick / Medical Leave (SL)",
    description: "For illness, medical checkups or emergency recovery",
    color: "rose",
  },
  {
    id: "EARNED",
    label: "Privilege / Earned Leave (EL)",
    description: "Planned annual vacation or extended personal leaves",
    color: "purple",
  },
  {
    id: "MATERNITY",
    label: "Maternity Leave",
    description: "Maternity benefit leave",
    color: "pink",
  },
  {
    id: "PATERNITY",
    label: "Paternity Leave",
    description: "Paternity benefit leave",
    color: "indigo",
  },
  {
    id: "UNPAID",
    label: "Leave Without Pay (LWP)",
    description: "Unpaid leave when paid leave quotas are exhausted",
    color: "amber",
  },
  {
    id: "OTHER",
    label: "Other Special Leave",
    description: "Special circumstances or bereavement leave",
    color: "slate",
  },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Apply for Leave
              </h2>
              <p className="text-xs text-slate-500">
                Submit a leave request for Admin approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-700">Half Day Leave</div>
              <div className="text-[11px] text-slate-500">
                Check this if applying for only half a working shift
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
              <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
            </label>
          </div>

          {isHalfDay && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setHalfDayType("FIRST_HALF")}
                className={`rounded-xl border p-2.5 text-xs font-bold transition text-center cursor-pointer ${
                  halfDayType === "FIRST_HALF"
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                🌅 First Half (Morning)
              </button>
              <button
                type="button"
                onClick={() => setHalfDayType("SECOND_HALF")}
                className={`rounded-xl border p-2.5 text-xs font-bold transition text-center cursor-pointer ${
                  halfDayType === "SECOND_HALF"
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                🌇 Second Half (Afternoon)
              </button>
            </div>
          )}

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {!isHalfDay && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  To Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            )}
          </div>

          {/* Summary Banner of Duration */}
          <div className="flex items-center justify-between rounded-xl bg-blue-50/70 p-3 border border-blue-200/70 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <FiClock className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                Total Duration:{" "}
                <strong className="text-blue-950 font-bold">
                  {calculatedDays} {calculatedDays === 1 ? "Day" : "Days"}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
              {isHalfDay ? "Half Day" : calculatedDays > 1 ? "Multi-Day" : "Single Day"}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain the reason for your leave..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Emergency Contact Number (Optional)
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedDays <= 0}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
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
