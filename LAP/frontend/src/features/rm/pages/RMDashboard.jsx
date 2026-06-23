import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function RMDashboard() {
  const metrics = [
    { title: "MY ACTIVE LEADS", value: 18, color: "from-blue-500/10 to-indigo-500/5", textColor: "text-blue-600" },
    { title: "VISITS DUE", value: 5, color: "from-emerald-500/10 to-teal-500/5", textColor: "text-emerald-600" },
    { title: "SUBMITTED TO BM", value: 7, color: "from-rose-500/10 to-pink-500/5", textColor: "text-rose-600" },
    { title: "CONVERSION", value: "38%", color: "from-amber-500/10 to-orange-500/5", textColor: "text-amber-600" },
  ];

  const steps = [
    { id: 1, label: "Lead", status: "Current" },
    { id: 2, label: "Field Verification", status: "Pending" },
    { id: 3, label: "BM Review", status: "Pending" },
    { id: 4, label: "CM Screening", status: "Pending" },
    { id: 5, label: "Credit", status: "Pending" },
    { id: 6, label: "Legal & Valuation", status: "Pending" },
    { id: 7, label: "Sanction", status: "Pending" },
    { id: 8, label: "Documentation", status: "Pending" },
    { id: 9, label: "Disbursement", status: "Pending" },
  ];

  const cases = [
    { id: "FTLIP-2026-0001", applicant: "Aarav Sharma", amount: "₹65,000,000", stage: "Lead", status: "New", statusColor: "bg-blue-50 text-blue-600" },
    { id: "FTLIP-2026-0002", applicant: "Meera Iyer", amount: "₹80,000,000", stage: "BM Review", status: "Submitted to BM", statusColor: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      
      {/* 1. Glassmorphic Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Relationship Manager Dashboard</h2>
            <p className="mt-2 text-sm text-blue-100/80 font-medium">Welcome Rohit Mehta. Operational view for Noida Spoke.</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md hover:bg-white/20 transition-all">Print</button>
            <button className="rounded-xl bg-white text-[#1a4cb0] px-5 py-2 text-sm font-bold shadow-md hover:bg-blue-50 transition-all">View Journey</button>
          </div>
        </div>
      </div>

      {/* 2. Metric Analytics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} border border-white bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden`}>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{card.title}</div>
            <div className={`mt-2 text-4xl font-extrabold tracking-tight ${card.textColor}`}>{card.value}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600">
              <span className="h-1 w-1 rounded-full bg-emerald-500"></span> Live prototype indicator
            </div>
          </div>
        ))}
      </div>

      {/* 3. Interactive Multi-Stage Case Timeline */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-4 gap-4 scrollbar-none">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1 min-w-[110px]">
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step.id === 1 ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"
                }`}>
                  {step.id}
                </div>
                <span className={`mt-2 text-xs font-bold whitespace-nowrap ${step.id === 1 ? "text-blue-600" : "text-slate-700"}`}>{step.label}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">{step.status}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="h-[2px] w-full bg-slate-200 mx-2 mt-[-16px]"></div>
              )}
            </div>
          ))}
        </div>
        {/* Timeline Horizontal Navigation Buttons */}
        <div className="flex justify-between border-t border-slate-100 pt-4 mt-2">
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><FaChevronLeft size={12} /></button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><FaChevronRight size={12} /></button>
        </div>
      </div>

      {/* 4. Attention Cases Data Table & Detailed Selected Case Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Table View */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-[#0f2942]">Cases requiring attention</h3>
            <button className="text-xs font-semibold text-blue-600 hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 rounded-l-xl">Case</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-r-xl">Owner</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-50">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{c.id}</td>
                    <td className="p-4 text-slate-600">{c.applicant}</td>
                    <td className="p-4 font-semibold">{c.amount}</td>
                    <td className="p-4"><span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-semibold">{c.stage}</span></td>
                    <td className="p-4"><span className={`text-xs font-bold px-2.5 py-1 rounded-md ${c.statusColor}`}>{c.status}</span></td>
                    <td className="p-4 text-slate-500">Rohit Mehta</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Case Summary View Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f2942] mb-5 border-b border-slate-100 pb-3">Selected case</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">Applicant</span><span className="font-bold text-slate-900">Aarav Sharma</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">Requested</span><span className="font-bold text-slate-900 text-base">₹65,000,000</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">FOIR</span><span className="font-bold text-slate-900">22.70%</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">Indicative LTV</span><span className="font-bold text-slate-900">61.90%</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}