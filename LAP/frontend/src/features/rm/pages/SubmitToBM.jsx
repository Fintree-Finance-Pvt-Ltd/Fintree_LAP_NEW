import { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function SubmitToBM() {
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
    { id: 10, label: "Active Loan", status: "Pending" },
    { id: 11, label: "Collections", status: "Pending" },
  ];

  const gateItems = [
    { label: "Customer / residence visit completed", sub: "Validation passed", passed: true },
    { label: "Business / office visit completed", sub: "Validation passed", passed: true },
    { label: "Property visit completed", sub: "Validation passed", passed: true },
    { label: "All geo locations captured", sub: "Validation passed", passed: true },
    { label: "Mandatory KYC and consent available", sub: "Validation passed", passed: true },
    { label: "Minimum income documents uploaded", sub: "Required before submission", passed: false },
    { label: "Minimum property documents uploaded", sub: "Required before submission", passed: false },
  ];

  const [recommendation, setRecommendation] = useState(
    "Customer profile and property are satisfactory. Recommend BM review."
  );
  const [workflowOwner, setWorkflowOwner] = useState("Branch Manager");
  const [priority, setPriority] = useState("Normal");

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      
      {/* 1. Header Capture Workspace Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Submit Case to Branch Manager</h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
              FTLIP-2026-0001 • Final RM quality check before hand-off.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
              Resolve Documents
            </button>
            <button className="rounded-xl bg-white/50 text-white font-extrabold text-xs px-5 py-2.5 backdrop-blur-md cursor-not-allowed transition-all">
              Submit to BM
            </button>
          </div>
        </div>
      </div>

      {/* 2. Multi-Stage Timeline Component */}
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
        <div className="flex justify-between border-t border-slate-100 pt-4 mt-2">
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><FaChevronLeft size={12} /></button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><FaChevronRight size={12} /></button>
        </div>
      </div>

      {/* 3. Submission Gate Validation Checklist */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">Submission gate</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              {item.passed ? (
                <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={18} />
              ) : (
                <FaTimesCircle className="text-rose-400 mt-0.5 shrink-0" size={18} />
              )}
              <div>
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. RM Recommendation Field Form Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
        
        {/* Recommendation Textarea Box */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">RM Recommendation</label>
          <textarea
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Bottom Metadata Dropdowns Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Workflow Owner</label>
            <input
              type="text"
              value={workflowOwner}
              onChange={(e) => setWorkflowOwner(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              <option>Normal</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </div>

        </div>

      </div>

    </div>
  );
}