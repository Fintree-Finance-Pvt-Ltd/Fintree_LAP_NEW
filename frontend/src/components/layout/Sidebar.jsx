import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import {
  FaBriefcase,
  FaFileAlt,
  FaUserPlus,
  FaMapMarkerAlt,
  FaFolderOpen,
  FaReceipt,
  FaCreditCard,
  FaPaperPlane,
  FaHome,
  FaPlayCircle,
  FaRoute,
  FaUsers,
  FaSlidersH,
  FaShieldAlt,
  FaLink,
  FaFolder,
  FaChartBar,
  FaHistory,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { rmApi } from "../../features/rm/rmApi.js";

const rolesConfig = {
  RM: [
    {
      category: "PRIMARY",
      items: [{ to: "/rmDashboard", label: "My Work", Icon: FaBriefcase }],
    },
    {
      category: "MODULES",
      items: [
        { to: "/my-leads", label: "My Leads", Icon: FaFileAlt },
        { to: "/create-lead", label: "Create Lead", Icon: FaUserPlus },

       { to: "/kyc-documents", label: "KYC & Documents", Icon: FaFolderOpen },

        // { to: "/submit-bm", label: "Submit to BM", Icon: FaPaperPlane },
      ],
    },
  ],
  

  ADMIN: [
    {
      category: "PRIMARY",
      items: [{ to: "/adminDashboard", label: "My Work", Icon: FaBriefcase }],
    },
    {
      category: "MODULES",
      items: [
        {
          to: "/roles-access",
          label: "Users & Roles",
          Icon: FaUsers,
        },
        {
          to: "/payment-management",
          label: "Payment Management",
          Icon: FaCreditCard,
        },
        // { to: "/submit-bm", label: "Submit to BM", Icon: FaPaperPlane },
      ],
    },
  ],


  BM: [
    {
      category: "PRIMARY",
      items: [{ to: "/bmDashboard", label: "My Work", Icon: FaBriefcase }],
    },
    
    {
      category: "MODULES",
      items: [
           { to: "/my-leads", label: "My Leads", Icon: FaFileAlt },
        { to: "/create-lead", label: "Create Lead", Icon: FaUserPlus },
        {
          to: "/customer-visit",
          label: "Customer / Business Visit",
          Icon: FaBriefcase,
        },
        {
          to: "/geo-verification",
          label: "Geo Verification",
          Icon: FaMapMarkerAlt,
        },
        { to: "/kyc-documents", label: "KYC & Documents", Icon: FaFolderOpen },
        {
          to: "/charges-receipts",
          label: "Charges & Receipts",
          Icon: FaReceipt,
        },
        {
          to: "/payment-management",

          label: "Payment Management",
          Icon: FaCreditCard,
        },
       { to: "/submit-bm", label: "Submit to CM", Icon: FaPaperPlane },
      ],
    },
  ],

CM: [
  {
    category: "PRIMARY",
    items: [
      {
        to: "/cm-screening",
        label: "CM Screening",
        Icon: FaShieldAlt,
      },
      
    ],
  },
  {
    category: "MODULES",
    items: [

      
      {
        to: "/cm-application-data",
        label: "Application Data",
        Icon: FaFolderOpen,
      },
      {
        to: "/cm-screening",
        label: "Credit Screening",
        Icon: FaShieldAlt,
      },
      {
        to: "/credit-dashboard",
        label: "Credit Dashboard",
        Icon: FaChartBar,
      },
         { to: "/kyc-documents",
           label: "KYC & Documents",
           Icon: FaFolderOpen },
    ],
  },
],

CREDIT_MAKER: [
  {
    category: "PRIMARY",
    items: [
      {
        to: "/credit-dashboard",
        label: "Credit Dashboard",
        Icon: FaShieldAlt,
      },
    ],
  },
  {
    category: "MODULES",
    items: [
      {
        to: "/cm-application-data",
        label: "Application Data",
        Icon: FaFolderOpen,
      },
      // {
      //   to: "/cm-screening",
      //   label: "Credit Screening",
      //   Icon: FaShieldAlt,
      // },
     {
        to: "/credit-maker",
        label: "Underwriting Proposal",
        Icon: FaFileAlt,
      },
      {
        to: "/credit-dashboard",
        label: "Credit Dashboard",
        Icon: FaChartBar,
      },
         { to: "/kyc-documents",
           label: "KYC & Documents",
           Icon: FaFolderOpen },
          ]
  },
],

CREDIT_CHECKER: [
  {
    category: "PRIMARY",
    items: [
      {
        to: "/credit-checker",
        label: "Credit Checker",
        Icon: FaShieldAlt,
      },
    ],
  },
  {
    category: "MODULES",
    items: [
      {
        to: "/credit-checker",
        label: "Checker Review",
        Icon: FaFileAlt,
      },
      {
        to: "/credit-dashboard",
        label: "Credit Dashboard",
        Icon: FaChartBar,
      },
      {
        to: "/cm-application-data",
        label: "Application Data",
        Icon: FaFolderOpen,
      },
      {
        to: "/kyc-documents",
        label: "KYC & Documents",
        Icon: FaFolderOpen,
      },
    ],
  },
],

VALUATION: [
  {
    category: "PRIMARY",
    items: [
      {
        to: "/valuation-dashboard",
        label: "Valuation Dashboard",
        Icon: FaBriefcase,
      },
    ],
  },
  {
    category: "MODULES",
    items: [
      {
        to: "/valuation",
        label: "Valuation Queue",
        Icon: FaFolderOpen,
      },
      {
        to: "/valuation",
        label: "Comparable Analysis",
        Icon: FaRoute,
      },
      {
        to: "/payment-management",
        label: "Payment Management",
        Icon: FaCreditCard,
      },
    ],
  },
],

};

const groupOrder = [
  "PRIMARY",
  "MODULES",
  "REFERENCE",
  "ADMINISTRATION",
  "OPERATIONS",
  "FINANCE",
];

function normalizeRoles(user) {
  const roles = user?.roles;
  if (!roles) return [];
  return Array.isArray(roles) ? roles : [roles];
}

export default function Sidebar() {
  const { user } = useAuth();
  const roles = normalizeRoles(user);
  const currentPath = window.location.pathname;

  const workflowQuery = useQuery({
    queryKey: ["rm-sidebar-workflow"],
    queryFn: async () => {
      const leads = (await rmApi.applications({ page: 1, limit: 20 })).data ?? [];
      const latest = leads[0];
      if (!latest?.id) return {};
      return (await rmApi.workflowStatus(latest.id)).data ?? {};
    },
    enabled: roles.includes("RM") && ["/my-leads", "/create-lead", "/customer-visit", "/geo-verification", "/kyc-documents", "/submit-bm"].includes(currentPath),
    retry: false,
  });

  const workflowState = workflowQuery.data ?? {};
  const nextRoute = useMemo(() => {
    if (!workflowState.leadSubmitted) return "/create-lead";
    if (!workflowState.customerVisit) return "/customer-visit";
    if (!workflowState.businessVisit) return "/customer-visit";
    if (!workflowState.geoVerification) return "/geo-verification";
    if (!workflowState.documentsUploaded) return "/kyc-documents";
    if (!workflowState.submittedToBm) return "/submit-bm";
    return "/submit-bm";
  }, [workflowState]);

  const allowedGroups = groupOrder
    .map((category) => {
      const collected = [];
      const seenTo = new Set();

      const roleKeysInOrder = ["RM", "BM", "ADMIN","CM","CREDIT_MAKER","CREDIT_CHECKER","VALUATION"];
      for (const roleKey of roleKeysInOrder) {
        if (!roles.includes(roleKey)) continue;
        const roleGroups = rolesConfig[roleKey] || [];
        const group = roleGroups.find((g) => g.category === category);
        if (!group) continue;

        for (const item of group.items) {
          if (seenTo.has(item.to)) continue;
          seenTo.add(item.to);
          collected.push(item);
        }
      }

      if (!collected.length) return null;
      return { category, items: collected };
    })
    .filter(Boolean);

  return (
    <aside className="hidden w-72 shrink-0 bg-[#0b1426] text-slate-400 p-5 md:flex flex-col h-screen overflow-y-auto select-none border-r border-slate-800/40">
      {/* Brand Header */}
      <div className="mb-8 px-2">
        <div className="text-white text-xl font-bold tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Fintree LAP
        </div>
        <div className="text-[10px] text-cyan-500 font-bold tracking-widest mt-1 uppercase">
          LOS • LMS PORTAL
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="space-y-6 flex-1">
        {allowedGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">
              {group.category}
            </div>

            {group.items.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/10 font-semibold border-l-4 border-cyan-400"
                    : "hover:bg-white/5 hover:text-slate-200"
                  }`
                }
              >
                <Icon className="text-base shrink-0 opacity-80" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}