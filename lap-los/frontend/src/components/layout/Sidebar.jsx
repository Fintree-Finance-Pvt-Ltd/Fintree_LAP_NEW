import { NavLink } from 'react-router-dom';
import { Dashboard, Folder, Group, Paid, Assessment, History } from '@mui/icons-material';

const items = [
  ['/dashboard', 'Dashboard', Dashboard],
  ['/applications', 'Applications', Folder],
  ['/loan-accounts', 'Loan Accounts', Paid],
  ['/users', 'Users', Group],
  ['/reports', 'Reports', Assessment],
  ['/audit', 'Audit', History]
];

export default function Sidebar() {
  return <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block"><div className="mb-6 text-xl font-bold text-[#0f3d66]">Fintree LAP-LIP</div><nav className="space-y-1">{items.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-[#e8f3f8] text-[#0f3d66]' : 'text-slate-600'}`}><Icon fontSize="small" />{label}</NavLink>)}</nav></aside>;
}
