import React, { useMemo, useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCompass,
  FiUsers,
  FiUser,
  FiRefreshCw,
  FiActivity,
  FiInfo,
} from "react-icons/fi";
import { cleanLocationName } from "../../../utils/geoUtils.js";
import {
  calculateRecordDuration,
  formatMinutesToDuration,
  TARGET_WORKING_MINUTES,
  TARGET_HOURS_LABEL,
} from "../../../utils/attendanceUtils.js";
import AttendanceDayModal from "./AttendanceDayModal.jsx";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = [
  { full: "Sunday", short: "Sun", mini: "S", isWeekend: true },
  { full: "Monday", short: "Mon", mini: "M", isWeekend: false },
  { full: "Tuesday", short: "Tue", mini: "T", isWeekend: false },
  { full: "Wednesday", short: "Wed", mini: "W", isWeekend: false },
  { full: "Thursday", short: "Thu", mini: "T", isWeekend: false },
  { full: "Friday", short: "Fri", mini: "F", isWeekend: false },
  { full: "Saturday", short: "Sat", mini: "S", isWeekend: false },
];

export default function AttendanceCalendar({
  records = [],
  allUsers = [],
  selectedUserId,
  onSelectUserId,
  isAdminOrBM = false,
  currentUser,
  onOpenRouteMap,
  isLoading = false,
  onRefresh,
}) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-11
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [liveElapsedMins, setLiveElapsedMins] = useState(0);

  // Update live timer every 30 seconds for in-progress sessions
  useEffect(() => {
    const updateLiveTimer = () => {
      setLiveElapsedMins(Date.now());
    };
    const timer = setInterval(updateLiveTimer, 30000);
    return () => clearInterval(timer);
  }, []);

  // Today's date string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  }, []);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Safe time formatter
  const formatTimeStr = (dateString) => {
    if (!dateString) return "-";
    try {
      const clean =
        typeof dateString === "string"
          ? dateString.replace(" ", "T")
          : dateString;
      const parsed = new Date(clean);
      if (isNaN(parsed.getTime())) {
        const dOnly = new Date(dateString);
        if (!isNaN(dOnly.getTime())) {
          return dOnly.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
        return String(dateString);
      }
      return parsed.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(dateString);
    }
  };

  // Map of records by date string: "YYYY-MM-DD" -> Record
  const recordsByDate = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(records)) return map;

    records.forEach((rec) => {
      if (!rec || !rec.date) return;
      const duration = calculateRecordDuration(rec);
      const existing = map.get(rec.date);
      if (!existing) {
        map.set(rec.date, rec);
      } else {
        const existingDur = calculateRecordDuration(existing);
        if (
          rec.status === "IN_PROGRESS" ||
          duration.totalMinutes > existingDur.totalMinutes
        ) {
          map.set(rec.date, rec);
        }
      }
    });
    return map;
  }, [records]);

  // Generate calendar days grid
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isSunday: new Date(prevYear, prevMonth, dayNum).getDay() === 0,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayOfWeek = new Date(currentYear, currentMonth, dayNum).getDay();
      const isSunday = dayOfWeek === 0;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;

      const record = recordsByDate.get(dateStr);

      const durationInfo = record
        ? calculateRecordDuration(record)
        : {
            totalMinutes: 0,
            formattedDuration: "0h 0m",
            isFullShift: false,
          };

      const totalMinutes = durationInfo.totalMinutes;
      const isLiveActive =
        record &&
        record.status === "IN_PROGRESS" &&
        (isToday || !record.endTime);

      // Determine Status Type according to exact business rules:
      // 1. Total work target is 8.30 hours (510 minutes).
      // 2. If user completed >= 8.30 hrs -> Green background.
      // 3. If user worked but < 8.30 hrs -> Amber/Orange background.
      // 4. If absent on working day -> Red background.
      // 5. If Sunday & no work -> Gray background.
      // 6. If Sunday & user worked -> Green (if >= 8.30h) or Amber (if < 8.30h).
      // 7. Today in progress -> Active live pulse.
      // 8. Future dates -> Neutral.

      let statusType = "NEUTRAL";
      let badgeLabel = "";
      let bgClasses = "";
      let borderClasses = "";
      let textClasses = "";
      let badgeClasses = "";
      let dotColor = "bg-slate-300";

      if (isSunday) {
        if (record && totalMinutes > 0) {
          if (totalMinutes >= TARGET_WORKING_MINUTES) {
            statusType = "SUNDAY_WORKED_FULL";
            badgeLabel = "Sunday (Full Day)";
            bgClasses = "bg-emerald-50/90 dark:bg-emerald-950/30";
            borderClasses = "border-emerald-300 ring-1 ring-emerald-400/50";
            textClasses = "text-emerald-950 dark:text-emerald-100";
            badgeClasses = "bg-emerald-500 text-white shadow-2xs";
            dotColor = "bg-emerald-500";
          } else {
            statusType = "SUNDAY_WORKED_PARTIAL";
            badgeLabel = "Sunday (Partial)";
            bgClasses = "bg-amber-50/90 dark:bg-amber-950/30";
            borderClasses = "border-amber-300 ring-1 ring-amber-400/50";
            textClasses = "text-amber-950 dark:text-amber-100";
            badgeClasses = "bg-amber-500 text-white shadow-2xs";
            dotColor = "bg-amber-500";
          }
        } else {
          statusType = "SUNDAY_OFF";
          badgeLabel = "Sunday Off";
          bgClasses = "bg-slate-100/80 dark:bg-slate-800/40";
          borderClasses = "border-slate-200 dark:border-slate-700/60";
          textClasses = "text-slate-500 dark:text-slate-400";
          badgeClasses = "bg-slate-200 text-slate-600 border border-slate-300";
          dotColor = "bg-slate-300";
        }
      } else if (isLiveActive) {
        statusType = "IN_PROGRESS";
        badgeLabel = "Live Tracking";
        bgClasses = "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/30 animate-pulse-subtle";
        borderClasses = "border-emerald-400";
        textClasses = "text-emerald-950";
        badgeClasses = "bg-emerald-600 text-white animate-pulse";
        dotColor = "bg-emerald-500";
      } else if (record) {
        if (totalMinutes >= TARGET_WORKING_MINUTES) {
          statusType = "FULL_DAY";
          badgeLabel = "Full Day";
          bgClasses = "bg-emerald-50/90 dark:bg-emerald-950/40";
          borderClasses = "border-emerald-300 hover:border-emerald-500";
          textClasses = "text-emerald-950 dark:text-emerald-100";
          badgeClasses = "bg-emerald-600 text-white";
          dotColor = "bg-emerald-500";
        } else {
          statusType = "SHORT_DAY";
          badgeLabel = "Half Day";
          bgClasses = "bg-amber-50/90 dark:bg-amber-950/40";
          borderClasses = "border-amber-300 hover:border-amber-500";
          textClasses = "text-amber-950 dark:text-amber-100";
          badgeClasses = "bg-amber-500 text-white";
          dotColor = "bg-amber-500";
        }
      } else if (isPast) {
        // Past working day with no attendance
        statusType = "ABSENT";
        badgeLabel = "Absent";
        bgClasses = "bg-rose-50/80 dark:bg-rose-950/40";
        borderClasses = "border-rose-200 hover:border-rose-400";
        textClasses = "text-rose-900 dark:text-rose-200";
        badgeClasses = "bg-rose-500 text-white";
        dotColor = "bg-rose-500";
      } else if (isToday) {
        statusType = "TODAY_NOT_STARTED";
        badgeLabel = "Not Started";
        bgClasses = "bg-blue-50/50 border-blue-300 ring-2 ring-blue-400/30";
        borderClasses = "border-blue-300";
        textClasses = "text-blue-900";
        badgeClasses = "bg-blue-100 text-blue-700 border border-blue-200";
        dotColor = "bg-blue-500";
      } else {
        // Future working day
        statusType = "FUTURE";
        badgeLabel = "";
        bgClasses = "bg-white/60 dark:bg-slate-900/40";
        borderClasses = "border-slate-100 dark:border-slate-800";
        textClasses = "text-slate-400";
        badgeClasses = "";
        dotColor = "";
      }

      // Format location names & coordinates
      const startLat = record?.startLatitude ?? record?.start_latitude;
      const startLng = record?.startLongitude ?? record?.start_longitude;
      const endLat = record?.endLatitude ?? record?.end_latitude;
      const endLng = record?.endLongitude ?? record?.end_longitude;

      const inTimeFormatted = formatTimeStr(record?.startTime || record?.start_time);
      const outTimeFormatted = formatTimeStr(record?.endTime || record?.end_time);

      days.push({
        dateStr,
        dayNum,
        dayName: WEEKDAY_NAMES[dayOfWeek].full,
        isCurrentMonth: true,
        isSunday,
        isToday,
        isPast,
        isFuture,
        record,
        statusType,
        badgeLabel,
        bgClasses,
        borderClasses,
        textClasses,
        badgeClasses,
        dotColor,
        totalMinutes,
        durationFormatted: durationInfo.formattedDuration,
        inTimeFormatted: record ? inTimeFormatted : "-",
        outTimeFormatted: record ? (record.endTime ? outTimeFormatted : isLiveActive ? "In Progress" : "-") : "-",
        startLocationName: cleanLocationName(record?.startLocation || record?.start_location, "Office Workspace"),
        startCoords: startLat && startLng ? `${Number(startLat).toFixed(4)}, ${Number(startLng).toFixed(4)}` : null,
        endLocationName: cleanLocationName(record?.endLocation || record?.end_location, "Office Workspace"),
        endCoords: endLat && endLng ? `${Number(endLat).toFixed(4)}, ${Number(endLng).toFixed(4)}` : null,
        distanceKm: record?.totalDistanceKm || record?.total_distance_km || "0.0",
      });
    }

    // Next month leading days to complete grid to 35 or 42 cells
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isSunday: new Date(nextYear, nextMonth, i).getDay() === 0,
      });
    }

    return days;
  }, [
    currentYear,
    currentMonth,
    recordsByDate,
    todayStr,
    liveElapsedMins,
  ]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let fullDays = 0;
    let shortDays = 0;
    let absentDays = 0;
    let sundaysOff = 0;
    let sundaysWorked = 0;
    let totalMinutesWorked = 0;
    let workingDaysElapsed = 0;

    calendarDays.forEach((d) => {
      if (!d.isCurrentMonth) return;

      if (d.statusType === "FULL_DAY") {
        fullDays++;
        workingDaysElapsed++;
        totalMinutesWorked += d.totalMinutes;
      } else if (d.statusType === "SHORT_DAY") {
        shortDays++;
        workingDaysElapsed++;
        totalMinutesWorked += d.totalMinutes;
      } else if (d.statusType === "SUNDAY_WORKED_FULL") {
        sundaysWorked++;
        totalMinutesWorked += d.totalMinutes;
      } else if (d.statusType === "SUNDAY_WORKED_PARTIAL") {
        sundaysWorked++;
        totalMinutesWorked += d.totalMinutes;
      } else if (d.statusType === "SUNDAY_OFF") {
        sundaysOff++;
      } else if (d.statusType === "ABSENT") {
        absentDays++;
        workingDaysElapsed++;
      } else if (d.statusType === "IN_PROGRESS") {
        workingDaysElapsed++;
        totalMinutesWorked += d.totalMinutes;
        if (d.totalMinutes >= TARGET_WORKING_MINUTES) {
          fullDays++;
        } else {
          shortDays++;
        }
      }
    });

    const totalHours = (totalMinutesWorked / 60).toFixed(1);
    const presentDays = fullDays + shortDays + sundaysWorked;
    const avgDailyMins =
      presentDays > 0 ? Math.round(totalMinutesWorked / presentDays) : 0;
    const avgHoursFormatted = formatMinutesToDuration(avgDailyMins);

    return {
      fullDays,
      shortDays,
      absentDays,
      sundaysOff,
      sundaysWorked,
      totalHours,
      avgHoursFormatted,
      presentDays,
    };
  }, [calendarDays]);

  // Selected employee name
  const currentEmpName = useMemo(() => {
    if (selectedUserId && Array.isArray(allUsers)) {
      const u = allUsers.find((user) => String(user.id) === String(selectedUserId));
      if (u) return u.name || u.email;
    }
    return currentUser?.name || "My Calendar";
  }, [selectedUserId, allUsers, currentUser]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Top Header Card: Month Navigation & Controls */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Month & Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-[#0f2942] hover:shadow-2xs transition active:scale-95 cursor-pointer"
                title="Previous Month"
              >
                <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div className="px-2 sm:px-4 font-bold text-xs sm:text-base text-[#0f2942] min-w-[125px] sm:min-w-[160px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-[#0f2942] hover:shadow-2xs transition active:scale-95 cursor-pointer"
                title="Next Month"
              >
                <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-2xs cursor-pointer"
              >
                Today
              </button>

              {/* Shift standard indicator */}
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-blue-800 shadow-2xs">
                <FiClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 shrink-0" />
                <span>Target: <strong>{TARGET_HOURS_LABEL}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Controls: Employee Switcher (for Admin/BM) & Refresh */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
            {isAdminOrBM && Array.isArray(allUsers) && allUsers.length > 0 && (
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <FiUser className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => onSelectUserId && onSelectUserId(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">👤 My Attendance Calendar</option>
                  <optgroup label="Team Members">
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email} {u.role ? `(${u.role})` : ""}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                <FiRefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-600" : "text-slate-500"}`}
                />
                <span className="hidden sm:inline">Sync Logs</span>
                <span className="sm:hidden">Sync</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly KPI Overview Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
        {/* Full Day Card */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Full Shift
            </span>
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-emerald-900">
            {monthlyStats.fullDays}
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium text-emerald-700 mt-0.5 truncate">
            ≥ 8.30 hrs completed
          </p>
        </div>

        {/* Short Hours Card */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Short Shift
            </span>
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-amber-900">
            {monthlyStats.shortDays}
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium text-amber-700 mt-0.5 truncate">
            &lt; 8.30 hrs worked
          </p>
        </div>

        {/* Absent Card */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Absent Days
            </span>
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-rose-900">
            {monthlyStats.absentDays}
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium text-rose-700 mt-0.5 truncate">
            Working days missed
          </p>
        </div>

        {/* Sunday Off Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-100/70 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Sundays (Off)
            </span>
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-slate-400" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-slate-800">
            {monthlyStats.sundaysOff}
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 mt-0.5 truncate">
            {monthlyStats.sundaysWorked > 0
              ? `+ ${monthlyStats.sundaysWorked} worked`
              : "Standard weekly off"}
          </p>
        </div>

        {/* Total Monthly Hours Card */}
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/60 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Total Hours
            </span>
            <FiClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-blue-950 font-mono">
            {monthlyStats.totalHours} <span className="text-[10px] sm:text-xs font-bold text-blue-700">h</span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium text-blue-700 mt-0.5 truncate">
            Monthly logged hours
          </p>
        </div>

        {/* Daily Average Card */}
        <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/60 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Daily Avg
            </span>
            <FiActivity className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-600" />
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-indigo-950 font-mono">
            {monthlyStats.avgHoursFormatted}
          </div>
          <p className="text-[9px] sm:text-[10px] font-medium text-indigo-700 mt-0.5 truncate">
            Per attended shift
          </p>
        </div>
      </div>

      {/* Visual Color Legend Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px]">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
            Color Guide:
          </span>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4.5">
            {/* Green */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-500 border border-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 text-[11px]">
                Full Day (≥ 8h 30m)
              </span>
            </div>

            {/* Amber */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-amber-400 border border-amber-500 shrink-0" />
              <span className="font-semibold text-slate-700 text-[11px]">
                Half Day (&lt; 8h 30m)
              </span>
            </div>

            {/* Red */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-rose-500 border border-rose-600 shrink-0" />
              <span className="font-semibold text-slate-700 text-[11px]">
                Absent (Working Day)
              </span>
            </div>

            {/* Gray */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-slate-300 border border-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700 text-[11px]">
                Sunday (Off)
              </span>
            </div>

            {/* Sunday Worked */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-100 border-2 border-dashed border-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 text-[11px]">
                Sunday Worked
              </span>
            </div>

            {/* Live Active */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700 text-[11px]">
                Live Session
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Monthly Calendar Grid Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-5 shadow-xs overflow-hidden">
        {/* Weekday Column Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2.5 text-center border-b border-slate-200/80 pb-2.5 mb-2">
          {WEEKDAY_NAMES.map((wd) => (
            <div
              key={wd.full}
              className={`py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider ${
                wd.isWeekend
                  ? "text-rose-600 bg-rose-50/60 rounded-md sm:rounded-lg"
                  : "text-slate-600"
              }`}
            >
              <span className="hidden md:inline">{wd.full}</span>
              <span className="hidden sm:inline md:hidden">{wd.short}</span>
              <span className="sm:hidden">{wd.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar Day Grid (7 columns) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
          {calendarDays.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return (
                <div
                  key={`inactive-${idx}`}
                  className="min-h-[56px] sm:min-h-[115px] rounded-lg sm:rounded-xl border border-dashed border-slate-100 bg-slate-50/30 p-1 sm:p-2 text-slate-300 select-none opacity-40 flex flex-col justify-start items-center sm:items-end"
                >
                  <div className="text-[10px] sm:text-xs font-bold font-mono">
                    {day.dayNum}
                  </div>
                </div>
              );
            }

            const hasRecord = Boolean(day.record);
            const isClickable = hasRecord || day.statusType === "ABSENT" || day.statusType === "SUNDAY_OFF" || day.statusType === "IN_PROGRESS";

            return (
              <div
                key={day.dateStr}
                onClick={() => isClickable && setSelectedDayData(day)}
                className={`group relative flex flex-col justify-between min-h-[56px] sm:min-h-[115px] rounded-lg sm:rounded-xl border p-1 sm:p-2.5 transition-all duration-200 shadow-2xs ${
                  day.bgClasses
                } ${day.borderClasses} ${
                  isClickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95" : ""
                }`}
              >
                {/* Day Header: Day Number & Today indicator */}
                <div className="flex items-center justify-center sm:justify-between w-full">
                  <div className="hidden sm:block">
                    {day.isToday && (
                      <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-2xs">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Number (On mobile, Today is circled with blue) */}
                  <span
                    className={`font-extrabold font-mono transition-transform ${
                      day.isToday
                        ? "flex h-5 w-5 sm:h-auto sm:w-auto items-center justify-center rounded-full sm:rounded-none bg-blue-600 sm:bg-transparent text-white sm:text-blue-700 text-[11px] sm:text-sm shadow-xs sm:shadow-none"
                        : `text-[11px] sm:text-sm ${
                            day.isSunday && !hasRecord
                              ? "text-slate-400"
                              : "text-slate-800"
                          }`
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </div>

                {/* Desktop Day Content (hidden on mobile) */}
                <div className="hidden sm:block my-1.5 space-y-1">
                  {/* Status Badge */}
                  {day.badgeLabel && (
                    <div className="flex items-center justify-start">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold truncate max-w-full ${
                          day.badgeClasses
                        }`}
                        title={day.badgeLabel}
                      >
                        <span className="truncate">{day.badgeLabel}</span>
                      </span>
                    </div>
                  )}

                  {/* Punch In & Punch Out times (if record exists) */}
                  {hasRecord && (
                    <div className="space-y-0.5 text-[10px] font-mono font-semibold">
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="text-[9px] font-bold text-emerald-600">IN</span>
                        <span>{day.inTimeFormatted}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-[9px] font-bold text-rose-500">OUT</span>
                        <span className="truncate">{day.outTimeFormatted}</span>
                      </div>
                    </div>
                  )}

                  {/* Absent message */}
                  {day.statusType === "ABSENT" && (
                    <div className="text-[10px] font-medium text-rose-700 leading-tight">
                      No punch-in recorded
                    </div>
                  )}
                </div>

                {/* Mobile Day Content (visible on mobile only) */}
                <div className="flex sm:hidden flex-col items-center justify-center flex-1 my-0.5 w-full">
                  {hasRecord || day.statusType === "IN_PROGRESS" ? (
                    <div className="flex flex-col items-center justify-center gap-0.5 w-full">
                      <span
                        className={`h-2 w-2 rounded-full ${day.dotColor} ${
                          day.statusType === "IN_PROGRESS" ? "animate-ping" : ""
                        }`}
                      />
                      <span
                        className={`text-[8.5px] font-black font-mono leading-none truncate max-w-full text-center ${
                          day.totalMinutes >= TARGET_WORKING_MINUTES
                            ? "text-emerald-800"
                            : "text-amber-800"
                        }`}
                      >
                        {day.durationFormatted}
                      </span>
                    </div>
                  ) : day.statusType === "ABSENT" ? (
                    <div className="flex flex-col items-center justify-center gap-0.5 w-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span className="text-[8px] font-bold text-rose-700 leading-none">
                        Absent
                      </span>
                    </div>
                  ) : day.statusType === "SUNDAY_OFF" ? (
                    <div className="flex flex-col items-center justify-center gap-0.5 w-full">
                      <span className="text-[8.5px] font-medium text-slate-400 italic leading-none">
                        Off
                      </span>
                    </div>
                  ) : day.statusType === "TODAY_NOT_STARTED" ? (
                    <div className="flex flex-col items-center justify-center gap-0.5 w-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="text-[8px] font-bold text-blue-700 leading-none">
                        Ready
                      </span>
                    </div>
                  ) : (
                    <div className="h-1 w-full" />
                  )}
                </div>

                {/* Desktop Day Footer (hidden on mobile) */}
                <div className="hidden sm:flex items-center justify-between border-t border-black/5 pt-1 text-[10px]">
                  {hasRecord || day.statusType === "IN_PROGRESS" ? (
                    <>
                      <div
                        className={`font-black font-mono text-[11px] ${
                          day.totalMinutes >= TARGET_WORKING_MINUTES
                            ? "text-emerald-800"
                            : "text-amber-800"
                        }`}
                        title={`Logged: ${day.durationFormatted} / Target: ${TARGET_HOURS_LABEL}`}
                      >
                        {day.durationFormatted}
                      </div>

                      {Number(day.distanceKm) > 0 && (
                        <div
                          className="hidden md:flex items-center gap-0.5 text-[9px] font-semibold text-cyan-700 bg-cyan-50 px-1 py-0.2 rounded"
                          title={`Distance: ${day.distanceKm} km`}
                        >
                          <FiCompass className="h-2.5 w-2.5" />
                          <span>{day.distanceKm}k</span>
                        </div>
                      )}
                    </>
                  ) : day.statusType === "SUNDAY_OFF" ? (
                    <span className="text-[10px] text-slate-400 font-medium italic">
                      Off
                    </span>
                  ) : (
                    <span className="text-[10px] text-transparent">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile touch hint */}
        <div className="sm:hidden mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
          <FiInfo className="h-3 w-3 text-blue-500" />
          <span>Tap any day to view complete shift logs & route</span>
        </div>
      </div>

      {/* Selected Day Detail Modal */}
      {selectedDayData && (
        <AttendanceDayModal
          dayData={selectedDayData}
          employeeName={currentEmpName}
          onClose={() => setSelectedDayData(null)}
          onOpenRouteMap={onOpenRouteMap}
        />
      )}
    </div>
  );
}
