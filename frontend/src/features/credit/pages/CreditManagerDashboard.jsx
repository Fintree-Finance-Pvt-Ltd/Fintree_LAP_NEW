import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  FaArrowRight,
  FaChevronDown,
  FaClock,
  FaFileInvoice,
  FaSearch,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import { Link } from "react-router-dom";

import { creditApi } from "../creditApi.js";
import { formatCurrency } from "../../rm/rmUtils.js";

const creditTabs = [
  {
    key: "ALL",
    label: "All Credit Cases",
    statuses: [],
  },
  {
    key: "PENDING",
    label: "Credit Pending",
    statuses: ["CM_PENDING", "CREDIT_PENDING"],
  },
  {
    key: "UNDERWRITING",
    label: "Underwriting",
    statuses: ["CREDIT_UNDERWRITING", "CREDIT_REVIEW"],
  },
  {
    key: "QUERY",
    label: "Query Raised",
    statuses: ["CREDIT_QUERY", "QUERY_RAISED"],
  },
  {
    key: "APPROVED",
    label: "Approved",
    statuses: ["CREDIT_APPROVED"],
  },
  {
    key: "REJECTED",
    label: "Rejected",
    statuses: ["CREDIT_REJECTED", "REJECTED"],
  },
];

const getStatusBadgeClass = (status) => {
  const value = String(status || "").toUpperCase();

  if (value.includes("APPROVED")) {
    return "bg-emerald-100 text-emerald-700 ring-emerald-600/20";
  }

  if (value.includes("QUERY")) {
    return "bg-purple-100 text-purple-700 ring-purple-600/20";
  }

  if (value.includes("REJECTED")) {
    return "bg-rose-100 text-rose-700 ring-rose-600/20";
  }

  if (value.includes("PENDING") || value.includes("REVIEW")) {
    return "bg-amber-100 text-amber-700 ring-amber-600/20";
  }

  return "bg-blue-100 text-blue-700 ring-blue-600/20";
};

