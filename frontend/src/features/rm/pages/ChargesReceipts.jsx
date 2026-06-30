import { useState } from "react";
import { FaCheckCircle, FaChevronRight } from "react-icons/fa";

export default function ChargesReceipts() {
  const steps = [
    { id: 1, title: "Quote & disclose", desc: "Charges configured and mapped to KFS", completed: true },
    { id: 2, title: "Customer consent", desc: "Customer accepts charge schedule", completed: false },
    { id: 3, title: "Collect", desc: "NBFC account / approved mode", completed: false },
    { id: 4, title: "Reconcile & receipt", desc: "Payment matched and receipt generated", completed: false },
    { id: 5, title: "Checker approve", desc: "Independent verification before next gate", completed: false },
  ];

  const summaryCards = [
    { label: "BASE CHARGES", val: "₹97,115", color: "from-indigo-500/10 to-transparent", text: "text-indigo-600" },
    { label: "GST / TAX", val: "₹8,874", color: "from-teal-500/10 to-transparent", text: "text-teal-600" },
    { label: "TOTAL APPROVED", val: "₹1,05,989", color: "from-pink-500/10 to-transparent", text: "text-pink-600" },
    { label: "CUSTOMER PAID", val: "₹0", color: "from-amber-500/10 to-transparent", text: "text-amber-600" },
    { label: "BALANCE DUE", val: "₹1,05,989", color: "from-blue-500/10 to-transparent", text: "text-blue-600" },
  ];

  const initialCharges = [
    { name: "Login / Application Fee", sub: "Mandatory · Non-refundable after login, subject to policy", stage: "At Login", base: "2500", gst: "₹450 (18%)", gross: "₹2,950" },
    { name: "Processing Fee", sub: "Mandatory · As disclosed in KFS and policy", stage: "Before Sanction / Disbursement", base: "29500", gst: "₹5,310 (18%)", gross: "₹34,810" },
    { name: "Legal Verification Fee", sub: "Mandatory · Actual service cost; policy based", stage: "Before Legal Initiation", base: "7500", gst: "₹1,350 (18%)", gross: "₹8,850" },
    { name: "Technical / Valuation Fee", sub: "Mandatory · Actual service cost; policy based", stage: "Before Valuation Initiation", base: "5500", gst: "₹990 (18%)", gross: "₹6,490" },
    { name: "Documentation Fee", sub: "Optional / Conditional · As per KFS", stage: "Before Agreement", base: "3500", gst: "₹630 (18%)", gross: "₹4,130" },
    { name: "Stamp Duty / eStamp", sub: "Mandatory · Government/statutory actual", stage: "Agreement", base: "6500", gst: "₹0 (0%)", gross: "₹6,500" },
    { name: "MODT / Mortgage Registration", sub: "Mandatory · State-specific statutory actual", stage: "Mortgage", base: "6500", gst: "₹0 (0%)", gross: "₹6,500" },
    { name: "CERSAI Registration Charge", sub: "Mandatory · Actual charge", stage: "Pre/Post Disbursement", base: "500", gst: "₹90 (18%)", gross: "₹590" },
    { name: "NACH / eMandate Setup Fee", sub: "Optional / Conditional · As per KFS", stage: "Before Disbursement", base: "300", gst: "₹54 (18%)", gross: "₹354" },
    { name: "Insurance Premium (Optional)", sub: "Optional / Conditional · Only with explicit customer choice", stage: "Before Disbursement", base: "13000", gst: "₹0 (0%)", gross: "₹13,000" },
    { name: "Broken Period Interest / Advance EMI", sub: "Optional / Conditional · Calculated from disbursement date", stage: "At Disbursement", base: "21815", gst: "₹0 (0%)", gross: "₹21,815" },
    { name: "Other Approved Charge", sub: "Optional / Conditional · Requires KFS/consent and checker approval", stage: "As Approved", base: "0", gst: "₹0 (18%)", gross: "₹0", noLink: true },
  ];

  const [charges, setCharges] = useState(initialCharges);

  const handleBaseChange = (index, value) => {
    const updated = [...charges];
    updated[index].base = value;
    setCharges(updated);
  };

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      
      {/* 1. Header Capture Workspace Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Charge Schedule, Fee Approval & Collection Gates</h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
              FTLIP-2026-0001 • Configure and approve charges first; then collect them through secure customer payment links.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">Save Schedule</button>
            <button className="rounded-xl bg-white text-[#1a4cb0] font-extrabold text-xs px-4 py-2 shadow-md hover:bg-blue-50 transition-all">Submit Schedule to Checker</button>
            <button className="rounded-xl bg-white/20 text-white font-bold text-xs px-4 py-2 border border-white/20 hover:bg-white/30 transition-all">Checker Approve Schedule</button>
            <button className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 font-extrabold text-xs px-4 py-2 shadow-sm hover:brightness-105 transition-all">Manage Payment Links →</button>
          </div>
        </div>
      </div>

      {/* 2. Gate Process Timeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {steps.map((s) => (
          <div key={s.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            {s.completed ? (
              <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
            ) : (
              <span className="h-5 w-5 rounded-full bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">{s.id}</span>
            )}
            <div>
              <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Metric Value Display Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${card.color} bg-white border border-slate-100 p-5 rounded-2xl shadow-sm`}>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{card.label}</div>
            <div className={`text-xl font-extrabold tracking-tight mt-1 ${card.text}`}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* 4. Sequence Instruction Ribbon */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/30 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 font-medium leading-relaxed">
        <span className="font-bold text-amber-900 uppercase tracking-wide mr-1">Required sequence:</span>
        Fee Maker prepares the charge schedule → Checker approves → authorized person creates the payment link → customer pays → gateway webhook auto-updates payment, charge status and receipt. Schedule status: <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">Draft</span>.
      </div>

      {/* 5. Stage Wise Table Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942] uppercase tracking-wider">Stage-wise approved charge schedule</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Amounts must match the product policy, KFS and customer consent. Statutory charges are captured at actuals.</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all whitespace-nowrap">
            Create Link for Unpaid Charges
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 pl-6 w-[25%]">Charge</th>
                <th className="p-4 w-[18%]">Required Stage</th>
                <th className="p-4 w-[10%]">Base</th>
                <th className="p-4 w-[8%]">GST</th>
                <th className="p-4 w-[8%]">Gross</th>
                <th className="p-4 w-[13%]">Paid / Waived / Refunded</th>
                <th className="p-4 w-[10%]">Collection Status</th>
                <th className="p-4 pr-6 w-[18%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
              {charges.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-900 leading-snug">{row.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">{row.sub}</div>
                  </td>
                  <td className="p-4 text-slate-500 font-semibold">{row.stage}</td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={row.base}
                      onChange={(e) => handleBaseChange(idx, e.target.value)}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                    />
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{row.gst}</td>
                  <td className="p-4 font-bold text-slate-900">{row.gross}</td>
                  <td className="p-4">
                    <div className="text-slate-800 font-semibold">₹0 paid</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">₹0 waiver · ₹0 refund</div>
                  </td>
                  <td className="p-4">
                    <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">Pending</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-medium">No payment reference</div>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-1">
                      {!row.noLink && (
                        <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-all shadow-sm">Create Link</button>
                      )}
                      <button className="border border-slate-200 hover:bg-slate-50 text-[#0f2942] font-bold text-[10px] px-2 py-1 rounded transition-all shadow-sm">Manual Collection</button>
                      <button className="border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-red-600 font-bold text-[10px] px-2 py-1 rounded transition-all shadow-sm">Waiver</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Footer Layout Information Hub Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* AUTOMATIC PAYMENT PATH INFO CONTAINER */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide border-b border-slate-50 pb-2">Automatic payment path</h3>
          <ol className="space-y-2 text-xs text-slate-600 font-medium list-none">
            {["1. Approved demand and unique link created", "2. Link sent by SMS, WhatsApp and/or email", "3. Customer pays through gateway/UPI/VA", "4. Signed webhook is validated and deduplicated", "5. Payment is allocated to selected charges", "6. Status and receipt update automatically"].map((txt, i) => (
              <li key={i}>{txt}</li>
            ))}
          </ol>
        </div>

        {/* MANUAL EXCEPTION PATH INFO CONTAINER */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide border-b border-slate-50 pb-2">Manual exception path</h3>
          <ul className="space-y-2 text-xs text-slate-600 font-medium">
            {["Cheque/cash and unmatched NEFT need maker entry", "Payment Checker verifies bank evidence", "Partial/excess amount enters reconciliation queue", "Refund, waiver, reversal and chargeback require checker", "All actions record user, time and old/new value"].map((txt, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-1 w-1 bg-slate-400 rounded-full shrink-0"></span>
                <span>{txt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DISBURSEMENT GATE CONTROL SIDEBOARD BOX */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide border-b border-slate-50 pb-2">Disbursement hard gate</h3>
            
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Mandatory fees</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">Pending</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Schedule approval</span>
                <span className="font-bold text-slate-900">Draft</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Pending customer amount</span>
                <span className="font-extrabold text-slate-900 text-sm">₹1,05,989</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 text-blue-600 font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all">
            Open Payment Management
          </button>
        </div>

      </div>

    </div>
  );
}