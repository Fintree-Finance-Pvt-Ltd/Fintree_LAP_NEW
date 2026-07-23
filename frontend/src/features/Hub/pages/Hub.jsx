import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FaBuilding,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUndo,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { hubApi } from "../hubapi.js";

const EMPTY_FORM = {
  name: "",
};

const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong.",
) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallbackMessage;
};

const extractHubList = (response) => {
  const responseBody =
    response?.data ?? response;

  if (Array.isArray(responseBody)) {
    return responseBody;
  }

  if (
    Array.isArray(responseBody?.data)
  ) {
    return responseBody.data;
  }

  if (
    Array.isArray(responseBody?.hubs)
  ) {
    return responseBody.hubs;
  }

  if (
    Array.isArray(responseBody?.items)
  ) {
    return responseBody.items;
  }

  return [];
};

const extractSingleHub = (response) => {
  const responseBody =
    response?.data ?? response;

  if (
    responseBody?.data &&
    !Array.isArray(responseBody.data)
  ) {
    return responseBody.data;
  }

  if (responseBody?.hub) {
    return responseBody.hub;
  }

  return responseBody || {};
};

const getOrganizationName = (hub) => {
  if (
    typeof hub?.organization === "string"
  ) {
    return hub.organization;
  }

  return (
    hub?.organization?.name ||
    hub?.organizationName ||
    "Fintree Finance"
  );
};

/* ======================================================
   ADD / EDIT HUB MODAL
====================================================== */

