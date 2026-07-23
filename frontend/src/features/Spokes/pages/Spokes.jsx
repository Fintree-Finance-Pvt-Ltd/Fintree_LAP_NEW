import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FaEdit,
  FaPlus,
  FaRoute,
  FaSearch,
  FaTimes,
  FaUndo,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { hubApi } from "../../Hub/hubapi.js";
import { spokesApi } from "../spokeapi.js";
const EMPTY_FORM = {
  hubId: "",
  name: "",
};

const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong.",
) => {
  const responseMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(", ");
  }

  return responseMessage || fallbackMessage;
};

const unwrapPayload = (response) => {
  let payload = response?.data ?? response;

  /*
   * Supports response formats such as:
   *
   * Axios:
   * response.data
   *
   * Global interceptor:
   * response.data.data
   *
   * Service wrapper:
   * response.data.data.data
   */
  for (let index = 0; index < 3; index += 1) {
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(
        payload,
        "data",
      )
    ) {
      payload = payload.data;
    } else {
      break;
    }
  }

  return payload;
};

const extractList = (response) => {
  const payload = unwrapPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.spokes)) {
    return payload.spokes;
  }

  if (Array.isArray(payload?.hubs)) {
    return payload.hubs;
  }

  return [];
};

function SpokeModal({
  open,
  editingSpoke,
  hubs,
  hubsLoading,
  form,
  errors,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  const isEditing = Boolean(
    editingSpoke?.id,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spoke-modal-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="spoke-modal-title"
              className="text-xl font-black text-slate-900"
            >
              {isEditing
                ? "Edit Spoke"
                : "Add Spoke"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a Hub and enter the
              Spoke name.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div>
              <label
                htmlFor="spoke-hub"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Hub{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                id="spoke-hub"
                name="hubId"
                value={form.hubId}
                onChange={onChange}
                disabled={
                  submitting ||
                  hubsLoading
                }
                className={`h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  errors.hubId
                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-300 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                }`}
              >
                <option value="">
                  {hubsLoading
                    ? "Loading hubs..."
                    : "Select Hub"}
                </option>

                {hubs.map((hub) => (
                  <option
                    key={hub.id}
                    value={String(hub.id)}
                  >
                    {hub.name}
                  </option>
                ))}
              </select>

              {errors.hubId && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.hubId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="spoke-name"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Spoke Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                id="spoke-name"
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                disabled={submitting}
                maxLength={160}
                autoComplete="off"
                placeholder="Enter Spoke name"
                className={`h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  errors.name
                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-300 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                }`}
              />

              {errors.name && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                hubsLoading
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173c70] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#102e58] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {isEditing
                ? "Update Spoke"
                : "Add Spoke"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Spokes() {
  const [spokes, setSpokes] =
    useState([]);
  const [hubs, setHubs] =
    useState([]);

  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [searching, setSearching] =
    useState(false);
  const [hubsLoading, setHubsLoading] =
    useState(true);
  const [loadingDetails, setLoadingDetails] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingSpoke, setEditingSpoke] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);
  const [errors, setErrors] =
    useState({});

  /*
   * Debounce search.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const loadSpokes = useCallback(
    async (searchValue = search) => {
      try {
        if (loading) {
          setLoading(true);
        } else {
          setSearching(true);
        }

        const response =
          await spokesApi.getSpokes({
            search: searchValue || undefined,
          });

        setSpokes(
          extractList(response),
        );
      } catch (error) {
        setSpokes([]);

        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load Spokes.",
          ),
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [search],
  );

  const loadHubs = useCallback(async () => {
    try {
      setHubsLoading(true);

      const response =
        await hubApi.getHubs();

      setHubs(
        extractList(response),
      );
    } catch (error) {
      setHubs([]);

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load Hubs.",
        ),
      );
    } finally {
      setHubsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHubs();
  }, [loadHubs]);

  useEffect(() => {
    loadSpokes(search);
  }, [search]);

  const openAddModal = () => {
    if (hubsLoading) {
      return;
    }

    if (!hubs.length) {
      toast.error(
        "Create a Hub before adding a Spoke.",
      );
      return;
    }

    setEditingSpoke(null);
    setForm({
      ...EMPTY_FORM,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = async (spoke) => {
    if (
      !spoke?.id ||
      loadingDetails
    ) {
      return;
    }

    try {
      setLoadingDetails(true);

      const response =
        await spokesApi.getSpokeById(
          spoke.id,
        );

      const details =
        unwrapPayload(response) || spoke;

      setEditingSpoke(details);

      setForm({
        hubId: String(
          details?.hubId ??
            details?.hub?.id ??
            "",
        ),
        name: details?.name || "",
      });

      setErrors({});
      setModalOpen(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load Spoke details.",
        ),
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingSpoke(null);
    setForm({
      ...EMPTY_FORM,
    });
    setErrors({});
  };

  const handleFormChange = (event) => {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    const hubId = Number(form.hubId);
    const name = form.name
      .trim()
      .replace(/\s+/g, " ");

    if (
      !Number.isInteger(hubId) ||
      hubId < 1
    ) {
      nextErrors.hubId =
        "Hub is required.";
    }

    if (!name) {
      nextErrors.name =
        "Spoke name is required.";
    } else if (name.length > 160) {
      nextErrors.name =
        "Spoke name cannot exceed 160 characters.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      submitting ||
      !validateForm()
    ) {
      return;
    }

    const payload = {
      hubId: Number(form.hubId),
      name: form.name
        .trim()
        .replace(/\s+/g, " "),
    };

    try {
      setSubmitting(true);

      if (editingSpoke?.id) {
        await spokesApi.updateSpoke(
          editingSpoke.id,
          payload,
        );

        toast.success(
          "Spoke updated successfully.",
        );
      } else {
        await spokesApi.createSpoke(
          payload,
        );

        toast.success(
          "Spoke created successfully.",
        );
      }

      closeModal();

      await loadSpokes(search);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingSpoke?.id
            ? "Unable to update Spoke."
            : "Unable to create Spoke.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173c70] text-white shadow-md">
                  <FaRoute size={20} />
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Spokes Management
                  </h1>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Create and manage Spokes
                    mapped to Hubs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                disabled={
                  submitting ||
                  hubsLoading
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173c70] px-6 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#102e58] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaPlus size={14} />
                Add Spoke
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="spokes-search"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Search
                </label>

                <div className="relative">
                  <FaSearch
                    size={13}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="spokes-search"
                    type="search"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(
                        event.target.value,
                      )
                    }
                    placeholder="Search by Spoke or Hub name"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                  />

                  {searching && (
                    <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-blue-100 border-t-[#173c70]" />
                  )}
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetSearch}
                  disabled={
                    loading ||
                    (!searchInput && !search)
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaUndo size={13} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-blue-200 bg-blue-50/70">
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                    Spoke Name
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                    Hub
                  </th>

                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-blue-900">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-20 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#173c70]" />

                        <p className="text-sm font-bold text-slate-500">
                          Loading Spokes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : spokes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-20 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FaRoute size={22} />
                        </div>

                        <h3 className="mt-4 text-base font-black text-slate-800">
                          No Spokes found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {search
                            ? "No Spoke matches your search."
                            : "Add your first Spoke to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  spokes.map((spoke) => (
                    <tr
                      key={spoke.id}
                      className="border-b border-slate-200 transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {spoke.name || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#173c70]">
                          {spoke.hubName ||
                            spoke.hub?.name ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(spoke)
                          }
                          disabled={
                            loadingDetails ||
                            submitting
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#173c70] transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FaEdit size={12} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && spokes.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-sm font-semibold text-slate-500">
                Showing {spokes.length}{" "}
                {spokes.length === 1
                  ? "Spoke"
                  : "Spokes"}
              </p>
            </div>
          )}
        </section>
      </div>

      <SpokeModal
        open={modalOpen}
        editingSpoke={editingSpoke}
        hubs={hubs}
        hubsLoading={hubsLoading}
        form={form}
        errors={errors}
        submitting={submitting}
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}