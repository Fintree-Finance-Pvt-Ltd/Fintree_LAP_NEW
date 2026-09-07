import { useEffect, useState, useCallback } from "react";
import {
  FiClock,
  FiMapPin,
  FiUser,
  FiPlay,
  FiX,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import {
  reverseGeocodeCoords,
  getCurrentGPSPosition,
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
  const [errorMessage, setErrorMessage] = useState(null);
  const [geoState, setGeoState] = useState(() => {
    const cached = getLastKnownCoords();
    const spokeName = typeof user?.spoke === "object" ? user?.spoke?.name : user?.spoke;
    return {
      loading: !cached,
      latitude: cached?.latitude ?? null,
      longitude: cached?.longitude ?? null,
      address: cached ? "Location acquired" : spokeName ? `Spoke: ${spokeName}` : "",
      error: null,
    };
  });

  // Live Clock
  useEffect(() => {
    if (!showStartModal) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [showStartModal]);

  const acquireLocation = useCallback(async () => {
    setAcquiringGps(true);
    setErrorMessage(null);
    setGeoState((prev) => ({ ...prev, loading: true, error: null }));

    const spokeName = typeof user?.spoke === "object" ? user?.spoke?.name : user?.spoke;

    try {
      const pos = await getCurrentGPSPosition(9000);
      const lat = parseFloat(pos.latitude.toFixed(7));
      const lng = parseFloat(pos.longitude.toFixed(7));

      let resolvedAddress = await reverseGeocodeCoords(lat, lng);
      if (!resolvedAddress) {
        resolvedAddress = spokeName ? `Spoke: ${spokeName}` : `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }

      setGeoState({
        loading: false,
        latitude: lat,
        longitude: lng,
        address: resolvedAddress,
        error: null,
      });
      setErrorMessage(null);
    } catch (err) {
      console.warn("GPS Acquisition failed on Start Work:", err?.message);
      setGeoState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Location permission denied or unavailable",
      }));
      setErrorMessage(
        err?.message || "Location access is mandatory to start work. Please enable GPS / location permissions in your browser."
      );
    } finally {
      setAcquiringGps(false);
    }
  }, [user?.spoke]);

  // Capture Geolocation & Real Place Name on modal open
  useEffect(() => {
    if (!showStartModal) return;

    if (currentCoords?.latitude && currentCoords?.longitude) {
      const lat = parseFloat(Number(currentCoords.latitude).toFixed(7));
      const lng = parseFloat(Number(currentCoords.longitude).toFixed(7));
      setGeoState((prev) => ({
        ...prev,
        loading: false,
        latitude: lat,
        longitude: lng,
        error: null,
      }));
      reverseGeocodeCoords(lat, lng).then((addr) => {
        if (addr) {
          setGeoState((prev) => ({ ...prev, address: addr }));
        }
      });
    } else {
      acquireLocation();
    }
  }, [showStartModal, currentCoords, acquireLocation]);

  if (!showStartModal || isWorkStarted) return null;

  const hasValidGps =
    (geoState.latitude !== null && geoState.longitude !== null) ||
    (currentCoords?.latitude !== null && currentCoords?.latitude !== undefined && currentCoords?.longitude !== null);

  const handleStartWorkClick = async () => {
    setErrorMessage(null);
    const spoke =
      typeof user?.spoke === "object"
        ? user?.spoke?.name
        : user?.spoke || "Workspace";

    let lat = geoState.latitude ?? currentCoords?.latitude ?? null;
    let lng = geoState.longitude ?? currentCoords?.longitude ?? null;
    let address = geoState.address;

    // Strict check: Location is mandatory
    if (lat === null || lng === null) {
      setAcquiringGps(true);
      try {
        const pos = await getCurrentGPSPosition(8000);
        lat = parseFloat(pos.latitude.toFixed(7));
        lng = parseFloat(pos.longitude.toFixed(7));
        const resolved = await reverseGeocodeCoords(lat, lng);
        if (resolved) address = resolved;
        setGeoState({
          loading: false,
          latitude: lat,
          longitude: lng,
          address: address || "Verified Location",
          error: null,
        });
      } catch (err) {
        setErrorMessage(
          "Location access is required to start work. Please enable GPS and allow location access in your browser."
        );
        setAcquiringGps(false);
        return;
      } finally {
        setAcquiringGps(false);
      }
    }

    if (lat === null || lng === null) {
      setErrorMessage("Cannot start work without valid GPS location. Please retry location detection.");
      return;
    }

    const payload = {
      location: address || spoke || "Office Workspace",
      latitude: Number(lat),
      longitude: Number(lng),
      spoke,
    };

    const res = await startWork(payload);
    if (!res?.success) {
      setErrorMessage(res?.error || "Failed to start work. Please try again.");
    }
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
            Good day, <span className="font-semibold text-white">{user?.name || "User"}</span>! Please punch in your attendance with your current location to begin your work session.
          </p>

          {/* Time & Date Display Box */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm shadow-inner">
            <div className="text-xs font-medium uppercase tracking-widest text-slate-400">
              {formattedDate}
            </div>
            <div className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-cyan-300 font-mono">
              {formattedTime}
            </div>
          </div>

          {/* Location Error / Mandatory Alert */}
          {errorMessage && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200 animate-fadeIn">
              <FiAlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold">Location Mandatory:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Info Details List */}
          <div className="mt-4 space-y-3">
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

            {/* Mandatory Punch Location */}
            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 text-slate-300">
                <FiMapPin className="h-4 w-4 text-emerald-400" />
                <span>Punch Location (Mandatory)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                {geoState.loading || acquiringGps ? (
                  <span className="flex items-center gap-1.5 text-amber-300 animate-pulse font-semibold">
                    <FiRefreshCw className="h-3.5 w-3.5 animate-spin" /> Acquiring GPS location...
                  </span>
                ) : hasValidGps ? (
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <FiCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="max-w-[min(100%,16rem)] truncate text-left sm:text-right font-semibold">
                      {geoState.address || "Current Location Verified"}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={acquireLocation}
                    className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                  >
                    <FiRefreshCw className="h-3 w-3" /> Enable GPS / Retry
                  </button>
                )}
              </div>
            </div>

            {hasValidGps && geoState.latitude && geoState.longitude && (
              <div className="text-[11px] text-slate-400 font-mono text-right pr-1">
                GPS: {Number(geoState.latitude).toFixed(5)}, {Number(geoState.longitude).toFixed(5)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleStartWorkClick}
              disabled={isSubmitting || acquiringGps || (!hasValidGps && !geoState.loading)}
              className="group relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {acquiringGps ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  <span>Locking GPS...</span>
                </>
              ) : isSubmitting ? (
                "Starting Work..."
              ) : (
                <>
                  <FiPlay className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Start Work</span>
                </>
              )}
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

