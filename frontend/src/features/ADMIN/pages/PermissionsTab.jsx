import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaCheck,
  FaKey,
  FaSave,
  FaSearch,
} from "react-icons/fa";

import { usersApi } from "../userApi";

function isCanceledRequest(error) {
  return (
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED" ||
    error?.message === "canceled" ||
    error?.message === "Canceled"
  );
}

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

function getResponsePayload(response) {
  return (
    response?.data?.data ??
    response?.data ??
    {}
  );
}

function getArrayResponse(
  response,
  key,
) {
  const payload =
    getResponsePayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (
    Array.isArray(
      response?.data?.[key],
    )
  ) {
    return response.data[key];
  }

  if (
    Array.isArray(
      payload?.data?.[key],
    )
  ) {
    return payload.data[key];
  }

  return [];
}

function formatPermissionName(code) {
  return String(code || "")
    .replace(/:/g, " ")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function normalizePermission(
  permission,
) {
  const id = Number(permission?.id);

  const code = String(
    permission?.code || "",
  ).trim();

  const moduleName = String(
    permission?.module ||
      code.split(":")[0] ||
      "OTHER",
  )
    .replace(/-/g, " ")
    .toUpperCase();

  return {
    id,
    code,
    name:
      String(
        permission?.name || "",
      ).trim() ||
      formatPermissionName(code),
    module: moduleName,
  };
}

export default function PermissionsTab() {
  const [roles, setRoles] =
    useState([]);

  const [
    permissions,
    setPermissions,
  ] = useState([]);

  const [
    selectedRoleId,
    setSelectedRoleId,
  ] = useState("");

  const [
    selectedPermissionIds,
    setSelectedPermissionIds,
  ] = useState([]);

  const [search, setSearch] =
    useState("");

  const [
    rolesLoading,
    setRolesLoading,
  ] = useState(true);

  const [
    permissionsLoading,
    setPermissionsLoading,
  ] = useState(true);

  const [
    rolePermissionsLoading,
    setRolePermissionsLoading,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    rolesError,
    setRolesError,
  ] = useState("");

  const [
    permissionsError,
    setPermissionsError,
  ] = useState("");

  const [
    rolePermissionsError,
    setRolePermissionsError,
  ] = useState("");

  const [
    saveError,
    setSaveError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadRoles = useCallback(
    async (signal) => {
      try {
        setRolesLoading(true);
        setRolesError("");

        const response =
          await usersApi.getRoles({
            signal,
          });

        const responseData =
          getArrayResponse(
            response,
            "roles",
          );

        const normalizedRoles =
          responseData
            .map((role) => ({
              id: Number(role?.id),
              name: String(
                role?.name ||
                  role?.code ||
                  "",
              ).trim(),
            }))
            .filter(
              (role) =>
                Number.isInteger(
                  role.id,
                ) &&
                role.id > 0 &&
                role.name,
            );

        setRoles(normalizedRoles);
      } catch (error) {
        if (isCanceledRequest(error)) {
          return;
        }

        console.error(
          "Unable to load roles:",
          error,
        );

        setRoles([]);

        setRolesError(
          getErrorMessage(
            error,
            "Unable to load roles.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setRolesLoading(false);
        }
      }
    },
    [],
  );

  const loadPermissions =
    useCallback(async (signal) => {
      try {
        setPermissionsLoading(true);
        setPermissionsError("");

        const response =
          await usersApi.getPermissions({
            signal,
          });

        const responseData =
          getArrayResponse(
            response,
            "permissions",
          );

        const normalizedPermissions =
          responseData
            .map(
              normalizePermission,
            )
            .filter(
              (permission) =>
                Number.isInteger(
                  permission.id,
                ) &&
                permission.id > 0 &&
                permission.name,
            );

        setPermissions(
          normalizedPermissions,
        );
      } catch (error) {
        if (isCanceledRequest(error)) {
          return;
        }

        console.error(
          "Unable to load permissions:",
          error,
        );

        setPermissions([]);

        setPermissionsError(
          getErrorMessage(
            error,
            "Unable to load permissions.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setPermissionsLoading(false);
        }
      }
    }, []);

  const loadRolePermissions =
    useCallback(
      async (
        roleId,
        signal,
      ) => {
        if (!roleId) {
          setSelectedPermissionIds([]);
          return;
        }

        try {
          setRolePermissionsLoading(
            true,
          );

          setRolePermissionsError("");
          setSaveError("");
          setSuccessMessage("");

          const response =
            await usersApi.getRolePermissions(
              roleId,
              {
                signal,
              },
            );

          const payload =
            getResponsePayload(
              response,
            );

          const permissionIds =
            payload?.permissionIds ??
            response?.data
              ?.permissionIds ??
            payload?.data
              ?.permissionIds;

          const assignedPermissions =
            payload?.permissions ??
            response?.data
              ?.permissions ??
            payload?.data?.permissions;

          let normalizedIds = [];

          if (
            Array.isArray(permissionIds)
          ) {
            normalizedIds =
              permissionIds.map(Number);
          } else if (
            Array.isArray(
              assignedPermissions,
            )
          ) {
            normalizedIds =
              assignedPermissions.map(
                (permission) =>
                  Number(
                    permission?.id,
                  ),
              );
          }

          setSelectedPermissionIds(
            [
              ...new Set(
                normalizedIds.filter(
                  (id) =>
                    Number.isInteger(
                      id,
                    ) && id > 0,
                ),
              ),
            ],
          );
        } catch (error) {
          if (
            isCanceledRequest(error)
          ) {
            return;
          }

          console.error(
            "Unable to load role permissions:",
            error,
          );

          setSelectedPermissionIds(
            [],
          );

          setRolePermissionsError(
            getErrorMessage(
              error,
              "Unable to load role permissions.",
            ),
          );
        } finally {
          if (!signal?.aborted) {
            setRolePermissionsLoading(
              false,
            );
          }
        }
      },
      [],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadRoles(controller.signal);
    loadPermissions(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [
    loadPermissions,
    loadRoles,
  ]);

  useEffect(() => {
    if (!selectedRoleId) {
      setSelectedPermissionIds(
        [],
      );
      setRolePermissionsError(
        "",
      );
      setSuccessMessage("");
      setSaveError("");
      return undefined;
    }

    const controller =
      new AbortController();

    loadRolePermissions(
      Number(selectedRoleId),
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [
    loadRolePermissions,
    selectedRoleId,
  ]);

  const selectedRole =
    useMemo(
      () =>
        roles.find(
          (role) =>
            Number(role.id) ===
            Number(selectedRoleId),
        ),
      [
        roles,
        selectedRoleId,
      ],
    );

  const filteredPermissions =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return permissions;
      }

      return permissions.filter(
        (permission) =>
          [
            permission.name,
            permission.code,
            permission.module,
          ].some((value) =>
            String(value)
              .toLowerCase()
              .includes(query),
          ),
      );
    }, [permissions, search]);

  const groupedPermissions =
    useMemo(() => {
      return filteredPermissions.reduce(
        (groups, permission) => {
          const moduleName =
            permission.module ||
            "OTHER";

          if (!groups[moduleName]) {
            groups[moduleName] = [];
          }

          groups[moduleName].push(
            permission,
          );

          return groups;
        },
        {},
      );
    }, [filteredPermissions]);

  const selectedPermissionSet =
    useMemo(
      () =>
        new Set(
          selectedPermissionIds,
        ),
      [selectedPermissionIds],
    );

  const allVisibleSelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every(
      (permission) =>
        selectedPermissionSet.has(
          permission.id,
        ),
    );

  const handlePermissionToggle = (
    permissionId,
  ) => {
    setSuccessMessage("");
    setSaveError("");

    setSelectedPermissionIds(
      (previous) => {
        const updated = new Set(
          previous,
        );

        if (
          updated.has(permissionId)
        ) {
          updated.delete(permissionId);
        } else {
          updated.add(permissionId);
        }

        return Array.from(updated);
      },
    );
  };

  const handleVisibleSelectAll =
    () => {
      setSuccessMessage("");
      setSaveError("");

      setSelectedPermissionIds(
        (previous) => {
          const updated = new Set(
            previous,
          );

          if (allVisibleSelected) {
            filteredPermissions.forEach(
              (permission) =>
                updated.delete(
                  permission.id,
                ),
            );
          } else {
            filteredPermissions.forEach(
              (permission) =>
                updated.add(
                  permission.id,
                ),
            );
          }

          return Array.from(updated);
        },
      );
    };

  const handleSave = async () => {
    if (!selectedRoleId) {
      setSaveError(
        "Please select a role.",
      );
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      setSuccessMessage("");

      const permissionIds = [
        ...selectedPermissionIds,
      ].sort(
        (first, second) =>
          first - second,
      );

      await usersApi.updateRolePermissions(
        Number(selectedRoleId),
        permissionIds,
      );

      setSuccessMessage(
        `Permissions for ${
          selectedRole?.name ||
          "the selected role"
        } were updated successfully.`,
      );
    } catch (error) {
      console.error(
        "Unable to update role permissions:",
        error,
      );

      setSaveError(
        getErrorMessage(
          error,
          "Unable to update role permissions.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const initialLoading =
    rolesLoading ||
    permissionsLoading;

  return (
    <div className="pb-8">
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] px-6 py-9 text-white shadow-xl shadow-blue-900/10 md:px-11">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative z-10 flex items-start gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 text-2xl backdrop-blur-md">
            <FaKey />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Role Permissions
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
              Select a role and configure
              which system actions the role
              can perform.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(35,52,95,0.09)] sm:p-7">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">
              Select Role
            </span>

            <select
              value={selectedRoleId}
              onChange={(event) =>
                setSelectedRoleId(
                  event.target.value,
                )
              }
              disabled={rolesLoading}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {rolesLoading
                  ? "Loading roles..."
                  : "Select role"}
              </option>

              {roles.map((role) => (
                <option
                  key={role.id}
                  value={String(role.id)}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 sm:max-w-md">
              <FaSearch className="shrink-0 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search permissions"
                className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="whitespace-nowrap rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">
              {
                selectedPermissionIds.length
              }{" "}
              selected
            </div>
          </div>
        </div>

        {rolesError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {rolesError}
          </p>
        )}

        {permissionsError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {permissionsError}
          </p>
        )}

        {rolePermissionsError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {rolePermissionsError}
          </p>
        )}

        {saveError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {saveError}
          </p>
        )}

        {successMessage && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <FaCheck />
            {successMessage}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Available Permissions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {selectedRole
                  ? `Configure access for ${selectedRole.name}.`
                  : "Select a role to load its assigned permissions."}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleVisibleSelectAll
              }
              disabled={
                !selectedRoleId ||
                filteredPermissions.length ===
                  0 ||
                rolePermissionsLoading
              }
              className="h-10 rounded-xl border border-indigo-200 bg-white px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allVisibleSelected
                ? "Clear Visible"
                : "Select Visible"}
            </button>
          </div>

          {initialLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                Loading roles and
                permissions...
              </div>
            </div>
          ) : !selectedRoleId ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                <FaKey />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                Select a role
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Choose a role from the
                dropdown to view and update
                its assigned permissions.
              </p>
            </div>
          ) : rolePermissionsLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                Loading assigned
                permissions...
              </div>
            </div>
          ) : filteredPermissions.length ===
            0 ? (
            <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
              {search
                ? "No permissions match your search."
                : "No permissions are available."}
            </div>
          ) : (
            <div className="space-y-6 p-5 sm:p-6">
              {Object.entries(
                groupedPermissions,
              ).map(
                ([
                  moduleName,
                  modulePermissions,
                ]) => (
                  <div
                    key={moduleName}
                    className="overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50 px-5 py-3">
                      <h3 className="text-xs font-black tracking-[0.08em] text-indigo-700">
                        {moduleName}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
                      {modulePermissions.map(
                        (permission) => {
                          const checked =
                            selectedPermissionSet.has(
                              permission.id,
                            );

                          return (
                            <label
                              key={
                                permission.id
                              }
                              className={`flex cursor-pointer items-start gap-3 bg-white p-4 transition hover:bg-indigo-50/50 ${
                                checked
                                  ? "ring-1 ring-inset ring-indigo-200"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  checked
                                }
                                onChange={() =>
                                  handlePermissionToggle(
                                    permission.id,
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                              />

                              <span className="min-w-0">
                                <strong className="block text-sm font-bold text-slate-700">
                                  {
                                    permission.name
                                  }
                                </strong>

                                <span className="mt-1 block break-all text-xs text-slate-400">
                                  {
                                    permission.code
                                  }
                                </span>
                              </span>
                            </label>
                          );
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Saving will replace the selected
            role&apos;s current permissions.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={
              !selectedRoleId ||
              saving ||
              rolePermissionsLoading ||
              initialLoading
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Permissions
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}