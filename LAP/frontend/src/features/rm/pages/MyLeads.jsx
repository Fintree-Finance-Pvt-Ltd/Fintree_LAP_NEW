import { useState } from "react";
import { FaPlus, FaSearch, FaChevronDown } from "react-icons/fa";

export default function MyLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("All Stages");

  const leadsData = [
    {
      id: "FTLIP-2026-0001",
      source: "Direct",
      applicant: "Aarav Sharma",
      type: "Self-employed",
      mobile: "9876543210",
      pan: "ABCDE1234F",
      amount: "₹65,000,000",
      property: "Commercial Shop",
      location: "Noida",
      stage: "Lead",
      status: "New",
      statusStyle: "bg-blue-50 text-blue-600 border border-blue-200"
    },
    {
      id: "FTLIP-2026-0002",
      source: "DSA - NorthStar",
      applicant: "Meera Iyer",
      type: "Salaried",
      mobile: "9811122233",
      pan: "BDEPI7612K",
      amount: "₹80,000,000",
      property: "Residential Flat",
      location: "Gurugram",
      stage: "BM Review",
      status: "Submitted to BM",
      statusStyle: "bg-indigo-50 text-indigo-600 border border-indigo-200"
    },
    {
      id: "FTLIP-2026-0003",
      source: "Partner - CapitalBridge",
      applicant: "Rajesh Traders",
      type: "Partnership Firm",
      mobile: "9899001122",
      pan: "AAJFR9182Q",
      amount: "₹1,20,000,000",
      property: "Industrial Property",
      location: "New Delhi",
      stage: "Credit",
      status: "Credit Underwriting",
      statusStyle: "bg-amber-50 text-amber-700 border border-amber-200"
    },
    {
      id: "FTLIP-2026-0004",
      source: "Direct",
      applicant: "Neha Kapoor",
      type: "Self-employed Professional",
      mobile: "9820019283",
      pan: "CPAPK8201L",
      amount: "₹90,000,000",
      property: "Residential House",
      location: "Ghaziabad",
      stage: "Legal & Valuation",
      status: "Legal & Valuation",
      statusStyle: "bg-orange-50 text-orange-700 border border-orange-200"
    },
    {
      id: "FTLIP-2026-0005",
      source: "DSA - FinServe",
      applicant: "Siddharth Jain",
      type: "Business Owner",
      mobile: "9971002299",
      pan: "DACPJ6602M",
      amount: "₹1,50,000,000",
      property: "Commercial Building",
      location: "Jaipur",
      stage: "Documentation",
      status: "Documentation Pending",
      statusStyle: "bg-yellow-50 text-yellow-700 border border-yellow-200"
    },
    {
      id: "FTLIP-2026-0006",
      source: "Existing Customer",
      applicant: "Prakash Verma",
      type: "Salaried",
      mobile: "9818884455",
      pan: "EVSPV3409N",
      amount: "₹72,000,000",
      property: "Residential Flat",
      location: "Noida",
      stage: "Active Loan",
      status: "Active",
      statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-200"
    },
    {
      id: "FTLIP-2026-0007",
      source: "Connector - Dinesh",
      applicant: "Sunita Enterprises",
      type: "Proprietorship",
      mobile: "9867003344",
      pan: "AAPFS7732R",
      amount: "₹60,000,000",
      property: "Commercial Shop",
      location: "New Delhi",
      stage: "Collections",
      status: "37 DPD",
      statusStyle: "bg-rose-50 text-rose-600 border border-rose-200"
    }
  ];

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      
      {/* 1. Dynamic Top Banner matching image_5781b5.png */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Application Pipeline</h2>
            <p className="mt-1 text-sm text-blue-100/80 font-medium">Search and open cases across the LAP lifecycle.</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white/20 text-white border border-white/20 px-5 py-2.5 text-sm font-bold shadow-md hover:bg-white/30 backdrop-blur-md transition-all self-start sm:self-center">
            <FaPlus className="text-xs" /> Create New Lead
          </button>
        </div>
      </div>

      {/* 2. Filter Bar Filter Controls Wrapper */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-wrap items-center gap-4">
        {/* Universal Search Field */}
        <div className="relative flex-1 min-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search case, applicant, PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm pl-11 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Stage Selection Dropdown */}
        <div className="relative min-w-[160px]">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm px-4 py-2.5 rounded-xl appearance-none outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option>All Stages</option>
            <option>Lead</option>
            <option>BM Review</option>
            <option>Credit</option>
            <option>Documentation</option>
          </select>
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
            <FaChevronDown size={11} />
          </span>
        </div>

        {/* Export Data Button */}
        <button className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all">
          Export CSV
        </button>
      </div>

      {/* 3. Production Pipeline Pipeline Leads Table Grid */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 pl-6">Lead ID</th>
                <th className="p-4">Applicant</th>
                <th className="p-4">Mobile / PAN</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Property</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {leadsData.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Lead ID Segment */}
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-900">{lead.id}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{lead.source}</div>
                  </td>

                  {/* Applicant Details Segment */}
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{lead.applicant}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{lead.type}</div>
                  </td>

                  {/* Contact Indicators Segment */}
                  <td className="p-4">
                    <div className="text-slate-700 font-medium">{lead.mobile}</div>
                    <div className="text-[11px] text-slate-400 font-mono tracking-wider mt-0.5">{lead.pan}</div>
                  </td>

                  {/* Valuations / Capital Requested Segment */}
                  <td className="p-4 font-bold text-slate-900">
                    {lead.amount}
                  </td>

                  {/* Asset Profile Segment */}
                  <td className="p-4">
                    <div className="font-medium text-slate-700">{lead.property}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{lead.location}</div>
                  </td>

                  {/* Milestone Track Segment */}
                  <td className="p-4 font-medium text-slate-600">
                    {lead.stage}
                  </td>

                  {/* Workflow Tag Pill */}
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${lead.statusStyle}`}>
                      {lead.status}
                    </span>
                  </td>

                  {/* Item Actions */}
                  <td className="p-4 pr-6 text-center">
                    <button className="border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-[#0f2942] hover:text-blue-600 font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow-sm">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}