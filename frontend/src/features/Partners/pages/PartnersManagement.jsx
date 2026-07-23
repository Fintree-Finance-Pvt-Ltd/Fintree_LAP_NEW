import {
    useCallback,
    useEffect,
    useMemo,
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

import { partnerApi } from "../partnerapi.js";

/* ======================================================
   CONSTANTS
====================================================== */

const EMPTY_FORM = {
    name: "",
    code: "",
    lanPrefix: "",
};

const EMPTY_FILTERS = {
    partnerName: "",
    lanPrefix: "",
    status: "",
};

/* ======================================================
   API HELPERS
====================================================== */

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

const showSuccessToast = (
    message,
    toastId,
) => {
    toast.success(message, {
        toastId,
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
    });
};
const extractPartnerList = (response) => {
    const responseBody = response?.data ?? response;

    if (Array.isArray(responseBody)) {
        return responseBody;
    }

    if (Array.isArray(responseBody?.data)) {
        return responseBody.data;
    }

    if (Array.isArray(responseBody?.partners)) {
        return responseBody.partners;
    }

    if (Array.isArray(responseBody?.items)) {
        return responseBody.items;
    }

    return [];
};

/* ======================================================
   STATUS BADGE
====================================================== */

const StatusBadge = ({ status }) => {
    const normalizedStatus = String(
        status || "",
    ).toUpperCase();

    const isActive =
        normalizedStatus === "ACTIVE";

    return (
        <span
            className={`inline-flex min-w-[78px] items-center justify-center rounded-full border px-3 py-1 text-xs font-bold ${isActive
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-slate-100 text-slate-600"
                }`}
        >
            {isActive ? "Active" : "Inactive"}
        </span>
    );
};

/* ======================================================
   ADD / EDIT PARTNER MODAL
====================================================== */

const PartnerModal = ({
    isOpen,
    editingPartner,
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

    const isEditing = Boolean(editingPartner);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
            <div
                className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="partner-modal-title"
            >
                {/* Modal header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2
                            id="partner-modal-title"
                            className="text-xl font-black text-slate-900"
                        >
                            {isEditing
                                ? "Edit Partner"
                                : "Add Partner"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {isEditing
                                ? "Update the partner information."
                                : "Enter the details to create a new partner."}
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
                        {/* Partner Name */}
                        <div>
                            <label
                                htmlFor="partner-name"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Partner Name{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="partner-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={onChange}
                                disabled={submitting}
                                placeholder="Enter partner name"
                                maxLength={255}
                                autoComplete="off"
                                className={`h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${errors.name
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

                        {/* Partner Code */}
                        <div>
                            <label
                                htmlFor="partner-code"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Code{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="partner-code"
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={onChange}
                                disabled={submitting}
                                placeholder="Example: FFPL"
                                maxLength={30}
                                autoComplete="off"
                                className={`h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${errors.code
                                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                    : "border-slate-300 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                                    }`}
                            />

                            {errors.code && (
                                <p className="mt-1.5 text-xs font-semibold text-red-600">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        {/* LAN Prefix */}
                        <div>
                            <label
                                htmlFor="partner-lan-prefix"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                LAN Prefix{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="partner-lan-prefix"
                                type="text"
                                name="lanPrefix"
                                value={formData.lanPrefix}
                                onChange={onChange}
                                disabled={submitting}
                                placeholder="Example: FFPL"
                                maxLength={20}
                                autoComplete="off"
                                className={`h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${errors.lanPrefix
                                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                    : "border-slate-300 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                                    }`}
                            />

                            {errors.lanPrefix && (
                                <p className="mt-1.5 text-xs font-semibold text-red-600">
                                    {errors.lanPrefix}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Modal buttons */}
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
                                ? "Update Partner"
                                : "Add Partner"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ======================================================
   PARTNERS MANAGEMENT PAGE
====================================================== */

const PartnersManagement = () => {
    const [partners, setPartners] = useState([]);

    const [filters, setFilters] = useState(
        EMPTY_FILTERS,
    );

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] =
        useState(false);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [editingPartner, setEditingPartner] =
        useState(null);

    const [formData, setFormData] =
        useState(EMPTY_FORM);

    const [errors, setErrors] = useState({});

    /* ====================================================
       LOAD ALL PARTNERS
    ==================================================== */

    const loadPartners = useCallback(async () => {
        try {
            setLoading(true);

            const response =
                await partnerApi.getPartners();

            const partnerList =
                extractPartnerList(response);

            setPartners(partnerList);
        } catch (error) {
            setPartners([]);

            toast.error(
                getApiErrorMessage(
                    error,
                    "Unable to load partners.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPartners();
    }, [loadPartners]);

    /* ====================================================
       FRONTEND FILTERING
    ==================================================== */

    const filteredPartners = useMemo(() => {
        const partnerNameFilter =
            filters.partnerName
                .trim()
                .toLowerCase();

        const lanPrefixFilter =
            filters.lanPrefix
                .trim()
                .toLowerCase();

        const statusFilter =
            filters.status
                .trim()
                .toUpperCase();

        return partners.filter((partner) => {
            const partnerName = String(
                partner?.name || "",
            ).toLowerCase();

            const partnerLanPrefix = String(
                partner?.lanPrefix || "",
            ).toLowerCase();

            const partnerStatus = String(
                partner?.status || "",
            ).toUpperCase();

            const matchesPartnerName =
                !partnerNameFilter ||
                partnerName.includes(
                    partnerNameFilter,
                );

            const matchesLanPrefix =
                !lanPrefixFilter ||
                partnerLanPrefix.includes(
                    lanPrefixFilter,
                );

            const matchesStatus =
                !statusFilter ||
                partnerStatus === statusFilter;

            return (
                matchesPartnerName &&
                matchesLanPrefix &&
                matchesStatus
            );
        });
    }, [partners, filters]);

    const hasActiveFilters =
        Boolean(filters.partnerName.trim()) ||
        Boolean(filters.lanPrefix.trim()) ||
        Boolean(filters.status);

    /* ====================================================
       FILTER CHANGE
    ==================================================== */

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    };

    /* ====================================================
       RESET FILTERS
    ==================================================== */

    const handleResetFilters = () => {
        setFilters({
            ...EMPTY_FILTERS,
        });
    };

    /* ====================================================
       OPEN ADD PARTNER POPUP
    ==================================================== */

    const openAddModal = () => {
        setEditingPartner(null);

        setFormData({
            ...EMPTY_FORM,
        });

        setErrors({});
        setIsModalOpen(true);
    };

    /* ====================================================
       OPEN EDIT PARTNER POPUP
    ==================================================== */

    const openEditModal = (partner) => {
        setEditingPartner(partner);

        setFormData({
            name: partner?.name || "",
            code: partner?.code || "",
            lanPrefix: partner?.lanPrefix || "",
        });

        setErrors({});
        setIsModalOpen(true);
    };

    /* ====================================================
       CLOSE POPUP
    ==================================================== */

    const closeModal = () => {
        if (submitting) {
            return;
        }

        setIsModalOpen(false);
        setEditingPartner(null);

        setFormData({
            ...EMPTY_FORM,
        });

        setErrors({});
    };

    /* ====================================================
       FORM INPUT CHANGE
    ==================================================== */

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        const nextValue =
            name === "code" ||
                name === "lanPrefix"
                ? value.toUpperCase()
                : value;

        setFormData((current) => ({
            ...current,
            [name]: nextValue,
        }));

        setErrors((current) => ({
            ...current,
            [name]: "",
        }));
    };

    /* ====================================================
       FORM VALIDATION
    ==================================================== */

    const validateForm = () => {
        const nextErrors = {};

        const name = formData.name.trim();
        const code = formData.code.trim();
        const lanPrefix =
            formData.lanPrefix.trim();

        if (!name) {
            nextErrors.name =
                "Partner name is required.";
        } else if (name.length > 255) {
            nextErrors.name =
                "Partner name cannot exceed 255 characters.";
        }

        if (!code) {
            nextErrors.code =
                "Partner code is required.";
        } else if (code.length > 30) {
            nextErrors.code =
                "Partner code cannot exceed 30 characters.";
        }

        if (!lanPrefix) {
            nextErrors.lanPrefix =
                "LAN prefix is required.";
        } else if (lanPrefix.length > 20) {
            nextErrors.lanPrefix =
                "LAN prefix cannot exceed 20 characters.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    /* ====================================================
       ADD / UPDATE PARTNER
    ==================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting || !validateForm()) {
            return;
        }

        const payload = {
            name: formData.name.trim(),
            code: formData.code
                .trim()
                .toUpperCase(),
            lanPrefix: formData.lanPrefix
                .trim()
                .toUpperCase(),
        };

        try {
            setSubmitting(true);

            if (editingPartner?.id) {
                await partnerApi.updatePartner(
                    editingPartner.id,
                    payload,
                );

                showSuccessToast(
                    "Partner updated successfully.",
                    "partner-update-success",
                );
            } else {
                await partnerApi.createPartner(payload);

                showSuccessToast(
                    "Partner created successfully.",
                    "partner-create-success",
                );
            }

            setIsModalOpen(false);
            setEditingPartner(null);
            setFormData({
                ...EMPTY_FORM,
            });
            setErrors({});

            await loadPartners();
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    editingPartner
                        ? "Unable to update partner."
                        : "Unable to create partner.",
                ),
                {
                    toastId: "partner-save-error",
                    position: "top-right",
                    autoClose: 3000,
                    icon: false,
                },
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
                <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                    {/* ============================================
              HEADER
          ============================================ */}

                    <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-5 py-6 sm:px-7">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173c70] text-white shadow-md">
                                    <FaBuilding size={20} />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                        Partners Management
                                    </h1>

                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Create and manage lending and
                                        business partners.
                                    </p>
                                </div>
                            </div>

                            {/* Opens Add Partner popup */}
                            <button
                                type="button"
                                onClick={openAddModal}
                                disabled={submitting}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173c70] px-6 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#102e58] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FaPlus size={14} />
                                Add Partner
                            </button>
                        </div>
                    </div>

                    {/* ============================================
              FILTERS
          ============================================ */}

                    <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                            {/* Partner name filter */}
                            <div className="xl:col-span-4">
                                <label
                                    htmlFor="partner-name-filter"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Partner Name
                                </label>

                                <div className="relative">
                                    <FaSearch
                                        size={13}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        id="partner-name-filter"
                                        type="search"
                                        name="partnerName"
                                        value={filters.partnerName}
                                        onChange={handleFilterChange}
                                        placeholder="Search partner name"
                                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* LAN prefix filter */}
                            <div className="xl:col-span-3">
                                <label
                                    htmlFor="lan-prefix-filter"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    LAN Prefix
                                </label>

                                <div className="relative">
                                    <FaSearch
                                        size={13}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        id="lan-prefix-filter"
                                        type="search"
                                        name="lanPrefix"
                                        value={filters.lanPrefix}
                                        onChange={handleFilterChange}
                                        placeholder="Search LAN prefix"
                                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Status filter */}
                            <div className="xl:col-span-3">
                                <label
                                    htmlFor="partner-status-filter"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Status
                                </label>

                                <select
                                    id="partner-status-filter"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#173c70] focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="">
                                        All Status
                                    </option>

                                    <option value="ACTIVE">
                                        Active
                                    </option>

                                    <option value="INACTIVE">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                            {/* Reset button */}
                            <div className="flex items-end xl:col-span-2">
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    disabled={
                                        loading ||
                                        !hasActiveFilters
                                    }
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaUndo size={13} />
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ============================================
              PARTNERS TABLE
          ============================================ */}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-blue-200 bg-blue-50/70">
                                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                                        Partner Name
                                    </th>

                                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                                        Code
                                    </th>

                                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                                        LAN Prefix
                                    </th>

                                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-blue-900">
                                        Status
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
                                            colSpan={5}
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <span className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#173c70]" />

                                                <p className="text-sm font-bold text-slate-500">
                                                    Loading partners...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPartners.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="mx-auto flex max-w-sm flex-col items-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                    <FaBuilding size={22} />
                                                </div>

                                                <h3 className="mt-4 text-base font-black text-slate-800">
                                                    No partners found
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {hasActiveFilters
                                                        ? "No partner matches the selected filters."
                                                        : "Add your first partner to get started."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPartners.map(
                                        (partner) => (
                                            <tr
                                                key={partner.id}
                                                className="border-b border-slate-200 transition last:border-b-0 hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">
                                                        {partner.name || "-"}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-slate-600">
                                                        {partner.code || "-"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-slate-700">
                                                        {partner.lanPrefix ||
                                                            "-"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <StatusBadge
                                                        status={
                                                            partner.status
                                                        }
                                                    />
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(
                                                                partner,
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#173c70] transition hover:border-blue-300 hover:bg-blue-100"
                                                    >
                                                        <FaEdit size={12} />
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table count */}
                    {!loading &&
                        filteredPartners.length > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                                <p className="text-sm font-semibold text-slate-500">
                                    Showing{" "}
                                    {filteredPartners.length} of{" "}
                                    {partners.length}{" "}
                                    {partners.length === 1
                                        ? "partner"
                                        : "partners"}
                                </p>
                            </div>
                        )}
                </section>
            </div>

            {/* Add and Edit popup */}
            <PartnerModal
                isOpen={isModalOpen}
                editingPartner={editingPartner}
                formData={formData}
                errors={errors}
                submitting={submitting}
                onChange={handleInputChange}
                onClose={closeModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default PartnersManagement;