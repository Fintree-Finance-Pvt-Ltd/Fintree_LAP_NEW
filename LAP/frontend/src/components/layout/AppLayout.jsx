// import { Outlet } from 'react-router-dom';
// import Sidebar from './Sidebar.jsx';
// import Header from './Header.jsx';

// export default function AppLayout() {
//   return <div className="flex min-h-screen bg-[#f4f7fb]"><Sidebar /><main className="min-w-0 flex-1"><Header /><div className="p-4 md:p-6"><Outlet /></div></main></div>;
// }


import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb]">
      {/* Sidebar has its own height and scrolling */}
      <Sidebar />

      {/* Right section */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header remains fixed */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* Only this section scrolls */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}