const formatStatus = (value) => {
  return String(value || "-")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getCreditStageLabel = (lead) => {
  const status = String(lead.status || "").toUpperCase();

  if (status === "CM_PENDING") return "CM Screening Done";
  if (status === "CREDIT_PENDING") return "Credit Pending";
  if (status === "CREDIT_REVIEW") return "Credit Review";
  if (status === "CREDIT_UNDERWRITING") return "Underwriting";
  if (status === "CREDIT_QUERY") return "Credit Query";
  if (status === "CREDIT_APPROVED") return "Credit Approved";
  if (status === "CREDIT_REJECTED") return "Credit Rejected";

  return formatStatus(lead.stage || lead.status);
};

const getPropertyLabel = (lead) => {
  return (
    lead.propertyType ||
    lead.propertyCategory ||
    lead.customerProfile?.propertyType ||
    lead.customerProfile?.propertyCategory ||
    "-"
  );
};

const getLocationLabel = (lead) => {
  return (
    lead.propertyCity ||
    lead.city ||
    lead.customerProfile?.propertyCity ||
    lead.customerProfile?.city ||
    "-"
  );
};

export default function CreditManagerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("All Stages");

const query = useQuery({
  queryKey: ["credit-manager-dashboard", searchTerm],
  queryFn: () =>
    searchTerm.trim()
      ? creditApi.searchApplications(searchTerm.trim())
      : creditApi.applications({ page: 1, limit: 100 }),
});
  const allRows = useMemo(() => {
    return query.data?.data ?? [];
  }, [query.data]);

  const creditRows = useMemo(() => {
    return allRows.filter((item) => {
      const stage = String(item.stage || "").toUpperCase();
      const status = String(item.status || "").toUpperCase();

      return (
        stage === "CREDIT" ||
        status.includes("CREDIT") ||
        status === "CM_PENDING"
      );
    });
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const activeTab = creditTabs.find((tab) => tab.key === selectedTab);

    let rows = creditRows;

    if (activeTab && activeTab.key !== "ALL") {
      rows = rows.filter((item) =>
        activeTab.statuses.includes(String(item.status || "").toUpperCase()),
      );
    }

    if (selectedStage !== "All Stages") {
      rows = rows.filter((item) => {
        const stage = String(item.stage || "").toUpperCase();
        const status = String(item.status || "").toUpperCase();
        const selected = String(selectedStage || "").toUpperCase();

        return stage === selected || status.includes(selected);
      });
    }

    return rows;
  }, [creditRows, selectedTab, selectedStage]);

  const getTabCount = (tab) => {
    if (tab.key === "ALL") return creditRows.length;

    return creditRows.filter((item) =>
      tab.statuses.includes(String(item.status || "").toUpperCase()),
    ).length;
  };

  const stats = useMemo(() => {
    const pending = creditRows.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "CM_PENDING" || status === "CREDIT_PENDING";
    }).length;

    const underwriting = creditRows.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "CREDIT_REVIEW" || status === "CREDIT_UNDERWRITING";
    }).length;

    const approved = creditRows.filter(
      (item) => String(item.status || "").toUpperCase() === "CREDIT_APPROVED",
    ).length;

    const queryRaised = creditRows.filter((item) =>
      String(item.status || "").toUpperCase().includes("QUERY"),
    ).length;

    return {
      total: creditRows.length,
      pending,
      underwriting,
      approved,
      queryRaised,
    };
  }, [creditRows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 antialiased md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#312e81] via-[#2563eb] to-[#06b6d4] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-20 top-0 h-full w-72 bg-cyan-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                <FaShieldAlt />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Credit Manager Dashboard
                </h1>
                <p className="mt-2 text-sm font-medium text-white/90">
                  Review credit queue, underwriting cases, queries, approvals and
                  rejections.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total Cases" value={stats.total} />
              <StatCard label="Pending" value={stats.pending} />
              <StatCard label="Underwriting" value={stats.underwriting} />
              <StatCard label="Approved" value={stats.approved} />
            </div>
          </div>
        </div>

        {/* FILTER */}
        <div className="rounded-[26px] border border-blue-100 bg-white/90 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_240px_140px]">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                type="text"
                placeholder="Search case, applicant, mobile, PAN"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-xl border border-blue-100 bg-white px-4 pl-11 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <select
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option>All Stages</option>
                <option>CM</option>
                <option>CREDIT</option>
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <FaChevronDown size={12} />
              </span>
            </div>

            <button
              type="button"
              className="h-12 rounded-xl border border-blue-100 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="overflow-hidden rounded-[26px] border border-blue-100 bg-white/95 shadow-sm">
          <div className="border-b border-blue-100">
            <div className="flex gap-1 overflow-x-auto px-6 pt-4">
              {creditTabs.map((tab) => {
                const active = selectedTab === tab.key;
                const count = getTabCount(tab);

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedTab(tab.key)}
                    className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-black transition-all ${
                      active
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-black ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TABLE */}
          <div className="p-7">
            <div className="overflow-hidden rounded-2xl border border-blue-100">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#eef2ff] text-xs font-black uppercase tracking-wider text-[#3c4599]">
                      <th className="px-6 py-5">Lead ID</th>
                      <th className="px-5 py-5">Applicant</th>
                      <th className="px-5 py-5">Mobile / PAN</th>
                      <th className="px-5 py-5">Requested Amount</th>
                      <th className="px-5 py-5">Property</th>
                      <th className="px-5 py-5">Credit Stage</th>
                      <th className="px-5 py-5">Status</th>
                      <th className="px-6 py-5 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100 text-sm">
                    {query.isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-14 text-center text-sm font-bold text-slate-400"
                        >
                          Loading credit manager cases...
                        </td>
                      </tr>
                    ) : filteredRows.length ? (
                      filteredRows.map((lead) => (
                        <tr
                          key={`credit-case-${lead.id}`}
                          className="transition-colors hover:bg-blue-50/40"
                        >
                          <td className="px-6 py-5">
                            <div className="font-black text-slate-800">
                              {lead.applicationNumber || `LAP-${lead.id}`}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              {lead.source || lead.channel || "Direct"}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-bold text-slate-700">
                              {lead.customerName || "-"}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {lead.occupationType ||
                                lead.occupation ||
                                lead.customerProfile?.occupationType ||
                                "-"}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-semibold text-slate-700">
                              {lead.mobile || lead.mobileNumber || "-"}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {lead.pan || lead.panNumber || "-"}
                            </div>
                          </td>

                          <td className="px-5 py-5 font-bold text-slate-700">
                            {formatCurrency(lead.requestedAmount)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-semibold text-slate-700">
                              {getPropertyLabel(lead)}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {getLocationLabel(lead)}
                            </div>
                          </td>

                          <td className="px-5 py-5 font-semibold text-slate-700">
                            {getCreditStageLabel(lead)}
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex rounded-full px-4 py-2 text-xs font-black ring-1 ring-inset ${getStatusBadgeClass(
                                lead.status,
                              )}`}
                            >
                              {formatStatus(lead.status)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/applications/${lead.id}`}
                                className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:bg-blue-50"
                              >
                                Open
                              </Link>

                              <Link
                                to={`/credit-review/${lead.id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-blue-700"
                              >
                                Review <FaArrowRight size={10} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-14 text-center text-sm font-bold text-slate-400"
                        >
                          No credit cases found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTION CARDS */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <QuickCard
            icon={<FaUserCheck />}
            title="Underwriting Queue"
            text="Review borrower income, FOIR, bureau and eligibility details."
          />
          <QuickCard
            icon={<FaFileInvoice />}
            title="Credit Queries"
            text="Track queries raised to RM/BM and monitor pending responses."
          />
          <QuickCard
            icon={<FaClock />}
            title="TAT Monitoring"
            text="Identify ageing cases pending at credit decision stage."
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/20 px-5 py-4 backdrop-blur-md">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/75">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function QuickCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
        {text}
      </p>
    </div>
  );
}