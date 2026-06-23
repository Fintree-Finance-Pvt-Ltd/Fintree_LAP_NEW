import { useState } from "react";
import { FaCamera, FaCalendarAlt } from "react-icons/fa";

export default function FieldVisits() {
  const [activeTab, setActiveTab] = useState("Customer / Residence");

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      
      {/* 1. Dynamic Page Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Field Visits & Verification</h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
              FTLIP-2026-0001 • Residence, business and property visit evidence.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
              Save Visit Draft
            </button>
            <button className="rounded-xl bg-white text-blue-700 font-extrabold text-xs px-5 py-2.5 shadow-md hover:bg-blue-50 transition-all">
              Complete Visits
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Sub-Tabs Section */}
      <div className="flex flex-wrap items-center gap-2">
        {["Customer / Residence", "Business / Office", "Property", "Visit History"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/15"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Triple Column Form Data Collection Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* COLUMN 1: CUSTOMER / RESIDENCE VISIT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] border-b border-slate-100 pb-2">Customer / Residence Visit</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Visit Date</label>
            <div className="relative">
              <input type="text" defaultValue="19-06-2026" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
              <FaCalendarAlt className="absolute right-4 top-3.5 text-slate-400 text-xs" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Person Met</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Customer</option>
              <option>Spouse</option>
              <option>Co-Applicant</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Residence Type</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Owned</option>
              <option>Rented</option>
              <option>Ancestral</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Visit Status</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Positive</option>
              <option>Negative</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Residence Remarks</label>
            <textarea rows={3} defaultValue="Customer residing at the stated address; neighbourhood feedback satisfactory." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none resize-none" />
          </div>

          {/* Geo-tagged Image Upload Container Box */}
          <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer hover:bg-blue-50/60 transition-all group">
            <FaCamera className="mx-auto text-slate-400 group-hover:text-blue-500 mb-2" size={16} />
            <div className="text-xs font-bold text-slate-700">Upload geo-tagged residence photos</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Timestamp, latitude, longitude and device ID retained</div>
          </div>
        </div>

        {/* COLUMN 2: BUSINESS / OFFICE VISIT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] border-b border-slate-100 pb-2">Business / Office Visit</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Business Name</label>
            <input type="text" defaultValue="Aarav Engineering Works" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Business Vintage</label>
            <input type="text" defaultValue="8" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Business Activity</label>
            <input type="text" defaultValue="Manufacturing / Trading / Services" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Employee Count</label>
            <input type="text" defaultValue="12" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Stock / Office Setup</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Available</option>
              <option>Scarce</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Visit Status</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Positive</option>
              <option>Negative</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Business Remarks</label>
            <textarea rows={3} defaultValue="Operations observed and business activity consistent with declared profile." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none resize-none" />
          </div>

          {/* Dropzone File Box 2 */}
          <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer hover:bg-blue-50/60 transition-all group">
            <FaCamera className="mx-auto text-slate-400 group-hover:text-blue-500 mb-2" size={16} />
            <div className="text-xs font-bold text-slate-700">Upload business frontage, stock and office photos</div>
          </div>
        </div>

        {/* COLUMN 3: PROPERTY VISIT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] border-b border-slate-100 pb-2">Property Visit</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Ownership</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Self</option>
              <option>Joint</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Occupancy</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Self-occupied</option>
              <option>Tenanted</option>
              <option>Vacant</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Property Usage</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Commercial</option>
              <option>Residential</option>
              <option>Mixed Use</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Approx Area (sq. ft.)</label>
            <input type="text" defaultValue="1850" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Condition</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Good</option>
              <option>Average</option>
              <option>Deplorable</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Nearby Landmark</label>
            <input type="text" defaultValue="Near Metro / Main Market" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Visit Status</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none">
              <option>Positive</option>
              <option>Negative</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Property Remarks</label>
            <textarea rows={3} defaultValue="Property physically identified and access available." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 outline-none resize-none" />
          </div>

          {/* Dropzone File Box 3 */}
          <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer hover:bg-blue-50/60 transition-all group">
            <FaCamera className="mx-auto text-slate-400 group-hover:text-blue-500 mb-2" size={16} />
            <div className="text-xs font-bold text-slate-700">Upload frontage, interiors, boundaries and landmark photos</div>
          </div>
        </div>

      </div>

      {/* 4. Bottom System Audit Verification Field Control Checklist Segment */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Field control checklist</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Customer identity matched", desc: "Captured in visit audit trail" },
            { label: "Visit within assigned route", desc: "Captured in visit audit trail" },
            { label: "Photos contain EXIF/time evidence", desc: "Captured in visit audit trail" },
            { label: "No image duplication detected", desc: "Captured in visit audit trail" },
            { label: "Address compared with application", desc: "Captured in visit audit trail" },
            { label: "Negative observations disclosed", desc: "Captured in visit audit trail" },
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}