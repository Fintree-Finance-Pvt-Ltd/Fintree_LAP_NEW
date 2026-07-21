import { useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFilter,
  FaMapMarkerAlt,
  FaRedoAlt,
  FaSearch,
  FaTimes,
  FaUserTie,
} from "react-icons/fa";

const hubs = [
  "All Hubs",
  "Delhi Hub",
  "Mumbai Hub",
  "Bengaluru Hub",
  "Pune Hub",
];

const spokesByHub = {
  "All Hubs": [
    "All Spokes",
    "Noida Spoke",
    "Gurugram Spoke",
    "Ghaziabad Spoke",
    "Faridabad Spoke",
    "Thane Spoke",
  ],
  "Delhi Hub": [
    "All Spokes",
    "Noida Spoke",
    "Gurugram Spoke",
    "Ghaziabad Spoke",
    "Faridabad Spoke",
  ],
  "Mumbai Hub": [
    "All Spokes",
    "Thane Spoke",
    "Navi Mumbai Spoke",
  ],
  "Bengaluru Hub": [
    "All Spokes",
    "Whitefield Spoke",
    "Electronic City Spoke",
  ],
  "Pune Hub": [
    "All Spokes",
    "Hinjewadi Spoke",
    "Pimpri Spoke",
  ],
};

const reportCatalogue = [
  "Hub-wise Login Report",
  "Spoke-wise Lead Report",
  "RM-wise Sourcing Report",
  "BM-wise Performance Report",
  "Credit Pending Report",
  "Document Pending Report",
  "Geo Exception Report",
  "Legal Pending Report",
  "Valuation Pending Report",
  "Sanction Report",
  "Disbursement Report",
  "Stage TAT Report",
  "IMD Collection / Refund Report",
  "Partner MIS",
  "PAR / DPD / Roll Rate",
  "CIC / CKYC / CERSAI Exceptions",
];

const stagePipeline = [
  { stage: "Lead", count: 186 },
  { stage: "Field Verification", count: 132 },
  { stage: "BM Review", count: 94 },
  { stage: "CM Screening", count: 82 },
  { stage: "Credit", count: 54 },
  { stage: "Legal & Valuation", count: 31 },
  { stage: "Sanction", count: 22 },
  { stage: "Documentation", count: 16 },
  { stage: "Disbursement", count: 11 },
];

const caseData = [
  {
    leadId: "FTLIP-2026-0001",
    source: "Direct",
    applicant: "Aarav Sharma",
    profile: "Self-employed",
    mobile: "9876543210",
    pan: "ABCDE1234F",
    amount: 6500000,
    amountDisplay: "₹65,00,000",
    property: "Commercial Shop",
    city: "Noida",
    stage: "Lead",
    status: "New",
    hub: "Delhi Hub",
    spoke: "Noida Spoke",
  },
  {
    leadId: "FTLIP-2026-0002",
    source: "DSA - NorthStar",
    applicant: "Meera Iyer",
    profile: "Salaried",
    mobile: "9811122233",
    pan: "BDEPI7612K",
    amount: 8000000,
    amountDisplay: "₹80,00,000",
    property: "Residential Flat",
    city: "Gurugram",
    stage: "BM Review",
    status: "Submitted to BM",
    hub: "Delhi Hub",
    spoke: "Gurugram Spoke",
  },
  {
    leadId: "FTLIP-2026-0003",
    source: "Partner - CapitalBridge",
    applicant: "Rajesh Traders",
    profile: "Partnership Firm",
    mobile: "9899001122",
    pan: "AAJFR9182Q",
    amount: 12000000,
    amountDisplay: "₹1,20,00,000",
    property: "Industrial Property",
    city: "New Delhi",
    stage: "Credit",
    status: "Credit Underwriting",
    hub: "Delhi Hub",
    spoke: "Noida Spoke",
  },
  {
    leadId: "FTLIP-2026-0004",
    source: "Direct",
    applicant: "Neha Kapoor",
    profile: "Self-employed Professional",
    mobile: "9820019283",
    pan: "CPAPK8201L",
    amount: 9000000,
    amountDisplay: "₹90,00,000",
    property: "Residential House",
    city: "Ghaziabad",
    stage: "Legal & Valuation",
    status: "Legal & Valuation",
    hub: "Delhi Hub",
    spoke: "Ghaziabad Spoke",
  },
  {
    leadId: "FTLIP-2026-0005",
    source: "DSA - FinServe",
    applicant: "Siddharth Jain",
    profile: "Business Owner",
    mobile: "9971002299",
    pan: "DACPJ6602M",
    amount: 15000000,
    amountDisplay: "₹1,50,00,000",
    property: "Commercial Building",
    city: "Jaipur",
    stage: "Documentation",
    status: "Documentation Pending",
    hub: "Delhi Hub",
    spoke: "Gurugram Spoke",
  },
  {
    leadId: "FTLIP-2026-0006",
    source: "Direct",
    applicant: "Prakash Verma",
    profile: "Salaried",
    mobile: "9818884455",
    pan: "FVEPV4421A",
    amount: 7200000,
    amountDisplay: "₹72,00,000",
    property: "Residential Flat",
    city: "Faridabad",
    stage: "Disbursement",
    status: "Ready for Disbursement",
    hub: "Delhi Hub",
    spoke: "Faridabad Spoke",
  },
  {
    leadId: "FTLIP-2026-0007",
    source: "Partner - UrbanLoans",
    applicant: "Ananya Desai",
    profile: "Salaried",
    mobile: "9988776655",
    pan: "BQLPD4498H",
    amount: 5600000,
    amountDisplay: "₹56,00,000",
    property: "Residential Apartment",
    city: "Thane",
    stage: "Sanction",
    status: "Sanctioned",
    hub: "Mumbai Hub",
    spoke: "Thane Spoke",
  },
  {
    leadId: "FTLIP-2026-0008",
    source: "Direct",
    applicant: "Rohan Enterprises",
    profile: "Proprietorship",
    mobile: "9870012299",
    pan: "AFGPR4421J",
    amount: 10400000,
    amountDisplay: "₹1,04,00,000",
    property: "Warehouse",
    city: "Navi Mumbai",
    stage: "CM Screening",
    status: "Screening Pending",
    hub: "Mumbai Hub",
    spoke: "Navi Mumbai Spoke",
  },
];

