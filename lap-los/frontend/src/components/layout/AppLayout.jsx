import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function AppLayout() {
  return <div className="flex min-h-screen bg-[#f4f7fb]"><Sidebar /><main className="min-w-0 flex-1"><Header /><div className="p-4 md:p-6"><Outlet /></div></main></div>;
}
