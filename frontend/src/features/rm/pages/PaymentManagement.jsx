import { useState } from "react";
import { FaSyncAlt, FaDownload, FaPlus, FaCheckCircle, FaLock } from "react-icons/fa";

export default function PaymentManagement() {
  const steps = [
    { id: 1, title: "Approved charge demand" },
    { id: 2, title: "Link generated" },
    { id: 3, title: "SMS / WhatsApp / Email sent" },
    { id: 4, title: "Customer opened link" },
    { id: 5, title: "Gateway payment received" },
    { id: 6, title: "Webhook auto-matched" },
    { id: 7, title: "Receipt & settlement" },
  ];

  const summaryCards = [
    { label: "PAYMENT DEMANDS", val: "0" },
    { label: "TOTAL DEMANDED", val: "₹0", text: "text-teal-600" },
    { label: "CUSTOMER PAID", val: "₹0", text: "text-pink-600" },
    { label: "DEMAND PENDING", val: "₹0", text: "text-amber-600" },
    { label: "UNSETTLED", val: "₹0", text: "text-rose-600" },
  ];

  const lapFlowData = [
    { seq: 1, stage: "Application Login", charges: "Login / Application Fee", owner: "RM / Fee Desk", gate: "Before login processing when policy requires", preCollection: "Payment Link / UPI / Virtual Account" },
    { seq: 2, stage: "Legal Initiation", charges: "Legal Verification Fee", owner: "Legal Coordinator / Fee Desk", gate: "Before assigning the legal vendor", preCollection: "Payment Link / UPI / Virtual Account" },
    { seq: 3, stage: "Valuation Initiation", charges: "Technical / Valuation Fee", owner: "Valuation Coordinator / Fee Desk", gate: "Before assigning the technical valuer", preCollection: "Payment Link / UPI / Virtual Account" },
    { seq: 4, stage: "Sanction Acceptance", charges: "Processing Fee", owner: "Sanction Ops / Fee Desk", gate: "After KFS disclosure and before disbursement", preCollection: "Payment Link / UPI / Virtual Account" },
    { seq: 5, stage: "Agreement & Mortgage", charges: "Documentation Fee \n Stamp Duty / eStamp \n MODT / Mortgage Registration", owner: "Operations Maker", gate: "Before agreement/mortgage completion; statutory charges at actuals", preCollection: "Payment Link / Virtual Account / Approved Net-off" },
    { seq: 6, stage: "Pre-Disbursement", charges: "CERSAI Registration Charge \n NACH / eMandate Setup Fee \n Insurance Premium (Optional) \n Broken Period Interest / Advance EMI", owner: "Operations Maker", gate: "Before payout where applicable; insurance only after explicit opt-in", preCollection: "Payment Link / Approved Net-off" },
  ];

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Payment Link & Collection Management</h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
              FTLIP-2026-0001 • Create demand → send secure link → customer pays → webhook auto-updates → receipt and reconciliation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all flex items-center gap-2"><FaSyncAlt size={10}/> Refresh Gateway</button>
            <button className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all flex items-center gap-2"><FaDownload size={10}/> Export CSV</button>
            <button className="rounded-xl bg-white text-rose-600 font-extrabold text-xs px-5 py-2.5 shadow-md hover:bg-rose-50 transition-all flex items-center gap-2">
              <FaPlus size={10}/> Create & Send Payment Link
            </button>
          </div>
        </div>
      </div>

      {/* 2. Pipeline Process Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {steps.map((s) => (
          <div key={s.id} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex flex-col items-center text-center justify-center relative min-h-[72px]">
            <span className="h-5 w-5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] flex items-center justify-center border border-rose-200 mb-1">{s.id}</span>
            <h4 className="text-[10px] font-bold text-slate-700 leading-tight tracking-tight">{s.title}</h4>
          </div>
        ))}
      </div>

      {/* 3. Operational Summary Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-gradient-to-br from-slate-50/50 to-transparent bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{card.label}</div>
            <div className={`text-2xl font-extrabold tracking-tight mt-1 ${card.text || "text-slate-900"}`}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* 4. Functional Rule Notification Ribbon */}
      <div className="bg-gradient-to-r from-pink-50 to-orange-50/30 border border-pink-100/60 rounded-xl p-4 text-xs text-slate-600 font-medium leading-relaxed">
        <span className="font-bold text-pink-700 tracking-wide uppercase mr-1">Automatic update rule:</span>
        A valid signed gateway or virtual-account webhook creates the payment transaction, allocates it to the selected charges, changes the link to PAID/PARTIALLY PAID, marks charges as paid, generates the receipt, and adds the bank settlement to the monitoring queue. Staff do not manually mark gateway payments as paid.
      </div>

      {/* 5. Flow Distribution Table Area */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942] uppercase tracking-wider">Where payment is required in the LAP flow</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Only charges applicable under approved product policy and disclosed in the KFS/charge schedule are collected.</p>
          </div>
          <button className="border border-pink-200 text-pink-600 hover:bg-pink-50 font-bold text-xs px-4 py-2 rounded-xl transition-all whitespace-nowrap">
            Open Charge Master
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 pl-6 w-[8%]">Sequence</th>
                <th className="p-4 w-[17%]">Stage</th>
                <th className="p-4 w-[25%]">Charges</th>
                <th className="p-4 w-[15%]">Owner</th>
                <th className="p-4 w-[20%]">System Gate</th>
                <th className="p-4 pr-6 w-[15%]">Preferred Collection</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-600 divide-y divide-slate-100/70">
              {lapFlowData.map((row) => (
                <tr key={row.seq} className="hover:bg-slate-50/20 transition-colors">
                  <td className="p-4 pl-6 text-slate-400 font-bold">{row.seq}</td>
                  <td className="p-4 font-bold text-slate-800">{row.stage}</td>
                  <td className="p-4 whitespace-pre-line text-slate-600 leading-relaxed font-medium">{row.charges}</td>
                  <td className="p-4 text-slate-500 font-semibold">{row.owner}</td>
                  <td className="p-4 text-slate-400 font-medium leading-relaxed">{row.gate}</td>
                  <td className="p-4 pr-6 text-slate-500 font-semibold">{row.preCollection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Active Demand Links Section Component */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">Customer payment links and demands</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Each demand has item-level allocation, expiry, delivery evidence, payer activity and current outstanding amount.</p>
          </div>
          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">0 active</span>
        </div>
        <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50/10 border-b border-slate-50">
          No payment demand exists. Create an approved payment link to begin collection.
        </div>
      </div>

      {/* 7. Transactions Ledger Component */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">All customer payment transactions</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Gateway, UPI, net-banking, card and virtual-account collections with immutable provider references.</p>
          </div>
          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">0 exceptions / unsettled</span>
        </div>
        <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50/10 border-b border-slate-50">
          No customer payment transaction recorded.
        </div>
      </div>

      {/* 8. Bottom Information Split Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
        
        {/* REFUND QUEUE */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">Refund, reversal and chargeback queue</h3>
            <p className="text-[10px] text-slate-400 font-medium">Maker creates; independent checker approves and the system posts the reversal.</p>
            <div className="mt-4 border border-slate-100 rounded-xl p-6 text-center text-xs text-slate-400 font-medium bg-slate-50/30">
              No refund or reversal request.
            </div>
          </div>
        </div>

        {/* WEBHOOK EVENT LOG MONITOR */}
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">Webhook and payment event monitor</h3>
            <p className="text-[10px] text-slate-400 font-medium">Idempotent events, signature validation and processing result.</p>
          </div>
          <div className="flex items-start gap-4 pt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400 block mt-1 animate-pulse shrink-0"></span>
            <div>
              <div className="text-xs font-bold text-slate-800">No events</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Create and send a payment link.</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}