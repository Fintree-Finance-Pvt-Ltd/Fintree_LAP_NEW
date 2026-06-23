import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import { useAuth } from "../../../hooks/useAuth.js";
import { rmApi } from "../rmApi.js";
import { displayStage, formatCurrency, statusClass, workflowSteps } from "../rmUtils.js";

export default function RMDashboard() {
  const { user } = useAuth();
  const dashboard = useQuery({ queryKey: ["rm-dashboard"], queryFn: rmApi.dashboard });
  const applications = useQuery({
    queryKey: ["rm-dashboard-applications"],
    queryFn: () => rmApi.applications({ page: 1, limit: 5 }),
  });

  const stats = dashboard.data?.data ?? {};
  const cases = applications.data?.data ?? [];
  const selectedCase = cases[0];

  const metrics = [
    { title: "TOTAL CASES", value: stats.totalCases ?? 0, color: "from-blue-500/10 to-indigo-500/5", textColor: "text-blue-600" },
    { title: "DRAFT CASES", value: stats.draftCases ?? 0, color: "from-emerald-500/10 to-teal-500/5", textColor: "text-emerald-600" },
    { title: "SUBMITTED TO BM", value: stats.pendingCases ?? 0, color: "from-rose-500/10 to-pink-500/5", textColor: "text-rose-600" },
    { title: "THIS MONTH", value: stats.monthlyCases ?? 0, color: "from-amber-500/10 to-orange-500/5", textColor: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen space-y-8 bg-[#f8fafc] p-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Relationship Manager Dashboard</h2>
            <p className="mt-2 text-sm font-medium text-blue-100/80">
              Welcome {user?.name || user?.email || "RM"}. Operational view for {user?.spoke || "your spoke"}.
            </p>
          </div>
          <Link to="/create-lead" className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-[#1a4cb0] shadow-md transition-all hover:bg-blue-50">
            Create Lead
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((card) => (
          <div key={card.title} className={`relative overflow-hidden rounded-2xl border border-white bg-white bg-gradient-to-br ${card.color} p-6 shadow-sm`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.title}</div>
            <div className={`mt-2 text-4xl font-extrabold tracking-tight ${card.textColor}`}>{dashboard.isLoading ? "--" : card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
          {workflowSteps.map((label, idx) => (
            <div key={label} className="flex min-w-[110px] flex-1 items-center">
              <div className="flex flex-1 flex-col items-center text-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"}`}>
                  {idx + 1}
                </div>
                <span className={`mt-2 whitespace-nowrap text-xs font-bold ${idx === 0 ? "text-blue-600" : "text-slate-700"}`}>{displayStage(label)}</span>
              </div>
              {idx < workflowSteps.length - 1 && <div className="mx-2 mt-[-16px] h-[2px] w-full bg-slate-200" />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-4">
          <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"><FaChevronLeft size={12} /></button>
          <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"><FaChevronRight size={12} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0f2942]">Cases requiring attention</h3>
            <Link to="/my-leads" className="text-xs font-semibold text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="rounded-l-xl p-4">Case</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Stage</th>
                  <th className="rounded-r-xl p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                {applications.isLoading ? (
                  <tr><td className="p-4 text-slate-400" colSpan={5}>Loading cases...</td></tr>
                ) : cases.length ? cases.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{item.applicationNumber}</td>
                    <td className="p-4 text-slate-600">{item.customerName}</td>
                    <td className="p-4 font-semibold">{formatCurrency(item.requestedAmount)}</td>
                    <td className="p-4"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{displayStage(item.stage)}</span></td>
                    <td className="p-4"><span className={`rounded-md px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span></td>
                  </tr>
                )) : (
                  <tr><td className="p-4 text-slate-400" colSpan={5}>No RM cases found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-5 border-b border-slate-100 pb-3 text-base font-bold text-[#0f2942]">Selected case</h3>
            {selectedCase ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm"><span className="font-medium text-slate-400">Applicant</span><span className="font-bold text-slate-900">{selectedCase.customerName}</span></div>
                <div className="flex justify-between text-sm"><span className="font-medium text-slate-400">Requested</span><span className="text-base font-bold text-slate-900">{formatCurrency(selectedCase.requestedAmount)}</span></div>
                <div className="flex justify-between text-sm"><span className="font-medium text-slate-400">Stage</span><span className="font-bold text-slate-900">{displayStage(selectedCase.stage)}</span></div>
                <div className="flex justify-between text-sm"><span className="font-medium text-slate-400">Status</span><span className="font-bold text-slate-900">{selectedCase.status}</span></div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Create a lead to see the case summary.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
