import { useEffect, useState } from "react";
import {
  FiClock,
  FiMapPin,
  FiUser,
  FiPlay,
  FiX,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";

export default function StartWorkModal() {
  const { user } = useAuth();
  const {
    showStartModal,
    dismissStartModalForSession,
    startWork,
    isSubmitting,
    isWorkStarted,
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [geoState, setGeoState] = useState({
    loading: true,
    latitude: null,
    longitude: null,
    address: "",
    error: null,
  });

  // Live Clock
  useEffect(() => {
    if (!showStartModal) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [showStartModal]);

  // Capture Geolocation
  useEffect(() => {
    if (!showStartModal) return;

    if (!navigator.geolocation) {
      setGeoState({
        loading: false,
        latitude: null,
        longitude: null,
        address: user?.spoke || "Workspace Spoke",
        error: "Geolocation not supported by browser",
      });
      return;
    }

    setGeoState((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoState({
          loading: false,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          address: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (${user?.spoke || "Workspace"})`,
          error: null,
        });
      },
      (err) => {
        console.warn("Geolocation prompt skipped or denied:", err.message);
        setGeoState({
          loading: false,
          latitude: null,
          longitude: null,
          address: user?.spoke ? `Spoke: ${user.spoke}` : "Workspace Office",
          error: null,
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [showStartModal, user?.spoke]);

  if (!showStartModal || isWorkStarted) return null;

  const handleStartWorkClick = async () => {
    const spoke =
      typeof user?.spoke === "object"
        ? user?.spoke?.name
        : user?.spoke || "Workspace";

    const payload = {
      location: geoState.address || spoke || "Office Workspace",
      latitude: geoState.latitude,
      longitude: geoState.longitude,
      spoke,
    };

    await startWork(payload);
  };

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const spoke =
    typeof user?.spoke === "object"
      ? user?.spoke?.name || "Workspace"
      : user?.spoke || "Workspace";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#0f2942] to-[#081a2c] text-white shadow-2xl transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

        {/* Close / Dismiss Button */}
        <button
          type="button"
          onClick={dismissStartModalForSession}
          className="absolute right-4 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Remind me later"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 shadow-inner border border-blue-400/30">
              <FiClock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Daily Attendance
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Start Your Work Day
              </h3>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            Good day, <span className="font-semibold text-white">{user?.name || "User"}</span>! Please punch in your attendance to begin your workspace session.
          </p>

          {/* Time & Date Display Box */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm shadow-inner">
            <div className="text-xs font-medium uppercase tracking-widest text-slate-400">
              {formattedDate}
            </div>
            <div className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-cyan-300 font-mono">
              {formattedTime}
            </div>
          </div>

          {/* Info Details List */}
          <div className="mt-5 space-y-3">
            {/* User & Spoke */}
            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-3 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <FiUser className="h-4 w-4 text-blue-400" />
                <span>Employee</span>
              </div>
              <span className="font-semibold text-white">
                {user?.name || user?.email || "User"} ({spoke})
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-3 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <FiMapPin className="h-4 w-4 text-emerald-400" />
                <span>Punch Location</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-emerald-300">
                {geoState.loading ? (
                  <span className="animate-pulse text-slate-400">Detecting location...</span>
                ) : (
                  <>
                    <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="max-w-[200px] truncate text-right">
                      {geoState.address || spoke || "Verified Location"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleStartWorkClick}
              disabled={isSubmitting}
              className="group relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <FiPlay className="h-4 w-4 transition-transform group-hover:scale-110" />
              {isSubmitting ? "Starting Work..." : "Start Work"}
            </button>

            <button
              type="button"
              onClick={dismissStartModalForSession}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-3.5 px-5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700/90 hover:text-white cursor-pointer"
            >
              <FiClock className="h-4 w-4 text-amber-400" />
              <span>Remind Me Later</span>
            </button>
          </div>


          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <FiShield className="h-3.5 w-3.5 text-blue-400" />
            <span>Attendance will be recorded in the LAP official register.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
