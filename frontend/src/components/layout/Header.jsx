import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { FiClock, FiCheckCircle, FiPlayCircle, FiStopCircle, FiLogOut } from "react-icons/fi";

import { authApi } from "../../features/auth/authApi.js";
import { clearCredentials } from "../../features/auth/authSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useAttendance } from "../../context/AttendanceContext.jsx";
import { tokenManager } from "../../services/tokenManager.js";
import EndWorkLogoutModal from "../../features/attendance/components/EndWorkLogoutModal.jsx";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const {
    isWorkStarted,
    isWorkEnded,
    attendanceRecord,
    setShowStartModal,
    setShowEndModal,
  } = useAttendance();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roles = user?.roles?.length
    ? user.roles.join(", ")
    : "User";

  const spoke =
    typeof user?.spoke === "object"
      ? user?.spoke?.name || "Workspace"
      : user?.spoke || "Workspace";

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Simple Normal Logout
  const handleSimpleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      dispatch(clearCredentials());
      tokenManager.clear();

      localStorage.removeItem("loginDetails");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.sessionStorage?.removeItem("user");
      }

      navigate("/login", {
        replace: true,
      });
    }
  };

  const onEndTimeClick = () => {
    setShowEndModal(true);
  };

  const startTimeStr = attendanceRecord?.startTime
    ? new Date(attendanceRecord.startTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <>
      <header className="relative z-50 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-xs antialiased md:px-8">
        {/* Left section: Workspace Branding */}
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 transition-colors hover:bg-slate-50 md:hidden"
          >
            <FaBars className="text-slate-600" />
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden h-5 w-1 bg-blue-600 rounded-full md:block" />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[#0f2942]">
                LAP Operations Workspace
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                {roles.split(",")[0]} • {spoke}
              </p>
            </div>
          </div>
        </div>

        {/* Right section: Attendance Status, End Time, Profile Circle & Logout */}
        <div className="flex shrink-0 items-center gap-2.5 md:gap-3.5">
          {/* Work in Progress status & End Time button */}
          {isWorkStarted && !isWorkEnded ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <FiClock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Working {startTimeStr ? `(${startTimeStr})` : ""}</span>
              </div>

              {/* End Time button */}
              <button
                type="button"
                onClick={onEndTimeClick}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 shadow-xs transition-all hover:bg-amber-100 hover:border-amber-400 active:scale-95 cursor-pointer"
                title="End Work and record today's exit time & hours"
              >
                <FiStopCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>End Time</span>
              </button>
            </div>
          ) : isWorkEnded ? (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs">
              <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Work Ended ({attendanceRecord?.totalHours || "Logged"})</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 active:scale-95 cursor-pointer"
            >
              <FiPlayCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>Start Work</span>
            </button>
          )}

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 rounded-full border border-slate-100 bg-slate-50/50 p-1.5 pr-3.5 shadow-inner">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold tracking-wide text-white shadow-xs">
              {initials}
            </div>

            <div className="hidden text-left xl:block">
              <div className="text-xs font-bold text-[#0f2942]">
                {user?.name || "User"}
              </div>
              <div className="text-[10px] font-medium text-slate-400">
                {spoke}
              </div>
            </div>
          </div>

          <div className="hidden h-6 w-px bg-slate-200 md:block" />

          {/* Normal Simple Logout */}
          <button
            type="button"
            onClick={handleSimpleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            title="Sign out of your session"
          >
            <FiLogOut className="h-3.5 w-3.5 text-slate-500 hover:text-red-600" />
            <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </header>

      {/* End Work / End Time Modal */}
      <EndWorkLogoutModal onDirectLogout={handleSimpleLogout} />
    </>
  );
}
