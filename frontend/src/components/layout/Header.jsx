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
import { useLayout } from "./LayoutContext.jsx";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { setMobileNavOpen } = useLayout();
  const {
    isWorkStarted,
    isWorkEnded,
    attendanceRecord,
    setShowStartModal,
    setShowEndModal,
  } = useAttendance();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roles = user?.roles?.length ? user.roles.join(", ") : "User";

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
      <header className="relative z-50 flex min-h-16 w-full flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 py-2 shadow-xs antialiased sm:min-h-20 sm:px-4 md:px-8">
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 transition-colors hover:bg-slate-50 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <FaBars className="text-slate-600" />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-5 w-1 rounded-full bg-blue-600 md:block" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight text-[#0f2942]">
                <span className="sm:hidden">LAP Workspace</span>
                <span className="hidden sm:inline">LAP Operations Workspace</span>
              </h1>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {roles.split(",")[0]} • {spoke}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-3.5">
          {isWorkStarted && !isWorkEnded ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs lg:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <FiClock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Working {startTimeStr ? `(${startTimeStr})` : ""}</span>
              </div>

              <button
                type="button"
                onClick={onEndTimeClick}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-xs font-bold text-amber-800 shadow-xs transition-all hover:border-amber-400 hover:bg-amber-100 active:scale-95 sm:px-3"
                title="End Work and record today's exit time & hours"
              >
                <FiStopCircle className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden sm:inline">End Time</span>
              </button>
            </div>
          ) : isWorkEnded ? (
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs sm:flex">
              <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Work Ended ({attendanceRecord?.totalHours || "Logged"})</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowStartModal(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 active:scale-95 sm:px-3"
            >
              <FiPlayCircle className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Start Work</span>
            </button>
          )}

          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50/50 p-1.5 shadow-inner sm:gap-2.5 sm:pr-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold tracking-wide text-white shadow-xs">
              {initials}
            </div>

            <div className="hidden text-left xl:block">
              <div className="text-xs font-bold text-[#0f2942]">
                {user?.name || "User"}
              </div>
              <div className="text-[10px] font-medium text-slate-400">{spoke}</div>
            </div>
          </div>

          <div className="hidden h-6 w-px bg-slate-200 md:block" />

          <button
            type="button"
            onClick={handleSimpleLogout}
            disabled={isLoggingOut}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-600 shadow-xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5"
            title="Sign out of your session"
          >
            <FiLogOut className="h-3.5 w-3.5 text-slate-500 hover:text-red-600" />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Signing out..." : "Logout"}
            </span>
          </button>
        </div>
      </header>

      <EndWorkLogoutModal onDirectLogout={handleSimpleLogout} />
    </>
  );
}
