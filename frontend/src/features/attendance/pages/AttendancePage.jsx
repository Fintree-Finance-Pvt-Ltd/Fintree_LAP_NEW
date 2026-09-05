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
  FiUsers,
  FiNavigation,
  FiCompass,
  FiEye,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import { attendanceApi } from "../attendanceApi.js";
import RouteMapModal from "../components/RouteMapModal.jsx";
import {
  cleanLocationName,
  reverseGeocodeCoords,
} from "../../../utils/geoUtils.js";

export default function AttendancePage() {
  const { user } = useAuth();
  const {
    isWorkStarted,
    isWorkEnded,
    attendanceRecord,
    currentCoords,
    setShowStartModal,
    setShowEndModal,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [myRecords, setMyRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [geoAddressMap, setGeoAddressMap] = useState({});

  // Normalize User Roles
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

  const isAdminOrBM = useMemo(() => {
    if (user?.email && user.email.toLowerCase().includes("admin")) return true;
    return userRoles.includes("ADMIN");
    // ||
    // userRoles.includes("BM") ||
    // userRoles.includes("OPS_HEAD") ||
    // userRoles.includes("OPS_CHECKER") ||
    // userRoles.includes("OPS_MAKER") ||
    // userRoles.includes("CM") ||
    // userRoles.includes("SUPER_ADMIN")
  }, [userRoles, user?.email]);

  useEffect(() => {
    if (isAdminOrBM) {
      setActiveTab("all");
    } else {
      setActiveTab("my");
    }
  }, [isAdminOrBM]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.allSettled([
        attendanceApi.getMyHistory(100),
        attendanceApi.getAll({ limit: 300 }),
      ]);

      if (myRes.status === "fulfilled") {
        const raw =
          myRes.value?.data?.data ?? myRes.value?.data ?? myRes.value ?? [];
        setMyRecords(Array.isArray(raw) ? raw : []);
      }

      if (allRes.status === "fulfilled") {
        const raw =
          allRes.value?.data?.data ?? allRes.value?.data ?? allRes.value ?? [];
        setAllRecords(Array.isArray(raw) ? raw : []);
      }
    } catch (error) {
      console.error("Failed to load attendance logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Background Reverse Geocoding for displayed records with missing address names
  useEffect(() => {
    const list = [...myRecords, ...allRecords];
    if (!list.length) return;

    let isMounted = true;
    const pendingCoords = [];

    list.forEach((item) => {
      const isItemEnded =
        item.status !== "IN_PROGRESS" &&
        Boolean(
          item.endTime ||
            item.end_time ||
            item.status === "COMPLETED" ||
            item.status === "AUTO_END_WORK" ||
            item.status === "auto_end_work" ||
            item.status === "AUTO_ENDED" ||
            item.status === "END_WORK_HOUR"
        );

      const sLat =
        item.startLatitude ??
        item.start_latitude ??
        item.currentLatitude ??
        item.current_latitude;
      const sLng =
        item.startLongitude ??
        item.start_longitude ??
        item.currentLongitude ??
        item.current_longitude;
      const sLoc = item.startLocation || item.start_location || "";
      if (
        sLat &&
        sLng &&
        (!sLoc ||
          sLoc.includes("° N") ||
          sLoc.includes("° E") ||
          sLoc === "Office Workspace")
      ) {
        pendingCoords.push({ lat: Number(sLat), lng: Number(sLng) });
      }

      // Live location geocoding
      const curLat = item.currentLatitude ?? item.current_latitude;
      const curLng = item.currentLongitude ?? item.current_longitude;
      const curLoc = item.currentLocation || item.current_location || "";
      if (
        curLat &&
        curLng &&
        (!curLoc ||
          curLoc.includes("° N") ||
          curLoc.includes("° E") ||
          curLoc === "Office Workspace")
      ) {
        pendingCoords.push({ lat: Number(curLat), lng: Number(curLng) });
      }

      // End location geocoding - only if ended
      if (isItemEnded) {
        const eLat = item.endLatitude ?? item.end_latitude;
        const eLng = item.endLongitude ?? item.end_longitude;
        const eLoc = item.endLocation || item.end_location || "";
        if (
          eLat &&
          eLng &&
          (!eLoc ||
            eLoc.includes("° N") ||
            eLoc.includes("° E") ||
            eLoc === "Office Workspace")
        ) {
          pendingCoords.push({ lat: Number(eLat), lng: Number(eLng) });
        }
      }
    });

    if (!pendingCoords.length) return;

    const uniqueCoords = Array.from(
      new Set(
        pendingCoords.map((c) => `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`)
      )
    ).map((key) => {
      const [lat, lng] = key.split(",").map(Number);
      return { lat, lng, key };
    });

    Promise.allSettled(
      uniqueCoords.slice(0, 15).map(async ({ lat, lng, key }) => {
        const addr = await reverseGeocodeCoords(lat, lng);
        return { key, addr };
      })
    ).then((results) => {
      if (!isMounted) return;
      const updates = {};
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value?.addr) {
          updates[r.value.key] = r.value.addr;
        }
      });
      if (Object.keys(updates).length > 0) {
        setGeoAddressMap((prev) => ({ ...prev, ...updates }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [myRecords, allRecords]);

  const currentRecords = activeTab === "all" ? allRecords : myRecords;

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return currentRecords.filter((item) => {
      const empName =
        item.user?.name || (item.userId === user?.id ? user?.name : "");
      const empEmail =
        item.user?.email || (item.userId === user?.id ? user?.email : "");
      const isItemEnded =
        item.status !== "IN_PROGRESS" &&
        Boolean(
          item.endTime ||
            item.end_time ||
            item.status === "COMPLETED" ||
            item.status === "AUTO_END_WORK" ||
            item.status === "auto_end_work" ||
            item.status === "AUTO_ENDED" ||
            item.status === "END_WORK_HOUR"
        );

      const startLoc = cleanLocationName(
        item.startLocation || item.start_location || ""
      );
      const endLoc = isItemEnded
        ? cleanLocationName(item.endLocation || item.end_location || "")
        : "";
      const liveLoc = cleanLocationName(
        item.currentLocation || item.current_location || ""
      );
      const startLat = item.startLatitude ?? item.start_latitude;
      const startLng = item.startLongitude ?? item.start_longitude;
      const endLat = isItemEnded
        ? item.endLatitude ?? item.end_latitude
        : null;
      const endLng = isItemEnded
        ? item.endLongitude ?? item.end_longitude
        : null;

      const query = searchTerm.trim().toLowerCase();
      const matchSearch =
        !query ||
        empName.toLowerCase().includes(query) ||
        empEmail.toLowerCase().includes(query) ||
        startLoc.toLowerCase().includes(query) ||
        (isItemEnded && endLoc.toLowerCase().includes(query)) ||
        liveLoc.toLowerCase().includes(query) ||
        (startLat !== undefined &&
          startLat !== null &&
          String(startLat).includes(query)) ||
        (startLng !== undefined &&
          startLng !== null &&
          String(startLng).includes(query)) ||
        (isItemEnded &&
          endLat !== undefined &&
          endLat !== null &&
          String(endLat).includes(query)) ||
        (isItemEnded &&
          endLng !== undefined &&
          endLng !== null &&
          String(endLng).includes(query)) ||
        String(item.date).includes(query);

      const matchDate = !selectedDate || item.date === selectedDate;

      const matchStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter ||
        (statusFilter === "AUTO_END_WORK" &&
          (item.status === "AUTO_END_WORK" ||
            item.status === "auto_end_work" ||
            item.status === "AUTO_ENDED" ||
            item.status === "END_WORK_HOUR"));

      return matchSearch && matchDate && matchStatus;
    });
  }, [currentRecords, searchTerm, selectedDate, statusFilter, user]);

  // Metrics
  const stats = useMemo(() => {
    const list = activeTab === "all" ? allRecords : myRecords;
    const totalCount = list.length;
    let totalMins = 0;
    let totalDist = 0;

    list.forEach((r) => {
      if (r.totalMinutes) totalMins += Number(r.totalMinutes);
      if (r.totalDistanceKm) totalDist += Number(r.totalDistanceKm);
    });

    const totalHrs = (totalMins / 60).toFixed(1);
    const avgHrs =
      totalCount > 0 ? (totalMins / totalCount / 60).toFixed(1) : "0.0";
    const totalKm = totalDist.toFixed(1);

    return { totalCount, totalHrs, avgHrs, totalKm };
  }, [activeTab, allRecords, myRecords]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Employee Name",
      "Email",
      "Date",
      "Punch In Time",
      "Start Location Name",
      "Start Latitude",
      "Start Longitude",
      "Start Coordinates",
      "Live Location Name",
      "Live Latitude",
      "Live Longitude",
      "Punch Out Time",
      "End Location Name",
      "End Latitude",
      "End Longitude",
      "End Coordinates",
      "Distance (KM)",
      "Total Hours",
      "Status",
    ];

    const rows = filteredRecords.map((r) => {
      const isRecordEnded =
        r.status !== "IN_PROGRESS" &&
        Boolean(
          r.endTime ||
            r.end_time ||
            r.status === "COMPLETED" ||
            r.status === "AUTO_END_WORK" ||
            r.status === "auto_end_work" ||
            r.status === "AUTO_ENDED" ||
            r.status === "END_WORK_HOUR"
        );

      const startLat = r.startLatitude ?? r.start_latitude ?? "";
      const startLng = r.startLongitude ?? r.start_longitude ?? "";
      const sKey = startLat && startLng ? `${Number(startLat).toFixed(3)},${Number(startLng).toFixed(3)}` : "";
      const startLocName = geoAddressMap[sKey] || cleanLocationName(r.startLocation || r.start_location, "Office Workspace");

      const liveLat = r.currentLatitude ?? r.current_latitude ?? startLat;
      const liveLng = r.currentLongitude ?? r.current_longitude ?? startLng;
      const lKey = liveLat && liveLng ? `${Number(liveLat).toFixed(3)},${Number(liveLng).toFixed(3)}` : "";
      const liveLocName = geoAddressMap[lKey] || cleanLocationName(r.currentLocation || r.current_location, "Active Movement");

      const endLat = isRecordEnded ? (r.endLatitude ?? r.end_latitude ?? "") : "";
      const endLng = isRecordEnded ? (r.endLongitude ?? r.end_longitude ?? "") : "";
      const eKey = endLat && endLng ? `${Number(endLat).toFixed(3)},${Number(endLng).toFixed(3)}` : "";
      const endLocName = isRecordEnded
        ? (geoAddressMap[eKey] || cleanLocationName(r.endLocation || r.end_location, "Office Workspace"))
        : "-";

      return [
        r.id,
        `"${r.user?.name || (r.userId === user?.id ? user?.name : "Employee #" + r.userId)}"`,
        `"${r.user?.email || (r.userId === user?.id ? user?.email : "")}"`,
        r.date,
        r.startTime ? new Date(r.startTime).toLocaleTimeString() : "-",
        `"${startLocName}"`,
        startLat || "-",
        startLng || "-",
        startLat && startLng ? `"${startLat}, ${startLng}"` : "-",
        `"${liveLocName}"`,
        liveLat || "-",
        liveLng || "-",
        isRecordEnded && r.endTime ? new Date(r.endTime).toLocaleTimeString() : "In Progress",
        `"${endLocName}"`,
        endLat || "-",
        endLng || "-",
        endLat && endLng ? `"${endLat}, ${endLng}"` : "-",
        r.totalDistanceKm || r.total_distance_km || "0.0",
        `"${r.totalHours || r.total_hours || "In Progress"}"`,
        r.status,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `lap_attendance_routes_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const safeFormatTime = (dateString) => {
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

  const formatTime = safeFormatTime;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
              <FiClock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0f2942]">
                Attendance & GPS Route Tracker
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time continuous GPS tracking, travel distance, movement
                route trails, and work duration.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start / End Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live GPS Beacon indicator */}
          {isWorkStarted && !isWorkEnded && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/90 px-3 py-2 text-xs font-bold text-emerald-800 shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>GPS Live Tracking Active</span>
            </div>
          )}

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
            />
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
              <span>End Time & Stop GPS</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
              <FiCheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Work Completed</span>
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
              My Today Status
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
                ? "In Progress (Tracking)"
                : isWorkEnded
                  ? "Completed"
                  : "Not Started"}
            </span>
            <p className="mt-1 text-xs text-slate-500">
              {attendanceRecord?.startTime
                ? `In: ${formatTime(attendanceRecord.startTime)}`
                : "No check-in yet"}
            </p>
          </div>
        </div>

        {/* Total Records Logged */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {activeTab === "all" ? "Total Team Logs" : "My Logged Days"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FiUsers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0f2942]">
              {stats.totalCount}
            </div>
            <p className="text-xs text-slate-500">Attendance sessions</p>
          </div>
        </div>

        {/* Total Working Hours */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Hours Logged
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FiClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0f2942]">
              {stats.totalHrs} hrs
            </div>
            <p className="text-xs text-slate-500">Cumulative duration</p>
          </div>
        </div>

        {/* Total Distance Traveled */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Distance Covered
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <FiCompass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-700">
              {stats.totalKm} km
            </div>
            <p className="text-xs text-slate-500">GPS tracked distance</p>
          </div>
        </div>
      </div>

      {/* Main Attendance Table Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Controls & Tabs */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50">
          {/* Scope Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "my"
                  ? "bg-[#0f2942] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FiUser className="h-3.5 w-3.5" />
                <span>My Attendance Logs ({myRecords.length})</span>
              </div>
            </button>

            {isAdminOrBM && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#0f2942] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FiUsers className="h-3.5 w-3.5" />
                  <span>All Team Attendance ({allRecords.length})</span>
                </div>
              </button>
            )}
          </div>

          {/* Search, Filter & Export */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search employee / location / date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="AUTO_END_WORK">auto_end_work</option>
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            >
              <FiDownload className="h-3.5 w-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Punch In Time</th>
                <th className="px-4 py-3.5">Start Location Name</th>
                <th className="px-4 py-3.5">Start Lat / Long</th>
                <th className="px-4 py-3.5">Live Location Name</th>
                <th className="px-4 py-3.5">Punch Out Time</th>
                <th className="px-4 py-3.5">End Location Name</th>
                <th className="px-4 py-3.5">End Lat / Long</th>
                <th className="px-4 py-3.5">Distance</th>
                <th className="px-4 py-3.5">Total Hours</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Route Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="14" className="py-12 text-center text-slate-400">
                    <FiRefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600 mb-2" />
                    Loading attendance records & route data...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="14" className="py-12 text-center text-slate-400">
                    <FiCalendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No attendance records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const empName =
                    item.user?.name ||
                    (item.userId === user?.id
                      ? user?.name
                      : `Employee #${item.userId || item.id}`);
                  const empEmail =
                    item.user?.email ||
                    (item.userId === user?.id ? user?.email : "");
                  const empLocation = item.user?.location || "";
                  const isLive = item.status === "IN_PROGRESS";
                  const startTimeStr = safeFormatTime(
                    item.startTime || item.start_time
                  );
                  const endTimeStr = safeFormatTime(
                    item.endTime || item.end_time
                  );

                  const startLat =
                    item.startLatitude ??
                    item.start_latitude ??
                    item.currentLatitude ??
                    item.current_latitude ??
                    item.endLatitude ??
                    item.end_latitude;
                  const startLng =
                    item.startLongitude ??
                    item.start_longitude ??
                    item.currentLongitude ??
                    item.current_longitude ??
                    item.endLongitude ??
                    item.end_longitude;
                  const sKey =
                    startLat && startLng
                      ? `${Number(startLat).toFixed(3)},${Number(startLng).toFixed(3)}`
                      : "";
                  const startLoc =
                    geoAddressMap[sKey] ||
                    cleanLocationName(
                      item.startLocation || item.start_location,
                      item.endLocation || item.currentLocation || "Office Workspace"
                    );

                  const liveLat =
                    item.currentLatitude ?? item.current_latitude ?? startLat;
                  const liveLng =
                    item.currentLongitude ?? item.current_longitude ?? startLng;
                  const lKey =
                    liveLat && liveLng
                      ? `${Number(liveLat).toFixed(3)},${Number(liveLng).toFixed(3)}`
                      : "";
                  const liveLoc =
                    geoAddressMap[lKey] ||
                    cleanLocationName(
                      item.currentLocation || item.current_location,
                      isLive ? "Active Movement" : "-"
                    );

                  const isEnded =
                    !isLive &&
                    Boolean(
                      item.endTime ||
                        item.end_time ||
                        item.status === "COMPLETED" ||
                        item.status === "AUTO_END_WORK" ||
                        item.status === "auto_end_work" ||
                        item.status === "AUTO_ENDED" ||
                        item.status === "END_WORK_HOUR"
                    );

                  const endLat = isEnded
                    ? item.endLatitude ?? item.end_latitude ?? null
                    : null;
                  const endLng = isEnded
                    ? item.endLongitude ?? item.end_longitude ?? null
                    : null;
                  const eKey =
                    endLat && endLng
                      ? `${Number(endLat).toFixed(3)},${Number(endLng).toFixed(3)}`
                      : "";
                  const endLoc = isEnded
                    ? geoAddressMap[eKey] ||
                      cleanLocationName(
                        item.endLocation || item.end_location,
                        "Office Workspace"
                      )
                    : null;

                  const totalHrs = item.totalHours || item.total_hours;
                  const distKm = item.totalDistanceKm || item.total_distance_km;

                  return (
                    <tr
                      key={item.id || index}
                      className="transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-4 py-4 font-mono font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-[#0f2942] flex items-center gap-1.5">
                          <span>{empName}</span>
                          {empLocation && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {empLocation}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {empEmail}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 font-semibold text-slate-700 whitespace-nowrap">
                        {item.date}
                      </td>

                      {/* Punch In */}
                      <td className="px-4 py-4 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                          <span>{startTimeStr}</span>
                        </div>
                      </td>

                      {/* Start Location Name */}
                      <td className="px-4 py-4 max-w-[250px] text-slate-700">
                        <div
                          className="flex items-center gap-1.5 "
                          title={startLoc}
                        >
                          <FiMapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className=" font-medium">{startLoc}</span>
                        </div>
                      </td>

                      {/* Start Lat / Long */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {startLat && startLng ? (
                          <div
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-slate-700 border border-slate-200/80 font-mono"
                            title={`Start GPS: ${Number(startLat).toFixed(6)}, ${Number(startLng).toFixed(6)}`}
                          >
                            <span className="text-emerald-600 font-bold text-[10px]">📍</span>
                            <span>
                              {Number(startLat).toFixed(4)}, {Number(startLng).toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">-</span>
                        )}
                      </td>

                      {/* Live Location Name */}
                      <td className="px-4 py-4 max-w-[190px] text-slate-700">
                        {isLive ? (
                          <div
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-emerald-800 font-semibold truncate max-w-full"
                            title={`Live Coords: ${liveLat ? `${Number(liveLat).toFixed(4)}, ${Number(liveLng).toFixed(4)}` : "Tracking"} | Location: ${liveLoc}`}
                          >
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className=" font-medium">{liveLoc || "Active Movement"}</span>
                          </div>
                        ) : liveLoc && liveLoc !== "-" ? (
                          <div className="flex items-center gap-1.5  text-slate-600" title={liveLoc}>
                            <span className="text-slate-400">📡</span>
                            <span className="">{liveLoc}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">-</span>
                        )}
                      </td>

                      {/* Punch Out / Work End Time */}
                      <td className="px-4 py-4 font-mono font-semibold whitespace-nowrap">
                        {item.endTime || item.end_time ? (
                          <div className="flex items-center gap-1 text-rose-700">
                            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                            <span>{endTimeStr}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            In Progress
                          </span>
                        )}
                      </td>

                      {/* End Location Name */}
                      <td className="px-4 py-4 max-w-[180px] text-slate-700">
                        {endLoc ? (
                          <div
                            className="flex items-center gap-1.5"
                            title={endLoc}
                          >
                            <FiMapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span className=" font-medium">{endLoc}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* End Lat / Long */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {endLat && endLng ? (
                          <div
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 border font-mono ${
                              isLive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                : "bg-slate-100 text-slate-700 border border-slate-200/80"
                            }`}
                            title={`${isLive ? "Live Tracking Coords" : "Exit Coords"}: ${Number(endLat).toFixed(6)}, ${Number(endLng).toFixed(6)}`}
                          >
                            {/* <span className="text-[10px]">{isLive ? "📡" : "🏁"}</span> */}
                             <span className="text-emerald-600 font-bold text-[10px]">📍</span>
                            <span>
                              {Number(endLat).toFixed(4)}, {Number(endLng).toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">-</span>
                        )}
                      </td>

                      {/* Distance */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono font-semibold text-slate-700">
                        {distKm ? (
                          <span className="text-cyan-700 bg-cyan-50 border border-cyan-200/60 px-2 py-0.5 rounded-md">
                            {distKm} km
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">
                            0.0 km
                          </span>
                        )}
                      </td>

                      {/* Total Hours */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {totalHrs ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                            {totalHrs}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-[11px]">
                            In Progress
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {item.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            Completed
                          </span>
                        ) : item.status === "AUTO_END_WORK" ||
                          item.status === "auto_end_work" ||
                          item.status === "AUTO_ENDED" ||
                          item.status === "END_WORK_HOUR" ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs font-mono"
                            title="Automatically ended at 10:00 PM"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            auto_end_work
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live Active
                          </span>
                        )}
                      </td>

                      {/* View Route Map Action */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRouteId(item.id)}
                          className="flex items-center gap-1.5 mx-auto rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer active:scale-95"
                          title="View GPS Route & Waypoint Map"
                        >
                          <FiNavigation className="h-3.5 w-3.5 text-blue-600" />
                          <span>View Route</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Route Map Modal */}
      {selectedRouteId && (
        <RouteMapModal
          attendanceId={selectedRouteId}
          onClose={() => setSelectedRouteId(null)}
        />
      )}
    </div>
  );
}
