import {
  FaKey,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import {
  useSearchParams,
} from "react-router-dom";

import PermissionsTab from "./PermissionsTab";
import UserMappingTab from "./UserMappingTab";
import UsersTab from "./UsersTab";

const tabs = [
  {
    id: "users",
    label: "Users",
    Icon: FaUsers,
  },
  {
    id: "permissions",
    label: "Permissions",
    Icon: FaKey,
  },
  {
    id: "mapping",
    label: "User Mapping",
    Icon: FaShieldAlt,
  },
];

export default function RolesAccess() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedTab =
    searchParams.get("tab");

  const activeTab = tabs.some(
    (tab) => tab.id === requestedTab,
  )
    ? requestedTab
    : "users";

  const handleTabChange = (tab) => {
    setSearchParams({
      tab,
    });
  };

  return (
    <div className="min-h-full">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:inline-grid sm:grid-cols-3">
          {tabs.map(
            ({
              id,
              label,
              Icon,
            }) => {
              const isActive =
                activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    handleTabChange(id)
                  }
                  className={`flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon />

                  <span>
                    {label}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      {activeTab === "users" && (
        <UsersTab />
      )}

      {activeTab ===
        "permissions" && (
        <PermissionsTab />
      )}

      {activeTab === "mapping" && (
        <UserMappingTab />
      )}
    </div>
  );
}
