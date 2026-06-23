import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function CreateLead() {
  // Controlled form state initialized with values from image metrics
  const [formData, setFormData] = useState({
    sourceType: "Direct",
    hub: "Delhi Hub",
    spoke: "Noida Spoke",
    customerName: "Aarav Sharma",
    mobileNumber: "9876543210",
    emailId: "aarav@example.com",
    panNumber: "ABCDE1234F",
    aadhaarMasked: "XXXX XXXX 3481",
    occupation: "Self-employed",
    businessName: "Aarav Engineering Works",
    businessVintage: "8",
    monthlyIncome: "185000",
    monthlyObligations: "42000",
    requestedAmount: "6500000",
    loanPurpose: "Business expansion",
    requestedTenure: "120",
    propertyType: "Commercial Shop",
    propertyValue: "10500000",
    propertyAddress: "Sector 18, Noida, Uttar Pradesh 201301",
    city: "Noida",
    state: "Uttar Pradesh",
    pinCode: "201301",
    foir: "22.70%",
    indicativeLtv: "61.90%",
    ruleVersion: "LIP-POLICY-2026-06-v1",
    rmNotes: "Customer interested in LAP; initial eligibility discussed."
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen antialiased text-slate-800">
      
      {/* 1. Header Capture Workspace Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Lead & Application Capture</h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">FTLIP-2026-0001 • Capture applicant, loan and collateral details.</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
              Save Draft
            </button>
            <button className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 font-extrabold text-xs px-5 py-2.5 shadow-md hover:brightness-105 transition-all">
              Save & Start Field Verification
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Alignment Segment Step Status Track */}
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

      {/* 3. Master Capture Field Container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm space-y-10">
        
        {/* SECTION A: LEAD SOURCING */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Lead sourcing</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Source Type</label>
              <select name="sourceType" value={formData.sourceType} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all">
                <option>Direct</option>
                <option>DSA</option>
                <option>Connector</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hub</label>
              <input type="text" name="hub" value={formData.hub} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Spoke</label>
              <input type="text" name="spoke" value={formData.spoke} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        {/* SECTION B: PRIMARY APPLICANT */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Primary applicant</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Customer / Entity Name *</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Mobile Number *</label>
              <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Email ID</label>
              <input type="email" name="emailId" value={formData.emailId} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">PAN Number *</label>
              <input type="text" name="panNumber" value={formData.panNumber} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Aadhaar / OVD (masked)</label>
              <input type="text" name="aadhaarMasked" value={formData.aadhaarMasked} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Occupation / Constitution</label>
              <select name="occupation" value={formData.occupation} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all">
                <option>Self-employed</option>
                <option>Salaried</option>
                <option>Proprietorship</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Employer / Business Name</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Employment / Business Vintage (years)</label>
              <input type="number" name="businessVintage" value={formData.businessVintage} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Verified Monthly Income</label>
              <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Existing Monthly Obligations</label>
              <input type="number" name="monthlyObligations" value={formData.monthlyObligations} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        {/* SECTION C: LOAN REQUIREMENT */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Loan requirement</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Requested Loan Amount *</label>
              <input type="number" name="requestedAmount" value={formData.requestedAmount} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Loan Purpose</label>
              <select name="loanPurpose" value={formData.loanPurpose} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all">
                <option>Business expansion</option>
                <option>Asset Purchase</option>
                <option>Working Capital</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Requested Tenure (months)</label>
              <input type="number" name="requestedTenure" value={formData.requestedTenure} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        {/* SECTION D: COLLATERAL PROPERTY */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Collateral property</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Property Type *</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required>
                <option>Commercial Shop</option>
                <option>Residential Flat</option>
                <option>Industrial Property</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Approximate Property Value *</label>
              <input type="number" name="propertyValue" value={formData.propertyValue} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Property Address *</label>
              <input type="text" name="propertyAddress" value={formData.propertyAddress} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">State</label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">PIN Code</label>
              <input type="text" name="pinCode" value={formData.pinCode} onChange={handleInputChange} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        {/* SECTION E: INDICATIVE ELIGIBILITY */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Indicative eligibility</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">FOIR</label>
              <input type="text" name="foir" value={formData.foir} readOnly className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold bg-slate-50 text-slate-600 outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Indicative LTV</label>
              <input type="text" name="indicativeLtv" value={formData.indicativeLtv} readOnly className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold bg-slate-50 text-slate-600 outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Rule Version</label>
              <input type="text" name="ruleVersion" value={formData.ruleVersion} readOnly className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold bg-slate-50 text-slate-600 outline-none" />
            </div>
          </div>
          
          {/* RM Notes Sub-Field */}
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">RM Notes</label>
            <textarea name="rmNotes" value={formData.rmNotes} onChange={handleInputChange} rows={3} className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none" />
          </div>
        </div>

      </div>

      {/* 4. Footer System Production Compliance Control Notification Guardrail */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/40 p-4 shadow-sm flex items-center justify-between overflow-hidden">
        <div className="text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold text-amber-900 uppercase tracking-wide mr-1.5">Production control:</span> 
          full Aadhaar must not be displayed or logged. Capture purpose-specific consent before PAN, KYC, bureau, AA, DigiLocker, property verification and marketing data use.
        </div>
        <div className="hidden lg:block w-24 h-12 bg-blue-600/10 rounded-l-full transform translate-x-6 shrink-0"></div>
      </div>

    </div>
  );
}