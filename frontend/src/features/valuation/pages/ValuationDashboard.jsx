import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaEye,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";

import { valuationApi } from "../valuationApi.js";

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatStatus = (value) => {
  if (!value) return "—";
  return String(value).replaceAll("_", " ");
};

export default function ValuationDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const casesQuery = useQuery({
    queryKey: ["valuation-dashboard-cases"],
    queryFn: () => valuationApi.cases(),
  });

  const valuationCases = useMemo(() => {
    const rows = unwrapList(casesQuery.data);

    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((item) => {
      return [
        item.applicationNumber,
        item.customerName,
        item.mobile,
        item.pan,
        item.status,
        item.stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [casesQuery.data, searchTerm]);

  const totalCases = valuationCases.length;

  const pendingCases = valuationCases.filter((item) =>
    ["VALUATION_PENDING"].includes(String(item.status || "").toUpperCase()),
  ).length;

  const queryCases = valuationCases.filter((item) =>
    ["VALUATION_QUERY"].includes(String(item.status || "").toUpperCase()),
  ).length;

  const completedCases = valuationCases.filter((item) =>
    ["VALUATION_APPROVED"].includes(String(item.status || "").toUpperCase()),
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#078b86] via-[#119c90] to-[#59c994] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-blue-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

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
                  Manage technical valuation queue, property inspection and
                  accepted value assessment.
                </p>
              </div>
            </div>

            <Link
              to="/valuation"
              className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-teal-700 shadow-sm transition-all hover:bg-teal-50"
            >
              Open Valuation Queue
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
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

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Valuation Queue
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Cases approved by Credit Checker and pending technical
                valuation.
              </p>
            </div>

            <div className="relative w-full xl:w-[420px]">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by application, customer, mobile, PAN"
                className="h-12 w-full rounded-xl border border-blue-100 bg-white px-4 pl-11 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-teal-50 text-xs font-black uppercase tracking-wide text-teal-700">
                <tr>
                  <th className="px-5 py-4">Application No</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Mobile / PAN</th>
                  <th className="px-5 py-4">Requested Amount</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {casesQuery.isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      Loading valuation cases...
                    </td>
                  </tr>
                )}

                {!casesQuery.isLoading && !valuationCases.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      No valuation cases found.
                    </td>
                  </tr>
                )}

                {!casesQuery.isLoading &&
                  valuationCases.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-all hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-black text-slate-800">
                        {item.applicationNumber || `APP-${item.id}`}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">
                          {item.customerName || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {item.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">
                          {item.mobile || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.pan || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(item.requestedAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-700">
                          {formatStatus(item.stage)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                          {formatStatus(item.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/valuation/${item.id}`}
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
        </div>
      </div>
    </div>
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
          <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
        </div>

        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-teal-100 text-xl text-teal-700">
          <Icon />
        </div>
      </div>
    </div>
  );
}