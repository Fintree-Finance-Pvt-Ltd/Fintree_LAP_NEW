import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import HeaderContainer from "./HeaderContainer.jsx";
import MobileSidebar from "./MobileSidebar.jsx";
import { LayoutContext } from "./LayoutContext.jsx";
import StartWorkModal from "../../features/attendance/components/StartWorkModal.jsx";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <LayoutContext.Provider value={{ mobileNavOpen, setMobileNavOpen }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#f4f7fb]">
        <Sidebar />
        <MobileSidebar />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0">
            <HeaderContainer />
          </div>

          <div className="app-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
            <div className="mx-auto w-full min-w-0 max-w-[1800px]">
              <Outlet />
            </div>
          </div>
        </main>

        <StartWorkModal />
      </div>
    </LayoutContext.Provider>
  );
}
