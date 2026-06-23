import { useState } from "react";
import { FaShieldAlt, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

export default function KycDocuments() {
  const metrics = [
    { title: "VERIFIED", value: 5, color: "from-blue-500/10 to-indigo-500/5", textColor: "text-blue-600" },
    { title: "TOTAL REQUIRED", value: 16, color: "from-emerald-500/10 to-teal-500/5", textColor: "text-emerald-600" },
    { title: "COMPLETION", value: "31%", color: "from-rose-500/10 to-pink-500/5", textColor: "text-rose-600" },
    { title: "KYC STATUS", value: "Verified", color: "from-amber-500/10 to-orange-500/5", textColor: "text-amber-600" },
  ];

  const consentItems = [
    { label: "Mobile OTP and application consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "Credit bureau consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "CKYC retrieval consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "DigiLocker / document consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "Account Aggregator / banking consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "Property verification consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "Data sharing with NBFC/vendors", sub: "Version, timestamp, IP/device and evidence hash captured" },
    { label: "eSign and mandate consent", sub: "Version, timestamp, IP/device and evidence hash captured" },
  ];

  const documents = [
    { name: "PAN Card", format: "PDF/JPG/PNG · max 10 MB", cat: "Applicant/Income", status: "Verified", statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-200", ver: "v1", action: "Preview" },
    { name: "Masked Aadhaar / OVD", format: "PDF/JPG/PNG · max 10 MB", cat: "Applicant/Income", status: "Verified", statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-200", ver: "v1", action: "Preview" },
    { name: "Photograph", format: "PDF/JPG/PNG · max 10 MB", cat: "Applicant/Income", status: "Verified", statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-200", ver: "v1", action: "Preview" },
    { name: "Business Proof", format: "PDF/JPG/PNG · max 10 MB", cat: "Applicant/Income", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
    { name: "Existing Loan Statement", format: "PDF/JPG/PNG · max 10 MB", cat: "Applicant/Income", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
    { name: "Sale Deed", format: "PDF/JPG/PNG · max 10 MB", cat: "Property", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
    { name: "Title Chain Documents", format: "PDF/JPG/PNG · max 10 MB", cat: "Property", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
    { name: "Property Tax Receipt", format: "PDF/JPG/PNG · max 10 MB", cat: "Property", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
    { name: "Approved Plan / OC", format: "PDF/JPG/PNG · max 10 MB", cat: "Property", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
    { name: "Legal & Valuation Reports", format: "PDF/JPG/PNG · max 10 MB", cat: "Property", status: "Pending", statusStyle: "bg-rose-50 text-rose-600 border border-rose-200", ver: "v0", action: "Upload" },
  ];

  const kycResults = [
    { label: "PAN validation", val: "Verified", isBadge: true, style: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    { label: "CKYC search", val: "Record found", isBadge: true, style: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    { label: "Name match", val: "96%", isBadge: false },
    { label: "DOB match", val: "Matched", isBadge: true, style: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    { label: "Face / liveness", val: "Passed", isBadge: true, style: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    { label: "PEP / sanctions", val: "No match", isBadge: true, style: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  ];

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      
      {/* 1. Page Header Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">KYC, Consent & Document Checklist</h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
              FTLIP-2026-0001 • Applicant, income, banking and property documents.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
              Bulk Upload
            </button>
            <button className="rounded-xl bg-white text-blue-700 font-extrabold text-xs px-5 py-2.5 shadow-md hover:bg-blue-50 transition-all">
              Save Checklist
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Analytics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} border border-white bg-white p-6 rounded-2xl shadow-sm`}>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{card.title}</div>
            <div className={`mt-2 text-3xl font-extrabold tracking-tight ${card.textColor}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 3. Consent Controls Grid Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">Consent controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consentItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
              <div>
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Complete Tabular Document Checklist */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">Document checklist</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 pl-6 w-[40%]">Document</th>
                <th className="p-4 w-[25%]">Category</th>
                <th className="p-4 w-[15%]">Status</th>
                <th className="p-4 w-[10%]">Version</th>
                <th className="p-4 pr-6 w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
              {documents.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-900">{doc.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{doc.format}</div>
                  </td>
                  <td className="p-4 text-slate-500 font-semibold">{doc.cat}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${doc.statusStyle}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{doc.ver}</td>
                  <td className="p-4 pr-6 text-center">
                    <button className={`font-bold text-xs px-4 py-1.5 rounded-lg border shadow-sm transition-all ${
                      doc.action === "Preview" 
                        ? "border-slate-200 text-[#0f2942] hover:bg-slate-50" 
                        : "border-blue-200 bg-blue-50/40 text-blue-600 hover:bg-blue-50"
                    }`}>
                      {doc.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Split Container Matrix (KYC Results & Security Notes) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
        
        {/* KYC Verification Results Block */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide">KYC results</h3>
          <div className="divide-y divide-slate-100 pt-1">
            {kycResults.map((res, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 text-xs">
                <span className="text-slate-400 font-semibold">{res.label}</span>
                {res.isBadge ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${res.style}`}>{res.val}</span>
                ) : (
                  <span className="font-bold text-slate-900">{res.val}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security / Vault Protocol Checklist Block */}
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] tracking-wide flex items-center gap-2">
            Document security
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-1">
            {[
              "Time-limited encrypted download links",
              "Role and purpose-based access",
              "Watermark on preview/download",
              "SHA-256 document hash and version history",
              "India-region document storage",
              "Malware and tamper checks before acceptance"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 block shrink-0"></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
}