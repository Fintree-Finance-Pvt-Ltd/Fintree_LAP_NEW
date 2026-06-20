import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaFolder,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaHistory,
} from "react-icons/fa";


const items = [
  ["/dashboard", "Dashboard", FaHome],
  ["/applications", "Applications", FaFolder],
  ["/loan-accounts", "Loan Accounts", FaMoneyBillWave],
  ["/users", "Users", FaUsers],
  ["/reports", "Reports", FaChartLine],
  ["/audit", "Audit", FaHistory],
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <div className="mb-6 text-xl font-bold text-[#0f3d66]">Fintree LAP-LIP</div>
      <nav className="space-y-1">
        {items.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                isActive
                  ? "bg-[#e8f3f8] text-[#0f3d66]"
                  : "text-slate-600"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

