import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiCopy,
  FiDownload,
  FiFilter,
  FiMapPin,
  FiNavigation,
  FiPlayCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStopCircle,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import {
  calculateRecordDuration,
  TARGET_HOURS_LABEL,
  TARGET_WORKING_MINUTES,
} from "../../../utils/attendanceUtils.js";
import {
  cleanLocationName,
  reverseGeocodeCoords,
} from "../../../utils/geoUtils.js";
import ApplyLeaveModal from "../../leaves/components/ApplyLeaveModal.jsx";
import { attendanceApi } from "../attendanceApi.js";
import AttendanceCalendar from "../components/AttendanceCalendar.jsx";
import RouteMapModal from "../components/RouteMapModal.jsx";

export default function AttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isWorkStarted,
    isWorkEnded,
    attendanceRecord,
    setShowStartModal,
    setShowEndModal,
  } = useAttendance();

  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "table"
  const [selectedCalendarUserId, setSelectedCalendarUserId] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [myRecords, setMyRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [geoAddressMap, setGeoAddressMap] = useState({});
  const [copiedCoord, setCopiedCoord] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live ticking clock for IST time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          item.status === "END_WORK_HOUR",
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
        pendingCoords.map((c) => `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`),
      ),
    ).map((key) => {
      const [lat, lng] = key.split(",").map(Number);
      return { lat, lng, key };
    });

    Promise.allSettled(
      uniqueCoords.slice(0, 15).map(async ({ lat, lng, key }) => {
        const addr = await reverseGeocodeCoords(lat, lng);
        return { key, addr };
      }),
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

  // Distinct users list for the Calendar dropdown
  const distinctUsers = useMemo(() => {
    const map = new Map();
    if (user?.id) {
      map.set(String(user.id), {
        id: user.id,
        name: user.name ? `${user.name} (Me)` : "Me",
        email: user.email || "",
        role: "You",
      });
    }
    allRecords.forEach((r) => {
      const uid = r.userId || r.user?.id;
      if (uid && !map.has(String(uid))) {
        map.set(String(uid), {
          id: uid,
          name: r.user?.name || `Employee #${uid}`,
          email: r.user?.email || "",
          location: r.user?.location || "",
          role: r.user?.role || "",
        });
      }
    });
    return Array.from(map.values());
  }, [allRecords, user]);

  // Calendar Records for the selected employee
  const calendarRecords = useMemo(() => {
    if (
      !selectedCalendarUserId ||
      String(selectedCalendarUserId) === String(user?.id)
    ) {
      return myRecords;
    }
    return allRecords.filter(
      (r) => String(r.userId || r.user?.id) === String(selectedCalendarUserId),
    );
  }, [selectedCalendarUserId, myRecords, allRecords, user]);

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
          item.status === "END_WORK_HOUR",
        );

      const startLoc = cleanLocationName(
        item.startLocation || item.start_location || "",
      );
      const endLoc = isItemEnded
        ? cleanLocationName(item.endLocation || item.end_location || "")
        : "";
      const liveLoc = cleanLocationName(
        item.currentLocation || item.current_location || "",
      );
      const startLat = item.startLatitude ?? item.start_latitude;
      const startLng = item.startLongitude ?? item.start_longitude;
      const endLat = isItemEnded
        ? (item.endLatitude ?? item.end_latitude)
        : null;
      const endLng = isItemEnded
        ? (item.endLongitude ?? item.end_longitude)
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
    let fullShiftsCount = 0;
    let activeSessionsCount = 0;

    list.forEach((r) => {
      const dur = calculateRecordDuration(r);
      if (dur.totalMinutes) {
        totalMins += Number(dur.totalMinutes);
        if (dur.totalMinutes >= TARGET_WORKING_MINUTES) {
          fullShiftsCount++;
        }
      }
      if (r.status === "IN_PROGRESS") {
        activeSessionsCount++;
      }
      if (r.totalDistanceKm || r.total_distance_km) {
        totalDist += Number(r.totalDistanceKm || r.total_distance_km || 0);
      }
    });

    const totalHrs = (totalMins / 60).toFixed(1);
    const avgHrs =
      totalCount > 0 ? (totalMins / totalCount / 60).toFixed(1) : "0.0";
    const totalKm = totalDist.toFixed(1);

    return {
      totalCount,
      totalHrs,
      avgHrs,
      totalKm,
      fullShiftsCount,
      activeSessionsCount,
    };
  }, [activeTab, allRecords, myRecords]);

  // Copy coordinates helper
  const handleCopyCoords = (coords) => {
    if (!coords) return;
    navigator.clipboard?.writeText(coords);
    setCopiedCoord(coords);
    setTimeout(() => setCopiedCoord(null), 2000);
  };

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
          r.status === "END_WORK_HOUR",
        );

      const startLat = r.startLatitude ?? r.start_latitude ?? "";
      const startLng = r.startLongitude ?? r.start_longitude ?? "";
      const sKey =
        startLat && startLng
          ? `${Number(startLat).toFixed(3)},${Number(startLng).toFixed(3)}`
          : "";
      const startLocName =
        geoAddressMap[sKey] ||
        cleanLocationName(
          r.startLocation || r.start_location,
          "Office Workspace",
        );

      const liveLat = r.currentLatitude ?? r.current_latitude ?? startLat;
      const liveLng = r.currentLongitude ?? r.current_longitude ?? startLng;
      const lKey =
        liveLat && liveLng
          ? `${Number(liveLat).toFixed(3)},${Number(liveLng).toFixed(3)}`
          : "";
      const liveLocName =
        geoAddressMap[lKey] ||
        cleanLocationName(
          r.currentLocation || r.current_location,
          "Active Movement",
        );

      const endLat = isRecordEnded
        ? (r.endLatitude ?? r.end_latitude ?? "")
        : "";
      const endLng = isRecordEnded
        ? (r.endLongitude ?? r.end_longitude ?? "")
        : "";
      const eKey =
        endLat && endLng
          ? `${Number(endLat).toFixed(3)},${Number(endLng).toFixed(3)}`
          : "";
      const endLocName = isRecordEnded
        ? geoAddressMap[eKey] ||
          cleanLocationName(r.endLocation || r.end_location, "Office Workspace")
        : "-";

      const durInfo = calculateRecordDuration(r);

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
        isRecordEnded && r.endTime
          ? new Date(r.endTime).toLocaleTimeString()
          : "In Progress",
        `"${endLocName}"`,
        endLat || "-",
        endLng || "-",
        endLat && endLng ? `"${endLat}, ${endLng}"` : "-",
        r.totalDistanceKm || r.total_distance_km || "0.0",
        `"${durInfo.formattedDuration || "In Progress"}"`,
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
      `lap_attendance_routes_${new Date().toISOString().slice(0, 10)}.csv`,
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

  // Helper to generate initials avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const istTimeString = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const istDateString = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 animate-fadeIn max-w-[1700px] mx-auto px-1 sm:px-2 md:px-4">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#0f2942] via-[#13385c] to-[#0c2338] p-4 sm:p-6 md:p-7 text-white shadow-xl shadow-slate-900/10">
        {/* Subtle Background Geometric Glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand & Module Identity */}
          <div className="space-y-2">
            {/* <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-300 border border-blue-400/30 backdrop-blur-md">
                <FiClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" />
                Fintree Attendance & Field GPS
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-slate-300 border border-white/10">
                Target: <strong className="text-white font-mono">{TARGET_HOURS_LABEL}</strong>
              </span>
            </div> */}

            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Attendance & GPS Route Hub
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 max-w-2xl mt-0.5 sm:mt-1 leading-relaxed">
                Real-time continuous GPS tracking, travel distance calculation,
                live route trails, and shift compliance.
              </p>
            </div>
          </div>

          {/* Right Side: Real-time IST Digital Clock & Live Status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Live IST Digital Clock Card */}
            <div className="flex flex-1 sm:flex-initial items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-inner">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <FiClock className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-cyan-300" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  {istDateString}
                </div>
                <div className="text-sm sm:text-base md:text-lg font-black font-mono tracking-tight text-cyan-300">
                  {istTimeString}
                </div>
              </div>
            </div>

            {/* GPS Tracking Badge / Status Banner */}
            {isWorkStarted && !isWorkEnded ? (
              <div className="flex flex-1 sm:flex-initial items-center gap-2 rounded-xl sm:rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-emerald-200 backdrop-blur-md shadow-lg shadow-emerald-950/20 animate-pulse">
                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-400"></span>
                </span>
                <div>
                  <div className="leading-tight text-[11px] sm:text-xs">
                    Live GPS Active
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-normal text-emerald-300/80">
                    Continuous tracking
                  </div>
                </div>
              </div>
            ) : isWorkEnded ? (
              <div className="flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-blue-400/30 bg-blue-500/15 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-blue-200 backdrop-blur-md">
                <FiCheckCircle className="h-4 w-4 text-blue-300 shrink-0" />
                <span>Shift Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-amber-200 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span>Ready to Punch In</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Quick Action Strip */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-t border-white/10 pt-3 sm:pt-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {!isWorkStarted ? (
              <button
                type="button"
                onClick={() => setShowStartModal(true)}
                className="group flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-400 hover:to-indigo-500 hover:shadow-blue-500/50 active:scale-95 cursor-pointer"
              >
                <FiPlayCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Punch In / Start Work</span>
              </button>
            ) : !isWorkEnded ? (
              <button
                type="button"
                onClick={() => setShowEndModal(true)}
                className="group flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-red-500 hover:shadow-amber-500/50 active:scale-95 cursor-pointer"
              >
                <FiStopCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Punch Out & Stop GPS</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300">
                <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Work Saved</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsApplyLeaveModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-400/40 bg-purple-500/20 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-purple-200 shadow-sm transition hover:bg-purple-500/30 hover:border-purple-400/60 active:scale-95 cursor-pointer"
              title="Apply for Leave"
            >
              <FiPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-300" />
              <span>Apply Leave</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/leave-management")}
              className="hidden xs:flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-slate-200 shadow-sm transition hover:bg-white/20 active:scale-95 cursor-pointer"
              title="Open Leave Management Portal"
            >
              <FiCalendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300" />
              <span>Leave System</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-slate-200 shadow-sm transition hover:bg-white/20 active:scale-95 cursor-pointer"
            >
              <FiRefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-300" : "text-slate-300"}`}
              />
              <span className="hidden xs:inline">
                {loading ? "Syncing..." : "Sync Logs"}
              </span>
              <span className="xs:hidden">Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "calendar"
                ? "bg-[#0f2942] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60"
            }`}
          >
            <FiCalendar
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${viewMode === "calendar" ? "text-cyan-300" : "text-slate-500"}`}
            />
            <span className="truncate">Calendar View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-[#0f2942] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60"
            }`}
          >
            <FiUsers
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${viewMode === "table" ? "text-indigo-300" : "text-slate-500"}`}
            />
            <span className="truncate">Table Logs</span>
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] sm:text-xs text-slate-500 font-medium px-2">
          {viewMode === "calendar" ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Monthly view with shift duration</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              <span>
                Showing <strong>{filteredRecords.length}</strong> records
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "calendar" ? (
        <AttendanceCalendar
          records={calendarRecords}
          allUsers={distinctUsers}
          selectedUserId={selectedCalendarUserId}
          onSelectUserId={setSelectedCalendarUserId}
          isAdminOrBM={isAdminOrBM}
          currentUser={user}
          onOpenRouteMap={setSelectedRouteId}
          isLoading={loading}
          onRefresh={loadData}
        />
      ) : (
        <>
          {/* Executive Summary Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
            {/* Today's Status Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Today's Status
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FiActivity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold truncate max-w-full ${
                    isWorkStarted && !isWorkEnded
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : isWorkEnded
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0 ${
                      isWorkStarted && !isWorkEnded
                        ? "bg-emerald-600 animate-pulse"
                        : isWorkEnded
                          ? "bg-blue-600"
                          : "bg-amber-600"
                    }`}
                  />
                  <span className="truncate">
                    {isWorkStarted && !isWorkEnded
                      ? "In Progress (Live GPS)"
                      : isWorkEnded
                        ? "Shift Done"
                        : "Not Started"}
                  </span>
                </span>
                <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                  {attendanceRecord?.startTime
                    ? `In: ${safeFormatTime(attendanceRecord.startTime)}`
                    : "No check-in yet"}
                </p>
              </div>
            </div>

            {/* Total Records Logged */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {activeTab === "all" ? "Team Total" : "My Logged Days"}
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <FiUsers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f2942] font-mono">
                  {stats.totalCount}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                    {stats.fullShiftsCount} full
                  </span>
                  {stats.activeSessionsCount > 0 && (
                    <span className="text-blue-700 font-semibold bg-blue-50 px-1 py-0.2 rounded border border-blue-200/60">
                      {stats.activeSessionsCount} active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total Working Hours */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Hours
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <FiClock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-900 font-mono">
                  <span>{stats.totalHrs}</span>
                  <span className="text-xs font-bold text-emerald-700">
                    hrs
                  </span>
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500 truncate">
                  Avg:{" "}
                  <strong className="text-slate-700">{stats.avgHrs}h</strong> /
                  shift
                </p>
              </div>
            </div>

            {/* Total Distance Traveled */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Travel
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <FiCompass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-cyan-800 font-mono">
                  <span>
                  {stats.totalKm}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-cyan-600">
                    km
                  </span>
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500 truncate">
                  GPS distance
                </p>
              </div>
            </div>
          </div>

          {/* Main Attendance Records Section */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            {/* Table Controls, Scope Tabs & Filters */}
            <div className="flex flex-col gap-3 sm:gap-4 border-b border-slate-200/80 p-3.5 sm:p-5 bg-slate-50/70">
              {/* Scope Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("my")}
                  className={`flex-1 sm:flex-initial rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer text-center ${
                    activeTab === "my"
                      ? "bg-[#0f2942] text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <FiUser className="h-3.5 w-3.5" />
                    <span>My Logs ({myRecords.length})</span>
                  </div>
                </button>

                {isAdminOrBM && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 sm:flex-initial rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer text-center ${
                      activeTab === "all"
                        ? "bg-[#0f2942] text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <FiUsers className="h-3.5 w-3.5" />
                      <span>All Team ({allRecords.length})</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Search, Filter Presets & Export */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Search Input with Clear Button */}
                <div className="relative w-full sm:w-auto sm:min-w-[220px] flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search employee / location / coords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Date Filter */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    title="Filter by Specific Date"
                  />

                  {/* Status Select */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="IN_PROGRESS">🟢 Live</option>
                    <option value="COMPLETED">🔵 Completed</option>
                    <option value="AUTO_END_WORK">🟠 auto_end_work</option>
                  </select>

                  {/* Quick Reset if filters active */}
                  {(searchTerm || selectedDate || statusFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedDate("");
                        setStatusFilter("ALL");
                      }}
                      className="flex items-center gap-1 rounded-xl bg-slate-200/80 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition shrink-0 cursor-pointer"
                      title="Reset All Filters"
                    >
                      <FiX className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 cursor-pointer"
                >
                  <FiDownload className="h-3.5 w-3.5 text-blue-600" />
                  <span>Export CSV ({filteredRecords.length})</span>
                </button>
              </div>
            </div>

            {/* Mobile View: Dedicated Modern Card List (< 1024px) */}
            <div className="block lg:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <FiRefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
                  <span className="font-semibold text-xs text-slate-700 block">
                    Loading logs...
                  </span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FiCalendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <span className="font-bold text-slate-700 text-xs block">
                    No attendance logs found
                  </span>
                </div>
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
                    item.startTime || item.start_time,
                  );
                  const endTimeStr = safeFormatTime(
                    item.endTime || item.end_time,
                  );

                  const startLat =
                    item.startLatitude ??
                    item.start_latitude ??
                    item.currentLatitude ??
                    item.current_latitude;
                  const startLng =
                    item.startLongitude ??
                    item.start_longitude ??
                    item.currentLongitude ??
                    item.current_longitude;
                  const sKey =
                    startLat && startLng
                      ? `${Number(startLat).toFixed(3)},${Number(startLng).toFixed(3)}`
                      : "";
                  const startLoc =
                    geoAddressMap[sKey] ||
                    cleanLocationName(
                      item.startLocation || item.start_location,
                      "Office Workspace",
                    );

                  const endLat = item.endLatitude ?? item.end_latitude;
                  const endLng = item.endLongitude ?? item.end_longitude;
                  const eKey =
                    endLat && endLng
                      ? `${Number(endLat).toFixed(3)},${Number(endLng).toFixed(3)}`
                      : "";
                  const endLoc =
                    geoAddressMap[eKey] ||
                    cleanLocationName(
                      item.endLocation || item.end_location,
                      "Office Workspace",
                    );

                  const durInfo = calculateRecordDuration(item);
                  const isFullShift =
                    durInfo.totalMinutes >= TARGET_WORKING_MINUTES;
                  const totalHrs = isLive
                    ? "In Progress"
                    : durInfo.formattedDuration;
                  const distKm = item.totalDistanceKm || item.total_distance_km;

                  return (
                    <div
                      key={item.id || index}
                      className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3 transition hover:shadow-md"
                    >
                      {/* Top Row: User Avatar + Name + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
                            {getInitials(empName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#0f2942] text-xs sm:text-sm truncate flex items-center gap-1.5">
                              <span className="truncate">{empName}</span>
                              {empLocation && (
                                <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                  {empLocation}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {empEmail}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {item.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              Completed
                            </span>
                          ) : item.status === "AUTO_END_WORK" ||
                            item.status === "auto_end_work" ||
                            item.status === "AUTO_ENDED" ||
                            item.status === "END_WORK_HOUR" ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              auto_end
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Live Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date & Shift Summary Pill Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {distKm && (
                            <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-mono">
                              {distKm} km
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${
                              isFullShift
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {totalHrs}
                          </span>
                        </div>
                      </div>

                      {/* Timeline: Punch In & Punch Out */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Punch In */}
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 space-y-1">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>IN: {startTimeStr}</span>
                          </div>
                          <div className="flex items-start gap-1 text-[10px] text-slate-600">
                            <FiMapPin className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2" title={startLoc}>
                              {startLoc}
                            </span>
                          </div>
                        </div>

                        {/* Punch Out */}
                        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-2.5 space-y-1">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>OUT: {endTimeStr || "In Progress"}</span>
                          </div>
                          <div className="flex items-start gap-1 text-[10px] text-slate-600">
                            <FiMapPin className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2" title={endLoc}>
                              {endLoc || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Route Action Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedRouteId(item.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                      >
                        <FiNavigation className="h-3.5 w-3.5" />
                        <span>View GPS Route & Waypoint Trail</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= 1024px) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5">#</th>
                    <th className="px-4 py-3.5 min-w-[190px]">Employee</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Punch In</th>
                    <th className="px-4 py-3.5 min-w-[180px]">
                      Start Location
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Start GPS</th>
                    <th className="px-4 py-3.5 min-w-[180px]">
                      Live / Last Location
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Punch Out</th>
                    <th className="px-4 py-3.5 min-w-[180px]">End Location</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">End GPS</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">
                      Distance
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      Total Duration
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">
                      Status
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="14"
                        className="py-16 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FiRefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-1" />
                          <span className="font-semibold text-slate-700">
                            Loading attendance & GPS logs...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="14"
                        className="py-16 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-1">
                            <FiCalendar className="h-6 w-6" />
                          </div>
                          <span className="font-bold text-slate-700 text-sm">
                            No attendance records found
                          </span>
                        </div>
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
                        item.startTime || item.start_time,
                      );
                      const endTimeStr = safeFormatTime(
                        item.endTime || item.end_time,
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
                          item.endLocation ||
                            item.currentLocation ||
                            "Office Workspace",
                        );

                      const liveLat =
                        item.currentLatitude ??
                        item.current_latitude ??
                        startLat;
                      const liveLng =
                        item.currentLongitude ??
                        item.current_longitude ??
                        startLng;
                      const lKey =
                        liveLat && liveLng
                          ? `${Number(liveLat).toFixed(3)},${Number(liveLng).toFixed(3)}`
                          : "";
                      const liveLoc =
                        geoAddressMap[lKey] ||
                        cleanLocationName(
                          item.currentLocation || item.current_location,
                          isLive ? "Active Movement" : "-",
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
                          item.status === "END_WORK_HOUR",
                        );

                      const endLat = isEnded
                        ? (item.endLatitude ?? item.end_latitude ?? null)
                        : null;
                      const endLng = isEnded
                        ? (item.endLongitude ?? item.end_longitude ?? null)
                        : null;
                      const eKey =
                        endLat && endLng
                          ? `${Number(endLat).toFixed(3)},${Number(endLng).toFixed(3)}`
                          : "";
                      const endLoc = isEnded
                        ? geoAddressMap[eKey] ||
                          cleanLocationName(
                            item.endLocation || item.end_location,
                            "Office Workspace",
                          )
                        : null;

                      const durInfo = calculateRecordDuration(item);
                      const isFullShift =
                        durInfo.totalMinutes >= TARGET_WORKING_MINUTES;
                      const totalHrs = isLive
                        ? "In Progress"
                        : durInfo.formattedDuration;
                      const distKm =
                        item.totalDistanceKm || item.total_distance_km;

                      const startCoordsStr =
                        startLat && startLng
                          ? `${Number(startLat).toFixed(4)}, ${Number(startLng).toFixed(4)}`
                          : null;
                      const endCoordsStr =
                        endLat && endLng
                          ? `${Number(endLat).toFixed(4)}, ${Number(endLng).toFixed(4)}`
                          : null;

                      return (
                        <tr
                          key={item.id || index}
                          className="transition-colors hover:bg-blue-50/40"
                        >
                          {/* Row Number */}
                          <td className="px-4 py-4 font-mono font-medium text-slate-400">
                            {index + 1}
                          </td>

                          {/* Employee with Avatar */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white shadow-2xs">
                                {getInitials(empName)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#0f2942] flex items-center gap-1.5 truncate">
                                  <span className="truncate">{empName}</span>
                                  {empLocation && (
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                      {empLocation}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {empEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4 font-semibold text-slate-700 whitespace-nowrap">
                            {item.date}
                          </td>

                          {/* Punch In */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/70 font-mono">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span>{startTimeStr}</span>
                            </div>
                          </td>

                          {/* Start Location */}
                          <td className="px-4 py-4 text-slate-700">
                            <div
                              className="flex items-start gap-1.5 max-w-[200px]"
                              title={startLoc}
                            >
                              <FiMapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-medium text-xs truncate">
                                {startLoc}
                              </span>
                            </div>
                          </td>

                          {/* Start Lat / Long */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {startCoordsStr ? (
                              <div
                                onClick={() => handleCopyCoords(startCoordsStr)}
                                className="group inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-slate-700 border border-slate-200 font-mono text-[11px] cursor-pointer hover:bg-slate-200 transition"
                                title="Click to copy GPS coordinates"
                              >
                                <span className="text-emerald-600 font-bold text-[10px]">
                                  📍
                                </span>
                                <span>{startCoordsStr}</span>
                                <FiCopy className="h-3 w-3 text-slate-400 group-hover:text-slate-700 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            ) : (
                              <span className="text-slate-400 font-sans text-xs">
                                -
                              </span>
                            )}
                          </td>

                          {/* Live / Last Location */}
                          <td className="px-4 py-4 text-slate-700">
                            {isLive ? (
                              <div
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-emerald-800 font-semibold truncate max-w-[200px]"
                                title={`Live Movement: ${liveLoc}`}
                              >
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs truncate">
                                  {liveLoc || "Active Movement"}
                                </span>
                              </div>
                            ) : liveLoc && liveLoc !== "-" ? (
                              <div
                                className="flex items-start gap-1.5 max-w-[200px] text-slate-600"
                                title={liveLoc}
                              >
                                <span className="text-slate-400 text-xs mt-0.5">
                                  📡
                                </span>
                                <span className="text-xs truncate">
                                  {liveLoc}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-sans text-xs">
                                -
                              </span>
                            )}
                          </td>

                          {/* Punch Out */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {item.endTime || item.end_time ? (
                              <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200/70 font-mono">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                <span>{endTimeStr}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                                In Progress
                              </span>
                            )}
                          </td>

                          {/* End Location */}
                          <td className="px-4 py-4 text-slate-700">
                            {endLoc ? (
                              <div
                                className="flex items-start gap-1.5 max-w-[200px]"
                                title={endLoc}
                              >
                                <FiMapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span className="font-medium text-xs truncate">
                                  {endLoc}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* End Lat / Long */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {endCoordsStr ? (
                              <div
                                onClick={() => handleCopyCoords(endCoordsStr)}
                                className="group inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-slate-700 border border-slate-200 font-mono text-[11px] cursor-pointer hover:bg-slate-200 transition"
                                title="Click to copy GPS coordinates"
                              >
                                <span className="text-rose-600 font-bold text-[10px]">
                                  🏁
                                </span>
                                <span>{endCoordsStr}</span>
                                <FiCopy className="h-3 w-3 text-slate-400 group-hover:text-slate-700 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            ) : (
                              <span className="text-slate-400 font-sans text-xs">
                                -
                              </span>
                            )}
                          </td>

                          {/* Distance */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {distKm ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1 font-mono text-xs font-bold text-cyan-800 border border-cyan-200">
                                <FiCompass className="h-3 w-3 text-cyan-600" />
                                <span>{distKm} km</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">
                                0.0 km
                              </span>
                            )}
                          </td>

                          {/* Total Hours */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                In Progress
                              </span>
                            ) : totalHrs ? (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold font-mono border ${
                                  isFullShift
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                                title={
                                  isFullShift
                                    ? "Full shift (≥ 8h 30m completed)"
                                    : "Short shift (< 8h 30m)"
                                }
                              >
                                {isFullShift ? (
                                  <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <FiAlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                )}
                                <span>{totalHrs}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {item.status === "COMPLETED" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                Completed
                              </span>
                            ) : item.status === "AUTO_END_WORK" ||
                              item.status === "auto_end_work" ||
                              item.status === "AUTO_ENDED" ||
                              item.status === "END_WORK_HOUR" ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 font-mono shadow-2xs"
                                title="Automatically ended at 10:00 PM"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                auto_end_work
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                                Live Active
                              </span>
                            )}
                          </td>

                          {/* View Route Action */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedRouteId(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all cursor-pointer"
                              title="View GPS Route & Waypoints Map"
                            >
                              <FiNavigation className="h-3.5 w-3.5" />
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

            {/* Table Footer Count Strip */}
            {!loading && filteredRecords.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/70 px-4 sm:px-5 py-3 text-xs text-slate-500">
                <div>
                  Showing <strong>{filteredRecords.length}</strong> of{" "}
                  <strong>{currentRecords.length}</strong> attendance entries
                </div>
                {copiedCoord && (
                  <div className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fadeIn">
                    ✓ Coordinates copied to clipboard: {copiedCoord}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Interactive Route Map Modal */}
      {selectedRouteId && (
        <RouteMapModal
          attendanceId={selectedRouteId}
          onClose={() => setSelectedRouteId(null)}
        />
      )}

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyLeaveModalOpen}
        onClose={() => setIsApplyLeaveModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
