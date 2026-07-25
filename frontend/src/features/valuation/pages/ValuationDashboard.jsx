import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaEye,
  FaRedoAlt,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";

import { valuationApi } from "../valuationApi.js";

/* =========================================================
   RESPONSE NORMALIZER
========================================================= */

/**
 * apiClient already returns response.data from the Axios interceptor.
 *
 * Depending on ResponseInterceptor, the response may be:
 *
 * 1. { success: true, data: [...] }
 * 2. { success: true, data: { data: [...] } }
 * 3. { data: [...] }
 * 4. [...]
 */
const unwrapList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/* =========================================================
   ROW NORMALIZER
========================================================= */

const normalizeValuationCase = (item = {}) => {
  const applicationId =
    item.applicationId ??
    item.application_id ??
    item.id ??
    null;

  return {
    applicationId,

    applicationNumber:
      item.applicationNumber ??
      item.application_number ??
      item.applicationNo ??
      item.application_no ??
      null,

    customerName:
      item.customerName ??
      item.customer_name ??
      item.name ??
      null,

    mobileNumber:
      item.mobileNumber ??
      item.mobile_number ??
      item.mobile ??
      item.phone ??
      null,

    pan:
      item.pan ??
      item.panNumber ??
      item.pan_number ??
      null,

    requestedAmount:
      item.requestedAmount ??
      item.requested_amount ??
      item.requestedLoan ??
      item.requested_loan ??
      null,

    stage:
      item.stage ??
      item.applicationStage ??
      item.application_stage ??
      null,

    status:
      item.status ??
      item.applicationStatus ??
      item.application_status ??
      null,

    assessmentId:
      item.assessmentId ??
      item.assessment_id ??
      null,

    assessmentStatus:
      item.assessmentStatus ??
      item.assessment_status ??
      null,
  };
};

/* =========================================================
   FORMATTERS
========================================================= */

const formatCurrency = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatStatus = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};

/* =========================================================
   DASHBOARD
========================================================= */

export default function ValuationDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

