import { NavLink, useLocation } from "react-router-dom";
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
  FaBalanceScale,
  FaFileContract,
  FaSearch,
  FaQuestionCircle,
  FaClipboardList,
  FaRupeeSign,
  FaUniversity,
  FaHandshake,
  FaBuilding,
  FaSitemap,
  FaTachometerAlt,
  FaClock
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

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

        // { to: "/submit-bm", label: "Submit to BM", Icon: FaPaperPlane },
      ],
    },
  ],


  ADMIN: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/adminDashboard",
          label: "My Work",
          Icon: FaBriefcase,
        },
      ],
    },
    {
      category: "MODULES",
      items: [
        {
          to: "/admin/administration",
          label: "Administration",
          Icon: FaSlidersH,
        },
        {
          to: "/roles-access?tab=users",
          label: "Users",
          Icon: FaUsers,
          tab: "users",
        },
        {
          to: "/roles-access?tab=permissions",
          label: "Permissions",
          Icon: FaShieldAlt,
          tab: "permissions",
        },
        {
          to: "/admin/partners",
          label: "Partners",
          Icon: FaHandshake,
        },
        {
          to: "/admin/hub",
          label: "Hub",
          Icon: FaBuilding,
        },
        {
          to: "/admin/spokes",
          label: "Spokes",
          Icon: FaSitemap,
        },
        {
          to: "/payment-management",
          label: "Payment Management",
          Icon: FaCreditCard,
        },
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


  // Legal
  LEGAL: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/legal-dashboard",
          label: "Legal Dashboard",
          Icon: FaChartBar,
        },
      ],
    },
    {
      category: "MODULES",
      items: [
        {
          to: "/legal-queue",
          label: "Legal Queue",
          Icon: FaBalanceScale,
        },
        {
          to: "/kyc-documents",
          label: "KYC & Documents",
          Icon: FaFolderOpen
        },
      ],
    },

  ],
  CM: [
    {
      category: "PRIMARY",
      items: [

        {
          to: "/credit-dashboard",
          label: "Credit Dashboard",
          Icon: FaChartBar,
        },


      ],
    },
    {
      category: "MODULES",
      items: [

        {
          to: "/cm-screening",
          label: "CM Screening",
          Icon: FaShieldAlt,
        },
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
          to: "/kyc-documents",
          label: "KYC & Documents",
          Icon: FaFolderOpen
        },
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

        {
          to: "/credit-maker",
          label: "Underwriting Proposal",
          Icon: FaFileAlt,
        },
        {
          to: "/legal-approved-to-credit-maker",
          label: "Legal Approved Cases",
          Icon: FaFileAlt,
        },

        {
          to: "/kyc-documents",
          label: "KYC & Documents",
          Icon: FaFolderOpen
        },
      ]
    },
  ],

  CREDIT_CHECKER: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/credit-dashboard",
          label: "Credit Dashboard",
          Icon: FaChartBar,
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
          label: "Comparable Analysis",
          Icon: FaRoute,
        },

        {
          to: "/field-visits",
          label: "Visit Photo Upload",
          Icon: FaFolderOpen,
        },
        {
          to: "/geo-verification",
          label: "Geo Verification",
          Icon: FaMapMarkerAlt,
        },


        {
          to: "/kyc-documents",
          label: "KYC & Documents",
          Icon: FaFolderOpen
        },

        {
          to: "/payment-management",
          label: "Payment Management",
          Icon: FaCreditCard,
        },



      ],
    },
  ],


  OPS_MAKER: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/operationsDashboard",
          label: "Operations Dashboard",
          Icon: FaBriefcase,
        },
      ],
    },
    {
      category: "MODULES",
      items: [
        {
          to: "/operations-review",
          label: "review",
          Icon: FaFolderOpen,
        },
        {
          to: "/operations/maker/:applicationId",
          label: "Ops Maker",
          Icon: FaShieldAlt,
        },
        {
          to: "/operations/legal-cleared",
          label: "Legal Cleared",
          Icon: FaFileAlt,
        },

      ],
    },
  ],


  OPS_HEAD: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/operationsDashboard",
          label: "Operations Dashboard",
          Icon: FaBriefcase,
        },
      ],
    },
    {
      category: "MODULES",
      items: [
        {
          to: "/operations-review",
          label: "review",
          Icon: FaFolderOpen,
        },
        {
          to: "/operations/head",
          label: "Ops Head",
          Icon: FaShieldAlt,
        },

      ],
    },
  ],
  OPS_CHECKER: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/operationsDashboard",
          label: "Operations Dashboard",
          Icon: FaBriefcase,
        },
      ],
    },
    {
      category: "MODULES",
      items: [
        {
          to: "/operations-review",
          label: "review",
          Icon: FaFolderOpen,
        },
        {
          to: "/operations/checker/:applicationId",
          label: "Ops Checker",
          Icon: FaShieldAlt,
        },
        {
          to: "/operations-review",
          label: "review",
          Icon: FaFolderOpen,
        },
      ],
    },

  ],

  LMS: [
    {
      category: "PRIMARY",
      items: [
        {
          to: "/lms-dashboard",
          label: "LMS Dashboard",
          Icon: FaChartBar,
        },
      ],
    },
    {
      category: "MODULES",
      items: [
        { to: "/lms/loan-accounts", label: "Loan Accounts", Icon: FaUniversity },
        { to: "/lms/disbursements", label: "Disbursements", Icon: FaRupeeSign },
        { to: "/lms/repayments", label: "Repayments", Icon: FaReceipt },
        { to: "/lms/utr-upload", label: "UTR Upload", Icon: FaClipboardList },
        { to: "/lms/nach", label: "NACH / eNACH", Icon: FaFileContract },
        { to: "/lms/soa", label: "Statement of Account", Icon: FaFileAlt },
        { to: "/lms/collections", label: "Collections", Icon: FaUsers },

      ],
    },
  ],

  COMMON: [
    {
      category: "ATTENDANCE",
      items: [
        {
          to: "/attendance",
          label: "Attendance",
          Icon: FaClock,
        },
      ],
    },
    {
      category: "REFERENCE",
      items: [
        {
          to: "/reports",
          label: "MIS & Reports",
          Icon: FaChartBar,
        },
      ],
    },
  ],

}


