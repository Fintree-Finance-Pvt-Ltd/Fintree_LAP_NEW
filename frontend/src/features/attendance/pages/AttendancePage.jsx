import { useEffect, useMemo, useState } from "react";
import {
  FiClock,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiStopCircle,
  FiPlayCircle,
  FiActivity,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import { attendanceApi } from "../attendanceApi.js";

export default function AttendancePage() {
  const { user } = useAuth();
  const {
    isWorkStarted,
    isWorkEnded,
    attendanceRecord,
    setShowStartModal,
    setShowEndModal,
    fetchStatus,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState("my"); // "my" | "all"
  const [loading, setLoading] = useState(true);
  const [myRecords, setMyRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const isAdminOrBM = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return (
      roles.includes("ADMIN") ||
      roles.includes("BM") ||
      roles.includes("OPS_HEAD")
    );
  }, [user?.roles]);

  const loadData = async () => {
    setLoading(true);
    try {
      const myRes = await attendanceApi.getMyHistory(60);
      const myData = myRes?.data?.data || myRes?.data || myRes || [];
      setMyRecords(Array.isArray(myData) ? myData : []);

      if (isAdminOrBM) {
        const allRes = await attendanceApi.getAll({ limit: 100 });
        const allData = allRes?.data?.data || allRes?.data || allRes || [];
        setAllRecords(Array.isArray(allData) ? allData : []);
      }
    } catch (error) {
      console.error("Failed to load attendance logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdminOrBM]);

  const currentRecords = activeTab === "all" ? allRecords : myRecords;

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return currentRecords.filter((item) => {
      const matchSearch =
        !searchTerm ||
        (item.user?.name &&
          item.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.user?.email &&
          item.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.startLocation &&
          item.startLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.endLocation &&
          item.endLocation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDate = !selectedDate || item.date === selectedDate;

      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [currentRecords, searchTerm, selectedDate, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const list = myRecords;
    const totalDays = list.length;
    let totalMins = 0;
    list.forEach((r) => {
      if (r.totalMinutes) totalMins += Number(r.totalMinutes);
    });

    const totalHrs = (totalMins / 60).toFixed(1);
    const avgHrs = totalDays > 0 ? (totalMins / totalDays / 60).toFixed(1) : "0.0";

    return { totalDays, totalHrs, avgHrs };
  }, [myRecords]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Employee",
      "Date",
      "Start Time",
      "Start Location",
      "End Time",
      "End Location",
      "Total Hours",
      "Status",
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.user?.name || user?.name || "User",
      r.date,
      r.startTime ? new Date(r.startTime).toLocaleTimeString() : "-",
      `"${r.startLocation || ""}"`,
      r.endTime ? new Date(r.endTime).toLocaleTimeString() : "-",
      `"${r.endLocation || ""}"`,
      r.totalHours || "-",
      r.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#0f2942]">
                Attendance & Work Tracker
              </h1>
              <p className="text-xs text-slate-500">
                Monitor daily work sessions, punch times, exit logs, and working duration.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start / End Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>

          {!isWorkStarted ? (
            <button
              type="button"
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-500 hover:to-indigo-500 active:scale-95 cursor-pointer"
            >
              <FiPlayCircle className="h-4 w-4" />
              <span>Start Work</span>
            </button>
          ) : !isWorkEnded ? (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-500 hover:to-amber-400 active:scale-95 cursor-pointer"
            >
              <FiStopCircle className="h-4 w-4" />
              <span>End Time & Save</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
              <FiCheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Work Completed Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Status
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FiActivity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                isWorkStarted && !isWorkEnded
                  ? "bg-emerald-100 text-emerald-800"
                  : isWorkEnded
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isWorkStarted && !isWorkEnded
                    ? "bg-emerald-600 animate-pulse"
                    : isWorkEnded
                    ? "bg-blue-600"
                    : "bg-amber-600"
                }`}
              />
              {isWorkStarted && !isWorkEnded
                ? "In Progress"
                : isWorkEnded
                ? "Completed"
                : "Not Started"}
            </span>
            <p className="mt-1 text-xs text-slate-500">
              {attendanceRecord?.startTime
                ? `Punch In: ${formatTime(attendanceRecord.startTime)}`
                : "No punch-in recorded"}
            </p>
          </div>
        </div>

        {/* Total Logged Days */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Days Logged
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FiCalendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0f2942]">{stats.totalDays}</div>
            <p className="text-xs text-slate-500">Attendance sessions</p>
          </div>
        </div>

        {/* Total Hours Worked */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Hours Worked
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FiClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0f2942]">{stats.totalHrs} hrs</div>
            <p className="text-xs text-slate-500">Accumulated work time</p>
          </div>
        </div>

        {/* Average Daily Hours */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avg Daily Hours
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FiCheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0f2942]">{stats.avgHrs} hrs</div>
            <p className="text-xs text-slate-500">Per active day</p>
          </div>
        </div>
      </div>

      {/* Main Attendance Table Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {/* Table Controls & Tabs */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Scope Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "my"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              My Attendance Logs
            </button>

            {isAdminOrBM && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Team Attendance
              </button>
            )}
          </div>

          {/* Search, Filter & Export */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search employee / location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            >
              <FiDownload className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Punch In Time</th>
                <th className="px-5 py-3.5">Start Location</th>
                <th className="px-5 py-3.5">Exit Time</th>
                <th className="px-5 py-3.5">Exit Location</th>
                <th className="px-5 py-3.5">Total Hours</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <FiRefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600 mb-2" />
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <FiCalendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No attendance records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const empName = item.user?.name || user?.name || "User";
                  const empEmail = item.user?.email || user?.email || "";

                  return (
                    <tr
                      key={item.id || index}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4 font-mono font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0f2942]">{empName}</div>
                        <div className="text-[10px] text-slate-400">{empEmail}</div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 font-semibold text-slate-700 whitespace-nowrap">
                        {item.date}
                      </td>

                      {/* Punch In */}
                      <td className="px-5 py-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {formatTime(item.startTime)}
                      </td>

                      {/* Start Location */}
                      <td className="px-5 py-4 max-w-[200px] truncate text-slate-600" title={item.startLocation}>
                        <div className="flex items-center gap-1">
                          <FiMapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{item.startLocation || "Office"}</span>
                        </div>
                      </td>

                      {/* Exit Time */}
                      <td className="px-5 py-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {formatTime(item.endTime)}
                      </td>

                      {/* Exit Location */}
                      <td className="px-5 py-4 max-w-[200px] truncate text-slate-600" title={item.endLocation}>
                        {item.endLocation ? (
                          <div className="flex items-center gap-1">
                            <FiMapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{item.endLocation}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Total Hours */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.totalHours ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                            {item.totalHours}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">In Progress</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            item.status === "COMPLETED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "COMPLETED"
                                ? "bg-blue-600"
                                : "bg-emerald-600 animate-pulse"
                            }`}
                          />
                          {item.status === "COMPLETED"
                            ? "Completed"
                            : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
