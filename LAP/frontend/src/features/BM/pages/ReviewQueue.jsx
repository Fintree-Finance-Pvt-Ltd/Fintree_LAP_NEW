import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaChevronRight,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";

import { bmReviewApi } from "../bmApi.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
};

export default function BMReviewQueue() {
  const navigate = useNavigate();

  const [applications, setApplications] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await bmReviewApi.getQueue();

      console.log(
        "BM queue response:",
        response.data,
      );

      const payload =
        response?.data?.applications ??
        response?.data?.data
          ?.applications ??
        response?.data?.data ??
        [];

      setApplications(
        Array.isArray(payload)
          ? payload
          : [],
      );
    } catch (error) {
      console.error(
        "Unable to load BM cases:",
        error,
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load cases submitted to BM.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      if (!keyword) {
        return applications;
      }

      return applications.filter(
        (application) => {
          return [
            application.applicationNumber,
            application.customerName,
            application.mobileNumber,
            application.panNumber,
            application.propertyCity,
            application.propertyState,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(keyword),
          );
        },
      );
    }, [applications, search]);

  const openReview = (application) => {
    const applicationId =
      application.id ??
      application.applicationId;

    if (!applicationId) {
      setError(
        "Application ID is missing for this case.",
      );
      return;
    }

    navigate(
      `/bmReview/${applicationId}`,
    );
  };

  return (
    <div className="w-full space-y-4 pb-6">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-[#102552]">
                BM Review Queue
              </h1>

              <span className="rounded-full bg-[#102552]/10 px-2.5 py-1 text-[10px] font-bold text-[#102552]">
                {applications.length} CASES
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Cases whose status is
              SUBMITTED_TO_BM
            </p>
          </div>

          <div className="flex gap-2 lg:ml-auto">
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search application..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#102552] focus:ring-2 focus:ring-[#102552]/10"
              />
            </div>

            <button
              type="button"
              onClick={loadApplications}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#102552]/20 bg-[#102552]/[0.04] px-3 text-xs font-semibold text-[#102552] transition hover:bg-[#102552]/10 disabled:opacity-50"
            >
              <FaSyncAlt
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#102552]" />

              <p className="mt-3 text-sm text-slate-500">
                Loading cases submitted to
                BM...
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead className="bg-[#102552] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Application
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    PAN
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Requested Amount
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Property Location
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Submitted Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.length >
                0 ? (
                  filteredApplications.map(
                    (application) => (
                      <tr
                        key={application.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-[#102552]">
                            {application.applicationNumber ??
                              "-"}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            ID:{" "}
                            {application.id}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-700">
                            {application.customerName ??
                              "-"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {application.mobileNumber ??
                              "-"}
                          </p>
                        </td>
                        
                    <td className="px-4 py-3">
                         

                          <p className="mt-0.5 text-xs text-slate-400">
                            {application.mobileNumber ??
                              "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">
                          {application.panNumber ??
                            "-"}
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          {formatCurrency(
                            application.requestedAmount,
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {[
                            application.propertyCity,
                            application.propertyState,
                          ]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatDate(
                            application.updatedAt,
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            {application.status ??
                              "SUBMITTED_TO_BM"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openReview(
                                application,
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102552] px-3 text-xs font-semibold text-white transition hover:bg-[#18346f]"
                          >
                            Review

                            <FaChevronRight
                              size={9}
                            />
                          </button>
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-14 text-center"
                    >
                      <p className="text-sm font-semibold text-slate-600">
                        No cases submitted to BM
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Cases will appear here when
                        their status becomes
                        SUBMITTED_TO_BM.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}