const groupOrder = [
  "PRIMARY",
  "ATTENDANCE",
  "MODULES",
  "REFERENCE",
  "LEGAL_PAYMENT_MODULES",
  "ADMINISTRATION",
  "OPERATIONS",
  "FINANCE",
];


function normalizeRoles(user) {
  const roles = user?.roles ?? user?.role;
  if (!roles) return [];
  return (Array.isArray(roles) ? roles : [roles])
    .map((role) => String(role?.code || role?.name || role?.role || role).toUpperCase())
    .filter(Boolean);
}

export function useSidebarNav() {
  const { user } = useAuth();
  const location = useLocation();
  const roles = normalizeRoles(user);
  const currentRoleAccessTab =
    new URLSearchParams(location.search).get("tab") || "users";

  const allowedGroups = groupOrder
    .map((category) => {
      const collected = [];
      const seenTo = new Set();

      const roleKeysInOrder = [
        "RM",
        "BM",
        "ADMIN",
        "CM",
        "CREDIT_MAKER",
        "CREDIT_CHECKER",
        "VALUATION",
        "LEGAL",
        "OPS_CHECKER",
        "OPS_HEAD",
        "OPS_MAKER",
        "LMS",
        "COMMON",
        "LEGALCLEARED",
      ];
      for (const roleKey of roleKeysInOrder) {
        if (roleKey !== "COMMON" && !roles.includes(roleKey)) {
          continue;
        }
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

  return { allowedGroups, location, currentRoleAccessTab };
}

export function SidebarNavLinks({ onNavigate }) {
  const { allowedGroups, location, currentRoleAccessTab } = useSidebarNav();

  return (
    <nav className="flex-1 space-y-6">
      {allowedGroups.map((group) => (
        <div key={group.category} className="space-y-1">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {group.displayCategory || group.category}
          </div>

          {group.items.map(({ to, label, Icon, tab }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) => {
                const roleAccessActive =
                  tab &&
                  location.pathname === "/roles-access" &&
                  currentRoleAccessTab === tab;

                const itemIsActive = tab ? roleAccessActive : isActive;

                return `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  itemIsActive
                    ? "border-l-4 border-cyan-400 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-600/10"
                    : "hover:bg-white/5 hover:text-slate-200"
                }`;
              }}
            >
              <Icon className="shrink-0 text-base opacity-80" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 select-none flex-col overflow-y-auto border-r border-slate-800/40 bg-[#0b1426] p-5 text-slate-400 lg:flex lg:w-72">
      <div className="mb-8 px-2">
        <div className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-xl font-bold tracking-wider text-transparent text-white">
          Fintree LAP
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-500">
          LOS • LMS PORTAL
        </div>
      </div>
      <SidebarNavLinks />
    </aside>
  );
}
