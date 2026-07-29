import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaCheck,
  FaEdit,
  FaPlus,
  FaSearch,
  FaStar,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";

import { usersApi } from "../userApi";
import { spokesApi } from "../../Spokes/spokeapi.js";

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

function StatusBadge({ children }) {
  const value = String(
    children || "",
  ).toLowerCase();

  const isInactive =
    value === "inactive" ||
    value === "disabled";

  return (
    <span
      className={`inline-flex min-w-[80px] items-center justify-center rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${
        isInactive
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
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
  spokes = [],
  spokesLoading = false,
  spokesError = "",
  onRetrySpokes,
}) {
  const [form, setForm] =
    useState(emptyForm);

  const [error, setError] =
    useState("");

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasEmptyField =
      Object.values(form).some(
        (value) =>
          !String(value ?? "").trim(),
      );

    if (hasEmptyField) {
      setError(
        "Please complete all fields.",
      );
      return;
    }

    try {
      await onSubmit(form);

      setForm(emptyForm);
      setError("");
    } catch (submissionError) {
      console.error(
        "User submission failed:",
        submissionError,
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
              Create a new LAP system user
              and assign access.
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

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Full name

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                disabled={submitting}
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
                disabled={submitting}
                className={inputClasses}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Role

              <select
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
                disabled={
                  rolesLoading ||
                  submitting
                }
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
                disabled={
                  spokesLoading ||
                  submitting
                }
                className={inputClasses}
              >
                <option value="">
                  {spokesLoading
                    ? "Loading spokes..."
                    : spokes.length === 0
                      ? "No spokes available"
                      : "Select spoke"}
                </option>

                {spokes.map((spoke) => (
                  <option
                    key={spoke.id}
                    value={spoke.name}
                  >
                    {spoke.name}
                  </option>
                ))}
              </select>

              {spokesError && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-red-600">
                    {spokesError}
                  </span>

                  <button
                    type="button"
                    onClick={onRetrySpokes}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    Retry
                  </button>
                </div>
              )}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
              Password

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="new-password"
                disabled={submitting}
                className={inputClasses}
              />
            </label>
          </div>

          {(error || submitError) && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error || submitError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                rolesLoading ||
                roles.length === 0 ||
                spokesLoading ||
                spokes.length === 0
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


function EditUserModal({
  open,
  user,
  onClose,
  onSubmit,
  updating = false,
  updateError = "",
  roles = [],
  rolesLoading = false,
  rolesError = "",
  onRetryRoles,
  spokes = [],
  spokesLoading = false,
  spokesError = "",
  onRetrySpokes,
}) {
  const [form, setForm] =
    useState(emptyForm);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setForm({
      name:
        user.name === "-"
          ? ""
          : user.name || "",
      email:
        user.email === "-"
          ? ""
          : user.email || "",
      roleId:
        user.roleId
          ? String(user.roleId)
          : "",
      location:
        user.location === "-" ||
        user.location === "Not Assigned"
          ? ""
          : user.location || "",
    });

    setError("");
  }, [open, user]);

  if (!open || !user) {
    return null;
  }

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredValues = [
      form.name,
      form.email,
      form.roleId,
      form.location,
    ];

    const hasEmptyField =
      requiredValues.some(
        (value) =>
          !String(value ?? "").trim(),
      );

    if (hasEmptyField) {
      setError(
        "Please complete all required fields.",
      );
      return;
    }

    try {
      await onSubmit(form);
    } catch (submissionError) {
      console.error(
        "User update failed:",
        submissionError,
      );
    }
  };

  const inputClasses =
    "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Edit User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the LAP system user
              and assigned access.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaTimes />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Full name

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                disabled={updating}
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
                disabled={updating}
                className={inputClasses}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Role

              <select
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
                disabled={
                  rolesLoading ||
                  updating
                }
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
                disabled={
                  spokesLoading ||
                  updating
                }
                className={inputClasses}
              >
                <option value="">
                  {spokesLoading
                    ? "Loading spokes..."
                    : spokes.length === 0
                      ? "No spokes available"
                      : "Select spoke"}
                </option>

                {spokes.map((spoke) => (
                  <option
                    key={spoke.id}
                    value={spoke.name}
                  >
                    {spoke.name}
                  </option>
                ))}
              </select>

              {spokesError && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-red-600">
                    {spokesError}
                  </span>

                  <button
                    type="button"
                    onClick={onRetrySpokes}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    Retry
                  </button>
                </div>
              )}
            </label>
          </div>

          {(error || updateError) && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error || updateError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                updating ||
                rolesLoading ||
                roles.length === 0 ||
                spokesLoading ||
                spokes.length === 0
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Updating...
                </>
              ) : (
                <>
                  <FaCheck />
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUserModal({
  open,
  user,
  onClose,
  onConfirm,
  deleting = false,
  deleteError = "",
}) {
  if (!open || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Delete User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Confirm removal of system access.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Are you sure you want to delete{" "}
              <span className="font-extrabold">
                {user.name || "this user"}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will remove the user&apos;s
              active system access.
            </p>
          </div>

          {deleteError && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <FaTrashAlt />
                  Delete User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
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

// function normalizeUser(user) {
//   const fullName =
//     user?.name ||
//     [
//       user?.firstName,
//       user?.lastName,
//     ]
//       .filter(Boolean)
//       .join(" ");

//   const location =
//     user?.location?.name ||
//     user?.organizationUnit?.name ||
//     user?.spoke?.name ||
//     user?.hub?.name ||
//     user?.location ||
//     "-";

//   const mfaEnabled =
//     user?.mfaEnabled ??
//     user?.mfa_enabled ??
//     user?.isMfaEnabled;

//   const statusValue = String(
//     user?.status || "",
//   ).toUpperCase();

//   const active =
//     user?.isActive ??
//     user?.active ??
//     statusValue === "ACTIVE";

//   return {
//     id: user?.id,
//     name: fullName || "-",
//     email: user?.email || "-",
//     role: getRoleName(user),
//     location,
//     dataScope:
//       user?.dataScope ||
//       user?.data_scope ||
//       "Assigned Cases",
//     mfa:
//       mfaEnabled === false
//         ? "Disabled"
//         : "Enabled",
//     status:
//       active === false
//         ? "Inactive"
//         : "Active",
//   };
// }

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

  const roleName =
    user?.role?.name ||
    user?.role?.code ||
    getRoleName(user);

  return {
    id:
      user?.userId ??
      user?.id,

    name:
      user?.name || "-",

    email:
      user?.email || "-",

    role:
      roleName ||
      "Not Assigned",

    roleId:
      Number(
        user?.role?.id ??
          user?.roles?.[0]?.id,
      ) || null,

    permissions,

    permissionsText:
      permissions
        .map(
          (permission) =>
            permission.name,
        )
        .join(", "),

    /*
     * Preserve existing properties so no
     * unrelated UI logic breaks.
     */
    location:
      user?.location || "-",

    dataScope:
      user?.dataScope ||
      "Assigned Cases",

    mfa:
      user?.mfa || "Enabled",

    isActive:
      user?.isActive ??
      user?.active ??
      String(
        user?.status || "",
      ).toUpperCase() === "ACTIVE",

    status:
      user?.status || "Active",
  };
}

export default function UsersTab() {
  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [
    showAddUser,
    setShowAddUser,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [apiError, setApiError] =
    useState("");

  const [roles, setRoles] =
    useState([]);

  const [
    rolesLoading,
    setRolesLoading,
  ] = useState(true);

  const [
    rolesError,
    setRolesError,
  ] = useState("");

  const [spokes, setSpokes] =
    useState([]);

  const [
    spokesLoading,
    setSpokesLoading,
  ] = useState(true);

  const [
    spokesError,
    setSpokesError,
  ] = useState("");

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    showEditUser,
    setShowEditUser,
  ] = useState(false);

  const [
    showDeleteUser,
    setShowDeleteUser,
  ] = useState(false);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const [
    updateError,
    setUpdateError,
  ] = useState("");

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

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
          "Unable to load users:",
          error,
        );

        setUsers([]);

        setApiError(
          getErrorMessage(
            error,
            "Unable to load users.",
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
          response?.data?.data?.roles ??
          response?.data?.roles ??
          response?.data?.data ??
          response?.data ??
          [];

        if (
          !Array.isArray(responseData)
        ) {
          throw new Error(
            "Invalid roles response received from server.",
          );
        }

        const normalizedRoles =
          responseData
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

  const loadSpokes = useCallback(
    async () => {
      try {
        setSpokesLoading(true);
        setSpokesError("");

        const response =
          await spokesApi.getSpokes();

        const responseData =
          response?.data?.data?.spokes ??
          response?.data?.spokes ??
          response?.data?.data ??
          response?.data ??
          response?.spokes ??
          response ??
          [];

        if (!Array.isArray(responseData)) {
          throw new Error(
            "Invalid spokes response received from server.",
          );
        }

        const normalizedSpokes =
          responseData
            .map((spoke) => ({
              id: Number(spoke?.id),
              name: String(
                spoke?.name || "",
              ).trim(),
            }))
            .filter(
              (spoke) =>
                Number.isInteger(
                  spoke.id,
                ) &&
                spoke.id > 0 &&
                spoke.name,
            );

        setSpokes(normalizedSpokes);
      } catch (error) {
        console.error(
          "Unable to load spokes:",
          error,
        );

        setSpokes([]);

        setSpokesError(
          getErrorMessage(
            error,
            "Unable to load spokes.",
          ),
        );
      } finally {
        setSpokesLoading(false);
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

  useEffect(() => {
    const controller =
      new AbortController();

    loadRoles(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadRoles]);

  useEffect(() => {
    loadSpokes();
  }, [loadSpokes]);

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.role,
        user.location,
        user.dataScope,
        user.status,
      ].some((value) =>
        String(value)
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [search, users]);

  const handleAddUser = async (
    formData,
  ) => {
    try {
      setSubmitting(true);
      setSubmitError("");

      const roleId = Number(
        formData.roleId,
      );

      if (
        !Number.isInteger(roleId) ||
        roleId <= 0
      ) {
        throw new Error(
          "Please select a valid role.",
        );
      }

      const selectedRole =
        roles.find(
          (role) =>
            Number(role.id) ===
            roleId,
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
        role: selectedRole.name,
        location:
          formData.location.trim(),
      });

      setShowAddUser(false);

      await loadUsers();
    } catch (error) {
      console.error(
        "Unable to create user:",
        error?.response?.data ||
          error,
      );

      setSubmitError(
        getErrorMessage(
          error,
          "Unable to create user.",
        ),
      );

      throw error;
    } finally {
      setSubmitting(false);
    }
  };


  const handleOpenEditUser = (
    user,
  ) => {
    setSelectedUser(user);
    setUpdateError("");
    setShowDeleteUser(false);
    setShowEditUser(true);
  };

  const handleCloseEditUser = () => {
    if (updating) {
      return;
    }

    setShowEditUser(false);
    setSelectedUser(null);
    setUpdateError("");
  };

  const handleUpdateUser = async (
    formData,
  ) => {
    try {
      setUpdating(true);
      setUpdateError("");

      if (!selectedUser?.id) {
        throw new Error(
          "Selected user was not found.",
        );
      }

      const roleId = Number(
        formData.roleId,
      );

      if (
        !Number.isInteger(roleId) ||
        roleId <= 0
      ) {
        throw new Error(
          "Please select a valid role.",
        );
      }

      await usersApi.updateUser(
        selectedUser.id,
        {
          name:
            formData.name.trim(),
          email:
            formData.email
              .trim()
              .toLowerCase(),
          roleId,
          location:
            formData.location.trim(),
        },
      );

      setShowEditUser(false);
      setSelectedUser(null);

      await loadUsers();
    } catch (error) {
      console.error(
        "Unable to update user:",
        error?.response?.data ||
          error,
      );

      setUpdateError(
        getErrorMessage(
          error,
          "Unable to update user.",
        ),
      );

      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDeleteUser = (
    user,
  ) => {
    setSelectedUser(user);
    setDeleteError("");
    setShowEditUser(false);
    setShowDeleteUser(true);
  };

  const handleCloseDeleteUser = () => {
    if (deleting) {
      return;
    }

    setShowDeleteUser(false);
    setSelectedUser(null);
    setDeleteError("");
  };

  const handleDeleteUser = async () => {
    try {
      setDeleting(true);
      setDeleteError("");

      if (!selectedUser?.id) {
        throw new Error(
          "Selected user was not found.",
        );
      }

      await usersApi.deleteUser(
        selectedUser.id,
      );

      setShowDeleteUser(false);
      setSelectedUser(null);

      await loadUsers();
    } catch (error) {
      console.error(
        "Unable to delete user:",
        error?.response?.data ||
          error,
      );

      setDeleteError(
        getErrorMessage(
          error,
          "Unable to delete user.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="min-h-full">
        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] px-6 py-10 text-white shadow-xl shadow-blue-900/10 md:px-11 md:py-11">
          <div className="absolute -left-20 -top-36 h-[360px] w-[360px] rounded-full bg-cyan-400/30 blur-2xl" />
          <div className="absolute -bottom-32 -right-16 h-[280px] w-[280px] rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-7 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-5">
              <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[22px] border border-white/30 bg-white/15 text-3xl shadow-inner backdrop-blur-md">
                <FaStar />
              </div>

              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[44px]">
                  Users, Roles & Access
                </h1>

                <p className="mt-4 text-sm text-white/85 sm:text-base lg:text-lg">
                  Role-based and
                  attribute-based access across
                  LSP, Spoke, Hub and NBFC
                  functions.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmitError("");
                setShowAddUser(true);
              }}
              className="relative z-10 flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-7 text-base font-bold text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 sm:ml-auto"
            >
              <FaPlus />
              Add User
            </button>
          </div>
        </section>

        {/* Existing users section */}
        <section className="mt-7 rounded-[28px] border border-indigo-200/70 bg-white p-4 shadow-[0_20px_55px_rgba(35,52,95,0.09)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                System users
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredUsers.length} users
                available
              </p>
            </div>

            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 lg:max-w-sm">
              <FaSearch className="shrink-0 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search users, roles or locations"
                className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-200">
            <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-[#f4f5ff]">
                  {[
                    "USER",
                    "ROLE",
                    "LOCATION",
                    "DATA SCOPE",
                    "MFA",
                    "STATUS",
                    "ACTIONS",
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <div className="inline-flex items-center gap-3 text-sm font-medium text-slate-500">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : apiError ? (
                  <tr>
                    <td
                      colSpan={7}
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
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(
                    (user, index) => {
                      const cellClass = `
                        border-b border-slate-200
                        px-5 py-4
                        transition
                        group-hover:bg-indigo-50/50
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
                            className={`${cellClass} text-sm text-slate-700`}
                          >
                            {user.role ||
                              "Not Assigned"}
                          </td>

                          <td
                            className={`${cellClass} text-sm text-slate-700`}
                          >
                            {user.location || "-"}
                          </td>

                          <td
                            className={`${cellClass} text-sm text-slate-700`}
                          >
                            {user.dataScope ||
                              "Assigned Cases"}
                          </td>

                          <td className={cellClass}>
                            <StatusBadge>
                              {user.mfa ||
                                "Disabled"}
                            </StatusBadge>
                          </td>

                          <td className={cellClass}>
                            <StatusBadge>
                              {user.status ||
                                "Inactive"}
                            </StatusBadge>
                          </td>

                          <td className={cellClass}>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditUser(
                                    user,
                                  )
                                }
                                className="grid h-9 w-9 place-items-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                                title="Edit user"
                                aria-label={`Edit ${user.name}`}
                              >
                                <FaEdit />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteUser(
                                    user,
                                  )
                                }
                                className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                title="Delete user"
                                aria-label={`Delete ${user.name}`}
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
            </table>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 pb-8 lg:grid-cols-3">
          {informationCards.map(
            (card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_35px_rgba(35,52,95,0.07)]"
              >
                <h3 className="relative pb-4 text-base font-bold text-slate-800 after:absolute after:bottom-0 after:left-0 after:h-1 after:w-10 after:rounded-full after:bg-gradient-to-r after:from-indigo-600 after:to-cyan-500">
                  {card.title}
                </h3>

                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  {card.points.map(
                    (point) => (
                      <li key={point}>
                        {point}
                      </li>
                    ),
                  )}
                </ul>
              </article>
            ),
          )}
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
        onRetryRoles={() =>
          loadRoles()
        }
        spokes={spokes}
        spokesLoading={spokesLoading}
        spokesError={spokesError}
        onRetrySpokes={() =>
          loadSpokes()
        }
      />

      <EditUserModal
        open={showEditUser}
        user={selectedUser}
        onClose={handleCloseEditUser}
        onSubmit={handleUpdateUser}
        updating={updating}
        updateError={updateError}
        roles={roles}
        rolesLoading={rolesLoading}
        rolesError={rolesError}
        onRetryRoles={() =>
          loadRoles()
        }
        spokes={spokes}
        spokesLoading={spokesLoading}
        spokesError={spokesError}
        onRetrySpokes={() =>
          loadSpokes()
        }
      />

      <DeleteUserModal
        open={showDeleteUser}
        user={selectedUser}
        onClose={handleCloseDeleteUser}
        onConfirm={handleDeleteUser}
        deleting={deleting}
        deleteError={deleteError}
      />
    </>
  );
}