import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChevronDown,
  FaRoute,
} from "react-icons/fa";

import { authApi } from "../../features/auth/authApi.js";
import { clearCredentials } from "../../features/auth/authSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import { tokenManager } from "../../services/tokenManager.js";

export default function Header({
  currentApplication,
  onApplicationChange,
  applicationList = [],
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // LAN can come using different property names.
  const currentLan =
    currentApplication?.lan ||
    currentApplication?.LAN ||
    currentApplication?.applicationNumber ||
    "No active LAN";

  // Current case status/stage.
  const currentStatus =
    currentApplication?.stage ||
    currentApplication?.status ||
    "Draft";

  const getApplicationLan = (application) =>
    application?.lan ||
    application?.LAN ||
    application?.applicationNumber ||
    "LAN not generated";

  const getStatusClasses = (status = "") => {
    const normalizedStatus = status
      .toUpperCase()
      .replaceAll(" ", "_");

    switch (normalizedStatus) {
      case "DRAFT":
      case "LEAD_CREATED":
        return {
          wrapper:
            "border-slate-200 bg-slate-50 text-slate-700",
          dot: "bg-slate-500",
        };

      case "SUBMITTED_TO_BM":
      case "BM_PENDING":
      case "PENDING_BM_APPROVAL":
        return {
          wrapper:
            "border-amber-200 bg-amber-50 text-amber-800",
          dot: "bg-amber-500",
        };

      case "BM_APPROVED":
      case "APPROVED":
        return {
          wrapper:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
          dot: "bg-emerald-500",
        };

      case "REJECTED":
      case "BM_REJECTED":
        return {
          wrapper:
            "border-rose-200 bg-rose-50 text-rose-700",
          dot: "bg-rose-500",
        };

      default:
        return {
          wrapper:
            "border-blue-200 bg-blue-50 text-blue-700",
          dot: "bg-blue-500",
        };
    }
  };

  const statusClasses = getStatusClasses(currentStatus);

  const handleApplicationSelect = (application) => {
    onApplicationChange?.(application);
    setIsDropdownOpen(false);

    const id = application?.id;

    if (id) {
      navigate(`/applications/${id}`);
    }
  };

  const handleJourneyMap = () => {
    if (!currentApplication?.id) return;

    navigate(
      `/applications/${currentApplication.id}/journey`
    );
  };

  const handleLogout = async () => {
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

  return (
    <header className="relative z-50 flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white px-4 shadow-sm antialiased md:px-8">
      {/* Left section */}
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-md p-2 transition-colors hover:bg-slate-50 md:hidden"
        >
          <FaBars className="text-slate-600" />
        </button>

        <div>
          <h1 className="text-sm font-bold tracking-tight text-[#0f2942]">
            LAP Operations Workspace
          </h1>

          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {roles.split(",")[0]} • {spoke}
          </p>
        </div>
      </div>

      {/* Center: LAN and current status */}
      <div className="hidden flex-1 items-center justify-center gap-3 px-6 md:flex">
        {/* LAN selector */}
        <div className="relative min-w-[300px] max-w-[380px]">
          <button
            type="button"
            onClick={() =>
              setIsDropdownOpen((previous) => !previous)
            }
            className="
              flex w-full items-center justify-between gap-4
              rounded-xl border border-slate-200 bg-white
              px-4 py-2 shadow-sm
              transition-all
              hover:border-blue-300 hover:bg-blue-50/30
              focus:border-blue-500 focus:outline-none
              focus:ring-4 focus:ring-blue-100
            "
          >
            <div className="min-w-0 text-left">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Active LAN
              </p>

              <p className="truncate text-xs font-bold text-[#0f2942]">
                {currentLan}
              </p>

              {currentApplication?.customerName && (
                <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                  {currentApplication.customerName}
                </p>
              )}
            </div>

            <FaChevronDown
              className={`shrink-0 text-xs text-blue-500 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
              {applicationList.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs font-medium text-slate-400">
                  No applications available
                </div>
              ) : (
                applicationList.map((application) => {
                  const applicationLan =
                    getApplicationLan(application);

                  const applicationStatus =
                    application?.stage ||
                    application?.status ||
                    "Draft";

                  const isSelected =
                    currentApplication?.id ===
                    application?.id;

                  return (
                    <button
                      key={
                        application.id ||
                        applicationLan
                      }
                      type="button"
                      onClick={() =>
                        handleApplicationSelect(
                          application
                        )
                      }
                      className={`mb-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors last:mb-0 ${
                        isSelected
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">
                          {applicationLan}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {application.customerName ||
                            "Customer not available"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase text-slate-500">
                        {applicationStatus.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Current status */}
        <div
          className={`inline-flex min-w-[150px] items-center gap-2 rounded-xl border px-3.5 py-2 shadow-sm ${statusClasses.wrapper}`}
        >
          <span
            className={`h-2 w-2 shrink-0 animate-pulse rounded-full ${statusClasses.dot}`}
          />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
              Current Status
            </p>

            <p className="max-w-[180px] truncate text-[11px] font-bold">
              {currentStatus.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50/50 p-1.5 pr-4 shadow-inner">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold tracking-wide text-white shadow-md shadow-blue-600/20">
            {initials}
          </div>

          <div className="hidden text-left xl:block">
            <div className="text-xs font-bold text-[#0f2942]">
              {user?.name || "User"}
            </div>

            <div className="text-[10px] font-medium text-slate-400">
              {roles.split(",")[0]} • {spoke}
            </div>
          </div>
        </div>

        <div className="hidden h-6 w-px bg-slate-200 lg:block" />

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="
            rounded-xl border border-slate-200 bg-white
            px-3 py-2 text-xs font-bold text-slate-600
            transition-all
            hover:border-red-200 hover:bg-red-50
            hover:text-red-600
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isLoggingOut
            ? "Signing out..."
            : "Sign out"}
        </button>
      </div>
    </header>
  );
}