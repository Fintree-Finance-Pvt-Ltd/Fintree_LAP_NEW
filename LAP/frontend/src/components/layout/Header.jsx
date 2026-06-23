import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBars, FaChevronDown } from "react-icons/fa";

import { authApi } from "../../features/auth/authApi.js";
import { clearCredentials } from "../../features/auth/authSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import { tokenManager } from "../../services/tokenManager.js";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roles = user?.roles?.length ? user.roles.join(", ") : "User";
  const spoke = user?.spoke || "Workspace";
  const initials = (user?.name || user?.email || "U")
    .split(" ")
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
      sessionStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-8 shadow-sm">
      <div className="flex items-center gap-6">
        <button type="button" aria-label="Open menu" className="rounded-md p-2 hover:bg-slate-50 md:hidden">
          <FaBars className="text-slate-600" />
        </button>

        <div>
          <h1 className="text-base font-bold text-[#0f2942]">LAP Operations Workspace</h1>
          <p className="text-[11px] font-medium text-slate-400">
            {roles} | {spoke}
          </p>
        </div>
      </div>

      <div className="hidden cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 transition-colors hover:bg-slate-100 lg:flex">
        <span className="text-sm font-semibold text-[#0f2942]">{spoke} | Live</span>
        <FaChevronDown className="text-xs text-slate-400" />
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
          {roles.split(",")[0]}
        </span>

        <div className="mx-2 h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold tracking-wide text-white shadow-md shadow-blue-600/20">
            {initials}
          </div>

          <div className="hidden text-left sm:block">
            <div className="text-xs font-bold text-[#0f2942]">{user?.name || user?.email || "Signed in user"}</div>
            <div className="text-[10px] font-medium text-slate-400">
              {roles} | {spoke}
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
