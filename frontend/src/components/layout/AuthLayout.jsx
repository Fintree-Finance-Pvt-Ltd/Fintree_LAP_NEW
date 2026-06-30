import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return <main className="flex min-h-screen items-center justify-center bg-[#0f3d66] p-4"><Outlet /></main>;
}
