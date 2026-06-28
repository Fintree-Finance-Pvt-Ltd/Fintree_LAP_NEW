import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";

import { authApi } from "../../features/auth/authApi.js";
import { clearCredentials } from "../../features/auth/authSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import { tokenManager } from "../../services/tokenManager.js";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

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

      {/* Right section: Profile Circle & Actions */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50/50 p-1.5 pr-4 shadow-inner">
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

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}