const casesQuery = useQuery({
  queryKey: ['valuation-dashboard-cases'],
  queryFn: valuationApi.cases,
  refetchOnWindowFocus: false,
  retry: false,
});

 

  const allCases = useMemo(() => {
    const responseRows = unwrapList(casesQuery.data);

    return responseRows
      .map(normalizeValuationCase)
      .filter((item) => item.applicationId);
  }, [casesQuery.data]);

  const valuationCases = useMemo(() => {
    const keyword = searchTerm
      .trim()
      .toLowerCase();

    if (!keyword) {
      return allCases;
    }

    return allCases.filter((item) => {
      const searchableText = [
        item.applicationId,
        item.applicationNumber,
        item.customerName,
        item.mobileNumber,
        item.pan,
        item.requestedAmount,
        item.stage,
        item.status,
        item.assessmentStatus,
      ]
        .filter(
          (value) =>
            value !== undefined &&
            value !== null,
        )
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [allCases, searchTerm]);

  const totalCases = allCases.length;

  const pendingCases = allCases.filter(
    (item) =>
      String(item.status || "").toUpperCase() ===
      "VALUATION_PENDING",
  ).length;

  const queryCases = allCases.filter(
    (item) =>
      String(
        item.assessmentStatus || item.status || "",
      ).toUpperCase() === "QUERY" ||
      String(item.status || "").toUpperCase() ===
        "VALUATION_QUERY",
  ).length;

  const completedCases = allCases.filter((item) =>
    [
      "APPROVED_TO_LEGAL",
      "VALUATION_APPROVED",
    ].includes(
      String(
        item.assessmentStatus || item.status || "",
      ).toUpperCase(),
    ),
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7ff] via-[#f8fbff] to-[#eef7ff] p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#078b86] via-[#119c90] to-[#59c994] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-blue-500/20" />
          <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                <FaBuilding />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Valuation Dashboard
                </h1>

                <p className="mt-2 text-sm font-medium text-white/90">
                  Manage applications currently pending
                  technical valuation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => casesQuery.refetch()}
              disabled={casesQuery.isFetching}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-teal-700 shadow-sm transition-all hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FaRedoAlt
                className={
                  casesQuery.isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              {casesQuery.isFetching
                ? "Refreshing..."
                : "Refresh Queue"}
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total Cases"
            value={totalCases}
            Icon={FaClipboardCheck}
          />

          <KpiCard
            title="Pending Valuation"
            value={pendingCases}
            Icon={FaBuilding}
          />

          <KpiCard
            title="Technical Query"
            value={queryCases}
            Icon={FaExclamationTriangle}
          />

          <KpiCard
            title="Completed"
            value={completedCases}
            Icon={FaShieldAlt}
          />
        </div>

        {/* Queue */}
        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Valuation Queue
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Applications with stage VALUATION and
                status VALUATION PENDING.
              </p>
            </div>

            <div className="relative w-full xl:w-[420px]">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search application, customer, mobile or PAN"
                className="h-12 w-full rounded-xl border border-blue-100 bg-white px-4 pl-11 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* API error */}
          {casesQuery.isError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />

                <div>
                  <p className="font-black text-red-700">
                    Unable to load valuation cases
                  </p>

                  <p className="mt-1 text-sm font-medium text-red-600">
                    {casesQuery.error?.message ||
                      "Valuation API request failed."}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      casesQuery.refetch()
                    }
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-2xl border border-blue-100">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="bg-teal-50 text-xs font-black uppercase tracking-wide text-teal-700">
                <tr>
                  <th className="px-5 py-4">
                    Application No
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Mobile / PAN
                  </th>

                  <th className="px-5 py-4">
                    Requested Amount
                  </th>

                  <th className="px-5 py-4">
                    Stage
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {casesQuery.isLoading && (
                  <LoadingRows />
                )}

                {!casesQuery.isLoading &&
                  !casesQuery.isError &&
                  valuationCases.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                            <FaBuilding />
                          </div>

                          <p className="mt-4 font-black text-slate-700">
                            No valuation cases found
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-500">
                            No application currently matches
                            stage VALUATION and status
                            VALUATION PENDING.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                {!casesQuery.isLoading &&
                  !casesQuery.isError &&
                  valuationCases.map((item) => (
                    <tr
                      key={String(
                        item.applicationId,
                      )}
                      className="transition-all hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-800">
                          {item.applicationNumber ||
                            `APP-${item.applicationId}`}
                        </div>

                        <div className="mt-1 text-xs font-medium text-slate-500">
                          ID: {item.applicationId}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">
                          {item.customerName || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">
                          {item.mobileNumber || "—"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.pan || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(
                          item.requestedAmount,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-700">
                          {formatStatus(item.stage)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                          {formatStatus(item.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/valuation/${item.applicationId}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-teal-700"
                        >
                          <FaEye />
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!casesQuery.isLoading &&
            !casesQuery.isError &&
            valuationCases.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {valuationCases.length} of{" "}
                  {allCases.length} case(s)
                </span>

                {casesQuery.dataUpdatedAt > 0 && (
                  <span>
                    Last refreshed:{" "}
                    {new Date(
                      casesQuery.dataUpdatedAt,
                    ).toLocaleTimeString("en-IN")}
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUPPORTING COMPONENTS
========================================================= */

function LoadingRows() {
  return Array.from({ length: 5 }).map(
    (_, index) => (
      <tr key={index}>
        {Array.from({ length: 7 }).map(
          (__, cellIndex) => (
            <td
              key={cellIndex}
              className="px-5 py-5"
            >
              <div className="h-4 animate-pulse rounded bg-slate-200" />
            </td>
          ),
        )}
      </tr>
    ),
  );
}

function KpiCard({ title, value, Icon }) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-xl text-teal-700">
          <Icon />
        </div>
      </div>
    </div>
  );
}