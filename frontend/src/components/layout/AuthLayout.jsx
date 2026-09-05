import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="min-h-[100dvh] w-full bg-[#021933]">
      <Outlet />
    </main>
  );
}
