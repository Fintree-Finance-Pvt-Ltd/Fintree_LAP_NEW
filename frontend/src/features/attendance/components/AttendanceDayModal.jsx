import React from "react";
import {
  FiClock,
  FiMapPin,
  FiNavigation,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiCompass,
  FiUser,
  FiActivity,
} from "react-icons/fi";
import {
  calculateRecordDuration,
  TARGET_WORKING_MINUTES,
  TARGET_HOURS_LABEL,
} from "../../../utils/attendanceUtils.js";

export default function AttendanceDayModal({
  dayData,
  employeeName,
  onClose,
  onOpenRouteMap,
}) {
  if (!dayData) return null;

  const {
    dateStr,
    dayNum,
    dayName,
    isSunday,
    isToday,
    isFuture,
    record,
    statusType: rawStatusType,
    inTimeFormatted,
    outTimeFormatted,
    startLocationName,
    startCoords,
    endLocationName,
    endCoords,
    liveLocationName,
    distanceKm,
  } = dayData;

  const durationInfo = record
    ? calculateRecordDuration(record)
    : {
        totalMinutes: dayData.totalMinutes || 0,
        formattedDuration: dayData.durationFormatted || "0h 0m",
        progressPercent: Math.min(
          100,
          Math.round(((dayData.totalMinutes || 0) / TARGET_WORKING_MINUTES) * 100)
        ),
        isFullShift: (dayData.totalMinutes || 0) >= TARGET_WORKING_MINUTES,
      };

  const totalMinutes = durationInfo.totalMinutes;
  const durationFormatted = durationInfo.formattedDuration;
  const progressPercent = durationInfo.progressPercent;

  // Derive status badge according to the true recalculated duration
  let statusType = rawStatusType;
  if (record) {
    if (isSunday) {
      statusType = totalMinutes >= TARGET_WORKING_MINUTES ? "SUNDAY_WORKED_FULL" : "SUNDAY_WORKED_PARTIAL";
    } else if (record.status === "IN_PROGRESS") {
      statusType = "IN_PROGRESS";
    } else {
      statusType = totalMinutes >= TARGET_WORKING_MINUTES ? "FULL_DAY" : "SHORT_DAY";
    }
  }

  const remainingMins = Math.max(0, TARGET_WORKING_MINUTES - totalMinutes);
  const remainingHrs = Math.floor(remainingMins / 60);
  const remainingM = remainingMins % 60;
  const remainingShortStr =
    remainingHrs > 0 ? `${remainingHrs}h ${remainingM}m` : `${remainingM}m`;

  const formattedFullDate = (() => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Attendance Details
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                {formattedFullDate}
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

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs">
          {/* Employee & Status Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 sm:p-3 border border-slate-100">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FiUser className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold text-slate-700 text-xs">
                {employeeName || "Employee"}
              </span>
            </div>

            {/* Status Badge */}
            {statusType === "ON_LEAVE" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-purple-800 border border-purple-300 text-[11px]">
                <FiCheckCircle className="h-3 w-3 text-purple-600" />
                On Leave ({dayData.leaveInfo?.leaveType || "Approved"})
              </span>
            )}

            {statusType === "FULL_DAY" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-emerald-800 border border-emerald-300 text-[11px]">
                <FiCheckCircle className="h-3 w-3 text-emerald-600" />
                Full Day (≥ 8.30 hrs)
              </span>
            )}

            {statusType === "SHORT_DAY" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-amber-800 border border-amber-300 text-[11px]">
                <FiAlertCircle className="h-3 w-3 text-amber-600" />
                Short Shift (&lt; 8.30 hrs)
              </span>
            )}

            {statusType === "SUNDAY_WORKED_FULL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-emerald-800 border border-emerald-300 text-[11px]">
                <FiCheckCircle className="h-3 w-3 text-emerald-600" />
                Sunday (Full Day)
              </span>
            )}

            {statusType === "SUNDAY_WORKED_PARTIAL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-amber-800 border border-amber-300 text-[11px]">
                <FiAlertCircle className="h-3 w-3 text-amber-600" />
                Sunday (Partial)
              </span>
            )}

            {statusType === "SUNDAY_OFF" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-slate-600 border border-slate-300 text-[11px]">
                ⚪ Sunday Off
              </span>
            )}

            {statusType === "ABSENT" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-rose-800 border border-rose-300 text-[11px]">
                <FiAlertCircle className="h-3 w-3 text-rose-600" />
                Absent (No Punch)
              </span>
            )}

            {statusType === "IN_PROGRESS" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-emerald-800 border border-emerald-300 text-[11px]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Live Session
              </span>
            )}

            {statusType === "TODAY_NOT_STARTED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold text-blue-700 border border-blue-200 text-[11px]">
                Today (Pending)
              </span>
            )}

            {statusType === "FUTURE" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 sm:px-3 sm:py-1 font-medium text-slate-500 border border-slate-200 text-[11px]">
                Upcoming Date
              </span>
            )}
          </div>

          {/* Approved Leave Details Card */}
          {dayData.leaveInfo && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCalendar className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-purple-950 text-xs sm:text-sm">
                    Approved Leave Details
                  </span>
                </div>
                <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  {dayData.leaveInfo.leaveType}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-purple-100 pb-1.5">
                  <span className="text-purple-700 font-medium">Leave Scope:</span>
                  <span className="font-bold text-purple-950">
                    {dayData.leaveInfo.isHalfDay
                      ? `Half Day (${dayData.leaveInfo.halfDayType === "FIRST_HALF" ? "Morning Shift" : "Afternoon Shift"})`
                      : `Full Day (${dayData.leaveInfo.totalDays || 1} day)`}
                  </span>
                </div>

                <div className="flex justify-between border-b border-purple-100 pb-1.5">
                  <span className="text-purple-700 font-medium">Reason:</span>
                  <span className="font-semibold text-purple-900 text-right max-w-[250px]">
                    "{dayData.leaveInfo.reason}"
                  </span>
                </div>

                {dayData.leaveInfo.approvedBy && (
                  <div className="flex justify-between border-b border-purple-100 pb-1.5">
                    <span className="text-purple-700 font-medium">Approved By:</span>
                    <span className="font-bold text-purple-950">
                      {dayData.leaveInfo.approvedBy}
                    </span>
                  </div>
                )}

                {dayData.leaveInfo.adminRemarks && (
                  <div className="flex justify-between pt-0.5">
                    <span className="text-purple-700 font-medium">Admin Remarks:</span>
                    <span className="font-medium italic text-purple-800 text-right max-w-[250px]">
                      "{dayData.leaveInfo.adminRemarks}"
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Working Hours Target & Progress Card (if worked) */}
          {(record || statusType === "IN_PROGRESS") && (
            <div
              className={`rounded-xl border p-3 sm:p-4 shadow-2xs ${
                totalMinutes >= TARGET_WORKING_MINUTES
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-amber-200 bg-amber-50/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiClock
                    className={`h-4 w-4 ${
                      totalMinutes >= TARGET_WORKING_MINUTES
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  />
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    {durationFormatted || "0h 0m"}
                  </span>
                </div>
                <span className="font-medium text-slate-600 text-[11px]">
                  Target: <strong className="text-slate-800">8h 30m</strong>
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalMinutes >= TARGET_WORKING_MINUTES
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium">
                <span>Progress: {progressPercent}%</span>
                {totalMinutes >= TARGET_WORKING_MINUTES ? (
                  <span className="text-emerald-700 font-semibold">
                    ✓ Full shift completed
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    ⚠️ {remainingShortStr} short of 8.30 hrs
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Punch In / Out Grid */}
          {record && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Punch In Card */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Punch In</span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-800">
                  {inTimeFormatted}
                </div>
                <div className="flex items-start gap-1 text-[11px] text-slate-600">
                  <FiMapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={startLocationName}>
                    {startLocationName || "Office Workspace"}
                  </span>
                </div>
                {startCoords && (
                  <div className="font-mono text-[10px] text-slate-400">
                    GPS: {startCoords}
                  </div>
                )}
              </div>

              {/* Punch Out Card */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Punch Out</span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-800">
                  {outTimeFormatted}
                </div>
                <div className="flex items-start gap-1 text-[11px] text-slate-600">
                  <FiMapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={endLocationName}>
                    {endLocationName || (record?.status === "IN_PROGRESS" ? "Active movement" : "-")}
                  </span>
                </div>
                {endCoords && (
                  <div className="font-mono text-[10px] text-slate-400">
                    GPS: {endCoords}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distance & GPS Stats */}
          {record && (
            <div className="flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 sm:p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                  <FiCompass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    GPS Route Distance
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Continuous tracking logged
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm sm:text-base font-bold text-cyan-800 font-mono">
                  {distanceKm || "0.0"} km
                </span>
              </div>
            </div>
          )}

          {/* Absent Explanation */}
          {statusType === "ABSENT" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                <FiAlertCircle className="h-4 w-4 text-rose-600" />
                <span>Marked as Absent</span>
              </div>
              <p className="text-[11px] text-rose-700">
                No attendance punch-in or work session was recorded on this
                official working day.
              </p>
            </div>
          )}

          {/* Sunday Explanation */}
          {statusType === "SUNDAY_OFF" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <FiCalendar className="h-4 w-4 text-slate-500" />
                <span>Sunday Weekly Off</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Standard weekly off / non-working day. No attendance required.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 sm:px-6 py-3">
          {record && record.id && onOpenRouteMap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRouteMap(record.id);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition cursor-pointer"
            >
              <FiNavigation className="h-3.5 w-3.5" />
              <span>View Route Map</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
