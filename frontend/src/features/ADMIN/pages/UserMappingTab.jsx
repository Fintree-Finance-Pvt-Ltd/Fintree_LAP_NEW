import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaKey,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

import { usersApi } from "../userApi";

function getErrorMessage(
  error,
  fallbackMessage,
) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage;

  return Array.isArray(message)
    ? message.join(", ")
    : String(message);
}

function isCanceledRequest(error) {
  return (
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED" ||
    error?.message === "canceled" ||
    error?.message === "Canceled"
  );
}

function getRoleName(user) {
  const role =
    user?.primaryRole ||
    user?.role ||
    user?.roles?.[0];

  if (!role) {
    return "Not Assigned";
  }

  if (typeof role === "string") {
    return role;
  }

  return (
    role?.name ||
    role?.roleName ||
    role?.role ||
    role?.code ||
    "Not Assigned"
  );
}

function normalizeUser(user) {
  const permissions =
    Array.isArray(user?.permissions)
      ? user.permissions
          .map((permission) => ({
            id: Number(
              permission?.id,
            ),
            code: String(
              permission?.code || "",
            ).trim(),
            name: String(
              permission?.name ||
                permission?.code ||
                "",
            ).trim(),
          }))
          .filter(
            (permission) =>
              Number.isInteger(
                permission.id,
              ) &&
              permission.id > 0 &&
              permission.name,
          )
      : [];

  return {
    id:
      user?.userId ??
      user?.id,
    name:
      user?.name || "-",
    email:
      user?.email || "-",
    role:
      user?.role?.name ||
      user?.role?.code ||
      getRoleName(user),
    permissions,
  };
}

function PermissionBadges({
  permissions = [],
  maxVisible = 6,
}) {
  if (!permissions.length) {
    return (
      <span className="text-xs font-medium text-slate-400">
        No permissions assigned
      </span>
    );
  }

  const permissionTitle = permissions
    .map((permission) => permission.name)
    .join(", ");

  return (
    <div
      className="flex max-w-[680px] flex-wrap gap-2"
      title={permissionTitle}
    >
      {permissions
        .slice(0, maxVisible)
        .map((permission) => (
          <span
            key={
              permission.id ??
              permission.code
            }
            className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
          >
            {permission.name}
          </span>
        ))}

      {permissions.length > maxVisible && (
        <span
          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
          title={permissionTitle}
        >
          +{permissions.length - maxVisible} more
        </span>
      )}
    </div>
  );
}

export default function UserMappingTab() {
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [apiError, setApiError] =
    useState("");

  const loadUsers = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setApiError("");

        const response =
          await usersApi.getUsersRoleAccess({
            signal,
          });

        const responseData =
          response?.data?.data?.users ??
          response?.data?.users ??
          response?.data?.data ??
          response?.data ??
          [];

        if (
          !Array.isArray(responseData)
        ) {
          throw new Error(
            "Invalid users response received from server.",
          );
        }

        setUsers(
          responseData.map(
            normalizeUser,
          ),
        );
      } catch (error) {
        if (isCanceledRequest(error)) {
          return;
        }

        console.error(
          "Unable to load user permission mapping:",
          error,
        );

        setUsers([]);

        setApiError(
          getErrorMessage(
            error,
            "Unable to load user permission mapping.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    loadUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadUsers]);

  const summary = useMemo(() => {
    const roles = new Set();
    let permissionAssignments = 0;

    users.forEach((user) => {
      if (
        user.role &&
        user.role !== "Not Assigned"
      ) {
        roles.add(user.role);
      }

      permissionAssignments +=
        user.permissions.length;
    });

    return {
      users: users.length,
      roles: roles.size,
      permissionAssignments,
    };
  }, [users]);

  return (
    <div className="min-h-full">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(35,52,95,0.08)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">
                <FaShieldAlt />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
                  User permission mapping
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  View each system user, their assigned role,
                  and all permissions inherited from that role.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-2xl border border-white bg-white/80 px-3 py-3 text-center shadow-sm sm:px-5">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <FaUsers />
                  Users
                </div>

                <p className="mt-1 text-lg font-black text-slate-800">
                  {summary.users}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white bg-white/80 px-3 py-3 text-center shadow-sm sm:px-5">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <FaShieldAlt />
                  Roles
                </div>

                <p className="mt-1 text-lg font-black text-slate-800">
                  {summary.roles}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white bg-white/80 px-3 py-3 text-center shadow-sm sm:px-5">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <FaKey />
                  Access
                </div>

                <p className="mt-1 text-lg font-black text-slate-800">
                  {summary.permissionAssignments}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-7">
          <div className="overflow-x-auto rounded-[22px] border border-slate-200">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-[#f4f5ff]">
                  {[
                    "USER",
                    "ROLE",
                    "ASSIGNED PERMISSIONS",
                    "TOTAL",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b-2 border-indigo-200 px-5 py-4 text-xs font-black tracking-[0.06em] text-indigo-800"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center"
                    >
                      <div className="inline-flex items-center gap-3 text-sm font-medium text-slate-500">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                        Loading user permission mapping...
                      </div>
                    </td>
                  </tr>
                ) : apiError ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center"
                    >
                      <p className="text-sm font-semibold text-red-600">
                        {apiError}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          loadUsers()
                        }
                        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map(
                    (user, index) => {
                      const cellClass = `
                        border-b border-slate-200
                        px-5 py-4
                        align-top
                        transition
                        group-hover:bg-indigo-50/40
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }
                      `;

                      return (
                        <tr
                          key={
                            user.id ??
                            user.email
                          }
                          className="group"
                        >
                          <td className={cellClass}>
                            <strong className="block text-sm font-bold text-slate-700">
                              {user.name || "-"}
                            </strong>

                            <span className="mt-1 block text-xs text-slate-500">
                              {user.email || "-"}
                            </span>
                          </td>

                          <td
                            className={`${cellClass} text-sm font-semibold text-slate-700`}
                          >
                            {user.role ||
                              "Not Assigned"}
                          </td>

                          <td className={cellClass}>
                            <PermissionBadges
                              permissions={
                                user.permissions
                              }
                            />
                          </td>

                          <td className={cellClass}>
                            <span className="inline-flex min-w-[44px] items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">
                              {user.permissions.length}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center"
                    >
                      <p className="text-sm font-medium text-slate-500">
                        No user permission mapping found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}