import { useQuery } from "@tanstack/react-query";
import {
  FaChartLine,
  FaClipboardList,
  FaFileInvoice,
  FaMoneyBillWave,
  FaRegCreditCard,
  FaSearch,
  FaUniversity,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { lmsApi } from "../lmsApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? {};
};

const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const dashboardModules = [
  {
    title: "Loan Accounts",
    description: "View LAN, customer, disbursement and loan status.",
    icon: FaUniversity,
    path: "/lms/loan-accounts",
  },
  {
    title: "Disbursements",
    description: "Track disbursed loans and pending booking records.",
    icon: FaMoneyBillWave,
    path: "/lms/disbursements",
  },
  {
    title: "Repayments",
    description: "View repayment collections and payment allocation.",
    icon: FaRegCreditCard,
    path: "/lms/repayments",
  },
  {
    title: "UTR Allocation",
    description: "Upload UTR and map payment to LAN.",
    icon: FaClipboardList,
    path: "/lms/utr-upload",
  },
  {
    title: "NACH / eNACH",
    description: "Track mandate registration and debit status.",
    icon: FaFileInvoice,
    path: "/lms/nach",
  },
  {
    title: "SOA",
    description: "Generate statement of account for customer.",
    icon: FaChartLine,
    path: "/lms/soa",
  },
  {
    title: "Collections",
    description: "Track overdue cases and customer follow-up.",
    icon: FaUsers,
    path: "/lms/collections",
  },
  {
    title: "Reports",
    description: "Partner, lender, repayment and portfolio reports.",
    icon: FaSearch,
    path: "/lms/reports",
  },
];

export default function LmsDashboard() {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({
    queryKey: ["lms-dashboard"],
    queryFn: () => lmsApi.dashboard(),
    retry: false,
  });

  const payload = unwrapPayload(dashboardQuery.data);

  const stats = {
    totalLoanAccounts: payload?.totalLoanAccounts || 0,
    activeLoans: payload?.activeLoans || 0,
    disbursedAmount: payload?.disbursedAmount || 0,
    collectedAmount: payload?.collectedAmount || 0,
    overdueCases: payload?.overdueCases || 0,
    pendingNach: payload?.pendingNach || 0,
    pendingUtr: payload?.pendingUtr || 0,
    closedLoans: payload?.closedLoans || 0,
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#0f2942] via-[#2563eb] to-[#22c7c7] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/30" />
          <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-3xl shadow-inner backdrop-blur-md">
                LMS
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  LMS Dashboard
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-white/90">
                  Loan servicing workspace for disbursement, repayments, UTR,
                  NACH, SOA, collections and portfolio monitoring.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <HeaderBadge label="Active Loans" value={stats.activeLoans} />
                  <HeaderBadge label="Overdue" value={stats.overdueCases} />
                  <HeaderBadge label="Pending UTR" value={stats.pendingUtr} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-fit rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white backdrop-blur-md transition hover:bg-white/25"
            >
              Print Dashboard
            </button>
          </div>
        </div>

        {dashboardQuery.isError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            LMS dashboard API is not ready yet. Showing default dashboard layout.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Loan Accounts"
            value={stats.totalLoanAccounts}
            subtitle="Total booked LAN records"
            tone="blue"
          />

          <SummaryCard
            title="Active Loans"
            value={stats.activeLoans}
            subtitle="Currently active accounts"
            tone="green"
          />

          <SummaryCard
            title="Disbursed Amount"
            value={formatCurrency(stats.disbursedAmount)}
            subtitle="Total disbursed portfolio"
            tone="blue"
          />

          <SummaryCard
            title="Collected Amount"
            value={formatCurrency(stats.collectedAmount)}
            subtitle="Total repayment received"
            tone="green"
          />

          <SummaryCard
            title="Overdue Cases"
            value={stats.overdueCases}
            subtitle="Cases requiring collection follow-up"
            tone="red"
          />

          <SummaryCard
            title="Pending NACH"
            value={stats.pendingNach}
            subtitle="Mandates pending registration"
            tone="orange"
          />

          <SummaryCard
            title="Pending UTR"
            value={stats.pendingUtr}
            subtitle="Payments pending allocation"
            tone="orange"
          />

          <SummaryCard
            title="Closed Loans"
            value={stats.closedLoans}
            subtitle="Fully closed loan accounts"
            tone="slate"
          />
        </div>

        <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-black text-[#0f2942]">
              LMS Modules
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Select a module to manage loan servicing activities.
            </p>
            <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardModules.map((module) => (
              <ModuleCard
                key={module.title}
                title={module.title}
                description={module.description}
                icon={module.icon}
                onClick={() => navigate(module.path)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-black text-[#0f2942]">
              Quick Work Queue
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              High-priority LMS activities.
            </p>
            <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <QueueCard
              title="Pending UTR Allocation"
              count={stats.pendingUtr}
              description="Allocate repayment UTR to LAN."
              onClick={() => navigate("/lms/utr-upload")}
            />

            <QueueCard
              title="Pending NACH"
              count={stats.pendingNach}
              description="Check mandate registration status."
              onClick={() => navigate("/lms/nach")}
            />

            <QueueCard
              title="Overdue Follow-up"
              count={stats.overdueCases}
              description="Review overdue portfolio cases."
              onClick={() => navigate("/lms/collections")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderBadge({ label, value }) {
  return (
    <span className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">
      {label}: {value}
    </span>
  );
}

function SummaryCard({ title, value, subtitle, tone }) {
  const toneClass = {
    green: "text-emerald-700 bg-emerald-50 border-emerald-100",
    orange: "text-amber-700 bg-amber-50 border-amber-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    red: "text-rose-700 bg-rose-50 border-rose-100",
    slate: "text-slate-700 bg-slate-50 border-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
          toneClass[tone] || toneClass.blue
        }`}
      >
        {title}
      </div>

      <div className="mt-4 text-3xl font-black text-slate-900">{value}</div>

      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

function ModuleCard({ title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-blue-600 shadow-sm transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon />
      </div>

      <h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3>

      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
        {description}
      </p>
    </button>
  );
}

function QueueCard({ title, count, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {description}
          </p>
        </div>

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-black text-blue-700 shadow-sm">
          {count}
        </span>
      </div>
    </button>
  );
}