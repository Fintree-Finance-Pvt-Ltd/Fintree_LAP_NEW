import { useMemo, useState, useCallback, useEffect, } from "react";
import {
  FaCheck,
  FaPlus,
  FaSearch,
  FaStar,
  FaTimes,
} from "react-icons/fa";

import { usersApi } from "../userApi";

const informationCards = [
  {
    title: "Access controls",
    points: [
      "OAuth/OIDC and short-lived tokens",
      "MFA for privileged and approval roles",
      "Role + geography + case-assignment scope",
      "Field-level masking for KYC/bank data",
    ],
  },
  {
    title: "Maker-checker conflicts",
    points: [
      "No self-approval",
      "Segregation of credit and operations",
      "Bank detail change requires checker",
      "Waiver/refund/adjustment controlled",
    ],
  },
  {
    title: "Lifecycle",
    points: [
      "Joiner / mover / leaver workflow",
      "Access expiry and periodic recertification",
      "Vendor and partner time-bound access",
      "Session and download audit",
    ],
  },
];

const emptyForm = {
  name: "",
  email: "",
  roleId: "",
  location: "",
  password: "",
};

function StatusBadge({ children }) {
  return (
    <span className="inline-flex min-w-[80px] items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
      {children}
    </span>
  );
}

function AddUserModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  submitError = "",
  roles = [],
  rolesLoading = false,
  rolesError = "",
  onRetryRoles,
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasEmptyField = Object.values(form).some(
      (value) => !String(value ?? "").trim(),
    );

    if (hasEmptyField) {
      setError("Please complete all fields.");
      return;
    }

    try {
      await onSubmit(form);

      setForm(emptyForm);
      setError("");
    } catch (error) {
      console.error(
        "User submission failed:",
        error,
      );
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setError("");
    onClose();
  };

  const inputClasses =
    "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Add User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a new LAP system user and assign access.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Full name

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={inputClasses}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email address

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@fintree.in"
                className={inputClasses}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Role

              <select
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
                disabled={rolesLoading || submitting}
                className={inputClasses}
              >
                <option value="">
                  {rolesLoading
                    ? "Loading roles..."
                    : roles.length === 0
                      ? "No roles available"
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

              {rolesError && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-red-600">
                    {rolesError}
                  </span>

                  <button
                    type="button"
                    onClick={onRetryRoles}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    Retry
                  </button>
                </div>
              )}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Location

              <select
                name="location"
                value={form.location}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="">Select location</option>
                <option value="Delhi Hub">Delhi Hub</option>
                <option value="Noida Spoke">Noida Spoke</option>
                <option value="Mumbai Hub">Mumbai Hub</option>
                <option value="Pune Spoke">Pune Spoke</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Password

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="new-password"
                className={inputClasses}
              />
            </label>
          </div>

          {(error || submitError) && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error || submitError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                rolesLoading ||
                roles.length === 0
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <FaCheck />
                  Add User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getRoleName(user) {
  const role =
    user?.primaryRole ||
    user?.role ||
    user?.roles?.[0];

  if (!role) return "Not Assigned";

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
  const fullName =
    user?.name ||
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ");

  const location =
    user?.location?.name ||
    user?.organizationUnit?.name ||
    user?.spoke?.name ||
    user?.hub?.name ||
    user?.location ||
    "-";

  const mfaEnabled =
    user?.mfaEnabled ??
    user?.mfa_enabled ??
    user?.isMfaEnabled;

  const active =
    user?.isActive ??
    user?.active ??
    String(user?.status || "").toUpperCase() ===
    "ACTIVE";

  return {
    id: user?.id,
    name: fullName || "-",
    email: user?.email || "-",
    role: getRoleName(user),
    location:location,
    dataScope:
      user?.dataScope ||
      user?.data_scope ||
      "Assigned Cases",
    mfa:
      mfaEnabled === false
        ? "Disabled"
        : "Enabled",
    status:
      active === false
        ? "Inactive"
        : "Active",
  };
}


export default function RolesAccess() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddUser, setShowAddUser] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");


  // const loadUsers = useCallback(async (signal) => {
  //   try {
  //     setLoading(true);
  //     setApiError("");

  //     const response =
  //       await usersApi.getAccessList({
  //         signal,
  //       });

  //     const responseData =
  //       response?.data?.data?.users ??
  //       response?.data?.users ??
  //       response?.data?.data ??
  //       response?.data ??
  //       [];

  //     if (!Array.isArray(responseData)) {
  //       throw new Error(
  //         "Invalid users response received from server.",
  //       );
  //     }

  //     setUsers(
  //       responseData.map(normalizeUser),
  //     );
  //   } catch (error) {
  //     if (
  //       error?.name === "CanceledError" ||
  //       error?.code === "ERR_CANCELED"
  //     ) {
  //       return;
  //     }

  //     console.error(
  //       "Unable to load users:",
  //       error,
  //     );

  //     setUsers([]);

  //     setApiError(
  //       error?.response?.data?.message ||
  //       error?.message ||
  //       "Unable to load users.",
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

    const loadUsers = useCallback(async (signal) => {
  try {
    setLoading(true);
    setApiError("");

    const response =
      await usersApi.getAllUsers({
        signal,
      });

    const responseData =
      response?.data?.data?.users ??
      response?.data?.users ??
      response?.data?.data ??
      response?.data ??
      [];

    if (!Array.isArray(responseData)) {
      throw new Error(
        "Invalid users response received from server.",
      );
    }

    setUsers(
      responseData.map(normalizeUser),
    );
  } catch (error) {
    const isCanceled =
      error?.name === "CanceledError" ||
      error?.code === "ERR_CANCELED" ||
      error?.message === "canceled" ||
      error?.message === "Canceled";

    if (isCanceled) {
      return;
    }

    console.error(
      "Unable to load users:",
      error,
    );

    setUsers([]);

    setApiError(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to load users.",
    );
  } finally {
    if (!signal?.aborted) {
      setLoading(false);
    }
  }
}, []);

  const loadRoles = useCallback(async (signal) => {
    try {
      setRolesLoading(true);
      setRolesError("");

      const response = await usersApi.getRoles({
        signal,
      });

      const responseData =
        response?.data?.data?.roles ??
        response?.data?.roles ??
        response?.data?.data ??
        response?.data ??
        [];

      if (!Array.isArray(responseData)) {
        throw new Error(
          "Invalid roles response received from server.",
        );
      }

      const normalizedRoles = responseData
        .map((role) => ({
          id: Number(role?.id),
          name: String(
            role?.name ||
            role?.roleName ||
            role?.code ||
            "",
          ).trim(),
        }))
        .filter(
          (role) =>
            Number.isInteger(role.id) &&
            role.id > 0 &&
            role.name,
        );

      setRoles(normalizedRoles);
    } catch (error) {
      const isCanceled =
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        error?.message === "canceled" ||
        error?.message === "Canceled";

      if (isCanceled) {
        return;
      }

      console.error(
        "Unable to load roles:",
        error,
      );

      setRoles([]);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load roles.";

      setRolesError(
        Array.isArray(message)
          ? message.join(", ")
          : String(message),
      );
    } finally {
      if (!signal?.aborted) {
        setRolesLoading(false);
      }
    }
  }, []);

  // Existing user-fetching effect remains unchanged.
  useEffect(() => {
    const controller = new AbortController();

    loadUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadUsers]);

  // Roles are fetched independently from the existing Roles API.
  useEffect(() => {
    const controller = new AbortController();

    loadRoles(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadRoles]);


  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.role,
        user.location,
        user.dataScope,
        user.status,
      ].some((value) =>
        String(value).toLowerCase().includes(query),
      ),
    );
  }, [search, users]);

  const handleAddUser = async (formData) => {
    try {
      setSubmitting(true);
      setSubmitError("");

      const roleId = Number(formData.roleId);

      if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new Error(
          "Please select a valid role.",
        );
      }

      const selectedRole = roles.find(
        (role) => Number(role.id) === roleId,
      );

      if (!selectedRole) {
        throw new Error(
          "Selected role was not found. Please reload the roles.",
        );
      }

      await usersApi.createUser({
        name: formData.name.trim(),

        email: formData.email
          .trim()
          .toLowerCase(),

        password: formData.password,

        // Keep existing backend logic:
        // send the selected role name to POST /users.
        role: selectedRole.name,

        location: formData.location.trim(),
      });

      setShowAddUser(false);

      // Existing user-fetching logic remains unchanged.
      // Reload users from the database after creation.
      await loadUsers();
    } catch (error) {
      console.error(
        "Unable to create user:",
        error?.response?.data || error,
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to create user.";

      setSubmitError(
        Array.isArray(message)
          ? message.join(", ")
          : String(message),
      );

      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-full">
        {/* Hero section */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#0f1d40] from-indigo-600 via-[#4d55bf] to-[#2ab7b5] px-6 py-10 text-white shadow-[0_24px_55px_rgba(67,76,190,0.24)] md:px-11 md:py-11">
          <div className="absolute -left-20 -top-36 h-[360px] w-[360px] rounded-full bg-cyan-400/45" />
          <div className="absolute left-12 -top-32 h-[330px] w-[330px] rounded-full border-[48px] border-indigo-400/40" />
          <div className="absolute -bottom-32 -right-16 h-[280px] w-[280px] rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-7 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-5">
              <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[22px] border border-white/30 bg-white/15 text-3xl shadow-inner backdrop-blur-md">
                <FaStar />
              </div>

              <div className="min-w-0 ">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[44px]">
                  Users, Roles & Access
                </h1>

                <p className="mt-4 text-sm text-white/85 sm:text-base lg:text-lg">
                  Role-based and attribute-based access across LSP,
                  Spoke, Hub and NBFC functions.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddUser(true)}
              className="relative z-10 flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-7 text-base font-bold text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 sm:ml-auto"
            >
              <FaPlus />
              Add User
            </button>
          </div>
        </section>

        {/* Search */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              System users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredUsers.length} users available
            </p>
          </div>

          <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 sm:max-w-sm">
            <FaSearch className="shrink-0 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, roles or locations"
              className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {/* Table card */}
        <section className="mt-5 rounded-[28px] border border-indigo-200/70 bg-white p-4 shadow-[0_20px_55px_rgba(35,52,95,0.09)] sm:p-7">
          <div className="overflow-x-auto rounded-[22px] border border-slate-200">
            <table className="w-full min-w-[1020px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-[#f4f5ff]">
                  {[
                    "USER",
                    "ROLE",
                    "LOCATION",
                    "DATA SCOPE",
                    "MFA",
                    "STATUS",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b-2 border-indigo-200 px-5 py-5 text-xs font-black tracking-[0.06em] text-indigo-800"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Loading users from database */}
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <div className="inline-flex items-center gap-3 text-sm font-medium text-slate-500">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : apiError ? (
                  /* API or database error */
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-14 text-center"
                    >
                      <p className="text-sm font-semibold text-red-600">
                        {apiError}
                      </p>

                      <button
                        type="button"
                        onClick={() => loadUsers()}
                        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  /* Database users */
                  filteredUsers.map((user, index) => {
                    const cellClass = `
        border-b border-slate-200
        px-5 py-4
        transition
        group-hover:bg-indigo-50/50
        ${index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50/60"
                      }
      `;

                    return (
                      <tr
                        key={user.id ?? user.email}
                        className="group"
                      >
                        {/* User name and email */}
                        <td className={cellClass}>
                          <strong className="block text-sm font-bold text-slate-700">
                            {user.name || "-"}
                          </strong>

                          <span className="mt-1 block text-xs text-slate-500">
                            {user.email || "-"}
                          </span>
                        </td>

                        {/* Role */}
                        <td
                          className={`${cellClass} text-sm text-slate-700`}
                        >
                          {user.role || "Not Assigned"}
                        </td>

                        {/* Location */}
                        <td
                          className={`${cellClass} text-sm text-slate-700`}
                        >
                          {user.location || "-"}
                        </td>

                        {/* Data scope */}
                        <td
                          className={`${cellClass} text-sm text-slate-700`}
                        >
                          {user.dataScope || "Assigned Cases"}
                        </td>

                        {/* MFA status */}
                        <td className={cellClass}>
                          <StatusBadge>
                            {user.mfa || "Disabled"}
                          </StatusBadge>
                        </td>

                        {/* User status */}
                        <td className={cellClass}>
                          <StatusBadge>
                            {user.status || "Inactive"}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* No records returned from database or search */
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <p className="text-sm font-medium text-slate-500">
                        {search
                          ? "No users match your search."
                          : "No users found in the database."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="group"
                    >
                      <td
                        className={`border-b border-slate-200 px-5 py-5 transition group-hover:bg-indigo-50/50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }`}
                      >
                        <strong className="block text-base font-bold text-slate-700">
                          {user.name}
                        </strong>

                        <span className="mt-1 block text-sm text-slate-500">
                          {user.email}
                        </span>
                      </td>

                      <td
                        className={`border-b border-slate-200 px-5 py-5 text-base text-slate-700 transition group-hover:bg-indigo-50/50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }`}
                      >
                        {user.role}
                      </td>

                      <td
                        className={`border-b border-slate-200 px-5 py-5 text-base text-slate-700 transition group-hover:bg-indigo-50/50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }`}
                      >
                        {user.location}
                      </td>

                      <td
                        className={`border-b border-slate-200 px-5 py-5 text-base text-slate-700 transition group-hover:bg-indigo-50/50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }`}
                      >
                        {user.dataScope}
                      </td>

                      <td
                        className={`border-b border-slate-200 px-5 py-5 transition group-hover:bg-indigo-50/50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }`}
                      >
                        <StatusBadge>{user.mfa}</StatusBadge>
                      </td>

                      <td
                        className={`border-b border-slate-200 px-5 py-5 transition group-hover:bg-indigo-50/50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }`}
                      >
                        <StatusBadge>{user.status}</StatusBadge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-slate-500"
                    >
                      No matching users found.
                    </td>
                  </tr>
                )}
              </tbody> */}
            </table>
          </div>
        </section>

        {/* Information cards */}
        <section className="mt-6 grid grid-cols-1 gap-5 pb-8 lg:grid-cols-3">
          {informationCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_35px_rgba(35,52,95,0.07)]"
            >
              <h3 className="relative pb-4 text-base font-bold text-slate-800 after:absolute after:bottom-0 after:left-0 after:h-1 after:w-10 after:rounded-full after:bg-gradient-to-r after:from-indigo-600 after:to-cyan-500">
                {card.title}
              </h3>

              <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>

      <AddUserModal
        open={showAddUser}
        onClose={() => {
        setShowAddUser(false);
        setSubmitError("");
        }}
        onSubmit={handleAddUser}
        submitting={submitting}
        submitError={submitError}
        roles={roles}
        rolesLoading={rolesLoading}
        rolesError={rolesError}
        onRetryRoles={() => loadRoles()}
      />
    </>
  );
}