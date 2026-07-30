import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaArrowRight,
  FaBuilding,
  FaChartBar,
  FaCheckCircle,
  FaDownload,
  FaEye,
  FaFilter,
  FaMapMarkerAlt,
  FaRedoAlt,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import { administrationApi } from "../../ADMIN/administrationApi.js";
import { applicationsApi } from "../applicationsApi.js";

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


const EMPTY_METRICS = {
  leadsMtd: 0,
  loginsMtd: 0,
  sanctionsMtd: {
    count: 0,
    amount: 0,
  },
  disbursementsMtd: {
    count: 0,
    amount: 0,
  },
};

function unwrapApiData(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiArray(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : [];
}

function formatCompactInr(value) {
  const amount = Number(value) || 0;

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1).replace(/\.0$/, "")} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, "")} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const defaultFromDate = useMemo(
    () => formatDateForInput(monthStart),
    [monthStart],
  );
  const defaultToDate = useMemo(
    () => formatDateForInput(today),
    [today],
  );

  const [hubs, setHubs] = useState([]);
  const [spokes, setSpokes] = useState([]);
  const [cases, setCases] = useState([]);
  const [stagePipeline, setStagePipeline] = useState([]);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });

  const [selectedHub, setSelectedHub] = useState("");
  const [selectedSpoke, setSelectedSpoke] = useState("");
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [searchText, setSearchText] = useState("");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [activeReport, setActiveReport] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    hubId: "",
    spokeId: "",
    fromDate: defaultFromDate,
    toDate: defaultToDate,
  });

  const [mastersLoading, setMastersLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [error, setError] = useState("");

  const availableSpokes = useMemo(() => {
    if (!selectedHub) {
      return spokes;
    }

    return spokes.filter(
      (spoke) => String(spoke.hubId) === String(selectedHub),
    );
  }, [selectedHub, spokes]);

  const metricStyles = useMemo(
    () => [
      {
        label: "LEADS MTD",
        value: String(metrics.leadsMtd ?? 0),
        border: "border-indigo-200",
        valueColor: "text-indigo-600",
        topBar: "bg-indigo-500",
        circle: "bg-indigo-500/10",
      },
      {
        label: "LOGINS MTD",
        value: String(metrics.loginsMtd ?? 0),
        border: "border-teal-200",
        valueColor: "text-teal-600",
        topBar: "bg-teal-500",
        circle: "bg-teal-500/10",
      },
      {
        label: "SANCTIONS MTD",
        value: formatCompactInr(metrics.sanctionsMtd?.amount),
        border: "border-pink-200",
        valueColor: "text-pink-600",
        topBar: "bg-pink-500",
        circle: "bg-pink-500/10",
      },
      {
        label: "DISBURSEMENT MTD",
        value: formatCompactInr(metrics.disbursementsMtd?.amount),
        border: "border-orange-200",
        valueColor: "text-orange-500",
        topBar: "bg-orange-500",
        circle: "bg-orange-500/10",
      },
    ],
    [metrics],
  );

  const loadMasters = useCallback(async () => {
    try {
      setMastersLoading(true);

      const [hubResponse, spokeResponse] = await Promise.all([
        administrationApi.getHubAdministration(),
        administrationApi.getSpokeAdministration(),
      ]);

      const hubRows = getApiArray(hubResponse)
        .map((hub) => ({
          id: Number(hub?.id),
          name: String(hub?.name || "").trim(),
        }))
        .filter((hub) => Number.isInteger(hub.id) && hub.id > 0 && hub.name);

      const spokeRows = getApiArray(spokeResponse)
        .map((spoke) => ({
          id: Number(spoke?.id),
          name: String(spoke?.name || "").trim(),
          hubId: Number(spoke?.hubId),
          hubName: String(spoke?.hubName || "").trim(),
        }))
        .filter(
          (spoke) =>
            Number.isInteger(spoke.id) &&
            spoke.id > 0 &&
            Number.isInteger(spoke.hubId) &&
            spoke.hubId > 0 &&
            spoke.name,
        );

      setHubs(hubRows);
      setSpokes(spokeRows);
    } catch (requestError) {
      console.error("Unable to load Hub and Spoke filters:", requestError);
      setHubs([]);
      setSpokes([]);
      setError(
        requestError?.message ||
          "Unable to load Hub and Spoke filter data.",
      );
    } finally {
      setMastersLoading(false);
    }
  }, []);

  const loadMisReport = useCallback(async (params) => {
    try {
      setReportLoading(true);
      setError("");

      const response = await applicationsApi.misReport(params);
      const report = unwrapApiData(response) || {};

      setMetrics({
        ...EMPTY_METRICS,
        ...(report.metrics || {}),
        sanctionsMtd: {
          ...EMPTY_METRICS.sanctionsMtd,
          ...(report.metrics?.sanctionsMtd || {}),
        },
        disbursementsMtd: {
          ...EMPTY_METRICS.disbursementsMtd,
          ...(report.metrics?.disbursementsMtd || {}),
        },
      });

      setStagePipeline(
        Array.isArray(report.stagePipeline) ? report.stagePipeline : [],
      );

      setCases(
        Array.isArray(report.cases)
          ? report.cases.map((item) => ({
              ...item,
              amount: Number(item?.amount) || 0,
              amountDisplay:
                item?.amountDisplay ||
                formatCompactInr(Number(item?.amount) || 0),
            }))
          : [],
      );

      setPagination({
        page: Number(report.pagination?.page) || 1,
        limit: Number(report.pagination?.limit) || 100,
        total: Number(report.pagination?.total) || 0,
        totalPages: Number(report.pagination?.totalPages) || 0,
      });
    } catch (requestError) {
      console.error("Unable to load MIS report:", requestError);
      setCases([]);
      setStagePipeline([]);
      setMetrics(EMPTY_METRICS);
      setPagination({
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
      });
      setError(requestError?.message || "Unable to load MIS report.");
    } finally {
      setReportLoading(false);
    }
  }, []);

  const requestParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      fromDate: appliedFilters.fromDate || undefined,
      toDate: appliedFilters.toDate || undefined,
      hubId: appliedFilters.hubId || undefined,
      spokeId: appliedFilters.spokeId || undefined,
      stage:
        selectedStage === "All Stages" ? undefined : selectedStage,
      search: searchText.trim() || undefined,
    }),
    [appliedFilters, searchText, selectedStage],
  );

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => loadMisReport(requestParams),
      searchText.trim() ? 350 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [loadMisReport, requestParams, searchText]);

  const resetFilters = () => {
    setSelectedHub("");
    setSelectedSpoke("");
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setSearchText("");
    setSelectedStage("All Stages");
    setActiveReport("");
    setAppliedFilters({
      hubId: "",
      spokeId: "",
      fromDate: defaultFromDate,
      toDate: defaultToDate,
    });
  };

  const applyFilters = () => {
    setAppliedFilters({
      hubId: selectedHub,
      spokeId: selectedSpoke,
      fromDate,
      toDate,
    });
  };

  const handleStageChange = (stage) => {
    setSelectedStage(stage);
  };

  const filteredCases = cases;

  const exportCsv = () => {
    const csvContent = convertRowsToCsv(filteredCases);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = `lap-mis-${appliedFilters.fromDate}-to-${appliedFilters.toDate}.csv`;

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
              disabled={filteredCases.length === 0}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 text-sm font-black text-white shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
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
                  setSelectedSpoke("");
                }}
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 text-sm font-semibold text-[#334a70] outline-none"
              >
                <option value="">
                  {mastersLoading ? "Loading hubs..." : "All Hubs"}
                </option>

                {hubs.map((hub) => (
                  <option key={hub.id} value={String(hub.id)}>
                    {hub.name}
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
                <option value="">
                  {mastersLoading ? "Loading spokes..." : "All Spokes"}
                </option>

                {availableSpokes.map((spoke) => (
                  <option key={spoke.id} value={String(spoke.id)}>
                    {spoke.name}
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

        {(error || reportLoading) && (
          <section
            className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }`}
          >
            {error || "Loading MIS report data..."}
          </section>
        )}

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
                  onClick={() => handleStageChange(item.stage)}
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
                onClick={() => handleStageChange("All Stages")}
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
                  onChange={(event) => handleStageChange(event.target.value)}
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
              Showing {filteredCases.length} of {pagination.total} records
            </span>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
                <FaCheckCircle size={11} />
                Report data ready
              </span>

              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredCases.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#263f74] px-4 text-xs font-black text-white transition hover:bg-[#1a315e] disabled:cursor-not-allowed disabled:opacity-50"
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