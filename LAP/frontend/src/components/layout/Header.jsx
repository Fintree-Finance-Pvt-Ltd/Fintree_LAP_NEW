import { FaBars, FaChevronDown } from "react-icons/fa";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-8 shadow-sm">
      {/* Left Workspace Info */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label="menu"
          className="rounded-md p-2 hover:bg-slate-50 md:hidden"
        >
          <FaBars className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#0f2942]">LAP Operations Workspace</h1>
          <p className="text-[11px] text-slate-400 font-medium">Relationship Manager • Noida Spoke • Work</p>
        </div>
      </div>

      {/* Central Case Selector Dropdown */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors">
        <span className="text-sm font-semibold text-[#0f2942]">
          FTLIP-2026-0001 • Aarav Sharma
        </span>
        <FaChevronDown className="text-xs text-slate-400" />
      </div>

      {/* Right Quick Tools & Profile */}
      <div className="flex items-center gap-4">
        <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-md">New</span>
        <button className="border border-slate-200 text-slate-600 font-semibold text-xs px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
          Journey map
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

        {/* User Info Capsule */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/20">
            RM
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#0f2942]">Rohit Mehta</div>
            <div className="text-[10px] font-medium text-slate-400">Relationship Manager • Noida Spoke</div>
          </div>
        </div>

        <button className="ml-2 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors">
          Sign out
        </button>
      </div>
    </header>
  );
}