const HubModal = ({
  isOpen,
  editingHub,
  formData,
  errors,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  const isEditing =
    Boolean(editingHub);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-modal-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="hub-modal-title"
              className="text-xl font-black text-slate-900"
            >
              {isEditing
                ? "Edit Hub"
                : "Add Hub"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update the Hub information."
                : "Enter the details to create a new Hub."}
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
                htmlFor="hub-name"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Hub Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                id="hub-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                disabled={submitting}
                placeholder="Enter Hub name"
                maxLength={255}
                autoComplete="off"
                autoFocus
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
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173c70] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#102e58] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {isEditing
                ? "Update Hub"
                : "Add Hub"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ======================================================
   HUB MANAGEMENT PAGE
====================================================== */

const HubManagement = () => {
  const [hubs, setHubs] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    loadingEditHubId,
    setLoadingEditHubId,
  ] = useState(null);

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    editingHub,
    setEditingHub,
  ] = useState(null);

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [errors, setErrors] =
    useState({});

  /* ====================================================
     LOAD HUBS
  ==================================================== */

  const loadHubs = useCallback(
    async (
      searchValue = "",
      initial = false,
    ) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setSearching(true);
        }

        const params = {};

        if (searchValue.trim()) {
          params.search =
            searchValue.trim();
        }

        const response =
          await hubApi.getHubs(params);

        const hubList =
          extractHubList(response);

        setHubs(hubList);
      } catch (error) {
        setHubs([]);

        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load Hubs.",
          ),
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadHubs("", true);
  }, [loadHubs]);

  /* ====================================================
     DEBOUNCED SEARCH
  ==================================================== */

  useEffect(() => {
    const searchTimer =
      window.setTimeout(() => {
        loadHubs(search, false);
      }, 400);

    return () => {
      window.clearTimeout(
        searchTimer,
      );
    };
  }, [search, loadHubs]);

  /* ====================================================
     OPEN ADD MODAL
  ==================================================== */

  const openAddModal = () => {
    if (loadingEditHubId) {
      return;
    }

    setEditingHub(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setErrors({});
    setIsModalOpen(true);
  };

  /* ====================================================
     OPEN EDIT MODAL
  ==================================================== */

  const openEditModal =
    async (hub) => {
      if (
        !hub?.id ||
        loadingEditHubId
      ) {
        return;
      }

      try {
        setLoadingEditHubId(
          hub.id,
        );

        const response =
          await hubApi.getHubById(
            hub.id,
          );

        const selectedHub =
          extractSingleHub(response);

        const finalHub =
          selectedHub?.id
            ? selectedHub
            : hub;

        setEditingHub(finalHub);

        setFormData({
          name:
            finalHub?.name ||
            hub?.name ||
            "",
        });

        setErrors({});
        setIsModalOpen(true);
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load the selected Hub.",
          ),
        );
      } finally {
        setLoadingEditHubId(
          null,
        );
      }
    };

  /* ====================================================
     CLOSE MODAL
  ==================================================== */

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setIsModalOpen(false);
    setEditingHub(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setErrors({});
  };

  /* ====================================================
     INPUT CHANGE
  ==================================================== */

  const handleInputChange = (
    event,
  ) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  /* ====================================================
     VALIDATION
  ==================================================== */

  const validateForm = () => {
    const nextErrors = {};

    const name =
      formData.name.trim();

    if (!name) {
      nextErrors.name =
        "Hub name is required.";
    } else if (
      name.length > 255
    ) {
      nextErrors.name =
        "Hub name cannot exceed 255 characters.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  /* ====================================================
     CREATE / UPDATE HUB
  ==================================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        submitting ||
        !validateForm()
      ) {
        return;
      }

      const payload = {
        name: formData.name.trim(),
      };

      try {
        setSubmitting(true);

        if (editingHub?.id) {
          await hubApi.updateHub(
            editingHub.id,
            payload,
          );

          toast.success(
            "Hub updated successfully.",
          );
        } else {
          await hubApi.createHub(
            payload,
          );

          toast.success(
            "Hub created successfully.",
          );
        }

        setIsModalOpen(false);
        setEditingHub(null);

        setFormData({
          ...EMPTY_FORM,
        });

        setErrors({});

        await loadHubs(
          search,
          false,
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            editingHub
              ? "Unable to update Hub."
              : "Unable to create Hub.",
          ),
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* ====================================================
     RESET FILTERS
  ==================================================== */

  const handleResetFilters = () => {
    if (search) {
      setSearch("");
      return;
    }

    loadHubs("", false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173c70] text-white shadow-md">
                  <FaBuilding
                    size={20}
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Hub Management
                  </h1>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Create and manage
                    organizational Hubs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                disabled={
                  submitting ||
                  Boolean(
                    loadingEditHubId,
                  )
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173c70] px-6 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#102e58] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaPlus size={14} />
                Add Hub
              </button>
            </div>
          </div>

          {/* Search and reset */}
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-lg">
                <FaSearch
                  size={14}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search Hub name"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                />

                {searching && (
                  <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[#173c70]" />
                )}
              </div>

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                disabled={
                  loading ||
                  searching
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaUndo size={13} />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Hub table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-blue-200 bg-blue-50/70">
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                    Hub Name
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                    Organization
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
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#173c70]" />

                        <p className="text-sm font-bold text-slate-500">
                          Loading Hubs...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : hubs.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-20 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FaBuilding
                            size={22}
                          />
                        </div>

                        <h3 className="mt-4 text-base font-black text-slate-800">
                          No Hubs found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {search
                            ? "No Hub matches your search."
                            : "Add your first Hub to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hubs.map((hub) => {
                    const isLoadingEdit =
                      loadingEditHubId ===
                      hub.id;

                    return (
                      <tr
                        key={hub.id}
                        className="border-b border-slate-200 transition last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {hub.name ||
                              "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-600">
                            {getOrganizationName(
                              hub,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                hub,
                              )
                            }
                            disabled={Boolean(
                              loadingEditHubId,
                            )}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#173c70] transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isLoadingEdit ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-[#173c70]" />
                            ) : (
                              <FaEdit
                                size={
                                  12
                                }
                              />
                            )}

                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            hubs.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <p className="text-sm font-semibold text-slate-500">
                  Showing{" "}
                  {hubs.length}{" "}
                  {hubs.length === 1
                    ? "Hub"
                    : "Hubs"}
                </p>
              </div>
            )}
        </section>
      </div>

      <HubModal
        isOpen={isModalOpen}
        editingHub={editingHub}
        formData={formData}
        errors={errors}
        submitting={submitting}
        onChange={
          handleInputChange
        }
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default HubManagement;