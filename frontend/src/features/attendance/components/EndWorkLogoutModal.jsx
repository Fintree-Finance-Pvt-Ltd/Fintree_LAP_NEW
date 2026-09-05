import { useEffect, useState } from "react";
import {
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiStopCircle,
  FiLogOut,
  FiSave,
} from "react-icons/fi";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";

export default function EndWorkLogoutModal({ onDirectLogout }) {
  const { user } = useAuth();
  const {
    showEndModal,
    setShowEndModal,
    isWorkStarted,
    isWorkEnded,
    attendanceRecord,
    currentCoords,
    endWork,
    isSubmitting,
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [geoState, setGeoState] = useState({
    loading: true,
    latitude: null,
    longitude: null,
    address: "",
  });

  useEffect(() => {
    if (!showEndModal) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [showEndModal]);

  // Capture Geolocation for end work
  useEffect(() => {
    if (!showEndModal) return;

    // Use currentCoords as immediate initial coordinates
    const initialLat = currentCoords?.latitude ?? attendanceRecord?.currentLatitude ?? attendanceRecord?.startLatitude ?? null;
    const initialLng = currentCoords?.longitude ?? attendanceRecord?.currentLongitude ?? attendanceRecord?.startLongitude ?? null;

    if (initialLat && initialLng) {
      setGeoState({
        loading: false,
        latitude: parseFloat(Number(initialLat).toFixed(6)),
        longitude: parseFloat(Number(initialLng).toFixed(6)),
        address: `${Number(initialLat).toFixed(4)}° N, ${Number(initialLng).toFixed(4)}° E (${user?.spoke || "Workspace"})`,
      });
    }

    if (!navigator.geolocation) {
      if (!initialLat) {
        setGeoState({
          loading: false,
          latitude: null,
          longitude: null,
          address: user?.spoke || "Workspace Spoke",
        });
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoState({
          loading: false,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          address: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (${user?.spoke || "Workspace"})`,
        });
      },
      (err) => {
        console.warn("End work geolocation fetch note:", err.message);
        setGeoState((prev) => ({
          ...prev,
          loading: false,
          address: prev.address || (user?.spoke ? `Spoke: ${user.spoke}` : "Workspace Office"),
        }));
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  }, [showEndModal, user?.spoke, currentCoords, attendanceRecord]);

  if (!showEndModal) return null;

  const getFinalPayload = () => {
    const spoke =
      typeof user?.spoke === "object"
        ? user?.spoke?.name
        : user?.spoke || "Workspace";

    const finalLat =
      geoState.latitude ??
      currentCoords?.latitude ??
      attendanceRecord?.currentLatitude ??
      attendanceRecord?.startLatitude ??
      null;

    const finalLng =
      geoState.longitude ??
      currentCoords?.longitude ??
      attendanceRecord?.currentLongitude ??
      attendanceRecord?.startLongitude ??
      null;

    const locName =
      geoState.address ||
      (finalLat && finalLng
        ? `${Number(finalLat).toFixed(4)}° N, ${Number(finalLng).toFixed(4)}° E (${spoke})`
        : spoke || "Office Workspace");

    return {
      location: locName,
      latitude: finalLat ? Number(finalLat) : undefined,
      longitude: finalLng ? Number(finalLng) : undefined,
    };
  };

  const handleEndWorkOnly = async () => {
    const payload = getFinalPayload();
    if (isWorkStarted && !isWorkEnded) {
      await endWork(payload);
    }
    setShowEndModal(false);
  };

  const handleEndWorkAndSignOut = async () => {
    const payload = getFinalPayload();
    if (isWorkStarted && !isWorkEnded) {
      await endWork(payload);
    }
    setShowEndModal(false);
    if (typeof onDirectLogout === "function") {
      onDirectLogout();
    }
  };

  // Calculate elapsed time if start time exists
  let startTimeFormatted = null;
  let elapsedFormatted = null;

  if (attendanceRecord?.startTime) {
    const startD = new Date(attendanceRecord.startTime);
    startTimeFormatted = startD.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const diffMins = Math.max(
      0,
      Math.floor((currentTime.getTime() - startD.getTime()) / (1000 * 60))
    );
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    elapsedFormatted =
      hrs === 0
        ? `${mins} min${mins === 1 ? "" : "s"}`
        : `${hrs} hr${hrs === 1 ? "" : "s"} ${mins} min${mins === 1 ? "" : "s"}`;
  }

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#0f2942] to-[#081a2c] text-white shadow-2xl transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setShowEndModal(false)}
          className="absolute right-4 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Cancel"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 shadow-inner border border-amber-400/30">
              <FiStopCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                End Work Attendance
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Record End Time & Total Hours
              </h3>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            Wrap up your work session for today. Your exit time, location, and total hours will be updated in the LAP attendance register.
          </p>

          {/* Work Summary Box if Work is In Progress */}
          {isWorkStarted && !isWorkEnded ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-inner space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <FiClock className="h-4 w-4 text-blue-400" /> Work Started At:
                </span>
                <span className="font-semibold text-white">{startTimeFormatted}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <FiStopCircle className="h-4 w-4 text-amber-400" /> Current End Time:
                </span>
                <span className="font-semibold text-cyan-300 font-mono">{formattedTime}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <FiCheckCircle className="h-4 w-4 text-emerald-400" /> Total Duration:
                </span>
                <span className="font-bold text-emerald-400 text-sm">{elapsedFormatted}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <FiMapPin className="h-4 w-4 text-rose-400" /> Exit Location:
                </span>
                <span className="max-w-[180px] truncate text-right font-medium text-slate-200">
                  {geoState.address || "Office Workspace"}
                </span>
              </div>
            </div>
          ) : isWorkEnded ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
              <FiCheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>
                Your work day has already been completed ({attendanceRecord?.totalHours || "Logged"}).
              </span>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
              <FiAlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <span>You have not marked start work attendance today.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            {isWorkStarted && !isWorkEnded ? (
              <>
                <button
                  type="button"
                  onClick={handleEndWorkOnly}
                  disabled={isSubmitting}
                  className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-amber-600/25 transition-all duration-200 hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <FiSave className="h-4 w-4 transition-transform group-hover:scale-110" />
                  {isSubmitting ? "Recording End Time..." : "End Work & Save Data"}
                </button>

                <button
                  type="button"
                  onClick={handleEndWorkAndSignOut}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-900/30 py-3 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-800/40 hover:text-white cursor-pointer"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>End Work & Logout</span>
                </button>
              </>
            ) : null}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-700 bg-transparent py-2.5 px-6 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

