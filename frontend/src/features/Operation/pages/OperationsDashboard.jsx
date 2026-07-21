import { useMemo, useRef, useState } from "react";
import {
  FaArrowRight,
  FaBuilding,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFilter,
  FaLandmark,
  FaMoneyCheckAlt,
  FaPaperPlane,
  FaPrint,
  FaSearch,
  FaShieldAlt,
  FaTimes,
  FaUniversity,
  FaUserTie,
} from "react-icons/fa";

const metrics = [
  {
    title: "PDD QUEUE",
    value: 7,
    helper: "2 cases due today",
    Icon: FaFileAlt,
    cardClass:
      "border-blue-100 bg-gradient-to-br from-white via-white to-blue-50",
    iconClass: "bg-blue-100 text-blue-600",
    valueClass: "text-blue-600",
    accentClass: "bg-blue-500",
  },
  {
    title: "READY FOR DISBURSEMENT",
    value: 3,
    helper: "₹82.50L ready for release",
    Icon: FaCheck,
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50",
    iconClass: "bg-emerald-100 text-emerald-600",
    valueClass: "text-emerald-600",
    accentClass: "bg-emerald-500",
  },
  {
    title: "DISBURSED TODAY",
    value: "₹1.10 Cr",
    helper: "Across 4 LAP applications",
    Icon: FaMoneyCheckAlt,
    cardClass:
      "border-pink-100 bg-gradient-to-br from-white via-white to-pink-50",
    iconClass: "bg-pink-100 text-pink-600",
    valueClass: "text-pink-600",
    accentClass: "bg-pink-500",
  },
  {
    title: "EXCEPTIONS",
    value: 1,
    helper: "Needs checker review",
    Icon: FaExclamationTriangle,
    cardClass:
      "border-orange-100 bg-gradient-to-br from-white via-white to-orange-50",
    iconClass: "bg-orange-100 text-orange-600",
    valueClass: "text-orange-600",
    accentClass: "bg-orange-500",
  },
];

const workflowSteps = [
  {
    id: 1,
    label: "Lead",
    status: "Completed",
    state: "completed",
  },
  {
    id: 2,
    label: "Field Verification",
    status: "Completed",
    state: "completed",
  },
  {
    id: 3,
    label: "BM Review",
    status: "Completed",
    state: "completed",
  },
  {
    id: 4,
    label: "CM Screening",
    status: "Completed",
    state: "completed",
  },
  {
    id: 5,
    label: "Credit",
    status: "Completed",
    state: "completed",
  },
  {
    id: 6,
    label: "Legal & Valuation",
    status: "Completed",
    state: "completed",
  },
  {
    id: 7,
    label: "Sanction",
    status: "Completed",
    state: "completed",
  },
  {
    id: 8,
    label: "Operations",
    status: "Current",
    state: "current",
  },
  {
    id: 9,
    label: "Disbursement",
    status: "Pending",
    state: "pending",
  },
];

