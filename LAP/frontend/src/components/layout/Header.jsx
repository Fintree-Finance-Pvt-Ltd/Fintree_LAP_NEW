import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaChevronDown } from "react-icons/fa";

import { authApi } from "../../features/auth/authApi.js"
import { tokenManager } from "../../services/tokenManager.js";

export default function Header() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // Backend should invalidate the refresh token/session
      // and clear the HttpOnly authentication cookie.
      await authApi.logout();
    } catch (error) {
      // The user should still be logged out locally even when
      // the backend request fails or the session has already expired.
      console.error("Logout API failed:", error);
    } finally {
      tokenManager.clear();

      // Remove any other locally stored user data.
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");

      // Replace prevents returning to a protected page using Back.
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-8 shadow-sm">
      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-md p-2 hover:bg-slate-50 md:hidden"
        >
          <FaBars className="text-slate-600" />
        </button>

        <div>
          <h1 className="text-base font-bold text-[#0f2942]">
            LAP Operations Workspace
          </h1>
          <p className="text-[11px] font-medium text-slate-400">
            Relationship Manager • Noida Spoke • Work
          </p>
        </div>
      </div>

      <div className="hidden cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 transition-colors hover:bg-slate-100 lg:flex">
        <span className="text-sm font-semibold text-[#0f2942]">
          FTLIP-2026-0001 • Aarav Sharma
        </span>
        <FaChevronDown className="text-xs text-slate-400" />
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
          New
        </span>

        <button
          type="button"
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
        >
          Journey map
        </button>

        <div className="mx-2 h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold tracking-wide text-white shadow-md shadow-blue-600/20">
            RM
          </div>

          <div className="hidden text-left sm:block">
            <div className="text-xs font-bold text-[#0f2942]">
              Rohit Mehta
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              Relationship Manager • Noida Spoke
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ml-2 text-xs font-bold text-slate-500 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}