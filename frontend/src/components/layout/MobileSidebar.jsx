import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { SidebarNavLinks } from "./Sidebar.jsx";
import { useLayout } from "./LayoutContext.jsx";

export default function MobileSidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useLayout();

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen, setMobileNavOpen]);

  return (
    <div
      className={`fixed inset-0 z-[80] lg:hidden ${mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!mobileNavOpen}
    >
      <button
        type="button"
        aria-label="Close menu"
        className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-200 ${
          mobileNavOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={`absolute inset-y-0 left-0 flex h-full w-[min(20rem,88vw)] flex-col overflow-y-auto border-r border-slate-800/40 bg-[#0b1426] p-5 text-slate-400 shadow-2xl transition-transform duration-200 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-3 px-2">
          <div>
            <div className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-xl font-bold tracking-wider text-transparent text-white">
              Fintree LAP
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-500">
              LOS • LMS PORTAL
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={() => setMobileNavOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <SidebarNavLinks onNavigate={() => setMobileNavOpen(false)} />
      </aside>
    </div>
  );
}