const operationsCases = [
  {
    id: "FTLIP-2026-0002",
    applicant: "Meera Iyer",
    initials: "MI",
    amount: "₹80,00,000",
    branch: "Delhi Hub",
    stage: "PDD Review",
    status: "Pending Documents",
    priority: "High",
    assignedTo: "Neha Sharma",
    aging: "5h 12m",
    completion: 82,
    requestedAmount: "₹80,00,000",
    sanctionedAmount: "₹75,00,000",
    netDisbursal: "₹72,84,500",
    propertyType: "Self-Occupied Residential Flat",
    propertyLocation: "Dwarka, New Delhi",
    bankName: "HDFC Bank",
    accountNumber: "XXXX XXXX 4821",
    bankStatus: "Verified",
    pddStatus: "8 of 10 completed",
    utrStatus: "Pending",
    makerStatus: "Completed",
    checkerStatus: "Pending",
  },
  {
    id: "FTLIP-2026-0014",
    applicant: "Arjun Malhotra",
    initials: "AM",
    amount: "₹42,00,000",
    branch: "Gurugram Hub",
    stage: "Bank Verification",
    status: "Ready",
    priority: "Normal",
    assignedTo: "Ojas Batra",
    aging: "2h 05m",
    completion: 100,
    requestedAmount: "₹42,00,000",
    sanctionedAmount: "₹40,00,000",
    netDisbursal: "₹38,92,000",
    propertyType: "Residential Apartment",
    propertyLocation: "Sector 56, Gurugram",
    bankName: "ICICI Bank",
    accountNumber: "XXXX XXXX 1754",
    bankStatus: "Verified",
    pddStatus: "Completed",
    utrStatus: "Ready to Generate",
    makerStatus: "Completed",
    checkerStatus: "Approved",
  },
  {
    id: "FTLIP-2026-0021",
    applicant: "Naina Shah",
    initials: "NS",
    amount: "₹65,00,000",
    branch: "Noida Hub",
    stage: "Checker Review",
    status: "Exception",
    priority: "Critical",
    assignedTo: "Rohan Kumar",
    aging: "3h 20m",
    completion: 91,
    requestedAmount: "₹65,00,000",
    sanctionedAmount: "₹60,00,000",
    netDisbursal: "₹58,47,500",
    propertyType: "Commercial Office",
    propertyLocation: "Sector 62, Noida",
    bankName: "Axis Bank",
    accountNumber: "XXXX XXXX 6347",
    bankStatus: "Verified",
    pddStatus: "Original title deed pending",
    utrStatus: "Blocked",
    makerStatus: "Completed",
    checkerStatus: "Exception Raised",
  },
  {
    id: "FTLIP-2026-0018",
    applicant: "Kabir Mehta",
    initials: "KM",
    amount: "₹28,75,000",
    branch: "Faridabad Hub",
    stage: "PDD Review",
    status: "In Progress",
    priority: "Normal",
    assignedTo: "Neha Sharma",
    aging: "1h 48m",
    completion: 68,
    requestedAmount: "₹28,75,000",
    sanctionedAmount: "₹27,00,000",
    netDisbursal: "₹26,28,000",
    propertyType: "Independent House",
    propertyLocation: "Sector 15, Faridabad",
    bankName: "State Bank of India",
    accountNumber: "XXXX XXXX 9012",
    bankStatus: "Pending",
    pddStatus: "6 of 10 completed",
    utrStatus: "Pending",
    makerStatus: "In Progress",
    checkerStatus: "Not Started",
  },
  {
    id: "FTLIP-2026-0009",
    applicant: "Priya Kapoor",
    initials: "PK",
    amount: "₹31,20,000",
    branch: "Ghaziabad Hub",
    stage: "Disbursement",
    status: "Ready",
    priority: "High",
    assignedTo: "Ojas Batra",
    aging: "48m",
    completion: 100,
    requestedAmount: "₹31,20,000",
    sanctionedAmount: "₹30,00,000",
    netDisbursal: "₹29,16,000",
    propertyType: "Builder Floor",
    propertyLocation: "Indirapuram, Ghaziabad",
    bankName: "Kotak Mahindra Bank",
    accountNumber: "XXXX XXXX 3284",
    bankStatus: "Verified",
    pddStatus: "Completed",
    utrStatus: "Ready to Generate",
    makerStatus: "Completed",
    checkerStatus: "Approved",
  },
];

const readinessItems = [
  {
    id: 1,
    label: "Sanction terms accepted",
    completed: true,
  },
  {
    id: 2,
    label: "Loan agreement executed",
    completed: true,
  },
  {
    id: 3,
    label: "Property documents verified",
    completed: true,
  },
  {
    id: 4,
    label: "NACH mandate registered",
    completed: true,
  },
  {
    id: 5,
    label: "Final bank verification",
    completed: false,
  },
  {
    id: 6,
    label: "Disbursement UTR generated",
    completed: false,
  },
];

