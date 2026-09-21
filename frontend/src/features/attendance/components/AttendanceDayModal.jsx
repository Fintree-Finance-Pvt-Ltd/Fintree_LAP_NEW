import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiFileText,
  FiMapPin,
  FiNavigation,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  calculateRecordDuration,
  TARGET_HOURS_LABEL,
  TARGET_WORKING_MINUTES,
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
      statusType =
        totalMinutes >= TARGET_WORKING_MINUTES
          ? "SUNDAY_WORKED_FULL"
          : "SUNDAY_WORKED_PARTIAL";
    } else if (record.status === "IN_PROGRESS") {
      statusType = "IN_PROGRESS";
    } else {
      statusType =
        totalMinutes >= TARGET_WORKING_MINUTES ? "FULL_DAY" : "SHORT_DAY";
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
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  })();

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs transition-all animate-fadeIn"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#0f2942] to-[#13385c] px-5 sm:px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 shadow-inner border border-white/15">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Shift & Attendance Details
              </h2>
              <p className="text-xs font-medium text-slate-300 mt-0.5">
                {formattedFullDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Employee & Status Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                <FiUser className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                {employeeName || "Employee"}
              </span>
            </div>

            {/* Status Badge */}
            {statusType === "ON_LEAVE" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 font-bold text-purple-800 border border-purple-300 text-xs">
                <FiCheckCircle className="h-3.5 w-3.5 text-purple-600" />
                On Leave ({dayData.leaveInfo?.leaveType || "Approved"})
              </span>
            )}

            {statusType === "FULL_DAY" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 border border-emerald-300 text-xs">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Full Shift Completed (≥ 8h 30m)
              </span>
            )}

            {statusType === "SHORT_DAY" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800 border border-amber-300 text-xs">
                <FiAlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Short Shift (&lt; 8h 30m)
              </span>
            )}

            {statusType === "SUNDAY_WORKED_FULL" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 border border-emerald-300 text-xs">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Sunday (Full Shift)
              </span>
            )}

            {statusType === "SUNDAY_WORKED_PARTIAL" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800 border border-amber-300 text-xs">
                <FiAlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Sunday (Partial Shift)
              </span>
            )}

            {statusType === "SUNDAY_OFF" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 font-bold text-slate-700 border border-slate-300 text-xs">
                ⚪ Sunday Weekly Off
              </span>
            )}

            {statusType === "ABSENT" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 font-bold text-rose-800 border border-rose-300 text-xs">
                <FiAlertCircle className="h-3.5 w-3.5 text-rose-600" />
                Absent (No Attendance)
              </span>
            )}

            {statusType === "IN_PROGRESS" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 border border-emerald-300 text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active Live Session
              </span>
            )}

            {statusType === "TODAY_NOT_STARTED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700 border border-blue-200 text-xs">
                Today (Ready to Punch In)
              </span>
            )}

            {statusType === "FUTURE" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500 border border-slate-200 text-xs">
                Upcoming Working Day
              </span>
            )}
          </div>

          {/* Approved Leave Details Card */}
          {dayData.leaveInfo && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-purple-950 text-xs sm:text-sm">
                    Approved Leave Summary
                  </span>
                </div>
                <span className="rounded-md bg-purple-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase shadow-2xs">
                  {dayData.leaveInfo.leaveType}
                </span>
              </div>

              <div className="space-y-2 text-xs">
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
              className={`rounded-2xl border p-4 shadow-2xs ${
                totalMinutes >= TARGET_WORKING_MINUTES
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiClock
                    className={`h-4 w-4 ${
                      totalMinutes >= TARGET_WORKING_MINUTES
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  />
                  <span className="font-black text-slate-800 text-sm font-mono">
                    Logged: {durationFormatted || "0h 0m"}
                  </span>
                </div>
                <span className="font-semibold text-slate-600 text-xs">
                  Target: <strong className="text-slate-900">{TARGET_HOURS_LABEL}</strong>
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

              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Completion: {progressPercent}%</span>
                {totalMinutes >= TARGET_WORKING_MINUTES ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Full shift compliance met
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <FiAlertCircle className="h-3.5 w-3.5 text-amber-600" /> {remainingShortStr} short of target
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Punch In / Out Comparison Grid */}
          {record && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Punch In Card */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Punch In Record</span>
                </div>
                <div className="text-base font-black font-mono text-slate-900">
                  {inTimeFormatted}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-700">
                  <FiMapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={startLocationName}>
                    {startLocationName || "Office Workspace"}
                  </span>
                </div>
                {startCoords && (
                  <div className="font-mono text-[10px] text-slate-400 bg-white/70 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                    📍 {startCoords}
                  </div>
                )}
              </div>

              {/* Punch Out Card */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Punch Out Record</span>
                </div>
                <div className="text-base font-black font-mono text-slate-900">
                  {outTimeFormatted}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-700">
                  <FiMapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={endLocationName}>
                    {endLocationName || (record?.status === "IN_PROGRESS" ? "Active movement" : "-")}
                  </span>
                </div>
                {endCoords && (
                  <div className="font-mono text-[10px] text-slate-400 bg-white/70 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                    🏁 {endCoords}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distance & GPS Stats */}
          {record && (
            <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <FiCompass className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    GPS Tracked Movement
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Continuous route trail waypoints
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-cyan-800 font-mono">
                  {distanceKm || "0.0"} km
                </span>
              </div>
            </div>
          )}

          {/* Absent Explanation */}
          {statusType === "ABSENT" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                <FiAlertCircle className="h-4 w-4 text-rose-600" />
                <span>Marked as Absent</span>
              </div>
              <p className="text-xs text-rose-700">
                No attendance punch-in or work session was recorded on this official working day.
              </p>
            </div>
          )}

          {/* Sunday Explanation */}
          {statusType === "SUNDAY_OFF" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <FiCalendar className="h-4 w-4 text-slate-500" />
                <span>Sunday Weekly Off</span>
              </div>
              <p className="text-xs text-slate-500">
                Standard non-working weekly off.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-5 sm:px-6 py-3.5">
          {record && record.id && onOpenRouteMap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRouteMap(record.id);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition cursor-pointer"
            >
              <FiNavigation className="h-3.5 w-3.5" />
              <span>View GPS Route Map</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

