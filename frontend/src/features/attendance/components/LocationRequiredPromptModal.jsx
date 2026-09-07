import { useState, useEffect } from "react";
import {
  FiAlertTriangle,
  FiMapPin,
  FiRefreshCw,
  FiShield,
  FiNavigation,
} from "react-icons/fi";
import { useAttendance } from "../../../context/AttendanceContext.jsx";

export default function LocationRequiredPromptModal() {
  const {
    isLocationDisabledDuringWork,
    locationErrorDetails,
    retryRequestLocationPermission,
    isWorkStarted,
    isWorkEnded,
  } = useAttendance();

  const [isRetrying, setIsRetrying] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Animate a recurring ping counter to reassure user that the system is continually requesting location
  useEffect(() => {
    if (!isLocationDisabledDuringWork || !isWorkStarted || isWorkEnded) return;

    const timer = setInterval(() => {
      setPulseCount((c) => c + 1);
    }, 2500);

    return () => clearInterval(timer);
  }, [isLocationDisabledDuringWork, isWorkStarted, isWorkEnded]);

  if (!isLocationDisabledDuringWork || !isWorkStarted || isWorkEnded) {
    return null;
  }

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      retryRequestLocationPermission();
    } finally {
      setTimeout(() => setIsRetrying(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/40 bg-gradient-to-b from-[#1c080e] via-[#150a14] to-[#0d111a] text-white shadow-2xl shadow-rose-950/60 transition-all">
        {/* Animated Top Hazard Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-red-600 animate-pulse" />

        <div className="p-6 sm:p-7">
          {/* Radar Beacon Icon */}
          <div className="flex items-center justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40 shadow-inner">
              <div className="absolute h-full w-full rounded-full bg-rose-500/15 animate-ping" />
              <FiMapPin className="h-10 w-10 text-rose-400 drop-shadow-md" />
            </div>
          </div>

          {/* Heading */}
          <div className="mt-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-rose-300 border border-rose-500/30">
              <FiAlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Action Required
            </span>
            <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white">
              Location Turned Off
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your work session is active. Continuous GPS location tracking is <span className="font-bold text-rose-300">mandatory</span> during working hours.
            </p>
          </div>

          {/* Warning Message Box */}
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-950/30 p-3.5 text-xs text-rose-200 backdrop-blur-sm">
            <div className="font-semibold text-rose-300 flex items-center gap-1.5">
              <FiNavigation className="h-3.5 w-3.5 text-rose-400" />
              <span>Permission / GPS Disabled:</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">
              {locationErrorDetails || "Please turn on your device GPS / location services and allow location permission in your browser."}
            </p>
          </div>

          {/* Live Auto-Request Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2 px-3 text-[11px] text-amber-300">
            <FiRefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
            <span>Auto-requesting location permission continuously...</span>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-rose-600/30 transition-all hover:from-rose-500 hover:to-amber-500 hover:shadow-rose-600/50 active:scale-[0.98] cursor-pointer"
            >
              <FiRefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              <span>{isRetrying ? "Checking Location..." : "Turn On Location / Allow"}</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <FiShield className="h-3 w-3 text-rose-400" />
            <span>This prompt will automatically close once location is active.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