const priorityClasses = {
  Critical:
    "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200",
  High: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200",
  Normal:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const statusClasses = {
  Ready:
    "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200",
  "Pending Documents":
    "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200",
  Exception:
    "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200",
  "In Progress":
    "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200",
};

const progressClasses = {
  68: "w-[68%]",
  82: "w-[82%]",
  91: "w-[91%]",
  100: "w-full",
};

function getPriorityClass(priority) {
  return priorityClasses[priority] || priorityClasses.Normal;
}

function getStatusClass(status) {
  return (
    statusClasses[status] ||
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
  );
}

function getProgressClass(completion) {
  return progressClasses[completion] || "w-0";
}

function DetailRow({
  label,
  value,
  valueClass = "text-slate-700",
  children,
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold text-slate-400">
        {label}
      </span>

      {children || (
        <strong
          className={`max-w-[210px] text-right text-xs font-extrabold leading-5 ${valueClass}`}
        >
          {value}
        </strong>
      )}
    </div>
  );
}

export default function OperationsDashboard() {
  const workflowRef = useRef(null);

  const [selectedCaseId, setSelectedCaseId] = useState(
    operationsCases[0].id,
  );
  const [searchText, setSearchText] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  const selectedCase =
    operationsCases.find(
      (item) => item.id === selectedCaseId,
    ) || operationsCases[0];

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return operationsCases.filter((item) => {
      const searchableValues = [
        item.id,
        item.applicant,
        item.branch,
        item.stage,
        item.status,
        item.assignedTo,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesStage =
        stageFilter === "All" ||
        item.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [searchText, stageFilter]);

  const completedReadinessItems =
    readinessItems.filter(
      (item) => item.completed,
    ).length;

  const readinessPercentage = Math.round(
    (completedReadinessItems /
      readinessItems.length) *
      100,
  );

  const scrollWorkflow = (direction) => {
    workflowRef.current?.scrollBy({
      left: direction === "left" ? -350 : 350,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Operations Welcome Banner */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-r from-[#244ec7] via-[#3764d4] to-[#26a8c7] px-6 py-8 text-white shadow-[0_24px_60px_rgba(37,91,190,0.24)] sm:px-8 sm:py-10 xl:flex xl:min-h-[235px] xl:items-center xl:justify-between xl:gap-10">
          <div className="absolute -left-20 -top-24 -z-10 h-72 w-72 rounded-full bg-white/10" />

          <div className="absolute left-[23%] top-0 -z-10 h-full w-64 skew-x-[-15deg] bg-cyan-400/20" />

          <div className="absolute -bottom-40 -right-16 -z-10 h-96 w-96 rounded-full border-[70px] border-white/5" />

          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 text-sm">
                ✦
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-50">
                Operations Workspace
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-[44px]">
              Operations / Disbursement Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50/85 sm:text-base">
              Welcome Ojas Batra. Review PDD
              documents, verify bank details, manage
              maker-checker controls and process LAP
              disbursements for Delhi Hub.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold text-white/90">
                <FaBuilding size={13} />
                Delhi Hub
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold text-white/90">
                <FaUserTie size={13} />
                Ojas Batra
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold text-white/90">
                <FaClock size={13} />
                Last refreshed just now
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 xl:mt-0 xl:shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 xl:flex-none"
            >
              <FaPrint size={14} />
              Print
            </button>

            <button
              type="button"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-blue-700 shadow-xl shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-blue-50 xl:flex-none"
            >
              View Journey
              <FaArrowRight size={13} />
            </button>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const MetricIcon = metric.Icon;

            return (
              <article
                key={metric.title}
                className={`relative min-h-[165px] overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${metric.cardClass}`}
              >
                <span
                  className={`absolute right-0 top-0 h-1 w-24 rounded-bl-full ${metric.accentClass}`}
                />

                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl ${metric.iconClass}`}
                  >
                    <MetricIcon size={19} />
                  </span>

                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
                    Live
                  </span>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  {metric.title}
                </p>

                <strong
                  className={`mt-1 block text-3xl font-black tracking-tight ${metric.valueClass}`}
                >
                  {metric.value}
                </strong>

                <p className="mt-2 text-xs font-medium text-slate-500">
                  {metric.helper}
                </p>
              </article>
            );
          })}
        </section>

        {/* Workflow */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:items-center sm:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Selected application journey
              </p>

              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17345d] sm:text-xl">
                LAP Application Workflow
              </h2>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <FaClock size={12} />
                Current stage
              </span>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
                Operations
              </span>
            </div>
          </div>

          <div
            ref={workflowRef}
            className="overflow-x-auto scroll-smooth px-5 py-7 sm:px-6"
          >
            <div className="flex min-w-[1180px]">
              {workflowSteps.map((step, index) => {
                const completed =
                  step.state === "completed";
                const current =
                  step.state === "current";
                const isLast =
                  index === workflowSteps.length - 1;

                return (
                  <div
                    key={step.id}
                    className="flex flex-1 items-start"
                  >
                    <div className="w-[112px] shrink-0 text-center">
                      <div
                        className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-[7px] text-sm font-black shadow-sm ${
                          completed
                            ? "border-emerald-100 bg-emerald-500 text-white"
                            : current
                              ? "border-blue-100 bg-blue-600 text-white ring-4 ring-blue-100"
                              : "border-slate-50 bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <FaCheck size={14} />
                        ) : (
                          step.id
                        )}
                      </div>

                      <strong
                        className={`mt-3 block whitespace-nowrap text-xs font-extrabold ${
                          current
                            ? "text-blue-600"
                            : completed
                              ? "text-slate-700"
                              : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </strong>

                      <span
                        className={`mt-1 block text-[10px] font-medium ${
                          completed
                            ? "text-emerald-600"
                            : current
                              ? "text-blue-500"
                              : "text-slate-400"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {!isLast && (
                      <div
                        className={`mt-6 h-[3px] flex-1 rounded-full ${
                          completed
                            ? "bg-emerald-400"
                            : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              aria-label="Scroll workflow left"
              onClick={() =>
                scrollWorkflow("left")
              }
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <FaChevronLeft size={12} />
            </button>

            <span className="text-[10px] font-medium text-slate-400">
              Use the buttons to view all application
              stages
            </span>

            <button
              type="button"
              aria-label="Scroll workflow right"
              onClick={() =>
                scrollWorkflow("right")
              }
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </section>

        {/* Operations Queue and Selected Case */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(350px,1fr)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Operations work queue
                </p>

                <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17345d]">
                  Cases Requiring Action
                </h2>
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
              >
                View All Cases
                <FaArrowRight size={11} />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:px-6">
              <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <FaSearch size={13} />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(event.target.value)
                  }
                  placeholder="Search application, applicant, branch or owner"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 sm:w-52">
                <FaFilter size={12} />

                <select
                  value={stageFilter}
                  onChange={(event) =>
                    setStageFilter(event.target.value)
                  }
                  className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="All">
                    All stages
                  </option>
                  <option value="PDD Review">
                    PDD Review
                  </option>
                  <option value="Bank Verification">
                    Bank Verification
                  </option>
                  <option value="Checker Review">
                    Checker Review
                  </option>
                  <option value="Disbursement">
                    Disbursement
                  </option>
                </select>
              </label>
            </div>

            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Application
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Loan
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Current Stage
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Progress
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Assigned To
                    </th>

                    <th className="px-5 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {filteredCases.map((item) => {
                    const isSelected =
                      item.id === selectedCaseId;

                    return (
                      <tr
                        key={item.id}
                        onClick={() =>
                          setSelectedCaseId(item.id)
                        }
                        className={`cursor-pointer border-t border-slate-100 transition ${
                          isSelected
                            ? "bg-blue-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[235px] items-center gap-3">
                            <span
                              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-black ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {item.initials}
                            </span>

                            <div className="min-w-0">
                              <strong className="block truncate text-sm font-extrabold text-slate-800">
                                {item.applicant}
                              </strong>

                              <span className="mt-1 block text-[10px] font-medium text-slate-500">
                                {item.id}
                              </span>

                              <span
                                className={`mt-2 inline-flex rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${getPriorityClass(
                                  item.priority,
                                )}`}
                              >
                                {item.priority}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <strong className="block text-sm font-extrabold text-slate-700">
                            {item.amount}
                          </strong>

                          <span className="mt-1 block text-[10px] text-slate-400">
                            {item.branch}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
                            {item.stage}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black ${getStatusClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="w-32">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <span
                                className={`block h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 ${getProgressClass(
                                  item.completion,
                                )}`}
                              />
                            </div>

                            <span className="mt-2 block text-[10px] font-medium text-slate-400">
                              {item.completion}% complete
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <strong className="block text-xs font-bold text-slate-600">
                            {item.assignedTo}
                          </strong>

                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <FaClock size={9} />
                            {item.aging}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            aria-label={`View ${item.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCaseId(item.id);
                            }}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FaEye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCases.length === 0 && (
                <div className="grid min-h-56 place-content-center gap-2 px-5 text-center">
                  <FaSearch
                    className="mx-auto text-slate-300"
                    size={25}
                  />

                  <strong className="text-sm font-bold text-slate-700">
                    No operations cases found
                  </strong>

                  <span className="text-xs text-slate-400">
                    Change the search term or stage
                    filter.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Case Summary */}
          <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#173c8f] to-[#269dc2] px-6 py-6 text-white">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />

              <p className="relative text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
                Selected operations case
              </p>

              <div className="relative mt-4 flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-sm font-black backdrop-blur">
                  {selectedCase.initials}
                </span>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-extrabold">
                    {selectedCase.applicant}
                  </h3>

                  <p className="mt-1 text-xs font-medium text-blue-100/80">
                    {selectedCase.id}
                  </p>
                </div>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold backdrop-blur">
                  {selectedCase.stage}
                </span>

                <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold backdrop-blur">
                  {selectedCase.priority} Priority
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <DetailRow
                  label="Requested Amount"
                  value={selectedCase.requestedAmount}
                />

                <DetailRow
                  label="Sanctioned Amount"
                  value={selectedCase.sanctionedAmount}
                />

                <DetailRow
                  label="Net Disbursal"
                  value={selectedCase.netDisbursal}
                  valueClass="text-emerald-600"
                />

                <DetailRow
                  label="Property"
                  value={selectedCase.propertyType}
                />

                <DetailRow
                  label="Location"
                  value={selectedCase.propertyLocation}
                />

                <DetailRow label="Bank">
                  <div className="flex max-w-[210px] items-start gap-2 text-right">
                    <FaUniversity
                      className="mt-0.5 shrink-0 text-slate-400"
                      size={12}
                    />

                    <div>
                      <strong className="block text-xs font-extrabold text-slate-700">
                        {selectedCase.bankName}
                      </strong>

                      <span className="mt-1 block text-[10px] font-medium text-slate-400">
                        {selectedCase.accountNumber}
                      </span>
                    </div>
                  </div>
                </DetailRow>

                <DetailRow label="Bank Status">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black ${
                      selectedCase.bankStatus ===
                      "Verified"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {selectedCase.bankStatus}
                  </span>
                </DetailRow>

                <DetailRow
                  label="PDD Status"
                  value={selectedCase.pddStatus}
                />

                <DetailRow
                  label="UTR Status"
                  value={selectedCase.utrStatus}
                />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Operations Completion
                  </span>

                  <strong className="text-xs font-black text-blue-600">
                    {selectedCase.completion}%
                  </strong>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className={`block h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 ${getProgressClass(
                      selectedCase.completion,
                    )}`}
                  />
                </div>
              </div>

              <button
                type="button"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Open Operations Case
                <FaArrowRight size={12} />
              </button>
            </div>
          </aside>
        </section>

        {/* Readiness and Maker Checker */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Selected case
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-[#17345d]">
                  Disbursement Readiness
                </h2>
              </div>

              <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-blue-100 bg-blue-50 text-xs font-black text-blue-600">
                {readinessPercentage}%
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full w-2/3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
            </div>

            <div className="mt-5">
              {readinessItems.map((item) => (
                <div
                  key={item.id}
                  className="grid min-h-12 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 last:border-b-0"
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full border ${
                      item.completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-slate-50 text-slate-300"
                    }`}
                  >
                    {item.completed ? (
                      <FaCheck size={9} />
                    ) : (
                      <FaTimes size={8} />
                    )}
                  </span>

                  <strong className="text-xs font-bold text-slate-600">
                    {item.label}
                  </strong>

                  <span
                    className={`text-[10px] font-bold ${
                      item.completed
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {item.completed
                      ? "Complete"
                      : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Processing summary
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-[#17345d]">
                Maker-Checker Status
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
                  <FaPaperPlane size={16} />
                </span>

                <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ops Maker
                </p>

                <strong className="mt-1 block text-lg font-black text-slate-800">
                  {selectedCase.makerStatus}
                </strong>

                <p className="mt-2 text-xs text-slate-500">
                  Assigned to{" "}
                  {selectedCase.assignedTo}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <FaShieldAlt size={16} />
                </span>

                <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ops Checker
                </p>

                <strong className="mt-1 block text-lg font-black text-amber-600">
                  {selectedCase.checkerStatus}
                </strong>

                <p className="mt-2 text-xs text-slate-500">
                  Final control and approval
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
                  <FaExclamationTriangle
                    size={14}
                  />
                </span>

                <div>
                  <strong className="text-xs font-extrabold text-slate-700">
                    Pending operational action
                  </strong>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Complete final bank validation
                    and pending PDD checks before
                    sending the case to the Ops
                    Checker.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173c8f] px-5 text-sm font-black text-white transition hover:bg-[#102e70]"
            >
              Continue Verification
              <FaArrowRight size={12} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}