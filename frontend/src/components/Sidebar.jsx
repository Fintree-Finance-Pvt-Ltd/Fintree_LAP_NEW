// import { NavLink } from "react-router-dom";
// import {
//   FaBriefcase,
//   FaFileAlt,
//   FaUserPlus,
//   FaMapMarkerAlt,
//   FaFolderOpen,
//   FaReceipt,
//   FaCreditCard,
//   FaPaperPlane,
//   FaHome,
//   FaPlayCircle,
//   FaRoute,
//   FaUsers,
//   FaSlidersH,
//   FaShieldAlt,
//   FaLink,
//   FaFolder,
//   FaChartBar,
//   FaHistory,
// } from "react-icons/fa";
// import { useAuth } from "../hooks/useAuth";

// const rolesConfig = {
//   RM: [
//     {
//       category: "PRIMARY",
//       items: [{ to: "/rmDashboard", label: "My Work", Icon: FaBriefcase }],
//     },
//     {
//       category: "MODULES",
//       items: [
//         { to: "/my-leads", label: "My Leads", Icon: FaFileAlt },
//         { to: "/create-lead", label: "Create Lead", Icon: FaUserPlus },
//         {
//           to: "/customer-visit",
//           label: "Customer / Business Visit",
//           Icon: FaBriefcase,
//         },
//         {
//           to: "/geo-verification",
//           label: "Geo Verification",
//           Icon: FaMapMarkerAlt,
//         },
//         { to: "/kyc-documents", label: "KYC & Documents", Icon: FaFolderOpen },
//         {
//           to: "/charges-receipts",
//           label: "Charges & Receipts",
//           Icon: FaReceipt,
//         },
//         {
//           to: "/payment-management",
//           label: "Payment Management",
//           Icon: FaCreditCard,
//         },
//         { to: "/submit-bm", label: "Submit to BM", Icon: FaPaperPlane },
//       ],
//     },
//   ],


//   ADMIN: [
//     {
//       category: "PRIMARY",
//       items: [{ to: "/adminDashboard", label: "My Work", Icon: FaBriefcase }],
//     },
//     {
//       category: "MODULES",
//       items: [
       
       
//         {
//           to: "/roles-access",
//           label: "Users & Roles",
//           Icon: FaReceipt,
//         },
//         {
//           to: "/payment-management",
//           label: "Payment Management",
//           Icon: FaCreditCard,
//         },
//         { to: "/submit-bm", label: "Submit to BM", Icon: FaPaperPlane },
//       ],
//     },
//   ],
  
//    BM: [
//     {
//       category: "PRIMARY",
//       items: [{ to: "/bmDashboard", label: "My Work", Icon: FaBriefcase }],
//     },
//     {
//       category: "MODULES",
//       items: [
       
       
//         {
//           to: "/bmReview",
//           label: "BM Review",
//           Icon: FaReceipt,
//         },
        
//       ],
//     },
//   ],
// };

// const groupOrder = [
//   "PRIMARY",
//   "MODULES",
//   "REFERENCE",
//   "ADMINISTRATION",
//   "OPERATIONS",
//   "FINANCE",
// ];

// function normalizeRoles(user) {
//   const roles = user?.roles;
//   if (!roles) return [];
//   return Array.isArray(roles) ? roles : [roles];
// }

// export default function Sidebar() {
//   const { user } = useAuth();
//   const roles = normalizeRoles(user);

//   const allowedGroups = groupOrder
//     .map((category) => {
//       const collected = [];
//       const seenTo = new Set();

//       const roleKeysInOrder = ["RM","BM", "ADMIN" ];
//       for (const roleKey of roleKeysInOrder) {
//         if (!roles.includes(roleKey)) continue;
//         const roleGroups = rolesConfig[roleKey] || [];

//         const group = roleGroups.find((g) => g.category === category);
//         if (!group) continue;

//         for (const item of group.items) {
//           if (seenTo.has(item.to)) continue;
//           seenTo.add(item.to);
//           collected.push(item);
//         }
//       }

//       if (!collected.length) return null;
//       return { category, items: collected };
//     })
//     .filter(Boolean);

//   return (
//     <aside className="hidden w-72 shrink-0 bg-[#0f1d40] text-slate-400 p-4 md:flex flex-col h-screen overflow-y-auto select-none">
//       <div className="mb-8 px-3">
//         <div className="text-white text-xl font-bold tracking-wide">Fintree LAP</div>
//         <div className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5">
//           LOS • LMS PORTAL
//         </div>
//       </div>

//       <nav className="space-y-6 flex-1">
//         {allowedGroups.map((group) => (
//           <div key={group.category} className="space-y-1">
//             <div className="px-3 text-[10px] font-bold tracking-widest text-slate-500 mb-2">
//               {group.category}
//             </div>

//             {group.items.map(({ to, label, Icon }) => (
//               <NavLink
//                 key={to}
//                 to={to}
//                 className={({ isActive }) =>
//                   `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
//                     isActive
//                       ? "bg-gradient-to-r from-[#1e6199] to-[#2b8cc4] text-white shadow-lg shadow-[#1e6199]/20 font-semibold border-l-4 border-cyan-400"
//                       : "hover:bg-white/5 hover:text-white"
//                   }`
//                 }
//               >
//                 <Icon className="text-base shrink-0" />
//                 <span className="truncate">{label}</span>
//               </NavLink>
//             ))}
//           </div>
//         ))}
//       </nav>
//     </aside>
//   );
// }