const metricStyles = [
  {
    label: "LEADS MTD",
    value: "186",
    border: "border-indigo-200",
    valueColor: "text-indigo-600",
    topBar: "bg-indigo-500",
    circle: "bg-indigo-500/10",
  },
  {
    label: "LOGINS MTD",
    value: "92",
    border: "border-teal-200",
    valueColor: "text-teal-600",
    topBar: "bg-teal-500",
    circle: "bg-teal-500/10",
  },
  {
    label: "SANCTIONS MTD",
    value: "₹12.6 Cr",
    border: "border-pink-200",
    valueColor: "text-pink-600",
    topBar: "bg-pink-500",
    circle: "bg-pink-500/10",
  },
  {
    label: "DISBURSEMENT MTD",
    value: "₹8.4 Cr",
    border: "border-orange-200",
    valueColor: "text-orange-500",
    topBar: "bg-orange-500",
    circle: "bg-orange-500/10",
  },
];

const statusClasses = {
  New: "border-blue-200 bg-blue-50 text-blue-700",
  "Submitted to BM":
    "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Credit Underwriting":
    "border-amber-200 bg-amber-50 text-amber-700",
  "Legal & Valuation":
    "border-amber-200 bg-amber-50 text-amber-700",
  "Documentation Pending":
    "border-orange-200 bg-orange-50 text-orange-700",
  "Ready for Disbursement":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  Sanctioned:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Screening Pending":
    "border-purple-200 bg-purple-50 text-purple-700",
};

function formatDateForInput(date) {
  return date.toISOString().split("T")[0];
}

function convertRowsToCsv(rows) {
  const headers = [
    "Lead ID",
    "Applicant",
    "Profile",
    "Mobile",
    "PAN",
    "Amount",
    "Property",
    "City",
    "Stage",
    "Status",
    "Hub",
    "Spoke",
    "Source",
  ];

  const values = rows.map((item) => [
    item.leadId,
    item.applicant,
    item.profile,
    item.mobile,
    item.pan,
    item.amountDisplay,
    item.property,
    item.city,
    item.stage,
    item.status,
    item.hub,
    item.spoke,
    item.source,
  ]);

  return [headers, ...values]
    .map((row) =>
      row
        .map((value) => {
          const safeValue = String(value ?? "").replaceAll('"', '""');
          return `"${safeValue}"`;
        })
        .join(","),
    )
    .join("\n");
}

