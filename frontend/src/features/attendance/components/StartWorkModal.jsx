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
import {
  reverseGeocodeCoords,
  getCurrentGPSPosition,
  cleanLocationName,
  getLastKnownCoords,
} from "../../../utils/geoUtils.js";

export default function StartWorkModal() {
  const { user } = useAuth();
  const {
    showStartModal,
    dismissStartModalForSession,
    startWork,
    isSubmitting,
    isWorkStarted,
    currentCoords,
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [acquiringGps, setAcquiringGps] = useState(false);
  const [geoState, setGeoState] = useState(() => {
    const cached = getLastKnownCoords();
    const spokeName = typeof user?.spoke === "object" ? user?.spoke?.name : user?.spoke;
    return {
      loading: !cached,
      latitude: cached?.latitude ?? null,
      longitude: cached?.longitude ?? null,
      address: spokeName ? `Spoke: ${spokeName}` : "Office Workspace",
      error: null,
    };
  });

  // Live Clock
  useEffect(() => {
    if (!showStartModal) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [showStartModal]);

  // Capture Geolocation & Real Place Name
  useEffect(() => {
    if (!showStartModal) return;

    let isMounted = true;
    const spokeName = typeof user?.spoke === "object" ? user?.spoke?.name : user?.spoke;

    // Use currentCoords from context if available immediately
    if (currentCoords?.latitude && currentCoords?.longitude) {
      const lat = parseFloat(Number(currentCoords.latitude).toFixed(7));
      const lng = parseFloat(Number(currentCoords.longitude).toFixed(7));
      setGeoState((prev) => ({
        ...prev,
        loading: false,
        latitude: lat,
        longitude: lng,
      }));
      reverseGeocodeCoords(lat, lng).then((addr) => {
        if (isMounted && addr) {
          setGeoState((prev) => ({ ...prev, address: addr }));
        }
      });
    }

    getCurrentGPSPosition(8000)
      .then(async (pos) => {
        if (!isMounted) return;
        const lat = parseFloat(pos.latitude.toFixed(7));
        const lng = parseFloat(pos.longitude.toFixed(7));

        let resolvedAddress = await reverseGeocodeCoords(lat, lng);
        if (!resolvedAddress) {
          resolvedAddress = spokeName ? `Spoke: ${spokeName}` : "Office Workspace";
        }

        if (isMounted) {
          setGeoState({
            loading: false,
            latitude: lat,
            longitude: lng,
            address: resolvedAddress,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Geolocation prompt skipped or denied:", err?.message);
        setGeoState((prev) => ({
          ...prev,
          loading: false,
          address: prev.address || (spokeName ? `Spoke: ${spokeName}` : "Office Workspace"),
          error: null,
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [showStartModal, user?.spoke, currentCoords]);

  if (!showStartModal || isWorkStarted) return null;

  const handleStartWorkClick = async () => {
    const spoke =
      typeof user?.spoke === "object"
        ? user?.spoke?.name
        : user?.spoke || "Workspace";

    let lat = geoState.latitude ?? currentCoords?.latitude ?? null;
    let lng = geoState.longitude ?? currentCoords?.longitude ?? null;
    let address = geoState.address;

    // If still resolving or coordinates missing, actively acquire GPS
    if (lat === null || lng === null) {
      setAcquiringGps(true);
      try {
        const pos = await getCurrentGPSPosition(5000);
        lat = parseFloat(pos.latitude.toFixed(7));
        lng = parseFloat(pos.longitude.toFixed(7));
        const resolved = await reverseGeocodeCoords(lat, lng);
        if (resolved) address = resolved;
      } catch (err) {
        console.warn("Could not lock GPS on Start Work:", err?.message);
        const cached = getLastKnownCoords();
        if (cached) {
          lat = cached.latitude;
          lng = cached.longitude;
        }
      } finally {
        setAcquiringGps(false);
      }
    }

    const payload = {
      location: address || spoke || "Office Workspace",
      latitude: lat !== null && lat !== undefined ? Number(lat) : undefined,
      longitude: lng !== null && lng !== undefined ? Number(lng) : undefined,
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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-md transition-all animate-fadeIn sm:items-center sm:p-4">
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/20 bg-gradient-to-b from-[#0f2942] to-[#081a2c] text-white shadow-2xl transition-all sm:rounded-3xl">
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

        <div className="p-5 sm:p-6 md:p-8">
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
            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 text-slate-300">
                <FiUser className="h-4 w-4 text-blue-400" />
                <span>Employee</span>
              </div>
              <span className="break-words font-semibold text-white sm:text-right">
                {user?.name || user?.email || "User"} ({spoke})
              </span>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
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
                    <span className="max-w-[min(100%,16rem)] truncate text-left sm:text-right">
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