export default function MISReports() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [selectedHub, setSelectedHub] = useState("All Hubs");
  const [selectedSpoke, setSelectedSpoke] = useState("All Spokes");
  const [fromDate, setFromDate] = useState(formatDateForInput(monthStart));
  const [toDate, setToDate] = useState(formatDateForInput(today));
  const [searchText, setSearchText] = useState("");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [activeReport, setActiveReport] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    hub: "All Hubs",
    spoke: "All Spokes",
  });

  const availableSpokes =
    spokesByHub[selectedHub] || spokesByHub["All Hubs"];

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return caseData.filter((item) => {
      const hubMatch =
        appliedFilters.hub === "All Hubs" ||
        item.hub === appliedFilters.hub;

      const spokeMatch =
        appliedFilters.spoke === "All Spokes" ||
        item.spoke === appliedFilters.spoke;

      const stageMatch =
        selectedStage === "All Stages" ||
        item.stage === selectedStage;

      const searchMatch =
        !normalizedSearch ||
        [
          item.leadId,
          item.applicant,
          item.mobile,
          item.pan,
          item.property,
          item.city,
          item.stage,
          item.status,
        ].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );

      return hubMatch && spokeMatch && stageMatch && searchMatch;
    });
  }, [appliedFilters, searchText, selectedStage]);

  const resetFilters = () => {
    setSelectedHub("All Hubs");
    setSelectedSpoke("All Spokes");
    setFromDate(formatDateForInput(monthStart));
    setToDate(formatDateForInput(today));
    setSearchText("");
    setSelectedStage("All Stages");
    setActiveReport("");
    setAppliedFilters({
      hub: "All Hubs",
      spoke: "All Spokes",
    });
  };

  const applyFilters = () => {
    setAppliedFilters({
      hub: selectedHub,
      spoke: selectedSpoke,
    });
  };

  const exportCsv = () => {
    const csvContent = convertRowsToCsv(filteredCases);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = `lap-mis-${fromDate}-to-${toDate}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[30px] bg-gradient-to-r from-[#3d6dde] via-[#4c4dc4] to-[#25b4b9] px-6 py-8 text-white shadow-[0_24px_65px_rgba(67,79,190,0.22)] sm:px-8 sm:py-10 lg:flex lg:min-h-[195px] lg:items-center lg:justify-between lg:gap-10">
          <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/35" />
          <div className="absolute left-[23%] top-0 -z-10 h-full w-64 skew-x-[-14deg] bg-indigo-400/35" />
          <div className="absolute -bottom-44 -right-16 -z-10 h-[390px] w-[390px] rounded-full border-[70px] border-white/5" />

          <div className="relative max-w-4xl">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-2xl backdrop-blur">
              ✦
            </span>

            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
              MIS, Analytics & Regulatory Reports
            </h1>

            <p className="mt-3 text-sm font-medium text-blue-50/90 sm:text-base">
              Hub, spoke, RM, product, stage, portfolio and compliance
              reporting.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 lg:flex-none"
            >
              <FaRedoAlt size={13} />
              Reset Filters
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 text-sm font-black text-white shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25 lg:flex-none"
            >
              <FaDownload size={14} />
              Export CSV
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-[28px] border border-indigo-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(160px,0.75fr)_minmax(200px,1fr)_minmax(190px,1fr)_minmax(190px,1fr)_auto]">
            <label className="relative flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <FaBuilding className="mr-3 shrink-0 text-slate-400" size={14} />

              <select
                value={selectedHub}
                onChange={(event) => {
                  setSelectedHub(event.target.value);
                  setSelectedSpoke("All Spokes");
                }}
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 text-sm font-semibold text-[#334a70] outline-none"
              >
                {hubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-4 text-slate-500">
                ⌄
              </span>
            </label>

            <label className="relative flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <FaMapMarkerAlt
                className="mr-3 shrink-0 text-slate-400"
                size={14}
              />

              <select
                value={selectedSpoke}
                onChange={(event) => setSelectedSpoke(event.target.value)}
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 text-sm font-semibold text-[#334a70] outline-none"
              >
                {availableSpokes.map((spoke) => (
                  <option key={spoke} value={spoke}>
                    {spoke}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-4 text-slate-500">
                ⌄
              </span>
            </label>

            <label className="relative flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                aria-label="MIS start date"
                className="w-full bg-transparent text-sm font-semibold text-[#334a70] outline-none"
              />
            </label>

            <label className="relative flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(event) => setToDate(event.target.value)}
                aria-label="MIS end date"
                className="w-full bg-transparent text-sm font-semibold text-[#334a70] outline-none"
              />
            </label>

            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-7 text-sm font-black text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <FaFilter size={13} />
              Apply
            </button>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricStyles.map((metric) => (
            <article
              key={metric.label}
              className={`relative min-h-[185px] overflow-hidden rounded-[28px] border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${metric.border}`}
            >
              <span
                className={`absolute left-0 top-0 h-1.5 w-28 rounded-br-full ${metric.topBar}`}
              />

              <span
                className={`absolute -right-10 -top-12 h-36 w-36 rounded-full ${metric.circle}`}
              />

              <span
                className={`absolute -right-4 -top-5 h-24 w-24 rounded-full ${metric.circle}`}
              />

              <p className="relative text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                {metric.label}
              </p>

              <strong
                className={`relative mt-7 block text-4xl font-black tracking-tight ${metric.valueColor}`}
              >
                {metric.value}
              </strong>
            </article>
          ))}
        </section>

        {/* Pipeline and Catalogue */}
        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-[28px] border border-indigo-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#223d69]">
                Stage-wise pipeline
              </h2>

              <div className="mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
            </div>

            <div className="mt-6">
              {stagePipeline.map((item) => (
                <button
                  type="button"
                  key={item.stage}
                  onClick={() => setSelectedStage(item.stage)}
                  className={`flex min-h-14 w-full items-center justify-between gap-5 border-b border-slate-100 px-3 text-left transition last:border-b-0 ${
                    selectedStage === item.stage
                      ? "rounded-xl bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-medium">{item.stage}</span>

                  <strong className="text-sm font-black text-[#203b67]">
                    {item.count}
                  </strong>
                </button>
              ))}
            </div>

            {selectedStage !== "All Stages" && (
              <button
                type="button"
                onClick={() => setSelectedStage("All Stages")}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-200"
              >
                <FaTimes size={11} />
                Clear stage filter
              </button>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#223d69]">
                Required report catalogue
              </h2>

              <div className="mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {reportCatalogue.map((report) => (
                <button
                  type="button"
                  key={report}
                  onClick={() => setActiveReport(report)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                    activeReport === report
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "border-indigo-200 bg-indigo-50/70 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-100"
                  }`}
                >
                  {report}
                </button>
              ))}
            </div>

            {activeReport && (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                    <FaChartBar size={16} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Selected report
                    </p>

                    <strong className="mt-1 block truncate text-xs font-extrabold text-indigo-700">
                      {activeReport}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                >
                  Generate
                  <FaArrowRight size={10} />
                </button>
              </div>
            )}
          </article>
        </section>

        {/* Case-level MIS */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 px-5 pb-5 pt-6 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#223d69] sm:text-2xl">
                Case-level MIS
              </h2>

              <div className="mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 lg:w-80">
                <FaSearch size={13} />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search lead, applicant, PAN or stage"
                  className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="relative flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 sm:w-52">
                <FaFilter size={12} />

                <select
                  value={selectedStage}
                  onChange={(event) => setSelectedStage(event.target.value)}
                  className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="All Stages">All Stages</option>

                  {stagePipeline.map((item) => (
                    <option key={item.stage} value={item.stage}>
                      {item.stage}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-3">⌄</span>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 px-4 pb-5 sm:px-7">
            <table className="mt-5 w-full min-w-[1200px] overflow-hidden rounded-2xl border border-slate-200 text-left">
              <thead>
                <tr className="bg-indigo-50">
                  {[
                    "Lead ID",
                    "Applicant",
                    "Mobile / PAN",
                    "Amount",
                    "Property",
                    "Stage",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-indigo-200 px-5 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-indigo-800"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((item, index) => (
                  <tr
                    key={item.leadId}
                    className={`border-b border-slate-100 transition last:border-b-0 hover:bg-indigo-50/40 ${
                      index % 2 === 1 ? "bg-slate-50/70" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-5 align-top">
                      <strong className="block max-w-32 text-xs font-black leading-5 text-[#30476d]">
                        {item.leadId}
                      </strong>

                      <span className="mt-1 block max-w-36 text-[10px] leading-5 text-slate-500">
                        {item.source}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <strong className="block text-xs font-semibold text-[#344a70]">
                        {item.applicant}
                      </strong>

                      <span className="mt-1 block text-[10px] text-slate-500">
                        {item.profile}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <span className="block text-xs font-medium text-[#344a70]">
                        {item.mobile}
                      </span>

                      <span className="mt-1 block text-[10px] text-slate-500">
                        {item.pan}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <strong className="whitespace-nowrap text-xs font-bold text-[#344a70]">
                        {item.amountDisplay}
                      </strong>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <span className="block max-w-36 text-xs font-medium leading-5 text-[#344a70]">
                        {item.property}
                      </span>

                      <span className="mt-1 block text-[10px] text-slate-500">
                        {item.city}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <span className="block max-w-36 text-xs font-medium leading-5 text-[#344a70]">
                        {item.stage}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <span
                        className={`inline-flex max-w-44 rounded-full border px-3 py-1.5 text-[10px] font-black leading-4 ${statusClasses[item.status] || "border-slate-200 bg-slate-50 text-slate-600"}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#344a70] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <FaEye size={12} />
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCases.length === 0 && (
              <div className="grid min-h-56 place-content-center gap-3 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <FaSearch size={18} />
                </span>

                <strong className="text-sm font-black text-slate-700">
                  No MIS records found
                </strong>

                <p className="text-xs text-slate-400">
                  Change the selected filters and try again.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <span className="text-xs font-medium text-slate-500">
              Showing {filteredCases.length} of {caseData.length} records
            </span>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
                <FaCheckCircle size={11} />
                Report data ready
              </span>

              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#263f74] px-4 text-xs font-black text-white transition hover:bg-[#1a315e]"
              >
                <FaDownload size={11} />
                Export Results
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}